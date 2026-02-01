// === CHUNK 1: Imports & Setup ===

import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';

import { logger } from '../utils/structured-logger.js';

import { TenantContext } from '../tenant/tenant-isolation.js';

import { AuthorizationEngine } from '../auth/authorization-engine.js';
import { ServiceAuthorizationGuard } from '../auth/authorization-guards.js';
import { Permission } from '../auth/tenant-permissions.js';

import { FeatureFlagManager } from '../enterprise/feature-flags.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';

import {
  AnalyticsEngine,
  AnalyticsQuery,
  AnalyticsAlert,
  AnalyticsMetric,
  AnalyticsDashboard
} from './analytics-engine';

// Runtime context holder. API functions in this module are designed to be called
// from request handlers that already established tenant context.
// This avoids unsafe globals and maintains strong isolation even under concurrency.
const insightsTenantContext = new AsyncLocalStorage<TenantContext>();

export const runWithTenantContext = async <T>(
  tenantContext: TenantContext,
  fn: () => Promise<T>
): Promise<T> => {
  return await insightsTenantContext.run(tenantContext, fn);
};

const getTenantContextOrThrow = (): TenantContext => {
  const ctx = insightsTenantContext.getStore();
  if (!ctx) {
    // Tenant-safe: do not leak internal wiring details.
    throw new Error('TENANT_CONTEXT_REQUIRED');
  }
  return ctx;
};

export type InsightSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TenantInsightOutput {
  tenantId: string;
  generatedAt: Date;
  windowDays: number;
  kpis: {
    activityScore: number; // 0..100
    churnRiskScore: number; // 0..100
    adoptionScore: number; // 0..100
  };
  insights: Array<{
    id: string;
    type: 'USAGE' | 'CHURN_RISK' | 'FEATURE_ADOPTION' | 'OPERATIONS' | 'SECURITY';
    severity: InsightSeverity;
    title: string;
    description: string;
    confidence: number; // 0..1
    actions: string[];
    evidence: Record<string, any>;
  }>;
  // Placeholder for ML model metadata (model version, feature importance, etc.)
  model?: {
    provider: 'DETERMINISTIC' | 'ML_PLACEHOLDER';
    version: string;
    notes?: string;
  };
}

export interface UserRecommendationOutput {
  userId: string;
  tenantId: string;
  generatedAt: Date;
  recommendations: Array<{
    id: string;
    category: 'ONBOARDING' | 'WORKFLOW' | 'FEATURE' | 'RISK' | 'SECURITY';
    title: string;
    description: string;
    confidence: number; // 0..1
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    callToAction: string;
    rationale: Record<string, any>;
  }>;
  model?: {
    provider: 'DETERMINISTIC' | 'ML_PLACEHOLDER';
    version: string;
    notes?: string;
  };
}

// ML placeholder types. In future, replace with a real model client (ONNX, TFJS, hosted model, etc.).
interface MlModel {
  predictTenantInsights: (input: TenantPreparedData) => Promise<Partial<TenantInsightOutput>>;
  predictUserRecommendations: (input: UserPreparedData) => Promise<Partial<UserRecommendationOutput>>;
}

// Central engine encapsulating RBAC, tenant isolation, feature flags, and auditing.
export class InsightsEngine {
  private static instance: InsightsEngine | null = null;

  private prisma: PrismaClient;
  private authorizationEngine: AuthorizationEngine;
  private serviceGuard: ServiceAuthorizationGuard;
  private featureFlags: FeatureFlagManager;
  private auditLogger: any;
  private analytics: AnalyticsEngine;

  // Placeholder for real ML model initialization.
  private mlModel: MlModel | null = null;

  private constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.authorizationEngine = new AuthorizationEngine(prisma);
    this.serviceGuard = new ServiceAuthorizationGuard(this.authorizationEngine);
    this.featureFlags = FeatureFlagManager.getInstance(prisma);
    this.auditLogger = getImmutableAuditLogger(prisma);
    this.analytics = AnalyticsEngine.getInstance();

