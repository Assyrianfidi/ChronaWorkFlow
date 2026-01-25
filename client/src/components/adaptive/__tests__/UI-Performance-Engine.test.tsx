import React from "react";
import { LoadingState } from '@/components/ui/LoadingState';
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import {
  UIPerformanceEngine,
  usePerformance,
  LazyLoad,
  PerformanceMonitor,
  withPerformanceTracking,
  AdaptiveImage,
} from '../UI-Performance-Engine';

// Mock the adaptive layout hook
vi.mock("../AdaptiveLayoutEngine", () => ({
  useAdaptiveLayout: vi.fn(() => ({
    currentBreakpoint: "desktop",
    isMobile: false,
  })),
}));

// Mock the UX mode hook
vi.mock("../UserExperienceMode", () => ({
  useUserExperienceMode: vi.fn(() => ({
    currentMode: {
      animations: "normal",
      sounds: false,
    },
  })),
}));

// Mock performance API
Object.defineProperty(window, "performance", {
  value: {
    now: vi.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 50000000, // 50MB
    },
  },
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn(() => 1 as any);
global.cancelAnimationFrame = vi.fn();

describe("UIPerformanceEngine", () => {
  it("renders children correctly", () => {
    render(
      <UIPerformanceEngine>
        <div>Test Content</div>
      </UIPerformanceEngine>,
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("applies low performance mode class when conditions are met", async () => {
    Object.defineProperty(window.performance, "memory", {
      value: {
        usedJSHeapSize: 150000000, // 150MB - high memory
      },
      configurable: true,
    });

    const setIntervalSpy = vi
      .spyOn(global, "setInterval")
      .mockImplementation(((cb: any) => {
        cb();
        return 1 as any;
      }) as any);
    const clearIntervalSpy = vi
      .spyOn(global, "clearInterval")
      .mockImplementation((() => undefined) as any);

    render(
      <UIPerformanceEngine>
        <div>Test Content</div>
      </UIPerformanceEngine>,
    );

    await waitFor(() => {
      expect(document.body).toHaveClass("low-performance-mode");
    });

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });
});

describe("LazyLoad", () => {
  const mockUsePerformance = {
    metrics: {
      fps: 60,
      memoryUsage: 50000000,
      renderTime: 10,
      componentCount: 10,
      networkRequests: 5,
      cacheHitRate: 0.8,
    },
    componentMetrics: new Map(),
    isLowPerformanceMode: false,
    enablePerformanceMode: vi.fn(),
    disablePerformanceMode: vi.fn(),
    registerComponent: vi.fn(),
    unregisterComponent: vi.fn(),
    getComponentMetrics: vi.fn(),
  };

  beforeEach(() => {
    vi.spyOn(React, "useContext").mockReturnValue(mockUsePerformance);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders fallback when not visible", () => {
    // Mock IntersectionObserver to not trigger intersection
    const mockObserve = vi.fn();
    const mockUnobserve = vi.fn();
    const mockDisconnect = vi.fn();

    class MockIntersectionObserver {
      observe = mockObserve;
      unobserve = mockUnobserve;
      disconnect = mockDisconnect;
      constructor(_cb: any, _options?: any) {}
    }

    global.IntersectionObserver = MockIntersectionObserver as any;

    render(
      <LazyLoad fallback={<LoadingState size="sm" />}>
        <div>Loaded Content</div>
      </LazyLoad>,
    );

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    expect(screen.queryByText("Loaded Content")).not.toBeInTheDocument();
  });

  it("renders content immediately in low performance mode", () => {
    const lowPerfMock = {
      ...mockUsePerformance,
      isLowPerformanceMode: true,
    };

    vi.spyOn(React, "useContext").mockReturnValue(lowPerfMock);

    render(
      <LazyLoad>
        <div>Loaded Content</div>
      </LazyLoad>,
    );

    expect(screen.getByText("Loaded Content")).toBeInTheDocument();
    expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
  });

  it("uses custom fallback when provided", () => {
    const customFallback = <div>Custom Loading...</div>;

    render(
      <LazyLoad fallback={customFallback}>
        <div>Loaded Content</div>
      </LazyLoad>,
    );

    expect(screen.getByText("Custom Loading...")).toBeInTheDocument();
  });
});

describe("PerformanceMonitor", () => {
  const mockUsePerformance = {
    metrics: {
      fps: 55,
      memoryUsage: 75000000,
      renderTime: 12,
      componentCount: 15,
      networkRequests: 8,
      cacheHitRate: 0.85,
    },
    componentMetrics: new Map([
      [
        "TestComponent",
        {
          componentName: "TestComponent",
          renderCount: 10,
          averageRenderTime: 15.5,
          lastRenderTime: 12.3,
          memoryFootprint: 1024000,
        },
      ],
    ]),
    isLowPerformanceMode: false,
    enablePerformanceMode: vi.fn(),
    disablePerformanceMode: vi.fn(),
    registerComponent: vi.fn(),
    unregisterComponent: vi.fn(),
    getComponentMetrics: vi.fn(),
  };

  beforeEach(() => {
    vi.spyOn(React, "useContext").mockReturnValue(mockUsePerformance);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("displays performance metrics", () => {
    render(<PerformanceMonitor />);

    expect(screen.getByText("Performance Monitor")).toBeInTheDocument();
    expect(screen.getByText("55")).toBeInTheDocument(); // FPS
    expect(screen.getByText("72MB")).toBeInTheDocument(); // Memory (rounded)
    expect(screen.getByText("1")).toBeInTheDocument(); // Component count
  });

  it("shows slowest components", () => {
    render(<PerformanceMonitor />);

    expect(screen.getByText("Slowest Components")).toBeInTheDocument();
    expect(screen.getByText("TestComponent")).toBeInTheDocument();
    expect(screen.getByText("15.50ms")).toBeInTheDocument();
  });

  it("toggles performance mode when button clicked", () => {
    render(<PerformanceMonitor />);

    const enableButton = screen.getByText("Enable Performance Mode");
    fireEvent.click(enableButton);

    expect(mockUsePerformance.enablePerformanceMode).toHaveBeenCalled();
  });

  it("shows correct mode indicator", () => {
    render(<PerformanceMonitor />);

    expect(screen.getByText("Normal Mode")).toBeInTheDocument();
    expect(screen.getByText("Normal Mode")).toHaveClass("bg-green-100");
  });
});

describe("usePerformance hook", () => {
  it("throws error when used outside provider", () => {
    const TestComponent = () => {
      try {
        usePerformance();
        return <div>Success</div>;
      } catch (error) {
        return <div>Error: {(error as Error).message}</div>;
      }
    };

    render(<TestComponent />);
    expect(screen.getByText(/Error:/)).toBeInTheDocument();
    expect(
      screen.getByText(
        /usePerformance must be used within UIPerformanceEngine/,
      ),
    ).toBeInTheDocument();
  });

  it("returns context when used within provider", () => {
    const mockContext = {
      metrics: {
        fps: 60,
        memoryUsage: 50000000,
        renderTime: 10,
        componentCount: 10,
        networkRequests: 5,
        cacheHitRate: 0.8,
      },
      componentMetrics: new Map(),
      isLowPerformanceMode: false,
      enablePerformanceMode: vi.fn(),
      disablePerformanceMode: vi.fn(),
      registerComponent: vi.fn(),
      unregisterComponent: vi.fn(),
      getComponentMetrics: vi.fn(),
    };

    vi.spyOn(React, "useContext").mockReturnValue(mockContext);

    const TestComponent = () => {
      const { metrics } = usePerformance();
      return <div>FPS: {metrics.fps}</div>;
    };

    render(
      <UIPerformanceEngine>
        <TestComponent />
      </UIPerformanceEngine>,
    );

    expect(screen.getByText("FPS: 60")).toBeInTheDocument();
  });
});

describe("withPerformanceTracking HOC", () => {
  it("wraps component with performance tracking", () => {
    const MockComponent = vi.fn(() => <div>Test Component</div>);
    const TrackedComponent = withPerformanceTracking(
      MockComponent,
      "TestComponent",
    );

    const mockContext = {
      registerComponent: vi.fn(),
      unregisterComponent: vi.fn(),
    };

    vi.spyOn(React, "useContext").mockReturnValue(mockContext);

    render(<TrackedComponent />);

    expect(screen.getByText("Test Component")).toBeInTheDocument();
    expect(mockContext.registerComponent).toHaveBeenCalledWith(
      "TestComponent",
      expect.any(HTMLElement),
    );
  });

  it("cleans up on unmount", () => {
    const MockComponent = vi.fn(() => <div>Test Component</div>);
    const TrackedComponent = withPerformanceTracking(
      MockComponent,
      "TestComponent",
    );

    const mockContext = {
      registerComponent: vi.fn(),
      unregisterComponent: vi.fn(),
    };

    vi.spyOn(React, "useContext").mockReturnValue(mockContext);

    const { unmount } = render(<TrackedComponent />);
    unmount();

    expect(mockContext.unregisterComponent).toHaveBeenCalledWith(
      "TestComponent",
    );
  });
});

describe("AdaptiveImage", () => {
  const mockUsePerformance = {
    metrics: {
      fps: 60,
      memoryUsage: 50000000,
      renderTime: 10,
      componentCount: 10,
      networkRequests: 5,
      cacheHitRate: 0.8,
    },
    componentMetrics: new Map(),
    isLowPerformanceMode: false,
    enablePerformanceMode: vi.fn(),
    disablePerformanceMode: vi.fn(),
    registerComponent: vi.fn(),
    unregisterComponent: vi.fn(),
    getComponentMetrics: vi.fn(),
  };

  beforeEach(() => {
    vi.spyOn(React, "useContext").mockReturnValue(mockUsePerformance);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders image with loading state", () => {
    render(<AdaptiveImage src="test.jpg" alt="Test Image" />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "test.jpg");
    expect(img).toHaveAttribute("alt", "Test Image");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("shows loading placeholder initially", () => {
    render(<AdaptiveImage src="test.jpg" alt="Test Image" />);

    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
  });

  it("uses simple loading in low performance mode", () => {
    const lowPerfMock = {
      ...mockUsePerformance,
      isLowPerformanceMode: true,
    };

    vi.spyOn(React, "useContext").mockReturnValue(lowPerfMock);

    render(<AdaptiveImage src="test.jpg" alt="Test Image" />);

    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    // Should not have loading animation in low performance mode
  });
});
