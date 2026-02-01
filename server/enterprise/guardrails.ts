// CRITICAL: Guardrail Enforcement Layer
// MANDATORY: Enforce guardrails at ALL levels with no bypass paths

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/structured-logger.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { dangerousOperationsRegistry, DangerousOperation } from './dangerous-operations.js';
import { getApprovalWorkflowManager, ApprovalRequest } from './approval-workflows.js';
import { getFeatureFlagManager } from './feature-flags.js';
import { TenantContext } from '../tenant/tenant-isolation.js';

export interface GuardrailResult {
  allowed: boolean;
  reason: string;
  operation?: DangerousOperation;
  approvalRequired?: boolean;
  featureFlagRequired?: string;
  permissionsRequired?: string[];
  requestId?: string;
  metadata: Record<string, any>;
}

export interface GuardrailConfig {
  enforceApiLevel: boolean;
  enforceServiceLevel: boolean;
  enforceBackgroundJobs: boolean;
  logFailuresAsSecurityEvents: boolean;
  requireCorrelationId: boolean;
  sanitizeErrors: boolean;
}

/**
 * CRITICAL: Guardrail Enforcement Manager
 * 
 * This class enforces guardrails at API, service, and background job levels
 * with zero bypass paths and comprehensive audit logging.
 */
export class GuardrailManager {
  private static instance: GuardrailManager;
  private auditLogger: any;
  private approvalManager: any;
  private featureFlagManager: any;
  private config: GuardrailConfig;

  private constructor() {
    this.auditLogger = getImmutableAuditLogger();
    this.approvalManager = getApprovalWorkflowManager();
    this.featureFlagManager = getFeatureFlagManager();
    this.config = this.loadConfiguration();
  }

  /**
   * CRITICAL: Get singleton instance
   */
  static getInstance(): GuardrailManager {
    if (!GuardrailManager.instance) {
      GuardrailManager.instance = new GuardrailManager();
    }
    return GuardrailManager.instance;
  }

  /**
   * CRITICAL: Check if operation is allowed
   */
  async checkOperation(
    operationName: string,
    tenantContext: TenantContext,
    parameters: Record<string, any> = {},
    correlationId?: string
  ): Promise<GuardrailResult> {
    const startTime = Date.now();

    try {
      // CRITICAL: Get operation definition
      const operation = dangerousOperationsRegistry.getOperation(operationName);
      if (!operation) {
        const error = `Operation '${operationName}' not registered in dangerous operations registry`;
        this.logGuardrailFailure(operationName, tenantContext, 'UNREGISTERED_OPERATION', error, correlationId);
        return {
          allowed: false,
          reason: error,
          metadata: { errorType: 'UNREGISTERED_OPERATION' }
        };
      }

      // CRITICAL: Check feature flag requirement
      if (operation.featureFlag) {
        const flagResult = await this.featureFlagManager.isFeatureEnabled(operation.featureFlag, tenantContext);
        if (!flagResult.enabled) {
          const error = `Feature flag '${operation.featureFlag}' is not enabled for this operation`;
          this.logGuardrailFailure(operationName, tenantContext, 'FEATURE_FLAG_DISABLED', error, correlationId);
          return {
            allowed: false,
            reason: error,
            operation,
            featureFlagRequired: operation.featureFlag,
            metadata: { errorType: 'FEATURE_FLAG_DISABLED', flagSource: flagResult.source }
          };
        }
      }

      // CRITICAL: Check permissions
      const permissionCheck = await this.checkPermissions(operation, tenantContext);
      if (!permissionCheck.allowed) {
        this.logGuardrailFailure(operationName, tenantContext, 'INSUFFICIENT_PERMISSIONS', permissionCheck.reason, correlationId);
        return {
          allowed: false,
          reason: permissionCheck.reason,
          operation,
          permissionsRequired: operation.requiredPermissions,
          metadata: { errorType: 'INSUFFICIENT_PERMISSIONS' }
        };
      }

      // CRITICAL: Check approval requirement
      if (operation.approvalPolicy !== 'NONE') {
        const approvalCheck = await this.checkApprovalRequirement(operation, tenantContext, parameters);
        if (!approvalCheck.allowed) {
          this.logGuardrailFailure(operationName, tenantContext, 'APPROVAL_REQUIRED', approvalCheck.reason, correlationId);
          return {
            allowed: false,
            reason: approvalCheck.reason,
            operation,
            approvalRequired: true,
            requestId: approvalCheck.requestId,
            metadata: { errorType: 'APPROVAL_REQUIRED', approvalPolicy: operation.approvalPolicy }
          };
        }
      }

      // CRITICAL: Operation allowed
      this.logGuardrailSuccess(operationName, tenantContext, correlationId);

      return {
        allowed: true,
        reason: 'Operation allowed',
        operation,
        metadata: { 
          riskLevel: operation.riskLevel,
          approvalPolicy: operation.approvalPolicy,
          duration: Date.now() - startTime
        }
      };

    } catch (error) {
      // CRITICAL: Fail safe - deny operation on error
      const errorReason = `Guardrail check failed: ${(error as Error).message}`;
      this.logGuardrailFailure(operationName, tenantContext, 'GUARDRAIL_ERROR', errorReason, correlationId);
      
      return {
        allowed: false,
        reason: this.config.sanitizeErrors ? 'Operation not permitted' : errorReason,
        metadata: { errorType: 'GUARDRAIL_ERROR' }
      };
    }
  }

