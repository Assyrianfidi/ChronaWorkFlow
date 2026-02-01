import { stableHash } from '../finance/ledger-invariants.js';

export type BillingTier = 'FREE' | 'TRIAL' | 'STARTER' | 'PRO' | 'ENTERPRISE';

export type EntitlementLimit = { softLimit?: number; hardLimit?: number };

export type PlanEntitlements = {
  users: EntitlementLimit;
  companies: EntitlementLimit;
  exportsPerMonth: EntitlementLimit;
  apiCallsPerMonth: EntitlementLimit;
  storageGb: EntitlementLimit;
  auditRetentionDays: EntitlementLimit;
  allowApiAccess: boolean;
  allowAuditExports: boolean;
  allowTaxExports: boolean;
  allowAdvancedAnalytics: boolean;
};

export type PlanDefinition = {
  tier: BillingTier;
  code: string;
  name: string;
  description: string;
  entitlements: PlanEntitlements;
};

export const PLAN_REGISTRY: Record<BillingTier, PlanDefinition> = {
  FREE: {
    tier: 'FREE',
    code: 'solo',
    name: 'Free',
    description: 'Single-user starter experience with strict limits.',
    entitlements: {
      users: { hardLimit: 1 },
      companies: { hardLimit: 1 },
      exportsPerMonth: { softLimit: 5, hardLimit: 10 },
      apiCallsPerMonth: { hardLimit: 0 },
      storageGb: { softLimit: 1, hardLimit: 1 },
      auditRetentionDays: { hardLimit: 30 },
      allowApiAccess: false,
      allowAuditExports: false,
      allowTaxExports: false,
      allowAdvancedAnalytics: false,
    },
  },
  TRIAL: {
    tier: 'TRIAL',
    code: 'team',
    name: 'Trial',
    description: 'Time-boxed evaluation with Pro-like features but bounded limits.',
    entitlements: {
      users: { softLimit: 5, hardLimit: 10 },
      companies: { hardLimit: 1 },
      exportsPerMonth: { softLimit: 50, hardLimit: 100 },
      apiCallsPerMonth: { softLimit: 5000, hardLimit: 10000 },
      storageGb: { softLimit: 5, hardLimit: 10 },
      auditRetentionDays: { hardLimit: 90 },
      allowApiAccess: true,
      allowAuditExports: true,
      allowTaxExports: true,
      allowAdvancedAnalytics: true,
    },
  },
  STARTER: {
    tier: 'STARTER',
    code: 'team',
    name: 'Starter',
    description: 'Small teams getting started with full accounting + exports.',
    entitlements: {
      users: { softLimit: 5, hardLimit: 10 },
      companies: { hardLimit: 1 },
      exportsPerMonth: { softLimit: 100, hardLimit: 200 },
      apiCallsPerMonth: { softLimit: 5000, hardLimit: 10000 },
      storageGb: { softLimit: 10, hardLimit: 25 },
      auditRetentionDays: { hardLimit: 365 },
      allowApiAccess: false,
      allowAuditExports: true,
      allowTaxExports: true,
      allowAdvancedAnalytics: true,
    },
  },
  PRO: {
    tier: 'PRO',
    code: 'business',
    name: 'Pro',
    description: 'Growing businesses with API access and higher limits.',
    entitlements: {
      users: { softLimit: 25, hardLimit: 50 },
      companies: { softLimit: 1, hardLimit: 3 },
      exportsPerMonth: { softLimit: 500, hardLimit: 1000 },
      apiCallsPerMonth: { softLimit: 25000, hardLimit: 50000 },
      storageGb: { softLimit: 50, hardLimit: 100 },
      auditRetentionDays: { hardLimit: 2555 },
      allowApiAccess: true,
      allowAuditExports: true,
      allowTaxExports: true,
      allowAdvancedAnalytics: true,
    },
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    code: 'enterprise',
    name: 'Enterprise',
    description: 'Enterprise scale, compliance, and support with expanded limits.',
    entitlements: {
      users: { softLimit: 100, hardLimit: 500 },
      companies: { softLimit: 10, hardLimit: 50 },
      exportsPerMonth: { softLimit: 2000, hardLimit: 10000 },
      apiCallsPerMonth: { softLimit: 100000, hardLimit: 500000 },
      storageGb: { softLimit: 200, hardLimit: 1024 },
      auditRetentionDays: { hardLimit: 3650 },
      allowApiAccess: true,
      allowAuditExports: true,
      allowTaxExports: true,
      allowAdvancedAnalytics: true,
    },
  },
};

export function getPlanDefinition(tier: BillingTier): PlanDefinition {
  const def = PLAN_REGISTRY[tier];
  if (!def) throw new Error(`Unknown billing tier: ${tier}`);
  return def;
}

export function getPlanRegistryIntegrityHash(): string {
  return stableHash(JSON.stringify(PLAN_REGISTRY));
}
