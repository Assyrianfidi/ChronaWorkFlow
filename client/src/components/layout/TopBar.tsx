import * as React from "react";
import { Link } from "react-router-dom";
import { Search, Bell, User, LogOut, Building } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopBarProps {
  className?: string;
  onToggleMobileMenu?: () => void;
}

const TopBar = React.forwardRef<HTMLDivElement, TopBarProps>(
  ({ className, onToggleMobileMenu, ...props }, ref) => {
    const [showProfileMenu, setShowProfileMenu] = React.useState(false);

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between px-6 py-4 bg-background border-b border-border",
          className,
        )}
        {...props}
      >
        {/* Mobile Menu Toggle */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />

            <label htmlFor="input-pb4bkjpi4" className="sr-only">
              Text
            </label>
            <input
              id="input-pb4bkjpi4"
              type="text"
              placeholder="Search transactions, invoices, customers..."
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </button>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-accent-foreground" />
              </div>
              <span className="hidden md:block text-sm font-medium text-foreground">
                John Doe
              </span>
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-popover text-popover-foreground rounded-lg shadow-lg border border-border py-2 z-50">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
                >
                  <User className="w-4 h-4" />
                  Account
                </Link>
                <Link
                  to="/company"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
                >
                  <Building className="w-4 h-4" />
                  Company
                </Link>
                <hr className="my-2 border-border" />
                <button className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted w-full text-left">
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
TopBar.displayName = "TopBar";

export { TopBar };
