/**
 * Backend RBAC Enforcement Middleware
 * 
 * Strict permission enforcement at API level
 * Zero data leakage between roles
 * Safe, non-leaking error responses
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Permission definitions matching frontend role matrix
 */
export enum Permission {
  // User Management
  VIEW_USERS = 'VIEW_USERS',
  CREATE_USER = 'CREATE_USER',
  EDIT_USER = 'EDIT_USER',
  DELETE_USER = 'DELETE_USER',
  
  // Financial Data
  VIEW_FINANCIALS = 'VIEW_FINANCIALS',
  EDIT_FINANCIALS = 'EDIT_FINANCIALS',
  DELETE_FINANCIALS = 'DELETE_FINANCIALS',
  APPROVE_TRANSACTIONS = 'APPROVE_TRANSACTIONS',
  
  // Automation
  VIEW_AUTOMATIONS = 'VIEW_AUTOMATIONS',
  CREATE_AUTOMATION = 'CREATE_AUTOMATION',
  EDIT_AUTOMATION = 'EDIT_AUTOMATION',
  DELETE_AUTOMATION = 'DELETE_AUTOMATION',
  EXECUTE_AUTOMATION = 'EXECUTE_AUTOMATION',
  
  // Smart Insights
  VIEW_INSIGHTS = 'VIEW_INSIGHTS',
  GENERATE_INSIGHTS = 'GENERATE_INSIGHTS',
  DISMISS_INSIGHTS = 'DISMISS_INSIGHTS',
  
  // Payments
  VIEW_PAYMENTS = 'VIEW_PAYMENTS',
  CREATE_PAYMENT = 'CREATE_PAYMENT',
  PROCESS_PAYMENT = 'PROCESS_PAYMENT',
  MANAGE_PAYMENT_METHODS = 'MANAGE_PAYMENT_METHODS',
  
  // Cash Control
  VIEW_CASH_CONTROL_RULES = 'VIEW_CASH_CONTROL_RULES',
  CREATE_CASH_CONTROL_RULE = 'CREATE_CASH_CONTROL_RULE',
  EXECUTE_CASH_CONTROL_RULE = 'EXECUTE_CASH_CONTROL_RULE',
  APPROVE_PAYMENT = 'APPROVE_PAYMENT',
  
  // Forecasting
  VIEW_FORECASTS = 'VIEW_FORECASTS',
  GENERATE_FORECASTS = 'GENERATE_FORECASTS',
  
  // Scenarios
  VIEW_SCENARIOS = 'VIEW_SCENARIOS',
  CREATE_SCENARIO = 'CREATE_SCENARIO',
  SIMULATE_SCENARIO = 'SIMULATE_SCENARIO',
  DELETE_SCENARIO = 'DELETE_SCENARIO',
  
  // Reports
  VIEW_REPORTS = 'VIEW_REPORTS',
  GENERATE_REPORTS = 'GENERATE_REPORTS',
  EXPORT_REPORTS = 'EXPORT_REPORTS',
  
  // Settings
  VIEW_SETTINGS = 'VIEW_SETTINGS',
  EDIT_SETTINGS = 'EDIT_SETTINGS',
  MANAGE_BILLING = 'MANAGE_BILLING',
}

