import { describe, it, expect, beforeAll } from 'vitest';

import { LedgerEngine } from '../ledger-engine.js';
import { LedgerInvariantError, stableId } from '../ledger-invariants.js';
import { replayLedger } from '../financial-replay.js';
import { MemoryPeriodLocks } from '../period-locks.js';

class MemoryStore {
  transactions: any[] = [];
  lines: any[] = [];
  accounts: Map<string, any> = new Map();

  async getAccountSnapshots(companyId: string, accountIds: string[]) {
    return accountIds.map((id) => ({
      accountId: id,
      companyId,
      type: id === 'a2' ? 'revenue' : 'asset',
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
    return {
      transactionId: txn.id,
      companyId: txn.companyId,
      transactionNumber: txn.transactionNumber,
      date: txn.date,
      type: txn.type,
      referenceNumber: txn.referenceNumber,
      createdBy: txn.createdBy,
      lines: lines.flatMap((l) => {
        const out: any[] = [];
        if (l.debit !== '0') out.push({ companyId, transactionId: txn.id, lineId: l.id, accountId: l.accountId, side: 'DEBIT', amount: l.debit, currency: 'USD' });
        if (l.credit !== '0') out.push({ companyId, transactionId: txn.id, lineId: l.id, accountId: l.accountId, side: 'CREDIT', amount: l.credit, currency: 'USD' });
        return out;
      }),
    };
  }

  async commitAppendOnly(txn: any) {
    this.transactions.push({
      id: txn.transactionId,
      companyId: txn.companyId,
      transactionNumber: txn.transactionNumber,
      date: txn.date,
      type: txn.type,
      referenceNumber: txn.referenceNumber ?? null,
      createdBy: txn.createdBy,
      isVoid: false,
      createdAt: txn.date,
    });

    for (const l of txn.lines) {
      this.lines.push({
        id: l.lineId,
        transactionId: txn.transactionId,
        accountId: l.accountId,
        debit: l.side === 'DEBIT' ? l.amount : '0',
        credit: l.side === 'CREDIT' ? l.amount : '0',
        description: l.description ?? null,
      });
    }
  }

  async listPostedTransactions(companyId: string) {
    const txns = this.transactions.filter((t) => t.companyId === companyId);
    return txns.map((t) => ({ transaction: t, lines: this.lines.filter((l) => l.transactionId === t.id) }));
  }
}

describe('replay determinism', () => {
  beforeAll(() => {
    process.env.DETERMINISTIC_TEST_IDS = 'true';
  });

  it('replay fingerprint is stable in deterministic mode', async () => {
    const store = new MemoryStore();
    const engine = new LedgerEngine(store as any, new MemoryPeriodLocks());

    const txnId = stableId('txn', 'c1:JE-1:key');

    await engine.post({
      companyId: 'c1',
      transactionId: txnId,
      transactionNumber: 'JE-1',
      date: new Date('2020-01-01T00:00:00.000Z'),
      type: 'journal_entry',
      description: null,
      referenceNumber: null,
      createdBy: 'u1',
      idempotencyKey: 'key',
      currency: 'USD',
      lines: [
        { companyId: 'c1', transactionId: txnId, lineId: stableId('line', '1'), accountId: 'a1', side: 'DEBIT', amount: '10.00', currency: 'USD' },
        { companyId: 'c1', transactionId: txnId, lineId: stableId('line', '2'), accountId: 'a2', side: 'CREDIT', amount: '10.00', currency: 'USD' },
      ],
    });

    const r1 = await replayLedger({ companyId: 'c1', store: store as any });
    const r2 = await replayLedger({ companyId: 'c1', store: store as any });

    expect(r1.fingerprint).toBe(r2.fingerprint);

    await expect(replayLedger({ companyId: 'c1', store: store as any, expectedFingerprint: 'bad' })).rejects.toBeInstanceOf(
      LedgerInvariantError,
    );
  });
});
