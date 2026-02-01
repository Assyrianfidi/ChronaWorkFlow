// CRITICAL: Dangerous Operations Classification
// MANDATORY: Central registry of dangerous operations with explicit controls

import { logger } from '../utils/structured-logger.js';
import crypto from 'crypto';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ApprovalPolicy = 'NONE' | 'SINGLE_ADMIN' | 'MULTI_ADMIN' | 'OWNER_ONLY';

export interface DangerousOperation {
  id: string;
  name: string;
  description: string;
  category: 'TENANT_MANAGEMENT' | 'DATA_MANAGEMENT' | 'COMPLIANCE' | 'SECURITY' | 'SYSTEM';
  riskLevel: RiskLevel;
  requiredPermissions: string[];
  approvalPolicy: ApprovalPolicy;
  multiAdminConfig?: {
    requiredApprovers: number;
    totalApprovers: number;
    allowSelfApproval: boolean;
  };
  irreversible: boolean;
  featureFlag?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface OperationExecutionRequest {
  operationId: string;
  tenantId: string;
  requestedBy: string;
  correlationId: string;
  parameters: Record<string, any>;
  reason: string;
  metadata?: Record<string, any>;
}

export interface OperationExecutionResult {
  operationId: string;
  requestId: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'FAILED';
  executedBy?: string;
  executedAt?: Date;
  result?: any;
  error?: string;
  duration?: number;
  metadata: Record<string, any>;
}

/**
 * CRITICAL: Dangerous Operations Registry
 * 
 * This class manages the central registry of dangerous operations
 * with explicit risk classification and control requirements.
 */
export class DangerousOperationsRegistry {
  private static instance: DangerousOperationsRegistry;
  private operations: Map<string, DangerousOperation> = new Map();

  private constructor() {
    this.initializeDefaultOperations();
  }

  /**
   * CRITICAL: Get singleton instance
   */
  static getInstance(): DangerousOperationsRegistry {
    if (!DangerousOperationsRegistry.instance) {
      DangerousOperationsRegistry.instance = new DangerousOperationsRegistry();
    }
    return DangerousOperationsRegistry.instance;
  }

