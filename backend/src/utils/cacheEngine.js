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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheMiddleware = exports.CacheInvalidator = exports.CacheEngine = void 0;
var ioredis_1 = require("ioredis");
var logger_js_1 = require("./logger.js");
/**
 * Redis caching engine with intelligent invalidation
 */
var CacheEngine = /** @class */ (function () {
    function CacheEngine() {
    }
    /**
     * Initialize Redis connection
     */
    CacheEngine.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.redis = new ioredis_1.default({
                            host: process.env.REDIS_HOST || 'localhost',
                            port: parseInt(process.env.REDIS_PORT || '6379'),
                            password: process.env.REDIS_PASSWORD,
                            maxRetriesPerRequest: 3,
                            lazyConnect: true
                        });
                        this.redis.on('connect', function () {
                            _this.isConnected = true;
                            logger_js_1.logger.info({
                                type: 'INFO',
                                message: 'Redis connected',
                                details: { host: process.env.REDIS_HOST || 'localhost' }
                            });
                        });
                        this.redis.on('error', function (error) {
                            _this.isConnected = false;
                            logger_js_1.logger.info({
                                type: 'ERROR',
                                message: 'Redis connection error',
                                details: { error: error.message }
                            });
                        });
                        return [4 /*yield*/, this.redis.connect()];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        logger_js_1.logger.info({
                            type: 'ERROR',
                            message: 'Failed to initialize Redis',
                            details: { error: error_1 instanceof Error ? error_1.message : 'Unknown error' }
                        });
                        // Fallback to in-memory cache
                        this.isConnected = false;
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get cached value
     */
    CacheEngine.get = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var value, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isConnected)
                            return [2 /*return*/, null];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.redis.get(key)];
                    case 2:
                        value = _a.sent();
                        return [2 /*return*/, value ? JSON.parse(value) : null];
                    case 3:
                        error_2 = _a.sent();
                        logger_js_1.logger.info({
                            type: 'ERROR',
                            message: 'Cache get failed',
                            details: { key: key, error: error_2 instanceof Error ? error_2.message : 'Unknown error' }
                        });
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Set cached value with TTL
     */
    CacheEngine.set = function (key_1, value_1) {
        return __awaiter(this, arguments, void 0, function (key, value, ttl) {
            var error_3;
            if (ttl === void 0) { ttl = 300; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isConnected)
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.redis.setex(key, ttl, JSON.stringify(value))];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        logger_js_1.logger.info({
                            type: 'ERROR',
                            message: 'Cache set failed',
                            details: { key: key, ttl: ttl, error: error_3 instanceof Error ? error_3.message : 'Unknown error' }
                        });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Delete cached value
     */
    CacheEngine.del = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isConnected)
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.redis.del(key)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_4 = _a.sent();
                        logger_js_1.logger.info({
                            type: 'ERROR',
                            message: 'Cache delete failed',
                            details: { key: key, error: error_4 instanceof Error ? error_4.message : 'Unknown error' }
                        });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Delete multiple keys by pattern
     */
    CacheEngine.delPattern = function (pattern) {
        return __awaiter(this, void 0, void 0, function () {
            var keys, error_5;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.isConnected)
                            return [2 /*return*/];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, this.redis.keys(pattern)];
                    case 2:
                        keys = _b.sent();
                        if (!(keys.length > 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, (_a = this.redis).del.apply(_a, keys)];
                    case 3:
                        _b.sent();
                        logger_js_1.logger.info({
                            type: 'INFO',
                            message: 'Cache pattern deleted',
                            details: { pattern: pattern, deletedCount: keys.length }
                        });
                        _b.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_5 = _b.sent();
                        logger_js_1.logger.info({
                            type: 'ERROR',
                            message: 'Cache pattern delete failed',
                            details: { pattern: pattern, error: error_5 instanceof Error ? error_5.message : 'Unknown error' }
                        });
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Increment counter
     */
    CacheEngine.incr = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isConnected)
                            return [2 /*return*/, 0];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.redis.incr(key)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_6 = _a.sent();
                        logger_js_1.logger.info({
                            type: 'ERROR',
                            message: 'Cache increment failed',
                            details: { key: key, error: error_6 instanceof Error ? error_6.message : 'Unknown error' }
                        });
                        return [2 /*return*/, 0];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if key exists
     */
    CacheEngine.exists = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isConnected)
                            return [2 /*return*/, false];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.redis.exists(key)];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result === 1];
                    case 3:
                        error_7 = _a.sent();
                        logger_js_1.logger.info({
                            type: 'ERROR',
                            message: 'Cache exists check failed',
                            details: { key: key, error: error_7 instanceof Error ? error_7.message : 'Unknown error' }
                        });
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CacheEngine.isConnected = false;
    return CacheEngine;
}());
exports.CacheEngine = CacheEngine;
/**
 * Cache invalidation strategies
 */
