import { beforeAll, afterAll, beforeEach, vi } from 'vitest';
import * as crypto from 'node:crypto';

import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';

if (!process.env.NODE_ENV) {
  (process as any).env.NODE_ENV = 'test';
}

if (!process.env.JWT_SECRET && !process.env.SESSION_SECRET) {
  process.env.JWT_SECRET = 'test-secret';
}

if (!process.env.TZ) {
  process.env.TZ = 'UTC';
}

if (String(process.env.CI || '').toLowerCase() === 'true') {
  let uuidSeq = 0;
  vi.spyOn(crypto, 'randomUUID').mockImplementation(() => {
    uuidSeq += 1;
    const suffix = uuidSeq.toString(16).padStart(12, '0');
    return `00000000-0000-4000-8000-${suffix}`;
  });
}

// CRITICAL: Some modules (e.g., degradation-modes) initialize singletons at import time
// and require the global immutable audit logger to already be initialized.
// Hooks like beforeAll run too late, so we do this at module load.
try {
  const prismaStub = {
    $executeRawUnsafe: async () => 1,
    $queryRawUnsafe: async () => [],
    $queryRaw: async () => [{ ok: 1 }],
  } as any;

  (globalThis as any).__immutableAuditPrisma = prismaStub;

  getImmutableAuditLogger(prismaStub);
} catch {
  // ignore if already initialized
}

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
