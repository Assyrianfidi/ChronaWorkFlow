import type { Request, Response, NextFunction } from 'express';

import { logger } from '../utils/structured-logger.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { adaptiveRateLimiter, type RateLimitConfig, type RateLimitScope } from '../resilience/rate-limiter.js';
import type { TenantContext } from '../tenant/tenant-isolation.js';

export type AbuseTier = 'NORMAL' | 'WARN' | 'THROTTLE' | 'BLOCK';
export type AbusePattern = 'AUTH_SPAM' | 'REQUEST_BURST' | 'SCRAPING';

export interface AbuseProtectionConfig {
  requireTenantContext: boolean;
  authSpam: {
    windowMs: number;
    maxFailedAttempts: number;
    blockDurationMs: number;
  };
  requestBurst: {
    windowMs: number;
    maxRequests: number;
    throttleDurationMs: number;
  };
  scraping: {
    windowMs: number;
    maxUniquePaths: number;
    blockDurationMs: number;
  };
  tierCooldownMs: number;
  throttleRateLimitConfig: RateLimitConfig;
}

export interface AbuseDecision {
  allowed: boolean;
  tier: AbuseTier;
  reason?: string;
  pattern?: AbusePattern;
  retryAfterMs?: number;
  blockUntil?: Date;
  throttleUntil?: Date;
}

interface SlidingWindowCounter {
  timestamps: number[];
}

interface ScrapeWindow {
  timestampsByPath: Map<string, number>;
}

interface AbuseState {
  tier: AbuseTier;
  tierSince: number;
  lastSeenAt: number;
  lastEscalationAt: number;
  blockUntil?: number;
  throttleUntil?: number;
  authFailures: SlidingWindowCounter;
  requests: SlidingWindowCounter;
  scraping: ScrapeWindow;
}

const DEFAULT_CONFIG: AbuseProtectionConfig = {
  requireTenantContext: false,
  authSpam: {
    windowMs: 5 * 60_000,
    maxFailedAttempts: 20,
    blockDurationMs: 30 * 60_000,
  },
  requestBurst: {
    windowMs: 2_000,
    maxRequests: 60,
    throttleDurationMs: 60_000,
  },
  scraping: {
    windowMs: 60_000,
    maxUniquePaths: 40,
    blockDurationMs: 10 * 60_000,
  },
  tierCooldownMs: 10 * 60_000,
  throttleRateLimitConfig: {
    strategy: 'TOKEN_BUCKET',
    scope: 'IP',
    windowMs: 1_000,
    maxRequests: 10,
    adaptiveMultiplier: 0.5,
    burstCapacity: 5,
    refillRate: 2,
    penaltyMultiplier: 2,
    recoveryRate: 1.1,
  },
};

function isDeterministic(): boolean {
  return process.env.DETERMINISTIC_TEST_IDS === 'true';
}

function nowMs(): number {
  return Date.now();
}

function safeCorrelationId(prefix: string, subjectKey: string): string {
  if (isDeterministic()) {
    return `${prefix}_${subjectKey}`;
  }
  return `${prefix}_${subjectKey}_${Date.now()}`;
}

function normalizePath(rawPath: string): string {
  // Deterministic normalization to reduce path uniqueness for scraping heuristics.
  return rawPath
    .replace(/[0-9a-f]{8,}/gi, ':id')
    .replace(/\d+/g, ':n');
}

function extractTenantContext(req: any): TenantContext | undefined {
  return req?.tenantContext as TenantContext | undefined;
}

function extractUserId(req: any): string | undefined {
  return req?.user?.id as string | undefined;
}

function extractIp(req: any): string {
  return (req?.ip || req?.connection?.remoteAddress || 'unknown') as string;
}

function isAuthEndpoint(req: Request): boolean {
  const p = req.path.toLowerCase();
  return p.includes('/auth') || p.includes('/login') || p.includes('/signin') || p.includes('/token');
}

