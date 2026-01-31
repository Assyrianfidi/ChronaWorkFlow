import type { NextFunction, Request, Response } from "express";

import { storage } from "../storage";
import { enforcePlanLimits as checkPlanLimits } from "./billing-enforcement";

function fullPath(req: Request): string {
  const baseUrl = typeof (req as any).baseUrl === "string" ? String((req as any).baseUrl) : "";
  const path = typeof (req as any).path === "string" ? String((req as any).path) : "";
  return `${baseUrl}${path}`;
}

function getCompanyIdFromRequest(req: any): string | null {
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

function isWriteMethod(method: string): boolean {
  const m = method.toUpperCase();
  return m === "POST" || m === "PUT" || m === "PATCH" || m === "DELETE";
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

export function enforcePlanLimits() {
  return async function enforcePlanLimitsMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
      if (PUBLIC_PATHS.has(fullPath(req))) {
        return next();
      }

      if (!isWriteMethod(req.method)) {
        return next();
      }

      const companyId = getCompanyIdFromRequest(req as any);
      if (!companyId) {
        return next();
      }

      const roles = (req as any).user?.roles as string[] | undefined;
      const isOwner = Array.isArray(roles) && roles.includes("OWNER");
      if (isOwner) {
        await storage.createAuditLog({
          companyId,
          userId: String((req as any).user?.id ?? null),
          action: "rbac.owner_bypass",
          entityType: "plan_limit",
          entityId: `${req.method} ${String((req as any).originalUrl ?? req.url ?? "")}`,
          changes: JSON.stringify({ reason: "plan_limits" }),
        });
        return next();
      }

      const endpoint = String((req as any).originalUrl ?? req.url ?? "");

      if (req.method.toUpperCase() === "POST" && fullPath(req) === "/api/invoices") {
        const invoiceResult = await checkPlanLimits(companyId, "create_invoice");
        if ((invoiceResult as any).warnings?.length) {
          res.setHeader("x-plan-warnings", JSON.stringify((invoiceResult as any).warnings));
        }
        if (!(invoiceResult as any).allowed) {
          await storage.createAuditLog({
            companyId,
            userId: String((req as any).user?.id ?? null),
            action: "plan.limit.blocked",
            entityType: "plan_limit",
            entityId: `${req.method} ${endpoint}`,
            changes: JSON.stringify({ reason: "plan_limit_hit", action: "create_invoice", result: invoiceResult }),
          });
          return res.status(402).json({
            error: "Plan limit exceeded",
            code: (invoiceResult as any).reason,
            details: (invoiceResult as any).details,
            warnings: (invoiceResult as any).warnings ?? [],
          });
        }
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
}
