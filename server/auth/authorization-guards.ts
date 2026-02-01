// CRITICAL: API & Service Layer Authorization Guards
// MANDATORY: All sensitive operations must pass through authorization

import { Request, Response, NextFunction } from 'express';
import { AuthorizationEngine, AuthorizationRequest } from './authorization-engine.js';
import { TenantContext } from '../tenant/tenant-isolation.js';
import { Permission } from './tenant-permissions.js';
import { logger } from '../utils/structured-logger.js';

export interface ApiGuardOptions {
  permission: Permission;
  resource?: {
    type: string;
    idParam?: string;
    ownerIdField?: string;
  };
  allowSelf?: boolean;
  requireOwnership?: boolean;
}

export interface ServiceGuardOptions {
  permission: Permission;
  resource?: {
    type: string;
    id: string;
    ownerId?: string;
    tenantId?: string;
  };
  operation: string;
  requestId: string;
}

/**
 * CRITICAL: API Layer Authorization Guard
 * 
 * This middleware protects API routes with permission checks.
 * ALL sensitive routes MUST use this guard.
 */
export class ApiAuthorizationGuard {
  private authorizationEngine: AuthorizationEngine;

  constructor(authorizationEngine: AuthorizationEngine) {
    this.authorizationEngine = authorizationEngine;
  }

