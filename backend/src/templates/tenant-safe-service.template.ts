/**
 * ============================================================================
 * TEMPLATE: Tenant-Safe Service Pattern
 * ============================================================================
 * 
 * This template demonstrates the V4 pattern for creating tenant-safe services.
 * 
 * KEY PRINCIPLES:
 * 1. Always validate tenant context before operations
 * 2. Rely on Prisma auto-injection (no manual where: { companyId })
 * 3. Use TenantRedisClient for caching
 * 4. Never accept tenantId from external input
 * 5. Audit all critical operations
 * 
 * COPY THIS TEMPLATE for new services.
 * ============================================================================
 */

import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import { getCurrentTenantContext } from '../middleware/prisma-tenant-isolation-v3.middleware.js';
import { TenantRedisClient } from '../utils/redis-tenant-enforcer.js';
import { AppError } from '../middleware/error.middleware.js';

export class TenantSafeService {
  private redis: TenantRedisClient;
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor() {
    this.redis = new TenantRedisClient();
  }

  /**
   * REQUIRED: Validate tenant context exists
   * Call this at the start of every method
   */
  private validateTenantContext() {
    const ctx = getCurrentTenantContext();
    if (!ctx?.companyId) {
      throw new AppError('No tenant context available', 403);
    }
    return ctx;
  }

  /**
   * Example: Get list of resources
   * 
   * ✅ NO manual where: { companyId } needed
   * ✅ Prisma auto-injects companyId filter
   */
  async getResources(filters?: any) {
    this.validateTenantContext();

    try {
      // Check cache first
      const cacheKey = `resources:list:${JSON.stringify(filters || {})}`;
      const cached = await this.redis.getTenantCache('service', cacheKey);
      if (cached) return cached;

      // ✅ Auto-injection: Prisma adds where: { companyId: ctx.companyId }
      const resources = await prisma.yourModel.findMany({
        where: {
          ...filters,
          // ❌ DO NOT ADD: companyId: ctx.companyId (auto-injected)
        },
        include: {
          relatedModel: true,
        },
      });

      // Cache result
      await this.redis.setTenantCache('service', cacheKey, resources, this.CACHE_TTL);

      return resources;
    } catch (error: any) {
      logger.error('Error getting resources', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Example: Get single resource by ID
   * 
   * ✅ Auto-injection ensures only current tenant's resource returned
   */
  async getResourceById(id: string) {
    this.validateTenantContext();

    try {
      // ✅ Auto-injection: Prisma adds where: { id, companyId: ctx.companyId }
      const resource = await prisma.yourModel.findUnique({
        where: { id },
        include: {
          relatedModel: true,
        },
      });

      if (!resource) {
        throw new AppError('Resource not found', 404);
      }

      return resource;
    } catch (error: any) {
      logger.error('Error getting resource', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Example: Create new resource
   * 
   * ✅ companyId auto-injected in data
   * ❌ NEVER accept companyId from input
   */
  async createResource(data: CreateResourceInput) {
    const ctx = this.validateTenantContext();

    try {
      // Validate input doesn't contain tenant fields
      if ('companyId' in data || 'tenantId' in data) {
        throw new AppError('Tenant ID cannot be provided in input', 400);
      }

      // ✅ Auto-injection: Prisma adds companyId to data
      const resource = await prisma.yourModel.create({
        data: {
          ...data,
          // ❌ DO NOT ADD: companyId: ctx.companyId (auto-injected)
        },
        include: {
          relatedModel: true,
        },
      });

      // Audit log
      await this.auditLog(ctx, 'RESOURCE_CREATED', { resourceId: resource.id });

      // Clear cache
      await this.redis.deleteTenantCache('service', 'resources:list:{}');

      return resource;
    } catch (error: any) {
      logger.error('Error creating resource', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Example: Update resource
   * 
   * ✅ Auto-injection ensures only current tenant's resource updated
   */
  async updateResource(id: string, data: UpdateResourceInput) {
    const ctx = this.validateTenantContext();

    try {
      // Validate resource exists and belongs to tenant (auto-scoped)
      const existing = await this.getResourceById(id);

      // ✅ Auto-injection: Prisma adds where: { id, companyId: ctx.companyId }
      const resource = await prisma.yourModel.update({
        where: { id },
        data: {
          ...data,
        },
        include: {
          relatedModel: true,
        },
      });

      // Audit log
      await this.auditLog(ctx, 'RESOURCE_UPDATED', { resourceId: id, changes: data });

      // Clear cache
      await this.redis.deleteTenantCache('service', 'resources:list:{}');

      return resource;
    } catch (error: any) {
      logger.error('Error updating resource', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Example: Delete resource
   * 
   * ✅ Auto-injection ensures only current tenant's resource deleted
   */
  async deleteResource(id: string) {
    const ctx = this.validateTenantContext();

    try {
      // Validate resource exists (auto-scoped)
      await this.getResourceById(id);

      // ✅ Auto-injection: Prisma adds where: { id, companyId: ctx.companyId }
      await prisma.yourModel.delete({
        where: { id },
      });

      // Audit log
      await this.auditLog(ctx, 'RESOURCE_DELETED', { resourceId: id });

      // Clear cache
      await this.redis.deleteTenantCache('service', 'resources:list:{}');

      return { success: true, message: 'Resource deleted successfully' };
    } catch (error: any) {
      logger.error('Error deleting resource', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Example: Aggregate query
   * 
   * ✅ Auto-injection applies to aggregates too
   */
  async getResourceStats() {
    this.validateTenantContext();

    try {
      const cached = await this.redis.getTenantCache('service', 'stats');
      if (cached) return cached;

      // ✅ Auto-injection: Prisma adds where: { companyId: ctx.companyId }
      const [total, active, inactive] = await Promise.all([
        prisma.yourModel.count(),
        prisma.yourModel.count({ where: { isActive: true } }),
        prisma.yourModel.count({ where: { isActive: false } }),
      ]);

      const stats = { total, active, inactive };

      await this.redis.setTenantCache('service', 'stats', stats, this.CACHE_TTL);

      return stats;
    } catch (error: any) {
      logger.error('Error getting stats', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Helper: Audit log (auto-scoped to tenant)
   */
  private async auditLog(ctx: any, action: string, details: any) {
    try {
      // ✅ Auto-injection: Prisma adds organizationId
      await prisma.audit_logs.create({
        data: {
          action,
          userId: ctx.userId || 0,
          organizationId: ctx.companyId,
          details,
          timestamp: new Date(),
        },
      });
    } catch (error: any) {
      logger.error('Audit log failed', { error: (error as Error).message });
      // Don't throw - audit failure shouldn't block operation
    }
  }
}

/**
 * TYPE DEFINITIONS
 */
interface CreateResourceInput {
  name: string;
  description?: string;
  isActive?: boolean;
  // ❌ NEVER include: companyId or tenantId
}

interface UpdateResourceInput {
  name?: string;
  description?: string;
  isActive?: boolean;
  // ❌ NEVER include: companyId or tenantId
}

export const tenantSafeService = new TenantSafeService();
