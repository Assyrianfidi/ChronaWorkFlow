/**
 * RBAC Permission System - Canonical Source of Truth
 * 
 * WHY: Centralized permission definitions prevent drift between frontend and backend.
 * Frontend UI gating uses this same model for consistency, but backend enforcement
 * is the actual security boundary.
 */

export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  ACCOUNTANT = 'ACCOUNTANT',
  AUDITOR = 'AUDITOR',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
}

export enum Permission {
  // Financial Reports
  VIEW_PROFIT_LOSS = 'VIEW_PROFIT_LOSS',
  VIEW_BALANCE_SHEET = 'VIEW_BALANCE_SHEET',
  VIEW_CASH_FLOW = 'VIEW_CASH_FLOW',
  EXPORT_FINANCIAL_REPORTS = 'EXPORT_FINANCIAL_REPORTS',
  
  // Bank Accounts
  VIEW_BANK_ACCOUNTS = 'VIEW_BANK_ACCOUNTS',
  VIEW_BANK_TRANSACTIONS = 'VIEW_BANK_TRANSACTIONS',
  RECONCILE_ACCOUNTS = 'RECONCILE_ACCOUNTS',
  ADD_BANK_ACCOUNT = 'ADD_BANK_ACCOUNT',
  
  // Invoices
  VIEW_INVOICES = 'VIEW_INVOICES',
  CREATE_INVOICE = 'CREATE_INVOICE',
  EDIT_INVOICE = 'EDIT_INVOICE',
  DELETE_INVOICE = 'DELETE_INVOICE',
  SEND_INVOICE = 'SEND_INVOICE',
  
  // Expenses
  VIEW_EXPENSES = 'VIEW_EXPENSES',
  CREATE_EXPENSE = 'CREATE_EXPENSE',
  APPROVE_EXPENSE = 'APPROVE_EXPENSE',
  
  // Users & Settings
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_ROLES = 'MANAGE_ROLES',
  MANAGE_COMPANY_SETTINGS = 'MANAGE_COMPANY_SETTINGS',
  
  // Dashboard
  VIEW_DASHBOARD = 'VIEW_DASHBOARD',
  CUSTOMIZE_DASHBOARD = 'CUSTOMIZE_DASHBOARD',
  
  // Inventory
  VIEW_INVENTORY = 'VIEW_INVENTORY',
  MANAGE_INVENTORY = 'MANAGE_INVENTORY',
  
  // Audit
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
  EXPORT_AUDIT_LOGS = 'EXPORT_AUDIT_LOGS',
}

/**
 * Role-Permission Matrix
 * 
 * WHY: Explicit mapping makes it easy to audit who can do what.
 * Changes here automatically propagate to all authorization checks.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.OWNER]: [
    // Full access to everything
    Permission.VIEW_PROFIT_LOSS,
    Permission.VIEW_BALANCE_SHEET,
    Permission.VIEW_CASH_FLOW,
    Permission.EXPORT_FINANCIAL_REPORTS,
    Permission.VIEW_BANK_ACCOUNTS,
    Permission.VIEW_BANK_TRANSACTIONS,
    Permission.RECONCILE_ACCOUNTS,
    Permission.ADD_BANK_ACCOUNT,
    Permission.VIEW_INVOICES,
    Permission.CREATE_INVOICE,
    Permission.EDIT_INVOICE,
    Permission.DELETE_INVOICE,
    Permission.SEND_INVOICE,
    Permission.VIEW_EXPENSES,
    Permission.CREATE_EXPENSE,
    Permission.APPROVE_EXPENSE,
    Permission.MANAGE_USERS,
    Permission.MANAGE_ROLES,
    Permission.MANAGE_COMPANY_SETTINGS,
    Permission.VIEW_DASHBOARD,
    Permission.CUSTOMIZE_DASHBOARD,
    Permission.VIEW_INVENTORY,
    Permission.MANAGE_INVENTORY,
    Permission.VIEW_AUDIT_LOGS,
    Permission.EXPORT_AUDIT_LOGS,
  ],
  
  [UserRole.ADMIN]: [
    // Almost full access, except some owner-only actions
    Permission.VIEW_PROFIT_LOSS,
    Permission.VIEW_BALANCE_SHEET,
    Permission.VIEW_CASH_FLOW,
    Permission.EXPORT_FINANCIAL_REPORTS,
    Permission.VIEW_BANK_ACCOUNTS,
    Permission.VIEW_BANK_TRANSACTIONS,
    Permission.RECONCILE_ACCOUNTS,
    Permission.ADD_BANK_ACCOUNT,
    Permission.VIEW_INVOICES,
    Permission.CREATE_INVOICE,
    Permission.EDIT_INVOICE,
    Permission.DELETE_INVOICE,
    Permission.SEND_INVOICE,
    Permission.VIEW_EXPENSES,
    Permission.CREATE_EXPENSE,
    Permission.APPROVE_EXPENSE,
    Permission.MANAGE_USERS,
    Permission.VIEW_DASHBOARD,
    Permission.CUSTOMIZE_DASHBOARD,
    Permission.VIEW_INVENTORY,
    Permission.MANAGE_INVENTORY,
    Permission.VIEW_AUDIT_LOGS,
  ],
  
  [UserRole.MANAGER]: [
    // Financial oversight + operations
    Permission.VIEW_PROFIT_LOSS,
    Permission.VIEW_BALANCE_SHEET,
    Permission.VIEW_CASH_FLOW,
    Permission.EXPORT_FINANCIAL_REPORTS,
    Permission.VIEW_BANK_ACCOUNTS,
    Permission.VIEW_BANK_TRANSACTIONS,
    Permission.VIEW_INVOICES,
    Permission.CREATE_INVOICE,
    Permission.EDIT_INVOICE,
    Permission.SEND_INVOICE,
    Permission.VIEW_EXPENSES,
    Permission.CREATE_EXPENSE,
    Permission.APPROVE_EXPENSE,
    Permission.VIEW_DASHBOARD,
    Permission.CUSTOMIZE_DASHBOARD,
    Permission.VIEW_INVENTORY,
  ],
  
  [UserRole.ACCOUNTANT]: [
    // Financial data + invoicing, limited bank access
    Permission.VIEW_PROFIT_LOSS,
    Permission.VIEW_BALANCE_SHEET,
    Permission.VIEW_CASH_FLOW,
    Permission.EXPORT_FINANCIAL_REPORTS,
    Permission.VIEW_INVOICES,
    Permission.CREATE_INVOICE,
    Permission.EDIT_INVOICE,
    Permission.SEND_INVOICE,
    Permission.VIEW_EXPENSES,
    Permission.CREATE_EXPENSE,
    Permission.VIEW_DASHBOARD,
    Permission.CUSTOMIZE_DASHBOARD,
  ],
  
  [UserRole.AUDITOR]: [
    // Read-only financial access
    Permission.VIEW_PROFIT_LOSS,
    Permission.VIEW_BALANCE_SHEET,
    Permission.VIEW_CASH_FLOW,
    Permission.EXPORT_FINANCIAL_REPORTS,
    Permission.VIEW_INVOICES,
    Permission.VIEW_EXPENSES,
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_AUDIT_LOGS,
    Permission.EXPORT_AUDIT_LOGS,
  ],
  
  [UserRole.INVENTORY_MANAGER]: [
    // Inventory-focused, no financial access
    Permission.VIEW_INVENTORY,
    Permission.MANAGE_INVENTORY,
    Permission.VIEW_DASHBOARD,
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

/**
 * Check if a role has ALL of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Check if a role has ANY of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Resource-level permissions for field filtering
 * 
 * WHY: Prevent over-fetching by defining which fields each role can see.
 * Example: Accountants can see invoice amounts but not bank account balances.
 */