function trimWindow(counter: SlidingWindowCounter, windowMs: number, now: number): void {
  const cutoff = now - windowMs;
  while (counter.timestamps.length > 0 && counter.timestamps[0] < cutoff) {
    counter.timestamps.shift();
  }
}

function trimScrapeWindow(window: ScrapeWindow, windowMs: number, now: number): void {
  const cutoff = now - windowMs;
  for (const [k, t] of window.timestampsByPath.entries()) {
    if (t < cutoff) {
      window.timestampsByPath.delete(k);
    }
  }
}

function nextTier(current: AbuseTier): AbuseTier {
  switch (current) {
    case 'NORMAL':
      return 'WARN';
    case 'WARN':
      return 'THROTTLE';
    case 'THROTTLE':
      return 'BLOCK';
    case 'BLOCK':
    default:
      return 'BLOCK';
  }
}

function shouldCooldown(state: AbuseState, config: AbuseProtectionConfig, now: number): boolean {
  if (state.tier === 'NORMAL') {
    return false;
  }

  return now - state.lastEscalationAt > config.tierCooldownMs;
}

export class AbuseProtectionEngine {
  private auditLogger: any;
  private states: Map<string, AbuseState> = new Map();
  private config: AbuseProtectionConfig;

  constructor(config: Partial<AbuseProtectionConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      authSpam: { ...DEFAULT_CONFIG.authSpam, ...(config.authSpam || {}) },
      requestBurst: { ...DEFAULT_CONFIG.requestBurst, ...(config.requestBurst || {}) },
      scraping: { ...DEFAULT_CONFIG.scraping, ...(config.scraping || {}) },
      throttleRateLimitConfig: {
        ...DEFAULT_CONFIG.throttleRateLimitConfig,
        ...(config.throttleRateLimitConfig || {}),
      },
    };