  /**
   * CRITICAL: Create middleware for permission-based API protection
   */
  requirePermission(options: ApiGuardOptions) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      try {
        // CRITICAL: Validate tenant context exists
        const tenantContext = (req as any).tenantContext;
        if (!tenantContext) {
          return this.sendErrorResponse(res, 'TENANT_CONTEXT_REQUIRED', 403, {
            operation: 'api_guard',
            permission: options.permission,
            duration: Date.now() - startTime
          });
        }

        // CRITICAL: Extract resource information if specified
        let resource = undefined;
        if (options.resource) {
          const resourceId = options.resource.idParam 
            ? req.params[options.resource.idParam]
            : req.body?.id || req.query?.id;

          if (!resourceId) {
            return this.sendErrorResponse(res, 'RESOURCE_ID_REQUIRED', 400, {
              operation: 'api_guard',
              permission: options.permission,
              resourceType: options.resource.type,
              duration: Date.now() - startTime
            });
          }

          resource = {
            type: options.resource.type,
            id: resourceId as string,
            ownerId: options.resource.ownerIdField 
              ? req.body[options.resource.ownerIdField] 
              : undefined
          };
        }

        // CRITICAL: Handle self-access scenarios
        if (options.allowSelf && resource) {
          const userId = (tenantContext as any).user?.id;
          if (resource.ownerId === userId) {
            // User is accessing their own resource - allow without additional permission check
            logger.debug('Self-access allowed', {
              operation: 'api_guard_self_access',
              permission: options.permission,
              resourceType: resource.type,
              resourceId: resource.id,
              userId,
              duration: Date.now() - startTime
            });
            return next();
          }
        }

        // CRITICAL: Perform authorization check
        const authorizationRequest: AuthorizationRequest = {
          permission: options.permission,
          tenantContext,
          resource,
          context: {
            operation: 'api_guard',
            requestId: (req as any).requestId || 'unknown',
            userId: (tenantContext as any).user?.id || '',
            ip: req.ip,
            userAgent: req.get('User-Agent')
          }
        };

        const result = await this.authorizationEngine.authorize(authorizationRequest);

        if (!result.authorized) {
          return this.sendErrorResponse(res, result.reason, 403, {
            operation: 'api_guard',
            permission: options.permission,
            resourceType: resource?.type,
            resourceId: resource?.id,
            validationChecks: result.details?.validationChecks || [],
            duration: Date.now() - startTime
          });
        }

        // CRITICAL: Authorization granted - proceed
        logger.debug('API authorization granted', {
          operation: 'api_guard',
          permission: options.permission,
          resourceType: resource?.type,
          resourceId: resource?.id,
          userId: (tenantContext as any).user?.id,
          duration: Date.now() - startTime
        });

        // Attach authorization result to request for downstream use
        (req as any).authorizationResult = result;
        next();

      } catch (error) {
        logger.error('API guard error', error as Error, {
          operation: 'api_guard',
          permission: options.permission,
          duration: Date.now() - startTime
        });

        return this.sendErrorResponse(res, 'AUTHORIZATION_ERROR', 500, {
          operation: 'api_guard',
          permission: options.permission,
          duration: Date.now() - startTime
        });
      }
    };
  }

  /**
   * CRITICAL: Create middleware for multiple permission requirements
   */
  requireAnyPermission(permissions: Permission[], options?: Omit<ApiGuardOptions, 'permission'>) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      try {
        const tenantContext = (req as any).tenantContext;
        if (!tenantContext) {
          return this.sendErrorResponse(res, 'TENANT_CONTEXT_REQUIRED', 403, {
            operation: 'api_guard_any',
            permissions,
            duration: Date.now() - startTime
          });
        }

        // CRITICAL: Check each permission until one succeeds
        for (const permission of permissions) {
          const result = await this.authorizationEngine.authorize({
            permission,
            tenantContext,
            resource: options?.resource ? {
              type: options.resource.type,
              id: options.resource.idParam ? req.params[options.resource.idParam] as string : req.body?.id || req.query?.id,
              ownerId: options.resource.ownerIdField ? req.body[options.resource.ownerIdField] : undefined
            } : undefined,
            context: {
              operation: 'api_guard_any',
              requestId: (req as any).requestId || 'unknown',
              userId: (tenantContext as any).user?.id || '',
              ip: req.ip,
              userAgent: req.get('User-Agent')
            }
          });

          if (result.authorized) {
            logger.debug('API any-permission authorization granted', {
              operation: 'api_guard_any',
              permission,
              userId: (tenantContext as any).user?.id,
              duration: Date.now() - startTime
            });

            (req as any).authorizationResult = result;
            return next();
          }
        }

        // CRITICAL: No permission granted
        return this.sendErrorResponse(res, 'ANY_PERMISSION_DENIED', 403, {
          operation: 'api_guard_any',
          permissions,
          duration: Date.now() - startTime
        });

      } catch (error) {
        logger.error('API any-permission guard error', error as Error, {
          operation: 'api_guard_any',
          permissions,
          duration: Date.now() - startTime
        });

        return this.sendErrorResponse(res, 'AUTHORIZATION_ERROR', 500, {
          operation: 'api_guard_any',
          permissions,
          duration: Date.now() - startTime
        });
      }
    };
  }

  /**
   * CRITICAL: Create middleware for all permissions requirement
   */
  requireAllPermissions(permissions: Permission[], options?: Omit<ApiGuardOptions, 'permission'>) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      try {
        const tenantContext = (req as any).tenantContext;
        if (!tenantContext) {
          return this.sendErrorResponse(res, 'TENANT_CONTEXT_REQUIRED', 403, {
            operation: 'api_guard_all',
            permissions,
            duration: Date.now() - startTime
          });
        }

        // CRITICAL: Check all permissions
        const results = [];
        for (const permission of permissions) {
          const result = await this.authorizationEngine.authorize({
            permission,
            tenantContext,
            resource: options?.resource ? {
              type: options.resource.type,
              id: options.resource.idParam ? req.params[options.resource.idParam] as string : req.body?.id || req.query?.id,
              ownerId: options.resource.ownerIdField ? req.body[options.resource.ownerIdField] : undefined
            } : undefined,
            context: {
              operation: 'api_guard_all',
              requestId: (req as any).requestId || 'unknown',
              userId: (tenantContext as any).user?.id || '',
              ip: req.ip,
              userAgent: req.get('User-Agent')
            }
          });

          results.push({ permission, result });

          if (!result.authorized) {
            return this.sendErrorResponse(res, 'ALL_PERMISSION_DENIED', 403, {
              operation: 'api_guard_all',
              failedPermission: permission,
              permissions,
              duration: Date.now() - startTime
            });
          }
        }

        // CRITICAL: All permissions granted
        logger.debug('API all-permissions authorization granted', {
          operation: 'api_guard_all',
          permissions,
          userId: (tenantContext as any).user?.id,
          duration: Date.now() - startTime
        });

        (req as any).authorizationResults = results;
        next();

      } catch (error) {
        logger.error('API all-permissions guard error', error as Error, {
          operation: 'api_guard_all',
          permissions,
          duration: Date.now() - startTime
        });

        return this.sendErrorResponse(res, 'AUTHORIZATION_ERROR', 500, {
          operation: 'api_guard_all',
          permissions,
          duration: Date.now() - startTime
        });
      }
    };
  }

  /**
   * CRITICAL: Send standardized error response
   */
  private sendErrorResponse(
    res: Response, 
    reason: string, 
    statusCode: number, 
    context: any
  ): void {
    const response = {
      error: this.sanitizeErrorMessage(reason),
      code: reason,
      requestId: context.requestId || 'unknown',
      timestamp: new Date().toISOString()
    };

    logger.warn('API authorization denied', {
      reason,
      statusCode,
      ...context
    });

    res.status(statusCode).json(response);
  }

  /**
   * CRITICAL: Sanitize error messages to prevent information leakage
   */
  private sanitizeErrorMessage(reason: string): string {
    const sensitivePatterns = [
      /tenant.*not.*found/i,
      /user.*not.*member/i,
      /role.*mismatch/i,
      /resource.*not.*found/i,
      /resource.*ownership/i
    ];

    if (sensitivePatterns.some(pattern => pattern.test(reason))) {
      return 'Access denied';
    }

    return reason;
  }
}

