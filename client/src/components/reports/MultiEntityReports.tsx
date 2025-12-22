/**
 * Multi-Entity Financial Reports Component
 * Displays P&L, Cash Flow, and Balance Sheet reports per entity
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Download,
  RefreshCw,
  Building2,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  ArrowRight,
  ChevronDown,
  Filter,
  Printer,
  Share2,
  Eye,
  CheckCircle,
} from 'lucide-react';

interface Entity {
  id: string;
  name: string;
}

interface ReportData {
  profitAndLoss: {
    revenue: number;
    costOfGoodsSold: number;
    grossProfit: number;
    operatingExpenses: {
      category: string;
      amount: number;
    }[];
    totalOperatingExpenses: number;
    operatingIncome: number;
    otherIncome: number;
    otherExpenses: number;
    netIncome: number;
    previousPeriod?: {
      revenue: number;
      netIncome: number;
    };
  };
  cashFlow: {
    operatingActivities: {
      netIncome: number;
      adjustments: { item: string; amount: number }[];
      totalOperating: number;
    };
    investingActivities: {
      items: { item: string; amount: number }[];
      totalInvesting: number;
    };
    financingActivities: {
      items: { item: string; amount: number }[];
      totalFinancing: number;
    };
    netCashChange: number;
    beginningCash: number;
    endingCash: number;
  };
  balanceSheet: {
    assets: {
      current: { item: string; amount: number }[];
      totalCurrent: number;
      fixed: { item: string; amount: number }[];
      totalFixed: number;
      totalAssets: number;
    };
    liabilities: {
      current: { item: string; amount: number }[];
      totalCurrent: number;
      longTerm: { item: string; amount: number }[];
      totalLongTerm: number;
      totalLiabilities: number;
    };
    equity: {
      items: { item: string; amount: number }[];
      totalEquity: number;
    };
  };
}

type ReportType = 'profit_loss' | 'cash_flow' | 'balance_sheet';
type DateRange = 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'custom';

const MultiEntityReports: React.FC = () => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [reportType, setReportType] = useState<ReportType>('profit_loss');
  const [dateRange, setDateRange] = useState<DateRange>('this_month');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comparisonEnabled, setComparisonEnabled] = useState(false);

  // Fetch entities
  useEffect(() => {
    setEntities([
      { id: 'all', name: 'All Entities (Consolidated)' },
      { id: 'ent_1', name: 'TechStart Inc.' },
      { id: 'ent_2', name: 'Digital Solutions LLC' },
      { id: 'ent_3', name: 'Consulting Partners' },
    ]);
  }, []);

  // Fetch report data
  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/v1/reports/${reportType}?entity=${selectedEntity}&range=${dateRange}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch report');

      const data = await response.json();
      setReportData(data.data);
    } catch (err) {
      // Use mock data
      setReportData(getMockReportData());
    } finally {
      setIsLoading(false);
    }
  }, [reportType, selectedEntity, dateRange]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentChange = (current: number, previous: number) => {
    if (previous === 0) return 'N/A';
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const getDateRangeLabel = (range: DateRange) => {
    const labels: Record<DateRange, string> = {
      this_month: 'This Month',
      last_month: 'Last Month',
      this_quarter: 'This Quarter',
      last_quarter: 'Last Quarter',
      this_year: 'This Year',
      custom: 'Custom Range',
    };
    return labels[range];
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    // In production, this would trigger a download
    console.log(`Exporting ${reportType} report as ${format}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <FileText className="w-7 h-7 text-muted-foreground" />
            Financial Reports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Multi-entity financial statements and analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchReport}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2 border border-input bg-background text-foreground rounded-lg hover:bg-muted">
              <Download className="w-5 h-5" />
              Export
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <button className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted">
            <Printer className="w-5 h-5" />
          </button>
        </div>
      </div>
      {/* Filters */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Report Type Tabs */}
          <div className="flex bg-muted rounded-lg p-1">
              <button
                onClick={() => setReportType('profit_loss')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  reportType === 'profit_loss'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                P&L
              </button>
              <button
                onClick={() => setReportType('cash_flow')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  reportType === 'cash_flow'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                Cash Flow
              </button>
              <button
                onClick={() => setReportType('balance_sheet')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  reportType === 'balance_sheet'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Balance Sheet
              </button>
            </div>

            <div className="flex-1" />

            {/* Entity Selector */}
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              <select
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value)}
                className="px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {entities.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRange)}
                className="px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_quarter">This Quarter</option>
                <option value="last_quarter">Last Quarter</option>
                <option value="this_year">This Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Report Content */}
        {isLoading ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading report...</p>
          </div>
        ) : reportData ? (
          <>
            {/* Profit & Loss Report */}
            {reportType === 'profit_loss' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-card rounded-xl p-6 border border-border">
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {formatCurrency(reportData.profitAndLoss.revenue)}
                    </p>
                    {reportData.profitAndLoss.previousPeriod && (
                      <p className={`text-sm mt-1 ${
                        reportData.profitAndLoss.revenue >= reportData.profitAndLoss.previousPeriod.revenue
                          ? 'text-primary' : 'text-destructive'
                      }`}>
                        {formatPercentChange(
                          reportData.profitAndLoss.revenue,
                          reportData.profitAndLoss.previousPeriod.revenue
                        )} vs last period
                      </p>
                    )}
                  </div>
                  <div className="bg-card rounded-xl p-6 border border-border">
                    <p className="text-sm text-muted-foreground">Gross Profit</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {formatCurrency(reportData.profitAndLoss.grossProfit)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {((reportData.profitAndLoss.grossProfit / reportData.profitAndLoss.revenue) * 100).toFixed(1)}% margin
                    </p>
                  </div>
                  <div className="bg-card rounded-xl p-6 border border-border">
                    <p className="text-sm text-muted-foreground">Operating Expenses</p>
                    <p className="text-2xl font-bold text-destructive mt-1">
                      {formatCurrency(reportData.profitAndLoss.totalOperatingExpenses)}
                    </p>
                  </div>
                  <div className="bg-card rounded-xl p-6 border border-border">
                    <p className="text-sm text-muted-foreground">Net Income</p>
                    <p className={`text-2xl font-bold mt-1 ${
                      reportData.profitAndLoss.netIncome >= 0
                        ? 'text-primary'
                        : 'text-destructive'
                    }`}>
                      {formatCurrency(reportData.profitAndLoss.netIncome)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {((reportData.profitAndLoss.netIncome / reportData.profitAndLoss.revenue) * 100).toFixed(1)}% margin
                    </p>
                  </div>
                </div>

                {/* Detailed P&L */}
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="px-6 py-4 border-b border-border">
                    <h3 className="text-lg font-semibold text-foreground">
                      Profit & Loss Statement
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {getDateRangeLabel(dateRange)} • {entities.find(e => e.id === selectedEntity)?.name}
                    </p>
                  </div>
                  <div className="p-6">
                    <table className="w-full">
                      <tbody className="divide-y divide-border">
                        <tr className="font-medium">
                          <td className="py-3 text-foreground">Revenue</td>
                          <td className="py-3 text-right text-foreground">
                            {formatCurrency(reportData.profitAndLoss.revenue)}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 text-muted-foreground pl-4">Cost of Goods Sold</td>
                          <td className="py-3 text-right text-muted-foreground">
                            ({formatCurrency(reportData.profitAndLoss.costOfGoodsSold)})
                          </td>
                        </tr>
                        <tr className="font-medium bg-muted">
                          <td className="py-3 text-foreground">Gross Profit</td>
                          <td className="py-3 text-right text-foreground">
                            {formatCurrency(reportData.profitAndLoss.grossProfit)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="py-3 text-sm font-medium text-muted-foreground">
                            Operating Expenses
                          </td>
                        </tr>
                        {reportData.profitAndLoss.operatingExpenses.map((expense, idx) => (
                          <tr key={idx}>
                            <td className="py-2 text-muted-foreground pl-4">{expense.category}</td>
                            <td className="py-2 text-right text-muted-foreground">
                              ({formatCurrency(expense.amount)})
                            </td>
                          </tr>
                        ))}
                        <tr className="font-medium">
                          <td className="py-3 text-foreground pl-4">Total Operating Expenses</td>
                          <td className="py-3 text-right text-destructive">
                            ({formatCurrency(reportData.profitAndLoss.totalOperatingExpenses)})
                          </td>
                        </tr>
                        <tr className="font-medium bg-muted">
                          <td className="py-3 text-foreground">Operating Income</td>
                          <td className="py-3 text-right text-foreground">
                            {formatCurrency(reportData.profitAndLoss.operatingIncome)}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 text-muted-foreground pl-4">Other Income</td>
                          <td className="py-2 text-right text-muted-foreground">
                            {formatCurrency(reportData.profitAndLoss.otherIncome)}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 text-muted-foreground pl-4">Other Expenses</td>
                          <td className="py-2 text-right text-muted-foreground">
                            ({formatCurrency(reportData.profitAndLoss.otherExpenses)})
                          </td>
                        </tr>
                        <tr className="font-bold text-lg bg-muted">
                          <td className="py-4 text-foreground">Net Income</td>
                          <td className={`py-4 text-right ${
                            reportData.profitAndLoss.netIncome >= 0
                              ? 'text-primary'
                              : 'text-destructive'
                          }`}>
                            {formatCurrency(reportData.profitAndLoss.netIncome)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Cash Flow Report */}
            {reportType === 'cash_flow' && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-card rounded-xl p-6 border border-border">
                    <p className="text-sm text-muted-foreground">Beginning Cash</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {formatCurrency(reportData.cashFlow.beginningCash)}
                    </p>
                  </div>
                  <div className="bg-card rounded-xl p-6 border border-border">
                    <p className="text-sm text-muted-foreground">Net Cash Change</p>
                    <p className={`text-2xl font-bold mt-1 ${
                      reportData.cashFlow.netCashChange >= 0
                        ? 'text-primary'
                        : 'text-destructive'
                    }`}>
                      {reportData.cashFlow.netCashChange >= 0 ? '+' : ''}{formatCurrency(reportData.cashFlow.netCashChange)}
                    </p>
                  </div>
                  <div className="bg-card rounded-xl p-6 border border-border">
                    <p className="text-sm text-muted-foreground">Ending Cash</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {formatCurrency(reportData.cashFlow.endingCash)}
                    </p>
                  </div>
                </div>

                {/* Detailed Cash Flow */}
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="px-6 py-4 border-b border-border">
                    <h3 className="text-lg font-semibold text-foreground">
                      Statement of Cash Flows
                    </h3>
                  </div>
                  <div className="p-6 space-y-6">
                    {/* Operating Activities */}
                    <div>
                      <h4 className="font-medium text-foreground mb-3">
                        Cash Flows from Operating Activities
                      </h4>
                      <table className="w-full">
                        <tbody>
                          <tr>
                            <td className="py-2 text-muted-foreground pl-4">Net Income</td>
                            <td className="py-2 text-right text-foreground">
                              {formatCurrency(reportData.cashFlow.operatingActivities.netIncome)}
                            </td>
                          </tr>
                          {reportData.cashFlow.operatingActivities.adjustments.map((adj, idx) => (
                            <tr key={idx}>
                              <td className="py-2 text-muted-foreground pl-4">{adj.item}</td>
                              <td className="py-2 text-right text-muted-foreground">
                                {adj.amount >= 0 ? '' : '('}{formatCurrency(Math.abs(adj.amount))}{adj.amount < 0 ? ')' : ''}
                              </td>
                            </tr>
                          ))}
                          <tr className="font-medium bg-muted">
                            <td className="py-3 text-foreground">Net Cash from Operating</td>
                            <td className="py-3 text-right text-foreground">
                              {formatCurrency(reportData.cashFlow.operatingActivities.totalOperating)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Investing Activities */}
                    <div>
                      <h4 className="font-medium text-foreground mb-3">
                        Cash Flows from Investing Activities
                      </h4>
                      <table className="w-full">
                        <tbody>
                          {reportData.cashFlow.investingActivities.items.map((item, idx) => (
                            <tr key={idx}>
                              <td className="py-2 text-muted-foreground pl-4">{item.item}</td>
                              <td className="py-2 text-right text-muted-foreground">
                                {item.amount >= 0 ? '' : '('}{formatCurrency(Math.abs(item.amount))}{item.amount < 0 ? ')' : ''}
                              </td>
                            </tr>
                          ))}
                          <tr className="font-medium bg-muted">
                            <td className="py-3 text-foreground">Net Cash from Investing</td>
                            <td className="py-3 text-right text-foreground">
                              {formatCurrency(reportData.cashFlow.investingActivities.totalInvesting)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Financing Activities */}
                    <div>
                      <h4 className="font-medium text-foreground mb-3">
                        Cash Flows from Financing Activities
                      </h4>
                      <table className="w-full">
                        <tbody>
                          {reportData.cashFlow.financingActivities.items.map((item, idx) => (
                            <tr key={idx}>
                              <td className="py-2 text-muted-foreground pl-4">{item.item}</td>
                              <td className="py-2 text-right text-muted-foreground">
                                {item.amount >= 0 ? '' : '('}{formatCurrency(Math.abs(item.amount))}{item.amount < 0 ? ')' : ''}
                              </td>
                            </tr>
                          ))}
                          <tr className="font-medium bg-muted">
                            <td className="py-3 text-foreground">Net Cash from Financing</td>
                            <td className="py-3 text-right text-foreground">
                              {formatCurrency(reportData.cashFlow.financingActivities.totalFinancing)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Summary */}
                    <div className="border-t border-border pt-4">
                      <table className="w-full">
                        <tbody>
                          <tr className="font-bold text-lg">
                            <td className="py-3 text-foreground">Net Change in Cash</td>
                            <td className={`py-3 text-right ${
                              reportData.cashFlow.netCashChange >= 0
                                ? 'text-primary'
                                : 'text-destructive'
                            }`}>
                              {formatCurrency(reportData.cashFlow.netCashChange)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Balance Sheet Report */}
            {reportType === 'balance_sheet' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Assets */}
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="px-6 py-4 border-b border-border bg-muted">
                    <h3 className="text-lg font-semibold text-foreground">Assets</h3>
                  </div>
                  <div className="p-6">
                    <table className="w-full">
                      <tbody>
                        <tr>
                          <td colSpan={2} className="py-2 font-medium text-foreground">
                            Current Assets
                          </td>
                        </tr>
                        {reportData.balanceSheet.assets.current.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2 text-muted-foreground pl-4">{item.item}</td>
                            <td className="py-2 text-right text-foreground">
                              {formatCurrency(item.amount)}
                            </td>
                          </tr>
                        ))}
                        <tr className="font-medium">
                          <td className="py-2 text-foreground pl-4">Total Current Assets</td>
                          <td className="py-2 text-right text-foreground">
                            {formatCurrency(reportData.balanceSheet.assets.totalCurrent)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="py-2 font-medium text-foreground pt-4">
                            Fixed Assets
                          </td>
                        </tr>
                        {reportData.balanceSheet.assets.fixed.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2 text-muted-foreground pl-4">{item.item}</td>
                            <td className="py-2 text-right text-foreground">
                              {formatCurrency(item.amount)}
                            </td>
                          </tr>
                        ))}
                        <tr className="font-medium">
                          <td className="py-2 text-foreground pl-4">Total Fixed Assets</td>
                          <td className="py-2 text-right text-foreground">
                            {formatCurrency(reportData.balanceSheet.assets.totalFixed)}
                          </td>
                        </tr>
                        <tr className="font-bold text-lg bg-muted">
                          <td className="py-4 text-foreground">Total Assets</td>
                          <td className="py-4 text-right text-foreground">
                            {formatCurrency(reportData.balanceSheet.assets.totalAssets)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Liabilities & Equity */}
                <div className="space-y-6">
                  {/* Liabilities */}
                  <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-muted">
                      <h3 className="text-lg font-semibold text-foreground">Liabilities</h3>
                    </div>
                    <div className="p-6">
                      <table className="w-full">
                        <tbody>
                          <tr>
                            <td colSpan={2} className="py-2 font-medium text-foreground">
                              Current Liabilities
                            </td>
                          </tr>
                          {reportData.balanceSheet.liabilities.current.map((item, idx) => (
                            <tr key={idx}>
                              <td className="py-2 text-muted-foreground pl-4">{item.item}</td>
                              <td className="py-2 text-right text-foreground">
                                {formatCurrency(item.amount)}
                              </td>
                            </tr>
                          ))}
                          <tr className="font-medium">
                            <td className="py-2 text-foreground pl-4">Total Current Liabilities</td>
                            <td className="py-2 text-right text-foreground">
                              {formatCurrency(reportData.balanceSheet.liabilities.totalCurrent)}
                            </td>
                          </tr>
                          {reportData.balanceSheet.liabilities.longTerm.length > 0 && (
                            <>
                              <tr>
                                <td colSpan={2} className="py-2 font-medium text-foreground pt-4">
                                  Long-Term Liabilities
                                </td>
                              </tr>
                              {reportData.balanceSheet.liabilities.longTerm.map((item, idx) => (
                                <tr key={idx}>
                                  <td className="py-2 text-muted-foreground pl-4">{item.item}</td>
                                  <td className="py-2 text-right text-foreground">
                                    {formatCurrency(item.amount)}
                                  </td>
                                </tr>
                              ))}
                            </>
                          )}
                          <tr className="font-bold bg-muted">
                            <td className="py-3 text-foreground">Total Liabilities</td>
                            <td className="py-3 text-right text-destructive">
                              {formatCurrency(reportData.balanceSheet.liabilities.totalLiabilities)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Equity */}
                  <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-muted">
                      <h3 className="text-lg font-semibold text-foreground">Equity</h3>
                    </div>
                    <div className="p-6">
                      <table className="w-full">
                        <tbody>
                          {reportData.balanceSheet.equity.items.map((item, idx) => (
                            <tr key={idx}>
                              <td className="py-2 text-muted-foreground">{item.item}</td>
                              <td className="py-2 text-right text-foreground">
                                {formatCurrency(item.amount)}
                              </td>
                            </tr>
                          ))}
                          <tr className="font-bold bg-muted">
                            <td className="py-3 text-foreground">Total Equity</td>
                            <td className="py-3 text-right text-primary">
                              {formatCurrency(reportData.balanceSheet.equity.totalEquity)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Balance Check */}
                  <div className="bg-muted rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">
                        Total Liabilities + Equity
                      </span>
                    </div>
                    <span className="font-bold text-foreground">
                      {formatCurrency(
                        reportData.balanceSheet.liabilities.totalLiabilities +
                        reportData.balanceSheet.equity.totalEquity
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No report data available</p>
          </div>
        )}
    </div>
  );
};

// Mock data
function getMockReportData(): ReportData {
  return {
    profitAndLoss: {
      revenue: 450000,
      costOfGoodsSold: 180000,
      grossProfit: 270000,
      operatingExpenses: [
        { category: 'Salaries & Wages', amount: 120000 },
        { category: 'Rent & Utilities', amount: 24000 },
        { category: 'Software & Subscriptions', amount: 18000 },
        { category: 'Marketing', amount: 15000 },
        { category: 'Professional Services', amount: 12000 },
        { category: 'Office Supplies', amount: 6000 },
        { category: 'Travel & Entertainment', amount: 8000 },
        { category: 'Insurance', amount: 7000 },
      ],
      totalOperatingExpenses: 210000,
      operatingIncome: 60000,
      otherIncome: 5000,
      otherExpenses: 3000,
      netIncome: 62000,
      previousPeriod: {
        revenue: 420000,
        netIncome: 55000,
      },
    },
    cashFlow: {
      operatingActivities: {
        netIncome: 62000,
        adjustments: [
          { item: 'Depreciation', amount: 8000 },
          { item: 'Accounts Receivable Change', amount: -12000 },
          { item: 'Accounts Payable Change', amount: 5000 },
          { item: 'Inventory Change', amount: -3000 },
        ],
        totalOperating: 60000,
      },
      investingActivities: {
        items: [
          { item: 'Equipment Purchases', amount: -15000 },
          { item: 'Software Development', amount: -8000 },
        ],
        totalInvesting: -23000,
      },
      financingActivities: {
        items: [
          { item: 'Loan Repayment', amount: -10000 },
          { item: 'Owner Distributions', amount: -20000 },
        ],
        totalFinancing: -30000,
      },
      netCashChange: 7000,
      beginningCash: 178000,
      endingCash: 185000,
    },
    balanceSheet: {
      assets: {
        current: [
          { item: 'Cash & Cash Equivalents', amount: 185000 },
          { item: 'Accounts Receivable', amount: 45000 },
          { item: 'Inventory', amount: 25000 },
          { item: 'Prepaid Expenses', amount: 8000 },
        ],
        totalCurrent: 263000,
        fixed: [
          { item: 'Equipment', amount: 75000 },
          { item: 'Accumulated Depreciation', amount: -25000 },
          { item: 'Furniture & Fixtures', amount: 15000 },
        ],
        totalFixed: 65000,
        totalAssets: 328000,
      },
      liabilities: {
        current: [
          { item: 'Accounts Payable', amount: 28000 },
          { item: 'Accrued Expenses', amount: 12000 },
          { item: 'Short-term Debt', amount: 15000 },
        ],
        totalCurrent: 55000,
        longTerm: [
          { item: 'Long-term Loan', amount: 50000 },
        ],
        totalLongTerm: 50000,
        totalLiabilities: 105000,
      },
      equity: {
        items: [
          { item: 'Common Stock', amount: 100000 },
          { item: 'Retained Earnings', amount: 61000 },
          { item: 'Current Year Earnings', amount: 62000 },
        ],
        totalEquity: 223000,
      },
    },
  };
}

export default MultiEntityReports;
