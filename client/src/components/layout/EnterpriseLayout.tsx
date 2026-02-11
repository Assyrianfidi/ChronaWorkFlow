import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

// QuickBooks-Class Navigation Components
import { QuickBooksSidebar } from "./QuickBooksSidebar";
import { DesktopModeNav } from "./DesktopModeNav";
import { GlobalSearch } from "./GlobalSearch";
import { QuickCreateMenu } from "./QuickCreateMenu";
import { ThemeCustomizer } from "@/components/theme/ThemeCustomizer";
import {
  ViewSwitcherDropdown,
  ViewBadge,
} from "@/components/view/ViewSwitcher";

// UI Components
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/DropdownMenu";
import { Badge } from "@/components/ui/Badge";

// Icons
import {
  Bell,
  HelpCircle,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Building2,
  Monitor,
  Sparkles,
  Palette,
} from "lucide-react";

// Navigation Config Types
import {
  UserRole,
  SubscriptionTier,
  FeatureFlag,
} from "@/config/navigation.config";

// ============================================================================
// TYPES
// ============================================================================

interface EnterpriseLayoutProps {
  children: React.ReactNode;
  className?: string;
  theme?: "business" | "financial" | "command" | "desktop";
}

// ============================================================================
// MODE STORAGE
// ============================================================================

const NAV_MODE_KEY = "qb-navigation-mode";

type NavMode = "online" | "desktop";

// ============================================================================
// TOP BAR COMPONENT (For Online Mode)
// ============================================================================

interface TopBarProps {
  userRole: UserRole;
  subscription: SubscriptionTier;
  features: FeatureFlag[];
  onDesktopModeToggle: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  userRole,
  subscription,
  features,
  onDesktopModeToggle,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications] = useState(3);

  return (
    <header className="h-14 border-b bg-card flex items-center px-4 gap-4 shrink-0">
      {/* Left: Search */}
      <div className="flex-1 max-w-md">
        <GlobalSearch shortcut={true} />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Create */}
        <QuickCreateMenu />

        {/* Desktop Mode Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:flex items-center gap-2 text-muted-foreground"
          onClick={onDesktopModeToggle}
        >
          <Monitor className="h-4 w-4" />
          <span>Desktop Mode</span>
        </Button>

        {/* Theme Customizer */}
        <ThemeCustomizer />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                  {notifications}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span className="font-semibold">Notifications</span>
              <Badge variant="secondary" className="text-[10px]">
                {notifications} new
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-64 overflow-auto">
              <div className="px-3 py-2 hover:bg-accent cursor-pointer">
                <p className="text-sm font-medium">Invoice Overdue</p>
                <p className="text-xs text-muted-foreground">
                  INV-001 from Acme Corp is 5 days overdue
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  2 hours ago
                </p>
              </div>
              <div className="px-3 py-2 hover:bg-accent cursor-pointer">
                <p className="text-sm font-medium">Reconciliation Needed</p>
                <p className="text-xs text-muted-foreground">
                  Chase Checking account needs reconciliation
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  5 hours ago
                </p>
              </div>
              <div className="px-3 py-2 hover:bg-accent cursor-pointer">
                <p className="text-sm font-medium">Payroll Complete</p>
                <p className="text-xs text-muted-foreground">
                  Payroll run completed successfully
                </p>
                <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              AI Assistant
              <Badge variant="secondary" className="ml-auto text-[10px]">
                Beta
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/help/articles")}>
              Help Articles
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/help/tutorials")}>
              Training & Tutorials
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/help/community")}>
              Community Forums
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/help/contact")}>
              Contact Support
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/help/feedback")}>
              Send Feedback
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View Switcher */}
        <ViewSwitcherDropdown />

        {/* Settings */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/settings")}
        >
          <Settings className="h-5 w-5" />
        </Button>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 pl-2 pr-1"
            >
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium leading-none">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.role || "Owner"}
                </p>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-3 px-2 py-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{user?.name || "User Name"}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.email || "user@example.com"}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="mr-2 h-4 w-4" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings/company")}>
              <Building2 className="mr-2 h-4 w-4" />
              Company Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings/billing")}>
              <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
              Billing & Plan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

// ============================================================================
// MAIN ENTERPRISE LAYOUT
// ============================================================================

export const EnterpriseLayout: React.FC<EnterpriseLayoutProps> = ({
  children,
  className,
  theme = "business",
}) => {
  // Mode state
  const [navMode, setNavMode] = useState<NavMode>("online");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load saved mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(NAV_MODE_KEY);
    if (saved === "desktop" || saved === "online") {
      setNavMode(saved);
    }
  }, []);

  // Save mode when changed
  useEffect(() => {
    localStorage.setItem(NAV_MODE_KEY, navMode);
  }, [navMode]);

  // Toggle between modes
  const toggleNavMode = () => {
    setNavMode((prev) => (prev === "online" ? "desktop" : "online"));
  };

  // Mock user context - replace with real auth
  const userRole: UserRole = "OWNER";
  const subscription: SubscriptionTier = "ENTERPRISE";
  const features: FeatureFlag[] = [
    "PAYROLL",
    "TIME_TRACKING",
    "PROJECTS",
    "INVENTORY",
    "ADVANCED_REPORTING",
    "BUDGETING",
    "1099_FILING",
    "ACCOUNTANT_TOOLS",
  ];

  return (
    <div
      className={cn(
        "min-h-screen bg-background",
        theme === "desktop" && navMode === "desktop" && "bg-slate-50",
        className,
      )}
    >
      {navMode === "online" ? (
        // ONLINE MODE: Sidebar + Top Bar Layout
        <div className="flex h-screen overflow-hidden">
          {/* Left Sidebar */}
          <QuickBooksSidebar
            userRole={userRole}
            subscription={subscription}
            features={features}
            onCollapseChange={setSidebarCollapsed}
            desktopMode={false}
            onDesktopModeToggle={toggleNavMode}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Top Bar */}
            <TopBar
              userRole={userRole}
              subscription={subscription}
              features={features}
              onDesktopModeToggle={toggleNavMode}
            />

            {/* Page Content */}
            <main className="flex-1 overflow-auto bg-muted/30 p-6">
              <div className="max-w-7xl mx-auto">{children}</div>
            </main>
          </div>
        </div>
      ) : (
        // DESKTOP MODE: Classic Menu Bar Layout
        <div className="flex flex-col h-screen overflow-hidden">
          {/* Desktop Menu Bar */}
          <DesktopModeNav
            userRole={userRole}
            subscription={subscription}
            features={features}
            onSwitchToOnline={toggleNavMode}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-auto bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      )}
    </div>
  );
};

export default EnterpriseLayout;
