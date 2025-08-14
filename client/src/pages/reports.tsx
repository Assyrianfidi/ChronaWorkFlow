import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Download, TrendingUp, TrendingDown, DollarSign, Clock, Users, FileText } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

export default function Reports() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [reportType, setReportType] = useState("overview");

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/logged-out";
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch reports data
  const { data: reportsData, isLoading: loadingReports } = useQuery({
    queryKey: ["/api/reports", reportType, dateRange.from.toISOString(), dateRange.to.toISOString()],
    retry: false,
    enabled: isAuthenticated,
  });

  // Fetch dashboard stats for overview
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
    enabled: isAuthenticated,
  });

  const handleDateRangeSelect = (preset: string) => {
    const today = new Date();
    switch (preset) {
      case "today":
        setDateRange({ from: today, to: today });
        break;
      case "yesterday":
        const yesterday = subDays(today, 1);
        setDateRange({ from: yesterday, to: yesterday });
        break;
      case "last7days":
        setDateRange({ from: subDays(today, 6), to: today });
        break;
      case "last30days":
        setDateRange({ from: subDays(today, 29), to: today });
        break;
      case "thisWeek":
        setDateRange({ from: startOfWeek(today), to: endOfWeek(today) });
        break;
      case "thisMonth":
        setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
        break;
      case "lastMonth":
        const lastMonth = subDays(startOfMonth(today), 1);
        setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        break;
    }
  };

  const handleExportReport = () => {
    toast({
      title: "Export Started",
      description: "Your report is being prepared for download...",
    });
    // Export functionality ready for CSV/Excel implementation
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Sample data for charts (will be replaced with real data)
  const sampleRevenueData = [
    { month: 'Jan', revenue: 4000, expenses: 2400 },
    { month: 'Feb', revenue: 3000, expenses: 1398 },
    { month: 'Mar', revenue: 2000, expenses: 9800 },
    { month: 'Apr', revenue: 2780, expenses: 3908 },
    { month: 'May', revenue: 1890, expenses: 4800 },
    { month: 'Jun', revenue: 2390, expenses: 3800 },
  ];

  const sampleHoursData = [
    { week: 'Week 1', hours: 320 },
    { week: 'Week 2', hours: 285 },
    { week: 'Week 3', hours: 310 },
    { week: 'Week 4', hours: 295 },
  ];

  const sampleProjectData = [
    { name: 'Completed', value: 65, color: '#00C49F' },
    { name: 'In Progress', value: 25, color: '#0088FE' },
    { name: 'Pending', value: 10, color: '#FFBB28' },
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and business insights
          </p>
        </div>
        <Button onClick={handleExportReport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>
            Select date range and report type to customize your analytics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {/* Report Type */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Business Overview</SelectItem>
                  <SelectItem value="revenue">Revenue Analysis</SelectItem>
                  <SelectItem value="hours">Time & Attendance</SelectItem>
                  <SelectItem value="projects">Project Performance</SelectItem>
                  <SelectItem value="workers">Worker Productivity</SelectItem>
                  <SelectItem value="clients">Client Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Presets */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Quick Ranges</label>
              <Select onValueChange={handleDateRangeSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                  <SelectItem value="last30days">Last 30 Days</SelectItem>
                  <SelectItem value="thisWeek">This Week</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range */}
            <div className="flex-1 min-w-[300px]">
              <label className="text-sm font-medium mb-2 block">Custom Date Range</label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, "PPP") : "From date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, "PPP") : "To date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                      disabled={(date) => date > new Date() || date < dateRange.from}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats Cards */}
      {reportType === "overview" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$12,345</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline text-green-600" />
                +12.5% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,240</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline text-green-600" />
                +5.2% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats as any)?.totalWorkers || "0"}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline text-green-600" />
                +2 new this month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invoices Generated</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
              <p className="text-xs text-muted-foreground">
                <TrendingDown className="h-3 w-3 inline text-red-600" />
                -2.5% from last month
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart */}
        {(reportType === "overview" || reportType === "revenue") && (
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Expenses</CardTitle>
              <CardDescription>Monthly financial performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={sampleRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stackId="1" stroke="#0088FE" fill="#0088FE" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="expenses" stackId="2" stroke="#FF8042" fill="#FF8042" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Hours Worked Chart */}
        {(reportType === "overview" || reportType === "hours") && (
          <Card>
            <CardHeader>
              <CardTitle>Weekly Hours Worked</CardTitle>
              <CardDescription>Time tracking performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sampleHoursData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Project Status Chart */}
        {(reportType === "overview" || reportType === "projects") && (
          <Card>
            <CardHeader>
              <CardTitle>Project Status Distribution</CardTitle>
              <CardDescription>Current project pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sampleProjectData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sampleProjectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Key Performance Indicators</CardTitle>
            <CardDescription>Business health metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Project Completion Rate</span>
              <Badge variant="secondary">92%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Average Invoice Value</span>
              <Badge variant="secondary">$1,245</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Worker Utilization</span>
              <Badge variant="secondary">87%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Client Satisfaction</span>
              <Badge variant="secondary">4.8/5</Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Revenue Growth</span>
              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                +12.5%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables Section */}
      {reportType !== "overview" && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</CardTitle>
            <CardDescription>
              Comprehensive breakdown for {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingReports ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {reportType === "revenue" && "Revenue analysis data will be displayed here"}
                {reportType === "hours" && "Time tracking detailed report will be displayed here"}
                {reportType === "projects" && "Project performance metrics will be displayed here"}
                {reportType === "workers" && "Worker productivity analysis will be displayed here"}
                {reportType === "clients" && "Client analytics and insights will be displayed here"}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}