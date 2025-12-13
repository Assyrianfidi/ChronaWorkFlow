import * as React from "react";
import { useDebounce } from "use-debounce";
import { useRouter, useSearchParams } from "next/navigation";
import {
  InventoryStatus,
  InventoryFilterOptions,
  QuantityRange,
  InventoryItem,
} from "../types/inventory";

type SortableField =
  | "name"
  | "quantity"
  | "value"
  | "category"
  | "sku"
  | "unitCost"
  | "unitPrice"
  | "lastStockUpdate";

const DEFAULT_PAGE_SIZE = 10;

interface UseInventoryFiltersProps {
  initialFilters?: Partial<InventoryFilterOptions>;
  debounceDelay?: number;
}

export function useInventoryFilters({
  initialFilters = {},
  debounceDelay = 300,
}: UseInventoryFiltersProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL search params or props
  const getInitialState = useCallback(() => {
    const params = new URLSearchParams(searchParams?.toString());
    const categoryParam = params.get("category");

    return {
      searchTerm: params.get("search") || initialFilters.searchTerm || "",
      selectedCategory: Array.isArray(categoryParam)
        ? categoryParam[0]
        : categoryParam || initialFilters.categoryId || "",
      statusFilter:
        (params.get("status") as InventoryStatus) || initialFilters.status,
      quantityRange: {
        min: params.has("minQty")
          ? Number(params.get("minQty"))
          : initialFilters.quantityRange?.min,
        max: params.has("maxQty")
          ? Number(params.get("maxQty"))
          : initialFilters.quantityRange?.max,
      },
      sortBy:
        (params.get("sortBy") as keyof InventoryItem) ||
        initialFilters.sortBy ||
        "name",
      sortOrder:
        (params.get("sortOrder") as "asc" | "desc") ||
        initialFilters.sortOrder ||
        "asc",
      page: params.has("page")
        ? Number(params.get("page"))
        : initialFilters.page || 1,
      pageSize: params.has("pageSize")
        ? Number(params.get("pageSize"))
        : initialFilters.pageSize || DEFAULT_PAGE_SIZE,
    };
  }, [searchParams, initialFilters]);

  // State management
  const [searchTerm, setSearchTerm] = React.useState(getInitialState().searchTerm);
  const [selectedCategory, setSelectedCategory] = React.useState<string | undefined>(
    getInitialState().selectedCategory || undefined,
  );
  const [statusFilter, setStatusFilter] = React.useState<InventoryStatus | undefined>(
    getInitialState().statusFilter,
  );
  const [quantityRange, setQuantityRange] = React.useState<QuantityRange>(
    getInitialState().quantityRange || {},
  );
  const [sortBy, setSortBy] = React.useState<SortableField>(
    (getInitialState().sortBy as SortableField) || "name",
  );
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">(
    getInitialState().sortOrder,
  );
  const [page, setPage] = React.useState(getInitialState().page);
  const [pageSize, setPageSize] = React.useState(getInitialState().pageSize);

  // Debounced search term
  const [debouncedSearch] = useDebounce(searchTerm, debounceDelay);

  // Build filter options for API calls
  const filterOptions = React.useMemo<InventoryFilterOptions>(
    () => ({
      searchTerm: debouncedSearch,
      categoryId: selectedCategory || undefined,
      status: statusFilter,
      quantityRange,
      sortBy,
      sortOrder,
      page,
      pageSize,
    }),
    [
      debouncedSearch,
      selectedCategory,
      statusFilter,
      quantityRange,
      sortBy,
      sortOrder,
      page,
      pageSize,
    ],
  );

  // Update URL with current filters
  const updateUrl = React.useCallback(
    (newFilters: Partial<InventoryFilterOptions>) => {
      const params = new URLSearchParams();

      if (newFilters.searchTerm) params.set("search", newFilters.searchTerm);
      if (newFilters.categoryId) {
        const categoryId = Array.isArray(newFilters.categoryId)
          ? newFilters.categoryId[0]
          : newFilters.categoryId;
        params.set("category", categoryId);
      }
      if (newFilters.status) {
        const status = Array.isArray(newFilters.status)
          ? newFilters.status[0]
          : newFilters.status;
        params.set("status", status);
      }
      if (newFilters.quantityRange?.min !== undefined)
        params.set("minQty", newFilters.quantityRange.min.toString());
      if (newFilters.quantityRange?.max !== undefined)
        params.set("maxQty", newFilters.quantityRange.max.toString());
      if (newFilters.sortBy) params.set("sortBy", newFilters.sortBy);
      if (newFilters.sortOrder) params.set("sortOrder", newFilters.sortOrder);
      if (newFilters.page) params.set("page", newFilters.page.toString());
      if (newFilters.pageSize)
        params.set("pageSize", newFilters.pageSize.toString());

      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  // Handler for search input changes
  const handleSearchChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      setPage(1); // Reset to first page on new search
    },
    [],
  );

  // Handler for category filter changes
  const handleCategoryChange = React.useCallback((categoryId: string) => {
    setSelectedCategory(categoryId || undefined);
    setPage(1);
  }, []);

  // Handler for status filter changes
  const handleStatusChange = React.useCallback((status: InventoryStatus | "all") => {
    setStatusFilter(status === "all" ? undefined : status);
    setPage(1);
  }, []);

  // Handler for quantity range changes
  const handleQuantityRangeChange = React.useCallback((range: QuantityRange) => {
    setQuantityRange((prev) => ({
      ...prev,
      ...range,
    }));
    setPage(1);
  }, []);

  // Handler for sort changes
  const handleSortChange = React.useCallback((newSortBy: SortableField) => {
    setSortBy(newSortBy);
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  // Handler for pagination
  const handlePageChange = React.useCallback(
    (newPage: number, newPageSize: number) => {
      setPage(newPage);
      setPageSize(newPageSize);
    },
    [],
  );

  // Reset all filters
  const resetFilters = React.useCallback(() => {
    setSearchTerm("");
    setSelectedCategory(undefined);
    setStatusFilter(undefined);
    setQuantityRange({});
    setSortBy("name");
    setSortOrder("asc");
    setPage(1);
    updateUrl({});
  }, [updateUrl]);

  return {
    // State
    searchTerm,
    selectedCategory,
    statusFilter,
    quantityRange,
    sortBy,
    sortOrder,
    page,
    pageSize,

    // Handlers
    handleSearchChange,
    handleCategoryChange,
    handleStatusChange,
    handleQuantityRangeChange,
    handleSortChange,
    handlePageChange,
    resetFilters,

    // Computed values
    filterOptions,
    debouncedSearch,

    // State setters (for direct access when needed)
    setSearchTerm,
    setSelectedCategory,
    setStatusFilter,
    setQuantityRange,
    setSortBy,
    setSortOrder,
    setPage,
    setPageSize,
  };
}
