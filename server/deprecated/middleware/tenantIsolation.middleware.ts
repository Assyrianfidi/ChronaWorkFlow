/**
 * Multi-Tenant Isolation Enforcement
 * 
 * Guarantees absolute tenant isolation across the entire stack
 * Prevents cross-tenant data access at query level
 * Defensive checks at ORM/query builder level
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

/**
 * Tenant-scoped Prisma client
 * Automatically enforces tenant isolation on all queries
 */
export class TenantScopedPrisma {
  private prisma: PrismaClient;
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
    this.prisma = new PrismaClient();
  }

  /**
   * Get Prisma client with tenant isolation middleware
   */
  getClient(): PrismaClient {
    // Add middleware to automatically scope all queries by tenantId
    this.prisma.$use(async (params, next) => {
      // Models that should be tenant-scoped
      const tenantScopedModels = [
        'User',
        'AutomationRule',
        'AutomationExecution',
        'SmartInsight',
        'AutomationUsageMetric',
        'PaymentMethod',
        'Payment',
        'PaymentReconciliation',
        'PaymentExplainability',
        'CashControlRule',
        'CashControlExecution',
        'PaymentAnalytics',
        'FinancialForecast',
        'Scenario',
        'ScenarioAnalytics',
      ];

      if (tenantScopedModels.includes(params.model || '')) {
        // Add tenantId filter to all queries
        if (params.action === 'findUnique' || params.action === 'findFirst') {
          params.args.where = {
            ...params.args.where,
            tenantId: this.tenantId,
          };
        }

        if (params.action === 'findMany') {
          params.args.where = {
            ...params.args.where,
            tenantId: this.tenantId,
          };
        }

        if (params.action === 'count') {
          params.args.where = {
            ...params.args.where,
            tenantId: this.tenantId,
          };
        }

        if (params.action === 'aggregate') {
          params.args.where = {
            ...params.args.where,
            tenantId: this.tenantId,
          };
        }

        if (params.action === 'create') {
          params.args.data = {
            ...params.args.data,
            tenantId: this.tenantId,
          };
        }

        if (params.action === 'createMany') {
          if (Array.isArray(params.args.data)) {
            params.args.data = params.args.data.map((item: Record<string, unknown>) => ({
              ...item,
              tenantId: this.tenantId,
            }));
          }
        }

        if (params.action === 'update' || params.action === 'updateMany') {
          params.args.where = {
            ...params.args.where,
            tenantId: this.tenantId,
          };
        }

        if (params.action === 'delete' || params.action === 'deleteMany') {
          params.args.where = {
            ...params.args.where,
            tenantId: this.tenantId,
          };
        }

        if (params.action === 'upsert') {
          params.args.where = {
            ...params.args.where,
            tenantId: this.tenantId,
          };
          params.args.create = {
            ...params.args.create,
            tenantId: this.tenantId,
          };
        }
      }

      const result = await next(params);

      // Verify result belongs to correct tenant (defensive check)
      if (result && typeof result === 'object' && 'tenantId' in result) {
        if (result.tenantId !== this.tenantId) {
          console.error('TENANT ISOLATION VIOLATION DETECTED', {
            expectedTenantId: this.tenantId,
            actualTenantId: result.tenantId,
            model: params.model,
            action: params.action,
          });
          throw new Error('Tenant isolation violation');
        }
      }

      // Verify array results
      if (Array.isArray(result)) {
        for (const item of result) {
          if (item && typeof item === 'object' && 'tenantId' in item) {
            if (item.tenantId !== this.tenantId) {
              console.error('TENANT ISOLATION VIOLATION DETECTED IN ARRAY', {
                expectedTenantId: this.tenantId,
                actualTenantId: item.tenantId,
                model: params.model,
                action: params.action,
              });
              throw new Error('Tenant isolation violation');
            }
          }
        }
      }

      return result;
    });

    return this.prisma;
  }

  /**
   * Disconnect client
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

/**
 * Tenant isolation middleware
 * Attaches tenant-scoped Prisma client to request
 */
export interface TenantRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
  };
  tenantPrisma?: PrismaClient;
  tenantId?: string;
}

