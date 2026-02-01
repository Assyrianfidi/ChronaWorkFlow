import { describe, expect, it, vi } from 'vitest';

import { LedgerEngine } from '../ledger-engine.js';
import { LedgerInvariantError, stableId } from '../ledger-invariants.js';
import { MemoryPeriodLocks, PeriodLockViolationError } from '../period-locks.js';
import { RevenueRecognitionEngine } from '../revenue-recognition-engine.js';
import { MemoryRevenueScheduleStore } from '../revenue-schedules.js';
import { buildTrialBalance } from '../trial-balance.js';
import { generateBalanceSheet, generateIncomeStatement } from '../financial-statements.js';

class MemoryLedgerStore {
  transactions: any[] = [];
  lines: any[] = [];

  async commitAppendOnly(txn: any) {
    this.transactions.push({
      id: txn.transactionId,
      companyId: txn.companyId,
      transactionNumber: txn.transactionNumber,
      date: txn.date,
      type: txn.type,
      referenceNumber: txn.referenceNumber ?? null,
      createdBy: txn.createdBy,
      createdAt: new Date(),
      isVoid: false,
    });

    for (const line of txn.lines) {
      this.lines.push({
        id: line.lineId,
        transactionId: txn.transactionId,
        accountId: line.accountId,
        debit: line.side === 'DEBIT' ? line.amount : '0',
        credit: line.side === 'CREDIT' ? line.amount : '0',
        description: line.description ?? null,
        createdAt: new Date(),
      });
    }
  }

  async getAccountSnapshots(companyId: string, accountIds: string[]) {
    // Default all unknown accounts to asset; tests will use known IDs to set types.
    return accountIds.map((id) => ({
      accountId: id,
      companyId,
      type:
        id === 'rev' ? 'revenue' :
        id === 'exp' ? 'expense' :
        id === 'def' ? 'liability' :
        id === 'eq' ? 'equity' :
        'asset',
    }));
  }

  async getAccountBalancesCents(_companyId: string, accountIds: string[]) {
    const m = new Map<string, bigint>();
    for (const id of accountIds) m.set(id, 0n);
    return m;
  }

  async getPostedTransactionByNumber(companyId: string, transactionNumber: string) {
    const txn = this.transactions.find((t) => t.companyId === companyId && t.transactionNumber === transactionNumber);
    if (!txn) return null;

    const lines = this.lines.filter((l) => l.transactionId === txn.id);
    const mappedLines: any[] = [];
    for (const l of lines) {
      if (l.debit !== '0' && l.debit !== '0.00') {
        mappedLines.push({ companyId, transactionId: txn.id, lineId: l.id, accountId: l.accountId, side: 'DEBIT', amount: l.debit, currency: 'USD', description: l.description });
      }
      if (l.credit !== '0' && l.credit !== '0.00') {
        mappedLines.push({ companyId, transactionId: txn.id, lineId: l.id, accountId: l.accountId, side: 'CREDIT', amount: l.credit, currency: 'USD', description: l.description });
      }
    }

    return {
      transactionId: txn.id,
      companyId: txn.companyId,
      transactionNumber: txn.transactionNumber,
      date: txn.date,
      type: txn.type,
      referenceNumber: txn.referenceNumber,
      createdBy: txn.createdBy,
      lines: mappedLines,
    };
  }

