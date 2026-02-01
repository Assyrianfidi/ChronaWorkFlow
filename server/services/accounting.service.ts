import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "../db";
import { storage } from "../storage";
import * as s from "../../shared/schema";
import { ledgerEngine } from "../finance/ledger-engine.js";
import { LedgerTransaction, stableId } from "../finance/ledger-invariants.js";
import { DrizzlePeriodLocks } from "../finance/period-locks.js";

type Money = string;

type Actor = {
  userId: string;
  role?: string;
  email?: string;
  isOwner: boolean;
};

class AccountingError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function parseMoneyToCents(value: unknown): bigint {
  const s = (value ?? "0").toString().trim();
  if (!s) return 0n;

  const neg = s.startsWith("-");
  const raw = neg ? s.slice(1) : s;

  const m = raw.match(/^\d+(?:\.\d{1,2})?$/);
  if (!m) {
    throw new AccountingError(400, "Invalid money amount");
  }

  const [whole, fracRaw] = raw.split(".");
  const frac = (fracRaw ?? "").padEnd(2, "0");
  const cents = BigInt(whole) * 100n + BigInt(frac || "0");
  return neg ? -cents : cents;
}

function isWriteBalanced(lines: Array<{ debit?: Money; credit?: Money }>) {
  let debits = 0n;
  let credits = 0n;

  for (const line of lines) {
    debits += parseMoneyToCents(line.debit ?? "0");
    credits += parseMoneyToCents(line.credit ?? "0");
  }

  return { debits, credits, balanced: debits === credits };
}

async function getPeriodLockStatus(companyId: string, date: Date) {
  const periods = await db
    .select()
    .from(s.accountingPeriods)
    .where(
      and(
        eq(s.accountingPeriods.companyId, companyId),
        sql`${s.accountingPeriods.startDate} <= ${date}`,
        sql`${s.accountingPeriods.endDate} >= ${date}`,
      ),
    )
    .orderBy(desc(s.accountingPeriods.startDate))
    .limit(1);

  const period = periods[0] ?? null;
  if (!period) return { period: null as any, isClosed: false };

  const [lastLock] = await db
    .select()
    .from(s.accountingPeriodLocks)
    .where(eq(s.accountingPeriodLocks.periodId, period.id))
    .orderBy(desc(s.accountingPeriodLocks.createdAt))
    .limit(1);

  const isClosed = (lastLock?.action ?? "") === "close";
  return { period, isClosed };
}

async function assertPeriodOpen(input: {
  companyId: string;
  date: Date;
  actor: Actor;
  operation: string;
  entityId: string;
}) {
  const locks = new DrizzlePeriodLocks();
  const status = await locks.getPeriodStateForDate({ companyId: input.companyId, date: input.date });
  if (!status.periodId || status.state === 'OPEN') return;

  await storage.createAuditLog({
    companyId: input.companyId,
    userId: input.actor.userId,
    action: "accounting.period.violation",
    entityType: "accounting_period",
    entityId: status.periodId ?? input.entityId,
    changes: JSON.stringify({ operation: input.operation, date: input.date.toISOString(), state: status.state }),
  });

  throw new AccountingError(403, "Accounting period is not open");
}

