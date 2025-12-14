declare global {
  interface Window {
    [key: string]: any;
  }
}

import React, { useState } from "react";
import * as React from "react";
import { Outlet } from "react-router-dom";
import { cn } from "@/../../lib/utils";
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
        className={cn("flex h-screen bg-gray-50", className)}
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
              className="fixed inset-0 bg-black/50 z-30"
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
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>

        {/* KPI Quick Cards - Large Desktop Only */}
        {isLargeDesktop && !sidebarCollapsed && (
          <div className="w-80 bg-white border-l border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Insights
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">$124,563</div>
                <div className="text-sm text-blue-600">Monthly Revenue</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">$45,231</div>
                <div className="text-sm text-green-600">
                  Accounts Receivable
                </div>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="text-2xl font-bold text-amber-600">12</div>
                <div className="text-sm text-amber-600">Pending Invoices</div>
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
