import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/components/ui/card";
import { apiRequest } from "@/lib/api";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { formatCurrency } from "@/lib/formatters";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

interface DashboardData {
  revenue: number;
  expenses: number;
  profit: number;
  invoicesDue: number;
}

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  icon: string;
  color: "blue" | "red" | "green" | "purple";
}

const DashboardPage = () => {
  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => apiRequest.get("/dashboard"),
    initialData: {
      revenue: 0,
      expenses: 0,
      profit: 0,
      invoicesDue: 0,
    },
  });

  // Chart data
  const revenueData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Income",
        data: [12000, 19000, 15000, 25000, 22000, 30000],
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 2,
        tension: 0.3,
      },
      {
        label: "Expenses",
        data: [8000, 11000, 9000, 13000, 10000, 15000],
        backgroundColor: "rgba(244, 63, 94, 0.5)",
        borderColor: "rgb(244, 63, 94)",
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  };

  const categoryData = {
    labels: ["Payroll", "Supplies", "Utilities", "Rent", "Marketing", "Other"],
    datasets: [
      {
        data: [35, 20, 15, 15, 10, 5],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(236, 72, 153, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(20, 184, 166, 0.8)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const recentTransactions = [
    {
      id: 1,
      name: "Office Supplies",
      date: "2023-06-15",
      amount: 1250,
      type: "expense",
    },
    {
      id: 2,
      name: "Client Payment",
      date: "2023-06-14",
      amount: 3500,
      type: "income",
    },
    {
      id: 3,
      name: "Utility Bill",
      date: "2023-06-10",
      amount: 850,
      type: "expense",
    },
    {
      id: 4,
      name: "Consulting Fee",
      date: "2023-06-08",
      amount: 2000,
      type: "income",
    },
    {
      id: 5,
      name: "Software Subscription",
      date: "2023-06-05",
      amount: 150,
      type: "expense",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Revenue"
          value={
            isLoading ? "..." : formatCurrency(dashboardData?.revenue || 0)
          }
          change={12.5}
          icon="📈"
          color="blue"
        />
        <KPICard
          title="Expenses"
          value={
            isLoading ? "..." : formatCurrency(dashboardData?.expenses || 0)
          }
          change={-5.2}
          icon="💸"
          color="red"
        />
        <KPICard
          title="Profit"
          value={isLoading ? "..." : formatCurrency(dashboardData?.profit || 0)}
          change={8.3}
          icon="💰"
          color="green"
        />
        <KPICard
          title="Invoices Due"
          value={isLoading ? "..." : dashboardData?.invoicesDue || 0}
          change={-2.1}
          icon="📝"
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line
                data={revenueData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "top" as const,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: (value) => `$${value}`,
                      },
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Pie
                data={categoryData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "right" as const,
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              View All
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {recentTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                          {transaction.type === "income" ? "↑" : "↓"}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {transaction.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {transaction.type === "income"
                              ? "Income"
                              : "Expense"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                        transaction.type === "income"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {transaction.type === "expense" ? "-" : ""}
                      {formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  icon,
  color,
}) => {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    red: "from-red-500 to-red-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className={`bg-gradient-to-r ${colors[color]} p-4 text-white`}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-blue-100">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="bg-white/20 p-3 rounded-full transition-transform hover:scale-110">
            <span className="text-2xl">{icon}</span>
          </div>
        </div>
        <div className="mt-2">
          <span
            className={`text-xs font-medium ${
              change >= 0 ? "text-green-200" : "text-red-200"
            }`}
          >
            {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% from last month
          </span>
        </div>
      </div>
    </Card>
  );
};

export default DashboardPage;
