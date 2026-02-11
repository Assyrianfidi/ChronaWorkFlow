/**
 * Idempotent Operation Helpers
 * 
 * Developer-friendly utilities for quickly and safely adding new
 * idempotent operations (financial or high-risk).
 * 
 * These helpers enforce:
 * - Type safety
 * - Contract compliance
 * - Automatic telemetry
 * - Proper error handling
 */

import { Request, Response, NextFunction, Application } from "express";
import { withIdempotentWrite, type IdempotentWriteConfig, type IdempotentWriteResult } from "./idempotent-write";
import { registerFinancialRoute, type FinancialRouteConfig } from "./financial-route-gate";
import { registerHighRiskRoute, type HighRiskRouteConfig } from "./high-risk-route-gate";
import { monitorIdempotentWrite, type IdempotentWriteTelemetry } from "../observability/idempotent-write-monitor";

/**
 * Helper function to create a financial idempotent operation
 * 
 * This wraps withIdempotentWrite and automatically:
 * - Emits telemetry
 * - Records metrics
 * - Handles errors
 * - Returns typed result
 * 
 * @example
 * ```typescript
 * const result = await createIdempotentFinancialOperation({
 *   operationName: "createPayment",
 *   companyId: "company-123",
 *   idempotencyKey: "idem-key-abc",
 *   entityId: invoiceId,
 *   checkExisting: async (tx) => {
 *     // Check if payment already exists
 *   },
 *   executeWrite: async (tx) => {
 *     // Create payment
 *   },
 *   insertTracking: async (tx, deterministicId) => {
 *     // Insert tracking row
 *   },
 *   validateReplay: (existing) => {
 *     // Validate replay matches
 *   },
 * });
 * 
 * if (!result.replayed) {
 *   await triggerWorkflows();
 * }
 * ```
 */
export async function createIdempotentFinancialOperation<TEntity>(
  config: IdempotentWriteConfig<TEntity, any> & {
    requestId?: string;
    userId?: string;
    routePath?: string;
    httpMethod?: string;
  }
): Promise<IdempotentWriteResult<TEntity>> {
  const startTime = Date.now();
  let status: "new" | "replayed" | "failed" = "new";
  const workflowsTriggered = 0;
  let errorMessage: string | undefined;

  try {
    const result = await withIdempotentWrite(config);
    status = result.replayed ? "replayed" : "new";

    // Emit telemetry
    const telemetry: IdempotentWriteTelemetry = {
      operationName: config.operationName,
      operationType: "financial",
      deterministicId: result.deterministicId,
      companyId: config.companyId,
      userId: config.userId,
      status,
      executionDurationMs: Date.now() - startTime,
      timestamp: new Date(),
      requestId: config.requestId,
      idempotencyKey: config.idempotencyKey,
      routePath: config.routePath,
      httpMethod: config.httpMethod,
      workflowsTriggered,
      sideEffectsExecuted: !result.replayed,
    };

    await monitorIdempotentWrite(telemetry);

    return result;
  } catch (error: any) {
    status = "failed";
    errorMessage = error.message;

    // Emit failure telemetry
    const telemetry: IdempotentWriteTelemetry = {
      operationName: config.operationName,
      operationType: "financial",
      deterministicId: "", // May not have been generated
      companyId: config.companyId,
      userId: config.userId,
      status,
      executionDurationMs: Date.now() - startTime,
      timestamp: new Date(),
      requestId: config.requestId,
      idempotencyKey: config.idempotencyKey,
      routePath: config.routePath,
      httpMethod: config.httpMethod,
      workflowsTriggered: 0,
      sideEffectsExecuted: false,
      errorMessage,
      errorStack: error.stack,
    };

    await monitorIdempotentWrite(telemetry);

    throw error;
  }
}

/**
 * Helper function to create a high-risk idempotent operation
 * 
 * Same as createIdempotentFinancialOperation but for high-risk operations.
 */
export async function createIdempotentHighRiskOperation<TEntity>(
  config: IdempotentWriteConfig<TEntity, any> & {
    requestId?: string;
    userId?: string;
    routePath?: string;
    httpMethod?: string;
  }
): Promise<IdempotentWriteResult<TEntity>> {
  const startTime = Date.now();
  let status: "new" | "replayed" | "failed" = "new";
  const workflowsTriggered = 0;
  let errorMessage: string | undefined;

  try {
    const result = await withIdempotentWrite(config);
    status = result.replayed ? "replayed" : "new";

    // Emit telemetry
    const telemetry: IdempotentWriteTelemetry = {
      operationName: config.operationName,
      operationType: "high-risk",
      deterministicId: result.deterministicId,
      companyId: config.companyId,
      userId: config.userId,
      status,
      executionDurationMs: Date.now() - startTime,
      timestamp: new Date(),
      requestId: config.requestId,
      idempotencyKey: config.idempotencyKey,
      routePath: config.routePath,
      httpMethod: config.httpMethod,
      workflowsTriggered,
      sideEffectsExecuted: !result.replayed,
    };

    await monitorIdempotentWrite(telemetry);

    return result;
  } catch (error: any) {
    status = "failed";
    errorMessage = error.message;

    // Emit failure telemetry
    const telemetry: IdempotentWriteTelemetry = {
      operationName: config.operationName,
      operationType: "high-risk",
      deterministicId: "",
      companyId: config.companyId,
      userId: config.userId,
      status,
      executionDurationMs: Date.now() - startTime,
      timestamp: new Date(),
      requestId: config.requestId,
      idempotencyKey: config.idempotencyKey,
      routePath: config.routePath,
      httpMethod: config.httpMethod,
      workflowsTriggered: 0,
      sideEffectsExecuted: false,
      errorMessage,
      errorStack: error.stack,
    };

    await monitorIdempotentWrite(telemetry);

    throw error;
  }
}

