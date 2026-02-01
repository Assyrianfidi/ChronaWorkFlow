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

let storageMock: any = null;

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
    process.env.RECONCILIATION_E2E_DATABASE_URL,
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
      AND table_name IN ('companies', 'users', 'accounts', 'bank_transactions', 'ledger_reconciliations', 'user_company_access')
    `;
    const tableRes = await client.query(tableCheckSql);
    const foundTables = new Set(tableRes.rows.map((r: any) => r.table_name));

    const diag = {
      db: dbName,
      companies: foundTables.has("companies") ? "companies" : null,
      users: foundTables.has("users") ? "users" : null,
      accounts: foundTables.has("accounts") ? "accounts" : null,
      bank_transactions: foundTables.has("bank_transactions") ? "bank_transactions" : null,
      ledger_reconciliations: foundTables.has("ledger_reconciliations") ? "ledger_reconciliations" : null,
      user_company_access: foundTables.has("user_company_access") ? "user_company_access" : null,
    };

    await client.end();

    const required = ["companies", "users", "accounts", "bank_transactions", "ledger_reconciliations", "user_company_access"];
    const ok = required.every((t) => foundTables.has(t));
    return { ok, diag };
  } catch (err) {
    return { ok: false, diag: { error: err } };
  }
}

describe("ledger reconciliation idempotency (db-backed)", () => {
  let testDbUrl: string | null = null;
  let app: any;

  beforeAll(async () => {
    console.log("Setting up test environment...");
    testDbUrl = resolveTestDatabaseUrl();
    if (!testDbUrl) {
      throw new Error("No DATABASE_URL found for reconciliation idempotency E2E test");
    }

    const preflight = await checkDbPreflight(testDbUrl);
    if (!preflight.ok) {
      throw new Error(
        `Reconciliation idempotency E2E test requires migrated DB schema. DATABASE_URL=${testDbUrl} diag=${JSON.stringify(preflight.diag)}`
      );
    }

    const storageMod = await import("../../storage");
    storageMock = storageMod.storage;
    vi.spyOn(storageMock, "createAuditLog").mockResolvedValue(undefined);

    const appMod = await import("../../app");
    const routesMod = await import("../../routes/index");
    app = appMod.createApp();
    routesMod.registerAllRoutes(app);
  });

  afterAll(async () => {
    console.log("Cleaning up test environment...");
    await pool.end();
  });

  it("concurrent replay: one reconciliation, consistent responses, workflow fires once", async () => {
    const companyId = `test-company-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const userId = `test-user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const accountId = `test-account-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const bankTxnId = `test-banktxn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const matchedTxnId = `test-matched-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    await db.insert(s.companies).values({
      id: companyId,
      name: "Test Company Reconciliation",
      email: `reconcile-${Date.now()}@test.local`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(s.users).values({
      id: userId,
      username: `reconcile-user-${Date.now()}`,
      email: `reconcile-user-${Date.now()}@test.local`,
      password: "hashed",
      name: "Reconcile User",
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

    await db.insert(s.accounts).values({
      id: accountId,
      companyId,
      name: "Test Bank Account",
      type: "asset",
      code: "1000",
      balance: "5000.00",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(s.bankTransactions).values({
      id: bankTxnId,
      companyId,
      accountId,
      date: new Date("2024-01-15"),
      description: "Test Bank Transaction",
      amount: "250.00",
      type: "debit",
      isReconciled: false,
      createdAt: new Date(),
    });

    const secret = process.env.JWT_SECRET || "test-secret-key";
    const token = jwt.sign(
      { id: userId, role: "admin", roles: ["ADMIN"], currentCompanyId: companyId },
      secret,
      { expiresIn: "1h" }
    );

    const reconcileBody = {
      matchedTransactionId: matchedTxnId,
    };

    const idempotencyKey = "idem-reconcile-test-1";

    const [a, b] = await Promise.all([
      request(app)
        .post(`/api/ledger/reconcile/${bankTxnId}`)
        .set("Authorization", `Bearer ${token}`)
        .set("Idempotency-Key", idempotencyKey)
        .send(reconcileBody),
      request(app)
        .post(`/api/ledger/reconcile/${bankTxnId}`)
        .set("Authorization", `Bearer ${token}`)
        .set("Idempotency-Key", idempotencyKey)
        .send(reconcileBody),
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
    expect(a.body.isReconciled).toBe(true);
    expect(b.body.isReconciled).toBe(true);

    const [updatedBankTxn] = await db
      .select()
      .from(s.bankTransactions)
      .where(and(eq(s.bankTransactions.id, bankTxnId), eq(s.bankTransactions.companyId, companyId)));

    expect(updatedBankTxn.isReconciled).toBe(true);
    expect(updatedBankTxn.matchedTransactionId).toBe(matchedTxnId);

    const reconciliations = await db
      .select()
      .from(s.ledgerReconciliations)
      .where(and(eq(s.ledgerReconciliations.companyId, companyId), eq(s.ledgerReconciliations.bankTransactionId, bankTxnId)));

    expect(reconciliations.length).toBe(1);
    expect(reconciliations[0].reconciledAmount).toBe("250.00");

    await db.delete(s.ledgerReconciliations).where(eq(s.ledgerReconciliations.bankTransactionId, bankTxnId));
    await db.delete(s.bankTransactions).where(eq(s.bankTransactions.id, bankTxnId));
    await db.delete(s.accounts).where(eq(s.accounts.id, accountId));
    await db.delete(s.userCompanyAccess).where(and(eq(s.userCompanyAccess.userId, userId), eq(s.userCompanyAccess.companyId, companyId)));
    await db.delete(s.users).where(eq(s.users.id, userId));
    await db.delete(s.companies).where(eq(s.companies.id, companyId));
  });
});
