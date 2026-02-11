/**
 * Subscription Plans and Entitlements
 * Backend-enforced limits with deterministic errors
 */
export type PlanTier = 'FREE' | 'PRO' | 'ENTERPRISE';
export interface PlanLimits {
    maxScenarios: number;
    maxScenariosPerMonth: number;
    maxForecastsPerMonth: number;
    maxForecastDataPoints: number;
    maxTeamMembers: number;
    advancedForecasting: boolean;
    scenarioComparison: boolean;
    customFormulas: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
    ssoEnabled: boolean;
    auditLogs: boolean;
    customBranding: boolean;
    dataRetentionDays: number;
}
export interface SubscriptionPlan {
    tier: PlanTier;
    name: string;
    description: string;
    priceMonthly: number;
    priceYearly: number;
    limits: PlanLimits;
    stripePriceIdMonthly?: string;
    stripePriceIdYearly?: string;
}
export declare const PLANS: Record<PlanTier, SubscriptionPlan>;
export declare function getPlan(tier: PlanTier): SubscriptionPlan;
export declare function isUnlimited(value: number): boolean;
export declare function checkLimit(current: number, limit: number): boolean;
export declare function getRemainingQuota(current: number, limit: number): number;
//# sourceMappingURL=plans.d.ts.map