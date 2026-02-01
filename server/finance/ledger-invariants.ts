import crypto from 'crypto';

export type Money = string;

export type LedgerSide = 'DEBIT' | 'CREDIT';

export type LedgerEntry = {
  companyId: string;
  transactionId: string;
  lineId: string;
  accountId: string;
  side: LedgerSide;
  amount: Money;
  currency: string;
  description?: string | null;
  allowNegative?: boolean;
};

export type LedgerTransaction = {
  companyId: string;
  transactionId: string;
  transactionNumber: string;
  date: Date;
  type: string;
  description?: string | null;
  referenceNumber?: string | null;
  createdBy: string;
  idempotencyKey: string;
  currency: string;
  reversalOfTransactionId?: string | null;
  lines: LedgerEntry[];
};

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export type AccountSnapshot = {
  accountId: string;
  companyId: string;
  type: AccountType;
  allowNegative?: boolean;
};

export type LedgerInvariantViolationCode =
  | 'TENANT_MISMATCH'
  | 'EMPTY_TRANSACTION'
  | 'MISSING_REQUIRED_FIELDS'
  | 'CURRENCY_MISMATCH'
  | 'NON_POSITIVE_AMOUNT'
  | 'BOTH_SIDES_SET'
  | 'UNBALANCED_TRANSACTION'
  | 'NEGATIVE_BALANCE_NOT_ALLOWED'
  | 'IMMUTABILITY_VIOLATION'
  | 'REPLAY_MISMATCH'
  | 'IDEMPOTENCY_MISMATCH';

export class LedgerInvariantError extends Error {
  readonly code: LedgerInvariantViolationCode;
  readonly details?: Record<string, unknown>;

  constructor(code: LedgerInvariantViolationCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

function isDeterministic(): boolean {
  return process.env.DETERMINISTIC_TEST_IDS === 'true';
}

export function stableHash(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function stableId(prefix: string, seed: string): string {
  if (isDeterministic()) {
    return `${prefix}_${stableHash(seed).slice(0, 16)}`;
  }
  return `${prefix}_${crypto.randomUUID()}`;
}

export function parseMoneyToCents(value: unknown): bigint {
  const s = (value ?? '0').toString().trim();
  if (!s) return 0n;

  const neg = s.startsWith('-');
  const raw = neg ? s.slice(1) : s;

  const m = raw.match(/^\d+(?:\.\d{1,2})?$/);
  if (!m) {
    throw new LedgerInvariantError('MISSING_REQUIRED_FIELDS', 'Invalid money amount', { value });
  }

  const [whole, fracRaw] = raw.split('.');
  const frac = (fracRaw ?? '').padEnd(2, '0');
  const cents = BigInt(whole) * 100n + BigInt(frac || '0');
  return neg ? -cents : cents;
}

export function assertTenantIsolation(txn: LedgerTransaction): void {
  if (!txn.companyId) {
    throw new LedgerInvariantError('MISSING_REQUIRED_FIELDS', 'companyId is required');
  }

  for (const line of txn.lines) {
    if (line.companyId !== txn.companyId) {
      throw new LedgerInvariantError('TENANT_MISMATCH', 'Ledger line companyId mismatch', {
        txnCompanyId: txn.companyId,
        lineCompanyId: line.companyId,
      });
    }
    if (line.transactionId !== txn.transactionId) {
      throw new LedgerInvariantError('MISSING_REQUIRED_FIELDS', 'Ledger line transactionId mismatch', {
        txnId: txn.transactionId,
        lineTxnId: line.transactionId,
      });
    }
  }
}

export function assertCurrencyIsolation(txn: LedgerTransaction): void {
  const currency = txn.currency;
  if (!currency) {
    throw new LedgerInvariantError('MISSING_REQUIRED_FIELDS', 'currency is required');
  }

  for (const line of txn.lines) {
    if (!line.currency) {
      throw new LedgerInvariantError('MISSING_REQUIRED_FIELDS', 'line currency is required');
    }
    if (line.currency !== currency) {
      throw new LedgerInvariantError('CURRENCY_MISMATCH', 'Cross-currency entries are forbidden in a single transaction', {
        txnCurrency: currency,
        lineCurrency: line.currency,
      });
    }
  }
}

export function assertBalanced(txn: LedgerTransaction): { debits: bigint; credits: bigint } {
  if (!Array.isArray(txn.lines) || txn.lines.length === 0) {
    throw new LedgerInvariantError('EMPTY_TRANSACTION', 'Ledger transaction must have at least one line');
  }

  let debits = 0n;
  let credits = 0n;

  for (const line of txn.lines) {
    const cents = parseMoneyToCents(line.amount);
    if (cents <= 0n) {
      throw new LedgerInvariantError('NON_POSITIVE_AMOUNT', 'Ledger line amount must be > 0', { lineId: line.lineId });
    }

    if (line.side === 'DEBIT') {
      debits += cents;
    } else {
      credits += cents;
    }
  }

  if (debits !== credits) {
    throw new LedgerInvariantError('UNBALANCED_TRANSACTION', 'Transaction is not balanced. Debits must equal credits.', {
      debits: debits.toString(),
      credits: credits.toString(),
      transactionId: txn.transactionId,
    });
  }

  return { debits, credits };
}

export function computeBalanceDeltaCents(lines: LedgerEntry[]): Map<string, bigint> {
  const m = new Map<string, bigint>();
  for (const line of lines) {
    const cents = parseMoneyToCents(line.amount);
    const signed = line.side === 'DEBIT' ? cents : -cents;
    m.set(line.accountId, (m.get(line.accountId) ?? 0n) + signed);
  }
  return m;
}

export function assertNoForbiddenNegativeBalances(input: {
  priorBalancesCentsByAccountId: Map<string, bigint>;
  deltaCentsByAccountId: Map<string, bigint>;
  accountsById: Map<string, AccountSnapshot>;
}): void {
  for (const [accountId, delta] of input.deltaCentsByAccountId.entries()) {
    const prior = input.priorBalancesCentsByAccountId.get(accountId) ?? 0n;
    const after = prior + delta;

    const acct = input.accountsById.get(accountId);
    const allowNegative = acct?.allowNegative === true || acct?.type === 'liability' || acct?.type === 'equity' || acct?.type === 'revenue';

    if (!allowNegative && after < 0n) {
      throw new LedgerInvariantError('NEGATIVE_BALANCE_NOT_ALLOWED', 'Negative balance would result for account', {
        accountId,
        prior: prior.toString(),
        delta: delta.toString(),
        after: after.toString(),
        type: acct?.type,
      });
    }
  }
}
