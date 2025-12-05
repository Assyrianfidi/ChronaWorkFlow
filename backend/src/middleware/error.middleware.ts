import { Request, Response, NextFunction } from 'express';
import { config } from '../config/config';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleValidationError = (err: any) => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

export const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

export const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

export const handlePrismaError = (err: any) => {
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return new AppError(`Duplicate ${field} value. Please use another value.`, 400);
  }
  if (err.code === 'P2025') {
    return new AppError('The requested record was not found.', 404);
  }
  return new AppError('Something went wrong with the database operation.', 500);
};

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Handle specific error types
  if (error.name === 'ValidationError') error = handleValidationError(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    error = handlePrismaError(error);
  }

  // Log error in development
  if (!config.isProduction) {
    console.error('Error 💥', error);
  }

  // Send response
  res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
    ...(!config.isProduction && { stack: error.stack }),
    ...(error.isOperational ? null : { message: 'Something went wrong!' }),
  });
};

export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
