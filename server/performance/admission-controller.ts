import type { PrismaClient } from '@prisma/client';
import type { Request, Response, NextFunction, RequestHandler } from 'express';

import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { isKillSwitchEnabled } from '../ops/kill-switch.js';
import { runReadinessGates } from '../ops/readiness-gates.js';
import { adaptiveRateLimiter } from '../resilience/rate-limiter.js';
import { logger } from '../utils/structured-logger.js';

import { classifyRequestPriority } from './request-priority.js';
import { concurrencyLimiter, ConcurrencyLimitExceededError } from './concurrency-limiter.js';
import { loadShedder, type AdmissionDecision } from './load-shedder.js';

export interface AdmissionContext {
  prisma: PrismaClient;
  requestId: string;
  req: Request;
  tenantContext?: any;
  userId?: string;
}

export interface AdmissionResult {
  decision: AdmissionDecision;
  reason?: string;
  retryAfterMs?: number;
  releaseConcurrency?: () => void;
}

function isDeterministic(): boolean {
  return process.env.DETERMINISTIC_TEST_IDS === 'true';
}

function safeCorrelationId(prefix: string, requestId: string, tenantId?: string): string {
  if (isDeterministic()) {
    return `${prefix}_${tenantId || 'system'}_${requestId}`;
  }
  return requestId || `${prefix}_${Date.now()}`;
}

export class AdmissionController {
  private getAudit() {
    return getImmutableAuditLogger();
  }