export interface ResourcePermissions {
  canView: boolean;
  allowedFields?: string[];
  deniedFields?: string[];
}

export const RESOURCE_FIELD_PERMISSIONS: Record<
  UserRole,
  Record<string, ResourcePermissions>
> = {
  [UserRole.OWNER]: {
    bankAccount: { canView: true }, // All fields
    invoice: { canView: true },
    expense: { canView: true },
    user: { canView: true },
  },
  
  [UserRole.ADMIN]: {
    bankAccount: { canView: true },
    invoice: { canView: true },
    expense: { canView: true },
    user: { canView: true, deniedFields: ['password', 'resetToken'] },
  },
  
  [UserRole.MANAGER]: {
    bankAccount: { canView: true, deniedFields: ['accountNumber', 'routingNumber'] },
    invoice: { canView: true },
    expense: { canView: true },
    user: { canView: true, allowedFields: ['id', 'name', 'email', 'role'] },
  },
  
  [UserRole.ACCOUNTANT]: {
    bankAccount: { canView: false }, // No bank account access
    invoice: { canView: true },
    expense: { canView: true },
    user: { canView: true, allowedFields: ['id', 'name', 'email'] },
  },
  
  [UserRole.AUDITOR]: {
    bankAccount: { canView: false },
    invoice: { canView: true, deniedFields: ['internalNotes'] },
    expense: { canView: true, deniedFields: ['internalNotes'] },
    user: { canView: true, allowedFields: ['id', 'name', 'role'] },
  },
  
  [UserRole.INVENTORY_MANAGER]: {
    bankAccount: { canView: false },
    invoice: { canView: false },
    expense: { canView: false },
    user: { canView: true, allowedFields: ['id', 'name'] },
  },
};

/**
 * Filter object fields based on role permissions
 */
export function filterResourceFields<T extends Record<string, any>>(
  resource: T,
  resourceType: string,
  role: UserRole
): Partial<T> {
  const permissions = RESOURCE_FIELD_PERMISSIONS[role]?.[resourceType];
  
  if (!permissions || !permissions.canView) {
    return {};
  }
  
  // If allowedFields is specified, only include those
  if (permissions.allowedFields) {
    const filtered: Partial<T> = {};
    permissions.allowedFields.forEach(field => {
      if (field in resource) {
        filtered[field as keyof T] = resource[field];
      }
    });
    return filtered;
  }
  
  // If deniedFields is specified, exclude those
  if (permissions.deniedFields) {
    const filtered = { ...resource };
    permissions.deniedFields.forEach(field => {
      delete filtered[field];
    });
    return filtered;
  }
  
  // No restrictions, return all fields
  return resource;
}
