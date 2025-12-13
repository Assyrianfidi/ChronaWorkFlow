import * as React from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EnterpriseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined" | "glass";
}

const EnterpriseCard = React.forwardRef<HTMLDivElement, EnterpriseCardProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-white shadow-sm transition-all duration-200",
        {
          "border-gray-200 hover:shadow-md": variant === "default",
          "border-gray-100 shadow-lg hover:shadow-xl": variant === "elevated",
          "border-2 border-gray-300 hover:border-primary-300":
            variant === "outlined",
          "border-transparent bg-white/80 backdrop-blur-sm hover:bg-white/90":
            variant === "glass",
        },
        className,
      )}
      {...props}
    />
  ),
);

EnterpriseCard.displayName = "EnterpriseCard";

interface KPIMetric {
  title: string;
  value: string;
  change: number;
  changeType: "increase" | "decrease";
  period: string;
  icon: React.ComponentType<{ className?: string }>;
  format?: "currency" | "number" | "percentage";
}

interface AnalyticsKPIProps {
  className?: string;
  period?: "30-day" | "7-day" | "24h";
  loading?: boolean;
}

const KPICard = React.forwardRef<
  HTMLDivElement,
  KPIMetric & { loading?: boolean }
>(
  (
    {
      title,
      value,
      change,
      changeType,
      period,
      icon: Icon,
      format = "currency",
      loading = false,
    },
    ref,
  ) => {
    const formattedValue = React.useMemo(() => {
      if (loading) return "---";

      switch (format) {
        case "currency":
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(parseFloat(value.replace(/[^0-9.-]/g, "")));
        case "percentage":
          return `${value}%`;
        default:
          return value;
      }
    }, [value, format, loading]);

    return (
      <EnterpriseCard
        ref={ref}
        variant="elevated"
        className={cn(
          "hover:shadow-xl transition-all duration-300",
          loading && "animate-pulse",
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              {formattedValue}
            </p>
            <div className="flex items-center gap-2">
              {changeType === "increase" ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  changeType === "increase" ? "text-green-500" : "text-red-500",
                )}
              >
                {change > 0 ? "+" : ""}
                {change}%
              </span>
              <span className="text-sm text-gray-500">{period}</span>
            </div>
          </div>
          <div
            className={cn(
              "p-3 rounded-lg",
              changeType === "increase" ? "bg-green-100" : "bg-red-100",
            )}
          >
            <Icon
              className={cn(
                "w-6 h-6",
                changeType === "increase" ? "text-green-600" : "text-red-600",
              )}
            />
          </div>
        </div>
      </EnterpriseCard>
    );
  },
);
KPICard.displayName = "KPICard";

const AnalyticsKPI = React.forwardRef<HTMLDivElement, AnalyticsKPIProps>(
  ({ className, period = "30-day", loading = false, ...props }, ref) => {
    const [kpiData, setKpiData] = React.useState<KPIMetric[]>([
      {
        title: "Total Revenue",
        value: "124563",
        change: 12.5,
        changeType: "increase",
        period,
        icon: DollarSign,
        format: "currency",
      },
      {
        title: "Accounts Receivable",
        value: "45231",
        change: -5.2,
        changeType: "decrease",
        period,
        icon: FileText,
        format: "currency",
      },
      {
        title: "Net Profit",
        value: "34782",
        change: 8.7,
        changeType: "increase",
        period,
        icon: TrendingUp,
        format: "currency",
      },
      {
        title: "Active Customers",
        value: "1247",
        change: 15.3,
        changeType: "increase",
        period,
        icon: Users,
        format: "number",
      },
    ]);

    // Simulate real-time updates
    React.useEffect(() => {
      if (loading) return;

      const interval = setInterval(() => {
        setKpiData((prev) =>
          prev.map((kpi) => ({
            ...kpi,
            change: kpi.change + (Math.random() - 0.5) * 0.5,
            changeType: Math.random() > 0.3 ? "increase" : "decrease",
          })),
        );
      }, 5000);

      return () => clearInterval(interval);
    }, [loading]);

    return (
      <div
        ref={ref}
        className={cn(
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
          className,
        )}
        {...props}
      >
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} loading={loading} />
        ))}
      </div>
    );
  },
);
AnalyticsKPI.displayName = "AnalyticsKPI";

export { AnalyticsKPI, KPICard, type KPIMetric };
