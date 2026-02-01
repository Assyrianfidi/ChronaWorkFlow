// CRITICAL: Resource-Scoped Permission Enforcement
// MANDATORY: Prevent ID probing and enforce tenant-scoped access

import { PrismaClient } from '@prisma/client';
import { TenantContext } from '../tenant/tenant-isolation.js';
import { Permission } from './tenant-permissions.js';
import { AuthorizationEngine } from './authorization-engine.js';
import { logger } from '../utils/structured-logger.js';

export interface ResourceScope {
  type: string;
  id: string;
  tenantId?: string;
  ownerId?: string;
  additionalConditions?: Record<string, any>;
}

export interface ResourcePermissionCheck {
  permission: Permission;
  scope: ResourceScope;
  tenantContext: TenantContext;
  operation: string;
  requestId: string;
}

export interface ResourcePermissionResult {
  authorized: boolean;
  reason: string;
  resourceExists: boolean;
  belongsToTenant: boolean;
  isOwner: boolean;
  sanitizedError?: string;
}

/**
 * CRITICAL: Resource-Scoped Permission Validator
 * 
 * This class enforces resource-scoped permissions and prevents ID probing attacks.
 * ALL resource access MUST go through this validator.
 */
export class ResourceScopedPermissionValidator {
  private prisma: PrismaClient;
  private authorizationEngine: AuthorizationEngine;
  private probingDetectionCache: Map<string, { attempts: number; lastAttempt: number }> = new Map();
  private readonly MAX_PROBING_ATTEMPTS = 10;
  private readonly PROBING_WINDOW_MS = 300000; // 5 minutes

  constructor(prisma: PrismaClient, authorizationEngine: AuthorizationEngine) {
    this.prisma = prisma;
    this.authorizationEngine = authorizationEngine;
  }

  /**
   * CRITICAL: Validate resource-scoped permission
   * 
   * This is the SINGLE entry point for all resource-scoped authorization.
   * It prevents ID probing attacks and ensures tenant-scoped access.
   */
  async validateResourcePermission(check: ResourcePermissionCheck): Promise<ResourcePermissionResult> {
    const startTime = Date.now();
    const cacheKey = `${check.tenantContext.tenantId}:${(check.tenantContext as any).user?.id}:${check.scope.type}`;

    try {
      // CRITICAL: Detect and block ID probing attempts
      const probingResult = this.detectProbingAttempt(cacheKey);
      if (probingResult.isProbing) {
        logger.error('ID probing attack detected', new Error('PROBING_DETECTED'), {
          userId: (check.tenantContext as any).user?.id,
          tenantId: check.tenantContext.tenantId,
          resourceType: check.scope.type,
          resourceId: check.scope.id,
          attempts: probingResult.attempts,
          operation: check.operation,
          requestId: check.requestId
        });

        return {
          authorized: false,
          reason: 'PROBING_DETECTED',
          resourceExists: false,
          belongsToTenant: false,
          isOwner: false,
          sanitizedError: 'Access denied'
        };
      }

      // CRITICAL: Validate resource exists and belongs to tenant
      const resourceValidation = await this.validateResourceExistenceAndOwnership(check);
      
      if (!resourceValidation.resourceExists) {
        // CRITICAL: Don't reveal if resource exists or not
        return {
          authorized: false,
          reason: 'RESOURCE_ACCESS_DENIED',
          resourceExists: false,
          belongsToTenant: false,
          isOwner: false,
          sanitizedError: 'Access denied'
        };
      }

      if (!resourceValidation.belongsToTenant) {
        logger.warn('Cross-tenant resource access attempt', {
          userId: (check.tenantContext as any).user?.id,
          tenantId: check.tenantContext.tenantId,
          resourceType: check.scope.type,
          resourceId: check.scope.id,
          actualTenantId: resourceValidation.actualTenantId,
          operation: check.operation,
          requestId: check.requestId
        });

        return {
          authorized: false,
          reason: 'CROSS_TENANT_ACCESS',
          resourceExists: true,
          belongsToTenant: false,
          isOwner: false,
          sanitizedError: 'Access denied'
        };
      }

      // CRITICAL: Check permission with authorization engine
      const authResult = await this.authorizationEngine.authorize({
        permission: check.permission,
        tenantContext: check.tenantContext,
        resource: {
          type: check.scope.type,
          id: check.scope.id,
          ownerId: resourceValidation.ownerId,
          tenantId: resourceValidation.actualTenantId
        },
        context: {
          operation: check.operation,
          requestId: check.requestId,
          userId: (check.tenantContext as any).user?.id || ''
        }
      });

      if (!authResult.authorized) {
        return {
          authorized: false,
          reason: authResult.reason,
          resourceExists: true,
          belongsToTenant: true,
          isOwner: resourceValidation.isOwner,
          sanitizedError: this.sanitizeErrorMessage(authResult.reason)
        };
      }

      // CRITICAL: All checks passed
      logger.debug('Resource-scoped permission granted', {
        operation: check.operation,
        permission: check.permission,
        resourceType: check.scope.type,
        resourceId: check.scope.id,
        userId: (check.tenantContext as any).user?.id,
        tenantId: check.tenantContext.tenantId,
        isOwner: resourceValidation.isOwner,
        duration: Date.now() - startTime
      });

      return {
        authorized: true,
        reason: 'AUTHORIZED',
        resourceExists: true,
        belongsToTenant: true,
        isOwner: resourceValidation.isOwner
      };

    } catch (error) {
      logger.error('Resource permission validation error', error as Error, {
        operation: check.operation,
        permission: check.permission,
        resourceType: check.scope.type,
        resourceId: check.scope.id,
        userId: (check.tenantContext as any).user?.id,
        tenantId: check.tenantContext.tenantId,
        duration: Date.now() - startTime
      });

      // CRITICAL: Fail securely - deny access
      return {
        authorized: false,
        reason: 'VALIDATION_ERROR',
        resourceExists: false,
        belongsToTenant: false,
        isOwner: false,
        sanitizedError: 'Access denied'
      };
    }
  }

