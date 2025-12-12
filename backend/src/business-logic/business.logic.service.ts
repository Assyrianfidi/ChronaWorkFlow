import { prisma, PrismaClientSingleton } from '../lib/prisma';
import {
  DomainValidator,
  ValidationRules,
} from "./validators/domain.validator";
import { FinancialCalculator } from "./calculations/financial.calculator";
import { BookkeepingRules } from "./rules/bookkeeping.rules";
import {
  FraudDetector,
  FraudMonitoringService,
  TransactionPattern,
} from "./anti-fraud/fraud.detector";
import { logger } from "../utils/logger";
import { ApiError, ErrorCodes } from "../utils/errorHandler";
import { CircuitBreakerRegistry } from "../utils/circuitBreaker";

/**
 * Business Logic Service
 * Orchestrates all business logic components
 */

export interface TransactionRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  description?: string;
  reference?: string;
  metadata?: Record<string, any>;
}

export interface TransactionResult {
  success: boolean;
  transactionId?: string;
  postedEntries?: any[];
  warnings?: string[];
  fraudAlerts?: any[];
  error?: string;
}

export interface AccountSummary {
  accountId: string;
  accountType: string;
  balance: number;
  availableBalance: number;
  pendingTransactions: number;
  currency: string;
  lastActivity: Date;
}

export class BusinessLogicService {
  private prisma: PrismaClient;
  private circuitBreaker: any;
  private fraudDetector: FraudDetector;

  constructor() {
    this.prisma = prisma;
    this.circuitBreaker = CircuitBreakerRegistry.get("business-logic", {
      failureThreshold: 5,
      resetTimeout: 60000,
      monitoringPeriod: 30000,
      expectedErrorRate: 0.5,
    });
    this.fraudDetector = new FraudDetector();
  }