/**
 * Role-to-Permission mapping
 * Mirrors frontend role matrix for consistency
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: [
    // Full access to everything
    Permission.VIEW_USERS,
    Permission.CREATE_USER,
    Permission.EDIT_USER,
    Permission.DELETE_USER,
    Permission.VIEW_FINANCIALS,
    Permission.EDIT_FINANCIALS,
    Permission.DELETE_FINANCIALS,
    Permission.APPROVE_TRANSACTIONS,
    Permission.VIEW_AUTOMATIONS,
    Permission.CREATE_AUTOMATION,
    Permission.EDIT_AUTOMATION,
    Permission.DELETE_AUTOMATION,
    Permission.EXECUTE_AUTOMATION,
    Permission.VIEW_INSIGHTS,
    Permission.GENERATE_INSIGHTS,
    Permission.DISMISS_INSIGHTS,
    Permission.VIEW_PAYMENTS,
    Permission.CREATE_PAYMENT,
    Permission.PROCESS_PAYMENT,
    Permission.MANAGE_PAYMENT_METHODS,
    Permission.VIEW_CASH_CONTROL_RULES,
    Permission.CREATE_CASH_CONTROL_RULE,
    Permission.EXECUTE_CASH_CONTROL_RULE,
    Permission.APPROVE_PAYMENT,
    Permission.VIEW_FORECASTS,
    Permission.GENERATE_FORECASTS,
    Permission.VIEW_SCENARIOS,
    Permission.CREATE_SCENARIO,
    Permission.SIMULATE_SCENARIO,
    Permission.DELETE_SCENARIO,
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_SETTINGS,
    Permission.EDIT_SETTINGS,
    Permission.MANAGE_BILLING,
  ],
  
  ADMIN: [
    // Full access except billing
    Permission.VIEW_USERS,
    Permission.CREATE_USER,
    Permission.EDIT_USER,
    Permission.DELETE_USER,
    Permission.VIEW_FINANCIALS,
    Permission.EDIT_FINANCIALS,
    Permission.DELETE_FINANCIALS,
    Permission.APPROVE_TRANSACTIONS,
    Permission.VIEW_AUTOMATIONS,
    Permission.CREATE_AUTOMATION,
    Permission.EDIT_AUTOMATION,
    Permission.DELETE_AUTOMATION,
    Permission.EXECUTE_AUTOMATION,
    Permission.VIEW_INSIGHTS,
    Permission.GENERATE_INSIGHTS,
    Permission.DISMISS_INSIGHTS,
    Permission.VIEW_PAYMENTS,
    Permission.CREATE_PAYMENT,
    Permission.PROCESS_PAYMENT,
    Permission.MANAGE_PAYMENT_METHODS,
    Permission.VIEW_CASH_CONTROL_RULES,
    Permission.CREATE_CASH_CONTROL_RULE,
    Permission.EXECUTE_CASH_CONTROL_RULE,
    Permission.APPROVE_PAYMENT,
    Permission.VIEW_FORECASTS,
    Permission.GENERATE_FORECASTS,
    Permission.VIEW_SCENARIOS,
    Permission.CREATE_SCENARIO,
    Permission.SIMULATE_SCENARIO,
    Permission.DELETE_SCENARIO,
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_SETTINGS,
    Permission.EDIT_SETTINGS,
  ],
  
  MANAGER: [
    // Can create and manage automations, view financials
    Permission.VIEW_USERS,
    Permission.VIEW_FINANCIALS,
    Permission.EDIT_FINANCIALS,
    Permission.VIEW_AUTOMATIONS,
    Permission.CREATE_AUTOMATION,
    Permission.EDIT_AUTOMATION,
    Permission.EXECUTE_AUTOMATION,
    Permission.VIEW_INSIGHTS,
    Permission.GENERATE_INSIGHTS,
    Permission.DISMISS_INSIGHTS,
    Permission.VIEW_PAYMENTS,
    Permission.CREATE_PAYMENT,
    Permission.VIEW_CASH_CONTROL_RULES,
    Permission.CREATE_CASH_CONTROL_RULE,
    Permission.VIEW_FORECASTS,
    Permission.GENERATE_FORECASTS,
    Permission.VIEW_SCENARIOS,
    Permission.CREATE_SCENARIO,
    Permission.SIMULATE_SCENARIO,
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS,
    Permission.EXPORT_REPORTS,
  ],
  
  ACCOUNTANT: [
    // View-only access to financials and reports
    Permission.VIEW_FINANCIALS,
    Permission.VIEW_AUTOMATIONS,
    Permission.VIEW_INSIGHTS,
    Permission.VIEW_PAYMENTS,
    Permission.VIEW_CASH_CONTROL_RULES,
    Permission.VIEW_FORECASTS,
    Permission.VIEW_SCENARIOS,
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS,
    Permission.EXPORT_REPORTS,
  ],
  
  VIEWER: [
    // Read-only access to basic data
    Permission.VIEW_FINANCIALS,
    Permission.VIEW_REPORTS,
  ],
};

/**
 * Extended Express Request with auth context
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    tenantId: string;
  };
  tenant?: {
    id: string;
    plan: string;
  };
}

/**
 * Central permission evaluation engine
 */
