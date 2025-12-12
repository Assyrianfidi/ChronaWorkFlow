declare global {
  interface Window {
    [key: string]: any;
  }
}

import React, { useState } from 'react';
import { NavLink, useLocation } from "react-router-dom";
// @ts-ignore
import { cn } from '../../lib/utils.js.js';
// @ts-ignore
import { useAuth } from '../../contexts/AuthContext.js.js';
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  DollarSign,
  Receipt,
  Building,
  Shield,
  Calculator,
  FileSpreadsheet,
  Archive,
  Bell,
  HelpCircle,
  Sliders,
} from "lucide-react";

interface SidebarItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  to: string;
  badge?: string | number;
  collapsed?: boolean;
}

// @ts-ignore
const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  to,
  badge,
  collapsed,
}) => {
  const location = useLocation();
  const isActive =
    location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <NavLink
      to={to}
      className={cn(
        "sidebar-2099-link item group flex items-center gap-3 px-5 py-3 rounded-lg",
        "transition-all duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00e0ff]/60",
        isActive &&
          "sidebar-2099-link-active sidebar-2099-link-active-pulse active-item",
      )}
    >
      <Icon
        className={cn(
          "sidebar-2099-link-icon w-5 h-5 flex-shrink-0 transition-transform duration-300",
          "group-hover:scale-110",
        )}
      />
      {!collapsed && (
        <>
          <span className="sidebar-2099-link-label font-medium truncate">
            {label}
          </span>
          {badge && (
            <span className="sidebar-2099-badge ml-auto text-xs px-2 py-0.5">
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
};

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  collapsed?: boolean;
}

// @ts-ignore
const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  children,
  collapsed,
}) => {
  return (
    <div className="space-y-2 sidebar-2099-section">
      {!collapsed && (
        <h3 className="px-5 text-xs font-semibold uppercase tracking-[0.2em] sidebar-2099-section-title">
          {title}
        </h3>
      )}
      <div className="mt-1 space-y-1">{children}</div>
    </div>
  );
};

interface EnterpriseSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

// @ts-ignore
export const EnterpriseSidebar: React.FC<EnterpriseSidebarProps> = ({
  isOpen,
  onToggle,
  className,
}) => {
  const { user, logout } = useAuth();
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        if (isOpen) {
          onToggle(); // Auto-close on mobile (only if currently open)
        }
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [isOpen, onToggle]);

  const getNavigationItems = () => {
    const baseItems = [
      { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
      { icon: FileText, label: "Invoices", to: "/invoices", badge: "12" },
      { icon: Users, label: "Customers", to: "/customers" },
      { icon: CreditCard, label: "Transactions", to: "/transactions" },
      { icon: Receipt, label: "Reports", to: "/reports" },
    ];

    const roleBasedItems: Record<string, SidebarItemProps[]> = {
      ADMIN: [
        { icon: Shield, label: "Admin", to: "/admin" },
        { icon: Sliders, label: "Feature Management", to: "/admin/features" },
        { icon: Building, label: "Companies", to: "/companies" },
        { icon: Archive, label: "Audit Logs", to: "/audit" },
      ],
      MANAGER: [
        { icon: Users, label: "Team", to: "/team" },
        { icon: Calculator, label: "Payroll", to: "/payroll" },
        {
          icon: FileSpreadsheet,
          label: "Reconciliation",
          to: "/reconciliation",
        },
      ],
      ACCOUNTANT: [
        { icon: Calculator, label: "Accounting", to: "/accounting" },
        { icon: FileSpreadsheet, label: "Ledger", to: "/ledger" },
        { icon: TrendingUp, label: "Analytics", to: "/analytics" },
      ],
      AUDITOR: [
        { icon: Shield, label: "Audit", to: "/audit" },
        { icon: FileText, label: "Compliance", to: "/compliance" },
        { icon: BarChart3, label: "Risk Analysis", to: "/risk" },
      ],
      INVENTORY_MANAGER: [
        { icon: Archive, label: "Inventory", to: "/inventory" },
      ],
    };

    const additionalItems =
// @ts-ignore
      roleBasedItems[user?.role as keyof typeof roleBasedItems] || [];

    return [...baseItems, ...additionalItems];
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "sidebar-2099 fixed left-0 top-0 h-screen z-50 flex flex-col",
          "bg-[radial-gradient(circle_at_top,_#00F0FF_0,_#020617_45%,_#000000_100%)]",
          "border-r border-[rgba(15,23,42,0.35)] shadow-sidebar",
          "transition-all duration-300 ease-in-out",
          isOpen ? "w-64" : "w-16",
          !isOpen && "sidebar-2099-collapsed",
          isMobile && !isOpen && "-translate-x-full",
          "lg:translate-x-0",
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[rgba(15,23,42,0.45)]/90 bg-gradient-to-r from-black/40 via-slate-900/60 to-black/40">
          {isOpen && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-cyan-300/70 bg-[radial-gradient(circle_at_top,_#00F0FF_0,_#020617_60%,_#000000_100%)] shadow-[0_0_18px_rgba(0,240,255,0.45)]">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight sidebar-2099-link-label">
                  AccuBooks
                </h1>
                <p className="text-[11px] uppercase tracking-[0.22em] sidebar-2099-section-title">
                  Enterprise 2099
                </p>
              </div>
            </div>
          )}

          <button
            onClick={onToggle}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {/* Main Navigation */}
          <SidebarSection title="Main" collapsed={!isOpen}>
            {navigationItems.slice(0, 5).map((item) => (
              <SidebarItem
                key={item.to}
                icon={item.icon}
                label={item.label}
                to={item.to}
                badge={item.badge}
                collapsed={!isOpen}
              />
            ))}
          </SidebarSection>

          {/* Role-Based Navigation */}
          {navigationItems.length > 5 && (
            <SidebarSection title="Advanced" collapsed={!isOpen}>
              {navigationItems.slice(5).map((item) => (
                <SidebarItem
                  key={item.to}
                  icon={item.icon}
                  label={item.label}
                  to={item.to}
                  collapsed={!isOpen}
                />
              ))}
            </SidebarSection>
          )}

          {/* Support */}
          <SidebarSection title="Support" collapsed={!isOpen}>
            <SidebarItem
              icon={Bell}
              label="Notifications"
              to="/notifications"
              badge="3"
              collapsed={!isOpen}
            />
            <SidebarItem
              icon={HelpCircle}
              label="Help Center"
              to="/help"
              collapsed={!isOpen}
            />
          </SidebarSection>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-[rgba(15,23,42,0.45)]/90 bg-black/30 backdrop-blur-sm">
          {isOpen ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center border border-cyan-300/70 bg-[radial-gradient(circle_at_top,_#00F0FF_0,_#020617_60%,_#000000_100%)] shadow-[0_0_14px_rgba(0,240,255,0.4)]">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium sidebar-2099-link-label truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-white/60 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {}}
                  className="flex-1 flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-red-300 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => {}}
                className="w-full p-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center justify-center"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={logout}
                className="w-full p-2 text-white/70 hover:text-red-300 hover:bg-white/5 rounded-lg transition-colors flex items-center justify-center"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
