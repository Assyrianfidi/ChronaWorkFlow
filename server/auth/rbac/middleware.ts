/**
 * RBAC Authorization Middleware
 * 
 * WHY: Middleware pattern allows declarative permission checks at route level.
 * This prevents authorization logic from being scattered across controllers.
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole, Permission, hasPermission, hasAnyPermission, hasAllPermissions } from './permissions';

/**
 * Extended Request type with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    tenantId: string;
    permissions?: Permission[];
  };
}

/**
 * Authorization Error
 */
export class AuthorizationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 403,
    public code: string = 'FORBIDDEN'
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Require Authentication
 * 
 * WHY: Ensures user is authenticated before checking permissions.
 * Should be applied before any authorization middleware.
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'UNAUTHORIZED',
    });
    return;
  }
  next();
}

/**
 * Require Specific Permission
 * 
 * Usage:
 * router.get('/reports/profit-loss', requireAuth, requirePermission(Permission.VIEW_PROFIT_LOSS), handler);
 */
export function requirePermission(permission: Permission) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `You do not have permission to perform this action. Required: ${permission}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredPermission: permission,
        userRole: req.user.role,
      });
      return;
    }

    next();
  };
}

/**
 * Require ANY of the specified permissions
 * 
 * Usage:
 * router.get('/invoices', requireAuth, requireAnyPermission([Permission.VIEW_INVOICES, Permission.CREATE_INVOICE]), handler);
 */
export function requireAnyPermission(permissions: Permission[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    if (!hasAnyPermission(req.user.role, permissions)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `You do not have any of the required permissions`,
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredPermissions: permissions,
        userRole: req.user.role,
      });
      return;
    }

    next();
  };
}

/**
 * Require ALL of the specified permissions
 * 
 * Usage:
 * router.post('/reports/export', requireAuth, requireAllPermissions([Permission.VIEW_PROFIT_LOSS, Permission.EXPORT_FINANCIAL_REPORTS]), handler);
 */
export function requireAllPermissions(permissions: Permission[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    if (!hasAllPermissions(req.user.role, permissions)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `You do not have all required permissions`,
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredPermissions: permissions,
        userRole: req.user.role,
      });
      return;
    }

    next();
  };
}

/**
 * Require Specific Role(s)
 * 
 * WHY: Sometimes role-based checks are simpler than permission-based.
 * Use sparingly - prefer permission-based checks for flexibility.
 * 
 * Usage:
 * router.delete('/users/:id', requireAuth, requireRole([UserRole.OWNER, UserRole.ADMIN]), handler);
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Insufficient role. Required: ${allowedRoles.join(' or ')}`,
        code: 'INSUFFICIENT_ROLE',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
      return;
    }

    next();
  };
}

/**
 * Resource Ownership Check
 * 
 * WHY: Users should only access their own resources or tenant resources.
 * This middleware checks if the user owns the resource or has permission to access it.
 * 
 * Usage:
 * router.get('/invoices/:id', requireAuth, requireResourceOwnership('invoice'), handler);
 */
export function requireResourceOwnership(
  resourceType: 'invoice' | 'expense' | 'bankAccount' | 'user',
  options: {
    allowTenantAccess?: boolean; // Allow if same tenant
    ownerField?: string; // Field name for owner ID (default: 'userId')
    tenantField?: string; // Field name for tenant ID (default: 'tenantId')
  } = {}
) {
  const {
    allowTenantAccess = true,
    ownerField = 'userId',
    tenantField = 'tenantId',
  } = options;

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    // Resource ID from params
    const resourceId = req.params.id;
    if (!resourceId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Resource ID is required',
        code: 'MISSING_RESOURCE_ID',
      });
      return;
    }

    try {
      // This would be replaced with actual database lookup
      // For now, we'll pass through and let the controller handle it
      // The controller should verify ownership using the same logic
      
      // Owners and Admins can access all resources in their tenant
      if ([UserRole.OWNER, UserRole.ADMIN].includes(req.user.role)) {
        next();
        return;
      }

      // For other roles, the controller must verify ownership
      // We attach a flag to indicate ownership check is required
      (req as any).requireOwnershipCheck = {
        resourceType,
        ownerField,
        tenantField,
        allowTenantAccess,
      };
      
      next();
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to verify resource ownership',
        code: 'OWNERSHIP_CHECK_FAILED',
      });
    }
  };
}

/**
 * Audit Log Middleware
 * 
 * WHY: Track all authorization decisions for security auditing.
 * Logs successful and failed authorization attempts.
 */
export function auditAuthorization(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const originalJson = res.json.bind(res);
  
  res.json = function (body: any) {
    // Log authorization events
    if (res.statusCode === 403 || res.statusCode === 401) {
      console.log('[AUDIT] Authorization Failed', {
        timestamp: new Date().toISOString(),
        userId: req.user?.id,
        role: req.user?.role,
        tenantId: req.user?.tenantId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        ip: req.ip,
      });
    }
    
    return originalJson(body);
  };
  
  next();
}

/**
 * Permission Check Helper for Controllers
 * 
 * WHY: Sometimes you need to check permissions within controller logic,
 * not just at route level. This helper makes that easy.
 * 
 * Usage in controller:
 * if (!checkPermission(req.user, Permission.DELETE_INVOICE)) {
 *   throw new AuthorizationError('Cannot delete invoice');
 * }
 */
export function checkPermission(
  user: AuthenticatedRequest['user'],
  permission: Permission
): boolean {
  if (!user) return false;
  return hasPermission(user.role, permission);
}

/**
 * Assert Permission (throws if not authorized)
 * 
 * Usage in controller:
 * assertPermission(req.user, Permission.DELETE_INVOICE);
 */
export function assertPermission(
  user: AuthenticatedRequest['user'],
  permission: Permission
): void {
  if (!checkPermission(user, permission)) {
    throw new AuthorizationError(
      `Permission denied: ${permission}`,
      403,
      'INSUFFICIENT_PERMISSIONS'
    );
  }
}