/**
 * Helper to quickly register a financial route with all best practices
 * 
 * @example
 * ```typescript
 * quickRegisterFinancialRoute(app, {
 *   operationName: "createPayment",
 *   path: "/api/payments",
 *   method: "POST",
 *   middleware: [authenticateToken, enforceBillingStatus()],
 *   storageMethod: async (req) => {
 *     const companyId = requireCompanyId();
 *     const idempotencyKey = getIdempotencyKey(req);
 *     return await storage.createPayment({...}, idempotencyKey);
 *   },
 *   workflowTrigger: async (entity, req) => {
 *     await startWorkflowInstance({
 *       companyId: entity.companyId,
 *       triggerEventType: "payment_received",
 *       triggerEntityId: entity.id,
 *     });
 *   },
 * });
 * ```
 */
export function quickRegisterFinancialRoute<TEntity>(
  app: Application,
  config: {
    operationName: string;
    path: string;
    method: "POST" | "PUT" | "PATCH";
    middleware?: Array<(req: Request, res: Response, next: NextFunction) => void>;
    storageMethod: (req: Request) => Promise<{ entity: TEntity; replayed: boolean }>;
    workflowTrigger?: (entity: TEntity, req: Request) => Promise<void>;
  }
): void {
  const routeConfig: FinancialRouteConfig = {
    operationName: config.operationName,
    path: config.path,
    method: config.method,
    middleware: config.middleware,
    handler: async (req: Request, res: Response) => {
      const { entity, replayed } = await config.storageMethod(req);

      if (!replayed && config.workflowTrigger) {
        void config.workflowTrigger(entity, req).catch((err) => {
          console.error(`Workflow trigger failed for ${config.operationName}:`, err);
        });
      }

      res.status(replayed ? 200 : 201).json(entity);
    },
  };

  registerFinancialRoute(app, routeConfig);
}

/**
 * Helper to quickly register a high-risk route with all best practices
 */
export function quickRegisterHighRiskRoute<TEntity>(
  app: Application,
  config: {
    operationName: string;
    path: string;
    method: "POST" | "PUT" | "PATCH" | "DELETE";
    middleware?: Array<(req: Request, res: Response, next: NextFunction) => void>;
    storageMethod: (req: Request) => Promise<{ entity: TEntity; replayed: boolean }>;
    workflowTrigger?: (entity: TEntity, req: Request) => Promise<void>;
  }
): void {
  const routeConfig: HighRiskRouteConfig = {
    operationName: config.operationName,
    path: config.path,
    method: config.method,
    middleware: config.middleware,
    handler: async (req: Request, res: Response) => {
      const { entity, replayed } = await config.storageMethod(req);

      if (!replayed && config.workflowTrigger) {
        void config.workflowTrigger(entity, req).catch((err) => {
          console.error(`Workflow trigger failed for ${config.operationName}:`, err);
        });
      }

      res.status(replayed ? 200 : 201).json(entity);
    },
  };

  registerHighRiskRoute(app, routeConfig);
}

/**
 * Type-safe builder for idempotent write configuration
 * 
 * Provides compile-time validation and IntelliSense support.
 */
export class IdempotentOperationBuilder<TEntity> {
  private config: Partial<IdempotentWriteConfig<TEntity, any>> = {};

  operationName(name: string): this {
    this.config.operationName = name;
    return this;
  }

  companyId(id: string): this {
    this.config.companyId = id;
    return this;
  }

  idempotencyKey(key: string): this {
    this.config.idempotencyKey = key;
    return this;
  }

  entityId(id: string): this {
    this.config.entityId = id;
    return this;
  }

  checkExisting(fn: (tx: any) => Promise<TEntity | null>): this {
    this.config.checkExisting = fn;
    return this;
  }

  executeWrite(fn: (tx: any) => Promise<TEntity>): this {
    this.config.executeWrite = fn;
    return this;
  }

  insertTracking(fn: (tx: any, deterministicId: string) => Promise<void>): this {
    this.config.insertTracking = fn;
    return this;
  }

  validateReplay(fn: (existing: TEntity) => void): this {
    this.config.validateReplay = fn;
    return this;
  }

  build(): IdempotentWriteConfig<TEntity, any> {
    if (!this.config.operationName) throw new Error("operationName is required");
    if (!this.config.companyId) throw new Error("companyId is required");
    if (!this.config.idempotencyKey) throw new Error("idempotencyKey is required");
    if (!this.config.entityId) throw new Error("entityId is required");
    if (!this.config.checkExisting) throw new Error("checkExisting is required");
    if (!this.config.executeWrite) throw new Error("executeWrite is required");
    if (!this.config.insertTracking) throw new Error("insertTracking is required");

    return this.config as IdempotentWriteConfig<TEntity, any>;
  }
}

/**
 * Create a new idempotent operation builder
 */
export function buildIdempotentOperation<TEntity>(): IdempotentOperationBuilder<TEntity> {
  return new IdempotentOperationBuilder<TEntity>();
}
