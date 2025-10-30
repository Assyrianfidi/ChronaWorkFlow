const Joi = require('joi');
const { logger } = require('./utils/logger');

// Check if a value appears to be a redacted placeholder
function containsRedacted(value) {
  if (!value) return false;
  const redactedPatterns = [
    /<REDACTED.*>/i,
    /your.*secret.*here/i,
    /your.*key.*here/i,
    /your.*password.*here/i,
    /change.*me/i,
    /undefined/i,
    /null/i,
    /^$/
  ];
  return redactedPatterns.some(pattern => pattern.test(value));
}

// Environment schema definition with strict validation
const schema = Joi.object({
  // Node environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Database configuration
  DATABASE_URL: Joi.string()
    .uri()
    .required(),
  DB_POOL_MIN: Joi.number()
    .min(1)
    .default(2),
  DB_POOL_MAX: Joi.number()
    .min(5)
    .default(20),
  DB_IDLE_TIMEOUT_MS: Joi.number()
    .min(1000)
    .default(30000),
  DB_CONNECTION_TIMEOUT_MS: Joi.number()
    .min(1000)
    .default(2000),

  // Redis configuration
  REDIS_URL: Joi.string()
    .uri()
    .required(),
  REDIS_HOST: Joi.string()
    .required(),
  REDIS_PORT: Joi.number()
    .port()
    .required(),
  REDIS_PASSWORD: Joi.string()
    .allow('')
    .optional(),

  // Application configuration
  PORT: Joi.number()
    .port()
    .default(3000),
  HOST: Joi.string()
    .hostname()
    .default('localhost'),
  APP_NAME: Joi.string()
    .default('AccuBooks'),
  APP_VERSION: Joi.string()
    .default('1.0.0'),

  // Authentication & Security
  JWT_SECRET: Joi.string()
    .min(32)
    .required(),
  JWT_EXPIRES_IN: Joi.string()
    .required(),
  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string()
    .required(),
  SESSION_SECRET: Joi.string()
    .min(32)
    .required(),
  SESSION_COOKIE_NAME: Joi.string()
    .default('accubooks.sid'),
  SESSION_COOKIE_SECURE: Joi.boolean()
    .default(false),
  SESSION_COOKIE_HTTPONLY: Joi.boolean()
    .default(true),
  SESSION_COOKIE_MAX_AGE: Joi.number()
    .default(86400000),

  // Email configuration
  SMTP_HOST: Joi.string()
    .required(),
  SMTP_PORT: Joi.number()
    .port()
    .required(),
  SMTP_SECURE: Joi.boolean()
    .default(true),
  SMTP_USER: Joi.string()
    .email()
    .required(),
  SMTP_PASS: Joi.string()
    .required(),
  MAIL_FROM: Joi.string()
    .email()
    .required(),
  MAIL_NAME: Joi.string()
    .required(),

  // Stripe configuration
  STRIPE_SECRET_KEY: Joi.string()
    .pattern(/^sk_.*/)
    .required(),
  STRIPE_PUBLISHABLE_KEY: Joi.string()
    .pattern(/^pk_.*/)
    .required(),
  STRIPE_WEBHOOK_SECRET: Joi.string()
    .pattern(/^whsec_.*/)
    .required(),

  // URLs and endpoints
  FRONTEND_URL: Joi.string()
    .uri()
    .required(),
  ADMIN_URL: Joi.string()
    .uri()
    .required(),
  API_URL: Joi.string()
    .uri()
    .required(),
  DOCS_URL: Joi.string()
    .uri()
    .required(),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .min(1000)
    .default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .min(1)
    .default(100),

  // Optional monitoring configuration
  SENTRY_DSN: Joi.string()
    .uri()
    .optional(),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info')
}).unknown(true);

/**
 * Validates the environment configuration and ensures no sensitive data is exposed
 * @throws {Error} if validation fails or redacted placeholders are found
 */
function validateEnv() {
  const env = {
    // Node environment
    NODE_ENV: process.env.NODE_ENV,
    
    // Database
    DATABASE_URL: process.env.DATABASE_URL,
    DB_POOL_MIN: process.env.DB_POOL_MIN,
    DB_POOL_MAX: process.env.DB_POOL_MAX,
    DB_IDLE_TIMEOUT_MS: process.env.DB_IDLE_TIMEOUT_MS,
    DB_CONNECTION_TIMEOUT_MS: process.env.DB_CONNECTION_TIMEOUT_MS,

    // Redis
    REDIS_URL: process.env.REDIS_URL,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,

    // Application
    PORT: process.env.PORT,
    HOST: process.env.HOST,
    APP_NAME: process.env.APP_NAME,
    APP_VERSION: process.env.APP_VERSION,

    // Authentication
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
    SESSION_SECRET: process.env.SESSION_SECRET,

    // Email
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    MAIL_FROM: process.env.MAIL_FROM,
    MAIL_NAME: process.env.MAIL_NAME,

    // Stripe
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

    // URLs
    FRONTEND_URL: process.env.FRONTEND_URL,
    ADMIN_URL: process.env.ADMIN_URL,
    API_URL: process.env.API_URL,
    DOCS_URL: process.env.DOCS_URL,

    // Rate limiting
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,

    // Monitoring
    SENTRY_DSN: process.env.SENTRY_DSN,
    LOG_LEVEL: process.env.LOG_LEVEL,
  };

  // Validate schema
  const { error } = schema.validate(env, { abortEarly: false });

  // Check for redacted values in sensitive fields
  const redacted = Object.entries(env)
    .filter(([key, value]) => {
      const isSensitive = [
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
        'SESSION_SECRET',
        'SMTP_PASS',
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'REDIS_PASSWORD',
        'DB_PASSWORD',
      ].includes(key);
      return isSensitive && containsRedacted(value);
    })
    .map(([key]) => key);

  if (redacted.length > 0) {
    const message = `Environment contains redacted placeholders for: ${redacted.join(', ')}. Replace with real values locally.`;
    logger.error(message);
    throw new Error(message);
  }

  if (error) {
    logger.error('Environment validation failed:');
    error.details.forEach((detail) => {
      logger.error(` - ${detail.message}`);
    });
    throw new Error('Environment validation failed. Check logs for details.');
  }

  logger.info('Environment validation passed');
}

module.exports = { validateEnv };