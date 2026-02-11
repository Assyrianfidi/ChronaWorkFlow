import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  Receipt,
  Calculator,
  Wallet,
  Building2,
  PieChart,
  Settings,
  ChevronDown,
  Banknote,
  ArrowLeftRight,
  Package,
  FileBarChart,
  TrendingUp,
  Shield,
  CreditCard,
  Clock,
  FileCheck,
  BadgeDollarSign,
  Archive,
  BarChart3,
  Landmark,
  Percent,
  FileSpreadsheet,
  Printer,
  Bell,
  HelpCircle,
  Search,
  Menu,
  X,
  LogOut,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  description?: string;
  items?: NavItem[];
}

const mainNavigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    description: "Overview of your business",
  },
  {
    title: "Sales",
    href: "/sales",
    icon: <FileText className="h-4 w-4" />,
    description: "Invoices, quotes, and payments",
    items: [
      {
        title: "Invoices",
        href: "/invoices",
        icon: <FileText className="h-4 w-4" />,
        description: "Create and manage invoices",
      },
      {
        title: "Quotes / Estimates",
        href: "/quotes",
        icon: <FileCheck className="h-4 w-4" />,
        description: "Send quotes to customers",
      },
      {
        title: "Recurring Invoices",
        href: "/recurring-invoices",
        icon: <Clock className="h-4 w-4" />,
        description: "Automated billing",
      },
      {
        title: "Credit Notes",
        href: "/credit-notes",
        icon: <Receipt className="h-4 w-4" />,
        description: "Issue refunds",
      },
      {
        title: "Sales Receipts",
        href: "/sales-receipts",
        icon: <Receipt className="h-4 w-4" />,
        description: "Record sales",
      },
      {
        title: "Payment Links",
        href: "/payment-links",
        icon: <CreditCard className="h-4 w-4" />,
        description: "Get paid faster",
      },
      {
        title: "Customers",
        href: "/customers",
        icon: <Users className="h-4 w-4" />,
        description: "Customer management",
      },
    ],
  },
  {
    title: "Purchases",
    href: "/purchases",
    icon: <Receipt className="h-4 w-4" />,
    description: "Bills, expenses, and vendors",
    items: [
      {
        title: "Bills",
        href: "/bills",
        icon: <Receipt className="h-4 w-4" />,
        description: "Track vendor bills",
      },
      {
        title: "Expenses",
        href: "/expenses",
        icon: <Wallet className="h-4 w-4" />,
        description: "Record expenses",
      },
      {
        title: "Purchase Orders",
        href: "/purchase-orders",
        icon: <FileCheck className="h-4 w-4" />,
        description: "Order from vendors",
      },
      {
        title: "Vendors",
        href: "/vendors",
        icon: <Building2 className="h-4 w-4" />,
        description: "Supplier management",
      },
      {
        title: "Check Printing",
        href: "/checks",
        icon: <Printer className="h-4 w-4" />,
        description: "Print checks",
      },
      {
        title: "1099 Forms",
        href: "/1099",
        icon: <FileSpreadsheet className="h-4 w-4" />,
        description: "Contractor payments",
      },
    ],
  },
  {
    title: "Accounting",
    href: "/accounting",
    icon: <Calculator className="h-4 w-4" />,
    description: "Chart of accounts, journals",
    items: [
      {
        title: "Chart of Accounts",
        href: "/chart-of-accounts",
        icon: <Landmark className="h-4 w-4" />,
        description: "Manage GL accounts",
      },
      {
        title: "Journal Entries",
        href: "/journal-entries",
        icon: <FileText className="h-4 w-4" />,
        description: "Manual adjustments",
      },
      {
        title: "Reconciliation",
        href: "/reconciliation",
        icon: <ArrowLeftRight className="h-4 w-4" />,
        description: "Bank reconciliation",
      },
      {
        title: "Budgets",
        href: "/budgets",
        icon: <PieChart className="h-4 w-4" />,
        description: "Financial planning",
      },
      {
        title: "Fixed Assets",
        href: "/fixed-assets",
        icon: <Archive className="h-4 w-4" />,
        description: "Asset management",
      },
      {
        title: "Depreciation",
        href: "/depreciation",
        icon: <TrendingUp className="h-4 w-4" />,
        description: "Asset depreciation",
      },
      {
        title: "Closing Entries",
        href: "/closing-entries",
        icon: <FileCheck className="h-4 w-4" />,
        description: "Period close",
      },
    ],
  },
  {
    title: "Banking",
    href: "/banking",
    icon: <Landmark className="h-4 w-4" />,
    description: "Bank feeds and transfers",
    items: [
      {
        title: "Bank Accounts",
        href: "/bank-accounts",
        icon: <Landmark className="h-4 w-4" />,
        description: "Manage accounts",
      },
      {
        title: "Bank Feeds",
        href: "/bank-feeds",
        icon: <ArrowLeftRight className="h-4 w-4" />,
        description: "Import transactions",
      },
      {
        title: "Transfers",
        href: "/transfers",
        icon: <ArrowLeftRight className="h-4 w-4" />,
        description: "Move funds",
      },
      {
        title: "Check Register",
        href: "/check-register",
        icon: <Receipt className="h-4 w-4" />,
        description: "View all checks",
      },
      {
        title: "Credit Cards",
        href: "/credit-cards",
        icon: <CreditCard className="h-4 w-4" />,
        description: "Card management",
      },
      {
        title: "Petty Cash",
        href: "/petty-cash",
        icon: <Banknote className="h-4 w-4" />,
        description: "Cash tracking",
      },
    ],
  },
  {
    title: "Payroll",
    href: "/payroll",
    icon: <Users className="h-4 w-4" />,
    description: "Employees and payroll",
    items: [
      {
        title: "Employees",
        href: "/employees",
        icon: <Users className="h-4 w-4" />,
        description: "Employee records",
      },
      {
        title: "Run Payroll",
        href: "/run-payroll",
        icon: <Calculator className="h-4 w-4" />,
        description: "Process payroll",
      },
      {
        title: "Pay History",
        href: "/pay-history",
        icon: <Clock className="h-4 w-4" />,
        description: "Past pay runs",
      },
      {
        title: "Tax Forms",
        href: "/payroll-tax-forms",
        icon: <FileSpreadsheet className="h-4 w-4" />,
        description: "W-2, 941, etc.",
      },
      {
        title: "Benefits",
        href: "/benefits",
        icon: <Shield className="h-4 w-4" />,
        description: "Employee benefits",
      },
      {
        title: "Time Off",
        href: "/time-off",
        icon: <Clock className="h-4 w-4" />,
        description: "PTO tracking",
      },
      {
        title: "Timesheets",
        href: "/timesheets",
        icon: <FileText className="h-4 w-4" />,
        description: "Hours tracking",
      },
    ],
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: <Package className="h-4 w-4" />,
    description: "Products and stock",
    items: [
      {
        title: "Products",
        href: "/products",
        icon: <Package className="h-4 w-4" />,
        description: "Product catalog",
      },
      {
        title: "Stock Levels",
        href: "/stock-levels",
        icon: <BarChart3 className="h-4 w-4" />,
        description: "Inventory levels",
      },
      {
        title: "Purchase Orders",
        href: "/inventory-po",
        icon: <FileCheck className="h-4 w-4" />,
        description: "Restock items",
      },
      {
        title: "Receive Inventory",
        href: "/receive-inventory",
        icon: <Package className="h-4 w-4" />,
        description: "Record receipts",
      },
      {
        title: "Adjustments",
        href: "/adjustments",
        icon: <ArrowLeftRight className="h-4 w-4" />,
        description: "Stock adjustments",
      },
      {
        title: "Warehouses",
        href: "/warehouses",
        icon: <Building2 className="h-4 w-4" />,
        description: "Multiple locations",
      },
      {
        title: "Bundles",
        href: "/bundles",
        icon: <Package className="h-4 w-4" />,
        description: "Product bundles",
      },
    ],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: <BarChart3 className="h-4 w-4" />,
    description: "Financial reports",
    items: [
      {
        title: "Profit & Loss",
        href: "/reports/pnl",
        icon: <TrendingUp className="h-4 w-4" />,
        description: "Income statement",
      },
      {
        title: "Balance Sheet",
        href: "/reports/balance-sheet",
        icon: <Scale className="h-4 w-4" />,
        description: "Financial position",
      },
      {
        title: "Cash Flow",
        href: "/reports/cash-flow",
        icon: <ArrowLeftRight className="h-4 w-4" />,
        description: "Cash movements",
      },
      {
        title: "A/R Aging",
        href: "/reports/ar-aging",
        icon: <Clock className="h-4 w-4" />,
        description: "Receivables",
      },
      {
        title: "A/P Aging",
        href: "/reports/ap-aging",
        icon: <Clock className="h-4 w-4" />,
        description: "Payables",
      },
      {
        title: "Sales Report",
        href: "/reports/sales",
        icon: <BarChart3 className="h-4 w-4" />,
        description: "Sales analysis",
      },
      {
        title: "Tax Summary",
        href: "/reports/tax",
        icon: <Percent className="h-4 w-4" />,
        description: "Tax reports",
      },
      {
        title: "Custom Reports",
        href: "/reports/custom",
        icon: <FileBarChart className="h-4 w-4" />,
        description: "Build reports",
      },
    ],
  },
  {
    title: "Taxes",
    href: "/taxes",
    icon: <Percent className="h-4 w-4" />,
    description: "Tax management",
    items: [
      {
        title: "Sales Tax",
        href: "/taxes/sales",
        icon: <Percent className="h-4 w-4" />,
        description: "Sales tax rates",
      },
      {
        title: "Tax Returns",
        href: "/taxes/returns",
        icon: <FileCheck className="h-4 w-4" />,
        description: "File returns",
      },
      {
        title: "1099 Forms",
        href: "/taxes/1099",
        icon: <FileSpreadsheet className="h-4 w-4" />,
        description: "Contractor forms",
      },
      {
        title: "Payroll Tax",
        href: "/taxes/payroll",
        icon: <BadgeDollarSign className="h-4 w-4" />,
        description: "Employment taxes",
      },
      {
        title: "Tax Settings",
        href: "/taxes/settings",
        icon: <Settings className="h-4 w-4" />,
        description: "Configure taxes",
      },
    ],
  },
];

