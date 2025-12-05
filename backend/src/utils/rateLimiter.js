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
exports.RateLimitMiddleware = exports.RateLimiter = void 0;
var cacheEngine_js_1 = require("./cacheEngine.js");
var logger_js_1 = require("./logger.js");
var errorHandler_js_1 = require("./errorHandler.js");
/**
 * Enhanced rate limiting with adaptive throttling
 */
var RateLimiter = /** @class */ (function () {
    function RateLimiter() {
    }
    /**
     * Per-user rate limiting
     */
    RateLimiter.perUserLimit = function (category, customLimit) {
        var _this = this;
        var limit = customLimit || this.DEFAULT_LIMITS[category];
        return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var userId, identifier, ip, result;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        userId = ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) || req.ip;
                        identifier = "user:".concat(userId, ":").concat(category);
                        ip = req.ip || 'unknown';
                        return [4 /*yield*/, cacheEngine_js_1.CacheEngine.checkRateLimit(identifier, limit.requests, limit.window)];
                    case 1:
                        result = _e.sent();
                        // Set rate limit headers
                        res.set({
                            'X-RateLimit-Limit': limit.requests,
                            'X-RateLimit-Remaining': result.remaining,
                            'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
                        });
                        if (!!result.allowed) return [3 /*break*/, 3];
                        return [4 /*yield*/, logger_js_1.logger.warn({
                                type: 'BLOCKED_REQUEST',
                                severity: 'MEDIUM',
                                ip: ip,
                                userId: (_d = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id) === null || _d === void 0 ? void 0 : _d.toString(),
                                details: {
                                    category: category,
                                    limit: limit.requests,
                                    window: limit.window,
                                    resetTime: result.resetTime
                                }
                            })];
                    case 2:
                        _e.sent();
                        throw new errorHandler_js_1.ApiError("Rate limit exceeded for ".concat(category, ". Try again in ").concat(Math.ceil((result.resetTime - Date.now()) / 1000), " seconds."), 429, errorHandler_js_1.ErrorCodes.RATE_LIMIT_EXCEEDED);
                    case 3:
                        next();
                        return [2 /*return*/];
                }
            });
        }); };
    };
    /**
     * Per-IP adaptive throttling
     */
    RateLimiter.perIPAdaptive = function (req, res, next) {
        var _this = this;
        var ip = req.ip || 'unknown';
        var identifier = "ip:".concat(ip, ":adaptive");
        // Check IP reputation and adjust limits
        this.checkIPReputation(ip).then(function (reputation) {
            var limits = _this.getAdaptiveLimits(reputation);
            cacheEngine_js_1.CacheEngine.checkRateLimit(identifier, limits.requests, limits.window).then(function (result) {
                res.set({
                    'X-RateLimit-Limit': limits.requests,
                    'X-RateLimit-Remaining': result.remaining,
                    'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
                });
                if (!result.allowed) {
                    logger_js_1.logger.warn({
                        type: 'BLOCKED_REQUEST',
                        severity: 'HIGH',
                        ip: ip,
                        details: {
                            type: 'adaptive',
                            reputation: reputation,
                            limits: limits,
                            resetTime: result.resetTime
                        }
                    });
                    throw new errorHandler_js_1.ApiError('IP rate limit exceeded', 429, errorHandler_js_1.ErrorCodes.RATE_LIMIT_EXCEEDED);
                }
                next();
            }).catch(next);
        }).catch(next);
    };
    /**
     * Burst control for high-frequency operations
     */
    RateLimiter.burstControl = function (maxBurst, cooldownSeconds) {
        var _this = this;
        return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var userId, burstKey, cooldownKey, inCooldown, burstCount;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.ip;
                        burstKey = "burst:".concat(userId);
                        cooldownKey = "cooldown:".concat(userId);
                        return [4 /*yield*/, cacheEngine_js_1.CacheEngine.exists(cooldownKey)];
                    case 1:
                        inCooldown = _d.sent();
                        if (inCooldown) {
                            throw new errorHandler_js_1.ApiError('Too many requests. Please wait before trying again.', 429, errorHandler_js_1.ErrorCodes.TOO_MANY_REQUESTS);
                        }
                        return [4 /*yield*/, cacheEngine_js_1.CacheEngine.incr(burstKey)];
                    case 2:
                        burstCount = _d.sent();
                        if (!(burstCount === 1)) return [3 /*break*/, 4];
                        return [4 /*yield*/, cacheEngine_js_1.CacheEngine.set(burstKey, burstCount, 10)];
                    case 3:
                        _d.sent(); // 10 second window
                        _d.label = 4;
                    case 4:
                        if (!(burstCount > maxBurst)) return [3 /*break*/, 8];
                        // Activate cooldown
                        return [4 /*yield*/, cacheEngine_js_1.CacheEngine.set(cooldownKey, true, cooldownSeconds)];
                    case 5:
                        // Activate cooldown
                        _d.sent();
                        return [4 /*yield*/, cacheEngine_js_1.CacheEngine.del(burstKey)];
                    case 6:
                        _d.sent();
                        return [4 /*yield*/, logger_js_1.logger.warn({
                                type: 'BLOCKED_REQUEST',
                                severity: 'HIGH',
                                ip: req.ip || 'unknown',
                                userId: (_c = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id) === null || _c === void 0 ? void 0 : _c.toString(),
                                details: {
                                    type: 'burst_control',
                                    burstCount: burstCount,
                                    maxBurst: maxBurst,
                                    cooldownSeconds: cooldownSeconds
                                }
                            })];
                    case 7:
                        _d.sent();
                        throw new errorHandler_js_1.ApiError("Burst limit exceeded. Cooldown activated for ".concat(cooldownSeconds, " seconds."), 429, errorHandler_js_1.ErrorCodes.RATE_LIMIT_EXCEEDED);
                    case 8:
                        next();
                        return [2 /*return*/];
                }
            });
        }); };
    };
    /**
     * Check IP reputation (simplified implementation)
     */
    RateLimiter.checkIPReputation = function (ip) {
        return __awaiter(this, void 0, void 0, function () {
            var reputationKey, reputation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        reputationKey = "ip_reputation:".concat(ip);
                        return [4 /*yield*/, cacheEngine_js_1.CacheEngine.get(reputationKey)];
                    case 1:
                        reputation = _a.sent();
                        if (reputation)
                            return [2 /*return*/, reputation];
                        // Default to medium for unknown IPs
                        return [4 /*yield*/, cacheEngine_js_1.CacheEngine.set(reputationKey, 'medium', 3600)];
                    case 2:
                        // Default to medium for unknown IPs
                        _a.sent(); // Cache for 1 hour
                        return [2 /*return*/, 'medium'];
                }
            });
        });
    };
    /**
     * Get adaptive limits based on IP reputation
     */
    RateLimiter.getAdaptiveLimits = function (reputation) {
        switch (reputation) {
            case 'high':
                return { requests: 200, window: 60 }; // Trusted IP
            case 'medium':
                return { requests: 100, window: 60 }; // Normal IP
            case 'low':
                return { requests: 50, window: 60 }; // Suspicious IP
            default:
                return { requests: 100, window: 60 };
        }
    };
    /**
     * Update IP reputation based on behavior
     */
    RateLimiter.updateIPReputation = function (ip, action) {
        return __awaiter(this, void 0, void 0, function () {
            var reputationKey, current, newReputation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        reputationKey = "ip_reputation:".concat(ip);
                        return [4 /*yield*/, cacheEngine_js_1.CacheEngine.get(reputationKey)];
                    case 1:
                        current = (_a.sent()) || 'medium';
                        newReputation = current;
                        if (action === 'good' && current !== 'high') {
                            newReputation = current === 'low' ? 'medium' : 'high';
                        }
                        else if (action === 'bad' && current !== 'low') {
                            newReputation = current === 'high' ? 'medium' : 'low';
                        }
                        if (!(newReputation !== current)) return [3 /*break*/, 4];
                        return [4 /*yield*/, cacheEngine_js_1.CacheEngine.set(reputationKey, newReputation, 3600)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, logger_js_1.logger.warn({
                                type: 'SUSPICIOUS_ACTIVITY',
                                severity: 'LOW',
                                ip: ip,
                                details: {
                                    type: 'reputation_update',
                                    oldReputation: current,
                                    newReputation: newReputation,
                                    action: action
                                }
                            })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    RateLimiter.DEFAULT_LIMITS = {
        'auth': { requests: 5, window: 60 }, // 5 requests per minute
        'api': { requests: 100, window: 60 }, // 100 requests per minute
        'upload': { requests: 10, window: 60 }, // 10 uploads per minute
        'report': { requests: 20, window: 300 }, // 20 reports per 5 minutes
        'search': { requests: 50, window: 60 } // 50 searches per minute
    };
    return RateLimiter;
}());
exports.RateLimiter = RateLimiter;
/**
 * Rate limit middleware factory
 */
var RateLimitMiddleware = /** @class */ (function () {
    function RateLimitMiddleware() {
    }
    /**
     * Apply multiple rate limiters
     */
    RateLimitMiddleware.combine = function () {
        var limiters = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            limiters[_i] = arguments[_i];
        }
        return function (req, res, next) {
            var index = 0;
            var runNext = function () {
                if (index >= limiters.length) {
                    return next();
                }
                var limiter = limiters[index++];
                limiter(req, res, runNext);
            };
            runNext();
        };
    };
    /**
     * Create dynamic rate limiter based on user tier
     */
    RateLimitMiddleware.byUserTier = function (tierLimits) {
        var _this = this;
        return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var user, tier, limits, identifier, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        user = req.user;
                        tier = (user === null || user === void 0 ? void 0 : user.tier) || 'basic';
                        limits = tierLimits[tier] || tierLimits['basic'];
                        identifier = "user:".concat((user === null || user === void 0 ? void 0 : user.id) || req.ip, ":tier:").concat(tier);
                        return [4 /*yield*/, cacheEngine_js_1.CacheEngine.checkRateLimit(identifier, limits.requests, limits.window)];
                    case 1:
                        result = _a.sent();
                        res.set({
                            'X-RateLimit-Limit': limits.requests,
                            'X-RateLimit-Remaining': result.remaining,
                            'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
                            'X-User-Tier': tier
                        });
                        if (!result.allowed) {
                            throw new errorHandler_js_1.ApiError("Rate limit exceeded for ".concat(tier, " tier"), 429, errorHandler_js_1.ErrorCodes.RATE_LIMIT_EXCEEDED);
                        }
                        next();
                        return [2 /*return*/];
                }
            });
        }); };
    };
    return RateLimitMiddleware;
}());
exports.RateLimitMiddleware = RateLimitMiddleware;
