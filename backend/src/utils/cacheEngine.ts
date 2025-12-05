import Redis from 'ioredis';
import { logger } from './logger.js';

/**
 * Redis caching engine with intelligent invalidation
 */
export class CacheEngine {
  private static redis: Redis;
  private static isConnected = false;
  
  /**
   * Initialize Redis connection
   */
  static async initialize() {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });
      
      this.redis.on('connect', () => {
        this.isConnected = true;
        logger.info({
          type: 'INFO',
          message: 'Redis connected',
          details: { host: process.env.REDIS_HOST || 'localhost' }
        });
      });
      
      this.redis.on('error', (error: Error) => {
        this.isConnected = false;
        logger.info({
          type: 'ERROR',
          message: 'Redis connection error',
          details: { error: error.message }
        });
      });
      
      await this.redis.connect();
    } catch (error) {
      logger.info({
        type: 'ERROR',
        message: 'Failed to initialize Redis',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      // Fallback to in-memory cache
      this.isConnected = false;
    }
  }
  
  /**
   * Get cached value
   */
  static async get(key: string): Promise<any> {
    if (!this.isConnected) return null;
    
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.info({
        type: 'ERROR',
        message: 'Cache get failed',
        details: { key, error: error instanceof Error ? error.message : 'Unknown error' }
      });
      return null;
    }
  }
  
  /**
   * Set cached value with TTL
   */
  static async set(key: string, value: any, ttl: number = 300): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.info({
        type: 'ERROR',
        message: 'Cache set failed',
        details: { key, ttl, error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }
  
  /**
   * Delete cached value
   */
  static async del(key: string): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.info({
        type: 'ERROR',
        message: 'Cache delete failed',
        details: { key, error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }
  
  /**
   * Delete multiple keys by pattern
   */
  static async delPattern(pattern: string): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.info({
          type: 'INFO',
          message: 'Cache pattern deleted',
          details: { pattern, deletedCount: keys.length }
        });
      }
    } catch (error) {
      logger.info({
        type: 'ERROR',
        message: 'Cache pattern delete failed',
        details: { pattern, error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }
  
  /**
   * Increment counter
   */
  static async incr(key: string): Promise<number> {
    if (!this.isConnected) return 0;
    
    try {
      return await this.redis.incr(key);
    } catch (error) {
      logger.info({
        type: 'ERROR',
        message: 'Cache increment failed',
        details: { key, error: error instanceof Error ? error.message : 'Unknown error' }
      });
      return 0;
    }
  }
  
  /**
   * Check if key exists
   */
  static async exists(key: string): Promise<boolean> {
    if (!this.isConnected) return false;
    
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.info({
        type: 'ERROR',
        message: 'Cache exists check failed',
        details: { key, error: error instanceof Error ? error.message : 'Unknown error' }
      });
      return false;
    }
  }
}

/**
 * Cache invalidation strategies
 */
export class CacheInvalidator {
  /**
   * Invalidate user-specific caches
   */
  static async invalidateUser(userId: string): Promise<void> {
    await CacheEngine.delPattern(`user:${userId}:*`);
    await CacheEngine.delPattern(`transactions:user:${userId}:*`);
    await CacheEngine.delPattern(`balances:user:${userId}:*`);
  }
  
  /**
   * Invalidate account-specific caches
   */
  static async invalidateAccount(accountId: string): Promise<void> {
    await CacheEngine.delPattern(`account:${accountId}:*`);
    await CacheEngine.delPattern(`balances:account:${accountId}:*`);
    await CacheEngine.delPattern(`transactions:account:${accountId}:*`);
  }
  
  /**
   * Invalidate transaction caches
   */
  static async invalidateTransaction(transactionId: string): Promise<void> {
    await CacheEngine.del(`transaction:${transactionId}`);
    await CacheEngine.delPattern(`transactions:*:${transactionId}:*`);
  }
  
  /**
   * Invalidate all financial data caches
   */
  static async invalidateFinancialData(): Promise<void> {
    await CacheEngine.delPattern('balances:*');
    await CacheEngine.delPattern('transactions:*');
    await CacheEngine.delPattern('reports:*');
  }
}

/**
 * Performance middleware for caching
 */
export class CacheMiddleware {
  /**
   * Cache middleware for API responses
   */
  static cacheResponse(ttl: number = 300) {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      const method = descriptor.value;
      
      descriptor.value = async function (...args: any[]) {
        const cacheKey = `${propertyName}:${JSON.stringify(args)}`;
        
        // Try to get from cache
        const cached = await CacheEngine.get(cacheKey);
        if (cached) {
          logger.info({
            type: 'INFO',
            message: 'Cache hit',
            details: { method: propertyName, cacheKey }
          });
          return cached;
        }
        
        // Execute method and cache result
        const result = await method.apply(this, args);
        await CacheEngine.set(cacheKey, result, ttl);
        
        logger.info({
          type: 'INFO',
          message: 'Cache miss - result cached',
          details: { method: propertyName, cacheKey, ttl }
        });
        
        return result;
      };
    };
  }
  
  /**
   * Rate limit cache
   */
  static async checkRateLimit(
    identifier: string,
    limit: number,
    window: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - (window * 1000);
    
    // Get current requests in window
    const requests = await CacheEngine.get(key) || [];
    const validRequests = requests.filter((timestamp: number) => timestamp > windowStart);
    
    if (validRequests.length >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: validRequests[0] + window * 1000
      };
    }
    
    // Add current request
    validRequests.push(now);
    await CacheEngine.set(key, validRequests, window);
    
    return {
      allowed: true,
      remaining: limit - validRequests.length,
      resetTime: now + window * 1000
    };
  }
}
