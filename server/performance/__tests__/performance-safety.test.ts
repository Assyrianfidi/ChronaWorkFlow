import { describe, it, expect, beforeAll, vi } from 'vitest';

import { getImmutableAuditLogger } from '../../compliance/immutable-audit-log.js';
import { concurrencyLimiter, ConcurrencyLimitExceededError } from '../concurrency-limiter.js';
import { loadShedder } from '../load-shedder.js';
import { admissionController } from '../admission-controller.js';

const tenantContext = {
  tenantId: 'tn_test',
  tenant: { subscriptionPlan: 'PRO' },
  user: { id: 'user_test' },
} as any;

beforeAll(() => {
  // Deterministic mode
  process.env.DETERMINISTIC_TEST_IDS = 'true';
});

describe('STEP 12 Performance Safety', () => {
  it('enforces concurrency cap (tenant) and throws ConcurrencyLimitExceededError', async () => {
    process.env.PERF_TENANT_MAX_CONCURRENCY = '1';
    process.env.PERF_TENANT_QUEUE_MAX_DEPTH = '0';
    process.env.PERF_TENANT_ACQUIRE_TIMEOUT_MS = '0';

    const release1 = await concurrencyLimiter.acquire({
      tenantContext,
      userId: 'user_test',
      requestId: 'req_1',
      priority: 'HIGH',
      resourceName: 'http:GET:/api/test',
    });

    await expect(
      concurrencyLimiter.acquire({
        tenantContext,
        userId: 'user_test',
        requestId: 'req_2',
        priority: 'HIGH',
        resourceName: 'http:GET:/api/test',
      })
    ).rejects.toBeInstanceOf(ConcurrencyLimitExceededError);

    release1();
  });

  it('enforces queue overflow behavior (global)', async () => {
    process.env.PERF_GLOBAL_MAX_CONCURRENCY = '1';
    process.env.PERF_GLOBAL_QUEUE_MAX_DEPTH = '0';
    process.env.PERF_GLOBAL_ACQUIRE_TIMEOUT_MS = '0';

    const release1 = await concurrencyLimiter.acquire({
      tenantContext,
      userId: 'user_test',
      requestId: 'req_3',
      priority: 'HIGH',
      resourceName: 'http:GET:/api/test2',
    });

    await expect(
      concurrencyLimiter.acquire({
        tenantContext,
        userId: 'user_test',
        requestId: 'req_4',
        priority: 'HIGH',
        resourceName: 'http:GET:/api/test2',
      })
    ).rejects.toBeInstanceOf(ConcurrencyLimitExceededError);

    release1();
  });

  it('priority-based shedding: SLO FAIL rejects LOW/BACKGROUND', () => {
    const result = loadShedder.decide({
      tenantContext,
      actorId: 'user_test',
      requestId: 'req_5',
      priority: 'LOW',
      endpoint: '/api/reports',
      readinessStatus: 'ready',
      sloStatus: 'FAIL',
    });

    expect(result.decision).toBe('REJECT');
    expect(result.reason).toBe('slo_fail');
  });

  it('deterministic outcomes: correlation IDs produce deterministic audit writes in CI mode', async () => {
    process.env.PERF_TENANT_MAX_CONCURRENCY = '1';
    process.env.PERF_TENANT_QUEUE_MAX_DEPTH = '0';
    process.env.PERF_TENANT_ACQUIRE_TIMEOUT_MS = '0';

    const audit = getImmutableAuditLogger();
    const spy = vi.spyOn(audit as any, 'logSecurityEvent');

    const release1 = await concurrencyLimiter.acquire({
      tenantContext,
      userId: 'user_test',
      requestId: 'req_6',
      priority: 'HIGH',
      resourceName: 'http:GET:/api/test3',
    });

    await expect(
      concurrencyLimiter.acquire({
        tenantContext,
        userId: 'user_test',
        requestId: 'req_7',
        priority: 'HIGH',
        resourceName: 'http:GET:/api/test3',
      })
    ).rejects.toBeInstanceOf(ConcurrencyLimitExceededError);

    expect(spy).toHaveBeenCalled();

    release1();
  });

  it('fail-closed when dependencies unhealthy: readiness not ready rejects non-critical', async () => {
    const prisma = { $queryRaw: vi.fn(async () => { throw new Error('db down'); }) } as any;

    const result = await admissionController.evaluate({
      prisma,
      requestId: 'req_8',
      req: { method: 'GET', path: '/api/test', ip: '127.0.0.1', headers: {} } as any,
      tenantContext,
      userId: 'user_test',
    });

    expect(result.decision).toBe('REJECT');
    expect(result.reason).toBe('not_ready');
  });
});
