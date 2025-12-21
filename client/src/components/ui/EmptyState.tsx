import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  size?: "sm" | "md";
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      title = "Nothing to show",
      description,
      icon,
      action,
      size = "md",
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full flex-col items-center justify-center text-center",
          size === "sm" ? "py-8" : "py-12",
          className,
        )}
        {...props}
      >
        {icon && (
          <div
            className={cn(
              "mb-3 flex items-center justify-center rounded-full border bg-muted/20 text-muted-foreground",
              size === "sm" ? "h-10 w-10" : "h-12 w-12",
            )}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}

        <div
          className={cn(
            "max-w-[52ch]",
            size === "sm" ? "space-y-1" : "space-y-2",
          )}
        >
          <div
            className={cn(
              "font-semibold",
              size === "sm" ? "text-sm" : "text-base",
            )}
          >
            {title}
          </div>
          {description && (
            <div
              className={cn(
                "text-muted-foreground",
                size === "sm" ? "text-xs" : "text-sm",
              )}
            >
              {description}
            </div>
          )}
        </div>

        {action && (
          <div className={cn(size === "sm" ? "mt-3" : "mt-4")}>{action}</div>
        )}
      </div>
    );
  },
);

EmptyState.displayName = "EmptyState";

export { EmptyState };
export default EmptyState;
