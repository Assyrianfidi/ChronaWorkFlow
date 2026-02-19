/**
 * ============================================================================
 * REDIS TENANT ENFORCEMENT UTILITY
 * ============================================================================
 * 
 * Ensures ALL cache keys are tenant-scoped to prevent cache poisoning and
 * cross-tenant data leaks.
 * 
 * REQUIRED FORMAT: namespace:tenant_<companyId>:resource
 * 
 * Usage:
 *   const redis = new TenantRedisClient();
 *   await redis.setTenantCache('dashboard', 'financial', data, 300);
 *   const data = await redis.getTenantCache('dashboard', 'financial');
 * 
 * ============================================================================
 */

import Redis from 'ioredis';
import { getCurrentTenantContext, TenantContext } from '../middleware/prisma-tenant-isolation-v3.middleware.js';
import { logger } from './logger.js';

export class TenantRedisClient {
  private client: any;

  constructor(config?: any) {
    this.client = new (Redis as any)({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
      ...config,
    });

    this.client.on('error', (err: any) => {
      logger.error('Redis tenant client error', { error: err.message });
    });
  }

  /**
   * Build tenant-scoped cache key
   */
  private buildKey(namespace: string, resource: string, companyId?: string): string {
    const ctx = getCurrentTenantContext();
    const tenantId = companyId || ctx?.companyId;

    if (!tenantId) {
      throw new Error(
        'REDIS ENFORCEMENT ERROR: Tenant context missing. ' +
        'Cannot create cache key without tenant ID.'
      );
    }

    // Validate namespace and resource (no colons allowed)
    if (namespace.includes(':') || resource.includes(':')) {
      throw new Error('Namespace and resource cannot contain colons');
    }

    const key = `${namespace}:tenant_${tenantId}:${resource}`;
    
    // Validate key format
    this.validateKey(key);
    
    return key;
  }

  /**
   * Validate cache key follows tenant-scoped format
   */
  private validateKey(key: string): void {
    const pattern = /^[a-zA-Z0-9_-]+:tenant_[a-zA-Z0-9_-]+:[a-zA-Z0-9_:-]+$/;
    
    if (!pattern.test(key)) {
      logger.error('INVALID CACHE KEY DETECTED', {
        key,
        pattern: 'namespace:tenant_<id>:resource',
        timestamp: new Date().toISOString(),
      });

      throw new Error(
        `REDIS ENFORCEMENT ERROR: Invalid cache key format: "${key}". ` +
        `Required: namespace:tenant_<id>:resource`
      );
    }

    // Additional check: ensure key contains "tenant_"
    if (!key.includes(':tenant_')) {
      throw new Error(
        `REDIS ENFORCEMENT ERROR: Cache key missing tenant scope: "${key}"`
      );
    }
  }

  /**
   * Set tenant-scoped cache with TTL
   */
  async setTenantCache(
    namespace: string,
    resource: string,
    value: any,
    ttlSeconds?: number,
    companyId?: string
  ): Promise<void> {
    const key = this.buildKey(namespace, resource, companyId);
    const serialized = JSON.stringify(value);

    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, serialized);
    } else {
      await this.client.set(key, serialized);
    }

    logger.debug('Cache SET (tenant-scoped)', { key, ttl: ttlSeconds });
  }

  /**
   * Get tenant-scoped cache
   */
  async getTenantCache<T = any>(
    namespace: string,
    resource: string,
    companyId?: string
  ): Promise<T | null> {
    const key = this.buildKey(namespace, resource, companyId);
    const value = await this.client.get(key);

    if (!value) {
      logger.debug('Cache MISS (tenant-scoped)', { key });
      return null;
    }

    logger.debug('Cache HIT (tenant-scoped)', { key });
    return JSON.parse(value) as T;
  }

  /**
   * Delete tenant-scoped cache
   */
  async deleteTenantCache(
    namespace: string,
    resource: string,
    companyId?: string
  ): Promise<void> {
    const key = this.buildKey(namespace, resource, companyId);
    await this.client.del(key);
    logger.debug('Cache DEL (tenant-scoped)', { key });
  }

  /**
   * Clear all cache for a specific tenant
   */
  async clearTenantCache(companyId: string): Promise<number> {
    const pattern = `*:tenant_${companyId}:*`;
    const keys = await this.client.keys(pattern);

    if (keys.length === 0) {
      return 0;
    }

    await this.client.del(...keys);
    logger.info('Cleared tenant cache', { companyId, keysDeleted: keys.length });
    return keys.length;
  }

  /**
   * Check if key exists (tenant-scoped)
   */
  async existsTenantCache(
    namespace: string,
    resource: string,
    companyId?: string
  ): Promise<boolean> {
    const key = this.buildKey(namespace, resource, companyId);
    const exists = await this.client.exists(key);
    return exists === 1;
  }

  /**
   * Set cache with custom expiration (tenant-scoped)
   */
  async setTenantCacheEx(
    namespace: string,
    resource: string,
    value: any,
    expiresAt: Date,
    companyId?: string
  ): Promise<void> {
    const key = this.buildKey(namespace, resource, companyId);
    const ttl = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

    if (ttl <= 0) {
      throw new Error('Expiration time must be in the future');
    }

    await this.setTenantCache(namespace, resource, value, ttl, companyId);
  }

  /**
   * Increment counter (tenant-scoped)
   */
  async incrementTenantCounter(
    namespace: string,
    resource: string,
    amount: number = 1,
    companyId?: string
  ): Promise<number> {
    const key = this.buildKey(namespace, resource, companyId);
    return await this.client.incrby(key, amount);
  }

  /**
   * Get TTL for tenant-scoped key
   */
  async getTenantCacheTTL(
    namespace: string,
    resource: string,
    companyId?: string
  ): Promise<number> {
    const key = this.buildKey(namespace, resource, companyId);
    return await this.client.ttl(key);
  }

  /**
   * Scan all keys for current tenant
   */
  async scanTenantKeys(
    namespace?: string,
    companyId?: string
  ): Promise<string[]> {
    const ctx = getCurrentTenantContext();
    const tenantId = companyId || ctx?.companyId;

    if (!tenantId) {
      throw new Error('Tenant context required for scan operation');
    }

    const pattern = namespace 
      ? `${namespace}:tenant_${tenantId}:*`
      : `*:tenant_${tenantId}:*`;

    const keys: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, matchedKeys] = await this.client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = nextCursor;
      keys.push(...matchedKeys);
    } while (cursor !== '0');

    return keys;
  }

  /**
   * Validate that NO global cache keys exist (for testing)
   */
  async auditCacheKeys(): Promise<{
    valid: number;
    invalid: string[];
    total: number;
  }> {
    const allKeys = await this.client.keys('*');
    const invalidKeys: string[] = [];

    for (const key of allKeys) {
      try {
        this.validateKey(key);
      } catch (error: any) {
        invalidKeys.push(key);
      }
    }

    return {
      valid: allKeys.length - invalidKeys.length,
      invalid: invalidKeys,
      total: allKeys.length,
    };
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}

/**
 * Singleton instance for convenience
 */
let globalRedisClient: TenantRedisClient | null = null;

export function getRedisClient(): TenantRedisClient {
  if (!globalRedisClient) {
    globalRedisClient = new TenantRedisClient();
  }
  return globalRedisClient;
}
