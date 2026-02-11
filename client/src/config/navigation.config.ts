/**
 * QuickBooks-Class Navigation Configuration
 * Enterprise Accounting SaaS Navigation Tree
 *
 * Supports: Small Business, Accountants, Bookkeepers, Payroll Managers, CFOs
 * Modes: Online Mode (modern sidebar) | Desktop Mode (classic menu)
 */

import {
  LayoutDashboard,
  Landmark,
  FileText,
  Receipt,
  Calculator,
  BarChart3,
  Percent,
  Briefcase,
  Users,
  Clock,
  Car,
  Wallet,
  Puzzle,
  Settings,
  HelpCircle,
  Search,
  Plus,
  Bell,
  User,
  ChevronRight,
  Building2,
  ArrowLeftRight,
  CreditCard,
  FileCheck,
  Package,
  TrendingUp,
  Shield,
  Archive,
  Banknote,
  FileSpreadsheet,
  Printer,
  MapPin,
  BookOpen,
  History,
  LogOut,
  Sparkles,
  Zap,
  Target,
  PieChart,
  DollarSign,
  Wallet2,
  ShoppingCart,
  Truck,
  Award,
  Scale,
  Star,
  Lock,
  List,
  Wrench,
  Trash2,
} from "lucide-react";
import React from "react";

// ============================================================================
// USER ROLES & PERMISSIONS
// ============================================================================

export type UserRole =
  | "OWNER" // Full access, billing, all settings
  | "ADMIN" // Most features except billing ownership
  | "ACCOUNTANT" // Accounting, reports, reconciliation, journal entries
  | "BOOKKEEPER" // Day-to-day transactions, AP/AR
  | "AP_CLERK" // Bills, vendors, payments
  | "AR_CLERK" // Invoices, customers, collections
  | "PAYROLL_MANAGER" // Payroll, employees, tax forms
  | "PROJECT_MANAGER" // Projects, time tracking
  | "VIEWER" // Read-only access to reports
  | "EMPLOYEE"; // Time entry, expense claims only

export type SubscriptionTier =
  | "FREE"
  | "SIMPLE_START"
  | "ESSENTIALS"
  | "PLUS"
  | "ADVANCED"
  | "ENTERPRISE";

export type FeatureFlag =
  | "PAYROLL"
  | "TIME_TRACKING"
  | "PROJECTS"
  | "INVENTORY"
  | "MULTI_CURRENCY"
  | "ADVANCED_REPORTING"
  | "BUDGETING"
  | "CLASSES_LOCATIONS"
  | "1099_FILING"
  | "BILL_PAY"
  | "CAPITAL"
  | "ACCOUNTANT_TOOLS"
  | "API_ACCESS";

// ============================================================================
// NAVIGATION ITEM TYPES
// ============================================================================

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
  description?: string;
  shortcut?: string;
  roles?: UserRole[];
  subscription?: SubscriptionTier[];
  featureFlag?: FeatureFlag;
  badge?: number | string;
  isNew?: boolean;
  isBeta?: boolean;
  children?: NavChild[];
  divider?: boolean;
  external?: boolean;
}

export interface NavChild {
  id?: string;
  label?: string;
  path?: string;
  icon?: React.ElementType;
  description?: string;
  shortcut?: string;
  roles?: UserRole[];
  subscription?: SubscriptionTier[];
  featureFlag?: FeatureFlag;
  badge?: number | string;
  divider?: boolean;
  isNew?: boolean;
  children?: NavGrandchild[];
}

export interface NavGrandchild {
  id: string;
  label: string;
  path: string;
  shortcut?: string;
  roles?: UserRole[];
}

// ============================================================================
// QUICK CREATE MENU ITEMS (+ New Button)
// ============================================================================

