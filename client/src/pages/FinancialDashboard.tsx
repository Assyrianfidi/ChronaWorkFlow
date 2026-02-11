/**
 * Financial Dashboard - High-Fidelity UI/UX Design
 * Inspired by Intuit Design System
 * Card-based layout with ample white space
 * WCAG 2.1 AA Compliant
 */

import React, { useState } from "react";
import { FinancialSidebar } from "@/components/layout/FinancialSidebar";
import {
  ProfitLossWidget,
  BankAccountsWidget,
  InvoicesWidget,
} from "@/components/widgets/FinancialWidgets";
import {
  Bell,
  Search,
  ChevronDown,
  Plus,
  Download,
  Filter,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickStatProps {
  icon: React.ComponentType<{
    className?: string;
    "aria-hidden"?: string | boolean;
  }>;
  label: string;
  value: string;
  change: number;
  color: "green" | "blue" | "purple" | "orange";
}

const QuickStat: React.FC<QuickStatProps> = ({
  icon: Icon,
  label,
  value,
  change,
  color,
}) => {
  const colorClasses = {
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };

  const isPositive = change >= 0;

  return (
    <div className="financial-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            colorClasses[color],
          )}
        >
          <Icon className="w-6 h-6" aria-hidden="true" />
        </div>
        <div
          className={cn(
            "px-2 py-1 rounded-md text-xs font-bold",
            isPositive
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700",
          )}
        >
          {isPositive ? "+" : ""}
          {change}%
        </div>
      </div>
      <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
      <p
        className="text-3xl font-extrabold text-gray-900"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {value}
      </p>
    </div>
  );
};

