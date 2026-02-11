import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "../services/admin.service";
import {
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  Activity,
  AlertTriangle,
  Server,
  Database,
  Clock,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export default function AdminGlobalDashboard() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");

  const { data: globalStats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-global-stats"],
    queryFn: () => adminService.getGlobalStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: revenueMetrics, isLoading: revenueLoading } = useQuery({
    queryKey: ["admin-revenue-metrics"],
    queryFn: () => adminService.getRevenueMetrics(),
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: systemHealth, isLoading: healthLoading } = useQuery({
    queryKey: ["admin-system-health"],
    queryFn: () => adminService.getSystemHealth(),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: featureUsage } = useQuery({
    queryKey: ["admin-feature-usage"],
    queryFn: () => adminService.getFeatureUsage(),
  });

  const isLoading = statsLoading || revenueLoading || healthLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const revenueByPlanData = revenueMetrics
    ? Object.entries(revenueMetrics.revenueByPlan).map(([plan, data]) => ({
        name: plan,
        revenue: data.revenue,
        count: data.count,
      }))
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Owner Control Center
          </h1>
          <p className="text-gray-600">
            Global system analytics and monitoring dashboard
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* MRR Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">
              Monthly Recurring Revenue
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(revenueMetrics?.mrr || 0)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              ARR: {formatCurrency(revenueMetrics?.arr || 0)}
            </p>
          </div>

          {/* Active Subscriptions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">
              Active Subscriptions
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              {revenueMetrics?.activeSubscriptions || 0}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Total Users: {globalStats?.users.total || 0}
            </p>
          </div>

          {/* Churn Rate */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">
              Churn Rate (30d)
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              {revenueMetrics?.churnRate.toFixed(1) || 0}%
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Churned: {revenueMetrics?.churnedLast30Days || 0}
            </p>
          </div>

          {/* Total Companies */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">
              Total Companies
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              {globalStats?.companies.total || 0}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Active: {globalStats?.companies.active || 0}
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue by Plan */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Revenue by Plan
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByPlanData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue ($)" />
                <Bar dataKey="count" fill="#10b981" name="Subscribers" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Features Usage */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Top Features by Usage
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={featureUsage?.topFeatures.slice(0, 5) || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="feature" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalUses" fill="#8b5cf6" name="Total Uses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Health Panel */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              System Health
            </h3>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  systemHealth?.database === "healthy"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              ></div>
              <span className="text-sm text-gray-600">
                {systemHealth?.database === "healthy"
                  ? "All Systems Operational"
                  : "System Issues Detected"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Database Status */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Database</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {systemHealth?.database || "Unknown"}
                </p>
              </div>
            </div>

            {/* Server Uptime */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Uptime</p>
                <p className="text-lg font-semibold text-gray-900">
                  {systemHealth?.server.uptime
                    ? formatUptime(systemHealth.server.uptime)
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* Memory Usage */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Server className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Memory Used</p>
                <p className="text-lg font-semibold text-gray-900">
                  {systemHealth?.server.memoryUsage.heapUsed || 0} MB
                </p>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Activity className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Sessions</p>
                <p className="text-lg font-semibold text-gray-900">
                  {systemHealth?.metrics.activeSessions || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t">
            <div>
              <p className="text-sm text-gray-600 mb-1">Recent Errors (24h)</p>
              <p className="text-2xl font-bold text-gray-900">
                {systemHealth?.metrics.recentErrors || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">
                Suspicious Activities
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {systemHealth?.metrics.suspiciousActivities || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">API Calls Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {systemHealth?.metrics.apiCallsToday || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              User Statistics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Users</span>
                <span className="font-semibold">
                  {globalStats?.users.total || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Users</span>
                <span className="font-semibold text-green-600">
                  {globalStats?.users.active || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Inactive Users</span>
                <span className="font-semibold text-gray-400">
                  {globalStats?.users.inactive || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Transaction Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Transaction Statistics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Transactions</span>
                <span className="font-semibold">
                  {globalStats?.transactions.total || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Invoices</span>
                <span className="font-semibold">
                  {globalStats?.invoices.total || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Revenue</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(revenueMetrics?.totalRevenue || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Company Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Company Statistics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Companies</span>
                <span className="font-semibold">
                  {globalStats?.companies.total || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Companies</span>
                <span className="font-semibold text-green-600">
                  {globalStats?.companies.active || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Inactive Companies</span>
                <span className="font-semibold text-gray-400">
                  {globalStats?.companies.inactive || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
