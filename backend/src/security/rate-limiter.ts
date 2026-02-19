/**
 * Rate Limiter Implementation
 * Simple token bucket rate limiter
 */

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (identifier: string) => string; // Custom key generator
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class RateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (id: string) => id,
      ...config,
    };

    // Clean up expired buckets periodically
    setInterval(() => {
      this.cleanup();
    }, this.config.windowMs);
  }

  /**
   * Check if a request is allowed
   */
  isAllowed(
    identifier: string,
    customConfig?: Partial<RateLimitConfig>,
  ): RateLimitResult {
    const key = this.config.keyGenerator!(identifier);
    const config = { ...this.config, ...customConfig };

    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = new TokenBucket(config.maxRequests, config.windowMs);
      this.buckets.set(key, bucket);
    }

    const result = bucket.consume();

    return {
      allowed: result.consumed > 0,
      remaining: result.remaining,
      resetTime: bucket.resetTime,
      retryAfter:
        result.consumed === 0
          ? Math.ceil(bucket.timeToRefill() / 1000)
          : undefined,
    };
  }

  /**
   * Get retry after time for identifier
   */
  getRetryAfter(identifier: string): number {
    const key = this.config.keyGenerator!(identifier);
    const bucket = this.buckets.get(key);

    if (!bucket) {
      return 0;
    }

    return Math.ceil(bucket.timeToRefill() / 1000);
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    const key = this.config.keyGenerator!(identifier);
    this.buckets.delete(key);
  }

  /**
   * Get current status for identifier
   */
  getStatus(
    identifier: string,
  ): { remaining: number; resetTime: number } | null {
    const key = this.config.keyGenerator!(identifier);
    const bucket = this.buckets.get(key);

    if (!bucket) {
      return null;
    }

    return {
      remaining: bucket.tokens,
      resetTime: bucket.resetTime,
    };
  }

  /**
   * Clean up expired buckets
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetTime <= now) {
        this.buckets.delete(key);
      }
    }
  }

  /**
   * Get statistics
   */
  getStats(): { totalBuckets: number; activeBuckets: number } {
    const now = Date.now();
    const activeBuckets = Array.from(this.buckets.values()).filter(
      (bucket: any) => bucket.resetTime > now,
    ).length;

    return {
      totalBuckets: this.buckets.size,
      activeBuckets,
    };
  }
}

/**
 * Token Bucket Implementation
 */
class TokenBucket {
  public tokens: number;
  public readonly maxTokens: number;
  public readonly refillRate: number; // tokens per millisecond
  public lastRefill: number;
  public readonly resetTime: number;

  constructor(maxTokens: number, windowMs: number) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRate = maxTokens / windowMs;
    this.lastRefill = Date.now();
    this.resetTime = this.lastRefill + windowMs;
  }

  /**
   * Consume tokens
   */
  consume(tokens: number = 1): { consumed: number; remaining: number } {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return { consumed: tokens, remaining: this.tokens };
    }

    const consumed = this.tokens;
    this.tokens = 0;
    return { consumed, remaining: 0 };
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;

    if (elapsed > 0) {
      const tokensToAdd = Math.min(
        elapsed * this.refillRate,
        this.maxTokens - this.tokens,
      );
      this.tokens += tokensToAdd;
      this.lastRefill = now;

      // Update reset time (make it mutable)
      (this as any).resetTime = now + this.maxTokens / this.refillRate;
    }
  }

  /**
   * Get time until next refill
   */
  timeToRefill(): number {
    if (this.tokens >= this.maxTokens) {
      return 0;
    }

    const tokensNeeded = this.maxTokens - this.tokens;
    return tokensNeeded / this.refillRate;
  }
}

export default RateLimiter;
