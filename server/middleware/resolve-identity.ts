import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { storage } from "../storage";
import { runWithRequestContext } from "../runtime/request-context";

export type CanonicalRole =
  | "OWNER"
  | "ADMIN"
  | "MANAGER"
  | "ACCOUNTANT"
  | "AUDITOR"
  | "INVENTORY_MANAGER"
  | "EMPLOYEE";

function normalizeRole(role: unknown): CanonicalRole {
  if (typeof role !== "string") return "EMPLOYEE";
  const r = role.trim().toLowerCase();
  if (r === "owner") return "OWNER";
  if (r === "admin") return "ADMIN";
  if (r === "manager") return "MANAGER";
  if (r === "accountant") return "ACCOUNTANT";
  if (r === "auditor") return "AUDITOR";
  if (r === "inventory_manager" || r === "inventory-manager" || r === "inventory") return "INVENTORY_MANAGER";
  if (r === "employee" || r === "staff") return "EMPLOYEE";
  if (r === "user" || r === "viewer") return "EMPLOYEE";
  return "EMPLOYEE";
}

function fullPath(req: Request): string {
  const baseUrl = typeof (req as any).baseUrl === "string" ? (req as any).baseUrl : "";
  const path = typeof (req as any).path === "string" ? (req as any).path : "";
  if (baseUrl || path) return `${baseUrl}${path}`;
  return String((req as any).originalUrl ?? req.url ?? "");
}

const PUBLIC_PATHS = new Set<string>([
  "/api/auth/register",
  "/api/auth/login",
  "/api/health",
  "/api/webhooks/stripe",
  "/api/stripe/webhooks",
  "/api/plaid/webhooks",
  "/api/stripe/health",
  "/api/plaid/health",
]);

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers["authorization"];
  const token = typeof authHeader === "string" ? authHeader.split(" ")[1] : null;
  return token && token.trim() ? token.trim() : null;
}

function resolveExplicitCompanyId(req: any): string | null {
  const q = req.query?.companyId;
  if (typeof q === "string" && q) return q;

  const bodyCompanyId = (req.body?.companyId as string | undefined) ?? (req.body?.invoice?.companyId as string | undefined);
  if (typeof bodyCompanyId === "string" && bodyCompanyId) return bodyCompanyId;

  const path = fullPath(req as any);
  const m = /^\/api\/companies\/([^/?#]+)$/.exec(path);
  if (m?.[1]) return m[1];

  return null;
}

export function resolveIdentity() {
  const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET or SESSION_SECRET must be set in environment variables");
  }

  const ownerEmail = process.env.OWNER_EMAIL?.toLowerCase() ?? null;

  return async function resolveIdentityMiddleware(req: Request, res: Response, next: NextFunction) {
    const path = fullPath(req);

    if (PUBLIC_PATHS.has(path)) {
      return next();
    }

    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const data = (payload ?? {}) as any;

    const userId = typeof data.userId === "string" && data.userId ? data.userId : String(data.id ?? "");
    const email = typeof data.email === "string" ? data.email : undefined;

    const rolesRaw = Array.isArray(data.roles) ? data.roles : (typeof data.role === "string" ? [data.role] : []);
    const roles = Array.from(
      new Set<CanonicalRole>(
        rolesRaw
          .filter((r: unknown): r is string => typeof r === "string")
          .map((r: string) => normalizeRole(r))
      )
    );

    const ownerVerified = Boolean(data.ownerVerified);
    const ownerEmailMatches = !!ownerEmail ? email?.toLowerCase() === ownerEmail : false;
    const isOwner = roles.includes("OWNER") && ownerVerified && ownerEmailMatches;
    const effectiveRoles = isOwner ? roles : roles.filter((r) => r !== "OWNER");

    if (path.startsWith("/api/owner")) {
      if (!isOwner) {
        return res.status(403).json({ error: "Owner access required" });
      }

      (req as any).user = {
        id: userId,
        email,
        role: typeof data.role === "string" ? data.role : undefined,
        roles: effectiveRoles,
        tenantId: null,
        companyId: null,
        currentTenantId: null,
        currentCompanyId: null,
        ownerVerified: true,
      };

      return runWithRequestContext(
        {
          requestId: (req as any).requestId,
          userId,
          tenantId: null,
          companyId: null,
          roles: effectiveRoles as unknown as string[],
          scope: "system",
        },
        () => next(),
      );
    }

    const tenantId = typeof data.tenantId === "string" ? data.tenantId : null;
    const companyId = typeof data.companyId === "string" ? data.companyId : (typeof data.currentCompanyId === "string" ? data.currentCompanyId : null);

    if (!userId || !tenantId || !companyId || effectiveRoles.length === 0) {
      return res.status(401).json({ error: "Invalid identity token" });
    }

    const explicitCompanyId = resolveExplicitCompanyId(req as any);
    if (explicitCompanyId && explicitCompanyId !== companyId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    try {
      const tenantOk = await storage.hasUserTenantAccess(userId, tenantId);
      if (!tenantOk) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const companyInTenant = await storage.isCompanyInTenant(tenantId, companyId);
      if (!companyInTenant) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const hasCompanyAccess = await storage.hasUserCompanyAccess(userId, companyId);
      if (!hasCompanyAccess) {
        return res.status(403).json({ error: "Forbidden" });
      }
    } catch (err) {
      return next(err);
    }

    (req as any).user = {
      ...(data as any),
      id: userId,
      email,
      role: typeof data.role === "string" ? data.role : undefined,
      roles: effectiveRoles,
      tenantId,
      currentTenantId: tenantId,
      companyId,
      currentCompanyId: companyId,
      ownerVerified: isOwner,
    };

    return runWithRequestContext(
      {
        requestId: (req as any).requestId,
        userId,
        tenantId,
        companyId,
        roles: effectiveRoles as unknown as string[],
        scope: "tenant",
      },
      () => next(),
    );
  };
}
