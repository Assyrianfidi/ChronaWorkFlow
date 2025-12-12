// Load environment variables before tests run
const path = require("path");
const dotenv = require("dotenv");

// Load test environment variables from the project root
dotenv.config({ path: path.resolve(__dirname, ".env.test") });

// Set default test environment variables
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-key";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
process.env.PORT = "0"; // Use random port for tests
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || "file:./test.db";

// Mock Prisma Client for tests
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      create: jest
        .fn()
        .mockResolvedValue({ id: 1, email: "test@example.com", role: "USER" }),
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 1, email: "test@example.com", role: "USER" }),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest
        .fn()
        .mockResolvedValue({ id: 1, email: "test@example.com", role: "USER" }),
      delete: jest.fn().mockResolvedValue({ id: 1 }),
    },
    business: {
      create: jest.fn().mockResolvedValue({ id: 1, name: "Test Business" }),
      findUnique: jest.fn().mockResolvedValue({ id: 1, name: "Test Business" }),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({ id: 1, name: "Test Business" }),
      delete: jest.fn().mockResolvedValue({ id: 1 }),
    },
    $disconnect: jest.fn(),
  })),
}));

// Simple test environment setup
console.log(
  "Test environment initialized with NODE_ENV:",
  process.env.NODE_ENV,
);

// Export a simple test environment setup function
module.exports = {
  setupTestEnvironment: () => {
    console.log("Test environment setup complete");

    // Verify environment variables
    if (!process.env.JWT_SECRET) {
      console.warn("WARNING: JWT_SECRET is not defined in test environment");
    }

    // Return cleanup function
    return () => {
      console.log("Test environment cleanup complete");
    };
  },
};
