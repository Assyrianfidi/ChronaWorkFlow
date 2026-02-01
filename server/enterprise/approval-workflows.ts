// CRITICAL: Approval Workflows
// MANDATORY: Two-step approval workflow with configurable policies

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/structured-logger.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { dangerousOperationsRegistry, DangerousOperation, ApprovalPolicy } from './dangerous-operations.js';
import { TenantContext } from '../tenant/tenant-isolation.js';
import crypto from 'crypto';

export interface ApprovalRequest {
  id: string;
  operationId: string;
  operationName: string;
  tenantId: string;
  requestedBy: string;
  correlationId: string;
  parameters: Record<string, any>;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'EXECUTED' | 'FAILED';
  approvalPolicy: ApprovalPolicy;
  requiredApprovers: number;
  currentApprovals: string[];
  rejections: string[];
  expiresAt: Date;
  requestedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  executedAt?: Date;
  executedBy?: string;
  executionResult?: any;
  executionError?: string;
  metadata: Record<string, any>;
}

export interface ApprovalDecision {
  requestId: string;
  approverId: string;
  decision: 'APPROVE' | 'REJECT';
  reason: string;
  correlationId: string;
  metadata?: Record<string, any>;
}

export interface ExecutionResult {
  requestId: string;
  status: 'SUCCESS' | 'FAILED';
  result?: any;
  error?: string;
  duration: number;
  executedBy: string;
  executedAt: Date;
  metadata: Record<string, any>;
}

/**
 * CRITICAL: Approval Workflow Manager
 * 
 * This class manages two-step approval workflows for dangerous operations
 * with configurable policies and comprehensive audit logging.
 */