/**
 * CRITICAL: Service Layer Authorization Guard
 * 
 * This class protects service methods with permission checks.
 * ALL sensitive service operations MUST use this guard.
 */
export class ServiceAuthorizationGuard {
  private authorizationEngine: AuthorizationEngine;

  constructor(authorizationEngine: AuthorizationEngine) {
    this.authorizationEngine = authorizationEngine;
  }

  /**
   * CRITICAL: Check permission for service operation
   */
  async requirePermission(
    tenantContext: TenantContext,
    options: ServiceGuardOptions
  ): Promise<{ authorized: boolean; reason?: string }> {
    const startTime = Date.now();

    try {
      // CRITICAL: Perform authorization check
      const result = await this.authorizationEngine.authorize({
        permission: options.permission,
        tenantContext,
        resource: options.resource,
        context: {
          operation: options.operation,
          requestId: options.requestId,
          userId: (tenantContext as any).user?.id || ''
        }
      });

      logger.debug('Service authorization check', {
        operation: options.operation,
        permission: options.permission,
        authorized: result.authorized,
        reason: result.reason,
        resourceType: options.resource?.type,
        resourceId: options.resource?.id,
        userId: (tenantContext as any).user?.id,
        duration: Date.now() - startTime
      });

      return {
        authorized: result.authorized,
        reason: result.authorized ? undefined : result.reason
      };

    } catch (error) {
      logger.error('Service authorization error', error as Error, {
        operation: options.operation,
        permission: options.permission,
        duration: Date.now() - startTime
      });

      return {
        authorized: false,
        reason: 'AUTHORIZATION_ERROR'
      };
    }
  }

  /**
   * CRITICAL: Check if user has any of the specified permissions
   */
  async requireAnyPermission(
    tenantContext: TenantContext,
    permissions: Permission[],
    options: Omit<ServiceGuardOptions, 'permission'>
  ): Promise<{ authorized: boolean; grantedPermission?: Permission; reason?: string }> {
    const startTime = Date.now();

    try {
      for (const permission of permissions) {
        const result = await this.authorizationEngine.authorize({
          permission,
          tenantContext,
          resource: options.resource,
          context: {
            operation: options.operation,
            requestId: options.requestId,
            userId: (tenantContext as any).user?.id || ''
          }
        });

        if (result.authorized) {
          logger.debug('Service any-permission granted', {
            operation: options.operation,
            permission,
            userId: (tenantContext as any).user?.id,
            duration: Date.now() - startTime
          });

          return {
            authorized: true,
            grantedPermission: permission
          };
        }
      }

      return {
        authorized: false,
        reason: 'ANY_PERMISSION_DENIED'
      };

    } catch (error) {
      logger.error('Service any-permission error', error as Error, {
        operation: options.operation,
        permissions,
        duration: Date.now() - startTime
      });

      return {
        authorized: false,
        reason: 'AUTHORIZATION_ERROR'
      };
    }
  }

