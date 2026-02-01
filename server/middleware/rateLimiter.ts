/**
 * Rate Limiting Middleware
 * Fail-closed behavior with per-IP and per-user limits
 */

import { Request, Response, NextFunction } from 'express';
import { Redis } from 'ioredis';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitRule {
  endpoint: string | RegExp;
  config: RateLimitConfig;
}

class RateLimiter {
  private redis: Redis;
  private enabled: boolean;
  private failClosed: boolean = true;

  // Default rate limit rules
  private rules: RateLimitRule[] = [
    // Auth endpoints - strict limits
    {
      endpoint: /^\/api\/auth\/(login|register)/,
      config: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,
        keyPrefix: 'ratelimit:auth',
        skipSuccessfulRequests: false,
      },
    },
    // Forecast generation - expensive operations
    {
      endpoint: /^\/api\/forecasts\/generate/,
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10,
        keyPrefix: 'ratelimit:forecast',
        skipSuccessfulRequests: false,
      },
    },
    // Scenario operations
    {
      endpoint: /^\/api\/scenarios/,
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 30,
        keyPrefix: 'ratelimit:scenario',
        skipSuccessfulRequests: true,
      },
    },
    // Destructive actions (DELETE)
    {
      endpoint: /^\/api\/.+/,
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 20,
        keyPrefix: 'ratelimit:delete',
        skipSuccessfulRequests: true,
      },
    },
    // General API - lenient
    {
      endpoint: /^\/api\//,
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100,
        keyPrefix: 'ratelimit:api',
        skipSuccessfulRequests: true,
      },
    },
  ];

  constructor(redis: Redis, enabled: boolean = true) {
    this.redis = redis;
    this.enabled = enabled;
  }

  /**
   * Rate limiting middleware
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!this.enabled) {
        return next();
      }

      try {
        // Find matching rule
        const rule = this.findMatchingRule(req);
        if (!rule) {
          return next();
        }

        // Skip DELETE check for non-DELETE methods
        if (rule.config.keyPrefix === 'ratelimit:delete' && req.method !== 'DELETE') {
          return next();
        }

        // Get rate limit key (per-IP and per-user)
        const ipKey = this.getIpKey(req, rule.config);
        const userKey = this.getUserKey(req, rule.config);

        // Check both IP and user limits
        const [ipAllowed, userAllowed] = await Promise.all([
          this.checkLimit(ipKey, rule.config),
          userKey ? this.checkLimit(userKey, rule.config) : Promise.resolve(true),
        ]);

        if (!ipAllowed || !userAllowed) {
          return this.rateLimitExceeded(req, res, rule.config);
        }

        // Track response to conditionally count request
        const originalSend = res.send;
        const rateLimiter = this;
        res.send = function (this: Response, data: any) {
          const shouldCount = RateLimiter.shouldCountRequest(
            req,
            res,
            rule.config
          );

          if (shouldCount) {
            // Increment counters after response
            Promise.all([
              rateLimiter.incrementCounter(ipKey, rule.config),
              userKey ? rateLimiter.incrementCounter(userKey, rule.config) : Promise.resolve(),
            ]).catch((error) => {
              console.error('[RateLimiter] Failed to increment counter:', error);
            });
          }

          return originalSend.call(this, data);
        };

        next();
      } catch (error) {
        // Fail closed - reject request on Redis failure
        if (this.failClosed) {
          console.error('[RateLimiter] Redis error, failing closed:', error);
          return res.status(503).json({
            error: {
              message: 'Service temporarily unavailable',
              code: 'RATE_LIMIT_SERVICE_UNAVAILABLE',
            },
          });
        }

        // Fail open - allow request on Redis failure
        console.warn('[RateLimiter] Redis error, failing open:', error);
        next();
      }
    };
  }

  /**
   * Check if request is within rate limit
   */
  private async checkLimit(key: string, config: RateLimitConfig): Promise<boolean> {
    const count = await this.redis.get(key);
    const currentCount = count ? parseInt(count, 10) : 0;
    return currentCount < config.maxRequests;
  }

  /**
   * Increment rate limit counter
   */
  private async incrementCounter(key: string, config: RateLimitConfig): Promise<void> {
    const count = await this.redis.incr(key);
    
    // Set expiry on first increment
    if (count === 1) {
      await this.redis.pexpire(key, config.windowMs);
    }
  }

  /**
   * Get remaining requests and reset time
   */
  private async getRateLimitInfo(key: string, config: RateLimitConfig): Promise<{
    remaining: number;
    resetMs: number;
  }> {
    const [count, ttl] = await Promise.all([
      this.redis.get(key),
      this.redis.pttl(key),
    ]);

    const currentCount = count ? parseInt(count, 10) : 0;
    const remaining = Math.max(0, config.maxRequests - currentCount);
    const resetMs = ttl > 0 ? ttl : config.windowMs;

    return { remaining, resetMs };
  }

  /**
   * Handle rate limit exceeded
   */
  private async rateLimitExceeded(
    req: Request,
    res: Response,
    config: RateLimitConfig
  ): Promise<void> {
    const ipKey = this.getIpKey(req, config);
    const info = await this.getRateLimitInfo(ipKey, config);

    res.set({
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': new Date(Date.now() + info.resetMs).toISOString(),
      'Retry-After': Math.ceil(info.resetMs / 1000).toString(),
    });

    res.status(429).json({
      error: {
        message: 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(info.resetMs / 1000),
      },
    });
  }

  /**
   * Find matching rate limit rule
   */
  private findMatchingRule(req: Request): RateLimitRule | null {
    for (const rule of this.rules) {
      if (typeof rule.endpoint === 'string') {
        if (req.path === rule.endpoint) {
          return rule;
        }
      } else if (rule.endpoint instanceof RegExp) {
        if (rule.endpoint.test(req.path)) {
          return rule;
        }
      }
    }
    return null;
  }

  /**
   * Get IP-based rate limit key
   */
  private getIpKey(req: Request, config: RateLimitConfig): string {
    const ip = this.getClientIp(req);
    return `${config.keyPrefix}:ip:${ip}`;
  }

  /**
   * Get user-based rate limit key
   */
  private getUserKey(req: Request, config: RateLimitConfig): string | null {
    const userId = (req as any).userId;
    if (!userId) {
      return null;
    }
    return `${config.keyPrefix}:user:${userId}`;
  }

  /**
   * Get client IP address
   */
  private getClientIp(req: Request): string {
    // Check X-Forwarded-For header (proxy/load balancer)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return ips.split(',')[0].trim();
    }

    // Check X-Real-IP header
    const realIp = req.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    // Fallback to socket IP
    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  /**
   * Determine if request should be counted
   */
  private static shouldCountRequest(
    req: Request,
    res: Response,
    config: RateLimitConfig
  ): boolean {
    const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
    const isFailure = res.statusCode >= 400;

    if (config.skipSuccessfulRequests && isSuccess) {
      return false;
    }

    if (config.skipFailedRequests && isFailure) {
      return false;
    }

    return true;
  }

  /**
   * Add custom rate limit rule
   */
  addRule(rule: RateLimitRule): void {
    this.rules.unshift(rule); // Add to beginning for priority
  }

  /**
   * Set fail-closed behavior
   */
  setFailClosed(failClosed: boolean): void {
    this.failClosed = failClosed;
  }
}

export { RateLimiter };
export type { RateLimitConfig, RateLimitRule };
export default RateLimiter;
