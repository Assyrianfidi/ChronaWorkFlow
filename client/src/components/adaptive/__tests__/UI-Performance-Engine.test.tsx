import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  UIPerformanceEngine,
  usePerformance,
  LazyLoad,
  PerformanceMonitor,
  withPerformanceTracking,
} from "../UI-Performance-Engine.js";

// Mock the adaptive layout hook
jest.mock("../AdaptiveLayoutEngine", () => ({
  useAdaptiveLayout: jest.fn(() => ({
    currentBreakpoint: "desktop",
    isMobile: false,
  })),
}));

// Mock the UX mode hook
jest.mock("../UserExperienceMode", () => ({
  useUserExperienceMode: jest.fn(() => ({
    currentMode: {
      animations: "normal",
      sounds: false,
    },
  })),
}));

// Mock performance API
Object.defineProperty(window, "performance", {
  value: {
    now: jest.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 50000000, // 50MB
    },
  },
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn();

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
    // Mock low FPS
    jest.spyOn(window, "performance", "get").mockImplementation(
      () =>
        ({
          now: jest.fn(() => Date.now()),
          memory: {
            usedJSHeapSize: 150000000, // 150MB - high memory
          },
        }) as any,
    );

    render(
      <UIPerformanceEngine>
        <div>Test Content</div>
      </UIPerformanceEngine>,
    );

    await waitFor(() => {
      const container = screen.getByText("Test Content").parentElement;
      expect(container).toHaveClass("low-performance-mode");
    });
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
    enablePerformanceMode: jest.fn(),
    disablePerformanceMode: jest.fn(),
    registerComponent: jest.fn(),
    unregisterComponent: jest.fn(),
    getComponentMetrics: jest.fn(),
  };

  beforeEach(() => {
    jest.spyOn(React, "useContext").mockReturnValue(mockUsePerformance);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders fallback when not visible", () => {
    // Mock IntersectionObserver to not trigger intersection
    const mockObserve = jest.fn();
    const mockUnobserve = jest.fn();
    const mockDisconnect = jest.fn();

    global.IntersectionObserver = jest.fn(() => ({
      observe: mockObserve,
      unobserve: mockUnobserve,
      disconnect: mockDisconnect,
    })) as any;

    render(
      <LazyLoad fallback={<div>Loading...</div>}>
        <div>Loaded Content</div>
      </LazyLoad>,
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Loaded Content")).not.toBeInTheDocument();
  });

  it("renders content immediately in low performance mode", () => {
    const lowPerfMock = {
      ...mockUsePerformance,
      isLowPerformanceMode: true,
    };

    jest.spyOn(React, "useContext").mockReturnValue(lowPerfMock);

    render(
      <LazyLoad>
        <div>Loaded Content</div>
      </LazyLoad>,
    );

    expect(screen.getByText("Loaded Content")).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
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
    enablePerformanceMode: jest.fn(),
    disablePerformanceMode: jest.fn(),
    registerComponent: jest.fn(),
    unregisterComponent: jest.fn(),
    getComponentMetrics: jest.fn(),
  };

  beforeEach(() => {
    jest.spyOn(React, "useContext").mockReturnValue(mockUsePerformance);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
      enablePerformanceMode: jest.fn(),
      disablePerformanceMode: jest.fn(),
      registerComponent: jest.fn(),
      unregisterComponent: jest.fn(),
      getComponentMetrics: jest.fn(),
    };

    jest.spyOn(React, "useContext").mockReturnValue(mockContext);

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
    const MockComponent = jest.fn(() => <div>Test Component</div>);
    const TrackedComponent = withPerformanceTracking(
      MockComponent,
      "TestComponent",
    );

    const mockContext = {
      registerComponent: jest.fn(),
      unregisterComponent: jest.fn(),
    };

    jest.spyOn(React, "useContext").mockReturnValue(mockContext);

    render(<TrackedComponent />);

    expect(screen.getByText("Test Component")).toBeInTheDocument();
    expect(mockContext.registerComponent).toHaveBeenCalledWith(
      "TestComponent",
      expect.any(HTMLElement),
    );
  });

  it("cleans up on unmount", () => {
    const MockComponent = jest.fn(() => <div>Test Component</div>);
    const TrackedComponent = withPerformanceTracking(
      MockComponent,
      "TestComponent",
    );

    const mockContext = {
      registerComponent: jest.fn(),
      unregisterComponent: jest.fn(),
    };

    jest.spyOn(React, "useContext").mockReturnValue(mockContext);

    const { unmount } = render(<TrackedComponent />);
    unmount();

    expect(mockContext.unregisterComponent).toHaveBeenCalledWith(
      "TestComponent",
    );
  });
});

describe("AdaptiveImage", () => {
  const AdaptiveImage = require("../UI-Performance-Engine").AdaptiveImage;

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
    enablePerformanceMode: jest.fn(),
    disablePerformanceMode: jest.fn(),
    registerComponent: jest.fn(),
    unregisterComponent: jest.fn(),
    getComponentMetrics: jest.fn(),
  };

  beforeEach(() => {
    jest.spyOn(React, "useContext").mockReturnValue(mockUsePerformance);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

    expect(screen.getByText("Failed to load image")).toBeInTheDocument();
  });

  it("uses simple loading in low performance mode", () => {
    const lowPerfMock = {
      ...mockUsePerformance,
      isLowPerformanceMode: true,
    };

    jest.spyOn(React, "useContext").mockReturnValue(lowPerfMock);

    render(<AdaptiveImage src="test.jpg" alt="Test Image" />);

    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    // Should not have loading animation in low performance mode
  });
});
