/** @type {import('jest').Config} */
const config = {
  // Test environment
  testEnvironment: "node",

  // Enable ES modules support
  transform: {},
  extensionsToTreatAsEsm: [".js", ".mjs"],

  // Root directory that Jest should scan for tests and modules within
  roots: ["<rootDir>/src"],

  // Test file patterns
  testMatch: ["**/__tests__/**/*.test.js"],

  // File extensions to include
  moduleFileExtensions: ["js", "mjs", "json", "node"],

  // Transform configuration
  transform: {
    "^.+\\.m?js$": ["babel-jest", { rootMode: "upward" }],
  },

  // Clear mock calls and instances between tests
  clearMocks: true,

  // Test timeout
  testTimeout: 30000,

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // Module name mapper
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^(\\.{1,2}/.*)\\.m?js$": "$1",
  },

  // Don't try to transform node_modules except for specific packages
  transformIgnorePatterns: ["node_modules/(?!(chalk|ora|inquirer)/)"],
};

export default config;
