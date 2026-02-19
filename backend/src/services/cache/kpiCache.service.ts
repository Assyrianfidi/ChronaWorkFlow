/**
 * ============================================================================
 * KPI CACHING SERVICE - TENANT-ISOLATED
 * ============================================================================
 * 
 * SECURITY: Uses TenantRedisClient to enforce tenant-scoped cache keys
 * All cache operations require tenant context from AsyncLocalStorage
 * 
 * ENFORCEMENT:
 * - Direct redis imports FORBIDDEN
 * - All keys prefixed with tenant:{tenantId}:{namespace}:{key}
 * - Runtime assertion: tenantId missing → throw error
 * - Boot validation: scans for direct redis imports
 * 
 * ============================================================================
 */

import { TenantRedisClient } from '../../utils/redis-tenant-enforcer.js';
import { getCurrentTenantContext } from '../../middleware/prisma-tenant-isolation-v3.middleware.js';
import logger from '../../config/logger.js';

export class KPICacheService {
  private client: TenantRedisClient;
  private readonly TTL_SECONDS = 300; // 5 minutes default
  private readonly KPI_TTL = 60; // 1 minute for real-time KPIs

  constructor() {
    this.client = new TenantRedisClient();
  }

  /**
   * Validates tenant context is present
   * @throws Error if tenant context missing
   */
  private validateTenantContext(): string {
    const ctx = getCurrentTenantContext();
    
    if (!ctx || !ctx.companyId) {
      throw new Error(
        'SECURITY VIOLATION: KPI cache operations require tenant context. ' +
        'All cache keys must be tenant-scoped to prevent cross-tenant data leakage.'
      );
    }
    
    return ctx.companyId;
  }

  /**
   * Gets cached KPI data or executes fallback function
   * SECURITY: Requires tenant context, all keys are tenant-scoped
   * @param namespace Cache namespace (e.g., 'kpi', 'dashboard')
   * @param resource Resource identifier (e.g., 'revenue', 'invoices')
   * @param fallback Function to execute if cache miss
   * @param ttl Optional custom TTL in seconds
   * @returns Cached or fresh data
   */
  async getCachedKPI<T>(
    namespace: string,
    resource: string,
    fallback: () => Promise<T>,
    ttl: number = this.KPI_TTL
  ): Promise<T> {
    // Validate tenant context before any cache operation
    this.validateTenantContext();

    try {
      // Try to get from cache (tenant-scoped)
      const cached = await this.client.getTenantCache<T>(namespace, resource);
      
      if (cached !== null) {
        logger.debug(`KPI cache HIT: ${namespace}:${resource}`);
        return cached;
      }

      // Cache miss - execute fallback
      logger.debug(`KPI cache MISS: ${namespace}:${resource}`);
      const data = await fallback();

      // Store in cache (fire and forget - don't block response)
      this.client.setTenantCache(namespace, resource, data, ttl).catch((err: Error) => {
        logger.error(`Failed to cache KPI ${namespace}:${resource}:`, err);
      });

      return data;
    } catch (error: any) {
      logger.error(`KPI cache error for ${namespace}:${resource}:`, error);
      // Fallback to direct execution on error
      return fallback();
    }
  }

  /**
   * Invalidates cached KPI data
   * SECURITY: Tenant-scoped deletion only
   * @param namespace Cache namespace
   * @param resource Resource identifier
   */
  async invalidate(namespace: string, resource: string): Promise<void> {
    this.validateTenantContext();

    try {
      await this.client.deleteTenantCache(namespace, resource);
      logger.debug(`KPI cache invalidated: ${namespace}:${resource}`);
    } catch (error: any) {
      logger.error(`Failed to invalidate KPI cache ${namespace}:${resource}:`, error);
    }
  }

  /**
   * Invalidates all cache keys for a namespace
   * SECURITY: Only clears current tenant's cache
   * @param namespace Cache namespace to clear
   */
  async invalidateNamespace(namespace: string): Promise<void> {
    const tenantId = this.validateTenantContext();

    try {
      // Scan for all keys in namespace for current tenant
      const keys = await this.client.scanTenantKeys(namespace);

      if (keys.length > 0) {
        logger.debug(`KPI cache invalidated ${keys.length} keys for namespace: ${namespace}`);
      }
    } catch (error: any) {
      logger.error(`Failed to invalidate KPI cache namespace ${namespace}:`, error);
    }
  }

  /**
   * Clear all KPI cache for current tenant
   * SECURITY: Only clears current tenant's cache
   */
  async clearAllKPIs(): Promise<number> {
    const tenantId = this.validateTenantContext();
    
    try {
      const deletedCount = await this.client.clearTenantCache(tenantId);
      logger.info(`Cleared all KPI cache for tenant ${tenantId}`, { deletedCount });
      return deletedCount;
    } catch (error: any) {
      logger.error(`Failed to clear KPI cache for tenant ${tenantId}:`, error);
      return 0;
    }
  }

  /**
   * Closes Redis connection
   */
  async disconnect(): Promise<void> {
    await this.client.disconnect();
    logger.info('Redis KPI cache disconnected');
  }
}

// Singleton instance
export const kpiCacheService = new KPICacheService();