  /**
   * CRITICAL: Register dangerous operation
   */
  registerOperation(operation: Omit<DangerousOperation, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = this.generateOperationId(operation.name);
    
    const fullOperation: DangerousOperation = {
      ...operation,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // CRITICAL: Validate operation definition
    this.validateOperation(fullOperation);

    // CRITICAL: Register operation
    this.operations.set(id, fullOperation);

    logger.info('Dangerous operation registered', {
      operationId: id,
      name: operation.name,
      category: operation.category,
      riskLevel: operation.riskLevel,
      approvalPolicy: operation.approvalPolicy
    });

    return id;
  }

  /**
   * CRITICAL: Get operation by name
   */
  getOperation(name: string): DangerousOperation | null {
    for (const operation of this.operations.values()) {
      if (operation.name === name) {
        return operation;
      }
    }
    return null;
  }

  /**
   * CRITICAL: Get operation by ID
   */
  getOperationById(id: string): DangerousOperation | null {
    return this.operations.get(id) || null;
  }

  /**
   * CRITICAL: Get all operations
   */
  getAllOperations(): DangerousOperation[] {
    return Array.from(this.operations.values());
  }

  /**
   * CRITICAL: Get operations by category
   */
  getOperationsByCategory(category: DangerousOperation['category']): DangerousOperation[] {
    return Array.from(this.operations.values()).filter(op => op.category === category);
  }

  /**
   * CRITICAL: Get operations by risk level
   */
  getOperationsByRiskLevel(riskLevel: RiskLevel): DangerousOperation[] {
    return Array.from(this.operations.values()).filter(op => op.riskLevel === riskLevel);
  }

  /**
   * CRITICAL: Check if operation requires approval
   */
  requiresApproval(operationName: string): boolean {
    const operation = this.getOperation(operationName);
    if (!operation) {
      throw new Error(`Operation '${operationName}' not found in registry`);
    }
    return operation.approvalPolicy !== 'NONE';
  }

  /**
   * CRITICAL: Get required permissions for operation
   */
  getRequiredPermissions(operationName: string): string[] {
    const operation = this.getOperation(operationName);
    if (!operation) {
      throw new Error(`Operation '${operationName}' not found in registry`);
    }
    return operation.requiredPermissions;
  }

  /**
   * CRITICAL: Get approval policy for operation
   */
  getApprovalPolicy(operationName: string): ApprovalPolicy {
    const operation = this.getOperation(operationName);
    if (!operation) {
      throw new Error(`Operation '${operationName}' not found in registry`);
    }
    return operation.approvalPolicy;
  }

  /**
   * CRITICAL: Check if operation is irreversible
   */
  isIrreversible(operationName: string): boolean {
    const operation = this.getOperation(operationName);
    if (!operation) {
      throw new Error(`Operation '${operationName}' not found in registry`);
    }
    return operation.irreversible;
  }

  /**
   * CRITICAL: Get feature flag requirement for operation
   */
  getFeatureFlagRequirement(operationName: string): string | undefined {
    const operation = this.getOperation(operationName);
    if (!operation) {
      throw new Error(`Operation '${operationName}' not found in registry`);
    }
    return operation.featureFlag;
  }

  /**
   * CRITICAL: Validate operation request
   */
  validateOperationRequest(request: OperationExecutionRequest): {
    valid: boolean;
    errors: string[];
    operation: DangerousOperation;
  } {
    const errors: string[] = [];

    // CRITICAL: Get operation definition
    const operation = this.getOperationById(request.operationId);
    if (!operation) {
      errors.push(`Operation ID '${request.operationId}' not found in registry`);
      return { valid: false, errors, operation: null as any };
    }

    // CRITICAL: Validate required parameters
    if (!request.tenantId) {
      errors.push('Tenant ID is required');
    }

    if (!request.requestedBy) {
      errors.push('Requested by is required');
    }

    if (!request.correlationId) {
      errors.push('Correlation ID is required');
    }

    if (!request.reason || request.reason.trim().length === 0) {
      errors.push('Reason is required');
    }

    // CRITICAL: Validate reason length
    if (request.reason && request.reason.length > 1000) {
      errors.push('Reason is too long (max 1000 characters)');
    }

    // CRITICAL: Validate parameters based on operation
    this.validateOperationParameters(operation, request.parameters, errors);

    return {
      valid: errors.length === 0,
      errors,
      operation
    };
  }

  /**
   * CRITICAL: Get operation statistics
   */
  getStatistics(): {
    totalOperations: number;
    operationsByCategory: Record<string, number>;
    operationsByRiskLevel: Record<RiskLevel, number>;
    operationsByApprovalPolicy: Record<ApprovalPolicy, number>;
    irreversibleOperations: number;
    operationsWithFeatureFlags: number;
  } {
    const operations = this.getAllOperations();
    
    const operationsByCategory: Record<string, number> = {};
    const operationsByRiskLevel: Record<RiskLevel, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0
    };
    const operationsByApprovalPolicy: Record<ApprovalPolicy, number> = {
      NONE: 0,
      SINGLE_ADMIN: 0,
      MULTI_ADMIN: 0,
      OWNER_ONLY: 0
    };

    let irreversibleOperations = 0;
    let operationsWithFeatureFlags = 0;

    for (const operation of operations) {
      // Category statistics
      operationsByCategory[operation.category] = (operationsByCategory[operation.category] || 0) + 1;
      
      // Risk level statistics
      operationsByRiskLevel[operation.riskLevel]++;
      
      // Approval policy statistics
      operationsByApprovalPolicy[operation.approvalPolicy]++;
      
      // Irreversible operations
      if (operation.irreversible) {
        irreversibleOperations++;
      }
      
      // Operations with feature flags
      if (operation.featureFlag) {
        operationsWithFeatureFlags++;
      }
    }

    return {
      totalOperations: operations.length,
      operationsByCategory,
      operationsByRiskLevel,
      operationsByApprovalPolicy,
      irreversibleOperations,
      operationsWithFeatureFlags
    };
  }

