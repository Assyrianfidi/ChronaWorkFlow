import type { PrismaClient } from '@prisma/client';

import { getComplianceRetentionManager } from '../compliance/retention-legal-hold.js';

export type RetentionDataType = 'AUDIT_LOGS' | 'DATABASE_BACKUPS' | 'SOFT_DELETED_TENANTS' | 'USER_DATA';

export interface AuditRetentionPolicy {
  dataType: RetentionDataType;
  retentionDays: number;
}

export interface AuditRetentionEvaluation {
  dataType: RetentionDataType;
  retain: boolean;
  expiresAt: Date;
  policyDays: number;
  legalHold: boolean;
  reason: string;
}

export function getDefaultAuditRetentionPolicy(dataType: RetentionDataType = 'AUDIT_LOGS'): AuditRetentionPolicy {
  if (dataType === 'AUDIT_LOGS') {
    return { dataType, retentionDays: 2555 };
  }
  if (dataType === 'DATABASE_BACKUPS') {
    return { dataType, retentionDays: 365 };
  }
  if (dataType === 'SOFT_DELETED_TENANTS') {
    return { dataType, retentionDays: 90 };
  }
  return { dataType, retentionDays: 730 };
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}
export async function evaluateRetentionEligibility(input: {
  tenantId: string;
  dataType?: RetentionDataType;
  eventTimestamp: Date;
  now?: Date;
  policy?: AuditRetentionPolicy;
  prisma?: PrismaClient;
}): Promise<AuditRetentionEvaluation> {
  const now = input.now ?? new Date();
  const policy = input.policy ?? getDefaultAuditRetentionPolicy(input.dataType ?? 'AUDIT_LOGS');

  const expiresAt = addDays(input.eventTimestamp, policy.retentionDays);

  let legalHold = true;
  let legalHoldReason = 'legal_hold_unknown_fail_safe';

  if (input.prisma) {
    try {
      const mgr = getComplianceRetentionManager(input.prisma);
      legalHold = await mgr.isUnderLegalHold(input.tenantId, policy.dataType);
      legalHoldReason = legalHold ? 'legal_hold_active' : 'no_legal_hold';
    } catch {
      legalHold = true;
      legalHoldReason = 'legal_hold_check_failed_fail_safe';
    }
  }

  const expired = now.getTime() >= expiresAt.getTime();

  // If legal hold is active/unknown -> always retain.
  if (legalHold) {
    return {
      dataType: policy.dataType,
      retain: true,
      expiresAt,
      policyDays: policy.retentionDays,
      legalHold,
      reason: legalHoldReason,
    };
  }

  // Not under legal hold: retain until expiry
  return {
    dataType: policy.dataType,
    retain: !expired,
    expiresAt,
    policyDays: policy.retentionDays,
    legalHold,
    reason: expired ? 'expired' : 'within_retention_window',
  };
}
