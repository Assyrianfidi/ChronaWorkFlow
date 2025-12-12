import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  InteractiveDashboard,
  DashboardBuilder,
  withPerformanceTracking,
} from '../DashboardComponents.js';

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
    },
  })),
}));

describe("InteractiveDashboard", () => {
  const mockLayout = {
    id: "test-layout",
    name: "Test Dashboard",
    widgets: [
      {
        id: "widget-1",
        type: "metric" as const,
        title: "Revenue",
        size: "medium" as const,
        position: { x: 0, y: 0 },
        data: { value: 10000, label: "Monthly Revenue", change: 15 },
      },
      {
        id: "widget-2",
        type: "chart" as const,
        title: "Sales Chart",
        size: "large" as const,
        position: { x: 1, y: 0 },
        data: { type: "line" },
      },
    ],
    columns: 3,
    gap: 4,
  };

  it("renders dashboard with widgets", () => {
    render(
      <InteractiveDashboard
        layout={mockLayout}
        onLayoutChange={jest.fn()}
        editable={false}
      />,
    );

    expect(screen.getByText("Test Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("Sales Chart")).toBeInTheDocument();
    expect(screen.getByText("10,000")).toBeInTheDocument();
    expect(screen.getByText("Monthly Revenue")).toBeInTheDocument();
  });

  it("displays edit controls when editable", () => {
    render(
      <InteractiveDashboard
        layout={mockLayout}
        onLayoutChange={jest.fn()}
        editable={true}
      />,
    );

    expect(screen.getByText("Add Widget")).toBeInTheDocument();
    expect(screen.getByText("Reset Layout")).toBeInTheDocument();
  });

  it("does not display edit controls when not editable", () => {
    render(
      <InteractiveDashboard
        layout={mockLayout}
        onLayoutChange={jest.fn()}
        editable={false}
      />,
    );

    expect(screen.queryByText("Add Widget")).not.toBeInTheDocument();
    expect(screen.queryByText("Reset Layout")).not.toBeInTheDocument();
  });

  it("calls onLayoutChange when widget is resized", async () => {
    const onLayoutChange = jest.fn();

    render(
      <InteractiveDashboard
        layout={mockLayout}
        onLayoutChange={onLayoutChange}
        editable={true}
      />,
    );

    const resizeSelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(resizeSelect, { target: { value: "large" } });

    await waitFor(() => {
      expect(onLayoutChange).toHaveBeenCalled();
    });
  });

  it("shows widget content based on type", () => {
    render(
      <InteractiveDashboard
        layout={mockLayout}
        onLayoutChange={jest.fn()}
        editable={false}
      />,
    );

    // Metric widget should show value and change
    expect(screen.getByText("10,000")).toBeInTheDocument();
    expect(screen.getByText("↑ 15%")).toBeInTheDocument();

    // Chart widget should show chart placeholder
    expect(screen.getByText("Chart Visualization")).toBeInTheDocument();
  });
});

describe("DashboardBuilder", () => {
  it("renders builder interface", () => {
    render(<DashboardBuilder />);

    expect(screen.getByText("Dashboard Builder")).toBeInTheDocument();
    expect(screen.getByText("Create New Dashboard")).toBeInTheDocument();
  });

  it("shows empty state when no layout selected", () => {
    render(<DashboardBuilder />);

    expect(
      screen.getByText(/Create a new dashboard to get started/),
    ).toBeInTheDocument();
  });

  it("creates new dashboard when button clicked", async () => {
    render(<DashboardBuilder />);

    const createButton = screen.getByText("Create New Dashboard");
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText("New Dashboard 1")).toBeInTheDocument();
    });
  });
});

describe("Widget Components", () => {
  it("renders metric widget with data", () => {
    const MetricWidget = require("../DashboardComponents").ChartWidget;
    const data = { value: 5000, label: "Test Metric", change: -10 };

    render(<MetricWidget data={data} />);

    expect(screen.getByText("5,000")).toBeInTheDocument();
    expect(screen.getByText("Test Metric")).toBeInTheDocument();
    expect(screen.getByText("↓ 10%")).toBeInTheDocument();
  });

  it("renders table widget with data", () => {
    const TableWidget = require("../DashboardComponents").TableWidget;
    const data = {
      columns: ["Name", "Value"],
      rows: [
        { Name: "Item 1", Value: "100" },
        { Name: "Item 2", Value: "200" },
      ],
    };

    render(<TableWidget data={data} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Value")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("renders list widget with items", () => {
    const ListWidget = require("../DashboardComponents").ListWidget;
    const data = {
      items: [
        { label: "Task 1", value: "Done" },
        { label: "Task 2", value: "Pending" },
      ],
    };

    render(<ListWidget data={data} />);

    expect(screen.getByText("Task 1")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("Task 2")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("renders calendar widget", () => {
    const CalendarWidget = require("../DashboardComponents").CalendarWidget;
    const data = { date: "2024-01-15" };

    render(<CalendarWidget data={data} />);

    expect(screen.getByText("Calendar View")).toBeInTheDocument();
    expect(screen.getByText("1/15/2024")).toBeInTheDocument();
  });
});

describe("withPerformanceTracking HOC", () => {
  it("wraps component with performance tracking", () => {
    const MockComponent = jest.fn(() => <div>Test Component</div>);
    const TrackedComponent = withPerformanceTracking(
      MockComponent,
      "TestComponent",
    );

    // Mock performance hook
    jest.doMock("../UI-Performance-Engine", () => ({
      usePerformance: jest.fn(() => ({
        registerComponent: jest.fn(),
        unregisterComponent: jest.fn(),
      })),
    }));

    render(<TrackedComponent />);

    expect(screen.getByText("Test Component")).toBeInTheDocument();
  });
});