  /**
   * CRITICAL: Detect ID probing attempts
   */
  private detectProbingAttempt(cacheKey: string): { isProbing: boolean; attempts: number } {
    const now = Date.now();
    const cached = this.probingDetectionCache.get(cacheKey);

    if (!cached) {
      this.probingDetectionCache.set(cacheKey, { attempts: 1, lastAttempt: now });
      return { isProbing: false, attempts: 1 };
    }

    // Check if within probing window
    if (now - cached.lastAttempt < this.PROBING_WINDOW_MS) {
      const newAttempts = cached.attempts + 1;
      this.probingDetectionCache.set(cacheKey, { attempts: newAttempts, lastAttempt: now });

      if (newAttempts >= this.MAX_PROBING_ATTEMPTS) {
        return { isProbing: true, attempts: newAttempts };
      }

      return { isProbing: false, attempts: newAttempts };
    }

    // Reset counter if outside window
    this.probingDetectionCache.set(cacheKey, { attempts: 1, lastAttempt: now });
    return { isProbing: false, attempts: 1 };
  }

  /**
   * CRITICAL: Validate resource existence and ownership
   */
  private async validateResourceExistenceAndOwnership(
    check: ResourcePermissionCheck
  ): Promise<{
    resourceExists: boolean;
    belongsToTenant: boolean;
    isOwner: boolean;
    ownerId?: string;
    actualTenantId?: string;
  }> {
    try {
      const resourceType = this.escapeIdentifier(check.scope.type);
      
      // CRITICAL: Use parameterized query to prevent SQL injection
      const query = `
        SELECT 
          id,
          tenant_id,
          CASE 
            WHEN owner_id IS NOT NULL THEN owner_id
            WHEN created_by IS NOT NULL THEN created_by
            ELSE NULL
          END as owner_id
        FROM ${resourceType} 
        WHERE id = $1 
        AND deleted_at IS NULL 
        LIMIT 1
      `;

      const result = await this.prisma.$queryRawUnsafe(
        query, 
        check.scope.id
      ) as Array<{
        id: string;
        tenant_id: string;
        owner_id: string | null;
      }>;

      if (!result || result.length === 0) {
        return {
          resourceExists: false,
          belongsToTenant: false,
          isOwner: false
        };
      }

      const resource = result[0];
      const userId = (check.tenantContext as any).user?.id;
      const tenantId = check.tenantContext.tenantId;

      return {
        resourceExists: true,
        belongsToTenant: resource.tenant_id === tenantId,
        isOwner: resource.owner_id === userId,
        ownerId: resource.owner_id || undefined,
        actualTenantId: resource.tenant_id
      };

    } catch (error) {
      logger.error('Resource validation query failed', error as Error, {
        resourceType: check.scope.type,
        resourceId: check.scope.id,
        tenantId: check.tenantContext.tenantId
      });

      // CRITICAL: Fail securely
      return {
        resourceExists: false,
        belongsToTenant: false,
        isOwner: false
      };
    }
  }

