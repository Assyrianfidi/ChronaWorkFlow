import { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';
import csrf from 'csurf';
import { ApiError } from '../utils/error';

// CSRF protection middleware configuration
type CsrfOptions = {
  cookie?: boolean | {
    key?: string;
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: boolean | 'lax' | 'strict' | 'none';
    maxAge?: number;
  };
  ignoreMethods?: string[];
  sessionKey?: string;
  value?: (req: Request) => string;
};

/**
 * Creates a CSRF protection middleware with the specified options
 * @param options Configuration options for CSRF protection
 * @returns Object containing CSRF protection middleware and token generator
 */
const createCsrfProtection = (options: CsrfOptions = {}) => {
  const defaultOptions: CsrfOptions = {
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
    value: (req: Request) => {
      // Get the CSRF token from the header, query, or body
      return (
        (req.headers['x-csrf-token'] as string) ||
        (req.query._csrf as string) ||
        (req.body && req.body._csrf) ||
        ''
      );
    },
    ...options,
  };

  // Create the CSRF protection middleware
  const csrfProtection = csrf(defaultOptions);

  // Error handler for CSRF token errors
  const csrfErrorHandler: ErrorRequestHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.code !== 'EBADCSRFTOKEN') return next(err);
    
    // Handle CSRF token errors
    return next(new ApiError(403, 'Invalid or missing CSRF token'));
  };

  // Middleware to attach CSRF token to response locals
  const csrfToken = (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore - req.csrfToken is added by the csurf middleware
    const token = req.csrfToken ? req.csrfToken() : '';
    res.locals.csrfToken = token;
    next();
  };

  // Main CSRF protection middleware
  const csrfProtectionMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    // Skip CSRF protection for API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }

    csrfProtection(req, res, (err: any) => {
      if (err) {
        csrfErrorHandler(err, req, res, next);
      } else {
        csrfToken(req, res, next);
      }
    });
  };

  return {
    csrfProtection,
    csrfErrorHandler,
    csrfToken,
    csrfProtectionMiddleware,
  };
};

// Default CSRF protection middleware
const { csrfProtection, csrfErrorHandler, csrfToken, csrfProtectionMiddleware } = createCsrfProtection();

// Middleware to add CSRF token to response locals
const addCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  res.locals.csrfToken = req.csrfToken ? req.csrfToken() : '';
  next();
};

export {
  csrfProtection,
  csrfErrorHandler,
  csrfToken,
  csrfProtectionMiddleware,
  addCsrfToken,
  createCsrfProtection,
};
