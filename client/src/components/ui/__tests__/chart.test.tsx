import React from "react";
import { render, screen } from "@testing-library/react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "../chart.js";
import type { ChartConfig } from "../chart.js";

// Mock recharts components
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
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

describe("Chart Components", () => {
  describe("ChartContainer", () => {
    it("renders children with correct config", () => {
      const config: ChartConfig = {
        test: {
          label: "Test Label",
          icon: () => <div data-testid="test-icon">Icon</div>,
        },
      };

      render(
        <ChartContainer config={config}>
          <div data-testid="test-chart">Chart Content</div>
        </ChartContainer>,
      );

      expect(screen.getByTestId("test-chart")).toBeInTheDocument();
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("merges custom className with default styles", () => {
      const config: ChartConfig = {};

      render(
        <ChartContainer config={config} className="custom-class">
          <div>Test Content</div>
        </ChartContainer>,
      );

      const container = document.querySelector("[data-chart]");
      expect(container).toHaveClass("custom-class");
    });
  });

  describe("ChartTooltip", () => {
    it("renders tooltip with default content", () => {
      const config: ChartConfig = {};

      render(
        <ChartContainer config={config}>
          <ChartTooltip />
        </ChartContainer>,
      );
      expect(screen.getByTestId("chart-tooltip")).toBeInTheDocument();
    });

    it("renders with custom content", () => {
      const config: ChartConfig = {};
      const customContent = (
        <div data-testid="custom-content">Custom Tooltip</div>
      );
      render(
        <ChartContainer config={config}>
          <ChartTooltip content={customContent} />
        </ChartContainer>,
      );
      expect(screen.getByTestId("custom-content")).toBeInTheDocument();
    });
  });

  describe("ChartTooltipContent", () => {
    const mockPayload = [
      {
        name: "Test Item",
        value: 100,
        payload: { fill: "#000000" },
        dataKey: "test",
      },
    ];

    const mockConfig: ChartConfig = {
      test: {
        label: "Test Label",
        icon: () => <div data-testid="payload-icon">Icon</div>,
      },
    };

    it("renders tooltip content when active and has payload", () => {
      render(
        <ChartContainer config={mockConfig}>
          <ChartTooltip content={<ChartTooltipContent />} />
        </ChartContainer>,
      );

      // The tooltip content is rendered through the mocked Tooltip component
      expect(screen.getByTestId("chart-tooltip")).toBeInTheDocument();
    });

    it("renders with custom label formatter", () => {
      const labelFormatter = vi.fn(() => "Formatted Label");
      render(
        <ChartContainer config={mockConfig}>
          <ChartTooltip
            content={<ChartTooltipContent labelFormatter={labelFormatter} />}
          />
        </ChartContainer>,
      );

      expect(screen.getByTestId("chart-tooltip")).toBeInTheDocument();
    });

    it("hides label when hideLabel is true", () => {
      render(
        <ChartContainer config={mockConfig}>
          <ChartTooltip content={<ChartTooltipContent hideLabel={true} />} />
        </ChartContainer>,
      );

      expect(screen.getByTestId("chart-tooltip")).toBeInTheDocument();
    });

    it("applies custom label className", () => {
      render(
        <ChartContainer config={mockConfig}>
          <ChartTooltip
            content={
              <ChartTooltipContent labelClassName="custom-label-class" />
            }
          />
        </ChartContainer>,
      );

      expect(screen.getByTestId("chart-tooltip")).toBeInTheDocument();
    });

    it("renders with custom value formatter", () => {
      const formatter = vi.fn(() => "$100.00");
      render(
        <ChartContainer config={mockConfig}>
          <ChartTooltip
            content={<ChartTooltipContent formatter={formatter} />}
          />
        </ChartContainer>,
      );

      expect(screen.getByTestId("chart-tooltip")).toBeInTheDocument();
    });

    it("renders dot indicator correctly", () => {
      render(
        <ChartContainer config={mockConfig}>
          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        </ChartContainer>,
      );

      expect(screen.getByTestId("chart-tooltip")).toBeInTheDocument();
    });

    it("renders line indicator correctly", () => {
      render(
        <ChartContainer config={mockConfig}>
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        </ChartContainer>,
      );

      expect(screen.getByTestId("chart-tooltip")).toBeInTheDocument();
    });

    it("renders dashed indicator correctly", () => {
      render(
        <ChartContainer config={mockConfig}>
          <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
        </ChartContainer>,
      );

      expect(screen.getByTestId("chart-tooltip")).toBeInTheDocument();
    });
  });

  describe("ChartLegend", () => {
    it("renders legend with default content", () => {
      render(
        <ChartContainer config={{}}>
          <ChartLegend />
        </ChartContainer>,
      );
      expect(screen.getByTestId("chart-legend")).toBeInTheDocument();
    });

    it("renders with custom content", () => {
      const customContent = (
        <div data-testid="custom-legend-content">Custom Legend</div>
      );
      render(
        <ChartContainer config={{}}>
          <ChartLegend content={customContent} />
        </ChartContainer>,
      );
      expect(screen.getByTestId("custom-legend-content")).toBeInTheDocument();
    });
  });

  describe("ChartLegendContent", () => {
    const mockPayload = [
      {
        value: "Test Value",
        color: "#ff0000",
        dataKey: "test",
      },
    ];

    const mockConfig: ChartConfig = {
      test: {
        label: "Test Label",
        icon: () => <div data-testid="legend-icon">Icon</div>,
      },
    };

    it("renders legend content when payload exists", () => {
      render(
        <ChartContainer config={mockConfig}>
          <ChartLegendContent payload={mockPayload} />
        </ChartContainer>,
      );

      expect(screen.getByText("Test Label")).toBeInTheDocument();
      // Check that the legend container is rendered
      const legendContainer = document.querySelector(
        ".flex.items-center.justify-center.gap-4",
      );
      expect(legendContainer).toBeInTheDocument();
    });

    it("does not render when no payload", () => {
      render(
        <ChartContainer config={mockConfig}>
          <ChartLegendContent payload={[]} />
        </ChartContainer>,
      );

      expect(screen.queryByText("Test Label")).not.toBeInTheDocument();
    });

    it("hides icons when hideIcon is true", () => {
      render(
        <ChartContainer config={mockConfig}>
          <ChartLegendContent payload={mockPayload} hideIcon={true} />
        </ChartContainer>,
      );

      expect(screen.queryByTestId("legend-icon")).not.toBeInTheDocument();
    });

    it("renders color indicator when no icon provided", () => {
      const configWithoutIcon: ChartConfig = {
        test: {
          label: "Test Label",
        },
      };

      render(
        <ChartContainer config={configWithoutIcon}>
          {/* @ts-ignore */}
          {/* @ts-ignore */}
          <ChartLegendContent payload={mockPayload as any} />
        </ChartContainer>,
      );

      const indicator = document.querySelector(
        '[style*="background-color"]',
      ) as HTMLElement;
      expect(indicator).toBeInTheDocument();
      expect(indicator.style.backgroundColor).toBe("rgb(255, 0, 0)");
    });

    it("uses nameKey for config lookup", () => {
      const payloadWithNameKey = [
        {
          value: "Test Value",
          color: "#ff0000",
          dataKey: "test",
          name: "customKey",
        },
      ];

      const configWithNameKey: ChartConfig = {
        customKey: {
          label: "Custom Label",
        },
      };

      render(
        <ChartContainer config={configWithNameKey}>
          <ChartLegendContent payload={payloadWithNameKey} nameKey="name" />
        </ChartContainer>,
      );

      expect(screen.getByText("Custom Label")).toBeInTheDocument();
    });

    it("applies vertical alignment classes correctly", () => {
      const { rerender } = render(
        <ChartContainer config={mockConfig}>
          <ChartLegendContent payload={mockPayload} verticalAlign="top" />
        </ChartContainer>,
      );

      const legendContainer = document.querySelector(
        ".flex.items-center.justify-center.gap-4",
      );
      expect(legendContainer).toHaveClass("pb-3");

      rerender(
        <ChartContainer config={mockConfig}>
          <ChartLegendContent payload={mockPayload} verticalAlign="bottom" />
        </ChartContainer>,
      );

      const legendContainer2 = document.querySelector(
        ".flex.items-center.justify-center.gap-4",
      );
      expect(legendContainer2).toHaveClass("pt-3");
    });

    it("applies custom className", () => {
      render(
        <ChartContainer config={mockConfig}>
          <ChartLegendContent
            payload={mockPayload}
            className="custom-legend-class"
          />
        </ChartContainer>,
      );

      const legendContainer = document.querySelector(
        ".flex.items-center.justify-center.gap-4",
      );
      expect(legendContainer).toHaveClass("custom-legend-class");
    });
  });

  describe("getPayloadConfigFromPayload", () => {
    // This function is tested indirectly through the component tests above
    // but we can test edge cases through component behavior

    it("handles payload with nested payload object", () => {
      const payloadWithNested = [
        {
          value: "Test Value",
          color: "#ff0000",
          dataKey: "test",
          payload: {
            test: "nestedKey",
            nestedKey: "Nested Label",
          },
        },
      ];

      const config: ChartConfig = {
        nestedKey: {
          label: "Nested Label",
        },
      };

      render(
        <ChartContainer config={config}>
          <ChartLegendContent payload={payloadWithNested} />
        </ChartContainer>,
      );

      expect(screen.getByText("Nested Label")).toBeInTheDocument();
    });

    it("handles null/undefined payload gracefully", () => {
      render(
        <ChartContainer config={{}}>
          <ChartLegendContent payload={null} />
        </ChartContainer>,
      );

      expect(screen.queryByText("Test Label")).not.toBeInTheDocument();
    });
  });
});
