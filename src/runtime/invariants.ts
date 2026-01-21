import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

export type RuntimeInvariantCode =
  | "ENV_INVALID"
  | "GOVERNANCE_LOCK_MISSING"
  | "DB_MIGRATIONS_MISSING"
  | "RBAC_ROLE_UNKNOWN"
  | "API_VERSION_HEADER_MISSING"
  | "API_VERSION_MISMATCH";

export class RuntimeInvariantViolation extends Error {
  public readonly code: RuntimeInvariantCode;
  public readonly details?: Record<string, unknown>;

  constructor(code: RuntimeInvariantCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "RuntimeInvariantViolation";
    this.code = code;
    this.details = details;
  }
}

export function isProduction(): boolean {
  return (process.env.NODE_ENV || "").toLowerCase() === "production";
}

export function allowDevRelaxations(): boolean {
  const env = (process.env.NODE_ENV || "").toLowerCase();
  if (env === "production") return false;
  return String(process.env.ALLOW_DEV_RELAXATIONS || "").toLowerCase() === "true";
}

export function invariant(condition: unknown, code: RuntimeInvariantCode, message: string, details?: Record<string, unknown>): asserts condition {
  if (!condition) {
    throw new RuntimeInvariantViolation(code, message, details);
  }
}

export const runtimeEnvSchema = z
  .object({
    NODE_ENV: z.string().optional(),
    PORT: z.coerce.number().int().positive().optional(),

    DATABASE_URL: z.string().min(1),

    JWT_SECRET: z.string().min(1),

    LOG_LEVEL: z.string().optional(),

    ALLOW_DEV_RELAXATIONS: z.string().optional(),
  })
  .passthrough();

export type RuntimeEnv = z.infer<typeof runtimeEnvSchema>;

function getRepoRootFromHere(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.resolve(__dirname, "..", "..");
}

export function getRepoRoot(): string {
  return process.env.REPO_ROOT ? path.resolve(process.env.REPO_ROOT) : getRepoRootFromHere();
}

export function validateRuntimeEnvOrThrow(): RuntimeEnv {
  const parsed = runtimeEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new RuntimeInvariantViolation(
      "ENV_INVALID",
      "Runtime environment validation failed.",
      { issues: parsed.error.issues },
    );
  }
  return parsed.data;
}

export function assertGovernanceLocksPresentOrThrow(repoRoot: string): void {
  const required = [
    path.join(repoRoot, "governance", "contract-lock.json"),
    path.join(repoRoot, "governance", "contract-lock.v1.json"),
    path.join(repoRoot, "governance", "contract-lock.v2.json"),
    path.join(repoRoot, "governance", "deprecations.json"),
  ];

  const missing = required.filter((p) => !fs.existsSync(p));
  invariant(
    missing.length === 0,
    "GOVERNANCE_LOCK_MISSING",
    "Missing required governance lock files.",
    { missing: missing.map((p) => path.relative(repoRoot, p).replace(/\\/g, "/")) },
  );
}

export function loadGovernedRolesFromLocks(repoRoot: string): Set<string> {
  const lockPath = path.join(repoRoot, "governance", "contract-lock.v1.json");
  if (!fs.existsSync(lockPath)) return new Set();

  const text = fs.readFileSync(lockPath, "utf8");
  const json = JSON.parse(text);
  const roles = (json && json.snapshot && json.snapshot.enums && json.snapshot.enums.prismaRole) || [];
  return new Set(Array.isArray(roles) ? roles.map(String) : []);
}

export function assertRoleIsGovernedOrThrow(role: string, governedRoles: Set<string>): void {
  invariant(
    governedRoles.has(role),
    "RBAC_ROLE_UNKNOWN",
    `Unknown RBAC role encountered at runtime: '${role}'.`,
    { role, governedRoles: Array.from(governedRoles).sort() },
  );
}

export function requireApiVersionHeaderOrThrow(opts: { expected: "v1" | "v2"; headerName?: string; actual?: string | undefined }): void {
  const headerName = opts.headerName || "x-api-version";
  const actual = (opts.actual || "").trim();

  invariant(
    actual.length > 0,
    "API_VERSION_HEADER_MISSING",
    `Missing required API version header '${headerName}'.`,
    { headerName, expected: opts.expected },
  );

  invariant(
    actual === opts.expected,
    "API_VERSION_MISMATCH",
    `API version header mismatch for '${headerName}'. Expected '${opts.expected}', got '${actual}'.`,
    { headerName, expected: opts.expected, actual },
  );
}

export async function assertPrismaMigrationsAppliedOrThrow(): Promise<void> {
  const { Client } = await import("pg");
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const r = await client.query("SELECT to_regclass('public._prisma_migrations') AS exists;");
    const exists = r.rows?.[0]?.exists;
    invariant(
      !!exists,
      "DB_MIGRATIONS_MISSING",
      "Prisma migrations table is missing. Migrations must be applied before boot.",
      { table: "public._prisma_migrations" },
    );
  } finally {
    await client.end();
  }
}

export async function validateStartupOrThrow(): Promise<{ repoRoot: string; env: RuntimeEnv; governedRoles: Set<string> }> {
  const env = validateRuntimeEnvOrThrow();
  const repoRoot = getRepoRoot();

  if (isProduction()) {
    assertGovernanceLocksPresentOrThrow(repoRoot);
    await assertPrismaMigrationsAppliedOrThrow();
  } else {
    if (!allowDevRelaxations()) {
      assertGovernanceLocksPresentOrThrow(repoRoot);
    }
  }

  const governedRoles = loadGovernedRolesFromLocks(repoRoot);
  return { repoRoot, env, governedRoles };
}

let runtimeGovernedRoles: Set<string> | null = null;

export function setRuntimeGovernedRoles(roles: Set<string>): void {
  runtimeGovernedRoles = new Set(roles);
}

export function getRuntimeGovernedRoles(): Set<string> {
  return runtimeGovernedRoles ? new Set(runtimeGovernedRoles) : new Set();
}