export const QUICK_CREATE_MENU: NavItem[] = [
  {
    id: "customers-section",
    label: "CUSTOMERS",
    path: "#",
    icon: FileText,
    divider: true,
    children: [
      {
        id: "invoice",
        label: "Invoice",
        path: "/invoices/new",
        icon: FileText,
        shortcut: "⌘I",
      },
      {
        id: "receive-payment",
        label: "Receive Payment",
        path: "/payments/new",
        icon: DollarSign,
      },
      {
        id: "estimate",
        label: "Estimate / Quote",
        path: "/quotes/new",
        icon: FileCheck,
      },
      {
        id: "sales-receipt",
        label: "Sales Receipt",
        path: "/sales-receipts/new",
        icon: Receipt,
      },
      {
        id: "refund-receipt",
        label: "Refund Receipt",
        path: "/refunds/new",
        icon: Receipt,
      },
      {
        id: "credit-memo",
        label: "Credit Memo",
        path: "/credit-memos/new",
        icon: FileText,
      },
      {
        id: "delayed-charge",
        label: "Delayed Charge",
        path: "/delayed-charges/new",
        icon: Clock,
      },
      {
        id: "delayed-credit",
        label: "Delayed Credit",
        path: "/delayed-credits/new",
        icon: Clock,
      },
      {
        id: "add-customer",
        label: "Add Customer",
        path: "/customers/new",
        icon: Users,
        shortcut: "⌘⇧C",
      },
    ],
  },
  {
    id: "vendors-section",
    label: "VENDORS",
    path: "#",
    icon: Building2,
    divider: true,
    children: [
      {
        id: "expense",
        label: "Expense",
        path: "/expenses/new",
        icon: Wallet,
        shortcut: "⌘E",
      },
      {
        id: "check",
        label: "Check",
        path: "/checks/new",
        icon: Banknote,
        shortcut: "⌘⇧C",
      },
      {
        id: "bill",
        label: "Bill",
        path: "/bills/new",
        icon: Receipt,
        shortcut: "⌘B",
      },
      {
        id: "pay-bills",
        label: "Pay Bills",
        path: "/pay-bills",
        icon: DollarSign,
      },
      {
        id: "purchase-order",
        label: "Purchase Order",
        path: "/purchase-orders/new",
        icon: FileCheck,
      },
      {
        id: "vendor-credit",
        label: "Vendor Credit",
        path: "/vendor-credits/new",
        icon: CreditCard,
      },
      {
        id: "credit-card-credit",
        label: "Credit Card Credit",
        path: "/cc-credits/new",
        icon: CreditCard,
      },
      {
        id: "add-vendor",
        label: "Add Vendor",
        path: "/vendors/new",
        icon: Building2,
        shortcut: "⌘⇧V",
      },
    ],
  },
  {
    id: "other-section",
    label: "OTHER",
    path: "#",
    icon: Plus,
    divider: true,
    children: [
      {
        id: "bank-deposit",
        label: "Bank Deposit",
        path: "/deposits/new",
        icon: Landmark,
      },
      {
        id: "transfer",
        label: "Transfer",
        path: "/transfers/new",
        icon: ArrowLeftRight,
      },
      {
        id: "journal-entry",
        label: "Journal Entry",
        path: "/journal-entries/new",
        icon: BookOpen,
        shortcut: "⌘J",
      },
      {
        id: "statement",
        label: "Statement",
        path: "/statements/new",
        icon: FileSpreadsheet,
      },
      {
        id: "inventory-adjustment",
        label: "Inventory Qty Adjustment",
        path: "/inventory/adjust",
        icon: Package,
      },
      {
        id: "pay-cc",
        label: "Pay Down Credit Card",
        path: "/credit-cards/pay",
        icon: CreditCard,
      },
      {
        id: "pay-loan",
        label: "Pay Down Loan",
        path: "/loans/pay",
        icon: Landmark,
      },
      {
        id: "add-product",
        label: "Add Product / Service",
        path: "/products/new",
        icon: Package,
      },
      {
        id: "time-activity",
        label: "Add Time Activity",
        path: "/time-activities/new",
        icon: Clock,
      },
      {
        id: "add-mileage",
        label: "Add Mileage",
        path: "/mileage/new",
        icon: Car,
      },
    ],
  },
];

// ============================================================================
// MAIN NAVIGATION - ONLINE MODE (Left Sidebar)
// ============================================================================

