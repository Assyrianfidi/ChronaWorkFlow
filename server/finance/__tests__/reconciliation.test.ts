import { describe, it, expect } from 'vitest';

import { reconcilePeriod } from '../reconciliation-engine.js';
import { LedgerInvariantError } from '../ledger-invariants.js';

class MemoryStore {
  constructor(private readonly rows: any[]) {}

  async listPostedTransactions() {
    return this.rows;
  }
}

describe('reconciliation', () => {
  it('detects partial writes (missing lines)', async () => {
    const store = new MemoryStore([
      { transaction: { id: 't1', companyId: 'c1', transactionNumber: 'JE-1', date: new Date(), type: 'journal_entry', isVoid: false }, lines: [] },
    ]);

    await expect(reconcilePeriod({ companyId: 'c1', store: store as any })).rejects.toBeInstanceOf(LedgerInvariantError);
  });

  it('detects duplicate transaction numbers', async () => {
    const store = new MemoryStore([
      { transaction: { id: 't1', companyId: 'c1', transactionNumber: 'JE-1', date: new Date(), type: 'journal_entry', isVoid: false }, lines: [{ id: 'l1', accountId: 'a1', debit: '1.00', credit: '1.00' }] },
      { transaction: { id: 't2', companyId: 'c1', transactionNumber: 'JE-1', date: new Date(), type: 'journal_entry', isVoid: false }, lines: [{ id: 'l2', accountId: 'a1', debit: '1.00', credit: '1.00' }] },
    ]);

    await expect(reconcilePeriod({ companyId: 'c1', store: store as any })).rejects.toBeInstanceOf(LedgerInvariantError);
  });
});
