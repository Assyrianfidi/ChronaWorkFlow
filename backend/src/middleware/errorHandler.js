import { Prisma } from "@prisma/client";
import { logger } from "../utils/logger.ts";
import config from "../config.js";
const { NODE_ENV } = config;

/**
 * Custom error class for API errors
 * @extends Error
 */
class ApiError extends Error {
  constructor(
    statusCode,
    message,
    { errors, ...options } = {},
    isOperational = true,
    stack = "",
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    // Add additional properties from options
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        this[key] = value;
      });
    }

    // Ensure errors array is set
    if (errors) {
      this.errors = errors;
    }

    if (stack) {
      this.stack = stack;
    } else if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error handler middleware
 */
function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  error.status = error.status || "error";

  // Log the error with more context in development
  if (NODE_ENV === "development") {
    logger.error("Error Stack:", {
      status: error.status,
      error: error,
      stack: error.stack,
      path: req.path,
      method: req.method,
      body: req.body,
      query: req.query,
      params: req.params,
      user: req.user ? req.user.id : "Not authenticated",
    });
  } else {
    logger.error(
      `${error.statusCode} - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
    );
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle specific Prisma errors
    switch (err.code) {
      case "P2002":
        // Unique constraint violation
        error = new ApiError(
          400,
          `A record with this ${err.meta?.target?.[0] || "field"} already exists`,
        );
        break;
      case "P2025":
        // Record not found
        error = new ApiError(404, "The requested record was not found");
        break;
      case "P2003":
        // Foreign key constraint failed
        error = new ApiError(
          400,
          "Invalid reference: related record does not exist",
        );
        break;
      case "P2016":
        // Invalid input data
        error = new ApiError(400, "Invalid input data provided");
        break;
      default:
        // Unhandled Prisma error
        error = new ApiError(500, "A database error occurred");
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    // Handle validation errors
    error = new ApiError(
      400,
      "Validation error: " + err.message.split("\n").pop(),
    );
  } else if (err.name === "JsonWebTokenError") {
    error = new ApiError(401, "Invalid token. Please log in again.");
  } else if (err.name === "TokenExpiredError") {
    error = new ApiError(401, "Your token has expired. Please log in again.");
  } else if (err.name === "ValidationError") {
    // Handle Mongoose validation errors (if using Mongoose)
    const message = Object.values(err.errors).map((val) => val.message);
    error = new ApiError(400, `Validation failed: ${message.join(". ")}`);
  } else if (err.name === "CastError") {
    // Handle invalid ID format errors
    error = new ApiError(400, `Invalid ${err.path}: ${err.value}`);
  } else if (err.code === "LIMIT_FILE_SIZE") {
    error = new ApiError(400, "File too large. Please upload a smaller file.");
  } else if (err.code === "ENOENT") {
    error = new ApiError(404, "The requested resource was not found");
  } else if (err.code === "ECONNREFUSED") {
    error = new ApiError(503, "Service unavailable. Please try again later.");
  } else if (!(error instanceof ApiError)) {
    // Format the error response
    const statusCode = error.statusCode || 500;
    const message = error.message || "Something went wrong";
    const errorResponse = {
      status: error.status,
      message: message,
      // Include additional properties from the error
      ...(error.errors && { errors: error.errors }),
      ...(error.code && { code: error.code }),
    };
    error = new ApiError(statusCode, message, errorResponse);
  }

  // Prepare error response
  const response = {
    status: error.status,
    message: error.message,
    ...(error.errors && { errors: error.errors }),
    ...(NODE_ENV === "development" && { stack: error.stack, error }),
  };

  // Ensure we always have a message property
  if (!response.message) {
    response.message = "An error occurred";
  }

  // Send error response to client
  res.status(error.statusCode).json(response);
}

/**
 * 404 Not Found middleware
 */
function notFound(req, res, next) {
  const error = new ApiError(404, `Not Found - ${req.originalUrl}`);
  next(error);
}

export { errorHandler, notFound, ApiError };
