import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import {
  DataVisualizationComponent,
  DashboardLayout,
  BaseChart,
} from "../DataVisualization.js";
import { AnalyticsEngine } from "../AnalyticsEngine.js";
import { DataVisualization } from "../AnalyticsEngine.js";

// Mock canvas context
const mockCanvasContext = {
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fillRect: vi.fn(),
  fill: vi.fn(),
  closePath: vi.fn(),
  arc: vi.fn(),
  rect: vi.fn(),
  strokeStyle: "",
  lineWidth: 1,
  fillStyle: "",
  canvas: { width: 400, height: 300 },
};

// Mock HTMLCanvasElement
HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCanvasContext);

// Mock modules
vi.mock("../hooks/useWindowSize", () => ({
  useWindowSize: vi.fn(() => ({ width: 1024, height: 768 })),
}));

vi.mock("../store/auth-store", () => ({
  useAuthStore: vi.fn(() => ({
    user: { role: "admin", id: "user-123" },
  })),
}));

vi.mock("../../adaptive/UserExperienceMode.tsx", () => ({
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

vi.mock("../../adaptive/UI-Performance-Engine.tsx", () => ({
  usePerformance: vi.fn(() => ({
    isLowPerformanceMode: false,
  })),
}));

describe("DataVisualizationComponent", () => {
  const mockVisualization: DataVisualization = {
    id: "test-chart",
    type: "line",
    title: "Test Chart",
    data: [
      { date: "2024-01-01", value: 100 },
      { date: "2024-01-02", value: 150 },
      { date: "2024-01-03", value: 120 },
    ],
    config: {
      xAxis: "date",
      yAxis: "value",
      colorScheme: ["#3b82f6"],
      showLegend: true,
      showGrid: true,
      interactive: true,
      animation: true,
    },
    position: { x: 0, y: 0, width: 6, height: 4 },
  };

  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCanvasContext.clearRect.mockClear();
    mockCanvasContext.beginPath.mockClear();
    mockCanvasContext.moveTo.mockClear();
    mockCanvasContext.lineTo.mockClear();
    mockCanvasContext.stroke.mockClear();
  });

  const renderWithAnalytics = (component: React.ReactElement) => {
    return render(<AnalyticsEngine>{component}</AnalyticsEngine>);
  };

  it("renders visualization component", () => {
    renderWithAnalytics(
      <DataVisualizationComponent
        visualization={mockVisualization}
        onUpdate={mockOnUpdate}
      />,
    );

    expect(screen.getByText("Test Chart")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
  });

  it("renders canvas element", () => {
    renderWithAnalytics(
      <DataVisualizationComponent
        visualization={mockVisualization}
        onUpdate={mockOnUpdate}
      />,
    );

    const canvas = screen.getByRole("img"); // Canvas gets img role by default
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveClass(
      "border",
      "border-gray-200",
      "rounded",
      "cursor-crosshair",
    );
  });

  it("enters edit mode when edit button clicked", async () => {
    renderWithAnalytics(
      <DataVisualizationComponent
        visualization={mockVisualization}
        onUpdate={mockOnUpdate}
      />,
    );

    fireEvent.click(screen.getByText("Edit"));

    await waitFor(() => {
      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.getByDisplayValue("date")).toBeInTheDocument();
      expect(screen.getByDisplayValue("value")).toBeInTheDocument();
      expect(screen.getByText("Show Legend")).toBeInTheDocument();
      expect(screen.getByText("Show Grid")).toBeInTheDocument();
      expect(screen.getByText("Interactive")).toBeInTheDocument();
    });
  });

  it("updates configuration in edit mode", async () => {
    renderWithAnalytics(
      <DataVisualizationComponent
        visualization={mockVisualization}
        onUpdate={mockOnUpdate}
      />,
    );

    // Enter edit mode
    fireEvent.click(screen.getByText("Edit"));

    await waitFor(() => {
      expect(screen.getByDisplayValue("date")).toBeInTheDocument();
    });

    // Update X axis
    const xAxisInput = screen.getByDisplayValue("date");
    fireEvent.change(xAxisInput, { target: { value: "time" } });

    // Toggle show legend
    const legendCheckbox = screen.getByLabelText("Show Legend");
    fireEvent.click(legendCheckbox);

    // Save changes
    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            xAxis: "time",
            showLegend: false,
          }),
        }),
      );
    });
  });

  it("cancels edit mode", async () => {
    renderWithAnalytics(
      <DataVisualizationComponent
        visualization={mockVisualization}
        onUpdate={mockOnUpdate}
      />,
    );

    // Enter edit mode
    fireEvent.click(screen.getByText("Edit"));

    await waitFor(() => {
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    // Cancel editing
    fireEvent.click(screen.getByText("Cancel"));

    await waitFor(() => {
      expect(screen.getByText("Edit")).toBeInTheDocument();
      expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
    });
  });

  it("handles mouse interactions on canvas", async () => {
    renderWithAnalytics(
      <DataVisualizationComponent
        visualization={mockVisualization}
        onUpdate={mockOnUpdate}
      />,
    );

    const canvas = screen.getByRole("img");

    // Simulate mouse move
    fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });

    // Simulate click
    fireEvent.click(canvas, { clientX: 100, clientY: 100 });

    // Canvas should still be present
    expect(canvas).toBeInTheDocument();
  });
});

