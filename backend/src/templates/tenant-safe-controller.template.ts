/**
 * ============================================================================
 * TEMPLATE: Tenant-Safe Controller Pattern
 * ============================================================================
 * 
 * This template demonstrates the V4 pattern for creating tenant-safe controllers.
 * 
 * KEY PRINCIPLES:
 * 1. Always validate tenant context exists
 * 2. NEVER accept tenantId from request body/params/query
 * 3. Extract tenantId from JWT only (via middleware)
 * 4. Delegate all logic to service layer
 * 5. Handle errors properly
 * 
 * COPY THIS TEMPLATE for new controllers.
 * ============================================================================
 */

import { Request, Response, NextFunction } from 'express';
import { getCurrentTenantContext } from '../middleware/prisma-tenant-isolation-v3.middleware.js';
import { AppError } from '../middleware/error.middleware.js';
import { logger } from '../utils/logger.js';
// import { tenantSafeService } from '../services/your-service.js'; // TODO: Replace with actual service

/**
 * Authenticated request with user context
 */
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: any; // Use any to avoid Prisma Role type conflicts in template
    currentCompanyId?: string;
  };
}

export class TenantSafeController {
  /**
   * REQUIRED: Validate tenant context
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
   * GET /api/resources?status=active
   */
  async getResources(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // ✅ Validate tenant context
      this.validateTenantContext();

      // Extract filters from query (NOT including tenantId)
      const { status, search, page, limit } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (search) filters.name = { contains: search as string };

      // Service handles tenant scoping automatically
      const resources = await tenantSafeService.getResources(filters);

      res.status(200).json({
        success: true,
        data: resources,
      });
    } catch (error: any) {
      logger.error('Controller error: getResources', { error: (error as Error).message });
      next(error);
    }
  }

  /**
   * Example: Get single resource
   * 
   * GET /api/resources/:id
   */
  async getResourceById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      this.validateTenantContext();

      const { id } = req.params;

      if (!id) {
        throw new AppError('Resource ID is required', 400);
      }

      // Service auto-scopes to current tenant
      const resource = await tenantSafeService.getResourceById(id);

      res.status(200).json({
        success: true,
        data: resource,
      });
    } catch (error: any) {
      logger.error('Controller error: getResourceById', { error: (error as Error).message });
      next(error);
    }
  }

  /**
   * Example: Create resource
   * 
   * POST /api/resources
   * Body: { name, description }
   */
  async createResource(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ctx = this.validateTenantContext();

      // ❌ CRITICAL: Reject if tenant ID in body
      if (req.body.companyId || req.body.tenantId || req.body.organizationId) {
        throw new AppError('Tenant ID cannot be provided in request', 400);
      }

      // Validate required fields
      const { name, description, isActive } = req.body;

      if (!name) {
        throw new AppError('Name is required', 400);
      }

      // Service auto-injects companyId
      const resource = await tenantSafeService.createResource({
        name,
        description,
        isActive,
      });

      res.status(201).json({
        success: true,
        data: resource,
        message: 'Resource created successfully',
      });
    } catch (error: any) {
      logger.error('Controller error: createResource', { error: (error as Error).message });
      next(error);
    }
  }

  /**
   * Example: Update resource
   * 
   * PUT /api/resources/:id
   * Body: { name?, description?, isActive? }
   */
  async updateResource(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      this.validateTenantContext();

      const { id } = req.params;

      if (!id) {
        throw new AppError('Resource ID is required', 400);
      }

      // ❌ Reject if tenant ID in body
      if (req.body.companyId || req.body.tenantId) {
        throw new AppError('Tenant ID cannot be modified', 400);
      }

      // Extract update data
      const { name, description, isActive } = req.body;

      // Service auto-scopes to current tenant
      const resource = await tenantSafeService.updateResource(id, {
        name,
        description,
        isActive,
      });

      res.status(200).json({
        success: true,
        data: resource,
        message: 'Resource updated successfully',
      });
    } catch (error: any) {
      logger.error('Controller error: updateResource', { error: (error as Error).message });
      next(error);
    }
  }

  /**
   * Example: Delete resource
   * 
   * DELETE /api/resources/:id
   */
  async deleteResource(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      this.validateTenantContext();

      const { id } = req.params;

      if (!id) {
        throw new AppError('Resource ID is required', 400);
      }

      // Service auto-scopes to current tenant
      const result = await tenantSafeService.deleteResource(id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      logger.error('Controller error: deleteResource', { error: (error as Error).message });
      next(error);
    }
  }

  /**
   * Example: Get aggregated stats
   * 
   * GET /api/resources/stats
   */
  async getResourceStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      this.validateTenantContext();

      const stats = await tenantSafeService.getResourceStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Controller error: getResourceStats', { error: (error as Error).message });
      next(error);
    }
  }

  /**
   * Example: Batch operation
   * 
   * POST /api/resources/batch-delete
   * Body: { ids: string[] }
   */
  async batchDelete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      this.validateTenantContext();

      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new AppError('IDs array is required', 400);
      }

      // Process each deletion (auto-scoped)
      const results = await Promise.allSettled(
        ids.map((id: any) => tenantSafeService.deleteResource(id))
      );

      const successful = results.filter((r: any) => r.status === 'fulfilled').length;
      const failed = results.filter((r: any) => r.status === 'rejected').length;

      res.status(200).json({
        success: true,
        data: {
          successful,
          failed,
          total: ids.length,
        },
        message: `${successful} resources deleted, ${failed} failed`,
      });
    } catch (error: any) {
      logger.error('Controller error: batchDelete', { error: (error as Error).message });
      next(error);
    }
  }
}

export const tenantSafeController = new TenantSafeController();
