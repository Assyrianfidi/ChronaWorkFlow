/**
 * Inventory Dashboard Component
 * Multi-location inventory overview with valuation
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import {
  Package,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Warehouse,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface InventoryValuation {
  items: Array<{
    itemId: string;
    sku: string;
    name: string;
    quantity: number;
    unitCost: number;
    totalValue: number;
  }>;
  totalValue: number;
}

interface LowStockItem {
  itemId: string;
  sku: string;
  name: string;
  currentStock: number;
  reorderPoint: number;
  suggestedOrder: number;
}

const InventoryDashboard: React.FC = () => {
  const { toast } = useToast();

  // Fetch inventory valuation
  const { data: valuation, isLoading: valuationLoading } =
    useQuery<InventoryValuation>({
      queryKey: ["inventory-valuation"],
      queryFn: async () => {
        const response = await fetch("/api/inventory/valuation");
        if (!response.ok)
          throw new Error("Failed to fetch inventory valuation");
        const data = await response.json();
        return data.data;
      },
    });

  // Fetch low stock report
  const { data: lowStock, isLoading: lowStockLoading } = useQuery<
    LowStockItem[]
  >({
    queryKey: ["low-stock"],
    queryFn: async () => {
      const response = await fetch("/api/inventory/low-stock");
      if (!response.ok) throw new Error("Failed to fetch low stock report");
      const data = await response.json();
      return data.data;
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">
            Track stock levels, valuations, and movements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Warehouse className="h-4 w-4 mr-2" />
            Locations
          </Button>
          <Button>
            <Package className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Inventory Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {valuationLoading
                ? "..."
                : formatCurrency(valuation?.totalValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {valuation?.items.length || 0} SKUs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Items in Stock
            </CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {valuationLoading
                ? "..."
                : valuation?.items.filter((i) => i.quantity > 0).length || 0}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1 text-emerald-600" />
              Active SKUs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Low Stock Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {lowStockLoading ? "..." : lowStock?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Below reorder point</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Item Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {valuationLoading
                ? "..."
                : formatCurrency(
                    (valuation?.totalValue || 0) /
                      (valuation?.items.length || 1),
                  )}
            </div>
            <p className="text-xs text-muted-foreground">Per SKU average</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStock && lowStock.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStock.slice(0, 5).map((item) => (
                <div
                  key={item.itemId}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({item.sku})
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">
                      Current:{" "}
                      <span className="font-bold text-yellow-700">
                        {item.currentStock}
                      </span>
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Reorder: {item.reorderPoint}
                    </span>
                    <Button size="sm" variant="outline">
                      Order {item.suggestedOrder}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Valuation Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Top Valuation Items</CardTitle>
            <Badge variant="outline">Top 10 by value</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {valuationLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="space-y-3">
              {valuation?.items
                .sort((a, b) => b.totalValue - a.totalValue)
                .slice(0, 10)
                .map((item) => (
                  <div
                    key={item.itemId}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({item.sku})
                      </span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-sm text-muted-foreground">
                        Qty: {item.quantity}
                      </span>
                      <span className="text-sm">
                        @ {formatCurrency(item.unitCost)} each
                      </span>
                      <span className="font-bold w-24 text-right">
                        {formatCurrency(item.totalValue)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryDashboard;