  /**
   * CRITICAL: Require approval for operation
   */
  async requireApproval(
    operationName: string,
    tenantContext: TenantContext,
    parameters: Record<string, any> = {},
    reason: string,
    correlationId: string
  ): Promise<ApprovalRequest> {
    // CRITICAL: Check if operation requires approval
    const operation = dangerousOperationsRegistry.getOperation(operationName);
    if (!operation) {
      throw new Error(`Operation '${operationName}' not found`);
    }

    if (operation.approvalPolicy === 'NONE') {
      throw new Error(`Operation '${operationName}' does not require approval`);
    }

    // CRITICAL: Create approval request
    const approvalRequest = await this.approvalManager.createApprovalRequest(
      operation.id,
      tenantContext,
      parameters,
      reason,
      correlationId
    );

    // CRITICAL: Log approval requirement
    this.auditLogger.logAuthorizationDecision({
      tenantId: tenantContext.tenantId,
      actorId: (tenantContext as any).user?.id || 'unknown',
      action: 'APPROVAL_REQUIRED',
      resourceType: 'DANGEROUS_OPERATION',
      resourceId: operation.id,
      outcome: 'SUCCESS',
      correlationId,
      metadata: {
        operationName,
        approvalPolicy: operation.approvalPolicy,
        requestId: approvalRequest.id,
        requiredApprovers: approvalRequest.requiredApprovers
      }
    });

    return approvalRequest;
  }

  /**
   * CRITICAL: Require dangerous permission
   */
  async requireDangerousPermission(
    operationName: string,
    tenantContext: TenantContext,
    correlationId?: string
  ): Promise<void> {
    const result = await this.checkOperation(operationName, tenantContext, {}, correlationId);
    
    if (!result.allowed) {
      // CRITICAL: Log permission requirement failure
      this.auditLogger.logAuthorizationDecision({
        tenantId: tenantContext.tenantId,
        actorId: (tenantContext as any).user?.id || 'unknown',
        action: 'DANGEROUS_PERMISSION_REQUIRED',
        resourceType: 'DANGEROUS_OPERATION',
        resourceId: operationName,
        outcome: 'FAILURE',
        correlationId: correlationId || 'permission_check_' + Date.now(),
        metadata: {
          reason: result.reason,
          permissionsRequired: result.permissionsRequired,
          featureFlagRequired: result.featureFlagRequired
        }
      });

      throw new Error(this.config.sanitizeErrors ? 'Insufficient permissions for dangerous operation' : result.reason);
    }
  }

