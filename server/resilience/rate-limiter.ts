// CRITICAL: Adaptive Rate Limiter
// MANDATORY: Per-tenant rate limiting with adaptive algorithms

import { logger } from '../utils/structured-logger.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { TenantContext } from '../tenant/tenant-isolation.js';

export type RateLimitStrategy = 'FIXED' | 'ADAPTIVE' | 'TOKEN_BUCKET' | 'SLIDING_WINDOW';
export type RateLimitScope = 'GLOBAL' | 'TENANT' | 'USER' | 'IP' | 'ENDPOINT';

export interface RateLimitConfig {
  strategy: RateLimitStrategy;
  scope: RateLimitScope;
  windowMs: number;
  maxRequests: number;
  adaptiveMultiplier: number;
  burstCapacity: number;
  refillRate: number;
  penaltyMultiplier: number;
  recoveryRate: number;
}

export interface RateLimitState {
  currentRequests: number;
  windowStart: Date;
  tokens: number;
  lastRefill: Date;
  penaltyEnd: Date;
  violations: number;
  lastViolation: Date;
  adaptiveLimit: number;
  blocked: boolean;
  blockedUntil: Date;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter: number;
  limit: number;
  windowMs: number;
  strategy: RateLimitStrategy;
  violationCount: number;
  adaptiveMode: boolean;
}

/**
 * CRITICAL: Adaptive Rate Limiter
 * 
 * This class implements adaptive rate limiting with multiple strategies
 * and per-tenant isolation to prevent abuse and ensure fair usage.
 */