  async evaluate(ctx: AdmissionContext, options: { holdConcurrency?: boolean } = {}): Promise<AdmissionResult> {
    const priority = classifyRequestPriority({ method: ctx.req.method, path: ctx.req.path });
    const tenantId = ctx.tenantContext?.tenantId as string | undefined;
    const actorId = ctx.userId || ctx.tenantContext?.user?.id || 'system';

    // 1) readiness
    const readiness = await runReadinessGates(ctx.prisma);
    if (readiness.status !== 'ready' && priority !== 'CRITICAL') {
      const correlationId = safeCorrelationId('admission_readiness', ctx.requestId, tenantId);
      this.getAudit().logSecurityEvent({
        tenantId: tenantId || 'system',
        actorId,
        action: 'ADMISSION_REJECT_READINESS',
        resourceType: 'ADMISSION_CONTROLLER',
        resourceId: ctx.req.path,
        outcome: 'DENIED',
        correlationId,
        severity: 'HIGH',
        metadata: {
          priority,
          readiness,
        },
      });
      return { decision: 'REJECT', reason: 'not_ready' };
    }

    // 2) kill switch
    if (isKillSwitchEnabled('GLOBAL_WRITE') && ctx.req.method !== 'GET') {
      const correlationId = safeCorrelationId('admission_killswitch', ctx.requestId, tenantId);
      this.getAudit().logSecurityEvent({
        tenantId: tenantId || 'system',
        actorId,
        action: 'ADMISSION_REJECT_KILL_SWITCH',
        resourceType: 'ADMISSION_CONTROLLER',
        resourceId: ctx.req.path,
        outcome: 'DENIED',
        correlationId,
        severity: 'HIGH',
        metadata: {
          killSwitch: 'GLOBAL_WRITE',
          method: ctx.req.method,
          priority,
        },
      });
      return { decision: 'REJECT', reason: 'kill_switch' };
    }

    // 3) concurrency
    if (!tenantId) {
      // Fail closed: if we cannot identify tenant, do not admit non-critical traffic.
      if (priority !== 'CRITICAL') {
        const correlationId = safeCorrelationId('admission_tenant_missing', ctx.requestId, tenantId);
        this.getAudit().logSecurityEvent({
          tenantId: 'system',
          actorId,
          action: 'ADMISSION_REJECT_MISSING_TENANT',
          resourceType: 'ADMISSION_CONTROLLER',
          resourceId: ctx.req.path,
          outcome: 'DENIED',
          correlationId,
          severity: 'HIGH',
          metadata: {
            priority,
          },
        });
        return { decision: 'REJECT', reason: 'missing_tenant' };
      }
    } else {
      let releaseConcurrency: (() => void) | undefined;
      try {
        const acquireCtx = {
          tenantContext: ctx.tenantContext,
          userId: actorId,
          requestId: ctx.requestId,
          priority,
          resourceName: `http:${ctx.req.method}:${ctx.req.path}`,
          metadata: {
            ip: ctx.req.ip,
          },
        };

        if (options.holdConcurrency) {
          releaseConcurrency = await concurrencyLimiter.acquire(acquireCtx);
        } else {
          const release = await concurrencyLimiter.acquire(acquireCtx);
          release();
        }
      } catch (error) {
        if (error instanceof ConcurrencyLimitExceededError) {
          return { decision: 'DEFER', reason: 'concurrency', retryAfterMs: 100 };
        }
        throw error;
      }

      // If we held the permit, carry it forward.
      if (releaseConcurrency) {
        // NOTE: not releasing here; middleware will attach to response lifecycle.
        // If any later stage rejects, we must release before returning.

        // 4) load shedding
        const shedHeld = loadShedder.decide({
          tenantContext: ctx.tenantContext,
          actorId,
          requestId: ctx.requestId,
          priority,
          endpoint: ctx.req.path,
          readinessStatus: readiness.status,
          metadata: {
            method: ctx.req.method,
          },
        });

        if (shedHeld.decision !== 'ALLOW') {
          releaseConcurrency();
          return shedHeld;
        }

        // 5) rate limiting (adaptive)
        try {
          const key = tenantId ? `TENANT:${tenantId}:${ctx.req.path}` : `IP:${ctx.req.ip}:${ctx.req.path}`;
          const rl = await adaptiveRateLimiter.checkRateLimit(
            key,
            tenantId ? 'TENANT' : 'IP',
            ctx.tenantContext,
            actorId,
            ctx.req.ip,
            ctx.req.path
          );

          if (!rl.allowed) {
            const correlationId = safeCorrelationId('admission_rate_limit', ctx.requestId, tenantId);
            this.getAudit().logSecurityEvent({
              tenantId: tenantId || 'system',
              actorId,
              action: 'ADMISSION_REJECT_RATE_LIMIT',
              resourceType: 'ADMISSION_CONTROLLER',
              resourceId: ctx.req.path,
              outcome: 'DENIED',
              correlationId,
              severity: 'MEDIUM',
              metadata: {
                priority,
                scope: tenantId ? 'TENANT' : 'IP',
                retryAfter: rl.retryAfter,
                limit: rl.limit,
                windowMs: rl.windowMs,
              },
            });

            releaseConcurrency();
            return { decision: 'REJECT', reason: 'rate_limit', retryAfterMs: Math.max(0, rl.retryAfter * 1000) };
          }
        } catch (error) {
          if (priority !== 'CRITICAL') {
            const correlationId = safeCorrelationId('admission_rate_limit_error', ctx.requestId, tenantId);
            this.getAudit().logSecurityEvent({
              tenantId: tenantId || 'system',
              actorId,
              action: 'ADMISSION_REJECT_RATE_LIMIT_ERROR',
              resourceType: 'ADMISSION_CONTROLLER',
              resourceId: ctx.req.path,
              outcome: 'DENIED',
              correlationId,
              severity: 'HIGH',
              metadata: {
                priority,
                error: error instanceof Error ? error.message : String(error),
              },
            });

            releaseConcurrency();
            return { decision: 'REJECT', reason: 'rate_limiter_unhealthy' };
          }

          logger.error('Rate limiter error during admission', error as Error);
        }

        return { decision: 'ALLOW', releaseConcurrency };
      }
    }

    // 4) load shedding
    const shed = loadShedder.decide({
      tenantContext: ctx.tenantContext,
      actorId,
      requestId: ctx.requestId,
      priority,
      endpoint: ctx.req.path,
      readinessStatus: readiness.status,
      metadata: {
        method: ctx.req.method,
      },
    });

    if (shed.decision !== 'ALLOW') {
      return shed;
    }

    // 5) rate limiting (adaptive)
    try {
      const key = tenantId ? `TENANT:${tenantId}:${ctx.req.path}` : `IP:${ctx.req.ip}:${ctx.req.path}`;
      const rl = await adaptiveRateLimiter.checkRateLimit(
        key,
        tenantId ? 'TENANT' : 'IP',
        ctx.tenantContext,
        actorId,
        ctx.req.ip,
        ctx.req.path
      );

      if (!rl.allowed) {
        const correlationId = safeCorrelationId('admission_rate_limit', ctx.requestId, tenantId);
        this.getAudit().logSecurityEvent({
          tenantId: tenantId || 'system',
          actorId,
          action: 'ADMISSION_REJECT_RATE_LIMIT',
          resourceType: 'ADMISSION_CONTROLLER',
          resourceId: ctx.req.path,
          outcome: 'DENIED',
          correlationId,
          severity: 'MEDIUM',
          metadata: {
            priority,
            scope: tenantId ? 'TENANT' : 'IP',
            retryAfter: rl.retryAfter,
            limit: rl.limit,
            windowMs: rl.windowMs,
          },
        });
        return { decision: 'REJECT', reason: 'rate_limit', retryAfterMs: Math.max(0, rl.retryAfter * 1000) };
      }
    } catch (error) {
      // Fail closed for admission: if rate limiter is unavailable, shed non-critical.
      if (priority !== 'CRITICAL') {
        const correlationId = safeCorrelationId('admission_rate_limit_error', ctx.requestId, tenantId);
        this.getAudit().logSecurityEvent({
          tenantId: tenantId || 'system',
          actorId,
          action: 'ADMISSION_REJECT_RATE_LIMIT_ERROR',
          resourceType: 'ADMISSION_CONTROLLER',
          resourceId: ctx.req.path,
          outcome: 'DENIED',
          correlationId,
          severity: 'HIGH',
          metadata: {
            priority,
            error: error instanceof Error ? error.message : String(error),
          },
        });
        return { decision: 'REJECT', reason: 'rate_limiter_unhealthy' };
      }

      logger.error('Rate limiter error during admission', error as Error);
    }

    return { decision: 'ALLOW' };
  }

  middleware(prisma: PrismaClient): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
      const tenantContext = (req as any).tenantContext;
      const userId = (req as any).user?.id as string | undefined;
      const requestId = (req.headers['x-request-id'] as string) || (req.headers['x-correlation-id'] as string) || 'req';

      const result = await this.evaluate({ prisma, requestId, req, tenantContext, userId }, { holdConcurrency: true });

      if (result.decision === 'ALLOW') {
        if (result.releaseConcurrency) {
          let released = false;
          const releaseOnce = () => {
            if (released) {
              return;
            }
            released = true;
            try {
              result.releaseConcurrency?.();
            } catch {
              // no-op
            }
          };

          res.once('finish', releaseOnce);
          res.once('close', releaseOnce);
        }
        next();
        return;
      }

      if (result.retryAfterMs && result.retryAfterMs > 0) {
        res.setHeader('Retry-After', Math.ceil(result.retryAfterMs / 1000).toString());
      }

      res.status(result.decision === 'DEFER' ? 503 : 429).json({
        error: result.decision === 'DEFER' ? 'Service Unavailable' : 'Too Many Requests',
        code: `ADMISSION_${result.decision}`,
        reason: result.reason,
      });
    };
  }
}

export const admissionController = new AdmissionController();