    this.auditLogger = getImmutableAuditLogger();
  }

  evaluateRequestStart(req: Request): void {
    const tenantContext = extractTenantContext(req);
    const userId = extractUserId(req);
    const ip = extractIp(req);

    const subjectKey = this.getSubjectKey(tenantContext, userId, ip);
    const state = this.getOrCreateState(subjectKey);

    const now = nowMs();
    state.lastSeenAt = now;

    state.requests.timestamps.push(now);
    trimWindow(state.requests, this.config.requestBurst.windowMs, now);

    const normalized = normalizePath(req.path);
    state.scraping.timestampsByPath.set(`${req.method}:${normalized}`, now);
    trimScrapeWindow(state.scraping, this.config.scraping.windowMs, now);

    this.states.set(subjectKey, state);
  }

  evaluateRequestEnd(req: Request, res: Response): AbuseDecision {
    const tenantContext = extractTenantContext(req);
    const userId = extractUserId(req);
    const ip = extractIp(req);

    if (this.config.requireTenantContext && !tenantContext) {
      return {
        allowed: false,
        tier: 'BLOCK',
        reason: 'Tenant context required for abuse protection',
        pattern: 'REQUEST_BURST'
      };
    }

    const subjectKey = this.getSubjectKey(tenantContext, userId, ip);
    const state = this.getOrCreateState(subjectKey);

    const now = nowMs();
    state.lastSeenAt = now;

    // Track auth failures (only for auth endpoints)
    if (isAuthEndpoint(req) && res.statusCode >= 400) {
      state.authFailures.timestamps.push(now);
      trimWindow(state.authFailures, this.config.authSpam.windowMs, now);
    } else {
      trimWindow(state.authFailures, this.config.authSpam.windowMs, now);
    }

    // Expire block/throttle if time passed
    if (state.tier === 'BLOCK' && state.blockUntil && now >= state.blockUntil) {
      const previousBlockUntil = state.blockUntil;
      state.blockUntil = undefined;
      state.tier = 'WARN';
      state.tierSince = now;

      this.auditLogger.logSecurityEvent({
        tenantId: tenantContext?.tenantId || 'system',
        actorId: userId || 'system',
        action: 'ABUSE_BLOCK_EXPIRED',
        resourceType: 'ABUSE_PROTECTION',
        resourceId: subjectKey,
        outcome: 'SUCCESS',
        correlationId: safeCorrelationId('abuse_block_expired', subjectKey),
        severity: 'MEDIUM',
        metadata: {
          subjectKey,
          previousBlockUntil: new Date(previousBlockUntil).toISOString(),
        },
        ipAddress: ip,
        userAgent: req.get('User-Agent') || undefined,
      });
    }

    if (state.tier === 'THROTTLE' && state.throttleUntil && now >= state.throttleUntil) {
      state.throttleUntil = undefined;
      state.tier = 'WARN';
      state.tierSince = now;
    }

    // Cooldown back to NORMAL if quiet
    if (shouldCooldown(state, this.config, now)) {
      state.tier = 'NORMAL';
      state.tierSince = now;
    }

    const trigger = this.detectPatterns(state, req);
    if (trigger) {
      this.escalate(subjectKey, state, trigger.pattern, trigger.reason, tenantContext, userId, ip, req);
    }

    const decision = this.enforce(subjectKey, state, tenantContext, userId, ip, req);
    this.states.set(subjectKey, state);
    return decision;
  }

  async enforcePreRequest(req: Request): Promise<AbuseDecision> {
    const tenantContext = extractTenantContext(req);
    const userId = extractUserId(req);
    const ip = extractIp(req);

    if (this.config.requireTenantContext && !tenantContext) {
      return {
        allowed: false,
        tier: 'BLOCK',
        reason: 'Tenant context required for abuse protection',
        pattern: 'REQUEST_BURST'
      };
    }

    const subjectKey = this.getSubjectKey(tenantContext, userId, ip);
    const state = this.getOrCreateState(subjectKey);
    const now = nowMs();

    // If blocked, fail-closed.
    if (state.tier === 'BLOCK' && state.blockUntil && now < state.blockUntil) {
      this.auditLogger.logSecurityEvent({
        tenantId: tenantContext?.tenantId || 'system',
        actorId: userId || 'system',
        action: 'ABUSE_ENFORCED',
        resourceType: 'ABUSE_PROTECTION',
        resourceId: subjectKey,
        outcome: 'FAILURE',
        correlationId: safeCorrelationId('abuse_block', subjectKey),
        severity: 'HIGH',
        metadata: {
          subjectKey,
          tier: 'BLOCK',
          blockUntil: new Date(state.blockUntil).toISOString(),
          path: req.path,
          method: req.method,
        },
        ipAddress: ip,
        userAgent: req.get('User-Agent') || undefined,
      });

      return {
        allowed: false,
        tier: 'BLOCK',
        reason: 'Blocked due to abusive behavior',
        retryAfterMs: state.blockUntil - now,
        blockUntil: new Date(state.blockUntil),
      };
    }

    // Throttle enforcement uses the existing rate limiter with a strict config.
    if (state.tier === 'THROTTLE' && state.throttleUntil && now < state.throttleUntil) {
      const key = `abuse_throttle:${subjectKey}`;
      const result = await adaptiveRateLimiter.checkRateLimit(
        key,
        'IP' as RateLimitScope,
        tenantContext,
        userId,
        ip,
        `${req.method}:${req.path}`,
        this.config.throttleRateLimitConfig
      );

      if (!result.allowed) {
        this.auditLogger.logSecurityEvent({
          tenantId: tenantContext?.tenantId || 'system',
          actorId: userId || 'system',
          action: 'ABUSE_ENFORCED',
          resourceType: 'ABUSE_PROTECTION',
          resourceId: subjectKey,
          outcome: 'FAILURE',
          correlationId: safeCorrelationId('abuse_throttle', subjectKey),
          severity: 'HIGH',
          metadata: {
            subjectKey,
            tier: state.tier,
            throttleUntil: new Date(state.throttleUntil).toISOString(),
            path: req.path,
            method: req.method,
            retryAfter: result.retryAfter,
          },
          ipAddress: ip,
          userAgent: req.get('User-Agent') || undefined,
        });

        return {
          allowed: false,
          tier: 'THROTTLE',
          reason: 'Throttled due to abusive behavior',
          retryAfterMs: result.retryAfter,
          throttleUntil: new Date(state.throttleUntil),
        };
      }
    }

    return { allowed: true, tier: state.tier };
  }

  getTier(tenantContext: TenantContext | undefined, userId: string | undefined, ip: string): AbuseTier {
    const key = this.getSubjectKey(tenantContext, userId, ip);
    return this.states.get(key)?.tier || 'NORMAL';
  }

  private getSubjectKey(tenantContext: TenantContext | undefined, userId: string | undefined, ip: string): string {
    if (tenantContext?.tenantId && userId) {
      return `tenant:${tenantContext.tenantId}:user:${userId}`;
    }

    if (tenantContext?.tenantId) {
      return `tenant:${tenantContext.tenantId}:ip:${ip}`;
    }

    return `ip:${ip}`;
  }

  private getOrCreateState(subjectKey: string): AbuseState {
    const existing = this.states.get(subjectKey);
    if (existing) {
      return existing;
    }

    const now = nowMs();
    const state: AbuseState = {
      tier: 'NORMAL',
      tierSince: now,
      lastSeenAt: now,
      lastEscalationAt: 0,
      authFailures: { timestamps: [] },
      requests: { timestamps: [] },
      scraping: { timestampsByPath: new Map() },
    };

    this.states.set(subjectKey, state);
    return state;
  }

  private detectPatterns(state: AbuseState, req: Request): { pattern: AbusePattern; reason: string } | null {
    const now = nowMs();

    // Request bursting: too many requests in a very small window
    trimWindow(state.requests, this.config.requestBurst.windowMs, now);
    if (state.requests.timestamps.length > this.config.requestBurst.maxRequests) {
      return {
        pattern: 'REQUEST_BURST',
        reason: `Bursting detected: ${state.requests.timestamps.length} requests in ${this.config.requestBurst.windowMs}ms`,
      };
    }

    // Auth spam: too many failed auth attempts in window
    if (isAuthEndpoint(req)) {
      trimWindow(state.authFailures, this.config.authSpam.windowMs, now);
      if (state.authFailures.timestamps.length > this.config.authSpam.maxFailedAttempts) {
        return {
          pattern: 'AUTH_SPAM',
          reason: `Auth spam detected: ${state.authFailures.timestamps.length} failed attempts in ${this.config.authSpam.windowMs}ms`,
        };
      }
    }

    // Scraping: too many distinct paths in a minute
    trimScrapeWindow(state.scraping, this.config.scraping.windowMs, now);
    if (state.scraping.timestampsByPath.size > this.config.scraping.maxUniquePaths) {
      return {
        pattern: 'SCRAPING',
        reason: `Scraping detected: ${state.scraping.timestampsByPath.size} unique paths in ${this.config.scraping.windowMs}ms`,
      };
    }

    return null;
  }

  private escalate(
    subjectKey: string,
    state: AbuseState,
    pattern: AbusePattern,
    reason: string,
    tenantContext: TenantContext | undefined,
    userId: string | undefined,
    ip: string,
    req: Request
  ): void {
    const now = nowMs();

    const from = state.tier;
    const to = nextTier(state.tier);

    if (from === to) {
      return;
    }

    state.tier = to;
    state.tierSince = now;
    state.lastEscalationAt = now;

    if (to === 'THROTTLE') {
      state.throttleUntil = now + this.config.requestBurst.throttleDurationMs;
    }

    if (to === 'BLOCK') {
      const duration = pattern === 'AUTH_SPAM'
        ? this.config.authSpam.blockDurationMs
        : this.config.scraping.blockDurationMs;
      state.blockUntil = now + duration;
      state.throttleUntil = undefined;
    }

    this.auditLogger.logSecurityEvent({
      tenantId: tenantContext?.tenantId || 'system',
      actorId: userId || 'system',
      action: 'ABUSE_TIER_ESCALATED',
      resourceType: 'ABUSE_PROTECTION',
      resourceId: subjectKey,
      outcome: 'WARNING',
      correlationId: safeCorrelationId('abuse_escalated', subjectKey),
      severity: to === 'BLOCK' ? 'HIGH' : 'MEDIUM',
      metadata: {
        from,
        to,
        pattern,
        reason,
        throttleUntil: state.throttleUntil ? new Date(state.throttleUntil).toISOString() : undefined,
        blockUntil: state.blockUntil ? new Date(state.blockUntil).toISOString() : undefined,
        path: req.path,
        method: req.method,
      },
      ipAddress: ip,
      userAgent: req.get('User-Agent') || undefined,
    });

    logger.warn('Abuse tier escalated', {
      subjectKey,
      from,
      to,
      pattern,
      reason,
      tenantId: tenantContext?.tenantId,
      userId,
    });
  }

  private enforce(
    subjectKey: string,
    state: AbuseState,
    tenantContext: TenantContext | undefined,
    userId: string | undefined,
    ip: string,
    req: Request
  ): AbuseDecision {
    const now = nowMs();

    if (state.tier === 'BLOCK' && state.blockUntil && now < state.blockUntil) {
      return {
        allowed: false,
        tier: 'BLOCK',
        reason: 'Blocked due to abusive behavior',
        retryAfterMs: state.blockUntil - now,
        blockUntil: new Date(state.blockUntil),
      };
    }

    if (state.tier === 'THROTTLE' && state.throttleUntil && now < state.throttleUntil) {
      return {
        allowed: true,
        tier: 'THROTTLE',
        throttleUntil: new Date(state.throttleUntil),
      };
    }

    return { allowed: true, tier: state.tier };
  }
}

