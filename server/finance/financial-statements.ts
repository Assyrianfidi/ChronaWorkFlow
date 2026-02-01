import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { DrizzleLedgerStore, LedgerStore } from './ledger-engine.js';
import { parseMoneyToCents, stableHash } from './ledger-invariants.js';
import { buildTrialBalance, TrialBalance } from './trial-balance.js';

export type FinancialStatementLine = {
  label: string;
  accountIds: string[];
  currency: string;
  amountCents: bigint;
};

export type IncomeStatement = {
  companyId: string;
  period: { from: Date; to: Date };
  revenue: FinancialStatementLine[];
  expenses: FinancialStatementLine[];
  netIncomeCents: bigint;
  integrityHash: string;
};

export type BalanceSheet = {
  companyId: string;
  asOf: Date;
  assets: FinancialStatementLine[];
  liabilities: FinancialStatementLine[];
  equity: FinancialStatementLine[];
  assetsCents: bigint;
  liabilitiesAndEquityCents: bigint;
  balanced: boolean;
  integrityHash: string;
};

export type CashFlow = {
  companyId: string;
  period: { from: Date; to: Date };
  method: 'DIRECT' | 'INDIRECT';
  cashAccountIds: string[];
  netCashChangeCents: bigint;
  integrityHash: string;
};

function getAudit() {
  return getImmutableAuditLogger();
}

function canonical(obj: unknown): string {
  return JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
}

function sum(lines: FinancialStatementLine[]): bigint {
  return lines.reduce((acc, l) => acc + l.amountCents, 0n);
}

export async function generateIncomeStatement(input: {
  companyId: string;
  from: Date;
  to: Date;
  actorId: string;
  correlationId: string;
  store?: LedgerStore;
}): Promise<IncomeStatement> {
  const store = input.store ?? new DrizzleLedgerStore();
  const tb = await buildTrialBalance({ companyId: input.companyId, from: input.from, to: input.to, store });

  const accountSnapshots = await store.getAccountSnapshots(
    input.companyId,
    tb.rows.map((r) => r.accountId),
  );

  const typeById = new Map(accountSnapshots.map((a) => [a.accountId, a.type] as const));

  const revenue: FinancialStatementLine[] = [];
  const expenses: FinancialStatementLine[] = [];

  for (const r of tb.rows) {
    const t = typeById.get(r.accountId);
    // Trial balance activityCents is debit-credit; revenue typically credits -> negative activity.
    if (t === 'revenue') {
      revenue.push({ label: r.accountId, accountIds: [r.accountId], currency: r.currency, amountCents: -r.activityCents });
    } else if (t === 'expense') {
      expenses.push({ label: r.accountId, accountIds: [r.accountId], currency: r.currency, amountCents: r.activityCents });
    }
  }

  const netIncomeCents = sum(revenue) - sum(expenses);

  const out: IncomeStatement = {
    companyId: input.companyId,
    period: { from: input.from, to: input.to },
    revenue: revenue.sort((a, b) => a.label.localeCompare(b.label)),
    expenses: expenses.sort((a, b) => a.label.localeCompare(b.label)),
    netIncomeCents,
    integrityHash: stableHash(canonical({ companyId: input.companyId, from: input.from.toISOString(), to: input.to.toISOString(), revenue, expenses, netIncomeCents })),
  };

  getAudit().logSecurityEvent({
    tenantId: input.companyId,
    actorId: input.actorId,
    action: 'FINANCIAL_STATEMENT_GENERATED_INCOME',
    resourceType: 'FINANCIAL_STATEMENT',
    resourceId: `${input.from.toISOString()}..${input.to.toISOString()}`,
    outcome: 'ALLOWED',
    correlationId: input.correlationId,
    severity: 'LOW',
    metadata: { integrityHash: out.integrityHash },
  });

  return out;
}

