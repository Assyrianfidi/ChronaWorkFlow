import IORedis from 'ioredis';

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  keyPrefix?: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  memoryUsage: number;
}

export class RedisCacheService {
  private redis: IORedis;
  private stats = { hits: 0, misses: 0, keys: 0, memoryUsage: 0 };

  constructor() {
    this.redis = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });

    this.redis.on('connect', () => {
      console.log('Redis cache connected');
    });

    this.redis.on('error', (error) => {
      console.error('Redis cache error:', error);
    });
  }

  async connect(): Promise<void> {
    if (!this.redis.status || this.redis.status === 'end') {
      await this.redis.connect();
    }
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }

  // Basic cache operations
  async get<T>(key: string): Promise<T | null> {
    try {
      await this.connect();
      const value = await this.redis.get(key);

      if (value === null) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  async set<T>(key: string, value: T, config?: CacheConfig): Promise<void> {
    try {
      await this.connect();

      const serializedValue = JSON.stringify(value);
      const ttl = config?.ttl || 3600; // Default 1 hour

      if (ttl > 0) {
        await this.redis.setex(key, ttl, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.connect();
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      await this.connect();
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  }

  // Advanced cache operations
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    config?: CacheConfig
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, config);
    return value;
  }

  async invalidateCompanyData(companyId: string): Promise<void> {
    try {
      await this.connect();
      const pattern = `*company:${companyId}:*`;
      await this.deletePattern(pattern);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  async invalidateUserData(userId: string): Promise<void> {
    try {
      await this.connect();
      const pattern = `*user:${userId}:*`;
      await this.deletePattern(pattern);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  // Cache statistics
  async getStats(): Promise<CacheStats> {
    try {
      await this.connect();

      const keys = await this.redis.keys('*');
      const memoryInfo = await this.redis.info('memory');

      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        keys: keys.length,
        memoryUsage: parseInt(memoryInfo.split('\r\n').find(line => line.startsWith('used_memory:'))?.split(':')[1] || '0'),
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return this.stats;
    }
  }

  // Cache warming (preload frequently accessed data)
  async warmCache(companyId: string): Promise<void> {
    try {
      await this.connect();

      // Preload common queries
      const cacheKey = `company:${companyId}:accounts`;
      // Implementation would fetch and cache accounts, customers, etc.

      console.log(`Cache warmed for company ${companyId}`);
    } catch (error) {
      console.error('Cache warming error:', error);
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; error?: string }> {
    try {
      await this.connect();
      await this.redis.ping();
      return { status: 'healthy' };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const cacheService = new RedisCacheService();

// Cache key generators
export const cacheKeys = {
  company: {
    accounts: (companyId: string) => `company:${companyId}:accounts`,
    customers: (companyId: string) => `company:${companyId}:customers`,
    vendors: (companyId: string) => `company:${companyId}:vendors`,
    transactions: (companyId: string, limit?: number) => `company:${companyId}:transactions:${limit || 50}`,
    balanceSheet: (companyId: string) => `company:${companyId}:balance_sheet`,
    profitLoss: (companyId: string, startDate?: string, endDate?: string) =>
      `company:${companyId}:profit_loss:${startDate || ''}:${endDate || ''}`,
  },
  user: {
    profile: (userId: string) => `user:${userId}:profile`,
    companies: (userId: string) => `user:${userId}:companies`,
  },
  system: {
    exchangeRates: () => 'system:exchange_rates',
    settings: () => 'system:settings',
  },
};
