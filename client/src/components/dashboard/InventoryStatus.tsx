import React from 'react'
;
;
import { Package, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  location: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
}

interface InventoryStatusProps {
  items: InventoryItem[];
  isLoading?: boolean;
}

const InventoryStatus: React.FC<InventoryStatusProps> = ({
  items,
  isLoading = false,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in_stock":
        return CheckCircle;
      case "low_stock":
        return AlertTriangle;
      case "out_of_stock":
        return XCircle;
      default:
        return Package;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_stock":
        return "text-green-600 bg-green-50";
      case "low_stock":
        return "text-yellow-600 bg-yellow-50";
      case "out_of_stock":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "in_stock":
        return "In Stock";
      case "low_stock":
        return "Low Stock";
      case "out_of_stock":
        return "Out of Stock";
      default:
        return "Unknown";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="animate-pulse border border-gray-200 rounded-lg p-4"
          >
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No inventory items to display
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const Icon = getStatusIcon(item.status);
        const colorClass = getStatusColor(item.status);

        return (
          <div
            key={item.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  <span className="text-sm text-gray-500">SKU: {item.sku}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Quantity: {item.quantity}</span>
                  <span>Min: {item.minStock}</span>
                  <span>Max: {item.maxStock}</span>
                  <span>Location: {item.location}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${colorClass}`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{getStatusText(item.status)}</span>
                </div>
              </div>
            </div>

            {/* Stock Level Indicator */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Stock Level</span>
                <span>
                  {Math.round((item.quantity / item.maxStock) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    item.status === "in_stock"
                      ? "bg-green-600"
                      : item.status === "low_stock"
                        ? "bg-yellow-600"
                        : "bg-red-600"
                  }`}
                  style={{
                    width: `${Math.min((item.quantity / item.maxStock) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InventoryStatus;
