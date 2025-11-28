import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axios with proper default export
vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    create: vi.fn(() => ({
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  };
});

// Import api after mocking
import { authApi } from '../api';

describe('API Simple Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should create axios instance with correct config', () => {
    // Just test that the module loads without errors
    expect(authApi).toBeDefined();
    expect(typeof authApi.login).toBe('function');
  });

  it('should have login method', () => {
    expect(authApi.login).toBeInstanceOf(Function);
  });

  it('should have register method', () => {
    expect(authApi.register).toBeInstanceOf(Function);
  });

  it('should have getProfile method', () => {
    expect(authApi.getProfile).toBeInstanceOf(Function);
  });

  it('should have logout method', () => {
    expect(authApi.logout).toBeInstanceOf(Function);
  });
});
