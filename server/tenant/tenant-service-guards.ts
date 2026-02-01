// CRITICAL: Service Layer Guardrails for Tenant Isolation
// MANDATORY: Prevents ALL cross-tenant access at service layer

import { PrismaClient } from '@prisma/client';
import { TenantContext, AuthenticatedRequest } from './tenant-isolation.js';
import { TenantIsolatedQueryBuilder } from './tenant-query-builder.js';
import { logger } from '../utils/structured-logger.js';

export interface ExtendedTenantContext extends TenantContext {
  user: {
    id: string;
    email?: string;
    name?: string;
    role: string;
    isActive: boolean;
  };
}

export interface ServiceTenantContext {
  tenantId: string;
  userId: string;
  userRole: string;
  permissions: string[];
  requestId: string;
}

export interface ServiceOptions {
  requireTenantContext: boolean;
  allowCrossTenant: boolean;
  validateOwnership: boolean;
  enforcePermissions: boolean;
}

export class TenantGuardedService {
  private prisma: PrismaClient;
  private tenantContext: ServiceTenantContext;
  private queryBuilder: TenantIsolatedQueryBuilder;
  private options: ServiceOptions;

  constructor(
    prisma: PrismaClient,
    tenantContext: TenantContext,
    options: Partial<ServiceOptions> = {}
  ) {
    this.prisma = prisma;
    this.options = {
      requireTenantContext: true,
      allowCrossTenant: false,
      validateOwnership: true,
      enforcePermissions: true,
      ...options
    };

    // CRITICAL: Validate tenant context immediately
    this.validateTenantContext(tenantContext);

    // Convert to service tenant context
    this.tenantContext = {
      tenantId: tenantContext.tenantId,
      userId: tenantContext.tenant.user?.id || '',
      userRole: tenantContext.userRole,
      permissions: tenantContext.permissions,
      requestId: (tenantContext as any).requestId || 'unknown'
    };

    // Create tenant-isolated query builder
    this.queryBuilder = new TenantIsolatedQueryBuilder(prisma, {
      tenantId: this.tenantContext.tenantId,
      userId: this.tenantContext.userId,
      requestId: this.tenantContext.requestId
    }, {
      enforceTenantScope: !this.options.allowCrossTenant,
      requireTenantId: this.options.requireTenantContext
    });
  }

  /**
   * CRITICAL: Get tenant-isolated Prisma client
   */
  get db(): PrismaClient {
    return this.queryBuilder.scopedClient;
  }

  /**
   * CRITICAL: Validate tenant context is present and valid
   */
  private validateTenantContext(context: TenantContext): void {
    if (!context) {
      const error = new Error('TENANT_CONTEXT_REQUIRED');
      logger.error('Service called without tenant context', error as Error);
      throw error;
    }

    if (!context.tenantId) {
      const error = new Error('TENANT_ID_REQUIRED');
      logger.error('Service called without tenant ID', error as Error);
      throw error;
    }

    if (!context.user?.id) {
      const error = new Error('USER_ID_REQUIRED');
      logger.error('Service called without user ID', error as Error);
      throw error;
    }

    // CRITICAL: Validate tenant ID format
    if (!this.isValidTenantId(context.tenantId)) {
      const error = new Error('INVALID_TENANT_ID');
      logger.error('Invalid tenant ID format in service', error as Error, {
        tenantId: context.tenantId
      });
      throw error;
    }
  }

  /**
   * CRITICAL: Validate tenant ID format
   */
  private isValidTenantId(tenantId: string): boolean {
    const tenantIdPattern = /^tn_[a-f0-9]{32}$/;
    return tenantIdPattern.test(tenantId);
  }

  /**
   * CRITICAL: Validate user has required permission
   */
  requirePermission(permission: string): void {
    if (!this.options.enforcePermissions) {
      return;
    }

    if (!this.tenantContext.permissions.includes(permission)) {
      const error = new Error('PERMISSION_DENIED');
      logger.error('Permission denied in service', error as Error, {
        requiredPermission: permission,
        userPermissions: this.tenantContext.permissions,
        userId: this.tenantContext.userId,
        tenantId: this.tenantContext.tenantId,
        requestId: this.tenantContext.requestId
      });
      throw error;
    }
  }

