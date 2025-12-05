"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
var express_1 = require("express");
var cors_1 = require("cors");
var helmet_1 = require("helmet");
var morgan_1 = require("morgan");
var client_1 = require("@prisma/client");
var config_js_1 = require("./config/config.js");
var auth_routes_js_1 = require("./routes/auth.routes.js");
var http_status_codes_1 = require("http-status-codes");
var cacheEngine_js_1 = require("./utils/cacheEngine.js");
var performanceMonitor_js_1 = require("./utils/performanceMonitor.js");
var rateLimiter_js_1 = require("./utils/rateLimiter.js");
var errorHandler_js_1 = require("./utils/errorHandler.js");
var logger_js_1 = require("./utils/logger.js");
var healthChecker_js_1 = require("./utils/healthChecker.js");
exports.prisma = new client_1.PrismaClient();
// Create Express app
var app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: config_js_1.config.security.cors.origin,
    methods: __spreadArray([], config_js_1.config.security.cors.methods, true),
    allowedHeaders: __spreadArray([], config_js_1.config.security.cors.allowedHeaders, true),
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Performance monitoring middleware
app.use(performanceMonitor_js_1.PerformanceMonitor.performanceMiddleware());
// Rate limiting middleware
app.use(rateLimiter_js_1.RateLimiter.perIPAdaptive);
// Logging
if (process.env.NODE_ENV !== 'production') {
    app.use((0, morgan_1.default)('dev'));
}
// Enhanced health check endpoint
app.get('/api/health', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, healthChecker_js_1.HealthChecker.detailedHealth(req, res)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// Readiness probe
app.get('/api/ready', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, healthChecker_js_1.HealthChecker.readiness(req, res)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// Liveness probe
app.get('/api/live', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, healthChecker_js_1.HealthChecker.liveness(req, res)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// Performance metrics endpoint
app.get('/api/metrics', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, healthChecker_js_1.MetricsCollector.prometheusMetrics(req, res)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// API Routes with rate limiting
app.use('/api/auth', rateLimiter_js_1.RateLimiter.perUserLimit('auth'), auth_routes_js_1.default);
// 404 handler with logging
app.use(function (req, res) {
    logger_js_1.logger.info('Request received', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Resource not found',
        error: {
            code: 'NOT_FOUND',
            path: req.path
        }
    });
});
// Global error handler with enhanced logging
app.use(errorHandler_js_1.errorHandler);
// Initialize services before starting server
function startServer() {
    return __awaiter(this, void 0, void 0, function () {
        var PORT_1, server, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    // Initialize cache
                    return [4 /*yield*/, cacheEngine_js_1.CacheEngine.initialize()];
                case 1:
                    // Initialize cache
                    _a.sent();
                    // Log server startup
                    logger_js_1.logger.info('Server starting up', {
                        port: config_js_1.config.port,
                        environment: process.env.NODE_ENV || 'development',
                        nodeVersion: process.version
                    });
                    PORT_1 = config_js_1.config.port;
                    server = app.listen(PORT_1, function () {
                        console.log("Server running in ".concat(process.env.NODE_ENV || 'development', " mode on port ").concat(PORT_1));
                    });
                    return [2 /*return*/, server];
                case 2:
                    error_1 = _a.sent();
                    console.error('Failed to initialize server:', error_1);
                    process.exit(1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Start server
startServer();
// Handle unhandled promise rejections
process.on('unhandledRejection', function (err) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        console.error('Unhandled Rejection:', err);
        logger_js_1.logger.error('Unhandled promise rejection', {
            error: err.message,
            stack: err.stack
        });
        process.exit(1);
        return [2 /*return*/];
    });
}); });
// Handle uncaught exceptions
process.on('uncaughtException', function (err) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        console.error('Uncaught Exception:', err);
        logger_js_1.logger.error('Uncaught exception', {
            error: err.message,
            stack: err.stack
        });
        process.exit(1);
        return [2 /*return*/];
    });
}); });
// Handle SIGTERM
process.on('SIGTERM', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        console.log('SIGTERM received. Shutting down gracefully');
        logger_js_1.logger.info('Server shutting down', {
            signal: 'SIGTERM'
        });
        process.exit(0);
        return [2 /*return*/];
    });
}); });
exports.default = app;
