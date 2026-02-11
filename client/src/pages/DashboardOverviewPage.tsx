import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import { usersService } from "@/services/users.service";
import { companiesService } from "@/services/companies.service";
import { transactionsService } from "@/services/transactions.service";
import { invoicesService } from "@/services/invoices.service";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Users, Building2, TrendingUp, FileText } from "lucide-react";

interface DashboardStats {
  users: { total: number };
  companies: { total: number };
  transactions: { total: number; totalAmount: number };
  invoices: { total: number; totalAmount: number };
}

export function DashboardOverviewPage() {
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: DashboardStats;
      }>("/dashboard/stats");
      return response.data;
    },
  });

  const { data: userStatsData } = useQuery({
    queryKey: ["user-stats"],
    queryFn: () => usersService.getStats(),
  });

  const { data: companyStatsData } = useQuery({
    queryKey: ["company-stats"],
    queryFn: () => companiesService.getStats(),
  });

  const { data: transactionStatsData } = useQuery({
    queryKey: ["transaction-stats"],
    queryFn: () => transactionsService.getStats(),
  });

  const { data: invoiceStatsData } = useQuery({
    queryKey: ["invoice-stats"],
    queryFn: () => invoicesService.getStats(),
  });

  if (isDashboardLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.data;
  const userStats = userStatsData?.data.data;
  const companyStats = companyStatsData?.data.data;
  const transactionStats = transactionStatsData?.data.data;
  const invoiceStats = invoiceStatsData?.data.data;

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your AccuBooks platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.users.total || 0}
              </p>
              {userStats && (
                <p className="text-sm text-gray-500 mt-1">
                  {userStats.active} active
                </p>
              )}
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Companies</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.companies.total || 0}
              </p>
              {companyStats && (
                <p className="text-sm text-gray-500 mt-1">
                  {companyStats.byIndustry.length} industries
                </p>
              )}
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.transactions.total || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                $
                {(stats?.transactions.totalAmount || 0).toLocaleString(
                  "en-US",
                  { minimumFractionDigits: 2 },
                )}
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Invoices</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.invoices.total || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                $
                {(stats?.invoices.totalAmount || 0).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Users by Role */}
        {userStats && userStats.byRole && userStats.byRole.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Users by Role</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userStats.byRole}
                  dataKey="count"
                  nameKey="role"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.role}: ${entry.count}`}
                >
                  {userStats.byRole.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Companies by Industry */}
        {companyStats &&
          companyStats.byIndustry &&
          companyStats.byIndustry.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">
                Companies by Industry
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={companyStats.byIndustry}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="industry" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" name="Companies" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transactions by Type */}
        {transactionStats &&
          transactionStats.byType &&
          transactionStats.byType.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">
                Transactions by Type
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={transactionStats.byType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="count"
                    fill="#10b981"
                    name="Count"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="amount"
                    fill="#3b82f6"
                    name="Amount ($)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

        {/* Invoices by Status */}
        {invoiceStats &&
          invoiceStats.byStatus &&
          invoiceStats.byStatus.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Invoices by Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={invoiceStats.byStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.status}: ${entry.count}`}
                  >
                    {invoiceStats.byStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
      </div>

      {/* Summary Stats */}
      {invoiceStats && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Invoices
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {invoiceStats.total}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Invoice Amount
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                $
                {invoiceStats.totalAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Overdue Invoices
              </p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {invoiceStats.overdue}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
