// CRITICAL: Idempotency Middleware
// MANDATORY: Request and job protection with exactly-once semantics

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/structured-logger.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { idempotencyManager, IdempotencyScope, generateIdempotencyKey, checkIdempotency } from './idempotency-manager.js';
import { TenantContext } from '../tenant/tenant-isolation.js';
import crypto from 'crypto';

export interface IdempotencyMiddlewareOptions {
  operationType: string;
  scope: IdempotencyScope;
  ttl?: number;
  maxExecutions?: number;
  keyGenerator?: (req: Request) => string;
  additionalContext?: (req: Request) => Record<string, any>;
  skipPaths?: string[];
  skipMethods?: string[];
}

/**
 * CRITICAL: Idempotency Middleware for Express
 * 
 * This middleware provides idempotency protection for API endpoints
 * with configurable scopes and automatic key generation.
 */
export function idempotencyMiddleware(options: IdempotencyMiddlewareOptions) {
  const {
    operationType,
    scope,
    ttl,
    maxExecutions,
    keyGenerator,
    additionalContext,
    skipPaths = [],
    skipMethods = ['GET', 'HEAD', 'OPTIONS']
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const correlationId = req.headers['x-correlation-id'] as string || `idempotency_${Date.now()}`;

    try {
      // CRITICAL: Skip idempotency for specified methods and paths
      if (skipMethods.includes(req.method) || skipPaths.some(path => req.path.startsWith(path))) {
        return next();
      }

      // CRITICAL: Extract tenant context
      const tenantContext = (req as any).tenantContext;
      if (!tenantContext && (scope === 'TENANT' || scope === 'USER')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Tenant context required for idempotency'
        });
      }

      // CRITICAL: Generate idempotency key
      let key: string;
      if (keyGenerator) {
        key = keyGenerator(req);
      } else {
        key = generateDefaultKey(req, operationType, scope, tenantContext, additionalContext);
      }

      // CRITICAL: Check idempotency
      const idempotencyResult = await checkIdempotency(
        key,
        operationType,
        scope,
        tenantContext,
        (req as any).user?.id,
        req.session?.id,
        ttl,
        maxExecutions
      );

      // CRITICAL: Handle duplicate requests
      if (idempotencyResult.isDuplicate) {
        // CRITICAL: Log duplicate request
        const auditLogger = getImmutableAuditLogger();
        auditLogger.logAuthorizationDecision({
          tenantId: tenantContext?.tenantId || 'system',
          actorId: (req as any).user?.id || 'system',
          action: 'DUPLICATE_REQUEST_BLOCKED',
          resourceType: 'IDEMPOTENCY_KEY',
          resourceId: idempotencyResult.key.id,
          outcome: 'SUCCESS',
          correlationId,
          metadata: {
            key,
            operationType,
            scope,
            status: idempotencyResult.status,
            duration: Date.now() - startTime
          }
        });

        // CRITICAL: Return appropriate response based on status
        if (idempotencyResult.status === 'COMPLETED') {
          return res.status(200).json({
            success: true,
            duplicate: true,
            status: 'completed',
            result: idempotencyResult.result,
            message: 'Request already completed'
          });
        } else if (idempotencyResult.status === 'FAILED') {
          return res.status(400).json({
            success: false,
            duplicate: true,
            status: 'failed',
            error: idempotencyResult.error,
            message: 'Request previously failed'
          });
        } else if (idempotencyResult.status === 'IN_PROGRESS') {
          return res.status(409).json({
            success: false,
            duplicate: true,
            status: 'in_progress',
            error: idempotencyResult.error,
            message: 'Request currently in progress'
          });
        } else {
          return res.status(400).json({
            success: false,
            duplicate: true,
            status: idempotencyResult.status,
            error: idempotencyResult.error,
            message: 'Request cannot be processed'
          });
        }
      }

      // CRITICAL: Add idempotency info to request
      (req as any).idempotencyKey = idempotencyResult.key;
      (req as any).idempotencyKeyString = key;

      // CRITICAL: Start execution
      await idempotencyManager.startExecution(
        key,
        tenantContext,
        (req as any).user?.id
      );

      // CRITICAL: Override res.json to capture result
      const originalJson = res.json;
      res.json = function(data: any) {
        // CRITICAL: Complete execution with result
        idempotencyManager.completeExecution(
          key,
          data,
          tenantContext,
          (req as any).user?.id
        ).catch(error => {
          logger.error('Failed to complete idempotency execution', error, {
            keyId: idempotencyResult.key.id,
            operationType
          });
        });

        // CRITICAL: Call original json
        return originalJson.call(this, data);
      };

      // CRITICAL: Override res.status to handle errors
      const originalStatus = res.status;
      res.status = function(code: number) {
        // CRITICAL: Handle error responses
        if (code >= 400) {
          const error = new Error(`HTTP ${code} response`);
          idempotencyManager.failExecution(
            key,
            error,
            tenantContext,
            (req as any).user?.id
          ).catch(err => {
            logger.error('Failed to fail idempotency execution', err, {
              keyId: idempotencyResult.key.id,
              operationType,
              statusCode: code
            });
          });
        }

        return originalStatus.call(this, code);
      };

      next();

    } catch (error) {
      logger.error('Idempotency middleware error', error as Error, {
        operationType,
        scope,
        path: req.path,
        method: req.method
      });

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Idempotency check failed'
      });
    }
  };
}

