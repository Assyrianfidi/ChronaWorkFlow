import { Request, Response, NextFunction } from 'express';
import { CacheEngine } from './cacheEngine.js';
import { logger } from './logger.js';
import { ApiError, ErrorCodes } from './errorHandler.js';

/**
 * Enhanced rate limiting with adaptive throttling
 */
export class RateLimiter {
  private static readonly DEFAULT_LIMITS = {
    'auth': { requests: 5, window: 60 }, // 5 requests per minute
    'api': { requests: 100, window: 60 }, // 100 requests per minute
    'upload': { requests: 10, window: 60 }, // 10 uploads per minute
    'report': { requests: 20, window: 300 }, // 20 reports per 5 minutes
    'search': { requests: 50, window: 60 } // 50 searches per minute
  };
  
  /**
   * Per-user rate limiting
   */
  static perUserLimit(
    category: keyof typeof RateLimiter.DEFAULT_LIMITS,
    customLimit?: { requests: number; window: number }
  ) {
    const limit = customLimit || this.DEFAULT_LIMITS[category];
    
    return async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user?.id?.toString() || req.ip;
      const identifier = `user:${userId}:${category}`;
      
      const ip = req.ip || 'unknown';
      
      const result = await (CacheEngine as any).checkRateLimit(
        identifier,
        limit.requests,
        limit.window
      );
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': limit.requests,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
      });
      
      if (!result.allowed) {
        await logger.warn({
          type: 'BLOCKED_REQUEST',
          severity: 'MEDIUM',
          ip: ip,
          userId: req.user?.id?.toString(),
          details: {
            category,
            limit: limit.requests,
            window: limit.window,
            resetTime: result.resetTime
          }
        });
        
        throw new ApiError(
          `Rate limit exceeded for ${category}. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`,
          429,
          ErrorCodes.RATE_LIMIT_EXCEEDED
        );
      }
      
      next();
    };
  }
  
  /**
   * Per-IP adaptive throttling
   */
  static perIPAdaptive(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || 'unknown';
    const identifier = `ip:${ip}:adaptive`;
    
    // Check IP reputation and adjust limits
    this.checkIPReputation(ip).then(reputation => {
      const limits = this.getAdaptiveLimits(reputation);
      
      (CacheEngine as any).checkRateLimit(identifier, limits.requests, limits.window).then((result: any) => {
        res.set({
          'X-RateLimit-Limit': limits.requests,
          'X-RateLimit-Remaining': result.remaining,
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
        });
        
        if (!result.allowed) {
          logger.warn({
            type: 'BLOCKED_REQUEST',
            severity: 'HIGH',
            ip: ip,
            details: {
              type: 'adaptive',
              reputation,
              limits,
              resetTime: result.resetTime
            }
          });
          
          throw new ApiError(
            'IP rate limit exceeded',
            429,
            ErrorCodes.RATE_LIMIT_EXCEEDED
          );
        }
        
        next();
      }).catch(next);
    }).catch(next);
  }
  
  /**
   * Burst control for high-frequency operations
   */
  static burstControl(
    maxBurst: number,
    cooldownSeconds: number
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user?.id || req.ip;
      const burstKey = `burst:${userId}`;
      const cooldownKey = `cooldown:${userId}`;
      
      // Check if in cooldown
      const inCooldown = await CacheEngine.exists(cooldownKey);
      if (inCooldown) {
        throw new ApiError(
          'Too many requests. Please wait before trying again.',
          429,
          ErrorCodes.TOO_MANY_REQUESTS
        );
      }
      
      // Increment burst counter
      const burstCount = await CacheEngine.incr(burstKey);
      
      // Set expiry on first request
      if (burstCount === 1) {
        await CacheEngine.set(burstKey, burstCount, 10); // 10 second window
      }
      
      // Check burst limit
      if (burstCount > maxBurst) {
        // Activate cooldown
        await CacheEngine.set(cooldownKey, true, cooldownSeconds);
        await CacheEngine.del(burstKey);
        
        await logger.warn({
          type: 'BLOCKED_REQUEST',
          severity: 'HIGH',
          ip: req.ip || 'unknown',
          userId: req.user?.id?.toString(),
          details: {
            type: 'burst_control',
            burstCount,
            maxBurst,
            cooldownSeconds
          }
        });
        
        throw new ApiError(
          `Burst limit exceeded. Cooldown activated for ${cooldownSeconds} seconds.`,
          429,
          ErrorCodes.RATE_LIMIT_EXCEEDED
        );
      }
      
      next();
    };
  }
  
  /**
   * Check IP reputation (simplified implementation)
   */
  private static async checkIPReputation(ip: string): Promise<'high' | 'medium' | 'low'> {
    const reputationKey = `ip_reputation:${ip}`;
    const reputation = await CacheEngine.get(reputationKey);
    
    if (reputation) return reputation;
    
    // Default to medium for unknown IPs
    await CacheEngine.set(reputationKey, 'medium', 3600); // Cache for 1 hour
    return 'medium';
  }
  
  /**
   * Get adaptive limits based on IP reputation
   */
  private static getAdaptiveLimits(reputation: 'high' | 'medium' | 'low') {
    switch (reputation) {
      case 'high':
        return { requests: 200, window: 60 }; // Trusted IP
      case 'medium':
        return { requests: 100, window: 60 }; // Normal IP
      case 'low':
        return { requests: 50, window: 60 }; // Suspicious IP
      default:
        return { requests: 100, window: 60 };
    }
  }
  
  /**
   * Update IP reputation based on behavior
   */
  static async updateIPReputation(
    ip: string,
    action: 'good' | 'bad' | 'neutral'
  ): Promise<void> {
    const reputationKey = `ip_reputation:${ip}`;
    const current = await CacheEngine.get(reputationKey) || 'medium';
    
    let newReputation: 'high' | 'medium' | 'low' = current;
    
    if (action === 'good' && current !== 'high') {
      newReputation = current === 'low' ? 'medium' : 'high';
    } else if (action === 'bad' && current !== 'low') {
      newReputation = current === 'high' ? 'medium' : 'low';
    }
    
    if (newReputation !== current) {
      await CacheEngine.set(reputationKey, newReputation, 3600);
      
      await logger.warn({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'LOW',
        ip,
        details: {
          type: 'reputation_update',
          oldReputation: current,
          newReputation,
          action
        }
      });
    }
  }
}

