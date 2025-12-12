import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/prisma.js";
import { ROLES } from "../constants/roles.js";

/**
 * Authentication middleware to verify JWT token
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, isActive: true },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {...string} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has admin or assistant manager role
 */
export const authorizeAdminOrAssistantManager = (req, res, next) => {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (![ROLES.ADMIN, ROLES.ASSISTANT_MANAGER].includes(req.user.role)) {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: "Admin or Assistant Manager access required",
    });
  }

  next();
};
