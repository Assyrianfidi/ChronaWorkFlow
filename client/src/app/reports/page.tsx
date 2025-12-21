"use client";

import React from "react";

import { MainLayout } from "@/components/layout/MainLayout";
import { EnterpriseButton } from "@/components/ui/EnterpriseButton";
import Card, {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Download,
  Calendar,
  Filter,
  DollarSign,
  Users,
  FileText,
} from "lucide-react";
import { useState } from "react";

// Mock data for reports
const reportsData = {
  revenueVsExpenses: [
    { month: "Jan", revenue: 45000, expenses: 32000, profit: 13000 },
    { month: "Feb", revenue: 52000, expenses: 35000, profit: 17000 },
    { month: "Mar", revenue: 48000, expenses: 33000, profit: 15000 },
    { month: "Apr", revenue: 61000, expenses: 38000, profit: 23000 },
    { month: "May", revenue: 55000, expenses: 36000, profit: 19000 },
    { month: "Jun", revenue: 67000, expenses: 40000, profit: 27000 },
  ],
  profitMargins: [
    { department: "Sales", margin: 35, revenue: 125000 },
    { department: "Services", margin: 42, revenue: 89000 },
    { department: "Products", margin: 28, revenue: 156000 },
    { department: "Support", margin: 15, revenue: 45000 },
  ],
  transactionVolume: [
    { month: "Jan", transactions: 245, amount: 78000 },
    { month: "Feb", transactions: 312, amount: 92000 },
    { month: "Mar", transactions: 289, amount: 85000 },
    { month: "Apr", transactions: 367, amount: 112000 },
    { month: "May", transactions: 334, amount: 98000 },
    { month: "Jun", transactions: 401, amount: 125000 },
  ],
  accountsReceivable: [
    { customer: "ABC Corporation", amount: 15000, days: 15, status: "Current" },
    { customer: "XYZ Industries", amount: 8500, days: 35, status: "Overdue" },
    { customer: "Global Tech Ltd", amount: 22000, days: 5, status: "Current" },
    { customer: "StartUp Inc", amount: 4500, days: 45, status: "Overdue" },
    { customer: "Enterprise Co", amount: 18000, days: 25, status: "Current" },
  ],
  accountsPayable: [
    { vendor: "Office Supplies Co", amount: 3200, days: 10, status: "Pending" },
    { vendor: "Software LLC", amount: 8500, days: 30, status: "Due" },
    { vendor: "Utilities Inc", amount: 1200, days: 5, status: "Pending" },
    { vendor: "Marketing Agency", amount: 5500, days: 45, status: "Overdue" },
    { vendor: "IT Services", amount: 7500, days: 20, status: "Pending" },
  ],
};

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("quarter");
  const [selectedReport, setSelectedReport] = useState("overview");

  const handleExport = (format: "pdf" | "excel") => {
    console.log(`Exporting report as ${format}`);
    // Implement export functionality
  };

  const renderChartPlaceholder = (
    title: string,
    description: string,
    data: any,
  ) => (
    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-3 bg-gray-200 rounded-lg flex items-center justify-center">
          <BarChart3 className="h-8 w-8 text-gray-400" />
        </div>
        <h4 className="font-medium text-gray-700 mb-1">{title}</h4>
        <p className="text-sm text-gray-500 mb-3">{description}</p>
        <div className="space-y-1 text-xs text-gray-400 max-w-xs mx-auto">
          {Array.isArray(data) &&
            data.slice(0, 3).map((item, index) => (
              <div key={index}>
                {item.month || item.department || item.customer}: $
                {item.revenue || item.margin || item.amount || item.value}
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  const renderPieChartPlaceholder = (
    title: string,
    description: string,
    data: any,
  ) => (
    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full border-8 border-gray-200 border-t-blue-500 border-r-green-500 border-b-yellow-500 border-l-red-500" />
        <h4 className="font-medium text-gray-700 mb-1">{title}</h4>
        <p className="text-sm text-gray-500 mb-3">{description}</p>
        <div className="space-y-1 text-xs text-gray-400 max-w-xs mx-auto">
          {Array.isArray(data) &&
            data.slice(0, 3).map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                {item.department || item.vendor}: {item.margin || item.amount}%
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            Reports & Analytics
          </h1>
          <p className="text-gray-600">
            Comprehensive financial insights and business analytics
          </p>
        </div>

        {/* Report Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Report Controls</CardTitle>
              <div className="flex gap-3">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>

                <EnterpriseButton
                  variant="secondary"
                  icon={<Filter className="h-4 w-4" />}
                >
                  Advanced Filters
                </EnterpriseButton>

                <div className="flex gap-1">
                  <EnterpriseButton
                    variant="secondary"
                    size="sm"
                    icon={<Download className="h-4 w-4" />}
                    onClick={() => handleExport("pdf")}
                  >
                    PDF
                  </EnterpriseButton>
                  <EnterpriseButton
                    variant="secondary"
                    size="sm"
                    icon={<Download className="h-4 w-4" />}
                    onClick={() => handleExport("excel")}
                  >
                    Excel
                  </EnterpriseButton>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Overview Section */}
        {selectedReport === "overview" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      +12.5%
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-primary mb-1">
                    $328,000
                  </h3>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <TrendingDown className="h-6 w-6 text-red-600" />
                    </div>
                    <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                      -8.3%
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-primary mb-1">
                    $214,000
                  </h3>
                  <p className="text-sm text-gray-600">Total Expenses</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      +18.2%
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-primary mb-1">
                    $114,000
                  </h3>
                  <p className="text-sm text-gray-600">Net Profit</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                      +5.7%
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-primary mb-1">
                    1,848
                  </h3>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Revenue vs Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderChartPlaceholder(
                    "Revenue vs Expenses Trend",
                    "Monthly comparison of revenue and expenses",
                    reportsData.revenueVsExpenses,
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Profit Margins by Department
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderPieChartPlaceholder(
                    "Department Profit Margins",
                    "Profit margin percentage by department",
                    reportsData.profitMargins,
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Transaction Volume
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderChartPlaceholder(
                    "Transaction Volume Analysis",
                    "Number of transactions and total amount per month",
                    reportsData.transactionVolume,
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Cash Flow Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderChartPlaceholder(
                    "Cash Flow Analysis",
                    "Monthly cash flow in and out",
                    reportsData.revenueVsExpenses,
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Accounts Receivable Aging */}
        {selectedReport === "receivables" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Accounts Receivable Aging</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Aging Summary */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-800">Current</h4>
                      <p className="text-2xl font-bold text-green-600">
                        $55,000
                      </p>
                      <p className="text-sm text-green-600">3 invoices</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-semibold text-yellow-800">
                        1-30 Days
                      </h4>
                      <p className="text-2xl font-bold text-yellow-600">
                        $18,000
                      </p>
                      <p className="text-sm text-yellow-600">2 invoices</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-semibold text-orange-800">
                        31-60 Days
                      </h4>
                      <p className="text-2xl font-bold text-orange-600">
                        $8,500
                      </p>
                      <p className="text-sm text-orange-600">1 invoice</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <h4 className="font-semibold text-red-800">60+ Days</h4>
                      <p className="text-2xl font-bold text-red-600">$4,500</p>
                      <p className="text-sm text-red-600">1 invoice</p>
                    </div>
                  </div>

                  {/* Detailed Table */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Customer
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Amount
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                            Days
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {reportsData.accountsReceivable.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm font-medium">
                              {item.customer}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-semibold">
                              ${item.amount.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              {item.days}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.status === "Current"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Accounts Payable Aging */}
        {selectedReport === "payables" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Accounts Payable Aging</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Aging Summary */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-800">Current</h4>
                      <p className="text-2xl font-bold text-green-600">
                        $4,400
                      </p>
                      <p className="text-sm text-green-600">2 bills</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-semibold text-yellow-800">
                        1-30 Days
                      </h4>
                      <p className="text-2xl font-bold text-yellow-600">
                        $7,500
                      </p>
                      <p className="text-sm text-yellow-600">2 bills</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-semibold text-orange-800">
                        31-60 Days
                      </h4>
                      <p className="text-2xl font-bold text-orange-600">
                        $8,500
                      </p>
                      <p className="text-sm text-orange-600">1 bill</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <h4 className="font-semibold text-red-800">60+ Days</h4>
                      <p className="text-2xl font-bold text-red-600">$5,500</p>
                      <p className="text-sm text-red-600">1 bill</p>
                    </div>
                  </div>

                  {/* Detailed Table */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Vendor
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Amount
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                            Days
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {reportsData.accountsPayable.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm font-medium">
                              {item.vendor}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-semibold">
                              ${item.amount.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              {item.days}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.status === "Pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : item.status === "Due"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
