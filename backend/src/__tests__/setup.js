// Setup test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1d';

// Mock any global dependencies if needed
jest.setTimeout(30000); // Increase timeout for tests

// Add any global test setup here
beforeAll(async () => {
  // Any setup that needs to happen before tests run
});

afterAll(async () => {
  // Cleanup after all tests
});
