import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import type { TenantContext } from '../tenant/tenant-isolation.js';
import { getSystemState } from '../resilience/degradation-modes.js';

import { getCapacityConfig, getTenantPriorityTier } from './capacity-config.js';
import type { RequestPriority } from './request-priority.js';

export type AdmissionDecision = 'ALLOW' | 'REJECT' | 'DEFER';

export interface LoadShedRequest {
  tenantContext?: TenantContext;
  actorId?: string;
  requestId: string;
  priority: RequestPriority;
  endpoint: string;
  readinessStatus: 'ready' | 'not_ready';
  sloStatus?: 'PASS' | 'WARN' | 'FAIL';
  metadata?: Record<string, any>;
}

export interface LoadShedResult {
  decision: AdmissionDecision;
  reason?: string;
  retryAfterMs?: number;
}

function isDeterministic(): boolean {
  return process.env.DETERMINISTIC_TEST_IDS === 'true';
}

function safeCorrelationId(req: LoadShedRequest): string {
  if (isDeterministic()) {
    const tenantId = req.tenantContext?.tenantId || 'system';
    return `load_shed_${tenantId}_${req.priority}_${req.endpoint}`;
  }
  return req.requestId || `load_shed_${Date.now()}`;
}

function isNonCritical(priority: RequestPriority): boolean {
  return priority === 'LOW' || priority === 'BACKGROUND';
}

export class LoadShedder {
  private getAudit() {
    return getImmutableAuditLogger();
  }

  decide(req: LoadShedRequest): LoadShedResult {
    const cfg = getCapacityConfig();
    if (!cfg.shedding.enabled) {
      return { decision: 'ALLOW' };
    }

    const tenantId = req.tenantContext?.tenantId || 'system';
    const tier = getTenantPriorityTier(req.tenantContext);
    const degradation = getSystemState().overallLevel;
    const correlationId = safeCorrelationId(req);

    // Hard fail-closed when not ready: allow only CRITICAL
    if (req.readinessStatus !== 'ready' && req.priority !== 'CRITICAL') {
      this.getAudit().logSecurityEvent({
        tenantId,
        actorId: req.actorId || 'system',
        action: 'LOAD_SHED_NOT_READY',
        resourceType: 'LOAD_SHEDDER',
        resourceId: req.endpoint,
        outcome: 'DENIED',
        correlationId,
        severity: 'HIGH',
        metadata: {
          priority: req.priority,
          readiness: req.readinessStatus,
          tier,
          degradation,
          ...(req.metadata || {}),
        },
      });
      return { decision: 'REJECT', reason: 'not_ready' };
    }

    // Emergency degradation: only CRITICAL/HIGH for Enterprise/Pro, others deferred.
    if (degradation === 'EMERGENCY') {
      const allowed = req.priority === 'CRITICAL' || (req.priority === 'HIGH' && (tier === 'ENTERPRISE' || tier === 'PRO'));
      const decision: AdmissionDecision = allowed ? 'ALLOW' : 'DEFER';
      if (!allowed) {
        this.getAudit().logSecurityEvent({
          tenantId,
          actorId: req.actorId || 'system',
          action: 'LOAD_SHED_EMERGENCY',
          resourceType: 'LOAD_SHEDDER',
          resourceId: req.endpoint,
          outcome: 'DENIED',
          correlationId,
          severity: 'CRITICAL',
          metadata: {
            priority: req.priority,
            tier,
            degradation,
            ...(req.metadata || {}),
          },
        });
      }
      return allowed ? { decision: 'ALLOW' } : { decision: 'DEFER', reason: 'emergency_mode', retryAfterMs: 250 };
    }

    // SLO burn (simplified: FAIL => shed non-critical first)
    if (req.sloStatus === 'FAIL' && isNonCritical(req.priority)) {
      this.getAudit().logSecurityEvent({
        tenantId,
        actorId: req.actorId || 'system',
        action: 'LOAD_SHED_SLO_FAIL',
        resourceType: 'LOAD_SHEDDER',
        resourceId: req.endpoint,
        outcome: 'DENIED',
        correlationId,
        severity: 'HIGH',
        metadata: {
          priority: req.priority,
          tier,
          sloStatus: req.sloStatus,
          degradation,
          ...(req.metadata || {}),
        },
      });
      return { decision: 'REJECT', reason: 'slo_fail' };
    }

    // Conservative policy: shed BACKGROUND during WARN
    if (cfg.shedding.defaultPolicy === 'CONSERVATIVE' && req.sloStatus === 'WARN' && req.priority === 'BACKGROUND') {
      this.getAudit().logSecurityEvent({
        tenantId,
        actorId: req.actorId || 'system',
        action: 'LOAD_SHED_SLO_WARN',
        resourceType: 'LOAD_SHEDDER',
        resourceId: req.endpoint,
        outcome: 'DENIED',
        correlationId,
        severity: 'MEDIUM',
        metadata: {
          priority: req.priority,
          tier,
          sloStatus: req.sloStatus,
          degradation,
          ...(req.metadata || {}),
        },
      });
      return { decision: 'DEFER', reason: 'slo_warn', retryAfterMs: 100 };
    }

    return { decision: 'ALLOW' };
  }
}

export const loadShedder = new LoadShedder();
