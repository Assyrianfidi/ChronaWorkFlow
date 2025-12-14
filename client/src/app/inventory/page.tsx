"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  useInventoryItems,
  useInventoryStats,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  useBulkUpdateInventoryItems,
  useExportInventory,
  type InventoryQueryOptions,
} from "@/hooks/use-inventory";
import { useInventoryFilters } from "@/hooks/useInventoryFilters";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { InventoryItem, InventoryStatus } from "@/types/inventory";
import { getInventoryStatus } from "@/lib/inventory-utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Checkbox } from "@/components/ui/Checkbox";
import { VirtualizedTable } from "@/components/ui/virtualized-table/VirtualizedTable";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  AlertCircle,
  Check,
  X,
  Package,
  TrendingUp,
  AlertTriangle,
  Loader2,
} from "lucide-react";

export default function InventoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  // Use the inventory filters hook
  const {
    searchTerm,
    selectedCategory,
    statusFilter,
    quantityRange,
    sortBy,
    sortOrder,
    page,
    pageSize,
    filterOptions,
    handleSearchChange,
    handleCategoryChange,
    handleStatusChange,
    handleQuantityRangeChange,
    handleSortChange,
    handlePageChange,
    resetFilters,
  } = useInventoryFilters();
  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  const [isExporting, setIsExporting] = React.useState(false);
  const queryOptions = React.useMemo<InventoryQueryOptions>(() => {
    const status = Array.isArray(filterOptions.status)
      ? (filterOptions.status as InventoryStatus[])[0]
      : filterOptions.status;
    return {
      search: filterOptions.searchTerm || "",
      categoryId: filterOptions.categoryId,
      status: status as "in_stock" | "low_stock" | "out_of_stock" | undefined,
      minQuantity: filterOptions.quantityRange?.min,
      maxQuantity: filterOptions.quantityRange?.max,
      sortBy: filterOptions.sortBy || "name",
      sortDirection: filterOptions.sortOrder || "asc",
      page: filterOptions.page,
      pageSize: filterOptions.pageSize,
    };
  }, [filterOptions]);

  // Fetch inventory data with filters
  const {
    data: inventoryResponse,
    isLoading,
    error,
    refetch: refetchItems,
  } = useInventoryItems(queryOptions);

  // Fetch inventory stats
  const {
    data: inventoryStats = {
      totalItems: 0,
      totalValue: 0,
      totalCategories: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    },
    isLoading: isLoadingStats,
    isError: statsError,
    refetch: refetchStats,
  } = useInventoryStats(filterOptions as any);

  // Mutation hooks with callbacks
  const { mutate: createItem } = useCreateInventoryItem();
  const { mutate: updateItem } = useUpdateInventoryItem();
  const { mutate: deleteItem } = useDeleteInventoryItem();
  const { mutate: bulkUpdate } = useBulkUpdateInventoryItems();
  const { mutate: exportData } = useExportInventory();

  // Wrap mutations with success/error handling
  const handleCreateItem = React.useCallback(
    (itemData: any) => {
      createItem(itemData, {
        onSuccess: () => {
          toast({
            title: "Item created successfully",
            variant: "default",
          });
          refetchItems();
          refetchStats();
        },
        onError: (error: Error) => {
          toast({
            title: "Error creating item",
            description: error.message,
            variant: "destructive",
          });
        },
      });
    },
    [createItem, refetchItems, refetchStats, toast],
  );

  const handleUpdateItem = React.useCallback(
    ({ id, ...updates }: { id: string } & Partial<InventoryItem>) => {
      updateItem(
        { id, updates },
        {
          onSuccess: () => {
            toast({
              title: "Item updated successfully",
              variant: "default",
            });
            refetchItems();
            refetchStats();
          },
          onError: (error: Error) => {
            toast({
              title: "Error updating item",
              description: error.message,
              variant: "destructive",
            });
          },
        },
      );
    },
    [updateItem, refetchItems, refetchStats, toast],
  );

  const handleDeleteItem = useCallback(
    async (ids: string | string[]) => {
      const idsToDelete = Array.isArray(ids) ? ids : [ids];

      try {
        // Delete items one by one since the API only supports single deletion
        const deletePromises = idsToDelete.map(
          (id) =>
            new Promise<string>((resolve, reject) => {
              deleteItem(id, {
                onSuccess: () => resolve(id),
                onError: (error: Error) => reject(error),
              });
            }),
        );

        const deletedIds = await Promise.all(deletePromises);

        toast({
          title: "Items deleted successfully",
          variant: "default",
        });

        setSelectedItems((prev) => {
          const newSet = new Set(prev);
          deletedIds.forEach((id) => newSet.delete(id));
          return newSet;
        });

        refetchItems();
        refetchStats();
      } catch (error) {
        toast({
          title: "Error deleting items",
          description:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
          variant: "destructive",
        });
      }
    },
    [deleteItem, refetchItems, refetchStats],
  );

  const handleBulkUpdate = useCallback(
    (data: { ids: string[]; updates: Partial<InventoryItem> }) => {
      bulkUpdate(data, {
        onSuccess: () => {
          toast({
            title: "Bulk update successful",
            variant: "default",
          });
          setSelectedItems(new Set());
          refetchItems();
          refetchStats();
        },
        onError: (error: Error) => {
          toast({
            title: "Bulk update failed",
            description: error.message,
            variant: "destructive",
          });
        },
      });
    },
    [bulkUpdate, refetchItems, refetchStats],
  );

  // Derived state
  const totalValue = useMemo(() => {
    return (inventoryResponse as InventoryItem[]).reduce(
      (sum, item) => sum + item.quantityOnHand * (item.unitCost || 0),
      0,
    );
  }, [inventoryResponse]);

  const lowStockItems = useMemo(
    () =>
      (inventoryResponse as InventoryItem[]).filter(
        (item) =>
          item.quantityOnHand > 0 &&
          item.quantityOnHand <= (item.reorderPoint || 0),
      ),
    [inventoryResponse],
  );

  const outOfStockItems = useMemo(
    () =>
      (inventoryResponse as InventoryItem[]).filter(
        (item) => item.quantityOnHand <= 0,
      ),
    [inventoryResponse],
  );

  // Event handlers
  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleSearchChange({
        target: { value: e.target.value },
      } as React.ChangeEvent<HTMLInputElement>);
      handlePageChange(1, pageSize);
    },
    [handleSearchChange, handlePageChange, pageSize],
  );

  const handleSort = useCallback(
    (column: keyof InventoryItem) => {
      handleSortChange(column as any);
    },
    [handleSortChange],
  );

  const handleSelectItem = useCallback((id: string, isSelected: boolean) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(
    (isSelected: boolean) => {
      setSelectedItems((prev) => {
        if (isSelected) {
          return new Set(
            (inventoryResponse as InventoryItem[]).map((item) => item.id),
          );
        }
        return new Set();
      });
    },
    [inventoryResponse],
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

  const handlePageChangeWrapper = useCallback(
    (newPage: number) => {
      handlePageChange(newPage, pageSize);
    },
    [handlePageChange, pageSize],
  );

  const handleExport = useCallback(() => {
    setIsExporting(true);
    exportData(
      {
        filters: {
          search: filterOptions.searchTerm,
          categories: filterOptions.categoryId
            ? [filterOptions.categoryId.toString()]
            : undefined,
          status: Array.isArray(filterOptions.status)
            ? (filterOptions.status as InventoryStatus[])[0]
            : filterOptions.status,
          minQuantity: filterOptions.quantityRange?.min,
          maxQuantity: filterOptions.quantityRange?.max,
        },
        format: "csv",
      },
      {
        onSuccess: (url: string) => {
          // Create a temporary link to trigger download
          const link = document.createElement("a");
          link.href = url;
          link.download = `inventory-export-${new Date().toISOString().split("T")[0]}.csv`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Revoke the object URL to free up memory
          URL.revokeObjectURL(url);
          setIsExporting(false);
        },
        onError: (error: Error) => {
          toast({
            title: "Export failed",
            description: error.message,
            variant: "destructive",
          });
          setIsExporting(false);
        },
      },
    );
  }, [filterOptions, exportData, setIsExporting]);

  const handleBulkUpdateStatus = useCallback(
    (status: InventoryStatus) => {
      if (selectedItems.size === 0) return;

      // Convert the status to the correct format if needed
      const formattedStatus = status
        .replace(/[- ]/g, "_")
        .toLowerCase() as InventoryStatus;

      handleBulkUpdate({
        ids: Array.from(selectedItems),
        updates: { inventoryStatus: formattedStatus },
      });
    },
    [selectedItems, handleBulkUpdate],
  );

  // Memoize the row renderer for the virtualized table
  const renderRow = useCallback(
    (item: InventoryItem) => {
      return (
        <TableRow>
          <TableCell>
            <Checkbox
              checked={selectedItems.has(item.id)}
              onChange={(checked) => {
                setSelectedItems((prev) => {
                  const newSet = new Set(prev);
                  if (checked) {
                    newSet.add(item.id);
                  } else {
                    newSet.delete(item.id);
                  }
                  return newSet;
                });
              }}
              aria-label="Select row"
            />
          </TableCell>
          <TableCell className="font-medium">{item.name}</TableCell>
          <TableCell>{item.sku}</TableCell>
          <TableCell>
            <Badge
              variant={
                item.inventoryStatus === "in_stock"
                  ? "default"
                  : item.inventoryStatus === "low_stock"
                    ? "secondary"
                    : "destructive"
              }
            >
              {item.inventoryStatus?.replace(/_/g, " ") || "Unknown"}
            </Badge>
          </TableCell>
          <TableCell>{item.quantityOnHand}</TableCell>
          <TableCell>${item.unitCost?.toFixed(2)}</TableCell>
          <TableCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/inventory/${item.id}/edit`)}
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      );
    },
    [selectedItems, router, handleDeleteItem],
  );

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || statsError) {
    return (
      <div className="p-4 text-red-600">
        <h2 className="text-xl font-bold mb-2">Error loading inventory data</h2>
        <p>
          Please try again later or contact support if the problem persists.
        </p>
        <pre className="mt-4 p-4 bg-red-50 rounded text-sm overflow-auto">
          {String(error || statsError || "Unknown error")}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Inventory Management
          </h1>
          <p className="text-muted-foreground">
            Manage your inventory items, track stock levels, and monitor product
            status.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="ml-auto h-8"
            onClick={() => handleExport()}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
          <Button
            size="sm"
            className="h-8"
            onClick={() => router.push("/inventory/new")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search items..."
              className="w-full pl-8"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={statusFilter || ""}
              onChange={(e) =>
                handleStatusChange(
                  (e.target.value || "all") as InventoryStatus | "all",
                )
              }
            >
              <option value="">All Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Selected items actions */}
        {selectedItems.size > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">
              {selectedItems.size} item{selectedItems.size !== 1 ? "s" : ""}{" "}
              selected
            </span>
            <select
              className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              onChange={(e) => {
                const inventoryStatus = e.target.value as InventoryStatus;
                if (inventoryStatus) {
                  handleBulkUpdateStatus(inventoryStatus);
                }
              }}
              value=""
            >
              <option value="" disabled>
                Update Status
              </option>
              <option value="in_stock">Mark as In Stock</option>
              <option value="low_stock">Mark as Low Stock</option>
              <option value="out_of_stock">Mark as Out of Stock</option>
            </select>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-destructive hover:bg-destructive/10"
              onClick={() => {
                if (confirm(`Delete ${selectedItems.size} selected items?`)) {
                  handleDeleteItem(Array.from(selectedItems));
                }
              }}
            >
              Delete Selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => setSelectedItems(new Set())}
            >
              Clear Selection
            </Button>
          </div>
        )}
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
              {inventoryStats?.totalItems || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {inventoryStats?.totalCategories || 0} categories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inventory Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {totalValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">Current total value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Items below reorder point
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Items that need restocking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <VirtualizedTable
        items={inventoryResponse as InventoryItem[]}
        renderRow={renderRow}
        estimateRowHeight={() => 50}
        overscanCount={5}
      />

      {/* Pagination */}
      {((inventoryResponse as any)?.totalPages || 0) > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}-
            {Math.min(page * pageSize, (inventoryResponse as any)?.total || 0)}{" "}
            of {(inventoryResponse as any)?.total || 0} items
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChangeWrapper(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from(
                {
                  length: Math.min(
                    5,
                    Math.ceil(
                      ((inventoryResponse as any)?.total || 0) / pageSize,
                    ),
                  ),
                },
                (_, i) => {
                  // Calculate page number based on current page and total pages
                  let pageNum;
                  const totalPages = Math.ceil(
                    ((inventoryResponse as any)?.total || 0) / pageSize,
                  );

                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChangeWrapper(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                },
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChangeWrapper(page + 1)}
              disabled={
                page * pageSize >= ((inventoryResponse as any)?.total || 0)
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
