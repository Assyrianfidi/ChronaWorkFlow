import * as React from "react";
import { LoadingState } from "@/components/ui/LoadingState";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  change: string;
  changeType: "increase" | "decrease";
  icon: LucideIcon;
  color?: string;
  isLoading?: boolean;
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  (
    {
      title,
      value,
      change,
      changeType,
      icon: Icon,
      color = "primary",
      isLoading = false,
      className,
      ...props
    },
    ref,
  ) => {
    if (isLoading) {
      return (
        <div
          className={cn("rounded-lg border bg-card p-6 shadow-sm", className)}
        >
          <LoadingState size="sm" />
        </div>
      );
    }

    const ChangeIcon = changeType === "increase" ? TrendingUp : TrendingDown;
    const changeColor =
      changeType === "increase" ? "text-green-600" : "text-red-600";

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md",
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            <div className={cn("mt-2 flex items-center text-sm", changeColor)}>
              <ChangeIcon className="mr-1 h-4 w-4" />
              <span>{change}</span>
            </div>
          </div>
          <div className={cn("rounded-lg p-3", `bg-${color}-100`)}>
            <Icon className={cn(`h-6 w-6 text-${color}-600`)} />
          </div>
        </div>
      </div>
    );
  },
);

MetricCard.displayName = "MetricCard";

export { MetricCard };
export default MetricCard;
