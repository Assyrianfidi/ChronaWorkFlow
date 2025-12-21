import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  size?: "sm" | "md";
}

const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ className, label = "Loading…", size = "md", ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        aria-busy="true"
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 text-center",
          size === "sm" ? "py-4" : "py-8",
          className,
        )}
        {...props}
      >
        <Loader2
          className={cn(
            "animate-spin text-muted-foreground",
            size === "sm" ? "h-5 w-5" : "h-6 w-6",
          )}
          aria-hidden="true"
        />
        <div
          className={cn(
            "mt-2 text-muted-foreground",
            size === "sm" ? "text-xs" : "text-sm",
          )}
        >
          {label}
        </div>
      </div>
    );
  },
);

LoadingState.displayName = "LoadingState";

export { LoadingState };
export default LoadingState;
