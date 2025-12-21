import * as React from "react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";
import { Bell, Search, HelpCircle, Menu } from "lucide-react";
import ProfileMenu from "./ProfileMenu";
import MobileDrawer from "./MobileDrawer";
import LogoImg from "../../assets/AccubooksEnterprise_Logo16_.jpg";

// existing UserMenu, NotificationItem, and NotificationCenter logic has been
// replaced by a slimmer EnterpriseHeader shell that delegates profile/logout
// behavior to the new ProfileMenu and MobileDrawer components.

// previous NotificationCenter implementation removed in favor of a lighter
// notification button that maintains the same Bell icon semantics.

interface EnterpriseHeaderProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  onSidebarToggle: () => void;
  sidebarOpen: boolean;
}

export const EnterpriseHeader: React.FC<EnterpriseHeaderProps> = ({
  user,
  onSidebarToggle,
  sidebarOpen,
}) => {
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <>
      <header className="bg-background border-b border-border shadow-soft">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          {/* Left: logo + title + mobile hamburger */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Open sidebar"
              onClick={onSidebarToggle}
              aria-expanded={sidebarOpen}
              aria-controls="enterprise-sidebar"
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <img
                src={LogoImg}
                alt="AccuBooks"
                className="h-8 w-8 rounded-md object-contain"
              />
              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-foreground">
                  AccuBooks
                </div>
              </div>
            </div>
          </div>

          {/* Center: search (collapses on mobile) */}
          <div className="flex-1 px-4 hidden md:flex items-center justify-center">
            <div className="w-full max-w-2xl">
              <label className="relative block">
                <span className="sr-only">Search</span>
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-muted-foreground" />
                </span>
                <input
                  id="input-jh5eydkwq"
                  className={cn(
                    "w-full bg-background border border-input rounded-full py-2 px-10 text-foreground placeholder:text-muted-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  )}
                  placeholder="Search reports, transactions, users..."
                  type="search"
                />
              </label>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-3">
            {/* Search button for mobile */}
            <button
              type="button"
              className="md:hidden p-2 rounded-full bg-background border border-border text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Open search"
              onClick={() => setMobileOpen(true)}
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notifications */}
            <button
              type="button"
              className="p-2 rounded-full bg-background border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>

            {/* Help */}
            <button
              type="button"
              className="hidden md:inline-flex p-2 rounded-full bg-background border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Help"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Profile menu */}
            {user && (
              <ProfileMenu
                user={{
                  name: user.name,
                  email: user.email,
                  avatar: user.avatar,
                }}
                onLogout={logout}
              />
            )}

            {/* Mobile menu toggle to open drawer */}
            <button
              type="button"
              className="inline-flex p-2 rounded-full bg-background border border-border text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={() => setMobileOpen(true)}
              aria-label="Open mobile drawer"
              aria-haspopup="dialog"
              aria-expanded={mobileOpen}
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlays search + nav + profile shortcuts */}
      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user ? { name: user.name, email: user.email } : undefined}
        onLogout={logout}
      />
    </>
  );
};
