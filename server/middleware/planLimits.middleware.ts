/**
 * Plan Limit Enforcement Middleware
 * 
 * Enforces plan-based limits at API level
 * Prevents abuse and ensures fair usage
 * Triggers contextual upgrade prompts
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Plan types
 */
export enum Plan {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

/**
 * Plan limits configuration
 */
interface PlanLimits {
  // User limits
  maxUsers: number;
  
  // Automation limits
  maxAutomationRules: number;
  maxAutomationExecutionsPerMonth: number;
  
  // Payment limits
  maxPaymentTransactionsPerMonth: number;
  maxCashControlRules: number;
  
  // Forecasting limits
  canViewForecasts: boolean;
  canGenerateForecasts: boolean;
  forecastHistoryDays: number;
  
  // Scenario limits
  canCreateScenarios: boolean;
  maxScenariosPerMonth: number;
  maxActiveScenarios: number;
  advancedSensitivityAnalysis: boolean;
  customScenarios: boolean;
  
  // Feature flags
  automationEnabled: boolean;
  paymentsEnabled: boolean;
  forecastingEnabled: boolean;
  scenariosEnabled: boolean;
  executiveAlerts: boolean;
  prioritySupport: boolean;
}

/**
 * Plan limits by tier
 */
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  [Plan.FREE]: {
    maxUsers: 2,
    maxAutomationRules: 0,
    maxAutomationExecutionsPerMonth: 0,
    maxPaymentTransactionsPerMonth: 10,
    maxCashControlRules: 0,
    canViewForecasts: true,
    canGenerateForecasts: false,
    forecastHistoryDays: 30,
    canCreateScenarios: false,
    maxScenariosPerMonth: 0,
    maxActiveScenarios: 0,
    advancedSensitivityAnalysis: false,
    customScenarios: false,
    automationEnabled: false,
    paymentsEnabled: true,
    forecastingEnabled: true,
    scenariosEnabled: false,
    executiveAlerts: false,
    prioritySupport: false,
  },
  
  [Plan.STARTER]: {
    maxUsers: 5,
    maxAutomationRules: 10,
    maxAutomationExecutionsPerMonth: 500,
    maxPaymentTransactionsPerMonth: 100,
    maxCashControlRules: 5,
    canViewForecasts: true,
    canGenerateForecasts: false,
    forecastHistoryDays: 90,
    canCreateScenarios: true,
    maxScenariosPerMonth: 3,
    maxActiveScenarios: 5,
    advancedSensitivityAnalysis: false,
    customScenarios: false,
    automationEnabled: true,
    paymentsEnabled: true,
    forecastingEnabled: true,
    scenariosEnabled: true,
    executiveAlerts: false,
    prioritySupport: false,
  },
  
  [Plan.PROFESSIONAL]: {
    maxUsers: 25,
    maxAutomationRules: 50,
    maxAutomationExecutionsPerMonth: 5000,
    maxPaymentTransactionsPerMonth: 1000,
    maxCashControlRules: 20,
    canViewForecasts: true,
    canGenerateForecasts: true,
    forecastHistoryDays: 365,
    canCreateScenarios: true,
    maxScenariosPerMonth: 20,
    maxActiveScenarios: 50,
    advancedSensitivityAnalysis: true,
    customScenarios: true,
    automationEnabled: true,
    paymentsEnabled: true,
    forecastingEnabled: true,
    scenariosEnabled: true,
    executiveAlerts: false,
    prioritySupport: false,
  },
  
  [Plan.ENTERPRISE]: {
    maxUsers: -1, // Unlimited
    maxAutomationRules: -1,
    maxAutomationExecutionsPerMonth: -1,
    maxPaymentTransactionsPerMonth: -1,
    maxCashControlRules: -1,
    canViewForecasts: true,
    canGenerateForecasts: true,
    forecastHistoryDays: -1, // Unlimited
    canCreateScenarios: true,
    maxScenariosPerMonth: -1,
    maxActiveScenarios: -1,
    advancedSensitivityAnalysis: true,
    customScenarios: true,
    automationEnabled: true,
    paymentsEnabled: true,
    forecastingEnabled: true,
    scenariosEnabled: true,
    executiveAlerts: true,
    prioritySupport: true,
  },
};

/**
 * Extended request with tenant plan
 */
