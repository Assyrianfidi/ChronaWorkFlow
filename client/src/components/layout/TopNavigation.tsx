declare global {
  interface Window {
    [key: string]: any;
  }
}

import * as React from "react";
import { Search, Bell, Settings, User, Menu, X, Moon, Sun } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { EnterpriseButton } from "@/components/ui/EnterpriseButton";
import { EnterpriseInput } from "@/components/ui/EnterpriseInput";
import { cn } from "@/lib/utils";

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

    const notificationsButtonRef = React.useRef<HTMLButtonElement>(null);
    const notificationsMenuRef = React.useRef<HTMLDivElement>(null);
    const userMenuButtonRef = React.useRef<HTMLButtonElement>(null);
    const userMenuRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (!showNotifications && !showUserMenu) return;

      const onPointerDown = (e: MouseEvent | TouchEvent) => {
        const target = e.target as Node | null;
        if (!target) return;

        if (
          showNotifications &&
          !notificationsButtonRef.current?.contains(target) &&
          !notificationsMenuRef.current?.contains(target)
        ) {
          setShowNotifications(false);
        }

        if (
          showUserMenu &&
          !userMenuButtonRef.current?.contains(target) &&
          !userMenuRef.current?.contains(target)
        ) {
          setShowUserMenu(false);
        }
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key !== "Escape") return;
        if (showNotifications) {
          setShowNotifications(false);
          notificationsButtonRef.current?.focus();
          return;
        }
        if (showUserMenu) {
          setShowUserMenu(false);
          userMenuButtonRef.current?.focus();
        }
      };

      document.addEventListener("mousedown", onPointerDown);
      document.addEventListener("touchstart", onPointerDown);
      document.addEventListener("keydown", onKeyDown);
      return () => {
        document.removeEventListener("mousedown", onPointerDown);
        document.removeEventListener("touchstart", onPointerDown);
        document.removeEventListener("keydown", onKeyDown);
      };
    }, [showNotifications, showUserMenu]);

    React.useEffect(() => {
      if (!showNotifications) return;
      requestAnimationFrame(() => {
        notificationsMenuRef.current
          ?.querySelector<HTMLElement>(
            "button,[href],[tabindex]:not([tabindex='-1'])",
          )
          ?.focus();
      });
    }, [showNotifications]);

    React.useEffect(() => {
      if (!showUserMenu) return;
      requestAnimationFrame(() => {
        userMenuRef.current
          ?.querySelector<HTMLElement>(
            "button,[href],[tabindex]:not([tabindex='-1'])",
          )
          ?.focus();
      });
    }, [showUserMenu]);

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
          "fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground shadow-lg",
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
              className="text-primary-foreground hover:bg-primary-foreground/10"
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
                <span className="text-accent-foreground font-bold text-sm">
                  A
                </span>
              </div>
              <h1 className="text-xl font-bold">AccuBooks</h1>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-foreground/70 h-4 w-4" />
              <EnterpriseInput
                placeholder="Search transactions, customers, invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60 focus:bg-primary-foreground/15 focus:border-primary-foreground/30"
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
              className="text-primary-foreground hover:bg-primary-foreground/10"
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
                ref={notificationsButtonRef}
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-primary-foreground hover:bg-primary-foreground/10 relative"
                icon={<Bell className="h-5 w-5" />}
                aria-label="Notifications"
                aria-haspopup="menu"
                aria-expanded={showNotifications}
                aria-controls="topnav-notifications-menu"
              />
              {notifications.filter((n) => !n.read).length > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full border-2 border-primary"
                />
              )}

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div
                  ref={notificationsMenuRef}
                  id="topnav-notifications-menu"
                  role="menu"
                  aria-label="Notifications"
                  className="absolute right-0 mt-2 w-80 bg-popover text-popover-foreground border border-border rounded-lg shadow-xl z-50"
                >
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold text-foreground">
                      Notifications
                    </h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <EmptyState size="sm" title="No notifications" />
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          className={cn(
                            "w-full text-left p-4 border-b border-border hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background",
                            !notification.read && "bg-accent/10",
                          )}
                          role="menuitem"
                          aria-label={`${notification.title}. ${notification.message}. ${notification.time}.`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              aria-hidden="true"
                              className={cn(
                                "w-2 h-2 rounded-full mt-2",
                                notification.read
                                  ? "bg-muted-foreground/40"
                                  : "bg-accent",
                              )}
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground text-sm">
                                {notification.title}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-border">
                    <EnterpriseButton
                      variant="ghost"
                      size="sm"
                      className="w-full text-secondary"
                      onClick={() => setShowNotifications(false)}
                    >
                      Mark all as read
                    </EnterpriseButton>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <EnterpriseButton
                ref={userMenuButtonRef}
                variant="ghost"
                size="sm"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="text-primary-foreground hover:bg-primary-foreground/10 flex items-center gap-2"
                aria-label="User menu"
                aria-haspopup="menu"
                aria-expanded={showUserMenu}
                aria-controls="topnav-user-menu"
              >
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-accent-foreground" />
                </div>
                <span className="hidden md:block text-sm">Admin User</span>
              </EnterpriseButton>

              {/* User Dropdown */}
              {showUserMenu && (
                <div
                  ref={userMenuRef}
                  id="topnav-user-menu"
                  role="menu"
                  aria-label="User menu"
                  className="absolute right-0 mt-2 w-48 bg-popover text-popover-foreground border border-border rounded-lg shadow-xl z-50"
                >
                  <div className="p-3 border-b border-border">
                    <p className="font-medium text-foreground">Admin User</p>
                    <p className="text-xs text-muted-foreground">
                      admin@accubooks.com
                    </p>
                  </div>
                  <div className="py-2">
                    {userMenuItems.map((item, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={item.action}
                        className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background"
                        role="menuitem"
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
