import { Request, Response, NextFunction } from 'express';
import { accountsService } from './accounts.service.js';
import { accountListQuerySchema } from './accounts.model.js';
import { ApiError } from '../../utils/errors.js';
import { StatusCodes } from 'http-status-codes';

export const accountsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      accountListQuerySchema.parse(req.query);
      const companyId = req.query.companyId as string;
      const accounts = await accountsService.list(companyId);
      res.status(StatusCodes.OK).json({ success: true, data: accounts });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const account = await accountsService.create(req.body);
      res.status(StatusCodes.CREATED).json({ success: true, data: account });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await accountsService.update(req.params.id, req.body);
      res.status(StatusCodes.OK).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },

  async adjustBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const amount = Number(req.body.amount);
      const result = await accountsService.adjustBalance(req.params.id, amount);
      res.status(StatusCodes.OK).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