export async function generateBalanceSheet(input: {
  companyId: string;
  asOf: Date;
  actorId: string;
  correlationId: string;
  store?: LedgerStore;
}): Promise<BalanceSheet> {
  const store = input.store ?? new DrizzleLedgerStore();
  // Build trial balance from beginning of time to asOf to get closing balances as-of.
  const tb: TrialBalance = await buildTrialBalance({ companyId: input.companyId, from: new Date('1970-01-01T00:00:00.000Z'), to: input.asOf, store });

  const accountSnapshots = await store.getAccountSnapshots(
    input.companyId,
    tb.rows.map((r) => r.accountId),
  );
  const typeById = new Map(accountSnapshots.map((a) => [a.accountId, a.type] as const));

  const assets: FinancialStatementLine[] = [];
  const liabilities: FinancialStatementLine[] = [];
  const equity: FinancialStatementLine[] = [];
  const revenue: FinancialStatementLine[] = [];
  const expenses: FinancialStatementLine[] = [];

  for (const r of tb.rows) {
    const t = typeById.get(r.accountId);
    if (t === 'asset') assets.push({ label: r.accountId, accountIds: [r.accountId], currency: r.currency, amountCents: r.closingCents });
    if (t === 'liability') liabilities.push({ label: r.accountId, accountIds: [r.accountId], currency: r.currency, amountCents: -r.closingCents });
    if (t === 'equity') equity.push({ label: r.accountId, accountIds: [r.accountId], currency: r.currency, amountCents: -r.closingCents });
    if (t === 'revenue') revenue.push({ label: r.accountId, accountIds: [r.accountId], currency: r.currency, amountCents: -r.closingCents });
    if (t === 'expense') expenses.push({ label: r.accountId, accountIds: [r.accountId], currency: r.currency, amountCents: r.closingCents });
  }

  // In many SMB systems, revenue/expense accounts are not periodically closed into equity.
  // For audit-ready deterministic statements, we include implied net income in equity so
  // the balance sheet balances even without explicit closing entries.
  const impliedNetIncomeCents = sum(revenue) - sum(expenses);
  if (impliedNetIncomeCents !== 0n) {
    equity.push({
      label: 'IMPLIED_NET_INCOME',
      accountIds: [],
      currency: 'USD',
      amountCents: impliedNetIncomeCents,
    });
  }

  const assetsCents = sum(assets);
  const liabilitiesAndEquityCents = sum(liabilities) + sum(equity);
  const balanced = assetsCents === liabilitiesAndEquityCents;

  const out: BalanceSheet = {
    companyId: input.companyId,
    asOf: input.asOf,
    assets: assets.sort((a, b) => a.label.localeCompare(b.label)),
    liabilities: liabilities.sort((a, b) => a.label.localeCompare(b.label)),
    equity: equity.sort((a, b) => a.label.localeCompare(b.label)),
    assetsCents,
    liabilitiesAndEquityCents,
    balanced,
    integrityHash: stableHash(
      canonical({
        companyId: input.companyId,
        asOf: input.asOf.toISOString(),
        assets,
        liabilities,
        equity,
        assetsCents,
        liabilitiesAndEquityCents,
        balanced,
      }),
    ),
  };

  getAudit().logSecurityEvent({
    tenantId: input.companyId,
    actorId: input.actorId,
    action: 'FINANCIAL_STATEMENT_GENERATED_BALANCE_SHEET',
    resourceType: 'FINANCIAL_STATEMENT',
    resourceId: input.asOf.toISOString(),
    outcome: 'ALLOWED',
    correlationId: input.correlationId,
    severity: balanced ? 'LOW' : 'HIGH',
    metadata: { integrityHash: out.integrityHash, balanced },
  });

  return out;
}

export async function generateCashFlowDirect(input: {
  companyId: string;
  from: Date;
  to: Date;
  cashAccountIds: string[];
  actorId: string;
  correlationId: string;
  store?: LedgerStore;
}): Promise<CashFlow> {
  const store = input.store ?? new DrizzleLedgerStore();

  const txns = await store.listPostedTransactions(input.companyId, input.from, input.to);
  let netCashChangeCents = 0n;

  for (const t of txns) {
    for (const l of t.lines) {
      const accountId = String(l.accountId);
      if (!input.cashAccountIds.includes(accountId)) continue;
      const debit = parseMoneyToCents((l.debit ?? '0').toString());
      const credit = parseMoneyToCents((l.credit ?? '0').toString());
      netCashChangeCents += debit - credit;
    }
  }

  const out: CashFlow = {
    companyId: input.companyId,
    period: { from: input.from, to: input.to },
    method: 'DIRECT',
    cashAccountIds: [...input.cashAccountIds].sort(),
    netCashChangeCents,
    integrityHash: stableHash(
      canonical({ companyId: input.companyId, from: input.from.toISOString(), to: input.to.toISOString(), cashAccountIds: input.cashAccountIds, netCashChangeCents }),
    ),
  };

  getAudit().logSecurityEvent({
    tenantId: input.companyId,
    actorId: input.actorId,
    action: 'FINANCIAL_STATEMENT_GENERATED_CASH_FLOW_DIRECT',
    resourceType: 'FINANCIAL_STATEMENT',
    resourceId: `${input.from.toISOString()}..${input.to.toISOString()}`,
    outcome: 'ALLOWED',
    correlationId: input.correlationId,
    severity: 'LOW',
    metadata: { integrityHash: out.integrityHash },
  });

  return out;
}

export async function generateCashFlowIndirect(input: {
  companyId: string;
  from: Date;
  to: Date;
  cashAccountIds: string[];
  actorId: string;
  correlationId: string;
  store?: LedgerStore;
}): Promise<CashFlow> {
  const income = await generateIncomeStatement({
    companyId: input.companyId,
    from: input.from,
    to: input.to,
    actorId: input.actorId,
    correlationId: input.correlationId,
    store: input.store,
  });

  // Minimal indirect approximation: net income as proxy for cash movement.
  const out: CashFlow = {
    companyId: input.companyId,
    period: { from: input.from, to: input.to },
    method: 'INDIRECT',
    cashAccountIds: [...input.cashAccountIds].sort(),
    netCashChangeCents: income.netIncomeCents,
    integrityHash: stableHash(
      canonical({ companyId: input.companyId, from: input.from.toISOString(), to: input.to.toISOString(), cashAccountIds: input.cashAccountIds, netCashChangeCents: income.netIncomeCents }),
    ),
  };

  getAudit().logSecurityEvent({
    tenantId: input.companyId,
    actorId: input.actorId,
    action: 'FINANCIAL_STATEMENT_GENERATED_CASH_FLOW_INDIRECT',
    resourceType: 'FINANCIAL_STATEMENT',
    resourceId: `${input.from.toISOString()}..${input.to.toISOString()}`,
    outcome: 'ALLOWED',
    correlationId: input.correlationId,
    severity: 'LOW',
    metadata: { integrityHash: out.integrityHash },
  });

  return out;
}
