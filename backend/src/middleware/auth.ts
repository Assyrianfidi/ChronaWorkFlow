// @ts-ignore
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { prisma, PrismaClientSingleton } from '../lib/prisma';
import { ApiError, ErrorCodes } from "../utils/errorHandler";
import { ROLES } from "../constants/roles";
import { logger } from "../utils/logger.js";
import { config } from "../config/config";
import { Role } from "@prisma/client";

const prisma = prisma;

// List of public paths that don't require authentication
const PUBLIC_PATHS = [
  "/health",
  "/api/health",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot",
  "/api/auth/reset",
  "/api/auth/verify",
];

/**
 * Middleware to verify JWT token
 */
export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Skip authentication for public paths
    if (PUBLIC_PATHS.some((path) => req.path.startsWith(path))) {
      return next();
    }

    // Get token from header, query string, or cookies
    let token: string | undefined;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      // Get token from Authorization header
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.token) {
      // Get token from cookies
      token = req.cookies.token;
    } else if (req.query.token) {
      // Get token from query string (for API testing)
      token = req.query.token as string;
    }

    if (!token) {
      throw new ApiError(
        "Access denied. No token provided.",
        401,
        ErrorCodes.UNAUTHORIZED,
      );
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret) as any;

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });

      if (!user) {
        throw new ApiError(
          "Token is valid but user not found",
          401,
          ErrorCodes.UNAUTHORIZED,
        );
      }

      if (!user.isActive) {
        throw new ApiError(
          "Account is deactivated",
          401,
          ErrorCodes.ACCOUNT_DEACTIVATED,
        );
      }

      // Attach user to request with correct type
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as any, // Type assertion for enum compatibility
        isActive: user.isActive,
      } as any; // Full type assertion to bypass strict checking
      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.JsonWebTokenError) {
        throw new ApiError("Invalid token", 401, ErrorCodes.INVALID_TOKEN);
      }
      if (jwtError instanceof jwt.TokenExpiredError) {
        throw new ApiError("Token expired", 401, ErrorCodes.TOKEN_EXPIRED);
      }
      throw jwtError;
    }
  } catch (error) {
    logger.error(`Auth middleware error for path ${req.path}:`, error);
    next(error);
  }
};

/**
 * Middleware to authorize based on user roles
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new ApiError(
          "Access denied. Authentication required.",
          401,
          ErrorCodes.UNAUTHORIZED,
        ),
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        `Unauthorized access attempt: User ${req.user.email} with role ${req.user.role} tried to access protected route`,
      );
      return next(
        new ApiError(
          "Access denied. Insufficient permissions.",
          403,
          ErrorCodes.FORBIDDEN,
        ),
      );
    }

    next();
  };
};

/**
 * Middleware to check if user is admin or manager
 */
export const requireAdminOrManager = authorizeRoles(ROLES.ADMIN, ROLES.MANAGER);

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = authorizeRoles(ROLES.ADMIN);

/**
 * Middleware to check if user is auditor
 */
export const requireAuditor = authorizeRoles(ROLES.AUDITOR, ROLES.ADMIN);

/**
 * Optional authentication middleware - doesn't throw error if no token
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get token from header, query string, or cookies
    let token: string | undefined;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret) as any;

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });

      if (user && user.isActive) {
        req.user = user as any; // Type assertion to bypass strict checking
      }
    } catch (jwtError) {
      // Ignore JWT errors for optional auth
      logger.debug("Optional auth JWT error:", jwtError);
    }

    next();
  } catch (error) {
    logger.error("Optional auth middleware error:", error);
    next();
  }
};
