// CRITICAL: Runtime Compliance Guards
// MANDATORY: Real-time enforcement of compliance controls for all operations

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/structured-logger.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { complianceEngineManager, ComplianceCheck, EnforcementRule } from './compliance-engine.js';
import { authorityEnforcementManager } from '../governance/authority-enforcement.js';
import { TenantContext } from '../tenant/tenant-isolation.js';

export interface ComplianceGuardContext {
  tenantId: string;
  userId: string;
  operation: string;
  resourceType: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  correlationId: string;
  metadata?: Record<string, any>;
}

export interface ComplianceGuardResult {
  allowed: boolean;
  violations: Array<{
    controlId: string;
    framework: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    remediation: string;
  }>;
  enforcedControls: string[];
  riskScore: number;
  metadata: Record<string, any>;
}

/**
 * CRITICAL: Runtime Compliance Guard Manager
 * 
 * Enforces compliance controls in real-time for all system operations.
 * Provides middleware and decorators for automatic compliance checking.
 */
export class RuntimeComplianceGuardManager {
  private static instance: RuntimeComplianceGuardManager;
  private auditLogger: any;
  private violationCache: Map<string, ComplianceGuardResult> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.auditLogger = getImmutableAuditLogger();
    this.startPeriodicMonitoring();
  }

  static getInstance(): RuntimeComplianceGuardManager {
    if (!RuntimeComplianceGuardManager.instance) {
      RuntimeComplianceGuardManager.instance = new RuntimeComplianceGuardManager();
    }
    return RuntimeComplianceGuardManager.instance;
  }

  /**
   * CRITICAL: Check operation compliance
   */
  async checkOperationCompliance(
    context: ComplianceGuardContext,
    operationData?: any
  ): Promise<ComplianceGuardResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(context);

    try {
      // CRITICAL: Get applicable compliance checks
      const applicableChecks = await this.getApplicableChecks(context);
      
      // CRITICAL: Execute compliance checks
      const violations: Array<{
        controlId: string;
        framework: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        description: string;
        remediation: string;
      }> = [];
      const enforcedControls: string[] = [];
      let totalRiskScore = 0;

      for (const check of applicableChecks) {
        try {
          const result = await this.executeComplianceCheck(check, context, operationData);
          
          if (!result.compliant) {
            violations.push({
              controlId: check.controlId,
              framework: check.framework,
              severity: result.riskLevel,
              description: result.violationReason,
              remediation: result.remediationSteps
            });
            totalRiskScore += this.calculateRiskScore(result.riskLevel);
          } else {
            enforcedControls.push(check.controlId);
          }

        } catch (error) {
          logger.error('Compliance check execution failed', {
            controlId: check.controlId,
            error: (error as Error).message,
            context
          });

          // CRITICAL: Treat failed checks as violations
          violations.push({
            controlId: check.controlId,
            framework: check.framework,
            severity: 'HIGH',
            description: `Compliance check execution failed: ${(error as Error).message}`,
            remediation: 'Review compliance check configuration and retry'
          });
          totalRiskScore += 75; // High risk for failed checks
        }
      }

      // CRITICAL: Determine overall compliance
      const allowed = violations.length === 0 || 
        violations.every(v => v.severity !== 'CRITICAL') &&
        totalRiskScore < 200;

      const result: ComplianceGuardResult = {
        allowed,
        violations,
        enforcedControls,
        riskScore: totalRiskScore,
        metadata: {
          executionTime: Date.now() - startTime,
          checksExecuted: applicableChecks.length,
          passedChecks: enforcedControls.length,
          failedChecks: violations.length,
          timestamp: new Date()
        }
      };

      // CRITICAL: Cache result
      this.violationCache.set(cacheKey, result);

      // CRITICAL: Log compliance check
      this.auditLogger.logAuthorizationDecision({
        tenantId: context.tenantId,
        actorId: context.userId,
        action: 'COMPLIANCE_CHECK',
        resourceType: context.resourceType,
        resourceId: context.resourceId || 'unknown',
        outcome: allowed ? 'SUCCESS' : 'FAILURE',
        correlationId: context.correlationId,
        metadata: {
          operation: context.operation,
          violations: violations.length,
          riskScore: totalRiskScore,
          enforcedControls: enforcedControls.length,
          executionTime: result.metadata.executionTime
        }
      });

      logger.info('Compliance check completed', {
        tenantId: context.tenantId,
        operation: context.operation,
        allowed,
        violations: violations.length,
        riskScore: totalRiskScore,
        executionTime: result.metadata.executionTime
      });

      return result;

    } catch (error) {
      logger.error('Compliance guard check failed', {
        tenantId: context.tenantId,
        operation: context.operation,
        error: (error as Error).message,
        context
      });

      // CRITICAL: Fail secure - deny operation on guard failure
      const failSecureResult: ComplianceGuardResult = {
        allowed: false,
        violations: [{
          controlId: 'GUARD_FAILURE',
          framework: 'SYSTEM',
          severity: 'CRITICAL',
          description: `Compliance guard system failure: ${(error as Error).message}`,
          remediation: 'Contact security team immediately'
        }],
        enforcedControls: [],
        riskScore: 100,
        metadata: {
          error: (error as Error).message,
          failSecure: true,
          timestamp: new Date()
        }
      };

      this.auditLogger.logAuthorizationDecision({
        tenantId: context.tenantId,
        actorId: context.userId,
        action: 'COMPLIANCE_GUARD_FAILURE',
        resourceType: 'SYSTEM',
        resourceId: 'compliance-guard',
        outcome: 'FAILURE',
        correlationId: context.correlationId,
        metadata: {
          error: (error as Error).message,
          failSecure: true
        }
      });

      return failSecureResult;
    }
  }

  /**
   * CRITICAL: Express middleware for compliance checking
   */
  complianceGuardMiddleware(options: {
    operation: string;
    resourceType: string;
    requireAuthority?: string;
    bypassRiskThreshold?: number;
  } = { operation: 'UNKNOWN', resourceType: 'UNKNOWN' }) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const correlationId = req.headers['x-correlation-id'] as string || 
        `comp_${Date.now()}`;

      try {
        // CRITICAL: Extract compliance context
        const context: ComplianceGuardContext = {
          tenantId: req.headers['x-tenant-id'] as string || 'unknown',
          userId: req.headers['x-user-id'] as string || 'unknown',
          operation: options.operation,
          resourceType: options.resourceType,
          resourceId: req.params.id || req.body.id,
          ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          timestamp: new Date(),
          correlationId,
          metadata: {
            method: req.method,
            path: req.path,
            query: req.query,
            bodySize: JSON.stringify(req.body).length
          }
        };

        // CRITICAL: Check authority if required
        if (options.requireAuthority) {
          const authorityResult = await authorityEnforcementManager.checkAuthority(
            context.userId,
            options.requireAuthority,
            context.tenantId,
            correlationId
          );

          if (!authorityResult.authorized) {
            this.auditLogger.logAuthorizationDecision({
              tenantId: context.tenantId,
              actorId: context.userId,
              action: 'COMPLIANCE_GUARD_AUTHORITY_BLOCK',
              resourceType: context.resourceType,
              resourceId: context.resourceId || 'unknown',
              outcome: 'FAILURE',
              correlationId,
              metadata: {
                requiredAuthority: options.requireAuthority,
                reason: authorityResult.reason,
                operation: context.operation
              }
            });

            return res.status(403).json({
              error: 'Insufficient authority',
              message: authorityResult.reason,
              correlationId
            });
          }
        }

        // CRITICAL: Check compliance
        const complianceResult = await this.checkOperationCompliance(
          context,
          req.body
        );

        // CRITICAL: Apply bypass logic if configured
        if (options.bypassRiskThreshold && 
            complianceResult.riskScore <= options.bypassRiskThreshold) {
          logger.warn('Compliance bypass applied', {
            tenantId: context.tenantId,
            operation: context.operation,
            riskScore: complianceResult.riskScore,
            threshold: options.bypassRiskThreshold,
            correlationId
          });

          return next();
        }

        // CRITICAL: Block non-compliant operations
        if (!complianceResult.allowed) {
          this.auditLogger.logAuthorizationDecision({
            tenantId: context.tenantId,
            actorId: context.userId,
            action: 'COMPLIANCE_GUARD_BLOCK',
            resourceType: context.resourceType,
            resourceId: context.resourceId || 'unknown',
            outcome: 'FAILURE',
            correlationId,
            metadata: {
              violations: complianceResult.violations.length,
              riskScore: complianceResult.riskScore,
              criticalViolations: complianceResult.violations.filter(v => v.severity === 'CRITICAL').length
            }
          });

          return res.status(403).json({
            error: 'Compliance violation',
            message: 'Operation blocked due to compliance violations',
            violations: complianceResult.violations,
            riskScore: complianceResult.riskScore,
            correlationId
          });
        }

        // CRITICAL: Add compliance metadata to request
        (req as any).complianceResult = complianceResult;
        (req as any).complianceCheckedAt = new Date();

        logger.debug('Compliance guard passed', {
          tenantId: context.tenantId,
          operation: context.operation,
          riskScore: complianceResult.riskScore,
          executionTime: Date.now() - startTime,
          correlationId
        });

        return next();

      } catch (error) {
        logger.error('Compliance guard middleware error', {
          error: (error as Error).message,
          operation: options.operation,
          correlationId
        });

        this.auditLogger.logAuthorizationDecision({
          tenantId: req.headers['x-tenant-id'] as string || 'unknown',
          actorId: req.headers['x-user-id'] as string || 'unknown',
          action: 'COMPLIANCE_GUARD_ERROR',
          resourceType: options.resourceType,
          resourceId: req.params.id || 'unknown',
          outcome: 'FAILURE',
          correlationId,
          metadata: {
            error: (error as Error).message,
            operation: options.operation
          }
        });

        return res.status(500).json({
          error: 'Compliance guard error',
          message: 'An error occurred during compliance checking',
          correlationId
        });
      }
    };
  }

  /**
   * CRITICAL: Decorator for method-level compliance checking
   */
  complianceGuard(operation: string, resourceType: string, options: {
    requireAuthority?: string;
    bypassRiskThreshold?: number;
  } = {}) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
      const method = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const startTime = Date.now();
        const correlationId = `method_${Date.now()}`;

        try {
          // CRITICAL: Extract context from method arguments or this
          const context = this.extractComplianceContext?.call(this, args) || {
            tenantId: args[0]?.tenantId || 'unknown',
            userId: args[0]?.userId || this.currentUser?.id || 'unknown',
            operation,
            resourceType,
            resourceId: args[0]?.id || args[1]?.id,
            ipAddress: 'system',
            userAgent: 'system',
            timestamp: new Date(),
            correlationId,
            metadata: {
              className: target.constructor.name,
              methodName: propertyName,
              args: args.length
            }
          };

          // CRITICAL: Check compliance
          const guardManager = RuntimeComplianceGuardManager.getInstance();
          const complianceResult = await guardManager.checkOperationCompliance(
            context,
            { args, method: propertyName }
          );

          // CRITICAL: Block non-compliant method calls
          if (!complianceResult.allowed) {
            guardManager.auditLogger.logAuthorizationDecision({
              tenantId: context.tenantId,
              actorId: context.userId,
              action: 'METHOD_COMPLIANCE_BLOCK',
              resourceType: context.resourceType,
              resourceId: context.resourceId || 'unknown',
              outcome: 'FAILURE',
              correlationId,
              metadata: {
                className: target.constructor.name,
                methodName: propertyName,
                violations: complianceResult.violations.length,
                riskScore: complianceResult.riskScore
              }
            });

            throw new Error(`Method blocked due to compliance violations: ${propertyName}`);
          }

          // CRITICAL: Execute original method
          const result = await method.apply(this, args);

          logger.debug('Method compliance guard passed', {
            tenantId: context.tenantId,
            className: target.constructor.name,
            methodName: propertyName,
            riskScore: complianceResult.riskScore,
            executionTime: Date.now() - startTime,
            correlationId
          });

          return result;

        } catch (error) {
          logger.error('Method compliance guard error', {
            error: (error as Error).message,
            className: target.constructor.name,
            methodName: propertyName,
            correlationId
          });

          throw error;
        }
      };

      return descriptor;
    };
  }

  /**
   * CRITICAL: Get applicable compliance checks
   */
  private async getApplicableChecks(context: ComplianceGuardContext): Promise<ComplianceCheck[]> {
    try {
      const allChecks = await complianceEngineManager.getAllComplianceChecks();
      
      // CRITICAL: Filter checks based on context
      return allChecks.filter(check => {
        // Filter by framework applicability
        if (check.framework === 'GDPR' && context.tenantId === 'unknown') {
          return false;
        }

        // Filter by resource type
        if (check.category === 'ACCESS_CONTROL' && 
            !['USER', 'ROLE', 'PERMISSION'].includes(context.resourceType)) {
          return false;
        }

        // Filter by operation sensitivity
        if (check.riskLevel === 'CRITICAL' && 
            !context.operation.includes('DELETE') && 
            !context.operation.includes('ADMIN')) {
          return false;
        }

        return true;
      });

    } catch (error) {
      logger.error('Failed to get applicable checks', {
        error: (error as Error).message,
        context
      });
      return [];
    }
  }

  /**
   * CRITICAL: Execute individual compliance check
   */
  private async executeComplianceCheck(
    check: ComplianceCheck,
    context: ComplianceGuardContext,
    operationData?: any
  ): Promise<{ compliant: boolean; riskLevel: string; violationReason: string; remediationSteps: string }> {
    try {
      // CRITICAL: Execute check based on type
      switch (check.framework) {
        case 'SOC2':
          return this.executeSOC2Check(check, context, operationData);
        case 'ISO27001':
          return this.executeISO27001Check(check, context, operationData);
        case 'SOX':
          return this.executeSOXCheck(check, context, operationData);
        case 'GDPR':
          return this.executeGDPRCheck(check, context, operationData);
        case 'CCPA':
          return this.executeCCPACheck(check, context, operationData);
        default:
          return {
            compliant: false,
            riskLevel: 'HIGH',
            violationReason: `Unknown compliance framework: ${check.framework}`,
            remediationSteps: 'Review compliance framework configuration'
          };
      }

    } catch (error) {
      logger.error('Compliance check execution error', {
        controlId: check.controlId,
        error: (error as Error).message
      });

      return {
        compliant: false,
        riskLevel: 'HIGH',
        violationReason: `Check execution failed: ${(error as Error).message}`,
        remediationSteps: 'Review check configuration and system health'
      };
    }
  }

  /**
   * CRITICAL: Execute SOC 2 compliance check
   */
  private async executeSOC2Check(
    check: ComplianceCheck,
    context: ComplianceGuardContext,
    operationData?: any
  ): Promise<{ compliant: boolean; riskLevel: string; violationReason: string; remediationSteps: string }> {
    // CRITICAL: SOC 2 Security checks
    if (check.category === 'SECURITY') {
      if (context.operation.includes('ACCESS') && !context.userId) {
        return {
          compliant: false,
          riskLevel: 'HIGH',
          violationReason: 'Unauthorized access attempt',
          remediationSteps: 'Ensure proper authentication and authorization'
        };
      }
    }

    // CRITICAL: SOC 2 Availability checks
    if (check.category === 'OPERATIONAL') {
      if (context.operation.includes('DELETE') && context.resourceType === 'SYSTEM') {
        return {
          compliant: false,
          riskLevel: 'CRITICAL',
          violationReason: 'Critical system deletion attempt',
          remediationSteps: 'Require additional approvals for system deletions'
        };
      }
    }

    return {
      compliant: true,
      riskLevel: 'LOW',
      violationReason: '',
      remediationSteps: ''
    };
  }

  /**
   * CRITICAL: Execute ISO 27001 compliance check
   */
  private async executeISO27001Check(
    check: ComplianceCheck,
    context: ComplianceGuardContext,
    operationData?: any
  ): Promise<{ compliant: boolean; riskLevel: string; violationReason: string; remediationSteps: string }> {
    // CRITICAL: Access control checks (A.9)
    if (check.controlId.startsWith('A.9')) {
      if (context.operation.includes('GRANT') && !context.metadata?.approvalId) {
        return {
          compliant: false,
          riskLevel: 'MEDIUM',
          violationReason: 'Access granted without proper approval',
          remediationSteps: 'Require documented approval for access grants'
        };
      }
    }

    // CRITICAL: Cryptography checks (A.10)
    if (check.controlId.startsWith('A.10')) {
      if (context.operation.includes('EXPORT') && !context.metadata?.encrypted) {
        return {
          compliant: false,
          riskLevel: 'HIGH',
          violationReason: 'Data export without encryption',
          remediationSteps: 'Encrypt all data exports'
        };
      }
    }

    return {
      compliant: true,
      riskLevel: 'LOW',
      violationReason: '',
      remediationSteps: ''
    };
  }

  /**
   * CRITICAL: Execute SOX compliance check
   */
  private async executeSOXCheck(
    check: ComplianceCheck,
    context: ComplianceGuardContext,
    operationData?: any
  ): Promise<{ compliant: boolean; riskLevel: string; violationReason: string; remediationSteps: string }> {
    // CRITICAL: Financial reporting checks
    if (check.category === 'FINANCIAL') {
      if (context.resourceType === 'FINANCIAL_REPORT' && 
          context.operation.includes('MODIFY') &&
          !context.metadata?.segregationOfDuties) {
        return {
          compliant: false,
          riskLevel: 'CRITICAL',
          violationReason: 'Financial report modification without segregation of duties',
          remediationSteps: 'Enforce segregation of duties for financial operations'
        };
      }
    }

    return {
      compliant: true,
      riskLevel: 'LOW',
      violationReason: '',
      remediationSteps: ''
    };
  }

  /**
   * CRITICAL: Execute GDPR compliance check
   */
  private async executeGDPRCheck(
    check: ComplianceCheck,
    context: ComplianceGuardContext,
    operationData?: any
  ): Promise<{ compliant: boolean; riskLevel: string; violationReason: string; remediationSteps: string }> {
    // CRITICAL: Data processing checks
    if (check.category === 'PRIVACY') {
      if (context.operation.includes('PROCESS') && 
          context.resourceType === 'PERSONAL_DATA' &&
          !context.metadata?.lawfulBasis) {
        return {
          compliant: false,
          riskLevel: 'HIGH',
          violationReason: 'Personal data processing without lawful basis',
          remediationSteps: 'Document lawful basis for all personal data processing'
        };
      }
    }

    // CRITICAL: Data transfer checks
    if (context.operation.includes('TRANSFER') && 
        context.metadata?.crossBorder &&
        !context.metadata?.adequacyDecision) {
      return {
        compliant: false,
        riskLevel: 'HIGH',
        violationReason: 'Cross-border data transfer without adequacy decision',
        remediationSteps: 'Ensure adequacy decision or appropriate safeguards for transfers'
      };
    }

    return {
      compliant: true,
      riskLevel: 'LOW',
      violationReason: '',
      remediationSteps: ''
    };
  }

  /**
   * CRITICAL: Execute CCPA compliance check
   */
  private async executeCCPACheck(
    check: ComplianceCheck,
    context: ComplianceGuardContext,
    operationData?: any
  ): Promise<{ compliant: boolean; riskLevel: string; violationReason: string; remediationSteps: string }> {
    // CRITICAL: Consumer rights checks
    if (check.category === 'PRIVACY') {
      if (context.operation.includes('DELETE') && 
          context.resourceType === 'CONSUMER_DATA' &&
          !context.metadata?.consumerRequest) {
        return {
          compliant: false,
          riskLevel: 'MEDIUM',
          violationReason: 'Consumer data deletion without verified request',
          remediationSteps: 'Verify consumer identity before processing deletion requests'
        };
      }
    }

    return {
      compliant: true,
      riskLevel: 'LOW',
      violationReason: '',
      remediationSteps: ''
    };
  }

  /**
   * CRITICAL: Calculate risk score
   */
  private calculateRiskScore(riskLevel: string): number {
    switch (riskLevel) {
      case 'LOW': return 10;
      case 'MEDIUM': return 25;
      case 'HIGH': return 75;
      case 'CRITICAL': return 100;
      default: return 50;
    }
  }

  /**
   * CRITICAL: Generate cache key
   */
  private generateCacheKey(context: ComplianceGuardContext): string {
    return `${context.tenantId}_${context.userId}_${context.operation}_${context.resourceType}`;
  }

  /**
   * CRITICAL: Start periodic monitoring
   */
  private startPeriodicMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        // CRITICAL: Clean up old cache entries
        const cutoffTime = Date.now() - (5 * 60 * 1000); // 5 minutes
        let cleanedCount = 0;

        for (const [key, result] of this.violationCache.entries()) {
          if (result.metadata?.timestamp && 
              new Date(result.metadata.timestamp).getTime() < cutoffTime) {
            this.violationCache.delete(key);
            cleanedCount++;
          }
        }

        if (cleanedCount > 0) {
          logger.debug('Cleaned up compliance cache entries', { cleanedCount });
        }

      } catch (error) {
        logger.error('Compliance monitoring error', {
          error: (error as Error).message
        });
      }
    }, 60000); // Every minute
  }

  /**
   * CRITICAL: Get compliance statistics
   */
  async getComplianceStatistics(tenantId?: string): Promise<{
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    averageRiskScore: number;
    criticalViolations: number;
    frameworkCoverage: Record<string, number>;
  }> {
    try {
      const allChecks = await complianceEngineManager.getAllComplianceChecks();
      const applicableChecks = tenantId ? 
        allChecks.filter(check => this.isCheckApplicableForTenant(check, tenantId)) :
        allChecks;

      // CRITICAL: Calculate statistics
      let totalRiskScore = 0;
      let criticalViolations = 0;
      const frameworkCoverage: Record<string, number> = {};

      for (const check of applicableChecks) {
        totalRiskScore += this.calculateRiskScore(check.riskLevel);
        if (check.riskLevel === 'CRITICAL') {
          criticalViolations++;
        }

        frameworkCoverage[check.framework] = (frameworkCoverage[check.framework] || 0) + 1;
      }

      return {
        totalChecks: applicableChecks.length,
        passedChecks: applicableChecks.filter(c => c.status === 'COMPLIANT').length,
        failedChecks: applicableChecks.filter(c => c.status === 'NON_COMPLIANT').length,
        averageRiskScore: applicableChecks.length > 0 ? totalRiskScore / applicableChecks.length : 0,
        criticalViolations,
        frameworkCoverage
      };

    } catch (error) {
      logger.error('Failed to get compliance statistics', {
        error: (error as Error).message,
        tenantId
      });

      return {
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        averageRiskScore: 0,
        criticalViolations: 0,
        frameworkCoverage: {}
      };
    }
  }

  /**
   * CRITICAL: Check if compliance check is applicable for tenant
   */
  private isCheckApplicableForTenant(check: ComplianceCheck, tenantId: string): boolean {
    // CRITICAL: GDPR/CCPA only apply to EU/California tenants
    if (check.framework === 'GDPR' || check.framework === 'CCPA') {
      // This would be based on tenant jurisdiction in a real implementation
      return tenantId.startsWith('eu_') || tenantId.startsWith('ca_');
    }

    return true;
  }
}

/**
 * CRITICAL: Global runtime compliance guard manager instance
 */
export const runtimeComplianceGuardManager = RuntimeComplianceGuardManager.getInstance();

/**
 * CRITICAL: Convenience functions
 */
export const createRuntimeComplianceGuard = (): RuntimeComplianceGuardManager => {
  return RuntimeComplianceGuardManager.getInstance();
};

export const checkOperationCompliance = async (
  context: ComplianceGuardContext,
  operationData?: any
): Promise<ComplianceGuardResult> => {
  return runtimeComplianceGuardManager.checkOperationCompliance(context, operationData);
};

export const requireCompliance = (
  operation: string,
  resourceType: string,
  options?: { requireAuthority?: string; bypassRiskThreshold?: number }
) => {
  return runtimeComplianceGuardManager.complianceGuardMiddleware({
    operation,
    resourceType,
    ...options
  });
};