export class PermissionEvaluator {
  /**
   * Check if a role has a specific permission
   */
  static hasPermission(role: Role, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role];
    return permissions.includes(permission);
  }
  
  /**
   * Check if a user has a specific permission
   */
  static async userHasPermission(
    userId: string,
    tenantId: string,
    permission: Permission
  ): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
      select: {
        role: true,
      },
    });
    
    if (!user) {
      return false;
    }
    
    return this.hasPermission(user.role, permission);
  }
  
  /**
   * Get all permissions for a role
   */
  static getPermissions(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role];
  }
  
  /**
   * Check if user can access a specific resource
   */
  static async canAccessResource(
    userId: string,
    tenantId: string,
    resourceTenantId: string
  ): Promise<boolean> {
    // Verify user belongs to tenant
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });
    
    if (!user) {
      return false;
    }
    
    // Verify resource belongs to same tenant
    return tenantId === resourceTenantId;
  }
}

/**
 * RBAC Middleware Factory
 * Creates middleware that enforces specific permissions
 */
export function requirePermission(...permissions: Permission[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Verify user is authenticated
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }
      
      // Verify user has required permissions
      const hasAllPermissions = permissions.every(permission =>
        PermissionEvaluator.hasPermission(req.user!.role, permission)
      );
      
      if (!hasAllPermissions) {
        // Safe error response - no permission details leaked
        res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions',
        });
        return;
      }
      
      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Permission check failed',
      });
    }
  };
}

/**
 * Require specific role
 */
export function requireRole(...roles: Role[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }
      
      if (!roles.includes(req.user.role)) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions',
        });
        return;
      }
      
      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Role check failed',
      });
    }
  };
}

/**
 * Verify tenant access
 * Ensures user can only access resources from their tenant
 */
export function requireTenantAccess() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }
      
      // Extract tenant ID from request (params, body, or query)
      const resourceTenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId;
      
      if (resourceTenantId && resourceTenantId !== req.user.tenantId) {
        // Safe error - no details about what tenant was requested
        res.status(403).json({
          error: 'Forbidden',
          message: 'Access denied',
        });
        return;
      }
      
      next();
    } catch (error) {
      console.error('Tenant access middleware error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Access check failed',
      });
    }
  };
}

/**
 * Audit logging middleware
 * Logs all permission-protected actions
 */
export function auditLog(action: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user) {
        // Log the action (implement actual logging)
        console.log({
          timestamp: new Date().toISOString(),
          action,
          userId: req.user.id,
          tenantId: req.user.tenantId,
          role: req.user.role,
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
      }
      
      next();
    } catch (error) {
      console.error('Audit log error:', error);
      // Don't block request on audit log failure
      next();
    }
  };
}

/**
 * Combine multiple middleware functions
 */
export function combineMiddleware(...middlewares: Array<(req: Request, res: Response, next: NextFunction) => void>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const executeMiddleware = (index: number): void => {
      if (index >= middlewares.length) {
        next();
        return;
      }
      
      middlewares[index](req, res, (err?: Error) => {
        if (err) {
          next(err);
        } else {
          executeMiddleware(index + 1);
        }
      });
    };
    
    executeMiddleware(0);
  };
}

/**
 * Example usage:
 * 
 * router.get('/automations',
 *   requirePermission(Permission.VIEW_AUTOMATIONS),
 *   requireTenantAccess(),
 *   auditLog('VIEW_AUTOMATIONS'),
 *   getAutomations
 * );
 * 
 * router.post('/automations',
 *   requirePermission(Permission.CREATE_AUTOMATION),
 *   requireTenantAccess(),
 *   auditLog('CREATE_AUTOMATION'),
 *   createAutomation
 * );
 */