var CacheInvalidator = /** @class */ (function () {
    function CacheInvalidator() {
    }
    /**
     * Invalidate user-specific caches
     */
    CacheInvalidator.invalidateUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, CacheEngine.delPattern("user:".concat(userId, ":*"))];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, CacheEngine.delPattern("transactions:user:".concat(userId, ":*"))];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, CacheEngine.delPattern("balances:user:".concat(userId, ":*"))];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Invalidate account-specific caches
     */
    CacheInvalidator.invalidateAccount = function (accountId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, CacheEngine.delPattern("account:".concat(accountId, ":*"))];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, CacheEngine.delPattern("balances:account:".concat(accountId, ":*"))];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, CacheEngine.delPattern("transactions:account:".concat(accountId, ":*"))];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Invalidate transaction caches
     */
    CacheInvalidator.invalidateTransaction = function (transactionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, CacheEngine.del("transaction:".concat(transactionId))];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, CacheEngine.delPattern("transactions:*:".concat(transactionId, ":*"))];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Invalidate all financial data caches
     */
    CacheInvalidator.invalidateFinancialData = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, CacheEngine.delPattern('balances:*')];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, CacheEngine.delPattern('transactions:*')];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, CacheEngine.delPattern('reports:*')];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return CacheInvalidator;
}());
exports.CacheInvalidator = CacheInvalidator;
/**
 * Performance middleware for caching
 */
var CacheMiddleware = /** @class */ (function () {
    function CacheMiddleware() {
    }
    /**
     * Cache middleware for API responses
     */
    CacheMiddleware.cacheResponse = function (ttl) {
        if (ttl === void 0) { ttl = 300; }
        return function (target, propertyName, descriptor) {
            var method = descriptor.value;
            descriptor.value = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return __awaiter(this, void 0, void 0, function () {
                    var cacheKey, cached, result;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                cacheKey = "".concat(propertyName, ":").concat(JSON.stringify(args));
                                return [4 /*yield*/, CacheEngine.get(cacheKey)];
                            case 1:
                                cached = _a.sent();
                                if (cached) {
                                    logger_js_1.logger.info({
                                        type: 'INFO',
                                        message: 'Cache hit',
                                        details: { method: propertyName, cacheKey: cacheKey }
                                    });
                                    return [2 /*return*/, cached];
                                }
                                return [4 /*yield*/, method.apply(this, args)];
                            case 2:
                                result = _a.sent();
                                return [4 /*yield*/, CacheEngine.set(cacheKey, result, ttl)];
                            case 3:
                                _a.sent();
                                logger_js_1.logger.info({
                                    type: 'INFO',
                                    message: 'Cache miss - result cached',
                                    details: { method: propertyName, cacheKey: cacheKey, ttl: ttl }
                                });
                                return [2 /*return*/, result];
                        }
                    });
                });
            };
        };
    };
    /**
     * Rate limit cache
     */
    CacheMiddleware.checkRateLimit = function (identifier, limit, window) {
        return __awaiter(this, void 0, void 0, function () {
            var key, now, windowStart, requests, validRequests;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = "rate_limit:".concat(identifier);
                        now = Date.now();
                        windowStart = now - (window * 1000);
                        return [4 /*yield*/, CacheEngine.get(key)];
                    case 1:
                        requests = (_a.sent()) || [];
                        validRequests = requests.filter(function (timestamp) { return timestamp > windowStart; });
                        if (validRequests.length >= limit) {
                            return [2 /*return*/, {
                                    allowed: false,
                                    remaining: 0,
                                    resetTime: validRequests[0] + window * 1000
                                }];
                        }
                        // Add current request
                        validRequests.push(now);
                        return [4 /*yield*/, CacheEngine.set(key, validRequests, window)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, {
                                allowed: true,
                                remaining: limit - validRequests.length,
                                resetTime: now + window * 1000
                            }];
                }
            });
        });
    };
    return CacheMiddleware;
}());
exports.CacheMiddleware = CacheMiddleware;
