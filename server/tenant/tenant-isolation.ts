// Hard Tenant Isolation Enforcement
// CRITICAL SECURITY: Prevents ALL cross-tenant data access

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { TenantService, TenantUserRole } from './tenant-service.js';
import { logger } from '../utils/structured-logger.js';
import { devInvariant } from '../runtime/dev-invariants.js';

export interface TenantContext {
  tenantId: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    domain?: string;
    subscriptionPlan: string;
    subscriptionStatus: string;
    maxUsers: number;
    isActive: boolean;
  };
  userRole: TenantUserRole;
  permissions: string[];
  isOwner: boolean;
  isAdmin: boolean;
  isManager: boolean;
}

export interface AuthenticatedRequest {
  user?: {
    id: string;
    email?: string;
    name?: string;
    role: string;
    isActive: boolean;
  };
  tenantContext?: TenantContext;
}

export interface TenantIsolationConfig {
  requireTenant: boolean;
  allowedRoles?: TenantUserRole[];
  allowCrossTenant: boolean;
  skipAuthForPublic: boolean;
  enforceStrictIsolation: boolean;
}

export class TenantIsolationMiddleware {
  private tenantService: TenantService;
  private prisma: PrismaClient;
  private config: TenantIsolationConfig;

  constructor(prisma: PrismaClient, config: Partial<TenantIsolationConfig> = {}) {
    this.prisma = prisma;
    this.tenantService = new TenantService(prisma);
    this.config = {
      requireTenant: true,
      allowCrossTenant: false,
      skipAuthForPublic: false,
      enforceStrictIsolation: true,
      ...config
    };
  }