  /**
   * CRITICAL: Validate operation definition
   */
  private validateOperation(operation: DangerousOperation): void {
    const errors: string[] = [];

    // CRITICAL: Validate name
    if (!operation.name || operation.name.trim().length === 0) {
      errors.push('Operation name is required');
    }

    if (operation.name.length > 100) {
      errors.push('Operation name is too long (max 100 characters)');
    }

    // CRITICAL: Validate description
    if (!operation.description || operation.description.trim().length === 0) {
      errors.push('Operation description is required');
    }

    if (operation.description.length > 500) {
      errors.push('Operation description is too long (max 500 characters)');
    }

    // CRITICAL: Validate category
    const validCategories = ['TENANT_MANAGEMENT', 'DATA_MANAGEMENT', 'COMPLIANCE', 'SECURITY', 'SYSTEM'];
    if (!validCategories.includes(operation.category)) {
      errors.push(`Invalid category: ${operation.category}`);
    }

    // CRITICAL: Validate risk level
    const validRiskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (!validRiskLevels.includes(operation.riskLevel)) {
      errors.push(`Invalid risk level: ${operation.riskLevel}`);
    }

    // CRITICAL: Validate required permissions
    if (!Array.isArray(operation.requiredPermissions) || operation.requiredPermissions.length === 0) {
      errors.push('At least one required permission must be specified');
    }

    // CRITICAL: Validate approval policy
    const validApprovalPolicies = ['NONE', 'SINGLE_ADMIN', 'MULTI_ADMIN', 'OWNER_ONLY'];
    if (!validApprovalPolicies.includes(operation.approvalPolicy)) {
      errors.push(`Invalid approval policy: ${operation.approvalPolicy}`);
    }

    // CRITICAL: Validate multi-admin configuration
    if (operation.approvalPolicy === 'MULTI_ADMIN') {
      if (!operation.multiAdminConfig) {
        errors.push('Multi-admin configuration is required for MULTI_ADMIN approval policy');
      } else {
        if (operation.multiAdminConfig.requiredApprovers < 1) {
          errors.push('Required approvers must be at least 1');
        }
        if (operation.multiAdminConfig.totalApprovers < operation.multiAdminConfig.requiredApprovers) {
          errors.push('Total approvers must be at least equal to required approvers');
        }
        if (operation.multiAdminConfig.totalApprovers > 10) {
          errors.push('Total approvers cannot exceed 10');
        }
      }
    }

    // CRITICAL: Validate feature flag
    if (operation.featureFlag && operation.featureFlag.length > 64) {
      errors.push('Feature flag name is too long (max 64 characters)');
    }

    if (errors.length > 0) {
      throw new Error(`Invalid operation definition: ${errors.join(', ')}`);
    }
  }