  /**
   * CRITICAL: Validate user has any of the required permissions
   */
  requireAnyPermission(permissions: string[]): void {
    if (!this.options.enforcePermissions) {
      return;
    }

    const hasPermission = permissions.some(permission => 
      this.tenantContext.permissions.includes(permission)
    );

    if (!hasPermission) {
      const error = new Error('PERMISSION_DENIED');
      logger.error('Any permission denied in service', error as Error, {
        requiredPermissions: permissions,
        userPermissions: this.tenantContext.permissions,
        userId: this.tenantContext.userId,
        tenantId: this.tenantContext.tenantId,
        requestId: this.tenantContext.requestId
      });
      throw error;
    }
  }

  /**
   * CRITICAL: Validate user has required role
   */
  requireRole(role: string): void {
    if (!this.options.enforcePermissions) {
      return;
    }

    if (this.tenantContext.userRole !== role) {
      const error = new Error('ROLE_DENIED');
      logger.error('Role denied in service', error as Error, {
        requiredRole: role,
        userRole: this.tenantContext.userRole,
        userId: this.tenantContext.userId,
        tenantId: this.tenantContext.tenantId,
        requestId: this.tenantContext.requestId
      });
      throw error;
    }
  }

  /**
   * CRITICAL: Validate resource ownership within tenant
   */
  async validateOwnership(
    resourceType: string,
    resourceId: string,
    additionalChecks?: Record<string, any>
  ): Promise<void> {
    if (!this.options.validateOwnership) {
      return;
    }

    try {
      // CRITICAL: Check if resource exists and belongs to tenant
      const resource = await this.validateResourceOwnership(
        resourceType,
        resourceId,
        additionalChecks
      );

      if (!resource) {
        const error = new Error('RESOURCE_NOT_FOUND');
        logger.error('Resource not found in tenant validation', error as Error, {
          resourceType,
          resourceId,
          tenantId: this.tenantContext.tenantId,
          userId: this.tenantContext.userId,
          requestId: this.tenantContext.requestId
        });
        throw error;
      }

      // CRITICAL: Check if resource belongs to the current tenant
      if (resource.tenantId !== this.tenantContext.tenantId) {
        const error = new Error('CROSS_TENANT_ACCESS_DENIED');
        logger.error('Cross-tenant access blocked in service', error as Error, {
          resourceType,
          resourceId,
          resourceTenantId: resource.tenantId,
          userTenantId: this.tenantContext.tenantId,
          userId: this.tenantContext.userId,
          requestId: this.tenantContext.requestId
        });
        throw error;
      }

      logger.debug('Resource ownership validated', {
        resourceType,
        resourceId,
        tenantId: this.tenantContext.tenantId,
        requestId: this.tenantContext.requestId
      });

    } catch (error) {
      if ((error as Error).message === 'RESOURCE_NOT_FOUND' || 
          (error as Error).message === 'CROSS_TENANT_ACCESS_DENIED') {
        throw error;
      }

      // Log unexpected errors but don't leak details
      logger.error('Unexpected error in ownership validation', error as Error, {
        resourceType,
        resourceId,
        tenantId: this.tenantContext.tenantId,
        userId: this.tenantContext.userId,
        requestId: this.tenantContext.requestId
      });

      throw new Error('OWNERSHIP_VALIDATION_FAILED');
    }
  }

  /**
   * CRITICAL: Validate resource ownership with database query
   */
  private async validateResourceOwnership(
    resourceType: string,
    resourceId: string,
    additionalChecks?: Record<string, any>
  ): Promise<any> {
    const db = this.db;

    switch (resourceType) {
      case 'user':
        return await db.user.findFirst({
          where: {
            id: resourceId,
            tenantId: this.tenantContext.tenantId,
            deletedAt: null
          },
          select: { id: true, tenantId: true }
        });

      case 'company':
        return await db.company.findFirst({
          where: {
            id: resourceId,
            tenantId: this.tenantContext.tenantId,
            deletedAt: null
          },
          select: { id: true, tenantId: true }
        });

      case 'invoice':
        return await db.invoice.findFirst({
          where: {
            id: resourceId,
            tenantId: this.tenantContext.tenantId,
            deletedAt: null
          },
          select: { id: true, tenantId: true }
        });

      case 'transaction':
        return await db.transaction.findFirst({
          where: {
            id: resourceId,
            tenantId: this.tenantContext.tenantId,
            deletedAt: null
          },
          select: { id: true, tenantId: true }
        });

      default:
        // For unknown resource types, perform a generic check
        {
          const tableName = resourceType.toLowerCase();
          const query = `
          SELECT id, tenant_id 
          FROM ${tableName} 
          WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL 
          LIMIT 1
        `;
          const result = await db.$queryRawUnsafe(query, resourceId, this.tenantContext.tenantId);
          return result[0] || null;
        }
    }
  }

