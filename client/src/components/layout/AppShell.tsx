declare global {
  interface Window {
    [key: string]: any;
  }
}

import * as React from "react";
import { Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PrimaryNavigation } from "./PrimaryNavigation";
import { TopBar } from "./TopBar";

interface AppShellProps {
  className?: string;
}

const useResponsiveLayout = () => {
  const [isMobile, setIsMobile] = React.useState(false);
  const [isTablet, setIsTablet] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(false);
  const [isLargeDesktop, setIsLargeDesktop] = React.useState(false);

  React.useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsTablet(width > 768 && width <= 1440);
      setIsDesktop(width > 1440 && width <= 1920);
      setIsLargeDesktop(width > 1920);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return { isMobile, isTablet, isDesktop, isLargeDesktop };
};

const AppShell = React.forwardRef<HTMLDivElement, AppShellProps>(
  ({ className, ...props }, ref) => {
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const { isMobile, isTablet, isDesktop, isLargeDesktop } =
      useResponsiveLayout();

    // Auto-collapse sidebar on mobile
    React.useEffect(() => {
      if (isMobile) {
        setSidebarCollapsed(true);
        setMobileMenuOpen(false);
      } else if (isTablet) {
        setSidebarCollapsed(false);
      } else if (isDesktop || isLargeDesktop) {
        setSidebarCollapsed(false);
      }
    }, [isMobile, isTablet, isDesktop, isLargeDesktop]);

    const handleToggleCollapse = () => {
      if (isMobile) {
        setMobileMenuOpen(!mobileMenuOpen);
      } else {
        setSidebarCollapsed(!sidebarCollapsed);
      }
    };

    const handleToggleMobileMenu = () => {
      setMobileMenuOpen(!mobileMenuOpen);
    };

    return (
      <div
        ref={ref}
        className={cn("flex h-screen bg-background", className)}
        {...props}
      >
        {/* Sidebar - Desktop */}
        {!isMobile && (
          <PrimaryNavigation
            collapsed={sidebarCollapsed}
            onToggleCollapse={handleToggleCollapse}
            className={cn(
              "hidden md:flex",
              isTablet && "fixed left-0 top-0 h-full z-40",
              (isDesktop || isLargeDesktop) && "relative",
            )}
          />
        )}

        {/* Mobile Sidebar Overlay */}
        {isMobile && mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-foreground/50 z-30"
              onClick={() => setMobileMenuOpen(false)}
            />
            <PrimaryNavigation
              collapsed={false}
              onToggleCollapse={handleToggleCollapse}
              className="fixed left-0 top-0 h-full z-40 md:hidden"
            />
          </>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <TopBar
            onToggleMobileMenu={handleToggleMobileMenu}
            className={cn(
              "sticky top-0 z-20",
              isMobile && mobileMenuOpen && "hidden",
            )}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-auto p-6 bg-background">
            <Outlet />
          </main>
        </div>

        {/* KPI Quick Cards - Large Desktop Only */}
        {isLargeDesktop && !sidebarCollapsed && (
          <div className="w-80 bg-card text-card-foreground border-l border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Quick Insights
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="text-2xl font-bold text-primary">$124,563</div>
                <div className="text-sm text-primary">Monthly Revenue</div>
              </div>
              <div className="p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <div className="text-2xl font-bold text-secondary">$45,231</div>
                <div className="text-sm text-secondary">
                  Accounts Receivable
                </div>
              </div>
              <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                <div className="text-2xl font-bold text-accent">12</div>
                <div className="text-sm text-accent">Pending Invoices</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);
AppShell.displayName = "AppShell";

export { AppShell, useResponsiveLayout };
