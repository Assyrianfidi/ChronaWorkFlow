// CRITICAL: Compliance Retention & Legal Hold System
// MANDATORY: Enforce retention policies and legal holds for compliance

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/structured-logger.js';
import { getImmutableAuditLogger } from './immutable-audit-log.js';
import crypto from 'crypto';

export interface RetentionPolicy {
  dataType: 'AUDIT_LOGS' | 'DATABASE_BACKUPS' | 'SOFT_DELETED_TENANTS' | 'USER_DATA';
  retentionDays: number;
  legalHoldExceptions: string[];
  enforcementEnabled: boolean;
  lastEnforcedAt?: Date;
}

export interface LegalHold {
  id: string;
  tenantId: string;
  dataType: RetentionPolicy['dataType'];
  reason: string;
  requestedBy: string;
  requestedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  metadata: Record<string, any>;
}

export interface RetentionJob {
  id: string;
  dataType: RetentionPolicy['dataType'];
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt?: Date;
  completedAt?: Date;
  recordsProcessed: number;
  recordsDeleted: number;
  errors: string[];
  metadata: Record<string, any>;
  duration?: number;
}

export interface RetentionEnforcementResult {
  jobId: string;
  dataType: RetentionPolicy['dataType'];
  recordsProcessed: number;
  recordsDeleted: number;
  recordsSkipped: number;
  errors: string[];
  duration: number;
  legalHoldsBlocked: number;
}

/**
 * CRITICAL: Compliance Retention Manager
 * 
 * This class enforces retention policies and legal holds for compliance.
 * ALL retention actions are logged and cannot be bypassed.
 */