  /**
   * CRITICAL: Escape identifier to prevent SQL injection
   */
  private escapeIdentifier(identifier: string): string {
    // Basic identifier validation - allow only alphanumeric and underscores
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
      throw new Error('Invalid resource identifier');
    }
    return identifier;
  }

  /**
   * CRITICAL: Sanitize error messages to prevent information leakage
   */
  private sanitizeErrorMessage(reason: string): string {
    const sensitivePatterns = [
      /resource.*not.*found/i,
      /cross.*tenant/i,
      /ownership.*denied/i,
      /tenant.*mismatch/i,
      /probing.*detected/i
    ];

    if (sensitivePatterns.some(pattern => pattern.test(reason))) {
      return 'Access denied';
    }

    return reason;
  }

  /**
   * CRITICAL: Batch resource permission validation
   */
  async validateMultipleResourcePermissions(
    checks: ResourcePermissionCheck[]
  ): Promise<ResourcePermissionResult[]> {
    const results: ResourcePermissionResult[] = [];

    for (const check of checks) {
      const result = await this.validateResourcePermission(check);
      results.push(result);

      // CRITICAL: Stop on first denial for efficiency
      if (!result.authorized) {
        break;
      }
    }

    return results;
  }

  /**
   * CRITICAL: Check if user can access resource type (without specific ID)
   */
  async canAccessResourceType(
    permission: Permission,
    resourceType: string,
    tenantContext: TenantContext,
    operation: string,
    requestId: string
  ): Promise<{ authorized: boolean; reason: string }> {
    try {
      // CRITICAL: Check permission without specific resource
      const result = await this.authorizationEngine.authorize({
        permission,
        tenantContext,
        context: {
          operation,
          requestId,
          userId: (tenantContext as any).user?.id || ''
        }
      });

      return {
        authorized: result.authorized,
        reason: result.authorized ? 'AUTHORIZED' : result.reason
      };

    } catch (error) {
      logger.error('Resource type access check failed', error as Error, {
        permission,
        resourceType,
        operation,
        userId: (tenantContext as any).user?.id,
        tenantId: tenantContext.tenantId
      });

      return {
        authorized: false,
        reason: 'VALIDATION_ERROR'
      };
    }
  }

  /**
   * CRITICAL: Get resource access summary for debugging
   */
  async getResourceAccessSummary(
    resourceType: string,
    resourceId: string,
    tenantContext: TenantContext
  ): Promise<{
    resourceExists: boolean;
    belongsToTenant: boolean;
    isOwner: boolean;
    accessiblePermissions: Permission[];
  }> {
    try {
      const resourceValidation = await this.validateResourceExistenceAndOwnership({
        permission: 'users:read', // Dummy permission for validation
        scope: { type: resourceType, id: resourceId },
        tenantContext,
        operation: 'debug_summary',
        requestId: 'debug'
      });

      if (!resourceValidation.resourceExists) {
        return {
          resourceExists: false,
          belongsToTenant: false,
          isOwner: false,
          accessiblePermissions: []
        };
      }

      // CRITICAL: Get user permissions
      const userPermissions = await this.authorizationEngine.getUserPermissionsDebug(
        (tenantContext as any).user?.id || '',
        tenantContext.tenantId,
        tenantContext.userRole
      );

      return {
        resourceExists: true,
        belongsToTenant: resourceValidation.belongsToTenant,
        isOwner: resourceValidation.isOwner,
        accessiblePermissions: userPermissions.permissions
      };

    } catch (error) {
      logger.error('Resource access summary failed', error as Error, {
        resourceType,
        resourceId,
        userId: (tenantContext as any).user?.id,
        tenantId: tenantContext.tenantId
      });

      return {
        resourceExists: false,
        belongsToTenant: false,
        isOwner: false,
        accessiblePermissions: []
      };
    }
  }

  /**
   * CRITICAL: Clear probing detection cache
   */
  clearProbingCache(): void {
    this.probingDetectionCache.clear();
    logger.info('Probing detection cache cleared');
  }

  /**
   * CRITICAL: Get probing detection metrics
   */
  getProbingMetrics(): {
    cacheSize: number;
    activeProbers: number;
    totalAttempts: number;
  } {
    const now = Date.now();
    const activeProbers = Array.from(this.probingDetectionCache.values())
      .filter(cached => now - cached.lastAttempt < this.PROBING_WINDOW_MS)
      .length;

    const totalAttempts = Array.from(this.probingDetectionCache.values())
      .reduce((sum, cached) => sum + cached.attempts, 0);

    return {
      cacheSize: this.probingDetectionCache.size,
      activeProbers,
      totalAttempts
    };
  }
}

/**
 * CRITICAL: Factory function for creating resource-scoped validator
 */
export const createResourceScopedPermissionValidator = (
  prisma: PrismaClient,
  authorizationEngine: AuthorizationEngine
): ResourceScopedPermissionValidator => {
  return new ResourceScopedPermissionValidator(prisma, authorizationEngine);
};

/**
 * CRITICAL: Convenience function for resource permission check
 */
export const checkResourcePermission = async (
  prisma: PrismaClient,
  authorizationEngine: AuthorizationEngine,
  permission: Permission,
  resourceType: string,
  resourceId: string,
  tenantContext: TenantContext,
  operation: string,
  requestId: string
): Promise<ResourcePermissionResult> => {
  const validator = createResourceScopedPermissionValidator(prisma, authorizationEngine);
  
  return await validator.validateResourcePermission({
    permission,
    scope: { type: resourceType, id: resourceId },
    tenantContext,
    operation,
    requestId
  });
};
