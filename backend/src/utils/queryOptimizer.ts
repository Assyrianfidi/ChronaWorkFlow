import { prisma, PrismaClientSingleton } from '../lib/prisma';

/**
 * Query optimization utilities for database performance
 */
export class QueryOptimizer {
  private static prisma = prisma;

  /**
   * Batch fetch related entities to avoid N+1 queries
   */
  static async batchFetchTransactions(
    transactionIds: string[],
    includeRelations = true,
  ) {
    const startTime = Date.now();

    try {
      if (includeRelations) {
        const transactions = await this.prisma.transaction.findMany({
          where: { id: { in: transactionIds } },
        });

        const duration = Date.now() - startTime;
        console.log("Batch fetch completed", {
          transactionCount: transactions.length,
          duration: `${duration}ms`,
          queryType: "batchFetchTransactions",
        });

        return transactions;
      } else {
        const transactions = await this.prisma.transaction.findMany({
          where: { id: { in: transactionIds } },
        });

        const duration = Date.now() - startTime;
        console.log("Batch fetch completed", {
          transactionCount: transactions.length,
          duration: `${duration}ms`,
          queryType: "batchFetchTransactionsSimple",
        });

        return transactions;
      }
    } catch (error) {
      console.error("Batch fetch failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        transactionCount: transactionIds.length,
      });
      throw error;
    }
  }

  /**
   * Optimized account balance calculation
   */
  static async getAccountBalances(accountIds: string[], asOfDate?: Date) {
    const startTime = Date.now();

    try {
      // Use TransactionLine to get account balances
      const dateFilter = asOfDate ? { lte: asOfDate } : undefined;

      const balances = await this.prisma.transactionLine.groupBy({
        by: ["accountId"],
        where: {
          accountId: { in: accountIds },
          transaction: {
            date: dateFilter,
          },
        },
        _sum: {
          debit: true,
          credit: true,
        },
        _count: {
          id: true,
        },
      });

      const duration = Date.now() - startTime;
      console.log("Account balances calculated", {
        accountCount: balances.length,
        duration: `${duration}ms`,
        queryType: "getAccountBalances",
      });

      return balances;
    } catch (error) {
      console.error("Account balance calculation failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        accountCount: accountIds.length,
      });
      throw error;
    }
  }

  /**
   * Paginated transaction listing with optimized queries
   */
  static async getTransactionsPaginated(
    companyId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      accountId?: string;
      minAmount?: number;
      maxAmount?: number;
    },
  ) {
    const startTime = Date.now();
    const skip = (page - 1) * limit;

    try {
      const whereClause: any = { companyId };

      if (filters) {
        if (filters.startDate || filters.endDate) {
          whereClause.date = {};
          if (filters.startDate) whereClause.date.gte = filters.startDate;
          if (filters.endDate) whereClause.date.lte = filters.endDate;
        }
        if (filters.accountId) {
          whereClause.lines = {
            some: { accountId: filters.accountId },
          };
        }
        if (filters.minAmount || filters.maxAmount) {
          whereClause.totalAmount = {};
          if (filters.minAmount)
            whereClause.totalAmount.gte = filters.minAmount;
          if (filters.maxAmount)
            whereClause.totalAmount.lte = filters.maxAmount;
        }
      }

      const [transactions, total] = await Promise.all([
        this.prisma.transaction.findMany({
          where: whereClause,
          include: {
            lines: {
              include: {
                account: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                  },
                },
              },
            },
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { date: "desc" },
          skip,
          take: limit,
        }),
        this.prisma.transaction.count({ where: whereClause }),
      ]);

      const duration = Date.now() - startTime;
      console.log("Paginated transactions fetched", {
        companyId,
        page,
        limit,
        total,
        duration: `${duration}ms`,
        queryType: "getTransactionsPaginated",
      });

      return {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error("Paginated transactions fetch failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        companyId,
        page,
        limit,
      });
      throw error;
    }
  }

  /**
   * Transaction batch processing for bulk operations
   */
  static async processTransactionBatch(
    transactions: any[],
    batchSize: number = 50,
  ) {
    const startTime = Date.now();
    const results = [];

    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);

      try {
        const batchResults = await this.prisma.$transaction(
          batch.map((tx) =>
            this.prisma.transaction.create({
              data: {
                transactionNumber: tx.transactionNumber,
                date: tx.date,
                type: tx.type,
                totalAmount: tx.totalAmount,
                description: tx.description,
                companyId: tx.companyId,
                lines: tx.lines || [],
              },
            }),
          ),
        );

        results.push(...batchResults);

        console.log("Transaction batch processed", {
          batchNumber: Math.floor(i / batchSize) + 1,
          batchSize: batch.length,
          processedCount: results.length,
        });
      } catch (error) {
        console.error("Transaction batch failed", {
          error: error instanceof Error ? error.message : "Unknown error",
          batchNumber: Math.floor(i / batchSize) + 1,
          batchSize: batch.length,
        });
        throw error;
      }
    }

    const duration = Date.now() - startTime;
    console.log("All transaction batches processed", {
      totalTransactions: transactions.length,
      totalProcessed: results.length,
      duration: `${duration}ms`,
      batchesCount: Math.ceil(transactions.length / batchSize),
    });

    return results;
  }
}
