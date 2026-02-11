/**
 * Centralized RBAC Permission Definitions
 * Single source of truth for role-based access control
 */

export type Permission =
  // Read permissions
  | "read:dashboard"
  | "read:invoices"
  | "read:payments"
  | "read:reports"
  | "read:users"
  | "read:companies"
  | "read:settings"
  | "read:audit"
  | "read:billing"
  | "read:payroll"
  | "read:accounts"
  | "read:transactions"
  // Write permissions
  | "write:invoices"
  | "write:payments"
  | "write:reports"
  | "write:users"
  | "write:companies"
  | "write:settings"
  | "write:billing"
  | "write:payroll"
  | "write:accounts"
  | "write:transactions"
  // Owner-only permissions
  | "owner:access"
  | "owner:impersonate"
  | "owner:feature-flags"
  | "owner:billing"
  | "owner:security"
  | "owner:audit"
  | "owner:period-locks"
  // Wildcard
  | "read:*"
  | "write:*";

export type Role = "OWNER" | "ADMIN" | "MANAGER" | "ACCOUNTANT" | "USER" | "AUDITOR";

/**
 * Role-to-Permission mapping
 * Defines what each role can do
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: [
    "read:*",
    "write:*",
    "owner:access",
    "owner:impersonate",
    "owner:feature-flags",
    "owner:billing",
    "owner:security",
    "owner:audit",
    "owner:period-locks",
  ],
  
  ADMIN: [
    "read:dashboard",
    "read:invoices",
    "read:payments",
    "read:reports",
    "read:users",
    "read:companies",
    "read:settings",
    "read:billing",
    "read:payroll",
    "read:accounts",
    "read:transactions",
    "read:decisions",
    "write:invoices",
    "write:payments",
    "write:reports",
    "write:users",
    "write:settings",
    "write:payroll",
    "write:accounts",
    "write:transactions",
    "view:signals",
    "run:scenarios",
  ],
  
  MANAGER: [
    "read:dashboard",
    "read:invoices",
    "read:payments",
    "read:reports",
    "read:users",
    "read:settings",
    "read:payroll",
    "read:accounts",
    "read:transactions",
    "read:decisions",
    "write:invoices",
    "write:payments",
    "write:reports",
    "write:payroll",
    "view:signals",
    "run:scenarios",
  ],
  
  ACCOUNTANT: [
    "read:dashboard",
    "read:invoices",
    "read:payments",
    "read:reports",
    "read:accounts",
    "read:transactions",
    "read:payroll",
    "write:invoices",
    "write:payments",
    "write:accounts",
    "write:transactions",
  ],
  
  USER: [
    "read:dashboard",
    "read:invoices",
    "read:payments",
    "read:reports",
  ],
  
  AUDITOR: [
    "read:dashboard",
    "read:invoices",
    "read:payments",
    "read:reports",
    "read:users",
    "read:audit",
    "read:accounts",
    "read:transactions",
    "read:payroll",
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  
  // Check for exact match
  if (permissions.includes(permission)) {
    return true;
  }
  
  // Check for wildcard permissions
  if (permissions.includes("read:*") && permission.startsWith("read:")) {
    return true;
  }
  
  if (permissions.includes("write:*") && permission.startsWith("write:")) {
    return true;
  }
  
  return false;
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role can perform a write operation
 */
export function canWrite(role: Role, resource: string): boolean {
  return hasPermission(role, `write:${resource}` as Permission);
}

/**
 * Check if a role can read a resource
 */
export function canRead(role: Role, resource: string): boolean {
  return hasPermission(role, `read:${resource}` as Permission);
}

/**
 * Check if user is OWNER
 */
export function isOwner(role: Role): boolean {
  return role === "OWNER";
}

/**
 * Require specific permission or throw error
 */
export function requirePermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Permission denied: ${permission} required`);
  }
}
