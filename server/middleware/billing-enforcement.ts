import type { NextFunction, Request, Response } from "express";
import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "../db";
import * as s from "../../shared/schema";
import { storage } from "../storage";

export type PlanLimitAction =
  | "create_invoice"
  | "create_user"
  | "ai_request"
  | "api_request";

export function getCompanyIdFromRequest(req: any): string | null {
  const q = req.query?.companyId;
  if (typeof q === "string" && q) return q;

  const bodyCompanyId =
    (req.body?.companyId as string | undefined) ??
    (req.body?.invoice?.companyId as string | undefined);
  if (typeof bodyCompanyId === "string" && bodyCompanyId) return bodyCompanyId;

  const tokenCompanyId = req.user?.currentCompanyId as string | undefined;
  if (typeof tokenCompanyId === "string" && tokenCompanyId) return tokenCompanyId;

  return null;
}

export type BillingEnforcementMode = "ok" | "warn_past_due" | "read_only" | "suspended";

export async function getBillingEnforcementMode(companyId: string): Promise<{
  mode: BillingEnforcementMode;
  subscription: s.Subscription | null;
}> {
  const [sub] = await db
    .select()
    .from(s.subscriptions)
    .where(
      and(
        eq(s.subscriptions.companyId, companyId),
        sql`${s.subscriptions.deletedAt} is null`,
        inArray(s.subscriptions.status, [
          "trialing",
          "active",
          "past_due",
          "paused",
        ] as any),
      ),
    )
    .orderBy(sql`${s.subscriptions.createdAt} desc`)
    .limit(1);

  if (!sub) return { mode: "ok", subscription: null };

  if (sub.ownerGrantedFree) return { mode: "ok", subscription: sub };

  if (sub.status !== "past_due") {
    return { mode: "ok", subscription: sub };
  }

  const pastDueSince = sub.pastDueSince ? new Date(sub.pastDueSince) : null;
  if (!pastDueSince) {
    return { mode: "warn_past_due", subscription: sub };
  }

  const daysPastDue = (Date.now() - pastDueSince.getTime()) / (24 * 60 * 60 * 1000);
  if (daysPastDue >= 14) {
    return { mode: "suspended", subscription: sub };
  }

  if (daysPastDue >= 7) {
    return { mode: "read_only", subscription: sub };
  }

  return { mode: "warn_past_due", subscription: sub };
}

function isWriteMethod(method: string): boolean {
  const m = method.toUpperCase();
  return m === "POST" || m === "PUT" || m === "PATCH" || m === "DELETE";
}

export function enforceBillingStatus() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = getCompanyIdFromRequest(req as any);
      if (!companyId) {
        return next();
      }

      const role = String((req as any).user?.role ?? "");
      if (role === "owner") {
        return next();
      }

      const { mode, subscription } = await getBillingEnforcementMode(companyId);

      if (mode === "warn_past_due") {
        res.setHeader("x-billing-status", "past_due");
        return next();
      }

      if (mode === "read_only" && isWriteMethod(req.method)) {
        res.setHeader("x-billing-status", "read_only");
        return res.status(402).json({
          error: "Billing is past due. Account is in read-only mode.",
          code: "BILLING_READ_ONLY",
          companyId,
          subscriptionId: subscription?.id ?? null,
        });
      }

      if (mode === "suspended") {
        res.setHeader("x-billing-status", "suspended");
        return res.status(402).json({
          error: "Billing is past due. Account is suspended.",
          code: "BILLING_SUSPENDED",
          companyId,
          subscriptionId: subscription?.id ?? null,
        });
      }

      return next();
    } catch (err: any) {
      return next(err);
    }
  };
}

