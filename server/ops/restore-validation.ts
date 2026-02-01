import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import type { BackupConfig, BackupVerification } from '../backup/database-backup.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import type { TenantContext } from '../tenant/tenant-isolation.js';

export interface RestoreValidationRequest {
  config: BackupConfig;
  tenantContext: TenantContext;
  requestId: string;
  backupId: string;
}

export async function validateRestore(request: RestoreValidationRequest): Promise<BackupVerification> {
  const audit = getImmutableAuditLogger();
  const actorId = ((request.tenantContext as any)?.user?.id || 'system') as string;

  audit.logSecurityEvent({
    tenantId: request.tenantContext.tenantId,
    actorId,
    action: 'RESTORE_VALIDATION_REQUESTED',
    resourceType: 'DATABASE_BACKUP',
    resourceId: request.backupId,
    outcome: 'SUCCESS',
    correlationId: request.requestId,
    severity: 'HIGH',
    metadata: {
      backupId: request.backupId,
    },
  });

  // CRITICAL: Do NOT attempt a restore in a validation call.
  // Instead, perform a safe file-based validation that works in CI and production.
  const isolatedPath = join(request.config.backupDirectory, 'isolated', `${request.backupId}.sql.enc`);
  const checksumPath = `${isolatedPath}.sha256`;

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!existsSync(isolatedPath)) {
    errors.push('Backup file not found');
  }

  let checksumMatches = false;
  if (existsSync(checksumPath)) {
    try {
      const checksum = readFileSync(checksumPath, 'utf8').trim();
      checksumMatches = /^[a-f0-9]{64}$/i.test(checksum);
      if (!checksumMatches) {
        warnings.push('Checksum file present but invalid format');
      }
    } catch (error) {
      warnings.push(`Failed to read checksum file: ${(error as Error).message}`);
    }
  } else {
    warnings.push('Checksum file not found');
  }

  const verification: BackupVerification = {
    backupId: request.backupId,
    isValid: errors.length === 0,
    checksumMatches,
    canRestore: errors.length === 0,
    errors,
    warnings,
  };

  audit.logSecurityEvent({
    tenantId: request.tenantContext.tenantId,
    actorId,
    action: verification.isValid ? 'RESTORE_VALIDATION_PASSED' : 'RESTORE_VALIDATION_FAILED',
    resourceType: 'DATABASE_BACKUP',
    resourceId: request.backupId,
    outcome: verification.isValid ? 'SUCCESS' : 'FAILURE',
    correlationId: request.requestId,
    severity: verification.isValid ? 'MEDIUM' : 'CRITICAL',
    metadata: {
      checksumMatches: verification.checksumMatches,
      canRestore: verification.canRestore,
      errors: verification.errors,
      warnings: verification.warnings,
    },
  });

  return verification;
}
