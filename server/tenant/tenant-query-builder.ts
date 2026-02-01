// CRITICAL: Database-Level Tenant Isolation Enforcement
// MANDATORY: Prevents ALL cross-tenant data access at database layer

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/structured-logger.js';

export interface TenantScopedQuery {
  tenantId: string;
  userId: string;
  requestId: string;
}

export interface QueryOptions {
  enforceTenantScope: boolean;
  allowCrossTenant: boolean;
  requireTenantId: boolean;
}

export class TenantIsolatedQueryBuilder {
  private prisma: PrismaClient;
  private tenantContext: TenantScopedQuery;
  private options: QueryOptions;

  constructor(
    prisma: PrismaClient,
    tenantContext: TenantScopedQuery,
    options: Partial<QueryOptions> = {}
  ) {
    this.prisma = prisma;
    this.tenantContext = tenantContext;
    this.options = {
      enforceTenantScope: true,
      allowCrossTenant: false,
      requireTenantId: true,
      ...options
    };
  }

  /**
   * CRITICAL: Create tenant-scoped Prisma client with mandatory tenant filtering
   */
  get scopedClient(): PrismaClient {
    if (!this.options.enforceTenantScope) {
      logger.warn('Tenant scope enforcement disabled', {
        tenantId: this.tenantContext.tenantId,
        userId: this.tenantContext.userId,
        requestId: this.tenantContext.requestId
      });
      return this.prisma;
    }

    // Create a proxy that intercepts all Prisma operations
    return new Proxy(this.prisma, {
      get: (target, prop) => {
        const value = target[prop as keyof PrismaClient];

        // Handle model operations (user, company, etc.)
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return this.createModelProxy(value as any);
        }

        // Handle direct operations like $queryRaw, $executeRaw
        if (typeof value === 'function' && (prop as string).startsWith('$')) {
          return this.createRawQueryProxy(value.bind(target));
        }

        return value;
      }
    }) as PrismaClient;
  }

  /**
   * CRITICAL: Create proxy for model operations with mandatory tenant filtering
   */
  private createModelProxy(model: any): any {
    return new Proxy(model, {
      get: (target, prop) => {
        const value = target[prop as keyof typeof target];

        // Handle query operations (findMany, findFirst, create, update, delete, etc.)
        if (typeof value === 'function') {
          return this.createOperationProxy(value.bind(target), prop as string);
        }

        return value;
      }
    });
  }

  /**
   * CRITICAL: Create proxy for database operations with tenant enforcement
   */
  private createOperationProxy(operation: Function, operationName: string): Function {
    return (...args: any[]) => {
      // CRITICAL: Validate tenant context before any operation
      this.validateTenantContext(operationName);

      // CRITICAL: Inject tenant filters for read operations
      if (this.isReadOperation(operationName)) {
        args = this.injectTenantFilters(args, operationName);
      }

      // CRITICAL: Validate tenant ownership for write operations
      if (this.isWriteOperation(operationName)) {
        this.validateWriteOperation(args, operationName);
      }

      // Execute the operation with tenant context
      return this.executeWithTenantContext(operation, args, operationName);
    };
  }

  /**
   * CRITICAL: Create proxy for raw queries with tenant validation
   */
  private createRawQueryProxy(operation: Function): Function {
    return (...args: any[]) => {
      // CRITICAL: Raw queries require explicit tenant scoping
      if (!this.options.allowCrossTenant) {
        this.validateRawQuery(args);
      }

      // Inject tenant context variables
      return this.executeRawQueryWithTenant(operation, args);
    };
  }

  /**
   * CRITICAL: Validate tenant context exists and is valid
   */
  private validateTenantContext(operationName: string): void {
    if (!this.tenantContext.tenantId) {
      const error = new Error('TENANT_CONTEXT_REQUIRED');
      logger.error('Tenant context missing for database operation', error as Error, {
        operationName,
        userId: this.tenantContext.userId,
        requestId: this.tenantContext.requestId
      });
      throw error;
    }

    if (!this.isValidTenantId(this.tenantContext.tenantId)) {
      const error = new Error('INVALID_TENANT_ID');
      logger.error('Invalid tenant ID for database operation', error as Error, {
        tenantId: this.tenantContext.tenantId,
        operationName,
        userId: this.tenantContext.userId,
        requestId: this.tenantContext.requestId
      });
      throw error;
    }
  }

  /**
   * CRITICAL: Validate tenant ID format
   */
  private isValidTenantId(tenantId: string): boolean {
    const tenantIdPattern = /^tn_[a-f0-9]{32}$/;
    return tenantIdPattern.test(tenantId);
  }

  /**
   * CRITICAL: Determine if operation is a read operation
   */
  private isReadOperation(operationName: string): boolean {
    const readOperations = ['findMany', 'findFirst', 'findUnique', 'count', 'aggregate', 'groupBy'];
    return readOperations.includes(operationName);
  }

  /**
   * CRITICAL: Determine if operation is a write operation
   */
  private isWriteOperation(operationName: string): boolean {
    const writeOperations = ['create', 'createMany', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert'];
    return writeOperations.includes(operationName);
  }

  /**
   * CRITICAL: Inject tenant filters into read operations
   */
  private injectTenantFilters(args: any[], operationName: string): any[] {
    if (args.length === 0) {
      // No arguments provided, inject tenant filter
      return [{ where: { tenantId: this.tenantContext.tenantId } }];
    }

    const firstArg = args[0];
    
    if (typeof firstArg === 'object' && firstArg !== null) {
      // Inject tenant_id into where clause
      if (firstArg.where) {
        if (Array.isArray(firstArg.where)) {
          // Handle OR conditions - ensure all have tenant filter
          firstArg.where = firstArg.where.map((condition: any) => ({
            ...condition,
            tenantId: this.tenantContext.tenantId
          }));
        } else {
          // Single where condition
          firstArg.where = {
            ...firstArg.where,
            tenantId: this.tenantContext.tenantId
          };
        }
      } else {
        // No where clause, add tenant filter
        firstArg.where = { tenantId: this.tenantContext.tenantId };
      }

      logger.debug('Tenant filter injected', {
        operationName,
        tenantId: this.tenantContext.tenantId,
        originalArgs: args.length,
        requestId: this.tenantContext.requestId
      });
    }

    return args;
  }

  /**
   * CRITICAL: Validate write operations for tenant ownership
   */
  private validateWriteOperation(args: any[], operationName: string): void {
    if (args.length === 0) return;

    const firstArg = args[0];
    
    if (typeof firstArg === 'object' && firstArg !== null) {
      // For create operations, ensure tenantId is set
      if (operationName === 'create' || operationName === 'createMany') {
        if (operationName === 'create') {
          if (!firstArg.data) {
            firstArg.data = {};
          }
          firstArg.data.tenantId = this.tenantContext.tenantId;
        } else if (operationName === 'createMany') {
          if (!firstArg.data) {
            firstArg.data = [];
          }
          if (Array.isArray(firstArg.data)) {
            firstArg.data = firstArg.data.map((item: any) => ({
              ...item,
              tenantId: this.tenantContext.tenantId
            }));
          }
        }
      }

      // For update/delete operations, ensure tenantId is in where clause
      if (['update', 'updateMany', 'delete', 'deleteMany', 'upsert'].includes(operationName)) {
        if (firstArg.where) {
          firstArg.where = {
            ...firstArg.where,
            tenantId: this.tenantContext.tenantId
          };
        } else {
          firstArg.where = { tenantId: this.tenantContext.tenantId };
        }
      }

      logger.debug('Write operation validated for tenant', {
        operationName,
        tenantId: this.tenantContext.tenantId,
        requestId: this.tenantContext.requestId
      });
    }
  }

  /**
   * CRITICAL: Execute operation with tenant context and logging
   */
  private async executeWithTenantContext(
    operation: Function,
    args: any[],
    operationName: string
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Set database session variables for this operation
      await this.setDatabaseSessionVariables();

      const result = await operation(...args);

      logger.debug('Database operation completed', {
        operationName,
        tenantId: this.tenantContext.tenantId,
        userId: this.tenantContext.userId,
        duration: Date.now() - startTime,
        requestId: this.tenantContext.requestId
      });

      return result;
    } catch (error) {
      logger.error('Database operation failed', error as Error, {
        operationName,
        tenantId: this.tenantContext.tenantId,
        userId: this.tenantContext.userId,
        duration: Date.now() - startTime,
        requestId: this.tenantContext.requestId
      });

      // Re-throw with tenant context for better error handling
      const tenantError = new Error(`TENANTANT_ISOLATION_ERROR: ${(error as Error).message}`);
      (tenantError as any).originalError = error;
      (tenantError as any).tenantId = this.tenantContext.tenantId;
      (tenantError as any).operationName = operationName;
      
      throw tenantError;
    }
  }

  /**
   * CRITICAL: Validate raw queries for tenant safety
   */
  private validateRawQuery(args: any[]): void {
    if (args.length === 0) return;

    const query = args[0];
    
    if (typeof query === 'string') {
      // CRITICAL: Check if query includes tenant filtering
      const hasTenantFilter = query.includes('tenant_id') || query.includes('tenantId');
      
      if (!hasTenantFilter) {
        const error = new Error('RAW_QUERY_MISSING_TENANT_FILTER');
        logger.error('Raw query missing tenant filter', error as Error, {
          query: query.substring(0, 200),
          tenantId: this.tenantContext.tenantId,
          userId: this.tenantContext.userId,
          requestId: this.tenantContext.requestId
        });
        throw error;
      }

      // CRITICAL: Check for dangerous operations
      const dangerousPatterns = [
        /DROP\s+TABLE/i,
        /DELETE\s+FROM/i,
        /UPDATE\s+.*SET/i,
        /INSERT\s+INTO/i
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(query)) {
          const error = new Error('RAW_QUERY_DANGEROUS_OPERATION');
          logger.error('Raw query contains dangerous operation', error as Error, {
            query: query.substring(0, 200),
            pattern: pattern.source,
            tenantId: this.tenantContext.tenantId,
            userId: this.tenantContext.userId,
            requestId: this.tenantContext.requestId
          });
          throw error;
        }
      }
    }
  }

  /**
   * CRITICAL: Execute raw query with tenant context
   */
  private async executeRawQueryWithTenant(operation: Function, args: any[]): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Set database session variables
      await this.setDatabaseSessionVariables();

      const result = await operation(...args);

      logger.debug('Raw query completed', {
        tenantId: this.tenantContext.tenantId,
        userId: this.tenantContext.userId,
        duration: Date.now() - startTime,
        requestId: this.tenantContext.requestId
      });

      return result;
    } catch (error) {
      logger.error('Raw query failed', error as Error, {
        tenantId: this.tenantContext.tenantId,
        userId: this.tenantContext.userId,
        duration: Date.now() - startTime,
        requestId: this.tenantContext.requestId
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Set database session variables for tenant isolation
   */
  private async setDatabaseSessionVariables(): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        SET LOCAL app.current_user_id = ${this.tenantContext.userId};
        SET LOCAL app.current_tenant_id = ${this.tenantContext.tenantId};
        SET LOCAL app.is_service_account = 'false';
        SET LOCAL app.request_id = ${this.tenantContext.requestId};
      `;
    } catch (error) {
      logger.error('Failed to set database session variables', error as Error, {
        tenantId: this.tenantContext.tenantId,
        userId: this.tenantContext.userId,
        requestId: this.tenantContext.requestId
      });
      throw new Error('TENANT_CONTEXT_SETUP_FAILED');
    }
  }

  /**
   * CRITICAL: Create tenant-isolated transaction
   */
  async transaction<T>(callback: (tx: PrismaClient) => Promise<T>): Promise<T> {
    const scopedClient = this.scopedClient;
    
    return await scopedClient.$transaction(async (tx: PrismaClient) => {
      // Ensure tenant context is set in transaction
      await tx.$executeRaw`
        SET LOCAL app.current_user_id = ${this.tenantContext.userId};
        SET LOCAL app.current_tenant_id = ${this.tenantContext.tenantId};
        SET LOCAL app.is_service_account = 'false';
        SET LOCAL app.request_id = ${this.tenantContext.requestId};
      `;

      return await callback(tx);
    });
  }

  /**
   * CRITICAL: Batch operations with tenant isolation
   */
  async batch<T>(queries: Array<(tx: PrismaClient) => Promise<T>>): Promise<T[]> {
    const scopedClient = this.scopedClient;
    
    return await scopedClient.$transaction(async (tx: PrismaClient) => {
      // Set tenant context for batch
      await tx.$executeRaw`
        SET LOCAL app.current_user_id = ${this.tenantContext.userId};
        SET LOCAL app.current_tenant_id = ${this.tenantContext.tenantId};
        SET LOCAL app.is_service_account = 'false';
        SET LOCAL app.request_id = ${this.tenantContext.requestId};
      `;

      const results: T[] = [];
      for (const query of queries) {
        results.push(await query(tx));
      }
      return results;
    });
  }
}

/**
 * CRITICAL: Factory function for creating tenant-isolated query builders
 */
export const createTenantIsolatedQueryBuilder = (
  prisma: PrismaClient,
  tenantContext: TenantScopedQuery,
  options?: Partial<QueryOptions>
): TenantIsolatedQueryBuilder => {
  return new TenantIsolatedQueryBuilder(prisma, tenantContext, options);
};

/**
 * CRITICAL: Middleware to create tenant-isolated Prisma client for requests
 */
export const createTenantIsolatedPrisma = (
  prisma: PrismaClient,
  tenantContext: TenantScopedQuery
): PrismaClient => {
  const builder = new TenantIsolatedQueryBuilder(prisma, tenantContext);
  return builder.scopedClient;
};
