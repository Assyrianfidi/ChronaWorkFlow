import type { TenantContext } from '../tenant/tenant-isolation.js';

export type CapacityEnvironment = 'production' | 'staging' | 'ci' | 'development';

export type TenantPriorityTier = 'ENTERPRISE' | 'PRO' | 'STARTER' | 'FREE' | 'UNKNOWN';

export interface CapacityConfig {
  env: CapacityEnvironment;
  concurrency: {
    globalMaxConcurrent: number;
    globalQueueMaxDepth: number;
    globalAcquireTimeoutMs: number;

    perTenantMaxConcurrent: number;
    perTenantQueueMaxDepth: number;
    perTenantAcquireTimeoutMs: number;

    tenantTierMultipliers: Record<TenantPriorityTier, number>;
  };
  shedding: {
    enabled: boolean;
    defaultPolicy: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
  };
}

function detectEnv(): CapacityEnvironment {
  if (process.env.CI === 'true' || process.env.DETERMINISTIC_TEST_IDS === 'true') {
    return 'ci';
  }
  const nodeEnv = process.env.NODE_ENV as string | undefined;

  if (nodeEnv === 'production') {
    return 'production';
  }
  if (nodeEnv === 'staging') {
    return 'staging';
  }
  return 'development';
}

export function getTenantPriorityTier(tenantContext?: TenantContext): TenantPriorityTier {
  const plan = (tenantContext as any)?.tenant?.subscriptionPlan as string | undefined;
  const normalized = (plan || '').toUpperCase();

  if (normalized.includes('ENTERPRISE')) {
    return 'ENTERPRISE';
  }
  if (normalized.includes('PRO')) {
    return 'PRO';
  }
  if (normalized.includes('STARTER')) {
    return 'STARTER';
  }
  if (normalized.includes('FREE')) {
    return 'FREE';
  }

  return plan ? 'UNKNOWN' : 'UNKNOWN';
}

export function getCapacityConfig(envOverride?: CapacityEnvironment): CapacityConfig {
  const env = envOverride || detectEnv();

  const baseMultipliers: Record<TenantPriorityTier, number> = {
    ENTERPRISE: 2.0,
    PRO: 1.5,
    STARTER: 1.0,
    FREE: 0.7,
    UNKNOWN: 1.0,
  };

  const applyOverrides = (cfg: CapacityConfig): CapacityConfig => {
    const asInt = (v: string | undefined): number | undefined => {
      if (!v) {
        return undefined;
      }
      const n = Number(v);
      return Number.isFinite(n) ? Math.floor(n) : undefined;
    };

    const globalMaxConcurrent = asInt(process.env.PERF_GLOBAL_MAX_CONCURRENCY);
    const globalQueueMaxDepth = asInt(process.env.PERF_GLOBAL_QUEUE_MAX_DEPTH);
    const globalAcquireTimeoutMs = asInt(process.env.PERF_GLOBAL_ACQUIRE_TIMEOUT_MS);
    const perTenantMaxConcurrent = asInt(process.env.PERF_TENANT_MAX_CONCURRENCY);
    const perTenantQueueMaxDepth = asInt(process.env.PERF_TENANT_QUEUE_MAX_DEPTH);
    const perTenantAcquireTimeoutMs = asInt(process.env.PERF_TENANT_ACQUIRE_TIMEOUT_MS);

    return {
      ...cfg,
      concurrency: {
        ...cfg.concurrency,
        globalMaxConcurrent: globalMaxConcurrent ?? cfg.concurrency.globalMaxConcurrent,
        globalQueueMaxDepth: globalQueueMaxDepth ?? cfg.concurrency.globalQueueMaxDepth,
        globalAcquireTimeoutMs: globalAcquireTimeoutMs ?? cfg.concurrency.globalAcquireTimeoutMs,
        perTenantMaxConcurrent: perTenantMaxConcurrent ?? cfg.concurrency.perTenantMaxConcurrent,
        perTenantQueueMaxDepth: perTenantQueueMaxDepth ?? cfg.concurrency.perTenantQueueMaxDepth,
        perTenantAcquireTimeoutMs: perTenantAcquireTimeoutMs ?? cfg.concurrency.perTenantAcquireTimeoutMs,
      },
    };
  };

  switch (env) {
    case 'production':
      return applyOverrides({
        env,
        concurrency: {
          globalMaxConcurrent: 256,
          globalQueueMaxDepth: 2048,
          globalAcquireTimeoutMs: 150,

          perTenantMaxConcurrent: 24,
          perTenantQueueMaxDepth: 256,
          perTenantAcquireTimeoutMs: 150,

          tenantTierMultipliers: baseMultipliers,
        },
        shedding: {
          enabled: true,
          defaultPolicy: 'BALANCED',
        },
      });
    case 'staging':
      return applyOverrides({
        env,
        concurrency: {
          globalMaxConcurrent: 64,
          globalQueueMaxDepth: 512,
          globalAcquireTimeoutMs: 150,

          perTenantMaxConcurrent: 12,
          perTenantQueueMaxDepth: 128,
          perTenantAcquireTimeoutMs: 150,

          tenantTierMultipliers: baseMultipliers,
        },
        shedding: {
          enabled: true,
          defaultPolicy: 'BALANCED',
        },
      });
    case 'ci':
      return applyOverrides({
        env,
        concurrency: {
          globalMaxConcurrent: 8,
          globalQueueMaxDepth: 8,
          globalAcquireTimeoutMs: 0,

          perTenantMaxConcurrent: 2,
          perTenantQueueMaxDepth: 2,
          perTenantAcquireTimeoutMs: 0,

          tenantTierMultipliers: {
            ENTERPRISE: 1.0,
            PRO: 1.0,
            STARTER: 1.0,
            FREE: 1.0,
            UNKNOWN: 1.0,
          },
        },
        shedding: {
          enabled: true,
          defaultPolicy: 'CONSERVATIVE',
        },
      });
    case 'development':
    default:
      return applyOverrides({
        env: 'development',
        concurrency: {
          globalMaxConcurrent: 32,
          globalQueueMaxDepth: 256,
          globalAcquireTimeoutMs: 150,

          perTenantMaxConcurrent: 8,
          perTenantQueueMaxDepth: 64,
          perTenantAcquireTimeoutMs: 150,

          tenantTierMultipliers: baseMultipliers,
        },
        shedding: {
          enabled: true,
          defaultPolicy: 'BALANCED',
        },
      });
  }
}
