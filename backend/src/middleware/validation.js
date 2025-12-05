"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitize = exports.commonSchemas = exports.validate = void 0;
var zod_1 = require("zod");
var errors_js_1 = require("../utils/errors.js");
var http_status_codes_1 = require("http-status-codes");
/**
 * Validation middleware factory
 */
var validate = function (schema) {
    return function (req, res, next) {
        try {
            // Validate request body
            if (schema.body) {
                req.body = schema.body.parse(req.body);
            }
            // Validate query parameters
            if (schema.query) {
                req.query = schema.query.parse(req.query);
            }
            // Validate route parameters
            if (schema.params) {
                req.params = schema.params.parse(req.params);
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                var errorMessages = error.errors.map(function (err) { return ({
                    field: err.path.join('.'),
                    message: err.message,
                }); });
                return next(new errors_js_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Validation failed', false));
            }
            next(error);
        }
    };
};
exports.validate = validate;
/**
 * Common validation schemas
 */
exports.commonSchemas = {
    // Pagination
    pagination: {
        query: {
            page: { coerce: true, default: 1 },
            limit: { coerce: true, default: 10 },
            sortBy: { default: 'createdAt' },
            sortOrder: { enum: ['asc', 'desc'], default: 'desc' },
        },
    },
    // ID parameter
    idParam: {
        params: {
            id: { pattern: /^[a-zA-Z0-9-]+$/ },
        },
    },
    // Email validation
    email: {
        body: {
            email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        },
    },
    // Password validation
    password: {
        body: {
            password: { min: 8, pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/ },
        },
    },
};
/**
 * Sanitization middleware
 */
var sanitize = function (req, res, next) {
    // Remove potential XSS from string fields
    var sanitizeString = function (str) {
        return str
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    };
    var sanitizeObject = function (obj) {
        if (typeof obj === 'string') {
            return sanitizeString(obj);
        }
        if (Array.isArray(obj)) {
            return obj.map(sanitizeObject);
        }
        if (obj && typeof obj === 'object') {
            var sanitized = {};
            for (var _i = 0, _a = Object.entries(obj); _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0], value = _b[1];
                sanitized[key] = sanitizeObject(value);
            }
            return sanitized;
        }
        return obj;
    };
    // Sanitize request body
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    // Sanitize query parameters
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    next();
};
exports.sanitize = sanitize;