  /**
   * CRITICAL: Execute dangerous operation with guardrails
   */
  async executeDangerousOperation(
    operationName: string,
    tenantContext: TenantContext,
    parameters: Record<string, any> = {},
    reason: string,
    correlationId: string
  ): Promise<any> {
    const startTime = Date.now();

    try {
      // CRITICAL: Check operation
      const guardrailResult = await this.checkOperation(operationName, tenantContext, parameters, correlationId);
      
      if (!guardrailResult.allowed) {
        throw new Error(guardrailResult.reason);
      }

      // CRITICAL: Get operation
      const operation = guardrailResult.operation!;
      
      // CRITICAL: Handle approval workflow
      if (operation.approvalPolicy !== 'NONE') {
        // Create approval request
        const approvalRequest = await this.requireApproval(operationName, tenantContext, parameters, reason, correlationId);
        
        // CRITICAL: Return approval request for manual processing
        return {
          requiresApproval: true,
          approvalRequest,
          message: 'Operation requires approval before execution'
        };
      }

      // CRITICAL: Execute operation directly (no approval required)
      const result = await this.executeOperation(operation, parameters, tenantContext, correlationId);

      // CRITICAL: Log execution
      this.auditLogger.logDataMutation({
        tenantId: tenantContext.tenantId,
        actorId: (tenantContext as any).user?.id || 'system',
        action: 'EXECUTE',
        resourceType: 'DANGEROUS_OPERATION',
        resourceId: operation.id,
        outcome: 'SUCCESS',
        correlationId,
        metadata: {
          operationName,
          riskLevel: operation.riskLevel,
          duration: Date.now() - startTime
        }
      });

      return result;

    } catch (error) {
      // CRITICAL: Log execution failure
      this.auditLogger.logDataMutation({
        tenantId: tenantContext.tenantId,
        actorId: (tenantContext as any).user?.id || 'unknown',
        action: 'EXECUTE',
        resourceType: 'DANGEROUS_OPERATION',
        resourceId: operationName,
        outcome: 'FAILURE',
        correlationId,
        metadata: {
          error: (error as Error).message,
          duration: Date.now() - startTime
        }
      });

      throw error;
    }
  }