    // Placeholder ML initialization hook.
    // In production: load model weights, verify signatures, pin versions, and sandbox execution.
    this.mlModel = null;
  }

  static getInstance(prisma?: PrismaClient): InsightsEngine {
    if (!InsightsEngine.instance) {
      if (!prisma) {
        throw new Error('PRISMA_REQUIRED');
      }
      InsightsEngine.instance = new InsightsEngine(prisma);
    }
    return InsightsEngine.instance;
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
      // Tenant-safe error: do not disclose granular RBAC reasons to callers by default.
      throw new Error('PERMISSION_DENIED');
    }
  }

  private sanitizeError(err: unknown): Error {
    const e = err as Error;
    const msg = (e?.message || 'INTERNAL_ERROR').toUpperCase();

    // Explicit allowlist of safe, non-leaky error codes.
    const safeCodes = new Set([
      'TENANT_CONTEXT_REQUIRED',
      'PERMISSION_DENIED',
      'FEATURE_NOT_ENABLED',
      'TENANT_ISOLATION_VIOLATION',
      'INTERNAL_ERROR'
    ]);

    if (safeCodes.has(msg)) return new Error(msg);
    return new Error('INTERNAL_ERROR');
  }
}

// === CHUNK 2: Data Preprocessing Functions ===

export interface TenantPreparedData {
  tenantId: string;
  windowDays: number;
  generatedAt: Date;

  // Activity
  queryCount: number;
  failedQueryCount: number;
  cancelledQueryCount: number;
  realtimeQueryCount: number;
  batchQueryCount: number;

  // Assets
  dashboardsCount: number;
  metricsCount: number;
  alertsCount: number;
  enabledAlertsCount: number;

  // Deterministic aggregates
  errorRate: number; // 0..1
  activityScore: number; // 0..100
  adoptionScore: number; // 0..100
}

export interface UserPreparedData {
  userId: string;
  tenantId: string;
  windowDays: number;
  generatedAt: Date;

  // Heuristic usage stats (deterministic)
  recentQueryCount: number;
  recentDashboardViews: number;
  recentExports: number;

  // Derived
  engagementScore: number; // 0..100
}

// Deterministic helper to avoid random output differences.
const clamp = (n: number, min: number, max: number): number => Math.max(min, Math.min(max, n));

const safeNumber = (n: unknown, fallback = 0): number => {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : fallback;
  return v;
};

const stableId = (parts: string[]): string => {
  // Deterministic ID derived from content; safe for cross-process consistency.
  return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 24);
};

/**
 * Tenant-scoped data preparation (normalization, filtering, aggregation).
 * - Enforces tenant isolation by filtering by `tenantId`.
 * - Ensures deterministic results by avoiding randomness and applying stable defaulting.
 */
export async function prepareTenantData(tenantId: string): Promise<TenantPreparedData> {
  const tenantContext = getTenantContextOrThrow();

  // Hard tenant isolation: the caller must not request other tenants.
  if (tenantContext.tenantId !== tenantId) {
    throw new Error('TENANT_ISOLATION_VIOLATION');
  }

  const analytics = AnalyticsEngine.getInstance();

  // Pull tenant-scoped artifacts from the analytics engine.
  // NOTE: analytics engine methods require `userId` to enforce their own checks.
  const actorId = (tenantContext as any).user?.id || 'system';

  const [queries, dashboards, metrics, alerts] = await Promise.all([
    analytics.getQueries(tenantId, actorId).catch(() => [] as AnalyticsQuery[]),
    analytics.getDashboards(tenantId, actorId).catch(() => [] as AnalyticsDashboard[]),
    analytics.getMetrics(tenantId, actorId).catch(() => [] as AnalyticsMetric[]),
    analytics.getAlerts(tenantId, actorId).catch(() => [] as AnalyticsAlert[])
  ]);

  // Normalize counts with deterministic defaults.
  const queryCount = queries.length;
  const failedQueryCount = queries.filter(q => q.status === 'failed').length;
  const cancelledQueryCount = queries.filter(q => q.status === 'cancelled').length;
  const realtimeQueryCount = queries.filter(q => q.type === 'realtime').length;
  const batchQueryCount = queries.filter(q => q.type === 'batch').length;

  const dashboardsCount = dashboards.length;
  const metricsCount = metrics.filter(m => m.enabled).length;
  const alertsCount = alerts.length;
  const enabledAlertsCount = alerts.filter(a => a.enabled).length;

  const errorRate = queryCount > 0 ? clamp(failedQueryCount / queryCount, 0, 1) : 0;

  // Deterministic scoring:
  // - activityScore emphasizes query volume + realtime usage
  // - adoptionScore emphasizes configured metrics/dashboards/alerts
  const activityScore = clamp(
    Math.round(
      safeNumber(queryCount) * 2 +
        safeNumber(realtimeQueryCount) * 3 -
        safeNumber(failedQueryCount) * 4 -
        safeNumber(cancelledQueryCount) * 1
    ),
    0,
    100
  );

  const adoptionScore = clamp(
    Math.round(
      safeNumber(dashboardsCount) * 10 + safeNumber(metricsCount) * 6 + safeNumber(enabledAlertsCount) * 4
    ),
    0,
    100
  );

  return {
    tenantId,
    windowDays: 30,
    generatedAt: new Date(),

    queryCount,
    failedQueryCount,
    cancelledQueryCount,
    realtimeQueryCount,
    batchQueryCount,

    dashboardsCount,
    metricsCount,
    alertsCount,
    enabledAlertsCount,

    errorRate,
    activityScore,
    adoptionScore
  };
}

