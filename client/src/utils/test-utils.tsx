// Comprehensive test utilities and helpers
import {
  render,
  screen,
  fireEvent,
  waitFor,
  userEvent,
} from "@testing-library/react";
import { ReactElement } from "react";
import { vi } from "vitest";

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: "1",
  name: "Test User",
  email: "test@example.com",
  role: "user",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockInvoice = (overrides = {}) => ({
  id: "inv-1",
  number: "INV-001",
  customerId: "cust-1",
  amount: 1000,
  status: "pending",
  dueDate: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockCustomer = (overrides = {}) => ({
  id: "cust-1",
  name: "Test Customer",
  email: "customer@example.com",
  phone: "555-123-4567",
  address: {
    street: "123 Test St",
    city: "Test City",
    state: "TS",
    zip: "12345",
  },
  ...overrides,
});

// Custom render function with providers
export const renderWithProviders = (
  ui: ReactElement,
  { initialState = {}, ...renderOptions } = {},
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    // Add your providers here
    return <>{children}</>;
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Custom matchers
expect.extend({
  toBeInTheDocument: (received) => {
    const pass = received && document.body.contains(received);
    return {
      message: () =>
        `expected element ${pass ? "not " : ""}to be in the document`,
      pass,
    };
  },

  toHaveClass: (received, className) => {
    const pass = received && received.classList.contains(className);
    return {
      message: () =>
        `expected element ${pass ? "not " : ""}to have class ${className}`,
      pass,
    };
  },

  toBeDisabled: (received) => {
    const pass = received && received.disabled;
    return {
      message: () => `expected element ${pass ? "not " : ""}to be disabled`,
      pass,
    };
  },
});

// Mock API responses
export const createMockApiResponse = (data, status = 200) => ({
  data,
  status,
  statusText: "OK",
  headers: {},
  config: {},
});

export const createMockApiError = (message, status = 400) => ({
  response: {
    data: { error: message },
    status,
    statusText: "Bad Request",
  },
});

// Test helpers for forms
export const fillForm = async (formElement, formData) => {
  for (const [fieldName, value] of Object.entries(formData)) {
    const field = formElement.querySelector(`[name="${fieldName}"]`);
    if (field) {
      if (field.type === "checkbox") {
        fireEvent.click(field);
      } else if (field.type === "select-one") {
        fireEvent.change(field, { target: { value } });
      } else {
        fireEvent.change(field, { target: { value } });
      }
    }
  }
};

export const submitForm = async (formElement) => {
  const submitButton = formElement.querySelector('button[type="submit"]');
  if (submitButton) {
    fireEvent.click(submitButton);
  }
};

// Async test helpers
export const waitForElement = async (selector, timeout = 5000) => {
  return waitFor(
    () => {
      const element = document.querySelector(selector);
      if (!element) {
        throw new Error(`Element ${selector} not found`);
      }
      return element;
    },
    { timeout },
  );
};

export const waitForText = async (text, timeout = 5000) => {
  return waitFor(
    () => {
      const element = screen.getByText(text);
      return element;
    },
    { timeout },
  );
};

// Mock localStorage
export const createMockLocalStorage = () => {
  let store = {};

  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index) => Object.keys(store)[index] || null),
  };
};

// Mock fetch API
export const createMockFetch = (responses = []) => {
  let callCount = 0;

  return vi.fn().mockImplementation(() => {
    const response = responses[callCount] || responses[responses.length - 1];
    callCount++;
    return Promise.resolve({
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      json: () => Promise.resolve(response.data),
      text: () => Promise.resolve(JSON.stringify(response.data)),
    });
  });
};

// Performance test helpers
export const measureRenderTime = async (component, iterations = 10) => {
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    render(component);
    const endTime = performance.now();
    times.push(endTime - startTime);

    // Cleanup
    document.body.innerHTML = "";
  }

  return {
    average: times.reduce((a, b) => a + b, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    times,
  };
};

// Accessibility test helpers
export const checkAccessibility = async (container) => {
  const axe = await import("axe-core");
  const results = await axe.default.run(container);
  return results;
};

export const hasAccessibilityViolations = (results) => {
  return results.violations.length > 0;
};

// Mock IntersectionObserver
export const createMockIntersectionObserver = () => {
  const observers = [];

  return {
    observe: vi.fn((element) => {
      observers.push(element);
    }),
    unobserve: vi.fn((element) => {
      const index = observers.indexOf(element);
      if (index > -1) {
        observers.splice(index, 1);
      }
    }),
    disconnect: vi.fn(() => {
      observers.length = 0;
    }),
    observers,
  };
};

// Mock ResizeObserver
export const createMockResizeObserver = () => {
  const observers = [];

  return {
    observe: vi.fn((element, callback) => {
      observers.push({ element, callback });
    }),
    unobserve: vi.fn((element) => {
      const index = observers.findIndex((obs) => obs.element === element);
      if (index > -1) {
        observers.splice(index, 1);
      }
    }),
    disconnect: vi.fn(() => {
      observers.length = 0;
    }),
    observers,
  };
};

// Test data generators
export const generateTestData = {
  users: (count = 10) =>
    Array.from({ length: count }, (_, i) =>
      createMockUser({ id: `user-${i}` }),
    ),
  invoices: (count = 10) =>
    Array.from({ length: count }, (_, i) =>
      createMockInvoice({ id: `inv-${i}` }),
    ),
  customers: (count = 10) =>
    Array.from({ length: count }, (_, i) =>
      createMockCustomer({ id: `cust-${i}` }),
    ),
};

// Error boundary test helper
export const createErrorBoundary = (children) => {
  class TestErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      console.error("Test Error Boundary caught an error:", error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return (
          <div data-testid="error-boundary">
            Error: {this.state.error.message}
          </div>
        );
      }

      return this.props.children;
    }
  }

  return <TestErrorBoundary>{children}</TestErrorBoundary>;
};

// Router test helper
export const createMockRouter = (initialPath = "/") => {
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    goBack: vi.fn(),
    goForward: vi.fn(),
    pathname: initialPath,
    query: {},
    asPath: initialPath,
  };

  return mockRouter;
};

// Export all utilities
export default {
  // Mock data
  createMockUser,
  createMockInvoice,
  createMockCustomer,
  generateTestData,

  // Render helpers
  renderWithProviders,
  fillForm,
  submitForm,

  // Async helpers
  waitForElement,
  waitForText,

  // Mock APIs
  createMockLocalStorage,
  createMockFetch,
  createMockApiResponse,
  createMockApiError,

  // Performance helpers
  measureRenderTime,

  // Accessibility helpers
  checkAccessibility,
  hasAccessibilityViolations,

  // Mock observers
  createMockIntersectionObserver,
  createMockResizeObserver,

  // Error handling
  createErrorBoundary,

  // Router
  createMockRouter,
};