export async function postJournalEntry(input: {
  transaction: s.InsertTransaction;
  lines: s.InsertTransactionLine[];
  actor: Actor;
}) {
  const totals = isWriteBalanced(input.lines);
  if (!totals.balanced) {
    await storage.createAuditLog({
      companyId: input.transaction.companyId,
      userId: input.actor.userId,
      action: "accounting.invariant.violation",
      entityType: "transaction",
      entityId: input.transaction.transactionNumber,
      changes: JSON.stringify({ reason: "unbalanced", debits: totals.debits.toString(), credits: totals.credits.toString() }),
    });

    throw new AccountingError(400, "Transaction is not balanced. Debits must equal credits.");
  }

  await assertPeriodOpen({
    companyId: input.transaction.companyId,
    date: input.transaction.date as any,
    actor: input.actor,
    operation: "post",
    entityId: input.transaction.transactionNumber,
  });

  const [company] = await db
    .select({ currency: s.companies.currency })
    .from(s.companies)
    .where(eq(s.companies.id, input.transaction.companyId))
    .limit(1);

  const currency = company?.currency ?? "USD";

  const transactionNumber = String(input.transaction.transactionNumber);
  const idempotencyKey = `journal:${transactionNumber}`;
  const transactionId = stableId('txn', `${input.transaction.companyId}:${transactionNumber}:${idempotencyKey}`);

  const txn: LedgerTransaction = {
    companyId: input.transaction.companyId,
    transactionId,
    transactionNumber,
    date: input.transaction.date as any,
    type: String(input.transaction.type ?? 'journal_entry'),
    description: (input.transaction.description as any) ?? null,
    referenceNumber: (input.transaction.referenceNumber as any) ?? null,
    createdBy: input.actor.userId,
    idempotencyKey,
    currency,
    reversalOfTransactionId: null,
    lines: input.lines.flatMap((l: any) => {
      const debit = (l.debit ?? '0').toString();
      const credit = (l.credit ?? '0').toString();
      const hasDebit = debit !== '0' && debit !== '0.00';
      const hasCredit = credit !== '0' && credit !== '0.00';

      if (hasDebit === hasCredit) {
        throw new AccountingError(400, 'Each line must have exactly one of debit or credit');
      }

      const side = hasDebit ? 'DEBIT' : 'CREDIT';
      const amount = hasDebit ? debit : credit;
      const seed = `${input.transaction.companyId}:${transactionId}:${l.accountId}:${side}:${amount}:${currency}:${l.description ?? ''}`;

      return [{
        companyId: input.transaction.companyId,
        transactionId,
        lineId: stableId('line', seed),
        accountId: String(l.accountId),
        side,
        amount,
        currency,
        description: (l.description as any) ?? null,
      }];
    }),
  };

  const posted = await ledgerEngine.post(txn);

  const created = await storage.getTransaction(posted.transactionId);
  if (!created) {
    throw new AccountingError(500, 'Ledger post succeeded but transaction was not found');
  }

  await storage.createAuditLog({
    companyId: created.companyId,
    userId: input.actor.userId,
    action: "accounting.transaction.posted",
    entityType: "transaction",
    entityId: created.id,
    changes: JSON.stringify({ transactionNumber: created.transactionNumber }),
  });

  return created;
}

export async function voidByReversal(input: {
  companyId: string;
  transactionId: string;
  actor: Actor;
  reason?: string | null;
}) {
  const [original] = await db
    .select()
    .from(s.transactions)
    .where(and(eq(s.transactions.id, input.transactionId), eq(s.transactions.companyId, input.companyId)))
    .limit(1);

  if (!original) {
    throw new AccountingError(404, "Transaction not found");
  }

  await assertPeriodOpen({
    companyId: input.companyId,
    date: new Date(original.date as any),
    actor: input.actor,
    operation: "void",
    entityId: original.id,
  });

  const [existingReversal] = await db
    .select()
    .from(s.transactions)
    .where(and(eq(s.transactions.reversalOfTransactionId, original.id), eq(s.transactions.companyId, input.companyId)))
    .limit(1);

  if (existingReversal) {
    await storage.createAuditLog({
      companyId: input.companyId,
      userId: input.actor.userId,
      action: "accounting.transaction.void.duplicate",
      entityType: "transaction",
      entityId: original.id,
      changes: JSON.stringify({ reversalId: existingReversal.id }),
    });

    return { reversalId: existingReversal.id };
  }

  const lines = await db
    .select()
    .from(s.transactionLines)
    .where(eq(s.transactionLines.transactionId, original.id));

  const reversalNumber = `${original.transactionNumber}-REV-${original.id.slice(0, 8)}`;

  const [company] = await db
    .select({ currency: s.companies.currency })
    .from(s.companies)
    .where(eq(s.companies.id, original.companyId))
    .limit(1);

  const currency = company?.currency ?? 'USD';
  const idempotencyKey = `void:${original.id}`;
  const reversalTxnId = stableId('txn', `${original.companyId}:${reversalNumber}:${idempotencyKey}`);

  const reversalTxn: LedgerTransaction = {
    companyId: original.companyId,
    transactionId: reversalTxnId,
    transactionNumber: reversalNumber,
    date: new Date(original.date as any),
    type: String(original.type ?? 'journal_entry'),
    description: `Reversal of ${original.transactionNumber}`,
    referenceNumber: (original.referenceNumber as any) ?? null,
    createdBy: input.actor.userId,
    idempotencyKey,
    currency,
    reversalOfTransactionId: original.id,
    lines: lines.flatMap((l: any) => {
      const debit = (l.debit ?? '0').toString();
      const credit = (l.credit ?? '0').toString();
      const hasDebit = debit !== '0' && debit !== '0.00';
      const hasCredit = credit !== '0' && credit !== '0.00';

      if (hasDebit === hasCredit) {
        return [];
      }

      const side = hasDebit ? 'CREDIT' : 'DEBIT';
      const amount = hasDebit ? debit : credit;
      const seed = `${original.companyId}:${reversalTxnId}:${l.accountId}:${side}:${amount}:${currency}:${l.description ?? ''}`;

      return [{
        companyId: original.companyId,
        transactionId: reversalTxnId,
        lineId: stableId('line', seed),
        accountId: String(l.accountId),
        side,
        amount,
        currency,
        description: (l.description as any) ?? null,
      }];
    }),
  };

  const posted = await ledgerEngine.post(reversalTxn);
  const reversal = await storage.getTransaction(posted.transactionId);
  if (!reversal) {
    throw new AccountingError(500, 'Ledger reversal succeeded but reversal transaction was not found');
  }

  await storage.createAuditLog({
    companyId: input.companyId,
    userId: input.actor.userId,
    action: "accounting.transaction.voided",
    entityType: "transaction",
    entityId: original.id,
    changes: JSON.stringify({ reversalId: reversal.id, reason: input.reason ?? null }),
  });

  return { reversalId: reversal.id };
}

