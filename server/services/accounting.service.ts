import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "../db";
import { storage } from "../storage";
import * as s from "../../shared/schema";

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
  const { period, isClosed } = await getPeriodLockStatus(input.companyId, input.date);
  if (!isClosed) return;

  if (input.actor.isOwner) {
    await storage.createAuditLog({
      companyId: input.companyId,
      userId: input.actor.userId,
      action: "accounting.period.override",
      entityType: "accounting_period",
      entityId: period?.id ?? input.entityId,
      changes: JSON.stringify({ operation: input.operation, date: input.date.toISOString() }),
    });
    return;
  }

  await storage.createAuditLog({
    companyId: input.companyId,
    userId: input.actor.userId,
    action: "accounting.period.violation",
    entityType: "accounting_period",
    entityId: period?.id ?? input.entityId,
    changes: JSON.stringify({ operation: input.operation, date: input.date.toISOString() }),
  });

  throw new AccountingError(403, "Accounting period is closed");
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

  const created = await db.transaction(async (tx) => {
    const [newTransaction] = await tx
      .insert(s.transactions)
      .values({
        ...input.transaction,
        isVoid: false,
        reversalOfTransactionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .returning();

    if (input.lines.length > 0) {
      await tx.insert(s.transactionLines).values(
        input.lines.map((line) => ({
          ...line,
          transactionId: newTransaction.id,
          createdAt: new Date(),
        })) as any,
      );
    }

    return newTransaction;
  });

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

  const reversal = await db.transaction(async (tx) => {
    const [revTxn] = await tx
      .insert(s.transactions)
      .values({
        companyId: original.companyId,
        transactionNumber: reversalNumber,
        date: original.date as any,
        type: original.type as any,
        description: `Reversal of ${original.transactionNumber}`,
        referenceNumber: original.referenceNumber,
        totalAmount: original.totalAmount,
        reversalOfTransactionId: original.id,
        isVoid: false,
        createdBy: input.actor.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .returning();

    if (lines.length) {
      await tx.insert(s.transactionLines).values(
        lines.map((l) => ({
          transactionId: revTxn.id,
          accountId: l.accountId,
          debit: l.credit,
          credit: l.debit,
          description: l.description,
          createdAt: new Date(),
        })) as any,
      );
    }

    return revTxn;
  });

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

  await db.insert(s.accountingPeriodLocks).values({
    companyId: input.companyId,
    periodId: existing.id,
    action: "close",
    reason: input.reason ?? null,
    actorUserId: input.actor.userId,
    createdAt: new Date(),
  } as any);

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
  await db.insert(s.accountingPeriodLocks).values({
    companyId: input.companyId,
    periodId: input.periodId,
    action: "open",
    reason: input.reason ?? null,
    actorUserId: input.actor.userId,
    createdAt: new Date(),
  } as any);

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
