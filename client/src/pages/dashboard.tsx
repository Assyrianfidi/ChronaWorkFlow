import React from "react"
import { 
  EnterpriseButton, 
  EnterpriseKPICard, 
  RevenueKPI, 
  ExpensesKPI, 
  TransactionsKPI, 
  InvoicesKPI, 
  CustomersKPI,
  AlertsKPI
} from "../components/ui"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Users, 
  AlertCircle, 
  Plus, 
  Download, 
  Bell,
  Search,
  Filter,
  Calendar,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  Zap,
  BarChart3,
  PieChart,
  TrendingUp as TrendIcon
} from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line } from "recharts"
import { cn } from "../lib/utils"

// Mock data for charts
const revenueData = [
  { month: "Jan", revenue: 24500, expenses: 18200, profit: 6300 },
  { month: "Feb", revenue: 28100, expenses: 19800, profit: 8300 },
  { month: "Mar", revenue: 31200, expenses: 21400, profit: 9800 },
  { month: "Apr", revenue: 29800, expenses: 20100, profit: 9700 },
  { month: "May", revenue: 33400, expenses: 22600, profit: 10800 },
  { month: "Jun", revenue: 38900, expenses: 24800, profit: 14100 },
]

const transactionTypesData = [
  { name: "Revenue", value: 45, color: "#10B981" },
  { name: "Expenses", value: 30, color: "#EF4444" },
  { name: "Transfers", value: 15, color: "#3B82F6" },
  { name: "Other", value: 10, color: "#6B7280" },
]

const arAgingData = [
  { range: "0-30 days", amount: 12500, percentage: 65 },
  { range: "31-60 days", amount: 4800, percentage: 25 },
  { range: "61-90 days", amount: 1200, percentage: 6 },
  { range: "90+ days", amount: 800, percentage: 4 },
]

const recentTransactions = [
  { 
    id: "1", 
    date: "2024-01-15", 
    description: "Office Supplies - Staples", 
    amount: -245.50, 
    type: "expense",
    category: "Office Supplies",
    status: "completed"
  },
  { 
    id: "2", 
    date: "2024-01-14", 
    description: "Invoice #1024 - Acme Corp", 
    amount: 5420.00, 
    type: "revenue",
    category: "Services",
    status: "completed"
  },
  { 
    id: "3", 
    date: "2024-01-13", 
    description: "Utility Bill - Electric Co", 
    amount: -432.80, 
    type: "expense",
    category: "Utilities",
    status: "completed"
  },
  { 
    id: "4", 
    date: "2024-01-12", 
    description: "Invoice #1023 - Tech Solutions", 
    amount: 3250.00, 
    type: "revenue",
    category: "Software",
    status: "completed"
  },
  { 
    id: "5", 
    date: "2024-01-11", 
    description: "Salary Payment - January", 
    amount: -12500.00, 
    type: "expense",
    category: "Payroll",
    status: "completed"
  },
]

