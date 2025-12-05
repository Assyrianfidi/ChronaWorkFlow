import { beforeAll, afterAll, beforeEach, vi } from 'vitest';

// Setup test database or mocks
beforeAll(async () => {
  // Initialize test database or setup mocks
  console.log('Setting up test environment...');
});

afterAll(async () => {
  // Cleanup test database or mocks
  console.log('Cleaning up test environment...');
});

beforeEach(() => {
  // Reset any mocks or test state
  vi.clearAllMocks();
});
