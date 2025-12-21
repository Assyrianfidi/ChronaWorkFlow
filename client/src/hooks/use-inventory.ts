import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  InventoryItem,
  InventoryStats,
  InventoryFilters,
  SortDirection,
  InventoryResponse,
  InventoryFilterOptions,
  BulkUpdatePayload,
  ExportOptions,
} from "../types/inventory";
import api from "@/lib/api";

const INVENTORY_QUERY_KEY = "inventory";
const INVENTORY_STATS_QUERY_KEY = "inventory-stats";

export interface InventoryQueryOptions {
  search?: string;
  categories?: string[];
  status?: "in_stock" | "low_stock" | "out_of_stock";
  sortBy?: string;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
  minQuantity?: number;
  maxQuantity?: number;
  categoryId?: string | string[];
  searchTerm?: string;
  quantityRange?: {
    min?: number;
    max?: number;
  };
}

export const useInventoryItems = (options: InventoryQueryOptions = {}) => {
  const {
    search = "",
    categories = [],
    status,
    sortBy = "name",
    sortDirection = "asc",
    page = 1,
    pageSize = 20,
  } = options;

  return useQuery<InventoryItem[], Error>({
    queryKey: [
      INVENTORY_QUERY_KEY,
      { search, categories, status, sortBy, sortDirection, page, pageSize },
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        search,
        sortBy,
        sortDirection,
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (categories.length > 0) {
        categories.forEach((category) => params.append("categories", category));
      }

      if (status) {
        params.append("status", status);
      }

      const response = await api.get<InventoryResponse<InventoryItem>>(
        `/api/inventory?${params.toString()}`,
      );
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useInventoryStats = (
  filters: Omit<
    InventoryQueryOptions,
    "sortBy" | "sortDirection" | "page" | "pageSize"
  > = {},
) => {
  return useQuery<InventoryStats, Error>({
    queryKey: [INVENTORY_STATS_QUERY_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.search) {
        params.append("search", filters.search);
      }

      if (filters.categories && filters.categories.length > 0) {
        filters.categories.forEach((category) =>
          params.append("categories", category),
        );
      }

      if (filters.status) {
        params.append("status", filters.status);
      }

      const response = await api.get<{ data: InventoryStats }>(
        `/api/inventory/stats?${params.toString()}`,
      );
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation<
    InventoryItem,
    Error,
    Omit<InventoryItem, "id" | "createdAt" | "updatedAt">
  >({
    mutationFn: async (newItem) => {
      const response = await api.post<{ data: InventoryItem }>(
        "/api/inventory",
        newItem,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [INVENTORY_STATS_QUERY_KEY] });
    },
  });
};

export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation<
    InventoryItem,
    Error,
    { id: string; updates: Partial<InventoryItem> }
  >({
    mutationFn: async ({ id, updates }) => {
      const response = await api.patch<{ data: InventoryItem }>(
        `/api/inventory/${id}`,
        updates,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [INVENTORY_STATS_QUERY_KEY] });
    },
  });
};

export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/api/inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [INVENTORY_STATS_QUERY_KEY] });
    },
  });
};

export const useBulkUpdateInventoryItems = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { ids: string[]; updates: Partial<InventoryItem> }
  >({
    mutationFn: async ({ ids, updates }) => {
      await api.patch("/api/inventory/bulk", { ids, updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [INVENTORY_STATS_QUERY_KEY] });
    },
  });
};

export const useExportInventory = () => {
  return useMutation<
    string,
    Error,
    { filters: InventoryFilters; format: "csv" | "pdf" | "excel" }
  >({
    mutationFn: async ({ filters, format }) => {
      const params = new URLSearchParams();

      if (filters.search) {
        params.append("search", filters.search);
      }

      if (filters.categories && filters.categories.length > 0) {
        filters.categories.forEach((category) =>
          params.append("categories", category),
        );
      }

      if (filters.status) {
        params.append("status", filters.status);
      }

      const response = await api.get<{ data: { url: string } }>(
        `/api/inventory/export?${params.toString()}&format=${format}`,
      );
      return response.data.data.url;
    },
  });
};