export const MAIN_NAVIGATION: NavItem[] = [
  // 1) DASHBOARD
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    description: "Financial snapshot and business overview",
    shortcut: "⌘D",
    roles: ["OWNER", "ADMIN", "ACCOUNTANT", "BOOKKEEPER", "VIEWER"],
    children: [
      { id: "home", label: "Home", path: "/dashboard", icon: LayoutDashboard },
      {
        id: "cash-position",
        label: "Cash Position",
        path: "/dashboard/cash",
        icon: Wallet2,
      },
      {
        id: "income-expenses",
        label: "Income vs Expenses",
        path: "/dashboard/pnl",
        icon: TrendingUp,
      },
      {
        id: "ar-ap",
        label: "AR / AP Summary",
        path: "/dashboard/ar-ap",
        icon: ArrowLeftRight,
      },
      {
        id: "customize",
        label: "Customize Widgets",
        path: "/dashboard/customize",
        icon: Sparkles,
      },
    ],
  },

  // 2) BANKING
  {
    id: "banking",
    label: "Banking",
    path: "/banking",
    icon: Landmark,
    description: "Bank feeds, reconciliation, and receipts",
    shortcut: "⌘B",
    roles: ["OWNER", "ADMIN", "ACCOUNTANT", "BOOKKEEPER"],
    children: [
      {
        id: "banking-overview",
        label: "Banking Overview",
        path: "/banking",
        icon: LayoutDashboard,
      },
      {
        id: "connected-accounts",
        label: "Connected Accounts",
        path: "/banking/accounts",
        icon: Landmark,
      },
      {
        id: "transactions",
        label: "Bank Transactions",
        path: "/banking/transactions",
        icon: ArrowLeftRight,
      },
      {
        id: "reconciliation",
        label: "Reconciliation Center",
        path: "/banking/reconcile",
        icon: FileCheck,
      },
      {
        id: "receipts",
        label: "Receipts",
        path: "/banking/receipts",
        icon: Receipt,
      },
      {
        id: "rules",
        label: "Rules & Automation",
        path: "/banking/rules",
        icon: Zap,
      },
      {
        id: "check-register",
        label: "Check Register",
        path: "/banking/checks",
        icon: Banknote,
      },
      {
        id: "transfers",
        label: "Transfers",
        path: "/banking/transfers",
        icon: ArrowLeftRight,
      },
    ],
  },

  // 3) SALES / GET PAID
  {
    id: "sales",
    label: "Sales",
    path: "/sales",
    icon: FileText,
    description: "Invoices, estimates, customers, and payments",
    shortcut: "⌘S",
    roles: ["OWNER", "ADMIN", "ACCOUNTANT", "BOOKKEEPER", "AR_CLERK"],
    children: [
      {
        id: "sales-overview",
        label: "Sales Overview",
        path: "/sales",
        icon: LayoutDashboard,
      },
      {
        id: "all-sales",
        label: "All Sales",
        path: "/sales/all",
        icon: FileText,
      },
      {
        id: "invoices",
        label: "Invoices",
        path: "/invoices",
        icon: FileText,
        shortcut: "⌘I",
      },
      {
        id: "estimates",
        label: "Estimates / Quotes",
        path: "/quotes",
        icon: FileCheck,
      },
      {
        id: "credit-memos",
        label: "Credit Memos",
        path: "/credit-memos",
        icon: FileText,
      },
      {
        id: "sales-receipts",
        label: "Sales Receipts",
        path: "/sales-receipts",
        icon: Receipt,
      },
      {
        id: "recurring",
        label: "Recurring Transactions",
        path: "/recurring",
        icon: Clock,
      },
      {
        id: "payment-links",
        label: "Payment Links",
        path: "/payment-links",
        icon: DollarSign,
        isNew: true,
      },
      { id: "customers", label: "Customers", path: "/customers", icon: Users },
      {
        id: "products",
        label: "Products & Services",
        path: "/products",
        icon: Package,
      },
    ],
  },

  // 4) EXPENSES
  {
    id: "expenses",
    label: "Expenses",
    path: "/expenses",
    icon: Wallet,
    description: "Bills, expenses, vendors, and purchase orders",
    shortcut: "⌘E",
    roles: ["OWNER", "ADMIN", "ACCOUNTANT", "BOOKKEEPER", "AP_CLERK"],
    children: [
      {
        id: "expenses-overview",
        label: "Expenses Overview",
        path: "/expenses",
        icon: LayoutDashboard,
      },
      {
        id: "expenses-list",
        label: "Expenses",
        path: "/expenses/all",
        icon: Wallet,
      },
      { id: "bills", label: "Bills", path: "/bills", icon: Receipt },
      {
        id: "pay-bills-center",
        label: "Pay Bills",
        path: "/pay-bills",
        icon: DollarSign,
        featureFlag: "BILL_PAY",
      },
      { id: "vendors", label: "Vendors", path: "/vendors", icon: Building2 },
      {
        id: "purchase-orders",
        label: "Purchase Orders",
        path: "/purchase-orders",
        icon: FileCheck,
      },
      { id: "checks", label: "Checks", path: "/checks", icon: Banknote },
      {
        id: "vendor-credits",
        label: "Vendor Credits",
        path: "/vendor-credits",
        icon: CreditCard,
      },
      {
        id: "cc-credits",
        label: "Credit Card Credits",
        path: "/cc-credits",
        icon: CreditCard,
      },
      {
        id: "check-register-exp",
        label: "Check Register",
        path: "/checks/register",
        icon: Banknote,
      },
    ],
  },

  // 5) ACCOUNTING
  {
    id: "accounting",
    label: "Accounting",
    path: "/accounting",
    icon: Calculator,
    description: "Chart of accounts, journal entries, and closing",
    shortcut: "⌘A",
    roles: ["OWNER", "ADMIN", "ACCOUNTANT"],
    children: [
      {
        id: "chart-of-accounts",
        label: "Chart of Accounts",
        path: "/chart-of-accounts",
        icon: BookOpen,
      },
      {
        id: "reconcile",
        label: "Reconcile",
        path: "/reconcile",
        icon: FileCheck,
      },
      {
        id: "journal-entries",
        label: "Journal Entries",
        path: "/journal-entries",
        icon: BookOpen,
      },
      {
        id: "account-history",
        label: "Account History",
        path: "/account-history",
        icon: History,
      },
      {
        id: "budgeting",
        label: "Budgeting",
        path: "/budgeting",
        icon: Target,
        subscription: ["PLUS", "ADVANCED", "ENTERPRISE"],
      },
      {
        id: "close-books",
        label: "Close the Books",
        path: "/close-books",
        icon: Lock,
        roles: ["OWNER", "ADMIN", "ACCOUNTANT"],
      },
      {
        id: "audit-log",
        label: "Audit Log",
        path: "/audit-log",
        icon: Shield,
        roles: ["OWNER", "ADMIN", "ACCOUNTANT"],
      },
    ],
  },

  // 6) REPORTS
  {
    id: "reports",
    label: "Reports",
    path: "/reports",
    icon: BarChart3,
    description: "Financial and management reports",
    shortcut: "⌘R",
    roles: ["OWNER", "ADMIN", "ACCOUNTANT", "BOOKKEEPER", "VIEWER"],
    children: [
      {
        id: "reports-overview",
        label: "Reports Overview",
        path: "/reports",
        icon: LayoutDashboard,
      },
      {
        id: "pnl",
        label: "Profit & Loss",
        path: "/reports/pnl",
        icon: TrendingUp,
      },
      {
        id: "balance-sheet",
        label: "Balance Sheet",
        path: "/reports/balance-sheet",
        icon: Scale,
      },
      {
        id: "cash-flow",
        label: "Cash Flow",
        path: "/reports/cash-flow",
        icon: ArrowLeftRight,
      },
      {
        id: "ar-aging",
        label: "AR Aging",
        path: "/reports/ar-aging",
        icon: Clock,
      },
      {
        id: "ap-aging",
        label: "AP Aging",
        path: "/reports/ap-aging",
        icon: Clock,
      },
      {
        id: "custom-reports",
        label: "Custom Reports",
        path: "/reports/custom",
        icon: Sparkles,
      },
      {
        id: "management",
        label: "Management Reports",
        path: "/reports/management",
        icon: Briefcase,
      },
      {
        id: "favorites",
        label: "Favorites",
        path: "/reports/favorites",
        icon: Star,
      },
      {
        id: "recent",
        label: "Recent Reports",
        path: "/reports/recent",
        icon: History,
      },
    ],
  },

  // 7) TAXES
  {
    id: "taxes",
    label: "Taxes",
    path: "/taxes",
    icon: Percent,
    description: "Sales tax, 1099s, and income tax tools",
    shortcut: "⌘T",
    roles: ["OWNER", "ADMIN", "ACCOUNTANT"],
    children: [
      {
        id: "sales-tax-center",
        label: "Sales Tax Center",
        path: "/taxes/sales",
        icon: Percent,
      },
      {
        id: "sales-tax-liability",
        label: "Sales Tax Liability",
        path: "/taxes/sales/liability",
        icon: Calculator,
      },
      {
        id: "1099-center",
        label: "1099 Center",
        path: "/taxes/1099",
        icon: FileSpreadsheet,
        featureFlag: "1099_FILING",
      },
      {
        id: "1099-contractors",
        label: "Contractors",
        path: "/taxes/1099/contractors",
        icon: Users,
      },
      {
        id: "income-tax",
        label: "Income Tax Tools",
        path: "/taxes/income",
        icon: Calculator,
      },
      {
        id: "tax-settings",
        label: "Tax Settings",
        path: "/taxes/settings",
        icon: Settings,
      },
    ],
  },

  // 8) PROJECTS
  {
    id: "projects",
    label: "Projects",
    path: "/projects",
    icon: Briefcase,
    description: "Project tracking and profitability",
    shortcut: "⌘P",
    roles: ["OWNER", "ADMIN", "ACCOUNTANT", "BOOKKEEPER", "PROJECT_MANAGER"],
    featureFlag: "PROJECTS",
    subscription: ["PLUS", "ADVANCED", "ENTERPRISE"],
    children: [
      {
        id: "projects-overview",
        label: "Projects Overview",
        path: "/projects",
        icon: LayoutDashboard,
      },
      {
        id: "all-projects",
        label: "All Projects",
        path: "/projects/all",
        icon: Briefcase,
      },
      {
        id: "time-activities",
        label: "Time Activities",
        path: "/time-activities",
        icon: Clock,
      },
      {
        id: "timesheets",
        label: "Timesheets",
        path: "/timesheets",
        icon: FileText,
      },
      {
        id: "project-reports",
        label: "Project Reports",
        path: "/projects/reports",
        icon: BarChart3,
      },
    ],
  },

  // 9) PAYROLL
  {
    id: "payroll",
    label: "Payroll",
    path: "/payroll",
    icon: Users,
    description: "Employees, contractors, and payroll runs",
    shortcut: "⌘⇧P",
    roles: ["OWNER", "ADMIN", "PAYROLL_MANAGER"],
    featureFlag: "PAYROLL",
    subscription: ["ESSENTIALS", "PLUS", "ADVANCED", "ENTERPRISE"],
    children: [
      {
        id: "payroll-overview",
        label: "Payroll Overview",
        path: "/payroll",
        icon: LayoutDashboard,
      },
      { id: "employees", label: "Employees", path: "/employees", icon: Users },
      {
        id: "contractors",
        label: "Contractors",
        path: "/contractors",
        icon: Users,
      },
      {
        id: "run-payroll",
        label: "Run Payroll",
        path: "/payroll/run",
        icon: DollarSign,
        badge: "Now",
      },
      {
        id: "payroll-settings",
        label: "Payroll Settings",
        path: "/payroll/settings",
        icon: Settings,
      },
      {
        id: "payroll-taxes",
        label: "Payroll Taxes",
        path: "/payroll/taxes",
        icon: Percent,
      },
      {
        id: "filings",
        label: "Filings",
        path: "/payroll/filings",
        icon: FileCheck,
      },
      {
        id: "workers-comp",
        label: "Workers' Comp",
        path: "/payroll/workers-comp",
        icon: Shield,
      },
      {
        id: "benefits",
        label: "Benefits",
        path: "/payroll/benefits",
        icon: Award,
      },
    ],
  },

  // 10) TIME
  {
    id: "time",
    label: "Time",
    path: "/time",
    icon: Clock,
    description: "Time tracking and timesheets",
    shortcut: "⌘⇧T",
    roles: [
      "OWNER",
      "ADMIN",
      "ACCOUNTANT",
      "BOOKKEEPER",
      "PROJECT_MANAGER",
      "EMPLOYEE",
    ],
    featureFlag: "TIME_TRACKING",
    subscription: ["PLUS", "ADVANCED", "ENTERPRISE"],
    children: [
      {
        id: "time-overview",
        label: "Time Overview",
        path: "/time",
        icon: LayoutDashboard,
      },
      {
        id: "timesheets-list",
        label: "Timesheets",
        path: "/timesheets",
        icon: FileText,
      },
      {
        id: "time-activities-list",
        label: "Time Activities",
        path: "/time-activities",
        icon: Clock,
      },
      {
        id: "time-reports",
        label: "Time Reports",
        path: "/time/reports",
        icon: BarChart3,
      },
    ],
  },

  // 11) MILEAGE
  {
    id: "mileage",
    label: "Mileage",
    path: "/mileage",
    icon: Car,
    description: "Vehicle and trip tracking",
    shortcut: "⌘⇧M",
    roles: ["OWNER", "ADMIN", "BOOKKEEPER"],
    children: [
      { id: "trips", label: "Trips", path: "/mileage/trips", icon: MapPin },
      {
        id: "vehicles",
        label: "Vehicles",
        path: "/mileage/vehicles",
        icon: Car,
      },
      {
        id: "mileage-reports",
        label: "Mileage Reports",
        path: "/mileage/reports",
        icon: BarChart3,
      },
    ],
  },

  // 12) CAPITAL
  {
    id: "capital",
    label: "Capital",
    path: "/capital",
    icon: Wallet2,
    description: "Business loans and financing",
    shortcut: "",
    roles: ["OWNER", "ADMIN"],
    featureFlag: "CAPITAL",
    children: [
      {
        id: "capital-overview",
        label: "Capital Overview",
        path: "/capital",
        icon: LayoutDashboard,
      },
      {
        id: "apply-loan",
        label: "Apply for Loan",
        path: "/capital/apply",
        icon: DollarSign,
        badge: "New",
      },
      {
        id: "loan-status",
        label: "Loan Status",
        path: "/capital/status",
        icon: FileCheck,
      },
    ],
  },

  // 13) APPS
  {
    id: "apps",
    label: "Apps",
    path: "/apps",
    icon: Puzzle,
    description: "Integrations and connected apps",
    shortcut: "",
    roles: ["OWNER", "ADMIN"],
    children: [
      {
        id: "app-center",
        label: "App Center",
        path: "/apps/center",
        icon: Puzzle,
      },
      { id: "my-apps", label: "My Apps", path: "/apps/connected", icon: Zap },
      {
        id: "recommended",
        label: "Recommended",
        path: "/apps/recommended",
        icon: Sparkles,
      },
    ],
  },
];

