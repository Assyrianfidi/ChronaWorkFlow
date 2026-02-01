// CRITICAL: Authoritative Permission Model for Tenant RBAC
// MANDATORY: All permissions are explicit, server-side only, deny-by-default

import { TenantUserRole } from '../tenant/tenant-service.js';

/**
 * CRITICAL: Permission System Architecture
 * 
 * Permissions are hierarchical strings: domain:action[:scope]
 * - domain: High-level area (billing, users, accounting, reports, system)
 * - action: Specific operation (create, read, update, delete, invite, etc.)
 * - scope: Optional resource scope (own, all, tenant, etc.)
 * 
 * Examples:
 * - billing:create
 * - users:invite
 * - accounting:read:own
 * - reports:export:all
 * - system:admin
 */

export type Permission = string;

export interface PermissionDomain {
  name: string;
  description: string;
  permissions: Permission[];
}

export interface PermissionRegistry {
  domains: Map<string, PermissionDomain>;
  permissions: Set<Permission>;
  rolePermissions: Map<TenantUserRole, Permission[]>;
}

/**
 * CRITICAL: Canonical Permission Definitions
 * These are the ONLY valid permissions in the system
 */
const PERMISSION_REGISTRY: PermissionRegistry = {
  domains: new Map([
    // BILLING DOMAIN - All billing-related operations
    ['billing', {
      name: 'billing',
      description: 'Billing and subscription management',
      permissions: [
        'billing:read',           // Read billing information
        'billing:create',         // Create billing records
        'billing:update',         // Update billing records
        'billing:delete',         // Delete billing records
        'billing:export',         // Export billing data
        'billing:refund',         // Process refunds
        'billing:subscription:create',  // Create subscriptions
        'billing:subscription:update',  // Update subscriptions
        'billing:subscription:cancel',  // Cancel subscriptions
        'billing:payment:process',      // Process payments
        'billing:invoice:generate',     // Generate invoices
        'billing:invoice:send',         // Send invoices
        'billing:plan:upgrade',         // Upgrade plans
        'billing:plan:downgrade'        // Downgrade plans
      ]
    }],

    // USERS DOMAIN - User management and invitations
    ['users', {
      name: 'users',
      description: 'User management and access control',
      permissions: [
        'users:read',            // Read user information
        'users:create',          // Create new users
        'users:update',          // Update user information
        'users:delete',          // Delete users
        'users:invite',          // Invite users to tenant
        'users:deactivate',      // Deactivate users
        'users:reactivate',     // Reactivate users
        'users:role:assign',     // Assign roles to users
        'users:role:revoke',     // Revoke roles from users
        'users:profile:read',    // Read user profiles
        'users:profile:update',  // Update user profiles
        'users:profile:delete',  // Delete user profiles
        'users:session:read',    // Read user sessions
        'users:session:revoke',  // Revoke user sessions
        'users:permission:view'  // View user permissions
      ]
    }],

    // ACCOUNTING DOMAIN - Financial data and transactions
    ['accounting', {
      name: 'accounting',
      description: 'Accounting and financial operations',
      permissions: [
        'accounting:read',           // Read accounting data
        'accounting:create',         // Create accounting records
        'accounting:update',         // Update accounting records
        'accounting:delete',         // Delete accounting records
        'accounting:export',         // Export accounting data
        'accounting:transaction:create',  // Create transactions
        'accounting:transaction:update',  // Update transactions
        'accounting:transaction:delete',  // Delete transactions
        'accounting:transaction:approve', // Approve transactions
        'accounting:transaction:reject',  // Reject transactions
        'accounting:journal:create',      // Create journal entries
        'accounting:journal:read',        // Read journal entries
        'accounting:journal:update',      // Update journal entries
        'accounting:reconcile',           // Reconcile accounts
        'accounting:report:generate',     // Generate accounting reports
        'accounting:audit:read'           // Read audit logs
      ]
    }],

    // FINANCE DOMAIN - Period close and reporting lifecycle controls
    ['finance', {
      name: 'finance',
      description: 'Financial period close and reporting controls',
      permissions: [
        'finance:close',
        'finance:reopen',
        'finance:attest'
      ]
    }],

    // REPORTS DOMAIN - Reporting and analytics
    ['reports', {
      name: 'reports',
      description: 'Reporting and analytics operations',
      permissions: [
        'reports:read',           // Read reports
        'reports:create',         // Create reports
        'reports:update',         // Update reports
        'reports:delete',         // Delete reports
        'reports:export',         // Export reports
        'reports:share',          // Share reports
        'reports:schedule',       // Schedule reports
        'reports:template:create', // Create report templates
        'reports:template:update', // Update report templates
        'reports:template:delete', // Delete report templates
        'reports:dashboard:create', // Create dashboards
        'reports:dashboard:update', // Update dashboards
        'reports:dashboard:delete', // Delete dashboards
        'reports:analytics:read',    // Read analytics
        'reports:analytics:export',  // Export analytics
        'reports:kpi:read',          // Read KPIs
        'reports:kpi:update'         // Update KPIs
      ]
    }],

    // SYSTEM DOMAIN - System administration and configuration
    ['system', {
      name: 'system',
      description: 'System administration and configuration',
      permissions: [
        'system:read',            // Read system configuration
        'system:update',         // Update system configuration
        'system:admin',          // Full system administration
        'system:backup:create',  // Create system backups
        'system:backup:restore', // Restore system backups
        'system:maintenance',    // Perform system maintenance
        'system:monitor',        // Monitor system health
        'system:logs:read',      // Read system logs
        'system:logs:export',    // Export system logs
        'system:security:read',  // Read security settings
        'system:security:update', // Update security settings
        'system:tenant:create',   // Create new tenants
        'system:tenant:update',  // Update tenant settings
        'system:tenant:delete',  // Delete tenants
        'system:feature:enable', // Enable features
        'system:feature:disable', // Disable features
        'system:api:read',       // Read API configuration
        'system:api:update'      // Update API configuration
      ]
    }],

    // INVENTORY DOMAIN - Inventory and stock management
    ['inventory', {
      name: 'inventory',
      description: 'Inventory and stock management',
      permissions: [
        'inventory:read',           // Read inventory data
        'inventory:create',         // Create inventory records
        'inventory:update',         // Update inventory records
        'inventory:delete',         // Delete inventory records
        'inventory:export',         // Export inventory data
        'inventory:stock:adjust',   // Adjust stock levels
        'inventory:stock:transfer', // Transfer stock between locations
        'inventory:stock:count',    // Perform stock counts
        'inventory:product:create', // Create products
        'inventory:product:update', // Update products
        'inventory:product:delete', // Delete products
        'inventory:category:create', // Create categories
        'inventory:category:update', // Update categories
        'inventory:category:delete', // Delete categories
        'inventory:supplier:create', // Create suppliers
        'inventory:supplier:update', // Update suppliers
        'inventory:supplier:delete', // Delete suppliers
        'inventory:report:generate'  // Generate inventory reports
      ]
    }]
  ]),
  
  permissions: new Set([
    // BILLING permissions
    'billing:read', 'billing:create', 'billing:update', 'billing:delete',
    'billing:export', 'billing:refund', 'billing:subscription:create',
    'billing:subscription:update', 'billing:subscription:cancel',
    'billing:payment:process', 'billing:invoice:generate', 'billing:invoice:send',
    'billing:plan:upgrade', 'billing:plan:downgrade',
    
    // USERS permissions
    'users:read', 'users:create', 'users:update', 'users:delete',
    'users:invite', 'users:deactivate', 'users:reactivate',
    'users:role:assign', 'users:role:revoke', 'users:profile:read',
    'users:profile:update', 'users:profile:delete', 'users:session:read',
    'users:session:revoke', 'users:permission:view',
    
    // ACCOUNTING permissions
    'accounting:read', 'accounting:create', 'accounting:update', 'accounting:delete',
    'accounting:export', 'accounting:transaction:create', 'accounting:transaction:update',
    'accounting:transaction:delete', 'accounting:transaction:approve',
    'accounting:transaction:reject', 'accounting:journal:create', 'accounting:journal:read',
    'accounting:journal:update', 'accounting:reconcile', 'accounting:report:generate',
    'accounting:audit:read',

    // FINANCE permissions
    'finance:close', 'finance:reopen', 'finance:attest',
    
    // REPORTS permissions
    'reports:read', 'reports:create', 'reports:update', 'reports:delete',
    'reports:export', 'reports:share', 'reports:schedule', 'reports:template:create',
    'reports:template:update', 'reports:template:delete', 'reports:dashboard:create',
    'reports:dashboard:update', 'reports:dashboard:delete', 'reports:analytics:read',
    'reports:analytics:export', 'reports:kpi:read', 'reports:kpi:update',
    
    // SYSTEM permissions
    'system:read', 'system:update', 'system:admin', 'system:backup:create',
    'system:backup:restore', 'system:maintenance', 'system:monitor',
    'system:logs:read', 'system:logs:export', 'system:security:read',
    'system:security:update', 'system:tenant:create', 'system:tenant:update',
    'system:tenant:delete', 'system:feature:enable', 'system:feature:disable',
    'system:api:read', 'system:api:update',
    
    // INVENTORY permissions
    'inventory:read', 'inventory:create', 'inventory:update', 'inventory:delete',
    'inventory:export', 'inventory:stock:adjust', 'inventory:stock:transfer',
    'inventory:stock:count', 'inventory:product:create', 'inventory:product:update',
    'inventory:product:delete', 'inventory:category:create', 'inventory:category:update',
    'inventory:category:delete', 'inventory:supplier:create', 'inventory:supplier:update',
    'inventory:supplier:delete', 'inventory:report:generate'
  ]),
  
  rolePermissions: new Map([
    // OWNER - Full control over tenant resources
    [TenantUserRole.OWNER, [
      // Populated after registry initialization to avoid self-referential initialization.
    ]],
    
    // ADMIN - High-level administrative permissions
    [TenantUserRole.ADMIN, [
      // Billing permissions
      'billing:read', 'billing:create', 'billing:update', 'billing:export',
      'billing:invoice:generate', 'billing:invoice:send',
      'billing:subscription:create', 'billing:subscription:update',
      'billing:payment:process', 'billing:plan:upgrade',
      
      // User permissions (except deleting other admins)
      'users:read', 'users:create', 'users:update', 'users:invite',
      'users:deactivate', 'users:reactivate', 'users:role:assign',
      'users:role:revoke', 'users:profile:read', 'users:profile:update',
      'users:session:read', 'users:session:revoke', 'users:permission:view',
      
      // Accounting permissions
      'accounting:read', 'accounting:create', 'accounting:update', 'accounting:export',
      'accounting:transaction:create', 'accounting:transaction:update',
      'accounting:transaction:approve', 'accounting:journal:create',
      'accounting:journal:read', 'accounting:reconcile', 'accounting:report:generate',

      // Finance period close permissions
      'finance:close', 'finance:reopen', 'finance:attest',
      
      // Reports permissions
      'reports:read', 'reports:create', 'reports:update', 'reports:export',
      'reports:share', 'reports:schedule', 'reports:template:create',
      'reports:template:update', 'reports:dashboard:create', 'reports:dashboard:update',
      'reports:analytics:read', 'reports:analytics:export', 'reports:kpi:read',
      
      // Inventory permissions
      'inventory:read', 'inventory:create', 'inventory:update', 'inventory:export',
      'inventory:stock:adjust', 'inventory:stock:transfer', 'inventory:stock:count',
      'inventory:product:create', 'inventory:product:update', 'inventory:category:create',
      'inventory:category:update', 'inventory:supplier:create', 'inventory:supplier:update',
      'inventory:report:generate'
    ]],
    
    // MANAGER - Business operations permissions
    [TenantUserRole.MANAGER, [
      // Billing permissions (read and basic operations)
      'billing:read', 'billing:invoice:generate', 'billing:invoice:send',
      
      // User permissions (limited)
      'users:read', 'users:profile:read', 'users:profile:update',
      
      // Accounting permissions
      'accounting:read', 'accounting:create', 'accounting:update',
      'accounting:transaction:create', 'accounting:transaction:update',
      'accounting:journal:read', 'accounting:reconcile', 'accounting:report:generate',

      // Finance (MANAGER cannot attest)
      'finance:close', 'finance:reopen',
      
      // Reports permissions
      'reports:read', 'reports:create', 'reports:update', 'reports:export',
      'reports:analytics:read', 'reports:kpi:read',
      
      // Inventory permissions
      'inventory:read', 'inventory:create', 'inventory:update', 'inventory:export',
      'inventory:stock:adjust', 'inventory:stock:transfer', 'inventory:stock:count',
      'inventory:product:create', 'inventory:product:update', 'inventory:report:generate'
    ]],
    
    // EMPLOYEE - Basic operational permissions
    [TenantUserRole.EMPLOYEE, [
      // Limited billing permissions
      'billing:read',
      
      // Limited user permissions
      'users:read', 'users:profile:read', 'users:profile:update',
      
      // Limited accounting permissions
      'accounting:read', 'accounting:create', 'accounting:update',
      'accounting:transaction:create', 'accounting:transaction:update',

      // Finance (EMPLOYEE cannot close/reopen/attest)
      
      // Limited reports permissions
      'reports:read', 'reports:analytics:read', 'reports:kpi:read',
      
      // Limited inventory permissions
      'inventory:read', 'inventory:create', 'inventory:update',
      'inventory:stock:adjust', 'inventory:stock:count',
      'inventory:product:create', 'inventory:product:update'
    ]],
    
    // VIEWER - Read-only permissions
    [TenantUserRole.VIEWER, [
      // Read-only permissions across all domains
      'billing:read',
      'users:read', 'users:profile:read',
      'accounting:read', 'accounting:journal:read',
      'reports:read', 'reports:analytics:read', 'reports:kpi:read',
      'inventory:read'
    ]]
  ])
};

