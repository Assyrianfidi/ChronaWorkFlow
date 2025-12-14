import type { Meta, StoryObj } from "@storybook/react";
import {
  InteractiveDashboard,
  DashboardBuilder,
} from "./DashboardComponents.js";
import type {
  DashboardWidget,
  DashboardLayout,
} from "./DashboardComponents.js";

// Mock data for dashboard widgets
const mockWidgets: DashboardWidget[] = [
  {
    id: "balance-widget",
    type: "metric",
    title: "Total Balance",
    size: "medium",
    position: { x: 0, y: 0 },
    data: { value: "$45,678.90", change: "+12.5%", trend: "up" },
  },
  {
    id: "income-chart",
    type: "chart",
    title: "Monthly Income",
    size: "large",
    position: { x: 1, y: 0 },
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          label: "Income",
          data: [5000, 5200, 4800, 5500, 5800, 6200],
        },
      ],
    },
  },
  {
    id: "recent-transactions",
    type: "list",
    title: "Recent Transactions",
    size: "medium",
    position: { x: 0, y: 1 },
    data: [
      {
        id: 1,
        description: "Salary Deposit",
        amount: "$5,000",
        date: "2024-01-15",
      },
      {
        id: 2,
        description: "Rent Payment",
        amount: "-$1,500",
        date: "2024-01-14",
      },
      {
        id: 3,
        description: "Grocery Shopping",
        amount: "-$234.50",
        date: "2024-01-13",
      },
      {
        id: 4,
        description: "Freelance Project",
        amount: "$1,200",
        date: "2024-01-12",
      },
    ],
  },
  {
    id: "accounts-summary",
    type: "table",
    title: "Accounts Summary",
    size: "large",
    position: { x: 1, y: 1 },
    data: {
      headers: ["Account", "Balance", "Type"],
      rows: [
        ["Checking", "$12,345.67", "Asset"],
        ["Savings", "$28,456.23", "Asset"],
        ["Credit Card", "-$2,345.00", "Liability"],
        ["Investment", "$15,678.90", "Asset"],
      ],
    },
  },
];

const mockLayout: DashboardLayout = {
  id: "main-dashboard",
  name: "Financial Dashboard",
  widgets: mockWidgets,
  columns: 2,
  gap: 16,
};

const meta: Meta<typeof InteractiveDashboard> = {
  title: "Adaptive/DashboardComponents",
  component: InteractiveDashboard,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Advanced dashboard components with adaptive layouts, drag-and-drop functionality, and real-time data visualization for financial management.",
      },
    },
  },
  tags: ["autodocs", "adaptive"],
};

export default meta;
type Story = StoryObj<typeof InteractiveDashboard>;

export const Default: Story = {
  args: {
    layout: mockLayout,
    onLayoutChange: (layout) => console.log("Layout changed:", layout),
    editable: false,
  },
};

export const Editable: Story = {
  args: {
    layout: mockLayout,
    onLayoutChange: (layout) => console.log("Layout changed:", layout),
    editable: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Interactive dashboard with drag-and-drop widget positioning and resizing capabilities.",
      },
    },
  },
};

export const MobileLayout: Story = {
  args: {
    layout: {
      ...mockLayout,
      columns: 1,
      widgets: mockWidgets.map((widget, index) => ({
        ...widget,
        position: { x: 0, y: index },
        size: widget.size === "full" ? "large" : widget.size,
      })),
    },
    onLayoutChange: (layout) => console.log("Layout changed:", layout),
    editable: false,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile",
    },
  },
};

export const CompactLayout: Story = {
  args: {
    layout: {
      ...mockLayout,
      columns: 3,
      gap: 8,
      widgets: mockWidgets.map((widget) => ({
        ...widget,
        size: widget.size === "large" ? "medium" : widget.size,
      })),
    },
    onLayoutChange: (layout) => console.log("Layout changed:", layout),
    editable: false,
  },
};

export const DashboardBuilderStory: Story = {
  render: () => <DashboardBuilder />,
  parameters: {
    docs: {
      description: {
        story:
          "Interactive dashboard builder for creating custom layouts with drag-and-drop widget placement.",
      },
    },
  },
};

export const RealTimeData: Story = {
  args: {
    layout: {
      ...mockLayout,
      widgets: mockWidgets.map((widget) => ({
        ...widget,
        refreshInterval: 5000, // 5 seconds
        data: {
          ...widget.data,
          lastUpdated: new Date().toISOString(),
        },
      })),
    },
    onLayoutChange: (layout) => console.log("Layout changed:", layout),
    editable: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Dashboard with real-time data updates and automatic refresh intervals.",
      },
    },
  },
};

export const PerformanceOptimized: Story = {
  args: {
    layout: {
      ...mockLayout,
      widgets: [
        ...mockWidgets,
        {
          id: "performance-metrics",
          type: "metric",
          title: "Performance Metrics",
          size: "small",
          position: { x: 2, y: 0 },
          data: {
            renderTime: "2.3ms",
            memoryUsage: "45.2MB",
            cacheHitRate: "94%",
          },
        },
        {
          id: "system-health",
          type: "metric",
          title: "System Health",
          size: "small",
          position: { x: 2, y: 1 },
          data: {
            status: "healthy",
            uptime: "99.9%",
            errors: "0",
          },
        },
      ],
    },
    onLayoutChange: (layout) => console.log("Layout changed:", layout),
    editable: false,
  },
};
