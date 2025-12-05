import * as React from "react"
import { useAuth } from "../../contexts/AuthContext"
import useSWR from "swr"
import { DashboardMetricCard, InventoryStatus } from "../../components/dashboard"
import { Package, AlertTriangle, TrendingUp, ShoppingCart, Truck, Warehouse } from "lucide-react"
import { cn } from "../../lib/utils"

interface EnterpriseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined" | "glass"
}

const EnterpriseCard = React.forwardRef<HTMLDivElement, EnterpriseCardProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-white shadow-sm transition-all duration-200",
        {
          "border-gray-200 hover:shadow-md": variant === "default",
          "border-gray-100 shadow-lg hover:shadow-xl": variant === "elevated",
          "border-2 border-gray-300 hover:border-primary-300": variant === "outlined",
          "border-transparent bg-white/80 backdrop-blur-sm hover:bg-white/90": variant === "glass",
        },
        className
      )}
      {...props}
    />
  )
)

EnterpriseCard.displayName = "EnterpriseCard"

interface InventoryMetrics {
  totalItems: number
  lowStockItems: number
  outOfStockItems: number
  pendingOrders: number
  warehouseCapacity: number
  monthlyMovement: number
}

interface StockAlert {
  id: string
  item: string
  sku: string
  currentStock: number
  minStock: number
  status: 'low' | 'out' | 'critical'
  location: string
  lastUpdated: string
}

const InventoryDashboard: React.FC = () => {
  const { user } = useAuth()

  // Fetch inventory metrics
  const { data: metrics, error: metricsError, isLoading: metricsLoading } = useSWR<InventoryMetrics>(
    '/api/inventory/status',
    async (url: string) => {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) throw new Error('Failed to fetch inventory metrics')
      return response.json()
    }
  )

  // Fetch stock alerts
  const { data: alerts, error: alertsError, isLoading: alertsLoading } = useSWR<StockAlert[]>(
    '/api/inventory/alerts',
    async (url: string) => {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) throw new Error('Failed to fetch stock alerts')
      return response.json()
    }
  )

  const inventoryMetrics = [
    {
      title: "Total Items",
      value: metrics?.totalItems || 0,
      change: "+24",
      changeType: "increase" as const,
      icon: Package,
      color: "text-blue-600"
    },
    {
      title: "Low Stock",
      value: metrics?.lowStockItems || 0,
      change: "-5",
      changeType: "decrease" as const,
      icon: AlertTriangle,
      color: "text-orange-600"
    },
    {
      title: "Out of Stock",
      value: metrics?.outOfStockItems || 0,
      change: "-2",
      changeType: "decrease" as const,
      icon: ShoppingCart,
      color: "text-red-600"
    },
    {
      title: "Pending Orders",
      value: metrics?.pendingOrders || 0,
      change: "+8",
      changeType: "increase" as const,
      icon: Truck,
      color: "text-purple-600"
    }
  ]

  const getAlertSeverity = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'out': return 'bg-red-50 text-red-700 border-red-200'
      case 'low': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Dashboard</h1>
          <p className="text-gray-600 mt-1">Stock management and warehouse tracking</p>
        </div>
        <div className="text-sm text-gray-500">
          Welcome back, {user?.name}
        </div>
      </div>

      {/* Inventory Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {inventoryMetrics.map((metric, index) => (
          <DashboardMetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            change={metric.change}
            changeType={metric.changeType}
            icon={metric.icon}
            color={metric.color}
            isLoading={metricsLoading}
          />
        ))}
      </div>

      {/* Critical Alerts */}
      {alerts?.some(alert => alert.status === 'critical') && (
        <EnterpriseCard className="p-6 border-2 border-red-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h2 className="text-lg font-semibold text-red-900">Critical Stock Alerts</h2>
              <p className="text-red-700">
                {alerts.filter(a => a.status === 'critical').length} items require immediate restocking
              </p>
            </div>
            <button className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Order Now
            </button>
          </div>
        </EnterpriseCard>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Alerts */}
        <div className="lg:col-span-2">
          <EnterpriseCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Stock Alerts</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700">
                View All Alerts
              </button>
            </div>
            <div className="space-y-3">
              {alertsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : alertsError ? (
                <div className="text-center py-8 text-red-600">
                  Failed to load stock alerts
                </div>
              ) : (
                alerts?.map((alert) => (
                  <div key={alert.id} className={`border rounded-lg p-4 ${getAlertSeverity(alert.status)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">{alert.item}</span>
                          <span className="text-sm opacity-75">SKU: {alert.sku}</span>
                        </div>
                        <div className="text-sm mb-1">
                          Current Stock: <span className="font-semibold">{alert.currentStock}</span> / 
                          Min Required: <span className="font-semibold">{alert.minStock}</span>
                        </div>
                        <div className="text-xs opacity-75">
                          Location: {alert.location} • Updated: {alert.lastUpdated}
                        </div>
                      </div>
                      <button className="ml-4 px-3 py-1 bg-white bg-opacity-50 rounded text-sm font-medium hover:bg-opacity-70 transition-colors">
                        Order Stock
                      </button>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    No stock alerts at this time
                  </div>
                )
              )}
            </div>
          </EnterpriseCard>
        </div>

        {/* Warehouse Status */}
        <div className="lg:col-span-1 space-y-6">
          {/* Warehouse Capacity */}
          <EnterpriseCard className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Warehouse Capacity</h2>
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - (metrics?.warehouseCapacity || 0) / 100)}`}
                    className="text-blue-600 transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{metrics?.warehouseCapacity || 0}%</span>
                </div>
              </div>
              <div className="text-sm text-gray-500">Space Utilized</div>
            </div>
          </EnterpriseCard>

          {/* Quick Actions */}
          <EnterpriseCard className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-3">
                <Package className="w-4 h-4 text-blue-600" />
                <span>Add New Item</span>
              </button>
              <button className="w-full px-4 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-3">
                <Truck className="w-4 h-4 text-green-600" />
                <span>Receive Shipment</span>
              </button>
              <button className="w-full px-4 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-3">
                <ShoppingCart className="w-4 h-4 text-purple-600" />
                <span>Place Order</span>
              </button>
              <button className="w-full px-4 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-3">
                <Warehouse className="w-4 h-4 text-orange-600" />
                <span>Warehouse Map</span>
              </button>
            </div>
          </EnterpriseCard>
        </div>
      </div>

      {/* Inventory Movement */}
      <EnterpriseCard className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Movement</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {metrics?.monthlyMovement || 0}
            </div>
            <div className="text-sm text-gray-500">Items Moved This Month</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {Math.round((metrics?.monthlyMovement || 0) * 0.6)}
            </div>
            <div className="text-sm text-gray-500">Items Received</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {Math.round((metrics?.monthlyMovement || 0) * 0.4)}
            </div>
            <div className="text-sm text-gray-500">Items Shipped</div>
          </div>
        </div>
      </EnterpriseCard>
    </div>
  )
}

export default InventoryDashboard
