/**
 * DashboardViewSwitcher Component
 * Allows users to switch between Custom, Performance, and Cash Flow dashboard views
 */

import React from "react";
import { useView } from "@/contexts/ViewContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LayoutDashboard, TrendingUp, Wallet, Check, Lock } from "lucide-react";
import { DASHBOARD_VIEWS } from "@/config/view.config";

export const DashboardViewSwitcher: React.FC = () => {
  const {
    dashboardView,
    setDashboardView,
    dashboardViewConfig,
    canAccessView,
  } = useView();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "LayoutDashboard":
        return LayoutDashboard;
      case "TrendingUp":
        return TrendingUp;
      case "Wallet":
        return Wallet;
      default:
        return LayoutDashboard;
    }
  };

  const CurrentIcon = getIcon(dashboardViewConfig.icon);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CurrentIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{dashboardViewConfig.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {Object.values(DASHBOARD_VIEWS).map((view) => {
          const Icon = getIcon(view.icon);
          const isActive = dashboardView === view.id;
          const canAccess = canAccessView(view.id);

          return (
            <DropdownMenuItem
              key={view.id}
              onClick={() => canAccess && setDashboardView(view.id)}
              disabled={!canAccess}
              className={cn(
                "flex items-center justify-between",
                isActive && "bg-primary/10",
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{view.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {view.requiredTier && (
                  <Badge variant="outline" className="text-[10px]">
                    {view.requiredTier}
                  </Badge>
                )}
                {isActive && <Check className="h-4 w-4" />}
                {!canAccess && (
                  <Lock className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DashboardViewSwitcher;
