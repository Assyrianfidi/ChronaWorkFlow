declare global {
  interface Window {
    [key: string]: any;
  }
}

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import {
  ErrorRecoveryUI,
  useErrorRecovery,
  ErrorBoundary,
  withErrorBoundary,
  useAsyncError,
} from "@/components/ErrorRecoveryUI";

// Mock modules
vi.mock("../hooks/useWindowSize", () => ({
  useWindowSize: vi.fn(() => ({ width: 1024, height: 768 })),
}));

vi.mock("../store/auth-store", () => ({
  useAuthStore: vi.fn(() => ({
    user: { role: "user" },
  })),
}));

vi.mock("../adaptive/UserExperienceMode.tsx", () => ({
  useUserExperienceMode: vi.fn(() => ({
    currentMode: {
      id: "standard",
      name: "Standard",
      animations: "normal",
      sounds: false,
      shortcuts: true,
    },
  })),
}));

vi.mock("../adaptive/UI-Performance-Engine.tsx", () => ({
  usePerformance: vi.fn(() => ({
    isLowPerformanceMode: false,
  })),
}));

vi.mock("../adaptive/NotificationSystem", () => ({
  useNotifications: vi.fn(() => ({
    success: vi.fn(),
  })),
}));

describe("ErrorRecoveryUI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders children correctly", () => {
    render(
      <ErrorRecoveryUI>
        <div>Test Content</div>
      </ErrorRecoveryUI>,
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("provides error recovery context", () => {
    let contextValue: any = null;

    function TestComponent() {
      contextValue = useErrorRecovery();
      return <div>Test</div>;
    }

    render(
      <ErrorRecoveryUI>
        <TestComponent />
      </ErrorRecoveryUI>,
    );

    expect(contextValue).toBeDefined();
    expect(contextValue.errors).toEqual([]);
    expect(contextValue.patterns).toHaveLength(4); // Built-in patterns
    expect(contextValue.sessions).toEqual([]);
  });

  it("adds errors to context", async () => {
    function TestComponent() {
      const { addError, errors } = useErrorRecovery();
      const [added, setAdded] = React.useState(false);

      const handleAddError = async () => {
        addError({
          type: "javascript",
          severity: "medium",
          message: "Test error",
          timestamp: Date.now(),
          url: "import.meta.env.VITE_APP_URL",
          context: { component: "TestComponent" },
          recoverable: true,
          userImpact: {
            functionality: "partial",
            data: "none",
            experience: "degraded",
            actions: ["retry"],
          },
        });
        setAdded(true);
      };

      return (
        <div>
          <div>Errors: {errors.length}</div>
          <div>Added: {added ? "yes" : "no"}</div>
          <button onClick={handleAddError}>Add Error</button>
        </div>
      );
    }

    render(
      <ErrorRecoveryUI>
        <TestComponent />
      </ErrorRecoveryUI>,
    );

    expect(screen.getByText("Errors: 0")).toBeInTheDocument();
    expect(screen.getByText("Added: no")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Add Error"));

    await waitFor(() => {
      expect(screen.getByText("Errors: 1")).toBeInTheDocument();
      expect(screen.getByText("Added: yes")).toBeInTheDocument();
    });
  });

  it("dismisses errors", async () => {
    function TestComponent() {
      const { addError, dismissError, errors } = useErrorRecovery();
      const [dismissed, setDismissed] = React.useState(false);

      React.useEffect(() => {
        // Add an error
        addError({
          type: "network",
          severity: "high",
          message: "Network error",
          timestamp: Date.now(),
          url: "import.meta.env.VITE_APP_URL",
          context: {},
          recoverable: true,
          userImpact: {
            functionality: "partial",
            data: "none",
            experience: "degraded",
            actions: ["retry"],
          },
        });
      }, []);

      const handleDismiss = () => {
        if (errors.length > 0) {
          dismissError(errors[0].id);
          setDismissed(true);
        }
      };

      return (
        <div>
          <div>Errors: {errors.length}</div>
          <div>Dismissed: {dismissed ? "yes" : "no"}</div>
          <button onClick={handleDismiss}>Dismiss Error</button>
        </div>
      );
    }

    render(
      <ErrorRecoveryUI>
        <TestComponent />
      </ErrorRecoveryUI>,
    );

    expect(screen.getByText("Errors: 1")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Dismiss Error"));

    await waitFor(() => {
      expect(screen.getByText("Errors: 0")).toBeInTheDocument();
      expect(screen.getByText("Dismissed: yes")).toBeInTheDocument();
    });
  });

  it("clears all errors", async () => {
    function TestComponent() {
      const { addError, clearErrors, errors } = useErrorRecovery();
      const [cleared, setCleared] = React.useState(false);

      React.useEffect(() => {
        // Add multiple errors
        addError({
          type: "javascript",
          severity: "medium",
          message: "Error 1",
          timestamp: Date.now(),
          url: "import.meta.env.VITE_APP_URL",
          context: {},
          recoverable: true,
          userImpact: {
            functionality: "partial",
            data: "none",
            experience: "degraded",
            actions: ["retry"],
          },
        });
        addError({
          type: "network",
          severity: "high",
          message: "Error 2",
          timestamp: Date.now(),
          url: "import.meta.env.VITE_APP_URL",
          context: {},
          recoverable: true,
          userImpact: {
            functionality: "partial",
            data: "none",
            experience: "degraded",
            actions: ["retry"],
          },
        });
      }, []);

      const handleClear = () => {
        clearErrors();
        setCleared(true);
      };

      return (
        <div>
          <div>Errors: {errors.length}</div>
          <div>Cleared: {cleared ? "yes" : "no"}</div>
          <button onClick={handleClear}>Clear All</button>
        </div>
      );
    }

    render(
      <ErrorRecoveryUI>
        <TestComponent />
      </ErrorRecoveryUI>,
    );

    expect(screen.getByText("Errors: 2")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Clear All"));

    await waitFor(() => {
      expect(screen.getByText("Errors: 0")).toBeInTheDocument();
      expect(screen.getByText("Cleared: yes")).toBeInTheDocument();
    });
  });

  it("provides error statistics", async () => {
    function TestComponent() {
      const { addError, getErrorStats } = useErrorRecovery();
      const [stats, setStats] = React.useState<any>(null);

      React.useEffect(() => {
        // Add different types of errors
        addError({
          type: "javascript",
          severity: "medium",
          message: "JS Error",
          timestamp: Date.now(),
          url: "import.meta.env.VITE_APP_URL",
          context: {},
          recoverable: true,
          userImpact: {
            functionality: "partial",
            data: "none",
            experience: "degraded",
            actions: ["retry"],
          },
        });
        addError({
          type: "network",
          severity: "high",
          message: "Network Error",
          timestamp: Date.now(),
          url: "import.meta.env.VITE_APP_URL",
          context: {},
          recoverable: true,
          userImpact: {
            functionality: "partial",
            data: "none",
            experience: "degraded",
            actions: ["retry"],
          },
        });
        addError({
          type: "javascript",
          severity: "low",
          message: "Low JS Error",
          timestamp: Date.now(),
          url: "import.meta.env.VITE_APP_URL",
          context: {},
          recoverable: true,
          userImpact: {
            functionality: "partial",
            data: "none",
            experience: "degraded",
            actions: ["retry"],
          },
        });
      }, []);

      const handleGetStats = () => {
        const errorStats = getErrorStats();
        setStats(errorStats);
      };

      return (
        <div>
          <div>Total: {stats?.total || 0}</div>
          <div>JS Errors: {stats?.byType?.javascript || 0}</div>
          <div>Network Errors: {stats?.byType?.network || 0}</div>
          <div>High Severity: {stats?.bySeverity?.high || 0}</div>
          <button onClick={handleGetStats}>Get Stats</button>
        </div>
      );
    }

    render(
      <ErrorRecoveryUI>
        <TestComponent />
      </ErrorRecoveryUI>,
    );

    fireEvent.click(screen.getByText("Get Stats"));

    await waitFor(() => {
      expect(screen.getByText("Total: 3")).toBeInTheDocument();
      expect(screen.getByText("JS Errors: 2")).toBeInTheDocument();
      expect(screen.getByText("Network Errors: 1")).toBeInTheDocument();
      expect(screen.getByText("High Severity: 1")).toBeInTheDocument();
    });
  });

  it("manages error patterns", async () => {
    function TestComponent() {
      const { addPattern, updatePattern, deletePattern, patterns } =
        useErrorRecovery();
      const [patternAdded, setPatternAdded] = React.useState(false);
      const [patternUpdated, setPatternUpdated] = React.useState(false);
      const [patternDeleted, setPatternDeleted] = React.useState(false);

      const handleAddPattern = () => {
        addPattern({
          id: "test-pattern",
          name: "Test Pattern",
          pattern: /test error/i,
          type: "javascript",
          severity: "medium",
          recovery: [
            {
              id: "test-recovery",
              name: "Test Recovery",
              description: "Test recovery strategy",
              type: "retry",
              priority: 1,
              automatic: false,
              handler: async () => true,
            },
          ],
          frequency: 0,
          lastSeen: 0,
          autoRecovery: false,
        });
        setPatternAdded(true);
      };

      const handleUpdatePattern = () => {
        updatePattern("test-pattern", {
          name: "Updated Test Pattern",
          severity: "high",
        });
        setPatternUpdated(true);
      };

      const handleDeletePattern = () => {
        deletePattern("test-pattern");
        setPatternDeleted(true);
      };

      return (
        <div>
          <div>Patterns: {patterns.length}</div>
          <div>Added: {patternAdded ? "yes" : "no"}</div>
          <div>Updated: {patternUpdated ? "yes" : "no"}</div>
          <div>Deleted: {patternDeleted ? "yes" : "no"}</div>
          <button onClick={handleAddPattern}>Add Pattern</button>
          <button onClick={handleUpdatePattern}>Update Pattern</button>
          <button onClick={handleDeletePattern}>Delete Pattern</button>
        </div>
      );
    }

    render(
      <ErrorRecoveryUI>
        <TestComponent />
      </ErrorRecoveryUI>,
    );

    expect(screen.getByText("Patterns: 4")).toBeInTheDocument(); // Built-in patterns

    fireEvent.click(screen.getByText("Add Pattern"));

    await waitFor(() => {
      expect(screen.getByText("Patterns: 5")).toBeInTheDocument();
      expect(screen.getByText("Added: yes")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Update Pattern"));

    await waitFor(() => {
      expect(screen.getByText("Updated: yes")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Delete Pattern"));

    await waitFor(() => {
      expect(screen.getByText("Patterns: 4")).toBeInTheDocument();
      expect(screen.getByText("Deleted: yes")).toBeInTheDocument();
    });
  });

  it("attempts auto-recovery for recoverable errors", async () => {
    function TestComponent() {
      const { addError, autoRecover, sessions } = useErrorRecovery();
      const [recovered, setRecovered] = React.useState(false);

      const handleAddError = async () => {
        const error = {
          type: "network" as const,
          severity: "medium" as const,
          message: "Network timeout error",
          timestamp: Date.now(),
          url: "import.meta.env.VITE_APP_URL",
          context: {},
          recoverable: true,
          userImpact: {
            functionality: "partial",
            data: "none",
            experience: "degraded",
            actions: ["retry"],
          },
        };

        await addError(error);

        // Attempt auto-recovery
        const success = await autoRecover(error);
        setRecovered(success);
      };

      return (
        <div>
          <div>Sessions: {sessions.length}</div>
          <div>Recovered: {recovered ? "yes" : "no"}</div>
          <button onClick={handleAddError}>Add & Recover</button>
        </div>
      );
    }

    render(
      <ErrorRecoveryUI>
        <TestComponent />
      </ErrorRecoveryUI>,
    );

    fireEvent.click(screen.getByText("Add & Recover"));

    await waitFor(() => {
      expect(screen.getByText("Sessions: 1")).toBeInTheDocument();
      expect(screen.getByText("Recovered: yes")).toBeInTheDocument();
    });
  });

  it("shows error panel when errors exist", () => {
    function TestComponent() {
      const { addError } = useErrorRecovery();

      React.useEffect(() => {
        addError({
          type: "critical",
          severity: "critical",
          message: "Critical system error",
          timestamp: Date.now(),
          url: "import.meta.env.VITE_APP_URL",
          context: {},
          recoverable: false,
          userImpact: {
            functionality: "blocked",
            data: "corrupted",
            experience: "broken",
            actions: ["restart"],
          },
        });
      }, []);

      return <div>Test Component</div>;
    }

    render(
      <ErrorRecoveryUI>
        <TestComponent />
      </ErrorRecoveryUI>,
    );

    // Error panel should be visible
    expect(screen.getByText("Errors (1)")).toBeInTheDocument();
    expect(screen.getByText("1 Critical")).toBeInTheDocument();
  });

  it("filters and displays errors by severity", () => {
    function TestComponent() {
      const { addError } = useErrorRecovery();

      React.useEffect(() => {
        // Add errors with different severities
        addError({
          type: "javascript",
          severity: "critical",
          message: "Critical error",
          timestamp: Date.now(),
          url: "import.meta.env.VITE_APP_URL",
          context: {},
          recoverable: true,
          userImpact: {
            functionality: "blocked",
            data: "none",
            experience: "broken",
            actions: ["retry"],
          },
        });
        addError({
          type: "network",
          severity: "medium",
          message: "Medium error",
          timestamp: Date.now(),
          url: "import.meta.env.VITE_APP_URL",
          context: {},
          recoverable: true,
          userImpact: {
            functionality: "partial",
            data: "none",
            experience: "degraded",
            actions: ["retry"],
          },
        });
      }, []);

      return <div>Test Component</div>;
    }

    render(
      <ErrorRecoveryUI>
        <TestComponent />
      </ErrorRecoveryUI>,
    );

    expect(screen.getByText("Errors (2)")).toBeInTheDocument();
    expect(screen.getByText("1 Critical")).toBeInTheDocument();
  });
});

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children when no error occurs", () => {
    function TestComponent() {
      return <div>No error here</div>;
    }

    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText("No error here")).toBeInTheDocument();
  });

  it("catches and displays errors", () => {
    function ThrowingComponent() {
      throw new Error("Test error");
    }

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("provides retry functionality", () => {
    let throwCount = 0;

    function SometimesThrowingComponent() {
      throwCount++;
      if (throwCount <= 2) {
        throw new Error("Retry test error");
      }
      return <div>Success after retry</div>;
    }

    render(
      <ErrorBoundary>
        <SometimesThrowingComponent />
      </ErrorBoundary>,
    );

    // Should show error
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Click retry
    fireEvent.click(screen.getByText("Try Again"));

    // Should still show error (second throw)
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Click retry again
    fireEvent.click(screen.getByText("Try Again"));

    // Should show success
    expect(screen.getByText("Success after retry")).toBeInTheDocument();
  });

  it("calls onError callback", () => {
    const onError = vi.fn();

    function ThrowingComponent() {
      throw new Error("Callback test error");
    }

    render(
      <ErrorBoundary onError={onError}>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe("Callback test error");
  });

  it("uses custom fallback component", () => {
    function CustomFallback({
      error,
      retry,
    }: {
      error: Error;
      retry: () => void;
    }) {
      return (
        <div>
          <h1>Custom Error</h1>
          <p>{error.message}</p>
          <button onClick={retry}>Custom Retry</button>
        </div>
      );
    }

    function ThrowingComponent() {
      throw new Error("Custom fallback test");
    }

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Custom Error")).toBeInTheDocument();
    expect(screen.getByText("Custom fallback test")).toBeInTheDocument();
    expect(screen.getByText("Custom Retry")).toBeInTheDocument();
  });

  it("tracks retry count", () => {
    let throwCount = 0;

    function RetryTestComponent() {
      throwCount++;
      if (throwCount <= 3) {
        throw new Error(`Retry attempt ${throwCount}`);
      }
      return <div>Success</div>;
    }

    function TestWrapper() {
      const [retryCount, setRetryCount] = React.useState(0);

      return (
        <div>
          <div>Retry count: {retryCount}</div>
          <ErrorBoundary>
            <RetryTestComponent />
          </ErrorBoundary>
        </div>
      );
    }

    render(<TestWrapper />);

    // Click retry multiple times
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByText("Try Again"));
    }

    // Should eventually succeed
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });
});

describe("withErrorBoundary HOC", () => {
  it("wraps component with error boundary", () => {
    function TestComponent() {
      return <div>Wrapped Component</div>;
    }

    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent />);

    expect(screen.getByText("Wrapped Component")).toBeInTheDocument();
  });

  it("catches errors in wrapped component", () => {
    function ThrowingComponent() {
      throw new Error("HOC error test");
    }

    const WrappedComponent = withErrorBoundary(ThrowingComponent);

    render(<WrappedComponent />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("passes props to wrapped component", () => {
    function TestComponent({ message }: { message: string }) {
      return <div>{message}</div>;
    }

    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent message="Hello from HOC" />);

    expect(screen.getByText("Hello from HOC")).toBeInTheDocument();
  });

  it("uses custom fallback in HOC", () => {
    function CustomFallback({
      error,
      retry,
    }: {
      error: Error;
      retry: () => void;
    }) {
      return <div>HOC Custom Fallback: {error.message}</div>;
    }

    function ThrowingComponent() {
      throw new Error("HOC custom fallback test");
    }

    const WrappedComponent = withErrorBoundary(ThrowingComponent, {
      fallback: CustomFallback,
    });

    render(<WrappedComponent />);

    expect(
      screen.getByText("HOC Custom Fallback: HOC custom fallback test"),
    ).toBeInTheDocument();
  });
});

describe("useAsyncError Hook", () => {
  it("provides async error handler", async () => {
    function TestComponent() {
      const asyncError = useAsyncError();
      const [errorHandled, setErrorHandled] = React.useState(false);

      const handleAsyncError = () => {
        const error = new Error("Async error test");
        asyncError(error, { source: "async-operation" });
        setErrorHandled(true);
      };

      return (
        <div>
          <div>Error handled: {errorHandled ? "yes" : "no"}</div>
          <button onClick={handleAsyncError}>Trigger Async Error</button>
        </div>
      );
    }

    render(
      <ErrorRecoveryUI>
        <TestComponent />
      </ErrorRecoveryUI>,
    );

    expect(screen.getByText("Error handled: no")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Trigger Async Error"));

    await waitFor(() => {
      expect(screen.getByText("Error handled: yes")).toBeInTheDocument();
    });
  });

  it("adds context to async errors", async () => {
    function TestComponent() {
      const asyncError = useAsyncError();
      const { errors } = useErrorRecovery();

      const handleAsyncError = () => {
        const error = new Error("Context test error");
        asyncError(error, {
          component: "TestComponent",
          operation: "data-fetch",
          retryCount: 3,
        });
      };

      return (
        <div>
          <div>Errors: {errors.length}</div>
          <button onClick={handleAsyncError}>Add Context Error</button>
        </div>
      );
    }

    render(
      <ErrorRecoveryUI>
        <TestComponent />
      </ErrorRecoveryUI>,
    );

    fireEvent.click(screen.getByText("Add Context Error"));

    await waitFor(() => {
      expect(screen.getByText("Errors: 1")).toBeInTheDocument();
    });
  });
});

describe("Global Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles global JavaScript errors", async () => {
    function TestComponent() {
      const { errors } = useErrorRecovery();

      const triggerGlobalError = () => {
        // Simulate global error
        const errorEvent = new ErrorEvent("error", {
          message: "Global error test",
          filename: "test.js",
          lineno: 42,
          colno: 10,
          error: new Error("Global error test"),
        });
        window.dispatchEvent(errorEvent);
      };

      return (
        <div>
          <div>Errors: {errors.length}</div>
          <button onClick={triggerGlobalError}>Trigger Global Error</button>
        </div>
      );
    }

    render(
      <ErrorRecoveryUI>
        <TestComponent />
      </ErrorRecoveryUI>,
    );

    fireEvent.click(screen.getByText("Trigger Global Error"));

    await waitFor(() => {
      expect(screen.getByText("Errors: 1")).toBeInTheDocument();
    });
  });

  it("handles unhandled promise rejections", async () => {
    function TestComponent() {
      const { errors } = useErrorRecovery();

      const triggerUnhandledRejection = () => {
        // Simulate unhandled promise rejection
        const rejectionEvent = new PromiseRejectionEvent("unhandledrejection", {
          reason: new Error("Unhandled rejection test"),
          promise: Promise.reject(new Error("Unhandled rejection test")),
        });
        window.dispatchEvent(rejectionEvent);
      };

      return (
        <div>
          <div>Errors: {errors.length}</div>
          <button onClick={triggerUnhandledRejection}>
            Trigger Unhandled Rejection
          </button>
        </div>
      );
    }

    render(
      <ErrorRecoveryUI>
        <TestComponent />
      </ErrorRecoveryUI>,
    );

    fireEvent.click(screen.getByText("Trigger Unhandled Rejection"));

    await waitFor(() => {
      expect(screen.getByText("Errors: 1")).toBeInTheDocument();
    });
  });
});

describe("Error Pattern Matching", () => {
  it("matches errors against patterns", async () => {
    function TestComponent() {
      const { addError, patterns } = useErrorRecovery();

      const addNetworkError = () => {
        addError({
          type: "network",
          severity: "medium",
          message: "Network timeout occurred",
          timestamp: Date.now(),
          url: "import.meta.env.VITE_APP_URL",
          context: {},
          recoverable: true,
          userImpact: {
            functionality: "partial",
            data: "none",
            experience: "degraded",
            actions: ["retry"],
          },
        });
      };

      const addJavaScriptError = () => {
        addError({
          type: "javascript",
          severity: "high",
          message: "TypeError: Cannot read property of undefined",
          timestamp: Date.now(),
          url: "import.meta.env.VITE_APP_URL",
          context: {},
          recoverable: true,
          userImpact: {
            functionality: "partial",
            data: "none",
            experience: "degraded",
            actions: ["retry"],
          },
        });
      };

      const timeoutPattern = patterns.find((p) => p.id === "network-timeout");
      const jsPattern = patterns.find((p) => p.id === "javascript-runtime");

      return (
        <div>
          <div>Timeout Pattern Frequency: {timeoutPattern?.frequency || 0}</div>
          <div>JS Pattern Frequency: {jsPattern?.frequency || 0}</div>
          <button onClick={addNetworkError}>Add Network Error</button>
          <button onClick={addJavaScriptError}>Add JS Error</button>
        </div>
      );
    }

    render(
      <ErrorRecoveryUI>
        <TestComponent />
      </ErrorRecoveryUI>,
    );

    expect(
      screen.getByText("Timeout Pattern Frequency: 0"),
    ).toBeInTheDocument();
    expect(screen.getByText("JS Pattern Frequency: 0")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Add Network Error"));

    await waitFor(() => {
      expect(
        screen.getByText("Timeout Pattern Frequency: 1"),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Add JS Error"));

    await waitFor(() => {
      expect(screen.getByText("JS Pattern Frequency: 1")).toBeInTheDocument();
    });
  });

  it("updates pattern severity based on errors", async () => {
    function TestComponent() {
      const { addError, updatePattern, patterns } = useErrorRecovery();

      React.useEffect(() => {
        // Add a critical error that should update pattern severity
        addError({
          type: "javascript",
          severity: "critical",
          message: "Critical TypeError in system",
          timestamp: Date.now(),
          url: "import.meta.env.VITE_APP_URL",
          context: {},
          recoverable: true,
          userImpact: {
            functionality: "blocked",
            data: "corrupted",
            experience: "broken",
            actions: ["restart"],
          },
        });
      }, []);

      const jsPattern = patterns.find((p) => p.id === "javascript-runtime");

      return (
        <div>
          <div>JS Pattern Severity: {jsPattern?.severity || "unknown"}</div>
        </div>
      );
    }

    render(
      <ErrorRecoveryUI>
        <TestComponent />
      </ErrorRecoveryUI>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("JS Pattern Severity: critical"),
      ).toBeInTheDocument();
    });
  });
});

describe("Recovery Strategies", () => {
  it("executes recovery strategies", async () => {
    function TestComponent() {
      const { addError, recoverError, sessions } = useErrorRecovery();
      const [recovered, setRecovered] = React.useState(false);
      const [errorId, setErrorId] = React.useState<string | null>(null);

      const addNetworkError = () => {
        const error = {
          type: "network" as const,
          severity: "medium" as const,
          message: "Network timeout",
          timestamp: Date.now(),
          url: "import.meta.env.VITE_APP_URL",
          context: {},
          recoverable: true,
          userImpact: {
            functionality: "partial",
            data: "none",
            experience: "degraded",
            actions: ["retry"],
          },
        };

        addError(error);
        setErrorId("mock-error-id"); // In real implementation, this would be the actual error ID
      };

      const handleRecover = async () => {
        if (errorId) {
          const success = await recoverError(errorId, "retry-request");
          setRecovered(success);
        }
      };

      return (
        <div>
          <div>Sessions: {sessions.length}</div>
          <div>Recovered: {recovered ? "yes" : "no"}</div>
          <button onClick={addNetworkError}>Add Error</button>
          <button onClick={handleRecover} disabled={!errorId}>
            Recover Error
          </button>
        </div>
      );
    }

    render(
      <ErrorRecoveryUI>
        <TestComponent />
      </ErrorRecoveryUI>,
    );

    fireEvent.click(screen.getByText("Add Error"));

    await waitFor(() => {
      expect(screen.getByText("Recover Error")).not.toBeDisabled();
    });

    fireEvent.click(screen.getByText("Recover Error"));

    await waitFor(() => {
      expect(screen.getByText("Sessions: 1")).toBeInTheDocument();
      expect(screen.getByText("Recovered: yes")).toBeInTheDocument();
    });
  });

  it("filters recovery strategies by conditions", async () => {
    function TestComponent() {
      const { addError, patterns } = useErrorRecovery();
      const [strategies, setStrategies] = React.useState<any[]>([]);

      React.useEffect(() => {
        // Add an error that should match specific patterns
        addError({
          type: "permission",
          severity: "medium",
          message: "Permission denied for user",
          timestamp: Date.now(),
          url: "import.meta.env.VITE_APP_URL",
          context: { userId: "test-user" },
          recoverable: true,
          userImpact: {
            functionality: "partial",
            data: "none",
            experience: "degraded",
            actions: ["re-authenticate"],
          },
        });

        // Get recovery strategies for permission errors
        const permissionPattern = patterns.find(
          (p) => p.id === "permission-denied",
        );
        setStrategies(permissionPattern?.recovery || []);
      }, []);

      return (
        <div>
          <div>Recovery Strategies: {strategies.length}</div>
          <div>Strategy 1: {strategies[0]?.name || "none"}</div>
        </div>
      );
    }

    render(
      <ErrorRecoveryUI>
        <TestComponent />
      </ErrorRecoveryUI>,
    );

    await waitFor(() => {
      expect(screen.getByText("Recovery Strategies: 1")).toBeInTheDocument();
      expect(
        screen.getByText("Strategy 1: Re-authenticate"),
      ).toBeInTheDocument();
    });
  });
});