  /**
   * CRITICAL: Validate operation parameters
   */
  private validateOperationParameters(
    operation: DangerousOperation,
    parameters: Record<string, any>,
    errors: string[]
  ): void {
    // CRITICAL: Common parameter validations based on operation type
    switch (operation.name) {
      case 'TENANT_DELETION':
        if (!parameters.tenantId) {
          errors.push('Tenant ID is required for tenant deletion');
        }
        if (!parameters.confirmation || parameters.confirmation !== 'DELETE') {
          errors.push('Explicit confirmation "DELETE" is required for tenant deletion');
        }
        break;

      case 'TENANT_OWNERSHIP_TRANSFER':
        if (!parameters.newOwnerId) {
          errors.push('New owner ID is required for ownership transfer');
        }
        if (!parameters.confirmation || parameters.confirmation !== 'TRANSFER') {
          errors.push('Explicit confirmation "TRANSFER" is required for ownership transfer');
        }
        break;

      case 'DATA_PURGE':
        if (!parameters.dataType) {
          errors.push('Data type is required for data purge');
        }
        if (!parameters.dateRange) {
          errors.push('Date range is required for data purge');
        }
        if (!parameters.confirmation || parameters.confirmation !== 'PURGE') {
          errors.push('Explicit confirmation "PURGE" is required for data purge');
        }
        break;

      case 'LEGAL_HOLD_REMOVAL':
        if (!parameters.legalHoldId) {
          errors.push('Legal hold ID is required for legal hold removal');
        }
        if (!parameters.reason) {
          errors.push('Reason is required for legal hold removal');
        }
        break;

      case 'AUDIT_LOG_OVERRIDE':
        if (!parameters.overrideReason) {
          errors.push('Override reason is required for audit log override');
        }
        if (!parameters.confirmation || parameters.confirmation !== 'OVERRIDE') {
          errors.push('Explicit confirmation "OVERRIDE" is required for audit log override');
        }
        break;

      case 'SUBSCRIPTION_DOWNGRADE':
        if (!parameters.targetTier) {
          errors.push('Target tier is required for subscription downgrade');
        }
        if (!parameters.effectiveDate) {
          errors.push('Effective date is required for subscription downgrade');
        }
        break;
    }
  }

  /**
   * CRITICAL: Generate operation ID
   */
  private generateOperationId(name: string): string {
    const hash = crypto.createHash('sha256').update(name).digest('hex');
    return `op_${hash.substring(0, 16)}`;
  }

