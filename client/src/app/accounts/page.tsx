import React from 'react';
"use client";

import { MainLayout } from '../components/layout/MainLayout.js';
import {
  EnterpriseDataTable,
  type Column,
} from '../components/ui/EnterpriseDataTable.js';
import { EnterpriseButton } from '../components/ui/EnterpriseButton.js';
import { EnterpriseInput } from '../components/ui/EnterpriseInput.js';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card.js';
import { Building2, Plus, Trash2, Edit, Eye } from "lucide-react";
import { useState } from "react";

// Mock data
const accountsData = [
  {
    id: 1,
    name: "Business Checking",
    type: "Checking",
    balance: "$45,230.50",
    lastUpdated: "2024-01-15",
    status: "Active",
  },
  {
    id: 2,
    name: "Business Savings",
    type: "Savings",
    balance: "$125,890.00",
    lastUpdated: "2024-01-14",
    status: "Active",
  },
  {
    id: 3,
    name: "Operating Account",
    type: "Checking",
    balance: "$23,450.75",
    lastUpdated: "2024-01-13",
    status: "Active",
  },
  {
    id: 4,
    name: "Payroll Account",
    type: "Checking",
    balance: "$67,890.25",
    lastUpdated: "2024-01-12",
    status: "Active",
  },
  {
    id: 5,
    name: "Tax Reserve",
    type: "Savings",
    balance: "$34,567.00",
    lastUpdated: "2024-01-11",
    status: "Active",
  },
];

export default function AccountsPage() {
  const [accounts, setAccounts] = useState(accountsData);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [filters, setFilters] = useState({
    type: "all",
    balanceRange: "all",
  });

  const accountColumns: Column<(typeof accountsData)[0]>[] = [
    {
      key: "name",
      title: "Account Name",
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
            <Building2 className="h-4 w-4 text-secondary" />
          </div>
          <div>
            <div className="font-medium text-primary">{value}</div>
            <div className="text-xs text-gray-500">ID: {row.id}</div>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      title: "Type",
      sortable: true,
      filterable: true,
      render: (value) => {
        const typeColors = {
          Checking: "bg-blue-100 text-blue-800",
          Savings: "bg-green-100 text-green-800",
          Credit: "bg-yellow-100 text-yellow-800",
        };
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[value as keyof typeof typeColors] || "bg-gray-100 text-gray-800"}`}
          >
            {value}
          </span>
        );
      },
    },
    {
      key: "balance",
      title: "Balance",
      sortable: true,
      render: (value) => (
        <div className="font-semibold text-primary">{value}</div>
      ),
    },
    {
      key: "lastUpdated",
      title: "Last Updated",
      sortable: true,
      filterable: true,
      render: (value) => <div className="text-sm text-gray-600">{value}</div>,
    },
    {
      key: "status",
      title: "Status",
      sortable: true,
      filterable: true,
      render: (value) => {
        const statusColors = {
          Active: "bg-green-100 text-green-800",
          Inactive: "bg-red-100 text-red-800",
          Frozen: "bg-yellow-100 text-yellow-800",
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
  ];

  const handleAddAccount = () => {
    setShowAddModal(true);
  };

  const handleEditAccount = (account: any) => {
    setEditingAccount(account);
  };

  const handleDeleteAccount = (accountId: number) => {
    if (confirm("Are you sure you want to delete this account?")) {
      setAccounts(accounts.filter((acc) => acc.id !== accountId));
    }
  };

  const handleSaveAccount = (accountData: any) => {
    if (editingAccount) {
      setAccounts(
        accounts.map((acc) =>
          acc.id === editingAccount.id ? { ...acc, ...accountData } : acc,
        ),
      );
      setEditingAccount(null);
    } else {
      const newAccount = {
        id: Math.max(...accounts.map((a) => a.id)) + 1,
        ...accountData,
        lastUpdated: new Date().toISOString().split("T")[0],
        status: "Active",
      };
      setAccounts([...accounts, newAccount]);
      setShowAddModal(false);
    }
  };

  const filteredAccounts = accounts.filter((account) => {
    if (filters.type !== "all" && account.type !== filters.type) return false;
    if (filters.balanceRange !== "all") {
      const balance = parseFloat(account.balance.replace(/[$,]/g, ""));
      if (filters.balanceRange === "low" && balance > 50000) return false;
      if (
        filters.balanceRange === "medium" &&
        (balance < 50000 || balance > 100000)
      )
        return false;
      if (filters.balanceRange === "high" && balance < 100000) return false;
    }
    return true;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Accounts</h1>
          <p className="text-gray-600">
            Manage your business accounts and track balances
          </p>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Account Management</CardTitle>
              <EnterpriseButton
                variant="primary"
                icon={<Plus className="h-4 w-4" />}
                onClick={handleAddAccount}
              >
                Add Account
              </EnterpriseButton>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) =>
                    setFilters({ ...filters, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="all">All Types</option>
                  <option value="Checking">Checking</option>
                  <option value="Savings">Savings</option>
                  <option value="Credit">Credit</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Balance Range
                </label>
                <select
                  value={filters.balanceRange}
                  onChange={(e) =>
                    setFilters({ ...filters, balanceRange: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="all">All Balances</option>
                  <option value="low">Below $50,000</option>
                  <option value="medium">$50,000 - $100,000</option>
                  <option value="high">Above $100,000</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accounts Table */}
        <Card>
          <CardContent className="p-0">
            <EnterpriseDataTable
              data={filteredAccounts}
              columns={accountColumns}
              searchable={true}
              exportable={true}
              pagination={true}
              onRowClick={(row) => handleEditAccount(row)}
              emptyMessage="No accounts found matching your criteria"
            />
          </CardContent>
        </Card>

        {/* Add/Edit Account Modal */}
        {(showAddModal || editingAccount) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>
                  {editingAccount ? "Edit Account" : "Add New Account"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Name
                    </label>
                    <EnterpriseInput
                      placeholder="Enter account name"
                      defaultValue={editingAccount?.name || ""}
                      floatingLabel={false}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Type
                    </label>
                    <select
                      defaultValue={editingAccount?.type || "Checking"}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                    >
                      <option value="Checking">Checking</option>
                      <option value="Savings">Savings</option>
                      <option value="Credit">Credit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Initial Balance
                    </label>
                    <EnterpriseInput
                      type="number"
                      placeholder="0.00"
                      defaultValue={
                        editingAccount?.balance?.replace(/[$,]/g, "") || ""
                      }
                      floatingLabel={false}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <EnterpriseButton
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingAccount(null);
                    }}
                  >
                    Cancel
                  </EnterpriseButton>
                  <EnterpriseButton
                    variant="primary"
                    className="flex-1"
                    onClick={() =>
                      handleSaveAccount({
                        name: "New Account", // This would come from form inputs
                        type: "Checking",
                        balance: "$0.00",
                      })
                    }
                  >
                    {editingAccount ? "Update" : "Create"}
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
