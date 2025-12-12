import React from 'react';
// @ts-ignore
import * as React from "react";
// @ts-ignore
import { useAuth } from '../../contexts/AuthContext.js.js';
import useSWR from "swr";
import {
  DashboardMetricCard,
  InventoryStatus,
} from '../../components/dashboard.js.js';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  ShoppingCart,
  Truck,
  Warehouse,
} from "lucide-react";
// @ts-ignore
import { cn } from '../../lib/utils.js.js';
// @ts-ignore
import { DashboardShell } from '../../components/ui/layout/DashboardShell.js.js';

interface EnterpriseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined" | "glass";
}

const EnterpriseCard = React.forwardRef<HTMLDivElement, EnterpriseCardProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-border-gray bg-surface2 shadow-soft transition-transform duration-150",
        {
          "hover:-translate-y-[1px] hover:shadow-elevated":
            variant === "default" || !variant,
          "hover:-translate-y-[2px] hover:shadow-elevated":
            variant === "elevated",
          "border-2": variant === "outlined",
          "bg-surface2/80 backdrop-blur-sm": variant === "glass",
        },
        className,
      )}
      {...props}
    />
  ),
);

EnterpriseCard.displayName = "EnterpriseCard";

interface InventoryMetrics {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  pendingOrders: number;
  warehouseCapacity: number;
  monthlyMovement: number;
}

interface StockAlert {
  id: string;
  item: string;
  sku: string;
  currentStock: number;
  minStock: number;
  status: "low" | "out" | "critical";
  location: string;
  lastUpdated: string;
}

