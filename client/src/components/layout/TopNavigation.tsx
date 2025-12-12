
declare global {
  interface Window {
    [key: string]: any;
  }
}

import React, { useState } from 'react';
// @ts-ignore
import * as React from "react";
import { Search, Bell, Settings, User, Menu, X, Moon, Sun } from "lucide-react";
// @ts-ignore
import { EnterpriseButton } from '../ui/EnterpriseButton.js.js';
// @ts-ignore
import { EnterpriseInput } from '../ui/EnterpriseInput.js.js';
// @ts-ignore
import { cn } from '../../lib/utils.js.js';

interface TopNavigationProps {
  onSidebarToggle?: () => void;
  sidebarOpen?: boolean;
  className?: string;
}

const TopNavigation = React.forwardRef<HTMLDivElement, TopNavigationProps>(
  ({ onSidebarToggle, sidebarOpen = true, className }, ref) => {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [showUserMenu, setShowUserMenu] = React.useState(false);
    const [showNotifications, setShowNotifications] = React.useState(false);
    const [darkMode, setDarkMode] = React.useState(false);

    React.useEffect(() => {
      // Check for saved theme preference or default to light mode
      const savedTheme = localStorage.getItem("theme");
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      const shouldUseDark =
        savedTheme === "dark" || (!savedTheme && prefersDark);

      setDarkMode(shouldUseDark);
      document.documentElement.setAttribute(
        "data-theme",
        shouldUseDark ? "dark" : "light",
      );
    }, []);

    const toggleDarkMode = () => {
      const newDarkMode = !darkMode;
      setDarkMode(newDarkMode);
      document.documentElement.setAttribute(
        "data-theme",
        newDarkMode ? "dark" : "light",
      );
      localStorage.setItem("theme", newDarkMode ? "dark" : "light");
    };

    const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      // Implement search functionality
      console.log("Searching for:", searchQuery);
    };

    // Mock data
    const notifications = [
      {
        id: 1,
        title: "New invoice created",
        message: "Invoice INV-001 has been created",
        time: "5 min ago",
        read: false,
      },
      {
        id: 2,
        title: "Payment received",
        message: "Payment of $2,500 received from ABC Corp",
        time: "1 hour ago",
        read: false,
      },
      {
        id: 3,
        title: "System update",
        message: "System maintenance scheduled for tonight",
        time: "3 hours ago",
        read: true,
      },
    ];

    const userMenuItems = [
      {
        label: "Profile",
        icon: <User className="h-4 w-4" />,
        action: () => console.log("Profile"),
      },
      {
        label: "Settings",
        icon: <Settings className="h-4 w-4" />,
        action: () => console.log("Settings"),
      },
      {
        label: "Sign out",
        icon: <X className="h-4 w-4" />,
        action: () => console.log("Sign out"),
      },
    ];

    return (
      <header
        ref={ref}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-primary text-white shadow-lg",
          className,
        )}
      >
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo and Sidebar Toggle */}
          <div className="flex items-center gap-4">
            <EnterpriseButton
              variant="ghost"
              size="sm"
              onClick={onSidebarToggle}
              className="text-white hover:bg-white/10"
              icon={
                sidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )
              }
            />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <h1 className="text-xl font-bold">AccuBooks</h1>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <EnterpriseInput
                placeholder="Search transactions, customers, invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-white/60 focus:bg-white/20 focus:border-white/40"
                icon={<Search className="h-4 w-4" />}
                iconPosition="left"
              />
            </div>
          </form>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle */}
            <EnterpriseButton
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="text-white hover:bg-white/10"
              icon={
                darkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )
              }
            />

            {/* Notifications */}
            <div className="relative">
              <EnterpriseButton
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-white hover:bg-white/10 relative"
                icon={<Bell className="h-5 w-5" />}
              />
              {notifications.filter((n) => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-danger rounded-full border-2 border-primary" />
              )}

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-surface border border-gray-200 rounded-lg shadow-xl z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-primary">
                      Notifications
                    </h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            "p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer",
                            !notification.read && "bg-blue-50",
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full mt-2",
                                notification.read ? "bg-gray-300" : "bg-accent",
                              )}
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-primary text-sm">
                                {notification.title}
                              </h4>
                              <p className="text-xs text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-200">
                    <EnterpriseButton
                      variant="ghost"
                      size="sm"
                      className="w-full text-secondary"
                      onClick={() => setShowNotifications(false)}
                    >
                      {/* @ts-ignore */}
                      Mark all as read
                    </EnterpriseButton>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <EnterpriseButton
                variant="ghost"
                size="sm"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="text-white hover:bg-white/10 flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="hidden md:block text-sm">Admin User</span>
              </EnterpriseButton>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-surface border border-gray-200 rounded-lg shadow-xl z-50">
                  <div className="p-3 border-b border-gray-200">
                    <p className="font-medium text-primary">Admin User</p>
                    <p className="text-xs text-gray-500">admin@accubooks.com</p>
                  </div>
                  <div className="py-2">
                    {userMenuItems.map((item, index) => (
                      <button
                        key={index}
                        onClick={item.action}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  },
);
TopNavigation.displayName = "TopNavigation";

export { TopNavigation };
