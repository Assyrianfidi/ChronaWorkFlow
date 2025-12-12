import { Response } from 'express';

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    
    this.name = this.constructor.name;
  }
}

/**
 * Legacy ApiError for backward compatibility
 */
export class ApiError extends AppError {
  constructor(statusCode: number, message: string, isOperational = true) {
    super(message, statusCode, 'API_ERROR', isOperational);
  }
}

/**
 * 404 Not Found Error
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, 404, 'NOT_FOUND', true, details);
  }
}

/**
 * 400 Bad Request / Validation Error
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

/**
 * Database Error
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, 500, 'DATABASE_ERROR', true, details);
  }
}

/**
 * Authentication Error
 */
export class AuthError extends AppError {
  constructor(message: string = 'Authentication failed', details?: any) {
    super(message, 401, 'AUTH_ERROR', true, details);
  }
}

/**
 * Authorization Error
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', details?: any) {
    super(message, 403, 'AUTHORIZATION_ERROR', true, details);
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: any) {
    super(message, 409, 'CONFLICT_ERROR', true, details);
  }
}

/**
 * Rate Limit Error (429)
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', details?: any) {
    super(message, 429, 'RATE_LIMIT_ERROR', true, details);
  }
}

/**
 * Service Unavailable Error (503)
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable', details?: any) {
    super(message, 503, 'SERVICE_UNAVAILABLE', true, details);
  }
}

/**
 * Error response interface
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  statusCode: number,
  details?: any,
  requestId?: string
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      statusCode,
      details,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

/**
 * Check if error is operational
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Convert error to AppError if possible
 */
export function toAppError(error: any): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  // Handle Prisma errors
  if (error?.code?.startsWith('P')) {
    return new DatabaseError(`Database error: ${error.message}`, {
      prismaCode: error.code,
      target: error.meta?.target,
    });
  }
  
  // Handle JWT errors
  if (error?.name === 'JsonWebTokenError') {
    return new AuthError('Invalid token');
  }
  
  if (error?.name === 'TokenExpiredError') {
    return new AuthError('Token expired');
  }
  
  // Handle validation errors
  if (error?.name === 'ValidationError') {
    return new ValidationError(error.message, error.details);
  }
  
  // Default to internal server error
  return new AppError(
    error?.message || 'Internal server error',
    error?.statusCode || 500,
    error?.code || 'INTERNAL_ERROR',
    true,
    error?.details
  );
}

/**
 * Global error handler middleware
 */
export const errorHandler = (err: any, req: any, res: Response, next: any) => {
  // Convert to AppError if needed
  const appError = toAppError(err);
  
  // Set default values
  // appError.statusCode = appError.statusCode || 500;
  
  // Generate request ID if not present
  const requestId = req.requestId || req.id || 'unknown';
  
  if (process.env.NODE_ENV === "development") {
    res.status(appError.statusCode).json({
      success: false,
      error: {
        code: appError.code,
        message: appError.message,
        statusCode: appError.statusCode,
        details: appError.details,
        stack: appError.stack,
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
  } else {
    // Production: Send only necessary error information
    if (appError.isOperational) {
      res.status(appError.statusCode).json({
        success: false,
        error: {
          code: appError.code,
          message: appError.message,
          statusCode: appError.statusCode,
          timestamp: new Date().toISOString(),
          requestId,
        },
      });
    } else {
      // Log the error for debugging
      console.error("ERROR 💥", appError);

      // Send generic message for non-operational errors
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: "Something went wrong!",
          statusCode: 500,
          timestamp: new Date().toISOString(),
          requestId,
        },
      });
    }
  }
};
