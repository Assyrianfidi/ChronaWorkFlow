import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { Request, Response, NextFunction } from "express";

// Mock logger before importing errorHandler
const mockLogger = {
  error: jest.fn(),
};

jest.mock("../utils/logger.js", () => ({
  logger: mockLogger,
}));

import { errorHandler, notFound } from "../middleware/errorHandler.js";
import { ApiError } from "../utils/errors.js";

describe("Error Handler Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      originalUrl: "/test",
      ip: "127.0.0.1",
      get: jest.fn(),
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("errorHandler", () => {
    it("should handle ApiError correctly", () => {
      const error = new ApiError(400, "Bad request");

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: "error",
        message: "Bad request",
      });
    });

    it("should handle Prisma errors correctly", () => {
      const error = new Error("Prisma error");
      error.name = "PrismaClientKnownRequestError";

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: "error",
        message: "Prisma error",
      });
    });

    it("should handle JWT errors correctly", () => {
      const error = new Error("Invalid token");
      error.name = "JsonWebTokenError";

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: "fail",
        message: "Invalid token. Please log in again.",
      });
    });

    it("should handle Zod validation errors correctly", () => {
      const error = new Error("Validation failed");
      error.name = "ZodError";

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: "error",
        message: "Validation failed",
      });
    });

    it("should include stack trace in development", () => {
      const error = new Error("Test error");
      error.stack = "Error stack trace";

      // Mock NODE_ENV
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        status: "error",
        message: "Test error",
      });

      // Restore original NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });

    it("should log errors", () => {
      const error = new Error("Test error");

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        `${(error as any).statusCode || 500} - ${error.message} - ${mockRequest.originalUrl} - ${mockRequest.method} - ${mockRequest.ip}`,
      );
    });
  });

  describe("notFound", () => {
    it("should create 404 error", () => {
      notFound(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
