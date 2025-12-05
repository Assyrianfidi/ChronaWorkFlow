"use strict";
/**
 * Circuit Breaker Pattern Implementation
 * Provides fault tolerance for external service calls
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
exports.CircuitBreakerRegistry = exports.CircuitBreaker = exports.CircuitState = void 0;
exports.withCircuitBreaker = withCircuitBreaker;
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitState || (exports.CircuitState = CircuitState = {}));
var CircuitBreaker = /** @class */ (function () {
    function CircuitBreaker(service, options) {
        if (options === void 0) { options = {}; }
        this.service = service;
        this.options = options;
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        this.nextAttempt = Date.now();
        this.lastFailureTime = 0;
        this.halfOpenCalls = 0;
        // Default options
        this.options = __assign({ failureThreshold: options.failureThreshold || 5, resetTimeout: options.resetTimeout || 60000, monitoringPeriod: options.monitoringPeriod || 10000, expectedErrorRate: options.expectedErrorRate || 0.5, halfOpenMaxCalls: options.halfOpenMaxCalls || 3 }, options);
    }
    /**
     * Execute a function through the circuit breaker
     */
    CircuitBreaker.prototype.execute = function (fn) {
        return __awaiter(this, void 0, void 0, function () {
            var now, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = Date.now();
                        // Check if circuit should reset
                        if (this.state === CircuitState.OPEN && now >= this.nextAttempt) {
                            this.state = CircuitState.HALF_OPEN;
                            this.halfOpenCalls = 0;
                            console.log("[CIRCUIT_BREAKER] ".concat(this.service, ": Opening to HALF_OPEN state"));
                        }
                        // Reject calls if circuit is open
                        if (this.state === CircuitState.OPEN) {
                            throw new Error("Circuit breaker OPEN for ".concat(this.service, ". Next attempt at ").concat(new Date(this.nextAttempt).toISOString()));
                        }
                        // Limit calls in half-open state
                        if (this.state === CircuitState.HALF_OPEN && this.halfOpenCalls >= this.options.halfOpenMaxCalls) {
                            throw new Error("Circuit breaker HALF_OPEN for ".concat(this.service, ". Max calls exceeded."));
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fn()];
                    case 2:
                        result = _a.sent();
                        // Record success
                        this.onSuccess(now);
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _a.sent();
                        // Record failure
                        this.onFailure(now);
                        // Re-throw the error
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Handle successful execution
     */
    CircuitBreaker.prototype.onSuccess = function (now) {
        this.successes++;
        this.failures = 0;
        if (this.state === CircuitState.HALF_OPEN) {
            this.halfOpenCalls++;
            // If enough successful calls in half-open, close the circuit
            if (this.halfOpenCalls >= this.options.halfOpenMaxCalls) {
                this.state = CircuitState.CLOSED;
                console.log("[CIRCUIT_BREAKER] ".concat(this.service, ": Circuit CLOSED after successful half-open period"));
            }
        }
        console.log("[CIRCUIT_BREAKER] ".concat(this.service, ": Success recorded. State: ").concat(this.state));
    };
    /**
     * Handle failed execution
     */
    CircuitBreaker.prototype.onFailure = function (now) {
        this.failures++;
        this.lastFailureTime = now;
        if (this.state === CircuitState.HALF_OPEN) {
            // Any failure in half-open opens the circuit again
            this.state = CircuitState.OPEN;
            this.nextAttempt = now + this.options.resetTimeout;
            console.log("[CIRCUIT_BREAKER] ".concat(this.service, ": Circuit OPEN after failure in half-open state"));
        }
        else if (this.state === CircuitState.CLOSED) {
            // Check if we should open the circuit
            var errorRate = this.getErrorRate(now);
            if (this.failures >= this.options.failureThreshold ||
                errorRate >= this.options.expectedErrorRate) {
                this.state = CircuitState.OPEN;
                this.nextAttempt = now + this.options.resetTimeout;
                console.log("[CIRCUIT_BREAKER] ".concat(this.service, ": Circuit OPEN. Failures: ").concat(this.failures, ", Error Rate: ").concat((errorRate * 100).toFixed(2), "%"));
            }
        }
        console.log("[CIRCUIT_BREAKER] ".concat(this.service, ": Failure recorded. State: ").concat(this.state, ", Total Failures: ").concat(this.failures));
    };
    /**
     * Calculate error rate for the monitoring period
     */
    CircuitBreaker.prototype.getErrorRate = function (now) {
        var period = this.options.monitoringPeriod;
        var totalCalls = this.successes + this.failures;
        if (totalCalls === 0)
            return 0;
        // Only consider failures within the monitoring period
        if (now - this.lastFailureTime > period) {
            return 0;
        }
        return this.failures / totalCalls;
    };
    /**
     * Get current circuit state
     */
    CircuitBreaker.prototype.getState = function () {
        return this.state;
    };
    /**
     * Get circuit statistics
     */
    CircuitBreaker.prototype.getStats = function () {
        return {
            state: this.state,
            failures: this.failures,
            successes: this.successes,
            nextAttempt: this.state === CircuitState.OPEN ? new Date(this.nextAttempt) : null,
            errorRate: this.getErrorRate(Date.now()),
        };
    };
    /**
     * Manually reset the circuit
     */
    CircuitBreaker.prototype.reset = function () {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        this.nextAttempt = Date.now();
        this.lastFailureTime = 0;
        this.halfOpenCalls = 0;
        console.log("[CIRCUIT_BREAKER] ".concat(this.service, ": Circuit manually reset to CLOSED"));
    };
    /**
     * Manually open the circuit
     */
    CircuitBreaker.prototype.open = function () {
        this.state = CircuitState.OPEN;
        this.nextAttempt = Date.now() + this.options.resetTimeout;
        console.log("[CIRCUIT_BREAKER] ".concat(this.service, ": Circuit manually OPENED"));
    };
    return CircuitBreaker;
}());
exports.CircuitBreaker = CircuitBreaker;
/**
 * Circuit Breaker Registry
 * Manages multiple circuit breakers
 */
var CircuitBreakerRegistry = /** @class */ (function () {
    function CircuitBreakerRegistry() {
    }
    /**
     * Get or create a circuit breaker for a service
     */
    CircuitBreakerRegistry.get = function (service, options) {
        if (!this.breakers.has(service)) {
            this.breakers.set(service, new CircuitBreaker(service, options));
        }
        return this.breakers.get(service);
    };
    /**
     * Get all circuit breakers
     */
    CircuitBreakerRegistry.getAll = function () {
        return this.breakers;
    };
    /**
     * Get all statuses for circuit breakers
     */
    CircuitBreakerRegistry.getAllStatuses = function () {
        var statuses = {};
        for (var _i = 0, _a = this.breakers; _i < _a.length; _i++) {
            var _b = _a[_i], service = _b[0], breaker = _b[1];
            statuses[service] = {
                state: breaker.getState(),
                stats: breaker.getStats()
            };
        }
        return statuses;
    };
    /**
     * Get statistics for all circuit breakers
     */
    CircuitBreakerRegistry.getAllStats = function () {
        var stats = {};
        for (var _i = 0, _a = this.breakers; _i < _a.length; _i++) {
            var _b = _a[_i], service = _b[0], breaker = _b[1];
            stats[service] = breaker.getStats();
        }
        return stats;
    };
    /**
     * Reset all circuit breakers
     */
    CircuitBreakerRegistry.resetAll = function () {
        for (var _i = 0, _a = this.breakers.values(); _i < _a.length; _i++) {
            var breaker = _a[_i];
            breaker.reset();
        }
    };
    /**
     * Check if any circuit breakers are open
     */
    CircuitBreakerRegistry.hasOpenCircuits = function () {
        for (var _i = 0, _a = this.breakers.values(); _i < _a.length; _i++) {
            var breaker = _a[_i];
            if (breaker.getState() === CircuitState.OPEN) {
                return true;
            }
        }
        return false;
    };
    CircuitBreakerRegistry.breakers = new Map();
    return CircuitBreakerRegistry;
}());
exports.CircuitBreakerRegistry = CircuitBreakerRegistry;
/**
 * Decorator to apply circuit breaker to a method
 */
function withCircuitBreaker(service, options) {
    return function (target, propertyKey, descriptor) {
        var originalMethod = descriptor.value;
        descriptor.value = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return __awaiter(this, void 0, void 0, function () {
                var breaker;
                var _this = this;
                return __generator(this, function (_a) {
                    breaker = CircuitBreakerRegistry.get(service, options);
                    return [2 /*return*/, breaker.execute(function () { return originalMethod.apply(_this, args); })];
                });
            });
        };
        return descriptor;
    };
}
