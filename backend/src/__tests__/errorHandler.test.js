"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var globals_1 = require("@jest/globals");
// Mock logger before importing errorHandler
var mockLogger = {
  error: jest.fn(),
};
jest.mock("../utils/logger.js", function () {
  return {
    logger: mockLogger,
  };
});
var errorHandler_js_1 = require("../middleware/errorHandler.js");
var errors_js_1 = require("../utils/errors.js");
(0, globals_1.describe)("Error Handler Middleware", function () {
  var mockRequest;
  var mockResponse;
  var nextFunction;
  (0, globals_1.beforeEach)(function () {
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
  (0, globals_1.afterEach)(function () {
    jest.clearAllMocks();
  });
  (0, globals_1.describe)("errorHandler", function () {
    (0, globals_1.it)("should handle ApiError correctly", function () {
      var error = new errors_js_1.ApiError(400, "Bad request");
      (0, errorHandler_js_1.errorHandler)(
        error,
        mockRequest,
        mockResponse,
        nextFunction,
      );
      (0, globals_1.expect)(mockResponse.status).toHaveBeenCalledWith(400);
      (0, globals_1.expect)(mockResponse.json).toHaveBeenCalledWith({
        status: "error",
        message: "Bad request",
      });
    });
    (0, globals_1.it)("should handle Prisma errors correctly", function () {
      var error = new Error("Prisma error");
      error.name = "PrismaClientKnownRequestError";
      (0, errorHandler_js_1.errorHandler)(
        error,
        mockRequest,
        mockResponse,
        nextFunction,
      );
      (0, globals_1.expect)(mockResponse.status).toHaveBeenCalledWith(500);
      (0, globals_1.expect)(mockResponse.json).toHaveBeenCalledWith({
        status: "error",
        message: "Prisma error",
      });
    });
    (0, globals_1.it)("should handle JWT errors correctly", function () {
      var error = new Error("Invalid token");
      error.name = "JsonWebTokenError";
      (0, errorHandler_js_1.errorHandler)(
        error,
        mockRequest,
        mockResponse,
        nextFunction,
      );
      (0, globals_1.expect)(mockResponse.status).toHaveBeenCalledWith(401);
      (0, globals_1.expect)(mockResponse.json).toHaveBeenCalledWith({
        status: "fail",
        message: "Invalid token. Please log in again.",
      });
    });
    (0, globals_1.it)(
      "should handle Zod validation errors correctly",
      function () {
        var error = new Error("Validation failed");
        error.name = "ZodError";
        (0, errorHandler_js_1.errorHandler)(
          error,
          mockRequest,
          mockResponse,
          nextFunction,
        );
        (0, globals_1.expect)(mockResponse.status).toHaveBeenCalledWith(500);
        (0, globals_1.expect)(mockResponse.json).toHaveBeenCalledWith({
          status: "error",
          message: "Validation failed",
        });
      },
    );
    (0, globals_1.it)("should include stack trace in development", function () {
      var error = new Error("Test error");
      error.stack = "Error stack trace";
      // Mock NODE_ENV
      var originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      (0, errorHandler_js_1.errorHandler)(
        error,
        mockRequest,
        mockResponse,
        nextFunction,
      );
      (0, globals_1.expect)(mockResponse.json).toHaveBeenCalledWith({
        status: "error",
        message: "Test error",
      });
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });
    (0, globals_1.it)("should log errors", function () {
      var error = new Error("Test error");
      (0, errorHandler_js_1.errorHandler)(
        error,
        mockRequest,
        mockResponse,
        nextFunction,
      );
      (0, globals_1.expect)(mockLogger.error).toHaveBeenCalledWith(
        ""
          .concat(error.statusCode || 500, " - ")
          .concat(error.message, " - ")
          .concat(mockRequest.originalUrl, " - ")
          .concat(mockRequest.method, " - ")
          .concat(mockRequest.ip),
      );
    });
  });
  (0, globals_1.describe)("notFound", function () {
    (0, globals_1.it)("should create 404 error", function () {
      (0, errorHandler_js_1.notFound)(mockRequest, mockResponse, nextFunction);
      (0, globals_1.expect)(nextFunction).toHaveBeenCalledWith(
        globals_1.expect.any(Error),
      );
    });
  });
});
