"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
var dotenv_1 = require("dotenv");
var path_1 = require("path");
// Load environment-specific .env file
var envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : process.env.NODE_ENV === "test"
      ? ".env.test"
      : ".env.development";
dotenv_1.default.config({
  path: path_1.default.resolve(process.cwd(), envFile),
});
exports.config = {
  // Server configuration
  port: parseInt(process.env.PORT || "3000"),
  nodeEnv: process.env.NODE_ENV || "development",
  // Database configuration
  database: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://user:password@localhost:5432/accu_books",
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
    poolTimeout: parseInt(process.env.DB_POOL_TIMEOUT || "30"),
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "10"),
  },
  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || "0"),
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  },
  // JWT configuration
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      "your-super-secret-jwt-key-change-in-production",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    issuer: process.env.JWT_ISSUER || "accu-books",
    audience: process.env.JWT_AUDIENCE || "accu-books-users",
  },
  // Security configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || "12"),
    cors: {
      origin: ((_a = process.env.CORS_ORIGIN) === null || _a === void 0
        ? void 0
        : _a.split(",")) || ["http://localhost:3000"],
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      credentials: true,
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || "100"),
      message: "Too many requests from this IP, please try again later.",
    },
    helmet: {
      contentSecurityPolicy:
        process.env.NODE_ENV === "production"
          ? {
              directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
              },
            }
          : false,
    },
  },
  // Email configuration
  email: {
    provider: process.env.EMAIL_PROVIDER || "smtp",
    smtp: {
      host: process.env.SMTP_HOST || "localhost",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    },
    from: process.env.EMAIL_FROM || "noreply@accu-books.com",
  },
  // File upload configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760"), // 10MB
    allowedTypes: ((_b = process.env.ALLOWED_FILE_TYPES) === null ||
    _b === void 0
      ? void 0
      : _b.split(",")) || ["image/jpeg", "image/png", "application/pdf"],
    destination: process.env.UPLOAD_DESTINATION || "uploads/",
  },
  // Logging configuration
  logging: {
    level:
      process.env.LOG_LEVEL ||
      (process.env.NODE_ENV === "production" ? "info" : "debug"),
    format: process.env.LOG_FORMAT || "json",
    file: process.env.LOG_FILE || "logs/app.log",
    maxSize: process.env.LOG_MAX_SIZE || "20m",
    maxFiles: parseInt(process.env.LOG_MAX_FILES || "14d"),
  },
  // Monitoring configuration
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === "true",
    metricsPath: process.env.METRICS_PATH || "/metrics",
    healthCheckPath: process.env.HEALTH_CHECK_PATH || "/health",
    alertWebhook: process.env.ALERT_WEBHOOK || "",
  },
  // Cache configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || "300"), // 5 minutes
    maxKeys: parseInt(process.env.CACHE_MAX_KEYS || "10000"),
    cleanupInterval: parseInt(process.env.CACHE_CLEANUP_INTERVAL || "600"), // 10 minutes
  },
  // API configuration
  api: {
    version: process.env.API_VERSION || "v1",
    prefix: process.env.API_PREFIX || "/api",
    timeout: parseInt(process.env.API_TIMEOUT || "30000"), // 30 seconds
    pagination: {
      defaultLimit: parseInt(process.env.DEFAULT_PAGE_LIMIT || "20"),
      maxLimit: parseInt(process.env.MAX_PAGE_LIMIT || "100"),
    },
  },
  // Feature flags
  features: {
    registration: process.env.FEATURE_REGISTRATION === "true",
    emailVerification: process.env.FEATURE_EMAIL_VERIFICATION === "true",
    passwordReset: process.env.FEATURE_PASSWORD_RESET === "true",
    twoFactorAuth: process.env.FEATURE_2FA === "true",
    auditLogging: process.env.FEATURE_AUDIT_LOGGING === "true",
    analytics: process.env.FEATURE_ANALYTICS === "true",
  },
  // External services
  services: {
    paymentProvider: process.env.PAYMENT_PROVIDER || "stripe",
    analyticsProvider: process.env.ANALYTICS_PROVIDER || "google",
    cdnUrl: process.env.CDN_URL || "",
    webhookUrl: process.env.WEBHOOK_URL || "",
  },
  // Performance configuration
  performance: {
    compression: process.env.COMPRESSION_ENABLED !== "false",
    slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD || "1000"),
    memoryThreshold: parseInt(process.env.MEMORY_THRESHOLD || "500"), // MB
    cpuThreshold: parseInt(process.env.CPU_THRESHOLD || "80"), // %
  },
  // Validation
  validate: function () {
    var requiredVars = ["JWT_SECRET"];
    var missingVars = requiredVars.filter(function (varName) {
      return !process.env[varName];
    });
    if (missingVars.length > 0) {
      throw new Error(
        "Missing required environment variables: ".concat(
          missingVars.join(", "),
        ),
      );
    }
    if (
      process.env.NODE_ENV === "production" &&
      process.env.JWT_SECRET ===
        "your-super-secret-jwt-key-change-in-production"
    ) {
      throw new Error("JWT_SECRET must be changed in production");
    }
  },
};