  async listPostedTransactions(companyId: string, from?: Date, to?: Date) {
    const txns = this.transactions
      .filter((t) => t.companyId === companyId)
      .filter((t) => {
        const d = new Date(t.date);
        if (from && d.getTime() < from.getTime()) return false;
        if (to && d.getTime() > to.getTime()) return false;
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return txns.map((t) => ({ transaction: t, lines: this.lines.filter((l) => l.transactionId === t.id) }));
  }
}

describe('STEP 14: period close + revenue recognition + reporting', () => {
  it('blocks posting in HARD_LOCKED periods at the ledger boundary', async () => {
    const store = new MemoryLedgerStore();
    const locks = new MemoryPeriodLocks();
    const engine = new LedgerEngine(store as any, locks);

    const companyId = 'c1';
    const lockedDate = new Date('2026-01-01T00:00:00.000Z');
    locks.setDateState({ companyId, date: lockedDate, periodId: 'p1', state: 'HARD_LOCKED' });

    const txnNumber = 'T-LOCKED';
    const transactionId = stableId('txn', `${companyId}:${txnNumber}:k`);

    await expect(
      engine.post({
        companyId,
        transactionId,
        transactionNumber: txnNumber,
        date: lockedDate,
        type: 'journal_entry',
        description: null,
        referenceNumber: null,
        createdBy: 'u1',
        idempotencyKey: 'k',
        currency: 'USD',
        reversalOfTransactionId: null,
        lines: [
          { companyId, transactionId, lineId: stableId('line', '1'), accountId: 'a1', side: 'DEBIT', amount: '10.00', currency: 'USD' },
          { companyId, transactionId, lineId: stableId('line', '2'), accountId: 'rev', side: 'CREDIT', amount: '10.00', currency: 'USD', allowNegative: true },
        ],
      } as any),
    ).rejects.toBeInstanceOf(PeriodLockViolationError);
  });

  it('revenue recognition respects hard locks (via ledgerEngine.post)', async () => {
    const store = new MemoryLedgerStore();
    const locks = new MemoryPeriodLocks();
    const ledger = new LedgerEngine(store as any, locks);

    const schedules = new MemoryRevenueScheduleStore();
    const rr = new RevenueRecognitionEngine(schedules, ledger, locks);

    const companyId = 'c1';
    const periodEnd = new Date('2026-02-28T00:00:00.000Z');
    locks.setDateState({ companyId, date: periodEnd, periodId: 'p2', state: 'HARD_LOCKED' });

    const schedule = await rr.createSchedule({
      companyId,
      createdBy: 'u1',
      method: 'DEFERRED',
      scheduleType: 'STRAIGHT_LINE',
      currency: 'USD',
      totalAmount: '120.00',
      deferredRevenueAccountId: 'def',
      revenueAccountId: 'rev',
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: periodEnd,
      reference: { resourceType: 'INVOICE', resourceId: 'inv1' },
      memo: null,
      correlationId: 'corr',
    });

    await expect(
      rr.recognizeRevenueForWindow({
        companyId,
        scheduleId: schedule.scheduleId,
        from: new Date('2026-02-01T00:00:00.000Z'),
        to: periodEnd,
        actorId: 'u1',
        correlationId: 'corr2',
      }),
    ).rejects.toBeInstanceOf(PeriodLockViolationError);
  });

  it('deferred revenue is recognized over time and reporting derives from replay', async () => {
    process.env.DETERMINISTIC_TEST_IDS = 'true';

    const store = new MemoryLedgerStore();
    const locks = new MemoryPeriodLocks();
    const ledger = new LedgerEngine(store as any, locks);

    const schedules = new MemoryRevenueScheduleStore();
    const rr = new RevenueRecognitionEngine(schedules, ledger, locks);

    const companyId = 'c1';

    const schedule = await rr.createSchedule({
      companyId,
      createdBy: 'u1',
      method: 'DEFERRED',
      scheduleType: 'STRAIGHT_LINE',
      currency: 'USD',
      totalAmount: '120.00',
      deferredRevenueAccountId: 'def',
      revenueAccountId: 'rev',
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-01-31T00:00:00.000Z'),
      reference: { resourceType: 'INVOICE', resourceId: 'inv1' },
      memo: null,
      correlationId: 'corr',
    });

    const res = await rr.recognizeRevenueForWindow({
      companyId,
      scheduleId: schedule.scheduleId,
      from: new Date('2026-01-01T00:00:00.000Z'),
      to: new Date('2026-01-31T00:00:00.000Z'),
      actorId: 'u1',
      correlationId: 'corr3',
    });

    expect(res.status).toBe('POSTED');
    expect(res.postedTransactionNumbers.length).toBe(1);

    const tb = await buildTrialBalance({
      companyId,
      from: new Date('2026-01-01T00:00:00.000Z'),
      to: new Date('2026-01-31T00:00:00.000Z'),
      store: store as any,
    });

    expect(tb.integrityHash).toMatch(/^[a-f0-9]{64}$/);

    const income = await generateIncomeStatement({
      companyId,
      from: new Date('2026-01-01T00:00:00.000Z'),
      to: new Date('2026-01-31T00:00:00.000Z'),
      actorId: 'u1',
      correlationId: 'corr4',
      store: store as any,
    });

    expect(income.netIncomeCents).toBeGreaterThan(0n);

    const bs = await generateBalanceSheet({
      companyId,
      asOf: new Date('2026-01-31T00:00:00.000Z'),
      actorId: 'u1',
      correlationId: 'corr5',
      store: store as any,
    });

    expect(bs.balanced).toBe(true);
  });

  it('enforces tenant isolation in reporting inputs', async () => {
    const store = new MemoryLedgerStore();
    const locks = new MemoryPeriodLocks();
    const ledger = new LedgerEngine(store as any, locks);

    const companyIdA = 'cA';
    const companyIdB = 'cB';

    const date = new Date('2026-01-15T00:00:00.000Z');
    const txnNumber = 'T1';
    const transactionId = stableId('txn', `${companyIdA}:${txnNumber}:k`);

    await ledger.post({
      companyId: companyIdA,
      transactionId,
      transactionNumber: txnNumber,
      date,
      type: 'journal_entry',
      description: null,
      referenceNumber: null,
      createdBy: 'u1',
      idempotencyKey: 'k',
      currency: 'USD',
      reversalOfTransactionId: null,
      lines: [
        { companyId: companyIdA, transactionId, lineId: stableId('line', '1'), accountId: 'a1', side: 'DEBIT', amount: '10.00', currency: 'USD' },
        { companyId: companyIdA, transactionId, lineId: stableId('line', '2'), accountId: 'rev', side: 'CREDIT', amount: '10.00', currency: 'USD', allowNegative: true },
      ],
    } as any);

    const tb = await buildTrialBalance({ companyId: companyIdB, from: date, to: date, store: store as any });
    expect(tb.rows.length).toBe(0);
  });

  it('emits immutable audit events on sensitive actions', async () => {
    const audit = (await import('../../compliance/immutable-audit-log.js')).getImmutableAuditLogger();
    const spy = vi.spyOn(audit, 'logSecurityEvent');

    const store = new MemoryLedgerStore();
    const locks = new MemoryPeriodLocks();
    const ledger = new LedgerEngine(store as any, locks);

    const companyId = 'c1';
    const date = new Date('2026-01-15T00:00:00.000Z');
    const txnNumber = 'T-AUDIT';
    const transactionId = stableId('txn', `${companyId}:${txnNumber}:k`);

    await ledger.post({
      companyId,
      transactionId,
      transactionNumber: txnNumber,
      date,
      type: 'journal_entry',
      description: null,
      referenceNumber: null,
      createdBy: 'u1',
      idempotencyKey: 'k',
      currency: 'USD',
      reversalOfTransactionId: null,
      lines: [
        { companyId, transactionId, lineId: stableId('line', '1'), accountId: 'a1', side: 'DEBIT', amount: '10.00', currency: 'USD' },
        { companyId, transactionId, lineId: stableId('line', '2'), accountId: 'rev', side: 'CREDIT', amount: '10.00', currency: 'USD', allowNegative: true },
      ],
    } as any);

    expect(spy).toHaveBeenCalled();
  });
});
