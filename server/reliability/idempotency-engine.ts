import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { logger } from '../utils/structured-logger.js';
import type { TenantContext } from '../tenant/tenant-isolation.js';
import {
  idempotencyManager,
  type IdempotencyScope,
  type IdempotencyResult,
  generateIdempotencyKey,
  checkIdempotency,
} from '../resilience/idempotency-manager.js';

export type IdempotencyDomain = 'BILLING' | 'WEBHOOK' | 'MUTATING_API';

export interface IdempotencyEngineContext {
  tenantContext: TenantContext;
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

export interface IdempotentOperationInput {
  domain: IdempotencyDomain;
  operationType: string;
  idempotencyKey: string;
  ttlMs?: number;
}

export class IdempotencyReplayDetectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IdempotencyReplayDetectedError';
  }
}

export class IdempotencyEngine {
  private auditLogger: any;

  constructor() {
    this.auditLogger = getImmutableAuditLogger();
  }

  generateBillingKey(input: {
    billingType: string;
    billingId: string;
    tenantContext: TenantContext;
  }): string {
    if (!input.tenantContext?.tenantId) {
      throw new Error('Tenant context required');
    }

    return generateIdempotencyKey(
      `BILLING_${input.billingType}`,
      'TENANT' as IdempotencyScope,
      input.tenantContext,
      undefined,
      undefined,
      { billingId: input.billingId }
    );
  }

  generateWebhookKey(input: {
    provider: string;
    eventId: string;
    tenantContext: TenantContext;
  }): string {
    if (!input.tenantContext?.tenantId) {
      throw new Error('Tenant context required');
    }

    return generateIdempotencyKey(
      `WEBHOOK_${input.provider}`,
      'TENANT' as IdempotencyScope,
      input.tenantContext,
      undefined,
      undefined,
      { eventId: input.eventId }
    );
  }

  generateMutatingApiKey(input: {
    operationType: string;
    requestIdempotencyKey: string;
    tenantContext: TenantContext;
    requestFingerprint?: Record<string, any>;
  }): string {
    if (!input.tenantContext?.tenantId) {
      throw new Error('Tenant context required');
    }

    if (!input.requestIdempotencyKey) {
      throw new Error('requestIdempotencyKey required');
    }

    return generateIdempotencyKey(
      `API_${input.operationType}`,
      'TENANT' as IdempotencyScope,
      input.tenantContext,
      undefined,
      undefined,
      {
        idempotencyKey: input.requestIdempotencyKey,
        ...(input.requestFingerprint || {})
      }
    );
  }

