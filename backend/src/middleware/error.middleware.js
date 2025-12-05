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
exports.catchAsync = exports.globalErrorHandler = exports.handlePrismaError = exports.handleJWTExpiredError = exports.handleJWTError = exports.handleValidationError = exports.AppError = void 0;
var config_1 = require("../config/config");
var client_1 = require("@prisma/client");
var AppError = /** @class */ (function (_super) {
    __extends(AppError, _super);
    function AppError(message, statusCode) {
        var _this = _super.call(this, message) || this;
        _this.statusCode = statusCode;
        _this.status = "".concat(statusCode).startsWith('4') ? 'fail' : 'error';
        _this.isOperational = true;
        Error.captureStackTrace(_this, _this.constructor);
        return _this;
    }
    return AppError;
}(Error));
exports.AppError = AppError;
var handleValidationError = function (err) {
    var errors = Object.values(err.errors).map(function (el) { return el.message; });
    var message = "Invalid input data: ".concat(errors.join('. '));
    return new AppError(message, 400);
};
exports.handleValidationError = handleValidationError;
var handleJWTError = function () {
    return new AppError('Invalid token. Please log in again!', 401);
};
exports.handleJWTError = handleJWTError;
var handleJWTExpiredError = function () {
    return new AppError('Your token has expired! Please log in again.', 401);
};
exports.handleJWTExpiredError = handleJWTExpiredError;
var handlePrismaError = function (err) {
    var _a, _b;
    if (err.code === 'P2002') {
        var field = ((_b = (_a = err.meta) === null || _a === void 0 ? void 0 : _a.target) === null || _b === void 0 ? void 0 : _b[0]) || 'field';
        return new AppError("Duplicate ".concat(field, " value. Please use another value."), 400);
    }
    if (err.code === 'P2025') {
        return new AppError('The requested record was not found.', 404);
    }
    return new AppError('Something went wrong with the database operation.', 500);
};
exports.handlePrismaError = handlePrismaError;
var globalErrorHandler = function (err, req, res, next) {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    var error = __assign({}, err);
    error.message = err.message;
    error.stack = err.stack;
    // Handle specific error types
    if (error.name === 'ValidationError')
        error = (0, exports.handleValidationError)(error);
    if (error.name === 'JsonWebTokenError')
        error = (0, exports.handleJWTError)();
    if (error.name === 'TokenExpiredError')
        error = (0, exports.handleJWTExpiredError)();
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        error = (0, exports.handlePrismaError)(error);
    }
    // Log error in development
    if (!config_1.config.isProduction) {
        console.error('Error 💥', error);
    }
    // Send response
    res.status(error.statusCode).json(__assign(__assign({ status: error.status, message: error.message }, (!config_1.config.isProduction && { stack: error.stack })), (error.isOperational ? null : { message: 'Something went wrong!' })));
};
exports.globalErrorHandler = globalErrorHandler;
var catchAsync = function (fn) {
    return function (req, res, next) {
        fn(req, res, next).catch(next);
    };
};
exports.catchAsync = catchAsync;
