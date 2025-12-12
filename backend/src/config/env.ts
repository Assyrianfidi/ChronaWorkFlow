import { z } from 'zod';
// @ts-ignore

import { logger } from '../utils/logger';

/**
 * Database configuration schema
 */
const DatabaseSchema = z.object({
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  POSTGRES_DB: z.string().min(1, 'Database name is required'),
  POSTGRES_USER: z.string().min(1, 'Database user is required'),
  POSTGRES_PASSWORD: z.string().min(1, 'Database password is required'),
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.string().transform(Number).default(5432),
});

/**
 * Redis configuration schema
 */
const RedisSchema = z.object({
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default(6379),
  REDIS_PASSWORD: z.string().optional(),
});

/**
 * Server configuration schema
 */
const ServerSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default(3000),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  API_VERSION: z.string().default('v1'),
});

/**
 * JWT configuration schema
 */
const JWTSchema = z.object({
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
});

/**
 * Security configuration schema
 */
const SecuritySchema = z.object({
  BCRYPT_ROUNDS: z.string().transform(Number).default(12),
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default(100),
});

/**
 * Email configuration schema
 */
const EmailSchema = z.object({
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
});

/**
 * File upload configuration schema
 */
const FileUploadSchema = z.object({
  MAX_FILE_SIZE: z.string().transform(Number).default(10485760), // 10MB
  ALLOWED_FILE_TYPES: z.string().default('jpg,jpeg,png,pdf,doc,docx'),
  UPLOAD_PATH: z.string().default('./uploads'),
});

/**
 * Logging configuration schema
 */
const LoggingSchema = z.object({
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().default('./logs/app.log'),
  LOG_MAX_SIZE: z.string().default('10m'),
  LOG_MAX_FILES: z.string().transform(Number).default(5),
});

/**
 * Monitoring configuration schema
 */
const MonitoringSchema = z.object({
  ENABLE_METRICS: z.string().transform(Boolean).default(true),
  METRICS_PORT: z.string().transform(Number).default(9090),
  HEALTH_CHECK_INTERVAL: z.string().transform(Number).default(30000),
});

/**
 * Cache configuration schema
 */
const CacheSchema = z.object({
  CACHE_TTL: z.string().transform(Number).default(3600),
  CACHE_MAX_SIZE: z.string().transform(Number).default(1000),
  ENABLE_CACHE: z.string().transform(Boolean).default(true),
});

/**
 * Feature flags schema
 */
const FeatureFlagsSchema = z.object({
  ENABLE_REGISTRATION: z.string().transform(Boolean).default(true),
  ENABLE_EMAIL_VERIFICATION: z.string().transform(Boolean).default(false),
  ENABLE_TWO_FACTOR_AUTH: z.string().transform(Boolean).default(false),
  ENABLE_API_RATE_LIMITING: z.string().transform(Boolean).default(true),
  ENABLE_AUDIT_LOG: z.string().transform(Boolean).default(true),
});

/**
 * External services schema
 */
const ExternalServicesSchema = z.object({
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
});

/**
 * Performance configuration schema
 */
const PerformanceSchema = z.object({
  ENABLE_COMPRESSION: z.string().transform(Boolean).default(true),
  COMPRESSION_LEVEL: z.string().transform(Number).default(6),
  ENABLE_CLUSTER: z.string().transform(Boolean).default(false),
  CLUSTER_WORKERS: z.string().transform(Number).default(0),
});

/**
 * Main environment configuration schema
 */
const EnvSchema = z.object({
  // Database
  ...DatabaseSchema.shape,
  // Redis
  ...RedisSchema.shape,
  // Server
  ...ServerSchema.shape,
  // JWT
  ...JWTSchema.shape,
  // Security
  ...SecuritySchema.shape,
  // Email
  ...EmailSchema.shape,
  // File upload
  ...FileUploadSchema.shape,
  // Logging
  ...LoggingSchema.shape,
  // Monitoring
  ...MonitoringSchema.shape,
  // Cache
  ...CacheSchema.shape,
  // Feature flags
  ...FeatureFlagsSchema.shape,
  // External services
  ...ExternalServicesSchema.shape,
  // Performance
  ...PerformanceSchema.shape,
});

/**
 * Type for validated environment variables
 */
export type EnvConfig = z.infer<typeof EnvSchema>;

/**
 * Validate and parse environment variables
 */
function validateEnv(): EnvConfig {
  try {
    const env = EnvSchema.parse(process.env);
    logger.info('Environment variables validated successfully');
    return env;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .filter((err: any) => err.code === 'invalid_type' && err.received === 'undefined')
        .map((err: any) => `  - ${err.path.join('.')}: ${err.message}`);
      
      const invalidVars = error.issues
        .filter((err: any) => err.code !== 'invalid_type' || err.received !== 'undefined')
        .map((err: any) => `  - ${err.path.join('.')}: ${err.message}`);

      let errorMessage = 'Environment validation failed:\n';
      
      if (missingVars.length > 0) {
        errorMessage += '\nMissing required variables:\n' + missingVars.join('\n');
      }
      
      if (invalidVars.length > 0) {
        errorMessage += '\nInvalid variables:\n' + invalidVars.join('\n');
      }

      logger.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    logger.error('Unexpected error during environment validation:', error);
    throw error;
  }
}

