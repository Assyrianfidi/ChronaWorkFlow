/// <reference types="@testing-library/jest-dom" />
/// <reference types="vite/client" />

// Import Vitest types
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';
import type { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll, test, assert } from 'vitest';

// Extend Vitest's expect with Testing Library matchers
declare module 'vitest' {
  interface Assertion<T = any>
    extends jest.Matchers<void, T>,
      TestingLibraryMatchers<T, void> {}
}

// Export globals for TypeScript
declare global {
  const describe: typeof describe;
  const it: typeof it;
  const test: typeof test;
  const expect: typeof expect & TestingLibraryMatchers<any, any>;
  const assert: typeof assert;
  const vi: typeof vi;
  const beforeAll: typeof beforeAll;
  const afterAll: typeof afterAll;
  const beforeEach: typeof beforeEach;
  const afterEach: typeof afterEach;
}