export class AdaptiveRateLimiter {
  private static instance: AdaptiveRateLimiter;
  private auditLogger: any;
  private rateLimitStates: Map<string, RateLimitState> = new Map();
  private globalConfig: RateLimitConfig;
  private tenantConfigs: Map<string, RateLimitConfig> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.auditLogger = getImmutableAuditLogger();
    this.globalConfig = this.initializeGlobalConfig();
    this.startCleanupTimer();
  }

  /**
   * CRITICAL: Get singleton instance
   */
  static getInstance(): AdaptiveRateLimiter {
    if (!AdaptiveRateLimiter.instance) {
      AdaptiveRateLimiter.instance = new AdaptiveRateLimiter();
    }
    return AdaptiveRateLimiter.instance;
  }

  /**
   * CRITICAL: Check rate limit
   */
  async checkRateLimit(
    key: string,
    scope: RateLimitScope,
    tenantContext?: TenantContext,
    userId?: string,
    ip?: string,
    endpoint?: string,
    config?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    const now = new Date();
    const effectiveConfig = this.getEffectiveConfig(scope, tenantContext, config);
    const state = this.getOrCreateState(key, effectiveConfig);

    // CRITICAL: Check if currently blocked
    if (state.blocked && state.blockedUntil > now) {
      return this.createBlockedResult(state, effectiveConfig);
    }

    // CRITICAL: Apply rate limiting strategy
    let result: RateLimitResult;
    switch (effectiveConfig.strategy) {
      case 'FIXED':
        result = this.checkFixedWindow(state, effectiveConfig, now);
        break;
      case 'ADAPTIVE':
        result = this.checkAdaptive(state, effectiveConfig, now);
        break;
      case 'TOKEN_BUCKET':
        result = this.checkTokenBucket(state, effectiveConfig, now);
        break;
      case 'SLIDING_WINDOW':
        result = this.checkSlidingWindow(state, effectiveConfig, now);
        break;
      default:
        result = this.checkFixedWindow(state, effectiveConfig, now);
    }

    // CRITICAL: Handle violations
    if (!result.allowed) {
      await this.handleViolation(key, state, effectiveConfig, tenantContext, userId, ip, endpoint);
    }

    // CRITICAL: Update state
    this.rateLimitStates.set(key, state);

    return result;
  }

  /**
   * CRITICAL: Configure tenant-specific rate limiting
   */
  configureTenant(tenantId: string, config: Partial<RateLimitConfig>): void {
    const tenantConfig = { ...this.globalConfig, ...config };
    this.tenantConfigs.set(tenantId, tenantConfig);

    // CRITICAL: Log configuration change
    this.auditLogger.logSecurityEvent({
      tenantId,
      actorId: 'system',
      action: 'RATE_LIMIT_CONFIGURED',
      resourceType: 'RATE_LIMITER',
      resourceId: tenantId,
      outcome: 'SUCCESS',
      correlationId: `rate_limit_config_${tenantId}_${Date.now()}`,
      severity: 'LOW',
      metadata: {
        strategy: tenantConfig.strategy,
        maxRequests: tenantConfig.maxRequests,
        windowMs: tenantConfig.windowMs
      }
    });

    logger.info('Rate limit configuration updated', { tenantId, config: tenantConfig });
  }

  /**
   * CRITICAL: Get rate limit statistics
   */
  getStatistics(): {
    totalKeys: number;
    blockedKeys: number;
    totalViolations: number;
    averageLimit: number;
    strategies: Record<RateLimitStrategy, number>;
    scopes: Record<RateLimitScope, number>;
    topViolators: Array<{ key: string; violations: number; scope: RateLimitScope }>;
  } {
    const entries = Array.from(this.rateLimitStates.entries());
    const states = entries.map(([, state]) => state);
    const now = new Date();

    const totalKeys = states.length;
    const blockedKeys = states.filter(state => state.blocked && state.blockedUntil > now).length;
    const totalViolations = states.reduce((sum, state) => sum + state.violations, 0);
    const averageLimit = states.length > 0 
      ? states.reduce((sum, state) => sum + state.adaptiveLimit, 0) / states.length 
      : 0;

    const strategies: Record<RateLimitStrategy, number> = {
      FIXED: 0,
      ADAPTIVE: 0,
      TOKEN_BUCKET: 0,
      SLIDING_WINDOW: 0
    };

    const scopes: Record<RateLimitScope, number> = {
      GLOBAL: 0,
      TENANT: 0,
      USER: 0,
      IP: 0,
      ENDPOINT: 0
    };

    // CRITICAL: Count strategies and scopes
    for (const [key, config] of this.tenantConfigs.entries()) {
      strategies[config.strategy]++;
    }
    for (const [k] of entries) {
      scopes[this.getScopeFromKey(k)]++;
    }

    // CRITICAL: Get top violators
    const topViolators = entries
      .map(([k, state]) => ({
        key: this.extractKeyIdentifier(k),
        violations: state.violations,
        scope: this.getScopeFromKey(k)
      }))
      .sort((a, b) => b.violations - a.violations)
      .slice(0, 10);

    return {
      totalKeys,
      blockedKeys,
      totalViolations,
      averageLimit,
      strategies,
      scopes,
      topViolators
    };
  }

  /**
   * CRITICAL: Reset rate limit state
   */
  resetRateLimit(key: string): void {
    this.rateLimitStates.delete(key);
    logger.info('Rate limit state reset', { key });
  }

  /**
   * CRITICAL: Unblock key
   */
  unblockKey(key: string): void {
    const state = this.rateLimitStates.get(key);
    if (state) {
      state.blocked = false;
      state.blockedUntil = new Date(0);
      state.penaltyEnd = new Date(0);
      this.rateLimitStates.set(key, state);
      
      logger.info('Rate limit key unblocked', { key });
    }
  }

  /**
   * CRITICAL: Check fixed window rate limiting
   */
  private checkFixedWindow(state: RateLimitState, config: RateLimitConfig, now: Date): RateLimitResult {
    const windowElapsed = now.getTime() - state.windowStart.getTime();
    
    // CRITICAL: Reset window if expired
    if (windowElapsed >= config.windowMs) {
      state.currentRequests = 0;
      state.windowStart = now;
    }

    const allowed = state.currentRequests < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - state.currentRequests);

    if (allowed) {
      state.currentRequests++;
    }

    return {
      allowed,
      remaining,
      resetTime: new Date(state.windowStart.getTime() + config.windowMs),
      retryAfter: allowed ? 0 : config.windowMs - windowElapsed,
      limit: config.maxRequests,
      windowMs: config.windowMs,
      strategy: config.strategy,
      violationCount: state.violations,
      adaptiveMode: false
    };
  }

  /**
   * CRITICAL: Check adaptive rate limiting
   */
  private checkAdaptive(state: RateLimitState, config: RateLimitConfig, now: Date): RateLimitResult {
    const windowElapsed = now.getTime() - state.windowStart.getTime();
    
    // CRITICAL: Reset window if expired
    if (windowElapsed >= config.windowMs) {
      state.currentRequests = 0;
      state.windowStart = now;
      
      // CRITICAL: Adjust adaptive limit based on violations
      if (state.violations > 0) {
        state.adaptiveLimit = Math.max(
          config.maxRequests / (1 + (state.violations * config.adaptiveMultiplier)),
          config.maxRequests / 10 // Minimum 10% of original limit
        );
      } else {
        state.adaptiveLimit = Math.min(
          config.maxRequests,
          state.adaptiveLimit * 1.1 // Gradually recover
        );
      }
    }

    const effectiveLimit = state.adaptiveLimit || config.maxRequests;
    const allowed = state.currentRequests < effectiveLimit;
    const remaining = Math.max(0, effectiveLimit - state.currentRequests);

    if (allowed) {
      state.currentRequests++;
    }

    return {
      allowed,
      remaining,
      resetTime: new Date(state.windowStart.getTime() + config.windowMs),
      retryAfter: allowed ? 0 : config.windowMs - windowElapsed,
      limit: effectiveLimit,
      windowMs: config.windowMs,
      strategy: config.strategy,
      violationCount: state.violations,
      adaptiveMode: true
    };
  }

  /**
   * CRITICAL: Check token bucket rate limiting
   */
  private checkTokenBucket(state: RateLimitState, config: RateLimitConfig, now: Date): RateLimitResult {
    // CRITICAL: Refill tokens
    const timeSinceLastRefill = now.getTime() - state.lastRefill.getTime();
    const tokensToAdd = Math.floor((timeSinceLastRefill / 1000) * config.refillRate);
    
    if (tokensToAdd > 0) {
      state.tokens = Math.min(config.burstCapacity, state.tokens + tokensToAdd);
      state.lastRefill = now;
    }

    const allowed = state.tokens > 0;
    const remaining = state.tokens;

    if (allowed) {
      state.tokens--;
    }

    return {
      allowed,
      remaining,
      resetTime: new Date(state.lastRefill.getTime() + 1000),
      retryAfter: allowed ? 0 : Math.ceil((config.burstCapacity - state.tokens) / config.refillRate * 1000),
      limit: config.burstCapacity,
      windowMs: config.windowMs,
      strategy: config.strategy,
      violationCount: state.violations,
      adaptiveMode: false
    };
  }

  /**
   * CRITICAL: Check sliding window rate limiting
   */
  private checkSlidingWindow(state: RateLimitState, config: RateLimitConfig, now: Date): RateLimitResult {
    // CRITICAL: For sliding window, we track requests in the last windowMs
    // This is simplified - in production, you'd use a more sophisticated approach
    const allowed = state.currentRequests < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - state.currentRequests);

    if (allowed) {
      state.currentRequests++;
    }

    // CRITICAL: Simulate sliding window by gradually reducing count
    if (process.env.DETERMINISTIC_TEST_IDS !== 'true' && state.currentRequests > 0 && Math.random() < 0.1) { // 10% chance to reduce
      state.currentRequests = Math.max(0, state.currentRequests - 1);
    }

    return {
      allowed,
      remaining,
      resetTime: new Date(now.getTime() + config.windowMs),
      retryAfter: allowed ? 0 : 1000,
      limit: config.maxRequests,
      windowMs: config.windowMs,
      strategy: config.strategy,
      violationCount: state.violations,
      adaptiveMode: false
    };
  }

  /**
   * CRITICAL: Handle rate limit violation
   */
  private async handleViolation(
    key: string,
    state: RateLimitState,
    config: RateLimitConfig,
    tenantContext?: TenantContext,
    userId?: string,
    ip?: string,
    endpoint?: string
  ): Promise<void> {
    const now = new Date();
    
    // CRITICAL: Update violation state
    state.violations++;
    state.lastViolation = now;

    // CRITICAL: Apply penalty if threshold exceeded
    if (state.violations >= 5) {
      const penaltyDuration = Math.min(
        300000 * Math.pow(config.penaltyMultiplier, state.violations - 4), // Exponential backoff
        3600000 // Max 1 hour
      );
      
      state.blocked = true;
      state.blockedUntil = new Date(now.getTime() + penaltyDuration);
      state.penaltyEnd = state.blockedUntil;
    }

    // CRITICAL: Log violation
    this.auditLogger.logSecurityEvent({
      tenantId: tenantContext?.tenantId || 'system',
      actorId: userId || 'system',
      action: 'RATE_LIMIT_VIOLATION',
      resourceType: 'RATE_LIMITER',
      resourceId: key,
      outcome: 'FAILURE',
      correlationId: `rate_limit_violation_${key}_${now.getTime()}`,
      severity: state.blocked ? 'HIGH' : 'MEDIUM',
      metadata: {
        scope: this.getScopeFromKey(key),
        violations: state.violations,
        blocked: state.blocked,
        blockedUntil: state.blockedUntil,
        ip,
        endpoint
      }
    });

    logger.warn('Rate limit violation', {
      key,
      violations: state.violations,
      blocked: state.blocked,
      tenantId: tenantContext?.tenantId,
      userId,
      ip,
      endpoint
    });
  }

  /**
   * CRITICAL: Get effective configuration
   */
  private getEffectiveConfig(scope: RateLimitScope, tenantContext?: TenantContext, config?: Partial<RateLimitConfig>): RateLimitConfig {
    const base = tenantContext && this.tenantConfigs.has(tenantContext.tenantId)
      ? (this.tenantConfigs.get(tenantContext.tenantId) as RateLimitConfig)
      : this.globalConfig;

    return {
      ...base,
      ...config,
      scope: config?.scope || scope
    };
  }

  /**
   * CRITICAL: Get or create rate limit state
   */
  private getOrCreateState(key: string, config: RateLimitConfig): RateLimitState {
    let state = this.rateLimitStates.get(key);
    
    if (!state) {
      state = {
        currentRequests: 0,
        windowStart: new Date(),
        tokens: config.burstCapacity,
        lastRefill: new Date(),
        penaltyEnd: new Date(0),
        violations: 0,
        lastViolation: new Date(0),
        adaptiveLimit: config.maxRequests,
        blocked: false,
        blockedUntil: new Date(0)
      };
      
      this.rateLimitStates.set(key, state);
    }
    
    return state;
  }

  /**
   * CRITICAL: Create blocked result
   */
  private createBlockedResult(state: RateLimitState, config: RateLimitConfig): RateLimitResult {
    const now = new Date();
    const retryAfter = Math.max(0, state.blockedUntil.getTime() - now.getTime());

    return {
      allowed: false,
      remaining: 0,
      resetTime: state.blockedUntil,
      retryAfter,
      limit: config.maxRequests,
      windowMs: config.windowMs,
      strategy: config.strategy,
      violationCount: state.violations,
      adaptiveMode: false
    };
  }

  /**
   * CRITICAL: Get scope from key
   */
  private getScopeFromKey(key: string): RateLimitScope {
    if (key.startsWith('tenant:')) return 'TENANT';
    if (key.startsWith('user:')) return 'USER';
    if (key.startsWith('ip:')) return 'IP';
    if (key.startsWith('endpoint:')) return 'ENDPOINT';
    return 'GLOBAL';
  }

  /**
   * CRITICAL: Extract key identifier
   */
  private extractKeyIdentifier(state: RateLimitState): string {
    // CRITICAL: This would extract the meaningful part of the key
    // For now, return a placeholder
    return 'unknown';
  }

  /**
   * CRITICAL: Initialize global configuration
   */
  private initializeGlobalConfig(): RateLimitConfig {
    return {
      strategy: 'ADAPTIVE',
      scope: 'TENANT',
      windowMs: 60000, // 1 minute
      maxRequests: 1000,
      adaptiveMultiplier: 0.5,
      burstCapacity: 100,
      refillRate: 10, // 10 tokens per second
      penaltyMultiplier: 2,
      recoveryRate: 1.1
    };
  }

  /**
   * CRITICAL: Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredStates();
    }, 60000); // Every minute
  }

  /**
   * CRITICAL: Cleanup expired states
   */
  private cleanupExpiredStates(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [key, state] of this.rateLimitStates.entries()) {
      // CRITICAL: Remove states that haven't been used recently
      const timeSinceLastViolation = now.getTime() - state.lastViolation.getTime();
      const timeSinceWindowStart = now.getTime() - state.windowStart.getTime();
      
      if (timeSinceLastViolation > 3600000 && timeSinceWindowStart > 3600000) { // 1 hour
        this.rateLimitStates.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info('Cleaned up expired rate limit states', { cleanedCount });
    }
  }

  /**
   * CRITICAL: Stop cleanup timer
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

/**
 * CRITICAL: Global adaptive rate limiter instance
 */