export function enforceTenantIsolation() {
  return async (req: TenantRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      // Attach tenant-scoped Prisma client to request
      const tenantScopedPrisma = new TenantScopedPrisma(req.user.tenantId);
      req.tenantPrisma = tenantScopedPrisma.getClient();
      req.tenantId = req.user.tenantId;

      // Verify tenant ID in params/body matches user's tenant
      const paramTenantId = req.params.tenantId;
      const bodyTenantId = (req.body as Record<string, unknown>)?.tenantId;

      if (paramTenantId && paramTenantId !== req.user.tenantId) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Access denied',
        });
        return;
      }

      if (bodyTenantId && bodyTenantId !== req.user.tenantId) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Access denied',
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Tenant isolation middleware error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Tenant isolation check failed',
      });
    }
  };
}

/**
 * Validate resource belongs to tenant
 */
export async function validateResourceTenant(
  prisma: PrismaClient,
  model: string,
  resourceId: string,
  tenantId: string
): Promise<boolean> {
  try {
    const resource = await (prisma as Record<string, { findUnique: (args: { where: { id: string } }) => Promise<{ tenantId?: string } | null> }>)[model].findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      return false;
    }

    return resource.tenantId === tenantId;
  } catch (error) {
    console.error('Resource tenant validation error:', error);
    return false;
  }
}

/**
 * Middleware: Validate resource ownership
 */
export function validateResourceOwnership(model: string, idParam: string = 'id') {
  return async (req: TenantRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      const resourceId = req.params[idParam];
      if (!resourceId) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Resource ID required',
        });
        return;
      }

      const prisma = new PrismaClient();
      const isValid = await validateResourceTenant(
        prisma,
        model,
        resourceId,
        req.user.tenantId
      );
      await prisma.$disconnect();

      if (!isValid) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Resource not found',
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Resource ownership validation error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Ownership validation failed',
      });
    }
  };
}

/**
 * Tenant isolation query helpers
 */
export class TenantQueryHelpers {
  /**
   * Build tenant-scoped where clause
   */
  static buildTenantWhere<T extends Record<string, unknown>>(
    tenantId: string,
    where?: T
  ): T & { tenantId: string } {
    return {
      ...where,
      tenantId,
    } as T & { tenantId: string };
  }

  /**
   * Build tenant-scoped create data
   */
  static buildTenantCreate<T extends Record<string, unknown>>(
    tenantId: string,
    data: T
  ): T & { tenantId: string } {
    return {
      ...data,
      tenantId,
    };
  }

  /**
   * Verify query result belongs to tenant
   */
  static verifyTenantOwnership<T extends { tenantId?: string }>(
    result: T | null,
    tenantId: string
  ): T | null {
    if (!result) {
      return null;
    }

    if (result.tenantId !== tenantId) {
      console.error('TENANT OWNERSHIP VERIFICATION FAILED', {
        expectedTenantId: tenantId,
        actualTenantId: result.tenantId,
      });
      throw new Error('Tenant ownership verification failed');
    }

    return result;
  }

  /**
   * Verify array results belong to tenant
   */
  static verifyTenantOwnershipArray<T extends { tenantId?: string }>(
    results: T[],
    tenantId: string
  ): T[] {
    for (const result of results) {
      if (result.tenantId !== tenantId) {
        console.error('TENANT OWNERSHIP VERIFICATION FAILED IN ARRAY', {
          expectedTenantId: tenantId,
          actualTenantId: result.tenantId,
        });
        throw new Error('Tenant ownership verification failed');
      }
    }

    return results;
  }
}

/**
 * Logging for tenant boundary violations
 */
export function logTenantViolation(context: {
  userId: string;
  userTenantId: string;
  attemptedTenantId: string;
  resource: string;
  action: string;
  ip?: string;
}): void {
  console.error('TENANT BOUNDARY VIOLATION ATTEMPT', {
    timestamp: new Date().toISOString(),
    severity: 'CRITICAL',
    ...context,
  });

  // In production, send alert to security monitoring system
  // e.g., Sentry, DataDog, CloudWatch, etc.
}

/**
 * Example usage:
 * 
 * // In route handler
 * router.get('/automations/:id',
 *   enforceTenantIsolation(),
 *   validateResourceOwnership('automationRule', 'id'),
 *   async (req: TenantRequest, res) => {
 *     const automation = await req.tenantPrisma!.automationRule.findUnique({
 *       where: { id: req.params.id }
 *     });
 *     res.json(automation);
 *   }
 * );
 * 
 * // Using query helpers
 * const automations = await prisma.automationRule.findMany({
 *   where: TenantQueryHelpers.buildTenantWhere(tenantId, { isActive: true })
 * });
 */