// ============================================================================
// ACCOUNTANT TOOLS (Visible only to ACCOUNTANT role)
// ============================================================================

export const ACCOUNTANT_NAV: NavItem = {
  id: "accountant",
  label: "Accountant",
  path: "/accountant",
  icon: Briefcase,
  description: "Tools for accounting professionals",
  roles: ["ACCOUNTANT", "ADMIN", "OWNER"],
  featureFlag: "ACCOUNTANT_TOOLS",
  children: [
    {
      id: "client-overview",
      label: "Client Overview",
      path: "/accountant/clients",
      icon: Users,
    },
    {
      id: "reclassify",
      label: "Reclassify Transactions",
      path: "/accountant/reclassify",
      icon: ArrowLeftRight,
    },
    {
      id: "write-off",
      label: "Write Off Invoices",
      path: "/accountant/write-off",
      icon: FileText,
    },
    {
      id: "voided-deleted",
      label: "Voided / Deleted",
      path: "/accountant/voided",
      icon: Trash2,
    },
    {
      id: "close-books-acct",
      label: "Close the Books",
      path: "/accountant/close-books",
      icon: Lock,
    },
    {
      id: "audit-trail",
      label: "Audit Trail",
      path: "/accountant/audit",
      icon: Shield,
    },
  ],
};