describe("BaseChart", () => {
  const mockData = [
    { date: "2024-01-01", value: 100 },
    { date: "2024-01-02", value: 150 },
    { date: "2024-01-03", value: 120 },
  ];

  const mockConfig = {
    xAxis: "date",
    yAxis: "value",
    colorScheme: ["#3b82f6"],
    showLegend: true,
    showGrid: true,
    interactive: true,
    animation: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders line chart", () => {
    render(
      <BaseChart
        data={mockData}
        config={mockConfig}
        type="line"
        width={400}
        height={300}
      />,
    );

    const canvas = screen.getByRole("img");
    expect(canvas).toBeInTheDocument();

    // Verify canvas drawing methods were called
    expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    expect(mockCanvasContext.beginPath).toHaveBeenCalled();
    expect(mockCanvasContext.moveTo).toHaveBeenCalled();
    expect(mockCanvasContext.lineTo).toHaveBeenCalled();
    expect(mockCanvasContext.stroke).toHaveBeenCalled();
  });

  it("renders bar chart", () => {
    render(
      <BaseChart
        data={mockData}
        config={mockConfig}
        type="bar"
        width={400}
        height={300}
      />,
    );

    const canvas = screen.getByRole("img");
    expect(canvas).toBeInTheDocument();

    expect(mockCanvasContext.fillRect).toHaveBeenCalled();
  });

  it("renders pie chart", () => {
    const pieData = [
      { category: "A", value: 30 },
      { category: "B", value: 50 },
      { category: "C", value: 20 },
    ];

    render(
      <BaseChart
        data={pieData}
        config={mockConfig}
        type="pie"
        width={400}
        height={300}
      />,
    );

    const canvas = screen.getByRole("img");
    expect(canvas).toBeInTheDocument();

    expect(mockCanvasContext.arc).toHaveBeenCalled();
  });

  it("renders area chart", () => {
    render(
      <BaseChart
        data={mockData}
        config={mockConfig}
        type="area"
        width={400}
        height={300}
      />,
    );

    const canvas = screen.getByRole("img");
    expect(canvas).toBeInTheDocument();

    expect(mockCanvasContext.fill).toHaveBeenCalled();
  });

  it("renders scatter chart", () => {
    const scatterData = [
      { x: 10, y: 20 },
      { x: 15, y: 25 },
      { x: 20, y: 30 },
    ];

    render(
      <BaseChart
        data={scatterData}
        config={mockConfig}
        type="scatter"
        width={400}
        height={300}
      />,
    );

    const canvas = screen.getByRole("img");
    expect(canvas).toBeInTheDocument();

    expect(mockCanvasContext.arc).toHaveBeenCalled();
  });

  it("renders heatmap", () => {
    const heatmapData = [
      { x: 0, y: 0, value: 10 },
      { x: 0, y: 1, value: 20 },
      { x: 1, y: 0, value: 30 },
      { x: 1, y: 1, value: 40 },
    ];

    render(
      <BaseChart
        data={heatmapData}
        config={mockConfig}
        type="heatmap"
        width={400}
        height={300}
      />,
    );

    const canvas = screen.getByRole("img");
    expect(canvas).toBeInTheDocument();

    expect(mockCanvasContext.fillRect).toHaveBeenCalled();
  });

  it("disables interactions when interactive is false", () => {
    render(
      <BaseChart
        data={mockData}
        config={{ ...mockConfig, interactive: false }}
        type="line"
        width={400}
        height={300}
        interactive={false}
      />,
    );

    const canvas = screen.getByRole("img");
    expect(canvas).toBeInTheDocument();
    expect(canvas).not.toHaveClass("cursor-crosshair");
  });

  it("shows grid when enabled", () => {
    render(
      <BaseChart
        data={mockData}
        config={{ ...mockConfig, showGrid: true }}
        type="line"
        width={400}
        height={300}
      />,
    );

    // Grid lines should be drawn
    expect(mockCanvasContext.beginPath).toHaveBeenCalledTimes(
      expect.any(Number),
    );
  });

  it("handles empty data gracefully", () => {
    render(
      <BaseChart
        data={[]}
        config={mockConfig}
        type="line"
        width={400}
        height={300}
      />,
    );

    const canvas = screen.getByRole("img");
    expect(canvas).toBeInTheDocument();

    // Should still clear canvas but not draw data
    expect(mockCanvasContext.clearRect).toHaveBeenCalled();
  });
});