export interface AbuseProtectionMiddlewareOptions {
  config?: Partial<AbuseProtectionConfig>;
  skipPaths?: string[];
}

export function createAbuseProtectionMiddleware(options: AbuseProtectionMiddlewareOptions = {}) {
  const { config, skipPaths = [] } = options;
  const engine = new AbuseProtectionEngine(config);

  return async (req: Request, res: Response, next: NextFunction) => {
    if (skipPaths.some(p => req.path.startsWith(p))) {
      return next();
    }

    // Start-phase tracking for burst + scraping.
    engine.evaluateRequestStart(req);

    // Fail-closed enforcement BEFORE route handler executes.
    const pre = await engine.enforcePreRequest(req);
    if (!pre.allowed) {
      if (pre.tier === 'BLOCK') {
        return res.status(403).json({
          error: 'Access blocked',
          code: 'ABUSE_BLOCKED',
          tier: pre.tier,
          reason: pre.reason,
          retryAfterMs: pre.retryAfterMs,
        });
      }

      return res.status(429).json({
        error: 'Too Many Requests',
        code: 'ABUSE_THROTTLED',
        tier: pre.tier,
        reason: pre.reason,
        retryAfterMs: pre.retryAfterMs,
      });
    }

    // Evaluate patterns after response completes (auth failures need status code).
    res.on('finish', () => {
      try {
        const decision = engine.evaluateRequestEnd(req, res);
        if (!decision.allowed) {
          // Enforcement is handled pre-request; post-request decision is for audit/state.
        }
      } catch (error) {
        // Fail-closed principle: if abuse protection errors, we log loudly.
        logger.error('Abuse protection post-processing failed', error as Error, {
          path: req.path,
          method: req.method,
        });
      }
    });

    next();
  };
}

export const abuseProtectionMiddleware = createAbuseProtectionMiddleware();
