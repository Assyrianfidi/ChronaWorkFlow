import { ApiError, ErrorCodes } from "../../utils/errorHandler.js";

/**
 * Domain validation framework for financial operations
 * Enforces business rules and data integrity
 */

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: any;
}

export interface AmountValidation {
  amount: number;
  currency: string;
  precision: number;
  minAmount?: number;
  maxAmount?: number;
}

export interface TransactionValidation {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  description?: string;
  reference?: string;
}

export class DomainValidator {
  /**
   * Validate monetary amount with currency rules
   */
  static validateAmount(validation: AmountValidation): ValidationResult {
    const errors: ValidationError[] = [];

    // Check if amount is a valid number
    if (typeof validation.amount !== "number" || isNaN(validation.amount)) {
      errors.push({
        field: "amount",
        code: "INVALID_AMOUNT",
        message: "Amount must be a valid number",
        value: validation.amount,
      });
    }

    // Check for negative amounts (debits should be handled separately)
    if (validation.amount < 0) {
      errors.push({
        field: "amount",
        code: "NEGATIVE_AMOUNT",
        message: "Amount cannot be negative",
        value: validation.amount,
      });
    }

    // Check minimum amount
    if (validation.minAmount && validation.amount < validation.minAmount) {
      errors.push({
        field: "amount",
        code: "BELOW_MINIMUM",
        message: `Amount must be at least ${validation.minAmount}`,
        value: validation.amount,
      });
    }

    // Check maximum amount
    if (validation.maxAmount && validation.amount > validation.maxAmount) {
      errors.push({
        field: "amount",
        code: "ABOVE_MAXIMUM",
        message: `Amount cannot exceed ${validation.maxAmount}`,
        value: validation.amount,
      });
    }

    // Check decimal precision based on currency
    const decimals = this.countDecimals(validation.amount);
    if (decimals > validation.precision) {
      errors.push({
        field: "amount",
        code: "INVALID_PRECISION",
        message: `Amount cannot have more than ${validation.precision} decimal places`,
        value: validation.amount,
      });
    }

    // Validate currency code
    if (!validation.currency || validation.currency.length !== 3) {
      errors.push({
        field: "currency",
        code: "INVALID_CURRENCY",
        message: "Currency must be a valid 3-letter code",
        value: validation.currency,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate transaction data
   */
  static validateTransaction(
    transaction: TransactionValidation,
  ): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate amount using amount validator
    const amountValidation = this.validateAmount({
      amount: transaction.amount,
      currency: transaction.currency,
      precision: this.getCurrencyPrecision(transaction.currency),
    });

    if (!amountValidation.isValid) {
      errors.push(...amountValidation.errors);
    }

    // Validate account IDs
    if (
      !transaction.fromAccountId ||
      typeof transaction.fromAccountId !== "string"
    ) {
      errors.push({
        field: "fromAccountId",
        code: "INVALID_ACCOUNT_ID",
        message: "From account ID is required and must be a string",
        value: transaction.fromAccountId,
      });
    }

    if (
      !transaction.toAccountId ||
      typeof transaction.toAccountId !== "string"
    ) {
      errors.push({
        field: "toAccountId",
        code: "INVALID_ACCOUNT_ID",
        message: "To account ID is required and must be a string",
        value: transaction.toAccountId,
      });
    }

    // Check for same account transfer
    if (transaction.fromAccountId === transaction.toAccountId) {
      errors.push({
        field: "toAccountId",
        code: "SAME_ACCOUNT_TRANSFER",
        message: "Cannot transfer to the same account",
        value: transaction.toAccountId,
      });
    }

    // Validate description length
    if (transaction.description && transaction.description.length > 500) {
      errors.push({
        field: "description",
        code: "DESCRIPTION_TOO_LONG",
        message: "Description cannot exceed 500 characters",
        value: transaction.description.length,
      });
    }

    // Validate reference format
    if (
      transaction.reference &&
      !/^[A-Za-z0-9\-_]{1,50}$/.test(transaction.reference)
    ) {
      errors.push({
        field: "reference",
        code: "INVALID_REFERENCE_FORMAT",
        message: "Reference must be alphanumeric (1-50 characters)",
        value: transaction.reference,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate account balance for transaction
   */
  static validateBalance(
    currentBalance: number,
    transactionAmount: number,
    accountType: string,
    allowOverdraft: boolean = false,
  ): ValidationResult {
    const errors: ValidationError[] = [];

    // Check if account can go negative
    const newBalance = currentBalance - transactionAmount;

    if (!allowOverdraft && newBalance < 0) {
      errors.push({
        field: "balance",
        code: "INSUFFICIENT_FUNDS",
        message: `Insufficient funds. Current: ${currentBalance}, Required: ${transactionAmount}`,
        value: { currentBalance, transactionAmount, newBalance },
      });
    }

    // Check overdraft limits if allowed
    if (allowOverdraft && newBalance < -10000) {
      // $10,000 overdraft limit
      errors.push({
        field: "balance",
        code: "OVERDRAFT_LIMIT_EXCEEDED",
        message: "Overdraft limit exceeded",
        value: { newBalance, limit: -10000 },
      });
    }

    // Special rules for different account types
    if (accountType === "SAVINGS" && newBalance < 0) {
      errors.push({
        field: "balance",
        code: "SAVINGS_NEGATIVE_BALANCE",
        message: "Savings accounts cannot have negative balance",
        value: newBalance,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate cross-currency transaction
   */
  static validateCrossCurrencyTransaction(
    fromCurrency: string,
    toCurrency: string,
    amount: number,
    exchangeRate?: number,
  ): ValidationResult {
    const errors: ValidationError[] = [];

    // If same currency, no exchange rate needed
    if (fromCurrency === toCurrency) {
      return { isValid: true, errors: [] };
    }

    // Validate exchange rate is provided for different currencies
    if (!exchangeRate || exchangeRate <= 0) {
      errors.push({
        field: "exchangeRate",
        code: "INVALID_EXCHANGE_RATE",
        message: "Exchange rate is required and must be positive",
        value: exchangeRate,
      });
    }

    // Check if exchange rate is reasonable (between 0.0001 and 10000)
    if (exchangeRate && (exchangeRate < 0.0001 || exchangeRate > 10000)) {
      errors.push({
        field: "exchangeRate",
        code: "UNREASONABLE_EXCHANGE_RATE",
        message: "Exchange rate seems unreasonable",
        value: exchangeRate,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate transaction timing rules
   */
  static validateTransactionTiming(
    lastTransactionTime?: Date,
    amount?: number,
  ): ValidationResult {
    const errors: ValidationError[] = [];

    if (!lastTransactionTime) {
      return { isValid: true, errors: [] };
    }

    const now = new Date();
    const timeSinceLastTransaction =
      now.getTime() - lastTransactionTime.getTime();
    const minutesSinceLastTransaction = timeSinceLastTransaction / (1000 * 60);

    // Rule: No transactions within 1 minute for amounts > $1000
    if (amount && amount > 1000 && minutesSinceLastTransaction < 1) {
      errors.push({
        field: "timing",
        code: "TOO_FREQUENT_HIGH_VALUE",
        message:
          "High-value transactions require at least 1 minute between them",
        value: { minutesSinceLastTransaction, amount },
      });
    }

    // Rule: Maximum 10 transactions per minute
    if (minutesSinceLastTransaction < 0.1) {
      // Less than 6 seconds
      errors.push({
        field: "timing",
        code: "TOO_FREQUENT",
        message: "Transactions must be at least 6 seconds apart",
        value: minutesSinceLastTransaction,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Throw ApiError if validation fails
   */
  static validateOrThrow(validation: ValidationResult): void {
    if (!validation.isValid) {
      const errorMessages = validation.errors
        .map((e: any) => `${e.field}: ${e.message}`)
        .join("; ");
      throw new ApiError(
        `Validation failed: ${errorMessages}`,
        400,
        ErrorCodes.VALIDATION_ERROR,
        true,
        { validationErrors: validation.errors },
      );
    }
  }

  /**
   * Helper methods
   */
  private static countDecimals(value: number): number {
    const str = value.toString();
    if (str.indexOf(".") !== -1 && str.indexOf("e-") === -1) {
      return str.split(".")[1].length;
    } else if (str.indexOf("e-") !== -1) {
      const parts = str.split("e-");
      return parseInt(parts[1], 10);
    }
    return 0;
  }

  private static getCurrencyPrecision(currency: string): number {
    // Common currency precisions
    const precisions: Record<string, number> = {
      USD: 2,
      EUR: 2,
      GBP: 2,
      JPY: 0,
      CHF: 2,
      CAD: 2,
      AUD: 2,
      CNY: 2,
      INR: 2,
      BTC: 8,
    };

    // Use hasOwnProperty to check if the currency exists, since 0 is falsy
    return precisions.hasOwnProperty(currency) ? precisions[currency] : 2; // Default to 2 decimal places
  }
}

/**
 * Pre-built validation rule sets
 */
export const ValidationRules = {
  // Standard transaction validation
  standardTransaction: (transaction: TransactionValidation) => {
    const result = DomainValidator.validateTransaction(transaction);
    DomainValidator.validateOrThrow(result);
  },

  // High-value transaction validation (additional checks)
  highValueTransaction: (
    transaction: TransactionValidation,
    lastTransactionTime?: Date,
  ) => {
    // First validate standard rules
    DomainValidator.validateOrThrow(
      DomainValidator.validateTransaction(transaction),
    );

    // Additional high-value checks
    if (transaction.amount > 10000) {
      const timingValidation = DomainValidator.validateTransactionTiming(
        lastTransactionTime,
        transaction.amount,
      );
      DomainValidator.validateOrThrow(timingValidation);
    }
  },

  // International transfer validation
  internationalTransfer: (
    fromCurrency: string,
    toCurrency: string,
    amount: number,
    exchangeRate?: number,
  ) => {
    const crossCurrencyValidation =
      DomainValidator.validateCrossCurrencyTransaction(
        fromCurrency,
        toCurrency,
        amount,
        exchangeRate,
      );
    DomainValidator.validateOrThrow(crossCurrencyValidation);
  },
};
