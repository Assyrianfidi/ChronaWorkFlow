import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { LedgerEngine, ledgerEngine as defaultLedgerEngine } from './ledger-engine.js';
import { LedgerTransaction, parseMoneyToCents, stableId } from './ledger-invariants.js';
import { PeriodLocks, DrizzlePeriodLocks } from './period-locks.js';
import {
  MemoryRevenueScheduleStore,
  RevenueSchedule,
  RevenueScheduleInput,
  RevenueScheduleStore,
  scheduleIntegrityHash,
} from './revenue-schedules.js';

export type RecognitionResult = {
  status: 'POSTED' | 'SKIPPED';
  postedTransactionNumbers: string[];
};

function isDeterministic(): boolean {
  return process.env.DETERMINISTIC_TEST_IDS === 'true';
}

function getAudit() {
  return getImmutableAuditLogger();
}

function daysBetweenInclusive(start: Date, end: Date): number {
  const a = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const b = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  return Math.floor((b.getTime() - a.getTime()) / 86400000) + 1;
}

function clampDate(d: Date, min: Date, max: Date): Date {
  if (d.getTime() < min.getTime()) return min;
  if (d.getTime() > max.getTime()) return max;
  return d;
}

function centsToMoney(cents: bigint): string {
  const neg = cents < 0n;
  const abs = neg ? -cents : cents;
  const whole = abs / 100n;
  const frac = (abs % 100n).toString().padStart(2, '0');
  return `${neg ? '-' : ''}${whole.toString()}.${frac}`;
}

export class RevenueRecognitionEngine {
  constructor(
    private readonly schedules: RevenueScheduleStore = new MemoryRevenueScheduleStore(),
    private readonly ledger: LedgerEngine = defaultLedgerEngine,
    private readonly periodLocks: PeriodLocks = new DrizzlePeriodLocks(),
  ) {}

  async createSchedule(input: RevenueScheduleInput & { correlationId: string }): Promise<RevenueSchedule> {
    const created = await this.schedules.create(input);

    getAudit().logSecurityEvent({
      tenantId: created.companyId,
      actorId: created.createdBy,
      action: 'REVENUE_SCHEDULE_CREATED',
      resourceType: 'REVENUE_SCHEDULE',
      resourceId: created.scheduleId,
      outcome: 'ALLOWED',
      correlationId: input.correlationId,
      severity: 'MEDIUM',
      metadata: {
        scheduleId: created.scheduleId,
        integrityHash: scheduleIntegrityHash(created),
        reference: created.reference,
        method: created.method,
        scheduleType: created.scheduleType,
      },
    });

    return created;
  }

  private computeStraightLineRecognitions(schedule: RevenueSchedule, from: Date, to: Date): Array<{ date: Date; amount: string }> {
    const windowStart = clampDate(from, schedule.startDate, schedule.endDate);
    const windowEnd = clampDate(to, schedule.startDate, schedule.endDate);
    if (windowStart.getTime() > windowEnd.getTime()) return [];

    // Deterministic proration by day count within the schedule.
    const totalDays = daysBetweenInclusive(schedule.startDate, schedule.endDate);
    const windowDays = daysBetweenInclusive(windowStart, windowEnd);

    const centsTotal = parseMoneyToCents(schedule.totalAmount);
    const cents = (centsTotal * BigInt(windowDays)) / BigInt(totalDays);
    const amount = centsToMoney(cents);

    return [{ date: windowEnd, amount }];
  }

  private computeMilestoneRecognitions(schedule: RevenueSchedule, from: Date, to: Date): Array<{ date: Date; amount: string; label?: string | null }> {
    const milestones = schedule.milestones ?? [];
    return milestones
      .filter((m) => m.date.getTime() >= from.getTime() && m.date.getTime() <= to.getTime())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((m) => ({ date: m.date, amount: m.amount, label: m.label ?? null }));
  }

