import React, { useState } from 'react';
import * as React from "react";
import {
  BarChart3,
  Users,
  CreditCard,
  FileText,
  TrendingUp,
  Settings,
  Home,
  Building2,
  Receipt,
  PieChart,
  Search,
  Command,
  ChevronDown,
  Zap,
  Bell,
  HelpCircle,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
} from "lucide-react";
import { cn } from '@/../../lib/utils';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
  badge?: string | number;
  children?: NavigationItem[];
  description?: string;
  shortcut?: string;
}

interface SideNavigationProps {
  open?: boolean;
  className?: string;
  onItemClick?: (item: NavigationItem) => void;
  activeItem?: string;
  collapsible?: boolean;
  theme?: "light" | "dark";
  userRole?: "beginner" | "professional" | "admin";
}

const SideNavigation = React.forwardRef<HTMLDivElement, SideNavigationProps>(
  (
    {
      open = true,
      className,
      onItemClick,
      activeItem = "dashboard",
      collapsible = true,
      theme = "light",
      userRole = "professional",
    },
    ref,
  ) => {
    const [activeNav, setActiveNav] = React.useState(activeItem);
    const [expandedItems, setExpandedItems] = React.useState<Set<string>>(
      new Set(),
    );
    const [searchQuery, setSearchQuery] = React.useState("");
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    const navigationItems: NavigationItem[] = [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: <BarChart3 className="h-5 w-5" />,
        href: "/dashboard",
        active: activeNav === "dashboard",
        description: "Business overview and analytics",
        shortcut: "Ctrl+D",
      },
      {
        id: "accounts",
        label: "Accounts",
        icon: <Building2 className="h-5 w-5" />,
        href: "/accounts",
        active: activeNav === "accounts",
        description: "Manage chart of accounts",
        shortcut: "Ctrl+A",
        children: [
          {
            id: "accounts-revenue",
            label: "Revenue Accounts",
            icon: <TrendingUp className="h-4 w-4" />,
            href: "/accounts/revenue",
          },
          {
            id: "accounts-expenses",
            label: "Expense Accounts",
            icon: <Receipt className="h-4 w-4" />,
            href: "/accounts/expenses",
          },
          {
            id: "accounts-assets",
            label: "Asset Accounts",
            icon: <Building2 className="h-4 w-4" />,
            href: "/accounts/assets",
          },
        ],
      },
      {
        id: "transactions",
        label: "Transactions",
        icon: <CreditCard className="h-5 w-5" />,
        href: "/transactions",
        active: activeNav === "transactions",
        description: "Record and manage transactions",
        shortcut: "Ctrl+T",
        badge: "12",
      },
      {
        id: "invoices",
        label: "Invoices",
        icon: <FileText className="h-5 w-5" />,
        href: "/invoices",
        active: activeNav === "invoices",
        description: "Create and track invoices",
        shortcut: "Ctrl+I",
        badge: "3",
      },
      {
        id: "customers",
        label: "Customers",
        icon: <Users className="h-5 w-5" />,
        href: "/customers",
        active: activeNav === "customers",
        description: "Customer relationship management",
        shortcut: "Ctrl+C",
      },
      {
        id: "reports",
        label: "Reports",
        icon: <PieChart className="h-5 w-5" />,
        href: "/reports",
        active: activeNav === "reports",
        description: "Financial reports and analytics",
        shortcut: "Ctrl+R",
        children: [
          {
            id: "reports-profit-loss",
            label: "Profit & Loss",
            icon: <TrendingUp className="h-4 w-4" />,
            href: "/reports/profit-loss",
          },
          {
            id: "reports-balance-sheet",
            label: "Balance Sheet",
            icon: <BarChart3 className="h-4 w-4" />,
            href: "/reports/balance-sheet",
          },
          {
            id: "reports-cash-flow",
            label: "Cash Flow",
            icon: <Receipt className="h-4 w-4" />,
            href: "/reports/cash-flow",
          },
        ],
      },
      {
        id: "settings",
        label: "Settings",
        icon: <Settings className="h-5 w-5" />,
        href: "/settings",
        active: activeNav === "settings",
        description: "System configuration",
        shortcut: "Ctrl+S",
      },
    ];

    const filteredItems = React.useMemo(() => {
      if (!searchQuery) return navigationItems;

      return navigationItems.filter(
        (item) =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }, [searchQuery]);

    const handleItemClick = (item: NavigationItem) => {
      setActiveNav(item.id);
      onItemClick?.(item);

      if (item.children) {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(item.id)) {
          newExpanded.delete(item.id);
        } else {
          newExpanded.add(item.id);
        }
        setExpandedItems(newExpanded);
      }
    };

    const toggleCollapse = () => {
      setIsCollapsed(!isCollapsed);
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex flex-col h-full backdrop-blur-xl transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          theme === "dark" ? "glass-dark" : "glass",
          "border border-white/20",
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {!isCollapsed && (
            <div className="flex items-center gap-3 animate-slide-up">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-800">AccuBooks</span>
            </div>
          )}
          {collapsible && (
            <button
              onClick={toggleCollapse}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              {isCollapsed ? (
                <Menu className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* Search Bar */}
        {!isCollapsed && (
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
              />
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => handleItemClick(item)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group",
                  item.active
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                    : "text-gray-700 hover:bg-white/20 hover:scale-105",
                  isCollapsed && "justify-center",
                )}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>

                {!isCollapsed && (
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{item.label}</div>
                    {item.description && userRole === "beginner" && (
                      <div className="text-xs opacity-70">
                        {item.description}
                      </div>
                    )}
                  </div>
                )}

                {!isCollapsed &&
                  item.shortcut &&
                  userRole === "professional" && (
                    <kbd className="px-2 py-1 text-xs bg-white/20 rounded border border-white/30">
                      {item.shortcut}
                    </kbd>
                  )}

                {!isCollapsed && item.children && (
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      expandedItems.has(item.id) && "rotate-180",
                    )}
                  />
                )}
              </button>

              {/* Sub-items */}
              {!isCollapsed && item.children && expandedItems.has(item.id) && (
                <div className="ml-4 mt-2 space-y-1">
                  {item.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => handleItemClick(child)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                        child.active
                          ? "bg-white/20 text-blue-600"
                          : "text-gray-600 hover:bg-white/10",
                      )}
                    >
                      {child.icon}
                      <span className="text-sm">{child.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 space-y-2">
          {!isCollapsed && (
            <>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-white/20 rounded-lg transition-colors">
                <HelpCircle className="h-4 w-4" />
                <span className="text-sm">Help & Support</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-white/20 rounded-lg transition-colors">
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Logout</span>
              </button>
            </>
          )}

          {/* Theme Toggle */}
          <button className="w-full flex items-center justify-center gap-3 px-3 py-2 text-gray-700 hover:bg-white/20 rounded-lg transition-colors">
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            {!isCollapsed && <span className="text-sm">Theme</span>}
          </button>
        </div>
      </div>
    );
  },
);

SideNavigation.displayName = "SideNavigation";

export { SideNavigation };
