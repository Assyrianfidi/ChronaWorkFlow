import type { NextFunction, Request, Response } from "express";

import { storage } from "../storage";
import { getBillingEnforcementMode } from "./billing-enforcement";

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

export function enforceBillingStatus() {
  return async function enforceBillingStatusMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
      if (PUBLIC_PATHS.has(fullPath(req))) {
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
          entityType: "billing_status",
          entityId: `${req.method} ${String((req as any).originalUrl ?? req.url ?? "")}`,
          changes: JSON.stringify({ reason: "billing_status" }),
        });
        return next();
      }

      const { mode, subscription } = await getBillingEnforcementMode(companyId);

      if (mode === "ok") {
        return next();
      }

      if (mode === "warn_past_due") {
        res.setHeader("x-billing-status", "past_due");
        await storage.createAuditLog({
          companyId,
          userId: String((req as any).user?.id ?? null),
          action: "billing.enforcement",
          entityType: "billing_status",
          entityId: `${req.method} ${String((req as any).originalUrl ?? req.url ?? "")}`,
          changes: JSON.stringify({ reason: "past_due", mode }),
        });
        return next();
      }

      if (mode === "read_only" && isWriteMethod(req.method)) {
        res.setHeader("x-billing-status", "read_only");
        await storage.createAuditLog({
          companyId,
          userId: String((req as any).user?.id ?? null),
          action: "billing.enforcement.blocked",
          entityType: "billing_status",
          entityId: `${req.method} ${String((req as any).originalUrl ?? req.url ?? "")}`,
          changes: JSON.stringify({ reason: "past_due", mode }),
        });
        return res.status(402).json({
          error: "Billing is past due. Account is in read-only mode.",
          code: "BILLING_READ_ONLY",
          companyId,
          subscriptionId: subscription?.id ?? null,
        });
      }

      if (mode === "suspended") {
        res.setHeader("x-billing-status", "suspended");
        await storage.createAuditLog({
          companyId,
          userId: String((req as any).user?.id ?? null),
          action: "billing.enforcement.blocked",
          entityType: "billing_status",
          entityId: `${req.method} ${String((req as any).originalUrl ?? req.url ?? "")}`,
          changes: JSON.stringify({ reason: "past_due", mode }),
        });
        return res.status(402).json({
          error: "Billing is past due. Account is suspended.",
          code: "BILLING_SUSPENDED",
          companyId,
          subscriptionId: subscription?.id ?? null,
        });
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
}
