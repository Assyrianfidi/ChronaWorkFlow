/**
 * Financial Sidebar Component
 * Collapsible left-hand navigation with intuitive icons
 * Inspired by Intuit Design System
 */

import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Plus,
  Settings,
  Search,
  FileText,
  Users,
  CreditCard,
  BarChart3,
  TrendingUp,
  DollarSign,
  Receipt,
  Building,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Home,
  Wallet,
  PieChart,
  Calendar,
  Bell,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
}

interface NavItem {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  to: string;
  badge?: string | number;
  section?: "main" | "actions" | "tools";
}

const navigationItems: NavItem[] = [
  // Main Navigation
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    to: "/dashboard",
    section: "main",
  },
  { icon: Home, label: "Home", to: "/home", section: "main" },
  { icon: BarChart3, label: "Reports", to: "/reports", section: "main" },
  { icon: TrendingUp, label: "Analytics", to: "/analytics", section: "main" },

  // Quick Actions
  { icon: Plus, label: "Create", to: "/create", section: "actions" },
  { icon: Search, label: "Search", to: "/search", section: "actions" },

  // Financial Tools
  {
    icon: DollarSign,
    label: "Profit & Loss",
    to: "/profit-loss",
    section: "tools",
  },
  {
    icon: Wallet,
    label: "Bank Accounts",
    to: "/bank-accounts",
    section: "tools",
  },
  { icon: Receipt, label: "Invoices", to: "/invoices", section: "tools" },
  { icon: CreditCard, label: "Expenses", to: "/expenses", section: "tools" },
  { icon: Users, label: "Customers", to: "/customers", section: "tools" },
  { icon: FileText, label: "Documents", to: "/documents", section: "tools" },
  { icon: Calculator, label: "Payroll", to: "/payroll", section: "tools" },
  { icon: PieChart, label: "Budget", to: "/budget", section: "tools" },
  { icon: Calendar, label: "Calendar", to: "/calendar", section: "tools" },

  // Settings & Help
  { icon: Settings, label: "Settings", to: "/settings", section: "tools" },
  {
    icon: Bell,
    label: "Notifications",
    to: "/notifications",
    section: "tools",
    badge: 3,
  },
  { icon: HelpCircle, label: "Help & Support", to: "/help", section: "tools" },
];

export const FinancialSidebar: React.FC<SidebarProps> = ({
  isCollapsed: controlledCollapsed,
  onToggle,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const location = useLocation();

  const isCollapsed =
    controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggle = () => {
    const newState = !isCollapsed;
    if (onToggle) {
      onToggle(newState);
    } else {
      setInternalCollapsed(newState);
    }
  };

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const getSectionTitle = (section: string) => {
    switch (section) {
      case "main":
        return "Main";
      case "actions":
        return "Quick Actions";
      case "tools":
        return "Financial Tools";
      default:
        return "";
    }
  };

  const groupedItems = navigationItems.reduce(
    (acc, item) => {
      const section = item.section || "main";
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(item);
      return acc;
    },
    {} as Record<string, NavItem[]>,
  );

  return (
    <aside
      className={cn(
        "financial-sidebar",
        "fixed left-0 top-0 h-screen bg-white border-r border-gray-200",
        "transition-all duration-300 ease-in-out z-40",
        "flex flex-col",
        isCollapsed ? "w-20" : "w-[280px]",
      )}
      aria-label="Main navigation"
    >
      {/* Logo & Brand */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <span
              className="text-xl font-extrabold text-gray-900"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              AccuBooks
            </span>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mx-auto">
            <DollarSign className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        className={cn(
          "absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full",
          "flex items-center justify-center shadow-md hover:shadow-lg",
          "transition-all duration-200 hover:scale-110",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2",
        )}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!isCollapsed}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-600" aria-hidden="true" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-600" aria-hidden="true" />
        )}
      </button>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto py-6 px-3"
        aria-label="Primary navigation"
      >
        {Object.entries(groupedItems).map(([section, items]) => (
          <div key={section} className="mb-6">
            {!isCollapsed && (
              <h3 className="px-3 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                {getSectionTitle(section)}
              </h3>
            )}
            <ul className="space-y-1" role="list">
              {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);

                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={cn(
                        "nav-item group relative flex items-center gap-3 px-3 py-2.5 rounded-lg",
                        "transition-all duration-150 ease-out",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2",
                        active
                          ? "bg-green-50 text-green-700 font-bold"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                        isCollapsed && "justify-center",
                      )}
                      aria-current={active ? "page" : undefined}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon
                        className={cn(
                          "nav-icon w-5 h-5 flex-shrink-0 transition-colors",
                          active
                            ? "text-green-600"
                            : "text-gray-500 group-hover:text-gray-700",
                        )}
                        aria-hidden="true"
                      />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-sm font-medium truncate">
                            {item.label}
                          </span>
                          {item.badge && (
                            <span
                              className="ml-auto px-2 py-0.5 text-xs font-bold bg-green-100 text-green-700 rounded-full"
                              aria-label={`${item.badge} notifications`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                      {isCollapsed && item.badge && (
                        <span
                          className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                          aria-label={`${item.badge} notifications`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed ? (
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <p className="text-xs font-bold text-green-900 mb-1">Need Help?</p>
            <p className="text-xs text-green-700 mb-2">
              Contact our support team for assistance
            </p>
            <button className="w-full px-3 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2">
              Get Support
            </button>
          </div>
        ) : (
          <button
            className="w-full h-10 flex items-center justify-center bg-green-50 hover:bg-green-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
            aria-label="Get support"
          >
            <HelpCircle className="w-5 h-5 text-green-600" aria-hidden="true" />
          </button>
        )}
      </div>
    </aside>
  );
};
