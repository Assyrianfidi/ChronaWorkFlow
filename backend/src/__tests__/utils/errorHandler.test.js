"use strict";
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === "function" ? Iterator : Object).prototype,
      );
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, "__esModule", { value: true });
var errorHandler_1 = require("../../utils/errorHandler");
var client_1 = require("@prisma/client");
describe("Error Handler Utils", function () {
  var mockReq;
  var mockRes;
  var mockNext;
  beforeEach(function () {
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
    errorHandler_1.SystemPanicMonitor.reset();
  });
  describe("ApiError", function () {
    it("should create ApiError with default values", function () {
      var error = new errorHandler_1.ApiError("Test error");
      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe(errorHandler_1.ErrorCodes.INTERNAL_ERROR);
      expect(error.isOperational).toBe(true);
      expect(error.details).toBeUndefined();
    });
    it("should create ApiError with custom values", function () {
      var details = { field: "email" };
      var error = new errorHandler_1.ApiError(
        "Validation failed",
        400,
        errorHandler_1.ErrorCodes.VALIDATION_ERROR,
        true,
        details,
      );
      expect(error.message).toBe("Validation failed");
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(errorHandler_1.ErrorCodes.VALIDATION_ERROR);
      expect(error.isOperational).toBe(true);
      expect(error.details).toEqual(details);
    });
  });
  describe("createErrorResponse", function () {
    it("should create basic error response", function () {
      var response = (0, errorHandler_1.createErrorResponse)(
        errorHandler_1.ErrorCodes.VALIDATION_ERROR,
        "Invalid input",
      );
      expect(response.success).toBe(false);
      expect(response.error.code).toBe(
        errorHandler_1.ErrorCodes.VALIDATION_ERROR,
      );
      expect(response.error.message).toBe("Invalid input");
      expect(response.error.timestamp).toBeDefined();
      expect(response.meta).toBeDefined();
    });
    it("should include details when provided", function () {
      var details = { field: "email" };
      var response = (0, errorHandler_1.createErrorResponse)(
        errorHandler_1.ErrorCodes.VALIDATION_ERROR,
        "Invalid input",
        details,
      );
      expect(response.error.details).toEqual(details);
    });
    it("should include requestId when provided", function () {
      var requestId = "req-123";
      var response = (0, errorHandler_1.createErrorResponse)(
        errorHandler_1.ErrorCodes.VALIDATION_ERROR,
        "Invalid input",
        undefined,
        400,
        requestId,
      );
      expect(response.error.requestId).toBe(requestId);
    });
  });
  describe("globalErrorHandler", function () {
    it("should handle ApiError correctly", function () {
      var error = new errorHandler_1.ApiError(
        "Test error",
        404,
        errorHandler_1.ErrorCodes.NOT_FOUND,
      );
      (0, errorHandler_1.globalErrorHandler)(error, mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: errorHandler_1.ErrorCodes.NOT_FOUND,
            message: "Test error",
          }),
        }),
      );
    });
    it("should handle Prisma known request errors", function () {
      var error = new client_1.Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        { code: "P2002", clientVersion: "4.0.0", meta: { target: ["email"] } },
      );
      (0, errorHandler_1.globalErrorHandler)(error, mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: errorHandler_1.ErrorCodes.DUPLICATE_RESOURCE,
          }),
        }),
      );
    });
    it("should handle Prisma record not found errors", function () {
      var error = new client_1.Prisma.PrismaClientKnownRequestError(
        "Record not found",
        { code: "P2025", clientVersion: "4.0.0" },
      );
      (0, errorHandler_1.globalErrorHandler)(error, mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: errorHandler_1.ErrorCodes.RESOURCE_NOT_FOUND,
          }),
        }),
      );
    });
    it("should handle JWT errors", function () {
      var jwtError = new Error("Invalid token");
      jwtError.name = "JsonWebTokenError";
      (0, errorHandler_1.globalErrorHandler)(
        jwtError,
        mockReq,
        mockRes,
        mockNext,
      );
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: errorHandler_1.ErrorCodes.TOKEN_INVALID,
          }),
        }),
      );
    });
    it("should handle generic errors", function () {
      var error = new Error("Something went wrong");
      (0, errorHandler_1.globalErrorHandler)(error, mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: errorHandler_1.ErrorCodes.INTERNAL_ERROR,
            message: "Something went wrong",
          }),
        }),
      );
    });
  });
  describe("notFoundHandler", function () {
    it("should create 404 error for undefined routes", function () {
      mockReq = __assign(__assign({}, mockReq), {
        originalUrl: "/undefined-route",
      });
      (0, errorHandler_1.notFoundHandler)(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Route /undefined-route not found"),
          statusCode: 404,
          code: errorHandler_1.ErrorCodes.ENDPOINT_NOT_FOUND,
        }),
      );
    });
  });
  describe("asyncHandler", function () {
    it("should handle resolved promises", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var mockFn, wrappedFn;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              mockFn = jest.fn().mockResolvedValue("success");
              wrappedFn = (0, errorHandler_1.asyncHandler)(mockFn);
              return [4 /*yield*/, wrappedFn(mockReq, mockRes, mockNext)];
            case 1:
              _a.sent();
              expect(mockFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
              expect(mockNext).not.toHaveBeenCalled();
              return [2 /*return*/];
          }
        });
      });
    });
    it("should handle rejected promises", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var error, mockFn, wrappedFn;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              error = new Error("Async error");
              mockFn = jest.fn().mockRejectedValue(error);
              wrappedFn = (0, errorHandler_1.asyncHandler)(mockFn);
              return [4 /*yield*/, wrappedFn(mockReq, mockRes, mockNext)];
            case 1:
              _a.sent();
              expect(mockNext).toHaveBeenCalledWith(error);
              return [2 /*return*/];
          }
        });
      });
    });
  });
  describe("SystemPanicMonitor", function () {
    beforeEach(function () {
      errorHandler_1.SystemPanicMonitor.reset();
    });
    it("should record requests correctly", function () {
      errorHandler_1.SystemPanicMonitor.recordRequest(100, false);
      errorHandler_1.SystemPanicMonitor.recordRequest(200, true);
      var health = errorHandler_1.SystemPanicMonitor.checkSystemHealth();
      expect(health.metrics.totalRequests).toBe(2);
      expect(health.metrics.errorCount).toBe(1);
      expect(health.metrics.avgResponseTime).toBe(150);
    });
    it("should detect high memory usage", function () {
      // Mock high memory usage
      var originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn().mockReturnValue({
        heapTotal: 1000,
        heapUsed: 950, // 95% usage
        external: 100,
        arrayBuffers: 50,
      });
      var health = errorHandler_1.SystemPanicMonitor.checkSystemHealth();
      expect(health.isHealthy).toBe(false);
      expect(health.issues).toContain("High memory usage: 95.00%");
      // Restore original
      process.memoryUsage = originalMemoryUsage;
    });
    it("should detect high error rate", function () {
      // Record many errors
      for (var i = 0; i < 20; i++) {
        errorHandler_1.SystemPanicMonitor.recordRequest(100, true); // Error
      }
      errorHandler_1.SystemPanicMonitor.recordRequest(100, false); // Success
      var health = errorHandler_1.SystemPanicMonitor.checkSystemHealth();
      expect(health.isHealthy).toBe(false);
      expect(health.issues).toContain("High error rate: 95.24%");
    });
    it("should detect high response time", function () {
      // Record slow requests
      for (var i = 0; i < 10; i++) {
        errorHandler_1.SystemPanicMonitor.recordRequest(6000, false); // 6 seconds
      }
      var health = errorHandler_1.SystemPanicMonitor.checkSystemHealth();
      expect(health.isHealthy).toBe(false);
      expect(health.issues).toContain("High average response time: 6000.00ms");
    });
    it("should reset metrics", function () {
      errorHandler_1.SystemPanicMonitor.recordRequest(100, true);
      errorHandler_1.SystemPanicMonitor.reset();
      var health = errorHandler_1.SystemPanicMonitor.checkSystemHealth();
      expect(health.metrics.totalRequests).toBe(0);
      expect(health.metrics.errorCount).toBe(0);
      expect(health.metrics.avgResponseTime).toBe(0);
    });
  });
});
