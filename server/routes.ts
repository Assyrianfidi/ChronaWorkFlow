import type { Express } from "express";
import { storage } from "./storage";
import { db } from "./db";
import * as sharedSchema from "../shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { and, eq, inArray, sql } from "drizzle-orm";

import {
  getJobQueues,
  getQueueJobs,
  pauseQueue,
  resumeQueue,
  cleanQueue,
  removeJob,
  scheduleRecurringInvoice,
  schedulePayrollProcessing,
  scheduleReportGeneration,
  scheduleBackup,
  scheduleNotification,
} from "./routes/jobs";

import { handleStripeWebhook, createCheckoutSession, createPaymentIntent, getPaymentIntent, createStripeInvoice, sendInvoice, refundPayment, getBalance, stripeHealthCheck } from "./routes/stripe";
import { healthCheck } from "./routes/health";

import { handlePlaidWebhook,
  createLinkToken,
  exchangePublicToken,
  getAccounts,
  getAccountBalances,
  syncTransactions,
  getTransactions,
  getInstitutions,
  plaidHealthCheck,
} from "./routes/plaid";

import { requireCompanyId } from "./runtime/request-context";

import { enforceBillingStatus, enforcePlanLimits, enforcePlanLimitsMiddleware, getBillingEnforcementMode, getCompanyIdFromRequest } from "./middleware/billing-enforcement";
import { getCurrentPlan, enforcePlanLimits as enforcePlanLimitsNew, requireFeature } from "./middleware/plan-enforcement";

import { startWorkflowInstance } from "./services/workflow.service";
import { getActorFromRequest, isAccountingError, postJournalEntry, voidByReversal } from "./services/accounting.service";
import { isPeriodLocked, lockAccountingPeriod, unlockAccountingPeriod, getAccountingPeriods } from "./services/accounting-periods.service";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;
const OWNER_EMAIL = process.env.OWNER_EMAIL?.toLowerCase();

// Validate JWT_SECRET is set
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET or SESSION_SECRET must be set in environment variables');
}

function getPermissionsForRole(role: string): string[] {
  const normalized = role.trim().toUpperCase();
  switch (normalized) {
    case "OWNER":
      return [
        "read:*",
        "write:*",
        "owner:access",
        "owner:impersonate",
        "owner:feature-flags",
        "owner:billing",
        "owner:security",
        "owner:audit",
      ];
    case "ADMIN":
      return [
        "read:dashboard",
        "write:dashboard",
        "read:invoices",
        "write:invoices",
        "read:users",
        "write:users",
        "read:reports",
        "write:reports",
        "read:billing",
        "write:billing",
        "read:settings",
        "write:settings",
      ];
    case "MANAGER":
      return [
        "read:dashboard",
        "write:dashboard",
        "read:invoices",
        "write:invoices",
        "read:reports",
        "write:reports",
        "read:team",
        "write:team",
        "read:settings",
        "write:settings",
      ];
    case "ACCOUNTANT":
      return [
        "read:dashboard",
        "write:dashboard",
        "read:invoices",
        "write:invoices",
        "read:reports",
        "write:reports",
        "read:transactions",
        "write:transactions",
      ];
    case "AUDITOR":
      return [
        "read:dashboard",
        "read:invoices",
        "read:reports",
        "read:audit",
        "read:compliance",
        "read:settings",
      ];
    case "INVENTORY_MANAGER":
      return [
        "read:dashboard",
        "write:dashboard",
        "read:inventory",
        "write:inventory",
        "read:reports",
        "write:reports",
        "read:settings",
        "write:settings",
      ];
    default:
      return [];
  }
}

function isOwnerEmail(email?: string | null) {
  if (!OWNER_EMAIL) return false;
  if (!email) return false;
  return email.toLowerCase() === OWNER_EMAIL;
}

function requireOwner(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const role = typeof req.user.role === "string" ? req.user.role : "";
  const email = typeof req.user.email === "string" ? req.user.email : undefined;

  if (role === "owner" || isOwnerEmail(email)) {
    return next();
  }

  return res.status(403).json({ error: "Owner access required" });
}

// Middleware to verify JWT token
function authenticateToken(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  return next();
}

