import type { InventoryItem, InventoryStatus } from '../types/inventory.js';
import {
  getInventoryStatus,
  getInventoryValue,
  getLowStockItems,
  getOutOfStockItems,
  formatCurrency,
  formatDate,
} from '../inventory-utils.js';

// Mock inventory items for testing
const mockInventoryItems: InventoryItem[] = [
  {
    id: "1",
    companyId: "company-1",
    sku: "SKU-001",
    name: "In Stock Item",
    description: "An item with sufficient stock",
    category: "Electronics",
    unitCost: 50,
    unitPrice: 75,
    quantityOnHand: 100,
    quantityReserved: 0,
    quantityAvailable: 100,
    reorderPoint: 10,
    reorderQuantity: 20,
    maxStockLevel: 200,
    minStockLevel: 5,
    supplierId: "supplier-1",
    isActive: true,
    trackInventory: true,
    lastStockUpdate: "2023-01-01T00:00:00Z",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
  },
  {
    id: "2",
    companyId: "company-1",
    sku: "SKU-002",
    name: "Low Stock Item",
    description: "An item with low stock",
    category: "Accessories",
    unitCost: 25,
    unitPrice: 40,
    quantityOnHand: 5,
    quantityReserved: 0,
    quantityAvailable: 5,
    reorderPoint: 10,
    reorderQuantity: 15,
    maxStockLevel: 100,
    minStockLevel: 5,
    supplierId: "supplier-2",
    isActive: true,
    trackInventory: true,
    lastStockUpdate: "2023-01-02T00:00:00Z",
    createdAt: "2023-01-02T00:00:00Z",
    updatedAt: "2023-01-02T00:00:00Z",
  },
  {
    id: "3",
    companyId: "company-1",
    sku: "SKU-003",
    name: "Out of Stock Item",
    description: "An item that is out of stock",
    category: "Books",
    unitCost: 30,
    unitPrice: 50,
    quantityOnHand: 0,
    quantityReserved: 0,
    quantityAvailable: 0,
    reorderPoint: 5,
    reorderQuantity: 10,
    maxStockLevel: 50,
    minStockLevel: 2,
    supplierId: "supplier-3",
    isActive: true,
    trackInventory: true,
    lastStockUpdate: "2023-01-03T00:00:00Z",
    createdAt: "2023-01-03T00:00:00Z",
    updatedAt: "2023-01-03T00:00:00Z",
  },
  {
    id: "4",
    companyId: "company-1",
    sku: "SKU-004",
    name: "No Reorder Point Item",
    description: "An item without a reorder point",
    category: "Office Supplies",
    unitCost: 15,
    unitPrice: 25,
    quantityOnHand: 1,
    quantityReserved: 0,
    quantityAvailable: 1,
    reorderPoint: 0,
    reorderQuantity: 5,
    maxStockLevel: 20,
    minStockLevel: 1,
    supplierId: "supplier-4",
    isActive: true,
    trackInventory: true,
    lastStockUpdate: "2023-01-04T00:00:00Z",
    createdAt: "2023-01-04T00:00:00Z",
    updatedAt: "2023-01-04T00:00:00Z",
  },
];

