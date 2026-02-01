import { and, eq, sql } from 'drizzle-orm';

import { db } from '../db.js';
import * as s from '../../shared/schema.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { stableId } from './ledger-invariants.js';
import { DrizzlePeriodLocks, PeriodLocks, PeriodState } from './period-locks.js';

export type Period = {
  id: string;
  companyId: string;
  startDate: Date;
  endDate: Date;
};

export type PeriodWithState = Period & { state: PeriodState };

function isDeterministic(): boolean {
  return process.env.DETERMINISTIC_TEST_IDS === 'true';
}

function getAudit() {
  return getImmutableAuditLogger();
}

export class PeriodEngine {
  constructor(private readonly periodLocks: PeriodLocks = new DrizzlePeriodLocks()) {}

  async getPeriodForDate(input: { companyId: string; date: Date }): Promise<PeriodWithState | null> {
    const [period] = await db
      .select()
      .from(s.accountingPeriods)
      .where(
        and(
          eq(s.accountingPeriods.companyId, input.companyId),
          sql`${s.accountingPeriods.startDate} <= ${input.date}`,
          sql`${s.accountingPeriods.endDate} >= ${input.date}`,
        ) as any,
      )
      .limit(1);

    if (!period) return null;

    const status = await this.periodLocks.getPeriodStateForDate({ companyId: input.companyId, date: input.date });

    return {
      id: period.id,
      companyId: period.companyId,
      startDate: new Date(period.startDate as any),
      endDate: new Date(period.endDate as any),
      state: status.state,
    };
  }

  async createPeriod(input: {
    companyId: string;
    startDate: Date;
    endDate: Date;
    actorId: string;
    correlationId: string;
  }): Promise<Period> {
    const seed = `${input.companyId}:${input.startDate.toISOString()}:${input.endDate.toISOString()}`;
    const id = isDeterministic() ? stableId('period', seed) : undefined;

    await db.insert(s.accountingPeriods).values({
      id,
      companyId: input.companyId,
      startDate: input.startDate,
      endDate: input.endDate,
      createdAt: new Date(),
    } as any);

    getAudit().logSecurityEvent({
      tenantId: input.companyId,
      actorId: input.actorId,
      action: 'PERIOD_CREATED',
      resourceType: 'ACCOUNTING_PERIOD',
      resourceId: id ?? 'generated',
      outcome: 'ALLOWED',
      correlationId: input.correlationId,
      severity: 'MEDIUM',
      metadata: {
        startDate: input.startDate.toISOString(),
        endDate: input.endDate.toISOString(),
        integrityHash: stableId('sha256', seed),
      },
    });

    const [created] = await db
      .select()
      .from(s.accountingPeriods)
      .where(
        and(
          eq(s.accountingPeriods.companyId, input.companyId),
          eq(s.accountingPeriods.startDate, input.startDate),
          eq(s.accountingPeriods.endDate, input.endDate),
        ) as any,
      )
      .limit(1);

    return {
      id: created.id,
      companyId: created.companyId,
      startDate: new Date(created.startDate as any),
      endDate: new Date(created.endDate as any),
    };
  }

  async softClosePeriod(input: {
    companyId: string;
    periodId: string;
    actorId: string;
    correlationId: string;
    reason?: string | null;
  }): Promise<void> {
    await this.periodLocks.transitionPeriod({
      companyId: input.companyId,
      periodId: input.periodId,
      nextState: 'SOFT_CLOSED',
      actorId: input.actorId,
      correlationId: input.correlationId,
      reason: input.reason ?? null,
    });
  }

  async hardLockPeriod(input: {
    companyId: string;
    periodId: string;
    actorId: string;
    correlationId: string;
    reason?: string | null;
  }): Promise<void> {
    await this.periodLocks.transitionPeriod({
      companyId: input.companyId,
      periodId: input.periodId,
      nextState: 'HARD_LOCKED',
      actorId: input.actorId,
      correlationId: input.correlationId,
      reason: input.reason ?? null,
    });
  }

  async reopenPeriod(input: {
    companyId: string;
    periodId: string;
    actorId: string;
    correlationId: string;
    reason?: string | null;
  }): Promise<void> {
    await this.periodLocks.transitionPeriod({
      companyId: input.companyId,
      periodId: input.periodId,
      nextState: 'OPEN',
      actorId: input.actorId,
      correlationId: input.correlationId,
      reason: input.reason ?? null,
    });
  }
}
