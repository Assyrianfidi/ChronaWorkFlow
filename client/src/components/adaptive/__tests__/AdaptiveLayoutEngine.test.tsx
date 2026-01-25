import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { useWindowSize } from "@/hooks/useWindowSize";
import {
  AdaptiveLayoutEngine,
  useAdaptiveLayout,
  AdaptiveGrid,
  AdaptiveContainer,
  AdaptiveText,
} from '../AdaptiveLayoutEngine';

// Mock the useWindowSize hook
vi.mock("@/hooks/useWindowSize", () => ({
  useWindowSize: vi.fn(() => ({ width: 1024, height: 768 })),
}));

// Mock the auth store
vi.mock("@/store/auth-store", () => ({
  useAuthStore: vi.fn(() => ({
    user: { role: "user" },
  })),
}));

describe("AdaptiveLayoutEngine", () => {
  it("renders children correctly", () => {
    render(
      <AdaptiveLayoutEngine>
        <div>Test Content</div>
      </AdaptiveLayoutEngine>,
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("applies correct breakpoint classes based on screen width", () => {
    render(
      <AdaptiveLayoutEngine>
        <div>Test Content</div>
      </AdaptiveLayoutEngine>,
    );

    const container = screen.getByText("Test Content").parentElement;
    expect(container).toHaveClass("breakpoint-desktop");
  });

  it("applies mobile adaptations for small screens", async () => {
    vi.mocked(useWindowSize).mockReturnValue({ width: 500, height: 768 } as any);

    render(
      <AdaptiveLayoutEngine>
        <div>Test Content</div>
      </AdaptiveLayoutEngine>,
    );

    await waitFor(() => {
      const container = screen.getByText("Test Content").parentElement;
      expect(container).toHaveClass("breakpoint-mobile");
      expect(container).toHaveClass("compact-layout");
      expect(container).toHaveClass("sidebar-collapsed");
    });
  });
});

describe("AdaptiveGrid", () => {
  const mockUseAdaptiveLayout = {
    config: {
      breakpoints: { mobile: 768, tablet: 1024, desktop: 1280, wide: 1536 },
      layouts: {
        compact: false,
        sidebarCollapsed: false,
        topNavigation: false,
        cardDensity: "comfortable",
        animationsEnabled: true,
      },
    },
    currentBreakpoint: "tablet",
    isMobile: false,
    isTablet: true,
    isDesktop: false,
    screenOrientation: "landscape",
    updateConfig: vi.fn(),
  };

  beforeEach(() => {
    vi.spyOn(React, "useContext").mockReturnValue(mockUseAdaptiveLayout);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders grid with correct columns for tablet breakpoint", () => {
    render(
      <AdaptiveGrid>
        <div>Item 1</div>
        <div>Item 2</div>
      </AdaptiveGrid>,
    );

    const grid = screen.getByText("Item 1").parentElement;
    expect(grid).toHaveStyle({
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    });
  });

  it("applies custom gap sizes", () => {
    render(
      <AdaptiveGrid gap={{ mobile: 2, tablet: 4, desktop: 6, wide: 8 }}>
        <div>Item 1</div>
      </AdaptiveGrid>,
    );

    const grid = screen.getByText("Item 1").parentElement;
    expect(grid).toHaveStyle({ gap: "1rem" }); // 4 * 0.25rem
  });
});

describe("AdaptiveContainer", () => {
  const mockUseAdaptiveLayout = {
    config: {
      breakpoints: { mobile: 768, tablet: 1024, desktop: 1280, wide: 1536 },
      layouts: {
        compact: false,
        sidebarCollapsed: false,
        topNavigation: false,
        cardDensity: "comfortable",
        animationsEnabled: true,
      },
    },
    currentBreakpoint: "desktop",
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenOrientation: "landscape",
    updateConfig: vi.fn(),
  };

  beforeEach(() => {
    vi.spyOn(React, "useContext").mockReturnValue(mockUseAdaptiveLayout);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("applies correct padding for desktop breakpoint", () => {
    render(
      <AdaptiveContainer>
        <div>Container Content</div>
      </AdaptiveContainer>,
    );

    const container = screen.getByText("Container Content").parentElement;
    expect(container).toHaveClass("px-8");
  });

  it("applies max width when enabled", () => {
    render(
      <AdaptiveContainer maxWidth={true}>
        <div>Container Content</div>
      </AdaptiveContainer>,
    );

    const container = screen.getByText("Container Content").parentElement;
    expect(container).toHaveClass("max-w-7xl");
    expect(container).toHaveClass("mx-auto");
  });
});

describe("AdaptiveText", () => {
  const mockUseAdaptiveLayout = {
    config: {
      breakpoints: { mobile: 768, tablet: 1024, desktop: 1280, wide: 1536 },
      layouts: {
        compact: false,
        sidebarCollapsed: false,
        topNavigation: false,
        cardDensity: "comfortable",
        animationsEnabled: true,
      },
    },
    currentBreakpoint: "desktop",
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenOrientation: "landscape",
    updateConfig: vi.fn(),
  };

  beforeEach(() => {
    vi.spyOn(React, "useContext").mockReturnValue(mockUseAdaptiveLayout);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("applies correct font size for heading variant on desktop", () => {
    render(<AdaptiveText variant="heading">Heading Text</AdaptiveText>);

    const text = screen.getByText("Heading Text");
    expect(text).toHaveClass("text-4xl");
  });

  it("applies compact class when layout is compact", () => {
    const compactLayout = {
      ...mockUseAdaptiveLayout,
      config: {
        ...mockUseAdaptiveLayout.config,
        layouts: {
          ...mockUseAdaptiveLayout.config.layouts,
          compact: true,
        },
      },
    };

    vi.spyOn(React, "useContext").mockReturnValue(compactLayout);

    render(<AdaptiveText>Compact Text</AdaptiveText>);

    const text = screen.getByText("Compact Text");
    expect(text).toHaveClass("text-xs");
  });
});

describe("useAdaptiveLayout hook", () => {
  it("throws error when used outside provider", () => {
    const TestComponent = () => {
      try {
        useAdaptiveLayout();
        return <div>Success</div>;
      } catch (error) {
        return <div>Error: {(error as Error).message}</div>;
      }
    };

    render(<TestComponent />);
    expect(screen.getByText(/Error:/)).toBeInTheDocument();
    expect(
      screen.getByText(
        /useAdaptiveLayout must be used within AdaptiveLayoutEngine/,
      ),
    ).toBeInTheDocument();
  });

  it("returns context when used within provider", () => {
    const mockContext = {
      config: {
        breakpoints: { mobile: 768, tablet: 1024, desktop: 1280, wide: 1536 },
        layouts: {
          compact: false,
          sidebarCollapsed: false,
          topNavigation: false,
          cardDensity: "comfortable",
          animationsEnabled: true,
        },
      },
      updateConfig: vi.fn(),
      currentBreakpoint: "desktop",
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      screenOrientation: "landscape",
    };

    vi.spyOn(React, "useContext").mockReturnValue(mockContext);

    const TestComponent = () => {
      const context = useAdaptiveLayout();
      return <div>Current breakpoint: {context.currentBreakpoint}</div>;
    };

    render(
      <AdaptiveLayoutEngine>
        <TestComponent />
      </AdaptiveLayoutEngine>,
    );

    expect(screen.getByText("Current breakpoint: desktop")).toBeInTheDocument();
  });
});
