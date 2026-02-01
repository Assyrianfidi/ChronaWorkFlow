/**
 * High-Risk Route Gate
 * 
 * This module provides route-level enforcement for high-risk non-financial mutations.
 * 
 * ALL high-risk mutation routes MUST use registerHighRiskRoute() instead of
 * direct app.post/put/patch calls.
 * 
 * This gate enforces the same contract as financial routes:
 * - Idempotency-Key header requirement
 * - Operation name registration
 * - Contract compliance at startup
 */

import { Request, Response, NextFunction, Application } from "express";
import { assertHighRiskOperation, getHighRiskMutation, getRiskLevel } from "./high-risk-mutation-registry";

/**
 * Configuration for a high-risk mutation route
 */
export interface HighRiskRouteConfig {
  /**
   * Operation name (must be registered in HIGH_RISK_MUTATIONS)
   */
  operationName: string;

  /**
   * Route path (e.g., "/api/inventory/:itemId/adjust")
   */
  path: string;

  /**
   * HTTP method
   */
  method: "POST" | "PUT" | "PATCH" | "DELETE";

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
      error: "Idempotency-Key header is required for high-risk write operations",
      code: "IDEMPOTENCY_KEY_REQUIRED",
    });
    return;
  }

  // Store for use in handler
  (req as any).idempotencyKey = idempotencyKey;
  next();
}

/**
 * Register a high-risk mutation route with contract enforcement
 * 
 * This is the ONLY way to register high-risk mutation routes.
 * 
 * @example
 * ```typescript
 * registerHighRiskRoute(app, {
 *   operationName: "adjustInventory",
 *   path: "/api/inventory/:itemId/adjust",
 *   method: "POST",
 *   middleware: [authenticateToken, enforceBillingStatus()],
 *   handler: async (req, res) => {
 *     const { item, replayed } = await storage.adjustInventoryQuantity(...);
 *     if (!replayed) {
 *       await triggerInventoryAlert(...);
 *     }
 *     res.status(replayed ? 200 : 201).json(item);
 *   }
 * });
 * ```
 * 
 * @throws Error if operation not registered or misconfigured
 */
export function registerHighRiskRoute(
  app: Application,
  config: HighRiskRouteConfig
): void {
  // Validate operation is registered
  assertHighRiskOperation(config.operationName);
  
  const mutation = getHighRiskMutation(config.operationName);
  if (!mutation) {
    throw new Error(
      `FATAL: High-risk mutation "${config.operationName}" not found in registry. ` +
      `This should never happen after assertHighRiskOperation.`
    );
  }

  // Validate route matches registry
  const normalizedConfigPath = config.path.replace(/:[^/]+/g, "[^/]+");
  const normalizedMutationPath = mutation.routePath.replace(/:[^/]+/g, "[^/]+");
  
  if (normalizedConfigPath !== normalizedMutationPath) {
    throw new Error(
      `High-risk route path mismatch for "${config.operationName}":\n` +
      `  Registered: ${mutation.routePath}\n` +
      `  Provided:   ${config.path}\n` +
      `Update HIGH_RISK_MUTATIONS registry to match.`
    );
  }

  if (config.method !== mutation.httpMethod) {
    throw new Error(
      `High-risk route method mismatch for "${config.operationName}":\n` +
      `  Registered: ${mutation.httpMethod}\n` +
      `  Provided:   ${config.method}\n` +
      `Update HIGH_RISK_MUTATIONS registry to match.`
    );
  }

  // Build middleware chain with Idempotency-Key enforcement
  const middlewareChain = [
    requireIdempotencyKey,
    ...(config.middleware || []),
  ];

  // Register route with enforcement
  const methodLower = config.method.toLowerCase() as "post" | "put" | "patch" | "delete";
  
  app[methodLower](config.path, ...middlewareChain, async (req: Request, res: Response, next: NextFunction) => {
    try {
      await config.handler(req, res, next);
    } catch (error: any) {
      // Log for debugging but don't expose internal details
      console.error(`High-risk mutation error [${config.operationName}]:`, error);
      
      if (!res.headersSent) {
        res.status(500).json({
          error: error.message || "Internal server error",
          code: "HIGH_RISK_MUTATION_ERROR",
        });
      }
    }
  });

  const riskLevel = getRiskLevel(config.operationName);
  const riskBadge = riskLevel === "CRITICAL" ? "🔴" : "🟡";
  
  console.log(
    `${riskBadge} Registered high-risk route: ${config.method} ${config.path} [${config.operationName}] (${riskLevel})`
  );
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
 * Type-safe wrapper for high-risk route handlers
 * Ensures handler signature is correct
 */
export type HighRiskRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

/**
 * Create a high-risk route handler with type safety
 */
export function createHighRiskHandler(
  handler: HighRiskRouteHandler
): HighRiskRouteHandler {
  return handler;
}

/**
 * Validation helper: Assert that a route handler uses idempotent storage
 * 
 * This is called at startup to validate configuration.
 */
export function validateHighRiskRouteHandler(
  operationName: string,
  handlerSource: string
): void {
  const mutation = getHighRiskMutation(operationName);
  if (!mutation) {
    throw new Error(`Operation "${operationName}" not registered`);
  }

  // Check that handler calls the correct storage method
  if (!handlerSource.includes(mutation.storageMethod)) {
    console.warn(
      `⚠️  High-risk route "${operationName}" handler may not call storage.${mutation.storageMethod}(). ` +
      `Verify manually that idempotent storage is used.`
    );
  }

  // Check for withIdempotentWrite usage (indirect via storage method)
  const hasReplayCheck = handlerSource.includes("replayed") || handlerSource.includes("!replayed");
  if (!hasReplayCheck) {
    console.warn(
      `⚠️  High-risk route "${operationName}" handler does not check 'replayed' flag. ` +
      `Ensure side effects are conditional on !replayed.`
    );
  }
}
