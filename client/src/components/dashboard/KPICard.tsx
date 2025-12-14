import React from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  CreditCard,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/../../lib/utils";

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
        bg: "bg-gradient-to-br from-blue-500 to-blue-600",
        text: "text-white",
        icon: "text-blue-100",
        change: "text-blue-100",
      },
      success: {
        bg: "bg-gradient-to-br from-green-500 to-green-600",
        text: "text-white",
        icon: "text-green-100",
        change: "text-green-100",
      },
      warning: {
        bg: "bg-gradient-to-br from-amber-500 to-amber-600",
        text: "text-white",
        icon: "text-amber-100",
        change: "text-amber-100",
      },
      error: {
        bg: "bg-gradient-to-br from-red-500 to-red-600",
        text: "text-white",
        icon: "text-red-100",
        change: "text-red-100",
      },
    };

    const currentColor = colorClasses[color];

    const TrendIcon =
      trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : null;

    return (
      <Card
        ref={ref}
        className={cn(
          "relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
          currentColor.bg,
          className,
        )}
      >
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm" />

        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={cn("text-sm font-medium mb-1", currentColor.icon)}>
                {title}
              </p>
              <div className={cn("text-3xl font-bold mb-2", currentColor.text)}>
                {value}
              </div>

              {change !== undefined && (
                <div className="flex items-center gap-1">
                  {TrendIcon && (
                    <TrendIcon className={cn("h-4 w-4", currentColor.change)} />
                  )}
                  <span
                    className={cn("text-sm font-medium", currentColor.change)}
                  >
                    {changeType === "increase" ? "+" : "-"}
                    {Math.abs(change)}%
                  </span>
                  <span className={cn("text-xs", currentColor.icon)}>
                    from last month
                  </span>
                </div>
              )}
            </div>

            {icon && (
              <div
                className={cn(
                  "p-3 rounded-xl bg-white/20 backdrop-blur-sm",
                  currentColor.icon,
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
