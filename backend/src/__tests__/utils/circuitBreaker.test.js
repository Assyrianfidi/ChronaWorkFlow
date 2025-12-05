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
var circuitBreaker_1 = require("../../utils/circuitBreaker");
describe('Circuit Breaker', function () {
    beforeEach(function () {
        // Clear all circuit breakers
        circuitBreaker_1.CircuitBreakerRegistry.resetAll();
    });
    describe('CircuitBreaker Class', function () {
        var circuitBreaker;
        beforeEach(function () {
            circuitBreaker = new circuitBreaker_1.CircuitBreaker('test-service', {
                failureThreshold: 3,
                resetTimeout: 1000, // 1 second for testing
                monitoringPeriod: 500, // 0.5 seconds
                expectedErrorRate: 0.5,
                halfOpenMaxCalls: 2,
            });
        });
        it('should start in CLOSED state', function () {
            expect(circuitBreaker.getState()).toBe(circuitBreaker_1.CircuitState.CLOSED);
        });
        it('should execute successful calls', function () { return __awaiter(void 0, void 0, void 0, function () {
            var successFn, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        successFn = jest.fn().mockResolvedValue('success');
                        return [4 /*yield*/, circuitBreaker.execute(successFn)];
                    case 1:
                        result = _a.sent();
                        expect(result).toBe('success');
                        expect(successFn).toHaveBeenCalled();
                        expect(circuitBreaker.getState()).toBe(circuitBreaker_1.CircuitState.CLOSED);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should open circuit after failure threshold', function () { return __awaiter(void 0, void 0, void 0, function () {
            var failureFn, i, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        failureFn = jest.fn().mockRejectedValue(new Error('failure'));
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < 3)) return [3 /*break*/, 6];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, circuitBreaker.execute(failureFn)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        i++;
                        return [3 /*break*/, 1];
                    case 6:
                        expect(circuitBreaker.getState()).toBe(circuitBreaker_1.CircuitState.OPEN);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should reject calls when circuit is OPEN', function () { return __awaiter(void 0, void 0, void 0, function () {
            var failureFn, i, error_2, anotherFn;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        failureFn = jest.fn().mockRejectedValue(new Error('failure'));
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < 3)) return [3 /*break*/, 6];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, circuitBreaker.execute(failureFn)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        i++;
                        return [3 /*break*/, 1];
                    case 6:
                        anotherFn = jest.fn().mockResolvedValue('success');
                        return [4 /*yield*/, expect(circuitBreaker.execute(anotherFn)).rejects.toThrow('Circuit breaker OPEN for test-service')];
                    case 7:
                        _a.sent();
                        expect(anotherFn).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should transition to HALF_OPEN after reset timeout', function () { return __awaiter(void 0, void 0, void 0, function () {
            var failureFn, i, error_3, successFn;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        failureFn = jest.fn().mockRejectedValue(new Error('failure'));
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < 3)) return [3 /*break*/, 6];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, circuitBreaker.execute(failureFn)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_3 = _a.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        i++;
                        return [3 /*break*/, 1];
                    case 6:
                        expect(circuitBreaker.getState()).toBe(circuitBreaker_1.CircuitState.OPEN);
                        // Wait for reset timeout
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1100); })];
                    case 7:
                        // Wait for reset timeout
                        _a.sent();
                        successFn = jest.fn().mockResolvedValue('success');
                        return [4 /*yield*/, circuitBreaker.execute(successFn)];
                    case 8:
                        _a.sent();
                        expect(circuitBreaker.getState()).toBe(circuitBreaker_1.CircuitState.HALF_OPEN);
                        expect(successFn).toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should close circuit after successful calls in HALF_OPEN', function () { return __awaiter(void 0, void 0, void 0, function () {
            var failureFn, successFn, i, error_4, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        failureFn = jest.fn().mockRejectedValue(new Error('failure'));
                        successFn = jest.fn().mockResolvedValue('success');
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < 3)) return [3 /*break*/, 6];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, circuitBreaker.execute(failureFn)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_4 = _a.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        i++;
                        return [3 /*break*/, 1];
                    case 6: 
                    // Wait for reset timeout
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1100); })];
                    case 7:
                        // Wait for reset timeout
                        _a.sent();
                        i = 0;
                        _a.label = 8;
                    case 8:
                        if (!(i < 2)) return [3 /*break*/, 11];
                        return [4 /*yield*/, circuitBreaker.execute(successFn)];
                    case 9:
                        _a.sent();
                        _a.label = 10;
                    case 10:
                        i++;
                        return [3 /*break*/, 8];
                    case 11:
                        expect(circuitBreaker.getState()).toBe(circuitBreaker_1.CircuitState.CLOSED);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should open circuit again on failure in HALF_OPEN', function () { return __awaiter(void 0, void 0, void 0, function () {
            var failureFn, i, error_5, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        failureFn = jest.fn().mockRejectedValue(new Error('failure'));
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < 3)) return [3 /*break*/, 6];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, circuitBreaker.execute(failureFn)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_5 = _a.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        i++;
                        return [3 /*break*/, 1];
                    case 6: 
                    // Wait for reset timeout
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1100); })];
                    case 7:
                        // Wait for reset timeout
                        _a.sent();
                        _a.label = 8;
                    case 8:
                        _a.trys.push([8, 10, , 11]);
                        return [4 /*yield*/, circuitBreaker.execute(failureFn)];
                    case 9:
                        _a.sent();
                        return [3 /*break*/, 11];
                    case 10:
                        error_6 = _a.sent();
                        return [3 /*break*/, 11];
                    case 11:
                        expect(circuitBreaker.getState()).toBe(circuitBreaker_1.CircuitState.OPEN);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should provide correct statistics', function () { return __awaiter(void 0, void 0, void 0, function () {
            var successFn, failureFn, stats, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        successFn = jest.fn().mockResolvedValue('success');
                        failureFn = jest.fn().mockRejectedValue(new Error('failure'));
                        // Execute some calls
                        return [4 /*yield*/, circuitBreaker.execute(successFn)];
                    case 1:
                        // Execute some calls
                        _a.sent();
                        stats = circuitBreaker.getStats();
                        expect(stats.state).toBe(circuitBreaker_1.CircuitState.CLOSED);
                        expect(stats.successes).toBe(1);
                        expect(stats.failures).toBe(0);
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, circuitBreaker.execute(failureFn)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_7 = _a.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        stats = circuitBreaker.getStats();
                        // After one failure with 50% error rate threshold, circuit might open
                        expect(stats.successes).toBe(1);
                        expect(stats.failures).toBe(1);
                        expect(stats.errorRate).toBe(0.5);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should reset manually', function () { return __awaiter(void 0, void 0, void 0, function () {
            var failureFn, i, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        failureFn = jest.fn().mockRejectedValue(new Error('failure'));
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < 3)) return [3 /*break*/, 6];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, circuitBreaker.execute(failureFn)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_8 = _a.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        i++;
                        return [3 /*break*/, 1];
                    case 6:
                        expect(circuitBreaker.getState()).toBe(circuitBreaker_1.CircuitState.OPEN);
                        // Reset manually
                        circuitBreaker.reset();
                        expect(circuitBreaker.getState()).toBe(circuitBreaker_1.CircuitState.CLOSED);
                        expect(circuitBreaker.getStats().failures).toBe(0);
                        expect(circuitBreaker.getStats().successes).toBe(0);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should open manually', function () {
            circuitBreaker.open();
            expect(circuitBreaker.getState()).toBe(circuitBreaker_1.CircuitState.OPEN);
        });
    });
    describe('CircuitBreakerRegistry', function () {
        it('should create and retrieve circuit breakers', function () {
            var breaker1 = circuitBreaker_1.CircuitBreakerRegistry.get('service1');
            var breaker2 = circuitBreaker_1.CircuitBreakerRegistry.get('service2');
            var breaker1Again = circuitBreaker_1.CircuitBreakerRegistry.get('service1');
            expect(breaker1).toBe(breaker1Again);
            expect(breaker2).not.toBe(breaker1);
        });
        it('should get all circuit breakers', function () {
            circuitBreaker_1.CircuitBreakerRegistry.get('service1');
            circuitBreaker_1.CircuitBreakerRegistry.get('service2');
            var all = circuitBreaker_1.CircuitBreakerRegistry.getAll();
            expect(all.size).toBe(2);
            expect(all.has('service1')).toBe(true);
            expect(all.has('service2')).toBe(true);
        });
        it('should get all stats', function () {
            circuitBreaker_1.CircuitBreakerRegistry.get('service1');
            circuitBreaker_1.CircuitBreakerRegistry.get('service2');
            var stats = circuitBreaker_1.CircuitBreakerRegistry.getAllStats();
            expect(stats).toHaveProperty('service1');
            expect(stats).toHaveProperty('service2');
        });
        it('should check for open circuits', function () {
            var breaker1 = circuitBreaker_1.CircuitBreakerRegistry.get('service1');
            var breaker2 = circuitBreaker_1.CircuitBreakerRegistry.get('service2');
            expect(circuitBreaker_1.CircuitBreakerRegistry.hasOpenCircuits()).toBe(false);
            breaker1.open();
            expect(circuitBreaker_1.CircuitBreakerRegistry.hasOpenCircuits()).toBe(true);
            breaker2.open();
            expect(circuitBreaker_1.CircuitBreakerRegistry.hasOpenCircuits()).toBe(true);
            breaker1.reset();
            breaker2.reset();
            expect(circuitBreaker_1.CircuitBreakerRegistry.hasOpenCircuits()).toBe(false);
        });
        it('should reset all circuit breakers', function () {
            var breaker1 = circuitBreaker_1.CircuitBreakerRegistry.get('service1');
            var breaker2 = circuitBreaker_1.CircuitBreakerRegistry.get('service2');
            breaker1.open();
            breaker2.open();
            expect(circuitBreaker_1.CircuitBreakerRegistry.hasOpenCircuits()).toBe(true);
            circuitBreaker_1.CircuitBreakerRegistry.resetAll();
            expect(circuitBreaker_1.CircuitBreakerRegistry.hasOpenCircuits()).toBe(false);
        });
    });
    describe('withCircuitBreaker decorator', function () {
        // Skip decorator tests as they require experimental decorators
        it.skip('should wrap methods with circuit breaker', function () {
            // Test skipped - requires TypeScript experimental decorators
        });
        it.skip('should execute wrapped methods through circuit breaker', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        }); });
    });
});
