import Joi from 'joi';
import { logger } from './utils/logger.js';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the current file's directory using import.meta.url
const currentDir = path.dirname(fileURLToPath(import.meta.url));

// Common validation patterns
const patterns = {
  jwtSecret: /^[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*$/
};

// Custom validation messages
const messages = {
  'string.base': '{#label} must be a string',
  'string.empty': '{#label} cannot be empty',
  'string.min': '{#label} must be at least {#limit} characters',
  'number.base': '{#label} must be a number',
  'number.port': '{#label} must be a valid port number',
  'any.required': '{#label} is required',
  'string.uri': '{#label} must be a valid URI',
  'string.pattern.base': '{#label} does not match the required pattern',
  'any.only': '{#label} must be one of {#valids}'
};

// Define schema with custom messages
const schema = Joi.object({
  // Core
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development')
    .messages({
      'any.only': 'NODE_ENV must be one of development, production, or test'
    }),

  PORT: Joi.number()
    .port()
    .default(3000)
    .messages({
      'number.base': 'PORT must be a number',
      'number.port': 'PORT must be a valid port number (1-65535)'
    }),

  // Database
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required()
    .messages({
      'string.uri': 'DATABASE_URL must be a valid PostgreSQL connection string',
      'string.empty': 'DATABASE_URL is required'
    }),

  // JWT
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .pattern(patterns.jwtSecret)
    .messages({
      'string.min': 'JWT_SECRET must be at least 32 characters long',
      'string.pattern.base': 'JWT_SECRET must be a valid JWT secret'
    }),

  // Add more environment variables as needed
}).unknown(true);

function validateEnv() {
  const isTest = process.env.NODE_ENV === 'test';
  const isDev = process.env.NODE_ENV === 'development';

  // Skip validation in test environment if explicitly set
  if (isTest && process.env.SKIP_ENV_VALIDATION === 'true') {
    logger.warn('Skipping environment validation in test environment');
    return true;
  }

  const env = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    PORT: process.env.PORT,
    HOST: process.env.HOST,

    JWT_SECRET: process.env.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    SESSION_SECRET: process.env.SESSION_SECRET,

    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER || process.env.SMTP_USERNAME,
    SMTP_PASS: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
    MAIL_FROM: process.env.MAIL_FROM,

    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

    FRONTEND_URL: process.env.FRONTEND_URL,
  };

  const { error, value } = schema.validate(process.env, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true
  });

  // Skip redaction check in development
  if (!isDev) {
    const redacted = Object.entries(value)
      .filter(([k, v]) => {
        const sensitiveKeys = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'SESSION_SECRET', 'SMTP_PASS', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'REDIS_PASSWORD', 'DB_PASSWORD'];
        return sensitiveKeys.includes(k) && containsRedacted(v);
      })
      .map(([k]) => k);

    if (redacted.length > 0) {
      const msg = `Environment contains redacted placeholders for: ${redacted.join(', ')}. Replace with real values.`;
      logger.error(msg);
      throw new Error(msg);
    }
  }

  if (error) {
    const errorMessage = `Invalid environment variables (${process.env.NODE_ENV || 'development'}):\n${error.details
      .map((d) => `- ${d.path.join('.')}: ${d.message}`)
      .join('\n')}`;

    if (isTest) {
      console.error('❌ Environment validation failed in test environment:');
      console.error(errorMessage);
      process.exit(1);
    }

    if (criticalErrors.length > 0 || !isDev) {
      throw new Error('Environment validation failed');
    }

    logger.warn('Non-critical environment validation issues detected. Continuing in development mode.');
  }

  logger.info('Environment validation passed');
}

export { validateEnv };
