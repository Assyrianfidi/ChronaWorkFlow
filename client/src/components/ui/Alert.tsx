import React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "destructive";
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "relative w-full rounded-lg border p-4",
        "flex gap-3",
        variant === "default" && "border-border bg-card text-card-foreground",
        (variant === "error" || variant === "destructive") &&
          "border-destructive/25 bg-destructive/10 text-foreground",
        variant === "success" &&
          "border-success/25 bg-success/10 text-foreground",
        variant === "warning" &&
          "border-warning/25 bg-warning/10 text-foreground",
        variant === "info" && "border-info/25 bg-info/10 text-foreground",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "mt-0.5 flex h-5 w-5 flex-none items-center justify-center",
          (variant === "error" || variant === "destructive") &&
            "text-destructive dark:text-destructive-500",
          variant === "success" && "text-success-700 dark:text-success",
          variant === "warning" && "text-warning-700 dark:text-warning",
          variant === "info" && "text-info",
          variant === "default" && "text-muted-foreground",
        )}
        aria-hidden="true"
      >
        {(variant === "error" || variant === "destructive") && (
          <AlertCircle className="h-5 w-5" />
        )}
        {variant === "success" && <CheckCircle2 className="h-5 w-5" />}
        {variant === "warning" && <AlertTriangle className="h-5 w-5" />}
        {variant === "info" && <Info className="h-5 w-5" />}
        {variant === "default" && <Info className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">{props.children}</div>
    </div>
  ),
);

Alert.displayName = "Alert";

export interface AlertDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

export interface AlertTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {}

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  AlertDescriptionProps
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));

AlertDescription.displayName = "AlertDescription";

const AlertTitle = React.forwardRef<HTMLParagraphElement, AlertTitleProps>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn(
        "mb-1 text-sm font-semibold leading-none tracking-tight",
        className,
      )}
      {...props}
    />
  ),
);

AlertTitle.displayName = "AlertTitle";

export { Alert, AlertTitle, AlertDescription };
export default Alert;
