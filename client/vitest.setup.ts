import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor() {
    this.observe = () => {};
    this.unobserve = () => {};
    this.disconnect = () => {};
  }
}

globalThis.IntersectionObserver = MockIntersectionObserver;
if (typeof window !== "undefined") {
  window.IntersectionObserver = MockIntersectionObserver;
}

// Mock ResizeObserver
class MockResizeObserver {
  constructor() {
    this.observe = () => {};
    this.unobserve = () => {};
    this.disconnect = () => {};
  }
}

globalThis.ResizeObserver = MockResizeObserver;
if (typeof window !== "undefined") {
  window.ResizeObserver = MockResizeObserver;
}

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock localStorage
const localStorageMock = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
  clear: () => {},
};
global.localStorage = localStorageMock;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: (..._args: unknown[]) => {},
  error: (..._args: unknown[]) => {},
};

// Mock cn utility
global.cn = (...classes: unknown[]) => classes.filter(Boolean).join(" ");

afterEach(() => {
  cleanup();
});

if (typeof HTMLCanvasElement !== "undefined") {
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    value: () => ({
      clearRect: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      setTransform: () => {},
      drawImage: () => {},
    }),
  });
}
