const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Default configuration
const config = {
  // Core
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3001, // Changed from 3000 to 3001 to avoid conflicts
  HOST: process.env.HOST || 'localhost',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:Fkhouch8@localhost:5432/AccuBooks?sslmode=prefer&connect_timeout=10',

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT || 6379,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production_12345',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_in_prod_12345',
  SESSION_SECRET: process.env.SESSION_SECRET || 'dev_session_secret_change_in_prod_12345',

  // Email
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.ethereal.email',
  SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || 'test@example.com',
  SMTP_PASS: process.env.SMTP_PASS || 'testpass123!@#',
  MAIL_FROM: process.env.MAIL_FROM || 'noreply@accubooks.dev',

  // Stripe (test mode defaults)
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_51P3Xr1Kj4X8Z1X2Q3w4e5r6t7y8u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8',
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_51P3Xr1Kj4X8Z1X2Q3w4e5r6t7y8u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_1234567890abcdefghijklmnopqrstuvwxyz123456',

  // URLs
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  ADMIN_URL: process.env.ADMIN_URL || 'http://localhost:5173/admin',
  API_URL: process.env.API_URL || 'http://localhost:3000',
  DOCS_URL: process.env.DOCS_URL || 'http://localhost:3000/api-docs',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Rate Limiting
  rateLimit: {
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  },

  // Logging
  logs: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
  
  // Database (legacy structure)
  db: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:Fkhouch8@localhost:5432/AccuBooks?sslmode=prefer&connect_timeout=10',
  },

  // JWT (legacy structure)
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production_12345',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_in_prod_12345',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // CORS (legacy structure)
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  // Rate limiting (legacy structure)
  rateLimit: {
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX || 100,
  },

  // Frontend URL for email templates, etc.
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};

// Export config with backward compatibility
module.exports = {
  ...config,
  // Top-level exports for backward compatibility
  NODE_ENV: config.NODE_ENV,
  PORT: config.PORT,
  HOST: config.HOST,
  DATABASE_URL: config.DATABASE_URL,
  REDIS_URL: config.REDIS_URL,
  REDIS_HOST: config.REDIS_HOST,
  REDIS_PORT: config.REDIS_PORT,
  JWT_SECRET: config.JWT_SECRET,
  JWT_REFRESH_SECRET: config.JWT_REFRESH_SECRET,
  SESSION_SECRET: config.SESSION_SECRET,
  SMTP_HOST: config.SMTP_HOST,
  SMTP_PORT: config.SMTP_PORT,
  SMTP_SECURE: config.SMTP_SECURE,
  SMTP_USER: config.SMTP_USER,
  SMTP_PASS: config.SMTP_PASS,
  MAIL_FROM: config.MAIL_FROM,
  STRIPE_SECRET_KEY: config.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: config.STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: config.STRIPE_WEBHOOK_SECRET,
  FRONTEND_URL: config.FRONTEND_URL,
  ADMIN_URL: config.ADMIN_URL,
  API_URL: config.API_URL,
  DOCS_URL: config.DOCS_URL,
  CORS_ORIGIN: config.CORS_ORIGIN,
  RATE_LIMIT_WINDOW_MS: config.rateLimit.windowMs,
  RATE_LIMIT_MAX: config.rateLimit.max,
};
module.exports.RATE_LIMIT_MAX = config.rateLimit.max;
module.exports.LOG_LEVEL = config.logs.level;
module.exports.LOG_FILE = config.logs.file;
module.exports.FRONTEND_URL = config.frontendUrl;