  async executeExactlyOnce<T>(
    input: IdempotentOperationInput,
    ctx: IdempotencyEngineContext,
    operation: () => Promise<T>
  ): Promise<T> {
    if (!ctx.tenantContext?.tenantId) {
      throw new Error('Tenant context required');
    }

    if (!input.idempotencyKey) {
      throw new Error('idempotencyKey required');
    }

    const correlationId = ctx.correlationId || `idempotency_${input.domain}_${ctx.tenantContext.tenantId}`;

    const result: IdempotencyResult = await checkIdempotency(
      input.idempotencyKey,
      `${input.domain}_${input.operationType}`,
      'TENANT' as IdempotencyScope,
      ctx.tenantContext,
      ctx.userId,
      ctx.sessionId,
      input.ttlMs,
      1,
      {
        domain: input.domain,
        operationType: input.operationType,
        ...ctx.metadata
      }
    );

    if (result.isDuplicate) {
      this.auditLogger.logSecurityEvent({
        tenantId: ctx.tenantContext.tenantId,
        actorId: ctx.userId || 'system',
        action: 'IDEMPOTENCY_DUPLICATE_SUPPRESSED',
        resourceType: 'IDEMPOTENCY_KEY',
        resourceId: result.key.id,
        outcome: 'SUCCESS',
        correlationId,
        severity: 'MEDIUM',
        metadata: {
          domain: input.domain,
          operationType: input.operationType,
          idempotencyKey: input.idempotencyKey,
          status: result.status,
        }
      });

      if (result.status === 'COMPLETED') {
        // Replay detected: returning cached result is safe exactly-once semantics.
        this.auditLogger.logSecurityEvent({
          tenantId: ctx.tenantContext.tenantId,
          actorId: ctx.userId || 'system',
          action: 'IDEMPOTENCY_REPLAY_DETECTED',
          resourceType: 'IDEMPOTENCY_KEY',
          resourceId: result.key.id,
          outcome: 'WARNING',
          correlationId,
          severity: 'LOW',
          metadata: {
            domain: input.domain,
            operationType: input.operationType,
            idempotencyKey: input.idempotencyKey,
          }
        });

        return result.result as T;
      }

      if (result.status === 'FAILED') {
        throw new IdempotencyReplayDetectedError(result.error || 'Previous execution failed');
      }

      throw new IdempotencyReplayDetectedError(result.error || 'Duplicate execution blocked');
    }

    try {
      await idempotencyManager.startExecution(input.idempotencyKey, ctx.tenantContext, ctx.userId);
      const opResult = await operation();
      await idempotencyManager.completeExecution(input.idempotencyKey, opResult, ctx.tenantContext, ctx.userId);
      return opResult;
    } catch (error) {
      await idempotencyManager.failExecution(input.idempotencyKey, error as Error, ctx.tenantContext, ctx.userId);
      throw error;
    }
  }
}

export const idempotencyEngine = new IdempotencyEngine();

export async function executeBillingExactlyOnce<T>(
  input: { billingType: string; billingId: string; operationType: string },
  ctx: IdempotencyEngineContext,
  operation: () => Promise<T>
): Promise<T> {
  const key = idempotencyEngine.generateBillingKey({
    billingType: input.billingType,
    billingId: input.billingId,
    tenantContext: ctx.tenantContext,
  });

  return idempotencyEngine.executeExactlyOnce(
    {
      domain: 'BILLING',
      operationType: input.operationType,
      idempotencyKey: key,
      ttlMs: 24 * 60 * 60 * 1000,
    },
    ctx,
    operation
  );
}

export async function executeWebhookExactlyOnce<T>(
  input: { provider: string; eventId: string; operationType: string },
  ctx: IdempotencyEngineContext,
  operation: () => Promise<T>
): Promise<T> {
  const key = idempotencyEngine.generateWebhookKey({
    provider: input.provider,
    eventId: input.eventId,
    tenantContext: ctx.tenantContext,
  });

  return idempotencyEngine.executeExactlyOnce(
    {
      domain: 'WEBHOOK',
      operationType: input.operationType,
      idempotencyKey: key,
      ttlMs: 7 * 24 * 60 * 60 * 1000,
    },
    ctx,
    operation
  );
}

export async function executeMutatingApiExactlyOnce<T>(
  input: { operationType: string; requestIdempotencyKey: string; requestFingerprint?: Record<string, any> },
  ctx: IdempotencyEngineContext,
  operation: () => Promise<T>
): Promise<T> {
  const key = idempotencyEngine.generateMutatingApiKey({
    operationType: input.operationType,
    requestIdempotencyKey: input.requestIdempotencyKey,
    requestFingerprint: input.requestFingerprint,
    tenantContext: ctx.tenantContext,
  });

  return idempotencyEngine.executeExactlyOnce(
    {
      domain: 'MUTATING_API',
      operationType: input.operationType,
      idempotencyKey: key,
      ttlMs: 60 * 60 * 1000,
    },
    ctx,
    operation
  );
}

export function assertTenantScopedKey(key: string, tenantId: string): void {
  if (!key.includes(tenantId)) {
    logger.error('Idempotency key missing tenant scope', undefined, { key, tenantId });
    throw new Error('Idempotency key must be tenant-scoped');
  }
}
