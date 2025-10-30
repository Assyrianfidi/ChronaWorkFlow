// Robust environment validator using Joi
const Joi = require('joi');
const { logger } = require('./utils/logger');

function containsRedacted(value) {
  if (!value) return false;
  const patterns = [/REDACTED/i, /your_?secret/i, /your_?password/i, /change_me/i, /<.*>/];
  try {
    return patterns.some((p) => p.test(String(value)));
  } catch (err) {
    return false;
  }
}

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  DATABASE_URL: Joi.string().uri().required(),
  REDIS_URL: Joi.string().uri().required(),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().port().required(),
  PORT: Joi.number().default(3000),
  HOST: Joi.string().default('localhost'),

  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  SESSION_SECRET: Joi.string().min(32).required(),

  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().required(),
  SMTP_SECURE: Joi.boolean().optional(),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  MAIL_FROM: Joi.string().required(),

  STRIPE_SECRET_KEY: Joi.string().pattern(/^sk_/).required(),
  STRIPE_PUBLISHABLE_KEY: Joi.string().pattern(/^pk_/).required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().pattern(/^whsec_/).required(),

  FRONTEND_URL: Joi.string().uri().required(),
  ADMIN_URL: Joi.string().uri().required(),
  API_URL: Joi.string().uri().required(),
  DOCS_URL: Joi.string().uri().required(),
}).unknown(true);

function validateEnv() {
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
    ADMIN_URL: process.env.ADMIN_URL,
    API_URL: process.env.API_URL,
    DOCS_URL: process.env.DOCS_URL,
  };

  const { error } = schema.validate(env, { abortEarly: false });

  const redacted = Object.entries(env)
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

  if (error) {
    logger.error('Environment validation failed:');
    error.details.forEach((d) => logger.error(` - ${d.message}`));
    throw new Error('Environment validation failed');
  }

  logger.info('Environment validation passed');
}

module.exports = { validateEnv };
