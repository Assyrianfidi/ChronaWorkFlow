// CRITICAL: Deterministic Failure Semantics for Tenant Isolation
// MANDATORY: All tenant-related failures must be deterministic and secure

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/structured-logger.js';

export interface DeterministicFailureConfig {
  enableStrictMode: boolean;
  sanitizeErrors: boolean;
  logFailures: boolean;
  securityAlerts: boolean;
}

export interface FailureContext {
  operation: string;
  tenantId?: string;
  userId?: string;
  requestId?: string;
  resourceType?: string;
  resourceId?: string;
  errorType: string;
  originalError?: Error;
  expectedTenantId?: string;
  actualTenantId?: string;
  validationError?: string;
}

export class DeterministicFailureHandler {
  private config: DeterministicFailureConfig;

  constructor(config: Partial<DeterministicFailureConfig> = {}) {
    this.config = {
      enableStrictMode: true,
      sanitizeErrors: true,
      logFailures: true,
      securityAlerts: true,
      ...config
    };
  }

  /**
   * CRITICAL: Handle missing tenant context with deterministic failure
   */
  handleMissingTenantContext(context: FailureContext): never {
    const error = new Error('TENANT_CONTEXT_REQUIRED');
    
    this.logDeterministicFailure('MISSING_TENANT_CONTEXT', context, error);
    
    if (this.config.securityAlerts) {
      this.triggerSecurityAlert('MISSING_TENANT_CONTEXT', context);
    }
    
    throw error;
  }

  /**
   * CRITICAL: Handle invalid tenant context with deterministic failure
   */
  handleInvalidTenantContext(context: FailureContext): never {
    const error = new Error('INVALID_TENANT_CONTEXT');
    
    this.logDeterministicFailure('INVALID_TENANT_CONTEXT', context, error);
    
    if (this.config.securityAlerts) {
      this.triggerSecurityAlert('INVALID_TENANT_CONTEXT', context);
    }
    
    throw error;
  }

  /**
   * CRITICAL: Handle tenant mismatch with deterministic failure
   */
  handleTenantMismatch(expectedTenantId: string, actualTenantId: string, context: FailureContext): never {
    const error = new Error('TENANT_MISMATCH');
    
    // Add tenant mismatch details to error for debugging (will be sanitized)
    (error as any).expectedTenantId = expectedTenantId;
    (error as any).actualTenantId = actualTenantId;
    
    this.logDeterministicFailure('TENANT_MISMATCH', {
      ...context,
      expectedTenantId,
      actualTenantId
    }, error);
    
    if (this.config.securityAlerts) {
      this.triggerSecurityAlert('TENANT_MISMATCH', {
        ...context,
        expectedTenantId,
        actualTenantId
      });
    }
    
    throw error;
  }

  /**
   * CRITICAL: Handle unsafe query with deterministic failure
   */
  handleUnsafeQuery(context: FailureContext): never {
    const error = new Error('UNSAFE_QUERY_DETECTED');
    
    this.logDeterministicFailure('UNSAFE_QUERY', context, error);
    
    if (this.config.securityAlerts) {
      this.triggerSecurityAlert('UNSAFE_QUERY', context);
    }
    
    throw error;
  }

  /**
   * CRITICAL: Handle cross-tenant access attempt with deterministic failure
   */
  handleCrossTenantAccess(context: FailureContext): never {
    const error = new Error('CROSS_TENANT_ACCESS_DENIED');
    
    this.logDeterministicFailure('CROSS_TENANT_ACCESS', context, error);
    
    if (this.config.securityAlerts) {
      this.triggerSecurityAlert('CROSS_TENANT_ACCESS', context);
    }
    
    throw error;
  }

  /**
   * CRITICAL: Handle unauthorized operation with deterministic failure
   */
  handleUnauthorizedOperation(context: FailureContext): never {
    const error = new Error('OPERATION_NOT_AUTHORIZED');
    
    this.logDeterministicFailure('UNAUTHORIZED_OPERATION', context, error);
    
    throw error;
  }

  /**
   * CRITICAL: Handle resource not found with deterministic failure
   */
  handleResourceNotFound(context: FailureContext): never {
    const error = new Error('RESOURCE_NOT_FOUND');
    
    // Don't log resource not found as security issue in most cases
    this.logDeterministicFailure('RESOURCE_NOT_FOUND', context, error, false);
    
    throw error;
  }

