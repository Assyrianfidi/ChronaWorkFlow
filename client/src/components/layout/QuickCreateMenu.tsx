import React, { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/DropdownMenu";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronRight, Sparkles } from "lucide-react";
import {
  QUICK_CREATE_MENU,
  NavItem,
  NavChild,
} from "@/config/navigation.config";

// ============================================================================
// QUICK CREATE MENU COMPONENT (+ New Button)
// ============================================================================

interface QuickCreateMenuProps {
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export const QuickCreateMenu: React.FC<QuickCreateMenuProps> = ({
  className,
  variant = "default",
  size = "sm",
}) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleNavigate = useCallback(
    (path: string) => {
      setOpen(false);
      navigate(path);
    },
    [navigate],
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(
            "gap-1.5 font-medium",
            size === "sm" && "h-8",
            className,
          )}
        >
          <Plus className="h-4 w-4" />
          <span>New</span>
          <ChevronRight className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 max-h-[70vh] overflow-y-auto"
        sideOffset={8}
      >
        {QUICK_CREATE_MENU.map((section, sectionIndex) => (
          <React.Fragment key={section.id}>
            {sectionIndex > 0 && <DropdownMenuSeparator />}

            <DropdownMenuLabel className="flex items-center gap-2 px-2 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <section.icon className="h-3.5 w-3.5" />
              {section.label}
            </DropdownMenuLabel>

            <DropdownMenuGroup>
              {section.children?.map((item: NavChild) => (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => handleNavigate(item.path)}
                  className="flex items-center justify-between px-2 py-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon && (
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.shortcut && (
                      <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                        {item.shortcut}
                      </kbd>
                    )}
                    <ChevronRight className="h-3 w-3 opacity-30" />
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </React.Fragment>
        ))}

        <DropdownMenuSeparator />

        <div className="p-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Pro tip: Use keyboard shortcuts for faster workflow
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default QuickCreateMenu;
