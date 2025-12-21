import type { InventoryItem, InventoryStatus } from "../types/inventory";

export const getInventoryStatus = (item: InventoryItem): InventoryStatus => {
  if (item.quantityOnHand <= 0) return "out_of_stock";
  if (item.quantityOnHand <= (item.reorderPoint || 0)) return "low_stock";
  return "in_stock";
};

export const getInventoryValue = (items: InventoryItem[]): number =>
  items.reduce(
    (sum, item) => sum + item.quantityOnHand * (item.unitCost || 0),
    0,
  );

export const getLowStockItems = (items: InventoryItem[]): InventoryItem[] =>
  items.filter(
    (item) =>
      item.quantityOnHand > 0 &&
      item.quantityOnHand <= (item.reorderPoint || 0),
  );

export const getOutOfStockItems = (items: InventoryItem[]): InventoryItem[] =>
  items.filter((item) => item.quantityOnHand <= 0);

// Format currency values
export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

// Format date values
export const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
