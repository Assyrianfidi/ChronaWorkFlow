import React, { useState, useMemo, useCallback } from "react";
import {
  EnterpriseButton,
  EnterpriseDataTable,
  EnterpriseKPICard,
} from '../components/ui.js.js';
import {
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
// @ts-ignore
import { useAccounts } from '../hooks/use-api.js.js';
// @ts-ignore
import { cn } from '../lib/utils.js.js';
// @ts-ignore
import { DashboardShell } from '../components/ui/layout/DashboardShell.js.js';
// @ts-ignore
import type { Account, AccountType } from '../types/accounts.js.js';

// Mock data for demonstration
const mockAccounts: Account[] = [
  {
    id: "1",
    code: "1000",
    name: "Cash and Cash Equivalents",
    type: "asset",
    balance: "125000",
    description: "Physical cash and bank accounts",
    parentId: undefined,
    companyId: "default-company-id",
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-15",
  },
  {
    id: "2",
    code: "1100",
    name: "Accounts Receivable",
    type: "asset",
    balance: "45000",
    description: "Money owed by customers",
    parentId: undefined,
    companyId: "default-company-id",
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-15",
  },
  {
    id: "3",
    code: "2000",
    name: "Accounts Payable",
    type: "liability",
    balance: "-32000",
    description: "Money owed to suppliers",
    parentId: undefined,
    companyId: "default-company-id",
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-15",
  },
  {
    id: "4",
    code: "4000",
    name: "Revenue",
    type: "revenue",
    balance: "285000",
    description: "Sales and service revenue",
    parentId: undefined,
    companyId: "default-company-id",
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-15",
  },
  {
    id: "5",
    code: "5000",
    name: "Operating Expenses",
    type: "expense",
    balance: "-185000",
    description: "Day-to-day business expenses",
    parentId: undefined,
    companyId: "default-company-id",
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-15",
  },
];

export default function Accounts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<Account[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const { data: accounts = mockAccounts, isLoading } =
    useAccounts("default-company-id");

  // Calculate summary statistics
  const totalAssets = accounts
    .filter((acc) => acc.type === "asset")
    .reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
  const totalLiabilities = Math.abs(
    accounts
      .filter((acc) => acc.type === "liability")
      .reduce((sum, acc) => sum + parseFloat(acc.balance), 0),
  );
  const totalRevenue = accounts
    .filter((acc) => acc.type === "revenue")
    .reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
  const totalExpenses = Math.abs(
    accounts
      .filter((acc) => acc.type === "expense")
      .reduce((sum, acc) => sum + parseFloat(acc.balance), 0),
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get account type color
  const getAccountTypeColor = (type: AccountType) => {
    switch (type) {
      case "asset":
        return "bg-blue-100 text-blue-800";
      case "liability":
        return "bg-red-100 text-red-800";
      case "equity":
        return "bg-green-100 text-green-800";
      case "revenue":
        return "bg-emerald-100 text-emerald-800";
      case "expense":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Table columns
  const columns = [
    {
      key: "name",
      label: "Account Name",
      sortable: true,
      filterable: true,
      render: (value: string, row: Account) => (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              row.type === "asset"
                ? "bg-blue-100 text-blue-600"
                : row.type === "liability"
                  ? "bg-red-100 text-red-600"
                  : row.type === "equity"
                    ? "bg-green-100 text-green-600"
                    : row.type === "revenue"
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-orange-100 text-orange-600",
            )}
          >
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{row.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      filterable: true,
      render: (value: AccountType) => (
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            getAccountTypeColor(value),
          )}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: "balance",
      label: "Balance",
      sortable: true,
      align: "right" as const,
      render: (value: number) => (
        <div className="text-right">
          <p
            className={cn(
              "font-medium",
              value >= 0 ? "text-green-600" : "text-red-600",
            )}
          >
            {formatCurrency(Math.abs(value))}
          </p>
          {value < 0 && <p className="text-xs text-gray-500">Credit</p>}
        </div>
      ),
    },
    {
      key: "currency",
      label: "Currency",
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <span className="inline-flex items-center gap-1">
          <DollarSign className="w-4 h-4" />
          {value}
        </span>
      ),
    },
    {
      key: "updatedAt",
      label: "Last Updated",
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-600">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
  ];

  // Table actions
  const actions = [
    {
      label: "View",
      icon: <Eye className="w-4 h-4" />,
      onClick: (account: Account) => console.log("View account:", account),
      variant: "ghost" as const,
    },
    {
      label: "Edit",
      icon: <Edit className="w-4 h-4" />,
      onClick: (account: Account) => console.log("Edit account:", account),
      variant: "ghost" as const,
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (account: Account) => console.log("Delete account:", account),
      variant: "danger" as const,
    },
  ];

  // Bulk actions
  const bulkActions = [
    {
      label: "Export Selected",
      icon: <Download className="w-4 h-4" />,
      onClick: (selectedAccounts: Account[]) =>
        console.log("Export accounts:", selectedAccounts),
      variant: "secondary" as const,
    },
    {
      label: "Delete Selected",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (selectedAccounts: Account[]) =>
        console.log("Delete accounts:", selectedAccounts),
      variant: "danger" as const,
    },
  ];

  return (
    <DashboardShell>
      <div className="container mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
            <p className="text-gray-600">
              Manage your chart of accounts and financial accounts
            </p>
          </div>
          <div className="flex items-center gap-3">
            <EnterpriseButton
              variant="ghost"
              icon={<Download className="w-4 h-4" />}
            >
              Export All
            </EnterpriseButton>
            <EnterpriseButton
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
            >
              New Account
            </EnterpriseButton>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <EnterpriseKPICard
            title="Total Assets"
            value={formatCurrency(totalAssets)}
            change={8.5}
            changeType="increase"
            icon={<TrendingUp className="w-5 h-5" />}
            color="primary"
          />
          <EnterpriseKPICard
            title="Total Liabilities"
            value={formatCurrency(totalLiabilities)}
            change={-3.2}
            changeType="decrease"
            icon={<TrendingDown className="w-5 h-5" />}
            color="danger"
          />
          <EnterpriseKPICard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            change={12.7}
            changeType="increase"
            icon={<ArrowUpRight className="w-5 h-5" />}
            color="success"
          />
          <EnterpriseKPICard
            title="Total Expenses"
            value={formatCurrency(totalExpenses)}
            change={5.1}
            changeType="increase"
            icon={<ArrowDownRight className="w-5 h-5" />}
            color="warning"
          />
        </div>

        {/* Accounts Table */}
        <EnterpriseDataTable
          data={accounts}
          columns={columns}
          loading={isLoading}
          searchable={true}
          filterable={true}
          sortable={true}
          selectable={true}
          paginated={true}
          pageSize={25}
          actions={actions}
          bulkActions={bulkActions}
          exportOptions={{ csv: true, pdf: true, excel: true }}
          onSelectionChange={setSelectedAccounts}
          onSearch={setSearchQuery}
          className="shadow-soft bg-surface1 rounded-xl"
          emptyState={
            <div className="text-center py-12 bg-surface1 rounded-xl border border-border-gray">
              <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-default mb-2">
                No accounts found
              </h3>
              <p className="text-muted mb-4">
                Get started by creating your first account
              </p>
              <EnterpriseButton
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
              >
                Create Account
              </EnterpriseButton>
            </div>
          }
        />
      </div>
    </DashboardShell>
  );
}
