/**
 * Authentication Middleware
 * Enterprise-grade authentication with JWT, company isolation, and role-based access control
 */

import jwt from 'jsonwebtoken';
import { incCounter } from '../utils/metrics.mjs';

const getPrisma = () => global.prisma;

// Role hierarchy for permission checking
const ROLE_HIERARCHY = {
  'OWNER': 100,
  'ADMIN': 80,
  'ACCOUNTANT': 60,
  'MANAGER': 40,
  'STAFF': 20,
  'VIEWER': 10,
  'CUSTOMER': 5,
};

// Permission mappings for different roles
const ROLE_PERMISSIONS = {
  'OWNER': [
    // All permissions
    'user:*', 'company:*', 'accounting:*', 'reports:*', 'settings:*',
    'invoices:*', 'subscriptions:*', 'audit:*'
  ],
  'ADMIN': [
    // Most permissions except ownership
    'user:read', 'user:write', 'user:invite', 'company:read', 'company:write',
    'accounting:*', 'reports:*', 'settings:*', 'invoices:*', 'audit:*'
  ],
  'ACCOUNTANT': [
    // Accounting-focused permissions
    'accounting:*', 'reports:read', 'reports:generate', 'invoices:*'
  ],
  'MANAGER': [
    // Management permissions
    'accounting:read', 'reports:read', 'user:read', 'invoices:read'
  ],
  'STAFF': [
    // Basic operational permissions
    'accounting:read', 'invoices:read', 'reports:read'
  ],
  'VIEWER': [
    // Read-only permissions
    'accounting:read', 'reports:read', 'invoices:read'
  ],
  'CUSTOMER': [
    // Customer-specific permissions
    'invoices:read', 'profile:*', 'billing:read'
  ],
};

export const authMiddleware = async (req, res, next) => {
  try {
    const prisma = global.prisma;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Access token required',
      });
    }

    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Access token required',
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user;

    if (prisma) {
      // Database mode - get full user with company context
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          subscriptionPlan: true,
          companyId: true,
          isActive: true,
          companyName: true,
          tokenVersion: true,
          // Include company information for multi-tenant context
          company: {
            select: {
              id: true,
              name: true,
              subscriptionPlan: true,
              isActive: true,
            },
          },
        },
      });

      // Additional validation for company context
      if (user && user.company && !user.company.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Company account is inactive',
        });
      }
    } else {
      // Mock mode - simulate user with company context
      const mockUsers = [
        {
          id: 'owner-1',
          email: 'ceo@chronaworkflow.com',
          name: 'SkyLabs Enterprise',
          role: 'OWNER',
          subscriptionPlan: 'ENTERPRISE',
          companyId: 'company-1',
          isActive: true,
          companyName: 'SkyLabs Enterprise',
          tokenVersion: 0,
          company: {
            id: 'company-1',
            name: 'SkyLabs Enterprise',
            subscriptionPlan: 'ENTERPRISE',
            isActive: true,
          },
        },
      ];

      user = mockUsers.find(u => u.id === decoded.userId);
    }

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or inactive user',
      });
    }

    // Check token version for logout functionality
    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Token has been revoked',
      });
    }

    // Attach user and permissions to request object
    req.user = {
      ...user,
      permissions: ROLE_PERMISSIONS[user.role] || [],
      company: user.company || {
        id: user.companyId,
        name: user.companyName,
        subscriptionPlan: user.subscriptionPlan,
        isActive: true,
      },
    };

    // Log access for audit purposes
    console.log(`🔐 User ${user.email} (${user.role}) accessing ${req.method} ${req.path}`);

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid access token',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Access token expired',
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
};

// Enhanced role-based access control middleware
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const normalizedRoles = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles;

    if (!normalizedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Role '${req.user.role}' does not have access to this resource`,
      });
    }

    next();
  };
};

// Permission-based access control
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    if (!req.user.permissions.includes(permission) &&
        !req.user.permissions.includes(`${permission.split(':')[0]}:*`)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Insufficient permissions: '${permission}' required`,
      });
    }

    next();
  };
};

// Subscription-based feature access
export const requireSubscription = (...requiredPlans) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Check company subscription (takes precedence over individual)
    const activeSubscription = req.user.company?.subscriptionPlan || req.user.subscriptionPlan;

    if (!requiredPlans.includes(activeSubscription)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `This feature requires one of: ${requiredPlans.join(', ')}`,
      });
    }

    next();
  };
};

// Company isolation middleware - ensures users can only access their company's data
export const requireCompanyAccess = (resourceType = 'general') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // For owners and admins, allow cross-company access within their organization
    if (['OWNER', 'ADMIN'].includes(req.user.role)) {
      // They can access their own company and sub-organizations
      req.companyFilter = {
        OR: [
          { companyId: req.user.companyId },
          { companyId: req.user.id }, // For backwards compatibility
        ]
      };
    } else {
      // Regular users can only access their company's data
      req.companyFilter = { companyId: req.user.companyId || req.user.id };
    }

    // Add company context to request for audit logging
    req.companyContext = {
      companyId: req.user.companyId,
      companyName: req.user.companyName,
      userRole: req.user.role,
      resourceType,
    };

    next();
  };
};

// Audit logging middleware
export const auditLog = (action, resourceType) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    const startTime = Date.now();

    res.json = function(data) {
      const duration = Date.now() - startTime;
      const prisma = getPrisma();

      // Log successful operations
      if (data.success !== false) {
        console.log(`📊 AUDIT: ${req.user.email} (${req.user.role}) ${action} ${resourceType} - ${res.statusCode} - ${duration}ms`);
      }

      incCounter('accubooks_audit_events_total', {
        action,
        resource: resourceType,
        status: String(res.statusCode),
      });

      // For database operations, log to audit table
      if (prisma && req.companyContext) {
        try {
          const userId = req.user?.id;
          const companyId = req.companyContext.companyId || req.user?.companyId || req.user?.id;

          void prisma.auditLog
            .create({
              data: {
                action,
                entity: resourceType,
                entityId: data?.data?.id || data?.data?.transaction?.id || data?.data?.invoice?.id || null,
                oldValues: null,
                newValues: {
                  statusCode: res.statusCode,
                  durationMs: duration,
                  path: req.originalUrl,
                  method: req.method,
                },
                userId,
                companyId,
              },
            })
            .catch((auditError) => {
              console.warn('Audit logging failed:', auditError.message);
              incCounter('accubooks_audit_failures_total', { resource: resourceType });
            });
        } catch (auditError) {
          console.warn('Audit logging failed:', auditError.message);
          incCounter('accubooks_audit_failures_total', { resource: resourceType });
        }
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

// Rate limiting per user/company
export const userRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each user to 100 requests per windowMs
    message = 'Too many requests from this user, please try again later.',
  } = options;

  const userRequests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next(); // Let auth middleware handle unauthenticated requests
    }

    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create user request history
    let requests = userRequests.get(userId) || [];
    requests = requests.filter(timestamp => timestamp > windowStart);

    if (requests.length >= max) {
      return res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message,
        retryAfter: Math.ceil((requests[0] + windowMs - now) / 1000),
      });
    }

    requests.push(now);
    userRequests.set(userId, requests);

    next();
  };
};
