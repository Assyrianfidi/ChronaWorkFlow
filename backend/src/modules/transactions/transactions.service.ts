import { prisma } from "../../utils/prisma";
import {
  transactionCreateSchema,
  transactionListSchema,
  TransactionCreateInput,
  TransactionLineInput,
  toDecimal,
} from "./transactions.model";
import { ApiError } from "../../utils/errors";
import { StatusCodes } from "http-status-codes";

export class TransactionsService {
  async list(companyId: string, limit: number) {
    return prisma.transaction.findMany({
      where: { companyId },
      orderBy: { date: "desc" },
      include: { lines: true },
      take: limit,
    });
  }

  private validateBalance(lines: TransactionLineInput[]) {
    const totals = lines.reduce(
      (acc, line) => ({
        debits: acc.debits + parseFloat(line.debit),
        credits: acc.credits + parseFloat(line.credit),
      }),
      { debits: 0, credits: 0 },
    );

    if (Math.abs(totals.debits - totals.credits) > 0.01) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Transaction must be balanced",
      );
    }
  }

  async create(payload: TransactionCreateInput, createdBy: string) {
    const parsed = transactionCreateSchema.parse(payload);
    this.validateBalance(parsed.lines);

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          companyId: parsed.companyId,
          transactionNumber: parsed.transactionNumber,
          date: new Date(parsed.date),
          type: parsed.type,
          totalAmount: toDecimal(parsed.totalAmount),
          description: parsed.description,
        },
      });

      await Promise.all(
        parsed.lines.map((line) =>
          tx.transactionLine.create({
            data: {
              transactionId: transaction.id,
              accountId: line.accountId,
              debit: toDecimal(line.debit),
              credit: toDecimal(line.credit),
              description: line.description,
            },
          }),
        ),
      );

      return transaction;
    });
  }
}

export const transactionsService = new TransactionsService();