  async recognizeRevenueForWindow(input: {
    companyId: string;
    scheduleId: string;
    from: Date;
    to: Date;
    actorId: string;
    correlationId: string;
  }): Promise<RecognitionResult> {
    const schedule = await this.schedules.getById(input.companyId, input.scheduleId);
    if (!schedule) {
      getAudit().logSecurityEvent({
        tenantId: input.companyId,
        actorId: input.actorId,
        action: 'REVENUE_RECOGNITION_FAILED',
        resourceType: 'REVENUE_SCHEDULE',
        resourceId: input.scheduleId,
        outcome: 'DENIED',
        correlationId: input.correlationId,
        severity: 'HIGH',
        metadata: { reason: 'schedule_not_found' },
      });
      throw new Error('Revenue schedule not found');
    }

    // Pre-check lock for better error context (ledger boundary will enforce too)
    await this.periodLocks.assertCanPost({
      companyId: input.companyId,
      date: input.to,
      actorId: input.actorId,
      correlationId: input.correlationId,
      transactionNumber: `revrec:${schedule.scheduleId}`,
    });

    let recognitions: Array<{ date: Date; amount: string; label?: string | null }> = [];
    if (schedule.scheduleType === 'STRAIGHT_LINE') {
      recognitions = this.computeStraightLineRecognitions(schedule, input.from, input.to);
    } else {
      recognitions = this.computeMilestoneRecognitions(schedule, input.from, input.to);
    }

    if (recognitions.length === 0) {
      getAudit().logSecurityEvent({
        tenantId: input.companyId,
        actorId: input.actorId,
        action: 'REVENUE_RECOGNITION_SKIPPED',
        resourceType: 'REVENUE_SCHEDULE',
        resourceId: schedule.scheduleId,
        outcome: 'ALLOWED',
        correlationId: input.correlationId,
        severity: 'LOW',
        metadata: { scheduleId: schedule.scheduleId, from: input.from.toISOString(), to: input.to.toISOString() },
      });

      return { status: 'SKIPPED', postedTransactionNumbers: [] };
    }

    const postedNumbers: string[] = [];

    try {
      for (const rec of recognitions) {
        const txnNumberSeed = `${schedule.scheduleId}:${rec.date.toISOString()}:${rec.amount}`;
        const transactionNumber = isDeterministic()
          ? `REVREC_${schedule.companyId}_${stableId('n', txnNumberSeed).slice(0, 24)}`
          : `REVREC_${stableId('n', txnNumberSeed).slice(0, 24)}`;

        const idempotencyKey = `revrec:${schedule.scheduleId}:${rec.date.toISOString()}:${rec.amount}`;
        const transactionId = stableId('txn', `${schedule.companyId}:${transactionNumber}:${idempotencyKey}`);

        const txn: LedgerTransaction = {
          companyId: schedule.companyId,
          transactionId,
          transactionNumber,
          date: rec.date,
          type: 'journal_entry',
          description: schedule.memo ?? 'Revenue recognition',
          referenceNumber: schedule.reference.resourceId,
          createdBy: input.actorId,
          idempotencyKey,
          currency: schedule.currency,
          reversalOfTransactionId: null,
          lines: [
            {
              companyId: schedule.companyId,
              transactionId,
              lineId: stableId('line', `${transactionId}:deferred:${rec.amount}`),
              accountId: schedule.deferredRevenueAccountId,
              side: 'DEBIT',
              amount: rec.amount,
              currency: schedule.currency,
              description: rec.label ?? null,
              allowNegative: false,
            },
            {
              companyId: schedule.companyId,
              transactionId,
              lineId: stableId('line', `${transactionId}:earned:${rec.amount}`),
              accountId: schedule.revenueAccountId,
              side: 'CREDIT',
              amount: rec.amount,
              currency: schedule.currency,
              description: rec.label ?? null,
              allowNegative: true,
            },
          ],
        };

        await this.ledger.post(txn);
        postedNumbers.push(transactionNumber);
      }

      getAudit().logSecurityEvent({
        tenantId: input.companyId,
        actorId: input.actorId,
        action: 'REVENUE_RECOGNITION_EXECUTED',
        resourceType: 'REVENUE_SCHEDULE',
        resourceId: schedule.scheduleId,
        outcome: 'ALLOWED',
        correlationId: input.correlationId,
        severity: 'MEDIUM',
        metadata: {
          scheduleId: schedule.scheduleId,
          integrityHash: scheduleIntegrityHash(schedule),
          from: input.from.toISOString(),
          to: input.to.toISOString(),
          postedTransactionNumbers: postedNumbers,
        },
      });

      return { status: 'POSTED', postedTransactionNumbers: postedNumbers };
    } catch (error) {
      getAudit().logSecurityEvent({
        tenantId: input.companyId,
        actorId: input.actorId,
        action: 'REVENUE_RECOGNITION_FAILED',
        resourceType: 'REVENUE_SCHEDULE',
        resourceId: schedule.scheduleId,
        outcome: 'DENIED',
        correlationId: input.correlationId,
        severity: 'HIGH',
        metadata: {
          scheduleId: schedule.scheduleId,
          message: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }
}
