// Tenant Context Middleware
// Ensures tenant context is available and validated for all requests

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { TenantService, TenantUserRole } from './tenant-service.js';

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

export interface TenantContextOptions {
  requireTenant?: boolean;
  allowedRoles?: TenantUserRole[];
  allowCrossTenant?: boolean;
  skipAuthForPublic?: boolean;
}

export class TenantContextMiddleware {
  private tenantService: TenantService;
  private prisma: PrismaClient;
  private defaultOptions: TenantContextOptions;

  constructor(prisma: PrismaClient, options: Partial<TenantContextOptions> = {}) {
    this.prisma = prisma;
    this.tenantService = new TenantService(prisma);
    this.defaultOptions = {
      requireTenant: true,
      allowedRoles: [],
      allowCrossTenant: false,
      skipAuthForPublic: false,
      ...options
    };
  }

  /**
   * Main middleware to extract and validate tenant context
   */
  middleware(options: Partial<TenantContextOptions> = {}) {
    const mergedOptions = { ...this.defaultOptions, ...options };

    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const authReq = req as AuthenticatedRequest;

        // Skip tenant context for public routes if configured
        if (mergedOptions.skipAuthForPublic && !authReq.user) {
          return next();
        }

        // Ensure user is authenticated
        if (!authReq.user) {
          return res.status(401).json({
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
          });
        }

        // Extract tenant ID from various sources
        const tenantId = this.extractTenantId(authReq, mergedOptions.allowCrossTenant);

        // Validate tenant context
        const tenantContext = await this.validateTenantContext(
          authReq.user.id,
          tenantId,
          mergedOptions.allowedRoles || []
        );

        // Attach tenant context to request
        authReq.tenantContext = tenantContext;

        // Set database session variables for RLS
        await this.setDatabaseContext(authReq.user.id, tenantContext.tenantId);

        next();
      } catch (error) {
        const err = error as Error;
        
        if (err.message.includes('Tenant not found')) {
          return res.status(404).json({
            error: 'Tenant not found',
            code: 'TENANT_NOT_FOUND'
          });
        }

        if (err.message.includes('Access denied')) {
          return res.status(403).json({
            error: 'Access denied to tenant',
            code: 'TENANT_ACCESS_DENIED'
          });
        }

        if (err.message.includes('Tenant context required')) {
          return res.status(400).json({
            error: 'Tenant context required',
            code: 'TENANT_CONTEXT_REQUIRED'
          });
        }

        // Log unexpected errors
        console.error('Tenant context middleware error:', err);
        return res.status(500).json({
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        });
      }
    };
  }

  /**
   * Extract tenant ID from request
   */
  private extractTenantId(req: Request, allowCrossTenant: boolean): string | null {
    // Priority order: Header > Subdomain > Query Param > User's primary tenant

    // 1. X-Tenant-ID header (most explicit)
    const headerTenantId = req.headers['x-tenant-id'] as string;
    if (headerTenantId) {
      return headerTenantId;
    }

    // 2. Subdomain extraction
    const host = req.headers.host;
    if (host && !allowCrossTenant) {
      const subdomain = this.extractSubdomain(host);
      if (subdomain) {
        return subdomain;
      }
    }

    // 3. Query parameter (for development/testing only)
    const queryTenantId = req.query.tenant_id as string;
    if (queryTenantId && process.env.NODE_ENV === 'development') {
      return queryTenantId;
    }

    // 4. Return null to use user's primary tenant
    return null;
  }

  /**
   * Extract subdomain from host
   */
  private extractSubdomain(host: string): string | null {
    // Remove port if present
    const hostname = host.split(':')[0];
    
    // Skip if it's the main domain
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
      
      // Skip common subdomains
      const commonSubdomains = ['www', 'api', 'app', 'admin', 'staging', 'dev'];
      if (!commonSubdomains.includes(subdomain)) {
        return subdomain;
      }
    }

    return null;
  }

  /**
   * Validate tenant context and user permissions
   */
  private async validateTenantContext(
    userId: string,
    tenantId: string | null,
    allowedRoles: TenantUserRole[]
  ): Promise<TenantContext> {
    let targetTenantId = tenantId;

    // If no tenant ID provided, use user's primary tenant
    if (!targetTenantId) {
      const primaryTenant = await this.tenantService.getPrimaryTenant(userId);
      if (!primaryTenant) {
        throw new Error('No tenant context available');
      }
      targetTenantId = primaryTenant.id;
    }

    // Get tenant details
    const tenant = await this.tenantService.getTenantById(targetTenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Check if tenant is active
    if (!tenant.isActive) {
      throw new Error('Access denied');
    }

    // Get user's role in tenant
    const userTenants = await this.tenantService.getUserTenants(userId);
    const userTenant = userTenants.find(ut => ut.tenantMembership.tenantId === targetTenantId);
    
    if (!userTenant || !userTenant.tenantMembership.isActive) {
      throw new Error('Access denied');
    }

    const userRole = userTenant.tenantMembership.role;

    // Check role restrictions
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      throw new Error('Access denied');
    }

    // Get user permissions based on role
    const permissions = this.getPermissionsForRole(userRole);

    return {
      tenantId: targetTenantId,
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
      userRole,
      permissions,
      isOwner: userRole === TenantUserRole.OWNER,
      isAdmin: userRole === TenantUserRole.ADMIN,
      isManager: userRole === TenantUserRole.MANAGER
    };
  }

  /**
   * Get permissions for tenant role
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
   * Set database session variables for Row Level Security
   */
  private async setDatabaseContext(userId: string, tenantId: string): Promise<void> {
    // This would be implemented with your database client
    // For PostgreSQL with Prisma, you'd use:
    await this.prisma.$executeRaw`
      SET LOCAL app.current_user_id = ${userId};
      SET LOCAL app.current_tenant_id = ${tenantId};
      SET LOCAL app.is_service_account = 'false';
    `;
  }

  /**
   * Middleware to require specific tenant role
   */
  requireRole(roles: TenantUserRole | TenantUserRole[]) {
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    return this.middleware({
      allowedRoles: requiredRoles
    });
  }

  /**
   * Middleware to require tenant ownership
   */
  requireOwner() {
    return this.requireRole(TenantUserRole.OWNER);
  }

  /**
   * Middleware to require tenant admin or higher
   */
  requireAdmin() {
    return this.requireRole([TenantUserRole.OWNER, TenantUserRole.ADMIN]);
  }

  /**
   * Middleware to require manager or higher
   */
  requireManager() {
    return this.requireRole([TenantUserRole.OWNER, TenantUserRole.ADMIN, TenantUserRole.MANAGER]);
  }

  /**
   * Middleware for cross-tenant operations (system admin only)
   */
  allowCrossTenant() {
    return this.middleware({
      allowCrossTenant: true,
      allowedRoles: [TenantUserRole.OWNER] // Only owners can do cross-tenant ops
    });
  }

  /**
   * Middleware for public routes (no tenant required)
   */
  public() {
    return this.middleware({
      requireTenant: false,
      skipAuthForPublic: true
    });
  }

  /**
   * Middleware to update user's last active timestamp
   */
  updateLastActivity() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const authReq = req as AuthenticatedRequest;
      
      // Update last active in background (don't block response)
      if (authReq.tenantContext) {
        setImmediate(async () => {
          try {
            await this.tenantService.updateLastActive(
              authReq.user!.id,
              authReq.tenantContext!.tenantId
            );
          } catch (error) {
            // Log but don't fail the request
            console.error('Failed to update last activity:', error);
          }
        });
      }
      
      next();
    };
  }

  /**
   * Helper function to check if user has permission
   */
  static hasPermission(req: AuthenticatedRequest, permission: string): boolean {
    return req.tenantContext?.permissions.includes(permission) || false;
  }

  /**
   * Helper function to check if user has any of the specified permissions
   */
  static hasAnyPermission(req: AuthenticatedRequest, permissions: string[]): boolean {
    const userPermissions = req.tenantContext?.permissions || [];
    return permissions.some(permission => userPermissions.includes(permission));
  }

  /**
   * Helper function to check if user has specific role
   */
  static hasRole(req: AuthenticatedRequest, role: TenantUserRole): boolean {
    return req.tenantContext?.userRole === role;
  }

  /**
   * Helper function to check if user is owner or admin
   */
  static isAdmin(req: AuthenticatedRequest): boolean {
    return req.tenantContext?.isOwner || req.tenantContext?.isAdmin || false;
  }

  /**
   * Helper function to check if user is owner, admin, or manager
   */
  static isManager(req: AuthenticatedRequest): boolean {
    return req.tenantContext?.isOwner || 
           req.tenantContext?.isAdmin || 
           req.tenantContext?.isManager || false;
  }
}

// Export factory function
export const createTenantMiddleware = (
  prisma: PrismaClient,
  options?: Partial<TenantContextOptions>
): TenantContextMiddleware => {
  return new TenantContextMiddleware(prisma, options);
};
