declare global {
  interface Window {
    [key: string]: any;
  }
}

import React, { useState } from "react";
import {
  EnterpriseButton,
  EnterpriseKPICard,
} from "@/components/components/ui";
import {
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  Target,
  Activity,
  Printer,
  Mail,
  FileSpreadsheet,
  FileText as FileIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Line,
  ComposedChart,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

// Mock data for reports
const profitLossData = [
  { month: "Jan", revenue: 45000, expenses: 32000, profit: 13000 },
  { month: "Feb", revenue: 52000, expenses: 35000, profit: 17000 },
  { month: "Mar", revenue: 48000, expenses: 31000, profit: 17000 },
  { month: "Apr", revenue: 61000, expenses: 38000, profit: 23000 },
  { month: "May", revenue: 55000, expenses: 36000, profit: 19000 },
  { month: "Jun", revenue: 67000, expenses: 42000, profit: 25000 },
];

const balanceSheetData = [
  { category: "Current Assets", amount: 125000, percentage: 35 },
  { category: "Fixed Assets", amount: 180000, percentage: 50 },
  { category: "Current Liabilities", amount: 45000, percentage: 12 },
  { category: "Long-term Liabilities", amount: 35000, percentage: 10 },
  { category: "Equity", amount: 85000, percentage: 23 },
];

const cashFlowData = [
  {
    month: "Jan",
    operating: 15000,
    investing: -5000,
    financing: 2000,
    net: 12000,
  },
  {
    month: "Feb",
    operating: 18000,
    investing: -8000,
    financing: 3000,
    net: 13000,
  },
  {
    month: "Mar",
    operating: 16000,
    investing: -3000,
    financing: 1000,
    net: 14000,
  },
  {
    month: "Apr",
    operating: 22000,
    investing: -12000,
    financing: 5000,
    net: 15000,
  },
  {
    month: "May",
    operating: 19000,
    investing: -6000,
    financing: 2000,
    net: 15000,
  },
  {
    month: "Jun",
    operating: 25000,
    investing: -10000,
    financing: 4000,
    net: 19000,
  },
];

const agingReportData = [
  {
    customer: "ABC Corporation",
    "0-30": 15000,
    "31-60": 8000,
    "61-90": 2000,
    "90+": 1000,
    total: 26000,
  },
  {
    customer: "XYZ Industries",
    "0-30": 12000,
    "31-60": 5000,
    "61-90": 1500,
    "90+": 500,
    total: 19000,
  },
  {
    customer: "Global Tech Ltd",
    "0-30": 8000,
    "31-60": 3000,
    "61-90": 1000,
    "90+": 0,
    total: 12000,
  },
  {
    customer: "Innovation Corp",
    "0-30": 6000,
    "31-60": 2000,
    "61-90": 500,
    "90+": 0,
    total: 8500,
  },
];

const expenseCategories = [
  { name: "Salaries", value: 85000, color: "#3B82F6" },
  { name: "Rent", value: 24000, color: "#10B981" },
  { name: "Marketing", value: 18000, color: "#F59E0B" },
  { name: "Utilities", value: 12000, color: "#EF4444" },
  { name: "Supplies", value: 8000, color: "#8B5CF6" },
  { name: "Other", value: 15000, color: "#6B7280" },
];

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
  const [selectedReport, setSelectedReport] = useState("profit-loss");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const exportReport = (format: string) => {
    console.log(`Exporting ${selectedReport} as ${format}`);
  };

  const printReport = () => {
    window.print();
  };

  const emailReport = () => {
    console.log(`Emailing ${selectedReport} report`);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Financial Reports
          </h1>
          <p className="text-gray-600">
            Comprehensive financial analysis and reporting
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="current-month">Current Month</option>
            <option value="last-month">Last Month</option>
            <option value="current-quarter">Current Quarter</option>
            <option value="last-quarter">Last Quarter</option>
            <option value="current-year">Current Year</option>
            <option value="custom">Custom Range</option>
          </select>

          <div className="relative">
            <EnterpriseButton
              variant="ghost"
              size="sm"
              icon={<Download className="w-4 h-4" />}
              onClick={() => {}}
            >
              Export
            </EnterpriseButton>

            {/* Export Dropdown */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                onClick={() => exportReport("pdf")}
              >
                <FileIcon className="w-4 h-4" />
                Export as PDF
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                onClick={() => exportReport("excel")}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export as Excel
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                onClick={() => exportReport("csv")}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export as CSV
              </button>
            </div>
          </div>

          <EnterpriseButton
            variant="ghost"
            size="sm"
            icon={<Printer className="w-4 h-4" />}
            onClick={printReport}
          >
            Print
          </EnterpriseButton>
          <EnterpriseButton
            variant="ghost"
            size="sm"
            icon={<Mail className="w-4 h-4" />}
            onClick={emailReport}
          >
            Email
          </EnterpriseButton>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="bg-white rounded-lg shadow-lg mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              {
                id: "profit-loss",
                label: "Profit & Loss",
                icon: <TrendingUp className="w-4 h-4" />,
              },
              {
                id: "balance-sheet",
                label: "Balance Sheet",
                icon: <BarChart3 className="w-4 h-4" />,
              },
              {
                id: "cash-flow",
                label: "Cash Flow",
                icon: <Activity className="w-4 h-4" />,
              },
              {
                id: "aging",
                label: "Aging Report",
                icon: <Calendar className="w-4 h-4" />,
              },
              {
                id: "expenses",
                label: "Expense Analysis",
                icon: <PieChart className="w-4 h-4" />,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedReport(tab.id)}
                className={cn(
                  "flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors",
                  selectedReport === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Report Content */}
        <div className="p-6">
          {/* Profit & Loss Report */}
          {selectedReport === "profit-loss" && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <EnterpriseKPICard
                  title="Total Revenue"
                  value={formatCurrency(328000)}
                  change={15.3}
                  changeType="increase"
                  icon={<TrendingUp className="w-5 h-5" />}
                  color="success"
                />
                <EnterpriseKPICard
                  title="Total Expenses"
                  value={formatCurrency(214000)}
                  change={8.7}
                  changeType="increase"
                  icon={<TrendingDown className="w-5 h-5" />}
                  color="danger"
                />
                <EnterpriseKPICard
                  title="Net Profit"
                  value={formatCurrency(114000)}
                  change={28.5}
                  changeType="increase"
                  icon={<Target className="w-5 h-5" />}
                  color="primary"
                />
                <EnterpriseKPICard
                  title="Profit Margin"
                  value="34.8%"
                  change={5.2}
                  changeType="increase"
                  icon={<DollarSign className="w-5 h-5" />}
                  color="info"
                />
              </div>

              {/* Profit & Loss Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Profit & Loss Trend
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={profitLossData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
                    <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      name="Profit"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Balance Sheet Report */}
          {selectedReport === "balance-sheet" && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <EnterpriseKPICard
                  title="Total Assets"
                  value={formatCurrency(305000)}
                  change={12.4}
                  changeType="increase"
                  icon={<BarChart3 className="w-5 h-5" />}
                  color="primary"
                />
                <EnterpriseKPICard
                  title="Total Liabilities"
                  value={formatCurrency(80000)}
                  change={-5.2}
                  changeType="decrease"
                  icon={<TrendingDown className="w-5 h-5" />}
                  color="warning"
                />
                <EnterpriseKPICard
                  title="Owner's Equity"
                  value={formatCurrency(225000)}
                  change={18.7}
                  changeType="increase"
                  icon={<Target className="w-5 h-5" />}
                  color="success"
                />
              </div>

              {/* Balance Sheet Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Asset Composition
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={balanceSheetData.filter((item) =>
                          item.category.includes("Assets"),
                        )}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="amount"
                      >
                        {balanceSheetData
                          .filter((item) => item.category.includes("Assets"))
                          .map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={index === 0 ? "#3B82F6" : "#10B981"}
                            />
                          ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {balanceSheetData
                      .filter((item) => item.category.includes("Assets"))
                      .map((item) => (
                        <div
                          key={item.category}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-600">{item.category}</span>
                          <span className="font-medium">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Liabilities & Equity
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={balanceSheetData.filter(
                          (item) => !item.category.includes("Assets"),
                        )}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="amount"
                      >
                        {balanceSheetData
                          .filter((item) => !item.category.includes("Assets"))
                          .map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                index === 0
                                  ? "#EF4444"
                                  : index === 1
                                    ? "#F59E0B"
                                    : "#8B5CF6"
                              }
                            />
                          ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {balanceSheetData
                      .filter((item) => !item.category.includes("Assets"))
                      .map((item) => (
                        <div
                          key={item.category}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-600">{item.category}</span>
                          <span className="font-medium">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cash Flow Report */}
          {selectedReport === "cash-flow" && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <EnterpriseKPICard
                  title="Operating Cash Flow"
                  value={formatCurrency(115000)}
                  change={22.3}
                  changeType="increase"
                  icon={<Activity className="w-5 h-5" />}
                  color="success"
                />
                <EnterpriseKPICard
                  title="Investing Cash Flow"
                  value={formatCurrency(-44000)}
                  change={-15.7}
                  changeType="decrease"
                  icon={<TrendingDown className="w-5 h-5" />}
                  color="danger"
                />
                <EnterpriseKPICard
                  title="Financing Cash Flow"
                  value={formatCurrency(17000)}
                  change={8.1}
                  changeType="increase"
                  icon={<DollarSign className="w-5 h-5" />}
                  color="info"
                />
                <EnterpriseKPICard
                  title="Net Cash Flow"
                  value={formatCurrency(88000)}
                  change={31.2}
                  changeType="increase"
                  icon={<Target className="w-5 h-5" />}
                  color="primary"
                />
              </div>

              {/* Cash Flow Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Cash Flow Analysis
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={cashFlowData}>
                    <defs>
                      <linearGradient
                        id="operatingGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10B981"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10B981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="investingGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#EF4444"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#EF4444"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="financingGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3B82F6"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3B82F6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="operating"
                      stroke="#10B981"
                      fillOpacity={1}
                      fill="url(#operatingGradient)"
                      name="Operating"
                    />
                    <Area
                      type="monotone"
                      dataKey="investing"
                      stroke="#EF4444"
                      fillOpacity={1}
                      fill="url(#investingGradient)"
                      name="Investing"
                    />
                    <Area
                      type="monotone"
                      dataKey="financing"
                      stroke="#3B82F6"
                      fillOpacity={1}
                      fill="url(#financingGradient)"
                      name="Financing"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Aging Report */}
          {selectedReport === "aging" && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <EnterpriseKPICard
                  title="0-30 Days"
                  value={formatCurrency(41000)}
                  change={5.2}
                  changeType="increase"
                  icon={<Calendar className="w-5 h-5" />}
                  color="success"
                />
                <EnterpriseKPICard
                  title="31-60 Days"
                  value={formatCurrency(18000)}
                  change={-2.1}
                  changeType="decrease"
                  icon={<Calendar className="w-5 h-5" />}
                  color="info"
                />
                <EnterpriseKPICard
                  title="61-90 Days"
                  value={formatCurrency(5000)}
                  change={-8.5}
                  changeType="decrease"
                  icon={<Calendar className="w-5 h-5" />}
                  color="warning"
                />
                <EnterpriseKPICard
                  title="90+ Days"
                  value={formatCurrency(1500)}
                  change={-12.3}
                  changeType="decrease"
                  icon={<Calendar className="w-5 h-5" />}
                  color="danger"
                />
                <EnterpriseKPICard
                  title="Total AR"
                  value={formatCurrency(65500)}
                  change={3.7}
                  changeType="increase"
                  icon={<DollarSign className="w-5 h-5" />}
                  color="primary"
                />
              </div>

              {/* Aging Table */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Accounts Receivable Aging
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                            Customer
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                            0-30 Days
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                            31-60 Days
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                            61-90 Days
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                            90+ Days
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {agingReportData.map((customer, index) => (
                          <tr
                            key={customer.customer}
                            className={
                              index % 2 === 0 ? "bg-gray-50" : "bg-white"
                            }
                          >
                            <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                              {customer.customer}
                            </td>
                            <td className="text-right py-3 px-4 text-sm text-gray-900">
                              {formatCurrency(customer["0-30"])}
                            </td>
                            <td className="text-right py-3 px-4 text-sm text-gray-900">
                              {formatCurrency(customer["31-60"])}
                            </td>
                            <td className="text-right py-3 px-4 text-sm text-gray-900">
                              {formatCurrency(customer["61-90"])}
                            </td>
                            <td className="text-right py-3 px-4 text-sm text-red-600">
                              {formatCurrency(customer["90+"])}
                            </td>
                            <td className="text-right py-3 px-4 text-sm font-medium text-gray-900">
                              {formatCurrency(customer.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Expense Analysis */}
          {selectedReport === "expenses" && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <EnterpriseKPICard
                  title="Total Expenses"
                  value={formatCurrency(162000)}
                  change={8.4}
                  changeType="increase"
                  icon={<TrendingUp className="w-5 h-5" />}
                  color="warning"
                />
                <EnterpriseKPICard
                  title="Largest Category"
                  value="Salaries"
                  icon={<DollarSign className="w-5 h-5" />}
                  color="primary"
                  subtitle="52.5% of total"
                />
                <EnterpriseKPICard
                  title="Average Monthly"
                  value={formatCurrency(27000)}
                  change={3.2}
                  changeType="increase"
                  icon={<Calendar className="w-5 h-5" />}
                  color="info"
                />
                <EnterpriseKPICard
                  title="YoY Change"
                  value="+12.7%"
                  change={12.7}
                  changeType="increase"
                  icon={<Activity className="w-5 h-5" />}
                  color="danger"
                />
              </div>

              {/* Expense Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Expense Breakdown
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={expenseCategories}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                      >
                        {expenseCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {expenseCategories.map((category) => (
                      <div
                        key={category.name}
                        className="flex justify-between items-center"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className="text-sm text-gray-600">
                            {category.name}
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          {formatCurrency(category.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Expense Trends
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={profitLossData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Bar
                        dataKey="expenses"
                        fill="#F59E0B"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
