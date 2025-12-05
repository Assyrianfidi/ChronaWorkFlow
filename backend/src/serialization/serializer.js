"use strict";
/**
 * Serializer Implementation
 * Data serialization and transformation
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
exports.Serializer = void 0;
var Serializer = /** @class */ (function () {
    function Serializer() {
    }
    /**
     * Serialize data based on type and options
     */
    Serializer.prototype.serialize = function (type, data, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        if (!data)
            return data;
        // Handle arrays
        if (Array.isArray(data)) {
            return data.map(function (item) { return _this.serialize(type, item, options); });
        }
        // Handle objects
        if (typeof data === 'object' && data !== null) {
            return this.serializeObject(data, options);
        }
        // Handle primitives
        return this.serializePrimitive(data);
    };
    /**
     * Serialize an object
     */
    Serializer.prototype.serializeObject = function (obj, options) {
        var serialized = {};
        var _a = options.exclude, exclude = _a === void 0 ? [] : _a, include = options.include, transform = options.transform, _b = options.depth, depth = _b === void 0 ? 0 : _b;
        // Prevent infinite recursion
        if (depth > 10) {
            return '[Circular]';
        }
        for (var _i = 0, _c = Object.entries(obj); _i < _c.length; _i++) {
            var _d = _c[_i], key = _d[0], value = _d[1];
            // Skip excluded fields
            if (exclude.includes(key)) {
                continue;
            }
            // Only include specified fields if include is provided
            if (include && !include.includes(key)) {
                continue;
            }
            // Skip private fields
            if (key.startsWith('_')) {
                continue;
            }
            // Serialize the value
            serialized[key] = this.serializeValue(value, __assign(__assign({}, options), { depth: depth + 1 }));
        }
        // Apply transformation
        if (transform) {
            return transform(serialized);
        }
        return serialized;
    };
    /**
     * Serialize a value
     */
    Serializer.prototype.serializeValue = function (value, options) {
        var _this = this;
        if (value === null || value === undefined) {
            return value;
        }
        if (Array.isArray(value)) {
            return value.map(function (item) { return _this.serializeValue(item, options); });
        }
        if (typeof value === 'object') {
            // Handle Date objects
            if (value instanceof Date) {
                return value.toISOString();
            }
            // Handle Buffer objects
            if (Buffer.isBuffer(value)) {
                return value.toString('base64');
            }
            // Handle objects with toJSON method
            if (typeof value.toJSON === 'function') {
                return value.toJSON();
            }
            // Recursively serialize objects
            return this.serializeObject(value, options);
        }
        return value;
    };
    /**
     * Serialize primitive values
     */
    Serializer.prototype.serializePrimitive = function (value) {
        // Handle BigInt
        if (typeof value === 'bigint') {
            return value.toString();
        }
        // Handle functions (skip)
        if (typeof value === 'function') {
            return undefined;
        }
        return value;
    };
    /**
     * Deserialize data
     */
    Serializer.prototype.deserialize = function (type, data) {
        var _this = this;
        if (!data)
            return data;
        // Handle arrays
        if (Array.isArray(data)) {
            return data.map(function (item) { return _this.deserialize(type, item); });
        }
        // Handle objects
        if (typeof data === 'object' && data !== null) {
            return this.deserializeObject(data);
        }
        return data;
    };
    /**
     * Deserialize an object
     */
    Serializer.prototype.deserializeObject = function (obj) {
        var deserialized = {};
        for (var _i = 0, _a = Object.entries(obj); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            deserialized[key] = this.deserializeValue(value);
        }
        return deserialized;
    };
    /**
     * Deserialize a value
     */
    Serializer.prototype.deserializeValue = function (value) {
        var _this = this;
        if (value === null || value === undefined) {
            return value;
        }
        if (Array.isArray(value)) {
            return value.map(function (item) { return _this.deserializeValue(item); });
        }
        if (typeof value === 'object') {
            // Handle date strings
            if (typeof value === 'string') {
                var date = new Date(value);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
            return this.deserializeObject(value);
        }
        return value;
    };
    /**
     * Create a serializer for specific type
     */
    Serializer.prototype.forType = function (type) {
        var _this = this;
        return function (data, options) {
            return _this.serialize(type, data, options);
        };
    };
    /**
     * Sanitize data for output (remove sensitive fields)
     */
    Serializer.prototype.sanitize = function (data, sensitiveFields) {
        if (sensitiveFields === void 0) { sensitiveFields = ['password', 'token', 'secret', 'key']; }
        return this.serialize('default', data, {
            exclude: sensitiveFields
        });
    };
    /**
     * Convert to JSON string with error handling
     */
    Serializer.prototype.toJSON = function (data, space) {
        try {
            return JSON.stringify(data, null, space);
        }
        catch (error) {
            // Handle circular references
            var seen_1 = new WeakSet();
            var jsonString = JSON.stringify(data, function (key, val) {
                if (val != null && typeof val === 'object') {
                    if (seen_1.has(val)) {
                        return '[Circular]';
                    }
                    seen_1.add(val);
                }
                return val;
            }, space);
            return jsonString;
        }
    };
    /**
     * Parse JSON string with error handling
     */
    Serializer.prototype.fromJSON = function (jsonString) {
        try {
            return JSON.parse(jsonString);
        }
        catch (error) {
            throw new Error("Invalid JSON: ".concat(error instanceof Error ? error.message : 'Unknown error'));
        }
    };
    return Serializer;
}());
exports.Serializer = Serializer;
exports.default = Serializer;
