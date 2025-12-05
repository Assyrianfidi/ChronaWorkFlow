import { Request, Response, NextFunction } from 'express';

/**
 * Custom API Error class that extends the built-in Error class
 * Used to create consistent error responses throughout the application
 */
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: any[];

  constructor(
    statusCode: number,
    message: string,
    isOperational = true,
    errors?: any[],
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Global error handling middleware
 * Handles all errors thrown in the application and sends appropriate responses
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Set default status code
  err.statusCode = err.statusCode || 500;
  
  // Handle development vs production environment
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      success: false,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // Production environment
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (err.name === 'CastError') {
      const message = `Resource not found. Invalid ${err.path}`;
      error = new ApiError(404, message);
    }

    // Handle duplicate field value
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const message = `Duplicate field value: ${field}. Please use another value.`;
      error = new ApiError(400, message);
    }

    // Handle validation errors
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors)
        .map((val: any) => val.message)
        .join('. ');
      error = new ApiError(400, message);
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
      const message = 'Invalid token. Please log in again.';
      error = new ApiError(401, message);
    }

    if (err.name === 'TokenExpiredError') {
      const message = 'Your token has expired. Please log in again.';
      error = new ApiError(401, message);
    }

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

/**
 * Middleware to handle 404 errors
 * Should be placed after all routes and before the error handler
 */
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new ApiError(404, `Not Found - ${req.originalUrl}`);
  next(error);
};

/**
 * Wrapper function to catch async/await errors in route handlers
 * @param fn The async function to wrap
 * @returns A function that handles errors and passes them to Express's next()
 */
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Array of error handling middleware functions
 * Can be used with app.use() to apply all error handling at once
 */
export const globalErrorHandler = [
  notFound,
  errorHandler
];

export const asyncHandler = <T extends Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: T, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};

export const validationErrorHandler = (error: any) => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err: any) => ({
      field: err.path,
      message: err.message,
    }));
    return new ApiError(400, 'Validation Error', true, errors);
  }
  return error;
};
