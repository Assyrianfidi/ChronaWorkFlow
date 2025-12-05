// Test setup file that runs before all tests
import { config } from 'dotenv';
import path from 'path';
// Test setup file that runs before all tests

// Load test environment variables from the project root
config({ path: path.resolve(process.cwd(), '.env.test') });

// Set default test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-1234567890';
process.env.JWT_EXPIRES_IN = '1d';
process.env.PORT = '0';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/accubooks_test';

// Set test timeout (30 seconds)
const TEST_TIMEOUT = 30000;
jest.setTimeout(TEST_TIMEOUT);

// Global test utilities
const originalConsole = { ...console };

global.mockConsole = () => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
};

global.restoreConsole = () => {
  global.console = originalConsole;
};

console.log('Test environment initialized');
