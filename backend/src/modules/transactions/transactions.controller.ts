import { Request, Response, NextFunction } from 'express';
import { transactionsService } from './transactions.service.js';
import { transactionListSchema } from './transactions.model.js';
import { StatusCodes } from 'http-status-codes';

export const transactionsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = transactionListSchema.parse(req.query);
      const data = await transactionsService.list(parsed.companyId, parsed.limit);
      res.status(StatusCodes.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = typeof req.user?.id === 'string' ? req.user.id : String(req.user?.id);
      const transaction = await transactionsService.create(req.body, userId);
      res.status(StatusCodes.CREATED).json({ success: true, data: transaction });
    } catch (error) {
      next(error);
    }
  },
};
