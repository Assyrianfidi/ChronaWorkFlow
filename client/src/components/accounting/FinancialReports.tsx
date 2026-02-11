/**
 * Financial Reports Component
 * Comprehensive reporting with P&L, Balance Sheet, and Trial Balance
 */

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/Badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Download,
  FileText,
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChartIcon,
  BarChart3,
  Printer,
  Share2,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useView } from "@/contexts/ViewContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DateRange } from "react-day-picker";

interface ReportLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  beginningBalance: number;
  periodDebits: number;
  periodCredits: number;
  endingBalance: number;
  normalBalance: "debit" | "credit";
}

interface TrialBalance {
  companyId: string;
  startDate: string;
  endDate: string;
  lines: ReportLine[];
  totals: {
    debit: number;
    credit: number;
  };
  isBalanced: boolean;
}

interface PLSummary {
  revenue: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  operatingIncome: number;
  otherIncome: number;
  otherExpenses: number;
  netIncome: number;
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
}

interface BalanceSheet {
  assets: {
    current: number;
    fixed: number;
    other: number;
    total: number;
  };
  liabilities: {
    current: number;
    longTerm: number;
    total: number;
  };
  equity: {
    contributed: number;
    retained: number;
    total: number;
  };
  totalLiabilitiesAndEquity: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export const FinancialReports: React.FC = () => {
  const { toast } = useToast();
  const { mainViewConfig, mainView } = useView();
  const [activeTab, setActiveTab] = useState("trial-balance");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(subMonths(new Date(), 1)),
  });

  // Fetch trial balance
  const { data: trialBalance, isLoading: trialBalanceLoading } =
    useQuery<TrialBalance>({
      queryKey: ["trial-balance", dateRange],
      queryFn: async () => {
        const response = await fetch(
          `/api/ledger/reports/trial-balance?startDate=${dateRange.from?.toISOString()}&endDate=${dateRange.to?.toISOString()}`,
        );
        return response.json();
      },
    });

  // Fetch P&L
  const { data: plData, isLoading: plLoading } = useQuery<PLSummary>({
    queryKey: ["pl", dateRange],
    queryFn: async () => {
      const response = await fetch(
        `/api/financial-reports/pl?startDate=${dateRange.from?.toISOString()}&endDate=${dateRange.to?.toISOString()}`,
      );
      return response.json();
    },
  });

  // Fetch Balance Sheet
  const { data: balanceSheet, isLoading: bsLoading } = useQuery<BalanceSheet>({
    queryKey: ["balance-sheet", dateRange.to],
    queryFn: async () => {
      const response = await fetch(
        `/api/financial-reports/balance-sheet?asOfDate=${dateRange.to?.toISOString()}`,
      );
      return response.json();
    },
  });

  const handleExport = (format: "pdf" | "excel" | "csv") => {
    toast({
      title: "Export initiated",
      description: `Your ${format.toUpperCase()} report is being generated.`,
    });
  };

  const renderTrialBalance = () => {
    if (trialBalanceLoading)
      return <div className="py-8 text-center">Loading trial balance...</div>;
    if (!trialBalance)
      return <div className="py-8 text-center">No data available</div>;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Trial Balance</h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(trialBalance.startDate), "MMM dd, yyyy")} -{" "}
              {format(new Date(trialBalance.endDate), "MMM dd, yyyy")}
            </p>
          </div>
          <Badge variant={trialBalance.isBalanced ? "default" : "destructive"}>
            {trialBalance.isBalanced ? "✓ Balanced" : "✗ Unbalanced"}
          </Badge>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Beginning</TableHead>
                <TableHead className="text-right">Debits</TableHead>
                <TableHead className="text-right">Credits</TableHead>
                <TableHead className="text-right">Ending</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trialBalance.lines.map((line) => (
                <TableRow key={line.accountId}>
                  <TableCell className="font-medium">
                    {line.accountCode}
                  </TableCell>
                  <TableCell>{line.accountName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">
                      {line.accountType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${line.beginningBalance.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${line.periodDebits.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${line.periodCredits.toLocaleString()}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono font-medium",
                      line.endingBalance < 0 && "text-red-600",
                    )}
                  >
                    ${line.endingBalance.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold border-t-2">
                <TableCell colSpan={4} className="text-right">
                  Totals:
                </TableCell>
                <TableCell className="text-right font-mono">
                  ${trialBalance.totals.debit.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono">
                  ${trialBalance.totals.credit.toLocaleString()}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const renderPL = () => {
    if (plLoading)
      return <div className="py-8 text-center">Loading P&L...</div>;
    if (!plData)
      return <div className="py-8 text-center">No data available</div>;

    const chartData = [
      { name: "Revenue", value: plData.revenue },
      { name: "COGS", value: plData.cogs },
      { name: "Gross Profit", value: plData.grossProfit },
      { name: "OpEx", value: plData.operatingExpenses },
      { name: "Net Income", value: plData.netIncome },
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${plData.revenue.toLocaleString()}
              </div>
              <div className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12% vs last month
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gross Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${plData.grossProfit.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {plData.grossMargin.toFixed(1)}% margin
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Net Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "text-2xl font-bold",
                  plData.netIncome < 0 && "text-red-600",
                )}
              >
                ${plData.netIncome.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {plData.netMargin.toFixed(1)}% margin
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>P&L Overview</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => `$${Number(value).toLocaleString()}`}
                  />
                  <Bar dataKey="value">
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Income Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.slice(0, 3)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.slice(0, 3).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `$${Number(value).toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detailed P&L Statement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Revenue</span>
                <span className="font-mono">
                  ${plData.revenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b pl-4">
                <span className="text-muted-foreground">
                  Cost of Goods Sold
                </span>
                <span className="font-mono text-red-600">
                  -${plData.cogs.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b font-semibold">
                <span>Gross Profit</span>
                <span
                  className={cn(
                    "font-mono",
                    plData.grossProfit < 0 && "text-red-600",
                  )}
                >
                  ${plData.grossProfit.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b pl-4">
                <span className="text-muted-foreground">
                  Operating Expenses
                </span>
                <span className="font-mono text-red-600">
                  -${plData.operatingExpenses.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b font-semibold">
                <span>Operating Income</span>
                <span
                  className={cn(
                    "font-mono",
                    plData.operatingIncome < 0 && "text-red-600",
                  )}
                >
                  ${plData.operatingIncome.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b pl-4">
                <span className="text-muted-foreground">Other Income</span>
                <span className="font-mono text-green-600">
                  +${plData.otherIncome.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b pl-4">
                <span className="text-muted-foreground">Other Expenses</span>
                <span className="font-mono text-red-600">
                  -${plData.otherExpenses.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 font-bold text-lg">
                <span>Net Income</span>
                <span
                  className={cn(
                    "font-mono",
                    plData.netIncome < 0 && "text-red-600",
                  )}
                >
                  ${plData.netIncome.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderBalanceSheet = () => {
    if (bsLoading)
      return <div className="py-8 text-center">Loading balance sheet...</div>;
    if (!balanceSheet)
      return <div className="py-8 text-center">No data available</div>;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${balanceSheet.assets.total.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Liabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${balanceSheet.liabilities.total.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Equity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${balanceSheet.equity.total.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Assets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Current Assets</span>
                <span className="font-mono">
                  ${balanceSheet.assets.current.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Fixed Assets</span>
                <span className="font-mono">
                  ${balanceSheet.assets.fixed.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Other Assets</span>
                <span className="font-mono">
                  ${balanceSheet.assets.other.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t font-bold">
                <span>Total Assets</span>
                <span className="font-mono">
                  ${balanceSheet.assets.total.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Liabilities & Equity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  Current Liabilities
                </span>
                <span className="font-mono">
                  ${balanceSheet.liabilities.current.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  Long-term Liabilities
                </span>
                <span className="font-mono">
                  ${balanceSheet.liabilities.longTerm.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t font-bold">
                <span>Total Liabilities</span>
                <span className="font-mono">
                  ${balanceSheet.liabilities.total.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-muted-foreground">
                  Contributed Capital
                </span>
                <span className="font-mono">
                  ${balanceSheet.equity.contributed.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Retained Earnings</span>
                <span className="font-mono">
                  ${balanceSheet.equity.retained.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t font-bold">
                <span>Total Equity</span>
                <span className="font-mono">
                  ${balanceSheet.equity.total.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Alert
          className={cn(
            balanceSheet.assets.total === balanceSheet.totalLiabilitiesAndEquity
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200",
          )}
        >
          <Calculator
            className={cn(
              "h-4 w-4",
              balanceSheet.assets.total ===
                balanceSheet.totalLiabilitiesAndEquity
                ? "text-green-600"
                : "text-red-600",
            )}
          />
          <AlertDescription
            className={cn(
              balanceSheet.assets.total ===
                balanceSheet.totalLiabilitiesAndEquity
                ? "text-green-800"
                : "text-red-800",
            )}
          >
            {balanceSheet.assets.total ===
            balanceSheet.totalLiabilitiesAndEquity
              ? "✓ Balance sheet is in balance"
              : "✗ Balance sheet is out of balance"}
          </AlertDescription>
        </Alert>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {mainViewConfig.terminology.reports || "Financial Reports"}
          </h1>
          <p className="text-muted-foreground">
            View and analyze your{" "}
            {mainView === "business" ? "money" : "financial"} performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-auto">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? format(dateRange.from, "MMM dd") : ""} -{" "}
                {dateRange.to ? format(dateRange.to, "MMM dd, yyyy") : ""}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <div className="flex">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) =>
                    date && setDateRange((prev) => ({ ...prev, from: date }))
                  }
                />
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) =>
                    date && setDateRange((prev) => ({ ...prev, to: date }))
                  }
                />
              </div>
            </PopoverContent>
          </Popover>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("pdf")}
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("excel")}
            >
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trial-balance">
            <Calculator className="h-4 w-4 mr-2" />
            Trial Balance
          </TabsTrigger>
          <TabsTrigger value="pl">
            <BarChart3 className="h-4 w-4 mr-2" />
            P&L Statement
          </TabsTrigger>
          <TabsTrigger value="balance-sheet">
            <PieChartIcon className="h-4 w-4 mr-2" />
            Balance Sheet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trial-balance" className="mt-6">
          {renderTrialBalance()}
        </TabsContent>

        <TabsContent value="pl" className="mt-6">
          {renderPL()}
        </TabsContent>

        <TabsContent value="balance-sheet" className="mt-6">
          {renderBalanceSheet()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialReports;
