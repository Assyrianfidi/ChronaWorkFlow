import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/DropdownMenu";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  Landmark,
  BarChart3,
  List,
  HelpCircle,
  ChevronDown,
  Monitor,
  LayoutTemplate,
  Sparkles,
} from "lucide-react";
import { GlobalSearch } from "./GlobalSearch";
import { QuickCreateMenu } from "./QuickCreateMenu";
import {
  UserRole,
  SubscriptionTier,
  FeatureFlag,
  DESKTOP_MODE_NAV,
  filterNavigation,
} from "@/config/navigation.config";

// ============================================================================
// DESKTOP MODE NAVIGATION (Classic QuickBooks Desktop Style)
// ============================================================================

interface DesktopModeNavProps {
  userRole?: UserRole;
  subscription?: SubscriptionTier;
  features?: FeatureFlag[];
  onSwitchToOnline?: () => void;
}

export const DesktopModeNav: React.FC<DesktopModeNavProps> = ({
  userRole = "OWNER",
  subscription = "ENTERPRISE",
  features = ["PAYROLL", "TIME_TRACKING", "PROJECTS", "INVENTORY"],
  onSwitchToOnline,
}) => {
  const location = useLocation();
  const [helpOpen, setHelpOpen] = useState(false);

  // Filter navigation based on permissions
  const filteredNav = filterNavigation(
    DESKTOP_MODE_NAV,
    userRole,
    subscription,
    features,
  );

  return (
    <div className="flex items-center h-14 px-4 border-b bg-background">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mr-6">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">AB</span>
        </div>
        <div className="hidden md:block">
          <span className="font-bold text-lg">AccuBooks</span>
          <span className="text-xs text-muted-foreground ml-1">Desktop</span>
        </div>
      </Link>

      {/* Classic Menu Bar */}
      <nav className="hidden lg:flex items-center gap-1">
        {filteredNav.map((menu) => (
          <DropdownMenu key={menu.id}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-3 font-medium",
                  location.pathname.startsWith(menu.path) &&
                    "bg-accent text-accent-foreground",
                )}
              >
                {menu.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel className="flex items-center gap-2">
                <menu.icon className="h-4 w-4" />
                {menu.label}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {menu.children?.map((item) => (
                <React.Fragment key={item.id}>
                  {item.divider ? (
                    <DropdownMenuSeparator />
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link
                        to={item.path}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span>{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}

        {/* Help Menu */}
        <DropdownMenu open={helpOpen} onOpenChange={setHelpOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-3 font-medium">
              Help
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Help & Support
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              AI Assistant
              <Badge variant="secondary" className="ml-auto text-[10px]">
                New
              </Badge>
            </DropdownMenuItem>
            <DropdownMenuItem>Help Articles</DropdownMenuItem>
            <DropdownMenuItem>Contact Support</DropdownMenuItem>
            <DropdownMenuItem>Training & Tutorials</DropdownMenuItem>
            <DropdownMenuItem>Community Forums</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Keyboard Shortcuts</DropdownMenuItem>
            <DropdownMenuItem>Send Feedback</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      {/* Right Side */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Search */}
        <div className="hidden md:block w-64">
          <GlobalSearch variant="compact" />
        </div>

        {/* Quick Create */}
        <QuickCreateMenu size="sm" />

        {/* Mode Switcher */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:flex items-center gap-1.5 text-muted-foreground"
          onClick={onSwitchToOnline}
        >
          <LayoutTemplate className="h-4 w-4" />
          <span>Online Mode</span>
        </Button>

        {/* Mobile Menu */}
        <div className="lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <ChevronDown className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {filteredNav.map((menu) => (
                <DropdownMenuSub key={menu.id}>
                  <DropdownMenuSubTrigger className="flex items-center gap-2">
                    <menu.icon className="h-4 w-4" />
                    {menu.label}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48">
                    {menu.children?.map((item) => (
                      <DropdownMenuItem key={item.id} asChild>
                        <Link
                          to={item.path}
                          className="flex items-center gap-2"
                        >
                          {item.icon && <item.icon className="h-4 w-4" />}
                          <span>{item.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default DesktopModeNav;
