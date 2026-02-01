import { LedgerInvariantError, parseMoneyToCents } from './ledger-invariants.js';
import { LedgerStore } from './ledger-engine.js';

export type ReconciliationIssue = {
  code: 'DUPLICATE_TRANSACTION_NUMBER' | 'PARTIAL_WRITE' | 'UNBALANCED_POSTED';
  transactionNumber?: string;
  transactionId?: string;
  details?: Record<string, unknown>;
};

export type ReconciliationReport = {
  companyId: string;
  from?: Date;
  to?: Date;
  issues: ReconciliationIssue[];
};

export async function reconcilePeriod(input: {
  companyId: string;
  store: LedgerStore;
  from?: Date;
  to?: Date;
}): Promise<ReconciliationReport> {
  const rows = await input.store.listPostedTransactions(input.companyId, input.from, input.to);
  const issues: ReconciliationIssue[] = [];

  const seenNumbers = new Map<string, string>();

  for (const r of rows) {
    const t = r.transaction;
    const num = t.transactionNumber as string;

    const prior = seenNumbers.get(num);
    if (prior && prior !== t.id) {
      issues.push({
        code: 'DUPLICATE_TRANSACTION_NUMBER',
        transactionNumber: num,
        details: { firstId: prior, secondId: t.id },
      });
    } else {
      seenNumbers.set(num, t.id);
    }

    if (!Array.isArray(r.lines) || r.lines.length === 0) {
      issues.push({ code: 'PARTIAL_WRITE', transactionId: t.id, transactionNumber: num });
      continue;
    }

    let debits = 0n;
    let credits = 0n;
    for (const l of r.lines) {
      debits += parseMoneyToCents(l.debit);
      credits += parseMoneyToCents(l.credit);
    }

    if (debits !== credits) {
      issues.push({
        code: 'UNBALANCED_POSTED',
        transactionId: t.id,
        transactionNumber: num,
        details: { debits: debits.toString(), credits: credits.toString() },
      });
    }
  }

  if (issues.length > 0) {
    throw new LedgerInvariantError('REPLAY_MISMATCH', 'Reconciliation failed', { issues });
  }

  return { companyId: input.companyId, from: input.from, to: input.to, issues };
}
