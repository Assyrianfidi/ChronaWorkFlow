import { describe, it, expect, beforeEach, vi } from 'vitest';

// End-to-end integration-style tests for STEP 1-8 invariants as enforced by STEP 9 CI gates.
// These tests are deterministic and run without external dependencies.

// ---- Audit logger mock (capture immutable audit log calls) ----
vi.mock('../../server/compliance/immutable-audit-log.js', () => {
  const auditEvents: any[] = [];
  return {
    __auditEvents: auditEvents,
    getImmutableAuditLogger: () => {
      return {
        logAuthorizationDecision: vi.fn((evt: any) => {
          auditEvents.push(evt);
        })
      };
    }
  };
});

// ---- Feature flags mock (allow toggling per-test) ----
let featureEnabled = true;
vi.mock('../../server/enterprise/feature-flags.js', () => {
  return {
    FeatureFlagManager: {
      getInstance: () => {
        return {
          requireFeatureFlag: vi.fn(async () => {
            if (!featureEnabled) {
              throw new Error("Feature flag 'FEATURE_ANALYTICS_STEP8' is not enabled");
            }
          })
        };
      }
    }
  };
});

// ---- RBAC mock: authorize if permission present in tenantContext.permissions ----
vi.mock('../../server/auth/authorization-engine.js', () => {
  class AuthorizationEngine {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_prisma: any) {}

    async authorize(request: any): Promise<any> {
      const perms: string[] = request?.tenantContext?.permissions || [];
      const ok = perms.includes(request.permission);
      return {
        authorized: ok,
        reason: ok ? 'AUTHORIZED' : 'PERMISSION_DENIED',
        details: { validationChecks: ok ? ['mock_ok'] : ['mock_denied'] }
      };
    }
  }
  return { AuthorizationEngine };
});

// ---- AnalyticsEngine mock (used by insights-engine) ----
vi.mock('../../server/analytics/analytics-engine', () => {
  class AnalyticsEngine {
    private static instance: AnalyticsEngine;
    static getInstance(): AnalyticsEngine {
      if (!AnalyticsEngine.instance) AnalyticsEngine.instance = new AnalyticsEngine();
      return AnalyticsEngine.instance;
    }
    async getQueries() {
      return [];
    }
    async getDashboards() {
      return [];
    }
    async getMetrics() {
      return [];
    }
    async getAlerts() {
      return [];
    }
  }
  return { AnalyticsEngine };
});

import {
  initializeInsightsEngine,
  getTenantInsights,
  runWithTenantContext as runInsights
} from '../../server/analytics/insights-engine.js';

import {
  initializeCustomerSegmentationEngine,
  getTenantCustomerSegmentation,
  runWithTenantContext as runSegmentation
} from '../../server/analytics/customer-segmentation.js';

import {
  initializeAnalyticsObservability,
  recordObservabilityEvent,
  recordObservabilityLatency,
  getTenantObservabilitySummary,
  runWithTenantContext as runObs
} from '../../server/analytics/observability.js';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { __auditEvents } = await import('../../server/compliance/immutable-audit-log.js');

const makeTenantContext = (input: { tenantId: string; permissions: string[]; userId?: string; requestId?: string }) => {
  return {
    tenantId: input.tenantId,
    tenant: {
      id: input.tenantId,
      name: 'Tenant',
      slug: 'tenant',
      subscriptionPlan: 'PROFESSIONAL',
      subscriptionStatus: 'ACTIVE',
      maxUsers: 100,
      isActive: true
    },
    userRole: 'OWNER',
    permissions: input.permissions,
    isOwner: true,
    isAdmin: true,
    isManager: false,
    user: { id: input.userId ?? 'user_1' },
    requestId: input.requestId ?? 'req_1'
  } as any;
};

const makeFakePrisma = (overrides?: Partial<any>) => {
  return {
    $queryRaw: vi.fn(async () => []),
    ...overrides
  } as any;
};

beforeEach(() => {
  __auditEvents.length = 0;
  featureEnabled = true;
});

describe('STEP 9 integration verification', () => {
  it('enforces tenant context requirement for Step 8 modules', async () => {
    const prisma = makeFakePrisma();
    initializeInsightsEngine(prisma);

    await expect(getTenantInsights('tn_test_1')).rejects.toThrow('TENANT_CONTEXT_REQUIRED');
  });

  it('enforces RBAC + tenant isolation + audit hashes for insights', async () => {
    const prisma = makeFakePrisma();
    initializeInsightsEngine(prisma);

    const ctx = makeTenantContext({ tenantId: 'tn_a', permissions: ['reports:read'], requestId: 'req_int_1' });

    const res = await runInsights(ctx, async () => {
      return await getTenantInsights('tn_a');
    });

    expect(res.tenantId).toBe('tn_a');

    const audit = __auditEvents.find((e: any) => e.action === 'TENANT_INSIGHTS');
    expect(audit).toBeTruthy();
    expect(audit.metadata.integrityHash).toMatch(/^[a-f0-9]{64}$/);

    const ctx2 = makeTenantContext({ tenantId: 'tn_a', permissions: [], requestId: 'req_int_2' });
    await expect(
      runInsights(ctx2, async () => {
        return await getTenantInsights('tn_a');
      })
    ).rejects.toThrow('PERMISSION_DENIED');

    await expect(
      runInsights(ctx, async () => {
        return await getTenantInsights('tn_b');
      })
    ).rejects.toThrow('TENANT_ISOLATION_VIOLATION');
  });

  it('enforces feature flag gating (deterministic placeholder)', async () => {
    const prisma = makeFakePrisma();
    initializeInsightsEngine(prisma);

    const ctx = makeTenantContext({ tenantId: 'tn_a', permissions: ['reports:read'], requestId: 'req_ff_1' });

    featureEnabled = false;

    await expect(
      runInsights(ctx, async () => {
        return await getTenantInsights('tn_a');
      })
    ).rejects.toThrow(/Feature flag/i);
  });

  it('validates customer segmentation + observability are tenant-safe', async () => {
    const tenantId = 'tn_a';

    const prisma = makeFakePrisma({
      $queryRaw: vi.fn(async () => [])
    });

    initializeCustomerSegmentationEngine(prisma);
    initializeAnalyticsObservability(prisma);

    const ctx = makeTenantContext({ tenantId, permissions: ['reports:read'], requestId: 'req_segobs_1' });

    await runSegmentation(ctx, async () => {
      const report = await getTenantCustomerSegmentation(tenantId);
      expect(report.tenantId).toBe(tenantId);
    });

    await runObs(ctx, async () => {
      recordObservabilityEvent('ANALYTICS_QUERY_SUBMITTED', { module: 'integration-test' });
      recordObservabilityLatency('integration', 10);

      const summary = await getTenantObservabilitySummary(tenantId);
      expect(summary.tenantId).toBe(tenantId);
      expect(summary.counters['event:ANALYTICS_QUERY_SUBMITTED']).toBe(1);
    });

    const obsAudit = __auditEvents.find((e: any) => e.action === 'ANALYTICS_OBSERVABILITY_READ');
    expect(obsAudit).toBeTruthy();
    expect(obsAudit.metadata.integrityHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