export async function prepareUserData(userId: string): Promise<UserPreparedData> {
  const tenantContext = getTenantContextOrThrow();
  const tenantId = tenantContext.tenantId;

  // Deterministic placeholders until we wire real user activity telemetry.
  // In production: read tenant-scoped activity events, exports, session events, etc.
  const recentQueryCount = 0;
  const recentDashboardViews = 0;
  const recentExports = 0;

  const engagementScore = clamp(
    Math.round(recentQueryCount * 10 + recentDashboardViews * 5 + recentExports * 2),
    0,
    100
  );

  return {
    userId,
    tenantId,
    windowDays: 30,
    generatedAt: new Date(),
    recentQueryCount,
    recentDashboardViews,
    recentExports,
    engagementScore
  };
}

// === CHUNK 3: Recommendation Logic ===

export async function calculateTenantInsights(data: TenantPreparedData): Promise<TenantInsightOutput> {
  // Deterministic fallback rules:
  // - churnRiskScore rises when activity is low or errors are high
  // - adoptionScore uses precomputed deterministic adoption score
  const churnRiskScore = clamp(
    Math.round((100 - data.activityScore) * 0.7 + data.errorRate * 100 * 0.3),
    0,
    100
  );

  const kpis = {
    activityScore: data.activityScore,
    churnRiskScore,
    adoptionScore: data.adoptionScore
  };

  const insights: TenantInsightOutput['insights'] = [];

  // Usage insight
  if (data.activityScore < 25) {
    insights.push({
      id: stableId([data.tenantId, 'USAGE', 'LOW_ACTIVITY']),
      type: 'USAGE',
      severity: 'HIGH',
      title: 'Low analytics activity detected',
      description: 'Usage of analytics features is low. Consider onboarding flows and scheduled reporting.',
      confidence: 0.85,
      actions: [
        'Enable scheduled reports for executive dashboards',
        'Create 1-2 core KPIs and pin them to a dashboard',
        'Run a weekly review cadence for top metrics'
      ],
      evidence: {
        activityScore: data.activityScore,
        queryCount: data.queryCount,
        dashboardsCount: data.dashboardsCount
      }
    });
  }

  // Churn risk
  if (churnRiskScore >= 70) {
    insights.push({
      id: stableId([data.tenantId, 'CHURN_RISK', 'ELEVATED']),
      type: 'CHURN_RISK',
      severity: 'CRITICAL',
      title: 'Elevated churn risk signals',
      description:
        'Tenant engagement is trending low and/or operational errors are elevated. Focus on stability and adoption.',
      confidence: 0.75,
      actions: ['Investigate failed analytics queries', 'Improve onboarding to dashboards', 'Enable alerts for key KPIs'],
      evidence: {
        churnRiskScore,
        errorRate: data.errorRate,
        failedQueryCount: data.failedQueryCount
      }
    });
  }

  // Feature adoption
  if (data.adoptionScore < 30) {
    insights.push({
      id: stableId([data.tenantId, 'FEATURE_ADOPTION', 'LOW']),
      type: 'FEATURE_ADOPTION',
      severity: 'MEDIUM',
      title: 'Low feature adoption',
      description:
        'Few dashboards/metrics/alerts are configured. Better adoption typically improves operational outcomes and retention.',
      confidence: 0.8,
      actions: ['Create an executive dashboard', 'Add KPI thresholds', 'Enable alerting for anomalies'],
      evidence: {
        adoptionScore: data.adoptionScore,
        metricsCount: data.metricsCount,
        dashboardsCount: data.dashboardsCount,
        enabledAlertsCount: data.enabledAlertsCount
      }
    });
  }

  // Operations
  if (data.errorRate >= 0.2) {
    insights.push({
      id: stableId([data.tenantId, 'OPERATIONS', 'ERROR_RATE']),
      type: 'OPERATIONS',
      severity: data.errorRate >= 0.5 ? 'HIGH' : 'MEDIUM',
      title: 'Analytics error rate is elevated',
      description: 'A noticeable share of queries are failing. This can reduce trust and adoption of insights.',
      confidence: 0.8,
      actions: ['Review data ingestion health', 'Validate data sources and schemas', 'Add retries/backoff for batch jobs'],
      evidence: {
        errorRate: data.errorRate,
        failedQueryCount: data.failedQueryCount,
        queryCount: data.queryCount
      }
    });
  }

  return {
    tenantId: data.tenantId,
    generatedAt: data.generatedAt,
    windowDays: data.windowDays,
    kpis,
    insights,
    model: {
      provider: 'DETERMINISTIC',
      version: 'v1',
      notes: 'Deterministic fallback rules; replace with ML model inference later.'
    }
  };
}