/**
 * Rate limit middleware factory
 */
export class RateLimitMiddleware {
  /**
   * Apply multiple rate limiters
   */
  static combine(...limiters: Array<(req: Request, res: Response, next: NextFunction) => void>) {
    return (req: Request, res: Response, next: NextFunction) => {
      let index = 0;
      
      const runNext = () => {
        if (index >= limiters.length) {
          return next();
        }
        
        const limiter = limiters[index++];
        limiter(req, res, runNext);
      };
      
      runNext();
    };
  }
  
  /**
   * Create dynamic rate limiter based on user tier
   */
  static byUserTier(tierLimits: Record<string, { requests: number; window: number }>) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user as any;
      const tier = user?.tier || 'basic';
      const limits = tierLimits[tier] || tierLimits['basic'];
      
      const identifier = `user:${user?.id || req.ip}:tier:${tier}`;
      const result = await (CacheEngine as any).checkRateLimit(
        identifier,
        limits.requests,
        limits.window
      );
      
      res.set({
        'X-RateLimit-Limit': limits.requests,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
        'X-User-Tier': tier
      });
      
      if (!result.allowed) {
        throw new ApiError(
          `Rate limit exceeded for ${tier} tier`,
          429,
          ErrorCodes.RATE_LIMIT_EXCEEDED
        );
      }
      
      next();
    };
  }
}
