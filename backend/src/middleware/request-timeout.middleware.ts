import { Request, Response, NextFunction } from 'express';

const DEFAULT_TIMEOUT_MS = 30_000; // 30 seconds

/**
 * Request timeout middleware.
 * Aborts requests that exceed the configured timeout and returns 408.
 * Prevents slow queries or hung connections from consuming server resources.
 */
export const requestTimeout = (timeoutMs: number = DEFAULT_TIMEOUT_MS) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Request timeout — operation took too long',
          error: { code: 'REQUEST_TIMEOUT' },
        });
      }
    }, timeoutMs);

    // Clear timeout when response finishes
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
};
