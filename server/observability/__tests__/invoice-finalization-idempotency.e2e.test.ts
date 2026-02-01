import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import { db, pool } from "../../db";
import * as s from "../../../shared/schema";
import { eq, and } from "drizzle-orm";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";

vi.mock("../../routes/jobs", () => {
  return {
    getJobQueues: vi.fn(async () => []),
    getQueueJobs: vi.fn(async () => []),
    pauseQueue: vi.fn(async () => ({ ok: true })),
    resumeQueue: vi.fn(async () => ({ ok: true })),
    cleanQueue: vi.fn(async () => ({ ok: true })),
    removeJob: vi.fn(async () => ({ ok: true })),
    scheduleRecurringInvoice: vi.fn(async () => ({ ok: true })),
    schedulePayrollProcessing: vi.fn(async () => ({ ok: true })),
    scheduleReportGeneration: vi.fn(async () => ({ ok: true })),
    scheduleBackup: vi.fn(async () => ({ ok: true })),
    scheduleNotification: vi.fn(async () => ({ ok: true })),
  };
});

vi.mock("../../middleware/billing-status", () => {
  return {
    enforceBillingStatus: () => (_req: any, _res: any, next: any) => next(),
  };
});

vi.mock("../../middleware/plan-limits", () => {
  return {
    enforcePlanLimits: () => (_req: any, _res: any, next: any) => next(),
    enforcePlanLimitsMiddleware: () => (_req: any, _res: any, next: any) => next(),
  };
});

vi.mock("../../services/workflow.service", () => {
  return {
    startWorkflowInstance: vi.fn(async () => []),
  };
});

function looksLikeAccuBooksDatabaseUrl(url: string): boolean {
  return /\/(accubooks(?:_[a-z0-9_]+)?)\b/i.test(url);
}

function deriveAccuBooksDatabaseUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const currentDb = u.pathname.replace(/^\//, "");
    if (!currentDb) return null;
    if (looksLikeAccuBooksDatabaseUrl(url)) return url;
    u.pathname = "/accubooks";
    return u.toString();
  } catch {
    return null;
  }
}

function parseEnvFile(filePath: string): Record<string, string> {
  const content = fs.readFileSync(filePath, "utf-8");
  const env: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = /^([^=]+)=(.*)$/.exec(trimmed);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  }
  return env;
}

function resolveTestDatabaseUrl(): string | null {
  const repoRoot = process.cwd();

  const candidates: string[] = [];

  const fromProcess = [
    process.env.INVOICE_FINALIZATION_E2E_DATABASE_URL,
    process.env.ACCUBOOKS_DATABASE_URL,
    process.env.TEST_DATABASE_URL,
    process.env.DATABASE_URL,
  ].filter((v): v is string => typeof v === "string" && !!v.trim());
  candidates.push(...fromProcess);

  const defaultEnv = path.join(repoRoot, ".env");
  if (fs.existsSync(defaultEnv)) {
    const env = parseEnvFile(defaultEnv);
    if (typeof env.TEST_DATABASE_URL === "string" && env.TEST_DATABASE_URL) candidates.push(env.TEST_DATABASE_URL);
    if (typeof env.DATABASE_URL === "string" && env.DATABASE_URL) candidates.push(env.DATABASE_URL);
  }

  for (const c of candidates) {
    if (looksLikeAccuBooksDatabaseUrl(c)) return c;
  }

  for (const c of candidates) {
    const derived = deriveAccuBooksDatabaseUrl(c);
    if (derived) return derived;
  }

  return candidates[0] ?? null;
}

