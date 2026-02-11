import React, { useState, useCallback, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Separator } from "@/components/ui/separator";
import {
  ChevronRight,
  ChevronLeft,
  Monitor,
  LayoutTemplate,
  Sparkles,
  Pin,
  PinOff,
} from "lucide-react";
import {
  MAIN_NAVIGATION,
  ACCOUNTANT_NAV,
  UserRole,
  SubscriptionTier,
  FeatureFlag,
  NavItem,
  NavChild,
  filterNavigation,
} from "@/config/navigation.config";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface QuickBooksSidebarProps {
  userRole?: UserRole;
  subscription?: SubscriptionTier;
  features?: FeatureFlag[];
  onCollapseChange?: (collapsed: boolean) => void;
  defaultCollapsed?: boolean;
  desktopMode?: boolean;
  onDesktopModeToggle?: () => void;
}

interface SidebarSectionProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  userRole: UserRole;
  subscription: SubscriptionTier;
  features: FeatureFlag[];
  onNavigate: () => void;
}

// ============================================================================
// COLLAPSE STATE PERSISTENCE
// ============================================================================

const COLLAPSE_STORAGE_KEY = "qb-sidebar-collapsed";
const EXPANDED_SECTIONS_KEY = "qb-sidebar-expanded-sections";

// ============================================================================
// SIDEBAR SECTION COMPONENT (Individual Menu Item)
// ============================================================================

