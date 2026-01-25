import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi } from "vitest";
import {
  NotificationSystem,
  useNotifications,
  useNotification,
  Toast,
  NotificationQueue,
} from "../NotificationSystem";

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllTimers();
});

// Mock the UX mode hook
vi.mock("../UserExperienceMode", () => ({
  useUserExperienceMode: vi.fn(() => ({
    currentMode: {
      animations: "normal",
      sounds: false,
    },
  })),
}));

// Mock the performance hook
vi.mock("../UI-Performance-Engine", () => ({
  usePerformance: vi.fn(() => ({
    isLowPerformanceMode: false,
  })),
}));

// Mock AudioContext
global.AudioContext = vi.fn(() => ({
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    frequency: { value: 0 },
    type: "sine",
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    start: vi.fn(),
    stop: vi.fn(),
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: { value: 0 },
  })),
  destination: {},
  currentTime: 0,
  close: vi.fn(),
})) as any;

// Mock createPortal
vi.mock("react-dom", async () => {
  const actual = await vi.importActual<any>("react-dom");
  return {
    ...actual,
    createPortal: vi.fn((element) => element),
  };
});

describe("NotificationSystem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllTimers();
  });

  it("renders children correctly", () => {
    render(
      <NotificationSystem>
        <div>Test Content</div>
      </NotificationSystem>,
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("renders notifications when added", async () => {
    const TestComponent = () => {
      const { addNotification } = useNotifications();

      React.useEffect(() => {
        addNotification({
          type: "success",
          title: "Success!",
          message: "Operation completed",
        });
      }, []);

      return <div>Test Content</div>;
    };

    render(
      <NotificationSystem>
        <TestComponent />
      </NotificationSystem>,
    );

    await waitFor(() => {
      expect(screen.getByText("Success!")).toBeInTheDocument();
      expect(screen.getByText("Operation completed")).toBeInTheDocument();
    });
  });

  it("removes notifications after duration", async () => {
    vi.useFakeTimers();

    const TestComponent = () => {
      const { addNotification } = useNotifications();

      React.useEffect(() => {
        addNotification({
          type: "info",
          title: "Info",
          duration: 1000,
        });
      }, []);

      return <div>Test Content</div>;
    };

    render(
      <NotificationSystem>
        <TestComponent />
      </NotificationSystem>,
    );

    await waitFor(() => {
      expect(screen.getByText("Info")).toBeInTheDocument();
    });

    await act(async () => {
      vi.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(screen.queryByText("Info")).not.toBeInTheDocument();
    });
  });

  it("keeps persistent notifications", async () => {
    vi.useFakeTimers();

    const TestComponent = () => {
      const { addNotification } = useNotifications();

      React.useEffect(() => {
        addNotification({
          type: "warning",
          title: "Persistent Warning",
          persistent: true,
        });
      }, []);

      return <div>Test Content</div>;
    };

    render(
      <NotificationSystem>
        <TestComponent />
      </NotificationSystem>,
    );

    await waitFor(() => {
      expect(screen.getByText("Persistent Warning")).toBeInTheDocument();
    });

    // Should not disappear automatically
    await act(async () => {
      vi.advanceTimersByTime(50);
    });
    expect(screen.getByText("Persistent Warning")).toBeInTheDocument();
  });

  it("does not auto-remove persistent notifications", async () => {
    vi.useFakeTimers();

    const TestComponent = () => {
      const { addNotification } = useNotifications();

      React.useEffect(() => {
        addNotification({
          type: "info",
          title: "Persistent Info",
          persistent: true,
        });
      }, []);

      return <div>Test Content</div>;
    };

    render(
      <NotificationSystem>
        <TestComponent />
      </NotificationSystem>,
    );

    await waitFor(() => {
      expect(screen.getByText("Persistent Info")).toBeInTheDocument();
    });

    await act(async () => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.getByText("Persistent Info")).toBeInTheDocument();
  });
});

describe("useNotifications hook", () => {
  it("throws error when used outside provider", () => {
    const TestComponent = () => {
      try {
        useNotifications();
        return <div>Success</div>;
      } catch (error) {
        return <div>Error: {(error as Error).message}</div>;
      }
    };

    render(<TestComponent />);
    expect(screen.getByText(/Error:/)).toBeInTheDocument();
    expect(
      screen.getByText(
        /useNotifications must be used within NotificationSystem/,
      ),
    ).toBeInTheDocument();
  });

  it("provides notification methods", () => {
    const TestComponent = () => {
      const { success, error, warning, info, loading } = useNotifications();

      return (
        <div>
          <button onClick={() => success("Success Title", "Success Message")}>
            Success
          </button>
          <button onClick={() => error("Error Title", "Error Message")}>
            Error
          </button>
          <button onClick={() => warning("Warning Title", "Warning Message")}>
            Warning
          </button>
          <button onClick={() => info("Info Title", "Info Message")}>
            Info
          </button>
          <button onClick={() => loading("Loading Title", "Loading Message")}>
            Loading
          </button>
        </div>
      );
    };

    render(
      <NotificationSystem>
        <TestComponent />
      </NotificationSystem>,
    );

    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Warning")).toBeInTheDocument();
    expect(screen.getByText("Info")).toBeInTheDocument();
    expect(screen.getByText("Loading")).toBeInTheDocument();
  });

  it("adds notifications with different types", async () => {
    const TestComponent = () => {
      const { addNotification } = useNotifications();

      return (
        <div>
          <button
            onClick={() =>
              addNotification({ type: "success", title: "Success" })
            }
          >
            Add Success
          </button>
          <button
            onClick={() => addNotification({ type: "error", title: "Error" })}
          >
            Add Error
          </button>
        </div>
      );
    };

    render(
      <NotificationSystem>
        <TestComponent />
      </NotificationSystem>,
    );

    fireEvent.click(screen.getByText("Add Success"));

    await waitFor(() => {
      expect(screen.getByText("Success")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Add Error"));

    await waitFor(() => {
      expect(screen.getByText("Error")).toBeInTheDocument();
    });
  });

  it("removes notifications manually", async () => {
    const TestComponent = () => {
      const { addNotification, removeNotification } = useNotifications();
      const [notificationId, setNotificationId] = React.useState<string>("");

      const addNotif = () => {
        const id = addNotification({
          type: "info",
          title: "Test Notification",
        });
        setNotificationId(id);
      };

      return (
        <div>
          <button onClick={addNotif}>Add Notification</button>
          <button onClick={() => removeNotification(notificationId)}>
            Remove Notification
          </button>
        </div>
      );
    };

    render(
      <NotificationSystem>
        <TestComponent />
      </NotificationSystem>,
    );

    fireEvent.click(screen.getByText("Add Notification"));

    await waitFor(() => {
      expect(screen.getByText("Test Notification")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Remove Notification"));

    await waitFor(() => {
      expect(screen.queryByText("Test Notification")).not.toBeInTheDocument();
    });
  });

  it("clears all notifications", async () => {
    const TestComponent = () => {
      const { addNotification, clearNotifications } = useNotifications();

      return (
        <div>
          <button
            onClick={() =>
              addNotification({ type: "info", title: "Notification 1" })
            }
          >
            Add 1
          </button>
          <button
            onClick={() =>
              addNotification({ type: "info", title: "Notification 2" })
            }
          >
            Add 2
          </button>
          <button onClick={clearNotifications}>Clear All</button>
        </div>
      );
    };

    render(
      <NotificationSystem>
        <TestComponent />
      </NotificationSystem>,
    );

    fireEvent.click(screen.getByText("Add 1"));
    fireEvent.click(screen.getByText("Add 2"));

    await waitFor(() => {
      expect(screen.getByText("Notification 1")).toBeInTheDocument();
      expect(screen.getByText("Notification 2")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Clear All"));

    await waitFor(() => {
      expect(screen.queryByText("Notification 1")).not.toBeInTheDocument();
      expect(screen.queryByText("Notification 2")).not.toBeInTheDocument();
    });
  });
});

describe("Toast component", () => {
  it("renders toast component", async () => {
    vi.useFakeTimers();

    render(
      <NotificationSystem>
        <Toast
          type="info"
          title="Toast Title"
          message="Toast Message"
          duration={1000}
        />
      </NotificationSystem>,
    );

    await waitFor(() => {
      expect(screen.getByText("Toast Title")).toBeInTheDocument();
      expect(screen.getByText("Toast Message")).toBeInTheDocument();
    });

    await act(async () => {
      vi.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(screen.queryByText("Toast Title")).not.toBeInTheDocument();
      expect(screen.queryByText("Toast Message")).not.toBeInTheDocument();
    });
  });
});

describe("NotificationQueue", () => {
  it("processes notifications in queue", async () => {
    vi.useFakeTimers();

    const mockNotifications = {
      addNotification: vi.fn(),
      removeNotification: vi.fn(),
      updateNotification: vi.fn(),
      clearNotifications: vi.fn(),
    };

    const queue = new NotificationQueue(mockNotifications as any);

    queue.add({ type: "info", title: "Notification 1" });
    queue.add({ type: "info", title: "Notification 2" });

    await act(async () => {
      vi.advanceTimersByTime(250);
    });

    await waitFor(() => {
      expect(mockNotifications.addNotification).toHaveBeenCalledTimes(2);
    });

    expect(queue.size()).toBe(0);
  });

  it("clears queue", () => {
    const mockNotifications = {
      addNotification: vi.fn(),
    };

    const queue = new NotificationQueue(mockNotifications as any);

    queue.add({ type: "info", title: "Notification 1" });
    queue.add({ type: "info", title: "Notification 2" });

    queue.clear();

    expect(queue.size()).toBe(0);
  });
});

describe("Notification rendering", () => {
  it("shows correct icons for different types", async () => {
    const TestComponent = () => {
      const { addNotification } = useNotifications();

      React.useEffect(() => {
        addNotification({ type: "success", title: "Success" });
        addNotification({ type: "error", title: "Error" });
        addNotification({ type: "warning", title: "Warning" });
        addNotification({ type: "info", title: "Info" });
        addNotification({ type: "loading", title: "Loading" });
      }, []);

      return <div>Test</div>;
    };

    render(
      <NotificationSystem>
        <TestComponent />
      </NotificationSystem>,
    );

    await waitFor(() => {
      expect(screen.getByText("✅")).toBeInTheDocument(); // Success
      expect(screen.getByText("❌")).toBeInTheDocument(); // Error
      expect(screen.getByText("⚠️")).toBeInTheDocument(); // Warning
      expect(screen.getByText("ℹ️")).toBeInTheDocument(); // Info
      expect(screen.getByText("⏳")).toBeInTheDocument(); // Loading
    });
  });

  it("renders notification actions", async () => {
    const mockAction = vi.fn();

    const TestComponent = () => {
      const { addNotification } = useNotifications();

      React.useEffect(() => {
        addNotification({
          type: "info",
          title: "Notification with Actions",
          actions: [
            { label: "Action 1", action: mockAction },
            { label: "Action 2", action: vi.fn() },
          ],
        });
      }, []);

      return <div>Test</div>;
    };

    render(
      <NotificationSystem>
        <TestComponent />
      </NotificationSystem>,
    );

    await waitFor(() => {
      expect(screen.getByText("Action 1")).toBeInTheDocument();
      expect(screen.getByText("Action 2")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Action 1"));

    expect(mockAction).toHaveBeenCalled();
  });

  it("shows progress bar for loading notifications", async () => {
    vi.useFakeTimers();

    const TestComponent = () => {
      const { notify, updateProgress } = useNotification();

      React.useEffect(() => {
        const id = notify({
          type: "loading",
          title: "Loading...",
          progress: 0,
        });

        // Simulate progress update
        setTimeout(() => {
          updateProgress(id, 50);
        }, 100);
      }, [notify, updateProgress]);

      return <div>Test</div>;
    };

    render(
      <NotificationSystem>
        <TestComponent />
      </NotificationSystem>,
    );

    await waitFor(() => {
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    await act(async () => {
      vi.advanceTimersByTime(150);
    });

    await waitFor(() => {
      const progressEl = document.querySelector(
        ".bg-blue-500",
      ) as HTMLElement | null;
      expect(progressEl).toBeInTheDocument();
      expect(progressEl?.style.width).toBe("50%");
    });
  });
});
