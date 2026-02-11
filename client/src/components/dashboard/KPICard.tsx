import React from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  CreditCard,
} from "lucide-react";
import Card, { CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: "increase" | "decrease";
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  color?: "primary" | "success" | "warning" | "error";
  className?: string;
}

const KPICard = React.forwardRef<HTMLDivElement, KPICardProps>(
  (
    {
      title,
      value,
      change,
      changeType = "increase",
      icon,
      trend = "neutral",
      color = "primary",
      className,
    },
    ref,
  ) => {
    const colorClasses = {
      primary: {
        accentBg: "bg-primary/10",
        accentText: "text-primary",
      },
      success: {
        accentBg: "bg-success/10",
        accentText: "text-success-700 dark:text-success",
      },
      warning: {
        accentBg: "bg-warning/10",
        accentText: "text-warning-700 dark:text-warning",
      },
      error: {
        accentBg: "bg-destructive/10",
        accentText: "text-destructive dark:text-destructive-500",
      },
    };

    const currentColor = colorClasses[color];

    const TrendIcon =
      trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : null;

    return (
      <Card
        ref={ref}
        className={cn(
          "relative overflow-hidden bg-card text-card-foreground border border-border shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-1",
          className,
        )}
      >
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-foreground/5" />

        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p
                className={cn(
                  "text-sm font-medium mb-1",
                  currentColor.accentText,
                )}
              >
                {title}
              </p>
              <div className="text-3xl font-bold mb-2 text-foreground">
                {value}
              </div>

              {change !== undefined && (
                <div className="flex items-center gap-1">
                  {TrendIcon && (
                    <TrendIcon
                      className={cn("h-4 w-4", currentColor.accentText)}
                    />
                  )}
                  <span
                    className={cn(
                      "text-sm font-medium",
                      currentColor.accentText,
                    )}
                  >
                    {changeType === "increase" ? "+" : "-"}
                    {Math.abs(change)}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    from last month
                  </span>
                </div>
              )}
            </div>

            {icon && (
              <div
                className={cn(
                  "p-3 rounded-xl",
                  currentColor.accentBg,
                  currentColor.accentText,
                )}
              >
                {icon}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  },
);
KPICard.displayName = "KPICard";

// Pre-configured KPI cards for common metrics
export const RevenueCard = ({
  value,
  change,
}: {
  value: string | number;
  change?: number;
}) => (
  <KPICard
    title="Total Revenue"
    value={value}
    change={change}
    icon={<DollarSign className="h-6 w-6" />}
    trend={
      change && change > 0 ? "up" : change && change < 0 ? "down" : "neutral"
    }
    color="success"
  />
);

export const CustomersCard = ({
  value,
  change,
}: {
  value: string | number;
  change?: number;
}) => (
  <KPICard
    title="Active Customers"
    value={value}
    change={change}
    icon={<Users className="h-6 w-6" />}
    trend={
      change && change > 0 ? "up" : change && change < 0 ? "down" : "neutral"
    }
    color="primary"
  />
);

export const InvoicesCard = ({
  value,
  change,
}: {
  value: string | number;
  change?: number;
}) => (
  <KPICard
    title="Total Invoices"
    value={value}
    change={change}
    icon={<FileText className="h-6 w-6" />}
    trend={
      change && change > 0 ? "up" : change && change < 0 ? "down" : "neutral"
    }
    color="warning"
  />
);

export const TransactionsCard = ({
  value,
  change,
}: {
  value: string | number;
  change?: number;
}) => (
  <KPICard
    title="Transactions"
    value={value}
    change={change}
    icon={<CreditCard className="h-6 w-6" />}
    trend={
      change && change > 0 ? "up" : change && change < 0 ? "down" : "neutral"
    }
    color="primary"
  />
);

export { KPICard };
