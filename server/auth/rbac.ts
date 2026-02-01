// Production-Grade Role-Based Access Control (RBAC) System
// Implements strict permissions with least-privilege defaults

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
  VIEWER = 'viewer',
  GUEST = 'guest'
}

export enum Permission {
  // User Management
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  USER_ADMIN = 'user:admin',
  
  // Company Management
  COMPANY_READ = 'company:read',
  COMPANY_WRITE = 'company:write',
  COMPANY_DELETE = 'company:delete',
  COMPANY_ADMIN = 'company:admin',
  
  // Financial Data
  FINANCIAL_READ = 'financial:read',
  FINANCIAL_WRITE = 'financial:write',
  FINANCIAL_DELETE = 'financial:delete',
  FINANCIAL_ADMIN = 'financial:admin',
  
  // Accounting
  ACCOUNTING_READ = 'accounting:read',
  ACCOUNTING_WRITE = 'accounting:write',
  ACCOUNTING_DELETE = 'accounting:delete',
  ACCOUNTING_ADMIN = 'accounting:admin',
  
  // Inventory
  INVENTORY_READ = 'inventory:read',
  INVENTORY_WRITE = 'inventory:write',
  INVENTORY_DELETE = 'inventory:delete',
  INVENTORY_ADMIN = 'inventory:admin',
  
  // Payroll
  PAYROLL_READ = 'payroll:read',
  PAYROLL_WRITE = 'payroll:write',
  PAYROLL_DELETE = 'payroll:delete',
  PAYROLL_ADMIN = 'payroll:admin',
  
  // Reports
  REPORTS_READ = 'reports:read',
  REPORTS_WRITE = 'reports:write',
  REPORTS_DELETE = 'reports:delete',
  REPORTS_ADMIN = 'reports:admin',
  
  // System Administration
  SYSTEM_READ = 'system:read',
  SYSTEM_WRITE = 'system:write',
  SYSTEM_DELETE = 'system:delete',
  SYSTEM_ADMIN = 'system:admin',
  
  // Audit & Logs
  AUDIT_READ = 'audit:read',
  AUDIT_WRITE = 'audit:write',
  AUDIT_DELETE = 'audit:delete',
  AUDIT_ADMIN = 'audit:admin',
  
  // API Access
  API_READ = 'api:read',
  API_WRITE = 'api:write',
  API_DELETE = 'api:delete',
  API_ADMIN = 'api:admin'
}

export interface RolePermissions {
  [key: string]: Permission[];
}

// Role-based permission matrix with least-privilege defaults
export const ROLE_PERMISSIONS: RolePermissions = {
  [UserRole.GUEST]: [
    Permission.API_READ
  ],
  
  [UserRole.VIEWER]: [
    Permission.API_READ,
    Permission.USER_READ,
    Permission.COMPANY_READ,
    Permission.FINANCIAL_READ,
    Permission.ACCOUNTING_READ,
    Permission.INVENTORY_READ,
    Permission.REPORTS_READ
  ],
  
  [UserRole.EMPLOYEE]: [
    Permission.API_READ,
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.COMPANY_READ,
    Permission.FINANCIAL_READ,
    Permission.FINANCIAL_WRITE,
    Permission.ACCOUNTING_READ,
    Permission.ACCOUNTING_WRITE,
    Permission.INVENTORY_READ,
    Permission.INVENTORY_WRITE,
    Permission.REPORTS_READ,
    Permission.REPORTS_WRITE
  ],
  
  [UserRole.MANAGER]: [
    Permission.API_READ,
    Permission.API_WRITE,
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.COMPANY_READ,
    Permission.COMPANY_WRITE,
    Permission.FINANCIAL_READ,
    Permission.FINANCIAL_WRITE,
    Permission.FINANCIAL_DELETE,
    Permission.ACCOUNTING_READ,
    Permission.ACCOUNTING_WRITE,
    Permission.ACCOUNTING_DELETE,
    Permission.INVENTORY_READ,
    Permission.INVENTORY_WRITE,
    Permission.INVENTORY_DELETE,
    Permission.PAYROLL_READ,
    Permission.PAYROLL_WRITE,
    Permission.REPORTS_READ,
    Permission.REPORTS_WRITE,
    Permission.REPORTS_DELETE,
    Permission.SYSTEM_READ
  ],
  
  [UserRole.ADMIN]: [
    Permission.API_READ,
    Permission.API_WRITE,
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.USER_DELETE,
    Permission.USER_ADMIN,
    Permission.COMPANY_READ,
    Permission.COMPANY_WRITE,
    Permission.COMPANY_DELETE,
    Permission.COMPANY_ADMIN,
    Permission.FINANCIAL_READ,
    Permission.FINANCIAL_WRITE,
    Permission.FINANCIAL_DELETE,
    Permission.FINANCIAL_ADMIN,
    Permission.ACCOUNTING_READ,
    Permission.ACCOUNTING_WRITE,
    Permission.ACCOUNTING_DELETE,
    Permission.ACCOUNTING_ADMIN,
    Permission.INVENTORY_READ,
    Permission.INVENTORY_WRITE,
    Permission.INVENTORY_DELETE,
    Permission.INVENTORY_ADMIN,
    Permission.PAYROLL_READ,
    Permission.PAYROLL_WRITE,
    Permission.PAYROLL_DELETE,
    Permission.PAYROLL_ADMIN,
    Permission.REPORTS_READ,
    Permission.REPORTS_WRITE,
    Permission.REPORTS_DELETE,
    Permission.REPORTS_ADMIN,
    Permission.SYSTEM_READ,
    Permission.SYSTEM_WRITE,
    Permission.AUDIT_READ,
    Permission.AUDIT_WRITE
  ],
  
  [UserRole.SUPER_ADMIN]: Object.values(Permission) // All permissions
};