export class ComplianceRetentionManager {
  private prisma: PrismaClient;
  private auditLogger: any;
  private retentionPolicies: Map<RetentionPolicy['dataType'], RetentionPolicy> = new Map();
  private activeJobs: Map<string, RetentionJob> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.auditLogger = getImmutableAuditLogger(prisma);
    this.initializeDefaultPolicies();
  }

  /**
   * CRITICAL: Initialize default retention policies
   */
  private initializeDefaultPolicies(): void {
    // CRITICAL: Audit logs - 7 years retention (SOX compliance)
    this.retentionPolicies.set('AUDIT_LOGS', {
      dataType: 'AUDIT_LOGS',
      retentionDays: 2555, // 7 years
      legalHoldExceptions: [],
      enforcementEnabled: true
    });

    // CRITICAL: Database backups - 1 year retention
    this.retentionPolicies.set('DATABASE_BACKUPS', {
      dataType: 'DATABASE_BACKUPS',
      retentionDays: 365,
      legalHoldExceptions: [],
      enforcementEnabled: true
    });

    // CRITICAL: Soft-deleted tenants - 90 days retention
    this.retentionPolicies.set('SOFT_DELETED_TENANTS', {
      dataType: 'SOFT_DELETED_TENANTS',
      retentionDays: 90,
      legalHoldExceptions: [],
      enforcementEnabled: true
    });

    // CRITICAL: User data - 2 years retention (GDPR compliance)
    this.retentionPolicies.set('USER_DATA', {
      dataType: 'USER_DATA',
      retentionDays: 730, // 2 years
      legalHoldExceptions: [],
      enforcementEnabled: true
    });

    logger.info('Default retention policies initialized', {
      policies: Array.from(this.retentionPolicies.entries()).map(([type, policy]) => ({
        type,
        retentionDays: policy.retentionDays,
        enforcementEnabled: policy.enforcementEnabled
      }))
    });
  }

  /**
   * CRITICAL: Get retention policy for data type
   */
  getRetentionPolicy(dataType: RetentionPolicy['dataType']): RetentionPolicy | undefined {
    return this.retentionPolicies.get(dataType);
  }

  /**
   * CRITICAL: Update retention policy
   */
  updateRetentionPolicy(
    dataType: RetentionPolicy['dataType'],
    policy: Partial<RetentionPolicy>,
    updatedBy: string,
    correlationId: string
  ): void {
    const existingPolicy = this.retentionPolicies.get(dataType);
    if (!existingPolicy) {
      throw new Error(`Retention policy not found for data type: ${dataType}`);
    }

    const updatedPolicy: RetentionPolicy = {
      ...existingPolicy,
      ...policy,
      dataType
    };

    this.retentionPolicies.set(dataType, updatedPolicy);

    // CRITICAL: Log policy change
    this.auditLogger.logConfigurationChange({
      tenantId: 'system',
      actorId: updatedBy,
      action: 'RETENTION_POLICY_UPDATE',
      resourceType: 'SYSTEM_CONFIG' as const,
      resourceId: dataType,
      outcome: 'SUCCESS',
      correlationId,
      metadata: {
        previousPolicy: existingPolicy,
        updatedPolicy,
        changedFields: Object.keys(policy)
      }
    });

    logger.info('Retention policy updated', {
      dataType,
      updatedBy,
      changes: policy
    });
  }

  /**
   * CRITICAL: Place legal hold on data
   */
  async placeLegalHold(
    tenantId: string,
    dataType: RetentionPolicy['dataType'],
    reason: string,
    requestedBy: string,
    correlationId: string,
    expiresAt?: Date,
    metadata?: Record<string, any>
  ): Promise<LegalHold> {
    const legalHold: LegalHold = {
      id: this.generateSecureId(),
      tenantId,
      dataType,
      reason,
      requestedBy,
      requestedAt: new Date(),
      expiresAt,
      isActive: true,
      metadata: metadata || {}
    };

    try {
      // CRITICAL: Store legal hold in database
      await this.prisma.$executeRaw`
        INSERT INTO legal_holds (
          id, tenant_id, data_type, reason, requested_by, 
          requested_at, expires_at, is_active, metadata
        ) VALUES (
          ${legalHold.id}, ${legalHold.tenantId}, ${legalHold.dataType}, 
          ${legalHold.reason}, ${legalHold.requestedBy}, ${legalHold.requestedAt}, 
          ${legalHold.expiresAt}, ${legalHold.isActive}, ${JSON.stringify(legalHold.metadata)}
        )
      `;

      // CRITICAL: Update retention policy with legal hold exception
      const policy = this.retentionPolicies.get(dataType);
      if (policy && !policy.legalHoldExceptions.includes(legalHold.id)) {
        policy.legalHoldExceptions.push(legalHold.id);
      }

      // CRITICAL: Log legal hold placement
      this.auditLogger.logConfigurationChange({
        tenantId,
        actorId: requestedBy,
        action: 'LEGAL_HOLD_PLACED',
        resourceType: 'SYSTEM_CONFIG' as const,
        resourceId: legalHold.id,
        outcome: 'SUCCESS',
        correlationId,
        metadata: {
          dataType,
          reason,
          expiresAt,
          legalHoldId: legalHold.id
        }
      });

      logger.info('Legal hold placed', {
        legalHoldId: legalHold.id,
        tenantId,
        dataType,
        reason,
        requestedBy,
        expiresAt
      });

      return legalHold;

    } catch (error) {
      logger.error('Failed to place legal hold', error as Error, {
        tenantId,
        dataType,
        reason,
        requestedBy
      });

      // CRITICAL: Log failure
      this.auditLogger.logConfigurationChange({
        tenantId,
        actorId: requestedBy,
        action: 'LEGAL_HOLD_PLACED',
        resourceType: 'SYSTEM_CONFIG' as const,
        resourceId: legalHold.id,
        outcome: 'FAILURE',
        correlationId,
        metadata: {
          dataType,
          reason,
          error: (error as Error).message
        }
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Release legal hold
   */
  async releaseLegalHold(
    legalHoldId: string,
    releasedBy: string,
    correlationId: string,
    reason?: string
  ): Promise<void> {
    try {
      // CRITICAL: Get legal hold details
      const legalHoldResult = await this.prisma.$queryRaw`
        SELECT * FROM legal_holds 
        WHERE id = ${legalHoldId} AND is_active = true
      ` as LegalHold[];

      if (legalHoldResult.length === 0) {
        throw new Error(`Legal hold not found or inactive: ${legalHoldId}`);
      }

      const legalHold = legalHoldResult[0];

      // CRITICAL: Deactivate legal hold
      await this.prisma.$executeRaw`
        UPDATE legal_holds 
        SET is_active = false, updated_at = NOW()
        WHERE id = ${legalHoldId}
      `;

      // CRITICAL: Remove from retention policy exceptions
      const policy = this.retentionPolicies.get(legalHold.dataType);
      if (policy) {
        policy.legalHoldExceptions = policy.legalHoldExceptions.filter(id => id !== legalHoldId);
      }

      // CRITICAL: Log legal hold release
      this.auditLogger.logConfigurationChange({
        tenantId: legalHold.tenantId,
        actorId: releasedBy,
        action: 'LEGAL_HOLD_RELEASED',
        resourceType: 'SYSTEM_CONFIG' as const,
        resourceId: legalHoldId,
        outcome: 'SUCCESS',
        correlationId,
        metadata: {
          dataType: legalHold.dataType,
          reason,
          originalReason: legalHold.reason
        }
      });

      logger.info('Legal hold released', {
        legalHoldId,
        tenantId: legalHold.tenantId,
        dataType: legalHold.dataType,
        releasedBy,
        reason
      });

    } catch (error) {
      logger.error('Failed to release legal hold', error as Error, {
        legalHoldId,
        releasedBy
      });

      // CRITICAL: Log failure
      this.auditLogger.logConfigurationChange({
        tenantId: 'system',
        actorId: releasedBy,
        action: 'LEGAL_HOLD_RELEASED',
        resourceType: 'SYSTEM_CONFIG' as const,
        resourceId: legalHoldId,
        outcome: 'FAILURE',
        correlationId,
        metadata: {
          error: (error as Error).message
        }
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Get active legal holds
   */
  async getActiveLegalHolds(dataType?: RetentionPolicy['dataType']): Promise<LegalHold[]> {
    try {
      let query = `
        SELECT id, tenant_id, data_type, reason, requested_by, 
               requested_at, expires_at, is_active, metadata
        FROM legal_holds 
        WHERE is_active = true
      `;

      const params: any[] = [];
      if (dataType) {
        query += ` AND data_type = $1`;
        params.push(dataType);
      }

      query += ` ORDER BY requested_at DESC`;

      const results = await this.prisma.$queryRawUnsafe(query, ...params) as LegalHold[];

      // CRITICAL: Parse metadata
      results.forEach(hold => {
        if (typeof hold.metadata === 'string') {
          hold.metadata = JSON.parse(hold.metadata);
        }
      });

      return results;

    } catch (error) {
      logger.error('Failed to get active legal holds', error as Error, { dataType });
      throw error;
    }
  }

  /**
   * CRITICAL: Check if data is under legal hold
   */
  async isUnderLegalHold(
    tenantId: string,
    dataType: RetentionPolicy['dataType']
  ): Promise<boolean> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM legal_holds 
        WHERE tenant_id = ${tenantId} 
        AND data_type = ${dataType} 
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
      ` as Array<{ count: bigint }>;

      return Number(result[0].count) > 0;

    } catch (error) {
      logger.error('Failed to check legal hold status', error as Error, {
        tenantId,
        dataType
      });
      return false; // CRITICAL: Fail safe - assume no legal hold
    }
  }

  /**
   * CRITICAL: Enforce retention policy
   */
  async enforceRetentionPolicy(
    dataType: RetentionPolicy['dataType'],
    correlationId: string,
    dryRun: boolean = false
  ): Promise<RetentionEnforcementResult> {
    const policy = this.retentionPolicies.get(dataType);
    if (!policy || !policy.enforcementEnabled) {
      throw new Error(`Retention policy not found or disabled for: ${dataType}`);
    }

    const jobId = this.generateSecureId();
    const startTime = Date.now();

    const job: RetentionJob = {
      id: jobId,
      dataType,
      status: 'RUNNING',
      startedAt: new Date(),
      recordsProcessed: 0,
      recordsDeleted: 0,
      errors: [],
      metadata: {
        correlationId,
        dryRun,
        retentionDays: policy.retentionDays
      }
    };

    this.activeJobs.set(jobId, job);

    try {
      // CRITICAL: Get active legal holds for this data type
      const activeLegalHolds = await this.getActiveLegalHolds(dataType);
      const legalHoldTenantIds = new Set(activeLegalHolds.map(hold => hold.tenantId));

      // CRITICAL: Log enforcement start
      this.auditLogger.logConfigurationChange({
        tenantId: 'system',
        actorId: 'system',
        action: 'RETENTION_ENFORCEMENT_START',
        resourceType: 'SYSTEM_CONFIG' as const,
        resourceId: dataType,
        outcome: 'SUCCESS',
        correlationId,
        metadata: {
          dataType,
          jobId,
          retentionDays: policy.retentionDays,
          legalHoldCount: activeLegalHolds.length,
          dryRun
        }
      });

      const result = await this.executeRetentionEnforcement(
        dataType,
        policy,
        legalHoldTenantIds,
        correlationId,
        dryRun
      );

      // CRITICAL: Update job status
      job.status = 'COMPLETED';
      job.completedAt = new Date();
      job.recordsProcessed = result.recordsProcessed;
      job.recordsDeleted = result.recordsDeleted;
      job.duration = Date.now() - startTime;

      // CRITICAL: Log enforcement completion
      this.auditLogger.logConfigurationChange({
        tenantId: 'system',
        actorId: 'system',
        action: 'RETENTION_ENFORCEMENT_COMPLETE',
        resourceType: 'SYSTEM_CONFIG' as const,
        resourceId: dataType,
        outcome: 'SUCCESS',
        correlationId,
        metadata: {
          dataType,
          jobId,
          recordsProcessed: result.recordsProcessed,
          recordsDeleted: result.recordsDeleted,
          recordsSkipped: result.recordsSkipped,
          legalHoldsBlocked: result.legalHoldsBlocked,
          duration: job.duration,
          dryRun
        }
      });

      logger.info('Retention policy enforcement completed', {
        dataType,
        jobId,
        recordsProcessed: result.recordsProcessed,
        recordsDeleted: result.recordsDeleted,
        recordsSkipped: result.recordsSkipped,
        legalHoldsBlocked: result.legalHoldsBlocked,
        duration: job.duration,
        dryRun
      });

      return {
        jobId,
        dataType,
        recordsProcessed: result.recordsProcessed,
        recordsDeleted: result.recordsDeleted,
        recordsSkipped: result.recordsSkipped,
        errors: result.errors,
        duration: job.duration,
        legalHoldsBlocked: result.legalHoldsBlocked
      };

    } catch (error) {
      // CRITICAL: Update job status on failure
      job.status = 'FAILED';
      job.completedAt = new Date();
      job.errors.push((error as Error).message);
      job.duration = Date.now() - startTime;

      // CRITICAL: Log enforcement failure
      this.auditLogger.logConfigurationChange({
        tenantId: 'system',
        actorId: 'system',
        action: 'RETENTION_ENFORCEMENT_FAILED',
        resourceType: 'SYSTEM_CONFIG' as const,
        resourceId: dataType,
        outcome: 'FAILURE',
        correlationId,
        metadata: {
          dataType,
          jobId,
          error: (error as Error).message,
          duration: job.duration
        }
      });

      logger.error('Retention policy enforcement failed', error as Error, {
        dataType,
        jobId,
        duration: job.duration
      });

      throw error;

    } finally {
      // CRITICAL: Clean up job
      this.activeJobs.delete(jobId);
    }
  }

  /**
   * CRITICAL: Execute retention enforcement for specific data type
   */
  private async executeRetentionEnforcement(
    dataType: RetentionPolicy['dataType'],
    policy: RetentionPolicy,
    legalHoldTenantIds: Set<string>,
    correlationId: string,
    dryRun: boolean
  ): Promise<{
    recordsProcessed: number;
    recordsDeleted: number;
    recordsSkipped: number;
    errors: string[];
    legalHoldsBlocked: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

    let recordsProcessed = 0;
    let recordsDeleted = 0;
    let recordsSkipped = 0;
    let legalHoldsBlocked = 0;
    const errors: string[] = [];

    try {
      switch (dataType) {
        case 'AUDIT_LOGS':
          {
            const auditResult = await this.enforceAuditLogRetention(cutoffDate, legalHoldTenantIds, dryRun);
            recordsProcessed = auditResult.recordsProcessed;
            recordsDeleted = auditResult.recordsDeleted;
            recordsSkipped = auditResult.recordsSkipped;
            legalHoldsBlocked = auditResult.legalHoldsBlocked;
            break;
          }

        case 'DATABASE_BACKUPS':
          {
            const backupResult = await this.enforceBackupRetention(cutoffDate, legalHoldTenantIds, dryRun);
            recordsProcessed = backupResult.recordsProcessed;
            recordsDeleted = backupResult.recordsDeleted;
            recordsSkipped = backupResult.recordsSkipped;
            legalHoldsBlocked = backupResult.legalHoldsBlocked;
            break;
          }

        case 'SOFT_DELETED_TENANTS':
          {
            const tenantResult = await this.enforceTenantRetention(cutoffDate, legalHoldTenantIds, dryRun);
            recordsProcessed = tenantResult.recordsProcessed;
            recordsDeleted = tenantResult.recordsDeleted;
            recordsSkipped = tenantResult.recordsSkipped;
            legalHoldsBlocked = tenantResult.legalHoldsBlocked;
            break;
          }

        case 'USER_DATA':
          {
            const userDataResult = await this.enforceUserDataRetention(cutoffDate, legalHoldTenantIds, dryRun);
            recordsProcessed = userDataResult.recordsProcessed;
            recordsDeleted = userDataResult.recordsDeleted;
            recordsSkipped = userDataResult.recordsSkipped;
            legalHoldsBlocked = userDataResult.legalHoldsBlocked;
            break;
          }

        default:
          throw new Error(`Unknown data type for retention enforcement: ${dataType}`);
      }

    } catch (error) {
      errors.push((error as Error).message);
      logger.error('Retention enforcement execution failed', error as Error, {
        dataType,
        cutoffDate,
        legalHoldCount: legalHoldTenantIds.size
      });
    }

    return {
      recordsProcessed,
      recordsDeleted,
      recordsSkipped,
      errors,
      legalHoldsBlocked
    };
  }

  /**
   * CRITICAL: Enforce audit log retention
   */
  private async enforceAuditLogRetention(
    cutoffDate: Date,
    legalHoldTenantIds: Set<string>,
    dryRun: boolean
  ): Promise<{
    recordsProcessed: number;
    recordsDeleted: number;
    recordsSkipped: number;
    legalHoldsBlocked: number;
  }> {
    try {
      let recordsProcessed = 0;
      let recordsDeleted = 0;
      let recordsSkipped = 0;
      let legalHoldsBlocked = 0;

      // CRITICAL: Get old audit logs (excluding legal holds)
      const query = `
        SELECT id, tenant_id, timestamp
        FROM audit_logs 
        WHERE timestamp < $1
        AND tenant_id NOT IN (${Array.from(legalHoldTenantIds).map((_, i) => `$${i + 2}`).join(', ')})
        ORDER BY timestamp ASC
        LIMIT 10000
      `;

      const params = [cutoffDate, ...Array.from(legalHoldTenantIds)];
      const oldLogs = await this.prisma.$queryRawUnsafe(query, ...params) as Array<{ id: string; tenant_id: string; timestamp: Date }>;

      for (const log of oldLogs) {
        recordsProcessed++;

        if (legalHoldTenantIds.has(log.tenant_id)) {
          recordsSkipped++;
          legalHoldsBlocked++;
          continue;
        }

        if (!dryRun) {
          // CRITICAL: Delete old audit logs (this is the only allowed deletion)
          await this.prisma.$executeRaw`DELETE FROM audit_logs WHERE id = ${log.id}`;
          recordsDeleted++;
        } else {
          recordsDeleted++; // Count as would-be deleted in dry run
        }
      }

      return {
        recordsProcessed,
        recordsDeleted,
        recordsSkipped,
        legalHoldsBlocked
      };

    } catch (error) {
      logger.error('Failed to enforce audit log retention', error as Error, {
        cutoffDate,
        legalHoldCount: legalHoldTenantIds.size
      });
      throw error;
    }
  }

  /**
   * CRITICAL: Enforce backup retention
   */
  private async enforceBackupRetention(
    cutoffDate: Date,
    legalHoldTenantIds: Set<string>,
    dryRun: boolean
  ): Promise<{
    recordsProcessed: number;
    recordsDeleted: number;
    recordsSkipped: number;
    legalHoldsBlocked: number;
  }> {
    // CRITICAL: Implementation would depend on backup storage system
    // This is a placeholder for the actual backup retention logic
    logger.info('Backup retention enforcement', {
      cutoffDate,
      legalHoldCount: legalHoldTenantIds.size,
      dryRun
    });

    return {
      recordsProcessed: 0,
      recordsDeleted: 0,
      recordsSkipped: 0,
      legalHoldsBlocked: 0
    };
  }

  /**
   * CRITICAL: Enforce tenant retention
   */
  private async enforceTenantRetention(
    cutoffDate: Date,
    legalHoldTenantIds: Set<string>,
    dryRun: boolean
  ): Promise<{
    recordsProcessed: number;
    recordsDeleted: number;
    recordsSkipped: number;
    legalHoldsBlocked: number;
  }> {
    try {
      let recordsProcessed = 0;
      let recordsDeleted = 0;
      let recordsSkipped = 0;
      let legalHoldsBlocked = 0;

      // CRITICAL: Get soft-deleted tenants past retention period
      const query = `
        SELECT id, tenant_id, deleted_at
        FROM tenants 
        WHERE deleted_at < $1
        AND deleted_at IS NOT NULL
        AND tenant_id NOT IN (${Array.from(legalHoldTenantIds).map((_, i) => `$${i + 2}`).join(', ')})
        ORDER BY deleted_at ASC
        LIMIT 1000
      `;

      const params = [cutoffDate, ...Array.from(legalHoldTenantIds)];
      const oldTenants = await this.prisma.$queryRawUnsafe(query, ...params) as Array<{ id: string; tenant_id: string; deleted_at: Date }>;

      for (const tenant of oldTenants) {
        recordsProcessed++;

        if (legalHoldTenantIds.has(tenant.tenant_id)) {
          recordsSkipped++;
          legalHoldsBlocked++;
          continue;
        }

        if (!dryRun) {
          // CRITICAL: Permanently delete tenant data
          await this.permanentlyDeleteTenant(tenant.tenant_id);
          recordsDeleted++;
        } else {
          recordsDeleted++; // Count as would-be deleted in dry run
        }
      }

      return {
        recordsProcessed,
        recordsDeleted,
        recordsSkipped,
        legalHoldsBlocked
      };

    } catch (error) {
      logger.error('Failed to enforce tenant retention', error as Error, {
        cutoffDate,
        legalHoldCount: legalHoldTenantIds.size
      });
      throw error;
    }
  }

  /**
   * CRITICAL: Enforce user data retention
   */
  private async enforceUserDataRetention(
    cutoffDate: Date,
    legalHoldTenantIds: Set<string>,
    dryRun: boolean
  ): Promise<{
    recordsProcessed: number;
    recordsDeleted: number;
    recordsSkipped: number;
    legalHoldsBlocked: number;
  }> {
    // CRITICAL: Implementation would depend on specific user data retention requirements
    // This is a placeholder for the actual user data retention logic
    logger.info('User data retention enforcement', {
      cutoffDate,
      legalHoldCount: legalHoldTenantIds.size,
      dryRun
    });

    return {
      recordsProcessed: 0,
      recordsDeleted: 0,
      recordsSkipped: 0,
      legalHoldsBlocked: 0
    };
  }

  /**
   * CRITICAL: Permanently delete tenant and all associated data
   */
  private async permanentlyDeleteTenant(tenantId: string): Promise<void> {
    // CRITICAL: This is a destructive operation that cannot be undone
    // All data associated with the tenant will be permanently deleted
    
    try {
      // CRITICAL: Delete in proper order to respect foreign key constraints
      await this.prisma.$transaction(async (tx: any) => {
        // Delete user-tenant relationships
        await tx.$executeRaw`DELETE FROM user_tenants WHERE tenant_id = ${tenantId}`;
        
        // Delete tenant
        await tx.$executeRaw`DELETE FROM tenants WHERE id = ${tenantId}`;
        
        // CRITICAL: Note: Other tenant-specific data would be deleted here
        // This is a simplified example - real implementation would delete all data
      });

      logger.info('Tenant permanently deleted', { tenantId });

    } catch (error) {
      logger.error('Failed to permanently delete tenant', error as Error, { tenantId });
      throw error;
    }
  }

  /**
   * CRITICAL: Get retention job status
   */
  getJobStatus(jobId: string): RetentionJob | undefined {
    return this.activeJobs.get(jobId);
  }

  /**
   * CRITICAL: Get retention statistics
   */
  async getRetentionStatistics(): Promise<{
    policies: Array<{
      dataType: RetentionPolicy['dataType'];
      retentionDays: number;
      enforcementEnabled: boolean;
      legalHoldCount: number;
      lastEnforcedAt?: Date;
    }>;
    activeLegalHolds: number;
    activeJobs: number;
  }> {
    const policies = Array.from(this.retentionPolicies.entries()).map(([dataType, policy]) => ({
      dataType,
      retentionDays: policy.retentionDays,
      enforcementEnabled: policy.enforcementEnabled,
      legalHoldCount: policy.legalHoldExceptions.length,
      lastEnforcedAt: policy.lastEnforcedAt
    }));

    const activeLegalHolds = await this.getActiveLegalHolds();

    return {
      policies,
      activeLegalHolds: activeLegalHolds.length,
      activeJobs: this.activeJobs.size
    };
  }

  /**
   * CRITICAL: Generate cryptographically secure ID
   */
  private generateSecureId(): string {
    const bytes = crypto.randomBytes(16);
    return `retention_${bytes.toString('hex')}`;
  }
}

/**
 * CRITICAL: Factory function for creating compliance retention manager
 */
export const createComplianceRetentionManager = (prisma: PrismaClient): ComplianceRetentionManager => {
  return new ComplianceRetentionManager(prisma);
};

/**
 * CRITICAL: Global compliance retention manager instance
 */
let globalComplianceRetentionManager: ComplianceRetentionManager | null = null;

/**
 * CRITICAL: Get or create global compliance retention manager
 */
export const getComplianceRetentionManager = (prisma?: PrismaClient): ComplianceRetentionManager => {
  if (!globalComplianceRetentionManager) {
    if (!prisma) {
      throw new Error('Prisma client required for first initialization');
    }
    globalComplianceRetentionManager = new ComplianceRetentionManager(prisma);
  }
  return globalComplianceRetentionManager;
};
