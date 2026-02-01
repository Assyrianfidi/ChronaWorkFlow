import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { logger } from '../utils/structured-logger.js';
import { TenantContext } from '../tenant/tenant-isolation.js';

export type RetryDecision = 'RETRY' | 'FAIL';

export interface RetryPolicyConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterRatio: number;
  retryableError?: (error: unknown) => boolean;
}

export interface RetryContext {
  tenantContext?: TenantContext;
  userId?: string;
  operationName: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

export class RetryExhaustedError extends Error {
  readonly attempts: number;
  readonly operationName: string;

  constructor(operationName: string, attempts: number, message?: string) {
    super(message || `Retry attempts exhausted for ${operationName} after ${attempts} attempts`);
    this.name = 'RetryExhaustedError';
    this.attempts = attempts;
    this.operationName = operationName;
  }
}

const DEFAULT_CONFIG: RetryPolicyConfig = {
  maxAttempts: 3,
  baseDelayMs: 50,
  maxDelayMs: 2000,
  backoffMultiplier: 2,
  jitterRatio: 0.2,
  retryableError: () => true
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isDeterministic(): boolean {
  return process.env.DETERMINISTIC_TEST_IDS === 'true';
}

function safeCorrelationId(ctx: RetryContext): string {
  if (ctx.correlationId) {
    return ctx.correlationId;
  }

  if (isDeterministic()) {
    return `retry_${ctx.operationName}`;
  }

  return `retry_${ctx.operationName}_${Date.now()}`;
}

function computeBackoffDelayMs(attempt: number, config: RetryPolicyConfig): number {
  const exp = Math.pow(config.backoffMultiplier, Math.max(0, attempt - 1));
  const raw = config.baseDelayMs * exp;
  const capped = Math.min(config.maxDelayMs, Math.max(0, raw));

  if (isDeterministic() || config.jitterRatio <= 0) {
    return Math.floor(capped);
  }

  const jitterWindow = Math.floor(capped * config.jitterRatio);
  const jitter = jitterWindow > 0 ? Math.floor(Math.random() * (jitterWindow + 1)) : 0;
  return Math.floor(Math.min(config.maxDelayMs, capped + jitter));
}

export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  retryConfig: Partial<RetryPolicyConfig>,
  context: RetryContext
): Promise<T> {
  const auditLogger = getImmutableAuditLogger();
  const cfg: RetryPolicyConfig = { ...DEFAULT_CONFIG, ...retryConfig };

  if (cfg.maxAttempts < 1) {
    throw new Error('RetryPolicyConfig.maxAttempts must be >= 1');
  }

  const correlationId = safeCorrelationId(context);

  let lastError: unknown;

  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      const shouldRetry = cfg.retryableError ? cfg.retryableError(error) : true;
      const remainingAttempts = cfg.maxAttempts - attempt;

      logger.warn('Retry attempt failed', {
        operationName: context.operationName,
        attempt,
        remainingAttempts,
        tenantId: context.tenantContext?.tenantId,
        correlationId
      });

      if (!shouldRetry || remainingAttempts <= 0) {
        auditLogger.logSecurityEvent({
          tenantId: context.tenantContext?.tenantId || 'system',
          actorId: context.userId || 'system',
          action: 'RETRY_EXHAUSTED',
          resourceType: 'RETRY_POLICY',
          resourceId: context.operationName,
          outcome: 'FAILURE',
          correlationId,
          severity: 'HIGH',
          metadata: {
            attempt,
            maxAttempts: cfg.maxAttempts,
            operationName: context.operationName,
            error: error instanceof Error ? error.message : String(error),
            ...context.metadata
          }
        });

        throw new RetryExhaustedError(
          context.operationName,
          attempt,
          error instanceof Error ? error.message : undefined
        );
      }

      const delayMs = computeBackoffDelayMs(attempt, cfg);
      await sleep(delayMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export class RetryPolicy {
  private config: RetryPolicyConfig;

  constructor(config: Partial<RetryPolicyConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async execute<T>(operation: () => Promise<T>, context: RetryContext): Promise<T> {
    return executeWithRetry(operation, this.config, context);
  }
}
