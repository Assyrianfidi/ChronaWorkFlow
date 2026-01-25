import type { NextFunction, Request, Response } from "express";

import { storage } from "../storage";
import type { Role } from "./authenticate";

export type Action =
  | "owner:access"
  | "companies:read"
  | "companies:write"
  | "accounts:read"
  | "accounts:write"
  | "customers:read"
  | "customers:write"
  | "vendors:read"
  | "vendors:write"
  | "transactions:read"
  | "transactions:write"
  | "invoices:read"
  | "invoices:write"
  | "payments:write"
  | "banking:read"
  | "banking:write"
  | "reports:read"
  | "payroll:read"
  | "payroll:write"
  | "inventory:read"
  | "inventory:write"
  | "workflow:define"
  | "workflow:execute"
  | "workflow:approve"
  | "workflow:read"
  | "jobs:read"
  | "jobs:write"
  | "billing:write"
  | "ai:request";

const rolePermissions: Record<Role, Set<Action>> = {
  OWNER: new Set<Action>(["owner:access"]),
  ADMIN: new Set<Action>([
    "companies:read",
    "companies:write",
    "accounts:read",
    "accounts:write",
    "customers:read",
    "customers:write",
    "vendors:read",
    "vendors:write",
    "transactions:read",
    "transactions:write",
    "invoices:read",
    "invoices:write",
    "payments:write",
    "banking:read",
    "banking:write",
    "reports:read",
    "payroll:read",
    "payroll:write",
    "inventory:read",
    "inventory:write",
    "workflow:define",
    "workflow:execute",
    "workflow:approve",
    "workflow:read",
    "jobs:read",
    "jobs:write",
    "billing:write",
    "ai:request",
  ]),
  MANAGER: new Set<Action>([
    "companies:read",
    "customers:read",
    "customers:write",
    "vendors:read",
    "vendors:write",
    "invoices:read",
    "invoices:write",
    "payments:write",
    "reports:read",
    "inventory:read",
    "banking:read",
    "workflow:execute",
    "workflow:approve",
    "workflow:read",
    "ai:request",
  ]),
  ACCOUNTANT: new Set<Action>([
    "companies:read",
    "accounts:read",
    "transactions:read",
    "transactions:write",
    "invoices:read",
    "invoices:write",
    "payments:write",
    "banking:read",
    "banking:write",
    "reports:read",
    "workflow:execute",
    "workflow:approve",
    "workflow:read",
    "ai:request",
  ]),
  AUDITOR: new Set<Action>([
    "companies:read",
    "accounts:read",
    "customers:read",
    "vendors:read",
    "transactions:read",
    "invoices:read",
    "banking:read",
    "reports:read",
    "workflow:read",
  ]),
  INVENTORY_MANAGER: new Set<Action>([
    "companies:read",
    "inventory:read",
    "inventory:write",
    "reports:read",
    "workflow:execute",
    "workflow:read",
    "ai:request",
  ]),
  EMPLOYEE: new Set<Action>(["reports:read"]),
};

function resolveCompanyId(req: any): string | null {
  const tokenCompanyId = req.user?.currentCompanyId as string | undefined;
  if (typeof tokenCompanyId === "string" && tokenCompanyId) return tokenCompanyId;

  const q = req.query?.companyId;
  if (typeof q === "string" && q) return q;

  const bodyCompanyId =
    (req.body?.companyId as string | undefined) ??
    (req.body?.invoice?.companyId as string | undefined);
  if (typeof bodyCompanyId === "string" && bodyCompanyId) return bodyCompanyId;

  return null;
}

async function audit(event: {
  companyId: string | null;
  userId: string | null;
  action: string;
  endpoint: string;
  method: string;
  details: Record<string, any>;
}) {
  await storage.createAuditLog({
    companyId: event.companyId,
    userId: event.userId,
    action: event.action,
    entityType: "rbac",
    entityId: `${event.method} ${event.endpoint}`,
    changes: JSON.stringify(event.details),
  });
}

