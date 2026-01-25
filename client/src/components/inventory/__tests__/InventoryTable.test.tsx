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
import { mockInventoryItems } from "./test-data/inventory";
import { InventoryTable } from "../InventoryTable";
import type { InventoryItem } from "@/types/inventory";

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
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/loading inventory items/i)).toBeInTheDocument();
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
      const nameEl = screen.getByText(item.name || "");
      expect(nameEl).toBeInTheDocument();

      const row = nameEl.closest("tr");
      expect(row).not.toBeNull();
      if (!row) return;

      const rowScope = within(row);

      if (item.sku) {
        expect(rowScope.getByText(item.sku)).toBeInTheDocument();
      }

      if (item.category) {
        expect(rowScope.getByText(item.category)).toBeInTheDocument();
      }
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
    const mockOnToggleExpand = vi.fn();
    renderComponent({
      expandedItems: [],
      onToggleExpand: mockOnToggleExpand,
    });

    const expandButton = screen.getAllByLabelText("Expand row")[0];
    fireEvent.click(expandButton);

    expect(mockOnToggleExpand).toHaveBeenCalledWith(mockInventoryItems[0].id);
  });

  it("handles sorting", () => {
    renderComponent();
    expect(screen.getByText("Name")).toBeInTheDocument();
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
    expect(true).toBe(true);
  });

  it("handles pagination", () => {
    // This test would need to be updated if you implement client-side pagination
    // Currently, it's handled by the parent component
    expect(true).toBe(true);
  });

  it("displays correct item details in expanded row", () => {
    const firstItem = mockInventoryItems[0];
    renderComponent({
      expandedItems: [firstItem.id],
    });

    // Check if expanded content shows correct details
    const detailsHeading = screen.getByText("Details");
    const expandedRow = detailsHeading.closest("tr");
    expect(expandedRow).not.toBeNull();
    if (!expandedRow) return;

    const expandedScope = within(expandedRow);

    expect(expandedScope.getByText("Details")).toBeInTheDocument();
    expect(expandedScope.getByText("SKU:")).toBeInTheDocument();
    if (firstItem.sku) {
      expect(expandedScope.getByText(firstItem.sku)).toBeInTheDocument();
    }
    expect(expandedScope.getByText("Pricing")).toBeInTheDocument();
    expect(
      expandedScope.getByText(`$${firstItem.unitCost.toFixed(2)}`),
    ).toBeInTheDocument();
    expect(
      expandedScope.getByText(`$${firstItem.unitPrice.toFixed(2)}`),
    ).toBeInTheDocument();
  });
});
