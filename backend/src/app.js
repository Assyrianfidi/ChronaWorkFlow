"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var helmet_1 = require("helmet");
var express_mongo_sanitize_1 = require("express-mongo-sanitize");
// @ts-ignore
var hpp_1 = require("hpp");
var express_rate_limit_1 = require("express-rate-limit");
var cookie_parser_1 = require("cookie-parser");
// @ts-ignore
var compression_1 = require("compression");
var config_js_1 = require("./config/config.js");
var errorHandler_js_1 = require("./middleware/errorHandler.js");
var auth_routes_js_1 = require("./routes/auth.routes.js");
var report_routes_js_1 = require("./routes/report.routes.js");
var user_routes_js_1 = require("./routes/user.routes.js");
var accounts_routes_js_1 = require("./modules/accounts/accounts.routes.js");
var transactions_routes_js_1 = require("./modules/transactions/transactions.routes.js");
var app = (0, express_1.default)();
// 1) GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'trusted-cdn.com'],
            // Add other CSP directives as needed
        },
    },
    crossOriginEmbedderPolicy: false, // Required for some features
}));
// Enable CORS with specific origin and credentials
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000', // TODO: Fix config.clientUrl reference
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));
// Development logging
if (config_js_1.config.env === 'development') {
    Promise.resolve().then(function () { return require('morgan'); }).then(function (morgan) {
        app.use(morgan.default('dev'));
    });
}
// Limit requests from same API
var apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
});
// Apply rate limiting to API routes
app.use('/api', apiLimiter);
// Body parser, reading data from body into req.body
app.use(express_1.default.json({ limit: '10kb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10kb' }));
// Cookie parser with secret
app.use((0, cookie_parser_1.default)(config_js_1.config.jwt.secret));
// Data sanitization against NoSQL query injection
app.use((0, express_mongo_sanitize_1.default)());
// Data sanitization against XSS
// TODO: Implement xss middleware
// app.use(xss());
// Request logging
// TODO: Implement requestLogger middleware  
// app.use(requestLogger);
// Prevent parameter pollution with whitelist
app.use((0, hpp_1.default)({
    whitelist: [
        // Add parameters to whitelist for parameter pollution protection
        'duration',
        'ratingsQuantity',
        'ratingsAverage',
        'maxGroupSize',
        'difficulty',
        'price',
    ],
}));
// Compression middleware (gzip)
app.use((0, compression_1.default)());
// Request time middleware
app.use(function (req, res, next) {
    req.requestTime = new Date().toISOString();
    next();
});
// 2) ROUTES
app.use('/api/health', function (req, res) {
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "unknown",
        database: "connection_check_skipped"
    });
});
app.use('/api/v1/auth', auth_routes_js_1.default);
app.use('/api/v1/users', user_routes_js_1.default);
app.use('/api/v1/reports', report_routes_js_1.default);
app.use('/api/v1/accounts', accounts_routes_js_1.default);
app.use('/api/v1/transactions', transactions_routes_js_1.default);
// Handle 404 - Not Found
app.use(errorHandler_js_1.notFound);
// Global error handler
app.use(errorHandler_js_1.errorHandler);
// Security headers
app.disable('x-powered-by');
// Trust first proxy (if behind a reverse proxy like Nginx)
app.set('trust proxy', 1);
exports.default = app;