  /**
   * CRITICAL: Check if user has all specified permissions
   */
  async requireAllPermissions(
    tenantContext: TenantContext,
    permissions: Permission[],
    options: Omit<ServiceGuardOptions, 'permission'>
  ): Promise<{ authorized: boolean; failedPermission?: Permission; reason?: string }> {
    const startTime = Date.now();

    try {
      for (const permission of permissions) {
        const result = await this.authorizationEngine.authorize({
          permission,
          tenantContext,
          resource: options.resource,
          context: {
            operation: options.operation,
            requestId: options.requestId,
            userId: (tenantContext as any).user?.id || ''
          }
        });

        if (!result.authorized) {
          return {
            authorized: false,
            failedPermission: permission,
            reason: result.reason
          };
        }
      }

      logger.debug('Service all-permissions granted', {
        operation: options.operation,
        permissions,
        userId: (tenantContext as any).user?.id,
        duration: Date.now() - startTime
      });

      return {
        authorized: true
      };

    } catch (error) {
      logger.error('Service all-permissions error', error as Error, {
        operation: options.operation,
        permissions,
        duration: Date.now() - startTime
      });

      return {
        authorized: false,
        reason: 'AUTHORIZATION_ERROR'
      };
    }
  }

  /**
   * CRITICAL: Execute operation with authorization check
   */
  async executeWithAuthorization<T>(
    tenantContext: TenantContext,
    options: ServiceGuardOptions,
    operation: () => Promise<T>
  ): Promise<T> {
    const authResult = await this.requirePermission(tenantContext, options);

    if (!authResult.authorized) {
      const error = new Error(`Authorization denied: ${authResult.reason}`);
      (error as any).code = authResult.reason;
      throw error;
    }

    return await operation();
  }

  /**
   * CRITICAL: Execute operation with any permission check
   */
  async executeWithAnyPermission<T>(
    tenantContext: TenantContext,
    permissions: Permission[],
    options: Omit<ServiceGuardOptions, 'permission'>,
    operation: (grantedPermission: Permission) => Promise<T>
  ): Promise<T> {
    const authResult = await this.requireAnyPermission(tenantContext, permissions, options);

    if (!authResult.authorized || !authResult.grantedPermission) {
      const error = new Error(`Authorization denied: ${authResult.reason}`);
      (error as any).code = authResult.reason;
      throw error;
    }

    return await operation(authResult.grantedPermission);
  }
}

/**
 * CRITICAL: Factory functions for creating guards
 */
export const createApiAuthorizationGuard = (
  authorizationEngine: AuthorizationEngine
): ApiAuthorizationGuard => {
  return new ApiAuthorizationGuard(authorizationEngine);
};

export const createServiceAuthorizationGuard = (
  authorizationEngine: AuthorizationEngine
): ServiceAuthorizationGuard => {
  return new ServiceAuthorizationGuard(authorizationEngine);
};

/**
 * CRITICAL: Convenience middleware factories
 */
export const requirePermission = (
  authorizationEngine: AuthorizationEngine,
  options: ApiGuardOptions
) => {
  const guard = createApiAuthorizationGuard(authorizationEngine);
  return guard.requirePermission(options);
};

export const requireAnyPermission = (
  authorizationEngine: AuthorizationEngine,
  permissions: Permission[],
  options?: Omit<ApiGuardOptions, 'permission'>
) => {
  const guard = createApiAuthorizationGuard(authorizationEngine);
  return guard.requireAnyPermission(permissions, options);
};

export const requireAllPermissions = (
  authorizationEngine: AuthorizationEngine,
  permissions: Permission[],
  options?: Omit<ApiGuardOptions, 'permission'>
) => {
  const guard = createApiAuthorizationGuard(authorizationEngine);
  return guard.requireAllPermissions(permissions, options);
};
