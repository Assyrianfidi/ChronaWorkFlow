import crypto from 'crypto';
import logger from './logger.js';

const REQUIRED_ENV_VARS = [
  'NODE_ENV',
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'CORS_ORIGIN',
  'FRONTEND_URL',
];

const MIN_SECRET_LENGTH = 64; // Production requires 64+ characters

export function validateEnvironment() {
  const errors = [];
  const warnings = [];

  // Check NODE_ENV
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'development') {
    errors.push('NODE_ENV must be either "production" or "development"');
  }

  // Check required variables exist
  REQUIRED_ENV_VARS.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });

  // CRITICAL: Enforce production mode
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'development') {
    errors.push('🔴 BLOCKER: NODE_ENV must be set to "production" for deployment');
  }

  // Production-specific validations
  if (process.env.NODE_ENV === 'production') {
    // JWT Secret strength - MANDATORY 64+ characters
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < MIN_SECRET_LENGTH) {
      errors.push(`🔴 BLOCKER #1: JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters in production (current: ${process.env.JWT_SECRET?.length || 0})`);
      errors.push('   Generate with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    }

    if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < MIN_SECRET_LENGTH) {
      errors.push(`🔴 BLOCKER #1: JWT_REFRESH_SECRET must be at least ${MIN_SECRET_LENGTH} characters in production (current: ${process.env.JWT_REFRESH_SECRET?.length || 0})`);
      errors.push('   Generate with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    }

    // Check for weak/test secrets
    const weakSecrets = ['test-secret', 'secret', 'password', 'change-me', 'your_secret_here'];
    if (weakSecrets.some(weak => process.env.JWT_SECRET?.toLowerCase().includes(weak))) {
      errors.push('JWT_SECRET appears to be a test/weak secret. Use a cryptographically random string.');
    }

    if (weakSecrets.some(weak => process.env.JWT_REFRESH_SECRET?.toLowerCase().includes(weak))) {
      errors.push('JWT_REFRESH_SECRET appears to be a test/weak secret. Use a cryptographically random string.');
    }

    // Stripe key validation - MANDATORY LIVE KEYS
    if (!process.env.STRIPE_SECRET_KEY) {
      errors.push('🔴 BLOCKER #2: STRIPE_SECRET_KEY is required in production');
    } else if (process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
      errors.push('🔴 BLOCKER #2: STRIPE_SECRET_KEY is a TEST key. Production requires LIVE key (sk_live_*)');
      errors.push('   Get LIVE key from: https://dashboard.stripe.com/apikeys');
    } else if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
      errors.push('🔴 BLOCKER #2: STRIPE_SECRET_KEY must start with sk_live_ for production');
    }

    // Stripe webhook secret validation
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      errors.push('🔴 BLOCKER #2: STRIPE_WEBHOOK_SECRET is required in production');
    } else if (!process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
      warnings.push('STRIPE_WEBHOOK_SECRET should start with whsec_');
    }

    // Database SSL check - MANDATORY
    if (!process.env.DATABASE_URL) {
      errors.push('🔴 BLOCKER #4: DATABASE_URL is required');
    } else if (!process.env.DATABASE_URL.includes('sslmode=require') && !process.env.DATABASE_URL.includes('ssl=true')) {
      errors.push('🔴 BLOCKER #4: DATABASE_URL must include sslmode=require for production');
      errors.push('   Example: postgresql://user:pass@host:5432/db?sslmode=require');
    }

    // CORS origin check
    if (process.env.CORS_ORIGIN?.includes('localhost')) {
      warnings.push('CORS_ORIGIN contains localhost in production environment');
    }

    // HTTPS check
    if (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.startsWith('https://')) {
      errors.push('FRONTEND_URL must use HTTPS in production');
    }
  }

  // Report results
  if (errors.length > 0) {
    logger.error('Environment validation FAILED - BLOCKING SERVER STARTUP', { errors, warnings });
    console.error('\n');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('🔴 CRITICAL: ENVIRONMENT VALIDATION FAILED');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('\nServer startup BLOCKED due to critical configuration errors:\n');
    errors.forEach((err, idx) => console.error(`${idx + 1}. ${err}`));
    if (warnings.length > 0) {
      console.warn('\n⚠️  WARNINGS:\n');
      warnings.forEach(warn => console.warn(`   ${warn}`));
    }
    console.error('\n═══════════════════════════════════════════════════════════════');
    console.error('Fix all blockers above before starting server.');
    console.error('═══════════════════════════════════════════════════════════════\n');
    process.exit(1); // Force exit - do not allow server to start
  }

  if (warnings.length > 0) {
    logger.warn('Environment validation passed with warnings', { warnings });
    console.warn('\n⚠️  Environment validation passed with warnings:\n');
    warnings.forEach(warn => console.warn(`  ⚠️  ${warn}`));
    console.warn('\n');
  } else {
    logger.info('Environment validation passed');
  }

  return { valid: true, errors, warnings };
}

export function generateSecureSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

export default validateEnvironment;
