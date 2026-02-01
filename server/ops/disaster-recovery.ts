import type { BackupConfig, BackupVerification } from '../backup/database-backup.js';
import type { TenantContext } from '../tenant/tenant-isolation.js';

import { validateRestore } from './restore-validation.js';

import { stableHash } from '../finance/ledger-invariants.js';
import { buildTrialBalance } from '../finance/trial-balance.js';
import type { LedgerStore } from '../finance/ledger-engine.js';

export interface DisasterRecoveryReadinessRequest {
  tenantContext: TenantContext;
  requestId: string;
  backupConfig: BackupConfig;
  backupId: string;
  trialBalance?: {
    companyId: string;
    from: Date;
    to: Date;
    store?: LedgerStore;
  };
}

export interface DisasterRecoveryReadinessReport {
  generatedAt: string;
  tenantId: string;
  requestId: string;
  backup: BackupVerification;
  trialBalance?: {
    companyId: string;
    from: string;
    to: string;
    integrityHash: string;
  };
  ready: boolean;
  reasons: string[];
  integrityHash: string;
}

function isDeterministic(): boolean {
  return process.env.DETERMINISTIC_TEST_IDS === 'true';
}

function now(): Date {
  return isDeterministic() ? new Date(0) : new Date();
}

function canonicalize(report: Omit<DisasterRecoveryReadinessReport, 'integrityHash'>): string {
  return JSON.stringify(report);
}

export async function validateDisasterRecoveryReadiness(
  input: DisasterRecoveryReadinessRequest,
): Promise<DisasterRecoveryReadinessReport> {
  const ts = now();
  const backup = await validateRestore({
    config: input.backupConfig,
    tenantContext: input.tenantContext,
    requestId: input.requestId,
    backupId: input.backupId,
  });

  const reasons: string[] = [];
  if (!backup.isValid) reasons.push('backup_invalid');
  if (!backup.checksumMatches) reasons.push('backup_checksum_mismatch');
  if (!backup.canRestore) reasons.push('backup_not_restorable');

  let tbResult: DisasterRecoveryReadinessReport['trialBalance'];
  if (input.trialBalance) {
    const tb = await buildTrialBalance({
      companyId: input.trialBalance.companyId,
      from: input.trialBalance.from,
      to: input.trialBalance.to,
      store: input.trialBalance.store,
    });

    tbResult = {
      companyId: input.trialBalance.companyId,
      from: input.trialBalance.from.toISOString(),
      to: input.trialBalance.to.toISOString(),
      integrityHash: tb.integrityHash,
    };
  }

  const base: Omit<DisasterRecoveryReadinessReport, 'integrityHash'> = {
    generatedAt: ts.toISOString(),
    tenantId: input.tenantContext.tenantId,
    requestId: input.requestId,
    backup,
    trialBalance: tbResult,
    ready: reasons.length === 0,
    reasons,
  };

  return {
    ...base,
    integrityHash: stableHash(canonicalize(base)),
  };
}
