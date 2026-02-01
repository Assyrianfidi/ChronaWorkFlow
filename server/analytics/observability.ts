// Analytics Observability
// Tenant-scoped metrics and audit-safe monitoring hooks

import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';

import { logger } from '../utils/structured-logger.js';

import { TenantContext } from '../tenant/tenant-isolation.js';

import { AuthorizationEngine } from '../auth/authorization-engine.js';
import { ServiceAuthorizationGuard } from '../auth/authorization-guards.js';
import { Permission } from '../auth/tenant-permissions.js';

import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';

const observabilityTenantContext = new AsyncLocalStorage<TenantContext>();

export const runWithTenantContext = async <T>(tenantContext: TenantContext, fn: () => Promise<T>): Promise<T> => {
  return await observabilityTenantContext.run(tenantContext, fn);
};

const getTenantContextOrThrow = (): TenantContext => {
  const ctx = observabilityTenantContext.getStore();
  if (!ctx) {
    throw new Error('TENANT_CONTEXT_REQUIRED');
  }
  return ctx;
};

export type ObservabilityEventType =
  | 'ANALYTICS_QUERY_SUBMITTED'
  | 'ANALYTICS_QUERY_COMPLETED'
  | 'ANALYTICS_QUERY_FAILED'
  | 'INSIGHTS_REQUESTED'
  | 'RECOMMENDATIONS_REQUESTED'
  | 'CUSTOMER_SEGMENTATION_REQUESTED'
  | 'RATE_LIMIT_TRIGGERED'
  | 'SECURITY_EVENT';

export interface ObservabilityEvent {
  id: string;
  tenantId: string;
  actorId: string;
  type: ObservabilityEventType;
  timestamp: Date;
  correlationId: string;
  metadata: Record<string, any>;
}

export interface TenantObservabilitySummary {
  tenantId: string;
  generatedAt: Date;
  windowMinutes: number;
  counters: Record<string, number>;
  latenciesMs: Record<
    string,
    {
      count: number;
      avg: number;
      p95Approx: number;
      max: number;
    }
  >;
  recentEvents: ObservabilityEvent[];
}

interface LatencyAgg {
  count: number;
  total: number;
  max: number;
  // Deterministic p95 approximation using an exponentially-decayed high-water mark.
  p95Approx: number;
}

interface TenantMetricsState {
  counters: Map<string, number>;
  latencies: Map<string, LatencyAgg>;
  recentEvents: ObservabilityEvent[];
  lastPruneAt: number;
}

const clamp = (n: number, min: number, max: number): number => Math.max(min, Math.min(max, n));

const stableId = (parts: string[]): string => {
  return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 24);
};

const nowMs = (): number => Date.now();

export class AnalyticsObservability {
  private static instance: AnalyticsObservability | null = null;

  private prisma: PrismaClient;
  private authorizationEngine: AuthorizationEngine;
  private serviceGuard: ServiceAuthorizationGuard;
  private auditLogger: any;

  private stateByTenant: Map<string, TenantMetricsState> = new Map();

  private retentionMs = 30 * 60 * 1000; // 30 minutes
  private maxRecentEvents = 200;

