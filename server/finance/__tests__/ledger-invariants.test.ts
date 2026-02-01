import { describe, it, expect } from 'vitest';

import {
  LedgerTransaction,
  assertBalanced,
  assertCurrencyIsolation,
  LedgerInvariantError,
} from '../ledger-invariants.js';

describe('ledger invariants', () => {
  it('enforces balanced debits/credits', () => {
    const txn: LedgerTransaction = {
      companyId: 'c1',
      transactionId: 't1',
      transactionNumber: 'JE-1',
      date: new Date('2020-01-01T00:00:00.000Z'),
      type: 'journal_entry',
      description: null,
      referenceNumber: null,
      createdBy: 'u1',
      idempotencyKey: 'k1',
      currency: 'USD',
      lines: [
        { companyId: 'c1', transactionId: 't1', lineId: 'l1', accountId: 'a1', side: 'DEBIT', amount: '10.00', currency: 'USD' },
        { companyId: 'c1', transactionId: 't1', lineId: 'l2', accountId: 'a2', side: 'CREDIT', amount: '9.00', currency: 'USD' },
      ],
    };

    expect(() => assertBalanced(txn)).toThrowError(LedgerInvariantError);
  });

  it('enforces currency isolation', () => {
    const txn: LedgerTransaction = {
      companyId: 'c1',
      transactionId: 't1',
      transactionNumber: 'JE-2',
      date: new Date('2020-01-01T00:00:00.000Z'),
      type: 'journal_entry',
      description: null,
      referenceNumber: null,
      createdBy: 'u1',
      idempotencyKey: 'k2',
      currency: 'USD',
      lines: [
        { companyId: 'c1', transactionId: 't1', lineId: 'l1', accountId: 'a1', side: 'DEBIT', amount: '10.00', currency: 'USD' },
        { companyId: 'c1', transactionId: 't1', lineId: 'l2', accountId: 'a2', side: 'CREDIT', amount: '10.00', currency: 'EUR' },
      ],
    };

    expect(() => assertCurrencyIsolation(txn)).toThrowError(LedgerInvariantError);
  });
});
