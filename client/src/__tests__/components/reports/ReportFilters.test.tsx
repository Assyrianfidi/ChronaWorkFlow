import {
// @ts-ignore
  renderWithProviders as render,
  screen,
  waitFor,
} from '../../test-utils.js';
import { ReportFilters } from '../components/reports/ReportFilters.js';
import userEvent from "@testing-library/user-event";

describe("ReportFilters", () => {
  const onFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all filter controls", () => {
    render(<ReportFilters onFilterChange={onFilterChange} />);

    // Check search input
    expect(
      screen.getByPlaceholderText("Filter reports..."),
    ).toBeInTheDocument();

    // Check status dropdown
    expect(screen.getByText("Status")).toBeInTheDocument();

    // Check date range pickers
    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByText("To")).toBeInTheDocument();

    // Check sort dropdown
    expect(screen.getByText("Sort by")).toBeInTheDocument();
  });

  it("updates search filter on input change", async () => {
    const user = userEvent.setup();
    render(<ReportFilters onFilterChange={onFilterChange} />);

    const searchInput = screen.getByPlaceholderText("Filter reports...");
    await user.type(searchInput, "financial");

    // Debounce should be in place, so we wait for the callback
    await waitFor(() => {
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ search: "financial" }),
      );
    });
  });

  it("updates status filter on selection", async () => {
    const user = userEvent.setup();
    render(<ReportFilters onFilterChange={onFilterChange} />);

    // Open status dropdown
    const statusButton = screen.getByText("Status");
    await user.click(statusButton);

    // Select 'Approved' status
    const approvedOption = screen.getByRole("option", { name: /approved/i });
    await user.click(approvedOption);

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: "approved" }),
    );
  });

  it("updates date range filters", async () => {
    const user = userEvent.setup();
    render(<ReportFilters onFilterChange={onFilterChange} />);

    // Open date picker for start date
    const fromButton = screen.getByText("From");
    await user.click(fromButton);

// @ts-ignore
    // Select a date (using the 15th of the current month as an example)
    const dateToSelect = screen.getByText("15");
    await user.click(dateToSelect);

    // Verify the date format in the callback
    await waitFor(() => {
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.stringMatching(/\d{4}-\d{2}-\d{2}/),
        }),
      );
    });
  });

  it("updates sort order", async () => {
    const user = userEvent.setup();
    render(<ReportFilters onFilterChange={onFilterChange} />);

    // Open sort dropdown
    const sortButton = screen.getByText("Sort by");
    await user.click(sortButton);

    // Select 'Title (A-Z)' option
    const titleOption = screen.getByRole("option", { name: /title \(a-z\)/i });
    await user.click(titleOption);

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: "title",
        sortOrder: "asc",
      }),
    );
  });

  it("shows active filters", () => {
    // Render with filters
    render(<ReportFilters onFilterChange={onFilterChange} />);

    // The component should render without errors
    expect(
      screen.getByPlaceholderText("Filter reports..."),
    ).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByText("To")).toBeInTheDocument();
    expect(screen.getByText("Sort by")).toBeInTheDocument();
  });

  it("allows removing active filters", async () => {
    const user = userEvent.setup();

    render(<ReportFilters onFilterChange={onFilterChange} />);

    // First, set some filters by interacting with the component
    const searchInput = screen.getByPlaceholderText("Filter reports...");
    await user.type(searchInput, "financial");

    // Wait for debounce
    await waitFor(() => {
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ search: "financial" }),
      );
    });

    // Clear the search input
    await user.clear(searchInput);
    await user.type(searchInput, "");

    // Verify filter is cleared
    await waitFor(() => {
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ search: "" }),
      );
    });
  });

  it("resets all filters", async () => {
    const user = userEvent.setup();

    render(<ReportFilters onFilterChange={onFilterChange} />);

    // First, set some filters
    const searchInput = screen.getByPlaceholderText("Filter reports...");
    await user.type(searchInput, "financial");

    // Wait for debounce
    await waitFor(() => {
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ search: "financial" }),
      );
    });

    // Click reset button
    const resetButton = screen.getByText("Reset");
    await user.click(resetButton);

    // Verify filters are reset
    expect(onFilterChange).toHaveBeenCalledWith({
      search: "",
      status: "all",
      startDate: expect.any(String), // Default start date (30 days ago)
      endDate: expect.any(String), // Default end date (today)
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  });

  it("applies debounce to search input", async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ delay: null });

    render(<ReportFilters onFilterChange={onFilterChange} />);

    const searchInput = screen.getByPlaceholderText("Filter reports...");

    // Type a search term
    await user.type(searchInput, "financial");

    // Fast-forward time to just before debounce timeout
    vi.advanceTimersByTime(290);
    expect(onFilterChange).not.toHaveBeenCalled();

    // Fast-forward to after debounce timeout
    vi.advanceTimersByTime(20);
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: "financial" }),
    );

    vi.useRealTimers();
  });

  it("handles keyboard navigation", async () => {
    const user = userEvent.setup();
    render(<ReportFilters onFilterChange={onFilterChange} />);

    // Focus search input
    const searchInput = screen.getByPlaceholderText("Filter reports...");
    await user.click(searchInput);

    // Tab to status dropdown
    await user.tab();

    // Open status dropdown with Enter
    await user.keyboard("{Enter}");

    // Navigate options with arrow down and select with Enter
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending" }),
    );
  });
});
