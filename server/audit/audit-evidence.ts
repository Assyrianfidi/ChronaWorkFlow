import type { PrismaClient } from '@prisma/client';

import { stableHash, stableId } from '../finance/ledger-invariants.js';
import type { LedgerStore } from '../finance/ledger-engine.js';
import { buildTrialBalance } from '../finance/trial-balance.js';
import type { PeriodLocks } from '../finance/period-locks.js';

import { createCorrelationId, type ObservabilityContext } from '../observability/observability-context.js';

import { evaluateRetentionEligibility, type RetentionDataType } from './audit-retention.js';

export interface AuditEvidenceBundle {
  bundleId: string;
  createdAt: string;
  tenantId: string;
  actorId: string;
  correlationId: string;
  requestId: string;

  admission: {
    decision: ObservabilityContext['admissionDecision'];
    reason?: string;
  };

  ledger: {
    companyId: string;
    from: string;
    to: string;
    trialBalanceIntegrityHash: string;
    periodState: {
      periodId: string | null;
      state: string;
    };
  };

  retention: {
    dataType: RetentionDataType;
    retain: boolean;
    expiresAt: string;
    legalHold: boolean;
    reason: string;
    policyDays: number;
  };

  integrityHash: string;
}

function isDeterministic(): boolean {
  return process.env.DETERMINISTIC_TEST_IDS === 'true';
}

function now(): Date {
  return isDeterministic() ? new Date(0) : new Date();
}

function canonicalize(bundle: Omit<AuditEvidenceBundle, 'integrityHash'>): string {
  return JSON.stringify(bundle);
}
export async function buildAuditEvidenceBundle(input: {
  tenantId: string;
  actorId: string;
  requestId: string;
  companyId: string;
  from: Date;
  to: Date;
  admissionDecision?: ObservabilityContext['admissionDecision'];
  admissionReason?: string;
  periodLocks: PeriodLocks;
  ledgerStore?: LedgerStore;
  prisma?: PrismaClient;
  retentionDataType?: RetentionDataType;
}): Promise<AuditEvidenceBundle> {
  const correlationId = createCorrelationId({ prefix: 'audit_evidence', requestId: input.requestId, tenantId: input.tenantId });

  const ts = now();

  const periodState = await input.periodLocks.getPeriodStateForDate({ companyId: input.companyId, date: input.to });

  const tb = await buildTrialBalance({
    companyId: input.companyId,
    from: input.from,
    to: input.to,
    store: input.ledgerStore,
  });

  const retentionEval = await evaluateRetentionEligibility({
    tenantId: input.tenantId,
    dataType: input.retentionDataType ?? 'AUDIT_LOGS',
    eventTimestamp: ts,
    prisma: input.prisma,
  });

  const seed = `${input.tenantId}:${input.companyId}:${input.requestId}:${input.from.toISOString()}:${input.to.toISOString()}`;
  const bundleId = stableId('evidence', seed);

  const base: Omit<AuditEvidenceBundle, 'integrityHash'> = {
    bundleId,
    createdAt: ts.toISOString(),
    tenantId: input.tenantId,
    actorId: input.actorId,
    correlationId,
    requestId: input.requestId,
    admission: {
      decision: input.admissionDecision ?? 'UNKNOWN',
      reason: input.admissionReason,
    },
    ledger: {
      companyId: input.companyId,
      from: input.from.toISOString(),
      to: input.to.toISOString(),
      trialBalanceIntegrityHash: tb.integrityHash,
      periodState: {
        periodId: periodState.periodId,
        state: periodState.state,
      },
    },
    retention: {
      dataType: retentionEval.dataType,
      retain: retentionEval.retain,
      expiresAt: retentionEval.expiresAt.toISOString(),
      legalHold: retentionEval.legalHold,
      reason: retentionEval.reason,
      policyDays: retentionEval.policyDays,
    },
  };

  const integrityHash = stableHash(canonicalize(base));

  return {
    ...base,
    integrityHash,
  };
}
