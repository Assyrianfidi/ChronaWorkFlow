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
var globals_1 = require("@jest/globals");
var cacheEngine_1 = require("../../../utils/cacheEngine");
var rateLimiter_1 = require("../../../utils/rateLimiter");
var paginationEngine_1 = require("../../../utils/paginationEngine");
var performanceMonitor_1 = require("../../../utils/performanceMonitor");
var loggingBridge_1 = require("../../../utils/loggingBridge");
// Mock dependencies
globals_1.jest.mock('../../loggingBridge');
var mockLoggingBridge = loggingBridge_1.LoggingBridge;
(0, globals_1.describe)('Performance Layer Tests', function () {
    (0, globals_1.beforeEach)(function () {
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.describe)('CacheEngine', function () {
        (0, globals_1.beforeEach)(function () {
            // Reset cache state
            cacheEngine_1.CacheEngine['isConnected'] = false;
        });
        (0, globals_1.it)('should handle get operation when not connected', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, cacheEngine_1.CacheEngine.get('test-key')];
                    case 1:
                        result = _a.sent();
                        (0, globals_1.expect)(result).toBeNull();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should handle set operation when not connected', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, globals_1.expect)(cacheEngine_1.CacheEngine.set('test-key', 'value', 300)).resolves.toBeUndefined()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should handle delete operation when not connected', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, globals_1.expect)(cacheEngine_1.CacheEngine.del('test-key')).resolves.toBeUndefined()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should handle pattern delete when not connected', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, globals_1.expect)(cacheEngine_1.CacheEngine.delPattern('test-*')).resolves.toBeUndefined()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should handle increment operation when not connected', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, cacheEngine_1.CacheEngine.incr('counter')];
                    case 1:
                        result = _a.sent();
                        (0, globals_1.expect)(result).toBe(0);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should handle exists check when not connected', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, cacheEngine_1.CacheEngine.exists('test-key')];
                    case 1:
                        result = _a.sent();
                        (0, globals_1.expect)(result).toBe(false);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, globals_1.describe)('CacheInvalidator', function () {
        (0, globals_1.it)('should invalidate user caches', function () { return __awaiter(void 0, void 0, void 0, function () {
            var delPatternSpy;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        delPatternSpy = globals_1.jest.spyOn(cacheEngine_1.CacheEngine, 'delPattern');
                        return [4 /*yield*/, cacheEngine_1.CacheInvalidator.invalidateUser('user123')];
                    case 1:
                        _a.sent();
                        (0, globals_1.expect)(delPatternSpy).toHaveBeenCalledWith('user:user123:*');
                        (0, globals_1.expect)(delPatternSpy).toHaveBeenCalledWith('transactions:user:user123:*');
                        (0, globals_1.expect)(delPatternSpy).toHaveBeenCalledWith('balances:user:user123:*');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should invalidate account caches', function () { return __awaiter(void 0, void 0, void 0, function () {
            var delPatternSpy;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        delPatternSpy = globals_1.jest.spyOn(cacheEngine_1.CacheEngine, 'delPattern');
                        return [4 /*yield*/, cacheEngine_1.CacheInvalidator.invalidateAccount('acc123')];
                    case 1:
                        _a.sent();
                        (0, globals_1.expect)(delPatternSpy).toHaveBeenCalledWith('account:acc123:*');
                        (0, globals_1.expect)(delPatternSpy).toHaveBeenCalledWith('balances:account:acc123:*');
                        (0, globals_1.expect)(delPatternSpy).toHaveBeenCalledWith('transactions:account:acc123:*');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should invalidate transaction caches', function () { return __awaiter(void 0, void 0, void 0, function () {
            var delSpy, delPatternSpy;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        delSpy = globals_1.jest.spyOn(cacheEngine_1.CacheEngine, 'del');
                        delPatternSpy = globals_1.jest.spyOn(cacheEngine_1.CacheEngine, 'delPattern');
                        return [4 /*yield*/, cacheEngine_1.CacheInvalidator.invalidateTransaction('txn123')];
                    case 1:
                        _a.sent();
                        (0, globals_1.expect)(delSpy).toHaveBeenCalledWith('transaction:txn123');
                        (0, globals_1.expect)(delPatternSpy).toHaveBeenCalledWith('transactions:*:txn123:*');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should invalidate all financial data caches', function () { return __awaiter(void 0, void 0, void 0, function () {
            var delPatternSpy;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        delPatternSpy = globals_1.jest.spyOn(cacheEngine_1.CacheEngine, 'delPattern');
                        return [4 /*yield*/, cacheEngine_1.CacheInvalidator.invalidateFinancialData()];
                    case 1:
                        _a.sent();
                        (0, globals_1.expect)(delPatternSpy).toHaveBeenCalledWith('balances:*');
                        (0, globals_1.expect)(delPatternSpy).toHaveBeenCalledWith('transactions:*');
                        (0, globals_1.expect)(delPatternSpy).toHaveBeenCalledWith('reports:*');
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, globals_1.describe)('CacheMiddleware', function () {
        (0, globals_1.it)('should cache method results', function () { return __awaiter(void 0, void 0, void 0, function () {
            var target, getSpy, setSpy, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        target = {
                            expensiveMethod: globals_1.jest.fn().mockResolvedValue('result')
                        };
                        // Apply decorator
                        cacheEngine_1.CacheMiddleware.cacheResponse(300)(target, 'expensiveMethod', {
                            value: target.expensiveMethod,
                            writable: true,
                            enumerable: true,
                            configurable: true
                        });
                        getSpy = globals_1.jest.spyOn(cacheEngine_1.CacheEngine, 'get').mockResolvedValue(null);
                        setSpy = globals_1.jest.spyOn(cacheEngine_1.CacheEngine, 'set').mockResolvedValue();
                        return [4 /*yield*/, target.expensiveMethod('arg1', 'arg2')];
                    case 1:
                        result = _a.sent();
                        (0, globals_1.expect)(result).toBe('result');
                        (0, globals_1.expect)(getSpy).toHaveBeenCalledWith('expensiveMethod:["arg1","arg2"]');
                        (0, globals_1.expect)(setSpy).toHaveBeenCalledWith('expensiveMethod:["arg1","arg2"]', 'result', 300);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should return cached result when available', function () { return __awaiter(void 0, void 0, void 0, function () {
            var target, getSpy, setSpy, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        target = {
                            expensiveMethod: globals_1.jest.fn().mockResolvedValue('result')
                        };
                        cacheEngine_1.CacheMiddleware.cacheResponse(300)(target, 'expensiveMethod', {
                            value: target.expensiveMethod,
                            writable: true,
                            enumerable: true,
                            configurable: true
                        });
                        getSpy = globals_1.jest.spyOn(cacheEngine_1.CacheEngine, 'get').mockResolvedValue('cached-result');
                        setSpy = globals_1.jest.spyOn(cacheEngine_1.CacheEngine, 'set');
                        return [4 /*yield*/, target.expensiveMethod('arg1', 'arg2')];
                    case 1:
                        result = _a.sent();
                        (0, globals_1.expect)(result).toBe('cached-result');
                        (0, globals_1.expect)(getSpy).toHaveBeenCalledWith('expensiveMethod:["arg1","arg2"]');
                        (0, globals_1.expect)(setSpy).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should check rate limits correctly', function () { return __awaiter(void 0, void 0, void 0, function () {
            var checkRateLimitSpy, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        checkRateLimitSpy = globals_1.jest.spyOn(cacheEngine_1.CacheEngine, 'checkRateLimit');
                        checkRateLimitSpy.mockResolvedValue({
                            allowed: true,
                            remaining: 5,
                            resetTime: Date.now() + 60000
                        });
                        return [4 /*yield*/, cacheEngine_1.CacheMiddleware.checkRateLimit('user123', 10, 60)];
                    case 1:
                        result = _a.sent();
                        (0, globals_1.expect)(result.allowed).toBe(true);
                        (0, globals_1.expect)(result.remaining).toBe(5);
                        (0, globals_1.expect)(checkRateLimitSpy).toHaveBeenCalledWith('user123', 10, 60);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, globals_1.describe)('RateLimiter', function () {
        (0, globals_1.it)('should create per-user rate limiter', function () {
            var middleware = rateLimiter_1.RateLimiter.perUserLimit('api');
            (0, globals_1.expect)(typeof middleware).toBe('function');
        });
        (0, globals_1.it)('should create per-user rate limiter with custom limits', function () {
            var middleware = rateLimiter_1.RateLimiter.perUserLimit('auth', { requests: 3, window: 120 });
            (0, globals_1.expect)(typeof middleware).toBe('function');
        });
        (0, globals_1.it)('should create per-IP adaptive throttler', function () {
            var middleware = rateLimiter_1.RateLimiter.perIPAdaptive;
            (0, globals_1.expect)(typeof middleware).toBe('function');
        });
        (0, globals_1.it)('should create burst controller', function () {
            var middleware = rateLimiter_1.RateLimiter.burstControl(10, 30);
            (0, globals_1.expect)(typeof middleware).toBe('function');
        });
        (0, globals_1.it)('should update IP reputation', function () { return __awaiter(void 0, void 0, void 0, function () {
            var setSpy;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setSpy = globals_1.jest.spyOn(cacheEngine_1.CacheEngine, 'set');
                        return [4 /*yield*/, rateLimiter_1.RateLimiter.updateIPReputation('192.168.1.1', 'good')];
                    case 1:
                        _a.sent();
                        (0, globals_1.expect)(setSpy).toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, globals_1.describe)('RateLimitMiddleware', function () {
        (0, globals_1.it)('should combine multiple rate limiters', function () {
            var limiter1 = globals_1.jest.fn();
            var limiter2 = globals_1.jest.fn();
            var combined = rateLimiter_1.RateLimitMiddleware.combine(limiter1, limiter2);
            (0, globals_1.expect)(typeof combined).toBe('function');
        });
        (0, globals_1.it)('should create tier-based rate limiter', function () {
            var tierLimits = {
                basic: { requests: 100, window: 60 },
                premium: { requests: 500, window: 60 }
            };
            var middleware = rateLimiter_1.RateLimitMiddleware.byUserTier(tierLimits);
            (0, globals_1.expect)(typeof middleware).toBe('function');
        });
    });
    (0, globals_1.describe)('PaginationEngine', function () {
        var mockModel = {
            findMany: globals_1.jest.fn(),
            count: globals_1.jest.fn()
        };
        (0, globals_1.it)('should paginate with offset', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockModel.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
                        mockModel.count.mockResolvedValue(25);
                        return [4 /*yield*/, paginationEngine_1.PaginationEngine.paginateWithOffset(mockModel, { page: 1, limit: 20 }, { userId: 'user123' })];
                    case 1:
                        result = _a.sent();
                        (0, globals_1.expect)(result.data).toHaveLength(2);
                        (0, globals_1.expect)(result.pagination.page).toBe(1);
                        (0, globals_1.expect)(result.pagination.limit).toBe(20);
                        (0, globals_1.expect)(result.pagination.total).toBe(25);
                        (0, globals_1.expect)(result.pagination.totalPages).toBe(2);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should paginate with cursor', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockModel.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
                        return [4 /*yield*/, paginationEngine_1.PaginationEngine.paginateWithCursor(mockModel, { limit: 20, cursor: 'cursor123' }, { userId: 'user123' }, 'id')];
                    case 1:
                        result = _a.sent();
                        (0, globals_1.expect)(result.data).toHaveLength(2);
                        (0, globals_1.expect)(result.pagination.hasNext).toBe(false);
                        (0, globals_1.expect)(result.pagination.hasPrev).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should validate pagination parameters', function () {
            (0, globals_1.expect)(function () { return paginationEngine_1.PaginationEngine.validatePaginationParams({ page: 0 }); }).toThrow();
            (0, globals_1.expect)(function () { return paginationEngine_1.PaginationEngine.validatePaginationParams({ limit: 0 }); }).toThrow();
            (0, globals_1.expect)(function () { return paginationEngine_1.PaginationEngine.validatePaginationParams({ limit: 101 }); }).toThrow();
            (0, globals_1.expect)(function () { return paginationEngine_1.PaginationEngine.validatePaginationParams({ cursor: 123 }); }).toThrow();
        });
        (0, globals_1.it)('should validate sort parameters', function () {
            (0, globals_1.expect)(function () { return paginationEngine_1.PaginationEngine.validateSortParams({ sortBy: 'invalid' }, ['id', 'name']); }).toThrow();
            (0, globals_1.expect)(function () { return paginationEngine_1.PaginationEngine.validateSortParams({ sortOrder: 'invalid' }, ['id', 'name']); }).toThrow();
        });
        (0, globals_1.it)('should create pagination metadata', function () {
            var pagination = {
                page: 2,
                limit: 10,
                total: 50,
                totalPages: 5,
                hasNext: true,
                hasPrev: true
            };
            var meta = paginationEngine_1.PaginationEngine.createPaginationMeta(pagination, 'https://api.example.com/items', { filter: 'test' });
            (0, globals_1.expect)(meta.page).toBe(2);
            (0, globals_1.expect)(meta.self).toContain('page=2');
            (0, globals_1.expect)(meta.first).toContain('page=1');
            (0, globals_1.expect)(meta.last).toContain('page=5');
            (0, globals_1.expect)(meta.prev).toContain('page=1');
            (0, globals_1.expect)(meta.next).toContain('page=3');
        });
    });
    (0, globals_1.describe)('FilterEngine', function () {
        (0, globals_1.it)('should build filters from query parameters', function () {
            var _a, _b, _c, _d;
            var query = {
                search: 'test',
                startDate: '2023-01-01',
                endDate: '2023-12-31',
                minAmount: '100',
                maxAmount: '1000',
                ids: 'id1,id2,id3'
            };
            var filters = paginationEngine_1.FilterEngine.buildFilters(query);
            (0, globals_1.expect)(filters.search).toBe('test');
            (0, globals_1.expect)((_a = filters.dateRange) === null || _a === void 0 ? void 0 : _a.start).toBeInstanceOf(Date);
            (0, globals_1.expect)((_b = filters.dateRange) === null || _b === void 0 ? void 0 : _b.end).toBeInstanceOf(Date);
            (0, globals_1.expect)((_c = filters.numericRange) === null || _c === void 0 ? void 0 : _c.min).toBe(100);
            (0, globals_1.expect)((_d = filters.numericRange) === null || _d === void 0 ? void 0 : _d.max).toBe(1000);
            (0, globals_1.expect)(filters.in).toEqual(['id1', 'id2', 'id3']);
        });
        (0, globals_1.it)('should validate filters', function () {
            (0, globals_1.expect)(function () { return paginationEngine_1.FilterEngine.validateFilters({
                dateRange: { start: new Date('2023-12-31'), end: new Date('2023-01-01') }
            }); }).toThrow();
            (0, globals_1.expect)(function () { return paginationEngine_1.FilterEngine.validateFilters({
                numericRange: { min: 1000, max: 100 }
            }); }).toThrow();
        });
    });
    (0, globals_1.describe)('PerformanceMonitor', function () {
        (0, globals_1.beforeEach)(function () {
            performanceMonitor_1.PerformanceMonitor['metrics'].clear();
        });
        (0, globals_1.it)('should start and stop timer', function () {
            var endTimer = performanceMonitor_1.PerformanceMonitor.startTimer('test-operation');
            // Simulate some work
            setTimeout(function () { }, 10);
            var metric = endTimer();
            (0, globals_1.expect)(metric.name).toBe('test-operation');
            (0, globals_1.expect)(metric.duration).toBeGreaterThanOrEqual(0);
            (0, globals_1.expect)(metric.startTime).toBeLessThanOrEqual(metric.endTime);
        });
        (0, globals_1.it)('should get performance statistics', function () {
            var endTimer1 = performanceMonitor_1.PerformanceMonitor.startTimer('test-operation');
            var endTimer2 = performanceMonitor_1.PerformanceMonitor.startTimer('test-operation');
            endTimer1();
            endTimer2();
            var stats = performanceMonitor_1.PerformanceMonitor.getStats('test-operation');
            (0, globals_1.expect)(stats).not.toBeNull();
            (0, globals_1.expect)(stats.count).toBe(2);
            (0, globals_1.expect)(stats.avgDuration).toBeGreaterThanOrEqual(0);
            (0, globals_1.expect)(stats.minDuration).toBeGreaterThanOrEqual(0);
            (0, globals_1.expect)(stats.maxDuration).toBeGreaterThanOrEqual(0);
        });
        (0, globals_1.it)('should monitor database queries', function () { return __awaiter(void 0, void 0, void 0, function () {
            var queryFn, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryFn = globals_1.jest.fn().mockResolvedValue('result');
                        return [4 /*yield*/, performanceMonitor_1.PerformanceMonitor.monitorQuery('test-query', queryFn)];
                    case 1:
                        result = _a.sent();
                        (0, globals_1.expect)(result).toBe('result');
                        (0, globals_1.expect)(queryFn).toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should monitor cache operations', function () { return __awaiter(void 0, void 0, void 0, function () {
            var operationFn, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        operationFn = globals_1.jest.fn().mockResolvedValue('result');
                        return [4 /*yield*/, performanceMonitor_1.PerformanceMonitor.monitorCache('get', 'test-key', operationFn)];
                    case 1:
                        result = _a.sent();
                        (0, globals_1.expect)(result).toBe('result');
                        (0, globals_1.expect)(operationFn).toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should create performance middleware', function () {
            var middleware = performanceMonitor_1.PerformanceMonitor.performanceMiddleware();
            (0, globals_1.expect)(typeof middleware).toBe('function');
        });
    });
    (0, globals_1.describe)('LoadTester', function () {
        (0, globals_1.it)('should run concurrent requests', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Mock fetch
                        global.fetch = globals_1.jest.fn().mockResolvedValue({
                            status: 200
                        });
                        return [4 /*yield*/, performanceMonitor_1.LoadTester.runConcurrentRequests('https://api.example.com/test', {
                                concurrency: 5,
                                totalRequests: 10
                            })];
                    case 1:
                        result = _a.sent();
                        (0, globals_1.expect)(result.totalTime).toBeGreaterThan(0);
                        (0, globals_1.expect)(result.requestsPerSecond).toBeGreaterThan(0);
                        (0, globals_1.expect)(result.successCount).toBe(10);
                        (0, globals_1.expect)(result.errorCount).toBe(0);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should handle errors in concurrent requests', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Mock fetch to throw error
                        global.fetch = globals_1.jest.fn().mockRejectedValue(new Error('Network error'));
                        return [4 /*yield*/, performanceMonitor_1.LoadTester.runConcurrentRequests('https://api.example.com/test', {
                                concurrency: 2,
                                totalRequests: 4
                            })];
                    case 1:
                        result = _a.sent();
                        (0, globals_1.expect)(result.errorCount).toBe(4);
                        (0, globals_1.expect)(result.successCount).toBe(0);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should run stress test', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        global.fetch = globals_1.jest.fn().mockResolvedValue({
                            status: 200
                        });
                        return [4 /*yield*/, performanceMonitor_1.LoadTester.runStressTest('https://api.example.com/test', {
                                startConcurrency: 1,
                                maxConcurrency: 3,
                                stepSize: 1,
                                requestsPerStep: 2,
                                maxErrorRate: 0.1
                            })];
                    case 1:
                        result = _a.sent();
                        (0, globals_1.expect)(result.results).toHaveLength(3);
                        (0, globals_1.expect)(result.maxSustainedConcurrency).toBeGreaterThanOrEqual(0);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, globals_1.describe)('DatabaseMonitor', function () {
        var mockPrisma = {
            $queryRaw: globals_1.jest.fn()
        };
        (0, globals_1.it)('should get connection pool stats', function () { return __awaiter(void 0, void 0, void 0, function () {
            var stats;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockPrisma.$queryRaw.mockResolvedValue([{
                                total: 10,
                                active: 3,
                                idle: 7,
                                waiting: 0
                            }]);
                        return [4 /*yield*/, performanceMonitor_1.DatabaseMonitor.getConnectionPoolStats(mockPrisma)];
                    case 1:
                        stats = _a.sent();
                        (0, globals_1.expect)(stats.totalConnections).toBe(10);
                        (0, globals_1.expect)(stats.activeConnections).toBe(3);
                        (0, globals_1.expect)(stats.idleConnections).toBe(7);
                        (0, globals_1.expect)(stats.waitingClients).toBe(0);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should handle connection pool stats error', function () { return __awaiter(void 0, void 0, void 0, function () {
            var stats;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockPrisma.$queryRaw.mockRejectedValue(new Error('Database error'));
                        return [4 /*yield*/, performanceMonitor_1.DatabaseMonitor.getConnectionPoolStats(mockPrisma)];
                    case 1:
                        stats = _a.sent();
                        (0, globals_1.expect)(stats.totalConnections).toBe(0);
                        (0, globals_1.expect)(stats.activeConnections).toBe(0);
                        (0, globals_1.expect)(stats.idleConnections).toBe(0);
                        (0, globals_1.expect)(stats.waitingClients).toBe(0);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should get slow queries', function () { return __awaiter(void 0, void 0, void 0, function () {
            var slowQueries;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockPrisma.$queryRaw.mockResolvedValue([
                            { query: 'SELECT * FROM users', calls: 100, mean_time: 1500 },
                            { query: 'SELECT * FROM orders', calls: 50, mean_time: 800 }
                        ]);
                        return [4 /*yield*/, performanceMonitor_1.DatabaseMonitor.getSlowQueries(mockPrisma, 1000)];
                    case 1:
                        slowQueries = _a.sent();
                        (0, globals_1.expect)(slowQueries).toHaveLength(2);
                        (0, globals_1.expect)(slowQueries[0].mean_time).toBeGreaterThan(1000);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should handle slow queries error', function () { return __awaiter(void 0, void 0, void 0, function () {
            var slowQueries;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockPrisma.$queryRaw.mockRejectedValue(new Error('Database error'));
                        return [4 /*yield*/, performanceMonitor_1.DatabaseMonitor.getSlowQueries(mockPrisma)];
                    case 1:
                        slowQueries = _a.sent();
                        (0, globals_1.expect)(slowQueries).toHaveLength(0);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