  private constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.authorizationEngine = new AuthorizationEngine(prisma);
    this.serviceGuard = new ServiceAuthorizationGuard(this.authorizationEngine);
    this.auditLogger = getImmutableAuditLogger(prisma);
  }

  static getInstance(prisma?: PrismaClient): AnalyticsObservability {
    if (!AnalyticsObservability.instance) {
      if (!prisma) {
        throw new Error('PRISMA_REQUIRED');
      }
      AnalyticsObservability.instance = new AnalyticsObservability(prisma);
    }
    return AnalyticsObservability.instance;
  }

  private getOrCreateTenantState(tenantId: string): TenantMetricsState {
    const existing = this.stateByTenant.get(tenantId);
    if (existing) return existing;

    const created: TenantMetricsState = {
      counters: new Map(),
      latencies: new Map(),
      recentEvents: [],
      lastPruneAt: 0
    };

    this.stateByTenant.set(tenantId, created);
    return created;
  }

  private pruneIfNeeded(tenantId: string): void {
    const state = this.getOrCreateTenantState(tenantId);
    const now = nowMs();

    if (now - state.lastPruneAt < 60_000) return;
    state.lastPruneAt = now;

    const cutoff = now - this.retentionMs;
    state.recentEvents = state.recentEvents.filter(e => e.timestamp.getTime() >= cutoff);

    if (state.recentEvents.length > this.maxRecentEvents) {
      state.recentEvents = state.recentEvents.slice(-this.maxRecentEvents);
    }
  }

  private async requirePermission(
    tenantContext: TenantContext,
    permission: Permission,
    operation: string,
    requestId: string,
    resource?: { type: string; id: string; tenantId?: string }
  ): Promise<void> {
    const result = await this.serviceGuard.requirePermission(tenantContext, {
      permission,
      resource: resource
        ? {
            type: resource.type,
            id: resource.id,
            tenantId: resource.tenantId ?? tenantContext.tenantId
          }
        : undefined,
      operation,
      requestId
    });

    if (!result.authorized) {
      throw new Error('PERMISSION_DENIED');
    }
  }

  private sanitizeError(err: unknown): Error {
    const e = err as Error;
    const msg = (e?.message || 'INTERNAL_ERROR').toUpperCase();

    const safeCodes = new Set([
      'TENANT_CONTEXT_REQUIRED',
      'PERMISSION_DENIED',
      'TENANT_ISOLATION_VIOLATION',
      'INTERNAL_ERROR'
    ]);

    if (safeCodes.has(msg)) return new Error(msg);
    return new Error('INTERNAL_ERROR');
  }

  recordEvent(type: ObservabilityEventType, metadata: Record<string, any> = {}): void {
    const tenantContext = getTenantContextOrThrow();
    const tenantId = tenantContext.tenantId;

    const actorId = (tenantContext as any).user?.id || 'system';
    const correlationId = (tenantContext as any).requestId || 'unknown';

    const state = this.getOrCreateTenantState(tenantId);
    this.pruneIfNeeded(tenantId);

    const counterKey = `event:${type}`;
    state.counters.set(counterKey, (state.counters.get(counterKey) || 0) + 1);

    const event: ObservabilityEvent = {
      id: stableId([tenantId, type, correlationId, String(nowMs())]),
      tenantId,
      actorId,
      type,
      timestamp: new Date(),
      correlationId,
      metadata
    };

    state.recentEvents.push(event);
    if (state.recentEvents.length > this.maxRecentEvents) {
      state.recentEvents = state.recentEvents.slice(-this.maxRecentEvents);
    }

    logger.debug('Observability event recorded', {
      tenantId,
      actorId,
      type,
      correlationId
    });
  }

  recordLatency(operation: string, durationMs: number): void {
    const tenantContext = getTenantContextOrThrow();
    const tenantId = tenantContext.tenantId;

    const state = this.getOrCreateTenantState(tenantId);
    this.pruneIfNeeded(tenantId);

    const key = `latency:${operation}`;
    const agg = state.latencies.get(key) || { count: 0, total: 0, max: 0, p95Approx: 0 };

    const d = clamp(Math.round(durationMs), 0, 60 * 60 * 1000);

    agg.count += 1;
    agg.total += d;
    agg.max = Math.max(agg.max, d);

    // Deterministic p95 approximation.
    // - Track a high-water value that decays slowly; spikes increase it quickly.
    const decay = 0.98;
    agg.p95Approx = Math.max(d, Math.round(agg.p95Approx * decay));

    state.latencies.set(key, agg);
  }

  async getTenantSummary(tenantId: string): Promise<TenantObservabilitySummary> {
    const tenantContext = getTenantContextOrThrow();
    const requestId = (tenantContext as any).requestId || 'unknown';
    const actorId = (tenantContext as any).user?.id || 'system';

    try {
      if (tenantContext.tenantId !== tenantId) {
        throw new Error('TENANT_ISOLATION_VIOLATION');
      }

      await this.requirePermission(tenantContext, 'reports:read', 'get_tenant_observability', requestId, {
        type: 'TENANT',
        id: tenantId,
        tenantId
      });

      this.pruneIfNeeded(tenantId);
      const state = this.getOrCreateTenantState(tenantId);

      const counters: Record<string, number> = {};
      for (const [k, v] of state.counters.entries()) counters[k] = v;

      const latenciesMs: TenantObservabilitySummary['latenciesMs'] = {};
      for (const [k, v] of state.latencies.entries()) {
        latenciesMs[k] = {
          count: v.count,
          avg: v.count > 0 ? Math.round(v.total / v.count) : 0,
          p95Approx: v.p95Approx,
          max: v.max
        };
      }

      const summary: TenantObservabilitySummary = {
        tenantId,
        generatedAt: new Date(),
        windowMinutes: Math.floor(this.retentionMs / 60000),
        counters,
        latenciesMs,
        recentEvents: [...state.recentEvents]
      };

      const integrityHash = createHash('sha256')
        .update(JSON.stringify({ tenantId, requestId, counters, latencies: Object.keys(latenciesMs).length }))
        .digest('hex');

      this.auditLogger.logAuthorizationDecision({
        tenantId,
        actorId,
        action: 'ANALYTICS_OBSERVABILITY_READ',
        resourceType: 'OBSERVABILITY',
        resourceId: tenantId,
        outcome: 'SUCCESS',
        correlationId: requestId || `observability_${Date.now()}`,
        metadata: {
          who: actorId,
          what: 'ANALYTICS_OBSERVABILITY_READ',
          when: new Date().toISOString(),
          why: 'Tenant observability summary requested',
          requestId,
          integrityHash
        }
      });

      return summary;
    } catch (err) {
      const safe = this.sanitizeError(err);

      this.auditLogger.logAuthorizationDecision({
        tenantId: tenantContext.tenantId,
        actorId,
        action: 'ANALYTICS_OBSERVABILITY_READ',
        resourceType: 'OBSERVABILITY',
        resourceId: tenantContext.tenantId,
        outcome: safe.message === 'PERMISSION_DENIED' ? 'DENIED' : 'DENIED',
        correlationId: requestId || `observability_${Date.now()}`,
        metadata: {
          who: actorId,
          what: 'ANALYTICS_OBSERVABILITY_READ',
          when: new Date().toISOString(),
          why: 'Tenant observability summary requested',
          requestId,
          error: safe.message
        }
      });

      throw safe;
    }
  }
}

let globalPrisma: PrismaClient | null = null;

export const initializeAnalyticsObservability = (prisma: PrismaClient): void => {
  globalPrisma = prisma;
  AnalyticsObservability.getInstance(prisma);
};

export const recordObservabilityEvent = (type: ObservabilityEventType, metadata: Record<string, any> = {}): void => {
  if (!globalPrisma) {
    throw new Error('INTERNAL_ERROR');
  }
  const obs = AnalyticsObservability.getInstance(globalPrisma);
  obs.recordEvent(type, metadata);
};

export const recordObservabilityLatency = (operation: string, durationMs: number): void => {
  if (!globalPrisma) {
    throw new Error('INTERNAL_ERROR');
  }
  const obs = AnalyticsObservability.getInstance(globalPrisma);
  obs.recordLatency(operation, durationMs);
};

export const getTenantObservabilitySummary = async (tenantId: string): Promise<TenantObservabilitySummary> => {
  if (!globalPrisma) {
    throw new Error('INTERNAL_ERROR');
  }
  const obs = AnalyticsObservability.getInstance(globalPrisma);
  return await obs.getTenantSummary(tenantId);
};
