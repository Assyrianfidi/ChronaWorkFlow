import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  RefreshCw,
  Calendar,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EnterpriseLayout } from "@/components/layout/EnterpriseLayout";
import {
  ChartOfAccounts,
  JournalEntryForm,
  FinancialReports,
} from "@/components/accounting";

// ========================================
// TYPE DEFINITIONS
// ========================================
interface Account {
  id: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  category: string;
  balance: number;
  currency: string;
  status: "active" | "inactive" | "frozen";
  lastActivity: string;
  hasChildren: boolean;
  level: number;
}

interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  status: "draft" | "posted" | "reversed";
  postedBy?: string;
  postedAt?: string;
}

// ========================================
// MOCK DATA
// ========================================
const ACCOUNTS: Account[] = [
  { id: "1", code: "1000", name: "Assets", type: "asset", category: "Balance Sheet", balance: 0, currency: "USD", status: "active", lastActivity: "System", hasChildren: true, level: 0 },
  { id: "2", code: "1100", name: "Current Assets", type: "asset", category: "Balance Sheet", balance: 0, currency: "USD", status: "active", lastActivity: "System", hasChildren: true, level: 1 },
  { id: "3", code: "1101", name: "Cash and Cash Equivalents", type: "asset", category: "Balance Sheet", balance: 1250000.00, currency: "USD", status: "active", lastActivity: "2 min ago", hasChildren: true, level: 2 },
  { id: "4", code: "1101-01", name: "Operating Account - Chase", type: "asset", category: "Bank", balance: 450000.00, currency: "USD", status: "active", lastActivity: "2 min ago", hasChildren: false, level: 3 },
  { id: "5", code: "1101-02", name: "Savings Account - Chase", type: "asset", category: "Bank", balance: 800000.00, currency: "USD", status: "active", lastActivity: "1 hr ago", hasChildren: false, level: 3 },
  { id: "6", code: "1102", name: "Accounts Receivable", type: "asset", category: "Receivables", balance: 892450.00, currency: "USD", status: "active", lastActivity: "5 min ago", hasChildren: false, level: 2 },
  { id: "7", code: "1103", name: "Inventory", type: "asset", category: "Inventory", balance: 234567.00, currency: "USD", status: "active", lastActivity: "1 day ago", hasChildren: false, level: 2 },
  { id: "8", code: "1104", name: "Prepaid Expenses", type: "asset", category: "Prepaid", balance: 45000.00, currency: "USD", status: "active", lastActivity: "3 days ago", hasChildren: false, level: 2 },
  { id: "9", code: "1200", name: "Fixed Assets", type: "asset", category: "Balance Sheet", balance: 0, currency: "USD", status: "active", lastActivity: "System", hasChildren: true, level: 1 },
  { id: "10", code: "1201", name: "Equipment", type: "asset", category: "Fixed Assets", balance: 125000.00, currency: "USD", status: "active", lastActivity: "1 week ago", hasChildren: false, level: 2 },
  { id: "11", code: "1202", name: "Furniture & Fixtures", type: "asset", category: "Fixed Assets", balance: 45000.00, currency: "USD", status: "active", lastActivity: "2 weeks ago", hasChildren: false, level: 2 },
  { id: "12", code: "2000", name: "Liabilities", type: "liability", category: "Balance Sheet", balance: 0, currency: "USD", status: "active", lastActivity: "System", hasChildren: true, level: 0 },
  { id: "13", code: "2100", name: "Current Liabilities", type: "liability", category: "Balance Sheet", balance: 0, currency: "USD", status: "active", lastActivity: "System", hasChildren: true, level: 1 },
  { id: "14", code: "2101", name: "Accounts Payable", type: "liability", category: "Payables", balance: 634200.00, currency: "USD", status: "active", lastActivity: "1 hr ago", hasChildren: false, level: 2 },
  { id: "15", code: "2102", name: "Accrued Expenses", type: "liability", category: "Accruals", balance: 125000.00, currency: "USD", status: "active", lastActivity: "2 days ago", hasChildren: false, level: 2 },
  { id: "16", code: "2103", name: "Payroll Liabilities", type: "liability", category: "Payroll", balance: 87500.00, currency: "USD", status: "active", lastActivity: "5 days ago", hasChildren: false, level: 2 },
];

