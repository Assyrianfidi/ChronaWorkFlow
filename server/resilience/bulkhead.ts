import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { logger } from '../utils/structured-logger.js';
import { TenantContext } from '../tenant/tenant-isolation.js';

export interface BulkheadConfig {
  maxConcurrent: number;
  queueMaxDepth: number;
  acquireTimeoutMs: number;
}

export interface BulkheadContext {
  tenantContext: TenantContext;
  userId?: string;
  resourceName: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

export class BulkheadRejectedError extends Error {
  readonly tenantId: string;
  readonly resourceName: string;

  constructor(tenantId: string, resourceName: string, message?: string) {
    super(message || `Bulkhead rejected for tenant ${tenantId} (${resourceName})`);
    this.name = 'BulkheadRejectedError';
    this.tenantId = tenantId;
    this.resourceName = resourceName;
  }
}

const DEFAULT_CONFIG: BulkheadConfig = {
  maxConcurrent: 8,
  queueMaxDepth: 64,
  acquireTimeoutMs: 5000
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isDeterministic(): boolean {
  return process.env.DETERMINISTIC_TEST_IDS === 'true';
}

function safeCorrelationId(ctx: BulkheadContext): string {
  if (ctx.correlationId) {
    return ctx.correlationId;
  }

  if (isDeterministic()) {
    return `bulkhead_${ctx.resourceName}_${ctx.tenantContext.tenantId}`;
  }

  return `bulkhead_${ctx.resourceName}_${ctx.tenantContext.tenantId}_${Date.now()}`;
}

class BulkheadSemaphore {
  private maxConcurrent: number;
  private inFlight: number = 0;
  private waiters: Array<() => void> = [];

  constructor(maxConcurrent: number) {
    this.maxConcurrent = maxConcurrent;
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
    let timer: NodeJS.Timeout | null = null;

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

export class TenantBulkhead {
  private config: BulkheadConfig;
  private semaphoresByTenant: Map<string, BulkheadSemaphore> = new Map();
  private auditLogger: any;

  constructor(config: Partial<BulkheadConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.auditLogger = getImmutableAuditLogger();

    if (this.config.maxConcurrent < 1) {
      throw new Error('BulkheadConfig.maxConcurrent must be >= 1');
    }
    if (this.config.queueMaxDepth < 0) {
      throw new Error('BulkheadConfig.queueMaxDepth must be >= 0');
    }
    if (this.config.acquireTimeoutMs < 0) {
      throw new Error('BulkheadConfig.acquireTimeoutMs must be >= 0');
    }
  }

  getState(tenantId: string): { inFlight: number; queueDepth: number; maxConcurrent: number; queueMaxDepth: number } {
    const sem = this.getOrCreateSemaphore(tenantId);
    return {
      inFlight: sem.currentInFlight,
      queueDepth: sem.currentQueueDepth,
      maxConcurrent: this.config.maxConcurrent,
      queueMaxDepth: this.config.queueMaxDepth
    };
  }

  async execute<T>(operation: () => Promise<T>, ctx: BulkheadContext): Promise<T> {
    const correlationId = safeCorrelationId(ctx);
    const tenantId = ctx.tenantContext.tenantId;

    const sem = this.getOrCreateSemaphore(tenantId);

    const acquired = await sem.acquire(this.config.acquireTimeoutMs, this.config.queueMaxDepth);
    if (!acquired) {
      this.auditLogger.logSecurityEvent({
        tenantId,
        actorId: ctx.userId || 'system',
        action: 'BULKHEAD_SATURATED',
        resourceType: 'BULKHEAD',
        resourceId: `${ctx.resourceName}:${tenantId}`,
        outcome: 'FAILURE',
        correlationId,
        severity: 'HIGH',
        metadata: {
          resourceName: ctx.resourceName,
          inFlight: sem.currentInFlight,
          queueDepth: sem.currentQueueDepth,
          maxConcurrent: this.config.maxConcurrent,
          queueMaxDepth: this.config.queueMaxDepth,
          acquireTimeoutMs: this.config.acquireTimeoutMs,
          ...ctx.metadata
        }
      });

      logger.warn('Bulkhead saturated', {
        tenantId,
        resourceName: ctx.resourceName,
        correlationId,
        inFlight: sem.currentInFlight,
        queueDepth: sem.currentQueueDepth
      });

      throw new BulkheadRejectedError(tenantId, ctx.resourceName);
    }

    try {
      return await operation();
    } finally {
      sem.release();
    }
  }

  private getOrCreateSemaphore(tenantId: string): BulkheadSemaphore {
    let sem = this.semaphoresByTenant.get(tenantId);
    if (!sem) {
      sem = new BulkheadSemaphore(this.config.maxConcurrent);
      this.semaphoresByTenant.set(tenantId, sem);
    }
    return sem;
  }
}

export const tenantBulkhead = new TenantBulkhead();

export async function executeWithBulkhead<T>(
  operation: () => Promise<T>,
  ctx: BulkheadContext,
  config?: Partial<BulkheadConfig>
): Promise<T> {
  if (!config) {
    return await tenantBulkhead.execute(operation, ctx);
  }

  const bulkhead = new TenantBulkhead(config);
  return await bulkhead.execute(operation, ctx);
}
