// Vitest setup file
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

// Mock browser APIs
declare global {
  interface Window {
    ResizeObserver: typeof ResizeObserver;
    IntersectionObserver: typeof IntersectionObserver;
    matchMedia: (query: string) => MediaQueryList;
  }
}

// Add missing globals for Node.js environment
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder as typeof global.TextDecoder;
}

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  
  constructor(public callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
  
  observe(_target: Element): void {}
  unobserve(_target: Element): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

// Mock ResizeObserver
class MockResizeObserver implements ResizeObserver {
  constructor(public callback: ResizeObserverCallback) {}
  observe(_target: Element): void {}
  unobserve(_target: Element): void {}
  disconnect(): void {}
}

// Setup mocks
beforeAll(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });

  // Mock IntersectionObserver
  window.IntersectionObserver = MockIntersectionObserver;
  
  // Mock ResizeObserver
  window.ResizeObserver = MockResizeObserver as any;
  
  // Mock window.scrollTo
  window.scrollTo = vi.fn();
});

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
  cleanup();
});

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/',
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: vi.fn().mockReturnValue({}),
    getInputProps: vi.fn().mockReturnValue({}),
    isDragActive: false,
    acceptedFiles: [],
  }),
}));

// Mock date-fns
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns');
  return {
    ...(actual as object),
    format: vi.fn().mockReturnValue('2023-01-01'),
  };
});

// Mock global fetch
const mockFetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({}),
  } as Response)
);

global.fetch = mockFetch;

// Mock window.URL.createObjectURL
window.URL.createObjectURL = vi.fn();

// Mock document.execCommand for clipboard operations
document.execCommand = vi.fn();

// Mock window.getComputedStyle
window.getComputedStyle = vi.fn().mockReturnValue({
  getPropertyValue: vi.fn(),
});

// Mock IntersectionObserver
beforeAll(() => {
  // Mock IntersectionObserver
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];
    
    constructor(
      public callback: IntersectionObserverCallback,
      _options?: IntersectionObserverInit
    ) {}
    
    observe(_target: Element): void {}
    unobserve(_target: Element): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  
  window.IntersectionObserver = MockIntersectionObserver;
  
  // Mock ResizeObserver
  class MockResizeObserver implements ResizeObserver {
    constructor(public callback: ResizeObserverCallback) {}
    observe(_target: Element): void {}
    unobserve(_target: Element): void {}
    disconnect(): void {}
  }
  
  window.ResizeObserver = MockResizeObserver;
});