const SidebarSection: React.FC<SidebarSectionProps> = ({
  item,
  isActive,
  isCollapsed,
  userRole,
  subscription,
  features,
  onNavigate,
}) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(isActive);
  const Icon = item.icon;

  // Check if any child is active
  const hasActiveChild = item.children?.some(
    (child) =>
      location.pathname === child.path ||
      location.pathname.startsWith(child.path + "/"),
  );

  // Update open state when active state changes
  useEffect(() => {
    if (isActive || hasActiveChild) {
      setIsOpen(true);
    }
  }, [isActive, hasActiveChild]);

  // Save expanded sections to localStorage
  useEffect(() => {
    const saved = localStorage.getItem(EXPANDED_SECTIONS_KEY);
    const expanded = saved ? JSON.parse(saved) : {};
    if (isOpen) {
      expanded[item.id] = true;
    } else {
      delete expanded[item.id];
    }
    localStorage.setItem(EXPANDED_SECTIONS_KEY, JSON.stringify(expanded));
  }, [isOpen, item.id]);

  // Load expanded sections on mount
  useEffect(() => {
    const saved = localStorage.getItem(EXPANDED_SECTIONS_KEY);
    if (saved) {
      const expanded = JSON.parse(saved);
      if (expanded[item.id]) {
        setIsOpen(true);
      }
    }
  }, [item.id]);

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(!isOpen);
    },
    [isOpen],
  );

  // Filter children based on permissions
  const visibleChildren = item.children?.filter((child) => {
    if (child.roles && !child.roles.includes(userRole)) return false;
    if (child.subscription && !child.subscription.includes(subscription))
      return false;
    if (child.featureFlag && !features.includes(child.featureFlag))
      return false;
    return true;
  });

  const hasChildren = visibleChildren && visibleChildren.length > 0;

  // Collapsed mode - show tooltip with full menu
  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive &&
                  "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.badge && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="w-64 p-0">
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4" />
                <span className="font-semibold">{item.label}</span>
              </div>
              {item.description && (
                <p className="text-xs text-muted-foreground mb-2">
                  {item.description}
                </p>
              )}
              {hasChildren && (
                <div className="space-y-1 mt-2">
                  {visibleChildren.map((child) => (
                    <Link
                      key={child.id}
                      to={child.path}
                      className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent"
                      onClick={onNavigate}
                    >
                      {child.icon && <child.icon className="h-3.5 w-3.5" />}
                      <span>{child.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Expanded mode
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="relative">
        <Link
          to={item.path}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isActive &&
              "bg-sidebar-primary/10 text-sidebar-primary border-l-2 border-sidebar-primary",
            !isActive && "text-sidebar-foreground/80",
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5 flex-shrink-0",
              isActive && "text-sidebar-primary",
            )}
          />
          <span className="flex-1 truncate">{item.label}</span>

          {/* Badge */}
          {item.badge && (
            <Badge
              variant={isActive ? "default" : "secondary"}
              className="h-5 px-1.5 text-[10px]"
            >
              {item.badge}
            </Badge>
          )}

          {/* Beta badge */}
          {item.isBeta && (
            <Badge
              variant="outline"
              className="h-5 px-1.5 text-[10px] border-amber-500 text-amber-600"
            >
              Beta
            </Badge>
          )}

          {/* New badge */}
          {item.isNew && !item.isBeta && (
            <Badge
              variant="outline"
              className="h-5 px-1.5 text-[10px] border-emerald-500 text-emerald-600"
            >
              New
            </Badge>
          )}

          {/* Expand/collapse chevron */}
          {hasChildren && (
            <CollapsibleTrigger asChild onClick={handleToggle}>
              <button
                className="p-0.5 rounded hover:bg-sidebar-accent/50"
                onClick={handleToggle}
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isOpen && "rotate-90",
                  )}
                />
              </button>
            </CollapsibleTrigger>
          )}
        </Link>

        {/* Children submenu */}
        {hasChildren && (
          <CollapsibleContent>
            <div className="ml-4 pl-3 border-l border-sidebar-border/50 space-y-0.5 mt-1">
              {visibleChildren.map((child) => {
                const isChildActive =
                  location.pathname === child.path ||
                  location.pathname.startsWith(child.path + "/");
                return (
                  <Link
                    key={child.id}
                    to={child.path}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                      "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                      isChildActive
                        ? "bg-sidebar-accent/30 text-sidebar-primary font-medium"
                        : "text-sidebar-foreground/60",
                    )}
                  >
                    {child.icon && (
                      <child.icon className="h-3.5 w-3.5 flex-shrink-0" />
                    )}
                    <span className="truncate">{child.label}</span>
                    {child.shortcut && (
                      <kbd className="ml-auto hidden xl:inline-block h-5 px-1.5 text-[10px] font-medium bg-sidebar-accent rounded border">
                        {child.shortcut}
                      </kbd>
                    )}
                  </Link>
                );
              })}
            </div>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
};

// ============================================================================
// MAIN SIDEBAR COMPONENT
// ============================================================================

export const QuickBooksSidebar: React.FC<QuickBooksSidebarProps> = ({
  userRole = "OWNER",
  subscription = "ENTERPRISE",
  features = [
    "PAYROLL",
    "TIME_TRACKING",
    "PROJECTS",
    "INVENTORY",
    "ADVANCED_REPORTING",
  ],
  onCollapseChange,
  defaultCollapsed = false,
  desktopMode = false,
  onDesktopModeToggle,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isPinned, setIsPinned] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  // Load collapse state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(COLLAPSE_STORAGE_KEY);
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save collapse state
  useEffect(() => {
    localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify(isCollapsed));
    onCollapseChange?.(isCollapsed);
  }, [isCollapsed, onCollapseChange]);

  // Filter navigation based on permissions
  const filteredNav = filterNavigation(
    MAIN_NAVIGATION,
    userRole,
    subscription,
    features,
  );
  const filteredAccountant = hasPermission(
    ACCOUNTANT_NAV,
    userRole,
    subscription,
    features,
  )
    ? ACCOUNTANT_NAV
    : null;

  // Check if a nav item is active
  const isItemActive = useCallback(
    (item: NavItem): boolean => {
      if (location.pathname === item.path) return true;
      if (
        item.children?.some((child) => location.pathname.startsWith(child.path))
      )
        return true;
      return false;
    },
    [location.pathname],
  );

  // Handle collapse toggle
  const toggleCollapse = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed]);

  // Auto-collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && !isCollapsed) {
        setIsCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [isCollapsed]);

  return (
    <TooltipProvider delayDuration={isCollapsed ? 100 : 1000}>
      <aside
        className={cn(
          "flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
          "transition-all duration-300 ease-in-out h-screen sticky top-0",
          isCollapsed ? "w-16" : "w-64",
          !isPinned && !isHovering && "w-16",
        )}
        onMouseEnter={() => !isPinned && setIsHovering(true)}
        onMouseLeave={() => !isPinned && setIsHovering(false)}
      >
        {/* Logo Area */}
        <div
          className={cn(
            "flex items-center h-14 border-b border-sidebar-border flex-shrink-0",
            isCollapsed ? "justify-center px-2" : "px-4",
          )}
        >
          <Link to="/" className="flex items-center gap-2 overflow-hidden">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center shadow-sm">
              <span className="text-sidebar-primary-foreground font-bold text-sm">
                AB
              </span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sidebar-foreground leading-tight">
                  AccuBooks
                </span>
                <span className="text-[10px] text-sidebar-foreground/60">
                  Enterprise
                </span>
              </div>
            )}
          </Link>

          {!isCollapsed && (
            <div className="ml-auto flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={toggleCollapse}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Collapse sidebar</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <ScrollArea className="flex-1 py-3">
          <div className={cn("space-y-1", isCollapsed ? "px-2" : "px-3")}>
            {filteredNav.map((item) => (
              <SidebarSection
                key={item.id}
                item={item}
                isActive={isItemActive(item)}
                isCollapsed={isCollapsed}
                userRole={userRole}
                subscription={subscription}
                features={features}
                onNavigate={() => {}}
              />
            ))}

            {/* Accountant Tools (if available) */}
            {filteredAccountant && !isCollapsed && (
              <>
                <Separator className="my-3" />
                <div className="px-3 py-2">
                  <span className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                    Accountant Tools
                  </span>
                </div>
                <SidebarSection
                  item={filteredAccountant}
                  isActive={isItemActive(filteredAccountant)}
                  isCollapsed={isCollapsed}
                  userRole={userRole}
                  subscription={subscription}
                  features={features}
                  onNavigate={() => {}}
                />
              </>
            )}

            {filteredAccountant && isCollapsed && (
              <>
                <Separator className="my-2 mx-2" />
                <SidebarSection
                  item={filteredAccountant}
                  isActive={isItemActive(filteredAccountant)}
                  isCollapsed={isCollapsed}
                  userRole={userRole}
                  subscription={subscription}
                  features={features}
                  onNavigate={() => {}}
                />
              </>
            )}
          </div>
        </ScrollArea>

        {/* Bottom Actions */}
        <div
          className={cn(
            "border-t border-sidebar-border flex-shrink-0",
            isCollapsed ? "p-2" : "p-3",
          )}
        >
          <div
            className={cn(
              "space-y-1",
              isCollapsed && "flex flex-col items-center gap-2",
            )}
          >
            {/* Desktop Mode Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={desktopMode ? "secondary" : "ghost"}
                  size={isCollapsed ? "icon" : "sm"}
                  className={cn(
                    "w-full justify-start gap-2",
                    isCollapsed && "h-9 w-9 p-0 justify-center",
                  )}
                  onClick={onDesktopModeToggle}
                >
                  <Monitor className="h-4 w-4" />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1">Desktop Mode</span>
                      {desktopMode && (
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      )}
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isCollapsed ? "right" : "top"}>
                {desktopMode
                  ? "Switch to Online Mode"
                  : "Switch to Desktop Mode"}
              </TooltipContent>
            </Tooltip>

            {/* Pin/Unpin Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size={isCollapsed ? "icon" : "sm"}
                  className={cn(
                    "w-full justify-start gap-2",
                    isCollapsed && "h-9 w-9 p-0 justify-center",
                  )}
                  onClick={() => setIsPinned(!isPinned)}
                >
                  {isPinned ? (
                    <Pin className="h-4 w-4" />
                  ) : (
                    <PinOff className="h-4 w-4" />
                  )}
                  {!isCollapsed && (
                    <span className="flex-1">
                      {isPinned ? "Pinned" : "Auto-hide"}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isCollapsed ? "right" : "top"}>
                {isPinned
                  ? "Click to auto-hide sidebar"
                  : "Click to pin sidebar"}
              </TooltipContent>
            </Tooltip>

            {/* Expand button (when collapsed) */}
            {isCollapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={toggleCollapse}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Expand sidebar</TooltipContent>
              </Tooltip>
            )}

            {!isCollapsed && (
              <div className="pt-2">
                <Separator className="mb-2" />
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-sidebar-foreground/50">
                    {subscription} Plan
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-sidebar-primary hover:text-sidebar-primary"
                    onClick={() => navigate("/settings/billing")}
                  >
                    Upgrade
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
};

// Helper function for permission checking
function hasPermission(
  item: NavItem,
  userRole: UserRole,
  subscription: SubscriptionTier,
  features: FeatureFlag[],
): boolean {
  if (item.roles && !item.roles.includes(userRole)) return false;
  if (item.subscription && !item.subscription.includes(subscription))
    return false;
  if (item.featureFlag && !features.includes(item.featureFlag)) return false;
  return true;
}

export default QuickBooksSidebar;
