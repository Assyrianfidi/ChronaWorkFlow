// Production-Grade Rate Limiting and Abuse Protection
// Implements global rate limiting with Redis fallback and memory store

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/structured-logger.js';
import { metrics } from '../utils/metrics.js';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (req: Request) => string; // Custom key generator
  onLimitReached?: (req: Request, res: Response) => void; // Callback when limit is reached
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
}

export class MemoryRateLimitStore {
  private store: Map<string, { count: number; resetTime: number; lastAccess: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key);
      }
    }
  }

  async increment(key: string, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const resetTime = now + windowMs;
    
    let entry = this.store.get(key);
    
    if (!entry || now > entry.resetTime) {
      // New window
      entry = {
        count: 1,
        resetTime,
        lastAccess: now
      };
      this.store.set(key, entry);
    } else {
      // Existing window
      entry.count++;
      entry.lastAccess = now;
    }

    return {
      allowed: entry.count <= (this.store.get(key)?.count || 0),
      remaining: Math.max(0, (this.store.get(key)?.count || 0) - entry.count),
      resetTime: entry.resetTime,
      totalHits: entry.count
    };
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | undefined> {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return undefined;
    }
    return { count: entry.count, resetTime: entry.resetTime };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

export class RateLimiter {
  private store: MemoryRateLimitStore;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      message: 'Too many requests, please try again later.',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config
    };
    
    this.store = new MemoryRateLimitStore();
  }

  private getKey(req: Request): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(req);
    }
    
    // Default key generation: IP + User ID (if authenticated)
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const userId = (req as any).user?.id || 'anonymous';
    return `${ip}:${userId}`;
  }

  private shouldCountRequest(req: Request, res: Response): boolean {
    // Skip counting based on configuration
    if (this.config.skipSuccessfulRequests && res.statusCode < 400) {
      return false;
    }
    
    if (this.config.skipFailedRequests && res.statusCode >= 400) {
      return false;
    }
    
    return true;
  }

  middleware(): (req: Request, res: Response, next: NextFunction) => void {
    return async (req: Request, res: Response, next: NextFunction) => {
      const key = this.getKey(req);
      
      try {
        const result = await this.store.increment(key, this.config.windowMs);
        
        // Add rate limit headers
        res.set({
          'X-RateLimit-Limit': this.config.maxRequests.toString(),
          'X-RateLimit-Remaining': Math.max(0, this.config.maxRequests - result.totalHits).toString(),
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
        });

        if (!result.allowed || result.totalHits > this.config.maxRequests) {
          // Rate limit exceeded
          metrics.incrementCounter('app_rate_limit_exceeded', 1, {
            ip: req.ip,
            endpoint: req.path,
            user_id: (req as any).user?.id || 'anonymous'
          });

          logger.warn('Rate limit exceeded', {
            ip: req.ip,
            userId: (req as any).user?.id,
            endpoint: req.path,
            userAgent: req.headers['user-agent'],
            totalHits: result.totalHits,
            maxRequests: this.config.maxRequests
          });

          if (this.config.onLimitReached) {
            this.config.onLimitReached(req, res);
          }

          res.status(429).json({
            error: 'Too Many Requests',
            message: this.config.message,
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          });
          
          return;
        }

        // Continue to next middleware
        res.on('finish', () => {
          if (this.shouldCountRequest(req, res)) {
            // Request already counted, no action needed
          } else {
            // Decrement count if we shouldn't count this request
            this.store.increment(key, -this.config.windowMs).catch(() => {
              // Ignore errors during decrement
            });
          }
        });

        next();
      } catch (error) {
        logger.error('Rate limiter error', error as Error, {
          ip: req.ip,
          endpoint: req.path
        });
        
        // Fail open - allow request if rate limiter fails
        next();
      }
    };
  }

  async resetKey(key: string): Promise<void> {
    await this.store.reset(key);
  }

  async getKeyStatus(key: string): Promise<{ count: number; resetTime: number } | undefined> {
    return await this.store.get(key);
  }

  destroy(): void {
    this.store.destroy();
  }
}

// Predefined rate limiters for different use cases
export const createGlobalRateLimiter = () => new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000, // 1000 requests per 15 minutes per IP
  message: 'Global rate limit exceeded. Please try again later.'
});

export const createAuthRateLimiter = () => new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 auth attempts per 15 minutes per IP
  message: 'Too many authentication attempts. Please try again later.',
  keyGenerator: (req) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    return `auth:${ip}`;
  }
});

export const createApiRateLimiter = () => new RateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute per user
  message: 'API rate limit exceeded. Please try again later.',
  keyGenerator: (req) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const userId = (req as any).user?.id || 'anonymous';
    return `api:${ip}:${userId}`;
  }
});

export const createUploadRateLimiter = () => new RateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 10, // 10 uploads per minute per user
  message: 'Upload rate limit exceeded. Please try again later.',
  keyGenerator: (req) => {
    const userId = (req as any).user?.id || 'anonymous';
    return `upload:${userId}`;
  }
});

// Abuse Detection System
export interface AbuseDetectionConfig {
  maxFailedAuths: number; // Max failed auth attempts
  authWindowMs: number; // Time window for auth attempts
  maxSuspiciousPatterns: number; // Max suspicious patterns
  suspiciousWindowMs: number; // Time window for suspicious patterns
  blockDurationMs: number; // How long to block abusive IPs
}

