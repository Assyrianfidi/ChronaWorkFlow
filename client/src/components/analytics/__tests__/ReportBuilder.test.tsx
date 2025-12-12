import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { ReportBuilder } from '../ReportBuilder.js';
import { AnalyticsEngine } from '../AnalyticsEngine.js';

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

describe("ReportBuilder", () => {
  const mockOnReportGenerated = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithAnalytics = (component: React.ReactElement) => {
    return render(<AnalyticsEngine>{component}</AnalyticsEngine>);
  };

  it("renders report builder interface", () => {
    renderWithAnalytics(
      <ReportBuilder
        onReportGenerated={mockOnReportGenerated}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByText("Report Builder")).toBeInTheDocument();
    expect(screen.getByText("Choose a Report Template")).toBeInTheDocument();
    expect(screen.getByText("Financial Summary")).toBeInTheDocument();
    expect(screen.getByText("User Analytics")).toBeInTheDocument();
    expect(screen.getByText("Operational Efficiency")).toBeInTheDocument();
  });

  it("displays report templates", () => {
    renderWithAnalytics(
      <ReportBuilder
        onReportGenerated={mockOnReportGenerated}
        onCancel={mockOnCancel}
      />,
    );

    // Check template cards
    expect(
      screen.getByText("Overview of financial metrics and trends"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("User behavior and engagement metrics"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("System performance and operational metrics"),
    ).toBeInTheDocument();

    // Check template badges
    expect(screen.getAllByText("financial")).toHaveLength(1);
    expect(screen.getAllByText("user")).toHaveLength(1);
    expect(screen.getAllByText("operational")).toHaveLength(1);
  });

  it("selects a template and proceeds to next step", async () => {
    renderWithAnalytics(
      <ReportBuilder
        onReportGenerated={mockOnReportGenerated}
        onCancel={mockOnCancel}
      />,
    );

    // Click on Financial Summary template
    fireEvent.click(screen.getByText("Financial Summary"));

    await waitFor(() => {
      expect(screen.getByText("Select Metrics")).toBeInTheDocument();
      expect(screen.getByText("Total Revenue")).toBeInTheDocument();
      expect(screen.getByText("Active Users")).toBeInTheDocument();
      expect(screen.getByText("Transactions")).toBeInTheDocument();
    });
  });

  it("allows custom report creation", async () => {
    renderWithAnalytics(
      <ReportBuilder
        onReportGenerated={mockOnReportGenerated}
        onCancel={mockOnCancel}
      />,
    );

    // Click on "Build Custom Report"
    fireEvent.click(screen.getByText("Build Custom Report"));

    await waitFor(() => {
      expect(screen.getByText("Select Metrics")).toBeInTheDocument();
    });
  });

  it("handles metric selection", async () => {
    renderWithAnalytics(
      <ReportBuilder
        onReportGenerated={mockOnReportGenerated}
        onCancel={mockOnCancel}
      />,
    );

    // Select a template first
    fireEvent.click(screen.getByText("Financial Summary"));

    await waitFor(() => {
      expect(screen.getByText("Select Metrics")).toBeInTheDocument();
    });

    // Toggle metric selection
    const revenueCheckbox = screen.getByLabelText(/Total Revenue/);
    fireEvent.click(revenueCheckbox);

    // Verify selection
    expect(revenueCheckbox).toBeChecked();

    // Deselect metric
    fireEvent.click(revenueCheckbox);
    expect(revenueCheckbox).not.toBeChecked();
  });

  it("prevents proceeding without metrics", async () => {
    renderWithAnalytics(
      <ReportBuilder
        onReportGenerated={mockOnReportGenerated}
        onCancel={mockOnCancel}
      />,
    );

    // Select a template
    fireEvent.click(screen.getByText("Financial Summary"));

    await waitFor(() => {
      expect(screen.getByText("Select Metrics")).toBeInTheDocument();
    });

    // Try to proceed without selecting metrics
    const nextButton = screen.getByText("Next");
    expect(nextButton).toBeDisabled();
  });

  it("allows proceeding with selected metrics", async () => {
    renderWithAnalytics(
      <ReportBuilder
        onReportGenerated={mockOnReportGenerated}
        onCancel={mockOnCancel}
      />,
    );

    // Select a template
    fireEvent.click(screen.getByText("Financial Summary"));

    await waitFor(() => {
      expect(screen.getByText("Select Metrics")).toBeInTheDocument();
    });

    // Select a metric
    const revenueCheckbox = screen.getByLabelText(/Total Revenue/);
    fireEvent.click(revenueCheckbox);

    // Next button should be enabled
    const nextButton = screen.getByText("Next");
    expect(nextButton).not.toBeDisabled();

    // Proceed to filters
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("Configure Filters")).toBeInTheDocument();
    });
  });

  it("manages filters configuration", async () => {
    renderWithAnalytics(
      <ReportBuilder
        onReportGenerated={mockOnReportGenerated}
        onCancel={mockOnCancel}
      />,
    );

    // Navigate to filters step
    fireEvent.click(screen.getByText("Financial Summary"));

    await waitFor(() => {
      const revenueCheckbox = screen.getByLabelText(/Total Revenue/);
      fireEvent.click(revenueCheckbox);
    });

    fireEvent.click(screen.getByText("Next"));

    await waitFor(() => {
      expect(screen.getByText("Configure Filters")).toBeInTheDocument();
    });

    // Add a new filter
    fireEvent.click(screen.getByText("Add Filter"));

    // Verify filter fields
    expect(screen.getByDisplayValue("Date Range")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Between")).toBeInTheDocument();
    expect(screen.getByDisplayValue("last_30_days")).toBeInTheDocument();

    // Update filter
    const fieldSelect = screen.getByDisplayValue("Date Range");
    fireEvent.change(fieldSelect, { target: { value: "category" } });

    // Remove filter
    fireEvent.click(screen.getByText("Remove"));
  });

  it("configures report settings", async () => {
    renderWithAnalytics(
      <ReportBuilder
        onReportGenerated={mockOnReportGenerated}
        onCancel={mockOnCancel}
      />,
    );

    // Navigate to configuration step
    fireEvent.click(screen.getByText("Financial Summary"));

    await waitFor(() => {
      const revenueCheckbox = screen.getByLabelText(/Total Revenue/);
      fireEvent.click(revenueCheckbox);
    });

    fireEvent.click(screen.getByText("Next")); // To filters
    fireEvent.click(screen.getByText("Next")); // To configuration

    await waitFor(() => {
      expect(screen.getByText("Report Configuration")).toBeInTheDocument();
    });

    // Update report name
    const nameInput = screen.getByDisplayValue("Financial Summary");
    fireEvent.change(nameInput, {
      target: { value: "Custom Financial Report" },
    });

    // Change report type
    const typeSelect = screen.getByDisplayValue("Summary");
    fireEvent.change(typeSelect, { target: { value: "detailed" } });

    expect(
      screen.getByDisplayValue("Custom Financial Report"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Detailed")).toBeInTheDocument();
  });

  it("generates report successfully", async () => {
    renderWithAnalytics(
      <ReportBuilder
        onReportGenerated={mockOnReportGenerated}
        onCancel={mockOnCancel}
      />,
    );

    // Complete all steps
    fireEvent.click(screen.getByText("Financial Summary"));

    await waitFor(() => {
      const revenueCheckbox = screen.getByLabelText(/Total Revenue/);
      fireEvent.click(revenueCheckbox);
    });

    fireEvent.click(screen.getByText("Next")); // To filters
    fireEvent.click(screen.getByText("Next")); // To configuration

    await waitFor(() => {
      expect(screen.getByText("Report Configuration")).toBeInTheDocument();
    });

    // Generate report
    fireEvent.click(screen.getByText("Generate Report"));

    await waitFor(() => {
      expect(mockOnReportGenerated).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Financial Summary",
          type: "summary",
        }),
      );
    });
  });

  it("handles navigation between steps", async () => {
    renderWithAnalytics(
      <ReportBuilder
        onReportGenerated={mockOnReportGenerated}
        onCancel={mockOnCancel}
      />,
    );

    // Navigate to step 2
    fireEvent.click(screen.getByText("Financial Summary"));

    await waitFor(() => {
      expect(screen.getByText("Select Metrics")).toBeInTheDocument();
    });

    // Go back to step 1
    fireEvent.click(screen.getByText("Previous"));

    await waitFor(() => {
      expect(screen.getByText("Choose a Report Template")).toBeInTheDocument();
    });
  });

  it("cancels report building", () => {
    renderWithAnalytics(
      <ReportBuilder
        onReportGenerated={mockOnReportGenerated}
        onCancel={mockOnCancel}
      />,
    );

    fireEvent.click(screen.getByText("Cancel"));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("displays progress indicators correctly", async () => {
    renderWithAnalytics(
      <ReportBuilder
        onReportGenerated={mockOnReportGenerated}
        onCancel={mockOnCancel}
      />,
    );

    // Check initial state (step 1)
    expect(screen.getByText("1")).toHaveClass("text-white");
    expect(screen.getByText("2")).toHaveClass("text-gray-600");
    expect(screen.getByText("3")).toHaveClass("text-gray-600");
    expect(screen.getByText("4")).toHaveClass("text-gray-600");

    // Navigate to step 2
    fireEvent.click(screen.getByText("Financial Summary"));

    await waitFor(() => {
      expect(screen.getByText("1")).toHaveClass("text-white");
      expect(screen.getByText("2")).toHaveClass("text-white");
      expect(screen.getByText("3")).toHaveClass("text-gray-600");
      expect(screen.getByText("4")).toHaveClass("text-gray-600");
    });
  });

  it("shows template visualizations in configuration", async () => {
    renderWithAnalytics(
      <ReportBuilder
        onReportGenerated={mockOnReportGenerated}
        onCancel={mockOnCancel}
      />,
    );

    // Navigate to configuration step with a template
    fireEvent.click(screen.getByText("Financial Summary"));

    await waitFor(() => {
      const revenueCheckbox = screen.getByLabelText(/Total Revenue/);
      fireEvent.click(revenueCheckbox);
    });

    fireEvent.click(screen.getByText("Next")); // To filters
    fireEvent.click(screen.getByText("Next")); // To configuration

    await waitFor(() => {
      expect(screen.getByText("Included Visualizations")).toBeInTheDocument();
      expect(screen.getByText("Revenue Trend")).toBeInTheDocument();
      expect(screen.getByText("Expense Breakdown")).toBeInTheDocument();
    });
  });

  it("validates required fields before generation", async () => {
    renderWithAnalytics(
      <ReportBuilder
        onReportGenerated={mockOnReportGenerated}
        onCancel={mockOnCancel}
      />,
    );

    // Navigate to configuration step
    fireEvent.click(screen.getByText("Financial Summary"));

    await waitFor(() => {
      const revenueCheckbox = screen.getByLabelText(/Total Revenue/);
      fireEvent.click(revenueCheckbox);
    });

    fireEvent.click(screen.getByText("Next")); // To filters
    fireEvent.click(screen.getByText("Next")); // To configuration

    await waitFor(() => {
      expect(screen.getByText("Report Configuration")).toBeInTheDocument();
    });

    // Clear report name
    const nameInput = screen.getByDisplayValue("Financial Summary");
    fireEvent.change(nameInput, { target: { value: "" } });

    // Try to generate
    const generateButton = screen.getByText("Generate Report");
    expect(generateButton).toBeDisabled();
  });

  it("handles initial template prop", async () => {
    const initialTemplate = {
      id: "test-template",
      name: "Test Template",
      description: "Test Description",
      category: "custom" as const,
      type: "summary" as const,
      metrics: ["revenue"],
      filters: [],
      visualizations: [],
    };

    renderWithAnalytics(
      <ReportBuilder
        onReportGenerated={mockOnReportGenerated}
        onCancel={mockOnCancel}
        initialTemplate={initialTemplate}
      />,
    );

    // Should start at step 2 (metrics selection) with template pre-selected
    await waitFor(() => {
      expect(screen.getByText("Select Metrics")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Test Template")).toBeInTheDocument();
    });
  });
});

describe("ReportBuilder Integration", () => {
  it("integrates with AnalyticsEngine context", async () => {
    renderWithAnalytics(
      <ReportBuilder
        onReportGenerated={mockOnReportGenerated}
        onCancel={mockOnCancel}
      />,
    );

    // Complete report generation
    fireEvent.click(screen.getByText("Financial Summary"));

    await waitFor(() => {
      const revenueCheckbox = screen.getByLabelText(/Total Revenue/);
      fireEvent.click(revenueCheckbox);
    });

    fireEvent.click(screen.getByText("Next")); // To filters
    fireEvent.click(screen.getByText("Next")); // To configuration

    await waitFor(() => {
      expect(screen.getByText("Report Configuration")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Generate Report"));

    await waitFor(() => {
      expect(mockOnReportGenerated).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          metrics: expect.any(Array),
          generatedAt: expect.any(Number),
        }),
      );
    });
  });

  it("handles analytics context errors gracefully", async () => {
    // Mock analytics context to throw error
    const mockGenerateReport = vi
      .fn()
      .mockRejectedValue(new Error("Analytics error"));

    vi.doMock("../AnalyticsEngine", async () => {
      const actual = await vi.importActual("../AnalyticsEngine");
      return {
        ...actual,
        useAnalytics: () => ({
          generateReport: mockGenerateReport,
          metrics: [],
          reports: [],
          dashboards: [],
          insights: [],
          isRealTimeEnabled: true,
          refreshInterval: 30000,
          createDashboard: vi.fn(),
          addVisualization: vi.fn(),
          updateMetrics: vi.fn(),
          analyzeTrends: vi.fn(),
          detectAnomalies: vi.fn(),
          generateForecast: vi.fn(),
          updateRefreshInterval: vi.fn(),
          toggleRealTime: vi.fn(),
        }),
      };
    });

    renderWithAnalytics(
      <ReportBuilder
        onReportGenerated={mockOnReportGenerated}
        onCancel={mockOnCancel}
      />,
    );

    // Try to generate report
    fireEvent.click(screen.getByText("Financial Summary"));

    await waitFor(() => {
      const revenueCheckbox = screen.getByLabelText(/Total Revenue/);
      fireEvent.click(revenueCheckbox);
    });

    fireEvent.click(screen.getByText("Next")); // To filters
    fireEvent.click(screen.getByText("Next")); // To configuration

    await waitFor(() => {
      expect(screen.getByText("Report Configuration")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Generate Report"));

    // Should handle error without crashing
    await waitFor(
      () => {
        expect(mockGenerateReport).toHaveBeenCalled();
      },
      { timeout: 5000 },
    );
  });
});