const notifications = [
  { id: "1", type: "warning", message: "Invoice #1025 is overdue by 3 days", time: "2 hours ago" },
  { id: "2", type: "info", message: "New payment received from Global Tech", time: "4 hours ago" },
  { id: "3", type: "success", message: "Monthly report generated successfully", time: "6 hours ago" },
  { id: "4", type: "warning", message: "Bank reconciliation requires attention", time: "1 day ago" },
]

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = React.useState('6months')
  const [animatedKPIs, setAnimatedKPIs] = React.useState(false)

  React.useEffect(() => {
    setAnimatedKPIs(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-emerald-50/20">
      {/* Glassmorphism Header */}
      <header className="glass border-b border-white/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="animate-slide-up">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-sm text-gray-600 mt-1">Welcome back! Here's your business overview</p>
              </div>
              <div className="relative animate-slide-up" style={{ animationDelay: '100ms' }}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search transactions, invoices, customers..."
                  className="pl-12 pr-4 py-3 w-96 bg-white/50 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all duration-300"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <button className="relative p-3 text-gray-600 hover:text-gray-900 hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-105">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </button>
              <EnterpriseButton 
                variant="ghost" 
                size="sm" 
                icon={<Download className="w-4 h-4" />}
                className="backdrop-blur-sm"
              >
                Export
              </EnterpriseButton>
              <EnterpriseButton 
                variant="primary" 
                size="sm" 
                icon={<Plus className="w-4 h-4" />}
                glowEffect
              >
                Quick Action
              </EnterpriseButton>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* Enhanced KPI Cards with Glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <RevenueKPI 
            value={185700} 
            change={12.5} 
            className="animate-slide-up" 
            style={{ animationDelay: '300ms' }}
            glassmorphism
            animated={animatedKPIs}
          />
          <ExpensesKPI 
            value={126900} 
            change={8.2} 
            className="animate-slide-up" 
            style={{ animationDelay: '400ms' }}
            glassmorphism
            animated={animatedKPIs}
          />
          <TransactionsKPI 
            value={1247} 
            change={15.3} 
            className="animate-slide-up" 
            style={{ animationDelay: '500ms' }}
            glassmorphism
            animated={animatedKPIs}
          />
          <InvoicesKPI 
            value={89} 
            change={-2.1} 
            className="animate-slide-up" 
            style={{ animationDelay: '600ms' }}
            glassmorphism
            animated={animatedKPIs}
          />
          <CustomersKPI 
            value={342} 
            change={18.7} 
            className="animate-slide-up" 
            style={{ animationDelay: '700ms' }}
            glassmorphism
            animated={animatedKPIs}
          />
          <AlertsKPI 
            value={7} 
            className="animate-slide-up" 
            style={{ animationDelay: '800ms' }}
            glassmorphism
            animated={animatedKPIs}
          />
        </div>

        {/* Enhanced Charts Row with Glassmorphism */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Trend Chart */}
          <div className="glass border border-white/20 rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '900ms' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Revenue Trend</h2>
                <p className="text-sm text-gray-600">Monthly revenue vs expenses</p>
              </div>
              <div className="flex items-center gap-2">
                <select 
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-4 py-2 bg-white/50 backdrop-blur-sm border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="6months">Last 6 months</option>
                  <option value="1year">Last year</option>
                  <option value="all">All time</option>
                </select>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    border: '1px solid rgba(255, 255, 255, 0.2)', 
                    borderRadius: '12px',
                    backdropFilter: 'blur(12px)'
                  }}
                  labelStyle={{ color: '#111827', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#revenueGradient)" />
                <Area type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#expenseGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Transaction Types Pie Chart */}
          <div className="glass border border-white/20 rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '1000ms' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Transaction Types</h2>
                <p className="text-sm text-gray-600">Distribution by category</p>
              </div>
              <button className="p-3 text-gray-600 hover:text-gray-900 hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-105">
                <Filter className="w-5 h-5" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={transactionTypesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {transactionTypesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    border: '1px solid rgba(255, 255, 255, 0.2)', 
                    borderRadius: '12px',
                    backdropFilter: 'blur(12px)'
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {transactionTypesData.map((item) => (
                <div key={item.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
                  <div className="w-4 h-4 rounded-full animate-pulse-glow" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-700 font-medium">{item.name}</span>
                  <span className="text-sm font-bold text-gray-900 ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced AR Aging and Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* AR Aging Chart */}
          <div className="glass border border-white/20 rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '1100ms' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">AR Aging</h2>
                <p className="text-sm text-gray-600">Accounts receivable by age</p>
              </div>
              <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-semibold">
                $19,300 total
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={arAgingData} layout="horizontal">
                <XAxis type="number" stroke="#6B7280" />
                <YAxis dataKey="range" type="category" stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    border: '1px solid rgba(255, 255, 255, 0.2)', 
                    borderRadius: '12px',
                    backdropFilter: 'blur(12px)'
                  }}
                />
                <Bar dataKey="amount" fill="url(#gradient-primary)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-3">
              {arAgingData.map((item) => (
                <div key={item.range} className="flex justify-between items-center p-2 rounded-lg hover:bg-white/20 transition-colors">
                  <span className="text-sm font-medium text-gray-700">{item.range}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">${item.amount.toLocaleString()}</span>
                    <span className="text-xs text-gray-500 bg-white/30 px-2 py-1 rounded-full">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Recent Transactions */}
          <div className="lg:col-span-2 glass border border-white/20 rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '1200ms' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Recent Transactions</h2>
                <p className="text-sm text-gray-600">Latest financial activity</p>
              </div>
              <EnterpriseButton 
                variant="ghost" 
                size="sm" 
                icon={<TrendingIcon className="w-4 h-4" />}
                className="backdrop-blur-sm"
              >
                View All
              </EnterpriseButton>
            </div>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                      transaction.type === "revenue" 
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg" 
                        : "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg"
                    )}>
                      {transaction.type === "revenue" ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{transaction.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-bold text-lg",
                      transaction.type === "revenue" ? "text-emerald-600" : "text-red-600"
                    )}>
                      {transaction.type === "revenue" ? "+" : ""}${Math.abs(transaction.amount).toLocaleString()}
                    </p>
                    <span className="text-xs text-gray-500 bg-white/30 px-2 py-1 rounded-full">
                      {transaction.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        {/* Enhanced Notifications Panel */}
        <div className="glass border border-white/20 rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '1300ms' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Notifications</h2>
              <p className="text-sm text-gray-600">System alerts and updates</p>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-white/20 px-3 py-1 rounded-lg transition-colors">
              Mark all as read
            </button>
          </div>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div key={notification.id} className="flex items-start gap-4 p-4 hover:bg-white/20 rounded-xl transition-all duration-300 group">
                <div className={cn(
                  "w-3 h-3 rounded-full mt-1 animate-pulse-glow",
                  notification.type === "warning" ? "bg-amber-500" :
                  notification.type === "success" ? "bg-emerald-500" :
                  notification.type === "error" ? "bg-red-500" :
                  "bg-blue-500"
                )}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                </div>
                <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
                     
                                                                                            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Area type="monotone" dataKey="revenue" stackId="1" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.6} />
                <Area type="monotone" dataKey="expenses" stackId="2" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactionsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))
              ) : recentTransactionsList.length > 0 ? (
                recentTransactionsList.map((txn: Transaction) => (
                  <div key={txn.id} className="flex items-center justify-between" data-testid={`transaction-${txn.id}`}>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{txn.description || `Transaction ${txn.transactionNumber}`}</p>
                      <p className="text-xs text-muted-foreground">{new Date(txn.date).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-sm font-medium tabular-nums ${parseFloat(txn.totalAmount) >= 0 ? 'text-chart-2' : 'text-foreground'}`}>
                      {parseFloat(txn.totalAmount) >= 0 ? '+' : ''}{parseFloat(txn.totalAmount).toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent transactions</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Invoices Alert */}
      {overdueInvoicesList.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Overdue Invoices</CardTitle>
            </div>
            <CardDescription>These invoices require immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {overdueInvoicesList.map((invoice: Invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 rounded-md bg-muted" data-testid={`overdue-invoice-${invoice.id}`}>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-xs text-destructive">
                      {Math.ceil((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days overdue
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">${parseFloat(invoice.total).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
