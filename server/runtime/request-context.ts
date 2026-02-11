import { AsyncLocalStorage } from "node:async_hooks";

export type RequestSecurityContext = {
  requestId?: string;
  userId?: string | null;
  tenantId?: string | null;
  companyId?: string | null;
  roles?: string[];
  scope?: "tenant" | "system";
};

const als = new AsyncLocalStorage<RequestSecurityContext>();

export function runWithRequestContext<T>(ctx: RequestSecurityContext, fn: () => T): T {
  return als.run(ctx, fn);
}

export function runWithCompanyContext<T>(companyId: string, fn: () => T): T {
  return runWithRequestContext({ tenantId: null, companyId, scope: "tenant" }, fn);
}

export function runWithTenantCompanyContext<T>(tenantId: string, companyId: string, fn: () => T): T {
  return runWithRequestContext({ tenantId, companyId, scope: "tenant" }, fn);
}

export function runAsSystem<T>(fn: () => T): T {
  return runWithRequestContext({ companyId: null, scope: "system" }, fn);
}

export function getRequestContext(): RequestSecurityContext | null {
  return als.getStore() ?? null;
}

export function requireTenantId(): string {
  const ctx = getRequestContext();
  const tenantId = ctx?.tenantId;
  if (typeof tenantId === "string" && tenantId) return tenantId;
  throw new Error("Tenant scope invariant violated: missing tenantId in request context");
}

export function requireCompanyId(): string {
  const ctx = getRequestContext();
  const companyId = ctx?.companyId;
  if (typeof companyId === "string" && companyId) return companyId;
  throw new Error("Tenant scope invariant violated: missing companyId in request context");
}

export function assertTenantScope(tenantId: string): void {
  const ctx = getRequestContext();
  const expected = ctx?.tenantId;
  if (typeof expected !== "string" || !expected) {
    throw new Error("Tenant scope invariant violated: missing tenantId in request context");
  }
  if (tenantId !== expected) {
    throw new Error("Tenant scope invariant violated: cross-tenant tenantId mismatch");
  }
}

export function assertCompanyScope(companyId: string): void {
  const ctx = getRequestContext();
  const expected = ctx?.companyId;
  if (typeof expected !== "string" || !expected) {
    throw new Error("Tenant scope invariant violated: missing companyId in request context");
  }
  if (companyId !== expected) {
    throw new Error("Tenant scope invariant violated: cross-tenant companyId mismatch");
  }
}