  /**
   * CRITICAL: Mandatory tenant context enforcement
   * This middleware MUST be applied to ALL authenticated routes
   */
  enforceTenantContext(options: Partial<TenantIsolationConfig> = {}) {
    const mergedConfig = { ...this.config, ...options };

    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const requestId = req.headers['x-request-id'] as string || 'unknown';
      
      try {
        const authReq = req as AuthenticatedRequest;

        // CRITICAL: Skip tenant context for public routes ONLY if explicitly configured
        if (mergedConfig.skipAuthForPublic && !authReq.user) {
          logger.info('Public route - skipping tenant context', {
            requestId,
            path: req.path,
            method: req.method
          });
          return next();
        }

        // CRITICAL: Authentication is mandatory for tenant context
        if (!authReq.user || !authReq.user.id) {
          logger.error('Authentication required for tenant context', undefined, {
            requestId,
            path: req.path,
            method: req.method,
            ip: req.ip,
            userAgent: req.headers['user-agent']
          });
          
          return res.status(401).json({
            error: 'Authentication required',
            code: 'AUTH_REQUIRED',
            requestId
          });
        }

        // CRITICAL: Extract and validate tenant context
        const tenantContext = await this.extractAndValidateTenantContext(
          authReq,
          mergedConfig,
          requestId
        );

        devInvariant(tenantContext.tenantId === tenantContext.tenant.id, 'TENANT_ISOLATION_INVARIANT', 'Tenant context invariant violated: tenantId must match tenant.id.', {
          tenantId: tenantContext.tenantId,
          tenantObjectId: tenantContext.tenant.id,
        });

        devInvariant(Array.isArray(tenantContext.permissions), 'TENANT_ISOLATION_INVARIANT', 'Tenant context invariant violated: permissions must be an array.', {
          permissionsType: typeof (tenantContext as any).permissions,
        });

        devInvariant(tenantContext.isOwner === (tenantContext.userRole === TenantUserRole.OWNER), 'TENANT_ISOLATION_INVARIANT', 'Tenant context invariant violated: isOwner flag must match userRole.', {
          userRole: tenantContext.userRole,
          isOwner: tenantContext.isOwner,
        });

        devInvariant(tenantContext.isAdmin === (tenantContext.userRole === TenantUserRole.ADMIN), 'TENANT_ISOLATION_INVARIANT', 'Tenant context invariant violated: isAdmin flag must match userRole.', {
          userRole: tenantContext.userRole,
          isAdmin: tenantContext.isAdmin,
        });

        devInvariant(tenantContext.isManager === (tenantContext.userRole === TenantUserRole.MANAGER), 'TENANT_ISOLATION_INVARIANT', 'Tenant context invariant violated: isManager flag must match userRole.', {
          userRole: tenantContext.userRole,
          isManager: tenantContext.isManager,
        });

        // CRITICAL: Attach tenant context to request
        authReq.tenantContext = tenantContext;

        // CRITICAL: Set database session variables for RLS
        await this.setDatabaseContext(authReq.user.id, tenantContext.tenantId, requestId);

        // Log successful tenant context establishment
        logger.info('Tenant context established', {
          requestId,
          userId: authReq.user.id,
          tenantId: tenantContext.tenantId,
          userRole: tenantContext.userRole,
          path: req.path,
          method: req.method,
          duration: Date.now() - startTime
        });

        next();
      } catch (error) {
        const err = error as Error;
        const duration = Date.now() - startTime;

        // CRITICAL: All tenant context errors must be logged
        logger.error('Tenant context enforcement failed', err as Error, {
          requestId,
          userId: (req as AuthenticatedRequest).user?.id,
          path: req.path,
          method: req.method,
          ip: req.ip,
          duration,
          error: err.message
        });

        // CRITICAL: Return specific error codes for security monitoring
        if (err.message.includes('TENANT_NOT_FOUND')) {
          return res.status(404).json({
            error: 'Tenant not found',
            code: 'TENANT_NOT_FOUND',
            requestId
          });
        }

        if (err.message.includes('TENANT_ACCESS_DENIED')) {
          return res.status(403).json({
            error: 'Access denied to tenant',
            code: 'TENANT_ACCESS_DENIED',
            requestId
          });
        }

        if (err.message.includes('TENANT_CONTEXT_REQUIRED')) {
          return res.status(400).json({
            error: 'Tenant context required',
            code: 'TENANT_CONTEXT_REQUIRED',
            requestId
          });
        }

        if (err.message.includes('TENANT_MEMBERSHIP_INVALID')) {
          return res.status(403).json({
            error: 'Invalid tenant membership',
            code: 'TENANT_MEMBERSHIP_INVALID',
            requestId
          });
        }

        if (err.message.includes('TENANT_INACTIVE')) {
          return res.status(403).json({
            error: 'Tenant is inactive',
            code: 'TENANT_INACTIVE',
            requestId
          });
        }

        // CRITICAL: Default to 403 for security - don't leak internal errors
        return res.status(403).json({
          error: 'Access denied',
          code: 'TENANT_ISOLATION_VIOLATION',
          requestId
        });
      }
    };
  }

  /**
   * CRITICAL: Extract tenant ID from multiple sources with validation
   */
  private async extractAndValidateTenantContext(
    req: AuthenticatedRequest,
    config: TenantIsolationConfig,
    requestId: string
  ): Promise<TenantContext> {
    // CRITICAL: Extract tenant ID in priority order
    const tenantId = this.extractTenantId(req, config.allowCrossTenant, requestId);

    // CRITICAL: Validate tenant exists and is active
    const tenant = await this.validateTenantExists(tenantId, requestId);
    
    if (!tenant.isActive) {
      throw new Error('TENANT_INACTIVE');
    }

    // CRITICAL: Validate user membership in tenant
    const userMembership = await this.validateUserMembership(
      req.user!.id,
      tenant.id,
      config.allowedRoles,
      requestId
    );

    // CRITICAL: Get user permissions based on role
    const permissions = this.getPermissionsForRole(userMembership.role);

    // CRITICAL: Build tenant context
    const tenantContext: TenantContext = {
      tenantId: tenant.id,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        subscriptionPlan: tenant.subscriptionPlan,
        subscriptionStatus: tenant.subscriptionStatus,
        maxUsers: tenant.maxUsers,
        isActive: tenant.isActive
      },
      userRole: userMembership.role,
      permissions,
      isOwner: userMembership.role === TenantUserRole.OWNER,
      isAdmin: userMembership.role === TenantUserRole.ADMIN,
      isManager: userMembership.role === TenantUserRole.MANAGER
    };

    devInvariant(tenantContext.tenantId === tenantContext.tenant.id, 'TENANT_ISOLATION_INVARIANT', 'Tenant context invariant violated: tenantId must match tenant.id.', {
      tenantId: tenantContext.tenantId,
      tenantObjectId: tenantContext.tenant.id,
    });

    return tenantContext;
  }

  /**
   * CRITICAL: Extract tenant ID from request with security validation
   */
  private extractTenantId(
    req: AuthenticatedRequest,
    allowCrossTenant: boolean,
    requestId: string
  ): string {
    // Priority 1: X-Tenant-ID header (most explicit and secure)
    const headerTenantId = (req as any).headers?.['x-tenant-id'] as string;
    if (headerTenantId) {
      // CRITICAL: Validate header format
      if (!this.isValidTenantId(headerTenantId)) {
        logger.error('Invalid tenant ID format in header', undefined, {
          requestId,
          tenantId: headerTenantId,
          source: 'header'
        });
        throw new Error('TENANT_CONTEXT_REQUIRED');
      }

      logger.debug('Tenant ID extracted from header', {
        requestId,
        tenantId: headerTenantId,
        source: 'header'
      });

      return headerTenantId;
    }

    // Priority 2: Subdomain extraction (only if cross-tenant is allowed)
    if (allowCrossTenant) {
      const host = (req as any).headers?.host;
      if (host) {
        const subdomain = this.extractSubdomain(host);
        if (subdomain) {
          logger.debug('Tenant ID extracted from subdomain', {
            requestId,
            tenantId: subdomain,
            source: 'subdomain'
          });
          return subdomain;
        }
      }
    }

    // Priority 3: JWT token claims (fallback)
    const tokenTenantId = this.extractFromToken(req);
    if (tokenTenantId) {
      logger.debug('Tenant ID extracted from token', {
        requestId,
        tenantId: tokenTenantId,
        source: 'token'
      });
      return tokenTenantId;
    }

    // CRITICAL: No tenant ID found - this is a security violation
    logger.error('No tenant ID found in request', undefined, {
      requestId,
      headers: Object.keys((req as any).headers || {}),
      hasUser: !!req.user,
      path: (req as any).path,
      method: (req as any).method
    });

    throw new Error('TENANT_CONTEXT_REQUIRED');
  }

  /**
   * CRITICAL: Validate tenant ID format
   */
  private isValidTenantId(tenantId: string): boolean {
    // CRITICAL: Tenant IDs must start with 'tn_' and be 35 characters total
    const tenantIdPattern = /^tn_[a-f0-9]{32}$/;
    return tenantIdPattern.test(tenantId);
  }

  /**
   * CRITICAL: Extract subdomain with security validation
   */
  private extractSubdomain(host: string): string | null {
    // Remove port if present
    const hostname = host.split(':')[0];
    
    // CRITICAL: Skip main domains
    const mainDomains = [
      'localhost',
      '127.0.0.1',
      process.env.MAIN_DOMAIN,
      'accubooks.com',
      'chronaworkflow.com'
    ];

    if (mainDomains.includes(hostname)) {
      return null;
    }

    // Extract subdomain
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const subdomain = parts[0];
      
      // CRITICAL: Skip common subdomains
      const commonSubdomains = ['www', 'api', 'app', 'admin', 'staging', 'dev'];
      if (!commonSubdomains.includes(subdomain) && this.isValidTenantId(subdomain)) {
        return subdomain;
      }
    }

    return null;
  }

  /**
   * CRITICAL: Extract tenant ID from JWT token
   */
  private extractFromToken(req: AuthenticatedRequest): string | null {
    // This would extract from JWT claims if available
    // For now, return null to force header-based extraction
    return null;
  }

  /**
   * CRITICAL: Validate tenant exists and is accessible
   */
  private async validateTenantExists(tenantId: string, requestId: string): Promise<any> {
    const tenant = await this.tenantService.getTenantById(tenantId);
    
    if (!tenant) {
      logger.error('Tenant not found', undefined, {
        requestId,
        tenantId
      });
      throw new Error('TENANT_NOT_FOUND');
    }

    return tenant;
  }

  /**
   * CRITICAL: Validate user membership in tenant
   */
  private async validateUserMembership(
    userId: string,
    tenantId: string,
    allowedRoles: TenantUserRole[] | undefined,
    requestId: string
  ): Promise<any> {
    const userTenants = await this.tenantService.getUserTenants(userId);
    const userTenant = userTenants.find(ut => ut.tenantMembership.tenantId === tenantId);
    
    if (!userTenant || !userTenant.tenantMembership.isActive) {
      logger.error('User tenant membership invalid', undefined, {
        requestId,
        userId,
        tenantId,
        hasMembership: !!userTenant,
        isActive: userTenant?.tenantMembership.isActive
      });
      throw new Error('TENANT_MEMBERSHIP_INVALID');
    }

    // CRITICAL: Check role restrictions
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(userTenant.tenantMembership.role)) {
        logger.error('User role not allowed', undefined, {
          requestId,
          userId,
          tenantId,
          userRole: userTenant.tenantMembership.role,
          allowedRoles
        });
        throw new Error('TENANT_ACCESS_DENIED');
      }
    }

    return userTenant.tenantMembership;
  }

  /**
   * CRITICAL: Get permissions for tenant role
   */
  private getPermissionsForRole(role: TenantUserRole): string[] {
    const rolePermissions = {
      [TenantUserRole.OWNER]: [
        'tenant:read',
        'tenant:write',
        'tenant:delete',
        'tenant:manage_users',
        'tenant:manage_settings',
        'tenant:manage_billing',
        'tenant:manage_integrations',
        'data:read',
        'data:write',
        'data:delete',
        'users:read',
        'users:write',
        'users:delete',
        'reports:read',
        'reports:write',
        'audit:read'
      ],
      [TenantUserRole.ADMIN]: [
        'tenant:read',
        'tenant:write',
        'tenant:manage_users',
        'tenant:manage_settings',
        'data:read',
        'data:write',
        'data:delete',
        'users:read',
        'users:write',
        'reports:read',
        'reports:write',
        'audit:read'
      ],
      [TenantUserRole.MANAGER]: [
        'tenant:read',
        'data:read',
        'data:write',
        'users:read',
        'users:write',
        'reports:read',
        'reports:write'
      ],
      [TenantUserRole.EMPLOYEE]: [
        'tenant:read',
        'data:read',
        'data:write',
        'reports:read'
      ],
      [TenantUserRole.VIEWER]: [
        'tenant:read',
        'data:read',
        'reports:read'
      ]
    };

    return rolePermissions[role] || [];
  }

  /**
   * CRITICAL: Set database session variables for Row Level Security
   */
  private async setDatabaseContext(
    userId: string,
    tenantId: string,
    requestId: string
  ): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        SET LOCAL app.current_user_id = ${userId};
        SET LOCAL app.current_tenant_id = ${tenantId};
        SET LOCAL app.is_service_account = 'false';
        SET LOCAL app.request_id = ${requestId};
      `;

      logger.debug('Database context set', {
        requestId,
        userId,
        tenantId
      });
    } catch (error) {
      logger.error('Failed to set database context', error as Error, {
        requestId,
        userId,
        tenantId
      });
      throw new Error('TENANT_CONTEXT_REQUIRED');
    }
  }

  /**
   * CRITICAL: Helper functions for permission checking
   */
  static hasPermission(req: AuthenticatedRequest, permission: string): boolean {
    return req.tenantContext?.permissions.includes(permission) || false;
  }

  static hasAnyPermission(req: AuthenticatedRequest, permissions: string[]): boolean {
    const userPermissions = req.tenantContext?.permissions || [];
    return permissions.some(permission => userPermissions.includes(permission));
  }

  static hasRole(req: AuthenticatedRequest, role: TenantUserRole): boolean {
    return req.tenantContext?.userRole === role;
  }

  static isAdmin(req: AuthenticatedRequest): boolean {
    return req.tenantContext?.isOwner || req.tenantContext?.isAdmin || false;
  }

  static isManager(req: AuthenticatedRequest): boolean {
    return req.tenantContext?.isOwner || 
           req.tenantContext?.isAdmin || 
           req.tenantContext?.isManager || false;
  }

  static requirePermission(permission: string) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!TenantIsolationMiddleware.hasPermission(req, permission)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'PERMISSION_DENIED',
          requiredPermission: permission
        });
      }
      next();
    };
  }

  static requireRole(role: TenantUserRole) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!TenantIsolationMiddleware.hasRole(req, role)) {
        return res.status(403).json({
          error: 'Insufficient role',
          code: 'ROLE_DENIED',
          requiredRole: role
        });
      }
      next();
    };
  }

  static requireAdmin() {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!TenantIsolationMiddleware.isAdmin(req)) {
        return res.status(403).json({
          error: 'Admin access required',
          code: 'ADMIN_REQUIRED'
        });
      }
      next();
    };
  }

  static requireManager() {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!TenantIsolationMiddleware.isManager(req)) {
        return res.status(403).json({
          error: 'Manager access required',
          code: 'MANAGER_REQUIRED'
        });
      }
      next();
    };
  }
}

// CRITICAL: Export factory function for mandatory tenant isolation
export const createTenantIsolation = (
  prisma: PrismaClient,
  config?: Partial<TenantIsolationConfig>
): TenantIsolationMiddleware => {
  return new TenantIsolationMiddleware(prisma, config);
};
