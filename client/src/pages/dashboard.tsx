import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, FileText, Users, AlertCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const revenueData = [
  { month: "Jan", revenue: 24500, expenses: 18200 },
  { month: "Feb", revenue: 28100, expenses: 19800 },
  { month: "Mar", revenue: 31200, expenses: 21400 },
  { month: "Apr", revenue: 29800, expenses: 20100 },
  { month: "May", revenue: 33400, expenses: 22600 },
  { month: "Jun", revenue: 38900, expenses: 24800 },
];

const recentTransactions = [
  { id: "1", date: "2024-01-15", description: "Office Supplies - Staples", amount: -245.50, type: "expense" },
  { id: "2", date: "2024-01-14", description: "Invoice #1024 - Acme Corp", amount: 5420.00, type: "revenue" },
  { id: "3", date: "2024-01-13", description: "Utility Bill - Electric Co", amount: -432.80, type: "expense" },
  { id: "4", date: "2024-01-12", description: "Invoice #1023 - Tech Solutions", amount: 3250.00, type: "revenue" },
  { id: "5", date: "2024-01-11", description: "Rent Payment - Property LLC", amount: -2500.00, type: "expense" },
];

const overdueInvoices = [
  { id: "1", number: "INV-1018", customer: "ABC Corporation", amount: 4820.00, daysOverdue: 15 },
  { id: "2", number: "INV-1012", customer: "XYZ Industries", amount: 2340.00, daysOverdue: 8 },
  { id: "3", number: "INV-1005", customer: "Global Tech Ltd", amount: 6750.00, daysOverdue: 22 },
];

export default function Dashboard() {
  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your financial performance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums" data-testid="text-total-revenue">$186,900</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-chart-2" />
              <span className="text-chart-2">+12.3%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums" data-testid="text-total-expenses">$126,900</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-destructive" />
              <span className="text-destructive">+5.2%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums text-chart-2" data-testid="text-net-profit">$60,000</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-chart-2" />
              <span className="text-chart-2">+24.8%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums" data-testid="text-outstanding">$13,910</div>
            <p className="text-xs text-muted-foreground mt-1">
              3 invoices overdue
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue vs Expenses Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow</CardTitle>
            <CardDescription>Revenue and expenses over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
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
              {recentTransactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between" data-testid={`transaction-${txn.id}`}>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{txn.description}</p>
                    <p className="text-xs text-muted-foreground">{txn.date}</p>
                  </div>
                  <span className={`text-sm font-medium tabular-nums ${txn.type === 'revenue' ? 'text-chart-2' : 'text-foreground'}`}>
                    {txn.amount > 0 ? '+' : ''}{txn.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Invoices Alert */}
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
            {overdueInvoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 rounded-md bg-muted" data-testid={`overdue-invoice-${invoice.id}`}>
                <div className="flex-1">
                  <p className="text-sm font-medium">{invoice.number} - {invoice.customer}</p>
                  <p className="text-xs text-destructive">{invoice.daysOverdue} days overdue</p>
                </div>
                <span className="text-sm font-semibold tabular-nums">${invoice.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