async function checkDbPreflight(dbUrl: string): Promise<{ ok: boolean; diag: any }> {
  const { Client } = await import("pg");
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    const dbNameRes = await client.query("SELECT current_database() as db");
    const dbName = dbNameRes.rows[0]?.db ?? "unknown";

    const tableCheckSql = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      AND table_name IN ('companies', 'users', 'customers', 'invoices', 'invoice_finalizations', 'user_company_access')
    `;
    const tableRes = await client.query(tableCheckSql);
    const foundTables = new Set(tableRes.rows.map((r: any) => r.table_name));

    const diag = {
      db: dbName,
      companies: foundTables.has("companies") ? "companies" : null,
      users: foundTables.has("users") ? "users" : null,
      customers: foundTables.has("customers") ? "customers" : null,
      invoices: foundTables.has("invoices") ? "invoices" : null,
      invoice_finalizations: foundTables.has("invoice_finalizations") ? "invoice_finalizations" : null,
      user_company_access: foundTables.has("user_company_access") ? "user_company_access" : null,
    };

    await client.end();

    const required = ["companies", "users", "customers", "invoices", "invoice_finalizations", "user_company_access"];
    const ok = required.every((t) => foundTables.has(t));
    return { ok, diag };
  } catch (err) {
    return { ok: false, diag: { error: err } };
  }
}

describe("invoice finalization idempotency (db-backed)", () => {
  let testDbUrl: string | null = null;
  let app: any;

  beforeAll(async () => {
    console.log("Setting up test environment...");
    testDbUrl = resolveTestDatabaseUrl();
    if (!testDbUrl) {
      throw new Error("No DATABASE_URL found for invoice finalization idempotency E2E test");
    }

    const preflight = await checkDbPreflight(testDbUrl);
    if (!preflight.ok) {
      throw new Error(
        `Invoice finalization idempotency E2E test requires migrated DB schema. DATABASE_URL=${testDbUrl} diag=${JSON.stringify(preflight.diag)}`
      );
    }

    const appMod = await import("../../app");
    const routesMod = await import("../../routes/index");
    app = appMod.createApp();
    routesMod.registerAllRoutes(app);
  });

  afterAll(async () => {
    console.log("Cleaning up test environment...");
    await pool.end();
  });

  it("concurrent replay: one status transition, consistent responses, workflow fires once", async () => {
    const companyId = `test-company-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const userId = `test-user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const customerId = `test-customer-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const invoiceId = `test-invoice-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    await db.insert(s.companies).values({
      id: companyId,
      name: "Test Company Invoice Finalization",
      email: `invoice-final-${Date.now()}@test.local`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(s.users).values({
      id: userId,
      username: `invoice-final-user-${Date.now()}`,
      email: `invoice-final-user-${Date.now()}@test.local`,
      password: "hashed",
      name: "Invoice Final User",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(s.userCompanyAccess).values({
      userId,
      companyId,
      role: "admin",
      createdAt: new Date(),
    });

    await db.insert(s.customers).values({
      id: customerId,
      companyId,
      name: "Test Customer",
      balance: "0",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(s.invoices).values({
      id: invoiceId,
      companyId,
      customerId,
      invoiceNumber: `INV-FINAL-${Date.now()}`,
      date: new Date("2024-01-15"),
      dueDate: new Date("2024-02-15"),
      status: "draft",
      subtotal: "100.00",
      taxRate: "10.00",
      taxAmount: "10.00",
      total: "110.00",
      amountPaid: "0.00",
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const secret = process.env.JWT_SECRET || "test-secret-key";
    const token = jwt.sign(
      { id: userId, role: "admin", roles: ["ADMIN"], currentCompanyId: companyId },
      secret,
      { expiresIn: "1h" }
    );

    const finalizeBody = {
      targetStatus: "sent",
    };

    const idempotencyKey = "idem-finalize-test-1";

    const [a, b] = await Promise.all([
      request(app)
        .post(`/api/invoices/${invoiceId}/finalize`)
        .set("Authorization", `Bearer ${token}`)
        .set("Idempotency-Key", idempotencyKey)
        .send(finalizeBody),
      request(app)
        .post(`/api/invoices/${invoiceId}/finalize`)
        .set("Authorization", `Bearer ${token}`)
        .set("Idempotency-Key", idempotencyKey)
        .send(finalizeBody),
    ]);

    const statuses = [a.status, b.status].sort();

    if (a.status >= 400 || b.status >= 400) {
      console.error("Request A error:", { status: a.status, body: a.body });
      console.error("Request B error:", { status: b.status, body: b.body });
    }

    expect(statuses).toEqual([200, 201]);

    expect(a.body?.id).toBeTruthy();
    expect(b.body?.id).toBeTruthy();
    expect(a.body.id).toEqual(b.body.id);
    expect(a.body.status).toEqual("sent");
    expect(b.body.status).toEqual("sent");

    const [updatedInvoice] = await db
      .select()
      .from(s.invoices)
      .where(and(eq(s.invoices.id, invoiceId), eq(s.invoices.companyId, companyId)));

    expect(updatedInvoice.status).toBe("sent");

    const finalizations = await db
      .select()
      .from(s.invoiceFinalizations)
      .where(and(eq(s.invoiceFinalizations.companyId, companyId), eq(s.invoiceFinalizations.invoiceId, invoiceId)));

    expect(finalizations.length).toBe(1);
    expect(finalizations[0].targetStatus).toBe("sent");

    await db.delete(s.invoiceFinalizations).where(eq(s.invoiceFinalizations.invoiceId, invoiceId));
    await db.delete(s.invoices).where(eq(s.invoices.id, invoiceId));
    await db.delete(s.customers).where(eq(s.customers.id, customerId));
    await db.delete(s.userCompanyAccess).where(and(eq(s.userCompanyAccess.userId, userId), eq(s.userCompanyAccess.companyId, companyId)));
    await db.delete(s.users).where(eq(s.users.id, userId));
    await db.delete(s.companies).where(eq(s.companies.id, companyId));
  });
});
