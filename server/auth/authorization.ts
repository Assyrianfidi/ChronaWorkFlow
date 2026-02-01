// Authorization Middleware for Express.js
// Enforces RBAC permissions at the API layer

import { Request, Response, NextFunction } from 'express';
import { rbacService, Permission, UserRole } from './rbac.js';
import { logger } from '../utils/structured-logger.js';

export interface AuthenticatedRequest extends Request {
  user?: any;
  authContext?: any;
}

export interface AuthorizationOptions {
  permissions?: Permission[];
  requireAny?: boolean; // true: any permission, false: all permissions
  requireCompany?: boolean; // require company access
  allowSelf?: boolean; // allow users to access their own resources
  resourceOwnerField?: string; // field name for resource owner ID
}

// Authorization middleware factory
export function requireAuthorization(options: AuthorizationOptions = {}) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authContext = rbacService.getAuthContext(req);
    
    if (!authContext) {
      logger.warn('Unauthorized access attempt - no auth context', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method
      });
      
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    req.authContext = authContext;

    // Check self-access if allowed (check this first)
    if (options.allowSelf && options.resourceOwnerField) {
      const resourceOwnerId = req.params[options.resourceOwnerField] || 
                             req.body[options.resourceOwnerField] || 
                             req.query[options.resourceOwnerField];

      if (resourceOwnerId && resourceOwnerId === authContext.user.id) {
        // User is accessing their own resource, allow access
        logger.debug('Self-access allowed', {
          userId: authContext.user.id,
          resourceOwnerId,
          path: req.path,
          method: req.method,
          correlationId: authContext.correlationId
        });
        return next();
      } else if (resourceOwnerId && resourceOwnerId !== authContext.user.id) {
        // User is trying to access another user's resource, check permissions
        if (!options.permissions || !rbacService.hasAnyPermission(authContext.user, options.permissions)) {
          logger.warn('Access denied - self-access violation', {
            userId: authContext.user.id,
            resourceOwnerId,
            path: req.path,
            method: req.method,
            correlationId: authContext.correlationId
          });

          return res.status(403).json({
            error: 'Forbidden',
            message: 'Cannot access this resource',
            code: 'SELF_ACCESS_DENIED'
          });
        }
      }
    }

    // Check permissions if specified (for non-self-access cases)
    if (options.permissions && options.permissions.length > 0) {
      const hasPermission = options.requireAny
        ? rbacService.hasAnyPermission(authContext.user, options.permissions)
        : rbacService.hasAllPermissions(authContext.user, options.permissions);

      if (!hasPermission) {
        logger.warn('Access denied - insufficient permissions', {
          userId: authContext.user.id,
          userRole: authContext.user.role,
          requiredPermissions: options.permissions,
          userPermissions: authContext.permissions,
          path: req.path,
          method: req.method,
          correlationId: authContext.correlationId
        });

        return res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: options.permissions
        });
      }
    }

    // Check company access if required
    if (options.requireCompany) {
      const companyId = req.params.companyId || req.body.companyId || req.query.companyId;
      
      if (!companyId) {
        logger.warn('Access denied - company ID required', {
          userId: authContext.user.id,
          path: req.path,
          method: req.method,
          correlationId: authContext.correlationId
        });

        return res.status(400).json({
          error: 'Bad Request',
          message: 'Company ID required',
          code: 'COMPANY_ID_REQUIRED'
        });
      }

      if (!rbacService.canAccessCompany(authContext.user, companyId)) {
        logger.warn('Access denied - company access violation', {
          userId: authContext.user.id,
          userCompanyId: authContext.user.companyId,
          requestedCompanyId: companyId,
          path: req.path,
          method: req.method,
          correlationId: authContext.correlationId
        });

        return res.status(403).json({
          error: 'Forbidden',
          message: 'Cannot access this company',
          code: 'COMPANY_ACCESS_DENIED'
        });
      }
    }

    logger.debug('Authorization successful', {
      userId: authContext.user.id,
      userRole: authContext.user.role,
      path: req.path,
      method: req.method,
      correlationId: authContext.correlationId
    });

    next();
  };
}

// Convenience middleware factories for common authorization patterns
export const requireAdmin = requireAuthorization({
  permissions: [Permission.SYSTEM_ADMIN]
});

export const requireUserManagement = requireAuthorization({
  permissions: [Permission.USER_ADMIN]
});

export const requireFinancialAccess = requireAuthorization({
  permissions: [Permission.FINANCIAL_READ],
  requireAny: true
});

export const requireFinancialWrite = requireAuthorization({
  permissions: [Permission.FINANCIAL_WRITE]
});

export const requireAccountingAccess = requireAuthorization({
  permissions: [Permission.ACCOUNTING_READ],
  requireAny: true
});

export const requireCompanyAccess = requireAuthorization({
  requireCompany: true
});

export const requireAuditAccess = requireAuthorization({
  permissions: [Permission.AUDIT_READ]
});

// Role-based middleware
export const requireRole = (role: UserRole) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authContext = rbacService.getAuthContext(req);
    
    if (!authContext || authContext.user.role !== role) {
      logger.warn('Access denied - insufficient role', {
        userId: authContext?.user?.id,
        userRole: authContext?.user?.role,
        requiredRole: role,
        path: req.path,
        method: req.method
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient role',
        code: 'INSUFFICIENT_ROLE',
        required: role
      });
    }

    next();
  };
};

// Minimum role middleware
export const requireMinimumRole = (minimumRole: UserRole) => {
  const roleHierarchy = {
    [UserRole.GUEST]: 0,
    [UserRole.VIEWER]: 1,
    [UserRole.EMPLOYEE]: 2,
    [UserRole.MANAGER]: 3,
    [UserRole.ADMIN]: 4,
    [UserRole.SUPER_ADMIN]: 5
  };

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authContext = rbacService.getAuthContext(req);
    
    if (!authContext) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userLevel = roleHierarchy[authContext.user.role] || 0;
    const requiredLevel = roleHierarchy[minimumRole] || 0;

    if (userLevel < requiredLevel) {
      logger.warn('Access denied - insufficient role level', {
        userId: authContext.user.id,
        userRole: authContext.user.role,
        userLevel,
        requiredLevel,
        minimumRole,
        path: req.path,
        method: req.method
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient role',
        code: 'INSUFFICIENT_ROLE_LEVEL',
        required: minimumRole
      });
    }

    next();
  };
};

// Self-access middleware (users can access their own resources)
export const requireSelfAccessOrPermission = (
  resourceOwnerField: string,
  permissions: Permission[] = []
) => {
  return requireAuthorization({
    permissions,
    allowSelf: true,
    resourceOwnerField
  });
};

// API key authentication middleware
export const requireApiKey = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key required',
      code: 'API_KEY_REQUIRED'
    });
  }

  // In a real implementation, validate API key against database
  // For now, we'll use environment variable for demo
  const validApiKey = process.env.API_KEY;
  
  if (!validApiKey || apiKey !== validApiKey) {
    logger.warn('Invalid API key attempt', {
      apiKey: apiKey.substring(0, 8) + '...',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      path: req.path
    });

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key',
      code: 'INVALID_API_KEY'
    });
  }

  // Create a synthetic user for API key access
  req.user = {
    id: 'api-key-user',
    email: 'api@system',
    role: UserRole.ADMIN,
    isActive: true,
    permissions: Object.values(Permission),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  next();
};
