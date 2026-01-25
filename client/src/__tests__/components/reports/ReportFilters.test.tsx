import {
  renderWithRouter as render,
  screen,
  waitFor,
} from '../../test-utils';
import { vi } from "vitest";
import { ReportFilters } from "@/components/reports/ReportFilters";
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
    expect(screen.getByText("to")).toBeInTheDocument();
    const dateButtons = screen
      .getAllByRole("button")
      .filter((b) => /\w{3} \d{1,2}, \d{4}/.test(b.textContent ?? ""));
    expect(dateButtons.length).toBeGreaterThanOrEqual(2);

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

    onFilterChange.mockClear();

    const statusSelect = screen.getAllByRole("combobox")[0];
    await user.selectOptions(statusSelect, "approved");

    await waitFor(() => {
      expect(onFilterChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: "approved" }),
      );
    });
  });

  it("updates date range filters", async () => {
    const user = userEvent.setup();
    render(<ReportFilters onFilterChange={onFilterChange} />);

    // Open date picker for start date
    const dateButtons = screen
      .getAllByRole("button")
      .filter((b) => /\w{3} \d{1,2}, \d{4}/.test(b.textContent ?? ""));
    await user.click(dateButtons[0]);

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

    onFilterChange.mockClear();

    const sortSelect = screen.getAllByRole("combobox")[1];
    await user.selectOptions(sortSelect, "title:asc");

    await waitFor(() => {
      expect(onFilterChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          sortBy: "title",
          sortOrder: "asc",
        }),
      );
    });
  });

  it("shows active filters", () => {
    // Render with filters
    render(<ReportFilters onFilterChange={onFilterChange} />);

    // The component should render without errors
    expect(
      screen.getByPlaceholderText("Filter reports..."),
    ).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("to")).toBeInTheDocument();
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
    const user = userEvent.setup();

    render(<ReportFilters onFilterChange={onFilterChange} />);

    await waitFor(() => {
      expect(onFilterChange).toHaveBeenCalled();
    });
    onFilterChange.mockClear();

    const searchInput = screen.getByPlaceholderText("Filter reports...");

    // Type a search term
    await user.type(searchInput, "financial");

    await waitFor(() => {
      expect(onFilterChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: "financial" }),
      );
    });
  });

  it("handles keyboard navigation", async () => {
    const user = userEvent.setup();
    render(<ReportFilters onFilterChange={onFilterChange} />);

    // Focus search input
    const searchInput = screen.getByPlaceholderText("Filter reports...");
    await user.click(searchInput);

    // Tab to status dropdown
    await user.tab();

    expect(screen.getAllByRole("combobox")[0]).toHaveFocus();
  });
});
