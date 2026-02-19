import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { config } from "../config/config.js";

/**
 * Standardized error response format
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
    stack?: string; // Only in development
  };
  meta?: {
    version: string;
    environment: string;
  };
}

/**
 * Error codes for consistent API responses
 */
export enum ErrorCodes {
  // Validation errors (400)
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  INVALID_FORMAT = "INVALID_FORMAT",

  // Authentication errors (401)
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  TOKEN_INVALID = "TOKEN_INVALID",
  INVALID_TOKEN = "INVALID_TOKEN",
  ACCOUNT_DEACTIVATED = "ACCOUNT_DEACTIVATED",

  // Authorization errors (403)
  FORBIDDEN = "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED",

  // Not found errors (404)
  NOT_FOUND = "NOT_FOUND",
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  ENDPOINT_NOT_FOUND = "ENDPOINT_NOT_FOUND",

  // Conflict errors (409)
  CONFLICT = "CONFLICT",
  DUPLICATE_RESOURCE = "DUPLICATE_RESOURCE",
  RESOURCE_LOCKED = "RESOURCE_LOCKED",

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS",

  // Server errors (500)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",

  // Service unavailable (503)
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  MAINTENANCE_MODE = "MAINTENANCE_MODE",
}

/**
 * Custom error class with error code
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCodes;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCodes = ErrorCodes.INTERNAL_ERROR,
    isOperational: boolean = true,
    details?: any,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create standardized error response
 */
export const createErrorResponse = (
  code: ErrorCodes,
  message: string,
  details?: any,
  statusCode: number = 500,
  requestId?: string,
): ErrorResponse => {
  const response: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      requestId,
    },
    meta: {
      version: process.env.npm_package_version || "1.0.0",
      environment: config.env,
    },
  };

  if (details) {
    response.error.details = details;
  }

  // Include stack trace in development
  if (config.env === "development" && details instanceof Error) {
    response.error.stack = details.stack;
  }

  return response;
};

/**
 * Global error handler middleware
 */
export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  let error = err;
  let statusCode = 500;
  let errorCode = ErrorCodes.INTERNAL_ERROR;
  let details: any = undefined;

  // Handle known error types
  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    errorCode = error.code;
    details = error.details;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle Prisma errors
    switch (error.code) {
      case "P2002":
        statusCode = 409;
        errorCode = ErrorCodes.DUPLICATE_RESOURCE;
        details = { field: error.meta?.target };
        break;
      case "P2025":
        statusCode = 404;
        errorCode = ErrorCodes.RESOURCE_NOT_FOUND;
        break;
      default:
        statusCode = 500;
        errorCode = ErrorCodes.DATABASE_ERROR;
        details = { prismaCode: error.code };
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    errorCode = ErrorCodes.VALIDATION_ERROR;
    details = error.message;
  } else if (error.name === "ValidationError") {
    statusCode = 400;
    errorCode = ErrorCodes.VALIDATION_ERROR;
    details = error.message;
  } else if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    errorCode = ErrorCodes.TOKEN_INVALID;
  } else if (error.name === "TokenExpiredError") {
    statusCode = 401;
    errorCode = ErrorCodes.TOKEN_EXPIRED;
  } else if (error.name === "MulterError") {
    statusCode = 400;
    errorCode = ErrorCodes.INVALID_INPUT;
    details = error.message;
  }

  // Log error for debugging
  console.error(`[ERROR] ${errorCode}: ${error.message}`, {
    statusCode,
    requestId: req.headers["x-request-id"],
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    stack: error.stack,
  });

  // Send error response
  const errorResponse = createErrorResponse(
    errorCode,
    error.message,
    details,
    statusCode,
    req.headers["x-request-id"] as string,
  );

  res.status(statusCode).json(errorResponse);
};

/**
 * Async wrapper to catch unhandled promise rejections
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const error = new ApiError(
    `Route ${req.originalUrl} not found`,
    404,
    ErrorCodes.ENDPOINT_NOT_FOUND,
  );
  next(error);
};

/**
 * System panic monitor - detects critical system issues
 */
export class SystemPanicMonitor {
  private static panicThresholds = {
    memoryUsage: 0.9, // 90%
    cpuUsage: 0.95, // 95%
    errorRate: 0.1, // 10%
    responseTime: 5000, // 5 seconds
  };

  private static metrics = {
    totalRequests: 0,
    errorCount: 0,
    avgResponseTime: 0,
    startTime: Date.now(),
  };

  static recordRequest(responseTime: number, isError: boolean = false): void {
    this.metrics.totalRequests++;
    if (isError) this.metrics.errorCount++;

    // Update average response time
    this.metrics.avgResponseTime =
      (this.metrics.avgResponseTime * (this.metrics.totalRequests - 1) +
        responseTime) /
      this.metrics.totalRequests;
  }

  static checkSystemHealth(): {
    isHealthy: boolean;
    issues: string[];
    metrics: typeof SystemPanicMonitor.metrics;
  } {
    const issues: string[] = [];

    // Check memory usage
    const memUsage = process.memoryUsage();
    const heapUsed = memUsage.heapUsed / memUsage.heapTotal;
    if (heapUsed > this.panicThresholds.memoryUsage) {
      issues.push(`High memory usage: ${(heapUsed * 100).toFixed(2)}%`);
    }

    // Check error rate
    const errorRate = this.metrics.errorCount / this.metrics.totalRequests;
    if (
      errorRate > this.panicThresholds.errorRate &&
      this.metrics.totalRequests > 10
    ) {
      issues.push(`High error rate: ${(errorRate * 100).toFixed(2)}%`);
    }

    // Check response time
    if (this.metrics.avgResponseTime > this.panicThresholds.responseTime) {
      issues.push(
        `High average response time: ${this.metrics.avgResponseTime.toFixed(2)}ms`,
      );
    }

    // Check uptime
    const uptime = Date.now() - this.metrics.startTime;
    if (uptime < 60000) {
      // First minute
      // Don't panic during startup
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      metrics: { ...this.metrics },
    };
  }

  static reset(): void {
    this.metrics = {
      totalRequests: 0,
      errorCount: 0,
      avgResponseTime: 0,
      startTime: Date.now(),
    };
  }
}

// Export alias for compatibility
export const errorHandler = globalErrorHandler;
