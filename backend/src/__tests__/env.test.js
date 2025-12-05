const { validateEnv } = require('../envValidator.js');
const { mockConsole, restoreConsole, setupTestEnv, resetTestEnv } = require('./test-utils');

describe('Environment Validation', () => {
  let originalEnv;

  beforeAll(() => {
    // Setup test environment
    setupTestEnv();
    
    // Mock console
    mockConsole();
  });
  
  afterAll(() => {
    // Restore console
    restoreConsole();
  });

  beforeEach(() => {
    // Save original process.env
    originalEnv = { ...process.env };
    
    // Reset test environment
    resetTestEnv();
  });

  afterEach(() => {
    // Restore original process.env
    process.env = originalEnv;
  });

  it('should validate required environment variables', () => {
    // Save original env
    const originalEnv = { ...process.env };
    
    try {
      // Test missing required variables
      delete process.env.DATABASE_URL;
      expect(() => validateEnv()).toThrow(/DATABASE_URL/);
    } finally {
      // Restore env
      process.env = originalEnv;
    }
  });

  it('should validate JWT secrets', () => {
    // Save original env
    const originalEnv = { ...process.env };
    
    try {
      // Test invalid JWT secret
      process.env.JWT_SECRET = 'short';
      expect(() => validateEnv()).toThrow(/JWT_SECRET/);
      
      // Test valid JWT secret
      process.env.JWT_SECRET = 'a'.repeat(32);
      expect(() => validateEnv()).not.toThrow();
    } finally {
      // Restore env
      process.env = originalEnv;
    }
  });

  it('should validate NODE_ENV values', () => {
    // Save original env
    const originalEnv = { ...process.env };
    
    try {
      // Test invalid NODE_ENV
      process.env.NODE_ENV = 'invalid';
      expect(() => validateEnv()).toThrow(/NODE_ENV/);
      
      // Test valid NODE_ENV values
      for (const env of ['development', 'production', 'test']) {
        process.env.NODE_ENV = env;
        expect(() => validateEnv()).not.toThrow();
      }
    } finally {
      // Restore env
      process.env = originalEnv;
    }
  });

  it('should validate database URL format', () => {
    // Save original env
    const originalEnv = { ...process.env };
    
    try {
      // Test invalid database URL
      process.env.DATABASE_URL = 'invalid-url';
      expect(() => validateEnv()).toThrow(/DATABASE_URL/);
      
      // Test valid database URL
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      expect(() => validateEnv()).not.toThrow();
    } finally {
      // Restore env
      process.env = originalEnv;
    }
  });
  
  it('should skip validation in test environment when SKIP_ENV_VALIDATION is true', () => {
    // Save original env
    const originalEnv = { ...process.env };
    
    try {
      // Set test environment and skip validation
      process.env.NODE_ENV = 'test';
      process.env.SKIP_ENV_VALIDATION = 'true';
      
      // Remove required variable
      delete process.env.DATABASE_URL;
      
      // Should not throw because validation is skipped
      expect(() => validateEnv()).not.toThrow();
    } finally {
      // Restore env
      process.env = originalEnv;
    }
  });
});
