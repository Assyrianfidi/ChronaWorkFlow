"use client";

import React from "react";

import { MainLayout } from "@/components/layout/MainLayout";
import EnterpriseDataTable, { type Column } from "@/components/ui/EnterpriseDataTable";
import { EnterpriseButton } from "@/components/ui/EnterpriseButton";
import Card, {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CreditCard,
  Plus,
  Download,
  Check,
  X,
  Filter,
  Calendar,
  DollarSign,
  Tag,
} from "lucide-react";
import { useState } from "react";

// Mock data
const transactionsData = [
  {
    id: "TRN-001",
    date: "2024-01-15",
    account: "Business Checking",
    amount: "$2,500.00",
    category: "Sales",
    status: "Completed",
    reconciled: true,
    description: "Payment from ABC Corp",
  },
  {
    id: "TRN-002",
    date: "2024-01-14",
    account: "Operating Account",
    amount: "$1,800.00",
    category: "Operations",
    status: "Pending",
    reconciled: false,
    description: "Office supplies",
  },
  {
    id: "TRN-003",
    date: "2024-01-13",
    account: "Business Savings",
    amount: "$3,200.00",
    category: "Sales",
    status: "Completed",
    reconciled: true,
    description: "Client payment",
  },
  {
    id: "TRN-004",
    date: "2024-01-12",
    account: "Business Checking",
    amount: "$950.00",
    category: "Marketing",
    status: "Failed",
    reconciled: false,
    description: "Ad campaign",
  },
  {
    id: "TRN-005",
    date: "2024-01-11",
    account: "Payroll Account",
    amount: "$5,100.00",
    category: "Payroll",
    status: "Completed",
    reconciled: true,
    description: "Monthly salaries",
  },
  {
    id: "TRN-006",
    date: "2024-01-10",
    account: "Operating Account",
    amount: "$2,300.00",
    category: "Utilities",
    status: "Completed",
    reconciled: false,
    description: "Internet and phone",
  },
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState(transactionsData);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(
    new Set(),
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    account: "all",
    dateRange: "all",
    category: "all",
    status: "all",
    reconciled: "all",
  });

  const transactionColumns: Column<(typeof transactionsData)[0]>[] = [
    {
      key: "id",
      title: "Transaction ID",
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="font-mono text-sm font-medium text-primary">
          {value}
        </div>
      ),
    },
    {
      key: "date",
      title: "Date",
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: "account",
      title: "Account",
      sortable: true,
      filterable: true,
      render: (value) => <div className="font-medium">{value}</div>,
    },
    {
      key: "amount",
      title: "Amount",
      sortable: true,
      render: (value, row) => {
        const isExpense =
          row.category === "Operations" ||
          row.category === "Marketing" ||
          row.category === "Utilities" ||
          row.category === "Payroll";
        return (
          <div
            className={cn(
              "font-semibold flex items-center gap-1",
              isExpense
                ? "text-destructive dark:text-destructive-500"
                : "text-success-700 dark:text-success",
            )}
          >
            <DollarSign className="h-4 w-4" />
            {isExpense ? "-" : "+"}
            {value}
          </div>
        );
      },
    },
    {
      key: "category",
      title: "Category",
      sortable: true,
      filterable: true,
      render: (value) => {
        const categoryColors = {
          Sales: "bg-blue-100 text-blue-800",
          Operations: "bg-red-100 text-red-800",
          Marketing: "bg-purple-100 text-purple-800",
          Utilities: "bg-yellow-100 text-yellow-800",
          Payroll: "bg-green-100 text-green-800",
        };
        return (
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-400" />
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[value as keyof typeof categoryColors] || "bg-gray-100 text-gray-800"}`}
            >
              {value}
            </span>
          </div>
        );
      },
    },
    {
      key: "status",
      title: "Status",
      sortable: true,
      filterable: true,
      render: (value) => {
        const statusColors = {
          Completed: "bg-green-100 text-green-800",
          Pending: "bg-yellow-100 text-yellow-800",
          Failed: "bg-red-100 text-red-800",
        };
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[value as keyof typeof statusColors]}`}
          >
            {value}
          </span>
        );
      },
    },
    {
      key: "reconciled",
      title: "Reconciled",
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          {value ? (
            <>
              <Check className="h-4 w-4 text-success-700 dark:text-success" />
              <span className="text-xs text-success-700 dark:text-success">Yes</span>
            </>
          ) : (
            <>
              <X className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">No</span>
            </>
          )}
        </div>
      ),
    },
  ];

  const handleBulkReconcile = () => {
    const updatedTransactions = transactions.map((transaction, index) => {
      if (selectedTransactions.has(index)) {
        return { ...transaction, reconciled: true };
      }
      return transaction;
    });
    setTransactions(updatedTransactions);
    setSelectedTransactions(new Set());
  };

  const handleBulkExport = () => {
    const selectedData = transactions.filter((_, index) =>
      selectedTransactions.has(index),
    );
    console.log("Exporting selected transactions:", selectedData);
  };

  const filteredTransactions = transactions.filter((transaction) => {
    if (filters.account !== "all" && transaction.account !== filters.account)
      return false;
    if (filters.category !== "all" && transaction.category !== filters.category)
      return false;
    if (filters.status !== "all" && transaction.status !== filters.status)
      return false;
    if (filters.reconciled !== "all") {
      const isReconciled = filters.reconciled === "true";
      if (transaction.reconciled !== isReconciled) return false;
    }
    return true;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Transactions</h1>
          <p className="text-gray-600">
            Manage and track all your financial transactions
          </p>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Transaction Management</CardTitle>
              <div className="flex gap-2">
                <EnterpriseButton
                  variant="secondary"
                  icon={<Filter className="h-4 w-4" />}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Filters
                </EnterpriseButton>
                <EnterpriseButton
                  variant="secondary"
                  icon={<Download className="h-4 w-4" />}
                  onClick={handleBulkExport}
                  disabled={selectedTransactions.size === 0}
                >
                  Export Selected
                </EnterpriseButton>
                <EnterpriseButton
                  variant="secondary"
                  icon={<Check className="h-4 w-4" />}
                  onClick={handleBulkReconcile}
                  disabled={selectedTransactions.size === 0}
                >
                  Mark as Reconciled
                </EnterpriseButton>
                <EnterpriseButton
                  variant="primary"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => setShowAddModal(true)}
                >
                  Add Transaction
                </EnterpriseButton>
              </div>
            </div>
          </CardHeader>

          {showFilters && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account
                  </label>
                  <select
                    value={filters.account}
                    onChange={(e) =>
                      setFilters({ ...filters, account: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                  >
                    <option value="all">All Accounts</option>
                    <option value="Business Checking">Business Checking</option>
                    <option value="Business Savings">Business Savings</option>
                    <option value="Operating Account">Operating Account</option>
                    <option value="Payroll Account">Payroll Account</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) =>
                      setFilters({ ...filters, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                  >
                    <option value="all">All Categories</option>
                    <option value="Sales">Sales</option>
                    <option value="Operations">Operations</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Payroll">Payroll</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reconciled
                  </label>
                  <select
                    value={filters.reconciled}
                    onChange={(e) =>
                      setFilters({ ...filters, reconciled: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                  >
                    <option value="all">All</option>
                    <option value="true">Reconciled</option>
                    <option value="false">Not Reconciled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) =>
                      setFilters({ ...filters, dateRange: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                  </select>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardContent className="p-0">
            <EnterpriseDataTable
              data={filteredTransactions}
              columns={transactionColumns}
              searchable={true}
              exportable={true}
              paginated={true}
              pageSize={25}
              emptyMessage="No transactions found matching your criteria"
            />
          </CardContent>
        </Card>

        {/* Add Transaction Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle>Add New Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transaction ID
                    </label>
                    
        <label htmlFor="input-aj5h85x3p" className="sr-only">
          Text
        </label>
        <input id="input-aj5h85x3p"
                      type="text"
                      placeholder="TRN-XXX"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
      
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    
        <label htmlFor="input-gisasli77" className="sr-only">
          Date
        </label>
        <input id="input-gisasli77"
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
      
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary">
                      <option value="Business Checking">
                        Business Checking
                      </option>
                      <option value="Business Savings">Business Savings</option>
                      <option value="Operating Account">
                        Operating Account
                      </option>
                      <option value="Payroll Account">Payroll Account</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    
        <label htmlFor="input-d82v6b7ll" className="sr-only">
          Number
        </label>
        <input id="input-d82v6b7ll"
                      type="number"
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
      
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary">
                      <option value="Sales">Sales</option>
                      <option value="Operations">Operations</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Payroll">Payroll</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary">
                      <option value="Completed">Completed</option>
                      <option value="Pending">Pending</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    
        <label htmlFor="input-r8blcj0ed" className="sr-only">
          Text
        </label>
        <input id="input-r8blcj0ed"
                      type="text"
                      placeholder="Transaction description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
      
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <EnterpriseButton
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </EnterpriseButton>
                  <EnterpriseButton
                    variant="primary"
                    className="flex-1"
                    onClick={() => setShowAddModal(false)}
                  >
                    Create Transaction
                  </EnterpriseButton>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
