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
      <header className="bg-surface0 border-b border-border-gray shadow-soft">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          {/* Left: logo + title + mobile hamburger */}
          <div className="flex items-center gap-4">
            <button
              aria-label="Open sidebar"
              onClick={onSidebarToggle}
              className="p-2 rounded-md text-black/80 hover:text-black hover:bg-surface1/60 lg:hidden"
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
                <div className="text-sm font-semibold text-black">
                  AccuBooks
                </div>
                <div className="text-xs opacity-70">Enterprise 2099</div>
              </div>
            </div>
          </div>

          {/* Center: search (collapses on mobile) */}
          <div className="flex-1 px-4 hidden md:flex items-center justify-center">
            <div className="w-full max-w-2xl">
              <label className="relative block">
                <span className="sr-only">Search</span>
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-black/50" />
                </span>
                <input
                  className={cn(
                    "w-full bg-surface1 border border-border-gray rounded-full py-2 px-10 text-black placeholder:opacity-50",
                    "focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-300/20",
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
              className="md:hidden p-2 rounded-full bg-surface1 border border-border-gray text-black/80"
              aria-label="Open search"
              onClick={() => setMobileOpen(true)}
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notifications */}
            <button
              className="p-2 rounded-full bg-surface1 border border-border-gray text-black/80 hover:shadow-elevated transition"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>

            {/* Help */}
            <button
              className="hidden md:inline-flex p-2 rounded-full bg-surface1 border border-border-gray text-black/80 hover:shadow-elevated transition"
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
              className="inline-flex p-2 rounded-full bg-surface1 border border-border-gray text-black/80 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open mobile drawer"
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
