import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { ApiError } from '../utils/error';

// Define custom role type to avoid Prisma client issues
type AppRole = 'ADMIN' | 'USER' | 'INVENTORY_MANAGER' | 'ACCOUNTANT' | 'CASHIER' | 'MANAGER' | 'CUSTOMER_SERVICE' | 'VIEWER';

export interface UserPayload {
  id: string;
  role: AppRole;
  tenantId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

/**
 * Middleware to authenticate JWT token and optionally check for required roles
 * @param roles Optional array of roles that are allowed to access the route
 */
export const authenticate = (roles: AppRole[] = []) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get token from header
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        throw new ApiError(401, 'No token provided');
      }

      const token = authHeader.split(' ')[1];
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET is not defined');
      }

      // Verify token
      const decoded = jwt.verify(token, secret) as UserPayload;

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id, isActive: true },
        select: { 
          id: true, 
          role: true, 
          tenantId: true 
        }
      });

      if (!user) {
        throw new ApiError(401, 'User not found or inactive');
      }

      // Type assertion for user role
      const userRole = user.role as AppRole;

      // Check if user has required role
      if (roles.length > 0 && !roles.includes(userRole)) {
        throw new ApiError(403, 'Not authorized to access this resource');
      }

      // Attach user to request object
      req.user = {
        id: user.id,
        role: userRole,
        tenantId: user.tenantId
      };

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        next(new ApiError(401, 'Invalid token'));
      } else if (error instanceof jwt.TokenExpiredError) {
        next(new ApiError(401, 'Token expired'));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Middleware to check if user is authenticated
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new ApiError(401, 'Not authenticated'));
  }
  next();
};

/**
 * Middleware to check if user has required role(s)
 * @param roles Single role or array of roles that are allowed
 */
export const authorize = (roles: AppRole | AppRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Not authenticated'));
    }

    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!requiredRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'Not authorized to access this resource'));
    }

    next();
  };
};
