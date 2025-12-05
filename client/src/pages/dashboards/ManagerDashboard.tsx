import * as React from "react"
import { useAuth } from "../../contexts/AuthContext"
import useSWR from "swr"
import { DashboardMetricCard, QuickActions, ActivityFeed } from "../../components/dashboard"
import { TrendingUp, DollarSign, Target, FileText, Users, Calendar } from "lucide-react"
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

interface FinancialKPIs {
  monthlyRevenue: number
  profitMargin: number
  expensesTotal: number
  revenueGrowth: number
  pendingApprovals: number
  teamPerformance: number
}

interface TeamActivity {
  id: string
  type: 'approval' | 'report' | 'expense' | 'target'
  message: string
  timestamp: string
  priority: 'high' | 'medium' | 'low'
}

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth()

  // Fetch financial KPIs
  const { data: kpis, error: kpisError, isLoading: kpisLoading } = useSWR<FinancialKPIs>(
    '/api/dashboard/financial-kpis',
    async (url: string) => {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) throw new Error('Failed to fetch financial KPIs')
      return response.json()
    }
  )

  // Fetch team activity
  const { data: activity, error: activityError, isLoading: activityLoading } = useSWR<TeamActivity[]>(
    '/api/dashboard/team-activity',
    async (url: string) => {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) throw new Error('Failed to fetch team activity')
      return response.json()
    }
  )

  const metrics = [
    {
      title: "Monthly Revenue",
      value: `$${( (kpis?.monthlyRevenue || 0) / 1000 ).toFixed(1)}K`,
      change: `${kpis?.revenueGrowth || 0}%`,
      changeType: kpis?.revenueGrowth && kpis.revenueGrowth > 0 ? "increase" : "decrease" as const,
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Profit Margin",
      value: `${kpis?.profitMargin || 0}%`,
      change: "+2.1%",
      changeType: "increase" as const,
      icon: TrendingUp,
      color: "text-blue-600"
    },
    {
      title: "Total Expenses",
      value: `$${( (kpis?.expensesTotal || 0) / 1000 ).toFixed(1)}K`,
      change: "-5%",
      changeType: "decrease" as const,
      icon: FileText,
      color: "text-orange-600"
    },
    {
      title: "Team Performance",
      value: `${kpis?.teamPerformance || 0}%`,
      change: "+8%",
      changeType: "increase" as const,
      icon: Target,
      color: "text-purple-600"
    }
  ]

  const quickActions = [
    { label: "Approve Expenses", icon: DollarSign, href: "/expenses/approve" },
    { label: "Generate Reports", icon: FileText, href: "/reports/generate" },
    { label: "Team Management", icon: Users, href: "/team" },
    { label: "Set Targets", icon: Target, href: "/targets" }
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-600 mt-1">Financial performance and team management</p>
        </div>
        <div className="text-sm text-gray-500">
          Welcome back, {user?.name}
        </div>
      </div>

      {/* KPIs Grid */}
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
            isLoading={kpisLoading}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <EnterpriseCard className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <QuickActions actions={quickActions} />
          </EnterpriseCard>

          {/* Pending Approvals */}
          <EnterpriseCard className="p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Approvals</h2>
            <div className="text-center py-8">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {kpis?.pendingApprovals || 0}
              </div>
              <div className="text-sm text-gray-500">Awaiting your review</div>
              <button className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                Review Now
              </button>
            </div>
          </EnterpriseCard>
        </div>

        {/* Team Activity */}
        <div className="lg:col-span-2">
          <EnterpriseCard className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Activity</h2>
            <div className="space-y-4">
              {activityLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : activityError ? (
                <div className="text-center py-8 text-red-600">
                  Failed to load team activity
                </div>
              ) : (
                activity?.map((item) => (
                  <div key={item.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      item.priority === 'high' ? 'bg-red-500' :
                      item.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{item.message}</div>
                      <div className="text-xs text-gray-500">{item.timestamp}</div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    No recent team activity
                  </div>
                )
              )}
            </div>
          </EnterpriseCard>
        </div>
      </div>

      {/* Performance Overview */}
      <EnterpriseCard className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Revenue Target</span>
              <span className="text-sm text-gray-500">85%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Expense Budget</span>
              <span className="text-sm text-gray-500">72%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '72%' }}></div>
            </div>
          </div>
        </div>
      </EnterpriseCard>
    </div>
  )
}

export default ManagerDashboard
