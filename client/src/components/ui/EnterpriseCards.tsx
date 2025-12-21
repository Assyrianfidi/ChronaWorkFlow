import * as React from "react";
import { LoadingState } from "@/components/ui/LoadingState";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva(
  "rounded-xl border bg-card text-card-foreground shadow-card transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-gray-200 bg-white hover:shadow-cardHover",
        elevated: "border-gray-100 bg-white shadow-lg hover:shadow-xl",
        outlined: "border-2 border-gray-300 bg-white hover:border-primary-300",
        ghost: "border-transparent bg-gray-50/50 hover:bg-gray-100",
        gradient:
          "border-transparent bg-gradient-to-br from-primary-50 to-primary-100 hover:from-primary-100 hover:to-primary-200",
        success: "border-success-200 bg-success-50 hover:border-success-300",
        warning: "border-warning-200 bg-warning-50 hover:border-warning-300",
        error: "border-error-200 bg-error-50 hover:border-error-300",
      },
      size: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
      interactive: {
        true: "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      interactive: false,
    },
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, size, interactive }), className)}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-semibold leading-none tracking-tight text-gray-900",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-gray-600", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-6", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// KPI Card Component
interface KPICardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: "up" | "down" | "neutral";
  };
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  variant?: "default" | "success" | "warning" | "error";
  size?: "sm" | "default" | "lg";
  loading?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  description,
  variant = "default",
  size = "default",
  loading = false,
}) => {
  const trend = change?.trend;
  const trendIcon = trend === "up" ? "▲" : trend === "down" ? "▼" : "—";
  const trendClass =
    trend === "up"
      ? "text-success-600"
      : trend === "down"
        ? "text-error-600"
        : "text-gray-600";

  const sizeClasses: Record<NonNullable<KPICardProps["size"]>, string> = {
    sm: "p-4",
    default: "p-6",
    lg: "p-8",
  };

  if (loading) {
    return (
      <Card className={cn(sizeClasses[size])} aria-busy="true">
        <CardContent>
          <LoadingState size="sm" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        sizeClasses[size],
        variant === "success" && "border-success-200 bg-success-50",
        variant === "warning" && "border-warning-200 bg-warning-50",
        variant === "error" && "border-error-200 bg-error-50",
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-medium text-gray-700">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
          {Icon && (
            <div
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600"
              aria-hidden="true"
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-3">
          <div className="text-2xl font-semibold text-gray-900">{value}</div>
          {change && (
            <div className={cn("text-sm font-medium", trendClass)}>
              <span aria-hidden="true">{trendIcon}</span> {change.value}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};

export default Card;