export const FinancialDashboard: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("This Month");

  const quickStats = [
    {
      icon: DollarSign,
      label: "Total Revenue",
      value: "$124.5K",
      change: 12.5,
      color: "green" as const,
    },
    {
      icon: TrendingUp,
      label: "Net Profit",
      value: "$37.3K",
      change: 18.7,
      color: "blue" as const,
    },
    {
      icon: Users,
      label: "Active Clients",
      value: "89",
      change: 4.2,
      color: "purple" as const,
    },
    {
      icon: Activity,
      label: "Cash Flow",
      value: "$45.2K",
      change: 8.3,
      color: "orange" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      {/* Sidebar */}
      <FinancialSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={setSidebarCollapsed}
      />

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "ml-20" : "ml-[280px]",
        )}
      >
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Left: Title & Period Selector */}
              <div className="flex items-center gap-6">
                <div>
                  <h1
                    className="text-3xl font-extrabold text-gray-900 mb-1"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Financial Dashboard
                  </h1>
                  <p className="text-sm text-gray-500">
                    Welcome back! Here's your business overview.
                  </p>
                </div>

                <button
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                  aria-label="Select time period"
                  aria-haspopup="listbox"
                >
                  <Calendar
                    className="w-4 h-4 text-gray-500"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-bold text-gray-700">
                    {selectedPeriod}
                  </span>
                  <ChevronDown
                    className="w-4 h-4 text-gray-400"
                    aria-hidden="true"
                  />
                </button>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-3">
                <button
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                  aria-label="Search"
                >
                  <Search
                    className="w-5 h-5 text-gray-600"
                    aria-hidden="true"
                  />
                </button>

                <button
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                  aria-label="Notifications (3 unread)"
                >
                  <Bell className="w-5 h-5 text-gray-600" aria-hidden="true" />
                  <span
                    className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"
                    aria-hidden="true"
                  ></span>
                </button>

                <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2">
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Create New
                </button>

                <button
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                  aria-label="Download reports"
                >
                  <Download
                    className="w-5 h-5 text-gray-600"
                    aria-hidden="true"
                  />
                </button>

                <button
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                  aria-label="Filter options"
                >
                  <Filter
                    className="w-5 h-5 text-gray-600"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main id="main-content" className="p-8">
          {/* Quick Stats Grid */}
          <section aria-labelledby="quick-stats-heading" className="mb-8">
            <h2 id="quick-stats-heading" className="sr-only">
              Quick Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickStats.map((stat) => (
                <QuickStat key={stat.label} {...stat} />
              ))}
            </div>
          </section>

          {/* Main Widgets Grid */}
          <section aria-labelledby="financial-widgets-heading" className="mb-8">
            <h2 id="financial-widgets-heading" className="sr-only">
              Financial Widgets
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Profit & Loss Widget */}
              <ProfitLossWidget className="lg:col-span-1" />

              {/* Bank Accounts Widget */}
              <BankAccountsWidget className="lg:col-span-1" />

              {/* Invoices Widget */}
              <InvoicesWidget className="lg:col-span-1" />
            </div>
          </section>

          {/* Additional Insights Section */}
          <section aria-labelledby="insights-heading" className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2
                id="insights-heading"
                className="text-2xl font-extrabold text-gray-900"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Business Insights
              </h2>
              <button className="text-sm font-bold text-green-600 hover:text-green-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 rounded-md px-2 py-1">
                View All Insights
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cash Flow Trend */}
              <div className="financial-card">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3
                      className="text-lg font-extrabold text-gray-900 mb-1"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      Cash Flow Trend
                    </h3>
                    <p className="text-sm text-gray-500">Last 6 months</p>
                  </div>
                </div>

                {/* Simple Bar Chart Visualization */}
                <div className="flex items-end justify-between gap-2 h-48 mb-4">
                  {[65, 78, 82, 70, 88, 95].map((height, index) => (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center gap-2"
                    >
                      <div
                        className="w-full bg-gray-100 rounded-t-lg overflow-hidden"
                        style={{ height: "100%" }}
                      >
                        <div
                          className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-500"
                          style={{ height: `${height}%` }}
                          role="img"
                          aria-label={`Month ${index + 1}: ${height}%`}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 font-medium">
                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun"][index]}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Average Monthly
                    </p>
                    <p
                      className="text-xl font-extrabold text-gray-900"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      $42.3K
                    </p>
                  </div>
                  <div className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-bold">
                    +15.3% Growth
                  </div>
                </div>
              </div>

              {/* Top Expenses */}
              <div className="financial-card">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3
                      className="text-lg font-extrabold text-gray-900 mb-1"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      Top Expenses
                    </h3>
                    <p className="text-sm text-gray-500">
                      This month breakdown
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      category: "Payroll",
                      amount: 45678,
                      percentage: 52,
                      color: "bg-blue-500",
                    },
                    {
                      category: "Office Rent",
                      amount: 12000,
                      percentage: 14,
                      color: "bg-purple-500",
                    },
                    {
                      category: "Software & Tools",
                      amount: 8900,
                      percentage: 10,
                      color: "bg-green-500",
                    },
                    {
                      category: "Marketing",
                      amount: 7500,
                      percentage: 9,
                      color: "bg-orange-500",
                    },
                    {
                      category: "Other",
                      amount: 13156,
                      percentage: 15,
                      color: "bg-gray-400",
                    },
                  ].map((expense) => (
                    <div key={expense.category}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {expense.category}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-900">
                            ${expense.amount.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500 w-10 text-right">
                            {expense.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            expense.color,
                          )}
                          style={{ width: `${expense.percentage}%` }}
                          role="progressbar"
                          aria-valuenow={expense.percentage}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${expense.category}: ${expense.percentage}%`}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <p>© 2026 AccuBooks. All rights reserved.</p>
              <div className="flex items-center gap-6">
                <a
                  href="#"
                  className="hover:text-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded-md px-2 py-1"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="hover:text-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded-md px-2 py-1"
                >
                  Terms of Service
                </a>
                <a
                  href="#"
                  className="hover:text-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded-md px-2 py-1"
                >
                  Help Center
                </a>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default FinancialDashboard;
