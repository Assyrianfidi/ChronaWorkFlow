import { and, desc, eq, sql } from 'drizzle-orm';

import { db } from '../db.js';
import * as s from '../../shared/schema.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { LedgerInvariantError, stableId } from './ledger-invariants.js';

export type PeriodState = 'OPEN' | 'SOFT_CLOSED' | 'HARD_LOCKED';

export class PeriodLockViolationError extends LedgerInvariantError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('IMMUTABILITY_VIOLATION', message, details);
  }
}

export interface PeriodLocks {
  assertCanPost(input: {
    companyId: string;
    date: Date;
    actorId: string;
    correlationId: string;
    transactionNumber: string;
  }): Promise<void>;

  getPeriodStateForDate(input: { companyId: string; date: Date }): Promise<{
    periodId: string | null;
    state: PeriodState;
  }>;

  transitionPeriod(input: {
    companyId: string;
    periodId: string;
    nextState: PeriodState;
    actorId: string;
    correlationId: string;
    reason?: string | null;
  }): Promise<void>;
}

export class MemoryPeriodLocks implements PeriodLocks {
  private statesByPeriodId = new Map<string, PeriodState>();
  private periodByDateKey = new Map<string, { periodId: string; state: PeriodState }>();

  private key(companyId: string, date: Date): string {
    return `${companyId}:${date.toISOString().slice(0, 10)}`;
  }

  setDateState(input: { companyId: string; date: Date; periodId: string; state: PeriodState }) {
    this.periodByDateKey.set(this.key(input.companyId, input.date), { periodId: input.periodId, state: input.state });
    this.statesByPeriodId.set(input.periodId, input.state);
  }

  async getPeriodStateForDate(input: { companyId: string; date: Date }): Promise<{ periodId: string | null; state: PeriodState }> {
    const hit = this.periodByDateKey.get(this.key(input.companyId, input.date));
    if (!hit) return { periodId: null, state: 'OPEN' };
    return { periodId: hit.periodId, state: hit.state };
  }

  async assertCanPost(input: {
    companyId: string;
    date: Date;
    actorId: string;
    correlationId: string;
    transactionNumber: string;
  }): Promise<void> {
    const status = await this.getPeriodStateForDate({ companyId: input.companyId, date: input.date });
    if (status.periodId && status.state === 'HARD_LOCKED') {
      throw new PeriodLockViolationError('Posting is forbidden in HARD_LOCKED accounting periods', {
        companyId: input.companyId,
        periodId: status.periodId,
        date: input.date.toISOString(),
      });
    }
  }

  async transitionPeriod(input: {
    companyId: string;
    periodId: string;
    nextState: PeriodState;
    actorId: string;
    correlationId: string;
    reason?: string | null;
  }): Promise<void> {
    const current = this.statesByPeriodId.get(input.periodId) ?? 'OPEN';
    if (current === 'HARD_LOCKED') {
      throw new PeriodLockViolationError('HARD_LOCKED periods are irreversible', {
        periodId: input.periodId,
        attemptedNextState: input.nextState,
      });
    }

    if (input.nextState === 'OPEN' && current !== 'SOFT_CLOSED') {
      throw new PeriodLockViolationError('Only SOFT_CLOSED periods may be reopened', {
        periodId: input.periodId,
        currentState: current,
      });
    }

    this.statesByPeriodId.set(input.periodId, input.nextState);
  }
}

function normalizeAction(action: string): string {
  return action.trim().toUpperCase();
}

function deriveStateFromAction(actionRaw: string | null | undefined): PeriodState {
  const action = normalizeAction(String(actionRaw ?? ''));

  if (action === 'HARD_LOCK' || action === 'HARD_LOCKED' || action === 'PERIOD_HARD_LOCK') return 'HARD_LOCKED';
  if (action === 'SOFT_CLOSE' || action === 'SOFT_CLOSED' || action === 'CLOSE' || action === 'CLOSED' || action === 'PERIOD_SOFT_CLOSE') {
    return 'SOFT_CLOSED';
  }
  if (action === 'REOPEN' || action === 'OPEN' || action === 'PERIOD_REOPEN') return 'OPEN';

  return 'OPEN';
}

function toAction(nextState: PeriodState): string {
  if (nextState === 'HARD_LOCKED') return 'PERIOD_HARD_LOCK';
  if (nextState === 'SOFT_CLOSED') return 'PERIOD_SOFT_CLOSE';
  return 'PERIOD_REOPEN';
}

function isDeterministic(): boolean {
  return process.env.DETERMINISTIC_TEST_IDS === 'true';
}

function getAudit() {
  return getImmutableAuditLogger();
}