/**
 * CRITICAL: Generate default idempotency key
 */
function generateDefaultKey(
  req: Request,
  operationType: string,
  scope: IdempotencyScope,
  tenantContext?: TenantContext,
  additionalContext?: (req: Request) => Record<string, any>
): string {
  const keyParts = [operationType, scope];
  
  // CRITICAL: Add tenant ID if tenant-scoped
  if (scope === 'TENANT' && tenantContext) {
    keyParts.push(tenantContext.tenantId);
  }
  
  // CRITICAL: Add user ID if user-scoped
  if (scope === 'USER' && (req as any).user?.id) {
    keyParts.push(`user:${(req as any).user.id}`);
  }
  
  // CRITICAL: Add session ID if session-scoped
  if (scope === 'SESSION' && req.session?.id) {
    keyParts.push(`session:${req.session.id}`);
  }
  
  // CRITICAL: Add method and path for operation-scoped
  if (scope === 'OPERATION') {
    keyParts.push(`${req.method}:${req.path}`);
  }
  
  // CRITICAL: Add additional context
  if (additionalContext) {
    const context = additionalContext(req);
    if (context && Object.keys(context).length > 0) {
      const hash = crypto.createHash('sha256');
      hash.update(JSON.stringify(context, Object.keys(context).sort()));
      keyParts.push(hash.digest('hex').substring(0, 16));
    }
  }
  
  // CRITICAL: Add request body hash for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(req.body, Object.keys(req.body).sort()));
    keyParts.push(hash.digest('hex').substring(0, 16));
  }
  
  return keyParts.join(':');
}

/**
 * CRITICAL: Job Idempotency Wrapper
 * 
 * This wrapper provides idempotency protection for background jobs
 * with automatic error handling and result caching.
 */