// @ts-ignore
const InventoryDashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch inventory metrics
  const {
    data: metrics,
    error: metricsError,
    isLoading: metricsLoading,
  } = useSWR<InventoryMetrics>("/api/inventory/status", async (url: string) => {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch inventory metrics");
    return response.json();
  });

  // Fetch stock alerts
  const {
    data: alerts,
    error: alertsError,
    isLoading: alertsLoading,
  } = useSWR<StockAlert[]>("/api/inventory/alerts", async (url: string) => {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch stock alerts");
    return response.json();
  });

  const inventoryMetrics = [
    {
      title: "Total Items",
      value: metrics?.totalItems || 0,
      change: "+24",
      changeType: "increase" as const,
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Low Stock",
      value: metrics?.lowStockItems || 0,
      change: "-5",
      changeType: "decrease" as const,
      icon: AlertTriangle,
      color: "text-orange-600",
    },
    {
      title: "Out of Stock",
      value: metrics?.outOfStockItems || 0,
      change: "-2",
      changeType: "decrease" as const,
      icon: ShoppingCart,
      color: "text-red-600",
    },
    {
      title: "Pending Orders",
      value: metrics?.pendingOrders || 0,
      change: "+8",
      changeType: "increase" as const,
      icon: Truck,
      color: "text-purple-600",
    },
  ];

  const getAlertSeverity = (status: string) => {
    switch (status) {
      case "critical":
        return "bg-rose-50 text-rose-800 border-border-gray";
      case "out":
        return "bg-rose-50/80 text-rose-700 border-border-gray";
      case "low":
        return "bg-amber-50 text-amber-800 border-border-gray";
      default:
        return "bg-surface1 text-foreground border-border-gray";
    }
  };

  return (
    <DashboardShell>
      <div className="container mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Header */}
        <header className="bg-surface1 border border-border-gray rounded-2xl shadow-soft px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Inventory Manager Dashboard
            </h1>
            <p className="mt-1 text-sm opacity-80">
              Stock levels, reorder insights, and supply-chain health.
            </p>
          </div>
          <div className="text-xs md:text-sm opacity-80 text-right">
            <div>Signed in as</div>
            <div className="font-medium">{user?.name}</div>
          </div>
        </header>

        {/* Inventory Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricsLoading
            ? [0, 1, 2, 3].map((key) => (
                <div
                  key={key}
                  className="bg-surface1 border border-border-gray rounded-xl shadow-soft p-4 animate-pulse"
                >
                  <div className="h-3 w-32 bg-surface2 rounded mb-3" />
                  <div className="h-5 w-20 bg-surface2 rounded" />
                </div>
              ))
            : inventoryMetrics.map((metric, index) => (
                <div
                  key={index}
                  className="bg-surface1 border border-border-gray rounded-xl shadow-soft p-4 flex flex-col gap-1"
                >
                  <p className="text-xs font-medium uppercase tracking-wide opacity-70">
                    {metric.title}
                  </p>
                  <p className="mt-1 text-2xl font-semibold">{metric.value}</p>
                  <div className="flex items-center gap-1 text-xs opacity-80">
                    <span>{metric.change}</span>
                    <span className="opacity-70">vs last period</span>
                  </div>
                </div>
              ))}
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Stock Alerts + Movement */}
          <div className="lg:col-span-2 space-y-6">
            {/* Critical Alerts */}
            {alerts?.some((alert) => alert.status === "critical") && (
              <EnterpriseCard className="p-6 border border-border-gray bg-rose-50/80">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                  <div className="space-y-1">
                    <h2 className="text-base font-semibold text-rose-900">
                      Critical Stock Alerts
                    </h2>
                    <p className="text-sm opacity-80 text-rose-800">
                      {alerts.filter((a) => a.status === "critical").length}{" "}
                      items require immediate restocking.
                    </p>
                  </div>
                  <button className="ml-auto px-4 py-2 text-sm font-medium rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors">
                    Order Now
                  </button>
                </div>
              </EnterpriseCard>
            )}

            {/* Stock Alerts */}
            <EnterpriseCard className="p-0 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border-gray bg-surface1/60">
                <h2 className="text-sm font-semibold uppercase tracking-wide opacity-80">
                  Stock Alerts
                </h2>
                <button className="text-xs font-medium opacity-80 hover:opacity-100 transition-opacity">
                  View all alerts
                </button>
              </div>
              <div className="bg-surface2">
                {alertsLoading ? (
                  <div className="p-6 space-y-3">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="bg-surface2 border border-border-gray rounded-xl p-4 animate-pulse shadow-soft"
                      >
                        <div className="h-3 w-48 bg-surface1 rounded mb-2" />
                        <div className="h-2 w-32 bg-surface1 rounded" />
                      </div>
                    ))}
                  </div>
                ) : alertsError ? (
                  <div className="px-6 py-8 text-center text-sm text-rose-600">
                    Failed to load stock alerts
                  </div>
                ) : alerts && alerts.length > 0 ? (
                  <ul className="divide-y divide-border-gray">
                    {alerts.map((alert) => (
                      <li
                        key={alert.id}
                        className={cn(
                          "px-6 py-4 bg-surface2 transition duration-150 shadow-soft hover:shadow-elevated hover:-translate-y-[1px]",
                          "flex flex-col gap-2 md:flex-row md:items-start md:justify-between",
                        )}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{alert.item}</span>
                            <span className="text-xs opacity-70">
                              SKU: {alert.sku}
                            </span>
                          </div>
                          <div className="text-xs md:text-sm opacity-80 mb-1">
                            Current Stock:{" "}
                            <span className="font-semibold">
                              {alert.currentStock}
                            </span>{" "}
                            / Min Required:{" "}
                            <span className="font-semibold">
                              {alert.minStock}
                            </span>
                          </div>
                          <div className="text-xs opacity-70">
                            Location: {alert.location} • Updated:{" "}
                            {alert.lastUpdated}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 md:mt-0 md:flex-col md:items-end">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                              getAlertSeverity(alert.status),
                            )}
                          >
                            {alert.status === "critical"
                              ? "Critical"
                              : alert.status === "out"
                                ? "Out of stock"
                                : "Low stock"}
                          </span>
                          <button className="px-3 py-1 text-xs font-medium rounded-xl bg-surface1 border border-border-gray hover:bg-surface0 transition-colors">
                            Order Stock
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-6 py-8 text-center text-sm opacity-70">
                    No stock alerts at this time
                  </div>
                )}
              </div>
            </EnterpriseCard>

            {/* Inventory Movement */}
            <EnterpriseCard className="p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide opacity-80 mb-4">
                Monthly Movement
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center space-y-1">
                  <div className="text-3xl font-bold">
                    {metrics?.monthlyMovement || 0}
                  </div>
                  <div className="text-xs opacity-70">
                    Items Moved This Month
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <div className="text-3xl font-bold">
                    {Math.round((metrics?.monthlyMovement || 0) * 0.6)}
                  </div>
                  <div className="text-xs opacity-70">Items Received</div>
                </div>
                <div className="text-center space-y-1">
                  <div className="text-3xl font-bold">
                    {Math.round((metrics?.monthlyMovement || 0) * 0.4)}
                  </div>
                  <div className="text-xs opacity-70">Items Shipped</div>
                </div>
              </div>
            </EnterpriseCard>
          </div>

          {/* Right Column: Warehouse Status & Quick Actions */}
          <div className="space-y-6">
            {/* Warehouse Capacity */}
            <EnterpriseCard className="p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide opacity-80 mb-4">
                Warehouse Capacity
              </h2>
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-32 h-32 transform -rotate-90 text-border-gray">
                    <circle
                      cx="64"
                      cy={64}
                      r={56}
                      stroke="currentColor"
                      strokeWidth={12}
                      fill="none"
                      className="opacity-30"
                    />
                    <circle
                      cx={64}
                      cy={64}
                      r={56}
                      stroke="currentColor"
                      strokeWidth={12}
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - (metrics?.warehouseCapacity || 0) / 100)}`}
                      className="text-emerald-500 transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">
                      {metrics?.warehouseCapacity || 0}%
                    </span>
                  </div>
                </div>
                <div className="text-xs opacity-70">Space Utilized</div>
              </div>
            </EnterpriseCard>

            {/* Quick Actions */}
            <EnterpriseCard variant="elevated" className="p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide opacity-80 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 text-left text-sm bg-surface1 border border-border-gray rounded-xl shadow-soft hover:-translate-y-[1px] hover:shadow-elevated transition flex items-center gap-3">
                  <Package className="w-4 h-4" />
                  <span>Add New Item</span>
                </button>
                <button className="w-full px-4 py-2 text-left text-sm bg-surface1 border border-border-gray rounded-xl shadow-soft hover:-translate-y-[1px] hover:shadow-elevated transition flex items-center gap-3">
                  <Truck className="w-4 h-4" />
                  <span>Receive Shipment</span>
                </button>
                <button className="w-full px-4 py-2 text-left text-sm bg-surface1 border border-border-gray rounded-xl shadow-soft hover:-translate-y-[1px] hover:shadow-elevated transition flex items-center gap-3">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Place Order</span>
                </button>
                <button className="w-full px-4 py-2 text-left text-sm bg-surface1 border border-border-gray rounded-xl shadow-soft hover:-translate-y-[1px] hover:shadow-elevated transition flex items-center gap-3">
                  <Warehouse className="w-4 h-4" />
                  <span>Warehouse Map</span>
                </button>
              </div>
            </EnterpriseCard>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default InventoryDashboard;
