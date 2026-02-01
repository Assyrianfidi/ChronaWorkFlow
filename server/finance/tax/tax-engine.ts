import { getImmutableAuditLogger } from '../../compliance/immutable-audit-log.js';
import { PeriodLocks, DrizzlePeriodLocks } from '../period-locks.js';
import { buildTrialBalance } from '../trial-balance.js';
import { DrizzleLedgerStore, LedgerStore } from '../ledger-engine.js';
import { LedgerInvariantError, parseMoneyToCents, stableId } from '../ledger-invariants.js';

import { TaxExportConfig, TaxExportResult, TaxJurisdictionSummary, hashTaxExport } from './tax-schemas.js';

function getAudit() {
  return getImmutableAuditLogger();
}

function isDeterministic(): boolean {
  return process.env.DETERMINISTIC_TEST_IDS === 'true';
}

function correlationId(prefix: string, companyId: string, from: Date, to: Date): string {
  const seed = `${prefix}:${companyId}:${from.toISOString()}:${to.toISOString()}`;
  return isDeterministic() ? `tax_${prefix}_${companyId}_${from.toISOString()}_${to.toISOString()}` : stableId('tax', seed);
}

function assertFullPeriodWindow(input: { from: Date; to: Date }): void {
  if (input.from.getTime() > input.to.getTime()) {
    throw new LedgerInvariantError('MISSING_REQUIRED_FIELDS', 'Invalid period window: from must be <= to');
  }
}

export class TaxEngine {
  constructor(
    private readonly periodLocks: PeriodLocks = new DrizzlePeriodLocks(),
    private readonly store: LedgerStore = new DrizzleLedgerStore(),
  ) {}

  async exportTaxSummary(input: {
    config: TaxExportConfig;
    actorId: string;
    correlationId?: string;
    requireFinalizedPeriod?: boolean;
  }): Promise<TaxExportResult> {
    const { companyId, periodId, period, jurisdictions } = input.config;
    assertFullPeriodWindow(period);

    const corr = input.correlationId ?? correlationId('export', companyId, period.from, period.to);

    if (!periodId) {
      getAudit().logSecurityEvent({
        tenantId: companyId,
        actorId: input.actorId,
        action: 'TAX_EXPORT_DENIED_MISSING_PERIOD_ID',
        resourceType: 'TAX_EXPORT',
        resourceId: companyId,
        outcome: 'DENIED',
        correlationId: corr,
        metadata: { from: period.from.toISOString(), to: period.to.toISOString() },
      });
      throw new Error('Tax export requires an explicit periodId');
    }

    const periodStatus = await this.periodLocks.getPeriodStateForDate({ companyId, date: period.to });
    if (input.requireFinalizedPeriod !== false) {
      if (!periodStatus.periodId) {
        getAudit().logSecurityEvent({
          tenantId: companyId,
          actorId: input.actorId,
          action: 'TAX_EXPORT_DENIED_NO_PERIOD',
          resourceType: 'TAX_EXPORT',
          resourceId: companyId,
          outcome: 'DENIED',
          correlationId: corr,
          metadata: { from: period.from.toISOString(), to: period.to.toISOString() },
        });
        throw new Error('Tax export requires a defined accounting period');
      }

      if (periodStatus.periodId !== periodId) {
        getAudit().logSecurityEvent({
          tenantId: companyId,
          actorId: input.actorId,
          action: 'TAX_EXPORT_DENIED_PERIOD_ID_MISMATCH',
          resourceType: 'TAX_EXPORT',
          resourceId: periodStatus.periodId,
          outcome: 'DENIED',
          correlationId: corr,
          metadata: { expectedPeriodId: periodStatus.periodId, providedPeriodId: periodId },
        });
        throw new Error('Tax export periodId mismatch');
      }

      if (periodStatus.state !== 'SOFT_CLOSED' && periodStatus.state !== 'HARD_LOCKED') {
        getAudit().logSecurityEvent({
          tenantId: companyId,
          actorId: input.actorId,
          action: 'TAX_EXPORT_DENIED_PERIOD_NOT_FINAL',
          resourceType: 'TAX_EXPORT',
          resourceId: periodStatus.periodId,
          outcome: 'DENIED',
          correlationId: corr,
          metadata: { state: periodStatus.state, from: period.from.toISOString(), to: period.to.toISOString() },
        });
        throw new Error('Tax export requires a finalized period (SOFT_CLOSED or HARD_LOCKED)');
      }
    }

    const tb = await buildTrialBalance({ companyId, from: period.from, to: period.to, store: this.store });

    const activityByAccountId = new Map<string, bigint>();
    for (const row of tb.rows) {
      activityByAccountId.set(row.accountId, row.activityCents);
    }

    const summaries: TaxJurisdictionSummary[] = jurisdictions
      .map((j) => {
        const payableIds = [...j.taxPayableAccountIds].sort();
        const receivableIds = [...(j.taxReceivableAccountIds ?? [])].sort();

        const collected = payableIds.reduce((acc, id) => acc + (activityByAccountId.get(id) ?? 0n), 0n);
        const refundable = receivableIds.reduce((acc, id) => acc + (activityByAccountId.get(id) ?? 0n), 0n);

        const taxCollectedCents = collected < 0n ? -collected : collected;
        const taxRefundableCents = refundable < 0n ? -refundable : refundable;
        const netTaxDueCents = taxCollectedCents - taxRefundableCents;

        return {
          jurisdictionId: j.jurisdictionId,
          name: j.name,
          taxSystem: j.taxSystem,
          currency: j.currency,
          taxCollectedCents,
          taxRefundableCents,
          netTaxDueCents,
          accountIds: { payable: payableIds, receivable: receivableIds },
        };
      })
      .sort((a, b) => a.jurisdictionId.localeCompare(b.jurisdictionId));

    const unsigned: Omit<TaxExportResult, 'integrityHash'> = {
      companyId,
      periodId,
      period,
      summaries,
      trialBalanceHash: tb.integrityHash,
    };

    const integrityHash = hashTaxExport(unsigned);

    getAudit().logSecurityEvent({
      tenantId: companyId,
      actorId: input.actorId,
      action: 'TAX_EXPORT_GENERATED',
      resourceType: 'TAX_EXPORT',
      resourceId: periodId,
      outcome: 'SUCCESS',
      correlationId: corr,
      metadata: {
        periodId,
        from: period.from.toISOString(),
        to: period.to.toISOString(),
        trialBalanceHash: tb.integrityHash,
        integrityHash,
        jurisdictions: summaries.map((s) => s.jurisdictionId),
      },
    });

    return { ...unsigned, integrityHash };
  }

  static parseRateToBps(input: unknown): number {
    const cents = parseMoneyToCents(input);
    if (cents < 0n) throw new Error('Tax rate must be >= 0');
    return Number(cents);
  }
}
