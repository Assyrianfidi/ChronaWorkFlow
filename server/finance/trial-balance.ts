import { LedgerStore, DrizzleLedgerStore } from './ledger-engine.js';
import { parseMoneyToCents, stableHash } from './ledger-invariants.js';

export type TrialBalanceRow = {
  accountId: string;
  currency: string;
  openingCents: bigint;
  activityCents: bigint;
  closingCents: bigint;
};

export type TrialBalance = {
  companyId: string;
  from: Date;
  to: Date;
  rows: TrialBalanceRow[];
  integrityHash: string;
};

function centsToMoney(cents: bigint): string {
  const neg = cents < 0n;
  const abs = neg ? -cents : cents;
  const whole = abs / 100n;
  const frac = (abs % 100n).toString().padStart(2, '0');
  return `${neg ? '-' : ''}${whole.toString()}.${frac}`;
}

function canonicalTrialBalance(tb: TrialBalance): string {
  return JSON.stringify({
    companyId: tb.companyId,
    from: tb.from.toISOString(),
    to: tb.to.toISOString(),
    rows: tb.rows.map((r) => ({
      accountId: r.accountId,
      currency: r.currency,
      opening: centsToMoney(r.openingCents),
      activity: centsToMoney(r.activityCents),
      closing: centsToMoney(r.closingCents),
    })),
  });
}

export async function buildTrialBalance(input: {
  companyId: string;
  from: Date;
  to: Date;
  store?: LedgerStore;
}): Promise<TrialBalance> {
  const store = input.store ?? new DrizzleLedgerStore();

  const openingTxns = await store.listPostedTransactions(input.companyId, undefined, input.from);
  const periodTxns = await store.listPostedTransactions(input.companyId, input.from, input.to);

  const opening = new Map<string, bigint>();
  const activity = new Map<string, bigint>();
  const currencyByAccount = new Map<string, string>();

  const apply = (m: Map<string, bigint>, lines: any[]) => {
    for (const l of lines) {
      const accountId = String(l.accountId);
      const debit = parseMoneyToCents((l.debit ?? '0').toString());
      const credit = parseMoneyToCents((l.credit ?? '0').toString());
      const delta = debit - credit;
      m.set(accountId, (m.get(accountId) ?? 0n) + delta);
      // NOTE: Schema transaction_lines has no currency; we treat tenant currency as implicit (USD default).
      currencyByAccount.set(accountId, 'USD');
    }
  };

  for (const t of openingTxns) apply(opening, t.lines);
  for (const t of periodTxns) apply(activity, t.lines);

  const accountIds = new Set<string>([...opening.keys(), ...activity.keys()]);
  const rows: TrialBalanceRow[] = [];

  for (const accountId of Array.from(accountIds).sort()) {
    const currency = currencyByAccount.get(accountId) ?? 'USD';
    const openingCents = opening.get(accountId) ?? 0n;
    const activityCents = activity.get(accountId) ?? 0n;
    const closingCents = openingCents + activityCents;

    rows.push({ accountId, currency, openingCents, activityCents, closingCents });
  }

  const tb: TrialBalance = {
    companyId: input.companyId,
    from: input.from,
    to: input.to,
    rows,
    integrityHash: stableHash(canonicalTrialBalance({ companyId: input.companyId, from: input.from, to: input.to, rows, integrityHash: '' } as any)),
  };

  // Recompute using final structure
  tb.integrityHash = stableHash(canonicalTrialBalance(tb));

  return tb;
}