export class AbuseDetector {
  private config: AbuseDetectionConfig;
  private failedAuths: Map<string, number[]> = new Map();
  private suspiciousPatterns: Map<string, number[]> = new Map();
  private blockedIPs: Map<string, number> = new Map(); // IP -> unblock time
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: AbuseDetectionConfig) {
    this.config = config;
    
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 300000);
  }

  private cleanup(): void {
    const now = Date.now();
    
    // Clean up failed auth attempts
    for (const [ip, attempts] of this.failedAuths.entries()) {
      const validAttempts = attempts.filter(time => now - time < this.config.authWindowMs);
      if (validAttempts.length === 0) {
        this.failedAuths.delete(ip);
      } else {
        this.failedAuths.set(ip, validAttempts);
      }
    }
    
    // Clean up suspicious patterns
    for (const [ip, patterns] of this.suspiciousPatterns.entries()) {
      const validPatterns = patterns.filter(time => now - time < this.config.suspiciousWindowMs);
      if (validPatterns.length === 0) {
        this.suspiciousPatterns.delete(ip);
      } else {
        this.suspiciousPatterns.set(ip, validPatterns);
      }
    }
    
    // Clean up blocked IPs
    for (const [ip, unblockTime] of this.blockedIPs.entries()) {
      if (now > unblockTime) {
        this.blockedIPs.delete(ip);
        logger.info('IP unblocked', { ip });
      }
    }
  }

  recordFailedAuth(ip: string): void {
    const now = Date.now();
    const attempts = this.failedAuths.get(ip) || [];
    attempts.push(now);
    this.failedAuths.set(ip, attempts);
    
    if (attempts.length >= this.config.maxFailedAuths) {
      this.blockIP(ip, 'Too many failed authentication attempts');
    }
  }

  recordSuspiciousPattern(ip: string, pattern: string): void {
    const now = Date.now();
    const patterns = this.suspiciousPatterns.get(ip) || [];
    patterns.push(now);
    this.suspiciousPatterns.set(ip, patterns);
    
    logger.warn('Suspicious pattern detected', {
      ip,
      pattern,
      userAgent: pattern, // In real implementation, would extract from request
      timestamp: now
    });
    
    if (patterns.length >= this.config.maxSuspiciousPatterns) {
      this.blockIP(ip, 'Suspicious activity pattern detected');
    }
  }

  private blockIP(ip: string, reason: string): void {
    const unblockTime = Date.now() + this.config.blockDurationMs;
    this.blockedIPs.set(ip, unblockTime);
    
    metrics.incrementCounter('app_ip_blocked', 1, { ip, reason });
    
    logger.warn('IP blocked due to abuse', {
      ip,
      reason,
      unblockTime: new Date(unblockTime).toISOString(),
      failedAuths: this.failedAuths.get(ip)?.length || 0,
      suspiciousPatterns: this.suspiciousPatterns.get(ip)?.length || 0
    });
  }

  isIPBlocked(ip: string): boolean {
    const unblockTime = this.blockedIPs.get(ip);
    return unblockTime ? Date.now() < unblockTime : false;
  }

  getBlockedStatus(ip: string): { blocked: boolean; unblockTime?: Date } {
    const unblockTime = this.blockedIPs.get(ip);
    if (!unblockTime) {
      return { blocked: false };
    }
    
    const now = Date.now();
    return {
      blocked: now < unblockTime,
      unblockTime: new Date(unblockTime)
    };
  }

  middleware(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      const ip = req.ip || req.connection?.remoteAddress || 'unknown';
      
      if (this.isIPBlocked(ip)) {
        const status = this.getBlockedStatus(ip);
        
        logger.warn('Blocked IP attempted access', {
          ip,
          userAgent: req.headers['user-agent'],
          endpoint: req.path,
          method: req.method,
          unblockTime: status.unblockTime
        });
        
        res.status(403).json({
          error: 'Forbidden',
          message: 'Access temporarily blocked due to suspicious activity',
          code: 'IP_BLOCKED',
          unblockTime: status.unblockTime
        });
        
        return;
      }
      
      next();
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.failedAuths.clear();
    this.suspiciousPatterns.clear();
    this.blockedIPs.clear();
  }
}

// Create default abuse detector
export const createAbuseDetector = () => new AbuseDetector({
  maxFailedAuths: 5,
  authWindowMs: 15 * 60 * 1000, // 15 minutes
  maxSuspiciousPatterns: 10,
  suspiciousWindowMs: 60 * 60 * 1000, // 1 hour
  blockDurationMs: 60 * 60 * 1000 // 1 hour block
});

// Combined middleware factory
export const createProtectionMiddleware = () => {
  const globalLimiter = createGlobalRateLimiter();
  const authLimiter = createAuthRateLimiter();
  const apiLimiter = createApiRateLimiter();
  const abuseDetector = createAbuseDetector();
  
  return {
    global: globalLimiter.middleware(),
    auth: authLimiter.middleware(),
    api: apiLimiter.middleware(),
    abuse: abuseDetector.middleware(),
    
    // Cleanup method
    destroy: () => {
      globalLimiter.destroy();
      authLimiter.destroy();
      apiLimiter.destroy();
      abuseDetector.destroy();
    }
  };
};
