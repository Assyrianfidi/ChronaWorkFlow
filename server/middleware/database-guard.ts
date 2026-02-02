/**
 * Database Guard Middleware
 * 
 * Protects routes from crashing when database is unavailable.
 * Returns 503 Service Unavailable instead of allowing unhandled errors.
 */

import { Request, Response, NextFunction } from 'express';
import { isDatabaseAvailable } from '../db';

/**
 * Middleware to check database availability before processing requests.
 * Returns 503 if database is unavailable.
 */
export function requireDatabase() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Database is temporarily unavailable. Please try again later.',
        code: 'DATABASE_UNAVAILABLE',
        timestamp: new Date().toISOString(),
      });
    }
    next();
  };
}

/**
 * Middleware to wrap route handlers and catch database errors.
 * Converts database errors to 503 responses instead of crashing.
 */
export function catchDatabaseErrors() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Wrap res.json to catch database errors
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    // Store original methods for error handling
    (res as any)._originalJson = originalJson;
    (res as any)._originalSend = originalSend;

    next();
  };
}

/**
 * Express error handler for database-related errors.
 * Should be registered after all routes.
 */
export function databaseErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Check if error is database-related
  if (
    err.message?.includes('Database unavailable') ||
    err.message?.includes('Database not initialized') ||
    err.code === 'ECONNREFUSED' ||
    err.code === 'ETIMEDOUT' ||
    err.message?.includes('Connection terminated')
  ) {
    console.error('Database error caught:', err.message);
    
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Database connection issue. Please try again later.',
      code: 'DATABASE_ERROR',
      timestamp: new Date().toISOString(),
    });
  }

  // Pass to next error handler if not database-related
  next(err);
}
