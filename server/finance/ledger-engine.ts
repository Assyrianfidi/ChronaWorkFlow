import { and, desc, eq, inArray, sql } from 'drizzle-orm';

import { db } from '../db.js';
import * as s from '../../shared/schema.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';

import {
  LedgerInvariantError,
  LedgerTransaction,
  parseMoneyToCents,
  stableId,
} from './ledger-invariants.js';
import { DrizzlePeriodLocks, PeriodLocks, PeriodLockViolationError } from './period-locks.js';
import {
  LedgerPostedTransactionSnapshot,
  LedgerValidationStore,
  assertIdempotency,
  validateLedgerTransaction,
} from './ledger-validator.js';

export type LedgerPostResult = {
  status: 'POSTED' | 'REPLAY';
  transactionId: string;
  transactionNumber: string;
};

export interface LedgerStore extends LedgerValidationStore {
  commitAppendOnly(txn: LedgerTransaction): Promise<void>;
  listPostedTransactions(companyId: string, from?: Date, to?: Date): Promise<Array<{ transaction: any; lines: any[] }>>;
}

function isDeterministic(): boolean {
  return process.env.DETERMINISTIC_TEST_IDS === 'true';
}

function safeCorrelationId(prefix: string, companyId: string, transactionNumber: string): string {
  const seed = `${prefix}:${companyId}:${transactionNumber}`;
  return isDeterministic() ? `fin_${prefix}_${companyId}_${transactionNumber}` : stableId('fin', seed);
}

function getAudit() {
  return getImmutableAuditLogger();
}

export class DrizzleLedgerStore implements LedgerStore {
  private computeTotalAmount(txn: LedgerTransaction): string {
    let debits = 0n;
    for (const line of txn.lines) {
      if (line.side === 'DEBIT') {
        debits += parseMoneyToCents(line.amount);
      }
    }
    // Represent as 2-decimal string to match DB numeric(15,2) usage.
    const neg = debits < 0n;
    const abs = neg ? -debits : debits;
    const whole = abs / 100n;
    const frac = (abs % 100n).toString().padStart(2, '0');
    return `${neg ? '-' : ''}${whole.toString()}.${frac}`;
  }

  async getAccountSnapshots(companyId: string, accountIds: string[]) {
    if (accountIds.length === 0) return [];

    const rows = await db
      .select({ id: s.accounts.id, companyId: s.accounts.companyId, type: s.accounts.type })
      .from(s.accounts)
      .where(and(eq(s.accounts.companyId, companyId), inArray(s.accounts.id, accountIds)));

    return rows.map((r) => ({
      accountId: r.id,
      companyId: r.companyId,
      type: r.type as any,
    }));
  }

  async getAccountBalancesCents(companyId: string, accountIds: string[]) {
    const m = new Map<string, bigint>();
    if (accountIds.length === 0) return m;

    const rows = await db
      .select({
        accountId: s.transactionLines.accountId,
        balance: sql<string>`coalesce(sum(${s.transactionLines.debit} - ${s.transactionLines.credit}), 0)`,
      })
      .from(s.transactionLines)
      .leftJoin(s.transactions, eq(s.transactions.id, s.transactionLines.transactionId))
      .where(
        and(
          inArray(s.transactionLines.accountId, accountIds),
          eq(s.transactions.companyId, companyId),
          eq(s.transactions.isVoid, false),
        ),
      )
      .groupBy(s.transactionLines.accountId);

    for (const r of rows) {
      m.set(r.accountId, parseMoneyToCents(r.balance));
    }

    for (const id of accountIds) {
      if (!m.has(id)) {
        m.set(id, 0n);
      }
    }

    return m;
  }

  async getPostedTransactionByNumber(companyId: string, transactionNumber: string): Promise<LedgerPostedTransactionSnapshot | null> {
    const [txn] = await db
      .select()
      .from(s.transactions)
      .where(and(eq(s.transactions.companyId, companyId), eq(s.transactions.transactionNumber, transactionNumber)))
      .limit(1);

    if (!txn) return null;

    const lines = await db
      .select()
      .from(s.transactionLines)
      .where(eq(s.transactionLines.transactionId, txn.id));

    const mappedLines = lines
      .flatMap((l) => {
        const debit = parseMoneyToCents(l.debit);
        const credit = parseMoneyToCents(l.credit);
        const out: any[] = [];

        if (debit > 0n) {
          out.push({
            companyId,
            transactionId: txn.id,
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
            companyId,
            transactionId: txn.id,
            lineId: l.id,
            accountId: l.accountId,
            side: 'CREDIT',
            amount: l.credit,
            currency: 'USD',
            description: l.description ?? null,
          });
        }

        return out;
      }) as any;

    return {
      transactionId: txn.id,
      companyId: txn.companyId,
      transactionNumber: txn.transactionNumber,
      date: new Date(txn.date as any),
      type: txn.type as any,
      referenceNumber: txn.referenceNumber as any,
      createdBy: txn.createdBy,
      lines: mappedLines,
    };
  }

