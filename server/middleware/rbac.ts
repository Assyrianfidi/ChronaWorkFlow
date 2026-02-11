import type { Request, Response, NextFunction } from "express";
import { hasPermission, type Permission, type Role } from "../auth/permissions";
import { storage } from "../storage";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    companyId?: string;
    role: string;
    email: string;
  };
}

/**
 * RBAC Middleware - Require specific permission to access endpoint
 */
export function requirePermission(permission: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      
      if (!authReq.user) {
        return res.status(401).json({ 
          error: "Not authenticated",
          code: "AUTH_REQUIRED"
        });
      }

      const role = authReq.user.role.toUpperCase() as Role;
      
      if (!hasPermission(role, permission)) {
        // Log permission denial for audit
        const companyId = authReq.user.companyId || (req.query.companyId as string) || (req.body?.companyId as string);
        
        if (companyId) {
          try {
            await storage.createAuditLog({
              companyId,
              userId: authReq.user.id,
              action: "permission.denied",
              entityType: "permission",
              entityId: permission,
              changes: JSON.stringify({
                permission,
                role,
                endpoint: req.path,
                method: req.method,
              }),
            });
          } catch (auditError) {
            console.error("Failed to log permission denial:", auditError);
          }
        }

        return res.status(403).json({
          error: "Permission denied",
          code: "PERMISSION_DENIED",
          required: permission,
          userRole: role,
        });
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
}

/**
 * Require write permission for a specific resource
 */
export function requireWrite(resource: string) {
  return requirePermission(`write:${resource}` as Permission);
}

/**
 * Require read permission for a specific resource
 */
export function requireRead(resource: string) {
  return requirePermission(`read:${resource}` as Permission);
}

/**
 * Require OWNER role
 */
export function requireOwner() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      
      if (!authReq.user) {
        return res.status(401).json({ 
          error: "Not authenticated",
          code: "AUTH_REQUIRED"
        });
      }

      const role = authReq.user.role.toUpperCase();
      
      if (role !== "OWNER") {
        return res.status(403).json({
          error: "Owner access required",
          code: "OWNER_REQUIRED",
          userRole: role,
        });
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
}

/**
 * Require one of multiple permissions (OR logic)
 */
export function requireAnyPermission(...permissions: Permission[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      
      if (!authReq.user) {
        return res.status(401).json({ 
          error: "Not authenticated",
          code: "AUTH_REQUIRED"
        });
      }

      const role = authReq.user.role.toUpperCase() as Role;
      
      const hasAny = permissions.some(permission => hasPermission(role, permission));
      
      if (!hasAny) {
        return res.status(403).json({
          error: "Permission denied",
          code: "PERMISSION_DENIED",
          required: permissions,
          userRole: role,
        });
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
}