/**
 * Check for placeholder values that need manual replacement
 */
function checkPlaceholders(env: EnvConfig): string[] {
  const placeholders: string[] = [];
  
  // Common placeholder patterns
  const placeholderPatterns = [
    '<REDACTED',
    'your-secret',
    'your-key',
    'placeholder',
    'change-me',
    'todo',
    'xxx',
    'test-key',
    'demo',
  ];

  for (const [key, value] of Object.entries(env)) {
    if (typeof value === 'string') {
      for (const pattern of placeholderPatterns) {
        if (value.toLowerCase().includes(pattern)) {
          placeholders.push(`${key}: Contains placeholder "${pattern}"`);
          break;
        }
      }
    }
  }

  if (placeholders.length > 0) {
    logger.warn('Found placeholder values in environment:', placeholders);
  }

  return placeholders;
}

/**
 * Get environment-specific configuration
 */
function getEnvConfig(): {
  config: EnvConfig;
  placeholders: string[];
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
} {
  const config = validateEnv();
  const placeholders = checkPlaceholders(config);
  
  return {
    config,
    placeholders,
    isProduction: config.NODE_ENV === 'production',
    isDevelopment: config.NODE_ENV === 'development',
    isTest: config.NODE_ENV === 'test',
  };
}

/**
 * Export convenience getters for commonly used values
 */
export const env = getEnvConfig().config;
export const { isProduction, isDevelopment, isTest } = getEnvConfig();

/**
 * Database configuration
 */
export const database = {
  url: env.DATABASE_URL,
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  database: env.POSTGRES_DB,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
};

/**
 * Redis configuration
 */
export const redis = {
  url: env.REDIS_URL,
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
};

/**
 * Server configuration
 */
export const server = {
  port: env.PORT,
  env: env.NODE_ENV,
  corsOrigin: env.CORS_ORIGIN,
  apiVersion: env.API_VERSION,
};

/**
 * JWT configuration
 */
export const jwt = {
  secret: env.JWT_SECRET,
  expiresIn: env.JWT_EXPIRES_IN,
  refreshSecret: env.JWT_REFRESH_SECRET,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
};

/**
 * Security configuration
 */
export const security = {
  bcryptRounds: env.BCRYPT_ROUNDS,
  sessionSecret: env.SESSION_SECRET,
  rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
  rateLimitMaxRequests: env.RATE_LIMIT_MAX_REQUESTS,
};

/**
 * Email configuration
 */
export const email = {
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  user: env.SMTP_USER,
  pass: env.SMTP_PASS,
  from: env.EMAIL_FROM,
};

/**
 * File upload configuration
 */
export const fileUpload = {
  maxFileSize: env.MAX_FILE_SIZE,
  allowedFileTypes: env.ALLOWED_FILE_TYPES.split(','),
  uploadPath: env.UPLOAD_PATH,
};

/**
 * Logging configuration
 */
export const logging = {
  level: env.LOG_LEVEL,
  file: env.LOG_FILE,
  maxSize: env.LOG_MAX_SIZE,
  maxFiles: env.LOG_MAX_FILES,
};

/**
 * Monitoring configuration
 */
export const monitoring = {
  enabled: env.ENABLE_METRICS,
  port: env.METRICS_PORT,
  healthCheckInterval: env.HEALTH_CHECK_INTERVAL,
};

/**
 * Cache configuration
 */
export const cache = {
  ttl: env.CACHE_TTL,
  maxSize: env.CACHE_MAX_SIZE,
  enabled: env.ENABLE_CACHE,
};

/**
 * Feature flags
 */
export const features = {
  registration: env.ENABLE_REGISTRATION,
  emailVerification: env.ENABLE_EMAIL_VERIFICATION,
  twoFactorAuth: env.ENABLE_TWO_FACTOR_AUTH,
  apiRateLimiting: env.ENABLE_API_RATE_LIMITING,
  auditLog: env.ENABLE_AUDIT_LOG,
};

/**
 * External services configuration
 */
export const externalServices = {
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  },
  github: {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  },
};

/**
 * Performance configuration
 */
export const performance = {
  compression: {
    enabled: env.ENABLE_COMPRESSION,
    level: env.COMPRESSION_LEVEL,
  },
  cluster: {
    enabled: env.ENABLE_CLUSTER,
    workers: env.CLUSTER_WORKERS,
  },
};

/**
 * Export validation function for use in other modules
 */
export { validateEnv, getEnvConfig };

/**
 * Export all configuration for backward compatibility
 */
export default {
  env,
  isProduction,
  isDevelopment,
  isTest,
  database,
  redis,
  server,
  jwt,
  security,
  email,
  fileUpload,
  logging,
  monitoring,
  cache,
  features,
  externalServices,
  performance,
};
