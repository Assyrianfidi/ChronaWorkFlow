import React, { useState } from "react";
("use client");

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "use-debounce";
import {
  useInventoryItems,
  useInventoryStats,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  useBulkUpdateInventoryItems,
  useExportInventory,
  type InventoryQueryOptions,
} from "@/components/hooks/use-inventory";
type SortDirection = "asc" | "desc";
import type {
  InventoryItem,
  InventoryStats,
  InventoryStatus,
  InventoryResponse,
  InventoryFilterOptions,
  BulkUpdatePayload,
  ExportOptions,
} from "@/components/types/inventory";
import { Button } from "@/components/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/components/ui/card";
import { Input } from "@/components/components/ui/input";
import { Badge } from "@/components/components/ui/badge";
import {
  Plus,
  Search,
  AlertTriangle,
  Package,
  TrendingUp,
  X,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  FileSpreadsheet,
  FileType2,
} from "lucide-react";
import { InventoryTable } from "@/components/components/inventory/InventoryTable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/components/ui/dropdown-menu";
import { Checkbox } from "@/components/components/ui/checkbox";
import { Label } from "@/components/components/ui/label";
import { toast } from "@/components/components/ui/use-toast";
import { DashboardShell } from "@/components/components/ui/layout/DashboardShell";

// Utility functions for inventory calculations
const getLowStockItems = (items: InventoryItem[]): InventoryItem[] =>
  items.filter(
    (item) =>
      item.quantityOnHand > 0 &&
      item.quantityOnHand <= (item.reorderPoint || 0),
  );

const getOutOfStockItems = (items: InventoryItem[]): InventoryItem[] =>
  items.filter((item) => item.quantityOnHand <= 0);

const getInventoryValue = (items: InventoryItem[]): number =>
  items.reduce(
    (sum, item) => sum + item.quantityOnHand * (item.unitCost || 0),
    0,
  );

const getInventoryStatus = (item: InventoryItem): InventoryStatus => {
  if (item.quantityOnHand <= 0) return "out_of_stock";
  if (item.quantityOnHand <= (item.reorderPoint || 0)) return "low_stock";
  return "in_stock";
};

const DEFAULT_PAGE_SIZE = 20;