describe("DashboardLayout", () => {
  const mockDashboard = {
    id: "test-dashboard",
    name: "Test Dashboard",
    layout: "grid" as const,
    widgets: [
      {
        id: "widget-1",
        type: "line" as const,
        title: "Widget 1",
        data: [{ date: "2024-01-01", value: 100 }],
        config: {
          xAxis: "date",
          yAxis: "value",
          colorScheme: ["#3b82f6"],
          showLegend: true,
          showGrid: true,
          interactive: true,
          animation: true,
        },
        position: { x: 0, y: 0, width: 6, height: 4 },
      },
      {
        id: "widget-2",
        type: "bar" as const,
        title: "Widget 2",
        data: [{ category: "A", value: 50 }],
        config: {
          xAxis: "category",
          yAxis: "value",
          colorScheme: ["#10b981"],
          showLegend: true,
          showGrid: false,
          interactive: true,
          animation: true,
        },
        position: { x: 6, y: 0, width: 6, height: 4 },
      },
    ],
    filters: [],
    refreshInterval: 30000,
    lastUpdated: Date.now(),
  };

  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dashboard with widgets", () => {
    renderWithAnalytics(
      <DashboardLayout
        dashboard={mockDashboard}
        onVisualizationUpdate={mockOnUpdate}
      />,
    );

    expect(screen.getByText("Test Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Widget 1")).toBeInTheDocument();
    expect(screen.getByText("Widget 2")).toBeInTheDocument();
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it("renders empty state when no widgets", () => {
    const emptyDashboard = { ...mockDashboard, widgets: [] };

    renderWithAnalytics(
      <DashboardLayout
        dashboard={emptyDashboard}
        onVisualizationUpdate={mockOnUpdate}
      />,
    );

    expect(screen.getByText("No widgets added")).toBeInTheDocument();
    expect(
      screen.getByText("Add visualizations to build your dashboard"),
    ).toBeInTheDocument();
  });

  it("uses grid layout by default", () => {
    renderWithAnalytics(
      <DashboardLayout
        dashboard={mockDashboard}
        onVisualizationUpdate={mockOnUpdate}
      />,
    );

    // Should use grid layout classes
    const container = screen
      .getByText("Test Dashboard")
      .closest("div")?.parentElement;
    expect(container?.className).toContain("grid");
  });

  it("uses flex layout when specified", () => {
    const flexDashboard = { ...mockDashboard, layout: "flex" as const };

    renderWithAnalytics(
      <DashboardLayout
        dashboard={flexDashboard}
        onVisualizationUpdate={mockOnUpdate}
      />,
    );

    // Should use flex layout classes
    const container = screen
      .getByText("Test Dashboard")
      .closest("div")?.parentElement;
    expect(container?.className).toContain("flex");
  });

  it("handles widget dragging", () => {
    renderWithAnalytics(
      <DashboardLayout
        dashboard={mockDashboard}
        onVisualizationUpdate={mockOnUpdate}
      />,
    );

    const widget = screen.getByText("Widget 1").closest("div");

    // Start drag
    fireEvent.dragStart(widget!);

    // Widget should have opacity change during drag
    expect(widget).toHaveClass("opacity-50");

    // End drag
    fireEvent.dragEnd(widget!);

    // Opacity should be restored
    expect(widget).not.toHaveClass("opacity-50");
  });

  it("handles widget dropping", () => {
    renderWithAnalytics(
      <DashboardLayout
        dashboard={mockDashboard}
        onVisualizationUpdate={mockOnUpdate}
      />,
    );

    const widget1 = screen.getByText("Widget 1").closest("div");
    const widget2 = screen.getByText("Widget 2").closest("div");

    // Drag widget1 and drop on widget2
    fireEvent.dragStart(widget1!);
    fireEvent.dragOver(widget2!);
    fireEvent.drop(widget2!);
    fireEvent.dragEnd(widget1!);

    // Should not crash
    expect(widget1).toBeInTheDocument();
    expect(widget2).toBeInTheDocument();
  });

  it("formats last updated timestamp", () => {
    const testTime = new Date("2024-01-15T10:30:00");
    const dashboardWithTime = {
      ...mockDashboard,
      lastUpdated: testTime.getTime(),
    };

    renderWithAnalytics(
      <DashboardLayout
        dashboard={dashboardWithTime}
        onVisualizationUpdate={mockOnUpdate}
      />,
    );

    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument();
  });
});

