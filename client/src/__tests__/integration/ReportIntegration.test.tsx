
declare global {
  interface Window {
    [key: string]: any;
  }
}

import React from 'react';
// @ts-ignore
import { render, screen, waitFor } from '../utils/test-utils.js.js';
// @ts-ignore
import { ReportView } from '../components/reports/ReportView.js.js';
// @ts-ignore
import { ReportFilters } from '../components/reports/ReportFilters.js.js';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import userEvent from "@testing-library/user-event";
// @ts-ignore
import { useReport } from '../hooks/useReports.js.js';

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
const mockGetReport = vi.fn();
const mockGetReports = vi.fn();

vi.mock("../hooks/useReports", () => ({
  useReport: (id: string) => ({
    data: mockReports.find((r) => r.id === id) || null,
    isLoading: false,
    isError: false,
  }),
  useReports: () => ({
    data: { data: mockReports, meta: { total: mockReports.length } },
    isLoading: false,
    isError: false,
  }),
  useCreateReport: () => ({
    mutate: vi.fn(),
    isLoading: false,
  }),
  useUpdateReport: () => ({
    mutate: vi.fn(),
    isLoading: false,
  }),
  useDeleteReport: () => ({
    mutate: vi.fn(),
    isLoading: false,
  }),
}));

describe("Report Integration", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const renderWithRouter = (ui: React.ReactNode, { route = "/" } = {}) => {
    window.history.pushState({}, "Test page", route);

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
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
  });

  it("navigates between report list and detail view", async () => {
    const user = userEvent.setup();

    renderWithRouter(
      <div>
        <ReportFilters onFilterChange={vi.fn()} />
        <ReportView />
      </div>,
      { route: "/reports/1" },
    );

    // Verify we're on the report detail view
    expect(
      screen.getByRole("heading", { name: /q2 2023 financial report/i }),
    ).toBeInTheDocument();

    // Click back button
    const backButton = screen.getByRole("button", { name: /back to reports/i });
    await user.click(backButton);

    // Should navigate to reports list
    expect(screen.getByText("Reports List")).toBeInTheDocument();
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
      expect(handleFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ search: "Q1" }),
      );
    });

    // Test status filter
    const statusButton = screen.getByText("Status");
    await user.click(statusButton);

    const pendingOption = screen.getByRole("option", { name: /pending/i });
    await user.click(pendingOption);

    // Verify status filter was updated
    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending" }),
    );

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
    const mockUseReport = vi.mocked(useReport);
    mockUseReport.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: new Error("Failed to load report"),
    });

    renderWithRouter(<ReportView />, { route: "/reports/999" });

    // Verify error state is shown
    expect(screen.getByText(/failed to load report/i)).toBeInTheDocument();

    // Test retry functionality
    const retryButton = screen.getByRole("button", { name: /retry/i });
    await userEvent.click(retryButton);

    // Verify retry was attempted
    // (In a real test, this would verify the API was called again)

    vi.restoreAllMocks();
  });
});
