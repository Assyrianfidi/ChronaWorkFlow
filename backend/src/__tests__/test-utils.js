// Test utilities and setup - CommonJS module
const path = require("path");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");

// Load test environment variables from the project root
dotenv.config({ path: path.resolve(__dirname, "../../.env.test") });

// Set default test database URL if not provided
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://postgres:postgres@localhost:5432/accubooks_test";
}

// Mock console methods
const originalConsole = { ...console };

/**
 * Create a test user in the database
 * @param {object} prisma - Prisma client instance
 * @param {object} userData - User data to override defaults
 * @returns {Promise<object>} Created user object
 */
const createTestUser = async (prisma, userData = {}) => {
  const testUser = {
    id: uuidv4(),
    email: userData.email || `test-${uuidv4()}@example.com`,
    name: userData.name || "Test User",
    password: userData.password || "testpassword",
    isEmailVerified:
      userData.isEmailVerified !== undefined ? userData.isEmailVerified : true,
    role: userData.role || "USER",
    ...userData,
  };

  return prisma.user.create({
    data: testUser,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isEmailVerified: true,
    },
  });
};

/**
 * Generate a JWT token for testing
 * @param {object} user - User object with id, email, and role
 * @returns {string} JWT token
 */
const generateAuthToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "test-secret-key",
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
  );
};

/**
 * Setup test environment
 * @returns {Function} Cleanup function
 */
const setupTestEnv = () => {
  // Ensure test environment is set
  process.env.NODE_ENV = "test";

  // Mock any necessary services or modules here

  // Return cleanup function
  return () => {
    // Cleanup code that runs after each test
  };
};

/**
 * Reset test environment
 */
const resetTestEnv = () => {
  // Clear all mocks and reset modules
  jest.clearAllMocks();
  jest.resetModules();
};

/**
 * Mock console methods for testing
 */
const mockConsole = () => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
};

/**
 * Restore original console methods
 */
const restoreConsole = () => {
  global.console = originalConsole;
};

// Export utilities
module.exports = {
  createTestUser,
  generateAuthToken,
  setupTestEnv,
  resetTestEnv,
  mockConsole,
  restoreConsole,
  originalConsole,
  // Add path and __dirname for backward compatibility
  path: require("path"),
  __dirname,
};
