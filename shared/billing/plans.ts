/**
 * Subscription Plans and Entitlements
 * Backend-enforced limits with deterministic errors
 */

export type PlanTier = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface PlanLimits {
  // Scenario limits
  maxScenarios: number;
  maxScenariosPerMonth: number;
  
  // Forecast limits
  maxForecastsPerMonth: number;
  maxForecastDataPoints: number;
  
  // Team limits
  maxTeamMembers: number;
  
  // Feature access
  advancedForecasting: boolean;
  scenarioComparison: boolean;
  customFormulas: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  ssoEnabled: boolean;
  auditLogs: boolean;
  customBranding: boolean;
  
  // Data retention
  dataRetentionDays: number;
}

export interface SubscriptionPlan {
  tier: PlanTier;
  name: string;
  description: string;
  priceMonthly: number; // USD cents
  priceYearly: number; // USD cents
  limits: PlanLimits;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
}

// Plan definitions
export const PLANS: Record<PlanTier, SubscriptionPlan> = {
  FREE: {
    tier: 'FREE',
    name: 'Free',
    description: 'Perfect for trying out AccuBooks',
    priceMonthly: 0,
    priceYearly: 0,
    limits: {
      maxScenarios: 3,
      maxScenariosPerMonth: 10,
      maxForecastsPerMonth: 20,
      maxForecastDataPoints: 100,
      maxTeamMembers: 1,
      advancedForecasting: false,
      scenarioComparison: true, // Core feature
      customFormulas: false,
      apiAccess: false,
      prioritySupport: false,
      ssoEnabled: false,
      auditLogs: false,
      customBranding: false,
      dataRetentionDays: 30,
    },
  },
  PRO: {
    tier: 'PRO',
    name: 'Pro',
    description: 'For growing businesses',
    priceMonthly: 4900, // $49/month
    priceYearly: 47040, // $470/year (20% discount)
    limits: {
      maxScenarios: 50,
      maxScenariosPerMonth: 200,
      maxForecastsPerMonth: 500,
      maxForecastDataPoints: 1000,
      maxTeamMembers: 5,
      advancedForecasting: true,
      scenarioComparison: true,
      customFormulas: true,
      apiAccess: false,
      prioritySupport: true,
      ssoEnabled: false,
      auditLogs: false,
      customBranding: false,
      dataRetentionDays: 90,
    },
    stripePriceIdMonthly: 'price_pro_monthly', // Replace with actual Stripe price ID
    stripePriceIdYearly: 'price_pro_yearly',
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    description: 'For large organizations',
    priceMonthly: 19900, // $199/month
    priceYearly: 191040, // $1910/year (20% discount)
    limits: {
      maxScenarios: -1, // Unlimited
      maxScenariosPerMonth: -1, // Unlimited
      maxForecastsPerMonth: -1, // Unlimited
      maxForecastDataPoints: 10000,
      maxTeamMembers: -1, // Unlimited
      advancedForecasting: true,
      scenarioComparison: true,
      customFormulas: true,
      apiAccess: true,
      prioritySupport: true,
      ssoEnabled: true,
      auditLogs: true,
      customBranding: true,
      dataRetentionDays: 365,
    },
    stripePriceIdMonthly: 'price_enterprise_monthly',
    stripePriceIdYearly: 'price_enterprise_yearly',
  },
};

// Helper functions
export function getPlan(tier: PlanTier): SubscriptionPlan {
  return PLANS[tier];
}

export function isUnlimited(value: number): boolean {
  return value === -1;
}

export function checkLimit(current: number, limit: number): boolean {
  if (isUnlimited(limit)) {
    return true;
  }
  return current < limit;
}

export function getRemainingQuota(current: number, limit: number): number {
  if (isUnlimited(limit)) {
    return Infinity;
  }
  return Math.max(0, limit - current);
}
