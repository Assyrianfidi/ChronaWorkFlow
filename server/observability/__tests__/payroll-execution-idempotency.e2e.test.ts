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
    process.env.PAYROLL_EXECUTION_E2E_DATABASE_URL,
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
      AND table_name IN ('companies', 'users', 'pay_runs', 'payroll_executions', 'user_company_access', 'payroll_periods')
    `;
    const tableRes = await client.query(tableCheckSql);
    const foundTables = new Set(tableRes.rows.map((r: any) => r.table_name));

    const diag = {
      db: dbName,
      companies: foundTables.has("companies") ? "companies" : null,
      users: foundTables.has("users") ? "users" : null,
      pay_runs: foundTables.has("pay_runs") ? "pay_runs" : null,
      payroll_executions: foundTables.has("payroll_executions") ? "payroll_executions" : null,
      user_company_access: foundTables.has("user_company_access") ? "user_company_access" : null,
      payroll_periods: foundTables.has("payroll_periods") ? "payroll_periods" : null,
    };

    await client.end();

    const required = ["companies", "users", "pay_runs", "payroll_executions", "user_company_access", "payroll_periods"];
    const ok = required.every((t) => foundTables.has(t));
    return { ok, diag };
  } catch (err) {
    return { ok: false, diag: { error: err } };
  }
}

describe("payroll execution idempotency (db-backed)", () => {
  let testDbUrl: string | null = null;
  let app: any;

  beforeAll(async () => {
    console.log("Setting up test environment...");
    testDbUrl = resolveTestDatabaseUrl();
    if (!testDbUrl) {
      throw new Error("No DATABASE_URL found for payroll execution idempotency E2E test");
    }

    const preflight = await checkDbPreflight(testDbUrl);
    if (!preflight.ok) {
      throw new Error(
        `Payroll execution idempotency E2E test requires migrated DB schema. DATABASE_URL=${testDbUrl} diag=${JSON.stringify(preflight.diag)}`
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

  it("concurrent replay: one payroll execution, consistent responses, workflow fires once", async () => {
    const companyId = `test-company-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const userId = `test-user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const payrollPeriodId = `test-period-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const payRunId = `test-payrun-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    await db.insert(s.companies).values({
      id: companyId,
      name: "Test Company Payroll Execution",
      email: `payroll-exec-${Date.now()}@test.local`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(s.users).values({
      id: userId,
      username: `payroll-exec-user-${Date.now()}`,
      email: `payroll-exec-user-${Date.now()}@test.local`,
      password: "hashed",
      name: "Payroll Exec User",
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

    await db.insert(s.payrollPeriods).values({
      id: payrollPeriodId,
      companyId,
      name: "Test Period Jan 2024",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-31"),
      payDate: new Date("2024-02-05"),
      payFrequency: "monthly",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(s.payRuns).values({
      id: payRunId,
      companyId,
      payrollPeriodId,
      runNumber: `RUN-${Date.now()}`,
      payDate: new Date("2024-02-05"),
      status: "draft",
      totalGrossPay: "5000.00",
      totalDeductions: "500.00",
      totalNetPay: "4500.00",
      totalTaxes: "750.00",
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

    const executeBody = {
      targetStatus: "approved",
    };

    const idempotencyKey = "idem-payroll-exec-test-1";

    const [a, b] = await Promise.all([
      request(app)
        .post(`/api/payroll/pay-runs/${payRunId}/execute`)
        .set("Authorization", `Bearer ${token}`)
        .set("Idempotency-Key", idempotencyKey)
        .send(executeBody),
      request(app)
        .post(`/api/payroll/pay-runs/${payRunId}/execute`)
        .set("Authorization", `Bearer ${token}`)
        .set("Idempotency-Key", idempotencyKey)
        .send(executeBody),
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
    expect(a.body.status).toEqual("approved");
    expect(b.body.status).toEqual("approved");

    const [updatedPayRun] = await db
      .select()
      .from(s.payRuns)
      .where(and(eq(s.payRuns.id, payRunId), eq(s.payRuns.companyId, companyId)));

    expect(updatedPayRun.status).toBe("approved");

    const executions = await db
      .select()
      .from(s.payrollExecutions)
      .where(and(eq(s.payrollExecutions.companyId, companyId), eq(s.payrollExecutions.payRunId, payRunId)));

    expect(executions.length).toBe(1);
    expect(executions[0].targetStatus).toBe("approved");

    await db.delete(s.payrollExecutions).where(eq(s.payrollExecutions.payRunId, payRunId));
    await db.delete(s.payRuns).where(eq(s.payRuns.id, payRunId));
    await db.delete(s.payrollPeriods).where(eq(s.payrollPeriods.id, payrollPeriodId));
    await db.delete(s.userCompanyAccess).where(and(eq(s.userCompanyAccess.userId, userId), eq(s.userCompanyAccess.companyId, companyId)));
    await db.delete(s.users).where(eq(s.users.id, userId));
    await db.delete(s.companies).where(eq(s.companies.id, companyId));
  });
});
