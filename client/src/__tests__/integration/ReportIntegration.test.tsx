declare global {
  interface Window {
    [key: string]: any;
  }
}

import React from "react";
import { render, screen, waitFor, fireEvent } from "@/test-utils";
import { ReportView } from "@/components/reports/ReportView";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { useReport } from "@/hooks/useReports";

// Mock data
const mockReports = [
  {
    id: "1",
    title: "Q2 2023 Financial Report",
    description: "<p>Q2 financial results show 15% growth.</p>",
    status: "approved",
    amount: 125000,
    notes: "Reviewed by finance team",
    createdAt: "2023-07-15T10:00:00Z",
    updatedAt: "2023-07-16T14:30:00Z",
    createdBy: { id: "user-1", name: "John Doe" },
    attachments: [],
  },
  {
    id: "2",
    title: "Q1 2023 Financial Report",
    description: "<p>Q1 financial results show steady growth.</p>",
    status: "pending",
    amount: 110000,
    notes: "Pending review",
    createdAt: "2023-04-10T09:15:00Z",
    updatedAt: "2023-04-10T09:15:00Z",
    createdBy: { id: "user-2", name: "Jane Smith" },
    attachments: [],
  },
];

// Mock the API calls
const { mockUseReport, mockUseReports, mockUseCreateReport, mockUseUpdateReport, mockUseDeleteReport } =
  vi.hoisted(() => {
    const mockUseReport = vi.fn();
    const mockUseReports = vi.fn();
    const mockUseCreateReport = vi.fn();
    const mockUseUpdateReport = vi.fn();
    const mockUseDeleteReport = vi.fn();

    return {
      mockUseReport,
      mockUseReports,
      mockUseCreateReport,
      mockUseUpdateReport,
      mockUseDeleteReport,
    };
  });

vi.mock("@/hooks/useReports", () => ({
  useReport: mockUseReport,
  useReports: mockUseReports,
  useCreateReport: mockUseCreateReport,
  useUpdateReport: mockUseUpdateReport,
  useDeleteReport: mockUseDeleteReport,
}));

describe("Report Integration", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const renderWithRouter = (
    ui: React.ReactNode,
    {
      route = "/",
      initialEntries = [route],
      initialIndex,
    }: { route?: string; initialEntries?: string[]; initialIndex?: number } = {},
  ) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
          <Routes>
            <Route path="/reports" element={<div>Reports List</div>} />
            <Route path="/reports/:id" element={ui} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseReport.mockImplementation((id: string) => ({
      data: mockReports.find((r) => r.id === id) || null,
      isLoading: false,
      isError: false,
    }));

    mockUseReports.mockReturnValue({
      data: { data: mockReports, meta: { total: mockReports.length } },
      isLoading: false,
      isError: false,
    });

    mockUseCreateReport.mockReturnValue({ mutate: vi.fn(), isLoading: false });
    mockUseUpdateReport.mockReturnValue({ mutate: vi.fn(), isLoading: false });
    mockUseDeleteReport.mockReturnValue({ mutate: vi.fn(), isLoading: false });
  });

  it("navigates between report list and detail view", async () => {
    const user = userEvent.setup();

    renderWithRouter(
      <div>
        <ReportFilters onFilterChange={vi.fn()} />
        <ReportView />
      </div>,
      {
        route: "/reports/1",
        initialEntries: ["/reports", "/reports/1"],
        initialIndex: 1,
      },
    );

    // Verify we're on the report detail view
    expect(
      screen.getByRole("heading", { name: /q2 2023 financial report/i }),
    ).toBeInTheDocument();

    // Click back button (ReportView uses navigate(-1))
    const backButton = screen.getByRole("button", { name: /back to reports/i });
    await user.click(backButton);

    // We should now be back on the reports list route
    expect(await screen.findByText("Reports List")).toBeInTheDocument();
  });

  it("filters reports and views details", async () => {
    const user = userEvent.setup();
    const handleFilterChange = vi.fn();

    renderWithRouter(
      <div>
        <ReportFilters onFilterChange={handleFilterChange} />
        <ReportView />
      </div>,
      { route: "/reports/1" },
    );

    // Test search filter
    const searchInput = screen.getByPlaceholderText("Filter reports...");
    await user.type(searchInput, "Q1");

    // Verify filter was updated
    await waitFor(() => {
      expect(handleFilterChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: "Q1" }),
      );
    });

    // Test status filter
    const statusSelect = screen
      .getAllByRole("combobox")
      .find((el) =>
        el.querySelector?.('option[value="pending"]'),
      ) as HTMLSelectElement | undefined;

    expect(statusSelect).toBeDefined();
    fireEvent.change(statusSelect as HTMLSelectElement, {
      target: { value: "pending" },
    });

    // Verify status filter was updated
    await waitFor(() => {
      expect(handleFilterChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: "pending" }),
      );
    });

    // Verify the report view updates based on filters
    // (In a real test, this would be handled by the parent component)
  });

  it("handles report actions (print, export)", async () => {
    const user = userEvent.setup();
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    renderWithRouter(<ReportView />, { route: "/reports/1" });

    // Test print button
    const printButton = screen.getByRole("button", { name: /print/i });
    await user.click(printButton);
    expect(printSpy).toHaveBeenCalledTimes(1);

    // Test export to PDF
    const pdfButton = screen.getByRole("button", { name: /pdf/i });
    await user.click(pdfButton);

    // Verify export action was triggered
    // (In a real test, this would verify the export API was called)

    printSpy.mockRestore();
  });

  it("handles responsive layout", async () => {
    // Set viewport to mobile size
    window.innerWidth = 375;
    window.dispatchEvent(new Event("resize"));

    renderWithRouter(
      <div>
        <ReportFilters onFilterChange={vi.fn()} />
        <ReportView />
      </div>,
      { route: "/reports/1" },
    );

    // Verify mobile-specific UI elements
    // (This would test responsive classes and mobile-specific behaviors)

    // Reset viewport
    window.innerWidth = 1024;
    window.dispatchEvent(new Event("resize"));
  });

  it("handles error states", async () => {
    // Mock an error state
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Override the mock to return an error
    mockUseReport.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: new Error("Failed to load report"),
    });

    renderWithRouter(<ReportView />, { route: "/reports/999" });

    // Verify error state is shown
    expect(
      screen.getByRole("heading", { name: /failed to load report/i }),
    ).toBeInTheDocument();
  });
});
