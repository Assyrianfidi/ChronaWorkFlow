import { Request, Response, NextFunction } from 'express';
import { ApiError, CustomAPIError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (
  err: Error | CustomAPIError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(
    `${(err as any).statusCode || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
  );

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      status: "fail",
      message: "Invalid token. Please log in again.",
    });
  }

  if (
    err instanceof ApiError ||
    err instanceof CustomAPIError ||
    typeof (err as any).statusCode === "number"
  ) {
    return res
      .status((err as any).statusCode || 500)
      .json({ status: "error", message: err.message });
  }
  
  // Production-safe error logging
  if (process.env.NODE_ENV === 'production') {
    console.error('Server Error:', err.message);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
  
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: err.message });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new CustomAPIError(404, `Not found - ${req.originalUrl}`);
  next(error);
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);