export function withJobIdempotency<T extends any[], R>(
  operationType: string,
  scope: IdempotencyScope,
  jobFunction: (...args: T) => Promise<R>,
  options: {
    ttl?: number;
    maxExecutions?: number;
    keyExtractor?: (...args: T) => string;
    contextExtractor?: (...args: T) => Record<string, any>;
  } = {}
) {
  const {
    ttl,
    maxExecutions,
    keyExtractor,
    contextExtractor
  } = options;

  return async (...args: T): Promise<R> => {
    // CRITICAL: Extract additional context first
    let additionalContext: Record<string, any> = {};
    if (contextExtractor) {
      additionalContext = contextExtractor(...args);
    }

    // CRITICAL: Extract key components
    let key: string;
    let tenantContext: TenantContext | undefined;
    let userId: string | undefined;
    let sessionId: string | undefined;

    // CRITICAL: Extract context from arguments for fallback key generation
    if (args[0] && typeof args[0] === 'object') {
      const firstArg = args[0];
      if ('tenantId' in firstArg) {
        tenantContext = firstArg as TenantContext;
      }
      if ('userId' in firstArg) {
        userId = firstArg.userId;
      }
      if ('sessionId' in firstArg) {
        sessionId = firstArg.sessionId;
      }
    }

    // CRITICAL: Generate key using keyExtractor or fallback
    if (keyExtractor) {
      key = keyExtractor(...args);
    } else {
      key = idempotencyManager.generateKey(operationType, scope, tenantContext, userId, sessionId, additionalContext);
    }

    // CRITICAL: Execute with idempotency protection
    console.log('WRAPPER calling executeWithIdempotency with key:', key);
    console.log('WRAPPER keyStore size before call:', (idempotencyManager as any).keyStore?.size || 'no store');
    const result = await idempotencyManager.executeWithIdempotency(
      operationType,
      scope,
      () => jobFunction(...args),
      tenantContext,
      userId,
      sessionId,
      additionalContext,
      ttl,
      maxExecutions,
      {},
      key // Pass the pre-generated key
    );
    console.log('WRAPPER result:', result);
    console.log('WRAPPER keyStore size after call:', (idempotencyManager as any).keyStore?.size || 'no store');
    return result;
  };
}

/**
 * CRITICAL: Billing Operation Idempotency
 * 
 * Specialized wrapper for billing operations with exactly-once guarantees
 */
export function withBillingIdempotency<T extends any[], R>(
  billingType: string,
  billingFunction: (...args: T) => Promise<R>
) {
  return withJobIdempotency(
    `BILLING_${billingType}`,
    'TENANT',
    billingFunction,
    {
      ttl: 86400000, // 24 hours
      maxExecutions: 1, // Exactly-once
      keyExtractor: (...args) => {
        // CRITICAL: Extract billing ID from arguments
        const billingData = args.find(arg => 
          typeof arg === 'object' && arg && 'billingId' in arg
        ) as any;
        
        if (billingData?.billingId) {
          return `BILLING_${billingType}_${billingData.billingId}`;
        }
        
        // CRITICAL: Fallback to generated key with args hash
        const hash = crypto.createHash('sha256');
        hash.update(JSON.stringify(args, Object.keys(args).sort()));
        return `BILLING_${billingType}_${hash.digest('hex').substring(0, 16)}`;
      },
      contextExtractor: (...args) => {
        // CRITICAL: Extract billing context for consistent keys
        const billingData = args.find(arg => 
          typeof arg === 'object' && arg && ('amount' in arg || 'subscriptionId' in arg)
        ) as any;
        
        return billingData || {};
      }
    }
  );
}

/**
 * CRITICAL: Dangerous Operation Idempotency
 * 
 * Specialized wrapper for dangerous operations with strict controls
 */
export function withDangerousOperationIdempotency<T extends any[], R>(
  operationType: string,
  dangerousFunction: (...args: T) => Promise<R>
) {
  return withJobIdempotency(
    `DANGEROUS_${operationType}`,
    'TENANT',
    dangerousFunction,
    {
      ttl: 604800000, // 7 days
      maxExecutions: 1, // Exactly-once
      keyExtractor: (...args) => {
        // CRITICAL: Extract operation ID from arguments
        const operationData = args.find(arg => 
          typeof arg === 'object' && arg && 'operationId' in arg
        ) as any;
        
        if (operationData?.operationId) {
          return `DANGEROUS_${operationType}_${operationData.operationId}`;
        }
        
        // CRITICAL: Fallback to generated key
        const hash = crypto.createHash('sha256');
        hash.update(JSON.stringify(args, Object.keys(args).sort()));
        return `DANGEROUS_${operationType}_${hash.digest('hex').substring(0, 16)}`;
      },
      contextExtractor: (...args) => {
        // CRITICAL: Extract operation context
        const operationData = args.find(arg => 
          typeof arg === 'object' && arg && ('riskLevel' in arg || 'approvalId' in arg)
        ) as any;
        
        return operationData || {};
      }
    }
  );
}

