import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Users,
  CreditCard,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AccuBooksLogo } from "@/components/ui/AccuBooksLogo";

interface NavigationItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Transactions",
    href: "/transactions",
    icon: Receipt,
  },
  {
    title: "Invoices",
    href: "/invoices",
    icon: FileText,
    badge: "3",
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    title: "Expenses",
    href: "/expenses",
    icon: CreditCard,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: TrendingUp,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

interface PrimaryNavigationProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

const PrimaryNavigation = React.forwardRef<
  HTMLDivElement,
  PrimaryNavigationProps
>(({ collapsed = false, onToggleCollapse, className, ...props }, ref) => {
  const location = useLocation();

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col bg-background border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className,
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && <AccuBooksLogo variant="icon" className="w-8 h-8" />}
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-lg hover:bg-muted transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center",
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="font-medium">{item.title}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "ml-auto text-xs px-2 py-1 rounded-full",
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-foreground",
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        {!collapsed && (
          <div className="text-xs text-muted-foreground text-center">
            AccuBooks v1.0.0
          </div>
        )}
      </div>
    </div>
  );
});
PrimaryNavigation.displayName = "PrimaryNavigation";

export { PrimaryNavigation, type NavigationItem };