  /**
   * CRITICAL: Initialize default dangerous operations
   */
  private initializeDefaultOperations(): void {
    const defaultOperations = [
      {
        name: 'TENANT_DELETION',
        description: 'Permanently delete a tenant and all associated data',
        category: 'TENANT_MANAGEMENT' as const,
        riskLevel: 'CRITICAL' as const,
        requiredPermissions: ['tenant:delete', 'system:admin'],
        approvalPolicy: 'OWNER_ONLY' as const,
        irreversible: true,
        featureFlag: 'TENANT_DELETION',
        metadata: {
          impactScope: 'TENANT_WIDE',
          dataLoss: 'PERMANENT',
          recoveryPossible: false
        }
      },
      {
        name: 'TENANT_OWNERSHIP_TRANSFER',
        description: 'Transfer tenant ownership to another user',
        category: 'TENANT_MANAGEMENT' as const,
        riskLevel: 'HIGH' as const,
        requiredPermissions: ['tenant:manage', 'ownership:transfer'],
        approvalPolicy: 'MULTI_ADMIN' as const,
        multiAdminConfig: {
          requiredApprovers: 2,
          totalApprovers: 3,
          allowSelfApproval: false
        },
        irreversible: false,
        featureFlag: 'DANGEROUS_OPERATIONS',
        metadata: {
          impactScope: 'TENANT_WIDE',
          privilegeEscalation: true,
          reversible: true
        }
      },
      {
        name: 'DATA_PURGE',
        description: 'Permanently purge specific data types',
        category: 'DATA_MANAGEMENT' as const,
        riskLevel: 'CRITICAL' as const,
        requiredPermissions: ['data:purge', 'compliance:override'],
        approvalPolicy: 'MULTI_ADMIN' as const,
        multiAdminConfig: {
          requiredApprovers: 2,
          totalApprovers: 3,
          allowSelfApproval: false
        },
        irreversible: true,
        featureFlag: 'DATA_PURGE',
        metadata: {
          impactScope: 'DATA_TYPE_SPECIFIC',
          dataLoss: 'PERMANENT',
          recoveryPossible: false
        }
      },
      {
        name: 'LEGAL_HOLD_REMOVAL',
        description: 'Remove legal hold from data',
        category: 'COMPLIANCE' as const,
        riskLevel: 'HIGH' as const,
        requiredPermissions: ['legal:hold:manage', 'compliance:override'],
        approvalPolicy: 'MULTI_ADMIN' as const,
        multiAdminConfig: {
          requiredApprovers: 2,
          totalApprovers: 3,
          allowSelfApproval: false
        },
        irreversible: false,
        featureFlag: 'LEGAL_HOLD_OVERRIDE',
        metadata: {
          impactScope: 'LEGAL_COMPLIANCE',
          regulatoryRisk: true,
          reversible: true
        }
      },
      {
        name: 'AUDIT_LOG_OVERRIDE',
        description: 'Override audit log verification or integrity checks',
        category: 'COMPLIANCE' as const,
        riskLevel: 'CRITICAL' as const,
        requiredPermissions: ['audit:override', 'system:admin'],
        approvalPolicy: 'OWNER_ONLY' as const,
        irreversible: false,
        featureFlag: 'AUDIT_LOG_OVERRIDE',
        metadata: {
          impactScope: 'SYSTEM_WIDE',
          complianceRisk: true,
          reversible: true
        }
      },
      {
        name: 'SUBSCRIPTION_DOWNGRADE',
        description: 'Downgrade tenant subscription tier',
        category: 'TENANT_MANAGEMENT' as const,
        riskLevel: 'MEDIUM' as const,
        requiredPermissions: ['subscription:manage', 'billing:modify'],
        approvalPolicy: 'SINGLE_ADMIN' as const,
        irreversible: false,
        featureFlag: 'DANGEROUS_OPERATIONS',
        metadata: {
          impactScope: 'TENANT_WIDE',
          financialImpact: true,
          reversible: true
        }
      },
      {
        name: 'BULK_USER_DELETION',
        description: 'Delete multiple users at once',
        category: 'DATA_MANAGEMENT' as const,
        riskLevel: 'HIGH' as const,
        requiredPermissions: ['user:delete', 'bulk:operations'],
        approvalPolicy: 'MULTI_ADMIN' as const,
        multiAdminConfig: {
          requiredApprovers: 2,
          totalApprovers: 3,
          allowSelfApproval: false
        },
        irreversible: true,
        featureFlag: 'BULK_OPERATIONS',
        metadata: {
          impactScope: 'MULTIPLE_USERS',
          dataLoss: 'PERMANENT',
          recoveryPossible: false
        }
      },
      {
        name: 'SYSTEM_MAINTENANCE_MODE',
        description: 'Enable system maintenance mode',
        category: 'SYSTEM' as const,
        riskLevel: 'MEDIUM' as const,
        requiredPermissions: ['system:maintenance', 'system:admin'],
        approvalPolicy: 'SINGLE_ADMIN' as const,
        irreversible: false,
        featureFlag: 'DANGEROUS_OPERATIONS',
        metadata: {
          impactScope: 'SYSTEM_WIDE',
          availabilityImpact: true,
          reversible: true
        }
      }
    ];

    for (const operation of defaultOperations) {
      this.registerOperation(operation);
    }

    logger.info('Default dangerous operations initialized', { count: defaultOperations.length });
  }
}

/**
 * CRITICAL: Global registry instance
 */
export const dangerousOperationsRegistry = DangerousOperationsRegistry.getInstance();

/**
 * CRITICAL: Convenience functions
 */
export const registerDangerousOperation = (
  operation: Omit<DangerousOperation, 'id' | 'createdAt' | 'updatedAt'>
): string => {
  return dangerousOperationsRegistry.registerOperation(operation);
};

export const getDangerousOperation = (name: string): DangerousOperation | null => {
  return dangerousOperationsRegistry.getOperation(name);
};

export const requiresApproval = (operationName: string): boolean => {
  return dangerousOperationsRegistry.requiresApproval(operationName);
};

export const getRequiredPermissions = (operationName: string): string[] => {
  return dangerousOperationsRegistry.getRequiredPermissions(operationName);
};

export const isIrreversibleOperation = (operationName: string): boolean => {
  return dangerousOperationsRegistry.isIrreversible(operationName);
};

export const validateDangerousOperationRequest = (
  request: OperationExecutionRequest
): { valid: boolean; errors: string[]; operation: DangerousOperation } => {
  return dangerousOperationsRegistry.validateOperationRequest(request);
};
