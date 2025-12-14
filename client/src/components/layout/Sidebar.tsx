import React, { useState } from 'react';
import * as React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from '@/../../contexts/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  TrendingUp,
  Settings,
  BarChart3,
  Calendar,
  Building2,
  Receipt,
  PiggyBank,
  Calculator,
  Briefcase,
  Shield,
} from "lucide-react";
import { cn } from '@/../../lib/utils';

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavigationItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  roles?: string[];
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Invoices",
    href: "/invoices",
    icon: FileText,
    badge: "12",
    roles: ["ADMIN", "MANAGER", "USER", "AUDITOR"],
  },
  {
    title: "Clients",
    href: "/clients",
    icon: Users,
    roles: ["ADMIN", "MANAGER", "USER"],
  },
  {
    title: "Vendors",
    href: "/vendors",
    icon: Building2,
    roles: ["ADMIN", "MANAGER", "USER"],
  },
  {
    title: "Accounting",
    href: "/accounting",
    icon: Calculator,
    roles: ["ADMIN", "MANAGER"],
    children: [
      {
        title: "Chart of Accounts",
        href: "/accounting/chart-of-accounts",
        icon: BarChart3,
      },
      {
        title: "Journal Entries",
        href: "/accounting/journal",
        icon: FileText,
      },
      {
        title: "Trial Balance",
        href: "/accounting/trial-balance",
        icon: TrendingUp,
      },
    ],
  },
  {
    title: "Banking",
    href: "/banking",
    icon: CreditCard,
    roles: ["ADMIN", "MANAGER"],
    children: [
      {
        title: "Bank Accounts",
        href: "/banking/accounts",
        icon: CreditCard,
      },
      {
        title: "Transactions",
        href: "/banking/transactions",
        icon: Receipt,
      },
      {
        title: "Reconciliation",
        href: "/banking/reconciliation",
        icon: Calculator,
      },
    ],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["ADMIN", "MANAGER", "AUDITOR"],
    children: [
      {
        title: "Financial Reports",
        href: "/reports/financial",
        icon: TrendingUp,
      },
      {
        title: "Sales Reports",
        href: "/reports/sales",
        icon: FileText,
      },
      {
        title: "Tax Reports",
        href: "/reports/tax",
        icon: Receipt,
      },
    ],
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Briefcase,
    roles: ["ADMIN", "INVENTORY_MANAGER"],
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    title: "Audit Logs",
    href: "/audit",
    icon: Shield,
    roles: ["ADMIN", "AUDITOR"],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["ADMIN", "MANAGER"],
  },
];

const Sidebar: React.FC<SidebarProps> = ({
  className,
  isOpen = true,
  onClose,
}) => {
  const location = useLocation();
  const { user, hasRole } = useAuth();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  const filteredNavigationItems = React.useMemo(() => {
    return navigationItems.filter((item) => {
      if (!item.roles || item.roles.length === 0) return true;
      return hasRole(item.roles as any);
    });
  }, [user, hasRole]);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title],
    );
  };

  const isActive = (href: string) => {
    return (
      location.pathname === href || location.pathname.startsWith(href + "/")
    );
  };

  const isParentActive = (item: NavigationItem) => {
    if (isActive(item.href)) return true;
    if (item.children) {
      return item.children.some((child) => isActive(child.href));
    }
    return false;
  };

  return (
    <div
      className={cn(
        "w-64 bg-white border-r border-gray-200 h-full flex flex-col transition-all duration-300",
        !isOpen && "w-0 overflow-hidden",
        className,
      )}
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-enterprise-navy rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AB</span>
          </div>
          <span className="text-xl font-bold text-enterprise-navy">
            AccuBooks
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredNavigationItems.map((item) => {
          const active = isParentActive(item);
          const expanded = expandedItems.includes(item.title);
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.title}>
              <NavLink
                to={item.href}
                onClick={() => hasChildren && toggleExpanded(item.title)}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors group",
                  active
                    ? "bg-enterprise-navy text-white"
                    : "text-gray-700 hover:bg-gray-100 hover:text-enterprise-navy",
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.title}</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span
                      className={cn(
                        "px-2 py-1 text-xs rounded-full",
                        active
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-600",
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                  {hasChildren && (
                    <span
                      className={cn(
                        "transition-transform duration-200",
                        expanded && "rotate-90",
                      )}
                    >
                      ▶
                    </span>
                  )}
                </div>
              </NavLink>

              {/* Submenu */}
              {hasChildren && expanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.children!.map((child) => {
                    const childActive = isActive(child.href);

                    return (
                      <NavLink
                        key={child.title}
                        to={child.href}
                        className={cn(
                          "flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors group",
                          childActive
                            ? "bg-enterprise-navy/10 text-enterprise-navy font-medium"
                            : "text-gray-600 hover:bg-gray-50 hover:text-enterprise-navy",
                        )}
                      >
                        <child.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{child.title}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-ocean-accent rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {user?.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.role?.replace("_", " ").charAt(0).toUpperCase() +
                user?.role?.slice(1)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

Sidebar.displayName = "Sidebar";

export { Sidebar };
