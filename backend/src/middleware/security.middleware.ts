import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import logger from '../config/logger.js';
import { runWithTenant } from './prisma-tenant-isolation-v3.middleware.js';

const isStaging = process.env.NODE_ENV === 'staging';

// Rate limiting configurations
export const authLimiter = isStaging
  ? (req: Request, res: Response, next: NextFunction) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 requests per window
      message: 'Too many authentication attempts. Please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      handler: async (req: any, res: any) => {
        const companyId = (req as any).user?.currentCompanyId || req.body?.companyId || undefined;

        if (req.body?.email) {
          await runWithTenant({ companyId, userId: (req as any).user?.id, isAdmin: true, bypassTenant: true }, async () => {
            await prisma.suspicious_activities.create({
              data: {
                activityType: 'FAILED_LOGIN_SPIKE',
                description: `Rate limit exceeded for ${req.body.email}`,
                detectedAt: new Date(),
                metadata: { ip: req.ip, userAgent: req.headers['user-agent'] },
                companyId: companyId ?? null,
              },
            }).catch(() => {});
          });
        }

        res.status(429).json({
          success: false,
          message: 'Too many authentication attempts. Please try again later.',
        });
      },
    });

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const strictApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: 'Rate limit exceeded for this endpoint.',
});

// Request size limiting
export const requestSizeLimit = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = req.headers['content-length'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength && parseInt(contentLength) > maxSize) {
    return res.status(413).json({
      success: false,
      message: 'Request payload too large. Maximum size is 10MB.',
    });
  }

  next();
};

// Security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Input sanitization — XSS only
// NOTE: SQL injection is prevented by Prisma's parameterized queries.
// Do NOT strip quotes/semicolons — they are valid in financial data (e.g. "O'Brien & Sons").
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;

    const newObj: any = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Strip <script> tags and event handlers only (XSS vectors)
        let val = obj[key];
        val = val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        val = val.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
        val = val.replace(/javascript\s*:/gi, '');
        newObj[key] = val;
      } else if (typeof obj[key] === 'object') {
        newObj[key] = sanitize(obj[key]);
      } else {
        newObj[key] = obj[key];
      }
    }
    return newObj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) {
    try {
      const sanitizedQuery = sanitize(req.query);
      Object.defineProperty(req, 'query', {
        value: sanitizedQuery,
        writable: true,
        configurable: true,
        enumerable: true
      });
    } catch {
      // req.query may be read-only in some Express versions — non-fatal
    }
  }
  if (req.params) {
    try {
      const sanitizedParams = sanitize(req.params);
      Object.defineProperty(req, 'params', {
        value: sanitizedParams,
        writable: true,
        configurable: true,
        enumerable: true
      });
    } catch {
      // req.params may be read-only — non-fatal
    }
  }

  next();
};

// CSRF protection
// For JWT Bearer token auth: the token in Authorization header IS the CSRF defense
// (attacker cannot read it cross-origin). Only enforce CSRF token for cookie-based sessions.
export const csrfProtection = (req: any, res: any, next: any) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const hasBearer = req.headers['authorization']?.startsWith('Bearer ');
    const hasCsrfToken = req.headers['x-csrf-token'];

    // If using cookie-based auth (no Bearer token), require CSRF token
    if (!hasBearer && !hasCsrfToken) {
      // Allow health checks and public auth routes
      if (req.path.startsWith('/api/health') || req.path.startsWith('/api/auth/')) {
        return next();
      }
      return res.status(403).json({
        success: false,
        message: 'CSRF token required for cookie-based sessions.',
      });
    }
  }

  next();
};

// Suspicious activity detection
export const detectSuspiciousActivity = async (req: any, res: any, next: any) => {
  try {
    const user = (req as any).user;
    if (!user) return next();

    const recentActivities = await prisma.audit_logs.count({
      where: {
        userId: user.id,
        timestamp: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
    });

    if (recentActivities > 50) {
      await prisma.suspicious_activities.create({
        data: {
          userId: req.user.id,
          activityType: 'API_ABUSE',
          description: `Excessive API calls: ${recentActivities} in 5 minutes`,
          detectedAt: new Date(),
          // ipAddress moved to metadata
          userAgent: req.headers['user-agent'],
        },
      });

      return res.status(429).json({
        success: false,
        message: 'Suspicious activity detected. Account temporarily restricted.',
      });
    }

    next();
  } catch (error: any) {
    logger.error('Suspicious activity detection error', { error: (error as Error).message });
    next();
  }
};

// Environment validation
export const validateEnvironment = () => {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logger.error('Missing required environment variables', { missing });
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }

  logger.info('Environment variables validated');
};

// IP whitelist (for admin endpoints)
export const ipWhitelist = (allowedIPs: string[] = []) => {
  return (req: any, res: any, next: any) => {
    const clientIP = req.ip || req.connection.remoteAddress;

    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied from this IP address.',
      });
    }

    next();
  };
};

// Request logging for security
export const securityLogger = async (req: Request, res: Response, next: NextFunction) => {
  const sensitiveEndpoints = ['/api/auth/', '/api/admin/', '/api/billing/'];
  const isSensitive = sensitiveEndpoints.some(endpoint => req.path.startsWith(endpoint));

  if (isSensitive) {
    logger.info('Security-sensitive request', { method: req.method, path: req.path, user: req.user?.email || 'anonymous' });
  }

  next();
};

export default {
  authLimiter,
  apiLimiter,
  strictApiLimiter,
  requestSizeLimit,
  securityHeaders,
  sanitizeInput,
  csrfProtection,
  detectSuspiciousActivity,
  validateEnvironment,
  ipWhitelist,
  securityLogger,
};
