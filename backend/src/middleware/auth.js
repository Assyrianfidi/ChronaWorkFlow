const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { JWT_SECRET } = require('../config');
const { ApiError } = require('./errorHandler');

const prisma = new PrismaClient();

/**
 * Middleware to verify JWT token
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication invalid');
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from the token
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        businessId: true,
      },
    });

    if (!user || !user.isActive) {
      throw new ApiError(401, 'User not authorized or inactive');
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token expired'));
    }
    next(error);
  }
};

/**
 * Role-based access control middleware
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `User role ${req.user.role} is not authorized to access this route`)
      );
    }
    next();
  };
};

/**
 * Middleware to check if user has access to a specific business
 * @param {string} businessIdParam - Name of the parameter containing the business ID
 */
const checkBusinessAccess = (businessIdParam = 'businessId') => {
  return async (req, res, next) => {
    try {
      const businessId = req.params[businessIdParam] || req.body[businessIdParam];
      
      // Skip if user is admin or super admin
      if (['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return next();
      }
      
      // For other roles, check if they belong to the business
      if (req.user.businessId !== businessId) {
        return next(new ApiError(403, 'Not authorized to access this resource'));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  auth,
  authorize,
  checkBusinessAccess,
};
