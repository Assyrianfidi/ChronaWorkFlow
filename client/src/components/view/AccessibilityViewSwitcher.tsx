/**
 * AccessibilityViewSwitcher Component
 * Switch between Default, High Contrast, and Screen Reader modes
 */

import React from "react";
import { useView } from "@/contexts/ViewContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Eye, Contrast, Headphones, Check } from "lucide-react";
import { ACCESSIBILITY_VIEWS } from "@/config/view.config";

export const AccessibilityViewSwitcher: React.FC = () => {
  const { accessibility, setAccessibility, accessibilityConfig } = useView();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Eye":
        return Eye;
      case "Contrast":
        return Contrast;
      case "Headphones":
        return Headphones;
      default:
        return Eye;
    }
  };

  const CurrentIcon = getIcon(accessibilityConfig.icon);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <CurrentIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{accessibilityConfig.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {Object.values(ACCESSIBILITY_VIEWS).map((view) => {
          const Icon = getIcon(view.icon);
          const isActive = accessibility === view.id;

          return (
            <DropdownMenuItem
              key={view.id}
              onClick={() => setAccessibility(view.id)}
              className={cn(
                "flex items-center justify-between",
                isActive && "bg-primary/10",
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <div className="flex flex-col">
                  <span>{view.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {view.description}
                  </span>
                </div>
              </div>
              {isActive && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccessibilityViewSwitcher;