export async function enforcePlanLimits(companyId: string, action: PlanLimitAction, payload?: {
  aiTokens?: number;
}) {
  const [subRow] = await db
    .select({ subscription: s.subscriptions, plan: s.plans })
    .from(s.subscriptions)
    .innerJoin(s.plans, eq(s.subscriptions.planId, s.plans.id))
    .where(
      and(
        eq(s.subscriptions.companyId, companyId),
        sql`${s.subscriptions.deletedAt} is null`,
        sql`${s.plans.deletedAt} is null`,
        inArray(s.subscriptions.status, ["trialing", "active", "past_due"] as any),
      ),
    )
    .orderBy(sql`${s.subscriptions.createdAt} desc`)
    .limit(1);

  const subscription = subRow?.subscription ?? null;
  const plan = subRow?.plan ?? null;

  if (!subscription || !plan) {
    return { allowed: true, warnings: [] as Array<{ type: string; message: string }> };
  }

  if (subscription.ownerGrantedFree) {
    return { allowed: true, warnings: [] as Array<{ type: string; message: string }> };
  }

  const warnings: Array<{ type: string; message: string }> = [];

  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  if (action === "create_invoice") {
    const [{ count: invoiceCountRaw }] = await db
      .select({ count: sql<string>`count(*)` })
      .from(s.invoices)
      .where(and(eq(s.invoices.companyId, companyId), sql`${s.invoices.createdAt} >= ${periodStart}`));

    const invoiceCount = Number.parseInt(invoiceCountRaw ?? "0", 10);
    const max = plan.maxInvoices;

    if (typeof max === "number" && Number.isFinite(max)) {
      const pct = max > 0 ? invoiceCount / max : 1;
      if (pct >= 0.8) {
        warnings.push({
          type: "invoices",
          message: `Invoices usage at ${(pct * 100).toFixed(0)}% of plan limit`,
        });
      }
      if (invoiceCount >= max) {
        return {
          allowed: false,
          warnings,
          reason: "PLAN_LIMIT_INVOICES",
          details: { invoiceCount, max },
        } as any;
      }
    }
  }

  if (action === "ai_request") {
    const tokensForRequest = payload?.aiTokens ?? 0;

    const [{ usedTokensRaw }] = await db
      .select({ usedTokensRaw: sql<string>`coalesce(sum(${s.aiUsageLogs.totalTokens}), 0)` })
      .from(s.aiUsageLogs)
      .where(and(eq(s.aiUsageLogs.companyId, companyId), sql`${s.aiUsageLogs.createdAt} >= ${periodStart}`));

    const usedTokens = Number.parseInt(usedTokensRaw ?? "0", 10);
    const projected = usedTokens + tokensForRequest;

    const max = plan.maxAiTokens;
    if (typeof max === "number" && Number.isFinite(max)) {
      const pct = max > 0 ? projected / max : 1;
      if (pct >= 0.8) {
        warnings.push({
          type: "ai_tokens",
          message: `AI tokens usage at ${(pct * 100).toFixed(0)}% of plan limit`,
        });
      }
      if (projected > max) {
        return {
          allowed: false,
          warnings,
          reason: "PLAN_LIMIT_AI_TOKENS",
          details: { usedTokens, projected, max },
        } as any;
      }
    }
  }

  if (action === "api_request") {
    if (!plan.allowApiAccess) {
      return {
        allowed: false,
        warnings,
        reason: "PLAN_LIMIT_API_DISABLED",
        details: { allowApiAccess: false },
      } as any;
    }
  }

  return { allowed: true, warnings };
}

export function enforcePlanLimitsMiddleware(action: PlanLimitAction) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = getCompanyIdFromRequest(req as any);
      if (!companyId) return next();

      const role = String((req as any).user?.role ?? "");
      if (role === "owner") {
        return next();
      }

      const tokens =
        action === "ai_request"
          ? Number((req.body as any)?.promptTokens ?? 0) +
            Number((req.body as any)?.completionTokens ?? 0)
          : 0;

      const result = await enforcePlanLimits(companyId, action, { aiTokens: tokens });

      if ((result as any).warnings?.length) {
        res.setHeader("x-plan-warnings", JSON.stringify((result as any).warnings));
      }

      if (!(result as any).allowed) {
        await storage.createAuditLog({
          companyId,
          userId: String((req as any).user?.id ?? null),
          action: "plan.limit.blocked",
          entityType: "plan_limit",
          entityId: `${action}:${companyId}`,
          changes: JSON.stringify({ action, result }),
        });

        return res.status(402).json({
          error: "Plan limit exceeded",
          code: (result as any).reason,
          details: (result as any).details,
          warnings: (result as any).warnings ?? [],
        });
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
}
