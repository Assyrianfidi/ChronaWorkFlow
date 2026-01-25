import dotenv from 'dotenv';

// Load environment variables from .env.production if NODE_ENV is production
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
} else {
  dotenv.config(); // Default to .env
}

// Required environment variables for production
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'SESSION_SECRET',
  'NODE_ENV',
  'FRONTEND_URL',
  'PORT',
  'HOSTNAME'
];

// Optional but recommended environment variables
const RECOMMENDED_ENV_VARS = [
  'OWNER_EMAIL',
  'REDIS_HOST',
  'REDIS_PORT',
  'REDIS_PASSWORD',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'PLAID_CLIENT_ID',
  'PLAID_SECRET'
];

// Frontend-specific environment variables (VITE_ prefixed)
const FRONTEND_ENV_VARS = [
  'VITE_API_URL',
  'VITE_API_VERSION',
  'VITE_ENABLE_CSRF',
  'VITE_ENABLE_CSP',
  'VITE_SENTRY_DSN',
  'VITE_GOOGLE_ANALYTICS_ID'
];

export function validateEnvironmentVariables(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // Check for production-specific requirements
  if (process.env.NODE_ENV === 'production') {
    // In production, DATABASE_URL must be a valid PostgreSQL connection string
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && !dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://')) {
      missing.push('DATABASE_URL (must be a valid PostgreSQL connection string)');
    }

    // JWT_SECRET and SESSION_SECRET must be strong in production
    const jwtSecret = process.env.JWT_SECRET;
    const sessionSecret = process.env.SESSION_SECRET;
    
    if (jwtSecret && jwtSecret.length < 32) {
      warnings.push('JWT_SECRET should be at least 32 characters long for production');
    }
    
    if (sessionSecret && sessionSecret.length < 32) {
      warnings.push('SESSION_SECRET should be at least 32 characters long for production');
    }

    // FRONTEND_URL must be HTTPS in production
    const frontendUrl = process.env.FRONTEND_URL;
    if (frontendUrl && !frontendUrl.startsWith('https://')) {
      warnings.push('FRONTEND_URL should use HTTPS in production');
    }
  }

  // Check recommended variables
  for (const envVar of RECOMMENDED_ENV_VARS) {
    if (!process.env[envVar]) {
      warnings.push(`Recommended variable ${envVar} is not set`);
    }
  }

  // Report missing required variables
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease set these environment variables and restart the server.');
    process.exit(1);
  }

  // Report warnings
  if (warnings.length > 0) {
    console.warn('⚠️  Environment variable warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }

  // Log successful validation
  console.log('✅ Environment variables validated successfully');
  
  // Log current environment (without secrets)
  console.log(`📋 Environment: ${process.env.NODE_ENV}`);
  console.log(`📋 Database: ${process.env.DATABASE_URL?.split('@')[1] || 'Not configured'}`);
  console.log(`📋 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`📋 Server: ${process.env.HOSTNAME}:${process.env.PORT}`);
}

export function getDatabaseConfig() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  return url;
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET or SESSION_SECRET must be set');
  }
  return secret;
}

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET or JWT_SECRET must be set');
  }
  return secret;
}

export function getFrontendUrl(): string {
  const url = process.env.FRONTEND_URL;
  if (!url) {
    throw new Error('FRONTEND_URL is not set');
  }
  return url;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function getServerConfig() {
  return {
    port: parseInt(process.env.PORT || '5000'),
    hostname: process.env.HOSTNAME || '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
  };
}