export class DrizzlePeriodLocks implements PeriodLocks {
  async getPeriodStateForDate(input: { companyId: string; date: Date }) {
    const [period] = await db
      .select({ id: s.accountingPeriods.id })
      .from(s.accountingPeriods)
      .where(
        and(
          eq(s.accountingPeriods.companyId, input.companyId),
          sql`${s.accountingPeriods.startDate} <= ${input.date}`,
          sql`${s.accountingPeriods.endDate} >= ${input.date}`,
        ) as any,
      )
      .orderBy(desc(s.accountingPeriods.startDate))
      .limit(1);

    if (!period) {
      return { periodId: null, state: 'OPEN' as const };
    }

    const [lastLock] = await db
      .select({ action: s.accountingPeriodLocks.action })
      .from(s.accountingPeriodLocks)
      .where(and(eq(s.accountingPeriodLocks.companyId, input.companyId), eq(s.accountingPeriodLocks.periodId, period.id)))
      .orderBy(desc(s.accountingPeriodLocks.createdAt))
      .limit(1);

    return { periodId: period.id, state: deriveStateFromAction(lastLock?.action) };
  }

  async assertCanPost(input: {
    companyId: string;
    date: Date;
    actorId: string;
    correlationId: string;
    transactionNumber: string;
  }): Promise<void> {
    const status = await this.getPeriodStateForDate({ companyId: input.companyId, date: input.date });

    if (status.periodId && status.state === 'HARD_LOCKED') {
      getAudit().logSecurityEvent({
        tenantId: input.companyId,
        actorId: input.actorId,
        action: 'PERIOD_POST_DENIED_HARD_LOCK',
        resourceType: 'ACCOUNTING_PERIOD',
        resourceId: status.periodId,
        outcome: 'DENIED',
        correlationId: input.correlationId,
        severity: 'HIGH',
        metadata: {
          periodId: status.periodId,
          date: input.date.toISOString(),
          transactionNumber: input.transactionNumber,
        },
      });

      throw new PeriodLockViolationError('Posting is forbidden in HARD_LOCKED accounting periods', {
        companyId: input.companyId,
        periodId: status.periodId,
        date: input.date.toISOString(),
      });
    }
  }

  async transitionPeriod(input: {
    companyId: string;
    periodId: string;
    nextState: PeriodState;
    actorId: string;
    correlationId: string;
    reason?: string | null;
  }): Promise<void> {
    const [period] = await db
      .select({ id: s.accountingPeriods.id, companyId: s.accountingPeriods.companyId })
      .from(s.accountingPeriods)
      .where(and(eq(s.accountingPeriods.id, input.periodId), eq(s.accountingPeriods.companyId, input.companyId)))
      .limit(1);

    if (!period) {
      throw new LedgerInvariantError('MISSING_REQUIRED_FIELDS', 'Accounting period not found', { periodId: input.periodId });
    }

    const [lastLock] = await db
      .select({ action: s.accountingPeriodLocks.action })
      .from(s.accountingPeriodLocks)
      .where(and(eq(s.accountingPeriodLocks.companyId, input.companyId), eq(s.accountingPeriodLocks.periodId, input.periodId)))
      .orderBy(desc(s.accountingPeriodLocks.createdAt))
      .limit(1);

    const currentState = deriveStateFromAction(lastLock?.action);

    if (currentState === 'HARD_LOCKED') {
      throw new PeriodLockViolationError('HARD_LOCKED periods are irreversible', {
        periodId: input.periodId,
        attemptedNextState: input.nextState,
      });
    }

    if (input.nextState === 'OPEN' && currentState !== 'SOFT_CLOSED') {
      throw new PeriodLockViolationError('Only SOFT_CLOSED periods may be reopened', {
        periodId: input.periodId,
        currentState,
      });
    }

    const action = toAction(input.nextState);
    const seed = `${input.companyId}:${input.periodId}:${action}:${input.correlationId}`;
    const lockId = isDeterministic() ? stableId('period_lock', seed) : undefined;

    await db.insert(s.accountingPeriodLocks).values({
      id: lockId,
      companyId: input.companyId,
      periodId: input.periodId,
      action,
      reason: input.reason ?? null,
      actorUserId: input.actorId,
      createdAt: new Date(),
    } as any);

    getAudit().logSecurityEvent({
      tenantId: input.companyId,
      actorId: input.actorId,
      action: 'PERIOD_STATE_TRANSITION',
      resourceType: 'ACCOUNTING_PERIOD',
      resourceId: input.periodId,
      outcome: 'ALLOWED',
      correlationId: input.correlationId,
      severity: 'MEDIUM',
      metadata: {
        periodId: input.periodId,
        from: currentState,
        to: input.nextState,
        reason: input.reason ?? null,
        integrityHash: stableId('sha256', seed),
      },
    });
  }
}