  /**
   * CRITICAL: Handle validation failure with deterministic error
   */
  handleValidationFailure(context: FailureContext, validationError: string): never {
    const error = new Error('VALIDATION_FAILED');
    
    // Add validation details for debugging (will be sanitized)
    (error as any).validationError = validationError;
    
    this.logDeterministicFailure('VALIDATION_FAILED', context, error, false);
    
    throw error;
  }

  /**
   * CRITICAL: Create deterministic HTTP response for tenant failures
   */
  createDeterministicResponse(
    res: Response,
    errorType: string,
    context: FailureContext,
    statusCode: number = 403
  ): void {
    const response = {
      error: this.sanitizeErrorMessage(errorType),
      code: errorType,
      requestId: context.requestId || 'unknown',
      timestamp: new Date().toISOString()
    };

    // Add minimal context for debugging (sanitized)
    if (context.resourceType && !this.config.sanitizeErrors) {
      (response as any).resourceType = context.resourceType;
    }

    res.status(statusCode).json(response);
  }

  /**
   * CRITICAL: Create middleware for deterministic failure handling
   */
  deterministicFailureMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Store original error handlers
      const originalSend = res.send;
      const originalJson = res.json;

      // Override error handling to ensure deterministic responses
      res.json = (body: any) => {
        // Check if this is an error response
        if (body && typeof body === 'object' && body.error) {
          // Ensure error responses are deterministic
          const sanitizedBody = {
            error: this.sanitizeErrorMessage(body.error),
            code: body.code || 'UNKNOWN_ERROR',
            requestId: req.headers['x-request-id'] || 'unknown',
            timestamp: new Date().toISOString()
          };

          return originalJson.call(res, sanitizedBody);
        }

        return originalJson.call(res, body);
      };