export async function calculateUserRecommendations(data: UserPreparedData): Promise<UserRecommendationOutput> {
  // Deterministic recommendations until real telemetry is integrated.
  const recommendations: UserRecommendationOutput['recommendations'] = [];

  if (data.engagementScore < 20) {
    recommendations.push({
      id: stableId([data.tenantId, data.userId, 'ONBOARDING', 'GET_STARTED']),
      category: 'ONBOARDING',
      title: 'Get started with dashboards',
      description: 'Pin 3 key KPIs to a dashboard to monitor performance at a glance.',
      confidence: 0.85,
      priority: 'HIGH',
      callToAction: 'Create or open your first dashboard',
      rationale: {
        engagementScore: data.engagementScore,
        recentDashboardViews: data.recentDashboardViews
      }
    });
  }

  recommendations.push({
    id: stableId([data.tenantId, data.userId, 'FEATURE', 'ALERTS']),
    category: 'FEATURE',
    title: 'Enable KPI alerts',
    description: 'Set thresholds and notifications to catch issues early without manual monitoring.',
    confidence: 0.7,
    priority: 'MEDIUM',
    callToAction: 'Configure an alert for one KPI',
    rationale: {
      tenantId: data.tenantId
    }
  });

  return {
    userId: data.userId,
    tenantId: data.tenantId,
    generatedAt: data.generatedAt,
    recommendations,
    model: {
      provider: 'DETERMINISTIC',
      version: 'v1',
      notes: 'Deterministic fallback rules; will incorporate ML personalization later.'
    }
  };
}

// === CHUNK 4: Exported API Functions ===

let globalPrisma: PrismaClient | null = null;

/**
 * Initialize the Insights Engine singleton.
 * Call once at server startup (same place you initialize Prisma).
 */
export const initializeInsightsEngine = (prisma: PrismaClient): void => {
  globalPrisma = prisma;
  InsightsEngine.getInstance(prisma);
};

/**
 * async getTenantInsights(tenantId: string) → returns tenant-wide insights.
 * - Enforces tenant isolation (requested tenant must match request tenant context)
 * - Enforces RBAC (requires `reports:read` by default; adjust to your permission taxonomy if needed)
 * - Enforces feature flag gating
 */
export async function getTenantInsights(tenantId: string): Promise<TenantInsightOutput> {
  const tenantContext = getTenantContextOrThrow();
  const requestId = (tenantContext as any).requestId || 'unknown';
  const actorId = (tenantContext as any).user?.id || 'system';

  if (!globalPrisma) {
    throw new Error('INTERNAL_ERROR');
  }

  const engine = InsightsEngine.getInstance(globalPrisma);

  try {
    // Tenant isolation hard check.
    if (tenantContext.tenantId !== tenantId) {
      throw new Error('TENANT_ISOLATION_VIOLATION');
    }

    // Feature gating (adjust flag name as needed).
    await engine['featureFlags'].requireFeatureFlag(
      'ANALYTICS_INSIGHTS_ENGINE',
      tenantContext,
      'FEATURE_NOT_ENABLED'
    );

    // RBAC enforcement.
    await engine['requirePermission'](tenantContext, 'reports:read', 'get_tenant_insights', requestId, {
      type: 'TENANT',
      id: tenantId,
      tenantId
    });

    // Prepare data and compute insights (deterministic baseline).
    const prepared = await prepareTenantData(tenantId);

    // ML placeholder: if ML model exists later, merge outputs.
    const base = await calculateTenantInsights(prepared);

    return base;
  } catch (err) {
    // Audit denied/failure is logged in CHUNK 5 hooks; here we only sanitize outward error.
    throw engine['sanitizeError'](err);
  } finally {
    // Always audit the access attempt in CHUNK 5 hook wrapper.
    // (Implemented below as shared audit helper.)
    await auditInsightsRead({
      prisma: globalPrisma,
      tenantId: tenantContext.tenantId,
      actorId,
      requestId,
      kind: 'TENANT_INSIGHTS',
      subjectId: tenantId
    }).catch(() => undefined);
  }
}

