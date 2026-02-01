import { describe, expect, it, vi } from 'vitest';

import { MemoryPeriodLocks, PeriodLockViolationError } from '../period-locks.js';
import { LedgerEngine } from '../ledger-engine.js';
import { stableId } from '../ledger-invariants.js';
import { buildTrialBalance } from '../trial-balance.js';
import { generateBalanceSheet, generateCashFlowDirect, generateIncomeStatement } from '../financial-statements.js';

import { TaxEngine } from '../tax/tax-engine.js';
import { buildTaxExportEnvelope } from '../tax/tax-export.js';
import { ExportEngine } from '../exports/export-engine.js';
import { TaxAttestationService } from '../tax/tax-attestation.js';

import { AccountantAccessService } from '../../access/accountant-access.js';

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
    return accountIds.map((id) => ({
      accountId: id,
      companyId,
      type: id === 'rev' ? 'revenue' : id === 'exp' ? 'expense' : id === 'tax_pay' ? 'liability' : 'asset',
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

describe('STEP 15: tax + external reporting + standardized exports', () => {
  it('blocks tax export for non-finalized periods (fail-closed)', async () => {
    const store = new MemoryLedgerStore();
    const locks = new MemoryPeriodLocks();

    const engine = new TaxEngine(locks, store as any);

    const companyId = 'c1';
    const from = new Date('2026-01-01T00:00:00.000Z');
    const to = new Date('2026-01-31T00:00:00.000Z');

    // OPEN by default (no setDateState)
    await expect(
      engine.exportTaxSummary({
        actorId: 'u1',
        correlationId: 'corr',
        config: {
          companyId,
          periodId: 'p1',
          period: { from, to },
          jurisdictions: [
            { jurisdictionId: 'US-CA', name: 'California', taxSystem: 'SALES_TAX', currency: 'USD', taxPayableAccountIds: ['tax_pay'] },
          ],
        },
      }),
    ).rejects.toThrow(/finalized period|defined accounting period/i);
  });

  it('produces deterministic tax export + envelope integrity hash from replay', async () => {
    process.env.DETERMINISTIC_TEST_IDS = 'true';

    const store = new MemoryLedgerStore();
    const locks = new MemoryPeriodLocks();

    const companyId = 'c1';
    const from = new Date('2026-01-01T00:00:00.000Z');
    const to = new Date('2026-01-31T00:00:00.000Z');

    locks.setDateState({ companyId, date: to, periodId: 'p1', state: 'SOFT_CLOSED' });

    const ledger = new LedgerEngine(store as any, locks);

    const txnNumber = 'T-TAX';
    const transactionId = stableId('txn', `${companyId}:${txnNumber}:k`);

    // Post activity against the tax payable account (liability). Credit increases liability.
    await ledger.post({
      companyId,
      transactionId,
      transactionNumber: txnNumber,
      date: new Date('2026-01-10T00:00:00.000Z'),
      type: 'journal_entry',
      description: null,
      referenceNumber: null,
      createdBy: 'u1',
      idempotencyKey: 'k',
      currency: 'USD',
      reversalOfTransactionId: null,
      lines: [
        { companyId, transactionId, lineId: stableId('line', '1'), accountId: 'cash', side: 'DEBIT', amount: '10.00', currency: 'USD' },
        { companyId, transactionId, lineId: stableId('line', '2'), accountId: 'tax_pay', side: 'CREDIT', amount: '10.00', currency: 'USD' },
      ],
    } as any);

    const engine = new TaxEngine(locks, store as any);

    const export1 = await engine.exportTaxSummary({
      actorId: 'u1',
      correlationId: 'corr1',
      config: {
        companyId,
        periodId: 'p1',
        period: { from, to },
        jurisdictions: [
          { jurisdictionId: 'US-CA', name: 'California', taxSystem: 'SALES_TAX', currency: 'USD', taxPayableAccountIds: ['tax_pay'] },
        ],
      },
    });

    const export2 = await engine.exportTaxSummary({
      actorId: 'u1',
      correlationId: 'corr2',
      config: {
        companyId,
        periodId: 'p1',
        period: { from, to },
        jurisdictions: [
          { jurisdictionId: 'US-CA', name: 'California', taxSystem: 'SALES_TAX', currency: 'USD', taxPayableAccountIds: ['tax_pay'] },
        ],
      },
    });

    expect(export1.integrityHash).toBe(export2.integrityHash);

    const envelope = buildTaxExportEnvelope(export1);
    expect(envelope.integrityHash).toBe(export1.integrityHash);
  });

  it('exports standardized formats from finalized envelopes and blocks DRAFT export on HARD_LOCKED', async () => {
    const locks = new MemoryPeriodLocks();
    const exp = new ExportEngine(locks);

    const companyId = 'c1';
    const asOf = new Date('2026-01-31T00:00:00.000Z');
    locks.setDateState({ companyId, date: asOf, periodId: 'p1', state: 'HARD_LOCKED' });

    const envelope = {
      kind: 'INCOME_STATEMENT',
      version: 1,
      companyId,
      period: { asOf: asOf.toISOString() },
      integrityHash: 'hash_income',
      payload: { rows: [{ a: '1' }], columns: ['a'] },
    };

    await expect(
      exp.exportFinalizedReport({
        envelope,
        actorId: 'u1',
        format: 'JSON',
        exportMode: 'DRAFT',
        correlationId: 'corr',
      }),
    ).rejects.toThrow(/Draft exports are forbidden/i);

    const ok = await exp.exportFinalizedReport({
      envelope,
      actorId: 'u1',
      format: 'JSON',
      exportMode: 'FINAL',
      correlationId: 'corr2',
    });

    expect(ok.integrityHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('enforces tenant isolation through replay-derived engines', async () => {
    const store = new MemoryLedgerStore();
    const locks = new MemoryPeriodLocks();
    const ledger = new LedgerEngine(store as any, locks);

    const companyA = 'cA';
    const companyB = 'cB';
    const date = new Date('2026-01-15T00:00:00.000Z');

    const txnNumber = 'T1';
    const transactionId = stableId('txn', `${companyA}:${txnNumber}:k`);

    await ledger.post({
      companyId: companyA,
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
        { companyId: companyA, transactionId, lineId: stableId('line', '1'), accountId: 'cash', side: 'DEBIT', amount: '10.00', currency: 'USD' },
        { companyId: companyA, transactionId, lineId: stableId('line', '2'), accountId: 'rev', side: 'CREDIT', amount: '10.00', currency: 'USD', allowNegative: true },
      ],
    } as any);

    const tbB = await buildTrialBalance({ companyId: companyB, from: date, to: date, store: store as any });
    expect(tbB.rows.length).toBe(0);
  });

  it('requires finance:attest for tax attestation and emits audit', async () => {
    const audit = (await import('../../compliance/immutable-audit-log.js')).getImmutableAuditLogger();
    const spy = vi.spyOn(audit, 'logSecurityEvent');

    const svc = new TaxAttestationService();

    await expect(
      svc.attest({
        companyId: 'c1',
        actorId: 'u1',
        correlationId: 'corr',
        permissionAsserted: false,
        period: { periodId: 'p1', from: new Date('2026-01-01T00:00:00.000Z'), to: new Date('2026-01-31T00:00:00.000Z') },
        hashes: {
          trialBalanceHash: 'tb',
          incomeStatementHash: 'is',
          balanceSheetHash: 'bs',
          cashFlowHash: 'cf',
          taxExportHash: 'tx',
        },
      }),
    ).rejects.toThrow(/finance:attest/i);

    await svc.attest({
      companyId: 'c1',
      actorId: 'u1',
      correlationId: 'corr2',
      permissionAsserted: true,
      period: { periodId: 'p1', from: new Date('2026-01-01T00:00:00.000Z'), to: new Date('2026-01-31T00:00:00.000Z') },
      hashes: {
        trialBalanceHash: 'tb',
        incomeStatementHash: 'is',
        balanceSheetHash: 'bs',
        cashFlowHash: 'cf',
        taxExportHash: 'tx',
      },
    });

    expect(spy).toHaveBeenCalled();
  });

  it('time-scoped external access token is read-only and audited', async () => {
    process.env.EXTERNAL_REPORTING_TOKEN_SECRET = 'test-secret';

    const audit = (await import('../../compliance/immutable-audit-log.js')).getImmutableAuditLogger();
    const spy = vi.spyOn(audit, 'logSecurityEvent');

    const svc = new AccountantAccessService();

    const token = await svc.grantAccess({
      actorId: 'u_admin',
      correlationId: 'corr',
      subject: { externalId: 'acct-1' },
      ttlSeconds: 60,
      scope: {
        companyId: 'c1',
        from: new Date('2026-01-01T00:00:00.000Z'),
        to: new Date('2026-01-31T00:00:00.000Z'),
        allowed: ['REPORTS_READ'],
      },
    });

    const payload = await svc.verifyToken({ token, correlationId: 'corr2' });
    expect(payload.companyId).toBe('c1');
    expect(payload.scope).toEqual(['REPORTS_READ']);
    expect(payload.validFrom).toBeTypeOf('string');
    expect(payload.validTo).toBeTypeOf('string');

    expect(spy).toHaveBeenCalled();
  });

  it('period locks still prevent ledger mutation (no bypass via external access)', async () => {
    const store = new MemoryLedgerStore();
    const locks = new MemoryPeriodLocks();
    const ledger = new LedgerEngine(store as any, locks);

    const companyId = 'c1';
    const lockedDate = new Date('2026-01-31T00:00:00.000Z');
    locks.setDateState({ companyId, date: lockedDate, periodId: 'p1', state: 'HARD_LOCKED' });

    const txnNumber = 'T-LOCKED';
    const transactionId = stableId('txn', `${companyId}:${txnNumber}:k`);

    await expect(
      ledger.post({
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
          { companyId, transactionId, lineId: stableId('line', '1'), accountId: 'cash', side: 'DEBIT', amount: '1.00', currency: 'USD' },
          { companyId, transactionId, lineId: stableId('line', '2'), accountId: 'rev', side: 'CREDIT', amount: '1.00', currency: 'USD', allowNegative: true },
        ],
      } as any),
    ).rejects.toBeInstanceOf(PeriodLockViolationError);
  });

  it('statements still derive from replay (sanity) for export compatibility', async () => {
    const store = new MemoryLedgerStore();
    const locks = new MemoryPeriodLocks();
    const ledger = new LedgerEngine(store as any, locks);

    const companyId = 'c1';
    const from = new Date('2026-01-01T00:00:00.000Z');
    const to = new Date('2026-01-31T00:00:00.000Z');

    const txnNumber = 'T-REV';
    const transactionId = stableId('txn', `${companyId}:${txnNumber}:k`);

    await ledger.post({
      companyId,
      transactionId,
      transactionNumber: txnNumber,
      date: new Date('2026-01-10T00:00:00.000Z'),
      type: 'journal_entry',
      description: null,
      referenceNumber: null,
      createdBy: 'u1',
      idempotencyKey: 'k',
      currency: 'USD',
      reversalOfTransactionId: null,
      lines: [
        { companyId, transactionId, lineId: stableId('line', '1'), accountId: 'cash', side: 'DEBIT', amount: '10.00', currency: 'USD' },
        { companyId, transactionId, lineId: stableId('line', '2'), accountId: 'rev', side: 'CREDIT', amount: '10.00', currency: 'USD', allowNegative: true },
      ],
    } as any);

    const income = await generateIncomeStatement({ companyId, from, to, actorId: 'u1', correlationId: 'c1', store: store as any });
    const bs = await generateBalanceSheet({ companyId, asOf: to, actorId: 'u1', correlationId: 'c2', store: store as any });
    const cf = await generateCashFlowDirect({ companyId, from, to, actorId: 'u1', correlationId: 'c3', store: store as any, cashAccountIds: ['cash'] });

    expect(income.integrityHash).toMatch(/^[a-f0-9]{64}$/);
    expect(bs.integrityHash).toMatch(/^[a-f0-9]{64}$/);
    expect(cf.integrityHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
