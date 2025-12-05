const { cleanEnv, str, num, bool, url, makeValidator } = require('envalid');

const nonemptystr = makeValidator((v) => {
  const err = new Error('Expected a non-empty string');
  if (v === undefined || v === null || v === '') {
    throw err;
  }
  const trimmed = String(v).trim();
  if (!trimmed) throw err;
  return trimmed;
});

const validateEnv = () => {
  cleanEnv(process.env, {
    // Required variables
    NODE_ENV: str({
      choices: ['development', 'test', 'production'],
      default: 'development',
    }),
    PORT: num({ default: 5000 }),
    DATABASE_URL: nonemptystr({
      desc: 'PostgreSQL connection string',
      example: 'postgresql://user:password@localhost:5432/dbname',
    }),
    JWT_SECRET: nonemptystr({
      desc: 'Secret key for JWT token generation',
      docs: 'https://jwt.io/',
    }),
    
    // Optional variables with defaults
    JWT_EXPIRES_IN: str({ default: '1d' }),
    REDIS_URL: str({ default: 'redis://localhost:6379' }),
    
    // Email configuration
    SMTP_HOST: str({ default: '' }),
    SMTP_PORT: num({ default: 587 }),
    SMTP_SECURE: bool({ default: false }),
    SMTP_USER: str({ default: '' }),
    SMTP_PASS: str({ default: '' }),
    MAIL_FROM: str({ default: 'no-reply@example.com' }),
    
    // URLs
    FRONTEND_URL: str({ default: 'http://localhost:3000' }),
    API_URL: str({ default: 'http://localhost:5000' }),
    
    // Logging
    LOG_LEVEL: str({
      choices: ['error', 'warn', 'info', 'http', 'debug'],
      default: 'info',
    }),
  }, {
    // Global options
    strict: true,
    dotEnvPath: null, // We'll load .env manually
  });
};

// Export validated environment variables
const getEnv = () => {
  const env = {
    // Core
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT, 10) || 5000,
    
    // Database
    DATABASE_URL: process.env.DATABASE_URL,
    
    // Auth
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
    
    // Redis
    REDIS_URL: process.env.REDIS_URL,
    
    // Email
    SMTP: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
    MAIL_FROM: process.env.MAIL_FROM,
    
    // URLs
    FRONTEND_URL: process.env.FRONTEND_URL,
    API_URL: process.env.API_URL,
    
    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  };
  
  return env;
};

module.exports = {
  validateEnv,
  getEnv,
};