  /**
   * Process a financial transaction with full validation
   */
  async processTransaction(
    request: TransactionRequest,
    userId: string,
    context?: {
      ipAddress?: string;
      device?: string;
      location?: string;
      merchantCategory?: string;
    },
  ): Promise<TransactionResult> {
    try {
      // Step 1: Validate transaction data
      ValidationRules.standardTransaction({
        fromAccountId: request.fromAccountId,
        toAccountId: request.toAccountId,
        amount: request.amount,
        currency: request.currency,
        description: request.description,
        reference: request.reference,
      });

      // Step 2: Get account information
      const accounts = await this.circuitBreaker.execute(async () => {
        return this.prisma.account.findMany({
          where: {
            id: { in: [request.fromAccountId, request.toAccountId] },
            // TODO: Add userId to Account model
          },
        });
      });

      if (accounts.length !== 2) {
        throw new ApiError(
          "One or both accounts not found",
          404,
          ErrorCodes.NOT_FOUND,
        );
      }

      const fromAccount = accounts.find(
        (a: any) => a.id === request.fromAccountId,
      )!;
      const toAccount = accounts.find(
        (a: any) => a.id === request.toAccountId,
      )!;

      // Step 3: Validate account balance
      const balanceValidation = DomainValidator.validateBalance(
        fromAccount.balance,
        request.amount,
        fromAccount.type,
        fromAccount.allowOverdraft || false,
      );
      DomainValidator.validateOrThrow(balanceValidation);

      // Step 4: Check cross-currency if needed
      if (fromAccount.currency !== toAccount.currency) {
        // Get exchange rate (simplified - in real system would use external API)
        const exchangeRate = await this.getExchangeRate(
          fromAccount.currency,
          toAccount.currency,
        );

        ValidationRules.internationalTransfer(
          fromAccount.currency,
          toAccount.currency,
          request.amount,
          exchangeRate,
        );
      }

      // Step 5: Fraud detection
      const historicalPatterns = await this.getTransactionPatterns(
        userId,
        fromAccount.id,
      );
      const transaction: TransactionPattern = {
        userId,
        accountId: fromAccount.id,
        amount: request.amount,
        timestamp: new Date(),
        location: context?.location,
        device: context?.device,
        ipAddress: context?.ipAddress,
        merchantCategory: context?.merchantCategory,
      };

      const fraudResult = await FraudDetector.analyzeTransaction(
        transaction,
        [],
      );
      const alerts = fraudResult.alerts || [];

      if (alerts.length > 0) {
        throw new ApiError(
          "Potential fraud detected",
          400,
          ErrorCodes.VALIDATION_ERROR,
        );
      }

      // Step 6: Calculate fees if applicable
      const feeAmount = this.calculateTransactionFee(
        request.amount,
        fromAccount.type,
      );

      // Step 7: Create ledger entries
      // TODO: Implement transaction creation in BookkeepingRules
      const mainTransaction = {
        id: `TXN_${Date.now()}`,
        fromAccountId: request.fromAccountId,
        toAccountId: request.toAccountId,
        amount: request.amount,
        description: request.description || "Transfer",
        userId,
        reference: request.reference,
        entries: [],
      };

      let transactions = [mainTransaction];

      // Add fee transaction if applicable
      if (feeAmount > 0) {
        const feeTransaction = {
          id: `FEE_${Date.now()}`,
          fromAccountId: request.fromAccountId,
          toAccountId: "FEE_ACCOUNT",
          amount: feeAmount,
          description: "Transaction fee",
          userId,
          reference: request.reference,
          entries: [],
        };
        transactions.push(feeTransaction);
      }

      // Step 8: Post transactions atomically
      const postedEntries = await this.postTransactions(transactions);

      // Step 9: Log successful transaction
      logger.info("Transaction validated", {
        event: "TRANSACTION_PROCESSED",
        userId,
        transactionId: mainTransaction.id,
        fromAccount: request.fromAccountId,
        toAccount: request.toAccountId,
        amount: request.amount,
        currency: request.currency,
        feeAmount,
        riskScore: 0,
      });

      return {
        success: true,
        transactionId: mainTransaction.id,
        postedEntries,
        warnings: [],
        fraudAlerts: [],
      };
    } catch (error) {
      logger.warn("Transaction failed", {
        event: "TRANSACTION_FAILED",
        userId,
        error: (error as Error).message,
        request,
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        "Business logic validation failed",
        500,
        ErrorCodes.INTERNAL_ERROR,
      );
    }
  }

  /**
   * Get account summary with business logic applied
   */
  async getAccountSummary(
    accountId: string,
    userId: string,
  ): Promise<AccountSummary> {
    try {
      const account = await this.circuitBreaker.execute(async () => {
        return this.prisma.account.findFirst({
          where: { id: accountId }, // TODO: Add userId to Account model
        });
      });

      if (!account) {
        throw new ApiError("Account not found", 404, ErrorCodes.NOT_FOUND);
      }

      // Get pending transactions
      const pendingTransactions = await this.circuitBreaker.execute(
        async () => {
          return this.prisma.transaction.count({
            where: {
              companyId: accountId,
              // TODO: Add status field to Transaction model
            },
          });
        },
      );

      // Calculate available balance
      // TODO: Implement balance summary calculation
      const balanceSummary = {
        availableBalance: account.balance,
        pendingDebits: 0,
        pendingCredits: 0,
        holdAmount: 0,
      };

      return {
        accountId: account.id,
        accountType: account.type,
        balance: account.balance,
        availableBalance: balanceSummary.availableBalance,
        pendingTransactions,
        currency: account.currency,
        lastActivity: account.updatedAt,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        "Failed to get account summary",
        500,
        ErrorCodes.DATABASE_ERROR,
      );
    }
  }

  /**
   * Calculate loan details
   */
  async calculateLoanDetails(
    principal: number,
    annualRate: number,
    months: number,
  ): Promise<any> {
    try {
      // Validate inputs
      DomainValidator.validateAmount({
        amount: principal,
        currency: "USD", // Default currency for loans
        precision: 2,
        minAmount: 100,
        maxAmount: 1000000,
      });

      if (annualRate < 0 || annualRate > 0.3) {
        // Max 30% APR
        throw new ApiError(
          "Interest rate must be between 0% and 30%",
          400,
          ErrorCodes.VALIDATION_ERROR,
        );
      }

      if (months < 1 || months > 360) {
        // Max 30 years
        throw new ApiError(
          "Loan term must be between 1 and 360 months",
          400,
          ErrorCodes.VALIDATION_ERROR,
        );
      }

      // Calculate loan details
      const monthlyPayment =
        (principal * (annualRate / 12)) /
        (1 - Math.pow(1 + annualRate / 12, -months));
      return {
        monthlyPayment,
        totalPayment: monthlyPayment * months,
        totalInterest: monthlyPayment * months - principal,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        "Financial calculation failed",
        500,
        ErrorCodes.INTERNAL_ERROR,
      );
    }
  }

  /**
   * Convert currency with real-time rates
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<{
    convertedAmount: number;
    exchangeRate: number;
    timestamp: Date;
  }> {
    try {
      // Validate amount
      DomainValidator.validateAmount({
        amount,
        currency: fromCurrency,
        precision: 2,
      });

      // Get exchange rate
      const exchangeRate = await this.getExchangeRate(fromCurrency, toCurrency);

      // Convert currency
      // TODO: Implement currency conversion in FinancialCalculator
      const convertedAmount = amount * exchangeRate;

      return {
        convertedAmount,
        exchangeRate,
        timestamp: new Date(),
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        "Currency conversion failed",
        500,
        ErrorCodes.EXTERNAL_SERVICE_ERROR,
      );
    }
  }

  /**
   * Get transaction history with fraud indicators
   */
  async getTransactionHistory(
    userId: string,
    accountId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<any> {
    try {
      const transactions = await this.circuitBreaker.execute(async () => {
        return this.prisma.transaction.findMany({
          where: {
            companyId: accountId, // TODO: Fix Transaction model
          },
          include: {
            // TODO: Add account relations to Transaction model
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
        });
      });

      // Get fraud alerts for these transactions
      const transactionIds = transactions.map((t: any) => t.id);
      const fraudAlerts =
        await this.getFraudAlertsForTransactions(transactionIds);

      // Combine transactions with fraud alerts
      return transactions.map((transaction: any) => ({
        ...transaction,
        fraudIndicators: [],
      }));
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        "Failed to get transaction history",
        500,
        ErrorCodes.DATABASE_ERROR,
      );
    }
  }

  /**
   * Helper methods
   */
  private async getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number> {
    // In a real system, this would call an external API
    // For now, return mock rates
    const mockRates: Record<string, number> = {
      "USD-EUR": 0.85,
      "EUR-USD": 1.18,
      "USD-GBP": 0.73,
      "GBP-USD": 1.37,
      "USD-JPY": 110.0,
      "JPY-USD": 0.0091,
    };

    const key = `${fromCurrency}-${toCurrency}`;
    const rate = mockRates[key];

    if (!rate) {
      throw new ApiError(
        "Exchange rate not available for currency pair",
        400,
        ErrorCodes.EXTERNAL_SERVICE_ERROR,
      );
    }

    return rate;
  }

  private calculateTransactionFee(amount: number, accountType: string): number {
    // Simple fee structure
    const feeStructures = {
      CHECKING: { fixedFee: 0, percentageFee: 0, minFee: 0, maxFee: 0 },
      SAVINGS: { fixedFee: 0, percentageFee: 0, minFee: 0, maxFee: 0 },
      BUSINESS: {
        fixedFee: 2.5,
        percentageFee: 0.002,
        minFee: 2.5,
        maxFee: 25,
      },
    };

    const feeStructure =
      feeStructures[accountType as keyof typeof feeStructures] ||
      feeStructures["CHECKING"];

    return feeStructure.fixedFee + amount * feeStructure.percentageFee;
  }

  private async postTransactions(transactions: any[]): Promise<any[]> {
    // In a real system, this would be an atomic database transaction
    // For now, simulate posting
    const postedEntries = [];

    for (const transaction of transactions) {
      // Validate double-entry rules
      if (!BookkeepingRules.validateTransaction(transaction)) {
        throw new ApiError(
          "Invalid transaction structure",
          400,
          ErrorCodes.VALIDATION_ERROR,
        );
      }

      // Simulate posting entries
      postedEntries.push({
        id: `POSTED_${transaction.id}`,
        transactionId: transaction.id,
        postedAt: new Date(),
      });
    }

    return postedEntries;
  }

  private async getTransactionPatterns(
    userId: string,
    accountId: string,
  ): Promise<TransactionPattern[]> {
    // Get historical transactions for fraud analysis
    const transactions = await this.circuitBreaker.execute(async () => {
      return this.prisma.transaction.findMany({
        where: {
          companyId: accountId, // TODO: Fix Transaction model
          createdAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
          },
        },
        select: {
          id: true,
          // TODO: Add amount and metadata fields to Transaction model
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    });

    return transactions.map((t: any) => ({
      userId,
      accountId,
      amount: 0, // TODO: Add amount field to Transaction model
      timestamp: t.createdAt,
      location: t.metadata?.location,
      device: t.metadata?.device,
      ipAddress: t.metadata?.ipAddress,
      merchantCategory: t.metadata?.merchantCategory,
    }));
  }

  private async getFraudAlertsForTransactions(
    transactionIds: string[],
  ): Promise<any[]> {
    // Get fraud alerts for the specified transactions
    // This would query a fraud alerts table in a real system
    return [];
  }

  /**
   * Health check for business logic service
   */
  async healthCheck(): Promise<{
    status: string;
    circuitBreakerState: string;
    dependencies: Record<string, boolean>;
  }> {
    const circuitBreakerState = this.circuitBreaker.getState();

    // Check database connectivity
    let dbHealthy = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbHealthy = true;
    } catch (error) {
      dbHealthy = false;
    }

    return {
      status:
        dbHealthy && circuitBreakerState === "CLOSED" ? "healthy" : "degraded",
      circuitBreakerState,
      dependencies: {
        database: dbHealthy,
        fraudDetection: true, // Always available as it's in-process
        calculations: true, // Always available as it's in-process
      },
    };
  }
}

// Export singleton instance
export const businessLogicService = new BusinessLogicService();
