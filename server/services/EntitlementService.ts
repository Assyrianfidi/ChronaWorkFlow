/**
 * Entitlement Service
 * Backend-enforced limits with deterministic errors
 */

import { PlanTier, getPlan, checkLimit, getRemainingQuota } from '@/../../shared/billing/plans';

export interface EntitlementContext {
  tenantId: string;
  planTier: PlanTier;
  currentUsage: {
    scenarios: number;
    scenariosThisMonth: number;
    forecastsThisMonth: number;
    teamMembers: number;
  };
}

export class EntitlementError extends Error {
  constructor(
    message: string,
    public code: string,
    public limit: number,
    public current: number,
    public planTier: PlanTier
  ) {
    super(message);
    this.name = 'EntitlementError';
  }
}

export class EntitlementService {
  /**
   * Check if tenant can create a new scenario
   */
  async canCreateScenario(context: EntitlementContext): Promise<void> {
    const plan = getPlan(context.planTier);
    
    // Check total scenarios limit
    if (!checkLimit(context.currentUsage.scenarios, plan.limits.maxScenarios)) {
      throw new EntitlementError(
        `Maximum scenarios limit reached (${plan.limits.maxScenarios}). Upgrade to create more scenarios.`,
        'SCENARIO_LIMIT_REACHED',
        plan.limits.maxScenarios,
        context.currentUsage.scenarios,
        context.planTier
      );
    }
    
    // Check monthly scenarios limit
    if (!checkLimit(context.currentUsage.scenariosThisMonth, plan.limits.maxScenariosPerMonth)) {
      throw new EntitlementError(
        `Monthly scenario creation limit reached (${plan.limits.maxScenariosPerMonth}). Upgrade or wait until next month.`,
        'SCENARIO_MONTHLY_LIMIT_REACHED',
        plan.limits.maxScenariosPerMonth,
        context.currentUsage.scenariosThisMonth,
        context.planTier
      );
    }
  }

  /**
   * Check if tenant can generate a forecast
   */
  async canGenerateForecast(context: EntitlementContext): Promise<void> {
    const plan = getPlan(context.planTier);
    
    // Check monthly forecasts limit
    if (!checkLimit(context.currentUsage.forecastsThisMonth, plan.limits.maxForecastsPerMonth)) {
      throw new EntitlementError(
        `Monthly forecast generation limit reached (${plan.limits.maxForecastsPerMonth}). Upgrade to generate more forecasts.`,
        'FORECAST_MONTHLY_LIMIT_REACHED',
        plan.limits.maxForecastsPerMonth,
        context.currentUsage.forecastsThisMonth,
        context.planTier
      );
    }
  }

  /**
   * Check if tenant can add a team member
   */
  async canAddTeamMember(context: EntitlementContext): Promise<void> {
    const plan = getPlan(context.planTier);
    
    // Check team members limit
    if (!checkLimit(context.currentUsage.teamMembers, plan.limits.maxTeamMembers)) {
      throw new EntitlementError(
        `Maximum team members limit reached (${plan.limits.maxTeamMembers}). Upgrade to add more members.`,
        'TEAM_MEMBER_LIMIT_REACHED',
        plan.limits.maxTeamMembers,
        context.currentUsage.teamMembers,
        context.planTier
      );
    }
  }

  /**
   * Check if tenant has access to a feature
   */
  hasFeatureAccess(planTier: PlanTier, feature: string): boolean {
    const plan = getPlan(planTier);
    return (plan.limits as any)[feature] === true;
  }

  /**
   * Get remaining quota for a resource
   */
  getRemainingQuota(context: EntitlementContext, resource: 'scenarios' | 'scenariosThisMonth' | 'forecastsThisMonth' | 'teamMembers'): number {
    const plan = getPlan(context.planTier);
    
    switch (resource) {
      case 'scenarios':
        return getRemainingQuota(context.currentUsage.scenarios, plan.limits.maxScenarios);
      case 'scenariosThisMonth':
        return getRemainingQuota(context.currentUsage.scenariosThisMonth, plan.limits.maxScenariosPerMonth);
      case 'forecastsThisMonth':
        return getRemainingQuota(context.currentUsage.forecastsThisMonth, plan.limits.maxForecastsPerMonth);
      case 'teamMembers':
        return getRemainingQuota(context.currentUsage.teamMembers, plan.limits.maxTeamMembers);
      default:
        return 0;
    }
  }

  /**
   * Get usage summary
   */
  getUsageSummary(context: EntitlementContext) {
    const plan = getPlan(context.planTier);
    
    return {
      planTier: context.planTier,
      planName: plan.name,
      usage: {
        scenarios: {
          current: context.currentUsage.scenarios,
          limit: plan.limits.maxScenarios,
          remaining: this.getRemainingQuota(context, 'scenarios'),
        },
        scenariosThisMonth: {
          current: context.currentUsage.scenariosThisMonth,
          limit: plan.limits.maxScenariosPerMonth,
          remaining: this.getRemainingQuota(context, 'scenariosThisMonth'),
        },
        forecastsThisMonth: {
          current: context.currentUsage.forecastsThisMonth,
          limit: plan.limits.maxForecastsPerMonth,
          remaining: this.getRemainingQuota(context, 'forecastsThisMonth'),
        },
        teamMembers: {
          current: context.currentUsage.teamMembers,
          limit: plan.limits.maxTeamMembers,
          remaining: this.getRemainingQuota(context, 'teamMembers'),
        },
      },
      features: {
        advancedForecasting: plan.limits.advancedForecasting,
        scenarioComparison: plan.limits.scenarioComparison,
        customFormulas: plan.limits.customFormulas,
        apiAccess: plan.limits.apiAccess,
        prioritySupport: plan.limits.prioritySupport,
        ssoEnabled: plan.limits.ssoEnabled,
        auditLogs: plan.limits.auditLogs,
        customBranding: plan.limits.customBranding,
      },
    };
  }
}

// Singleton instance
const entitlementService = new EntitlementService();

export { entitlementService };
export default entitlementService;