export async function closeAccountingPeriod(input: {
  companyId: string;
  startDate: Date;
  endDate: Date;
  actor: Actor;
  reason?: string | null;
}) {
  const [period] = await db
    .insert(s.accountingPeriods)
    .values({
      companyId: input.companyId,
      startDate: input.startDate,
      endDate: input.endDate,
      createdAt: new Date(),
    } as any)
    .onConflictDoNothing()
    .returning();

  const existing = period
    ? period
    : (await db
        .select()
        .from(s.accountingPeriods)
        .where(
          and(
            eq(s.accountingPeriods.companyId, input.companyId),
            eq(s.accountingPeriods.startDate, input.startDate),
            eq(s.accountingPeriods.endDate, input.endDate),
          ),
        )
        .limit(1))[0];

  if (!existing) {
    throw new AccountingError(500, "Failed to create or load accounting period");
  }

  const locks = new DrizzlePeriodLocks();
  const correlationId = stableId('period', `${input.companyId}:${existing.id}:SOFT_CLOSED:${input.actor.userId}`);
  await locks.transitionPeriod({
    companyId: input.companyId,
    periodId: existing.id,
    nextState: 'SOFT_CLOSED',
    actorId: input.actor.userId,
    correlationId,
    reason: input.reason ?? null,
  });

  await storage.createAuditLog({
    companyId: input.companyId,
    userId: input.actor.userId,
    action: "accounting.period.closed",
    entityType: "accounting_period",
    entityId: existing.id,
    changes: JSON.stringify({ startDate: input.startDate.toISOString(), endDate: input.endDate.toISOString(), reason: input.reason ?? null }),
  });

  return existing;
}

export async function openAccountingPeriod(input: {
  companyId: string;
  periodId: string;
  actor: Actor;
  reason?: string | null;
}) {
  const locks = new DrizzlePeriodLocks();
  const correlationId = stableId('period', `${input.companyId}:${input.periodId}:OPEN:${input.actor.userId}`);
  await locks.transitionPeriod({
    companyId: input.companyId,
    periodId: input.periodId,
    nextState: 'OPEN',
    actorId: input.actor.userId,
    correlationId,
    reason: input.reason ?? null,
  });

  await storage.createAuditLog({
    companyId: input.companyId,
    userId: input.actor.userId,
    action: "accounting.period.opened",
    entityType: "accounting_period",
    entityId: input.periodId,
    changes: JSON.stringify({ reason: input.reason ?? null }),
  });

  return { success: true };
}

export function getActorFromRequest(req: any): Actor {
  const role = typeof req.user?.role === "string" ? req.user.role : undefined;
  const email = typeof req.user?.email === "string" ? req.user.email : undefined;
  const roles = Array.isArray(req.user?.roles) ? req.user.roles : [];
  const isOwner = role === "owner" || roles.includes("OWNER") || (process.env.OWNER_EMAIL && email?.toLowerCase() === process.env.OWNER_EMAIL.toLowerCase());

  return {
    userId: String(req.user?.id ?? ""),
    role,
    email,
    isOwner,
  };
}

export function isAccountingError(err: unknown): err is AccountingError {
  return err instanceof AccountingError;
}
