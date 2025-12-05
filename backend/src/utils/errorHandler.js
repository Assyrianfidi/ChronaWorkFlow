"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.SystemPanicMonitor = exports.notFoundHandler = exports.asyncHandler = exports.globalErrorHandler = exports.createErrorResponse = exports.ApiError = exports.ErrorCodes = void 0;
var client_1 = require("@prisma/client");
var config_js_1 = require("../config/config.js");
/**
 * Error codes for consistent API responses
 */
var ErrorCodes;
(function (ErrorCodes) {
    // Validation errors (400)
    ErrorCodes["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCodes["INVALID_INPUT"] = "INVALID_INPUT";
    ErrorCodes["MISSING_REQUIRED_FIELD"] = "MISSING_REQUIRED_FIELD";
    ErrorCodes["INVALID_FORMAT"] = "INVALID_FORMAT";
    // Authentication errors (401)
    ErrorCodes["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCodes["INVALID_CREDENTIALS"] = "INVALID_CREDENTIALS";
    ErrorCodes["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    ErrorCodes["TOKEN_INVALID"] = "TOKEN_INVALID";
    // Authorization errors (403)
    ErrorCodes["FORBIDDEN"] = "FORBIDDEN";
    ErrorCodes["INSUFFICIENT_PERMISSIONS"] = "INSUFFICIENT_PERMISSIONS";
    ErrorCodes["ACCOUNT_SUSPENDED"] = "ACCOUNT_SUSPENDED";
    // Not found errors (404)
    ErrorCodes["NOT_FOUND"] = "NOT_FOUND";
    ErrorCodes["RESOURCE_NOT_FOUND"] = "RESOURCE_NOT_FOUND";
    ErrorCodes["ENDPOINT_NOT_FOUND"] = "ENDPOINT_NOT_FOUND";
    // Conflict errors (409)
    ErrorCodes["CONFLICT"] = "CONFLICT";
    ErrorCodes["DUPLICATE_RESOURCE"] = "DUPLICATE_RESOURCE";
    ErrorCodes["RESOURCE_LOCKED"] = "RESOURCE_LOCKED";
    // Rate limiting (429)
    ErrorCodes["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    ErrorCodes["TOO_MANY_REQUESTS"] = "TOO_MANY_REQUESTS";
    // Server errors (500)
    ErrorCodes["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCodes["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorCodes["EXTERNAL_SERVICE_ERROR"] = "EXTERNAL_SERVICE_ERROR";
    // Service unavailable (503)
    ErrorCodes["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
    ErrorCodes["MAINTENANCE_MODE"] = "MAINTENANCE_MODE";
})(ErrorCodes || (exports.ErrorCodes = ErrorCodes = {}));
/**
 * Custom error class with error code
 */
var ApiError = /** @class */ (function (_super) {
    __extends(ApiError, _super);
    function ApiError(message, statusCode, code, isOperational, details) {
        if (statusCode === void 0) { statusCode = 500; }
        if (code === void 0) { code = ErrorCodes.INTERNAL_ERROR; }
        if (isOperational === void 0) { isOperational = true; }
        var _this = _super.call(this, message) || this;
        _this.statusCode = statusCode;
        _this.code = code;
        _this.isOperational = isOperational;
        _this.details = details;
        Error.captureStackTrace(_this, _this.constructor);
        return _this;
    }
    return ApiError;
}(Error));
exports.ApiError = ApiError;
/**
 * Create standardized error response
 */
var createErrorResponse = function (code, message, details, statusCode, requestId) {
    if (statusCode === void 0) { statusCode = 500; }
    var response = {
        success: false,
        error: {
            code: code,
            message: message,
            timestamp: new Date().toISOString(),
            requestId: requestId,
        },
        meta: {
            version: process.env.npm_package_version || '1.0.0',
            environment: config_js_1.config.env,
        },
    };
    if (details) {
        response.error.details = details;
    }
    // Include stack trace in development
    if (config_js_1.config.env === 'development' && details instanceof Error) {
        response.error.stack = details.stack;
    }
    return response;
};
exports.createErrorResponse = createErrorResponse;
/**
 * Global error handler middleware
 */
var globalErrorHandler = function (err, req, res, next) {
    var _a;
    var error = err;
    var statusCode = 500;
    var errorCode = ErrorCodes.INTERNAL_ERROR;
    var details = undefined;
    // Handle known error types
    if (error instanceof ApiError) {
        statusCode = error.statusCode;
        errorCode = error.code;
        details = error.details;
    }
    else if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        // Handle Prisma errors
        switch (error.code) {
            case 'P2002':
                statusCode = 409;
                errorCode = ErrorCodes.DUPLICATE_RESOURCE;
                details = { field: (_a = error.meta) === null || _a === void 0 ? void 0 : _a.target };
                break;
            case 'P2025':
                statusCode = 404;
                errorCode = ErrorCodes.RESOURCE_NOT_FOUND;
                break;
            default:
                statusCode = 500;
                errorCode = ErrorCodes.DATABASE_ERROR;
                details = { prismaCode: error.code };
        }
    }
    else if (error instanceof client_1.Prisma.PrismaClientValidationError) {
        statusCode = 400;
        errorCode = ErrorCodes.VALIDATION_ERROR;
        details = error.message;
    }
    else if (error.name === 'ValidationError') {
        statusCode = 400;
        errorCode = ErrorCodes.VALIDATION_ERROR;
        details = error.message;
    }
    else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        errorCode = ErrorCodes.TOKEN_INVALID;
    }
    else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        errorCode = ErrorCodes.TOKEN_EXPIRED;
    }
    else if (error.name === 'MulterError') {
        statusCode = 400;
        errorCode = ErrorCodes.INVALID_INPUT;
        details = error.message;
    }
    // Log error for debugging
    console.error("[ERROR] ".concat(errorCode, ": ").concat(error.message), {
        statusCode: statusCode,
        requestId: req.headers['x-request-id'],
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        stack: error.stack,
    });
    // Send error response
    var errorResponse = (0, exports.createErrorResponse)(errorCode, error.message, details, statusCode, req.headers['x-request-id']);
    res.status(statusCode).json(errorResponse);
};
exports.globalErrorHandler = globalErrorHandler;
/**
 * Async wrapper to catch unhandled promise rejections
 */
var asyncHandler = function (fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
/**
 * 404 handler for undefined routes
 */
var notFoundHandler = function (req, res, next) {
    var error = new ApiError("Route ".concat(req.originalUrl, " not found"), 404, ErrorCodes.ENDPOINT_NOT_FOUND);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
/**
 * System panic monitor - detects critical system issues
 */
var SystemPanicMonitor = /** @class */ (function () {
    function SystemPanicMonitor() {
    }
    SystemPanicMonitor.recordRequest = function (responseTime, isError) {
        if (isError === void 0) { isError = false; }
        this.metrics.totalRequests++;
        if (isError)
            this.metrics.errorCount++;
        // Update average response time
        this.metrics.avgResponseTime =
            (this.metrics.avgResponseTime * (this.metrics.totalRequests - 1) + responseTime) /
                this.metrics.totalRequests;
    };
    SystemPanicMonitor.checkSystemHealth = function () {
        var issues = [];
        // Check memory usage
        var memUsage = process.memoryUsage();
        var heapUsed = memUsage.heapUsed / memUsage.heapTotal;
        if (heapUsed > this.panicThresholds.memoryUsage) {
            issues.push("High memory usage: ".concat((heapUsed * 100).toFixed(2), "%"));
        }
        // Check error rate
        var errorRate = this.metrics.errorCount / this.metrics.totalRequests;
        if (errorRate > this.panicThresholds.errorRate && this.metrics.totalRequests > 10) {
            issues.push("High error rate: ".concat((errorRate * 100).toFixed(2), "%"));
        }
        // Check response time
        if (this.metrics.avgResponseTime > this.panicThresholds.responseTime) {
            issues.push("High average response time: ".concat(this.metrics.avgResponseTime.toFixed(2), "ms"));
        }
        // Check uptime
        var uptime = Date.now() - this.metrics.startTime;
        if (uptime < 60000) { // First minute
            // Don't panic during startup
        }
        return {
            isHealthy: issues.length === 0,
            issues: issues,
            metrics: __assign({}, this.metrics),
        };
    };
    SystemPanicMonitor.reset = function () {
        this.metrics = {
            totalRequests: 0,
            errorCount: 0,
            avgResponseTime: 0,
            startTime: Date.now(),
        };
    };
    SystemPanicMonitor.panicThresholds = {
        memoryUsage: 0.9, // 90%
        cpuUsage: 0.95, // 95%
        errorRate: 0.1, // 10%
        responseTime: 5000, // 5 seconds
    };
    SystemPanicMonitor.metrics = {
        totalRequests: 0,
        errorCount: 0,
        avgResponseTime: 0,
        startTime: Date.now(),
    };
    return SystemPanicMonitor;
}());
exports.SystemPanicMonitor = SystemPanicMonitor;
// Export alias for compatibility
exports.errorHandler = exports.globalErrorHandler;
