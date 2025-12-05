import DatabaseSecurityService from '../../services/databaseSecurity.service.js';

/**
 * Database Security Middleware
 * Enforces role-based access control for database operations
 */

/**
 * Middleware to check database access permissions
 * @param {string} resource - The resource type
 * @param {string} action - The action (read, write, delete)
 */
export const requireDatabasePermission = (resource, action) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        DatabaseSecurityService.logUnauthorizedAccess({
          userId: null,
          userRole: null,
          resource,
          action,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          details: { reason: 'No authentication' }
        });
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if user/IP is blocked
      if (DatabaseSecurityService.isBlocked(req.user.id, req.ip)) {
        return res.status(429).json({
          success: false,
          message: 'Too many unauthorized attempts. Please try again later.'
        });
      }

      // Extract resource data from request
      const resourceData = {};
      if (req.params.companyId) {
        resourceData.companyId = req.params.companyId;
      } else if (req.user.currentCompanyId) {
        resourceData.companyId = req.user.currentCompanyId;
      }

      // Check permission
      if (!DatabaseSecurityService.hasPermission(req.user, resource, action, resourceData)) {
        DatabaseSecurityService.logUnauthorizedAccess({
          userId: req.user.id,
          userRole: req.user.role,
          resource,
          action,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          details: { resourceData }
        });
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      // Add security filter to request for database queries
      req.securityFilter = DatabaseSecurityService.getRowLevelSecurityFilter(req.user, resource);
      
      next();
    } catch (error) {
      console.error('Database security middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

/**
 * Middleware to validate sensitive field access
 */
export const validateSensitiveFieldAccess = (req, res, next) => {
  try {
    // Check if user is authenticated first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if request contains sensitive fields
    const sensitiveFields = ['password', 'email', 'phone', 'salary', 'ssn', 'bankAccount'];
    const requestData = req.body || {};
    
    for (const field of sensitiveFields) {
      if (requestData[field] && !DatabaseSecurityService.canAccessSensitiveField(req.user, field)) {
        DatabaseSecurityService.logUnauthorizedAccess({
          userId: req.user.id,
          userRole: req.user.role,
          resource: 'sensitive_field',
          action: 'write',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          details: { field, attemptedValue: requestData[field] }
        });
        return res.status(403).json({
          success: false,
          message: `Access to field '${field}' is not permitted`
        });
      }
    }

    next();
  } catch (error) {
    console.error('Sensitive field validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Middleware to validate database constraints
 * @param {string} model - The Prisma model name
 * @param {string} action - The action (create, update, delete)
 */
export const validateDatabaseConstraints = (model, action) => {
  return (req, res, next) => {
    try {
      const data = req.body || {};
      const validation = DatabaseSecurityService.validateConstraints(model, data, action);
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      next();
    } catch (error) {
      console.error('Database constraint validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

/**
 * Middleware to filter sensitive data in responses
 */
export const filterSensitiveResponseData = (req, res, next) => {
  try {
    // Override res.json to filter sensitive data
    const originalJson = res.json;
    res.json = function(data) {
      if (!req.user || req.user.role === 'admin') {
        return originalJson.call(this, data);
      }

      // Filter sensitive fields for non-admin users
      const filteredData = filterSensitiveFields(data, req.user.role);
      return originalJson.call(this, filteredData);
    };

    next();
  } catch (error) {
    console.error('Response filtering error:', error);
    next();
  }
};

/**
 * Helper function to filter sensitive fields from response data
 * @param {*} data - The data to filter
 * @param {string} userRole - The user's role
 * @returns {*} - The filtered data
 */
function filterSensitiveFields(data, userRole) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // Define fields to hide based on role
  const hiddenFields = {
    default: ['password', 'passwordHash', 'tokenHash'],
    user: ['password', 'passwordHash', 'tokenHash', 'salary', 'ssn', 'bankAccount'],
    manager: ['password', 'passwordHash', 'tokenHash', 'ssn'],
    auditor: ['password', 'passwordHash', 'tokenHash', 'salary', 'bankAccount'],
    inventory_manager: ['password', 'passwordHash', 'tokenHash', 'salary', 'ssn', 'bankAccount']
  };

  const fieldsToHide = hiddenFields[userRole] || hiddenFields.default;

  if (Array.isArray(data)) {
    return data.map(item => filterSensitiveFields(item, userRole));
  }

  const filtered = { ...data };
  for (const field of fieldsToHide) {
    if (field in filtered) {
      delete filtered[field];
    }
  }

  // Recursively filter nested objects
  for (const key in filtered) {
    if (typeof filtered[key] === 'object' && filtered[key] !== null) {
      filtered[key] = filterSensitiveFields(filtered[key], userRole);
    }
  }

  return filtered;
}

export default {
  requireDatabasePermission,
  validateSensitiveFieldAccess,
  validateDatabaseConstraints,
  filterSensitiveResponseData
};
