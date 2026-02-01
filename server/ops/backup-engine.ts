import type { BackupConfig, BackupResult } from '../backup/database-backup.js';
import { DatabaseBackupService } from '../backup/database-backup.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import type { TenantContext } from '../tenant/tenant-isolation.js';

export interface BackupEngineRequest {
  config: BackupConfig;
  tenantContext: TenantContext;
  requestId: string;
}

export async function runBackup(request: BackupEngineRequest): Promise<BackupResult> {
  const audit = getImmutableAuditLogger();
  const actorId = ((request.tenantContext as any)?.user?.id || 'system') as string;

  audit.logSecurityEvent({
    tenantId: request.tenantContext.tenantId,
    actorId,
    action: 'BACKUP_REQUESTED',
    resourceType: 'DATABASE_BACKUP',
    resourceId: 'database',
    outcome: 'SUCCESS',
    correlationId: request.requestId,
    severity: 'HIGH',
    metadata: {
      backupDirectory: request.config.backupDirectory,
      retentionDays: request.config.retentionDays,
    },
  });

  const svc = new DatabaseBackupService(request.config);
  const result = await svc.createBackup();

  audit.logSecurityEvent({
    tenantId: request.tenantContext.tenantId,
    actorId,
    action: result.success ? 'BACKUP_COMPLETED' : 'BACKUP_FAILED',
    resourceType: 'DATABASE_BACKUP',
    resourceId: result.backupId,
    outcome: result.success ? 'SUCCESS' : 'FAILURE',
    correlationId: request.requestId,
    severity: result.success ? 'MEDIUM' : 'CRITICAL',
    metadata: {
      filePath: result.filePath,
      fileSize: result.fileSize,
      error: result.error,
      duration: result.duration,
    },
  });

  return result;
}
