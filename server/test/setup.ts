import { beforeAll, afterAll, beforeEach, vi } from 'vitest';

if (!(globalThis as any).jest) {
  (globalThis as any).jest = {
    fn: vi.fn,
    spyOn: vi.spyOn,
    mock: vi.mock,
    unmock: vi.unmock,
    isolateModules: (fn: () => void) => fn(),
    clearAllMocks: vi.clearAllMocks,
    resetAllMocks: vi.resetAllMocks,
    restoreAllMocks: vi.restoreAllMocks,
    setTimeout: () => {},
    useFakeTimers: vi.useFakeTimers,
    useRealTimers: vi.useRealTimers,
    runAllTimers: vi.runAllTimers,
    advanceTimersByTime: vi.advanceTimersByTime,
    setSystemTime: vi.setSystemTime,
  };
}

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