function registerOwnerAiAuditRoutes(app: Express) {
  app.get("/api/owner/ai/pricing", authenticateToken, requireOwner, async (_req, res) => {
    try {
      const [row] = await db
        .select()
        .from(sharedSchema.aiPricingConfig)
        .where(eq(sharedSchema.aiPricingConfig.id, "default"));

      if (!row) {
        const [created] = await db
          .insert(sharedSchema.aiPricingConfig)
          .values({ id: "default", pricePer1kTokensCents: 40, updatedAt: new Date() })
          .returning();
        return res.json(created);
      }

      res.json(row);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/owner/ai/pricing", authenticateToken, requireOwner, async (req, res) => {
    try {
      const nextPrice = typeof (req.body?.pricePer1kTokensCents) === "number" ? req.body.pricePer1kTokensCents : undefined;
      if (typeof nextPrice !== "number" || !Number.isFinite(nextPrice) || nextPrice < 0) {
        return res.status(400).json({ error: "pricePer1kTokensCents must be a non-negative number" });
      }

      const [existing] = await db
        .select()
        .from(sharedSchema.aiPricingConfig)
        .where(eq(sharedSchema.aiPricingConfig.id, "default"));

      const [updated] = existing
        ? await db
            .update(sharedSchema.aiPricingConfig)
            .set({ pricePer1kTokensCents: nextPrice, updatedAt: new Date() })
            .where(eq(sharedSchema.aiPricingConfig.id, "default"))
            .returning()
        : await db
            .insert(sharedSchema.aiPricingConfig)
            .values({ id: "default", pricePer1kTokensCents: nextPrice, updatedAt: new Date() })
            .returning();

      await storage.createAuditLog({
        companyId: null,
        userId: req.user?.id ?? null,
        action: "ai.pricing.update",
        entityType: "ai_pricing_config",
        entityId: "default",
        changes: JSON.stringify({ before: existing ?? null, after: updated }),
      });

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/owner/ai/company/:companyId", authenticateToken, requireOwner, async (req, res) => {
    try {
      const companyId = req.params.companyId;
      const [row] = await db
        .select()
        .from(sharedSchema.companyAiSettings)
        .where(eq(sharedSchema.companyAiSettings.companyId, companyId));
      res.json(row ?? null);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/owner/ai/company/:companyId", authenticateToken, requireOwner, async (req, res) => {
    try {
      const companyId = req.params.companyId;
      const body = sharedSchema.insertCompanyAiSettingsSchema.partial().parse(req.body);

      const [existing] = await db
        .select()
        .from(sharedSchema.companyAiSettings)
        .where(eq(sharedSchema.companyAiSettings.companyId, companyId));

      const now = new Date();
      const [updated] = existing
        ? await db
            .update(sharedSchema.companyAiSettings)
            .set({ ...body, updatedAt: now })
            .where(eq(sharedSchema.companyAiSettings.id, existing.id))
            .returning()
        : await db
            .insert(sharedSchema.companyAiSettings)
            .values({
              companyId,
              aiEnabled: body.aiEnabled ?? true,
              bonusTokens: body.bonusTokens ?? 0,
              pricePer1kTokensCentsOverride: body.pricePer1kTokensCentsOverride ?? null,
              updatedAt: now,
            } as any)
            .returning();

      await storage.createAuditLog({
        companyId,
        userId: req.user?.id ?? null,
        action: "ai.company_settings.update",
        entityType: "company_ai_settings",
        entityId: updated.id,
        changes: JSON.stringify({ before: existing ?? null, after: updated }),
      });

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/owner/audit-logs", authenticateToken, requireOwner, async (req, res) => {
    try {
      const from = typeof req.query.from === "string" ? new Date(req.query.from) : null;
      const to = typeof req.query.to === "string" ? new Date(req.query.to) : null;
      const companyId = typeof req.query.companyId === "string" ? req.query.companyId : null;
      const entityType = typeof req.query.entityType === "string" ? req.query.entityType : null;
      const actorUserId = typeof req.query.actorUserId === "string" ? req.query.actorUserId : null;

      const whereParts: any[] = [];
      if (companyId) whereParts.push(eq(sharedSchema.auditLogs.companyId, companyId));
      if (entityType) whereParts.push(eq(sharedSchema.auditLogs.entityType, entityType));
      if (actorUserId) whereParts.push(eq(sharedSchema.auditLogs.userId, actorUserId));
      if (from) whereParts.push(sql`${sharedSchema.auditLogs.createdAt} >= ${from}`);
      if (to) whereParts.push(sql`${sharedSchema.auditLogs.createdAt} <= ${to}`);

      const rows = await db
        .select({
          audit: sharedSchema.auditLogs,
          company: sharedSchema.companies,
          user: sharedSchema.users,
        })
        .from(sharedSchema.auditLogs)
        .leftJoin(sharedSchema.companies, eq(sharedSchema.auditLogs.companyId, sharedSchema.companies.id))
        .leftJoin(sharedSchema.users, eq(sharedSchema.auditLogs.userId, sharedSchema.users.id))
        .where(whereParts.length ? and(...whereParts) : undefined)
        .orderBy(sql`${sharedSchema.auditLogs.createdAt} desc`)
        .limit(500);

      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  function csvEscape(value: any) {
    const s = value === null || value === undefined ? "" : String(value);
    if (s.includes(",") || s.includes("\n") || s.includes("\"") || s.includes("\r")) {
      return `"${s.replace(/\"/g, '""')}"`;
    }
    return s;
  }

  async function streamCsv(res: any, filename: string, header: string[], rows: any[][]) {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
    res.write(`${header.map(csvEscape).join(",")}\n`);
    for (const row of rows) {
      res.write(`${row.map(csvEscape).join(",")}\n`);
    }
    res.end();
  }

  app.get("/api/owner/reports/subscriptions.csv", authenticateToken, requireOwner, async (_req, res) => {
    try {
      const rows = await db
        .select({
          companyId: sharedSchema.companies.id,
          companyName: sharedSchema.companies.name,
          subscriptionId: sharedSchema.subscriptions.id,
          status: sharedSchema.subscriptions.status,
          planCode: sharedSchema.plans.code,
          interval: sharedSchema.plans.billingInterval,
          priceCents: sharedSchema.plans.priceCents,
          stripeCustomerId: sharedSchema.companies.stripeCustomerId,
          stripeSubscriptionId: sharedSchema.subscriptions.stripeSubscriptionId,
          currentPeriodEnd: sharedSchema.subscriptions.currentPeriodEnd,
          pastDueSince: sharedSchema.subscriptions.pastDueSince,
        })
        .from(sharedSchema.subscriptions)
        .innerJoin(sharedSchema.companies, eq(sharedSchema.subscriptions.companyId, sharedSchema.companies.id))
        .innerJoin(sharedSchema.plans, eq(sharedSchema.subscriptions.planId, sharedSchema.plans.id))
        .where(sql`${sharedSchema.subscriptions.deletedAt} is null`)
        .orderBy(sql`${sharedSchema.subscriptions.createdAt} desc`)
        .limit(5000);

      await streamCsv(
        res,
        "subscriptions.csv",
        [
          "companyId",
          "companyName",
          "subscriptionId",
          "status",
          "planCode",
          "billingInterval",
          "priceCents",
          "stripeCustomerId",
          "stripeSubscriptionId",
          "currentPeriodEnd",
          "pastDueSince",
        ],
        rows.map((r) => [
          r.companyId,
          r.companyName,
          r.subscriptionId,
          r.status,
          r.planCode,
          r.interval,
          r.priceCents,
          r.stripeCustomerId,
          r.stripeSubscriptionId,
          r.currentPeriodEnd?.toISOString?.() ?? r.currentPeriodEnd,
          r.pastDueSince?.toISOString?.() ?? r.pastDueSince,
        ]),
      );
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/owner/reports/payments.csv", authenticateToken, requireOwner, async (_req, res) => {
    try {
      const rows = await db
        .select({
          companyId: sharedSchema.companies.id,
          companyName: sharedSchema.companies.name,
          billingPaymentId: sharedSchema.billingPayments.id,
          status: sharedSchema.billingPayments.status,
          amountCents: sharedSchema.billingPayments.amountCents,
          currency: sharedSchema.billingPayments.currency,
          stripePaymentIntentId: sharedSchema.billingPayments.stripePaymentIntentId,
          createdAt: sharedSchema.billingPayments.createdAt,
        })
        .from(sharedSchema.billingPayments)
        .innerJoin(sharedSchema.companies, eq(sharedSchema.billingPayments.companyId, sharedSchema.companies.id))
        .where(sql`${sharedSchema.billingPayments.deletedAt} is null`)
        .orderBy(sql`${sharedSchema.billingPayments.createdAt} desc`)
        .limit(10000);

      await streamCsv(
        res,
        "payments.csv",
        [
          "companyId",
          "companyName",
          "billingPaymentId",
          "status",
          "amountCents",
          "currency",
          "stripePaymentIntentId",
          "createdAt",
        ],
        rows.map((r) => [
          r.companyId,
          r.companyName,
          r.billingPaymentId,
          r.status,
          r.amountCents,
          r.currency,
          r.stripePaymentIntentId,
          r.createdAt?.toISOString?.() ?? r.createdAt,
        ]),
      );
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/owner/reports/ai-usage.csv", authenticateToken, requireOwner, async (_req, res) => {
    try {
      const rows = await db
        .select({
          companyId: sharedSchema.aiUsageLogs.companyId,
          userId: sharedSchema.aiUsageLogs.userId,
          feature: sharedSchema.aiUsageLogs.feature,
          model: sharedSchema.aiUsageLogs.model,
          promptTokens: sharedSchema.aiUsageLogs.promptTokens,
          completionTokens: sharedSchema.aiUsageLogs.completionTokens,
          totalTokens: sharedSchema.aiUsageLogs.totalTokens,
          providerCostCents: sharedSchema.aiUsageLogs.providerCostCents,
          billedCents: sharedSchema.aiUsageLogs.billedCents,
          requestId: sharedSchema.aiUsageLogs.requestId,
          createdAt: sharedSchema.aiUsageLogs.createdAt,
        })
        .from(sharedSchema.aiUsageLogs)
        .orderBy(sql`${sharedSchema.aiUsageLogs.createdAt} desc`)
        .limit(20000);

      await streamCsv(
        res,
        "ai-usage.csv",
        [
          "companyId",
          "userId",
          "feature",
          "model",
          "promptTokens",
          "completionTokens",
          "totalTokens",
          "providerCostCents",
          "billedCents",
          "requestId",
          "createdAt",
        ],
        rows.map((r) => [
          r.companyId,
          r.userId,
          r.feature,
          r.model,
          r.promptTokens,
          r.completionTokens,
          r.totalTokens,
          r.providerCostCents,
          r.billedCents,
          r.requestId,
          r.createdAt?.toISOString?.() ?? r.createdAt,
        ]),
      );
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/owner/reports/revenue.csv", authenticateToken, requireOwner, async (_req, res) => {
    try {
      const rows = await db
        .select({
          companyId: sharedSchema.billingInvoices.companyId,
          billingInvoiceId: sharedSchema.billingInvoices.id,
          status: sharedSchema.billingInvoices.status,
          currency: sharedSchema.billingInvoices.currency,
          amountDueCents: sharedSchema.billingInvoices.amountDueCents,
          amountPaidCents: sharedSchema.billingInvoices.amountPaidCents,
          stripeInvoiceId: sharedSchema.billingInvoices.stripeInvoiceId,
          invoicePeriodStart: sharedSchema.billingInvoices.invoicePeriodStart,
          invoicePeriodEnd: sharedSchema.billingInvoices.invoicePeriodEnd,
          createdAt: sharedSchema.billingInvoices.createdAt,
        })
        .from(sharedSchema.billingInvoices)
        .where(sql`${sharedSchema.billingInvoices.deletedAt} is null`)
        .orderBy(sql`${sharedSchema.billingInvoices.createdAt} desc`)
        .limit(20000);

      await streamCsv(
        res,
        "revenue.csv",
        [
          "companyId",
          "billingInvoiceId",
          "status",
          "currency",
          "amountDueCents",
          "amountPaidCents",
          "stripeInvoiceId",
          "invoicePeriodStart",
          "invoicePeriodEnd",
          "createdAt",
        ],
        rows.map((r) => [
          r.companyId,
          r.billingInvoiceId,
          r.status,
          r.currency,
          r.amountDueCents,
          r.amountPaidCents,
          r.stripeInvoiceId,
          r.invoicePeriodStart?.toISOString?.() ?? r.invoicePeriodStart,
          r.invoicePeriodEnd?.toISOString?.() ?? r.invoicePeriodEnd,
          r.createdAt?.toISOString?.() ?? r.createdAt,
        ]),
      );
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  function estimateTokens(input: string): number {
    const normalized = (input ?? "").trim();
    if (!normalized) return 0;
    const words = normalized.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words * 1.3));
  }

  app.post(
    "/api/ai/assistant",
    authenticateToken,
    enforceBillingStatus(),
    async (req: any, res) => {
      try {
        const companyId = req.user?.currentCompanyId as string | undefined;
        if (!companyId) {
          return res.status(400).json({ error: "currentCompanyId is required" });
        }

        const requestId = typeof req.body?.requestId === "string" ? req.body.requestId : null;
        if (!requestId) {
          return res.status(400).json({ error: "requestId is required" });
        }

        const feature = typeof req.body?.feature === "string" ? req.body.feature : "assistant";
        const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "";
        const model = typeof req.body?.model === "string" ? req.body.model : "internal";

        const [existing] = await db
          .select()
          .from(sharedSchema.aiUsageLogs)
          .where(eq(sharedSchema.aiUsageLogs.requestId, requestId));
        if (existing) {
          return res.json({
            requestId,
            response: { message: "Request already processed" },
            usage: {
              promptTokens: existing.promptTokens,
              completionTokens: existing.completionTokens,
              totalTokens: existing.totalTokens,
              billedCents: existing.billedCents,
              providerCostCents: existing.providerCostCents,
            },
          });
        }

        const promptTokens = estimateTokens(prompt);
        const completionTokens = estimateTokens("ok");
        const totalTokens = promptTokens + completionTokens;

        const planLimitCheck = await enforcePlanLimits(companyId, "ai_request", { aiTokens: totalTokens });
        if (!(planLimitCheck as any).allowed) {
          return res.status(402).json({
            error: "Plan limit exceeded",
            code: (planLimitCheck as any).reason,
            details: (planLimitCheck as any).details,
            warnings: (planLimitCheck as any).warnings ?? [],
          });
        }

        const [subRow] = await db
          .select({ subscription: sharedSchema.subscriptions, plan: sharedSchema.plans })
          .from(sharedSchema.subscriptions)
          .innerJoin(sharedSchema.plans, eq(sharedSchema.subscriptions.planId, sharedSchema.plans.id))
          .where(
            and(
              eq(sharedSchema.subscriptions.companyId, companyId),
              sql`${sharedSchema.subscriptions.deletedAt} is null`,
              sql`${sharedSchema.plans.deletedAt} is null`,
            ),
          )
          .orderBy(sql`${sharedSchema.subscriptions.createdAt} desc`)
          .limit(1);

        const plan = subRow?.plan;
        const included = plan?.includedAiTokens ?? 0;

        const [companySettings] = await db
          .select()
          .from(sharedSchema.companyAiSettings)
          .where(eq(sharedSchema.companyAiSettings.companyId, companyId));

        if (companySettings && companySettings.aiEnabled === false) {
          return res.status(403).json({ error: "AI is disabled for this company" });
        }

        const bonusTokens = companySettings?.bonusTokens ?? 0;

        const [pricing] = await db
          .select()
          .from(sharedSchema.aiPricingConfig)
          .where(eq(sharedSchema.aiPricingConfig.id, "default"));
        const basePrice = pricing?.pricePer1kTokensCents ?? 40;
        const pricePer1k = companySettings?.pricePer1kTokensCentsOverride ?? basePrice;

        const now = new Date();
        const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const [{ usedTokensRaw }] = await db
          .select({ usedTokensRaw: sql<string>`coalesce(sum(${sharedSchema.aiUsageLogs.totalTokens}), 0)` })
          .from(sharedSchema.aiUsageLogs)
          .where(and(eq(sharedSchema.aiUsageLogs.companyId, companyId), sql`${sharedSchema.aiUsageLogs.createdAt} >= ${periodStart}`));
        const usedTokens = Number.parseInt(usedTokensRaw ?? "0", 10);

        const includedTotal = included + bonusTokens;
        const overageBefore = Math.max(0, usedTokens - includedTotal);
        const overageAfter = Math.max(0, usedTokens + totalTokens - includedTotal);
        const overageDelta = Math.max(0, overageAfter - overageBefore);
        const billedCents = Math.ceil((overageDelta * pricePer1k) / 1000);

        const [created] = await db
          .insert(sharedSchema.aiUsageLogs)
          .values({
            companyId,
            userId: req.user?.id ?? null,
            feature,
            model,
            promptTokens,
            completionTokens,
            totalTokens,
            providerCostCents: 0,
            billedCents,
            requestId,
            createdAt: now,
          } as any)
          .returning();

        await storage.createAuditLog({
          companyId,
          userId: req.user?.id ?? null,
          action: "ai.request",
          entityType: "ai_usage_log",
          entityId: created.id,
          changes: JSON.stringify({ requestId, feature, totalTokens, billedCents }),
        });

        res.json({
          requestId,
          response: { message: "ok" },
          usage: {
            promptTokens,
            completionTokens,
            totalTokens,
            billedCents,
            providerCostCents: 0,
          },
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );
}

export async function registerRoutes(app: Express): Promise<void> {
  // Import idempotency route helpers at the top to ensure they're available throughout
  const { registerFinancialRoute, getIdempotencyKey } = await import("./resilience/financial-route-gate");
  const { registerHighRiskRoute } = await import("./resilience/high-risk-route-gate");

  // ==================== AUTHENTICATION ====================
  
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, name } = req.body;

      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        name,
        role: "admin", // First user is admin
      });

      const effectiveRole = isOwnerEmail(email) ? "owner" : user.role;

      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: effectiveRole, currentCompanyId: user.currentCompanyId },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          role: effectiveRole,
          currentCompanyId: user.currentCompanyId 
        },
        token,
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed: " + error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Generate token
      const effectiveRole = isOwnerEmail(email) ? "owner" : user.role;
      const token = jwt.sign(
        { id: user.id, email: user.email, role: effectiveRole, currentCompanyId: user.currentCompanyId },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          role: effectiveRole,
          currentCompanyId: user.currentCompanyId 
        },
        token,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed: " + error.message });
    }
  });

  registerOwnerAiAuditRoutes(app);

  app.get("/api/owner/overview", authenticateToken, requireOwner, async (_req, res) => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [{ count: companiesCountRaw }] = await db
        .select({ count: sql<string>`count(*)` })
        .from(sharedSchema.companies);
      const [{ count: usersCountRaw }] = await db
        .select({ count: sql<string>`count(*)` })
        .from(sharedSchema.users);

      const totalCompanies = Number.parseInt(companiesCountRaw ?? "0", 10);
      const totalUsers = Number.parseInt(usersCountRaw ?? "0", 10);

      const activeStatuses = ["active", "trialing"] as const;
      const subscriptionRows = await db
        .select({
          status: sharedSchema.subscriptions.status,
          planCode: sharedSchema.plans.code,
          priceCents: sharedSchema.plans.priceCents,
          interval: sharedSchema.plans.billingInterval,
        })
        .from(sharedSchema.subscriptions)
        .innerJoin(
          sharedSchema.plans,
          eq(sharedSchema.subscriptions.planId, sharedSchema.plans.id),
        )
        .where(
          and(
            inArray(sharedSchema.subscriptions.status, activeStatuses as any),
            sql`${sharedSchema.subscriptions.deletedAt} is null`,
            sql`${sharedSchema.plans.deletedAt} is null`,
            eq(sharedSchema.plans.isActive, true),
          ),
        );

      const activeSubscriptionsByTier: Record<string, number> = {};
      let mrrCents = 0;

      for (const row of subscriptionRows) {
        const tier = row.planCode || "UNKNOWN";
        activeSubscriptionsByTier[tier] = (activeSubscriptionsByTier[tier] ?? 0) + 1;

        if (row.status === "active") {
          if (row.interval === "year") {
            mrrCents += Math.round((row.priceCents ?? 0) / 12);
          } else {
            mrrCents += row.priceCents ?? 0;
          }
        }
      }

      const arrCents = mrrCents * 12;

      const [{ count: canceledLast30Raw }] = await db
        .select({ count: sql<string>`count(*)` })
        .from(sharedSchema.subscriptions)
        .where(
          and(
            eq(sharedSchema.subscriptions.status, "canceled" as any),
            sql`${sharedSchema.subscriptions.deletedAt} is null`,
            sql`${sharedSchema.subscriptions.canceledAt} is not null`,
            sql`${sharedSchema.subscriptions.canceledAt} >= ${thirtyDaysAgo}`,
          ),
        );

      const canceledLast30 = Number.parseInt(canceledLast30Raw ?? "0", 10);
      const activeNow = subscriptionRows.filter((r) => r.status === "active").length;
      const churnRate = activeNow + canceledLast30 > 0 ? canceledLast30 / (activeNow + canceledLast30) : 0;

      const [{ count: trialsStartedRaw }] = await db
        .select({ count: sql<string>`count(*)` })
        .from(sharedSchema.subscriptions)
        .where(
          and(
            sql`${sharedSchema.subscriptions.deletedAt} is null`,
            sql`${sharedSchema.subscriptions.trialStart} is not null`,
            sql`${sharedSchema.subscriptions.trialStart} >= ${thirtyDaysAgo}`,
          ),
        );
      const [{ count: trialsConvertedRaw }] = await db
        .select({ count: sql<string>`count(*)` })
        .from(sharedSchema.subscriptions)
        .where(
          and(
            eq(sharedSchema.subscriptions.status, "active" as any),
            sql`${sharedSchema.subscriptions.deletedAt} is null`,
            sql`${sharedSchema.subscriptions.trialStart} is not null`,
            sql`${sharedSchema.subscriptions.trialStart} >= ${thirtyDaysAgo}`,
          ),
        );

      const trialsStarted = Number.parseInt(trialsStartedRaw ?? "0", 10);
      const trialsConverted = Number.parseInt(trialsConvertedRaw ?? "0", 10);
      const trialToPaidConversion = trialsStarted > 0 ? trialsConverted / trialsStarted : 0;

      const [{ aiRevenueCentsRaw }] = await db
        .select({ aiRevenueCentsRaw: sql<string>`coalesce(sum(${sharedSchema.aiUsageLogs.billedCents}), 0)` })
        .from(sharedSchema.aiUsageLogs)
        .where(sql`${sharedSchema.aiUsageLogs.createdAt} >= ${thirtyDaysAgo}`);
      const aiUsageRevenueCents = Number.parseInt(aiRevenueCentsRaw ?? "0", 10);

      const [{ failedPaymentsRaw }] = await db
        .select({ failedPaymentsRaw: sql<string>`count(*)` })
        .from(sharedSchema.billingPayments)
        .where(
          and(
            eq(sharedSchema.billingPayments.status, "failed" as any),
            sql`${sharedSchema.billingPayments.deletedAt} is null`,
            sql`${sharedSchema.billingPayments.createdAt} >= ${thirtyDaysAgo}`,
          ),
        );
      const failedPayments = Number.parseInt(failedPaymentsRaw ?? "0", 10);

      res.json({
        totalCompanies,
        totalUsers,
        activeSubscriptionsByTier,
        mrr: mrrCents / 100,
        arr: arrCents / 100,
        churnRate,
        trialToPaidConversion,
        aiUsageRevenue: aiUsageRevenueCents / 100,
        failedPayments,
        systemHealth: {
          api: "healthy",
          db: "healthy",
          workers: "unknown",
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/owner/plans", authenticateToken, requireOwner, async (_req, res) => {
    try {
      const plans = await db
        .select()
        .from(sharedSchema.plans)
        .where(sql`${sharedSchema.plans.deletedAt} is null`);
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/owner/plans", authenticateToken, requireOwner, async (req, res) => {
    try {
      const parsed = sharedSchema.insertPlanSchema.parse(req.body);
      const [plan] = await db
        .insert(sharedSchema.plans)
        .values({ ...parsed, createdAt: new Date(), updatedAt: new Date() })
        .returning();

      await storage.createAuditLog({
        companyId: null,
        userId: req.user?.id ?? null,
        action: "plan.create",
        entityType: "plan",
        entityId: plan.id,
        changes: JSON.stringify({ after: plan }),
      });

      res.status(201).json(plan);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/owner/plans/:id", authenticateToken, requireOwner, async (req, res) => {
    try {
      const planId = req.params.id;
      const [existing] = await db
        .select()
        .from(sharedSchema.plans)
        .where(and(eq(sharedSchema.plans.id, planId), sql`${sharedSchema.plans.deletedAt} is null`));
      if (!existing) {
        return res.status(404).json({ error: "Plan not found" });
      }

      const [updated] = await db
        .update(sharedSchema.plans)
        .set({ isActive: false, deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(sharedSchema.plans.id, planId))
        .returning();

      await storage.createAuditLog({
        companyId: null,
        userId: req.user?.id ?? null,
        action: "plan.delete",
        entityType: "plan",
        entityId: planId,
        changes: JSON.stringify({ before: existing, after: updated }),
      });

      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/owner/subscriptions", authenticateToken, requireOwner, async (req, res) => {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : undefined;

      const whereParts: any[] = [sql`${sharedSchema.subscriptions.deletedAt} is null`];
      if (status) {
        whereParts.push(eq(sharedSchema.subscriptions.status, status as any));
      }

      const rows = await db
        .select({
          subscription: sharedSchema.subscriptions,
          company: sharedSchema.companies,
          plan: sharedSchema.plans,
        })
        .from(sharedSchema.subscriptions)
        .innerJoin(
          sharedSchema.companies,
          eq(sharedSchema.subscriptions.companyId, sharedSchema.companies.id),
        )
        .innerJoin(
          sharedSchema.plans,
          eq(sharedSchema.subscriptions.planId, sharedSchema.plans.id),
        )
        .where(and(...whereParts));

      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/owner/subscriptions/:id", authenticateToken, requireOwner, async (req, res) => {
    try {
      const subscriptionId = req.params.id;
      const updates = sharedSchema.insertSubscriptionSchema
        .partial()
        .pick({
          status: true,
          cancelAtPeriodEnd: true,
          ownerGrantedFree: true,
          ownerNotes: true,
        })
        .parse(req.body);

      const [existing] = await db
        .select()
        .from(sharedSchema.subscriptions)
        .where(
          and(
            eq(sharedSchema.subscriptions.id, subscriptionId),
            sql`${sharedSchema.subscriptions.deletedAt} is null`,
          ),
        );
      if (!existing) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      const [updated] = await db
        .update(sharedSchema.subscriptions)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(sharedSchema.subscriptions.id, subscriptionId))
        .returning();

      await storage.createAuditLog({
        companyId: existing.companyId,
        userId: req.user?.id ?? null,
        action: "subscription.override",
        entityType: "subscription",
        entityId: subscriptionId,
        changes: JSON.stringify({ before: existing, after: updated }),
      });

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ==================== COMPANIES ====================

  app.get("/api/companies", authenticateToken, async (req, res) => {
    try {
      const roles = (Array.isArray((req as any).user?.roles) ? (req as any).user.roles : []) as string[];
      const isOwner = roles.includes("OWNER");
      if (isOwner) {
        const companies = await storage.getCompanies();
        return res.json(companies);
      }

      const userId = String((req as any).user?.id ?? "");
      const rows = await db
        .select({ company: sharedSchema.companies })
        .from(sharedSchema.userCompanyAccess)
        .innerJoin(
          sharedSchema.companies,
          eq(sharedSchema.userCompanyAccess.companyId, sharedSchema.companies.id),
        )
        .where(eq(sharedSchema.userCompanyAccess.userId, userId));

      return res.json(rows.map((r) => r.company));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/companies/:id", authenticateToken, async (req, res) => {
    try {
      const roles = (Array.isArray((req as any).user?.roles) ? (req as any).user.roles : []) as string[];
      const isOwner = roles.includes("OWNER");
      if (!isOwner) {
        const userId = String((req as any).user?.id ?? "");
        const allowed = await storage.hasUserCompanyAccess(userId, req.params.id);
        if (!allowed) {
          return res.status(403).json({ error: "Forbidden" });
        }
      }

      const company = await storage.getCompany(req.params.id);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json(company);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/companies", authenticateToken, async (req, res) => {
    try {
      const company = await storage.createCompany(req.body);

      const userId = String((req as any).user?.id ?? "");
      if (userId) {
        await storage.updateUser(userId, { currentCompanyId: company.id } as any);
        try {
          await db.insert(sharedSchema.userCompanyAccess).values({
            userId,
            companyId: company.id,
            role: "admin" as any,
          } as any);
        } catch {
          // ignore
        }
      }

      res.status(201).json(company);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== ACCOUNTS ====================

  app.get("/api/accounts", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const accounts = await storage.getAccountsByCompany(companyId);
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/accounts", authenticateToken, async (req, res) => {
    try {
      const account = await storage.createAccount(req.body);
      res.status(201).json(account);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== CUSTOMERS ====================

  app.get("/api/customers", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const customers = await storage.getCustomersByCompany(companyId);
      res.json(customers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  registerHighRiskRoute(app, {
    operationName: "createCustomer",
    path: "/api/customers",
    method: "POST",
    middleware: [authenticateToken, enforceBillingStatus()],
    handler: async (req, res) => {
      const customer = await storage.createCustomer(req.body);
      res.status(201).json(customer);
    },
  });

  registerHighRiskRoute(app, {
    operationName: "updateCustomer",
    path: "/api/customers/:id",
    method: "PATCH",
    middleware: [authenticateToken, enforceBillingStatus()],
    handler: async (req, res) => {
      const companyId = requireCompanyId();
      const customer = await storage.updateCustomerByCompany(companyId, req.params.id, req.body);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    },
  });

  // ==================== VENDORS ====================

  app.get("/api/vendors", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const vendors = await storage.getVendorsByCompany(companyId);
      res.json(vendors);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/vendors", authenticateToken, enforceBillingStatus(), async (req, res) => {
    try {
      const vendor = await storage.createVendor(req.body);
      res.status(201).json(vendor);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== TRANSACTIONS ====================

  app.get("/api/transactions", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const transactions = await storage.getTransactionsByCompany(companyId, limit);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/transactions/:id/lines", authenticateToken, async (req, res) => {
    try {
      const lines = await storage.getTransactionLinesByTransaction(req.params.id);
      res.json(lines);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/transactions", authenticateToken, enforceBillingStatus(), async (req, res) => {
    try {
      const { transaction, lines } = req.body;
      const companyId = transaction.companyId;

      // Enforce accounting period lock
      const isLocked = await isPeriodLocked(companyId, new Date(transaction.date));
      if (isLocked) {
        return res.status(403).json({
          error: "Accounting period is locked. Transactions cannot be created in locked periods.",
        });
      }

      // Validate double-entry: sum of debits must equal sum of credits
      const totalDebits = lines.reduce(
        (sum: number, line: any) => sum + parseFloat(line.debit || "0"),
        0
      );
      const totalCredits = lines.reduce(
        (sum: number, line: any) => sum + parseFloat(line.credit || "0"),
        0
      );

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        return res.status(400).json({
          error: "Transaction is not balanced. Debits must equal credits.",
          debits: totalDebits,
          credits: totalCredits,
        });
      }

      const actor = getActorFromRequest(req);

      const newTransaction = await postJournalEntry({
        transaction: {
          ...transaction,
          createdBy: actor.userId,
          updatedAt: new Date(),
        },
        lines,
        actor,
      } as any);

      res.status(201).json(newTransaction);
    } catch (error: any) {
      if (isAccountingError(error)) {
        return res.status(error.status).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/transactions/:id/void", authenticateToken, enforceBillingStatus(), async (req, res) => {
    try {
      const actor = getActorFromRequest(req);
      const [original] = await db
        .select({ companyId: sharedSchema.transactions.companyId })
        .from(sharedSchema.transactions)
        .where(eq(sharedSchema.transactions.id, req.params.id))
        .limit(1);

      if (!original?.companyId) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      await voidByReversal({
        companyId: original.companyId,
        transactionId: req.params.id,
        actor,
        reason: typeof req.body?.reason === "string" ? req.body.reason : null,
      });
      res.json({ success: true });
    } catch (error: any) {
      if (isAccountingError(error)) {
        return res.status(error.status).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== INVOICES ====================

  app.get("/api/invoices", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const invoices = await storage.getInvoicesByCompany(companyId);
      res.json(invoices);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/invoices/:id", authenticateToken, async (req, res) => {
    try {
      const companyId = requireCompanyId();
      const data = await storage.getInvoiceWithItemsByCompany(companyId, req.params.id);
      if (!data) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post(
    "/api/invoices",
    authenticateToken,
    enforceBillingStatus(),
    enforcePlanLimitsMiddleware("create_invoice"),
    async (req, res) => {
    try {
      const idempotencyKey = String(req.header("Idempotency-Key") ?? "").trim();
      if (!idempotencyKey) {
        return res.status(400).json({ error: "Idempotency-Key header is required" });
      }

      const { invoice, items } = req.body;

      // Calculate totals
      const subtotal = items.reduce(
        (sum: number, item: any) => sum + parseFloat(item.amount),
        0
      );
      const taxAmount = subtotal * (parseFloat(invoice.taxRate || "0") / 100);
      const total = subtotal + taxAmount;

      const invoiceData = {
        ...invoice,
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toString(),
        total: total.toString(),
        createdBy: (req as any).user.id,
        date: invoice.date ? new Date(invoice.date) : new Date(),
        dueDate: invoice.dueDate ? new Date(invoice.dueDate) : undefined,
      };

      const { invoice: newInvoice, replayed } = await storage.createInvoice(invoiceData, items, idempotencyKey);

      if (!replayed) {
        void startWorkflowInstance({
          companyId: String((newInvoice as any).companyId ?? invoiceData.companyId ?? ""),
          triggerEventType: "invoice_created",
          triggerEntityType: "invoice",
          triggerEntityId: String((newInvoice as any).id ?? null),
          metadataJson: { invoiceId: (newInvoice as any).id ?? null },
          actorUserId: String((req as any).user?.id ?? null),
        }).catch(() => {
          return;
        });
      }

      res.status(replayed ? 200 : 201).json(newInvoice);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
    },
  );

  app.post(
    "/api/invoices/:invoiceId/finalize",
    authenticateToken,
    enforceBillingStatus(),
    async (req, res) => {
      try {
        const idempotencyKey = String(req.header("Idempotency-Key") ?? "").trim();
        if (!idempotencyKey) {
          return res.status(400).json({ error: "Idempotency-Key header is required" });
        }

        const companyId = requireCompanyId();
        const { invoiceId } = req.params;
        const { targetStatus } = req.body;

        if (!targetStatus || !["sent", "issued", "approved", "finalized"].includes(targetStatus)) {
          return res.status(400).json({ error: "Valid targetStatus is required (sent, issued, approved, or finalized)" });
        }

        const { invoice, replayed } = await storage.finalizeInvoice(
          companyId,
          invoiceId,
          targetStatus,
          idempotencyKey
        );

        if (!replayed) {
          void startWorkflowInstance({
            companyId: String(invoice.companyId ?? companyId),
            triggerEventType: "invoice_finalized",
            triggerEntityType: "invoice",
            triggerEntityId: String(invoice.id ?? invoiceId),
            metadataJson: { invoiceId: invoice.id, targetStatus, previousStatus: "draft" },
            actorUserId: String((req as any).user?.id ?? null),
          }).catch(() => {
            return;
          });
        }

        res.status(replayed ? 200 : 201).json(invoice);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // ==================== PAYMENTS ====================

  // Payment creation route - uses financial mutation gate
  registerFinancialRoute(app, {
    operationName: "createPayment",
    path: "/api/payments",
    method: "POST",
    middleware: [authenticateToken, enforceBillingStatus()],
    handler: async (req, res) => {
      const idempotencyKey = getIdempotencyKey(req);
      const companyId = requireCompanyId();
      
      const paymentData = {
        ...req.body,
        companyId,
        createdBy: (req as any).user.id,
        date: req.body.date ? new Date(req.body.date) : new Date(),
      };
      
      const { payment, replayed } = await storage.createPayment(paymentData, idempotencyKey);

      if (!replayed) {
        void startWorkflowInstance({
          companyId: String((payment as any).companyId ?? paymentData.companyId ?? ""),
          triggerEventType: "payment_received",
          triggerEntityType: "payment",
          triggerEntityId: String((payment as any).id ?? null),
          metadataJson: { paymentId: (payment as any).id ?? null, invoiceId: (payment as any).invoiceId ?? null },
          actorUserId: String((req as any).user?.id ?? null),
        }).catch(() => {
          return;
        });
      }

      res.status(replayed ? 200 : 201).json(payment);
    },
  });

  app.get("/api/invoices/:invoiceId/payments", authenticateToken, async (req, res) => {
    try {
      const companyId = requireCompanyId();
      const payments = await storage.getPaymentsByInvoiceByCompany(companyId, req.params.invoiceId);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== BANK TRANSACTIONS ====================

  app.get("/api/bank-transactions", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const transactions = await storage.getBankTransactionsByCompany(companyId);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  registerFinancialRoute(app, {
    operationName: "importBankTransactions",
    path: "/api/bank-transactions/import",
    method: "POST",
    middleware: [authenticateToken],
    handler: async (req, res) => {
      const idempotencyKey = getIdempotencyKey(req);
      const { transactions: importedTransactions, companyId, accountId } = req.body;

      const created = [];
      for (const txn of importedTransactions) {
        const bankTxn = await storage.createBankTransaction({
          companyId,
          accountId,
          date: new Date(txn.date),
          description: txn.description,
          amount: txn.amount.toString(),
          type: parseFloat(txn.amount) >= 0 ? "credit" : "debit",
          referenceNumber: txn.referenceNumber,
        });
        created.push(bankTxn);
      }

      res.status(201).json({ imported: created.length, transactions: created });
    },
  });

  registerFinancialRoute(app, {
    operationName: "reconcileBankTransaction",
    path: "/api/bank-transactions/:id/reconcile",
    method: "POST",
    middleware: [authenticateToken],
    handler: async (req, res) => {
      const idempotencyKey = getIdempotencyKey(req);
      const { matchedTransactionId } = req.body;
      const companyId = requireCompanyId();
      await storage.reconcileBankTransactionByCompany(companyId, req.params.id, matchedTransactionId);
      res.json({ success: true });
    },
  });

  app.post(
    "/api/ledger/reconcile/:bankTransactionId",
    authenticateToken,
    enforceBillingStatus(),
    async (req, res) => {
      try {
        const idempotencyKey = String(req.header("Idempotency-Key") ?? "").trim();
        if (!idempotencyKey) {
          return res.status(400).json({ error: "Idempotency-Key header is required" });
        }

        const companyId = requireCompanyId();
        const { bankTransactionId } = req.params;
        const { matchedTransactionId } = req.body;

        if (!matchedTransactionId) {
          return res.status(400).json({ error: "matchedTransactionId is required" });
        }

        const userId = String((req as any).user?.id ?? "");
        if (!userId) {
          return res.status(401).json({ error: "User ID not found" });
        }

        const { bankTransaction, replayed } = await storage.reconcileLedger(
          companyId,
          bankTransactionId,
          matchedTransactionId,
          idempotencyKey,
          userId
        );

        if (!replayed) {
          void startWorkflowInstance({
            companyId: String(bankTransaction.companyId ?? companyId),
            triggerEventType: "ledger_reconciled",
            triggerEntityType: "bank_transaction",
            triggerEntityId: String(bankTransaction.id ?? bankTransactionId),
            metadataJson: { bankTransactionId: bankTransaction.id, matchedTransactionId, amount: bankTransaction.amount },
            actorUserId: userId,
          }).catch(() => {
            return;
          });
        }

        res.status(replayed ? 200 : 201).json(bankTransaction);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // ==================== REPORTS ====================

  app.get("/api/reports/profit-loss", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }

      // Get revenue and expense accounts
      const accounts = await storage.getAccountsByCompany(companyId);
      const revenueAccounts = accounts.filter((a) => a.type === "revenue");
      const expenseAccounts = accounts.filter((a) => a.type === "expense");

      const totalRevenue = revenueAccounts.reduce(
        (sum, acc) => sum + parseFloat(acc.balance),
        0
      );
      const totalExpenses = expenseAccounts.reduce(
        (sum, acc) => sum + parseFloat(acc.balance),
        0
      );

      res.json({
        revenue: {
          total: totalRevenue,
          accounts: revenueAccounts,
        },
        expenses: {
          total: totalExpenses,
          accounts: expenseAccounts,
        },
        netIncome: totalRevenue - totalExpenses,
        period: { startDate, endDate },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/balance-sheet", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }

      const accounts = await storage.getAccountsByCompany(companyId);
      
      const assets = accounts.filter((a) => a.type === "asset");
      const liabilities = accounts.filter((a) => a.type === "liability");
      const equity = accounts.filter((a) => a.type === "equity");

      const totalAssets = assets.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
      const totalLiabilities = liabilities.reduce(
        (sum, acc) => sum + parseFloat(acc.balance),
        0
      );
      const totalEquity = equity.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

      res.json({
        assets: {
          total: totalAssets,
          accounts: assets,
        },
        liabilities: {
          total: totalLiabilities,
          accounts: liabilities,
        },
        equity: {
          total: totalEquity,
          accounts: equity,
        },
        asOfDate: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/cash-flow", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }

      // Simple cash flow based on cash account balance changes
      const accounts = await storage.getAccountsByCompany(companyId);
      const cashAccount = accounts.find((a) => a.code === "1110" || a.name.toLowerCase().includes("cash"));

      res.json({
        operatingActivities: {
          total: cashAccount ? parseFloat(cashAccount.balance) : 0,
        },
        investingActivities: {
          total: 0,
        },
        financingActivities: {
          total: 0,
        },
        netChange: cashAccount ? parseFloat(cashAccount.balance) : 0,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/cash-flow", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }

      // Simple cash flow based on cash account balance changes
      const accounts = await storage.getAccountsByCompany(companyId);
      const cashAccount = accounts.find((a) => a.code === "1110" || a.name.toLowerCase().includes("cash"));

      res.json({
        operatingActivities: {
          total: cashAccount ? parseFloat(cashAccount.balance) : 0,
        },
        investingActivities: {
          total: 0,
        },
        financingActivities: {
          total: 0,
        },
        netChange: cashAccount ? parseFloat(cashAccount.balance) : 0,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== PAYROLL MODULE ====================

  // Employees
  app.get("/api/payroll/employees", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const employees = await storage.getEmployeesByCompany(companyId);
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  registerHighRiskRoute(app, {
    operationName: "createEmployee",
    path: "/api/payroll/employees",
    method: "POST",
    middleware: [authenticateToken],
    handler: async (req, res) => {
      const employee = await storage.createEmployee(req.body);
      res.status(201).json(employee);
    },
  });

  registerFinancialRoute(app, {
    operationName: "updateEmployee",
    path: "/api/payroll/employees/:id",
    method: "PATCH",
    middleware: [authenticateToken],
    handler: async (req, res) => {
      const companyId = requireCompanyId();
      const employee = await storage.updateEmployeeByCompany(companyId, req.params.id, req.body);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      res.json(employee);
    },
  });

  // Deductions
  app.get("/api/payroll/deductions", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const deductions = await storage.getDeductionsByCompany(companyId);
      res.json(deductions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  registerFinancialRoute(app, {
    operationName: "createDeduction",
    path: "/api/payroll/deductions",
    method: "POST",
    middleware: [authenticateToken],
    handler: async (req, res) => {
      const deduction = await storage.createDeduction(req.body);
      res.status(201).json(deduction);
    },
  });

  // Employee Deductions
  app.get("/api/payroll/employee-deductions/:employeeId", authenticateToken, async (req, res) => {
    try {
      const deductions = await storage.getEmployeeDeductionsByEmployee(req.params.employeeId);
      res.json(deductions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  registerFinancialRoute(app, {
    operationName: "createEmployeeDeduction",
    path: "/api/payroll/employee-deductions",
    method: "POST",
    middleware: [authenticateToken],
    handler: async (req, res) => {
      const companyId = requireCompanyId();
      const deduction = await storage.createEmployeeDeductionByCompany(companyId, req.body);
      res.status(201).json(deduction);
    },
  });

  // Payroll Periods
  app.get("/api/payroll/periods", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const periods = await storage.getPayrollPeriodsByCompany(companyId);
      res.json(periods);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  registerFinancialRoute(app, {
    operationName: "createPayrollPeriod",
    path: "/api/payroll/periods",
    method: "POST",
    middleware: [authenticateToken],
    handler: async (req, res) => {
      const period = await storage.createPayrollPeriod(req.body);
      res.status(201).json(period);
    },
  });

  // Time Entries
  app.get("/api/payroll/time-entries", authenticateToken, async (req, res) => {
    try {
      const employeeId = req.query.employeeId as string;
      const payrollPeriodId = req.query.payrollPeriodId as string;

      if (employeeId) {
        const entries = await storage.getTimeEntriesByEmployee(employeeId);
        return res.json(entries);
      }

      if (payrollPeriodId) {
        const entries = await storage.getTimeEntriesByPayrollPeriod(payrollPeriodId);
        return res.json(entries);
      }

      return res.status(400).json({ error: "employeeId or payrollPeriodId is required" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  registerFinancialRoute(app, {
    operationName: "createTimeEntry",
    path: "/api/payroll/time-entries",
    method: "POST",
    middleware: [authenticateToken],
    handler: async (req, res) => {
      const companyId = requireCompanyId();
      const entry = await storage.createTimeEntryByCompany(companyId, req.body);
      res.status(201).json(entry);
    },
  });

  registerFinancialRoute(app, {
    operationName: "approveTimeEntry",
    path: "/api/payroll/time-entries/:id/approve",
    method: "POST",
    middleware: [authenticateToken],
    handler: async (req, res) => {
      const companyId = requireCompanyId();
      await storage.approveTimeEntryByCompany(companyId, req.params.id, (req as any).user.id);
      res.json({ success: true });
    },
  });

  // Pay Runs
  app.get("/api/payroll/pay-runs", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const payRuns = await storage.getPayRunsByCompany(companyId);
      res.json(payRuns);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/payroll/pay-runs/:id", authenticateToken, async (req, res) => {
    try {
      const data = await storage.getPayRunWithDetails(req.params.id);
      if (!data) {
        return res.status(404).json({ error: "Pay run not found" });
      }
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  registerFinancialRoute(app, {
    operationName: "createPayRun",
    path: "/api/payroll/pay-runs",
    method: "POST",
    middleware: [authenticateToken],
    handler: async (req, res) => {
      const { payRun, details } = req.body;
      const newPayRun = await storage.createPayRun(payRun, details);

      void startWorkflowInstance({
        companyId: String((newPayRun as any).companyId ?? payRun?.companyId ?? ""),
        triggerEventType: "payroll_run",
        triggerEntityType: "pay_run",
        triggerEntityId: String((newPayRun as any).id ?? null),
        metadataJson: { payRunId: (newPayRun as any).id ?? null },
        actorUserId: String((req as any).user?.id ?? null),
      }).catch(() => {
        return;
      });

      res.status(201).json(newPayRun);
    },
  });

  registerFinancialRoute(app, {
    operationName: "updatePayRunStatus",
    path: "/api/payroll/pay-runs/:id/status",
    method: "PATCH",
    middleware: [authenticateToken],
    handler: async (req, res) => {
      const { status } = req.body;
      const companyId = requireCompanyId();
      await storage.updatePayRunStatusByCompany(companyId, req.params.id, status);
      res.json({ success: true });
    },
  });

  app.post(
    "/api/payroll/pay-runs/:payRunId/execute",
    authenticateToken,
    enforceBillingStatus(),
    async (req, res) => {
      try {
        const idempotencyKey = String(req.header("Idempotency-Key") ?? "").trim();
        if (!idempotencyKey) {
          return res.status(400).json({ error: "Idempotency-Key header is required" });
        }

        const companyId = requireCompanyId();
        const { payRunId } = req.params;
        const { targetStatus } = req.body;

        if (!targetStatus || !["approved", "processing", "completed"].includes(targetStatus)) {
          return res.status(400).json({ error: "Valid targetStatus is required (approved, processing, or completed)" });
        }

        const { payRun, replayed } = await storage.executePayrollRun(
          companyId,
          payRunId,
          targetStatus,
          idempotencyKey
        );

        if (!replayed) {
          void startWorkflowInstance({
            companyId: String(payRun.companyId ?? companyId),
            triggerEventType: "payroll_executed",
            triggerEntityType: "pay_run",
            triggerEntityId: String(payRun.id ?? payRunId),
            metadataJson: { payRunId: payRun.id, targetStatus, previousStatus: "draft" },
            actorUserId: String((req as any).user?.id ?? null),
          }).catch(() => {
            return;
          });
        }

        res.status(replayed ? 200 : 201).json(payRun);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Tax Forms
  app.get("/api/payroll/tax-forms", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const forms = await storage.getTaxFormsByCompany(companyId);
      res.json(forms);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  registerFinancialRoute(app, {
    operationName: "createTaxForm",
    path: "/api/payroll/tax-forms",
    method: "POST",
    middleware: [authenticateToken],
    handler: async (req, res) => {
      const form = await storage.createTaxForm(req.body);
      res.status(201).json(form);
    },
  });

  // ==================== INVENTORY MODULE ====================

  // Inventory Items
  app.get("/api/inventory/items", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const items = await storage.getInventoryItemsByCompany(companyId);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  registerHighRiskRoute(app, {
    operationName: "createInventoryItem",
    path: "/api/inventory/items",
    method: "POST",
    middleware: [authenticateToken],
    handler: async (req, res) => {
      const item = await storage.createInventoryItem(req.body);
      res.status(201).json(item);
    },
  });

  registerHighRiskRoute(app, {
    operationName: "updateInventoryItem",
    path: "/api/inventory/items/:id",
    method: "PATCH",
    middleware: [authenticateToken],
    handler: async (req, res) => {
      const companyId = requireCompanyId();
      const item = await storage.updateInventoryItemByCompany(companyId, req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Inventory item not found" });
      }
      res.json(item);
    },
  });

  registerFinancialRoute(app, {
    operationName: "updateInventoryQuantity",
    path: "/api/inventory/items/:id/quantity",
    method: "PATCH",
    middleware: [authenticateToken],
    handler: async (req, res) => {
      const { quantityChange, reason } = req.body;
      const companyId = requireCompanyId();
      await storage.updateInventoryQuantityByCompany(companyId, req.params.id, quantityChange, reason, String((req as any).user?.id ?? "system"));
      res.json({ success: true });
    },
  });

  // Purchase Orders
  app.get("/api/inventory/purchase-orders", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const orders = await storage.getPurchaseOrdersByCompany(companyId);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/inventory/purchase-orders/:id", authenticateToken, async (req, res) => {
    try {
      const data = await storage.getPurchaseOrderWithItems(req.params.id);
      if (!data) {
        return res.status(404).json({ error: "Purchase order not found" });
      }
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  registerFinancialRoute(app, {
    operationName: "createPurchaseOrder",
    path: "/api/inventory/purchase-orders",
    method: "POST",
    middleware: [authenticateToken],
    handler: async (req, res) => {
      const { order, items } = req.body;
      const newOrder = await storage.createPurchaseOrder(order, items);
      res.status(201).json(newOrder);
    },
  });

  registerFinancialRoute(app, {
    operationName: "updatePurchaseOrderStatus",
    path: "/api/inventory/purchase-orders/:id/status",
    method: "PATCH",
    middleware: [authenticateToken],
    handler: async (req, res) => {
      const { status } = req.body;
      const companyId = requireCompanyId();
      await storage.updatePurchaseOrderStatusByCompany(companyId, req.params.id, status);
      res.json({ success: true });
    },
  });

  // Inventory Adjustments
  app.get("/api/inventory/adjustments", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const adjustments = await storage.getInventoryAdjustmentsByCompany(companyId);
      res.json(adjustments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  registerFinancialRoute(app, {
    operationName: "createInventoryAdjustment",
    path: "/api/inventory/adjustments",
    method: "POST",
    middleware: [authenticateToken],
    handler: async (req, res) => {
      const adjustment = await storage.createInventoryAdjustment(req.body);
      res.status(201).json(adjustment);
    },
  });

  // ==================== BILLING & PLANS ====================

  app.get("/api/billing/plans", authenticateToken, async (req, res) => {
    try {
      const plans = await db
        .select()
        .from(s.plans)
        .where(eq(s.plans.isActive, true))
        .orderBy(s.plans.priceCents);
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/billing/subscription", authenticateToken, async (req, res) => {
    try {
      const companyId = getCompanyIdFromRequest(req as any);
      if (!companyId) return res.status(400).json({ error: "companyId required" });

      const { plan, entitlements } = await getCurrentPlan(companyId);
      res.json({ plan, entitlements });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/billing/upgrade", authenticateToken, async (req, res) => {
    try {
      const { planId } = req.body;
      const companyId = getCompanyIdFromRequest(req as any);
      if (!companyId) return res.status(400).json({ error: "companyId required" });

      // TODO: Integrate with Stripe to create/upgrade subscription
      res.json({ success: true, message: "Upgrade flow initiated." });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== OWNER COMMAND CONTROLS ====================

  app.get("/api/owner/accounting-periods", authenticateToken, requireOwner, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) return res.status(400).json({ error: "companyId required" });
      const periods = await getAccountingPeriods(companyId);
      res.json(periods);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/owner/accounting-periods/:periodId/lock", authenticateToken, requireOwner, async (req, res) => {
    try {
      const { periodId } = req.params;
      const { companyId, reason } = req.body;
      if (!companyId || !reason) return res.status(400).json({ error: "companyId and reason required" });
      await lockAccountingPeriod(companyId, periodId, (req as any).user.id, reason);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/owner/accounting-periods/:periodId/unlock", authenticateToken, requireOwner, async (req, res) => {
    try {
      const { periodId } = req.params;
      const { companyId, reason } = req.body;
      if (!companyId || !reason) return res.status(400).json({ error: "companyId and reason required" });
      await unlockAccountingPeriod(companyId, periodId, (req as any).user.id, reason);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/owner/export/accountant-report", authenticateToken, requireOwner, async (req, res) => {
    try {
      const { companyId, startDate, endDate, format = "json" } = req.query;
      if (!companyId || !startDate || !endDate) return res.status(400).json({ error: "companyId, startDate, endDate required" });

      // Fetch transactions, accounts, and period locks for the range
      const transactions = await db
        .select()
        .from(s.transactions)
        .where(
          and(
            eq(s.transactions.companyId, companyId as string),
            sql`${s.transactions.date}::date >= ${startDate}::date AND ${s.transactions.date}::date <= ${endDate}::date`
          )
        )
        .orderBy(s.transactions.date);

      const accounts = await db
        .select()
        .from(s.accounts)
        .where(eq(s.accounts.companyId, companyId as string));

      const periods = await getAccountingPeriods(companyId as string);

      const report = {
        meta: {
          companyId,
          startDate,
          endDate,
          generatedAt: new Date().toISOString(),
          generatedBy: (req as any).user.email,
          accountingPeriods: periods,
        },
        accounts,
        transactions,
      };

      if (format === "csv") {
        // Simple CSV export for transactions
        const csv = [
          "Transaction Number,Date,Type,Description,Debit,Credit,Account Code,Account Name",
          ...transactions.flatMap((tx) =>
            (tx.lines ?? []).map((line: any) =>
              `${tx.transactionNumber},${tx.date},${tx.type},"${tx.description}",${line.debit ?? ""},${line.credit ?? ""},${line.accountCode},${line.accountName}`
            )
          ),
        ].join("\n");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="accountant-report-${startDate}-${endDate}.csv"`);
        return res.send(csv);
      }

      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== USER PROFILE & PERMISSIONS ====================

  app.get("/api/me", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const permissions = getPermissionsForRole(user.role);
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/billing/status", authenticateToken, enforceBillingStatus(), async (req, res) => {
    try {
      const companyId = getCompanyIdFromRequest(req as any);
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const { mode, subscription } = await getBillingEnforcementMode(companyId);
      res.json({ mode, subscription });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== JOB MANAGEMENT ====================

  // Job Queue Management
  app.get("/api/jobs/queues", authenticateToken, getJobQueues);
  app.get("/api/jobs/queues/:queueName", authenticateToken, getQueueJobs);
  app.post("/api/jobs/queues/:queueName/pause", authenticateToken, pauseQueue);
  app.post("/api/jobs/queues/:queueName/resume", authenticateToken, resumeQueue);
  app.post("/api/jobs/queues/:queueName/clean", authenticateToken, cleanQueue);
  app.delete("/api/jobs/queues/:queueName/jobs/:jobId", authenticateToken, removeJob);

  // Job Scheduling
  app.post("/api/jobs/schedule/recurring-invoice", authenticateToken, scheduleRecurringInvoice);
  app.post("/api/jobs/schedule/payroll-processing", authenticateToken, schedulePayrollProcessing);
  app.post("/api/jobs/schedule/report-generation", authenticateToken, scheduleReportGeneration);
  app.post("/api/jobs/schedule/backup", authenticateToken, scheduleBackup);
  app.post("/api/jobs/schedule/notification", authenticateToken, scheduleNotification);

  // ==================== STRIPE INTEGRATION ====================

  // Billing checkout (authenticated)
  app.post("/api/billing/checkout", authenticateToken, createCheckoutSession);

  // Stripe webhooks (no authentication required)
  app.post("/api/webhooks/stripe", handleStripeWebhook);
  // Backward-compatible legacy path
  app.post("/api/stripe/webhooks", handleStripeWebhook);

  // Stripe payment processing
  app.post("/api/stripe/payment-intent", authenticateToken, createPaymentIntent);
  app.get("/api/stripe/payment-intent/:paymentIntentId", authenticateToken, getPaymentIntent);
  app.post("/api/stripe/invoices", authenticateToken, createStripeInvoice);
  app.post("/api/stripe/invoices/:invoiceId/send", authenticateToken, sendInvoice);
  app.post("/api/stripe/refunds/:paymentIntentId", authenticateToken, refundPayment);
  app.get("/api/stripe/balance", authenticateToken, getBalance);
  app.get("/api/stripe/health", stripeHealthCheck);

  // ==================== PLAID INTEGRATION ====================

  // Plaid webhooks (no authentication required)
  app.post("/api/plaid/webhooks", handlePlaidWebhook);

  // Plaid OAuth flow
  app.post("/api/plaid/link-token", authenticateToken, createLinkToken);
  app.post("/api/plaid/exchange-token", authenticateToken, exchangePublicToken);
  app.get("/api/plaid/accounts", authenticateToken, getAccounts);
  app.get("/api/plaid/balances", authenticateToken, getAccountBalances);
  app.post("/api/plaid/sync-transactions", authenticateToken, syncTransactions);
  app.get("/api/plaid/transactions", authenticateToken, getTransactions);
  app.get("/api/plaid/institutions", authenticateToken, getInstitutions);
  app.get("/api/plaid/health", plaidHealthCheck);
  
  // Health check endpoint
  app.get("/health", healthCheck);
  app.get("/api/health", healthCheck);

  return;
}