      next();
    };
  }

  /**
   * CRITICAL: Log deterministic failure with security context
   */
  private logDeterministicFailure(
    failureType: string,
    context: FailureContext,
    error: Error,
    isSecurityIssue: boolean = true
  ): void {
    if (!this.config.logFailures) {
      return;
    }

    const logData = {
      failureType,
      operation: context.operation,
      tenantId: context.tenantId,
      userId: context.userId,
      requestId: context.requestId,
      resourceType: context.resourceType,
      resourceId: context.resourceId,
      timestamp: new Date().toISOString(),
      isSecurityIssue,
      severity: isSecurityIssue ? 'HIGH' : 'MEDIUM'
    };

    if (isSecurityIssue) {
      logger.error(`Deterministic failure: ${failureType}`, error, logData);
    } else {
      logger.warn(`Deterministic failure: ${failureType}`, {
        ...logData,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      });
    }
  }

  /**
   * CRITICAL: Trigger security alert for monitoring
   */
  private triggerSecurityAlert(alertType: string, context: FailureContext): void {
    if (!this.config.securityAlerts) {
      return;
    }

    // CRITICAL: In production, this would integrate with security monitoring
    const alertData = {
      alertType,
      severity: 'HIGH',
      timestamp: new Date().toISOString(),
      context: {
        operation: context.operation,
        tenantId: context.tenantId,
        userId: context.userId,
        requestId: context.requestId,
        resourceType: context.resourceType,
        resourceId: context.resourceId,
        ip: (context as any).ip,
        userAgent: (context as any).userAgent
      }
    };

    logger.error(`SECURITY ALERT: ${alertType}`, new Error(alertType), alertData);

    // TODO: Integrate with external security monitoring system
    // securityMonitoringService.sendAlert(alertType, alertData);
  }

  /**
   * CRITICAL: Sanitize error messages to prevent information leakage
   */
  private sanitizeErrorMessage(errorMessage: string): string {
    if (!this.config.sanitizeErrors) {
      return errorMessage;
    }

    // CRITICAL: Check for information leakage patterns
    const leakPatterns = [
      /tenant.*id/i,
      /tenant.*name/i,
      /user.*id/i,
      /user.*email/i,
      /resource.*id/i,
      /cross.*tenant/i,
      /unauthorized/i,
      /forbidden/i,
      /access.*denied/i,
      /permission.*denied/i,
      /not.*found/i,
      /does.*not.*exist/i
    ];

    // Check if error message contains sensitive information
    const hasLeakage = leakPatterns.some(pattern => pattern.test(errorMessage));
    
    if (hasLeakage) {
      // Return generic error message
      return 'Access denied';
    }

    // Return original error if no leakage detected
    return errorMessage;
  }

  /**
   * CRITICAL: Validate tenant context completeness
   */
  validateTenantContext(context: {
    tenantId?: string;
    userId?: string;
    requestId?: string;
  }): void {
    if (!context.tenantId) {
      this.handleMissingTenantContext({
        operation: 'VALIDATE_TENANT_CONTEXT',
        userId: context.userId,
        requestId: context.requestId,
        errorType: 'MISSING_TENANT_ID'
      });
    }

    if (!context.userId) {
      this.handleInvalidTenantContext({
        operation: 'VALIDATE_TENANT_CONTEXT',
        tenantId: context.tenantId,
        requestId: context.requestId,
        errorType: 'MISSING_USER_ID'
      });
    }

    // CRITICAL: Validate tenant ID format
    if (!this.isValidTenantId(context.tenantId)) {
      this.handleInvalidTenantContext({
        operation: 'VALIDATE_TENANT_CONTEXT',
        tenantId: context.tenantId,
        userId: context.userId,
        requestId: context.requestId,
        errorType: 'INVALID_TENANT_ID_FORMAT'
      });
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
   * CRITICAL: Ensure tenant context is never defaulted
   */
  preventImplicitTenantFallback(context: {
    hasTenantId: boolean;
    hasUserId: boolean;
    operation: string;
  }): void {
    if (!context.hasTenantId) {
      this.handleMissingTenantContext({
        operation: context.operation,
        userId: context.hasUserId ? 'present' : 'missing',
        errorType: 'IMPLICIT_TENANT_FALLBACK_BLOCKED'
      });
    }
  }

  /**
   * CRITICAL: Validate operation safety
   */
  validateOperationSafety(context: {
    operation: string;
    hasTenantContext: boolean;
    hasUserId: boolean;
    resourceType?: string;
    resourceId?: string;
  }): void {
    // CRITICAL: All operations must have tenant context
    if (!context.hasTenantContext) {
      this.handleUnsafeQuery({
        operation: context.operation,
        resourceType: context.resourceType,
        resourceId: context.resourceId,
        errorType: 'OPERATION_WITHOUT_TENANT_CONTEXT'
      });
    }

    // CRITICAL: All operations must have user context
    if (!context.hasUserId) {
      this.handleUnsafeQuery({
        operation: context.operation,
        resourceType: context.resourceType,
        resourceId: context.resourceId,
        errorType: 'OPERATION_WITHOUT_USER_CONTEXT'
      });
    }

    // CRITICAL: Resource operations must have resource context
    if ((context.resourceType || context.resourceId) && 
        (!context.resourceType || !context.resourceId)) {
      this.handleUnsafeQuery({
        operation: context.operation,
        resourceType: context.resourceType,
        resourceId: context.resourceId,
        errorType: 'INCOMPLETE_RESOURCE_CONTEXT'
      });
    }
  }

  /**
   * CRITICAL: Get failure metrics for monitoring
   */
  getFailureMetrics(): {
    strictMode: boolean;
    errorSanitization: boolean;
    failureLogging: boolean;
    securityAlerts: boolean;
  } {
    return {
      strictMode: this.config.enableStrictMode,
      errorSanitization: this.config.sanitizeErrors,
      failureLogging: this.config.logFailures,
      securityAlerts: this.config.securityAlerts
    };
  }
}

/**
 * CRITICAL: Factory function for creating deterministic failure handler
 */
export const createDeterministicFailureHandler = (
  config?: Partial<DeterministicFailureConfig>
): DeterministicFailureHandler => {
  return new DeterministicFailureHandler(config);
};

/**
 * CRITICAL: Express middleware for deterministic failure handling
 */
export const deterministicFailureMiddleware = (
  config?: Partial<DeterministicFailureConfig>
) => {
  const handler = createDeterministicFailureHandler(config);
  return handler.deterministicFailureMiddleware();
};