export default function InventoryPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    searchTerm: "",
    selectedCategory: undefined as string | undefined,
    statusFilter: undefined as InventoryStatus | undefined,
    sortBy: "name",
    sortOrder: "asc" as SortDirection,
    page: 1,
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const debouncedSearch = useDebounce(filters.searchTerm, 300);

  // Query options for inventory items
  const queryOptions: InventoryQueryOptions = useMemo(
    () => ({
      search: filters.searchTerm,
      categories: filters.selectedCategory ? [filters.selectedCategory] : [],
      status: filters.statusFilter,
      sortBy: filters.sortBy,
      sortDirection: filters.sortOrder,
      page: filters.page,
      pageSize: DEFAULT_PAGE_SIZE,
    }),
    [filters],
  );

  // Stats query options
  const statsQueryOptions: Omit<
    InventoryQueryOptions,
    "sortBy" | "page" | "sortDirection" | "pageSize"
  > = useMemo(
    () => ({
      search: filters.searchTerm,
      categories: filters.selectedCategory ? [filters.selectedCategory] : [],
      status: filters.statusFilter,
    }),
    [filters.searchTerm, filters.selectedCategory, filters.statusFilter],
  );

  // Fetch inventory data using hooks
  const {
    data: inventoryItems = [],
    isLoading: isLoadingItems,
    isError: itemsError,
    refetch: refetchItems,
  } = useInventoryItems(queryOptions);

  // Fetch inventory stats using hooks
  const {
    data: calculatedStats = {
      totalItems: 0,
      totalValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      categories: [],
      lastUpdated: new Date().toISOString(),
    },
    isLoading: isLoadingStats,
    isError: statsError,
  } = useInventoryStats(statsQueryOptions);

  // Calculate derived data
  const totalValue = useMemo(
    () =>
      inventoryItems.reduce(
        (sum: number, item: InventoryItem) =>
          sum + item.quantityOnHand * item.unitCost,
        0,
      ),
    [inventoryItems],
  );

  const lowStockItems = useMemo(
    () =>
      inventoryItems.filter(
        (item: InventoryItem) => item.quantityOnHand < item.reorderPoint,
      ),
    [inventoryItems],
  );

  const outOfStockItems = useMemo(
    () =>
      inventoryItems.filter((item: InventoryItem) => item.quantityOnHand === 0),
    [inventoryItems],
  );

  // Event handlers
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, searchTerm: e.target.value }));
  }, []);

  const handleStatusChange = useCallback(
    (status: InventoryStatus | undefined) => {
      setFilters((prev) => ({ ...prev, statusFilter: status }));
    },
    [],
  );

  const handleSort = useCallback((column: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  }, []);

  const handleSelectItem = useCallback((id: string, isSelected: boolean) => {
    setSelectedIds((prev) => {
      const newSelection = new Set(prev);
      if (isSelected) {
        newSelection.add(id);
      } else {
        newSelection.delete(id);
      }
      return newSelection;
    });
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(new Set(inventoryItems.map((item) => item.id)));
      } else {
        setSelectedIds(new Set());
      }
    },
    [inventoryItems],
  );

  const handleToggleRow = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return newExpanded;
    });
  }, []);

  const handleToggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handleCategoryChange = useCallback((category: string | undefined) => {
    setFilters((prev) => ({ ...prev, selectedCategory: category }));
  }, []);

  const handleAdjustStock = useCallback((item: any) => {
    console.log("Adjust stock for:", item);
  }, []);

  // Toggle row expansion
  const toggleRowExpand = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return newExpanded;
    });
  }, []);

  // Handle bulk actions
  const handleBulkAction = useCallback(
    (action: "activate" | "deactivate" | "export" | "delete") => {
      if (selectedIds.size === 0) return;

      switch (action) {
        case "activate":
          // Implement bulk activate
          console.log("Activate items:", Array.from(selectedIds));
          break;
        case "deactivate":
          // Implement bulk deactivate
          console.log("Deactivate items:", Array.from(selectedIds));
          break;
        case "export":
          // Implement bulk export
          console.log("Export items:", Array.from(selectedIds));
          break;
        case "delete":
          // Implement bulk delete
          if (
            confirm(
              `Are you sure you want to delete ${selectedIds.size} items?`,
            )
          ) {
            console.log("Delete items:", Array.from(selectedIds));
          }
          break;
      }
    },
    [selectedIds],
  );

  return (
    <DashboardShell>
      <div className="container mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
            <p className="text-muted-foreground">
              Manage your inventory items, stock levels, and purchase orders
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={() => router.push("/inventory/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {calculatedStats.totalItems}
              </div>
              <p className="text-xs text-muted-foreground">
                Items in inventory
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                $
                {calculatedStats.totalValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Current inventory value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {calculatedStats.lowStockCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Items below reorder point
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Out of Stock
              </CardTitle>
              <X className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {calculatedStats.outOfStockCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Items with zero quantity
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="relative w-full md:w-auto">
            {/* a11y: id + label + aria-describedby added for inventory filters search */}
            <label htmlFor="inventory-filter-search" className="sr-only">
              Search inventory items
            </label>
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="inventory-filter-search"
              placeholder="Search items..."
              value={filters.searchTerm}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, searchTerm: e.target.value }))
              }
              className="pl-10 w-full md:w-[300px]"
              aria-describedby="inventory-filter-search-help"
            />
            <p id="inventory-filter-search-help" className="sr-only">
              Filter inventory items by name, category, or other properties.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {filters.statusFilter && <span className="ml-1">(1)</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="filter-in-stock"
                      checked={filters.statusFilter === "in_stock"}
                      onCheckedChange={(checked) => {
                        setFilters((prev) => ({
                          ...prev,
                          statusFilter: checked ? "in_stock" : undefined,
                        }));
                      }}
                    />
                    <Label htmlFor="filter-in-stock" className="cursor-pointer">
                      In Stock
                    </Label>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="filter-low-stock"
                      checked={filters.statusFilter === "low_stock"}
                      onCheckedChange={(checked) => {
                        setFilters((prev) => ({
                          ...prev,
                          statusFilter: checked ? "low_stock" : undefined,
                        }));
                      }}
                    />
                    <Label
                      htmlFor="filter-low-stock"
                      className="cursor-pointer"
                    >
                      Low Stock
                    </Label>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="filter-out-of-stock"
                      checked={filters.statusFilter === "out_of_stock"}
                      onCheckedChange={(checked) => {
                        setFilters((prev) => ({
                          ...prev,
                          statusFilter: checked ? "out_of_stock" : undefined,
                        }));
                      }}
                    />
                    <Label
                      htmlFor="filter-out-of-stock"
                      className="cursor-pointer"
                    >
                      Out of Stock
                    </Label>
                  </div>
                </DropdownMenuItem>
                {calculatedStats.categories.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Categories</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {calculatedStats.categories.map(
                      (category: string | undefined) => (
                        <DropdownMenuItem
                          key={category || "uncategorized"}
                          onSelect={(e) => {
                            e.preventDefault();
                            setFilters((prev) => ({
                              ...prev,
                              selectedCategory:
                                prev.selectedCategory === category
                                  ? undefined
                                  : category,
                            }));
                          }}
                        >
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`category-${category || "uncategorized"}`}
                              checked={filters.selectedCategory === category}
                              onCheckedChange={() => {}}
                            />
                            <Label
                              htmlFor={`category-${category || "uncategorized"}`}
                              className="cursor-pointer"
                            >
                              {category || "Uncategorized"}
                            </Label>
                          </div>
                        </DropdownMenuItem>
                      ),
                    )}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onSelect={() => {
                    setFilters((prev) => ({
                      ...prev,
                      searchTerm: "",
                      selectedCategory: undefined,
                      statusFilter: undefined,
                      sortBy: "name",
                      sortOrder: "asc",
                      page: 1,
                    }));
                  }}
                >
                  Clear all filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {selectedIds.size > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto">
                    {selectedIds.size} selected
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => handleBulkAction("activate")}
                  >
                    Activate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => handleBulkAction("deactivate")}
                  >
                    Deactivate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => handleBulkAction("export")}>
                    Export
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onSelect={() => handleBulkAction("delete")}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Inventory Table */}
        <Card className="bg-surface1 shadow-soft border-border-gray">
          <CardContent className="p-0">
            <InventoryTable
              items={inventoryItems}
              isLoading={isLoadingItems}
              selectedItems={Array.from(selectedIds)}
              onSelectItem={(id: string, selected: boolean) =>
                handleToggleSelection(id)
              }
              onSelectAll={(selected: boolean) =>
                selected
                  ? inventoryItems.forEach((item: any) =>
                      selectedIds.add(item.id),
                    )
                  : selectedIds.clear()
              }
              onToggleExpand={toggleRowExpand}
              onSort={(field: string, order: "asc" | "desc") =>
                handleSort(field)
              }
              onEdit={(item: any) => console.log("Edit item:", item)}
              onDelete={(item: any) => console.log("Delete item:", item)}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
