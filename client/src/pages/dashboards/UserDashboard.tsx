import * as React from "react"
import { useAuth } from "../../contexts/AuthContext"
import useSWR from "swr"
import { DashboardMetricCard, ActivityFeed } from "../../components/dashboard"
import { User, FileText, Bell, Calendar, Clock, CheckCircle } from "lucide-react"
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

interface UserActivity {
  id: string
  type: 'login' | 'document' | 'task' | 'notification'
  message: string
  timestamp: string
  status?: 'completed' | 'pending' | 'overdue'
}

interface UserStats {
  documentsCreated: number
  tasksCompleted: number
  notificationsCount: number
  lastLogin: string
}

const UserDashboard: React.FC = () => {
  const { user } = useAuth()

  // Fetch user stats
  const { data: stats, error: statsError, isLoading: statsLoading } = useSWR<UserStats>(
    '/api/dashboard/user-stats',
    async (url: string) => {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) throw new Error('Failed to fetch user stats')
      return response.json()
    }
  )

  // Fetch user activity
  const { data: activity, error: activityError, isLoading: activityLoading } = useSWR<UserActivity[]>(
    '/api/dashboard/user-activity',
    async (url: string) => {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) throw new Error('Failed to fetch user activity')
      return response.json()
    }
  )

  const metrics = [
    {
      title: "Documents Created",
      value: stats?.documentsCreated || 0,
      change: "+3",
      changeType: "increase" as const,
      icon: FileText,
      color: "text-blue-600"
    },
    {
      title: "Tasks Completed",
      value: stats?.tasksCompleted || 0,
      change: "+5",
      changeType: "increase" as const,
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "Notifications",
      value: stats?.notificationsCount || 0,
      change: "-2",
      changeType: "decrease" as const,
      icon: Bell,
      color: "text-orange-600"
    },
    {
      title: "Last Login",
      value: stats?.lastLogin ? new Date(stats.lastLogin).toLocaleDateString() : "Today",
      change: "Active",
      changeType: "increase" as const,
      icon: Clock,
      color: "text-purple-600"
    }
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600 mt-1">Personal activity and notifications</p>
        </div>
        <div className="text-sm text-gray-500">
          Welcome back, {user?.name}
        </div>
      </div>

      {/* Personal Stats Grid */}
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
            isLoading={statsLoading}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <EnterpriseCard className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <ActivityFeed
              activities={activity?.map(item => ({
                id: item.id,
                type: item.type,
                message: item.message,
                timestamp: item.timestamp,
                user: user?.name
              })) || []}
              isLoading={activityLoading}
              error={activityError}
            />
          </EnterpriseCard>
        </div>

        {/* Quick Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Summary */}
          <EnterpriseCard className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Summary</h2>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="font-medium text-gray-900">{user?.name}</div>
              <div className="text-sm text-gray-500">{user?.email}</div>
              <div className="text-xs text-gray-400 mt-2">Role: {user?.role}</div>
            </div>
          </EnterpriseCard>

          {/* Quick Actions */}
          <EnterpriseCard className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-3">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Create Document</span>
              </button>
              <button className="w-full px-4 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-green-600" />
                <span>View Calendar</span>
              </button>
              <button className="w-full px-4 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-3">
                <User className="w-4 h-4 text-purple-600" />
                <span>Update Profile</span>
              </button>
            </div>
          </EnterpriseCard>
        </div>
      </div>

      {/* Upcoming Tasks */}
      <EnterpriseCard className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Tasks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-900">Due Today</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">3</div>
            <div className="text-sm text-gray-500">Tasks to complete</div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-900">This Week</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">7</div>
            <div className="text-sm text-gray-500">Upcoming tasks</div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-900">Completed</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">12</div>
            <div className="text-sm text-gray-500">This month</div>
          </div>
        </div>
      </EnterpriseCard>
    </div>
  )
}

export default UserDashboard
