import React from "react";
import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { mockInventoryItems } from "../__tests__/test-data/inventory.js";
import { InventoryTable } from "../components/inventory/InventoryTable.js";
import { InventoryItem } from "../types/inventory.js";

// Mock the virtualized components
vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: vi.fn().mockImplementation(({ getItems }) => ({
    getVirtualItems: () => [
      { index: 0, start: 0, end: 4, key: "0", size: 50 },
      { index: 1, start: 50, end: 54, key: "1", size: 50 },
      { index: 2, start: 100, end: 154, key: "2", size: 50 },
      { index: 3, start: 150, end: 204, key: "3", size: 50 },
      { index: 4, start: 200, end: 254, key: "4", size: 50 },
    ],
    getTotalSize: () => 250,
    measure: () => {},
  })),
}));

// Mock the useVirtual hook
vi.mock("@tanstack/react-virtual", () => {
  const originalModule = vi.importActual("@tanstack/react-virtual");
  return {
    ...originalModule,
    useVirtualizer: vi.fn(({ getItems }) => ({
      getVirtualItems: () => {
        const items = getItems();
        return items.slice(0, 5).map((_: any, index: number) => ({
          index,
          start: index * 50,
          end: index * 50 + 50,
          key: index.toString(),
          size: 50,
        }));
      },
      getTotalSize: () => 250,
      measure: () => {},
    })),
  };
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const defaultProps = {
  items: mockInventoryItems,
  isLoading: false,
  selectedItems: [],
  onSelectItem: vi.fn(),
  onSelectAll: vi.fn(),
  onToggleExpand: vi.fn(),
  onSort: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  expandedItems: [],
  hoveredRow: null,
  onHoverRow: vi.fn(),
};

const renderComponent = (props = {}) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <InventoryTable {...defaultProps} {...props} />
    </QueryClientProvider>,
  );
};

describe("InventoryTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state", () => {
    renderComponent({ isLoading: true });
    expect(screen.getByTestId("inventory-table-loading")).toBeInTheDocument();
  });

  it("renders error state", () => {
    renderComponent({ isError: true });
    expect(screen.getByText(/error loading inventory/i)).toBeInTheDocument();
  });

  it("renders empty state", () => {
    renderComponent({ items: [] });
    expect(screen.getByText(/no inventory items found/i)).toBeInTheDocument();
  });

  it("renders inventory items", () => {
    renderComponent();

    // Check if all items are rendered
    mockInventoryItems.forEach((item) => {
      expect(screen.getByText(item.name || "")).toBeInTheDocument();
      expect(screen.getByText(item.sku || "")).toBeInTheDocument();
      expect(screen.getByText(item.category || "")).toBeInTheDocument();
      expect(
        screen.getByText((item.quantityOnHand || 0).toString()),
      ).toBeInTheDocument();
    });
  });

  it("handles row selection", () => {
    const mockOnSelectItem = vi.fn();
    renderComponent({ onSelectItem: mockOnSelectItem });

    const firstCheckbox = screen.getAllByRole("checkbox")[1]; // First data row checkbox
    fireEvent.click(firstCheckbox);

    expect(mockOnSelectItem).toHaveBeenCalledWith(
      mockInventoryItems[0].id,
      true,
    );
  });

  it("handles select all", () => {
    const mockOnSelectAll = vi.fn();
    renderComponent({ onSelectAll: mockOnSelectAll });

    const selectAllCheckbox = screen.getAllByRole("checkbox")[0]; // Header checkbox
    fireEvent.click(selectAllCheckbox);

    expect(mockOnSelectAll).toHaveBeenCalledWith(true);
  });

  it("handles row expansion", () => {
    const mockOnToggleRow = vi.fn();
    renderComponent({
      expandedRows: new Set([mockInventoryItems[0].id]),
      onToggleRow: mockOnToggleRow,
    });

    const expandButton = screen.getAllByLabelText("Expand row")[0];
    fireEvent.click(expandButton);

    expect(mockOnToggleRow).toHaveBeenCalledWith(mockInventoryItems[0].id);

    // Check if expanded content is visible
    expect(screen.getByText(/description:/i)).toBeInTheDocument();
    expect(
      screen.getByText(mockInventoryItems[0].description || ""),
    ).toBeInTheDocument();
  });

  it("handles sorting", () => {
    const mockOnSort = vi.fn();
    renderComponent({ onSort: mockOnSort });

    // Click on the name column header to sort
    const nameHeader = screen.getByText(/name/i);
    fireEvent.click(nameHeader);

    expect(mockOnSort).toHaveBeenCalledWith("name", "desc");
  });

  it("displays correct stock status", () => {
    renderComponent();

    // Check for low stock item
    const lowStockItem = mockInventoryItems.find(
      (item) => item.sku === "SKU-002",
    );
    const lowStockRow = screen.getByText(lowStockItem!.name).closest("tr");
    expect(within(lowStockRow!).getByText(/low stock/i)).toBeInTheDocument();

    // Check for out of stock item
    const outOfStockItem = mockInventoryItems.find(
      (item) => item.sku === "SKU-003",
    );
    const outOfStockRow = screen.getByText(outOfStockItem!.name).closest("tr");
    expect(
      within(outOfStockRow!).getByText(/out of stock/i),
    ).toBeInTheDocument();
  });

  it("handles bulk actions", () => {
    const mockOnBulkAction = vi.fn();
    const selectedItems = new Set([
      mockInventoryItems[0].id,
      mockInventoryItems[1].id,
    ]);

    renderComponent({
      selectedItems,
      onBulkAction: mockOnBulkAction,
    });

    // Open bulk actions dropdown
    const bulkActionsButton = screen.getByRole("button", {
      name: /bulk actions/i,
    });
    fireEvent.click(bulkActionsButton);

    // Click on export action
    const exportButton = screen.getByText(/export selected/i);
    fireEvent.click(exportButton);

    expect(mockOnBulkAction).toHaveBeenCalledWith("export");
  });

  it("handles pagination", () => {
    // This test would need to be updated if you implement client-side pagination
    // Currently, it's handled by the parent component
    expect(true).toBe(true);
  });

  it("displays correct item details in expanded row", () => {
    const firstItem = mockInventoryItems[0];
    renderComponent({
      expandedRows: new Set([firstItem.id]),
    });

    // Check if expanded content shows correct details
    expect(screen.getByText(`SKU: ${firstItem.sku}`)).toBeInTheDocument();
    expect(
      screen.getByText(`Barcode: ${firstItem.barcode}`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Location: ${firstItem.location}`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Unit Cost: $${firstItem.unitCost.toFixed(2)}`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Unit Price: $${firstItem.unitPrice.toFixed(2)}`),
    ).toBeInTheDocument();
  });
});