  /**
   * CRITICAL: Validate bulk operation is tenant-safe
   */
  validateBulkOperation(operation: string, resourceIds: string[]): void {
    if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
      const error = new Error('INVALID_BULK_OPERATION');
      logger.error('Invalid bulk operation parameters', error as Error, {
        operation,
        resourceIdsCount: resourceIds?.length || 0,
        tenantId: this.tenantContext.tenantId,
        userId: this.tenantContext.userId,
        requestId: this.tenantContext.requestId
      });
      throw error;
    }

    // CRITICAL: Validate all resource IDs format
    for (const resourceId of resourceIds) {
      if (!resourceId || typeof resourceId !== 'string') {
        const error = new Error('INVALID_RESOURCE_ID');
        logger.error('Invalid resource ID in bulk operation', error as Error, {
          operation,
          resourceId,
          tenantId: this.tenantContext.tenantId,
          userId: this.tenantContext.userId,
          requestId: this.tenantContext.requestId
        });
        throw error;
      }
    }

    logger.debug('Bulk operation validated', {
      operation,
      resourceIdsCount: resourceIds.length,
      tenantId: this.tenantContext.tenantId,
      requestId: this.tenantContext.requestId
    });
  }

  /**
   * CRITICAL: Execute tenant-safe transaction
   */
  async transaction<T>(
    callback: (tx: PrismaClient, context: ServiceTenantContext) => Promise<T>
  ): Promise<T> {
    return await this.queryBuilder.transaction(async (tx) => {
      // Create service context for transaction
      const txContext = {
        ...this.tenantContext,
        requestId: this.tenantContext.requestId + '_tx'
      };

      return await callback(tx, txContext);
    });
  }

  /**
   * CRITICAL: Execute tenant-safe batch operation
   */
  async batch<T>(
    operations: Array<(tx: PrismaClient, context: ServiceTenantContext) => Promise<T>>
  ): Promise<T[]> {
    const queries = operations.map(op => (tx: PrismaClient) => {
      const txContext = {
        ...this.tenantContext,
        requestId: this.tenantContext.requestId + '_batch'
      };
      return op(tx, txContext);
    });

    return await this.queryBuilder.batch(queries);
  }

  /**
   * CRITICAL: Get tenant context for logging and debugging
   */
  getContext(): ServiceTenantContext {
    return { ...this.tenantContext };
  }

  /**
   * CRITICAL: Check if user is admin or higher
   */
  isAdmin(): boolean {
    return ['OWNER', 'ADMIN'].includes(this.tenantContext.userRole);
  }

  /**
   * CRITICAL: Check if user is manager or higher
   */
  isManager(): boolean {
    return ['OWNER', 'ADMIN', 'MANAGER'].includes(this.tenantContext.userRole);
  }

  /**
   * CRITICAL: Check if user is owner
   */
  isOwner(): boolean {
    return this.tenantContext.userRole === 'OWNER';
  }

  /**
   * CRITICAL: Log tenant-aware operation
   */
  logOperation(operation: string, details?: Record<string, any>): void {
    logger.info('Tenant-aware operation', {
      operation,
      tenantId: this.tenantContext.tenantId,
      userId: this.tenantContext.userId,
      userRole: this.tenantContext.userRole,
      requestId: this.tenantContext.requestId,
      ...details
    });
  }

  /**
   * CRITICAL: Log tenant-aware error
   */
  logError(operation: string, error: Error, details?: Record<string, any>): void {
    logger.error(`Tenant-aware operation failed: ${operation}`, error, {
      tenantId: this.tenantContext.tenantId,
      userId: this.tenantContext.userId,
      userRole: this.tenantContext.userRole,
      requestId: this.tenantContext.requestId,
      ...details
    });
  }
}

/**
 * CRITICAL: Factory function for creating tenant-guarded services
 */
export const createTenantGuardedService = (
  prisma: PrismaClient,
  tenantContext: TenantContext,
  options?: Partial<ServiceOptions>
): TenantGuardedService => {
  return new TenantGuardedService(prisma, tenantContext, options);
};

/**
 * CRITICAL: Middleware to create tenant-guarded service for requests
 */
export const createTenantGuardedServiceMiddleware = (
  options?: Partial<ServiceOptions>
) => {
  return (req: any, res: any, next: any) => {
    if (!req.tenantContext) {
      return res.status(403).json({
        error: 'Tenant context required',
        code: 'TENANT_CONTEXT_REQUIRED'
      });
    }

    // Create service and attach to request
    req.tenantService = createTenantGuardedService(
      req.prisma,
      req.tenantContext,
      options
    );

    next();
  };
};
