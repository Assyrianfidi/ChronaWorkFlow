import { Request, Response, NextFunction } from "express";
import {
  ApiError,
  ErrorCodes,
  globalErrorHandler,
  notFoundHandler,
  asyncHandler,
  SystemPanicMonitor,
  createErrorResponse,
} from "../../utils/errorHandler";
import { Prisma } from "@prisma/client";

describe("Error Handler Utils", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
      url: "/test",
      method: "GET",
      ip: "127.0.0.1",
      get: jest.fn(),
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    // Reset panic monitor
    SystemPanicMonitor.reset();
  });

  describe("ApiError", () => {
    it("should create ApiError with default values", () => {
      const error = new ApiError("Test error");

      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe(ErrorCodes.INTERNAL_ERROR);
      expect(error.isOperational).toBe(true);
      expect(error.details).toBeUndefined();
    });

    it("should create ApiError with custom values", () => {
      const details = { field: "email" };
      const error = new ApiError(
        "Validation failed",
        400,
        ErrorCodes.VALIDATION_ERROR,
        true,
        details,
      );

      expect(error.message).toBe("Validation failed");
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(error.isOperational).toBe(true);
      expect(error.details).toEqual(details);
    });
  });

  describe("createErrorResponse", () => {
    it("should create basic error response", () => {
      const response = createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        "Invalid input",
      );

      expect(response.success).toBe(false);
      expect(response.error.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(response.error.message).toBe("Invalid input");
      expect(response.error.timestamp).toBeDefined();
      expect(response.meta).toBeDefined();
    });

    it("should include details when provided", () => {
      const details = { field: "email" };
      const response = createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        "Invalid input",
        details,
      );

      expect(response.error.details).toEqual(details);
    });

    it("should include requestId when provided", () => {
      const requestId = "req-123";
      const response = createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        "Invalid input",
        undefined,
        400,
        requestId,
      );

      expect(response.error.requestId).toBe(requestId);
    });
  });

  describe("globalErrorHandler", () => {
    it("should handle ApiError correctly", () => {
      const error = new ApiError("Test error", 404, ErrorCodes.NOT_FOUND);

      globalErrorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCodes.NOT_FOUND,
            message: "Test error",
          }),
        }),
      );
    });

    it("should handle Prisma known request errors", () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        { code: "P2002", clientVersion: "4.0.0", meta: { target: ["email"] } },
      );

      globalErrorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ErrorCodes.DUPLICATE_RESOURCE,
          }),
        }),
      );
    });

    it("should handle Prisma record not found errors", () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        "Record not found",
        { code: "P2025", clientVersion: "4.0.0" },
      );

      globalErrorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ErrorCodes.RESOURCE_NOT_FOUND,
          }),
        }),
      );
    });

    it("should handle JWT errors", () => {
      const jwtError = new Error("Invalid token");
      jwtError.name = "JsonWebTokenError";

      globalErrorHandler(
        jwtError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ErrorCodes.TOKEN_INVALID,
          }),
        }),
      );
    });

    it("should handle generic errors", () => {
      const error = new Error("Something went wrong");

      globalErrorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ErrorCodes.INTERNAL_ERROR,
            message: "Something went wrong",
          }),
        }),
      );
    });
  });

  describe("notFoundHandler", () => {
    it("should create 404 error for undefined routes", () => {
      mockReq = { ...mockReq, originalUrl: "/undefined-route" };

      notFoundHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Route /undefined-route not found"),
          statusCode: 404,
          code: ErrorCodes.ENDPOINT_NOT_FOUND,
        }),
      );
    });
  });

  describe("asyncHandler", () => {
    it("should handle resolved promises", async () => {
      const mockFn = jest.fn().mockResolvedValue("success");
      const wrappedFn = asyncHandler(mockFn);

      await wrappedFn(mockReq as Request, mockRes as Response, mockNext);

      expect(mockFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle rejected promises", async () => {
      const error = new Error("Async error");
      const mockFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = asyncHandler(mockFn);

      await wrappedFn(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("SystemPanicMonitor", () => {
    beforeEach(() => {
      SystemPanicMonitor.reset();
    });

    it("should record requests correctly", () => {
      SystemPanicMonitor.recordRequest(100, false);
      SystemPanicMonitor.recordRequest(200, true);

      const health = SystemPanicMonitor.checkSystemHealth();

      expect(health.metrics.totalRequests).toBe(2);
      expect(health.metrics.errorCount).toBe(1);
      expect(health.metrics.avgResponseTime).toBe(150);
    });

    it("should detect high memory usage", () => {
      // Mock high memory usage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn().mockReturnValue({
        heapTotal: 1000,
        heapUsed: 950, // 95% usage
        external: 100,
        arrayBuffers: 50,
      });

      const health = SystemPanicMonitor.checkSystemHealth();

      expect(health.isHealthy).toBe(false);
      expect(health.issues).toContain("High memory usage: 95.00%");

      // Restore original
      process.memoryUsage = originalMemoryUsage;
    });

    it("should detect high error rate", () => {
      // Record many errors
      for (let i = 0; i < 20; i++) {
        SystemPanicMonitor.recordRequest(100, true); // Error
      }
      SystemPanicMonitor.recordRequest(100, false); // Success

      const health = SystemPanicMonitor.checkSystemHealth();

      expect(health.isHealthy).toBe(false);
      expect(health.issues).toContain("High error rate: 95.24%");
    });

    it("should detect high response time", () => {
      // Record slow requests
      for (let i = 0; i < 10; i++) {
        SystemPanicMonitor.recordRequest(6000, false); // 6 seconds
      }

      const health = SystemPanicMonitor.checkSystemHealth();

      expect(health.isHealthy).toBe(false);
      expect(health.issues).toContain("High average response time: 6000.00ms");
    });

    it("should reset metrics", () => {
      SystemPanicMonitor.recordRequest(100, true);
      SystemPanicMonitor.reset();

      const health = SystemPanicMonitor.checkSystemHealth();

      expect(health.metrics.totalRequests).toBe(0);
      expect(health.metrics.errorCount).toBe(0);
      expect(health.metrics.avgResponseTime).toBe(0);
    });
  });
});