describe("DataVisualization Integration", () => {
  it("integrates with analytics context", async () => {
    const mockVisualization: DataVisualization = {
      id: "integration-test",
      type: "line",
      title: "Integration Test",
      data: [{ date: "2024-01-01", value: 100 }],
      config: {
        xAxis: "date",
        yAxis: "value",
        colorScheme: ["#3b82f6"],
        showLegend: true,
        showGrid: true,
        interactive: true,
        animation: true,
      },
      position: { x: 0, y: 0, width: 6, height: 4 },
    };

    renderWithAnalytics(
      <DataVisualizationComponent
        visualization={mockVisualization}
        onUpdate={vi.fn()}
      />,
    );

    expect(screen.getByText("Integration Test")).toBeInTheDocument();
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("handles performance mode adaptations", async () => {
    vi.doMock("../../adaptive/UI-Performance-Engine.tsx", () => ({
      usePerformance: vi.fn(() => ({
        isLowPerformanceMode: true,
      })),
    }));

    const mockVisualization: DataVisualization = {
      id: "performance-test",
      type: "line",
      title: "Performance Test",
      data: [{ date: "2024-01-01", value: 100 }],
      config: {
        xAxis: "date",
        yAxis: "value",
        colorScheme: ["#3b82f6"],
        showLegend: true,
        showGrid: true,
        interactive: false, // Disabled in performance mode
        animation: false, // Disabled in performance mode
      },
      position: { x: 0, y: 0, width: 6, height: 4 },
    };

    renderWithAnalytics(
      <DataVisualizationComponent
        visualization={mockVisualization}
        onUpdate={vi.fn()}
      />,
    );

    const canvas = screen.getByRole("img");
    expect(canvas).not.toHaveClass("cursor-crosshair");
  });
});
