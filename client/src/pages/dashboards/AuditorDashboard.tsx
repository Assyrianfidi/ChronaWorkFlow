import * as React from "react"
import { useAuth } from "../../contexts/AuthContext"
import useSWR from "swr"
import { DashboardMetricCard, ActivityFeed } from "../../components/dashboard"
import { Shield, FileText, AlertTriangle, CheckCircle, Eye, Download } from "lucide-react"
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

interface AuditLog {
  id: string
  action: string
  user: string
  timestamp: string
  status: 'compliant' | 'warning' | 'violation'
  details: string
}

interface ComplianceMetrics {
  totalAudits: number
  compliantRate: number
  violationsFound: number
  lastAuditDate: string
  pendingReviews: number
  criticalAlerts: number
}

const AuditorDashboard: React.FC = () => {
  const { user } = useAuth()

  // Fetch compliance metrics
  const { data: metrics, error: metricsError, isLoading: metricsLoading } = useSWR<ComplianceMetrics>(
    '/api/dashboard/compliance-metrics',
    async (url: string) => {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) throw new Error('Failed to fetch compliance metrics')
      return response.json()
    }
  )

  // Fetch audit logs
  const { data: auditLogs, error: logsError, isLoading: logsLoading } = useSWR<AuditLog[]>(
    '/api/dashboard/audit-logs',
    async (url: string) => {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) throw new Error('Failed to fetch audit logs')
      return response.json()
    }
  )

  const complianceMetrics = [
    {
      title: "Total Audits",
      value: metrics?.totalAudits || 0,
      change: "+12",
      changeType: "increase" as const,
      icon: Shield,
      color: "text-blue-600"
    },
    {
      title: "Compliance Rate",
      value: `${metrics?.compliantRate || 0}%`,
      change: "+2.1%",
      changeType: "increase" as const,
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "Violations Found",
      value: metrics?.violationsFound || 0,
      change: "-3",
      changeType: "decrease" as const,
      icon: AlertTriangle,
      color: "text-red-600"
    },
    {
      title: "Pending Reviews",
      value: metrics?.pendingReviews || 0,
      change: "+5",
      changeType: "increase" as const,
      icon: FileText,
      color: "text-orange-600"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600 bg-green-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'violation': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Auditor Dashboard</h1>
          <p className="text-gray-600 mt-1">Compliance monitoring and audit logs</p>
        </div>
        <div className="text-sm text-gray-500">
          Read-only access • Welcome, {user?.name}
        </div>
      </div>

      {/* Compliance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {complianceMetrics?.map((metric, index) => (
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
      {(metrics?.criticalAlerts || 0) > 0 && (
        <EnterpriseCard className="p-6 border-2 border-red-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h2 className="text-lg font-semibold text-red-900">Critical Alerts</h2>
              <p className="text-red-700">{metrics?.criticalAlerts || 0} items require immediate attention</p>
            </div>
            <button className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Review Now
            </button>
          </div>
        </EnterpriseCard>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Audit Logs */}
        <div className="lg:col-span-2">
          <EnterpriseCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Audit Logs</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
            <div className="space-y-3">
              {logsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : logsError ? (
                <div className="text-center py-8 text-red-600">
                  Failed to load audit logs
                </div>
              ) : (
                auditLogs?.map((log) => (
                  <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">{log.action}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(log.status)}`}>
                            {log.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">{log.details}</div>
                        <div className="text-xs text-gray-500">
                          {log.user} • {log.timestamp}
                        </div>
                      </div>
                      <button className="ml-4 text-blue-600 hover:text-blue-700">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    No audit logs available
                  </div>
                )
              )}
            </div>
          </EnterpriseCard>
        </div>

        {/* Compliance Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Last Audit Info */}
          <EnterpriseCard className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Last Audit</h2>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {metrics?.lastAuditDate ? new Date(metrics.lastAuditDate).toLocaleDateString() : 'N/A'}
              </div>
              <div className="text-sm text-gray-500 mb-4">Completion date</div>
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Start New Audit
              </button>
            </div>
          </EnterpriseCard>

          {/* Quick Actions */}
          <EnterpriseCard className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-3">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Generate Report</span>
              </button>
              <button className="w-full px-4 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-3">
                <Eye className="w-4 h-4 text-green-600" />
                <span>View All Logs</span>
              </button>
              <button className="w-full px-4 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-3">
                <Download className="w-4 h-4 text-purple-600" />
                <span>Export Data</span>
              </button>
            </div>
          </EnterpriseCard>
        </div>
      </div>

      {/* Compliance Overview */}
      <EnterpriseCard className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Compliance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Data Protection</span>
              <span className="text-sm text-green-600">98%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '98%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Access Control</span>
              <span className="text-sm text-green-600">95%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '95%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Audit Trail</span>
              <span className="text-sm text-yellow-600">87%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '87%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Documentation</span>
              <span className="text-sm text-green-600">92%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
            </div>
          </div>
        </div>
      </EnterpriseCard>
    </div>
  )
}

export default AuditorDashboard
