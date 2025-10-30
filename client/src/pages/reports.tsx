import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Calendar, FileText, TrendingUp, TrendingDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProfitLossReport, useBalanceSheetReport, useCashFlowReport } from "@/hooks/use-api";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function Reports() {
  const [dateRange, setDateRange] = useState<string>("current-year");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Get date range for API calls
  const getDateParams = () => {
    const today = new Date();
    let start = "";
    let end = "";

    switch (dateRange) {
      case "current-month":
        start = format(new Date(today.getFullYear(), today.getMonth(), 1), "yyyy-MM-dd");
        end = format(new Date(today.getFullYear(), today.getMonth() + 1, 0), "yyyy-MM-dd");
        break;
      case "current-quarter":
        const quarter = Math.floor(today.getMonth() / 3);
        start = format(new Date(today.getFullYear(), quarter * 3, 1), "yyyy-MM-dd");
        end = format(new Date(today.getFullYear(), quarter * 3 + 3, 0), "yyyy-MM-dd");
        break;
      case "current-year":
        start = format(new Date(today.getFullYear(), 0, 1), "yyyy-MM-dd");
        end = format(new Date(today.getFullYear(), 11, 31), "yyyy-MM-dd");
        break;
      case "last-month":
        start = format(new Date(today.getFullYear(), today.getMonth() - 1, 1), "yyyy-MM-dd");
        end = format(new Date(today.getFullYear(), today.getMonth(), 0), "yyyy-MM-dd");
        break;
      case "last-quarter":
        const lastQuarter = Math.floor((today.getMonth() - 3) / 3);
        start = format(new Date(today.getFullYear(), lastQuarter * 3, 1), "yyyy-MM-dd");
        end = format(new Date(today.getFullYear(), lastQuarter * 3 + 3, 0), "yyyy-MM-dd");
        break;
      case "custom":
        start = startDate;
        end = endDate;
        break;
    }

    return { startDate: start, endDate: end };
  };

  const { startDate: apiStartDate, endDate: apiEndDate } = getDateParams();

  const { data: profitLoss, isLoading: pnlLoading } = useProfitLossReport(undefined, apiStartDate, apiEndDate);
  const { data: balanceSheet, isLoading: balanceLoading } = useBalanceSheetReport();
  const { data: cashFlow, isLoading: cashLoading } = useCashFlowReport();

  const isLoading = pnlLoading || balanceLoading || cashLoading;

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case "current-month": return format(new Date(), "MMMM yyyy");
      case "current-quarter": return `Q${Math.floor(new Date().getMonth() / 3) + 1} ${new Date().getFullYear()}`;
      case "current-year": return `${new Date().getFullYear()}`;
      case "last-month": return format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "MMMM yyyy");
      case "last-quarter": return `Q${Math.floor((new Date().getMonth() - 3) / 3) + 1} ${new Date().getFullYear()}`;
      case "custom": return `${startDate} to ${endDate}`;
      default: return "Current Year";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Financial Reports</h1>
          <p className="text-muted-foreground">View comprehensive financial statements and analytics</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Current Month</SelectItem>
              <SelectItem value="current-quarter">Current Quarter</SelectItem>
              <SelectItem value="current-year">Current Year</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="last-quarter">Last Quarter</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" data-testid="button-export-report">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pnl" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="pnl" data-testid="tab-profit-loss">P&L</TabsTrigger>
          <TabsTrigger value="balance" data-testid="tab-balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="cashflow" data-testid="tab-cash-flow">Cash Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="pnl" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Profit & Loss Statement
              </CardTitle>
              <CardDescription>
                Income and expenses for {getDateRangeLabel()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profitLoss ? (
                <div className="space-y-6">
                  {/* Revenue Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-chart-2" />
                      Revenue
                    </h3>
                    <Table>
                      <TableBody>
                        {profitLoss.revenue.accounts.map((account: any) => (
                          <TableRow key={account.id}>
                            <TableCell className="font-medium">{account.name}</TableCell>
                            <TableCell className="text-right tabular-nums text-chart-2">
                              ${parseFloat(account.balance).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-semibold border-t">
                          <TableCell>Total Revenue</TableCell>
                          <TableCell className="text-right tabular-nums text-chart-2">
                            ${profitLoss.revenue.total.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Expenses Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-destructive" />
                      Expenses
                    </h3>
                    <Table>
                      <TableBody>
                        {profitLoss.expenses.accounts.map((account: any) => (
                          <TableRow key={account.id}>
                            <TableCell className="font-medium">{account.name}</TableCell>
                            <TableCell className="text-right tabular-nums text-destructive">
                              ${parseFloat(account.balance).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-semibold border-t">
                          <TableCell>Total Expenses</TableCell>
                          <TableCell className="text-right tabular-nums text-destructive">
                            ${profitLoss.expenses.total.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Net Income */}
                  <div className="border-t-2 pt-4">
                    <Table>
                      <TableBody>
                        <TableRow className="font-bold text-lg">
                          <TableCell>Net Income</TableCell>
                          <TableCell className={`text-right tabular-nums ${
                            profitLoss.netIncome >= 0 ? 'text-chart-2' : 'text-destructive'
                          }`}>
                            ${profitLoss.netIncome.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No data available for the selected period.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Balance Sheet
              </CardTitle>
              <CardDescription>
                Assets, liabilities, and equity as of {format(new Date(), "MMMM dd, yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {balanceSheet ? (
                <div className="space-y-8">
                  {/* Assets */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Assets</h3>
                    <Table>
                      <TableBody>
                        {balanceSheet.assets.accounts.map((account: any) => (
                          <TableRow key={account.id}>
                            <TableCell className="font-medium">{account.name}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              ${parseFloat(account.balance).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-semibold border-t">
                          <TableCell>Total Assets</TableCell>
                          <TableCell className="text-right tabular-nums">
                            ${balanceSheet.assets.total.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Liabilities */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Liabilities</h3>
                    <Table>
                      <TableBody>
                        {balanceSheet.liabilities.accounts.map((account: any) => (
                          <TableRow key={account.id}>
                            <TableCell className="font-medium">{account.name}</TableCell>
                            <TableCell className="text-right tabular-nums text-destructive">
                              ${parseFloat(account.balance).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-semibold border-t">
                          <TableCell>Total Liabilities</TableCell>
                          <TableCell className="text-right tabular-nums text-destructive">
                            ${balanceSheet.liabilities.total.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Equity */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Equity</h3>
                    <Table>
                      <TableBody>
                        {balanceSheet.equity.accounts.map((account: any) => (
                          <TableRow key={account.id}>
                            <TableCell className="font-medium">{account.name}</TableCell>
                            <TableCell className="text-right tabular-nums text-chart-2">
                              ${parseFloat(account.balance).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-semibold border-t">
                          <TableCell>Total Equity</TableCell>
                          <TableCell className="text-right tabular-nums text-chart-2">
                            ${balanceSheet.equity.total.toLocaleString()}
                          </TableCell>
                        </TableRow>
                        <TableRow className="font-bold border-t-2">
                          <TableCell>Total Liabilities & Equity</TableCell>
                          <TableCell className="text-right tabular-nums">
                            ${(balanceSheet.liabilities.total + balanceSheet.equity.total).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No balance sheet data available.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Cash Flow Statement
              </CardTitle>
              <CardDescription>
                Cash inflows and outflows for {getDateRangeLabel()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cashFlow ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Operating Activities</h3>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Net Cash from Operations</TableCell>
                          <TableCell className={`text-right tabular-nums ${
                            cashFlow.operatingActivities.total >= 0 ? 'text-chart-2' : 'text-destructive'
                          }`}>
                            ${cashFlow.operatingActivities.total.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Investing Activities</h3>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Net Cash from Investing</TableCell>
                          <TableCell className={`text-right tabular-nums ${
                            cashFlow.investingActivities.total >= 0 ? 'text-chart-2' : 'text-destructive'
                          }`}>
                            ${cashFlow.investingActivities.total.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Financing Activities</h3>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Net Cash from Financing</TableCell>
                          <TableCell className={`text-right tabular-nums ${
                            cashFlow.financingActivities.total >= 0 ? 'text-chart-2' : 'text-destructive'
                          }`}>
                            ${cashFlow.financingActivities.total.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="border-t-2 pt-4">
                    <Table>
                      <TableBody>
                        <TableRow className="font-bold text-lg">
                          <TableCell>Net Change in Cash</TableCell>
                          <TableCell className={`text-right tabular-nums ${
                            cashFlow.netChange >= 0 ? 'text-chart-2' : 'text-destructive'
                          }`}>
                            ${cashFlow.netChange.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No cash flow data available.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
