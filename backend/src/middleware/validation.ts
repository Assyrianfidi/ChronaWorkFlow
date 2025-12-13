// @ts-ignore
import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ApiError } from "../utils/errors.js";
import { StatusCodes } from "http-status-codes";

/**
 * Validation middleware factory
 */
export const validate = (schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validate query parameters
      if (schema.query) {
        req.query = schema.query.parse(req.query) as any;
      }

      // Validate route parameters
      if (schema.params) {
        req.params = schema.params.parse(req.params) as any;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return next(
          new ApiError(StatusCodes.BAD_REQUEST, "Validation failed", false),
        );
      }

      next(error);
    }
  };
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // Pagination
  pagination: {
    query: {
      page: { coerce: true, default: 1 },
      limit: { coerce: true, default: 10 },
      sortBy: { default: "createdAt" },
      sortOrder: { enum: ["asc", "desc"], default: "desc" },
    },
  },

  // ID parameter
  idParam: {
    params: {
      id: { pattern: /^[a-zA-Z0-9-]+$/ },
    },
  },

  // Email validation
  email: {
    body: {
      email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    },
  },

  // Password validation
  password: {
    body: {
      password: { min: 8, pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/ },
    },
  },
};

/**
 * Sanitization middleware
 */
export const sanitize = (req: Request, res: Response, next: NextFunction) => {
  // Remove potential XSS from string fields
  const sanitizeString = (str: string): string => {
    return str
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === "string") {
      return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    if (obj && typeof obj === "object") {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};