  async commitAppendOnly(txn: LedgerTransaction): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.insert(s.transactions).values({
        id: txn.transactionId,
        companyId: txn.companyId,
        transactionNumber: txn.transactionNumber,
        date: txn.date,
        type: txn.type as any,
        description: txn.description ?? null,
        referenceNumber: txn.referenceNumber ?? null,
        totalAmount: this.computeTotalAmount(txn),
        reversalOfTransactionId: txn.reversalOfTransactionId ?? null,
        isVoid: false,
        createdBy: txn.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const values: any[] = [];
      for (const line of txn.lines) {
        values.push({
          id: line.lineId,
          transactionId: txn.transactionId,
          accountId: line.accountId,
          debit: line.side === 'DEBIT' ? line.amount : '0',
          credit: line.side === 'CREDIT' ? line.amount : '0',
          description: line.description ?? null,
          createdAt: new Date(),
        });
      }

      if (values.length) {
        await tx.insert(s.transactionLines).values(values as any);
      }
    });
  }

  async listPostedTransactions(companyId: string, from?: Date, to?: Date) {
    const txnWhere = [eq(s.transactions.companyId, companyId), eq(s.transactions.isVoid, false)];
    if (from) {
      txnWhere.push(sql`${s.transactions.date} >= ${from}` as any);
    }
    if (to) {
      txnWhere.push(sql`${s.transactions.date} <= ${to}` as any);
    }

    const transactions = await db
      .select()
      .from(s.transactions)
      .where(and(...(txnWhere as any)))
      .orderBy(desc(s.transactions.date), desc(s.transactions.createdAt));

    const ids = transactions.map((t) => t.id);
    const linesByTxn = new Map<string, any[]>();

    if (ids.length) {
      const lines = await db.select().from(s.transactionLines).where(inArray(s.transactionLines.transactionId, ids));
      for (const l of lines) {
        const arr = linesByTxn.get(l.transactionId) ?? [];
        arr.push(l);
        linesByTxn.set(l.transactionId, arr);
      }
    }

    return transactions.map((t) => ({ transaction: t, lines: linesByTxn.get(t.id) ?? [] }));
  }
}

export class LedgerEngine {
  constructor(
    private readonly store: LedgerStore = new DrizzleLedgerStore(),
    private readonly periodLocks: PeriodLocks = new DrizzlePeriodLocks(),
  ) {}

  async post(txn: LedgerTransaction): Promise<LedgerPostResult> {
    const correlationId = safeCorrelationId('post', txn.companyId, txn.transactionNumber);

    try {
      await this.periodLocks.assertCanPost({
        companyId: txn.companyId,
        date: txn.date,
        actorId: txn.createdBy,
        correlationId,
        transactionNumber: txn.transactionNumber,
      });

      const idempotency = await assertIdempotency({ txn, store: this.store });
      if (idempotency.status === 'REPLAY') {
        getAudit().logSecurityEvent({
          tenantId: txn.companyId,
          actorId: txn.createdBy,
          action: 'LEDGER_REPLAY_ACCEPTED',
          resourceType: 'LEDGER_TRANSACTION',
          resourceId: txn.transactionNumber,
          outcome: 'ALLOWED',
          correlationId,
          severity: 'LOW',
          metadata: {
            transactionId: idempotency.existing.transactionId,
            type: txn.type,
          },
        });

        return { status: 'REPLAY', transactionId: idempotency.existing.transactionId, transactionNumber: txn.transactionNumber };
      }

      await validateLedgerTransaction({ txn, store: this.store, enforceNoNegativeBalances: true });

      await this.store.commitAppendOnly(txn);

      getAudit().logSecurityEvent({
        tenantId: txn.companyId,
        actorId: txn.createdBy,
        action: 'LEDGER_POSTED',
        resourceType: 'LEDGER_TRANSACTION',
        resourceId: txn.transactionNumber,
        outcome: 'ALLOWED',
        correlationId,
        severity: 'LOW',
        metadata: {
          transactionId: txn.transactionId,
          type: txn.type,
          currency: txn.currency,
          lineCount: txn.lines.length,
          idempotencyKey: txn.idempotencyKey,
        },
      });

      return { status: 'POSTED', transactionId: txn.transactionId, transactionNumber: txn.transactionNumber };
    } catch (error) {
      const err = error as any;

      getAudit().logSecurityEvent({
        tenantId: txn.companyId,
        actorId: txn.createdBy,
        action: 'LEDGER_REJECTED',
        resourceType: 'LEDGER_TRANSACTION',
        resourceId: txn.transactionNumber,
        outcome: 'DENIED',
        correlationId,
        severity: 'HIGH',
        metadata: {
          code: err?.code,
          message: err instanceof Error ? err.message : String(err),
          details: err?.details,
          transactionId: txn.transactionId,
          type: txn.type,
        },
      });

      if (error instanceof LedgerInvariantError) {
        throw error;
      }

      if (error instanceof PeriodLockViolationError) {
        throw error;
      }

      throw new LedgerInvariantError('MISSING_REQUIRED_FIELDS', 'Ledger post failed', {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export const ledgerEngine = new LedgerEngine();
