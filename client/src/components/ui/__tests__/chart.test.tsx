import React from "react";
import { render, screen } from "@testing-library/react";
import { UsersOverTimeCard, SalesOverviewCard } from "../cards/Charts";

// Mock recharts components
jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  Tooltip: ({ content, active, payload, label }: any) => (
    <div data-testid="chart-tooltip">
      {content
        ? React.cloneElement(content as React.ReactElement, {
            active,
            payload,
            label,
          })
        : "Tooltip"}
    </div>
  ),
  Legend: ({ content }: { content?: React.ReactNode }) => (
    <div data-testid="chart-legend">{content || "Legend"}</div>
  ),
}));

describe("Chart Cards", () => {
  it("renders UsersOverTimeCard", () => {
    render(<UsersOverTimeCard />);
    expect(screen.getByText(/Active Users/i)).toBeInTheDocument();
  });

  it("renders SalesOverviewCard", () => {
    render(<SalesOverviewCard />);
    expect(screen.getByText(/Sales Overview/i)).toBeInTheDocument();
  });
});
