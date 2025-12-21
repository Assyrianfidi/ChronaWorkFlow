import * as React from "react";
import { useEffect, useState } from "react";
import {
  default as Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/Table";
import {
  TrendingUp,
  DollarSign,
  FileText,
  Users,
  Calendar,
  Download,
  BarChart3,
  Activity,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface ReportData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  totalCustomers: number;
  activeCustomers: number;
  monthlyGrowth: number;
  yearlyGrowth: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  invoices: number;
}

interface TopCustomer {
  name: string;
  revenue: number;
  invoices: number;
  growth: number;
}

const mockReportData: ReportData = {
  totalRevenue: 125000.0,
  totalExpenses: 45300.0,
  netProfit: 79700.0,
  pendingInvoices: 8,
  paidInvoices: 47,
  overdueInvoices: 3,
  totalCustomers: 25,
  activeCustomers: 18,
  monthlyGrowth: 12.5,
  yearlyGrowth: 28.3,
};

const mockMonthlyData: MonthlyData[] = [
  { month: "Jan", revenue: 8500, expenses: 3200, profit: 5300, invoices: 4 },
  { month: "Feb", revenue: 9200, expenses: 3500, profit: 5700, invoices: 5 },
  { month: "Mar", revenue: 10800, expenses: 3800, profit: 7000, invoices: 6 },
  { month: "Apr", revenue: 11500, expenses: 4000, profit: 7500, invoices: 7 },
  { month: "Nov", revenue: 14200, expenses: 4800, profit: 9400, invoices: 8 },
  { month: "Dec", revenue: 15800, expenses: 5200, profit: 10600, invoices: 9 },
];

const mockTopCustomers: TopCustomer[] = [
  { name: "ABC Corporation", revenue: 32500.0, invoices: 12, growth: 15.2 },
  { name: "Tech Solutions Ltd", revenue: 28400.0, invoices: 10, growth: 8.7 },
  { name: "XYZ Industries", revenue: 19800.0, invoices: 8, growth: -2.3 },
  { name: "Global Marketing Inc", revenue: 15600.0, invoices: 6, growth: 22.1 },
  { name: "StartUp Ventures", revenue: 12300.0, invoices: 5, growth: 5.4 },
];

const ReportsPage: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData>(mockReportData);
  const [monthlyData, setMonthlyData] =
    useState<MonthlyData[]>(mockMonthlyData);
  const [topCustomers, setTopCustomers] =
    useState<TopCustomer[]>(mockTopCustomers);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedReport, setSelectedReport] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Mock fetch report data
  const fetchReportData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      console.log("📊 Fetching report data...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setReportData(mockReportData);
      setMonthlyData(mockMonthlyData);
      setTopCustomers(mockTopCustomers);
    } catch (error) {
      console.error("Failed to fetch report data:", error);
      setLoadError("Unable to load reports. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod]);

  const handleExportReport = async (reportType: string) => {
    try {
      console.log("📊 Exporting report:", reportType);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("✅ Report exported successfully");
      // In real app, this would download a file
      alert(`${reportType} report exported successfully!`);
    } catch (error) {
      console.error("Failed to export report:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-gray-600">
            Business insights and financial reports
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => handleExportReport(selectedReport)}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "financial", label: "Financial", icon: DollarSign },
          { id: "sales", label: "Sales", icon: TrendingUp },
          { id: "customers", label: "Customers", icon: Users },
          { id: "invoices", label: "Invoices", icon: FileText },
        ].map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={selectedReport === id ? "default" : "outline"}
            onClick={() => setSelectedReport(id)}
            className="flex items-center gap-2"
          >
            <Icon className="w-4 h-4" />
            {label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-enterprise-navy"></div>
        </div>
      ) : loadError ? (
        <div className="py-10 text-center space-y-3">
          <div className="text-sm text-red-700">{loadError}</div>
          <div>
            <Button variant="outline" onClick={fetchReportData}>
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(reportData.totalRevenue)}
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <ArrowUpRight className="w-3 h-3" />
                  {formatPercentage(reportData.monthlyGrowth)} from last month
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Net Profit
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(reportData.netProfit)}
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <ArrowUpRight className="w-3 h-3" />
                  {formatPercentage(reportData.yearlyGrowth)} from last year
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Customers
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.activeCustomers}
                </div>
                <div className="text-xs text-muted-foreground">
                  of {reportData.totalCustomers} total customers
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Invoices
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {reportData.pendingInvoices}
                </div>
                <div className="text-xs text-muted-foreground">
                  {reportData.overdueInvoices} overdue
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Revenue Overview
                </CardTitle>
                <CardDescription>
                  Monthly revenue and profit trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyData.map((data) => (
                    <div key={data.month} className="flex items-center gap-4">
                      <div className="w-12 text-sm font-medium">
                        {data.month}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-sm">
                            {formatCurrency(data.revenue)}
                          </div>
                          <div className="text-xs text-green-600">
                            ({formatCurrency(data.profit)} profit)
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-enterprise-navy h-2 rounded-full"
                            style={{
                              width: `${(data.revenue / 16000) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <Badge variant="outline">{data.invoices} invoices</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Customers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Customers
                </CardTitle>
                <CardDescription>
                  Highest revenue customers this period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Growth</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCustomers.map((customer) => (
                      <TableRow key={customer.name}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-gray-500">
                              {customer.invoices} invoices
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(customer.revenue)}
                        </TableCell>
                        <TableCell>
                          <div
                            className={`flex items-center gap-1 text-sm ${
                              customer.growth > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {customer.growth > 0 ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3" />
                            )}
                            {formatPercentage(customer.growth)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Invoice Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Invoice Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Paid</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${(reportData.paidInvoices / (reportData.paidInvoices + reportData.pendingInvoices + reportData.overdueInvoices)) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {reportData.paidInvoices}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${(reportData.pendingInvoices / (reportData.paidInvoices + reportData.pendingInvoices + reportData.overdueInvoices)) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {reportData.pendingInvoices}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Overdue</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{
                            width: `${(reportData.overdueInvoices / (reportData.paidInvoices + reportData.pendingInvoices + reportData.overdueInvoices)) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {reportData.overdueInvoices}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Financial Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      Excellent
                    </div>
                    <div className="text-sm text-gray-500">
                      Overall financial score
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Profit Margin</span>
                      <span className="font-medium">
                        {(
                          (reportData.netProfit / reportData.totalRevenue) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Expense Ratio</span>
                      <span className="font-medium">
                        {(
                          (reportData.totalExpenses / reportData.totalRevenue) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Customer Retention</span>
                      <span className="font-medium">
                        {(
                          (reportData.activeCustomers /
                            reportData.totalCustomers) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleExportReport("financial-summary")}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Financial Summary
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleExportReport("tax-report")}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Tax Report
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleExportReport("customer-analysis")}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Customer Analysis
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleExportReport("invoice-report")}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Invoice Aging Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
