/**
 * CSRF Protection Middleware
 * Enterprise-grade CSRF protection for sensitive operations
 */

import crypto from 'crypto';

// Store for CSRF tokens (in production, use Redis or database)
const csrfTokens = new Map();

export const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // For sensitive operations, require CSRF token
  const sensitiveRoutes = [
    '/api/auth/logout',
    '/api/users/password',
    '/api/accounting/accounts',
    '/api/accounting/transactions',
    '/api/accounting/invoices',
    '/api/subscriptions',
    '/api/ai',
  ];

  const requestPath = req.originalUrl || req.path;
  const isSensitiveRoute = sensitiveRoutes.some(route => requestPath.startsWith(route));

  if (isSensitiveRoute) {
    const token = req.headers['x-csrf-token'] || req.body._csrf;

    if (!token) {
      return res.status(403).json({
        success: false,
        error: 'CSRF Token Required',
        message: 'CSRF token is required for this operation',
      });
    }

    // Verify token exists and is valid for this session
    const sessionId = req.user?.id || req.ip;
    const validToken = csrfTokens.get(sessionId);

    if (!validToken || validToken !== token) {
      return res.status(403).json({
        success: false,
        error: 'Invalid CSRF Token',
        message: 'CSRF token is invalid or expired',
      });
    }
  }

  next();
};

// Generate CSRF token
export const generateCSRFToken = (userId) => {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.set(userId, token);

  // Clean up old tokens (simple implementation)
  setTimeout(() => {
    csrfTokens.delete(userId);
  }, 60 * 60 * 1000); // 1 hour

  return token;
};

// CSRF token endpoint
export const getCSRFToken = (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  const token = generateCSRFToken(req.user.id);

  res.json({
    success: true,
    data: { csrfToken: token },
  });
};
