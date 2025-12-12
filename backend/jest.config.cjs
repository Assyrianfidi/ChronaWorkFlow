// @ts-check

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest/presets/default-esm",
  // Test environment configuration
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/config/(.*)$': '<rootDir>/src/config/$1'
  },
  testRunner: "jest-circus/runner",
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)',
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
  moduleFileExtensions: ["js", "json", "jsx", "ts", "tsx", "node", "mjs"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  // Setup files
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  // Transform configuration
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'babel-jest',
  },
  // Global test configuration
  globals: {
    "ts-jest": {
      useESM: true,
      isolatedModules: true,
      tsconfig: "tsconfig.json",
    },
  },
  // Verbose output
  verbose: true,
  // Run in band (one at a time)
  runInBand: true,
};
