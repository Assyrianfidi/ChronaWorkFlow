"use strict";
/**
 * Cache Manager Implementation
 * Simple in-memory cache with TTL support
 */
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
exports.CacheManager = void 0;
var CacheManager = /** @class */ (function () {
    function CacheManager() {
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0
        };
    }
    /**
     * Set a value in cache
     */
    CacheManager.prototype.set = function (key_1, value_1) {
        return __awaiter(this, arguments, void 0, function (key, value, options) {
            var now, entry;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                now = Date.now();
                entry = __assign(__assign({ value: value, createdAt: now, accessCount: 0, lastAccessed: now }, (options.ttl && { expiresAt: now + options.ttl })), (options.tags && { tags: options.tags }));
                this.cache.set(key, entry);
                this.cleanupExpired();
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get a value from cache
     */
    CacheManager.prototype.get = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var entry;
            return __generator(this, function (_a) {
                entry = this.cache.get(key);
                if (!entry) {
                    this.stats.misses++;
                    return [2 /*return*/, null];
                }
                // Check if expired
                if (entry.expiresAt && Date.now() > entry.expiresAt) {
                    this.cache.delete(key);
                    this.stats.misses++;
                    return [2 /*return*/, null];
                }
                // Update access stats
                entry.accessCount++;
                entry.lastAccessed = Date.now();
                this.stats.hits++;
                return [2 /*return*/, entry.value];
            });
        });
    };
    /**
     * Delete a key from cache
     */
    CacheManager.prototype.delete = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.cache.delete(key)];
            });
        });
    };
    /**
     * Delete keys matching a pattern
     */
    CacheManager.prototype.deletePattern = function (pattern) {
        return __awaiter(this, void 0, void 0, function () {
            var deleted, regex, _i, _a, key;
            return __generator(this, function (_b) {
                deleted = 0;
                regex = new RegExp(pattern.replace(/\*/g, '.*'));
                for (_i = 0, _a = this.cache.keys(); _i < _a.length; _i++) {
                    key = _a[_i];
                    if (regex.test(key)) {
                        this.cache.delete(key);
                        deleted++;
                    }
                }
                return [2 /*return*/, deleted];
            });
        });
    };
    /**
     * Delete keys by tags
     */
    CacheManager.prototype.deleteByTag = function (tag) {
        return __awaiter(this, void 0, void 0, function () {
            var deleted, _i, _a, _b, key, entry;
            var _c;
            return __generator(this, function (_d) {
                deleted = 0;
                for (_i = 0, _a = this.cache.entries(); _i < _a.length; _i++) {
                    _b = _a[_i], key = _b[0], entry = _b[1];
                    if ((_c = entry.tags) === null || _c === void 0 ? void 0 : _c.includes(tag)) {
                        this.cache.delete(key);
                        deleted++;
                    }
                }
                return [2 /*return*/, deleted];
            });
        });
    };
    /**
     * Check if a key exists
     */
    CacheManager.prototype.has = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var entry;
            return __generator(this, function (_a) {
                entry = this.cache.get(key);
                if (!entry) {
                    return [2 /*return*/, false];
                }
                // Check if expired
                if (entry.expiresAt && Date.now() > entry.expiresAt) {
                    this.cache.delete(key);
                    return [2 /*return*/, false];
                }
                return [2 /*return*/, true];
            });
        });
    };
    /**
     * Clear all cache
     */
    CacheManager.prototype.clear = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.cache.clear();
                this.stats = { hits: 0, misses: 0, evictions: 0 };
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get cache statistics
     */
    CacheManager.prototype.getStats = function () {
        var totalRequests = this.stats.hits + this.stats.misses;
        var hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
        var missRate = totalRequests > 0 ? (this.stats.misses / totalRequests) * 100 : 0;
        // Estimate memory usage (rough calculation)
        var memoryUsage = 0;
        for (var _i = 0, _a = this.cache.values(); _i < _a.length; _i++) {
            var entry = _a[_i];
            memoryUsage += JSON.stringify(entry.value).length * 2; // Rough estimate
        }
        return {
            size: this.cache.size,
            hitRate: hitRate,
            missRate: missRate,
            evictionRate: this.stats.evictions,
            memoryUsage: memoryUsage
        };
    };
    /**
     * Clean up expired entries
     */
    CacheManager.prototype.cleanupExpired = function () {
        var now = Date.now();
        var evicted = 0;
        for (var _i = 0, _a = this.cache.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], entry = _b[1];
            if (entry.expiresAt && now > entry.expiresAt) {
                this.cache.delete(key);
                evicted++;
            }
        }
        this.stats.evictions += evicted;
    };
    /**
     * Get all keys
     */
    CacheManager.prototype.keys = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.cleanupExpired();
                return [2 /*return*/, Array.from(this.cache.keys())];
            });
        });
    };
    /**
     * Get cache size
     */
    CacheManager.prototype.size = function () {
        this.cleanupExpired();
        return this.cache.size;
    };
    /**
     * Set TTL for existing key
     */
    CacheManager.prototype.setTTL = function (key, ttl) {
        return __awaiter(this, void 0, void 0, function () {
            var entry;
            return __generator(this, function (_a) {
                entry = this.cache.get(key);
                if (!entry) {
                    return [2 /*return*/, false];
                }
                entry.expiresAt = Date.now() + ttl;
                return [2 /*return*/, true];
            });
        });
    };
    /**
     * Get remaining TTL for key
     */
    CacheManager.prototype.getTTL = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var entry, remaining;
            return __generator(this, function (_a) {
                entry = this.cache.get(key);
                if (!entry || !entry.expiresAt) {
                    return [2 /*return*/, -1];
                }
                remaining = entry.expiresAt - Date.now();
                return [2 /*return*/, remaining > 0 ? remaining : 0];
            });
        });
    };
    return CacheManager;
}());
exports.CacheManager = CacheManager;
exports.default = CacheManager;
