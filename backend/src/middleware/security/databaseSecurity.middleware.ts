import { NextFunction, Request, Response } from "express";
import DatabaseSecurityService from "../../services/databaseSecurity.service.js";

const SENSITIVE_FIELDS = new Set([
  "password",
  "email",
  "phone",
  "salary",
  "ssn",
  "bankAccount",
]);

export function requireDatabasePermission(resource: string, action: string) {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const allowed = DatabaseSecurityService.hasPermission(
      req.user,
      resource,
      action,
      {
        companyId: req.user.currentCompanyId,
      },
    );

    if (!allowed) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next();
  };
}

export function validateDatabaseConstraints(model: string, action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = (DatabaseSecurityService as any).validateConstraints(
        model,
        (req as any).body || {},
        action,
      );

      if (!result?.isValid) {
        return res.status(400).json({
          error: "Validation failed",
          errors: result?.errors || [],
        });
      }

      return next();
    } catch (e: any) {
      return res.status(400).json({ error: e?.message || "Validation failed" });
    }
  };
}

export function validateSensitiveFieldAccess(
  req: any,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const body = (req.body || {}) as Record<string, any>;
  for (const key of Object.keys(body)) {
    if (!SENSITIVE_FIELDS.has(key)) continue;

    const canAccess = DatabaseSecurityService.canAccessSensitiveField(req.user, key);
    if (!canAccess) {
      return res.status(403).json({
        error: "Forbidden",
        field: key,
      });
    }
  }

  return next();
}

function stripSensitive(obj: any, user: any): any {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((v: any) => stripSensitive(v, user));
  }

  const next: any = { ...obj };
  for (const key of Object.keys(next)) {
    if (SENSITIVE_FIELDS.has(key)) {
      const canAccess = DatabaseSecurityService.canAccessSensitiveField(user, key);
      if (!canAccess) {
        delete next[key];
      }
    } else {
      next[key] = stripSensitive(next[key], user);
    }
  }

  return next;
}

export function filterSensitiveResponseData(
  req: any,
  res: Response,
  next: NextFunction,
) {
  const originalJson = res.json;

  (res as any).json = (body: any) => {
    try {
      if (req.user) {
        return originalJson(stripSensitive(body, req.user));
      }
      return originalJson(body);
    } catch {
      return originalJson(body);
    }
  };

  next();
}