// Scale icon component for reports
function Scale({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h2c.5 0 1-.2 1.4-.6.4-.4.6-.9.6-1.4V3c0-.5-.2-1-.6-1.4C6 1.2 5.5 1 5 1H3c-.5 0-1 .2-1.4.6C1.2 2 1 2.5 1 3v2c0 .5.2 1 .6 1.4.4.4.9.6 1.4.6Z" />
      <path d="M17 7h2c.5 0 1-.2 1.4-.6.4-.4.6-.9.6-1.4V3c0-.5-.2-1-.6-1.4C20 1.2 19.5 1 19 1h-2c-.5 0-1 .2-1.4.6-.4.4-.6.9-.6 1.4v2c0 .5.2 1 .6 1.4.4.4.9.6 1.4.6Z" />
    </svg>
  );
}

export function EnterpriseNavigationMenu() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="border-b bg-background">
      {/* Top bar with search and actions */}
      <div className="flex h-14 items-center px-4 gap-4 border-b">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl mr-4">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold">A</span>
          </div>
          <span className="hidden md:block">AccuBooks</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex flex-1">
          <NavigationMenu>
            <NavigationMenuList>
              {mainNavigation.map((item) => (
                <NavigationMenuItem key={item.title}>
                  {item.items ? (
                    <>
                      <NavigationMenuTrigger
                        className={cn(
                          "h-9 px-3 text-sm font-medium",
                          location.pathname.startsWith(item.href) &&
                            "bg-accent",
                        )}
                      >
                        <span className="flex items-center gap-2">
                          {item.icon}
                          {item.title}
                        </span>
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="w-[600px] p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 mb-2">
                              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                {item.title}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {item.description}
                              </p>
                            </div>
                            {item.items.map((subItem) => (
                              <NavigationMenuLink asChild key={subItem.title}>
                                <Link
                                  to={subItem.href}
                                  className={cn(
                                    "flex items-start gap-3 rounded-md p-3 transition-colors hover:bg-accent",
                                    location.pathname === subItem.href &&
                                      "bg-accent",
                                  )}
                                >
                                  <div className="mt-0.5 text-muted-foreground">
                                    {subItem.icon}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium">
                                      {subItem.title}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {subItem.description}
                                    </div>
                                  </div>
                                </Link>
                              </NavigationMenuLink>
                            ))}
                          </div>
                        </div>
                      </NavigationMenuContent>
                    </>
                  ) : (
                    <NavigationMenuLink asChild>
                      <Link
                        to={item.href}
                        className={cn(
                          "flex items-center gap-2 h-9 px-3 text-sm font-medium rounded-md transition-colors hover:bg-accent",
                          location.pathname === item.href && "bg-accent",
                        )}
                      >
                        {item.icon}
                        {item.title}
                      </Link>
                    </NavigationMenuLink>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search transactions, invoices, customers..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          </Button>
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
          <div className="hidden md:flex items-center gap-2 ml-2">
            <Button variant="ghost" size="sm" className="gap-2">
              <UserCircle className="h-4 w-4" />
              <span className="text-sm">My Account</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b bg-background">
          <div className="p-4 space-y-4 max-h-[calc(100vh-4rem)] overflow-auto">
            {mainNavigation.map((item) => (
              <div key={item.title} className="space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  {item.icon}
                  {item.title}
                </div>
                <div className="pl-6 space-y-1">
                  {item.items ? (
                    item.items.map((subItem) => (
                      <Link
                        key={subItem.title}
                        to={subItem.href}
                        className={cn(
                          "flex items-center gap-2 py-2 px-3 rounded-md text-sm transition-colors hover:bg-accent",
                          location.pathname === subItem.href && "bg-accent",
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {subItem.icon}
                        <div>
                          <div className="font-medium">{subItem.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {subItem.description}
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center gap-2 py-2 px-3 rounded-md text-sm transition-colors hover:bg-accent",
                        location.pathname === item.href && "bg-accent",
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.icon}
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 overflow-x-auto">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Quick Create:
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs whitespace-nowrap gap-1"
        >
          <FileText className="h-3 w-3" />
          Invoice
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs whitespace-nowrap gap-1"
        >
          <Receipt className="h-3 w-3" />
          Expense
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs whitespace-nowrap gap-1"
        >
          <Users className="h-3 w-3" />
          Customer
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs whitespace-nowrap gap-1"
        >
          <Banknote className="h-3 w-3" />
          Payment
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs whitespace-nowrap gap-1"
        >
          <Calculator className="h-3 w-3" />
          Journal Entry
        </Button>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs whitespace-nowrap gap-1 text-muted-foreground"
        >
          <LogOut className="h-3 w-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
