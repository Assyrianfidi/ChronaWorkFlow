module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  moduleFileExtensions: ['js', 'ts', 'json'],
  transform: {
    '^.+\.tsx?$': 'ts-jest',
  },
  setupFilesAfterEnv: ['./src/__tests__/setupTests.ts'],
  globalSetup: './src/__tests__/globalSetup.ts',
  globalTeardown: './src/__tests__/globalTeardown.ts',
  testTimeout: 15000,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