// ============================================================================
// SETTINGS & GEAR MENU
// ============================================================================

export const SETTINGS_MENU: NavItem[] = [
  {
    id: "company-settings",
    label: "Company Settings",
    path: "/settings/company",
    icon: Building2,
    roles: ["OWNER", "ADMIN"],
    children: [
      {
        id: "account-settings",
        label: "Account and Settings",
        path: "/settings/account",
      },
      {
        id: "billing",
        label: "Billing & Subscription",
        path: "/settings/billing",
      },
      { id: "users", label: "Manage Users", path: "/settings/users" },
      {
        id: "custom-forms",
        label: "Custom Form Styles",
        path: "/settings/forms",
      },
      {
        id: "custom-fields",
        label: "Custom Fields",
        path: "/settings/custom-fields",
      },
      {
        id: "regions",
        label: "Regions & Currencies",
        path: "/settings/regions",
      },
    ],
  },
  {
    id: "lists",
    label: "Lists",
    path: "/lists",
    icon: List,
    children: [
      {
        id: "chart-accounts-list",
        label: "Chart of Accounts",
        path: "/chart-of-accounts",
      },
      { id: "products-list", label: "Products & Services", path: "/products" },
      {
        id: "classes",
        label: "Classes",
        path: "/lists/classes",
        subscription: ["PLUS", "ADVANCED", "ENTERPRISE"],
      },
      {
        id: "locations",
        label: "Locations",
        path: "/lists/locations",
        subscription: ["PLUS", "ADVANCED", "ENTERPRISE"],
      },
      { id: "terms", label: "Terms", path: "/lists/terms" },
      {
        id: "payment-methods",
        label: "Payment Methods",
        path: "/lists/payment-methods",
      },
      {
        id: "sales-tax-agencies",
        label: "Sales Tax Agencies",
        path: "/taxes/agencies",
      },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    path: "/tools",
    icon: Wrench,
    children: [
      {
        id: "fixed-assets",
        label: "Fixed Assets",
        path: "/tools/fixed-assets",
      },
      { id: "price-rules", label: "Price Rules", path: "/tools/price-rules" },
      {
        id: "recurring-transactions",
        label: "Recurring Transactions",
        path: "/recurring",
      },
      { id: "attachments", label: "Attachments", path: "/tools/attachments" },
      { id: "import", label: "Import Data", path: "/tools/import" },
      { id: "export", label: "Export Data", path: "/tools/export" },
      {
        id: "reclassify",
        label: "Reclassify Transactions",
        path: "/tools/reclassify",
      },
      {
        id: "write-off-tool",
        label: "Write Off Invoices",
        path: "/tools/write-off",
      },
      {
        id: "voided-deleted-tool",
        label: "Voided / Deleted Transactions",
        path: "/tools/voided",
      },
      { id: "audit-log-tool", label: "Audit Log", path: "/audit-log" },
      { id: "budgeting-tool", label: "Budgeting", path: "/budgeting" },
      {
        id: "close-books-tool",
        label: "Close the Books",
        path: "/close-books",
      },
    ],
  },
  {
    id: "profile-settings",
    label: "Profile",
    path: "/profile",
    icon: User,
    children: [
      { id: "my-profile", label: "My Profile", path: "/profile" },
      {
        id: "notifications",
        label: "Notifications",
        path: "/settings/notifications",
      },
      { id: "security", label: "Security", path: "/settings/security" },
      { id: "privacy", label: "Privacy", path: "/settings/privacy" },
      { id: "sign-out", label: "Sign Out", path: "/logout", icon: LogOut },
    ],
  },
];

// ============================================================================
// DESKTOP MODE NAVIGATION (Classic Menu Bar)
// ============================================================================

export const DESKTOP_MODE_NAV: NavItem[] = [
  {
    id: "company",
    label: "Company",
    path: "#",
    icon: Building2,
    children: [
      { id: "home-company", label: "Home", path: "/dashboard" },
      {
        id: "chart-of-accounts-desktop",
        label: "Chart of Accounts",
        path: "/chart-of-accounts",
      },
      {
        id: "products-services-desktop",
        label: "Products & Services",
        path: "/products",
      },
      {
        id: "recurring-desktop",
        label: "Recurring Transactions",
        path: "/recurring",
      },
      { id: "users-desktop", label: "Users", path: "/settings/users" },
      {
        id: "billing-desktop",
        label: "Billing & Subscription",
        path: "/settings/billing",
      },
      { divider: true },
      {
        id: "close-books-desktop",
        label: "Close the Books",
        path: "/close-books",
      },
    ],
  },
  {
    id: "customers-desktop",
    label: "Customers",
    path: "#",
    icon: Users,
    children: [
      { id: "customer-center", label: "Customer Center", path: "/customers" },
      { id: "invoice-desktop", label: "Invoice", path: "/invoices/new" },
      {
        id: "receive-payment-desktop",
        label: "Receive Payment",
        path: "/payments/new",
      },
      { id: "estimate-desktop", label: "Estimate", path: "/quotes/new" },
      {
        id: "sales-receipt-desktop",
        label: "Sales Receipt",
        path: "/sales-receipts/new",
      },
      {
        id: "credit-memo-desktop",
        label: "Credit Memo",
        path: "/credit-memos/new",
      },
      { id: "refund-desktop", label: "Refund & Credits", path: "/refunds/new" },
    ],
  },
  {
    id: "vendors-desktop",
    label: "Vendors",
    path: "#",
    icon: Building2,
    children: [
      { id: "vendor-center", label: "Vendor Center", path: "/vendors" },
      { id: "bill-desktop", label: "Enter Bills", path: "/bills/new" },
      { id: "pay-bills-desktop", label: "Pay Bills", path: "/pay-bills" },
      {
        id: "purchase-order-desktop",
        label: "Purchase Orders",
        path: "/purchase-orders/new",
      },
      {
        id: "inventory-activities",
        label: "Inventory Activities",
        path: "/inventory",
      },
      {
        id: "fixed-assets-desktop",
        label: "Fixed Assets",
        path: "/tools/fixed-assets",
      },
    ],
  },
  {
    id: "employees-desktop",
    label: "Employees",
    path: "#",
    icon: Users,
    featureFlag: "PAYROLL",
    children: [
      { id: "employee-center", label: "Employee Center", path: "/employees" },
      { id: "payroll-desktop", label: "Pay Employees", path: "/payroll/run" },
      {
        id: "pay-liabilities",
        label: "Pay Liabilities",
        path: "/payroll/liabilities",
      },
      {
        id: "process-forms",
        label: "Process Payroll Forms",
        path: "/payroll/filings",
      },
    ],
  },
  {
    id: "banking-desktop",
    label: "Banking",
    path: "#",
    icon: Landmark,
    children: [
      { id: "write-checks", label: "Write Checks", path: "/checks/new" },
      { id: "make-deposits", label: "Make Deposits", path: "/deposits/new" },
      { id: "transfer-funds", label: "Transfer Funds", path: "/transfers/new" },
      { id: "credit-cards", label: "Credit Cards", path: "/credit-cards" },
      { id: "reconcile-desktop", label: "Reconcile", path: "/reconcile" },
      { id: "bank-feeds", label: "Bank Feeds", path: "/banking/feeds" },
    ],
  },
  {
    id: "reports-desktop",
    label: "Reports",
    path: "#",
    icon: BarChart3,
    children: [
      { id: "report-center", label: "Report Center", path: "/reports" },
      {
        id: "business-overview",
        label: "Business Overview",
        path: "/reports/business-overview",
      },
      {
        id: "company-financial",
        label: "Company & Financial",
        path: "/reports/financial",
      },
      {
        id: "customers-receivables",
        label: "Customers & Receivables",
        path: "/reports/ar",
      },
      {
        id: "vendors-payables",
        label: "Vendors & Payables",
        path: "/reports/ap",
      },
      { id: "sales", label: "Sales", path: "/reports/sales" },
      { id: "inventory", label: "Inventory", path: "/reports/inventory" },
      {
        id: "employees-payroll",
        label: "Employees & Payroll",
        path: "/reports/payroll",
      },
      { id: "budgets", label: "Budgets", path: "/reports/budget" },
    ],
  },
  {
    id: "lists-desktop",
    label: "Lists",
    path: "#",
    icon: List,
    children: [
      {
        id: "chart-of-accounts-list",
        label: "Chart of Accounts",
        path: "/chart-of-accounts",
      },
      {
        id: "fixed-asset-list",
        label: "Fixed Asset Listing",
        path: "/tools/fixed-assets",
      },
      {
        id: "products-services-list",
        label: "Products & Services",
        path: "/products",
      },
      { id: "customers-list", label: "Customers", path: "/customers" },
      { id: "vendors-list", label: "Vendors", path: "/vendors" },
      { id: "employees-list", label: "Employees", path: "/employees" },
      { id: "classes-list", label: "Classes", path: "/lists/classes" },
      { id: "terms-list", label: "Terms", path: "/lists/terms" },
      { id: "sales-tax-codes", label: "Sales Tax Codes", path: "/taxes/codes" },
    ],
  },
];

// ============================================================================
// PERMISSION HELPER FUNCTIONS
// ============================================================================

export function hasPermission(
  item: NavItem | NavChild,
  userRole: UserRole,
  subscription: SubscriptionTier,
  features: FeatureFlag[],
): boolean {
  // Check roles
  if (item.roles && !item.roles.includes(userRole)) {
    return false;
  }

  // Check subscription tier
  if (item.subscription && !item.subscription.includes(subscription)) {
    return false;
  }

  // Check feature flags
  if (item.featureFlag && !features.includes(item.featureFlag)) {
    return false;
  }

  return true;
}

export function filterNavigation(
  items: NavItem[],
  userRole: UserRole,
  subscription: SubscriptionTier,
  features: FeatureFlag[],
): NavItem[] {
  return items.filter((item) => {
    if (!hasPermission(item, userRole, subscription, features)) {
      return false;
    }

    // Filter children recursively
    if (item.children) {
      item.children = item.children.filter((child) =>
        hasPermission(child, userRole, subscription, features),
      );
    }

    return true;
  });
}

// ============================================================================
// SEARCH CONFIGURATION
// ============================================================================

export const SEARCH_ENTITIES = [
  { type: "transaction", label: "Transactions", icon: ArrowLeftRight },
  { type: "customer", label: "Customers", icon: Users },
  { type: "vendor", label: "Vendors", icon: Building2 },
  { type: "invoice", label: "Invoices", icon: FileText },
  { type: "bill", label: "Bills", icon: Receipt },
  { type: "account", label: "Accounts", icon: BookOpen },
  { type: "product", label: "Products", icon: Package },
  { type: "report", label: "Reports", icon: BarChart3 },
  { type: "employee", label: "Employees", icon: Users },
];

export default {
  MAIN_NAVIGATION,
  QUICK_CREATE_MENU,
  SETTINGS_MENU,
  DESKTOP_MODE_NAV,
  ACCOUNTANT_NAV,
  SEARCH_ENTITIES,
  hasPermission,
  filterNavigation,
};
