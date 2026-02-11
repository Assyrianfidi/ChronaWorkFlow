import * as React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  TrendingUp,
  Settings,
  BarChart3,
  Building2,
  Receipt,
  Calculator,
  Briefcase,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  isOpen = false,
  onClose,
}) => {
  const location = useLocation();
  const { user, hasRole } = useAuth();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  const roleLabel = React.useMemo(() => {
    const role = user?.role;
    if (!role) return "";
    return role
      .split("_")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }, [user?.role]);

  const filteredNavigationItems = React.useMemo(() => {
    return navigationItems.filter((item) => {
      if (!item.roles || item.roles.length === 0) return true;
      return hasRole(item.roles as any);
    });
  }, [hasRole]);

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
        "group h-full border-r border-border bg-card text-foreground flex flex-col",
        "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 md:static md:transform-none",
        "md:w-16 md:hover:w-64 md:focus-within:w-64 md:transition-[width] md:duration-200",
        !isOpen && "-translate-x-full md:translate-x-0",
        className,
      )}
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">
              AB
            </span>
          </div>
          <span className="text-xl font-bold text-foreground md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 md:transition-opacity">
            AccuBooks
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
        {filteredNavigationItems.map((item) => {
          const active = isParentActive(item);
          const expanded = expandedItems.includes(item.title);
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.title}>
              <NavLink
                to={item.href}
                onClick={() => {
                  if (hasChildren) {
                    toggleExpanded(item.title);
                    return;
                  }
                  onClose?.();
                }}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors group",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 md:transition-opacity">
                    {item.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span
                      className={cn(
                        "px-2 py-1 text-xs rounded-full",
                        active
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground",
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
                        onClick={() => onClose?.()}
                        className={cn(
                          "flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors group",
                          childActive
                            ? "bg-accent text-accent-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        )}
                      >
                        <child.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 md:transition-opacity">
                          {child.title}
                        </span>
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
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 md:justify-center md:gap-0 md:group-hover:justify-start md:group-hover:gap-3 md:group-focus-within:justify-start md:group-focus-within:gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-medium text-sm">
              {user?.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 md:transition-opacity">
              {user?.name}
            </p>
            <p className="text-xs text-muted-foreground truncate md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 md:transition-opacity">
              {roleLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

Sidebar.displayName = "Sidebar";

export { Sidebar };
