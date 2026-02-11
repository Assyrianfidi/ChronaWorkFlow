/**
 * Role-Based UI Hook
 * Provides utilities for role-based UI gating (NOT authentication)
 */

import { useMemo } from "react";
import { useAuth, UserRole } from "@/contexts/AuthContext";

export interface RolePermissions {
  canViewFinancialDashboard: boolean;
  canViewProfitLoss: boolean;
  canViewBankAccounts: boolean;
  canViewInvoices: boolean;
  canViewCharts: boolean;
  canCreateInvoice: boolean;
  canExportReports: boolean;
  canManageSettings: boolean;
  canViewFullDashboard: boolean;
}

/**
 * Get permissions based on user role
 */
export function getRolePermissions(role: UserRole): RolePermissions {
  switch (role) {
    case "OWNER":
      return {
        canViewFinancialDashboard: true,
        canViewProfitLoss: true,
        canViewBankAccounts: true,
        canViewInvoices: true,
        canViewCharts: true,
        canCreateInvoice: true,
        canExportReports: true,
        canManageSettings: true,
        canViewFullDashboard: true,
      };

    case "ADMIN":
      return {
        canViewFinancialDashboard: true,
        canViewProfitLoss: true,
        canViewBankAccounts: true,
        canViewInvoices: true,
        canViewCharts: true,
        canCreateInvoice: true,
        canExportReports: true,
        canManageSettings: true,
        canViewFullDashboard: true,
      };

    case "MANAGER":
      return {
        canViewFinancialDashboard: true,
        canViewProfitLoss: true,
        canViewBankAccounts: true,
        canViewInvoices: true,
        canViewCharts: true,
        canCreateInvoice: true,
        canExportReports: true,
        canManageSettings: false,
        canViewFullDashboard: true,
      };

    case "ACCOUNTANT":
      return {
        canViewFinancialDashboard: true,
        canViewProfitLoss: true,
        canViewBankAccounts: false, // Limited access
        canViewInvoices: true,
        canViewCharts: true,
        canCreateInvoice: true,
        canExportReports: true,
        canManageSettings: false,
        canViewFullDashboard: false, // Limited dashboard view
      };

    case "AUDITOR":
      return {
        canViewFinancialDashboard: true,
        canViewProfitLoss: true,
        canViewBankAccounts: false,
        canViewInvoices: true,
        canViewCharts: true,
        canCreateInvoice: false, // Read-only
        canExportReports: true,
        canManageSettings: false,
        canViewFullDashboard: false,
      };

    case "INVENTORY_MANAGER":
      return {
        canViewFinancialDashboard: false, // No financial access
        canViewProfitLoss: false,
        canViewBankAccounts: false,
        canViewInvoices: false,
        canViewCharts: false,
        canCreateInvoice: false,
        canExportReports: false,
        canManageSettings: false,
        canViewFullDashboard: false,
      };

    default:
      return {
        canViewFinancialDashboard: false,
        canViewProfitLoss: false,
        canViewBankAccounts: false,
        canViewInvoices: false,
        canViewCharts: false,
        canCreateInvoice: false,
        canExportReports: false,
        canManageSettings: false,
        canViewFullDashboard: false,
      };
  }
}

/**
 * Hook to get role-based permissions
 */
export function useRoleBasedUI() {
  const { user } = useAuth();

  const permissions = useMemo(() => {
    if (!user) {
      return getRolePermissions("ACCOUNTANT"); // Default fallback
    }
    return getRolePermissions(user.role);
  }, [user]);

  const role = user?.role || "ACCOUNTANT";

  return {
    role,
    permissions,
    isOwner: role === "OWNER",
    isAdmin: role === "ADMIN",
    isManager: role === "MANAGER",
    isAccountant: role === "ACCOUNTANT",
    isAuditor: role === "AUDITOR",
    isInventoryManager: role === "INVENTORY_MANAGER",
  };
}

/**
 * Get visible widgets based on role
 */
export function getVisibleWidgets(role: UserRole): string[] {
  const permissions = getRolePermissions(role);
  const widgets: string[] = [];

  if (permissions.canViewProfitLoss) {
    widgets.push("profit-loss");
  }

  if (permissions.canViewBankAccounts) {
    widgets.push("bank-accounts");
  }

  if (permissions.canViewInvoices) {
    widgets.push("invoices");
  }

  return widgets;
}

/**
 * Hook to get visible widgets for current user
 */
export function useVisibleWidgets(): string[] {
  const { role } = useRoleBasedUI();
  return useMemo(() => getVisibleWidgets(role), [role]);
}

/**
 * Check if user has specific permission
 */
export function useHasPermission(permission: keyof RolePermissions): boolean {
  const { permissions } = useRoleBasedUI();
  return permissions[permission];
}
