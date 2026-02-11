import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Rate limiting configurations
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    if (req.body?.email) {
      await prisma.suspicious_activities.create({
        data: {
          activityType: 'FAILED_LOGIN_SPIKE',
          description: `Rate limit exceeded for ${req.body.email}`,
          detectedAt: new Date(),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      }).catch(() => {});
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
export const requestSizeLimit = (req, res, next) => {
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

// Input sanitization
export const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potential SQL injection patterns
        obj[key] = obj[key].replace(/['";\\]/g, '');
        // Remove potential XSS patterns
        obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

// CSRF protection
export const csrfProtection = (req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const token = req.headers['x-csrf-token'];
    const sessionToken = req.headers['authorization'];

    if (!token && !sessionToken) {
      return res.status(403).json({
        success: false,
        message: 'CSRF token missing.',
      });
    }
  }

  next();
};

// Suspicious activity detection
export const detectSuspiciousActivity = async (req, res, next) => {
  try {
    if (!req.user) return next();

    const recentActivities = await prisma.auditLog.count({
      where: {
        userId: req.user.id,
        createdAt: {
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
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      return res.status(429).json({
        success: false,
        message: 'Suspicious activity detected. Account temporarily restricted.',
      });
    }

    next();
  } catch (error) {
    console.error('Suspicious activity detection error:', error);
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
    console.error('❌ Missing required environment variables:', missing);
    process.exit(1);
  }

  console.log('✅ Environment variables validated');
};

// IP whitelist (for admin endpoints)
export const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
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
export const securityLogger = async (req, res, next) => {
  const sensitiveEndpoints = ['/api/auth/', '/api/admin/', '/api/billing/'];
  const isSensitive = sensitiveEndpoints.some(endpoint => req.path.startsWith(endpoint));

  if (isSensitive) {
    console.log(`[SECURITY] ${req.method} ${req.path} - IP: ${req.ip} - User: ${req.user?.email || 'anonymous'}`);
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
