import { Request, Response, NextFunction } from 'express';
import { CustomAPIError } from '../utils/errors';
import { logger } from '../utils/logger.js';

export const errorHandler = (
  err: Error | CustomAPIError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof CustomAPIError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  
  // Production-safe error logging
  if (process.env.NODE_ENV === 'production') {
    console.error('Server Error:', err.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
  
  console.error(err.stack);
  res.status(500).json({ error: err.message });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new CustomAPIError(404, `Not found - ${req.originalUrl}`);
  next(error);
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);