interface PlanRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
  };
  tenant?: {
    id: string;
    plan: Plan;
  };
}

/**
 * Plan limit evaluator
 */
export class PlanLimitEvaluator {
  /**
   * Get plan limits for a tenant
   */
  static async getTenantLimits(tenantId: string): Promise<PlanLimits> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });
    
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    
    const plan = tenant.plan as Plan;
    return PLAN_LIMITS[plan];
  }
  
  /**
   * Check if tenant can create automation rule
   */
  static async canCreateAutomationRule(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
    const limits = await this.getTenantLimits(tenantId);
    
    if (!limits.automationEnabled) {
      return {
        allowed: false,
        reason: 'Automation is not enabled on your plan. Upgrade to STARTER or higher.',
      };
    }
    
    if (limits.maxAutomationRules === -1) {
      return { allowed: true };
    }
    
    const currentCount = await prisma.automationRule.count({
      where: { tenantId, isActive: true },
    });
    
    if (currentCount >= limits.maxAutomationRules) {
      return {
        allowed: false,
        reason: `You've reached your automation rule limit (${limits.maxAutomationRules}). Upgrade to increase your limit.`,
      };
    }
    
    return { allowed: true };
  }
  
  /**
   * Check if tenant can create scenario
   */
  static async canCreateScenario(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
    const limits = await this.getTenantLimits(tenantId);
    
    if (!limits.canCreateScenarios) {
      return {
        allowed: false,
        reason: 'Scenario creation is not available on your plan. Upgrade to STARTER or higher.',
      };
    }
    
    if (limits.maxScenariosPerMonth === -1) {
      return { allowed: true };
    }
    
    // Count scenarios created this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const currentMonthCount = await prisma.scenario.count({
      where: {
        tenantId,
        createdAt: { gte: startOfMonth },
      },
    });
    
    if (currentMonthCount >= limits.maxScenariosPerMonth) {
      return {
        allowed: false,
        reason: `You've used all ${limits.maxScenariosPerMonth} scenarios this month. Upgrade to PROFESSIONAL for 20 scenarios/month.`,
      };
    }
    
    return { allowed: true };
  }
  
  /**
   * Check if tenant can generate forecast
   */
  static async canGenerateForecast(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
    const limits = await this.getTenantLimits(tenantId);
    
    if (!limits.canGenerateForecasts) {
      return {
        allowed: false,
        reason: 'Forecast generation is not available on your plan. Upgrade to PROFESSIONAL or higher.',
      };
    }
    
    return { allowed: true };
  }
  
  /**
   * Check if tenant can process payment
   */
  static async canProcessPayment(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
    const limits = await this.getTenantLimits(tenantId);
    
    if (!limits.paymentsEnabled) {
      return {
        allowed: false,
        reason: 'Payments are not enabled on your plan.',
      };
    }
    
    if (limits.maxPaymentTransactionsPerMonth === -1) {
      return { allowed: true };
    }
    
    // Count payments this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const currentMonthCount = await prisma.payment.count({
      where: {
        tenantId,
        createdAt: { gte: startOfMonth },
      },
    });
    
    if (currentMonthCount >= limits.maxPaymentTransactionsPerMonth) {
      return {
        allowed: false,
        reason: `You've reached your monthly payment limit (${limits.maxPaymentTransactionsPerMonth}). Upgrade to increase your limit.`,
      };
    }
    
    return { allowed: true };
  }
  
  /**
   * Check if tenant can add user
   */
  static async canAddUser(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
    const limits = await this.getTenantLimits(tenantId);
    
    if (limits.maxUsers === -1) {
      return { allowed: true };
    }
    
    const currentCount = await prisma.user.count({
      where: { tenantId, isActive: true },
    });
    
    if (currentCount >= limits.maxUsers) {
      return {
        allowed: false,
        reason: `You've reached your user limit (${limits.maxUsers}). Upgrade to add more users.`,
      };
    }
    
    return { allowed: true };
  }
  
  /**
   * Get usage statistics for a tenant
   */
  static async getUsageStats(tenantId: string): Promise<{
    limits: PlanLimits;
    usage: {
      users: number;
      automationRules: number;
      automationExecutionsThisMonth: number;
      paymentTransactionsThisMonth: number;
      cashControlRules: number;
      scenariosThisMonth: number;
      activeScenarios: number;
    };
  }> {
    const limits = await this.getTenantLimits(tenantId);
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const [
      users,
      automationRules,
      automationExecutionsThisMonth,
      paymentTransactionsThisMonth,
      cashControlRules,
      scenariosThisMonth,
      activeScenarios,
    ] = await Promise.all([
      prisma.user.count({ where: { tenantId, isActive: true } }),
      prisma.automationRule.count({ where: { tenantId, isActive: true } }),
      prisma.automationExecution.count({
        where: { tenantId, executedAt: { gte: startOfMonth } },
      }),
      prisma.payment.count({
        where: { tenantId, createdAt: { gte: startOfMonth } },
      }),
      prisma.cashControlRule.count({ where: { tenantId, isActive: true } }),
      prisma.scenario.count({
        where: { tenantId, createdAt: { gte: startOfMonth } },
      }),
      prisma.scenario.count({
        where: { tenantId, isArchived: false },
      }),
    ]);
    
    return {
      limits,
      usage: {
        users,
        automationRules,
        automationExecutionsThisMonth,
        paymentTransactionsThisMonth,
        cashControlRules,
        scenariosThisMonth,
        activeScenarios,
      },
    };
  }
}

