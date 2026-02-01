import { LedgerEntry, LedgerSide, LedgerTransaction, Money, stableId } from './ledger-invariants.js';

export type TransactionType =
  | 'invoice'
  | 'payment'
  | 'refund'
  | 'credit'
  | 'adjustment'
  | 'journal_entry'
  | 'transfer'
  | 'expense';

export type FinancialMutationContext = {
  companyId: string;
  actorUserId: string;
  requestId?: string;
  idempotencyKey: string;
  currency: string;
  date: Date;
  transactionNumber: string;
};

export type InvoiceTransactionInput = {
  kind: 'invoice';
  revenueAccountId: string;
  arAccountId: string;
  amount: Money;
  description?: string | null;
  referenceNumber?: string | null;
};

export type PaymentTransactionInput = {
  kind: 'payment';
  cashAccountId: string;
  arAccountId: string;
  amount: Money;
  description?: string | null;
  referenceNumber?: string | null;
};

export type RefundTransactionInput = {
  kind: 'refund';
  cashAccountId: string;
  arAccountId: string;
  amount: Money;
  description?: string | null;
  referenceNumber?: string | null;
};

export type CreditTransactionInput = {
  kind: 'credit';
  arAccountId: string;
  revenueAccountId: string;
  amount: Money;
  description?: string | null;
  referenceNumber?: string | null;
};

export type AdjustmentTransactionInput = {
  kind: 'adjustment';
  debitAccountId: string;
  creditAccountId: string;
  amount: Money;
  description?: string | null;
  referenceNumber?: string | null;
};

export type JournalEntryInput = {
  kind: 'journal_entry';
  lines: Array<{
    accountId: string;
    debit?: Money;
    credit?: Money;
    description?: string | null;
  }>;
  description?: string | null;
  referenceNumber?: string | null;
};

export type AnyFinancialTransactionInput =
  | InvoiceTransactionInput
  | PaymentTransactionInput
  | RefundTransactionInput
  | CreditTransactionInput
  | AdjustmentTransactionInput
  | JournalEntryInput;

function makeLine(input: {
  companyId: string;
  transactionId: string;
  accountId: string;
  side: LedgerSide;
  amount: Money;
  currency: string;
  description?: string | null;
}): LedgerEntry {
  const seed = `${input.companyId}:${input.transactionId}:${input.accountId}:${input.side}:${input.amount}:${input.currency}:${input.description ?? ''}`;
  return {
    companyId: input.companyId,
    transactionId: input.transactionId,
    lineId: stableId('line', seed),
    accountId: input.accountId,
    side: input.side,
    amount: input.amount,
    currency: input.currency,
    description: input.description ?? null,
  };
}