const RECENT_JOURNAL_ENTRIES: JournalEntry[] = [
  { id: "JE-2024-001", date: "2024-01-15", reference: "JE-2024-001", description: "Monthly depreciation - Equipment", debit: 2083.33, credit: 2083.33, status: "posted", postedBy: "John Smith", postedAt: "2024-01-15 09:30:00" },
  { id: "JE-2024-002", date: "2024-01-15", reference: "JE-2024-002", description: "Accrued salary expenses", debit: 45000.00, credit: 45000.00, status: "posted", postedBy: "Jane Doe", postedAt: "2024-01-15 14:20:00" },
  { id: "JE-2024-003", date: "2024-01-16", reference: "JE-2024-003", description: "Prepaid insurance amortization", debit: 3750.00, credit: 3750.00, status: "draft" },
  { id: "JE-2024-004", date: "2024-01-16", reference: "JE-2024-004", description: "Bad debt provision", debit: 5000.00, credit: 5000.00, status: "posted", postedBy: "John Smith", postedAt: "2024-01-16 11:15:00" },
  { id: "JE-2024-005", date: "2024-01-17", reference: "JE-2024-005", description: "Inventory adjustment", debit: 2340.00, credit: 2340.00, status: "posted", postedBy: "Jane Doe", postedAt: "2024-01-17 16:45:00" },
];

// ========================================
// HELPER FUNCTIONS
// ========================================
const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-slate-100 text-slate-700",
    frozen: "bg-amber-100 text-amber-700",
    posted: "bg-emerald-100 text-emerald-700",
    draft: "bg-amber-100 text-amber-700",
    reversed: "bg-red-100 text-red-700",
  };
  return (
    <span className={cn("px-2 py-0.5 text-xs font-medium rounded-full", variants[status] || "bg-slate-100")}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const getAccountTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    asset: "text-blue-600",
    liability: "text-red-600",
    equity: "text-purple-600",
    revenue: "text-emerald-600",
    expense: "text-orange-600",
  };
  return colors[type] || "text-slate-600";
};

// ========================================
// MAIN PAGE COMPONENT
// ========================================
const LedgerPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"accounts" | "journal" | "trial-balance" | "closing">("accounts");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const filteredAccounts = ACCOUNTS.filter((account) => {
    const matchesSearch = account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         account.code.includes(searchQuery);
    const matchesType = selectedType === "all" || account.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <EnterpriseLayout>
      <div className="h-full flex flex-col bg-background">
        {/* Page Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">General Ledger</h1>
              <p className="text-sm text-muted-foreground">Chart of accounts and journal entries</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Period: Jan 2024
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Entry
            </Button>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex items-center gap-1 px-6 py-2 border-b bg-muted/50">
          {[
            { id: "accounts", label: "Chart of Accounts", icon: BookOpen },
            { id: "journal", label: "Journal Entries", icon: RefreshCw },
            { id: "trial-balance", label: "Trial Balance", icon: CheckCircle2 },
            { id: "closing", label: "Period Closing", icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-4 px-6 py-3 border-b bg-card">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search accounts by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Types</option>
            <option value="asset">Assets</option>
            <option value="liability">Liabilities</option>
            <option value="equity">Equity</option>
            <option value="revenue">Revenue</option>
            <option value="expense">Expenses</option>
          </select>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === "accounts" && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <p className="text-sm text-muted-foreground">Total Accounts</p>
                  <p className="text-2xl font-bold">{ACCOUNTS.length}</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <p className="text-sm text-muted-foreground">Active Accounts</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {ACCOUNTS.filter((a) => a.status === "active").length}
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <p className="text-sm text-muted-foreground">Total Assets</p>
                  <p className="text-2xl font-bold">{formatCurrency(2452517)}</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <p className="text-sm text-muted-foreground">Total Liabilities</p>
                  <p className="text-2xl font-bold">{formatCurrency(846700)}</p>
                </div>
              </div>

              {/* Accounts Table */}
              <div className="rounded-lg border bg-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Code</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Account Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Type</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Balance</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Last Activity</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredAccounts.map((account) => (
                      <tr
                        key={account.id}
                        className={cn(
                          "hover:bg-muted/30 transition-colors",
                          account.level > 0 && "bg-muted/20"
                        )}
                        style={{ paddingLeft: `${account.level * 20}px` }}
                      >
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          <span style={{ marginLeft: `${account.level * 20}px` }}>
                            {account.code}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          <span style={{ marginLeft: `${account.level * 20}px` }}>
                            {account.hasChildren && "▼ "}
                            {account.name}
                          </span>
                        </td>
                        <td className={cn("px-4 py-3 capitalize", getAccountTypeColor(account.type))}>
                          {account.type}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {account.balance !== 0 ? formatCurrency(account.balance) : "—"}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(account.status)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{account.lastActivity}</td>
                        <td className="px-4 py-3 text-right">
                          <button className="p-1 hover:bg-muted rounded">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "journal" && (
            <div className="h-full">
              <JournalEntryForm />
            </div>
          )}

          {activeTab === "trial-balance" && (
            <div className="h-full overflow-auto">
              <FinancialReports />
            </div>
          )}

          {activeTab === "closing" && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">Period Closing</p>
                <p className="text-sm text-muted-foreground">Feature coming soon</p>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-3 border-t bg-card">
          <p className="text-sm text-muted-foreground">
            Showing {filteredAccounts.length} of {ACCOUNTS.length} accounts
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </EnterpriseLayout>
  );
};

export default LedgerPage;
