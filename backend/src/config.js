// Application configuration
const config = {
  // Node environment (development, test, production)
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Server configuration
  PORT: process.env.PORT || 3000,
  
  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET || 'test-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  
  // Database configuration
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/accubooks_test',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // API configuration
  API_PREFIX: '/api',
  
  // CORS configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: 100, // limit each IP to 100 requests per windowMs
  
  // Security
  SECURITY_HEADERS: {
    xssProtection: '1; mode=block',
    noSniff: 'nosniff',
    xFrameOptions: 'DENY',
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  
  // Test configuration
  TEST: {
    USER_EMAIL: 'test@example.com',
    USER_PASSWORD: 'test1234',
    ADMIN_EMAIL: 'admin@example.com',
    ADMIN_PASSWORD: 'admin1234',
  },
};

export default config;
