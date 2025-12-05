// setupTests.js - Global test setup for Jest
'use strict';

// Store the original console methods
const originalConsole = { ...console };

// Mock console methods for cleaner test output
const mockConsole = () => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
  return global.console;
};

// Restore original console
const restoreConsole = () => {
  global.console = { ...originalConsole };
};

// Setup test environment
if (global.beforeEach) {
  beforeEach(() => {
    // Enable detailed logging during tests
    process.env.DEBUG = 'app:*';
    
    // Mock console methods but allow errors to be logged
    if (jest && typeof jest.spyOn === 'function') {
      jest.spyOn(console, 'warn').mockImplementation((...args) => {
        originalConsole.warn('Test warning:', ...args);
      });
      
      jest.spyOn(console, 'error').mockImplementation((...args) => {
        originalConsole.error('Test error:', ...args);
      });
      
      // Mock console.log to respect DEBUG flag
      jest.spyOn(console, 'log').mockImplementation((...args) => {
        if (process.env.DEBUG) {
          originalConsole.log('Test log:', ...args);
        }
      });
    }
  });

  afterEach(() => {
    // Restore all mocks after each test
    if (jest && typeof jest.restoreAllMocks === 'function') {
      jest.restoreAllMocks();
      jest.clearAllMocks();
    }
    
    // Restore original console methods
    restoreConsole();
  });
}

// Global test utilities
global.createTestUser = async (prisma, userData = {}) => {
  const { createTestUser } = require('./src/__tests__/test-utils');
  return createTestUser(prisma, userData);
};

global.generateAuthToken = (user) => {
  const { generateAuthToken } = require('./src/__tests__/test-utils');
  return generateAuthToken(user);
};

// Export utilities for use in test files
module.exports = {
  mockConsole,
  restoreConsole,
  originalConsole
};
