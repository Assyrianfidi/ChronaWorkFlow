/**
 * AUDIT FIX P1-1: Universal async error handler
 * Wraps async route handlers to catch promise rejections and forward to Express error middleware
 * Prevents unhandled promise rejections that could crash the application
 * 
 * Usage:
 *   router.get('/endpoint', asyncHandler(async (req: any, res: any) => { ... }));
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * Wraps an async route handler to automatically catch errors
 * and forward them to Express error handling middleware
 */
export const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Alternative: catchAsync (alias for consistency with existing codebase)
 */
export const catchAsync = asyncHandler;

export default asyncHandler;
