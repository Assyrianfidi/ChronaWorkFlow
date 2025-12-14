import React, { useState } from "react";
import * as React from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  CreditCard,
  DollarSign,
  Settings,
  Bell,
  Search,
  Menu,
  X,
} from "lucide-react";
import {
  RevenueCard,
  CustomersCard,
  InvoicesCard,
  TransactionsCard,
} from "./KPICard";
import {
  EnterpriseDataTable,
  type Column,
} from "@/components/ui/EnterpriseDataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/../../lib/utils";

interface EnterpriseDashboardProps {
  className?: string;
}

const EnterpriseDashboard = React.forwardRef<
  HTMLDivElement,
  EnterpriseDashboardProps
>(({ className }, ref) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Mock data for demonstration
  const recentTransactions = [
    {
      id: "INV-001",
      customer: "ABC Corporation",
      amount: "$2,500.00",
      status: "Paid",
      date: "2024-01-15",
    },
    {
      id: "INV-002",
      customer: "XYZ Industries",
      amount: "$1,800.00",
      status: "Pending",
      date: "2024-01-14",
    },
    {
      id: "INV-003",
      customer: "Global Tech Ltd",
      amount: "$3,200.00",
      status: "Paid",
      date: "2024-01-13",
    },
    {
      id: "INV-004",
      customer: "StartUp Inc",
      amount: "$950.00",
      status: "Overdue",
      date: "2024-01-12",
    },
    {
      id: "INV-005",
      customer: "Enterprise Co",
      amount: "$5,100.00",
      status: "Paid",
      date: "2024-01-11",
    },
  ];

  const transactionColumns = [
    {
      accessorKey: "id",
      header: "Invoice ID",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("id")}</div>
      ),
    },
    {
      accessorKey: "customer",
      header: "Customer",
      cell: ({ row }) => <div>{row.getValue("customer")}</div>,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-semibold">{row.getValue("amount")}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const statusColors = {
          Paid: "bg-green-100 text-green-800",
          Pending: "bg-yellow-100 text-yellow-800",
          Overdue: "bg-red-100 text-red-800",
        };
        const value = row.getValue("status") as string;
        return (
          <span
            className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              statusColors[value as keyof typeof statusColors],
            )}
          >
            {value}
          </span>
        );
      },
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => <div>{row.getValue("date")}</div>,
    },
  ];

  const navigationItems = [
    { icon: BarChart3, label: "Dashboard", active: true },
    { icon: FileText, label: "Invoices", active: false },
    { icon: Users, label: "Customers", active: false },
    { icon: CreditCard, label: "Transactions", active: false },
    { icon: TrendingUp, label: "Reports", active: false },
    { icon: Settings, label: "Settings", active: false },
  ];

  return (
    <div ref={ref} className={cn("min-h-screen bg-gray-50", className)}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">AccuBooks</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search transactions, customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80"
              />
            </div>

            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">A</span>
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium text-gray-900">
                  Admin User
                </div>
                <div className="text-xs text-gray-500">Administrator</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed left-0 top-16 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40",
            sidebarOpen ? "w-64" : "w-0",
          )}
        >
          <nav className="p-4 space-y-1">
            {navigationItems.map((item, index) => (
              <button
                key={index}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  item.active
                    ? "bg-primary-50 text-primary-700 border-l-4 border-primary-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 transition-all duration-300",
            sidebarOpen ? "ml-64" : "ml-0",
          )}
        >
          <div className="p-6">
            {/* Page Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Dashboard Overview
              </h2>
              <p className="text-gray-600">
                Welcome back! Here's what's happening with your business today.
              </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <RevenueCard value="$124,563" change={12.5} />
              <CustomersCard value="1,234" change={8.2} />
              <InvoicesCard value="89" change={-3.1} />
              <TransactionsCard value="456" change={15.7} />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Revenue Chart</p>
                      <p className="text-sm text-gray-400">
                        Chart component will be integrated here
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Transaction Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Transaction Chart</p>
                      <p className="text-sm text-gray-400">
                        Chart component will be integrated here
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <EnterpriseDataTable
                  data={recentTransactions}
                  columns={transactionColumns}
                  enableSorting={true}
                  enableColumnFilters={false}
                  enableGlobalFilter={false}
                  onRowClick={(row) => console.log("Transaction clicked:", row)}
                  renderToolbar={(state, table) => (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Export functionality
                          const rows = table.getFilteredRowModel().rows;
                          const csvContent = [
                            [
                              "Transaction #",
                              "Date",
                              "Description",
                              "Amount",
                            ].join(","),
                            ...rows.map((row) =>
                              [
                                row.original.transactionNumber || "",
                                row.original.date || "",
                                row.original.description || "",
                                row.original.totalAmount || "",
                              ].join(","),
                            ),
                          ].join("\n");

                          const blob = new Blob([csvContent], {
                            type: "text/csv",
                          });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "transactions.csv";
                          a.click();
                          window.URL.revokeObjectURL(url);
                        }}
                      >
                        Export
                      </Button>
                      <Button variant="outline" size="sm">
                        View All
                      </Button>
                    </div>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
});
EnterpriseDashboard.displayName = "EnterpriseDashboard";

export { EnterpriseDashboard };
