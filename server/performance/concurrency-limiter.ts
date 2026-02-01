import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import type { TenantContext } from '../tenant/tenant-isolation.js';

import { getCapacityConfig, getTenantPriorityTier } from './capacity-config.js';
import type { RequestPriority } from './request-priority.js';

export class ConcurrencyLimitExceededError extends Error {
  readonly tenantId: string;
  readonly scope: 'GLOBAL' | 'TENANT';
  readonly priority: RequestPriority;

  constructor(tenantId: string, scope: 'GLOBAL' | 'TENANT', priority: RequestPriority, message?: string) {
    super(message || `Concurrency limit exceeded (${scope}) for tenant ${tenantId}`);
    this.name = 'ConcurrencyLimitExceededError';
    this.tenantId = tenantId;
    this.scope = scope;
    this.priority = priority;
  }
}

export interface ConcurrencyContext {
  tenantContext: TenantContext;
  userId?: string;
  requestId: string;
  priority: RequestPriority;
  resourceName: string;
  metadata?: Record<string, any>;
}

export interface ConcurrencyLimiterState {
  global: { inFlight: number; queueDepth: number; maxConcurrent: number; queueMaxDepth: number };
  tenant: { inFlight: number; queueDepth: number; maxConcurrent: number; queueMaxDepth: number };
}

function isDeterministic(): boolean {
  return process.env.DETERMINISTIC_TEST_IDS === 'true';
}

function safeCorrelationId(ctx: ConcurrencyContext, scope: 'GLOBAL' | 'TENANT'): string {
  if (isDeterministic()) {
    return `concurrency_${scope}_${ctx.resourceName}_${ctx.tenantContext.tenantId}`;
  }
  return ctx.requestId || `concurrency_${scope}_${ctx.resourceName}_${ctx.tenantContext.tenantId}_${Date.now()}`;
}

function computeTenantMax(base: number, tenantContext: TenantContext): number {
  const tier = getTenantPriorityTier(tenantContext);
  const multiplier = getCapacityConfig().concurrency.tenantTierMultipliers[tier] ?? 1.0;
  const scaled = Math.floor(base * multiplier);
  return Math.max(1, scaled);
}

class Semaphore {
  private maxConcurrent: number;
  private inFlight = 0;
  private waiters: Array<() => void> = [];

  constructor(maxConcurrent: number) {
    this.maxConcurrent = Math.max(1, maxConcurrent);
  }

  setMaxConcurrent(maxConcurrent: number): void {
    this.maxConcurrent = Math.max(1, maxConcurrent);
  }

  get currentInFlight(): number {
    return this.inFlight;
  }

  get currentQueueDepth(): number {
    return this.waiters.length;
  }

  async acquire(timeoutMs: number, queueMaxDepth: number): Promise<boolean> {
    if (this.inFlight < this.maxConcurrent) {
      this.inFlight += 1;
      return true;
    }

    if (this.waiters.length >= queueMaxDepth) {
      return false;
    }

    let resolved = false;
    let timer: NodeJS.Timeout | undefined;

    return await new Promise<boolean>((resolve) => {
      const grant = () => {
        if (resolved) {
          return;
        }
        resolved = true;
        if (timer) {
          clearTimeout(timer);
        }
        this.inFlight += 1;
        resolve(true);
      };

      this.waiters.push(grant);

      timer = setTimeout(() => {
        if (resolved) {
          return;
        }
        resolved = true;
        const idx = this.waiters.indexOf(grant);
        if (idx >= 0) {
          this.waiters.splice(idx, 1);
        }
        resolve(false);
      }, timeoutMs);
    });
  }

  release(): void {
    if (this.inFlight > 0) {
      this.inFlight -= 1;
    }

    const next = this.waiters.shift();
    if (next) {
      next();
    }
  }
}

export class ConcurrencyLimiter {
  private getAudit() {
    return getImmutableAuditLogger();
  }
  private globalSemaphore = new Semaphore(getCapacityConfig().concurrency.globalMaxConcurrent);
  private tenantSemaphores: Map<string, Semaphore> = new Map();

  private getOrCreateTenantSemaphore(tenantId: string, maxConcurrent: number): Semaphore {
    let sem = this.tenantSemaphores.get(tenantId);
    if (!sem) {
      sem = new Semaphore(maxConcurrent);
      this.tenantSemaphores.set(tenantId, sem);
      return sem;
    }
    sem.setMaxConcurrent(maxConcurrent);
    return sem;
  }