export interface User {
  id: string;
  email: string;
  role: UserRole;
  companyId?: string;
  isActive: boolean;
  permissions?: Permission[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthContext {
  user: User;
  permissions: Permission[];
  companyId?: string;
  correlationId?: string;
}

export class RBACService {
  private static instance: RBACService;
  
  static getInstance(): RBACService {
    if (!RBACService.instance) {
      RBACService.instance = new RBACService();
    }
    return RBACService.instance;
  }

  // Get permissions for a role
  getRolePermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  // Get all permissions for a user (role + custom permissions)
  getUserPermissions(user: User): Permission[] {
    const rolePermissions = this.getRolePermissions(user.role);
    const customPermissions = user.permissions || [];
    
    // Combine role permissions with custom permissions
    const allPermissions = new Set([...rolePermissions, ...customPermissions]);
    return Array.from(allPermissions);
  }

  // Check if user has specific permission
  hasPermission(user: User, permission: Permission): boolean {
    if (!user.isActive) {
      return false;
    }
    
    const userPermissions = this.getUserPermissions(user);
    return userPermissions.includes(permission);
  }

  // Check if user has any of the specified permissions
  hasAnyPermission(user: User, permissions: Permission[]): boolean {
    if (!user.isActive) {
      return false;
    }
    
    const userPermissions = this.getUserPermissions(user);
    return permissions.some(permission => userPermissions.includes(permission));
  }

  // Check if user has all specified permissions
  hasAllPermissions(user: User, permissions: Permission[]): boolean {
    if (!user.isActive) {
      return false;
    }
    
    const userPermissions = this.getUserPermissions(user);
    return permissions.every(permission => userPermissions.includes(permission));
  }

  // Check if user can access resource in specific company
  canAccessCompany(user: User, companyId: string): boolean {
    if (!user.isActive) {
      return false;
    }
    
    // Super admins can access any company
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }
    
    // Users can only access their own company
    return user.companyId === companyId;
  }

  // Check if user can perform action on resource
  canPerformAction(user: User, action: Permission, resourceCompanyId?: string): boolean {
    if (!user.isActive) {
      return false;
    }
    
    // Check permission
    if (!this.hasPermission(user, action)) {
      return false;
    }
    
    // Check company access if specified
    if (resourceCompanyId && !this.canAccessCompany(user, resourceCompanyId)) {
      return false;
    }
    
    return true;
  }

  // Get authorization context from request
  getAuthContext(req: any): AuthContext | null {
    const user = req.user;
    if (!user || !user.isActive) {
      return null;
    }
    
    return {
      user,
      permissions: this.getUserPermissions(user),
      companyId: user.companyId,
      correlationId: req.headers['x-correlation-id']
    };
  }

  // Validate user role hierarchy
  canManageRole(manager: User, targetRole: UserRole): boolean {
    if (!manager.isActive) {
      return false;
    }
    
    const roleHierarchy = {
      [UserRole.GUEST]: 0,
      [UserRole.VIEWER]: 1,
      [UserRole.EMPLOYEE]: 2,
      [UserRole.MANAGER]: 3,
      [UserRole.ADMIN]: 4,
      [UserRole.SUPER_ADMIN]: 5
    };
    
    const managerLevel = roleHierarchy[manager.role] || 0;
    const targetLevel = roleHierarchy[targetRole] || 0;
    
    // Can only manage roles strictly below own level
    return managerLevel > targetLevel;
  }

  // Filter sensitive data based on user permissions
  filterSensitiveData<T>(user: User, data: T, sensitiveFields: string[]): Partial<T> {
    if (!user.isActive) {
      return {};
    }
    
    const hasFullAccess = this.hasPermission(user, Permission.SYSTEM_ADMIN) || 
                         user.role === UserRole.ADMIN || 
                         user.role === UserRole.SUPER_ADMIN;
    
    if (hasFullAccess) {
      return data;
    }
    
    const filtered = { ...data };
    sensitiveFields.forEach(field => {
      delete (filtered as any)[field];
    });
    
    return filtered;
  }
}

// Global RBAC service instance
export const rbacService = RBACService.getInstance();
