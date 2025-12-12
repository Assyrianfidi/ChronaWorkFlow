export type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock";
export type SortDirection = "asc" | "desc";

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  totalCategories: number;
  lowStockCount: number;
  outOfStockCount: number;
  categories: string[];
  lastUpdated: string;
}

export interface InventoryFilters {
  search?: string;
  categories?: string[];
  status?: InventoryStatus;
  minQuantity?: number;
  maxQuantity?: number;
  isActive?: boolean;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface InventoryResponse<T> {
  data: T[];
  pagination: PaginationOptions;
}

export interface BulkUpdatePayload {
  ids: string[];
  updates: Partial<InventoryItem>;
}

export interface ExportOptions {
  format: "csv" | "pdf" | "excel";
  filters: InventoryFilters;
}

export interface InventoryItem {
  id: string;
  companyId: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unitCost: number;
  unitPrice: number;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderPoint: number;
  reorderQuantity: number;
  maxStockLevel: number;
  minStockLevel: number;
  supplierId?: string;
  isActive: boolean;
  trackInventory: boolean;
  lastStockUpdate?: string;
  inventoryStatus?: InventoryStatus;
  barcode?: string;
  weight?: number;
  dimensions?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItemCreateDTO
  extends Omit<InventoryItem, "id" | "createdAt" | "updatedAt" | "companyId"> {}
export interface InventoryItemUpdateDTO
  extends Partial<
    Omit<InventoryItem, "id" | "createdAt" | "updatedAt" | "companyId">
  > {}

export interface InventoryAdjustment {
  id: string;
  inventoryItemId: string;
  quantityChange: number;
  previousQuantity: number;
  newQuantity: number;
  adjustmentType: "purchase" | "sale" | "adjustment" | "return" | "damage";
  referenceId?: string;
  referenceType?: "purchase_order" | "sale" | "inventory_count" | "adjustment";
  notes?: string;
  adjustedBy: string;
  adjustedAt: string;
}

export interface InventoryLevel {
  inventoryItemId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  lastUpdated: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuantityRange {
  min?: number;
  max?: number;
}

export interface DateRange {
  startDate?: string;
  endDate?: string;
}

export interface InventoryFilterOptions {
  // Search
  searchTerm?: string;

  // Category filtering
  categoryId?: string | string[];

  // Status filtering
  status?: InventoryStatus | InventoryStatus[];

  // Quantity filtering
  quantityRange?: QuantityRange;
  minQuantity?: number; // For backward compatibility
  maxQuantity?: number; // For backward compatibility

  // Status and activity
  isActive?: boolean;

  // Sorting
  sortBy?:
    | "name"
    | "quantity"
    | "value"
    | "category"
    | "sku"
    | "unitCost"
    | "unitPrice"
    | "lastStockUpdate";
  sortOrder?: SortDirection;

  // Pagination
  page?: number;
  pageSize?: number;

  // Date range
  dateRange?: DateRange;
  startDate?: string; // For backward compatibility
  endDate?: string; // For backward compatibility

  // Additional filters
  hasImage?: boolean;
  lowStockOnly?: boolean;
  outOfStockOnly?: boolean;
}

// Utility functions
export function getInventoryStatus(item: {
  quantityOnHand: number;
  reorderPoint: number;
}): InventoryStatus {
  if (item.quantityOnHand <= 0) return "out_of_stock";
  if (item.quantityOnHand <= item.reorderPoint) return "low_stock";
  return "in_stock";
}

export function getInventoryValue(items: InventoryItem[]): number {
  return items.reduce((total, item) => {
    return total + item.quantityOnHand * item.unitCost;
  }, 0);
}

export function getLowStockItems(items: InventoryItem[]): InventoryItem[] {
  return items.filter(
    (item) =>
      item.quantityOnHand > 0 && item.quantityOnHand <= item.reorderPoint,
  );
}

export function getOutOfStockItems(items: InventoryItem[]): InventoryItem[] {
  return items.filter((item) => item.quantityOnHand <= 0);
}
