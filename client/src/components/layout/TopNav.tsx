import React, { useState } from "react";
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Settings, LogOut, User, ChevronDown } from "lucide-react";
import { cn } from "@/../../lib/utils";
import { EnterpriseButton } from "@/components/ui/EnterpriseButton";
import { useAuth } from "@/../../contexts/AuthContext";

interface TopNavProps {
  className?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onNotificationsClick?: () => void;
}

const TopNav = React.forwardRef<HTMLDivElement, TopNavProps>(
  (
    {
      className,
      user = {
        name: "John Doe",
        email: "john@accubooks.com",
        role: "Administrator",
      },
      onProfileClick,
      onSettingsClick,
      onNotificationsClick,
      ...props
    },
    ref,
  ) => {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
    const [notificationCount, setNotificationCount] = React.useState(3);
    const { logout } = useAuth();
    const navigate = useNavigate();

    const menuRef = React.useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          menuRef.current &&
          !menuRef.current.contains(event.target as Node)
        ) {
          setIsProfileMenuOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
      logout();
      navigate("/login");
    };

    return (
      <div
        ref={ref}
        className={cn(
          "h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-50",
          className,
        )}
        {...props}
      >
        {/* Logo Section */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-enterprise-navy rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AB</span>
            </div>
            <span className="text-xl font-bold text-enterprise-navy">
              AccuBooks
            </span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button
            onClick={onNotificationsClick}
            className="relative p-2 text-gray-600 hover:text-enterprise-navy hover:bg-gray-50 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Profile Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
              aria-label="Profile menu"
            >
              {/* Avatar */}
              <div className="w-8 h-8 bg-ocean-accent rounded-full flex items-center justify-center">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-medium text-sm">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                )}
              </div>

              {/* User Info */}
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>

              <ChevronDown
                className={cn(
                  "w-4 h-4 text-gray-500 transition-transform",
                  isProfileMenuOpen && "rotate-180",
                )}
              />
            </button>

            {/* Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <Link
                  to="/profile"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <button
                  onClick={() => {
                    onSettingsClick?.();
                    setIsProfileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <div className="border-t border-gray-200 my-1" />
                <button
                  onClick={() => {
                    handleLogout();
                    setIsProfileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);
TopNav.displayName = "TopNav";

export { TopNav };
