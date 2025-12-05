import AuditLoggerService from '../../services/auditLogger.service.js';
import MonitoringService from '../../services/monitoring.service.js';

/**
 * Middleware to log authentication events
 */
export const logAuthEvent = (action, success = true) => {
  return (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json;
    res.json = function(data) {
      // Log the auth event asynchronously but don't wait for it
      AuditLoggerService.logAuthEvent({
        action,
        userId: res.locals.userId || (req.user?.id),
        email: req.body?.email || req.user?.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        success: success && data?.success !== false,
        details: {
          statusCode: res.statusCode,
          reason: data?.message || (success ? 'Success' : 'Failed'),
          bruteForce: req.body?.email && action === 'LOGIN_FAILED' ? true : false
        },
        severity: success ? 'INFO' : 'WARNING'
      }).catch(err => console.error('Audit log error:', err));

      // Record metrics for monitoring
      MonitoringService.recordAuthMetrics({
        action,
        success: success && data?.success !== false,
        userId: res.locals.userId || (req.user?.id)
      });

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Middleware to log data access/modification events
 */
export const logDataEvent = (action, resourceType) => {
  return (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json;
    res.json = function(data) {
      // Log the data event
      AuditLoggerService.logDataEvent({
        action,
        resourceType,
        resourceId: req.params?.id || null,
        userId: req.user?.id,
        companyId: req.user?.currentCompanyId || req.body?.companyId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        success: data?.success !== false,
        details: {
          statusCode: res.statusCode,
          requestData: sanitizeRequestData(req.body),
          responseData: sanitizeResponseData(data),
          method: req.method,
          route: req.route?.path || req.path
        },
        severity: action === 'DELETE' ? 'WARNING' : 'INFO'
      });

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Middleware to log security events
 */
export const logSecurityEvent = (action, options = {}) => {
  return (req, res, next) => {
    // Log the security event immediately
    AuditLoggerService.logSecurityEvent({
      action,
      userId: req.user?.id || null,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      resource: options.resource || null,
      details: {
        ...options.details,
        method: req.method,
        route: req.route?.path || req.path,
        statusCode: res.statusCode
      },
      severity: options.severity || 'WARNING'
    });

    next();
  };
};

/**
 * Middleware to log system events
 */
export const logSystemEvent = (action, details = {}) => {
  return (req, res, next) => {
    // Log the system event
    AuditLoggerService.logSystemEvent({
      action,
      details: {
        ...details,
        method: req.method,
        route: req.route?.path || req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      severity: details.severity || 'INFO'
    });

    next();
  };
};

/**
 * Global error logging middleware
 */
export const logErrors = (err, req, res, next) => {
  // Log the error as a system event
  AuditLoggerService.logSystemEvent({
    action: 'ERROR',
    details: {
      error: {
        message: err.message,
        stack: err.stack,
        name: err.name
      },
      method: req.method,
      route: req.route?.path || req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || null,
      body: sanitizeRequestData(req.body),
      query: req.query,
      params: req.params
    },
    severity: err.status >= 500 ? 'ERROR' : 'WARNING'
  });

  // Pass error to next error handler
  next(err);
};

/**
 * Performance monitoring middleware
 */
export const logPerformance = (req, res, next) => {
  const startTime = Date.now();
  
  // Store original res.end to capture response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    
    // Record request metrics
    MonitoringService.recordRequestMetrics({
      method: req.method,
      route: req.route?.path || req.path,
      statusCode: res.statusCode,
      duration,
      success: res.statusCode < 400,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Log slow requests
    if (duration > 1000) { // Requests taking more than 1 second
      AuditLoggerService.logSystemEvent({
        action: 'PERFORMANCE_ISSUE',
        details: {
          duration,
          method: req.method,
          route: req.route?.path || req.path,
          statusCode: res.statusCode,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        severity: duration > 5000 ? 'WARNING' : 'INFO'
      });
    }
    
    // Call original end method
    return originalEnd.call(this, ...args);
  };
  
  next();
};

/**
 * Helper function to sanitize request data for logging
 */
function sanitizeRequestData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const sanitized = { ...data };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'hash'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

/**
 * Helper function to sanitize response data for logging
 */
function sanitizeResponseData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const sanitized = { ...data };
  
  // Remove sensitive fields from response data
  if (sanitized.data && Array.isArray(sanitized.data)) {
    sanitized.data = sanitized.data.map(item => sanitizeRequestData(item));
  } else if (sanitized.data) {
    sanitized.data = sanitizeRequestData(sanitized.data);
  }
  
  return sanitized;
}

/**
 * Middleware to log all API requests (comprehensive logging)
 */
export const logAllRequests = (req, res, next) => {
  const startTime = Date.now();
  
  // Store original res.json and res.end
  const originalJson = res.json;
  const originalEnd = res.end;
  
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    // Determine event type based on route and method
    let eventType = 'DATA';
    let action = 'READ';
    
    if (req.path.includes('/auth')) {
      eventType = 'AUTH';
      action = req.method === 'POST' ? 'LOGIN' : 'LOGOUT';
    } else if (req.method === 'POST') {
      action = 'CREATE';
    } else if (req.method === 'PUT' || req.method === 'PATCH') {
      action = 'UPDATE';
    } else if (req.method === 'DELETE') {
      action = 'DELETE';
    }
    
    // Determine resource type
    const resourceType = getResourceType(req.path);
    
    // Log the event
    if (eventType === 'AUTH') {
      AuditLoggerService.logAuthEvent({
        action,
        userId: res.locals.userId || (req.user?.id),
        email: req.body?.email || req.user?.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        success: data?.success !== false,
        details: {
          statusCode: res.statusCode,
          duration,
          reason: data?.message || (data?.success !== false ? 'Success' : 'Failed')
        },
        severity: data?.success === false ? 'WARNING' : 'INFO'
      });
    } else {
      AuditLoggerService.logDataEvent({
        action,
        resourceType,
        resourceId: req.params?.id || null,
        userId: req.user?.id,
        companyId: req.user?.currentCompanyId || req.body?.companyId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        success: data?.success !== false,
        details: {
          statusCode: res.statusCode,
          duration,
          method: req.method,
          route: req.route?.path || req.path,
          requestData: sanitizeRequestData(req.body),
          query: req.query
        },
        severity: action === 'DELETE' ? 'WARNING' : 'INFO'
      });
    }
    
    return originalJson.call(this, data);
  };
  
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    
    // Log performance issues for non-JSON responses
    if (duration > 1000 && !res.headersSent) {
      AuditLoggerService.logSystemEvent({
        action: 'PERFORMANCE_ISSUE',
        details: {
          duration,
          method: req.method,
          route: req.route?.path || req.path,
          statusCode: res.statusCode,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        severity: duration > 5000 ? 'WARNING' : 'INFO'
      });
    }
    
    return originalEnd.call(this, ...args);
  };
  
  next();
};

/**
 * Helper function to determine resource type from path
 */
function getResourceType(path) {
  if (path.includes('/accounts')) return 'ACCOUNT';
  if (path.includes('/transactions')) return 'TRANSACTION';
  if (path.includes('/users')) return 'USER';
  if (path.includes('/inventory')) return 'INVENTORY';
  if (path.includes('/reports')) return 'REPORT';
  if (path.includes('/companies')) return 'COMPANY';
  return 'UNKNOWN';
}

// Export all middleware functions
export default {
  logAuthEvent,
  logDataEvent,
  logSecurityEvent,
  logSystemEvent,
  logErrors,
  logPerformance,
  logAllRequests
};
