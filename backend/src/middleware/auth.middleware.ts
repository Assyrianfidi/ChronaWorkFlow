// @ts-ignore
const jwt = require("jsonwebtoken");
const { PrismaClientSingleton } = require('../lib/prisma');
import { ApiError } from "./error.middleware";
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/utils/jwt';
import { User } from '@/models/User';
import { AuditService } from '@/services/AuditService';
import { v4 as uuidv4 } from 'uuid';

const prisma = PrismaClientSingleton.getInstance();

// Protect routes
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(" ")[1];
  }
  // Set token from cookie
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return next(new ApiError(401, "Not authorized to access this route"));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from the token
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      // Log failed authentication
      const correlationId = uuidv4();
      await AuditService.logEvent(null, 'LOGIN_FAILURE', { error: 'User no longer exists or is inactive', token }, correlationId);
      return next(new ApiError(401, "User no longer exists or is inactive"));
    }

    req.user = user;
    
    // Log successful authentication
    const correlationId = uuidv4();
    await AuditService.logEvent(user.id, 'LOGIN_SUCCESS', { method: req.method, path: req.path }, correlationId);
    
    next();
  } catch (err) {
    // Log failed authentication
    const correlationId = uuidv4();
    await AuditService.logEvent(null, 'LOGIN_FAILURE', { error: err.message, token }, correlationId);
    return next(new ApiError(401, "Not authorized to access this route"));
  }
};

// Grant access to specific roles
export const authorize = (...roles: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `User role ${req.user.role} is not authorized to access this route`,
        ),
      );
    }
    next();
  };
};