  getState(tenantId: string): ConcurrencyLimiterState {
    const cfg = getCapacityConfig();

    this.globalSemaphore.setMaxConcurrent(cfg.concurrency.globalMaxConcurrent);
    const tenantMax = computeTenantMax(cfg.concurrency.perTenantMaxConcurrent, { tenantId } as any);
    const tenantSem = this.getOrCreateTenantSemaphore(tenantId, tenantMax);

    return {
      global: {
        inFlight: this.globalSemaphore.currentInFlight,
        queueDepth: this.globalSemaphore.currentQueueDepth,
        maxConcurrent: cfg.concurrency.globalMaxConcurrent,
        queueMaxDepth: cfg.concurrency.globalQueueMaxDepth,
      },
      tenant: {
        inFlight: tenantSem.currentInFlight,
        queueDepth: tenantSem.currentQueueDepth,
        maxConcurrent: tenantMax,
        queueMaxDepth: cfg.concurrency.perTenantQueueMaxDepth,
      },
    };
  }

  async acquire(ctx: ConcurrencyContext): Promise<() => void> {
    const cfg = getCapacityConfig();
    const tenantId = ctx.tenantContext.tenantId;

    const globalCorrelationId = safeCorrelationId(ctx, 'GLOBAL');
    const tenantCorrelationId = safeCorrelationId(ctx, 'TENANT');

    const globalConfig = {
      maxConcurrent: cfg.concurrency.globalMaxConcurrent,
      queueMaxDepth: cfg.concurrency.globalQueueMaxDepth,
      acquireTimeoutMs: cfg.concurrency.globalAcquireTimeoutMs,
    };

    const tenantConfig = {
      maxConcurrent: computeTenantMax(cfg.concurrency.perTenantMaxConcurrent, ctx.tenantContext),
      queueMaxDepth: cfg.concurrency.perTenantQueueMaxDepth,
      acquireTimeoutMs: cfg.concurrency.perTenantAcquireTimeoutMs,
    };

    this.globalSemaphore.setMaxConcurrent(globalConfig.maxConcurrent);
    const tenantSem = this.getOrCreateTenantSemaphore(tenantId, tenantConfig.maxConcurrent);

    const globalOk = await this.globalSemaphore.acquire(globalConfig.acquireTimeoutMs, globalConfig.queueMaxDepth);
    if (!globalOk) {
      this.getAudit().logSecurityEvent({
        tenantId,
        actorId: ctx.userId || 'system',
        action: 'CONCURRENCY_GLOBAL_SATURATED',
        resourceType: 'CONCURRENCY_LIMITER',
        resourceId: `global:${ctx.resourceName}`,
        outcome: 'DENIED',
        correlationId: globalCorrelationId,
        severity: 'CRITICAL',
        metadata: {
          priority: ctx.priority,
          config: globalConfig,
          inFlight: this.globalSemaphore.currentInFlight,
          queueDepth: this.globalSemaphore.currentQueueDepth,
          ...(ctx.metadata || {}),
        },
      });
      throw new ConcurrencyLimitExceededError(tenantId, 'GLOBAL', ctx.priority);
    }

    let released = false;
    const releaseGlobal = () => {
      if (released) {
        return;
      }
      released = true;
      this.globalSemaphore.release();
    };

    const tenantOk = await tenantSem.acquire(tenantConfig.acquireTimeoutMs, tenantConfig.queueMaxDepth);
    if (!tenantOk) {
      releaseGlobal();
      this.getAudit().logSecurityEvent({
        tenantId,
        actorId: ctx.userId || 'system',
        action: 'CONCURRENCY_TENANT_SATURATED',
        resourceType: 'CONCURRENCY_LIMITER',
        resourceId: `${ctx.resourceName}:${tenantId}`,
        outcome: 'DENIED',
        correlationId: tenantCorrelationId,
        severity: 'HIGH',
        metadata: {
          priority: ctx.priority,
          config: tenantConfig,
          inFlight: tenantSem.currentInFlight,
          queueDepth: tenantSem.currentQueueDepth,
          ...(ctx.metadata || {}),
        },
      });
      throw new ConcurrencyLimitExceededError(tenantId, 'TENANT', ctx.priority);
    }

    let tenantReleased = false;
    const releaseTenant = () => {
      if (tenantReleased) {
        return;
      }
      tenantReleased = true;
      tenantSem.release();
    };

    return () => {
      releaseTenant();
      releaseGlobal();
    };
  }

  async execute<T>(operation: () => Promise<T>, ctx: ConcurrencyContext): Promise<T> {
    const release = await this.acquire(ctx);
    try {
      return await operation();
    } finally {
      release();
    }
  }
}

export const concurrencyLimiter = new ConcurrencyLimiter();
