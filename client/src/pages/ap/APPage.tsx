import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Building2,
  FileText,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  Calendar,
  Send,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EnterpriseLayout } from "@/components/layout/EnterpriseLayout";

// ========================================
// TYPE DEFINITIONS
// ========================================
interface Bill {
  id: string;
  vendor: string;
  vendorId: string;
  billNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  balance: number;
  status: "draft" | "open" | "partial" | "paid" | "overdue";
  category: string;
  description: string;
  daysOverdue?: number;
}

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  balance: number;
  status: "active" | "inactive";
  lastPayment?: string;
}

// ========================================
// MOCK DATA
// ========================================
const VENDORS: Vendor[] = [
  {
    id: "v1",
    name: "Microsoft Corporation",
    email: "billing@microsoft.com",
    phone: "(800) 642-7676",
    balance: 12500.0,
    status: "active",
    lastPayment: "2024-01-10",
  },
  {
    id: "v2",
    name: "Amazon Web Services",
    email: "aws-billing@amazon.com",
    phone: "(206) 266-1000",
    balance: 8750.0,
    status: "active",
    lastPayment: "2024-01-12",
  },
  {
    id: "v3",
    name: "Salesforce Inc",
    email: "invoices@salesforce.com",
    phone: "(415) 901-7000",
    balance: 4500.0,
    status: "active",
    lastPayment: "2024-01-08",
  },
  {
    id: "v4",
    name: "Slack Technologies",
    email: "billing@slack.com",
    phone: "(415) 436-9333",
    balance: 1200.0,
    status: "active",
    lastPayment: "2024-01-05",
  },
  {
    id: "v5",
    name: "Stripe Inc",
    email: "support@stripe.com",
    phone: "(888) 963-8442",
    balance: 2300.0,
    status: "active",
  },
];

const BILLS: Bill[] = [
  {
    id: "b1",
    vendor: "Microsoft Corporation",
    vendorId: "v1",
    billNumber: "MSFT-2024-001",
    date: "2024-01-01",
    dueDate: "2024-01-31",
    amount: 15000.0,
    balance: 12500.0,
    status: "partial",
    category: "Software",
    description: "Office 365 Enterprise licenses",
  },
  {
    id: "b2",
    vendor: "Amazon Web Services",
    vendorId: "v2",
    billNumber: "AWS-789456123",
    date: "2024-01-05",
    dueDate: "2024-02-05",
    amount: 8750.0,
    balance: 8750.0,
    status: "open",
    category: "Hosting",
    description: "December 2023 cloud services",
  },
  {
    id: "b3",
    vendor: "Salesforce Inc",
    vendorId: "v3",
    billNumber: "SF-2024-Q1",
    date: "2023-12-15",
    dueDate: "2024-01-15",
    amount: 4500.0,
    balance: 4500.0,
    status: "overdue",
    category: "CRM",
    description: "Q1 2024 CRM subscription",
    daysOverdue: 15,
  },
  {
    id: "b4",
    vendor: "Slack Technologies",
    vendorId: "v4",
    billNumber: "SLACK-2024-01",
    date: "2024-01-01",
    dueDate: "2024-02-01",
    amount: 1200.0,
    balance: 1200.0,
    status: "open",
    category: "Communication",
    description: "Pro plan - 50 users",
  },
  {
    id: "b5",
    vendor: "Stripe Inc",
    vendorId: "v5",
    billNumber: "STRIPE-2024-001",
    date: "2023-12-01",
    dueDate: "2023-12-31",
    amount: 2300.0,
    balance: 0.0,
    status: "paid",
    category: "Payment Processing",
    description: "Transaction fees - Dec 2023",
  },
];

