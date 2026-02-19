/**
 * Bookkeeping Rules - Placeholder Implementation
 * TODO: Implement full bookkeeping rules
 */

import { ApiError, ErrorCodes } from "../../utils/errorHandler.js";

export interface LedgerEntry {
  id: string;
  accountId: string;
  amount: number;
  debit: boolean;
  credit: boolean;
  description: string;
  reference?: string;
  timestamp: Date;
  userId: string;
  transactionId?: string;
}

export interface Transaction {
  id: string;
  entries: LedgerEntry[];
  description: string;
  reference?: string;
  timestamp: Date;
  userId: string;
  status: "pending" | "posted" | "reversed";
  metadata?: Record<string, any>;
}

export interface AccountBalance {
  accountId: string;
  debitBalance: number;
  creditBalance: number;
  netBalance: number;
  lastUpdated: Date;
}

export class BookkeepingRules {
  static validateTransaction(transaction: any): boolean {
    this.validateDoubleEntry(transaction);
    return true;
  }

  static validateDoubleEntry(transaction: Transaction): void {
    if (!transaction.entries || transaction.entries.length < 2) {
      throw new ApiError(
        "Transaction must have at least 2 entries",
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    const totalDebits = transaction.entries
      .filter((e: any) => e.debit)
      .reduce((sum: any, e: any) => sum + e.amount, 0);
    const totalCredits = transaction.entries
      .filter((e: any) => e.credit)
      .reduce((sum: any, e: any) => sum + e.amount, 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new ApiError(
        `Transaction is not balanced. Debits: ${totalDebits}, Credits: ${totalCredits}`,
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    for (const entry of transaction.entries) {
      if (entry.debit && entry.credit) {
        throw new ApiError(
          "Entry cannot be both debit and credit",
          400,
          ErrorCodes.VALIDATION_ERROR,
        );
      }
      if (!entry.debit && !entry.credit) {
        throw new ApiError(
          "Entry must be either debit or credit",
          400,
          ErrorCodes.VALIDATION_ERROR,
        );
      }
      if (entry.amount <= 0) {
        throw new ApiError(
          "Entry amounts must be positive",
          400,
          ErrorCodes.VALIDATION_ERROR,
        );
      }
    }
  }

  static createTransferTransaction(
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    description: string,
    userId: string,
    reference?: string,
  ): Transaction {
    const transactionId = this.generateTransactionId();
    const timestamp = new Date();
    const entries: LedgerEntry[] = [
      {
        id: this.generateEntryId(),
        accountId: fromAccountId,
        amount,
        debit: true,
        credit: false,
        description: `Transfer to ${toAccountId}`,
        reference,
        timestamp,
        userId,
        transactionId,
      },
      {
        id: this.generateEntryId(),
        accountId: toAccountId,
        amount,
        debit: false,
        credit: true,
        description: `Transfer from ${fromAccountId}`,
        reference,
        timestamp,
        userId,
        transactionId,
      },
    ];
    return {
      id: transactionId,
      entries,
      description,
      reference,
      timestamp,
      userId,
      status: "pending",
    };
  }

  static createFeeTransaction(
    accountId: string,
    feeAmount: number,
    feeAccountId: string,
    description: string,
    userId: string,
    reference?: string,
  ): Transaction {
    const transactionId = this.generateTransactionId();
    const timestamp = new Date();
    const entries: LedgerEntry[] = [
      {
        id: this.generateEntryId(),
        accountId,
        amount: feeAmount,
        debit: true,
        credit: false,
        description: "Transaction fee charged",
        reference,
        timestamp,
        userId,
        transactionId,
      },
      {
        id: this.generateEntryId(),
        accountId: feeAccountId,
        amount: feeAmount,
        debit: false,
        credit: true,
        description: "Fee revenue earned",
        reference,
        timestamp,
        userId,
        transactionId,
      },
    ];
    return {
      id: transactionId,
      entries,
      description,
      reference,
      timestamp,
      userId,
      status: "pending",
    };
  }

  static createInterestTransaction(
    accountId: string,
    interestAmount: number,
    interestPayableAccountId: string,
    description: string,
    userId: string,
    reference?: string,
  ): Transaction {
    const transactionId = this.generateTransactionId();
    const timestamp = new Date();
    const entries: LedgerEntry[] = [
      {
        id: this.generateEntryId(),
        accountId: interestPayableAccountId,
        amount: interestAmount,
        debit: true,
        credit: false,
        description: "Interest expense",
        reference,
        timestamp,
        userId,
        transactionId,
      },
      {
        id: this.generateEntryId(),
        accountId,
        amount: interestAmount,
        debit: false,
        credit: true,
        description: "Interest earned",
        reference,
        timestamp,
        userId,
        transactionId,
      },
    ];
    return {
      id: transactionId,
      entries,
      description,
      reference,
      timestamp,
      userId,
      status: "pending",
    };
  }

  static calculateBalance(entries: LedgerEntry[], accountId: string): AccountBalance {
    const accountEntries = entries.filter((e: any) => e.accountId === accountId);
    const debitBalance = accountEntries
      .filter((e: any) => e.debit)
      .reduce((sum: any, e: any) => sum + e.amount, 0);
    const creditBalance = accountEntries
      .filter((e: any) => e.credit)
      .reduce((sum: any, e: any) => sum + e.amount, 0);
    const netBalance = debitBalance - creditBalance;
    const lastUpdated =
      accountEntries.length > 0
        ? new Date(
            Math.max(...accountEntries.map((e: any) => e.timestamp.getTime())),
          )
        : new Date();
    return { accountId, debitBalance, creditBalance, netBalance, lastUpdated };
  }

  static validateAccountConstraints(
    transaction: Transaction,
    accountBalances: Map<string, AccountBalance>,
    accountTypes: Map<string, string>,
  ): void {
    for (const entry of transaction.entries) {
      const accountBalance = accountBalances.get(entry.accountId);
      const accountType = accountTypes.get(entry.accountId);
      if (!accountBalance || !accountType) {
        throw new ApiError(
          `Account ${entry.accountId} not found`,
          400,
          ErrorCodes.NOT_FOUND,
        );
      }
      if (
        (accountType === "ASSET" ||
          accountType === "CHECKING" ||
          accountType === "SAVINGS") &&
        entry.debit
      ) {
        const projectedBalance = accountBalance.netBalance - entry.amount;
        if (accountType === "CHECKING" && projectedBalance < -10000) {
          throw new ApiError(
            `Overdraft limit exceeded for account ${entry.accountId}`,
            400,
            ErrorCodes.VALIDATION_ERROR,
          );
        }
        if (accountType === "SAVINGS" && projectedBalance < 0) {
          throw new ApiError(
            `Insufficient funds in savings account ${entry.accountId}`,
            400,
            ErrorCodes.VALIDATION_ERROR,
          );
        }
      }
    }
  }

  static reverseTransaction(
    originalTransaction: Transaction,
    reason: string,
    userId: string,
  ): Transaction {
    const reversalId = this.generateTransactionId();
    const timestamp = new Date();
    const reversalEntries: LedgerEntry[] = originalTransaction.entries.map((entry: any) => ({
      ...entry,
      id: this.generateEntryId(),
      debit: entry.credit,
      credit: entry.debit,
      description: `Reversal: ${entry.description}`,
      timestamp,
      userId,
      transactionId: reversalId,
    }));
    return {
      id: reversalId,
      entries: reversalEntries,
      description: `Reversal of ${originalTransaction.id}: ${reason}`,
      reference: originalTransaction.id,
      timestamp,
      userId,
      status: "pending",
      metadata: {
        originalTransactionId: originalTransaction.id,
        reversalReason: reason,
      },
    };
  }

  static validateTrialBalance(accountBalances: AccountBalance[]): void {
    const totalDebits = accountBalances.reduce(
      (sum, bal) => sum + bal.debitBalance,
      0,
    );
    const totalCredits = accountBalances.reduce(
      (sum, bal) => sum + bal.creditBalance,
      0,
    );
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new ApiError(
        `Trial balance is not balanced. Total Debits: ${totalDebits}, Total Credits: ${totalCredits}`,
        500,
        ErrorCodes.INTERNAL_ERROR,
      );
    }
  }

  static createAdjustingEntry(
    accountId: string,
    amount: number,
    isDebit: boolean,
    description: string,
    userId: string,
    reference?: string,
  ): Transaction {
    const transactionId = this.generateTransactionId();
    const timestamp = new Date();
    const clearingAccountId = "ADJUSTMENT_CLEARING";
    const entries: LedgerEntry[] = [
      {
        id: this.generateEntryId(),
        accountId,
        amount,
        debit: isDebit,
        credit: !isDebit,
        description,
        reference,
        timestamp,
        userId,
        transactionId,
      },
      {
        id: this.generateEntryId(),
        accountId: clearingAccountId,
        amount,
        debit: !isDebit,
        credit: isDebit,
        description: `Clearing entry for: ${description}`,
        reference,
        timestamp,
        userId,
        transactionId,
      },
    ];
    return {
      id: transactionId,
      entries,
      description: `Adjusting entry: ${description}`,
      reference,
      timestamp,
      userId,
      status: "pending",
      metadata: { isAdjustingEntry: true },
    };
  }

  private static generateTransactionId(): string {
    return `TXN_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private static generateEntryId(): string {
    return `ENT_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}

export const TransactionTemplates = {
  bankTransfer: (
    fromAccount: string,
    toAccount: string,
    amount: number,
    userId: string,
    reference?: string,
  ) =>
    BookkeepingRules.createTransferTransaction(
      fromAccount,
      toAccount,
      amount,
      "Bank Transfer",
      userId,
      reference,
    ),

  atmWithdrawal: (
    account: string,
    amount: number,
    fee: number,
    feeAccount: string,
    userId: string,
  ) => {
    const transferTxn = BookkeepingRules.createTransferTransaction(
      account,
      "CASH_ATM",
      amount,
      "ATM Withdrawal",
      userId,
    );
    const feeTxn = BookkeepingRules.createFeeTransaction(
      account,
      fee,
      feeAccount,
      "ATM Fee",
      userId,
    );
    return { transferTxn, feeTxn };
  },

  interestBearingDeposit: (
    account: string,
    amount: number,
    interestAmount: number,
    interestPayableAccount: string,
    userId: string,
  ) => {
    const depositTxn = BookkeepingRules.createTransferTransaction(
      "CASH_DEPOSIT",
      account,
      amount,
      "Cash Deposit",
      userId,
    );
    const interestTxn = BookkeepingRules.createInterestTransaction(
      account,
      interestAmount,
      interestPayableAccount,
      "Interest Accrual",
      userId,
    );
    return { depositTxn, interestTxn };
  },
};
