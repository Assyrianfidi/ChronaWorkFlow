declare global {
  interface Window {
    [key: string]: any;
  }
}

import {
  screen,
  renderWithProviders,
  getMockNavigate,
  resetMockNavigate,
} from '../../test-utils';
import { vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { ReportView } from '../components/reports/ReportView';
import { useReport } from '../hooks/useReports';

// Mock the useToast hook
const mockToast = vi.fn();
vi.mock("../components/ui/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock the useReport hook
vi.mock("../hooks/useReports", () => ({
  useReport: vi.fn(),
}));

const mockReport = {
  id: "1",
  title: "Q2 2023 Financial Report",
  description: "<p>This is a detailed financial report for Q2 2023.</p>",
  amount: 125000,
  status: "approved" as const,
  date: "2023-07-15",
  category: "financial",
  createdAt: "2023-07-15T10:00:00Z",
  updatedAt: "2023-07-16T15:30:00Z",
  userId: "user123",
  submittedAt: "2023-07-14T09:00:00Z",
  approvedAt: "2023-07-16T15:30:00Z",
  approvedBy: "admin123",
  createdBy: {
    id: "user123",
    name: "John Doe",
    email: "john.doe@example.com",
  },
  notes: "This report has been reviewed and approved.",
  attachments: [
    {
      id: "att1",
      name: "financial_summary.pdf",
      url: "/attachments/financial_summary.pdf",
      size: 1024,
      type: "application/pdf",
      uploadedAt: "2023-07-15T10:30:00Z",
    },
  ],
};

describe("ReportView", () => {
  const mockUseReport = useReport as vi.Mock;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Default mock implementation
    mockUseReport.mockReturnValue({
      data: mockReport,
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  it("shows loading state", () => {
    mockUseReport.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    renderWithProviders(<ReportView />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows error state", () => {
    mockUseReport.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { message: "Failed to load report" },
    });

    renderWithProviders(<ReportView />);

    expect(screen.getByText(/failed to load report/i)).toBeInTheDocument();
  });

  it("renders report details correctly", async () => {
    // Mock the useReport hook to return our test data
    mockUseReport.mockReturnValue({
      data: mockReport,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<ReportView />);

    // Check report title
    expect(
      await screen.findByRole("heading", { name: /q2 2023 financial report/i }),
    ).toBeInTheDocument();

    // Check status badge - the component shows the status with first letter capitalized
    expect(screen.getByText(/approved/i)).toBeInTheDocument();

    // Check amount - the component formats the amount with currency
    expect(screen.getByText(/\$125,000(\.00)?/i)).toBeInTheDocument();

    // Check created by
    expect(screen.getByText(/john doe/i)).toBeInTheDocument();

    // Check dates - the component formats dates to be more readable
    expect(screen.getByText(/july 15, 2023/i)).toBeInTheDocument();

    // Check description - the component renders HTML content
    expect(
      screen.getByText(/this is a detailed financial report for q2 2023/i),
    ).toBeInTheDocument();

    // Check attachments section
    expect(screen.getByText(/attachments/i)).toBeInTheDocument();
    expect(screen.getByText(/financial_summary\.pdf/i)).toBeInTheDocument();
  });

  it("handles print button click", async () => {
    mockUseReport.mockReturnValue({
      data: mockReport,
      isLoading: false,
      isError: false,
    });

    resetMockNavigate();
    const user = userEvent.setup();
    renderWithProviders(<ReportView />);

    // Wait for the component to render with the mock data
    await screen.findByRole("heading", { name: /q2 2023 financial report/i });

    // The print button should be in the document
    const printButton = screen.getByRole("button", { name: /print/i });

    // Simulate clicking the print button
    await user.click(printButton);

    // Verify that window.print was called
    expect(window.print).toHaveBeenCalled();
  });

  it("handles export to PDF", async () => {
    mockUseReport.mockReturnValue({
      data: mockReport,
      isLoading: false,
      isError: false,
    });

    resetMockNavigate();
    const { user } = renderWithProviders(<ReportView />);

    // Wait for the component to render with the mock data
    await screen.findByRole("heading", { name: /q2 2023 financial report/i });

    // The PDF export button should be in the document
    const pdfButton = screen.getByRole("button", { name: /pdf/i });

    // Simulate clicking the PDF export button
    await user.click(pdfButton);

    // Verify that the toast was shown with the correct message
    expect(mockToast).toHaveBeenCalledWith({
      title: "Exporting report",
      description: "Exporting report in PDF format...",
    });
  });

  it("handles back navigation", async () => {
    mockUseReport.mockReturnValue({
      data: mockReport,
      isLoading: false,
      isError: false,
    });

    const user = userEvent.setup();
    resetMockNavigate();
    renderWithProviders(<ReportView />);

    // Wait for the component to render with the mock data
    await screen.findByRole("heading", { name: /q2 2023 financial report/i });

    // The back button should be in the document
    const backButton = screen.getByRole("button", { name: /back to reports/i });

    // Simulate clicking the back button
    await user.click(backButton);

    // Verify that the navigate function was called with -1 (go back)
    expect(getMockNavigate()).toHaveBeenCalledWith(-1);
  });

  it("displays empty state when no attachments", async () => {
    mockUseReport.mockReturnValue({
      data: { ...mockReport, attachments: [] },
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<ReportView />);

    // Wait for loading to complete
    await screen.findByText("Q2 2023 Financial Report");

    // The attachments section should not be rendered when there are no attachments
    expect(screen.queryByText(/attachments/i)).not.toBeInTheDocument();
  });

  it("displays empty state when no notes", async () => {
    mockUseReport.mockReturnValue({
      data: { ...mockReport, notes: "" },
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<ReportView />);

    // Wait for loading to complete
    await screen.findByText("Q2 2023 Financial Report");

    // The notes section should not be rendered when there are no notes
    expect(screen.queryByText(/notes/i)).not.toBeInTheDocument();
  });

  it("displays different status badges correctly", async () => {
    const statuses = [
      { status: "pending" as const, label: "Pending" },
      { status: "approved" as const, label: "Approved" },
      { status: "rejected" as const, label: "Rejected" },
    ];

    for (const { status, label } of statuses) {
      // Set up the mock for this iteration
      mockUseReport.mockReturnValue({
        data: { ...mockReport, status },
        isLoading: false,
        isError: false,
      });

      // Render the component
      const { unmount } = renderWithProviders(<ReportView />);

      try {
        // Wait for the component to render with the mock data
        await screen.findByText(label);

        // The status should be displayed with the first letter capitalized
        expect(screen.getByText(label)).toBeInTheDocument();
      } finally {
        // Make sure we clean up after each iteration
        unmount();
      }
    }
  });

  it("handles edit button click", async () => {
    mockUseReport.mockReturnValue({
      data: mockReport,
      isLoading: false,
      isError: false,
    });

    const user = userEvent.setup();
    resetMockNavigate();
    renderWithProviders(<ReportView />);

    // Wait for the component to render with the mock data
    await screen.findByRole("heading", { name: /q2 2023 financial report/i });

    // The edit button should be in the document
    const editButton = screen.getByRole("button", { name: /edit/i });

    // Simulate clicking the edit button
    await user.click(editButton);

    // Verify that the navigate function was called with the correct path
    expect(getMockNavigate()).toHaveBeenCalledWith("/reports/1/edit");
  });
});