/**
 * Middleware: Require feature enabled
 */
export function requireFeature(feature: keyof PlanLimits) {
  return async (req: PlanRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }
      
      const limits = await PlanLimitEvaluator.getTenantLimits(req.user.tenantId);
      
      if (!limits[feature]) {
        res.status(403).json({
          error: 'Feature Not Available',
          message: `This feature is not available on your current plan.`,
          upgradeRequired: true,
        });
        return;
      }
      
      next();
    } catch (error) {
      console.error('Feature check error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Feature check failed',
      });
    }
  };
}

/**
 * Middleware: Check automation rule limit
 */
export function checkAutomationRuleLimit() {
  return async (req: PlanRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }
      
      const result = await PlanLimitEvaluator.canCreateAutomationRule(req.user.tenantId);
      
      if (!result.allowed) {
        res.status(403).json({
          error: 'Limit Reached',
          message: result.reason,
          upgradeRequired: true,
          upgradeUrl: '/settings/billing/upgrade',
        });
        return;
      }
      
      next();
    } catch (error) {
      console.error('Automation rule limit check error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Limit check failed',
      });
    }
  };
}

/**
 * Middleware: Check scenario limit
 */
export function checkScenarioLimit() {
  return async (req: PlanRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }
      
      const result = await PlanLimitEvaluator.canCreateScenario(req.user.tenantId);
      
      if (!result.allowed) {
        res.status(403).json({
          error: 'Limit Reached',
          message: result.reason,
          upgradeRequired: true,
          upgradeUrl: '/settings/billing/upgrade',
        });
        return;
      }
      
      next();
    } catch (error) {
      console.error('Scenario limit check error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Limit check failed',
      });
    }
  };
}

/**
 * Middleware: Check payment limit
 */
export function checkPaymentLimit() {
  return async (req: PlanRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }
      
      const result = await PlanLimitEvaluator.canProcessPayment(req.user.tenantId);
      
      if (!result.allowed) {
        res.status(403).json({
          error: 'Limit Reached',
          message: result.reason,
          upgradeRequired: true,
          upgradeUrl: '/settings/billing/upgrade',
        });
        return;
      }
      
      next();
    } catch (error) {
      console.error('Payment limit check error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Limit check failed',
      });
    }
  };
}

/**
 * Middleware: Check forecast generation limit
 */
export function checkForecastLimit() {
  return async (req: PlanRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }
      
      const result = await PlanLimitEvaluator.canGenerateForecast(req.user.tenantId);
      
      if (!result.allowed) {
        res.status(403).json({
          error: 'Feature Not Available',
          message: result.reason,
          upgradeRequired: true,
          upgradeUrl: '/settings/billing/upgrade',
        });
        return;
      }
      
      next();
    } catch (error) {
      console.error('Forecast limit check error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Limit check failed',
      });
    }
  };
}

/**
 * Example usage:
 * 
 * router.post('/automations',
 *   requireFeature('automationEnabled'),
 *   checkAutomationRuleLimit(),
 *   createAutomation
 * );
 * 
 * router.post('/scenarios',
 *   requireFeature('scenariosEnabled'),
 *   checkScenarioLimit(),
 *   createScenario
 * );
 */