/**
 * async getUserRecommendations(userId: string) → returns personalized recommendations.
 * - Uses the current tenant context for isolation
 * - Enforces RBAC (requires `reports:read` by default; change to a more specific permission if desired)
 * - Enforces feature flag gating
 */
export async function getUserRecommendations(userId: string): Promise<UserRecommendationOutput> {
  const tenantContext = getTenantContextOrThrow();
  const requestId = (tenantContext as any).requestId || 'unknown';
  const actorId = (tenantContext as any).user?.id || 'system';

  if (!globalPrisma) {
    throw new Error('INTERNAL_ERROR');
  }

  const engine = InsightsEngine.getInstance(globalPrisma);

  try {
    await engine['featureFlags'].requireFeatureFlag(
      'ANALYTICS_INSIGHTS_ENGINE',
      tenantContext,
      'FEATURE_NOT_ENABLED'
    );

    // RBAC enforcement: user recommendations can be sensitive. Adjust permission model as needed.
    await engine['requirePermission'](tenantContext, 'reports:read', 'get_user_recommendations', requestId, {
      type: 'USER',
      id: userId,
      tenantId: tenantContext.tenantId
    });

    const prepared = await prepareUserData(userId);

    const base = await calculateUserRecommendations(prepared);

    // Hard isolation guarantee (defensive).
    if (base.tenantId !== tenantContext.tenantId) {
      throw new Error('TENANT_ISOLATION_VIOLATION');
    }

    return base;
  } catch (err) {
    throw engine['sanitizeError'](err);
  } finally {
    await auditInsightsRead({
      prisma: globalPrisma,
      tenantId: tenantContext.tenantId,
      actorId,
      requestId,
      kind: 'USER_RECOMMENDATIONS',
      subjectId: userId
    }).catch(() => undefined);
  }
}

// === CHUNK 5: Audit & Logging Hooks ===

interface AuditReadInput {
  prisma: PrismaClient;
  tenantId: string;
  actorId: string;
  requestId: string;
  kind: 'TENANT_INSIGHTS' | 'USER_RECOMMENDATIONS';
  subjectId: string;
}

/**
 * Integrate audit logging for every output.
 * Records who/what/when/why (where "why" is the operation intent and correlation IDs).
 * Includes a cryptographic hash placeholder for output integrity correlation.
 */
async function auditInsightsRead(input: AuditReadInput): Promise<void> {
  const auditLogger = getImmutableAuditLogger(input.prisma);

  // Placeholder: hash of the access event (not the full response payload).
  // In production, you can also hash the actual output (with tenant-safe redaction)
  // and include it here for end-to-end attestations.
  const integrityHash = createHash('sha256')
    .update([input.kind, input.tenantId, input.subjectId, input.actorId, input.requestId].join('|'))
    .digest('hex');

  // Use authorization decision audit event for read-only operations.
  auditLogger.logAuthorizationDecision({
    tenantId: input.tenantId,
    actorId: input.actorId,
    action: input.kind,
    resourceType: 'INSIGHTS_ENGINE',
    resourceId: input.subjectId,
    outcome: 'SUCCESS',
    correlationId: input.requestId || `insights_${Date.now()}`,
    metadata: {
      who: input.actorId,
      what: input.kind,
      when: new Date().toISOString(),
      why: 'Analytics insights/recommendations requested',
      requestId: input.requestId,
      // Cryptographic placeholder for immutable system integration
      integrityHash
    }
  });

  logger.info('Insights read audited', {
    tenantId: input.tenantId,
    actorId: input.actorId,
    kind: input.kind,
    subjectId: input.subjectId,
    requestId: input.requestId
  });
}