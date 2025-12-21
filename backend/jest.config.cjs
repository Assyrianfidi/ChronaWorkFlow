// @ts-check

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  // Test environment configuration
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/config/(.*)$': '<rootDir>/src/config/$1',
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testRunner: "jest-circus/runner",
  testMatch: [
    '<rootDir>/src/**/?(*.)(spec|test).(ts|tsx|js)',
    "**/__tests__/**/*.test.ts",
    "**/__tests__/**/*.test.js"
  ],
  testEnvironment: 'node',
  // Clear mock calls and instances between tests
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  resetModules: true,
  // Force exit to prevent hanging
  forceExit: true,
  detectOpenHandles: true,
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false, // Disable for now to focus on fixing tests
  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",
  testTimeout: 30000, // 30 second timeout
  // Module configuration
  moduleFileExtensions: ["ts", "tsx", "js", "json", "jsx", "node", "mjs"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  // Setup files
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  // Transform configuration
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
    '^.+\\.jsx?$': 'babel-jest',
  },
  // Verbose output
  verbose: true,
};
