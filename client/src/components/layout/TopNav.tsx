import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Settings, LogOut, User, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

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
      onSettingsClick,
      onNotificationsClick,
      ...props
    },
    ref,
  ) => {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
    const [notificationCount] = React.useState(3);
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
          "h-16 bg-background border-b border-border px-6 flex items-center justify-between sticky top-0 z-50",
          className,
        )}
        {...props}
      >
        {/* Logo Section */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">AB</span>
            </div>
            <span className="text-xl font-bold text-foreground">
              AccuBooks
            </span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button
            onClick={onNotificationsClick}
            className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Profile Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Profile menu"
            >
              {/* Avatar */}
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-accent-foreground font-medium text-sm">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                )}
              </div>

              {/* User Info */}
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>

              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  isProfileMenuOpen && "rotate-180",
                )}
              />
            </button>

            {/* Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-popover text-popover-foreground rounded-lg shadow-lg border border-border py-1 z-50">
                <Link
                  to="/profile"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <button
                  onClick={() => {
                    onSettingsClick?.();
                    setIsProfileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <div className="border-t border-border my-1" />
                <button
                  onClick={() => {
                    handleLogout();
                    setIsProfileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
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