export function mapToLedgerTransaction(ctx: FinancialMutationContext, input: AnyFinancialTransactionInput): LedgerTransaction {
  const transactionId = stableId('txn', `${ctx.companyId}:${ctx.transactionNumber}:${ctx.idempotencyKey}`);

  if (input.kind === 'journal_entry') {
    const lines: LedgerEntry[] = [];
    for (const l of input.lines) {
      const debit = (l.debit ?? '0').toString();
      const credit = (l.credit ?? '0').toString();
      const hasDebit = debit !== '0' && debit !== '0.00';
      const hasCredit = credit !== '0' && credit !== '0.00';

      if (hasDebit === hasCredit) {
        throw new Error('Journal entry line must have exactly one of debit or credit');
      }

      lines.push(
        makeLine({
          companyId: ctx.companyId,
          transactionId,
          accountId: l.accountId,
          side: hasDebit ? 'DEBIT' : 'CREDIT',
          amount: hasDebit ? debit : credit,
          currency: ctx.currency,
          description: l.description ?? null,
        })
      );
    }

    return {
      companyId: ctx.companyId,
      transactionId,
      transactionNumber: ctx.transactionNumber,
      date: ctx.date,
      type: 'journal_entry',
      description: input.description ?? null,
      referenceNumber: input.referenceNumber ?? null,
      createdBy: ctx.actorUserId,
      idempotencyKey: ctx.idempotencyKey,
      currency: ctx.currency,
      lines,
    };
  }

  if (input.kind === 'invoice') {
    return {
      companyId: ctx.companyId,
      transactionId,
      transactionNumber: ctx.transactionNumber,
      date: ctx.date,
      type: 'invoice',
      description: input.description ?? null,
      referenceNumber: input.referenceNumber ?? null,
      createdBy: ctx.actorUserId,
      idempotencyKey: ctx.idempotencyKey,
      currency: ctx.currency,
      lines: [
        makeLine({
          companyId: ctx.companyId,
          transactionId,
          accountId: input.arAccountId,
          side: 'DEBIT',
          amount: input.amount,
          currency: ctx.currency,
          description: input.description ?? null,
        }),
        makeLine({
          companyId: ctx.companyId,
          transactionId,
          accountId: input.revenueAccountId,
          side: 'CREDIT',
          amount: input.amount,
          currency: ctx.currency,
          description: input.description ?? null,
        }),
      ],
    };
  }

  if (input.kind === 'payment') {
    return {
      companyId: ctx.companyId,
      transactionId,
      transactionNumber: ctx.transactionNumber,
      date: ctx.date,
      type: 'payment',
      description: input.description ?? null,
      referenceNumber: input.referenceNumber ?? null,
      createdBy: ctx.actorUserId,
      idempotencyKey: ctx.idempotencyKey,
      currency: ctx.currency,
      lines: [
        makeLine({
          companyId: ctx.companyId,
          transactionId,
          accountId: input.cashAccountId,
          side: 'DEBIT',
          amount: input.amount,
          currency: ctx.currency,
          description: input.description ?? null,
        }),
        makeLine({
          companyId: ctx.companyId,
          transactionId,
          accountId: input.arAccountId,
          side: 'CREDIT',
          amount: input.amount,
          currency: ctx.currency,
          description: input.description ?? null,
        }),
      ],
    };
  }

  if (input.kind === 'refund') {
    return {
      companyId: ctx.companyId,
      transactionId,
      transactionNumber: ctx.transactionNumber,
      date: ctx.date,
      type: 'refund',
      description: input.description ?? null,
      referenceNumber: input.referenceNumber ?? null,
      createdBy: ctx.actorUserId,
      idempotencyKey: ctx.idempotencyKey,
      currency: ctx.currency,
      lines: [
        makeLine({
          companyId: ctx.companyId,
          transactionId,
          accountId: input.arAccountId,
          side: 'DEBIT',
          amount: input.amount,
          currency: ctx.currency,
          description: input.description ?? null,
        }),
        makeLine({
          companyId: ctx.companyId,
          transactionId,
          accountId: input.cashAccountId,
          side: 'CREDIT',
          amount: input.amount,
          currency: ctx.currency,
          description: input.description ?? null,
        }),
      ],
    };
  }

  if (input.kind === 'credit') {
    return {
      companyId: ctx.companyId,
      transactionId,
      transactionNumber: ctx.transactionNumber,
      date: ctx.date,
      type: 'credit',
      description: input.description ?? null,
      referenceNumber: input.referenceNumber ?? null,
      createdBy: ctx.actorUserId,
      idempotencyKey: ctx.idempotencyKey,
      currency: ctx.currency,
      lines: [
        makeLine({
          companyId: ctx.companyId,
          transactionId,
          accountId: input.revenueAccountId,
          side: 'DEBIT',
          amount: input.amount,
          currency: ctx.currency,
          description: input.description ?? null,
        }),
        makeLine({
          companyId: ctx.companyId,
          transactionId,
          accountId: input.arAccountId,
          side: 'CREDIT',
          amount: input.amount,
          currency: ctx.currency,
          description: input.description ?? null,
        }),
      ],
    };
  }

  return {
    companyId: ctx.companyId,
    transactionId,
    transactionNumber: ctx.transactionNumber,
    date: ctx.date,
    type: 'adjustment',
    description: input.description ?? null,
    referenceNumber: input.referenceNumber ?? null,
    createdBy: ctx.actorUserId,
    idempotencyKey: ctx.idempotencyKey,
    currency: ctx.currency,
    lines: [
      makeLine({
        companyId: ctx.companyId,
        transactionId,
        accountId: input.debitAccountId,
        side: 'DEBIT',
        amount: input.amount,
        currency: ctx.currency,
        description: input.description ?? null,
      }),
      makeLine({
        companyId: ctx.companyId,
        transactionId,
        accountId: input.creditAccountId,
        side: 'CREDIT',
        amount: input.amount,
        currency: ctx.currency,
        description: input.description ?? null,
      }),
    ],
  };
}
