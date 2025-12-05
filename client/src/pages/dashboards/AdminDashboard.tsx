import * as React from "react"
import { useAuth } from "../../contexts/AuthContext"
import useSWR from "swr"
import { DashboardMetricCard, QuickActions, ActivityFeed } from "../../components/dashboard"
import { Building2, Users, TrendingUp, AlertTriangle, DollarSign, FileText } from "lucide-react"
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

interface DashboardSummary {
  totalUsers: number
  activeUsers: number
  totalRevenue: number
  monthlyGrowth: number
  pendingReports: number
  systemAlerts: number
}

interface ActivityItem {
  id: string
  type: 'login' | 'report' | 'user_created' | 'system'
  message: string
  timestamp: string
  user?: string
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth()

  // Fetch dashboard summary
  const { data: summary, error: summaryError, isLoading: summaryLoading } = useSWR<DashboardSummary>(
    '/api/dashboard/summary',
    async (url: string) => {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) throw new Error('Failed to fetch dashboard summary')
      return response.json()
    }
  )

  // Fetch activity feed
  const { data: activity, error: activityError, isLoading: activityLoading } = useSWR<ActivityItem[]>(
    '/api/dashboard/activity',
    async (url: string) => {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) throw new Error('Failed to fetch activity feed')
      return response.json()
    }
  )

  const metrics = [
    {
      title: "Total Users",
      value: summary?.totalUsers || 0,
      change: "+12%",
      changeType: "increase" as const,
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Active Users",
      value: summary?.activeUsers || 0,
      change: "+8%",
      changeType: "increase" as const,
      icon: Building2,
      color: "text-green-600"
    },
    {
      title: "Total Revenue",
      value: `$${( (summary?.totalRevenue || 0) / 1000 ).toFixed(1)}K`,
      change: `${summary?.monthlyGrowth || 0}%`,
      changeType: summary?.monthlyGrowth && summary.monthlyGrowth > 0 ? "increase" : "decrease" as const,
      icon: DollarSign,
      color: "text-purple-600"
    },
    {
      title: "System Alerts",
      value: summary?.systemAlerts || 0,
      change: "-2",
      changeType: "decrease" as const,
      icon: AlertTriangle,
      color: "text-red-600"
    }
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">System overview and administrative controls</p>
        </div>
        <div className="text-sm text-gray-500">
          Welcome back, {user?.name}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <DashboardMetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            change={metric.change}
            changeType={metric.changeType}
            icon={metric.icon}
            color={metric.color}
            isLoading={summaryLoading}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <EnterpriseCard className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <QuickActions
              actions={[
                { label: "Create User", icon: Users, href: "/users/create" },
                { label: "Generate Reports", icon: FileText, href: "/reports" },
                { label: "System Settings", icon: Building2, href: "/settings" },
                { label: "View Analytics", icon: TrendingUp, href: "/analytics" }
              ]}
            />
          </EnterpriseCard>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <EnterpriseCard className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <ActivityFeed
              activities={activity || []}
              isLoading={activityLoading}
              error={activityError}
            />
          </EnterpriseCard>
        </div>
      </div>

      {/* System Status */}
      <EnterpriseCard className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <div className="font-medium text-gray-900">Database</div>
              <div className="text-sm text-gray-500">Operational</div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <div className="font-medium text-gray-900">API Services</div>
              <div className="text-sm text-gray-500">All systems online</div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div>
              <div className="font-medium text-gray-900">Storage</div>
              <div className="text-sm text-gray-500">78% used</div>
            </div>
          </div>
        </div>
      </EnterpriseCard>
    </div>
  )
}

export default AdminDashboard
