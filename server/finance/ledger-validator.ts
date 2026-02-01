import {
  AccountSnapshot,
  LedgerEntry,
  LedgerInvariantError,
  LedgerTransaction,
  assertBalanced,
  assertCurrencyIsolation,
  assertNoForbiddenNegativeBalances,
  assertTenantIsolation,
  computeBalanceDeltaCents,
  parseMoneyToCents,
} from './ledger-invariants.js';

export type LedgerPostedTransactionSnapshot = {
  transactionId: string;
  companyId: string;
  transactionNumber: string;
  date: Date;
  type: string;
  referenceNumber?: string | null;
  createdBy: string;
  lines: LedgerEntry[];
};

export interface LedgerValidationStore {
  getAccountSnapshots(companyId: string, accountIds: string[]): Promise<AccountSnapshot[]>;
  getAccountBalancesCents(companyId: string, accountIds: string[]): Promise<Map<string, bigint>>;
  getPostedTransactionByNumber(companyId: string, transactionNumber: string): Promise<LedgerPostedTransactionSnapshot | null>;
}

function canonicalizeLines(lines: LedgerEntry[]): Array<Record<string, string>> {
  return [...lines]
    .map((l) => ({
      companyId: l.companyId,
      transactionId: l.transactionId,
      lineId: l.lineId,
      accountId: l.accountId,
      side: l.side,
      amount: l.amount,
      currency: l.currency,
      description: (l.description ?? '').toString(),
    }))
    .sort((a, b) => (a.accountId + a.side + a.amount + a.lineId).localeCompare(b.accountId + b.side + b.amount + b.lineId));
}

export function computeTransactionContentFingerprint(txn: LedgerTransaction): string {
  const payload = {
    companyId: txn.companyId,
    transactionId: txn.transactionId,
    transactionNumber: txn.transactionNumber,
    date: txn.date.toISOString(),
    type: txn.type,
    description: (txn.description ?? '').toString(),
    referenceNumber: (txn.referenceNumber ?? '').toString(),
    createdBy: txn.createdBy,
    currency: txn.currency,
    lines: canonicalizeLines(txn.lines),
  };
  return JSON.stringify(payload);
}

export async function validateLedgerTransaction(input: {
  txn: LedgerTransaction;
  store: LedgerValidationStore;
  enforceNoNegativeBalances: boolean;
}): Promise<{ debitsCents: bigint; creditsCents: bigint }> {
  const { txn } = input;

  if (!txn.transactionId || !txn.transactionNumber || !txn.idempotencyKey) {
    throw new LedgerInvariantError('MISSING_REQUIRED_FIELDS', 'transactionId, transactionNumber, and idempotencyKey are required');
  }

  assertTenantIsolation(txn);
  assertCurrencyIsolation(txn);
  const { debits, credits } = assertBalanced(txn);

  for (const l of txn.lines) {
    if (!l.accountId) {
      throw new LedgerInvariantError('MISSING_REQUIRED_FIELDS', 'accountId is required on every line', { lineId: l.lineId });
    }
    if (!l.lineId) {
      throw new LedgerInvariantError('MISSING_REQUIRED_FIELDS', 'lineId is required on every line');
    }
  }

  const accountIds = Array.from(new Set(txn.lines.map((l) => l.accountId)));
  const [snapshots, priorBalances] = await Promise.all([
    input.store.getAccountSnapshots(txn.companyId, accountIds),
    input.store.getAccountBalancesCents(txn.companyId, accountIds),
  ]);

  const accountsById = new Map<string, AccountSnapshot>();
  for (const a of snapshots) {
    accountsById.set(a.accountId, a);
  }

  if (input.enforceNoNegativeBalances) {
    assertNoForbiddenNegativeBalances({
      priorBalancesCentsByAccountId: priorBalances,
      deltaCentsByAccountId: computeBalanceDeltaCents(txn.lines),
      accountsById,
    });
  }

  return { debitsCents: debits, creditsCents: credits };
}

export async function assertIdempotency(input: {
  txn: LedgerTransaction;
  store: LedgerValidationStore;
}): Promise<{ status: 'NEW' } | { status: 'REPLAY'; existing: LedgerPostedTransactionSnapshot } > {
  const existing = await input.store.getPostedTransactionByNumber(input.txn.companyId, input.txn.transactionNumber);
  if (!existing) {
    return { status: 'NEW' };
  }

  const existingLines = canonicalizeLines(existing.lines);
  const proposedLines = canonicalizeLines(input.txn.lines);

  const existingDebit = existing.lines.reduce((sum, l) => sum + (l.side === 'DEBIT' ? parseMoneyToCents(l.amount) : 0n), 0n);
  const existingCredit = existing.lines.reduce((sum, l) => sum + (l.side === 'CREDIT' ? parseMoneyToCents(l.amount) : 0n), 0n);

  const proposedDebit = input.txn.lines.reduce((sum, l) => sum + (l.side === 'DEBIT' ? parseMoneyToCents(l.amount) : 0n), 0n);
  const proposedCredit = input.txn.lines.reduce((sum, l) => sum + (l.side === 'CREDIT' ? parseMoneyToCents(l.amount) : 0n), 0n);

  const match =
    existing.companyId === input.txn.companyId &&
    existing.transactionNumber === input.txn.transactionNumber &&
    existing.type === input.txn.type &&
    existingDebit === proposedDebit &&
    existingCredit === proposedCredit &&
    JSON.stringify(existingLines) === JSON.stringify(proposedLines);

  if (!match) {
    throw new LedgerInvariantError('IDEMPOTENCY_MISMATCH', 'Idempotency key replay mismatch: existing posted transaction differs', {
      transactionNumber: input.txn.transactionNumber,
      existingTransactionId: existing.transactionId,
      proposedTransactionId: input.txn.transactionId,
    });
  }

  return { status: 'REPLAY', existing };
}
