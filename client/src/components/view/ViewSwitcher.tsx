/**
 * ViewSwitcher Component
 * Allows users to toggle between Business View and Accountant View
 * Located in settings or accessible from top navigation
 */

import React from "react";
import { useView } from "@/contexts/ViewContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import {
  Building2,
  Calculator,
  Settings,
  Eye,
  LayoutDashboard,
  Monitor,
  Printer,
  Mail,
  FileText,
  Maximize,
  Presentation,
  Check,
} from "lucide-react";
import { MAIN_VIEWS } from "@/config/view.config";

// ============================================================================
// MAIN VIEW TOGGLE BUTTON
// ============================================================================

export const ViewToggleButton: React.FC = () => {
  const { mainView, setMainView, mainViewConfig, canAccessView } = useView();
  const { user } = useAuth();

  // Only show if user can access both views
  const canAccessBusiness = canAccessView("business");
  const canAccessAccountant = canAccessView("accountant");

  if (!canAccessBusiness || !canAccessAccountant) {
    return null;
  }

  const toggleView = () => {
    setMainView(mainView === "business" ? "accountant" : "business");
  };

  const Icon = mainView === "business" ? Building2 : Calculator;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleView}
      className="gap-2 text-muted-foreground hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
      <span className="hidden md:inline">{mainViewConfig.name}</span>
    </Button>
  );
};

// ============================================================================
// COMPLETE VIEW SWITCHER DIALOG
// ============================================================================

export const ViewSwitcherDialog: React.FC = () => {
  const {
    mainView,
    setMainView,
    mainViewConfig,
    dashboardView,
    setDashboardView,
    reportView,
    setReportView,
    transactionView,
    setTransactionView,
    listView,
    setListView,
    accessibility,
    setAccessibility,
    temporaryView,
    enterPresentationMode,
    exitPresentationMode,
    toggleFullscreen,
    canAccessView,
  } = useView();

  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Settings className="h-5 w-5" />
          <span className="sr-only">View Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            View Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Main View Selection */}
          <section>
            <h3 className="text-sm font-medium mb-3">Main View Mode</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(MAIN_VIEWS).map((view) => {
                const Icon = view.icon === "Building2" ? Building2 : Calculator;
                const isActive = mainView === view.id;
                const canAccess = canAccessView(view.id);

                return (
                  <button
                    key={view.id}
                    onClick={() => canAccess && setMainView(view.id)}
                    disabled={!canAccess}
                    className={cn(
                      "relative flex flex-col items-start p-4 border-2 rounded-lg text-left transition-all",
                      isActive
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                      !canAccess && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{view.name}</span>
                      {isActive && (
                        <Check className="h-4 w-4 ml-auto text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {view.description}
                    </p>
                    {!canAccess && (
                      <Badge variant="outline" className="mt-2 text-[10px]">
                        Restricted
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h3 className="text-sm font-medium mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  enterPresentationMode();
                  setOpen(false);
                }}
                className={cn(
                  temporaryView === "presentation" && "bg-primary/10",
                )}
              >
                <Presentation className="h-4 w-4 mr-2" />
                Presentation Mode
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toggleFullscreen();
                  setOpen(false);
                }}
              >
                <Maximize className="h-4 w-4 mr-2" />
                Fullscreen
              </Button>
            </div>
          </section>

          {/* Current Settings Summary */}
          <section className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">Active Settings</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Main View:</span>
                <span className="font-medium">{mainViewConfig.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dashboard:</span>
                <span className="font-medium capitalize">{dashboardView}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reports:</span>
                <span className="font-medium capitalize">{reportView}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transactions:</span>
                <span className="font-medium capitalize">
                  {transactionView}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lists:</span>
                <span className="font-medium capitalize">{listView}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Accessibility:</span>
                <span className="font-medium capitalize">
                  {accessibility.replace("-", " ")}
                </span>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// COMPACT VIEW SWITCHER DROPDOWN
// ============================================================================

export const ViewSwitcherDropdown: React.FC = () => {
  const {
    mainView,
    setMainView,
    mainViewConfig,
    accessibility,
    setAccessibility,
    temporaryView,
    enterPresentationMode,
    exitPresentationMode,
    canAccessView,
  } = useView();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          {mainView === "business" ? (
            <Building2 className="h-4 w-4" />
          ) : (
            <Calculator className="h-4 w-4" />
          )}
          <span className="hidden md:inline">{mainViewConfig.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>View Mode</DropdownMenuLabel>

        {/* Business View */}
        <DropdownMenuItem
          onClick={() => setMainView("business")}
          disabled={!canAccessView("business")}
          className={cn(mainView === "business" && "bg-primary/10")}
        >
          <Building2 className="h-4 w-4 mr-2" />
          Business View
          {mainView === "business" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuItem>

        {/* Accountant View */}
        <DropdownMenuItem
          onClick={() => setMainView("accountant")}
          disabled={!canAccessView("accountant")}
          className={cn(mainView === "accountant" && "bg-primary/10")}
        >
          <Calculator className="h-4 w-4 mr-2" />
          Accountant View
          {mainView === "accountant" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Accessibility</DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() => setAccessibility("default")}
          className={cn(accessibility === "default" && "bg-primary/10")}
        >
          <Eye className="h-4 w-4 mr-2" />
          Default
          {accessibility === "default" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setAccessibility("high-contrast")}
          className={cn(accessibility === "high-contrast" && "bg-primary/10")}
        >
          <Monitor className="h-4 w-4 mr-2" />
          High Contrast
          {accessibility === "high-contrast" && (
            <Check className="h-4 w-4 ml-auto" />
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Temporary Modes</DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() =>
            temporaryView === "presentation"
              ? exitPresentationMode()
              : enterPresentationMode()
          }
          className={cn(temporaryView === "presentation" && "bg-primary/10")}
        >
          <Presentation className="h-4 w-4 mr-2" />
          Presentation Mode
          {temporaryView === "presentation" && (
            <Check className="h-4 w-4 ml-auto" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ============================================================================
// VIEW BADGE (Small indicator of current view)
// ============================================================================

export const ViewBadge: React.FC = () => {
  const { mainView, mainViewConfig } = useView();

  return (
    <Badge variant="outline" className="gap-1 text-xs">
      {mainView === "business" ? (
        <Building2 className="h-3 w-3" />
      ) : (
        <Calculator className="h-3 w-3" />
      )}
      <span className="hidden sm:inline">{mainViewConfig.name}</span>
    </Badge>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default ViewSwitcherDropdown;
