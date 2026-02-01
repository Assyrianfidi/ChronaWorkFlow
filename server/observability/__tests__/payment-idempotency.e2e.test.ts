import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import * as s from "../../../shared/schema";

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
  };
});

vi.mock("../../services/workflow.service", () => {
  return {
    startWorkflowInstance: vi.fn(async () => []),
  };
});

type DbModule = typeof import("../../db");

type SeedIds = {
  companyId: string;
  userId: string;
  customerId: string;
  invoiceId: string;
};

function parseEnvFile(absPath: string): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = fs.readFileSync(absPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

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

function resolveTestDatabaseUrl(): string | null {
  const repoRoot = process.cwd();

  const candidates: string[] = [];

  const fromProcess = [
    process.env.PAYMENT_E2E_DATABASE_URL,
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

  // IMPORTANT: do NOT auto-use .env.e2e, because it may point at a local port that isn't running.
  // If you want to run against a dedicated E2E DB, set PAYMENT_E2E_DATABASE_URL explicitly.

  // Prefer anything that already points at an accubooks database.
  for (const c of candidates) {
    if (looksLikeAccuBooksDatabaseUrl(c)) return c;
  }

  // Otherwise, derive accubooks from the first plausible local DB URL (e.g. ChronaWorkFlow dev env).
  for (const c of candidates) {
    const derived = deriveAccuBooksDatabaseUrl(c);
    if (derived) return derived;
  }

  return candidates[0] ?? null;
}

describe("payments idempotency (db-backed)", () => {
  let db: DbModule["db"];
  let pool: DbModule["pool"];
  let storage: any;
  let app: any;
  let ids: SeedIds;

  beforeAll(async () => {
    const testDbUrl = resolveTestDatabaseUrl();
    if (testDbUrl) {
      process.env.DATABASE_URL = testDbUrl;
    }

    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

    const dbMod = (await import("../../db")) as DbModule;
    db = dbMod.db;
    pool = dbMod.pool;

    let diagRow: any = null;
    try {
      const diagRes = await pool.query(
        "select current_database() as db, current_user as db_user, " +
          "to_regclass('public.companies') as companies, " +
          "to_regclass('public.users') as users, " +
          "to_regclass('public.customers') as customers, " +
          "to_regclass('public.invoices') as invoices, " +
          "to_regclass('public.payments') as payments",
      );
      diagRow = diagRes.rows?.[0] ?? null;
    } catch (err: any) {
      const extra = {
        name: err?.name,
        message: err?.message,
        code: err?.code,
        errno: err?.errno,
        syscall: err?.syscall,
        address: err?.address,
        port: err?.port,
        stack: err?.stack,
      };
      throw new Error(
        `DB preflight failed (unable to query postgres metadata). DATABASE_URL=${String(process.env.DATABASE_URL ?? "")} error=${JSON.stringify(
          extra,
        )}`,
      );
    }
    const hasSchema =
      diagRow &&
      diagRow.companies &&
      diagRow.users &&
      diagRow.customers &&
      diagRow.invoices &&
      diagRow.payments;

    if (!hasSchema) {
      throw new Error(
        `Payment idempotency E2E test requires migrated DB schema. DATABASE_URL=${String(process.env.DATABASE_URL ?? "")} diag=${JSON.stringify(
          diagRow,
        )}`,
      );
    }

    const storageMod = await import("../../storage");
    storage = storageMod.storage;

    vi.spyOn(storage, "hasUserCompanyAccess").mockResolvedValue(true);

    const appMod = await import("../../app");
    const routesMod = await import("../../routes/index");

    app = appMod.createApp();
    await routesMod.registerAllRoutes(app);

    ids = {
      companyId: crypto.randomUUID(),
      userId: crypto.randomUUID(),
      customerId: crypto.randomUUID(),
      invoiceId: crypto.randomUUID(),
    };

    const now = new Date();

    try {
      await pool.query('insert into "companies" ("id", "name") values ($1, $2)', [ids.companyId, "Test Company"]);
    } catch (err: any) {
      throw new Error(
        `Failed to seed companies. DATABASE_URL=${String(process.env.DATABASE_URL ?? "")} error=${String(err?.message ?? err)} details=${JSON.stringify(
          err,
        )}`,
      );
    }

    try {
      await pool.query(
        'insert into "users" ("id", "username", "email", "password", "role", "current_company_id") values ($1, $2, $3, $4, $5, $6)',
        [
          ids.userId,
          `user_${ids.userId.slice(0, 8)}`,
          `user_${ids.userId.slice(0, 8)}@example.com`,
          "password",
          "admin",
          ids.companyId,
        ],
      );
    } catch (err: any) {
      throw new Error(
        `Failed to seed users. DATABASE_URL=${String(process.env.DATABASE_URL ?? "")} error=${String(err?.message ?? err)} details=${JSON.stringify(
          err,
        )}`,
      );
    }

    await pool.query('insert into "customers" ("id", "company_id", "name") values ($1, $2, $3)', [
      ids.customerId,
      ids.companyId,
      "Test Customer",
    ]);

    // Minimal invoice row satisfying NOT NULL constraints (rely on defaults for created_at/updated_at).
    await pool.query(
      'insert into "invoices" ("id","company_id","customer_id","invoice_number","date","due_date","status","subtotal","tax_rate","tax_amount","total","amount_paid","created_by") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
      [
        ids.invoiceId,
        ids.companyId,
        ids.customerId,
        "INV-1",
        now,
        now,
        "draft",
        "100.00",
        "0",
        "0",
        "100.00",
        "0",
        ids.userId,
      ],
    );
  }, 30000);

  afterAll(async () => {
    try {
      await pool.query('delete from "payments" where "company_id" = $1 and "invoice_id" = $2', [ids.companyId, ids.invoiceId]);
      await pool.query('delete from "invoices" where "id" = $1', [ids.invoiceId]);
      await pool.query('delete from "customers" where "id" = $1', [ids.customerId]);
      await pool.query('delete from "user_company_access" where "user_id" = $1', [ids.userId]);
      await pool.query('delete from "users" where "id" = $1', [ids.userId]);
      await pool.query('delete from "companies" where "id" = $1', [ids.companyId]);
    } catch {
    }

    if (pool) {
      await pool.end();
    }
  }, 30000);

  it("concurrent replay: one payment write, consistent responses, invoice updated once", async () => {
    const token = jwt.sign(
      { id: ids.userId, role: "admin", roles: ["ADMIN"], currentCompanyId: ids.companyId },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" },
    );

    const paymentBody = {
      invoiceId: ids.invoiceId,
      date: new Date("2024-01-15T12:00:00.000Z").toISOString(),
      amount: "25.00",
      paymentMethod: "cash",
      notes: "test",
    };

    const idempotencyKey = "idem-test-1";

    const [a, b] = await Promise.all([
      request(app)
        .post("/api/payments")
        .set("Authorization", `Bearer ${token}`)
        .set("Idempotency-Key", idempotencyKey)
        .send(paymentBody),
      request(app)
        .post("/api/payments")
        .set("Authorization", `Bearer ${token}`)
        .set("Idempotency-Key", idempotencyKey)
        .send(paymentBody),
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

    const { and, eq } = await import("drizzle-orm");

    const payments = await db
      .select()
      .from(s.payments)
      .where(and(eq(s.payments.companyId as any, ids.companyId), eq(s.payments.invoiceId as any, ids.invoiceId)));

    expect(payments.length).toBe(1);

    const [inv] = await db
      .select()
      .from(s.invoices)
      .where(eq(s.invoices.id as any, ids.invoiceId))
      .limit(1);

    const paid = Number.parseFloat(String((inv as any)?.amountPaid ?? "0"));
    expect(paid).toBeCloseTo(25, 2);
  });
});
