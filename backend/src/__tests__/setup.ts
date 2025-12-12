
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
