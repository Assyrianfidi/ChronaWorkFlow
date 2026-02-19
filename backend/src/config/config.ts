import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const env = process.env.NODE_ENV || "development";
const isProduction = env === "production";

// Application configuration
export const config = {
  env,
  isProduction,
  port: process.env.PORT || "3001",
  host: process.env.HOST || "0.0.0.0",

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || "default-secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "default-refresh-secret",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    cookieExpiresIn: process.env.JWT_COOKIE_EXPIRES_IN || "7",
  },

  // Database configuration
  database: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/accubooks?schema=public",
  },

  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET || "default-session-secret",
    cookieMaxAge: parseInt(
      process.env.SESSION_COOKIE_MAX_AGE || "86400000",
      10,
    ), // 24 hours
  },

  // Security
  security: {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
  },

  // Logging
  logs: {
    level: process.env.LOG_LEVEL || "debug",
    file: process.env.LOG_FILE || "logs/combined.log",
  },

  // Admin user
  admin: {
    email: process.env.ADMIN_EMAIL || "admin@example.com",
    password: process.env.ADMIN_PASSWORD || "admin123",
  },
} as const;

export type Config = typeof config;