// ========================================
// HELPER FUNCTIONS
// ========================================
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    open: "bg-blue-100 text-blue-700",
    partial: "bg-amber-100 text-amber-700",
    paid: "bg-emerald-100 text-emerald-700",
    overdue: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={cn(
        "px-2 py-0.5 text-xs font-medium rounded-full",
        variants[status] || "bg-slate-100",
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// ========================================
// MAIN PAGE COMPONENT
// ========================================
const APPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "bills" | "vendors" | "payments" | "aging"
  >("bills");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredBills = BILLS.filter((bill) => {
    const matchesSearch =
      bill.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || bill.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOutstanding = BILLS.filter((b) => b.status !== "paid").reduce(
    (sum, b) => sum + b.balance,
    0,
  );
  const overdueAmount = BILLS.filter((b) => b.status === "overdue").reduce(
    (sum, b) => sum + b.balance,
    0,
  );

  return (
    <EnterpriseLayout>
      <div className="h-full flex flex-col bg-background">
        {/* Page Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Accounts Payable</h1>
              <p className="text-sm text-muted-foreground">
                Manage vendors, bills, and payments
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Period: Jan 2024
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Bill
            </Button>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex items-center gap-1 px-6 py-2 border-b bg-muted/50">
          {[
            { id: "bills", label: "Bills", icon: FileText },
            { id: "vendors", label: "Vendors", icon: Building2 },
            { id: "payments", label: "Payments", icon: DollarSign },
            { id: "aging", label: "Aging Report", icon: Clock },
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
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
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
              placeholder={
                activeTab === "vendors"
                  ? "Search vendors..."
                  : "Search bills by number or vendor..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {activeTab === "bills" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          )}
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
          {activeTab === "bills" && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <p className="text-sm text-muted-foreground">
                    Total Outstanding
                  </p>
                  <p className="text-2xl font-bold text-amber-600">
                    {formatCurrency(totalOutstanding)}
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(overdueAmount)}
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <p className="text-sm text-muted-foreground">Due This Week</p>
                  <p className="text-2xl font-bold">{formatCurrency(20125)}</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <p className="text-sm text-muted-foreground">
                    Active Vendors
                  </p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {VENDORS.length}
                  </p>
                </div>
              </div>

              {/* Bills Table */}
              <div className="rounded-lg border bg-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                        Bill #
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                        Vendor
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                        Due Date
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                        Balance
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                        Description
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredBills.map((bill) => (
                      <tr
                        key={bill.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          {bill.billNumber}
                        </td>
                        <td className="px-4 py-3 font-medium">{bill.vendor}</td>
                        <td className="px-4 py-3">{formatDate(bill.date)}</td>
                        <td
                          className={cn(
                            "px-4 py-3",
                            bill.status === "overdue" &&
                              "text-red-600 font-medium",
                          )}
                        >
                          {formatDate(bill.dueDate)}
                          {bill.daysOverdue && (
                            <span className="ml-2 text-xs text-red-600">
                              ({bill.daysOverdue} days overdue)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {formatCurrency(bill.amount)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {formatCurrency(bill.balance)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getStatusBadge(bill.status)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                          {bill.description}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {bill.status !== "paid" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <DollarSign className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "vendors" && (
            <div className="rounded-lg border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Vendor Name
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                      Balance
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Last Payment
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {VENDORS.map((vendor) => (
                    <tr
                      key={vendor.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">{vendor.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {vendor.email}
                      </td>
                      <td className="px-4 py-3">{vendor.phone}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {formatCurrency(vendor.balance)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "px-2 py-0.5 text-xs font-medium rounded-full",
                            vendor.status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-700",
                          )}
                        >
                          {vendor.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {vendor.lastPayment
                          ? formatDate(vendor.lastPayment)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(activeTab === "payments" || activeTab === "aging") && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">
                  {activeTab === "payments"
                    ? "Payment History"
                    : "Aging Report"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Feature coming soon
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-3 border-t bg-card">
          <p className="text-sm text-muted-foreground">
            Showing {filteredBills.length} of {BILLS.length} bills
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

export default APPage;