// CRITICAL: Populate OWNER permissions after registry initialization (deny-by-default still holds for other roles)
PERMISSION_REGISTRY.rolePermissions.set(
  TenantUserRole.OWNER,
  Array.from(PERMISSION_REGISTRY.permissions).filter(p => !p.startsWith('system:'))
);

/**
 * CRITICAL: Permission validation utilities
 */
export class PermissionValidator {
  private static registry = PERMISSION_REGISTRY;

  /**
   * CRITICAL: Validate permission string format
   */
  static isValidPermission(permission: string): boolean {
    return this.registry.permissions.has(permission);
  }

  /**
   * CRITICAL: Validate permission domain exists
   */
  static isValidDomain(domain: string): boolean {
    return this.registry.domains.has(domain);
  }

  /**
   * CRITICAL: Get all permissions for a role
   */
  static getRolePermissions(role: TenantUserRole): Permission[] {
    return this.registry.rolePermissions.get(role) || [];
  }

  /**
   * CRITICAL: Check if role has specific permission
   */
  static hasPermission(role: TenantUserRole, permission: Permission): boolean {
    const rolePermissions = this.getRolePermissions(role);
    return rolePermissions.includes(permission);
  }

  /**
   * CRITICAL: Get all permissions in a domain
   */
  static getDomainPermissions(domain: string): Permission[] {
    const domainInfo = this.registry.domains.get(domain);
    return domainInfo ? domainInfo.permissions : [];
  }

