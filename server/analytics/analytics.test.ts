import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---- Mocks (must be declared before importing the modules under test) ----

// In-memory audit event capture for verification.
vi.mock('../compliance/immutable-audit-log.js', () => {
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

// Feature flags are enforced in insights-engine; we allow them deterministically in tests.
vi.mock('../enterprise/feature-flags.js', () => {
  return {
    FeatureFlagManager: {
      getInstance: () => {
        return {
          requireFeatureFlag: vi.fn(async () => undefined)
        };
      }
    }
  };
});

// RBAC: AuthorizationEngine is the core policy evaluator. In tests we make it deterministic:
// allow if tenantContext.permissions includes the permission string.
vi.mock('../auth/authorization-engine.js', () => {
  class AuthorizationEngine {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_prisma: any) {}

    async authorize(request: any): Promise<any> {
      const perms: string[] = request?.tenantContext?.permissions || [];
      const ok = perms.includes(request.permission);
      return {
        authorized: ok,
        reason: ok ? 'AUTHORIZED' : 'PERMISSION_DENIED',
        details: {
          validationChecks: ok ? ['mock_permission_granted'] : ['mock_permission_denied']
        }
      };
    }
  }

  return { AuthorizationEngine };
});

// AnalyticsEngine is used by insights-engine to read tenant-scoped analytics artifacts.
// We stub it to return deterministic data.
vi.mock('./analytics-engine', () => {
  class AnalyticsEngine {
    private static instance: AnalyticsEngine;

    static getInstance(): AnalyticsEngine {
      if (!AnalyticsEngine.instance) AnalyticsEngine.instance = new AnalyticsEngine();
      return AnalyticsEngine.instance;
    }

    async getQueries(_tenantId: string, _userId: string) {
      return [];
    }

    async getDashboards(_tenantId: string, _userId: string) {
      return [];
    }

    async getMetrics(_tenantId: string, _userId: string) {
      return [];
    }

    async getAlerts(_tenantId: string, _userId: string) {
      return [];
    }
  }

  return {
    AnalyticsEngine
  };
});

// ---- Imports under test (after mocks) ----

import {
  initializeInsightsEngine,
  getTenantInsights,
  getUserRecommendations,
  runWithTenantContext as runInsightsWithTenantContext
} from './insights-engine.js';

import {
  initializeCustomerSegmentationEngine,
  getTenantCustomerSegmentation,
  runWithTenantContext as runSegmentationWithTenantContext
} from './customer-segmentation.js';

import {
  initializeAnalyticsObservability,
  recordObservabilityEvent,
  recordObservabilityLatency,
  getTenantObservabilitySummary,
  runWithTenantContext as runObservabilityWithTenantContext
} from './observability.js';

// Pull the audit sink from the mocked module.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { __auditEvents } = await import('../compliance/immutable-audit-log.js');

// ---- Test helpers ----

const makeTenantContext = (input: { tenantId: string; permissions: string[]; userId?: string; requestId?: string }) => {
  return {
    tenantId: input.tenantId,
    tenant: {
      id: input.tenantId,
      name: 'Test Tenant',
      slug: 'test-tenant',
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

    // Non-interface fields used by our STEP 8 modules for auditing context.
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
});

// ---- Tests: Insights Engine ----

describe('STEP 8 - insights-engine', () => {
  it('should return tenant insights with tenant isolation + RBAC + audit event', async () => {
    const prisma = makeFakePrisma();
    initializeInsightsEngine(prisma);

    const ctx = makeTenantContext({ tenantId: 'tn_test_1', permissions: ['reports:read'], requestId: 'req_ins_1' });

    const result = await runInsightsWithTenantContext(ctx, async () => {
      return await getTenantInsights('tn_test_1');
    });

    expect(result.tenantId).toBe('tn_test_1');
    expect(result.kpis.activityScore).toBeTypeOf('number');

    const audit = __auditEvents.find((e: any) => e.action === 'TENANT_INSIGHTS');
    expect(audit).toBeTruthy();
    expect(audit.tenantId).toBe('tn_test_1');
    expect(audit.metadata.integrityHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should reject cross-tenant insight requests (tenant isolation)', async () => {
    const prisma = makeFakePrisma();
    initializeInsightsEngine(prisma);

    const ctx = makeTenantContext({ tenantId: 'tn_test_1', permissions: ['reports:read'], requestId: 'req_ins_2' });

    await expect(
      runInsightsWithTenantContext(ctx, async () => {
        return await getTenantInsights('tn_other');
      })
    ).rejects.toThrow('TENANT_ISOLATION_VIOLATION');
  });

  it('should reject insights when RBAC permission is missing', async () => {
    const prisma = makeFakePrisma();
    initializeInsightsEngine(prisma);

    const ctx = makeTenantContext({ tenantId: 'tn_test_1', permissions: [], requestId: 'req_ins_3' });

    await expect(
      runInsightsWithTenantContext(ctx, async () => {
        return await getTenantInsights('tn_test_1');
      })
    ).rejects.toThrow('PERMISSION_DENIED');
  });

  it('should return user recommendations with RBAC + audit event', async () => {
    const prisma = makeFakePrisma();
    initializeInsightsEngine(prisma);

    const ctx = makeTenantContext({ tenantId: 'tn_test_1', permissions: ['reports:read'], requestId: 'req_rec_1' });

    const result = await runInsightsWithTenantContext(ctx, async () => {
      return await getUserRecommendations('user_123');
    });

    expect(result.tenantId).toBe('tn_test_1');
    expect(result.userId).toBe('user_123');

    const audit = __auditEvents.find((e: any) => e.action === 'USER_RECOMMENDATIONS');
    expect(audit).toBeTruthy();
    expect(audit.metadata.integrityHash).toMatch(/^[a-f0-9]{64}$/);
  });
});

// ---- Tests: Customer Segmentation ----

describe('STEP 8 - customer-segmentation', () => {
  it('should generate deterministic segments and log an audit event', async () => {
    const tenantId = 'tn_test_1';

    // Deterministic customer stats output from raw query.
    const prisma = makeFakePrisma({
      $queryRaw: vi.fn(async () => {
        const now = new Date();
        const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

        return [
          {
            customerId: 'cust_high',
            companyId: 'company_1',
            name: 'High Value Co',
            email: 'high@example.com',
            isActive: true,
            createdAt: daysAgo(300),
            balance: '0',
            totalInvoiced: '20000',
            totalPaid: '20000',
            overdueCount: '0',
            invoiceCount: '12',
            lastInvoiceDate: daysAgo(5),
            firstInvoiceDate: daysAgo(280)
          },
          {
            customerId: 'cust_risk',
            companyId: 'company_1',
            name: 'At Risk LLC',
            email: 'risk@example.com',
            isActive: true,
            createdAt: daysAgo(200),
            balance: '150',
            totalInvoiced: '500',
            totalPaid: '350',
            overdueCount: '1',
            invoiceCount: '3',
            lastInvoiceDate: daysAgo(120),
            firstInvoiceDate: daysAgo(190)
          },
          {
            customerId: 'cust_new',
            companyId: 'company_1',
            name: 'New Customer Inc',
            email: 'new@example.com',
            isActive: true,
            createdAt: daysAgo(10),
            balance: '0',
            totalInvoiced: '0',
            totalPaid: '0',
            overdueCount: '0',
            invoiceCount: '0',
            lastInvoiceDate: null,
            firstInvoiceDate: null
          }
        ];
      })
    });

    initializeCustomerSegmentationEngine(prisma);

    const ctx = makeTenantContext({ tenantId, permissions: ['reports:read'], requestId: 'req_seg_1' });

    const report = await runSegmentationWithTenantContext(ctx, async () => {
      return await getTenantCustomerSegmentation(tenantId);
    });

    const byId = new Map(report.customers.map(c => [c.customerId, c.segment]));
    expect(byId.get('cust_high')).toBe('HIGH_VALUE');
    expect(byId.get('cust_risk')).toBe('AT_RISK');
    expect(byId.get('cust_new')).toBe('NEW');

    const audit = __auditEvents.find((e: any) => e.action === 'CUSTOMER_SEGMENTATION');
    expect(audit).toBeTruthy();
    expect(audit.metadata.integrityHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should reject customer segmentation cross-tenant requests', async () => {
    const prisma = makeFakePrisma();
    initializeCustomerSegmentationEngine(prisma);

    const ctx = makeTenantContext({ tenantId: 'tn_test_1', permissions: ['reports:read'], requestId: 'req_seg_2' });

    await expect(
      runSegmentationWithTenantContext(ctx, async () => {
        return await getTenantCustomerSegmentation('tn_other');
      })
    ).rejects.toThrow('TENANT_ISOLATION_VIOLATION');
  });

  it('should reject customer segmentation when RBAC permission is missing', async () => {
    const prisma = makeFakePrisma();
    initializeCustomerSegmentationEngine(prisma);

    const ctx = makeTenantContext({ tenantId: 'tn_test_1', permissions: [], requestId: 'req_seg_3' });

    await expect(
      runSegmentationWithTenantContext(ctx, async () => {
        return await getTenantCustomerSegmentation('tn_test_1');
      })
    ).rejects.toThrow('PERMISSION_DENIED');
  });
});

// ---- Tests: Observability ----

describe('STEP 8 - observability', () => {
  it('should record events + latencies and return a tenant-scoped summary with audit', async () => {
    const tenantId = 'tn_test_1';
    const prisma = makeFakePrisma();

    initializeAnalyticsObservability(prisma);

    const ctx = makeTenantContext({ tenantId, permissions: ['reports:read'], requestId: 'req_obs_1' });

    const summary = await runObservabilityWithTenantContext(ctx, async () => {
      recordObservabilityEvent('INSIGHTS_REQUESTED', { route: '/api/insights' });
      recordObservabilityLatency('getTenantInsights', 42);

      return await getTenantObservabilitySummary(tenantId);
    });

    expect(summary.tenantId).toBe(tenantId);
    expect(summary.counters['event:INSIGHTS_REQUESTED']).toBe(1);

    const latencyKey = 'latency:getTenantInsights';
    expect(summary.latenciesMs[latencyKey]).toBeTruthy();
    expect(summary.latenciesMs[latencyKey].count).toBeGreaterThanOrEqual(1);

    const audit = __auditEvents.find((e: any) => e.action === 'ANALYTICS_OBSERVABILITY_READ');
    expect(audit).toBeTruthy();
    expect(audit.metadata.integrityHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should reject observability summary cross-tenant requests', async () => {
    const prisma = makeFakePrisma();
    initializeAnalyticsObservability(prisma);

    const ctx = makeTenantContext({ tenantId: 'tn_test_1', permissions: ['reports:read'], requestId: 'req_obs_2' });

    await expect(
      runObservabilityWithTenantContext(ctx, async () => {
        return await getTenantObservabilitySummary('tn_other');
      })
    ).rejects.toThrow('TENANT_ISOLATION_VIOLATION');
  });

  it('should reject observability summary when RBAC permission is missing', async () => {
    const prisma = makeFakePrisma();
    initializeAnalyticsObservability(prisma);

    const ctx = makeTenantContext({ tenantId: 'tn_test_1', permissions: [], requestId: 'req_obs_3' });

    await expect(
      runObservabilityWithTenantContext(ctx, async () => {
        return await getTenantObservabilitySummary('tn_test_1');
      })
    ).rejects.toThrow('PERMISSION_DENIED');
  });
});
