// CRITICAL: Central Authorization Engine for Tenant RBAC
// MANDATORY: Single source of truth for all authorization decisions

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/structured-logger.js';
import { TenantContext } from '../tenant/tenant-isolation.js';
import { devInvariant } from '../runtime/dev-invariants.js';
import { 
  Permission, 
  PermissionRegistry, 
  PermissionValidator, 
  getPermissionRegistry 
} from './tenant-permissions.js';
import { TenantUserRole } from '../tenant/tenant-service.js';

export interface AuthorizationRequest {
  permission: Permission;
  tenantContext: TenantContext;
  resource?: {
    type: string;
    id: string;
    ownerId?: string;
    tenantId?: string;
  };
  context?: {
    operation: string;
    requestId: string;
    userId: string;
    ip?: string;
    userAgent?: string;
  };
}

export interface AuthorizationResult {
  authorized: boolean;
  reason: string;
  details?: {
    permission: Permission;
    userRole: TenantUserRole;
    tenantId: string;
    userId: string;
    resourceType?: string;
    resourceId?: string;
    validationChecks: string[];
  };
}

export interface AuthorizationEngineConfig {
  enableAuditLogging: boolean;
  enableSecurityAlerts: boolean;
  enableResourceOwnershipValidation: boolean;
  cachePermissions: boolean;
  cacheTTL: number;
}

/**
 * CRITICAL: Central Authorization Engine
 * 
 * This is the ONLY place where authorization decisions are made.
 * All authorization checks MUST go through this engine.
 * NO exceptions, NO bypasses, NO silent allows.
 */
export class AuthorizationEngine {
  private prisma: PrismaClient;
  private config: AuthorizationEngineConfig;
  private permissionRegistry: PermissionRegistry;
  private permissionCache: Map<string, { permissions: Permission[]; timestamp: number }> = new Map();

  constructor(
    prisma: PrismaClient,
    config: Partial<AuthorizationEngineConfig> = {}
  ) {
    this.prisma = prisma;
    this.config = {
      enableAuditLogging: true,
      enableSecurityAlerts: true,
      enableResourceOwnershipValidation: true,
      cachePermissions: true,
      cacheTTL: 300000, // 5 minutes
      ...config
    };

    // CRITICAL: Load and validate permission registry
    this.permissionRegistry = getPermissionRegistry();
    
    logger.info('Authorization engine initialized', {
      enableAuditLogging: this.config.enableAuditLogging,
      enableSecurityAlerts: this.config.enableSecurityAlerts,
      permissionCount: this.permissionRegistry.permissions.size,
      roleCount: this.permissionRegistry.rolePermissions.size
    });
  }

  /**
   * CRITICAL: Authorize a permission request
   * 
   * This is the SINGLE entry point for all authorization decisions.
   * All authorization logic flows through this method.
   * 
   * @param request - Authorization request with permission, context, and optional resource
   * @returns Authorization result with detailed information
   */
  async authorize(request: AuthorizationRequest): Promise<AuthorizationResult> {
    const startTime = Date.now();
    const validationChecks: string[] = [];

    try {
      // CRITICAL: Validate request structure
      this.validateAuthorizationRequest(request);
      validationChecks.push('request_structure_valid');

      // CRITICAL: Validate permission exists
      if (!PermissionValidator.isValidPermission(request.permission)) {
        const result = this.createDenialResult(
          request,
          'INVALID_PERMISSION',
          validationChecks
        );
        
        this.logAuthorizationDecision(request, result, startTime);
        return result;
      }
      validationChecks.push('permission_valid');

      // CRITICAL: Validate tenant context
      const tenantValidation = await this.validateTenantContext(request.tenantContext);
      if (!tenantValidation.valid) {
        const result = this.createDenialResult(
          request,
          tenantValidation.reason,
          validationChecks
        );
        
        this.logAuthorizationDecision(request, result, startTime);
        return result;
      }
      validationChecks.push('tenant_context_valid');

      // CRITICAL: Get user permissions (with caching)
      const userPermissions = await this.getUserPermissions(
        (request.tenantContext as any).user?.id || '',
        request.tenantContext.tenantId,
        request.tenantContext.userRole
      );
      validationChecks.push('user_permissions_retrieved');

      // CRITICAL: Check if user has required permission
      const hasPermission = userPermissions.includes(request.permission);
      if (!hasPermission) {
        const result = this.createDenialResult(
          request,
          'PERMISSION_DENIED',
          validationChecks
        );
        
        this.logAuthorizationDecision(request, result, startTime);
        return result;
      }
      validationChecks.push('permission_granted');

      // CRITICAL: Validate resource ownership if resource is specified
      if (request.resource && this.config.enableResourceOwnershipValidation) {
        const ownershipValidation = await this.validateResourceOwnership(
          request.resource,
          request.tenantContext
        );
        
        if (!ownershipValidation.valid) {
          const result = this.createDenialResult(
            request,
            ownershipValidation.reason,
            validationChecks
          );
          
          this.logAuthorizationDecision(request, result, startTime);
          return result;
        }
        validationChecks.push('resource_ownership_valid');
      }

      // CRITICAL: All checks passed - authorization granted
      const result = this.createAuthorizationResult(request, validationChecks);
      
      this.logAuthorizationDecision(request, result, startTime);
      return result;

    } catch (error) {
      // CRITICAL: Any error results in denial (fail-safe)
      const result = this.createDenialResult(
        request,
        'AUTHORIZATION_ERROR',
        validationChecks,
        error as Error
      );
      
      this.logAuthorizationDecision(request, result, startTime);
      return result;
    }
  }