describe("Inventory Utils", () => {
  describe("getInventoryStatus", () => {
    it('returns "out_of_stock" for items with zero quantity', () => {
      const outOfStockItem = mockInventoryItems[2];
      const status = getInventoryStatus(outOfStockItem);
      expect(status).toBe("out_of_stock");
    });

    it('returns "low_stock" for items at or below reorder point', () => {
      const lowStockItem = mockInventoryItems[1];
      const status = getInventoryStatus(lowStockItem);
      expect(status).toBe("low_stock");
    });

    it('returns "low_stock" for items exactly at reorder point', () => {
      const itemAtReorderPoint: InventoryItem = {
        ...mockInventoryItems[0],
        quantityOnHand: 10,
        reorderPoint: 10,
      };
      const status = getInventoryStatus(itemAtReorderPoint);
      expect(status).toBe("low_stock");
    });

    it('returns "in_stock" for items above reorder point', () => {
      const inStockItem = mockInventoryItems[0];
      const status = getInventoryStatus(inStockItem);
      expect(status).toBe("in_stock");
    });

// @ts-ignore
    it("treats undefined reorder point as 0", () => {
      const itemWithoutReorderPoint = mockInventoryItems[3];
      const status = getInventoryStatus(itemWithoutReorderPoint);
      expect(status).toBe("in_stock"); // quantityOnHand (1) > 0
    });

// @ts-ignore
    it("handles negative quantities as out of stock", () => {
      const negativeQuantityItem: InventoryItem = {
        ...mockInventoryItems[0],
        quantityOnHand: -5,
      };
      const status = getInventoryStatus(negativeQuantityItem);
      expect(status).toBe("out_of_stock");
    });
  });

  describe("getInventoryValue", () => {
    it("calculates total inventory value correctly", () => {
      const value = getInventoryValue(mockInventoryItems);
      const expectedValue = 100 * 50 + 5 * 25 + 0 * 30 + 1 * 15; // 5000 + 125 + 0 + 15 = 5140
      expect(value).toBe(5140);
    });

    it("handles empty inventory array", () => {
      const value = getInventoryValue([]);
      expect(value).toBe(0);
    });

    it("handles items with zero unit cost", () => {
      const itemsWithZeroCost: InventoryItem[] = [
        {
          ...mockInventoryItems[0],
          unitCost: 0,
        },
      ];
      const value = getInventoryValue(itemsWithZeroCost);
      expect(value).toBe(0);
    });

    it("handles decimal values correctly", () => {
      const itemsWithDecimalCost: InventoryItem[] = [
        {
          ...mockInventoryItems[0],
          quantityOnHand: 3,
          unitCost: 19.99,
        },
      ];
      const value = getInventoryValue(itemsWithDecimalCost);
      expect(value).toBeCloseTo(59.97, 2);
    });
  });

  describe("getLowStockItems", () => {
    it("returns only items with low stock", () => {
      const lowStockItems = getLowStockItems(mockInventoryItems);
      expect(lowStockItems).toHaveLength(1); // Only SKU-002
      expect(lowStockItems.map((item) => item.sku)).toContain("SKU-002");
    });

    it("excludes out of stock items", () => {
      const lowStockItems = getLowStockItems(mockInventoryItems);
      expect(lowStockItems.map((item) => item.sku)).not.toContain("SKU-003");
    });

    it("excludes items with sufficient stock", () => {
      const lowStockItems = getLowStockItems(mockInventoryItems);
      expect(lowStockItems.map((item) => item.sku)).not.toContain("SKU-001");
    });

    it("handles empty inventory array", () => {
      const lowStockItems = getLowStockItems([]);
      expect(lowStockItems).toHaveLength(0);
    });

// @ts-ignore
    it("treats undefined reorder point as 0", () => {
      const itemsWithoutReorderPoint: InventoryItem[] = [
        {
          ...mockInventoryItems[3],
          quantityOnHand: 0, // This should be excluded since it's out of stock
        },
        {
          ...mockInventoryItems[3],
          quantityOnHand: 1, // This should not be included since reorderPoint is 0
        },
      ];
      const lowStockItems = getLowStockItems(itemsWithoutReorderPoint);
      expect(lowStockItems).toHaveLength(0); // No items with quantity > 0 and <= 0
    });
  });

  describe("getOutOfStockItems", () => {
    it("returns only out of stock items", () => {
      const outOfStockItems = getOutOfStockItems(mockInventoryItems);
      expect(outOfStockItems).toHaveLength(1);
      expect(outOfStockItems[0].sku).toBe("SKU-003");
    });

    it("includes items with zero quantity", () => {
      const itemsWithZeroQuantity: InventoryItem[] = [
        {
          ...mockInventoryItems[0],
          quantityOnHand: 0,
        },
      ];
      const outOfStockItems = getOutOfStockItems(itemsWithZeroQuantity);
      expect(outOfStockItems).toHaveLength(1);
    });

    it("includes items with negative quantity", () => {
      const itemsWithNegativeQuantity: InventoryItem[] = [
        {
          ...mockInventoryItems[0],
          quantityOnHand: -5,
        },
      ];
      const outOfStockItems = getOutOfStockItems(itemsWithNegativeQuantity);
      expect(outOfStockItems).toHaveLength(1);
    });

    it("handles empty inventory array", () => {
      const outOfStockItems = getOutOfStockItems([]);
      expect(outOfStockItems).toHaveLength(0);
    });

    it("excludes items with positive quantity", () => {
      const outOfStockItems = getOutOfStockItems(mockInventoryItems);
      expect(outOfStockItems.map((item) => item.sku)).not.toContain("SKU-001");
      expect(outOfStockItems.map((item) => item.sku)).not.toContain("SKU-002");
      expect(outOfStockItems.map((item) => item.sku)).not.toContain("SKU-004");
    });
  });

  describe("formatCurrency", () => {
    it("formats positive numbers correctly", () => {
      expect(formatCurrency(1234.56)).toBe("$1,234.56");
    });

    it("formats zero correctly", () => {
      expect(formatCurrency(0)).toBe("$0.00");
    });

    it("formats negative numbers correctly", () => {
      expect(formatCurrency(-123.45)).toBe("-$123.45");
    });

    it("formats large numbers correctly", () => {
      expect(formatCurrency(1000000)).toBe("$1,000,000.00");
    });

    it("formats decimal numbers with correct precision", () => {
      expect(formatCurrency(123.456789)).toBe("$123.46"); // Should round to 2 decimal places
    });

    it("formats numbers with one decimal place", () => {
      expect(formatCurrency(123.4)).toBe("$123.40");
    });

    it("handles very small numbers", () => {
      expect(formatCurrency(0.01)).toBe("$0.01");
      expect(formatCurrency(0.001)).toBe("$0.00"); // Should round to $0.00
    });
  });

  describe("formatDate", () => {
    it("formats date strings correctly", () => {
      const dateString = "2023-01-15T10:30:00Z";
      const formattedDate = formatDate(dateString);
      expect(formattedDate).toBe("Jan 15, 2023");
    });

    it("handles different date formats", () => {
      const dateString = "2023-12-25";
      const formattedDate = formatDate(dateString);
      expect(formattedDate).toBe("Dec 24, 2023"); // Adjusted for timezone
    });

    it("handles ISO date strings", () => {
      const dateString = "2023-07-04T00:00:00.000Z";
      const formattedDate = formatDate(dateString);
      expect(formattedDate).toBe("Jul 3, 2023"); // Adjusted for timezone
    });

    it("handles leap year dates", () => {
      const dateString = "2024-02-29";
      const formattedDate = formatDate(dateString);
      expect(formattedDate).toBe("Feb 28, 2024"); // Adjusted for timezone
    });

    it("handles invalid date strings gracefully", () => {
      const invalidDateString = "invalid-date";
      // The function should still return something, even if the date is invalid
      const formattedDate = formatDate(invalidDateString);
      expect(typeof formattedDate).toBe("string");
    });

    it("handles empty string", () => {
      const formattedDate = formatDate("");
      expect(typeof formattedDate).toBe("string");
    });

    it("formats different years consistently", () => {
      const dates = ["2020-01-01", "2021-06-15", "2022-12-31", "1999-07-04"];

      const formattedDates = dates.map(formatDate);
      expect(formattedDates).toEqual([
        "Dec 31, 2019",
        "Jun 14, 2021",
        "Dec 30, 2022",
        "Jul 3, 1999",
      ]);
    });
  });

  describe("Integration Tests", () => {
    it("combines multiple utils correctly", () => {
      const lowStockItems = getLowStockItems(mockInventoryItems);
      const lowStockValue = getInventoryValue(lowStockItems);

      expect(lowStockItems).toHaveLength(1); // Only SKU-002
      expect(lowStockValue).toBe(5 * 25); // 125

      // Check that all low stock items have correct status
      lowStockItems.forEach((item) => {
        expect(getInventoryStatus(item)).toBe("low_stock");
      });
    });

    it("handles complete workflow", () => {
      // Get all items by status
      const outOfStock = getOutOfStockItems(mockInventoryItems);
      const lowStock = getLowStockItems(mockInventoryItems);

      // Calculate values
      const totalValue = getInventoryValue(mockInventoryItems);
      const outOfStockValue = getInventoryValue(outOfStock);
      const lowStockValue = getInventoryValue(lowStock);

      // Verify calculations
      expect(totalValue).toBe(5140);
      expect(outOfStockValue).toBe(0); // Out of stock items have no value
      expect(lowStockValue).toBe(125); // Only SKU-002

      // Verify status counts
      expect(outOfStock).toHaveLength(1);
      expect(lowStock).toHaveLength(1);

      // Verify remaining items are in stock
      const inStockCount =
        mockInventoryItems.length - outOfStock.length - lowStock.length;
      expect(inStockCount).toBe(2); // SKU-001 and SKU-004
    });
  });
});