export const adaptiveRateLimiter = AdaptiveRateLimiter.getInstance();

/**
 * CRITICAL: Convenience functions
 */
export const checkRateLimit = async (
  key: string,
  scope: RateLimitScope,
  tenantContext?: TenantContext,
  userId?: string,
  ip?: string,
  endpoint?: string,
  config?: Partial<RateLimitConfig>
): Promise<RateLimitResult> => {
  return await adaptiveRateLimiter.checkRateLimit(key, scope, tenantContext, userId, ip, endpoint, config);
};

export const configureTenantRateLimit = (tenantId: string, config: Partial<RateLimitConfig>): void => {
  adaptiveRateLimiter.configureTenant(tenantId, config);
};

export const getRateLimitStatistics = (): ReturnType<typeof adaptiveRateLimiter.getStatistics> => {
  return adaptiveRateLimiter.getStatistics();
};

export const resetRateLimit = (key: string): void => {
  adaptiveRateLimiter.resetRateLimit(key);
};

export const unblockRateLimit = (key: string): void => {
  adaptiveRateLimiter.unblockKey(key);
};

/**
 * CRITICAL: Rate limiting middleware factory
 */
export function createRateLimitMiddleware(options: {
  scope: RateLimitScope;
  keyGenerator?: (req: any) => string;
  config?: Partial<RateLimitConfig>;
  skipPaths?: string[];
}) {
  const { scope, keyGenerator, config, skipPaths = [] } = options;

  return async (req: any, res: any, next: any) => {
    // CRITICAL: Skip rate limiting for specified paths
    if (skipPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // CRITICAL: Generate key
    let key: string;
    if (keyGenerator) {
      key = keyGenerator(req);
    } else {
      // CRITICAL: Default key generation
      const tenantContext = req.tenantContext;
      const userId = req.user?.id;
      const ip = req.ip || req.connection.remoteAddress;
      const endpoint = `${req.method}:${req.path}`;
      
      if (scope === 'TENANT' && tenantContext) {
        key = `tenant:${tenantContext.tenantId}`;
      } else if (scope === 'USER' && userId) {
        key = `user:${userId}`;
      } else if (scope === 'IP' && ip) {
        key = `ip:${ip}`;
      } else if (scope === 'ENDPOINT') {
        key = `endpoint:${endpoint}`;
      } else {
        key = 'global';
      }
    }

    // CRITICAL: Check rate limit
    const result = await checkRateLimit(
      key,
      scope,
      req.tenantContext,
      req.user?.id,
      req.ip || req.connection.remoteAddress,
      `${req.method}:${req.path}`,
      config
    );

    // CRITICAL: Add rate limit headers
    res.set('X-RateLimit-Limit', result.limit.toString());
    res.set('X-RateLimit-Remaining', result.remaining.toString());
    res.set('X-RateLimit-Reset', result.resetTime.toISOString());
    res.set('X-RateLimit-Retry-After', result.retryAfter.toString());

    // CRITICAL: Handle rate limit exceeded
    if (!result.allowed) {
      const auditLogger = getImmutableAuditLogger();
      auditLogger.logSecurityEvent({
        tenantId: req.tenantContext?.tenantId || 'system',
        actorId: req.user?.id || 'system',
        action: 'REQUEST_RATE_LIMITED',
        resourceType: 'RATE_LIMITER',
        resourceId: key,
        outcome: 'FAILURE',
        correlationId: `rate_limit_${Date.now()}`,
        severity: 'MEDIUM',
        metadata: {
          key,
          scope,
          endpoint: `${req.method}:${req.path}`,
          violations: result.violationCount
        }
      });

      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter: result.retryAfter,
        limit: result.limit,
        remaining: result.remaining,
        resetTime: result.resetTime
      });
    }

    next();
  };
}
