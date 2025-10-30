const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

// Default configuration
const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  
  // Database
  db: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/accubooks?schema=public',
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_here',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_token_secret_here',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  },
  
  // Logging
  logs: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
  
  // Email (for future use)
  email: {
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: process.env.SMTP_PORT || 587,
    user: process.env.SMTP_USER || 'your_email@example.com',
    pass: process.env.SMTP_PASS || 'your_email_password',
    from: process.env.SMTP_FROM || 'AccuBooks <noreply@accubooks.com>',
  },
  
  // Frontend URL for email templates, etc.
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};

// Export config
module.exports = config;

// Export individual configs for easier imports
module.exports.NODE_ENV = config.env;
module.exports.PORT = config.port;
module.exports.DATABASE_URL = config.db.url;
module.exports.JWT_SECRET = config.jwt.secret;
module.exports.JWT_EXPIRES_IN = config.jwt.expiresIn;
module.exports.JWT_REFRESH_SECRET = config.jwt.refreshSecret;
module.exports.JWT_REFRESH_EXPIRES_IN = config.jwt.refreshExpiresIn;
module.exports.CORS_ORIGIN = config.cors.origin;
module.exports.RATE_LIMIT_WINDOW_MS = config.rateLimit.windowMs;
module.exports.RATE_LIMIT_MAX = config.rateLimit.max;
module.exports.LOG_LEVEL = config.logs.level;
module.exports.LOG_FILE = config.logs.file;
module.exports.FRONTEND_URL = config.frontendUrl;