  /**
   * CRITICAL: Validate authorization request structure
   */
  private validateAuthorizationRequest(request: AuthorizationRequest): void {
    if (!request.permission) {
      throw new Error('Permission is required');
    }

    if (!request.tenantContext) {
      throw new Error('Tenant context is required');
    }

    if (!request.tenantContext.tenantId) {
      throw new Error('Tenant ID is required');
    }

    const userId = (request.tenantContext as any).user?.id;
    devInvariant(!!userId, 'RBAC_INVARIANT_VIOLATION', 'Authorization invariant violated: tenantContext.user.id must be present for authorization decisions.', {
      tenantId: request.tenantContext.tenantId,
      userId,
    });
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!request.tenantContext.userRole) {
      throw new Error('User role is required');
    }

    // CRITICAL: Validate resource if provided
    if (request.resource) {
      if (!request.resource.type || !request.resource.id) {
        throw new Error('Resource type and ID are required when resource is specified');
      }
    }
  }

  /**
   * CRITICAL: Validate tenant context
   */
  private async validateTenantContext(tenantContext: TenantContext): Promise<{
    valid: boolean;
    reason: string;
  }> {
    try {
      // CRITICAL: Check if tenant exists and is active
      const tenant = await this.prisma.$queryRaw`
        SELECT id, is_active 
        FROM tenants 
        WHERE id = ${tenantContext.tenantId} 
        AND deleted_at IS NULL
        LIMIT 1
      ` as Array<{ id: string; is_active: boolean }>;

      if (!tenant || tenant.length === 0) {
        return { valid: false, reason: 'TENANT_NOT_FOUND' };
      }

      if (!tenant[0].is_active) {
        return { valid: false, reason: 'TENANT_INACTIVE' };
      }

      // CRITICAL: Check if user is member of tenant
      const userId = (tenantContext as any).user?.id || '';
      const membership = await this.prisma.$queryRaw`
        SELECT role, is_active 
        FROM user_tenants 
        WHERE user_id = ${userId} 
        AND tenant_id = ${tenantContext.tenantId}
        AND deleted_at IS NULL
        LIMIT 1
      ` as Array<{ role: string; is_active: boolean }>;

      if (!membership || membership.length === 0) {
        return { valid: false, reason: 'USER_NOT_TENANT_MEMBER' };
      }

      if (!membership[0].is_active) {
        return { valid: false, reason: 'USER_MEMBERSHIP_INACTIVE' };
      }

      // CRITICAL: Validate user role matches membership
      if (membership[0].role !== tenantContext.userRole) {
        return { valid: false, reason: 'ROLE_MISMATCH' };
      }

      return { valid: true, reason: 'VALID' };

    } catch (error) {
      logger.error('Tenant context validation failed', error as Error, {
        tenantId: tenantContext.tenantId,
        userId: (tenantContext as any).user?.id
      });
      
      return { valid: false, reason: 'VALIDATION_ERROR' };
    }
  }

  /**
   * CRITICAL: Get user permissions with caching
   */
  private async getUserPermissions(
    userId: string,
    tenantId: string,
    role: TenantUserRole
  ): Promise<Permission[]> {
    const cacheKey = `${userId}:${tenantId}:${role}`;
    
    // CRITICAL: Check cache first
    if (this.config.cachePermissions) {
      const cached = this.permissionCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.config.cacheTTL) {
        return cached.permissions;
      }
    }

    // CRITICAL: Get permissions from registry
    const permissions = PermissionValidator.getRolePermissions(role);

    devInvariant(
      Array.isArray(permissions) && permissions.every((p) => PermissionValidator.isValidPermission(p)),
      'RBAC_INVARIANT_VIOLATION',
      'Authorization invariant violated: role permissions must be an array of valid permission strings.',
      { role, tenantId, userId },
    );

    // CRITICAL: Cache the result
    if (this.config.cachePermissions) {
      this.permissionCache.set(cacheKey, {
        permissions,
        timestamp: Date.now()
      });
    }

    return permissions;
  }

  /**
   * CRITICAL: Validate resource ownership
   */
  private async validateResourceOwnership(
    resource: {
      type: string;
      id: string;
      ownerId?: string;
      tenantId?: string;
    },
    tenantContext: TenantContext
  ): Promise<{ valid: boolean; reason: string }> {
    try {
      // CRITICAL: Check if resource belongs to tenant
      if (resource.tenantId && resource.tenantId !== tenantContext.tenantId) {
        return { valid: false, reason: 'RESOURCE_TENANT_MISMATCH' };
      }

      // CRITICAL: Check if user owns resource (if ownership is relevant)
      if (resource.ownerId && resource.ownerId !== (tenantContext as any).user?.id) {
        // Check if user has admin-level permissions that override ownership
        const adminPermissions = PermissionValidator.getRolePermissions(TenantUserRole.ADMIN);
        const userPermissions = PermissionValidator.getRolePermissions(tenantContext.userRole);
        
        const hasAdminOverride = adminPermissions.some(p => userPermissions.includes(p));
        
        if (!hasAdminOverride) {
          return { valid: false, reason: 'RESOURCE_OWNERSHIP_DENIED' };
        }
      }

      // CRITICAL: Verify resource actually exists and belongs to tenant
      const resourceExists = await this.verifyResourceExists(
        resource.type,
        resource.id,
        tenantContext.tenantId
      );

      if (!resourceExists) {
        return { valid: false, reason: 'RESOURCE_NOT_FOUND' };
      }

      return { valid: true, reason: 'VALID' };

    } catch (error) {
      logger.error('Resource ownership validation failed', error as Error, {
        resourceType: resource.type,
        resourceId: resource.id,
        tenantId: tenantContext.tenantId
      });
      
      return { valid: false, reason: 'VALIDATION_ERROR' };
    }
  }

  /**
   * CRITICAL: Verify resource exists and belongs to tenant
   */
  private async verifyResourceExists(
    resourceType: string,
    resourceId: string,
    tenantId: string
  ): Promise<boolean> {
    try {
      // CRITICAL: Use parameterized queries to prevent SQL injection
      const query = `
        SELECT 1 
        FROM ${this.escapeIdentifier(resourceType)} 
        WHERE id = $1 
        AND tenant_id = $2 
        AND deleted_at IS NULL 
        LIMIT 1
      `;
      
      const result = await this.prisma.$queryRawUnsafe(query, resourceId, tenantId);
      return Array.isArray(result) && result.length > 0;

    } catch (error) {
      logger.error('Resource existence verification failed', error as Error, {
        resourceType,
        resourceId,
        tenantId
      });
      
      // CRITICAL: Fail securely - assume resource doesn't exist
      return false;
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
   * CRITICAL: Create authorization result (granted)
   */
  private createAuthorizationResult(
    request: AuthorizationRequest,
    validationChecks: string[]
  ): AuthorizationResult {
    return {
      authorized: true,
      reason: 'AUTHORIZED',
      details: {
        permission: request.permission,
        userRole: request.tenantContext.userRole,
        tenantId: request.tenantContext.tenantId,
        userId: (request.tenantContext as any).user?.id || '',
        resourceType: request.resource?.type,
        resourceId: request.resource?.id,
        validationChecks
      }
    };
  }

  /**
   * CRITICAL: Create denial result
   */
  private createDenialResult(
    request: AuthorizationRequest,
    reason: string,
    validationChecks: string[],
    error?: Error
  ): AuthorizationResult {
    return {
      authorized: false,
      reason,
      details: {
        permission: request.permission,
        userRole: request.tenantContext.userRole,
        tenantId: request.tenantContext.tenantId,
        userId: (request.tenantContext as any).user?.id || '',
        resourceType: request.resource?.type,
        resourceId: request.resource?.id,
        validationChecks
      }
    };
  }

  private logAuthorizationDecision(
    request: AuthorizationRequest,
    result: AuthorizationResult,
    startTime: number
  ): void {
    const duration = Date.now() - startTime;
    logger.info('Authorization decision', {
      authorized: result.authorized,
      reason: result.reason,
      permission: request.permission,
      userRole: request.tenantContext.userRole,
      tenantId: request.tenantContext.tenantId,
      userId: (request.tenantContext as any).user?.id,
      resourceType: request.resource?.type,
      resourceId: request.resource?.id,
      validationChecks: result.details?.validationChecks || [],
      duration,
    });
  }

  /**
   * CRITICAL: Check if user has permission (convenience method)
   */
  async hasPermission(
    permission: Permission,
    tenantContext: TenantContext,
    resource?: AuthorizationRequest['resource']
  ): Promise<boolean> {
    const result = await this.authorize({
      permission,
      tenantContext,
      resource,
      context: {
        operation: 'permission_check',
        requestId: 'unknown',
        userId: (tenantContext as any).user?.id || '',
      }
    });

    return result.authorized;
  }

  /**
   * CRITICAL: Check if user has any of the specified permissions
   */
  async hasAnyPermission(
    permissions: Permission[],
    tenantContext: TenantContext,
    resource?: AuthorizationRequest['resource']
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(permission, tenantContext, resource)) {
        return true;
      }
    }
    return false;
  }

  /**
   * CRITICAL: Check if user has all specified permissions
   */
  async hasAllPermissions(
    permissions: Permission[],
    tenantContext: TenantContext,
    resource?: AuthorizationRequest['resource']
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission(permission, tenantContext, resource))) {
        return false;
      }
    }
    return true;
  }

  /**
   * CRITICAL: Get user permissions for debugging
   */
  async getUserPermissionsDebug(
    userId: string,
    tenantId: string,
    role: TenantUserRole
  ): Promise<{
    permissions: Permission[];
    role: TenantUserRole;
    cached: boolean;
  }> {
    const cacheKey = `${userId}:${tenantId}:${role}`;
    const cached = this.permissionCache.get(cacheKey);
    
    const permissions = await this.getUserPermissions(userId, tenantId, role);
    
    return {
      permissions,
      role,
      cached: !!cached && (Date.now() - cached.timestamp) < this.config.cacheTTL
    };
  }

  /**
   * CRITICAL: Clear permission cache
   */
  clearPermissionCache(): void {
    this.permissionCache.clear();
    logger.info('Permission cache cleared');
  }

  /**
   * CRITICAL: Get authorization engine metrics
   */
  getMetrics(): {
    cacheSize: number;
    permissionCount: number;
    roleCount: number;
    config: AuthorizationEngineConfig;
  } {
    return {
      cacheSize: this.permissionCache.size,
      permissionCount: this.permissionRegistry.permissions.size,
      roleCount: this.permissionRegistry.rolePermissions.size,
      config: this.config
    };
  }
}

/**
 * CRITICAL: Factory function for creating authorization engine
 */
export const createAuthorizationEngine = (
  prisma: PrismaClient,
  config?: Partial<AuthorizationEngineConfig>
): AuthorizationEngine => {
  return new AuthorizationEngine(prisma, config);
};

/**
 * CRITICAL: Global authorization engine instance
 */
let globalAuthorizationEngine: AuthorizationEngine | null = null;

/**
 * CRITICAL: Get or create global authorization engine
 */
export const getAuthorizationEngine = (
  prisma?: PrismaClient,
  config?: Partial<AuthorizationEngineConfig>
): AuthorizationEngine => {
  if (!globalAuthorizationEngine) {
    if (!prisma) {
      throw new Error('Prisma client required for first initialization');
    }
    globalAuthorizationEngine = new AuthorizationEngine(prisma, config);
  }
  return globalAuthorizationEngine;
};
