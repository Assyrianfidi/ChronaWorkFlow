import { LedgerInvariantError, LedgerTransaction, parseMoneyToCents, stableHash } from './ledger-invariants.js';
import { LedgerStore } from './ledger-engine.js';

export type ReplayBalances = {
  balancesCentsByAccountId: Map<string, bigint>;
  fingerprint: string;
};

export function computeBalancesFromLedgerTransactions(transactions: LedgerTransaction[]): ReplayBalances {
  const balances = new Map<string, bigint>();

  for (const txn of transactions) {
    for (const line of txn.lines) {
      const cents = parseMoneyToCents(line.amount);
      const delta = line.side === 'DEBIT' ? cents : -cents;
      balances.set(line.accountId, (balances.get(line.accountId) ?? 0n) + delta);
    }
  }

  const canonical = Array.from(balances.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([accountId, cents]) => `${accountId}:${cents.toString()}`)
    .join('|');

  return { balancesCentsByAccountId: balances, fingerprint: stableHash(canonical) };
}

export async function replayLedger(input: {
  companyId: string;
  store: LedgerStore;
  from?: Date;
  to?: Date;
  expectedFingerprint?: string;
}): Promise<ReplayBalances> {
  const rows = await input.store.listPostedTransactions(input.companyId, input.from, input.to);

  const txns: LedgerTransaction[] = rows.map((r) => {
    const t = r.transaction;
    const lines = r.lines.flatMap((l: any) => {
      const out: any[] = [];
      const debit = parseMoneyToCents(l.debit);
      const credit = parseMoneyToCents(l.credit);

      if (debit > 0n) {
        out.push({
          companyId: t.companyId,
          transactionId: t.id,
          lineId: l.id,
          accountId: l.accountId,
          side: 'DEBIT',
          amount: l.debit,
          currency: 'USD',
          description: l.description ?? null,
        });
      }

      if (credit > 0n) {
        out.push({
          companyId: t.companyId,
          transactionId: t.id,
          lineId: l.id,
          accountId: l.accountId,
          side: 'CREDIT',
          amount: l.credit,
          currency: 'USD',
          description: l.description ?? null,
        });
      }

      return out;
    });

    return {
      companyId: t.companyId,
      transactionId: t.id,
      transactionNumber: t.transactionNumber,
      date: new Date(t.date as any),
      type: t.type,
      description: t.description ?? null,
      referenceNumber: t.referenceNumber ?? null,
      createdBy: t.createdBy,
      idempotencyKey: 'replay',
      currency: 'USD',
      lines,
    };
  });

  const computed = computeBalancesFromLedgerTransactions(txns);

  if (typeof input.expectedFingerprint === 'string' && input.expectedFingerprint.length > 0) {
    if (computed.fingerprint !== input.expectedFingerprint) {
      throw new LedgerInvariantError('REPLAY_MISMATCH', 'Replay fingerprint mismatch', {
        expected: input.expectedFingerprint,
        actual: computed.fingerprint,
      });
    }
  }

  return computed;
}