export class ApprovalWorkflowManager {
  private static instance: ApprovalWorkflowManager;
  private prisma: PrismaClient;
  private auditLogger: any;
  private requestCache: Map<string, ApprovalRequest> = new Map();
  private cacheTimeoutMs = 600000; // 10 minutes

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.auditLogger = getImmutableAuditLogger(prisma);
  }

  /**
   * CRITICAL: Get singleton instance
   */
  static getInstance(prisma?: PrismaClient): ApprovalWorkflowManager {
    if (!ApprovalWorkflowManager.instance) {
      if (!prisma) {
        throw new Error('Prisma client required for first initialization');
      }
      ApprovalWorkflowManager.instance = new ApprovalWorkflowManager(prisma);
    }
    return ApprovalWorkflowManager.instance;
  }

  /**
   * CRITICAL: Create approval request
   */
  async createApprovalRequest(
    operationId: string,
    tenantContext: TenantContext,
    parameters: Record<string, any>,
    reason: string,
    correlationId: string
  ): Promise<ApprovalRequest> {
    const startTime = Date.now();

    try {
      // CRITICAL: Get operation definition
      const operation = dangerousOperationsRegistry.getOperationById(operationId);
      if (!operation) {
        throw new Error(`Operation '${operationId}' not found in registry`);
      }

      // CRITICAL: Check if operation requires approval
      if (operation.approvalPolicy === 'NONE') {
        throw new Error(`Operation '${operation.name}' does not require approval`);
      }

      // CRITICAL: Validate request
      const validationResult = dangerousOperationsRegistry.validateOperationRequest({
        operationId,
        tenantId: tenantContext.tenantId,
        requestedBy: (tenantContext as any).user?.id || 'unknown',
        correlationId,
        parameters,
        reason
      });

      if (!validationResult.valid) {
        throw new Error(`Invalid request: ${validationResult.errors.join(', ')}`);
      }

      // CRITICAL: Check for existing pending request
      const existingRequest = await this.getPendingRequest(operationId, tenantContext.tenantId);
      if (existingRequest) {
        throw new Error(`Pending approval request already exists for operation '${operation.name}'`);
      }

      // CRITICAL: Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

      // CRITICAL: Calculate required approvers
      const requiredApprovers = this.calculateRequiredApprovers(operation);

      // CRITICAL: Create approval request
      const requestId = this.generateRequestId();
      const request: ApprovalRequest = {
        id: requestId,
        operationId,
        operationName: operation.name,
        tenantId: tenantContext.tenantId,
        requestedBy: (tenantContext as any).user?.id || 'unknown',
        correlationId,
        parameters,
        reason,
        status: 'PENDING',
        approvalPolicy: operation.approvalPolicy,
        requiredApprovers,
        currentApprovals: [],
        rejections: [],
        expiresAt,
        requestedAt: new Date(),
        metadata: {
          operationCategory: operation.category,
          riskLevel: operation.riskLevel,
          irreversible: operation.irreversible,
          featureFlag: operation.featureFlag
        }
      };

      // CRITICAL: Store request
      await this.storeApprovalRequest(request);

      // CRITICAL: Cache request
      this.requestCache.set(requestId, request);

      // CRITICAL: Log request creation
      this.auditLogger.logDataMutation({
        tenantId: tenantContext.tenantId,
        actorId: request.requestedBy,
        action: 'CREATE',
        resourceType: 'APPROVAL_REQUEST',
        resourceId: requestId,
        outcome: 'SUCCESS',
        correlationId,
        metadata: {
          operationName: operation.name,
          operationCategory: operation.category,
          riskLevel: operation.riskLevel,
          approvalPolicy: operation.approvalPolicy,
          requiredApprovers,
          reason,
          duration: Date.now() - startTime
        }
      });

      logger.info('Approval request created', {
        requestId,
        operationName: operation.name,
        tenantId: tenantContext.tenantId,
        requestedBy: request.requestedBy,
        approvalPolicy: operation.approvalPolicy,
        requiredApprovers,
        duration: Date.now() - startTime
      });

      return request;

    } catch (error) {
      // CRITICAL: Log failed request creation
      this.auditLogger.logDataMutation({
        tenantId: tenantContext.tenantId,
        actorId: (tenantContext as any).user?.id || 'unknown',
        action: 'CREATE',
        resourceType: 'APPROVAL_REQUEST',
        resourceId: 'unknown',
        outcome: 'FAILURE',
        correlationId,
        metadata: {
          operationId,
          error: (error as Error).message
        }
      });

      logger.error('Failed to create approval request', error as Error, {
        operationId,
        tenantId: tenantContext.tenantId
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Approve or reject request
   */
  async processApprovalDecision(decision: ApprovalDecision, tenantContext: TenantContext): Promise<ApprovalRequest> {
    const startTime = Date.now();

    try {
      // CRITICAL: Get request
      const request = await this.getApprovalRequest(decision.requestId);
      if (!request) {
        throw new Error(`Approval request '${decision.requestId}' not found`);
      }

      // CRITICAL: Validate tenant context
      if (request.tenantId !== tenantContext.tenantId) {
        throw new Error('Tenant context mismatch');
      }

      // CRITICAL: Check request status
      if (request.status !== 'PENDING') {
        throw new Error(`Request is not pending (current status: ${request.status})`);
      }

      // CRITICAL: Check if expired
      if (new Date() > request.expiresAt) {
        await this.expireRequest(decision.requestId);
        throw new Error('Approval request has expired');
      }

      // CRITICAL: Check for self-approval
      if (request.requestedBy === decision.approverId) {
        throw new Error('Self-approval is not allowed');
      }

      // CRITICAL: Check if already decided
      if (request.currentApprovals.includes(decision.approverId) || request.rejections.includes(decision.approverId)) {
        throw new Error('Approver has already decided on this request');
      }

      // CRITICAL: Process decision
      const updatedRequest = await this.applyApprovalDecision(request, decision, tenantContext);

      // CRITICAL: Cache updated request
      this.requestCache.set(decision.requestId, updatedRequest);

      // CRITICAL: Log decision
      this.auditLogger.logAuthorizationDecision({
        tenantId: tenantContext.tenantId,
        actorId: decision.approverId,
        action: decision.decision,
        resourceType: 'APPROVAL_REQUEST',
        resourceId: decision.requestId,
        outcome: 'SUCCESS',
        correlationId: decision.correlationId,
        metadata: {
          operationName: request.operationName,
          approvalPolicy: request.approvalPolicy,
          currentApprovals: updatedRequest.currentApprovals.length,
          requiredApprovers: updatedRequest.requiredApprovers,
          reason: decision.reason,
          duration: Date.now() - startTime
        }
      });

      logger.info('Approval decision processed', {
        requestId: decision.requestId,
        decision: decision.decision,
        approverId: decision.approverId,
        operationName: request.operationName,
        currentApprovals: updatedRequest.currentApprovals.length,
        requiredApprovers: updatedRequest.requiredApprovers,
        duration: Date.now() - startTime
      });

      return updatedRequest;

    } catch (error) {
      // CRITICAL: Log failed decision
      this.auditLogger.logAuthorizationDecision({
        tenantId: tenantContext.tenantId,
        actorId: decision.approverId,
        action: decision.decision,
        resourceType: 'APPROVAL_REQUEST',
        resourceId: decision.requestId,
        outcome: 'FAILURE',
        correlationId: decision.correlationId,
        metadata: {
          error: (error as Error).message
        }
      });

      logger.error('Failed to process approval decision', error as Error, {
        requestId: decision.requestId,
        decision: decision.decision,
        approverId: decision.approverId
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Execute approved operation
   */
  async executeApprovedOperation(
    requestId: string,
    tenantContext: TenantContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // CRITICAL: Get request
      const request = await this.getApprovalRequest(requestId);
      if (!request) {
        throw new Error(`Approval request '${requestId}' not found`);
      }

      // CRITICAL: Validate tenant context
      if (request.tenantId !== tenantContext.tenantId) {
        throw new Error('Tenant context mismatch');
      }

      // CRITICAL: Check if approved
      if (request.status !== 'APPROVED') {
        throw new Error(`Request is not approved (current status: ${request.status})`);
      }

      // CRITICAL: Check if already executed
      if ((request.status as string) === 'EXECUTED') {
        throw new Error('Request has already been executed');
      }

      // CRITICAL: Execute operation
      const result = await this.performOperationExecution(request, tenantContext);

      // CRITICAL: Update request
      await this.updateRequestExecution(requestId, result, tenantContext);

      // CRITICAL: Log execution
      this.auditLogger.logDataMutation({
        tenantId: tenantContext.tenantId,
        actorId: result.executedBy,
        action: 'EXECUTE',
        resourceType: 'DANGEROUS_OPERATION',
        resourceId: request.operationId,
        outcome: result.status,
        correlationId: request.correlationId,
        metadata: {
          operationName: request.operationName,
          requestId,
          duration: result.duration,
          success: result.status === 'SUCCESS'
        }
      });

      logger.info('Dangerous operation executed', {
        requestId,
        operationName: request.operationName,
        status: result.status,
        executedBy: result.executedBy,
        duration: result.duration
      });

      return result;

    } catch (error) {
      // CRITICAL: Log failed execution
      this.auditLogger.logDataMutation({
        tenantId: tenantContext.tenantId,
        actorId: (tenantContext as any).user?.id || 'unknown',
        action: 'EXECUTE',
        resourceType: 'DANGEROUS_OPERATION',
        resourceId: requestId,
        outcome: 'FAILURE',
        correlationId: 'execution_' + Date.now(),
        metadata: {
          error: (error as Error).message
        }
      });

      logger.error('Failed to execute dangerous operation', error as Error, {
        requestId
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Get approval request
   */
  async getApprovalRequest(requestId: string): Promise<ApprovalRequest | null> {
    try {
      // CRITICAL: Check cache first
      const cached = this.requestCache.get(requestId);
      if (cached) {
        return cached;
      }

      // CRITICAL: Get from database
      const result = await this.prisma.$queryRaw`
        SELECT id, operation_id, operation_name, tenant_id, requested_by, correlation_id,
               parameters, reason, status, approval_policy, required_approvers,
               current_approvals, rejections, expires_at, requested_at,
               approved_at, rejected_at, executed_at, executed_by,
               execution_result, execution_error, metadata
        FROM approval_requests
        WHERE id = ${requestId}
      ` as ApprovalRequest[];

      if (result.length === 0) {
        return null;
      }

      const request = result[0];
      
      // CRITICAL: Parse JSON fields
      if (typeof request.parameters === 'string') {
        request.parameters = JSON.parse(request.parameters);
      }
      if (typeof request.currentApprovals === 'string') {
        request.currentApprovals = JSON.parse(request.currentApprovals);
      }
      if (typeof request.rejections === 'string') {
        request.rejections = JSON.parse(request.rejections);
      }
      if (typeof request.metadata === 'string') {
        request.metadata = JSON.parse(request.metadata);
      }

      // CRITICAL: Cache request
      this.requestCache.set(requestId, request);

      return request;

    } catch (error) {
      logger.error('Failed to get approval request', error as Error, { requestId });
      return null;
    }
  }

  /**
   * CRITICAL: Get pending requests for tenant
   */
  async getPendingRequests(tenantId: string): Promise<ApprovalRequest[]> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT id, operation_id, operation_name, tenant_id, requested_by, correlation_id,
               parameters, reason, status, approval_policy, required_approvers,
               current_approvals, rejections, expires_at, requested_at,
               approved_at, rejected_at, executed_at, executed_by,
               execution_result, execution_error, metadata
        FROM approval_requests
        WHERE tenant_id = ${tenantId} AND status = 'PENDING'
        ORDER BY requested_at DESC
      ` as ApprovalRequest[];

      // CRITICAL: Parse JSON fields
      for (const request of result) {
        if (typeof request.parameters === 'string') {
          request.parameters = JSON.parse(request.parameters);
        }
        if (typeof request.currentApprovals === 'string') {
          request.currentApprovals = JSON.parse(request.currentApprovals);
        }
        if (typeof request.rejections === 'string') {
          request.rejections = JSON.parse(request.rejections);
        }
        if (typeof request.metadata === 'string') {
          request.metadata = JSON.parse(request.metadata);
        }
      }

      return result;

    } catch (error) {
      logger.error('Failed to get pending requests', error as Error, { tenantId });
      throw error;
    }
  }

  /**
   * CRITICAL: Get approval statistics
   */
  async getApprovalStatistics(tenantId?: string): Promise<{
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    executedRequests: number;
    expiredRequests: number;
    averageApprovalTime: number;
    approvalRate: number;
  }> {
    try {
      const whereClause = tenantId ? `WHERE tenant_id = ${tenantId}` : '';
      
      const result = await this.prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_requests,
          COUNT(*) FILTER (WHERE status = 'PENDING') as pending_requests,
          COUNT(*) FILTER (WHERE status = 'APPROVED') as approved_requests,
          COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected_requests,
          COUNT(*) FILTER (WHERE status = 'EXECUTED') as executed_requests,
          COUNT(*) FILTER (WHERE status = 'EXPIRED') as expired_requests,
          AVG(EXTRACT(EPOCH FROM (approved_at - requested_at))) as avg_approval_time
        FROM approval_requests
        ${whereClause}
      ` as Array<{
        total_requests: bigint;
        pending_requests: bigint;
        approved_requests: bigint;
        rejected_requests: bigint;
        executed_requests: bigint;
        expired_requests: bigint;
        avg_approval_time: number;
      }>;

      const stats = result[0];
      const total = Number(stats.total_requests);
      const approved = Number(stats.approved_requests);

      return {
        totalRequests: total,
        pendingRequests: Number(stats.pending_requests),
        approvedRequests: approved,
        rejectedRequests: Number(stats.rejected_requests),
        executedRequests: Number(stats.executed_requests),
        expiredRequests: Number(stats.expired_requests),
        averageApprovalTime: stats.avg_approval_time || 0,
        approvalRate: total > 0 ? (approved / total) * 100 : 0
      };

    } catch (error) {
      logger.error('Failed to get approval statistics', error as Error);
      throw error;
    }
  }

  /**
   * CRITICAL: Calculate required approvers
   */
  private calculateRequiredApprovers(operation: DangerousOperation): number {
    switch (operation.approvalPolicy) {
      case 'SINGLE_ADMIN':
        return 1;
      case 'MULTI_ADMIN':
        return operation.multiAdminConfig?.requiredApprovers || 2;
      case 'OWNER_ONLY':
        return 1;
      default:
        return 0;
    }
  }

  /**
   * CRITICAL: Apply approval decision
   */
  private async applyApprovalDecision(
    request: ApprovalRequest,
    decision: ApprovalDecision,
    tenantContext: TenantContext
  ): Promise<ApprovalRequest> {
    const updatedRequest = { ...request };

    if (decision.decision === 'APPROVE') {
      updatedRequest.currentApprovals.push(decision.approverId);
      
      // CRITICAL: Check if fully approved
      if (updatedRequest.currentApprovals.length >= updatedRequest.requiredApprovers) {
        updatedRequest.status = 'APPROVED';
        updatedRequest.approvedAt = new Date();
      }
    } else {
      updatedRequest.rejections.push(decision.approverId);
      updatedRequest.status = 'REJECTED';
      updatedRequest.rejectedAt = new Date();
    }

    // CRITICAL: Update in database
    await this.updateApprovalRequest(updatedRequest);

    return updatedRequest;
  }

  /**
   * CRITICAL: Perform operation execution
   */
  private async performOperationExecution(
    request: ApprovalRequest,
    tenantContext: TenantContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const executedBy = (tenantContext as any).user?.id || 'system';

    try {
      // CRITICAL: Get operation definition
      const operation = dangerousOperationsRegistry.getOperationById(request.operationId);
      if (!operation) {
        throw new Error(`Operation '${request.operationId}' not found`);
      }

      // CRITICAL: Execute operation based on type
      let result: any;

      switch (request.operationName) {
        case 'TENANT_DELETION':
          result = await this.executeTenantDeletion(request.parameters, tenantContext);
          break;
        case 'TENANT_OWNERSHIP_TRANSFER':
          result = await this.executeOwnershipTransfer(request.parameters, tenantContext);
          break;
        case 'DATA_PURGE':
          result = await this.executeDataPurge(request.parameters, tenantContext);
          break;
        case 'LEGAL_HOLD_REMOVAL':
          result = await this.executeLegalHoldRemoval(request.parameters, tenantContext);
          break;
        case 'AUDIT_LOG_OVERRIDE':
          result = await this.executeAuditLogOverride(request.parameters, tenantContext);
          break;
        case 'SUBSCRIPTION_DOWNGRADE':
          result = await this.executeSubscriptionDowngrade(request.parameters, tenantContext);
          break;
        default:
          throw new Error(`Unknown operation: ${request.operationName}`);
      }

      return {
        requestId: request.id,
        status: 'SUCCESS',
        result,
        duration: Date.now() - startTime,
        executedBy,
        executedAt: new Date(),
        metadata: {
          operationName: request.operationName,
          operationCategory: operation.category
        }
      };

    } catch (error) {
      return {
        requestId: request.id,
        status: 'FAILED',
        error: (error as Error).message,
        duration: Date.now() - startTime,
        executedBy,
        executedAt: new Date(),
        metadata: {
          operationName: request.operationName
        }
      };
    }
  }

  /**
   * CRITICAL: Operation execution implementations (placeholders)
   */
  private async executeTenantDeletion(parameters: Record<string, any>, tenantContext: TenantContext): Promise<any> {
    // CRITICAL: Placeholder implementation
    logger.warn('Tenant deletion execution', { parameters, tenantId: tenantContext.tenantId });
    return { deleted: true, tenantId: parameters.tenantId };
  }

  private async executeOwnershipTransfer(parameters: Record<string, any>, tenantContext: TenantContext): Promise<any> {
    // CRITICAL: Placeholder implementation
    logger.warn('Ownership transfer execution', { parameters, tenantId: tenantContext.tenantId });
    return { transferred: true, newOwnerId: parameters.newOwnerId };
  }

  private async executeDataPurge(parameters: Record<string, any>, tenantContext: TenantContext): Promise<any> {
    // CRITICAL: Placeholder implementation
    logger.warn('Data purge execution', { parameters, tenantId: tenantContext.tenantId });
    return { purged: true, dataType: parameters.dataType, recordsDeleted: 0 };
  }

  private async executeLegalHoldRemoval(parameters: Record<string, any>, tenantContext: TenantContext): Promise<any> {
    // CRITICAL: Placeholder implementation
    logger.warn('Legal hold removal execution', { parameters, tenantId: tenantContext.tenantId });
    return { removed: true, legalHoldId: parameters.legalHoldId };
  }

  private async executeAuditLogOverride(parameters: Record<string, any>, tenantContext: TenantContext): Promise<any> {
    // CRITICAL: Placeholder implementation
    logger.warn('Audit log override execution', { parameters, tenantId: tenantContext.tenantId });
    return { overridden: true, overrideReason: parameters.overrideReason };
  }

  private async executeSubscriptionDowngrade(parameters: Record<string, any>, tenantContext: TenantContext): Promise<any> {
    // CRITICAL: Placeholder implementation
    logger.warn('Subscription downgrade execution', { parameters, tenantId: tenantContext.tenantId });
    return { downgraded: true, targetTier: parameters.targetTier };
  }

  /**
   CRITICAL: Database operations
   */
  private async storeApprovalRequest(request: ApprovalRequest): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO approval_requests (
        id, operation_id, operation_name, tenant_id, requested_by, correlation_id,
        parameters, reason, status, approval_policy, required_approvers,
        current_approvals, rejections, expires_at, requested_at, metadata
      ) VALUES (
        ${request.id}, ${request.operationId}, ${request.operationName}, ${request.tenantId},
        ${request.requestedBy}, ${request.correlationId}, ${JSON.stringify(request.parameters)},
        ${request.reason}, ${request.status}, ${request.approvalPolicy}, ${request.requiredApprovers},
        ${JSON.stringify(request.currentApprovals)}, ${JSON.stringify(request.rejections)},
        ${request.expiresAt}, ${request.requestedAt}, ${JSON.stringify(request.metadata)}
      )
    `;
  }

  private async updateApprovalRequest(request: ApprovalRequest): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE approval_requests
      SET 
        status = ${request.status},
        current_approvals = ${JSON.stringify(request.currentApprovals)},
        rejections = ${JSON.stringify(request.rejections)},
        approved_at = ${request.approvedAt},
        rejected_at = ${request.rejectedAt},
        updated_at = NOW()
      WHERE id = ${request.id}
    `;
  }

  private async updateRequestExecution(requestId: string, result: ExecutionResult, tenantContext: TenantContext): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE approval_requests
      SET 
        status = 'EXECUTED',
        executed_at = ${result.executedAt},
        executed_by = ${result.executedBy},
        execution_result = ${JSON.stringify(result.result)},
        execution_error = ${result.error},
        updated_at = NOW()
      WHERE id = ${requestId}
    `;
  }

  private async getPendingRequest(operationId: string, tenantId: string): Promise<ApprovalRequest | null> {
    const result = await this.prisma.$queryRaw`
      SELECT id FROM approval_requests
      WHERE operation_id = ${operationId} AND tenant_id = ${tenantId} AND status = 'PENDING'
    ` as Array<{ id: string }>;

    if (result.length === 0) {
      return null;
    }

    return this.getApprovalRequest(result[0].id);
  }

  private async expireRequest(requestId: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE approval_requests
      SET status = 'EXPIRED', updated_at = NOW()
      WHERE id = ${requestId}
    `;
  }

  /**
   * CRITICAL: Generate request ID
   */
  private generateRequestId(): string {
    const bytes = crypto.randomBytes(16);
    return `approval_${bytes.toString('hex')}`;
  }

  /**
   * CRITICAL: Clear cache
   */
  clearCache(): void {
    this.requestCache.clear();
    logger.info('Approval workflow cache cleared');
  }

  /**
   * CRITICAL: Get cache statistics
   */
  getCacheStatistics(): {
    cacheSize: number;
    cacheTimeoutMs: number;
  } {
    return {
      cacheSize: this.requestCache.size,
      cacheTimeoutMs: this.cacheTimeoutMs
    };
  }
}

/**
 * CRITICAL: Global approval workflow manager instance
 */
let globalApprovalWorkflowManager: ApprovalWorkflowManager | null = null;

export const createApprovalWorkflowManager = (prisma: PrismaClient): ApprovalWorkflowManager => {
  return new ApprovalWorkflowManager(prisma);
};

export const getApprovalWorkflowManager = (prisma?: PrismaClient): ApprovalWorkflowManager => {
  if (!globalApprovalWorkflowManager) {
    if (!prisma) {
      throw new Error('Prisma client required for first initialization');
    }
    globalApprovalWorkflowManager = new ApprovalWorkflowManager(prisma);
  }
  return globalApprovalWorkflowManager!;
};

/**
 * CRITICAL: Convenience functions
 */
export const createApprovalRequest = async (
  operationId: string,
  tenantContext: TenantContext,
  parameters: Record<string, any>,
  reason: string,
  correlationId: string
): Promise<ApprovalRequest> => {
  const manager = getApprovalWorkflowManager();
  return await manager.createApprovalRequest(operationId, tenantContext, parameters, reason, correlationId);
};

export const processApprovalDecision = async (
  decision: ApprovalDecision,
  tenantContext: TenantContext
): Promise<ApprovalRequest> => {
  const manager = getApprovalWorkflowManager();
  return await manager.processApprovalDecision(decision, tenantContext);
};

export const executeApprovedOperation = async (
  requestId: string,
  tenantContext: TenantContext
): Promise<ExecutionResult> => {
  const manager = getApprovalWorkflowManager();
  return await manager.executeApprovedOperation(requestId, tenantContext);
};
