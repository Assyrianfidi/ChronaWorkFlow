declare global {
  interface Window {
    [key: string]: any;
  }
}

import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { FeatureGate } from "@/components/features/FeatureGate";
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
        "sidebar-enterprise-link item group flex items-center gap-3 px-5 py-3 rounded-lg text-sidebar-foreground",
        "transition-all duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        isActive &&
          "sidebar-enterprise-link-active sidebar-enterprise-link-active-pulse active-item",
      )}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? label : undefined}
    >
      <Icon
        className={cn(
          "sidebar-enterprise-link-icon w-5 h-5 flex-shrink-0 transition-transform duration-300",
          "group-hover:scale-110",
        )}
      />
      {!collapsed && (
        <>
          <span className="sidebar-enterprise-link-label font-medium truncate text-sidebar-foreground">
            {label}
          </span>
          {badge && (
            <span className="sidebar-enterprise-badge ml-auto text-xs px-2 py-0.5">
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

const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  children,
  collapsed,
}) => {
  return (
    <div className="space-y-2 sidebar-enterprise-section">
      {!collapsed && (
        <h3 className="px-5 text-xs font-semibold uppercase tracking-[0.2em] sidebar-enterprise-section-title text-sidebar-foreground/80">
          {title}
        </h3>
      )}
      <div className="mt-1 space-y-1">{children}</div>
    </div>
  );
};

interface EnterpriseSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

export const EnterpriseSidebar: React.FC<EnterpriseSidebarProps> = ({
  isOpen,
  onOpenChange,
  className,
}) => {
  const { user, logout } = useAuth();
  const [isMobile, setIsMobile] = React.useState(false);

  const sidebarRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  React.useEffect(() => {
    if (!isMobile || !isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      onOpenChange(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobile, isOpen, onOpenChange]);

  React.useEffect(() => {
    if (!isMobile || !isOpen) return;
    requestAnimationFrame(() => {
      sidebarRef.current
        ?.querySelector<HTMLElement>("a,button,[href],[tabindex]:not([tabindex='-1'])")
        ?.focus();
    });
  }, [isMobile, isOpen]);

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
      roleBasedItems[user?.role as keyof typeof roleBasedItems] || [];

    return [...baseItems, ...additionalItems];
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <button
          type="button"
          tabIndex={-1}
          className="fixed inset-0 bg-foreground/50 z-40 lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => onOpenChange(false)}
          onKeyDown={(e) => {
            if (e.key !== "Escape") return;
            e.preventDefault();
            onOpenChange(false);
          }}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        id="enterprise-sidebar"
        className={cn(
          "sidebar-enterprise fixed left-0 top-0 h-screen z-50 flex flex-col",
          "bg-sidebar text-sidebar-foreground",
          "border-r border-sidebar-border shadow-sidebar",
          "transition-all duration-300 ease-in-out",
          isOpen ? "w-64" : "w-16",
          !isOpen && "sidebar-enterprise-collapsed",
          isMobile && !isOpen && "-translate-x-full",
          "lg:translate-x-0",
          className,
        )}
        aria-label="Primary sidebar navigation"
        onMouseEnter={() => {
          if (!isMobile) onOpenChange(true);
        }}
        onMouseLeave={() => {
          if (!isMobile) onOpenChange(false);
        }}
        onFocusCapture={() => {
          if (!isMobile) onOpenChange(true);
        }}
        onBlurCapture={(e) => {
          if (isMobile) return;
          const next = e.relatedTarget as Node | null;
          if (next && e.currentTarget.contains(next)) return;
          onOpenChange(false);
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border bg-sidebar">
          {isOpen && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-sidebar-border bg-sidebar-primary">
                <DollarSign className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight sidebar-enterprise-link-label">
                  AccuBooks
                </h1>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              if (!isMobile) return;
              onOpenChange(!isOpen);
            }}
            className="p-2 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={isOpen}
            aria-controls="enterprise-sidebar"
            aria-disabled={!isMobile || undefined}
            tabIndex={!isMobile ? -1 : undefined}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {/* Main Navigation */}
          <SidebarSection title="Main" collapsed={!isOpen}>
            <SidebarItem
              key="/dashboard"
              icon={LayoutDashboard}
              label="Dashboard"
              to="/dashboard"
              collapsed={!isOpen}
            />

            <FeatureGate feature="INVOICING">
              <SidebarItem
                key="/invoices"
                icon={FileText}
                label="Invoices"
                to="/invoices"
                badge="12"
                collapsed={!isOpen}
              />
            </FeatureGate>

            <FeatureGate feature="CUSTOMERS">
              <SidebarItem
                key="/customers"
                icon={Users}
                label="Customers"
                to="/customers"
                collapsed={!isOpen}
              />
            </FeatureGate>

            <FeatureGate feature="TRANSACTIONS">
              <SidebarItem
                key="/transactions"
                icon={CreditCard}
                label="Transactions"
                to="/transactions"
                collapsed={!isOpen}
              />
            </FeatureGate>

            <FeatureGate feature="REPORTS">
              <SidebarItem
                key="/reports"
                icon={Receipt}
                label="Reports"
                to="/reports"
                collapsed={!isOpen}
              />
            </FeatureGate>
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
        <div className="p-4 border-t border-sidebar-border bg-sidebar backdrop-blur-sm">
          {isOpen ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center border border-sidebar-border bg-sidebar-primary">
                  <span className="text-sm font-medium text-sidebar-primary-foreground">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium sidebar-enterprise-link-label truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-sidebar-foreground/70 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="flex-1 flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-sidebar-foreground/70"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground/70 hover:text-destructive hover:bg-sidebar-accent/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="w-full p-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/10 rounded-lg transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-sidebar-foreground/70"
                aria-label="Settings (disabled)"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={logout}
                className="w-full p-2 text-sidebar-foreground/70 hover:text-destructive hover:bg-sidebar-accent/10 rounded-lg transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                aria-label="Logout"
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
