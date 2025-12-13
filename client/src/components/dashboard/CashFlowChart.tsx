import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
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

interface EnterpriseButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const EnterpriseButton = React.forwardRef<
  HTMLButtonElement,
  EnterpriseButtonProps
>(({ className, variant = "primary", size = "md", ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50",
      {
        "bg-primary-600 text-white hover:bg-primary-700": variant === "primary",
        "bg-gray-100 text-gray-900 hover:bg-gray-200": variant === "secondary",
        "border border-gray-300 bg-white hover:bg-gray-50":
          variant === "outline",
        "hover:bg-gray-100": variant === "ghost",
      },
      {
        "h-8 px-3 text-sm": size === "sm",
        "h-10 px-4 py-2": size === "md",
        "h-12 px-6 text-lg": size === "lg",
      },
      className,
    )}
    {...props}
  />
));

EnterpriseButton.displayName = "EnterpriseButton";

interface CashFlowData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface CashFlowChartProps {
  className?: string;
  loading?: boolean;
  period?: "6-months" | "12-months" | "24-months";
}

const CashFlowChart = React.forwardRef<HTMLDivElement, CashFlowChartProps>(
  ({ className, loading = false, period = "6-months", ...props }, ref) => {
    const [cashFlowData, setCashFlowData] = React.useState<CashFlowData[]>([
      { month: "Jul", income: 45000, expenses: 32000, net: 13000 },
      { month: "Aug", income: 52000, expenses: 35000, net: 17000 },
      { month: "Sep", income: 48000, expenses: 33000, net: 15000 },
      { month: "Oct", income: 61000, expenses: 38000, net: 23000 },
      { month: "Nov", income: 55000, expenses: 36000, net: 19000 },
      { month: "Dec", income: 67000, expenses: 41000, net: 26000 },
    ]);

    const currentMonth = cashFlowData[cashFlowData.length - 1];
    const previousMonth = cashFlowData[cashFlowData.length - 2];
    const netChange = currentMonth.net - previousMonth.net;
    const netChangePercent = ((netChange / previousMonth.net) * 100).toFixed(1);

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
            <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
            {payload.map((entry: any, index: number) => (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {entry.name}: {formatCurrency(entry.value)}
              </p>
            ))}
          </div>
        );
      }
      return null;
    };

    if (loading) {
      return (
        <EnterpriseCard ref={ref} className={cn("p-6", className)} {...props}>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4 w-48"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </EnterpriseCard>
      );
    }

    return (
      <EnterpriseCard ref={ref} className={cn("p-6", className)} {...props}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-ocean-blue" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Cash Flow</h3>
              <p className="text-sm text-gray-500">Monthly overview</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              {netChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  netChange > 0 ? "text-green-500" : "text-red-500",
                )}
              >
                {netChange > 0 ? "+" : ""}
                {netChangePercent}%
              </span>
            </div>
            <p className="text-sm text-gray-500">vs last month</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-600 font-medium">Income</p>
            <p className="text-lg font-bold text-green-700">
              {formatCurrency(currentMonth.income)}
            </p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-600 font-medium">Expenses</p>
            <p className="text-lg font-bold text-red-700">
              {formatCurrency(currentMonth.expenses)}
            </p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600 font-medium">Net Cash Flow</p>
            <p className="text-lg font-bold text-blue-700">
              {formatCurrency(currentMonth.net)}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="rect" />
              <Area
                type="monotone"
                dataKey="income"
                stackId="1"
                stroke="#00c795"
                fill="#00c795"
                fillOpacity={0.6}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stackId="2"
                stroke="#dc3545"
                fill="#dc3545"
                fillOpacity={0.6}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="net"
                stroke="#007bff"
                strokeWidth={3}
                dot={{ fill: "#007bff", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Average monthly net cash flow:{" "}
              <span className="font-medium text-gray-900">
                {formatCurrency(
                  Math.round(
                    cashFlowData.reduce((sum, d) => sum + d.net, 0) /
                      cashFlowData.length,
                  ),
                )}
              </span>
            </div>
            <EnterpriseButton variant="ghost" size="sm">
              Export Report
            </EnterpriseButton>
          </div>
        </div>
      </EnterpriseCard>
    );
  },
);
CashFlowChart.displayName = "CashFlowChart";

export { CashFlowChart, type CashFlowData };
