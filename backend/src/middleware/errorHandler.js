const { Prisma } = require('@prisma/client');
const { logger } = require('../utils/logger');
const { NODE_ENV } = require('../config');

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log the error
  logger.error(
    `${err.statusCode || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip} - Stack: ${err.stack}`
  );

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle specific Prisma errors
    switch (err.code) {
      case 'P2002':
        // Unique constraint violation
        error = new ApiError(400, `Duplicate field value: ${err.meta?.target?.[0] || 'field'}`);
        break;
      case 'P2025':
        // Record not found
        error = new ApiError(404, 'Record not found');
        break;
      default:
        error = new ApiError(400, 'Database error');
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    // Handle validation errors
    const message = 'Validation error';
    error = new ApiError(400, message);
  } else if (err.name === 'JsonWebTokenError') {
    // Handle JWT errors
    error = new ApiError(401, 'Invalid token');
  } else if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Token expired');
  } else if (err.name === 'ValidationError') {
    // Handle Mongoose validation errors (if using Mongoose)
    const message = Object.values(err.errors).map(val => val.message);
    error = new ApiError(400, message);
  } else if (err.name === 'CastError') {
    // Handle invalid ObjectId
    error = new ApiError(400, 'Resource not found');
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    message: error.message || 'Server Error',
    ...(NODE_ENV === 'development' && { stack: error.stack }),
  };

  // Don't leak error details in production
  if (NODE_ENV === 'production' && !error.isOperational) {
    response.message = 'Something went wrong';
  }

  res.status(statusCode).json(response);
};

// Catch 404 and forward to error handler
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = {
  errorHandler,
  notFound,
  ApiError,
};
