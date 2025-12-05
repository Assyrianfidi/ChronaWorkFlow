"use strict";
/**
 * Rate Limiter Implementation
 * Simple token bucket rate limiter
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
var RateLimiter = /** @class */ (function () {
    function RateLimiter(config) {
        var _this = this;
        this.buckets = new Map();
        this.config = __assign({ keyGenerator: function (id) { return id; } }, config);
        // Clean up expired buckets periodically
        setInterval(function () {
            _this.cleanup();
        }, this.config.windowMs);
    }
    /**
     * Check if a request is allowed
     */
    RateLimiter.prototype.isAllowed = function (identifier, customConfig) {
        var key = this.config.keyGenerator(identifier);
        var config = __assign(__assign({}, this.config), customConfig);
        var bucket = this.buckets.get(key);
        if (!bucket) {
            bucket = new TokenBucket(config.maxRequests, config.windowMs);
            this.buckets.set(key, bucket);
        }
        var result = bucket.consume();
        return {
            allowed: result.consumed > 0,
            remaining: result.remaining,
            resetTime: bucket.resetTime,
            retryAfter: result.consumed === 0 ? Math.ceil(bucket.timeToRefill() / 1000) : undefined
        };
    };
    /**
     * Get retry after time for identifier
     */
    RateLimiter.prototype.getRetryAfter = function (identifier) {
        var key = this.config.keyGenerator(identifier);
        var bucket = this.buckets.get(key);
        if (!bucket) {
            return 0;
        }
        return Math.ceil(bucket.timeToRefill() / 1000);
    };
    /**
     * Reset rate limit for identifier
     */
    RateLimiter.prototype.reset = function (identifier) {
        var key = this.config.keyGenerator(identifier);
        this.buckets.delete(key);
    };
    /**
     * Get current status for identifier
     */
    RateLimiter.prototype.getStatus = function (identifier) {
        var key = this.config.keyGenerator(identifier);
        var bucket = this.buckets.get(key);
        if (!bucket) {
            return null;
        }
        return {
            remaining: bucket.tokens,
            resetTime: bucket.resetTime
        };
    };
    /**
     * Clean up expired buckets
     */
    RateLimiter.prototype.cleanup = function () {
        var now = Date.now();
        for (var _i = 0, _a = this.buckets.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], bucket = _b[1];
            if (bucket.resetTime <= now) {
                this.buckets.delete(key);
            }
        }
    };
    /**
     * Get statistics
     */
    RateLimiter.prototype.getStats = function () {
        var now = Date.now();
        var activeBuckets = Array.from(this.buckets.values())
            .filter(function (bucket) { return bucket.resetTime > now; }).length;
        return {
            totalBuckets: this.buckets.size,
            activeBuckets: activeBuckets
        };
    };
    return RateLimiter;
}());
exports.RateLimiter = RateLimiter;
/**
 * Token Bucket Implementation
 */
var TokenBucket = /** @class */ (function () {
    function TokenBucket(maxTokens, windowMs) {
        this.maxTokens = maxTokens;
        this.tokens = maxTokens;
        this.refillRate = maxTokens / windowMs;
        this.lastRefill = Date.now();
        this.resetTime = this.lastRefill + windowMs;
    }
    /**
     * Consume tokens
     */
    TokenBucket.prototype.consume = function (tokens) {
        if (tokens === void 0) { tokens = 1; }
        this.refill();
        if (this.tokens >= tokens) {
            this.tokens -= tokens;
            return { consumed: tokens, remaining: this.tokens };
        }
        var consumed = this.tokens;
        this.tokens = 0;
        return { consumed: consumed, remaining: 0 };
    };
    /**
     * Refill tokens based on elapsed time
     */
    TokenBucket.prototype.refill = function () {
        var now = Date.now();
        var elapsed = now - this.lastRefill;
        if (elapsed > 0) {
            var tokensToAdd = Math.min(elapsed * this.refillRate, this.maxTokens - this.tokens);
            this.tokens += tokensToAdd;
            this.lastRefill = now;
            // Update reset time (make it mutable)
            this.resetTime = now + (this.maxTokens / this.refillRate);
        }
    };
    /**
     * Get time until next refill
     */
    TokenBucket.prototype.timeToRefill = function () {
        if (this.tokens >= this.maxTokens) {
            return 0;
        }
        var tokensNeeded = this.maxTokens - this.tokens;
        return tokensNeeded / this.refillRate;
    };
    return TokenBucket;
}());
exports.default = RateLimiter;
