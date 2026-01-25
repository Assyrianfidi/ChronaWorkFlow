export interface PlanEntitlements {
  // Core limits
  maxUsers: number;
  maxEntities: number; // companies/subsidiaries
  maxWorkflowsPerMonth: number;
  maxApiCallsPerMonth: number;
  maxAiTokensPerMonth: number;

  // Permissions
  allowAccountingPeriodLocks: boolean;
  allowAccountingExports: boolean;
  allowAuditExports: boolean;
  allowAdvancedAnalytics: boolean;
  allowApiAccess: boolean;
  allowCustomReports: boolean;
  allowMultiEntityConsolidation: boolean;
  allowHoldingCompanyView: boolean;

  // Workflow
  allowCustomWorkflowDefinitions: boolean;
  allowWorkflowApprovals: boolean;
  allowWorkflowScheduling: boolean;

  // Support
  supportLevel: "community" | "business" | "priority" | "white-glove";
  slaUptime: string;
}

export const PRICING_TIERS: Record<string, Omit<PlanEntitlements, "supportLevel" | "slaUptime">> = {
  solo: {
    maxUsers: 1,
    maxEntities: 1,
    maxWorkflowsPerMonth: 10,
    maxApiCallsPerMonth: 1000,
    maxAiTokensPerMonth: 0,
    allowAccountingPeriodLocks: true,
    allowAccountingExports: true,
    allowAuditExports: false,
    allowAdvancedAnalytics: false,
    allowApiAccess: false,
    allowCustomReports: false,
    allowMultiEntityConsolidation: false,
    allowHoldingCompanyView: false,
    allowCustomWorkflowDefinitions: false,
    allowWorkflowApprovals: false,
    allowWorkflowScheduling: false,
  },
  team: {
    maxUsers: 5,
    maxEntities: 1,
    maxWorkflowsPerMonth: 50,
    maxApiCallsPerMonth: 5000,
    maxAiTokensPerMonth: 10000,
    allowAccountingPeriodLocks: true,
    allowAccountingExports: true,
    allowAuditExports: true,
    allowAdvancedAnalytics: true,
    allowApiAccess: false,
    allowCustomReports: false,
    allowMultiEntityConsolidation: false,
    allowHoldingCompanyView: false,
    allowCustomWorkflowDefinitions: false,
    allowWorkflowApprovals: true,
    allowWorkflowScheduling: false,
  },
  business: {
    maxUsers: 25,
    maxEntities: 3,
    maxWorkflowsPerMonth: 200,
    maxApiCallsPerMonth: 25000,
    maxAiTokensPerMonth: 100000,
    allowAccountingPeriodLocks: true,
    allowAccountingExports: true,
    allowAuditExports: true,
    allowAdvancedAnalytics: true,
    allowApiAccess: true,
    allowCustomReports: true,
    allowMultiEntityConsolidation: true,
    allowHoldingCompanyView: false,
    allowCustomWorkflowDefinitions: true,
    allowWorkflowApprovals: true,
    allowWorkflowScheduling: true,
  },
  enterprise: {
    maxUsers: 100,
    maxEntities: 10,
    maxWorkflowsPerMonth: 1000,
    maxApiCallsPerMonth: 100000,
    maxAiTokensPerMonth: 1000000,
    allowAccountingPeriodLocks: true,
    allowAccountingExports: true,
    allowAuditExports: true,
    allowAdvancedAnalytics: true,
    allowApiAccess: true,
    allowCustomReports: true,
    allowMultiEntityConsolidation: true,
    allowHoldingCompanyView: true,
    allowCustomWorkflowDefinitions: true,
    allowWorkflowApprovals: true,
    allowWorkflowScheduling: true,
  },
  holding: {
    maxUsers: 500,
    maxEntities: 50,
    maxWorkflowsPerMonth: 5000,
    maxApiCallsPerMonth: 500000,
    maxAiTokensPerMonth: 5000000,
    allowAccountingPeriodLocks: true,
    allowAccountingExports: true,
    allowAuditExports: true,
    allowAdvancedAnalytics: true,
    allowApiAccess: true,
    allowCustomReports: true,
    allowMultiEntityConsolidation: true,
    allowHoldingCompanyView: true,
    allowCustomWorkflowDefinitions: true,
    allowWorkflowApprovals: true,
    allowWorkflowScheduling: true,
  },
};

export const PRICING_MONTHLY_USD: Record<string, number> = {
  solo: 29,
  team: 99,
  business: 399,
  enterprise: 1299,
  holding: 4999,
};

export const PRICING_ANNUAL_USD: Record<string, number> = {
  solo: 290,
  team: 990,
  business: 3990,
  enterprise: 12990,
  holding: 49990,
};

export function getPlanEntitlements(planCode: string): PlanEntitlements {
  const base = PRICING_TIERS[planCode];
  if (!base) throw new Error(`Unknown plan code: ${planCode}`);

  const supportLevel = planCode === "holding" ? "white-glove" : planCode === "enterprise" ? "priority" : planCode === "business" ? "business" : "community";
  const slaUptime = planCode === "holding" ? "99.99%" : planCode === "enterprise" ? "99.9%" : planCode === "business" ? "99.5%" : "99.0%";

  return { ...base, supportLevel, slaUptime } as PlanEntitlements;
}