  /**
   * CRITICAL: Validate permission registry completeness
   */
  static validateRegistry(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check all role permissions exist in registry
    for (const [role, permissions] of this.registry.rolePermissions) {
      for (const permission of permissions) {
        if (!this.isValidPermission(permission)) {
          errors.push(`Role ${role} has undefined permission: ${permission}`);
        }
      }
    }

    // Check all domain permissions exist in registry
    for (const [domain, domainInfo] of this.registry.domains) {
      for (const permission of domainInfo.permissions) {
        if (!this.isValidPermission(permission)) {
          errors.push(`Domain ${domain} has undefined permission: ${permission}`);
        }
      }
    }

    // Check all registry permissions are assigned to at least one role
    const assignedPermissions = new Set<Permission>();
    for (const permissions of this.registry.rolePermissions.values()) {
      permissions.forEach(p => assignedPermissions.add(p));
    }

    for (const permission of this.registry.permissions) {
      if (!assignedPermissions.has(permission) && !permission.startsWith('system:')) {
        errors.push(`Permission ${permission} is not assigned to any role`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * CRITICAL: Get permission hierarchy for UI display
   */
  static getPermissionHierarchy(): Array<{
    domain: string;
    description: string;
    permissions: Array<{
      permission: string;
      description: string;
      roles: TenantUserRole[];
    }>;
  }> {
    const hierarchy: Array<any> = [];

    for (const [domainName, domainInfo] of this.registry.domains) {
      const permissions = domainInfo.permissions.map(permission => ({
        permission,
        description: this.getPermissionDescription(permission),
        roles: Array.from(this.registry.rolePermissions.entries())
          .filter(([_, perms]) => perms.includes(permission))
          .map(([role]) => role)
      }));

      hierarchy.push({
        domain: domainName,
        description: domainInfo.description,
        permissions
      });
    }

    return hierarchy;
  }

  /**
   * CRITICAL: Get human-readable permission description
   */
  private static getPermissionDescription(permission: string): string {
    const descriptions: Record<string, string> = {
      // Billing
      'billing:read': 'View billing information and invoices',
      'billing:create': 'Create billing records and charges',
      'billing:update': 'Update billing information',
      'billing:delete': 'Delete billing records',
      'billing:export': 'Export billing data',
      'billing:refund': 'Process refunds',
      'billing:subscription:create': 'Create new subscriptions',
      'billing:subscription:update': 'Update subscription details',
      'billing:subscription:cancel': 'Cancel subscriptions',
      'billing:payment:process': 'Process payments',
      'billing:invoice:generate': 'Generate invoices',
      'billing:invoice:send': 'Send invoices to customers',
      'billing:plan:upgrade': 'Upgrade subscription plans',
      'billing:plan:downgrade': 'Downgrade subscription plans',

      // Users
      'users:read': 'View user information and profiles',
      'users:create': 'Create new user accounts',
      'users:update': 'Update user information',
      'users:delete': 'Delete user accounts',
      'users:invite': 'Invite users to join tenant',
      'users:deactivate': 'Deactivate user accounts',
      'users:reactivate': 'Reactivate user accounts',
      'users:role:assign': 'Assign roles to users',
      'users:role:revoke': 'Revoke roles from users',
      'users:profile:read': 'View user profiles',
      'users:profile:update': 'Update user profiles',
      'users:profile:delete': 'Delete user profiles',
      'users:session:read': 'View user sessions',
      'users:session:revoke': 'Revoke user sessions',
      'users:permission:view': 'View user permissions',

      // Accounting
      'accounting:read': 'View accounting data and transactions',
      'accounting:create': 'Create accounting records',
      'accounting:update': 'Update accounting records',
      'accounting:delete': 'Delete accounting records',
      'accounting:export': 'Export accounting data',
      'accounting:transaction:create': 'Create financial transactions',
      'accounting:transaction:update': 'Update financial transactions',
      'accounting:transaction:delete': 'Delete financial transactions',
      'accounting:transaction:approve': 'Approve financial transactions',
      'accounting:transaction:reject': 'Reject financial transactions',
      'accounting:journal:create': 'Create journal entries',
      'accounting:journal:read': 'View journal entries',
      'accounting:journal:update': 'Update journal entries',
      'accounting:reconcile': 'Reconcile accounts',
      'accounting:report:generate': 'Generate accounting reports',
      'accounting:audit:read': 'View audit logs',

      // Finance
      'finance:close': 'Soft close / hard lock accounting periods',
      'finance:reopen': 'Reopen soft-closed accounting periods',
      'finance:attest': 'Attest tax-period finalization and regulatory export packages',

      // Reports
      'reports:read': 'View reports and analytics',
      'reports:create': 'Create new reports',
      'reports:update': 'Update existing reports',
      'reports:delete': 'Delete reports',
      'reports:export': 'Export report data',
      'reports:share': 'Share reports with others',
      'reports:schedule': 'Schedule automated reports',
      'reports:template:create': 'Create report templates',
      'reports:template:update': 'Update report templates',
      'reports:template:delete': 'Delete report templates',
      'reports:dashboard:create': 'Create dashboards',
      'reports:dashboard:update': 'Update dashboards',
      'reports:dashboard:delete': 'Delete dashboards',
      'reports:analytics:read': 'View analytics data',
      'reports:analytics:export': 'Export analytics data',
      'reports:kpi:read': 'View KPI metrics',
      'reports:kpi:update': 'Update KPI metrics',

      // System
      'system:read': 'View system configuration',
      'system:update': 'Update system configuration',
      'system:admin': 'Full system administration',
      'system:backup:create': 'Create system backups',
      'system:backup:restore': 'Restore system backups',
      'system:maintenance': 'Perform system maintenance',
      'system:monitor': 'Monitor system health',
      'system:logs:read': 'View system logs',
      'system:logs:export': 'Export system logs',
      'system:security:read': 'View security settings',
      'system:security:update': 'Update security settings',
      'system:tenant:create': 'Create new tenants',
      'system:tenant:update': 'Update tenant settings',
      'system:tenant:delete': 'Delete tenants',
      'system:feature:enable': 'Enable system features',
      'system:feature:disable': 'Disable system features',
      'system:api:read': 'View API configuration',
      'system:api:update': 'Update API configuration',

      // Inventory
      'inventory:read': 'View inventory data',
      'inventory:create': 'Create inventory records',
      'inventory:update': 'Update inventory records',
      'inventory delete': 'Delete inventory records',
      'inventory:export': 'Export inventory data',
      'inventory:stock:adjust': 'Adjust stock levels',
      'inventory:stock:transfer': 'Transfer stock between locations',
      'inventory:stock:count': 'Perform stock counts',
      'inventory:product:create': 'Create products',
      'inventory:product:update': 'Update products',
      'inventory:product:delete': 'Delete products',
      'inventory:category:create': 'Create product categories',
      'inventory:category:update': 'Update product categories',
      'inventory:category:delete': 'Delete product categories',
      'inventory:supplier:create': 'Create suppliers',
      'inventory:supplier:update': 'Update suppliers',
      'inventory:supplier:delete': 'Delete suppliers',
      'inventory:report:generate': 'Generate inventory reports'
    };

    return descriptions[permission] || `${permission} permission`;
  }
}

/**
 * CRITICAL: Export permission registry for use in authorization engine
 */
export const getPermissionRegistry = (): PermissionRegistry => {
  // CRITICAL: Validate registry before returning
  const validation = PermissionValidator.validateRegistry();
  if (!validation.isValid) {
    throw new Error(`Invalid permission registry: ${validation.errors.join(', ')}`);
  }
  
  return PERMISSION_REGISTRY;
};