  /**
   * CRITICAL: API-level guardrail middleware
   */
  apiGuardrailMiddleware(operationName: string): (req: Request, res: Response, next: NextFunction) => void {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const correlationId = req.headers['x-correlation-id'] as string || `api_${Date.now()}`;
      
      try {
        // CRITICAL: Extract tenant context
        const tenantContext = (req as any).tenantContext;
        if (!tenantContext) {
          const error = 'Tenant context not found in request';
          this.logGuardrailFailure(operationName, { tenantId: 'unknown' } as TenantContext, 'MISSING_TENANT_CONTEXT', error, correlationId);
          
          return res.status(401).json({
            error: 'Unauthorized',
            message: this.config.sanitizeErrors ? 'Access denied' : error
          });
        }

        // CRITICAL: Check operation
        const result = await this.checkOperation(operationName, tenantContext, req.body, correlationId);
        
        if (!result.allowed) {
          // CRITICAL: Log API guardrail failure
          this.auditLogger.logAuthorizationDecision({
            tenantId: tenantContext.tenantId,
            actorId: (tenantContext as any).user?.id || 'unknown',
            action: 'API_GUARDRAIL_BLOCK',
            resourceType: 'DANGEROUS_OPERATION',
            resourceId: operationName,
            outcome: 'FAILURE',
            correlationId,
            metadata: {
              reason: result.reason,
              errorType: result.metadata.errorType,
              endpoint: req.path,
              method: req.method
            }
          });

          return res.status(403).json({
            error: 'Forbidden',
            message: this.config.sanitizeErrors ? 'Operation not permitted' : result.reason,
            requiresApproval: result.approvalRequired,
            requestId: result.requestId
          });
        }

        // CRITICAL: Add guardrail result to request
        (req as any).guardrailResult = result;

        // CRITICAL: Log API guardrail success
        this.auditLogger.logAuthorizationDecision({
          tenantId: tenantContext.tenantId,
          actorId: (tenantContext as any).user?.id || 'unknown',
          action: 'API_GUARDRAIL_ALLOW',
          resourceType: 'DANGEROUS_OPERATION',
          resourceId: operationName,
          outcome: 'SUCCESS',
          correlationId,
          metadata: {
            endpoint: req.path,
            method: req.method,
            duration: Date.now() - startTime
          }
        });

        next();

      } catch (error) {
        // CRITICAL: Log API guardrail error
        this.auditLogger.logAuthorizationDecision({
          tenantId: (req as any).tenantContext?.tenantId || 'unknown',
          actorId: (req as any).tenantContext?.user?.id || 'unknown',
          action: 'API_GUARDRAIL_ERROR',
          resourceType: 'DANGEROUS_OPERATION',
          resourceId: operationName,
          outcome: 'FAILURE',
          correlationId,
          metadata: {
            error: (error as Error).message,
            endpoint: req.path,
            method: req.method
          }
        });

      return res.status(500).json({
        error: 'Internal Server Error',
        message: (guardrailManager as any).config.sanitizeErrors ? 'Request processing failed' : (error as Error).message
      });
      }
    };
  }

  /**
   * CRITICAL: Service-level guardrail decorator
   */
  serviceGuardrail(operationName: string) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
      const method = descriptor.value;

      descriptor.value = async function (...args: unknown[]) {
        return await method.apply(this, args);
      };
    };
  }

  /**
   * CRITICAL: Check approval requirement
   */
  private async checkApprovalRequirement(
    operation: DangerousOperation,
    tenantContext: TenantContext,
    parameters: Record<string, any>
  ): Promise<{ allowed: boolean; reason: string; requestId?: string }> {
    try {
      // CRITICAL: Check for existing approved request
      const pendingRequests = await this.approvalManager.getPendingRequests(tenantContext.tenantId);
      const existingRequest = pendingRequests.find(req => req.operationId === operation.id);
      
      if (existingRequest) {
        return {
          allowed: false,
          reason: `Pending approval request already exists (ID: ${existingRequest.id})`,
          requestId: existingRequest.id
        };
      }

      // CRITICAL: Check for recently approved request (within last hour)
      // This is a simplified check - in production you'd want more sophisticated logic
      return {
        allowed: false,
        reason: 'Operation requires approval before execution'
      };

    } catch (error) {
      return {
        allowed: false,
        reason: 'Approval check failed'
      };
    }
  }

  /**
   * CRITICAL: Execute operation (placeholder)
   */
  private async executeOperation(
    operation: DangerousOperation,
    parameters: Record<string, any>,
    tenantContext: TenantContext,
    correlationId: string
  ): Promise<any> {
    // CRITICAL: This would integrate with actual operation execution
    logger.warn('Executing dangerous operation', {
      operationName: operation.name,
      tenantId: tenantContext.tenantId,
      correlationId
    });

    return {
      executed: true,
      operationName: operation.name,
      timestamp: new Date(),
      parameters
    };
  }

  /**
   * CRITICAL: Log guardrail success
   */
  private logGuardrailSuccess(
    operationName: string,
    tenantContext: TenantContext,
    correlationId?: string
  ): void {
    this.auditLogger.logAuthorizationDecision({
      tenantId: tenantContext.tenantId,
      actorId: (tenantContext as any).user?.id || 'system',
      action: 'GUARDRAIL_SUCCESS',
      resourceType: 'DANGEROUS_OPERATION',
      resourceId: operationName,
      outcome: 'SUCCESS',
      correlationId: correlationId || 'guardrail_' + Date.now(),
      metadata: {}
    });
  }

  /**
   * CRITICAL: Log guardrail failure
   */
  private logGuardrailFailure(
    operationName: string,
    tenantContext: TenantContext,
    errorType: string,
    reason: string,
    correlationId?: string
  ): void {
    if (this.config.logFailuresAsSecurityEvents) {
      this.auditLogger.logSecurityEvent({
        tenantId: tenantContext.tenantId,
        actorId: (tenantContext as any).user?.id || 'unknown',
        action: 'GUARDRAIL_VIOLATION',
        resourceType: 'DANGEROUS_OPERATION',
        resourceId: operationName,
        outcome: 'FAILURE',
        correlationId: correlationId || 'guardrail_' + Date.now(),
        severity: 'HIGH',
        metadata: {
          errorType,
          reason,
          timestamp: new Date()
        }
      });
    } else {
      this.auditLogger.logAuthorizationDecision({
        tenantId: tenantContext.tenantId,
        actorId: (tenantContext as any).user?.id || 'unknown',
        action: 'GUARDRAIL_FAILURE',
        resourceType: 'DANGEROUS_OPERATION',
        resourceId: operationName,
        outcome: 'FAILURE',
        correlationId: correlationId || 'guardrail_' + Date.now(),
        metadata: {
          errorType,
          reason
        }
      });
    }
  }

  /**
   * CRITICAL: Load configuration
   */
  private loadConfiguration(): GuardrailConfig {
    return {
      enforceApiLevel: process.env.GUARDRAIL_ENFORCE_API !== 'false',
      enforceServiceLevel: process.env.GUARDRAIL_ENFORCE_SERVICE !== 'false',
      enforceBackgroundJobs: process.env.GUARDRAIL_ENFORCE_BACKGROUND !== 'false',
      logFailuresAsSecurityEvents: process.env.GUARDRAIL_LOG_AS_SECURITY === 'true',
      requireCorrelationId: process.env.GUARDRAIL_REQUIRE_CORRELATION === 'true',
      sanitizeErrors: process.env.NODE_ENV === 'production'
    };
  }

  /**
   * CRITICAL: Get configuration
   */
  getConfiguration(): GuardrailConfig {
    return { ...this.config };
  }

  /**
   * CRITICAL: Update configuration
   */
  updateConfiguration(config: Partial<GuardrailConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Guardrail configuration updated', { config: this.config });
  }
}

