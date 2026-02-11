// Environment variable management and validation
interface EnvConfig {
  NODE_ENV: "development" | "production" | "test";
  VITE_API_URL: string;
  VITE_API_VERSION: string;
  VITE_API_TIMEOUT: number;
  VITE_ENABLE_CSRF: boolean;
  VITE_ENABLE_CSP: boolean;
  VITE_SESSION_TIMEOUT: number;
  VITE_JWT_EXPIRES_IN: string;
  VITE_REFRESH_TOKEN_EXPIRES_IN: string;
  VITE_ALLOWED_ORIGINS: string[];
  VITE_CORS_CREDENTIALS: boolean;
  VITE_RATE_LIMIT_WINDOW: number;
  VITE_RATE_LIMIT_MAX: number;
  VITE_ENABLE_ANALYTICS: boolean;
  VITE_ENABLE_ERROR_REPORTING: boolean;
  VITE_ENABLE_PERFORMANCE_MONITORING: boolean;
  VITE_SENTRY_DSN?: string;
  VITE_GOOGLE_ANALYTICS_ID?: string;
  VITE_MAX_FILE_SIZE: number;
  VITE_ALLOWED_FILE_TYPES: string[];
  VITE_LOG_LEVEL: "error" | "warn" | "info" | "debug";
}

// Validate and parse environment variables
export const validateEnv = (): EnvConfig => {
  const requiredVars = ["NODE_ENV", "VITE_API_URL", "VITE_API_VERSION"];

  const missingVars = requiredVars.filter(
    (varName) => !import.meta.env[varName],
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`,
    );
  }

  // Validate API URL is HTTPS
  const apiUrl = import.meta.env.VITE_API_URL;
  if (
    !apiUrl.startsWith("https://") &&
    import.meta.env.NODE_ENV === "production"
  ) {
    throw new Error("API URL must use HTTPS in production");
  }

  // Parse and validate numeric values
  const apiTimeout = parseInt(import.meta.env.VITE_API_TIMEOUT || "10000");
  const sessionTimeout = parseInt(
    import.meta.env.VITE_SESSION_TIMEOUT || "3600000",
  );
  const rateLimitWindow = parseInt(
    import.meta.env.VITE_RATE_LIMIT_WINDOW || "900000",
  );
  const rateLimitMax = parseInt(import.meta.env.VITE_RATE_LIMIT_MAX || "100");
  const maxFileSize = parseInt(
    import.meta.env.VITE_MAX_FILE_SIZE || "10485760",
  );

  // Parse boolean values
  const enableCSRF = import.meta.env.VITE_ENABLE_CSRF === "true";
  const enableCSP = import.meta.env.VITE_ENABLE_CSP === "true";
  const corsCredentials = import.meta.env.VITE_CORS_CREDENTIALS === "true";
  const enableAnalytics = import.meta.env.VITE_ENABLE_ANALYTICS === "true";
  const enableErrorReporting =
    import.meta.env.VITE_ENABLE_ERROR_REPORTING === "true";
  const enablePerfMonitoring =
    import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === "true";

  // Parse array values
  const allowedOrigins = (import.meta.env.VITE_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedFileTypes = (import.meta.env.VITE_ALLOWED_FILE_TYPES || "")
    .split(",")
    .map((type) => type.trim())
    .filter(Boolean);

  // Validate log level
  const logLevel = (import.meta.env.VITE_LOG_LEVEL ||
    "error") as EnvConfig["VITE_LOG_LEVEL"];
  const validLogLevels = ["error", "warn", "info", "debug"];
  if (!validLogLevels.includes(logLevel)) {
    throw new Error(
      `Invalid log level: ${logLevel}. Must be one of: ${validLogLevels.join(", ")}`,
    );
  }

  return {
    NODE_ENV: import.meta.env.NODE_ENV as EnvConfig["NODE_ENV"],
    VITE_API_URL: apiUrl,
    VITE_API_VERSION: import.meta.env.VITE_API_VERSION,
    VITE_API_TIMEOUT: apiTimeout,
    VITE_ENABLE_CSRF: enableCSRF,
    VITE_ENABLE_CSP: enableCSP,
    VITE_SESSION_TIMEOUT: sessionTimeout,
    VITE_JWT_EXPIRES_IN: import.meta.env.VITE_JWT_EXPIRES_IN || "1h",
    VITE_REFRESH_TOKEN_EXPIRES_IN:
      import.meta.env.VITE_REFRESH_TOKEN_EXPIRES_IN || "7d",
    VITE_ALLOWED_ORIGINS: allowedOrigins,
    VITE_CORS_CREDENTIALS: corsCredentials,
    VITE_RATE_LIMIT_WINDOW: rateLimitWindow,
    VITE_RATE_LIMIT_MAX: rateLimitMax,
    VITE_ENABLE_ANALYTICS: enableAnalytics,
    VITE_ENABLE_ERROR_REPORTING: enableErrorReporting,
    VITE_ENABLE_PERFORMANCE_MONITORING: enablePerfMonitoring,
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    VITE_GOOGLE_ANALYTICS_ID: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
    VITE_MAX_FILE_SIZE: maxFileSize,
    VITE_ALLOWED_FILE_TYPES: allowedFileTypes,
    VITE_LOG_LEVEL: logLevel,
  };
};

// Secure configuration object
export const config = validateEnv();

// Environment-specific configurations
export const isDevelopment = config.NODE_ENV === "development";
export const isProduction = config.NODE_ENV === "production";
export const isTest = config.NODE_ENV === "test";

// Security configuration
export const securityConfig = {
  enableCSRF: config.VITE_ENABLE_CSRF,
  enableCSP: config.VITE_ENABLE_CSP,
  sessionTimeout: config.VITE_SESSION_TIMEOUT,
  jwtExpiresIn: config.VITE_JWT_EXPIRES_IN,
  refreshTokenExpiresIn: config.VITE_REFRESH_TOKEN_EXPIRES_IN,
  allowedOrigins: config.VITE_ALLOWED_ORIGINS,
  corsCredentials: config.VITE_CORS_CREDENTIALS,
  rateLimitWindow: config.VITE_RATE_LIMIT_WINDOW,
  rateLimitMax: config.VITE_RATE_LIMIT_MAX,
};

// API configuration
export const apiConfig = {
  baseUrl: config.VITE_API_URL,
  version: config.VITE_API_VERSION,
  timeout: config.VITE_API_TIMEOUT,
};

// Feature flags
export const features = {
  analytics: config.VITE_ENABLE_ANALYTICS,
  errorReporting: config.VITE_ENABLE_ERROR_REPORTING,
  performanceMonitoring: config.VITE_ENABLE_PERFORMANCE_MONITORING,
};

// File upload configuration
export const fileConfig = {
  maxSize: config.VITE_MAX_FILE_SIZE,
  allowedTypes: config.VITE_ALLOWED_FILE_TYPES,
};

// Logging configuration
export const logConfig = {
  level: config.VITE_LOG_LEVEL,
  enableConsole: isDevelopment,
  enableFile: isProduction,
};

export default {
  config,
  isDevelopment,
  isProduction,
  isTest,
  securityConfig,
  apiConfig,
  features,
  fileConfig,
  logConfig,
};
