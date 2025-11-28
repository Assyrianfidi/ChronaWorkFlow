import * as React from "react"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  CreditCard, 
  DollarSign,
  AlertCircle,
  Calendar,
  Filter,
  PieChart
} from "lucide-react"
import { 
  AccountsBalanceCard, 
  RevenueCard, 
  ExpensesCard, 
  PendingInvoicesCard 
} from "../ui/EnterpriseKPICard"
import { EnterpriseDataTable, type Column } from "../ui/EnterpriseDataTable"
import { EnterpriseButton } from "../ui/EnterpriseButton"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { cn } from "../../lib/utils"

interface EnterpriseDashboardNewProps {
  className?: string
}

const EnterpriseDashboardNew = React.forwardRef<HTMLDivElement, EnterpriseDashboardNewProps>(
  ({ className }, ref) => {
    const [selectedPeriod, setSelectedPeriod] = React.useState("month")
    const [selectedAccount, setSelectedAccount] = React.useState("all")

    // Mock data for demonstration
    const recentTransactions = [
      { 
        id: "INV-001", 
        date: "2024-01-15", 
        account: "Business Account", 
        type: "Invoice", 
        amount: "$2,500.00", 
        status: "Paid",
        category: "Sales"
      },
      { 
        id: "INV-002", 
        date: "2024-01-14", 
        account: "Business Account", 
        type: "Invoice", 
        amount: "$1,800.00", 
        status: "Pending",
        category: "Sales"
      },
      { 
        id: "TRN-003", 
        date: "2024-01-13", 
        account: "Operating Account", 
        type: "Expense", 
        amount: "$3,200.00", 
        status: "Completed",
        category: "Operations"
      },
      { 
        id: "INV-004", 
        date: "2024-01-12", 
        account: "Business Account", 
        type: "Invoice", 
        amount: "$950.00", 
        status: "Overdue",
        category: "Sales"
      },
      { 
        id: "TRN-005", 
        date: "2024-01-11", 
        account: "Operating Account", 
        type: "Expense", 
        amount: "$5,100.00", 
        status: "Completed",
        category: "Operations"
      },
    ]

    const transactionColumns: Column<typeof recentTransactions[0]>[] = [
      {
        key: "date",
        title: "Date",
        sortable: true,
        filterable: true,
        width: "120px",
        render: (value) => (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>{value}</span>
          </div>
        )
      },
      {
        key: "account",
        title: "Account",
        sortable: true,
        filterable: true,
        render: (value) => (
          <div className="font-medium">{value}</div>
        )
      },
      {
        key: "type",
        title: "Type",
        sortable: true,
        filterable: true,
        render: (value) => {
          const typeColors = {
            Invoice: "bg-blue-100 text-blue-800",
            Expense: "bg-red-100 text-red-800",
            Payment: "bg-green-100 text-green-800"
          }
          return (
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              typeColors[value as keyof typeof typeColors] || "bg-gray-100 text-gray-800"
            )}>
              {value}
            </span>
          )
        }
      },
      {
        key: "amount",
        title: "Amount",
        sortable: true,
        render: (value, row) => (
          <div className={cn(
            "font-semibold",
            row.type === "Expense" ? "text-danger" : "text-success"
          )}>
            {row.type === "Expense" ? "-" : "+"}{value}
          </div>
        )
      },
      {
        key: "status",
        title: "Status",
        sortable: true,
        filterable: true,
        render: (value) => {
          const statusColors = {
            Paid: "bg-green-100 text-green-800",
            Pending: "bg-yellow-100 text-yellow-800",
            Overdue: "bg-red-100 text-red-800",
            Completed: "bg-blue-100 text-blue-800"
          }
          return (
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              statusColors[value as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
            )}>
              {value}
            </span>
          )
        }
      },
      {
        key: "category",
        title: "Category",
        sortable: true,
        filterable: true,
        render: (value) => (
          <span className="text-sm text-gray-600">{value}</span>
        )
      }
    ]

    const notifications = [
      { 
        id: 1, 
        type: "warning", 
        title: "Upcoming Invoice", 
        message: "Invoice INV-006 due in 3 days",
        time: "2 hours ago"
      },
      { 
        id: 2, 
        type: "error", 
        title: "Overdue Payment", 
        message: "Payment from XYZ Industries is 5 days overdue",
        time: "5 hours ago"
      },
      { 
        id: 3, 
        type: "success", 
        title: "Payment Received", 
        message: "Payment of $2,500 received from ABC Corp",
        time: "1 day ago"
      },
    ]

    const chartData = {
      revenue: [
        { month: "Jan", revenue: 45000, expenses: 32000 },
        { month: "Feb", revenue: 52000, expenses: 35000 },
        { month: "Mar", revenue: 48000, expenses: 33000 },
        { month: "Apr", revenue: 61000, expenses: 38000 },
        { month: "May", revenue: 55000, expenses: 36000 },
        { month: "Jun", revenue: 67000, expenses: 40000 },
      ],
      transactions: [
        { account: "Business Account", volume: 45 },
        { account: "Operating Account", volume: 32 },
        { account: "Savings Account", volume: 18 },
        { account: "Payroll Account", volume: 28 },
      ],
      expenses: [
        { category: "Operations", amount: 35, color: "#3B82F6" },
        { category: "Marketing", amount: 25, color: "#10B981" },
        { category: "Payroll", amount: 30, color: "#F59E0B" },
        { category: "Utilities", amount: 10, color: "#EF4444" },
      ]
    }

    return (
      <div ref={ref} className={cn("min-h-screen bg-background", className)}>
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">Dashboard Overview</h1>
              <p className="text-gray-600">Welcome back! Here's what's happening with your business today.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
              
              <EnterpriseButton
                variant="outline"
                size="sm"
                icon={<Filter className="h-4 w-4" />}
              >
                Filters
              </EnterpriseButton>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AccountsBalanceCard value="$124,563" change={12.5} />
          <RevenueCard value="$67,000" change={8.2} />
          <ExpensesCard value="$40,000" change={-3.1} />
          <PendingInvoicesCard value="3" change={-25} />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue vs Expenses Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue vs Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Line Chart</p>
                  <p className="text-sm text-gray-400">Revenue vs Expenses over time</p>
                  <div className="mt-4 space-y-1 text-xs text-gray-500">
                    {chartData.revenue.slice(0, 3).map((item, index) => (
                      <div key={index}>
                        {item.month}: Revenue ${item.revenue.toLocaleString()} | Expenses ${item.expenses.toLocaleString()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Volume Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Transaction Volume by Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Bar Chart</p>
                  <p className="text-sm text-gray-400">Transaction volume per account</p>
                  <div className="mt-4 space-y-1 text-xs text-gray-500">
                    {chartData.transactions.map((item, index) => (
                      <div key={index}>
                        {item.account}: {item.volume} transactions
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expense Distribution Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Expense Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-2 rounded-full border-8 border-gray-200 border-t-blue-500 border-r-green-500 border-b-yellow-500 border-l-red-500" />
                  <p className="text-gray-500">Pie Chart</p>
                  <p className="text-sm text-gray-400">Expense by category</p>
                  <div className="mt-4 space-y-1 text-xs text-gray-500">
                    {chartData.expenses.map((item, index) => (
                      <div key={index} className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.category}: {item.amount}%
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Table */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <EnterpriseButton variant="outline" size="sm">
                View All
              </EnterpriseButton>
            </CardHeader>
            <CardContent>
              <EnterpriseDataTable
                data={recentTransactions}
                columns={transactionColumns}
                searchable={false}
                exportable={true}
                pagination={false}
                height="300px"
                onRowClick={(row) => console.log('Transaction clicked:', row)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Notifications Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Notifications & Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border",
                    notification.type === "error" && "bg-red-50 border-red-200",
                    notification.type === "warning" && "bg-yellow-50 border-yellow-200",
                    notification.type === "success" && "bg-green-50 border-green-200"
                  )}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-2",
                    notification.type === "error" && "bg-red-500",
                    notification.type === "warning" && "bg-yellow-500",
                    notification.type === "success" && "bg-green-500"
                  )} />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-gray-900">{notification.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
)
EnterpriseDashboardNew.displayName = "EnterpriseDashboardNew"

export { EnterpriseDashboardNew }