export function authorize(required: Action | Action[], opts?: { anyOf?: boolean }) {
  const requiredActions = Array.isArray(required) ? required : [required];
  const anyOf = opts?.anyOf ?? true;

  return async (req: Request, res: Response, next: NextFunction) => {
    const endpoint = String((req as any).originalUrl ?? req.url ?? "");
    const method = String(req.method ?? "");

    const user = (req as any).user as any;
    if (!user) {
      await audit({
        companyId: resolveCompanyId(req as any),
        userId: null,
        action: "rbac.missing_auth_context",
        endpoint,
        method,
        details: { requiredActions },
      });
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = typeof user.id === "string" ? user.id : String(user.id ?? "");
    const roles = (Array.isArray(user.roles) ? user.roles : []) as Role[];

    const isOwner = roles.includes("OWNER");

    const allowedByRole = requiredActions.map((a) =>
      roles.some((r) => rolePermissions[r]?.has(a)),
    );

    const allowed = anyOf ? allowedByRole.some(Boolean) : allowedByRole.every(Boolean);

    if (allowed) {
      return next();
    }

    if (isOwner) {
      await audit({
        companyId: resolveCompanyId(req as any),
        userId,
        action: "rbac.owner_bypass",
        endpoint,
        method,
        details: { requiredActions, roles },
      });
      return next();
    }

    await audit({
      companyId: resolveCompanyId(req as any),
      userId,
      action: "rbac.denied",
      endpoint,
      method,
      details: { requiredActions, roles },
    });

    if (requiredActions.includes("owner:access")) {
      return res.status(403).json({ error: "Owner access required" });
    }

    return res.status(403).json({ error: "Forbidden" });
  };
}

function inferAction(req: Request): Action | null {
  const path = String((req as any).path ?? req.url ?? "");
  const method = String(req.method ?? "GET").toUpperCase();

  if (path.startsWith("/api/owner")) return "owner:access";

  if (path.startsWith("/api/companies")) return method === "GET" ? "companies:read" : "companies:write";
  if (path.startsWith("/api/accounts")) return method === "GET" ? "accounts:read" : "accounts:write";
  if (path.startsWith("/api/customers")) return method === "GET" ? "customers:read" : "customers:write";
  if (path.startsWith("/api/vendors")) return method === "GET" ? "vendors:read" : "vendors:write";
  if (path.startsWith("/api/transactions")) return method === "GET" ? "transactions:read" : "transactions:write";
  if (path.startsWith("/api/invoices")) return method === "GET" ? "invoices:read" : "invoices:write";
  if (path.startsWith("/api/payments")) return "payments:write";
  if (path.startsWith("/api/bank-transactions")) return method === "GET" ? "banking:read" : "banking:write";
  if (path.startsWith("/api/reports")) return "reports:read";
  if (path.startsWith("/api/payroll")) return method === "GET" ? "payroll:read" : "payroll:write";
  if (path.startsWith("/api/inventory")) return method === "GET" ? "inventory:read" : "inventory:write";
  if (path.startsWith("/api/jobs")) return method === "GET" ? "jobs:read" : "jobs:write";
  if (path.startsWith("/api/billing/checkout")) return "billing:write";
  if (path.startsWith("/api/stripe")) return "billing:write";
  if (path.startsWith("/api/plaid")) return method === "GET" ? "banking:read" : "banking:write";
  if (path.startsWith("/api/ai")) return "ai:request";

  if (path === "/api/workflows") {
    return method === "GET" ? "workflow:read" : "workflow:define";
  }
  if (path.startsWith("/api/workflows/") && path.endsWith("/publish")) {
    return "workflow:define";
  }
  if (path === "/api/workflow-instances/start") return "workflow:execute";
  if (path.startsWith("/api/workflow-instances/") && method === "GET") return "workflow:read";
  if (path.startsWith("/api/workflow-instances/") && path.endsWith("/approve")) return "workflow:approve";
  if (path.startsWith("/api/workflow-instances/") && path.endsWith("/cancel")) return "workflow:execute";

  return null;
}

export function authorizeRequest() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const path = String((req as any).path ?? req.url ?? "");

    if (
      path === "/api/auth/register" ||
      path === "/api/auth/login" ||
      path === "/api/health" ||
      path === "/api/webhooks/stripe" ||
      path === "/api/stripe/webhooks"
      || path === "/api/plaid/webhooks"
      || path === "/api/stripe/health"
      || path === "/api/plaid/health"
    ) {
      return next();
    }

    const required = inferAction(req);
    if (!required) {
      await audit({
        companyId: resolveCompanyId(req as any),
        userId: (req as any).user?.id ?? null,
        action: "rbac.unknown_route",
        endpoint: String((req as any).originalUrl ?? req.url ?? ""),
        method: String(req.method ?? ""),
        details: { path },
      });
      return res.status(403).json({ error: "Forbidden" });
    }

    return authorize(required)(req, res, next);
  };
}