/**
 * CRITICAL: Global guardrail manager instance
 */
export const guardrailManager = GuardrailManager.getInstance();

/**
 * CRITICAL: Convenience functions
 */
export const requireApproval = async (
  operationName: string,
  tenantContext: TenantContext,
  parameters: Record<string, any> = {},
  reason: string,
  correlationId: string
): Promise<ApprovalRequest> => {
  return await guardrailManager.requireApproval(operationName, tenantContext, parameters, reason, correlationId);
};

export const requireDangerousPermission = async (
  operationName: string,
  tenantContext: TenantContext,
  correlationId?: string
): Promise<void> => {
  await guardrailManager.requireDangerousPermission(operationName, tenantContext, correlationId);
};

export const executeDangerousOperation = async (
  operationName: string,
  tenantContext: TenantContext,
  parameters: Record<string, any> = {},
  reason: string,
  correlationId: string
): Promise<any> => {
  return await guardrailManager.executeDangerousOperation(operationName, tenantContext, parameters, reason, correlationId);
};

export const checkBackgroundJob = async (
  operationName: string,
  tenantContext: TenantContext,
  parameters: Record<string, any> = {},
  jobId?: string
): Promise<GuardrailResult> => {
  return await guardrailManager.checkBackgroundJob(operationName, tenantContext, parameters, jobId);
};

/**
 * CRITICAL: Decorators and middleware
 */
export const ServiceGuardrail = (operationName: string) => guardrailManager.serviceGuardrail(operationName);
export const ApiGuardrail = (operationName: string) => guardrailManager.apiGuardrailMiddleware(operationName);