/**
 * CRITICAL: Approval Execution Idempotency
 * 
 * Specialized wrapper for approval executions with tracking
 */
export function withApprovalIdempotency<T extends any[], R>(
  approvalType: string,
  approvalFunction: (...args: T) => Promise<R>
) {
  return withJobIdempotency(
    `APPROVAL_${approvalType}`,
    'TENANT',
    approvalFunction,
    {
      ttl: 86400000, // 24 hours
      maxExecutions: 1, // Exactly-once
      keyExtractor: (...args) => {
        // CRITICAL: Extract approval ID from arguments
        const approvalData = args.find(arg => 
          typeof arg === 'object' && arg && 'approvalId' in arg
        ) as any;
        
        if (approvalData?.approvalId) {
          return `APPROVAL_${approvalType}_${approvalData.approvalId}`;
        }
        
        // CRITICAL: Fallback to generated key
        const hash = crypto.createHash('sha256');
        hash.update(JSON.stringify(args, Object.keys(args).sort()));
        return `APPROVAL_${approvalType}_${hash.digest('hex').substring(0, 16)}`;
      },
      contextExtractor: (...args) => {
        // CRITICAL: Extract approval context
        const approvalData = args.find(arg => 
          typeof arg === 'object' && arg && ('requestId' in arg || 'approverId' in arg)
        ) as any;
        
        return approvalData || {};
      }
    }
  );
}

/**
 * CRITICAL: Express route decorator for idempotency
 */
export function Idempotent(options: IdempotencyMiddlewareOptions) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (req: Request, res: Response, next: NextFunction) {
      // CRITICAL: Apply idempotency middleware
      const middleware = idempotencyMiddleware(options);
      await middleware(req, res, () => {
        // CRITICAL: Call original method
        return originalMethod.call(this, req, res, next);
      });
    };

    return descriptor;
  };
}

/**
 * CRITICAL: Convenience middleware creators
 */
export const createTenantIdempotency = (operationType: string, options: Partial<IdempotencyMiddlewareOptions> = {}) => {
  return idempotencyMiddleware({
    operationType,
    scope: 'TENANT',
    ...options
  });
};

export const createUserIdempotency = (operationType: string, options: Partial<IdempotencyMiddlewareOptions> = {}) => {
  return idempotencyMiddleware({
    operationType,
    scope: 'USER',
    ...options
  });
};

export const createSessionIdempotency = (operationType: string, options: Partial<IdempotencyMiddlewareOptions> = {}) => {
  return idempotencyMiddleware({
    operationType,
    scope: 'SESSION',
    ...options
  });
};

export const createOperationIdempotency = (operationType: string, options: Partial<IdempotencyMiddlewareOptions> = {}) => {
  return idempotencyMiddleware({
    operationType,
    scope: 'OPERATION',
    ...options
  });
};

/**
 * CRITICAL: Error handling for idempotency failures
 */
export class IdempotencyError extends Error {
  constructor(
    message: string,
    public keyId: string,
    public operationType: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'IdempotencyError';
  }
}

/**
 * CRITICAL: Retry handler for idempotent operations
 */
export async function retryWithIdempotency<T>(
  operationType: string,
  scope: IdempotencyScope,
  operation: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000,
  tenantContext?: TenantContext,
  userId?: string,
  sessionId?: string,
  additionalContext?: Record<string, any>
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await idempotencyManager.executeWithIdempotency(
        operationType,
        scope,
        operation,
        tenantContext,
        userId,
        sessionId,
        additionalContext
      );
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // CRITICAL: Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
    }
  }
  
  throw lastError!;
}
