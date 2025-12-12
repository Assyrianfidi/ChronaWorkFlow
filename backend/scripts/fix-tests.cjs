const fs = require('fs');
const path = require('path');

function fixTestConfiguration() {
  console.log('🔧 Fixing test configuration for TypeScript migration...\n');
  
  // Fix 1: Update Jest configuration to handle TypeScript
  const jestConfigPath = path.join(__dirname, '..', 'jest.config.cjs');
  let jestConfig = fs.readFileSync(jestConfigPath, 'utf8');
  
  // Add TypeScript transformation support
  if (!jestConfig.includes('ts-jest')) {
    jestConfig = jestConfig.replace(
      /transform: {/,
      `transform: {
    '^.+\\\\.tsx?$': 'ts-jest',`
    );
  }
  
  // Add module name mapping for absolute imports
  if (!jestConfig.includes('moduleNameMapping')) {
    jestConfig = jestConfig.replace(
      /testEnvironment:/,
      `moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/config/(.*)$': '<rootDir>/src/config/$1'
  },
  testEnvironment:`
    );
  }
  
  // Update file extensions to include TypeScript
  jestConfig = jestConfig.replace(
    /testMatch: \[/,
    `testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/src/**/?(*.)(spec|test).(ts|tsx|js)',`
  );
  
  fs.writeFileSync(jestConfigPath, jestConfig);
  console.log('✅ Updated Jest configuration for TypeScript');
  
  // Fix 2: Update test files to use TypeScript imports
  const testFiles = [
    'src/__tests__/auth-service.test.ts',
    'src/__tests__/auth-service.test.js'
  ];
  
  testFiles.forEach(testFile => {
    const fullPath = path.join(__dirname, '..', testFile);
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix dotenv import issue
      content = content.replace(
        /require\("\.\.\/config\/config\.js"\)/g,
        'require("../config/env")'
      );
      
      // Add @ts-ignore for TypeScript compatibility
      if (testFile.endsWith('.js')) {
        content = '// @ts-ignore\n' + content;
      }
      
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed imports in: ${testFile}`);
    }
  });
  
  // Fix 3: Update accounts.test.js to fix mock issues
  const accountsTestPath = path.join(__dirname, '..', 'src/__tests__/accounts.test.js');
  if (fs.existsSync(accountsTestPath)) {
    let content = fs.readFileSync(accountsTestPath, 'utf8');
    
    // Simplify the mock to avoid out-of-scope variable issues
    content = content.replace(
      /jest\.mock\("\.\.\/utils\/errors", \(\) => \({[\s\S]*?\}\)\);/g,
      `jest.mock("../utils/errors", () => ({
        ApiError: class ApiError extends Error {
          constructor(statusCode, message) {
            super(message);
            this.statusCode = statusCode;
          }
        },
        errorHandler: jest.fn(),
        globalErrorHandler: jest.fn(),
        notFoundHandler: jest.fn(),
        asyncHandler: jest.fn(),
        SystemPanicMonitor: jest.fn()
      }));`
    );
    
    fs.writeFileSync(accountsTestPath, content);
    console.log('✅ Fixed mock issues in accounts.test.js');
  }
  
  // Fix 4: Create a test setup file for environment variables
  const testSetupPath = path.join(__dirname, '..', 'src/__tests__/setup.ts');
  if (!fs.existsSync(testSetupPath)) {
    const testSetupContent = `
// Test setup file
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set default test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-that-is-at-least-32-characters-long';
process.env.SESSION_SECRET = 'test-session-secret-that-is-at-least-32-characters-long';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.SKIP_ENV_VALIDATION = 'true';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific console methods during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Setup test timeout
jest.setTimeout(10000);
`;
    
    fs.writeFileSync(testSetupPath, testSetupContent);
    console.log('✅ Created test setup file');
  }
  
  // Fix 5: Update Jest config to use setup file
  if (!jestConfig.includes('setupFilesAfterEnv')) {
    jestConfig = jestConfig.replace(
      /testEnvironment:/,
      `setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testEnvironment:`
    );
    
    fs.writeFileSync(jestConfigPath, jestConfig);
    console.log('✅ Added test setup file to Jest configuration');
  }
  
  // Fix 6: Create .env.test file
  const envTestPath = path.join(__dirname, '..', '.env.test');
  if (!fs.existsSync(envTestPath)) {
    const envTestContent = `
# Test Environment Variables
NODE_ENV=test
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Database (Test)
DATABASE_URL="postgresql://test:test@localhost:5432/accubooks_test"
POSTGRES_DB=accubooks_test
POSTGRES_USER=test
POSTGRES_PASSWORD=test
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# JWT (Test)
JWT_SECRET=test-jwt-secret-that-is-at-least-32-characters-long-for-testing-purposes
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=test-jwt-refresh-secret-that-is-at-least-32-characters-long-for-testing
JWT_REFRESH_EXPIRES_IN=7d

# Security (Test)
BCRYPT_ROUNDS=10
SESSION_SECRET=test-session-secret-that-is-at-least-32-characters-long-for-testing-purposes
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Email (Test - Disabled)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=test@example.com

# Redis (Test - Optional)
REDIS_URL=
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# File Upload (Test)
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx
UPLOAD_PATH=./test-uploads

# Logging (Test)
LOG_LEVEL=error
LOG_FILE=./test.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=1

# Monitoring (Test)
ENABLE_METRICS=false
METRICS_PORT=9090
HEALTH_CHECK_INTERVAL=30000

# Cache (Test)
CACHE_TTL=60
CACHE_MAX_SIZE=100
ENABLE_CACHE=false

# Feature Flags (Test)
ENABLE_REGISTRATION=true
ENABLE_EMAIL_VERIFICATION=false
ENABLE_TWO_FACTOR_AUTH=false
ENABLE_API_RATE_LIMITING=false
ENABLE_AUDIT_LOG=true

# External Services (Test - Disabled)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Performance (Test)
ENABLE_COMPRESSION=true
COMPRESSION_LEVEL=6
ENABLE_CLUSTER=false
CLUSTER_WORKERS=0

# Skip environment validation for tests
SKIP_ENV_VALIDATION=true
`;
    
    fs.writeFileSync(envTestPath, envTestContent);
    console.log('✅ Created .env.test file');
  }
  
  console.log('\n✅ Test configuration fixes applied!');
  console.log('\n📝 Next steps:');
  console.log('1. Run `npm test` to check if tests pass');
  console.log('2. Fix any remaining test failures individually');
  console.log('3. Ensure database is available for integration tests');
  console.log('4. Update test mocks as needed for TypeScript compatibility');
}

if (require.main === module) {
  fixTestConfiguration();
}

module.exports = { fixTestConfiguration };
