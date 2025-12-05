import { prisma } from '../../utils/prisma.js';
import { accountCreateSchema, accountUpdateSchema, AccountCreateInput, AccountUpdateInput } from './accounts.model.js';
import { ApiError } from '../../utils/errors.js';
import { StatusCodes } from 'http-status-codes';
import { Decimal } from '@prisma/client/runtime/library';

export class AccountsService {
  async list(companyId: string) {
    return prisma.account.findMany({
      where: { companyId },
      orderBy: { code: 'asc' },
    });
  }

  async create(payload: AccountCreateInput) {
    const parsed = accountCreateSchema.parse(payload);
    return prisma.account.create({ 
      data: {
        companyId: parsed.companyId,
        code: parsed.code,
        name: parsed.name,
        type: parsed.type,
        parentId: parsed.parentId,
        balance: parsed.balance ? new Decimal(parsed.balance) : new Decimal(0),
        description: parsed.description,
        isActive: parsed.isActive ?? true
      } 
    });
  }

  async update(id: string, payload: AccountUpdateInput) {
    if (!payload || Object.keys(payload).length === 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'No update payload provided');
    }
    const parsed = accountUpdateSchema.parse(payload);
    return prisma.account.update({
      where: { id },
      data: { ...parsed, updatedAt: new Date().toISOString() } as any,
    });
  }

  async adjustBalance(id: string, amount: number) {
    if (Number.isNaN(amount)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'amount must be a number');
    }
    return prisma.account.update({
      where: { id },
      data: { balance: { increment: Number(amount.toFixed(2)) } as any },
    });
  }
}

export const accountsService = new AccountsService();
