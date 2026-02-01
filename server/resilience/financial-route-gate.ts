/**
 * Financial Route Gate
 * 
 * This module provides route-level enforcement of the Financial Write-Path Contract.
 * 
 * ALL financial mutation routes MUST use registerFinancialRoute() instead of
 * direct app.post/put/patch calls.
 * 
 * This gate enforces:
 * - Idempotency-Key header requirement
 * - Operation name registration
 * - Contract compliance at startup
 */

import { Request, Response, NextFunction, Application } from "express";
import { assertFinancialOperation, getFinancialMutation } from "./financial-mutation-registry";

/**
 * Configuration for a financial mutation route
 */
export interface FinancialRouteConfig {
  /**
   * Operation name (must be registered in FINANCIAL_MUTATIONS)
   */
  operationName: string;

  /**
   * Route path (e.g., "/api/payments")
   */
  path: string;

  /**
   * HTTP method
   */
  method: "POST" | "PUT" | "PATCH";

  /**
   * Middleware to run before the handler
   */
  middleware?: Array<(req: Request, res: Response, next: NextFunction) => void>;

  /**
   * Route handler
   * 
   * The handler MUST:
   * - Call a storage method that uses withIdempotentWrite
   * - Only trigger side effects when !replayed
   * - Return 201 for new writes, 200 for replays
   */
  handler: (req: Request, res: Response, next: NextFunction) => void | Promise<void>;
}

/**
 * Middleware that enforces Idempotency-Key header requirement
 */
function requireIdempotencyKey(req: Request, res: Response, next: NextFunction): void {
  const idempotencyKey = String(req.header("Idempotency-Key") ?? "").trim();
  
  if (!idempotencyKey) {
    res.status(400).json({
      error: "Idempotency-Key header is required for financial write operations",
      code: "IDEMPOTENCY_KEY_REQUIRED",
    });
    return;
  }

  // Store for use in handler
  (req as any).idempotencyKey = idempotencyKey;
  next();
}

/**
 * Register a financial mutation route with contract enforcement
 * 
 * This is the ONLY way to register financial mutation routes.
 * 
 * @example
 * ```typescript
 * registerFinancialRoute(app, {
 *   operationName: "createPayment",
 *   path: "/api/payments",
 *   method: "POST",
 *   middleware: [authenticateToken, enforceBillingStatus()],
 *   handler: async (req, res) => {
 *     const { payment, replayed } = await storage.createPayment(...);
 *     if (!replayed) {
 *       await startWorkflowInstance(...);
 *     }
 *     res.status(replayed ? 200 : 201).json(payment);
 *   }
 * });
 * ```
 * 
 * @throws Error if operation not registered or misconfigured
 */
export function registerFinancialRoute(
  app: Application,
  config: FinancialRouteConfig
): void {
  // Validate operation is registered
  assertFinancialOperation(config.operationName);
  
  const mutation = getFinancialMutation(config.operationName);
  if (!mutation) {
    throw new Error(
      `FATAL: Financial mutation "${config.operationName}" not found in registry. ` +
      `This should never happen after assertFinancialOperation.`
    );
  }

  // Validate route matches registry
  const normalizedConfigPath = config.path.replace(/:[^/]+/g, "[^/]+");
  const normalizedMutationPath = mutation.routePath.replace(/:[^/]+/g, "[^/]+");
  
  if (normalizedConfigPath !== normalizedMutationPath) {
    throw new Error(
      `Financial route path mismatch for "${config.operationName}":\n` +
      `  Registered: ${mutation.routePath}\n` +
      `  Provided:   ${config.path}\n` +
      `Update FINANCIAL_MUTATIONS registry to match.`
    );
  }

  if (config.method !== mutation.httpMethod) {
    throw new Error(
      `Financial route method mismatch for "${config.operationName}":\n` +
      `  Registered: ${mutation.httpMethod}\n` +
      `  Provided:   ${config.method}\n` +
      `Update FINANCIAL_MUTATIONS registry to match.`
    );
  }

  // Build middleware chain with Idempotency-Key enforcement
  const middlewareChain = [
    requireIdempotencyKey,
    ...(config.middleware || []),
  ];

  // Register route with enforcement
  const methodLower = config.method.toLowerCase() as "post" | "put" | "patch";
  
  app[methodLower](config.path, ...middlewareChain, async (req: Request, res: Response, next: NextFunction) => {
    try {
      await config.handler(req, res, next);
    } catch (error: any) {
      // Log for debugging but don't expose internal details
      console.error(`Financial mutation error [${config.operationName}]:`, error);
      
      if (!res.headersSent) {
        res.status(500).json({
          error: error.message || "Internal server error",
          code: "FINANCIAL_MUTATION_ERROR",
        });
      }
    }
  });

  console.log(
    `✓ Registered financial route: ${config.method} ${config.path} [${config.operationName}]`
  );
}

/**
 * Validation helper: Assert that a route handler uses idempotent storage
 * 
 * This is called at startup to validate configuration.
 * In production, this should be part of CI checks.
 */
export function validateFinancialRouteHandler(
  operationName: string,
  handlerSource: string
): void {
  const mutation = getFinancialMutation(operationName);
  if (!mutation) {
    throw new Error(`Operation "${operationName}" not registered`);
  }

  // Check that handler calls the correct storage method
  if (!handlerSource.includes(mutation.storageMethod)) {
    console.warn(
      `⚠️  Financial route "${operationName}" handler may not call storage.${mutation.storageMethod}(). ` +
      `Verify manually that idempotent storage is used.`
    );
  }

  // Check for withIdempotentWrite usage (indirect via storage method)
  // This is a heuristic - full validation happens in CI
  const hasReplayCheck = handlerSource.includes("replayed") || handlerSource.includes("!replayed");
  if (!hasReplayCheck) {
    console.warn(
      `⚠️  Financial route "${operationName}" handler does not check 'replayed' flag. ` +
      `Ensure side effects are conditional on !replayed.`
    );
  }
}

/**
 * Get the idempotency key from a request
 * (Helper for route handlers)
 */
export function getIdempotencyKey(req: Request): string {
  const key = (req as any).idempotencyKey || req.header("Idempotency-Key");
  if (!key) {
    throw new Error("Idempotency-Key not found in request");
  }
  return String(key).trim();
}

/**
 * Type-safe wrapper for financial route handlers
 * Ensures handler signature is correct
 */
export type FinancialRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

/**
 * Create a financial route handler with type safety
 */
export function createFinancialHandler(
  handler: FinancialRouteHandler
): FinancialRouteHandler {
  return handler;
}
