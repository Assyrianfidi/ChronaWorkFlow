import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AuthRequest, UserPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

// Rate limiting for auth endpoints
import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Protect routes - User must be authenticated
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // 1. Get token from cookie (preferred)
    if ((req as any).cookies?.token) {
      token = (req as any).cookies.token;
    }
    // 2. Get token from Authorization header (fallback)
    else if ((req as any).headers.authorization?.startsWith('Bearer ')) {
      token = (req as any).headers.authorization.split(' ')[1];
    }

    if (!token) {
      logger.warn('No token provided', { path: (req as any).path, method: (req as any).method });
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route - No token provided'
      });
    }

    // 3. Verify token
    let decoded: { id: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Invalid token', { error: errorMessage });
      return res.status(401).json({
        success: false,
        message: 'Not authorized - Invalid token'
      });
    }

    // 4. Get user from database with only necessary fields
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        tenantId: true
      }
    });

    if (!user) {
      logger.warn('User not found', { userId: decoded.id });
      return res.status(401).json({
        success: false,
        message: 'User not found or account is inactive'
      });
    }

    if (!user || !user.isActive) {
      logger.warn('User not found or inactive', { userId: decoded.id });
      return res.status(401).json({
        success: false,
        message: 'User not found or account is inactive'
      });
    }

    // 5. Add user to request object
    (req as any).user = user;
    next();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('Authentication error', {
      error: errorMessage,
      stack: errorStack,
      path: (req as any).path,
      method: (req as any).method
    });
    
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      ...(process.env.NODE_ENV === 'development' && { error: errorMessage })
    });
  }
};

// Grant access to specific roles
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      logger.warn('Unauthorized access - No user in request', {
        path: (req as any).path,
        method: (req as any).method
      });
      return res.status(401).json({
        success: false,
        message: 'Not authorized - No user session'
      });
    }

    const user = req.user as UserPayload;
    if (!roles.includes(user.role)) {
      logger.warn('Unauthorized access - Insufficient permissions', {
        userId: user.id,
        userRole: user.role,
        requiredRoles: roles,
        path: (req as any).path,
        method: (req as any).method
      });
      return res.status(403).json({
        success: false,
        message: 'Not authorized - Insufficient permissions'
      });
    }

    // Log successful authorization for sensitive operations
    if (roles.includes('ADMIN')) {
      logger.info('Admin access granted', {
        userId: user.id,
        path: (req as any).path,
        method: (req as any).method
      });
    }

    next();
  };
};

// Middleware to check if user is the owner of the resource
export const isOwner = (resourceOwnerId: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - No user session'
      });
    }

    const user = req.user as UserPayload;
    
    // Allow admins to access any resource
    if (user.role === 'ADMIN') {
      return next();
    }

    // Check if user is the owner
    if (user.id !== resourceOwnerId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized - Access denied'
      });
    }

    next();
  };
};
