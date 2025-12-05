import { Request, Response, NextFunction, RequestHandler } from 'express';
import rateLimit, { Options } from 'express-rate-limit';
import { ApiError } from '../utils/error';

type RateLimitOptions = Partial<Options> & {
  windowMs?: number;
  max?: number | ((req: Request) => Promise<number> | number);
  message?: string;
  skip?: (req: Request) => boolean;
};

// Default rate limit options
const defaultRateLimitOptions: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: () => false,
};

/**
 * Creates a rate limiter middleware with the specified options
 * @param options Configuration options for rate limiting
 * @returns Rate limiting middleware
 */
export const createRateLimiter = (options: RateLimitOptions = {}) => {
  const rateLimitOptions: RateLimitOptions = {
    ...defaultRateLimitOptions,
    ...options,
    handler: (req: Request, res: Response, next: NextFunction, options) => {
      next(new ApiError(429, options.message as string));
    },
  };

  return rateLimit(rateLimitOptions as Options);
};

// Rate limiter for authentication routes
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login attempts per hour
  message: 'Too many login attempts, please try again after an hour',
});

// Rate limiter for public APIs
export const publicApiRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // 1000 requests per hour
  message: 'Too many API requests, please try again later',
});

// Rate limiter for admin routes
export const adminRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // 1000 requests per hour
  message: 'Too many admin requests, please try again later',
});
