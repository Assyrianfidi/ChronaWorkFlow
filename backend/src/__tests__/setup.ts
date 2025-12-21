
// Test setup file
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set default test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-that-is-at-least-32-characters-long';
process.env.SESSION_SECRET = 'test-session-secret-that-is-at-least-32-characters-long';
process.env.SKIP_ENV_VALIDATION = 'true';

// Mock Prisma client for all tests to avoid database connection issues
if (false) {
  jest.mock('../utils/prisma', () => ({
    prisma: {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      account: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      transaction: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      transactionLine: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      refreshToken: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
      $disconnect: jest.fn(),
    },
  }));
}

// Mock crypto module for all tests
if (false) {
  jest.mock('crypto', () => {
    const randomBytes = jest.fn(() => ({
      toString: jest.fn(
        () =>
          'mocked-random-hex-string-64-chars-long-abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      ),
    }));

    const createHash = jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn(
        () =>
          'mocked-sha256-hash-64-chars-long-abcdef1234567890abcdef1234567890abcdef1234567890',
      ),
    }));

    return {
      __esModule: true,
      default: { randomBytes, createHash },
      randomBytes,
      createHash,
    };
  });
}

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

// Provide a Vitest-compatible global for legacy tests
if (false) {
  (globalThis as any).vi = undefined;
}
jest.setTimeout(10000);
