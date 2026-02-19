import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma.js";
import { ApiError } from "../utils/errors.js";
import { Request, Response, NextFunction } from 'express';
import AuditLoggerService from "../services/auditLogger.service.js";
import { v4 as uuidv4 } from 'uuid';

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as any;

    // Get user from the token
    const user = await prisma.users.findUnique({
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
      return next(new ApiError(401, "User no longer exists or is inactive"));
    }

    req.user = user;
    next();
  } catch (err: any) {
    return next(new ApiError(401, "Not authorized to access this route"));
  }
};

// Grant access to specific roles
export const authorize = (...roles: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `User role ${req.user?.role || 'unknown'} is not authorized to access this route`,
        ),
      );
    }
    next();
  };
};
