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
import Card from "@/components/ui/card";
import { EnterpriseButton } from "@/components/ui/EnterpriseButton";

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
          <div className="bg-popover text-popover-foreground p-4 border border-border rounded-lg shadow-elevated">
            <p className="text-sm font-medium text-foreground mb-2">{label}</p>
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
        <Card ref={ref} className={cn("p-6", className)} {...props}>
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded mb-4 w-48"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </Card>
      );
    }

    return (
      <Card ref={ref} className={cn("p-6", className)} {...props}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">Cash Flow</h3>
              <p className="text-sm text-muted-foreground">Monthly overview</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              {netChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-success-700 dark:text-success" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive dark:text-destructive-500" />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  netChange > 0
                    ? "text-success-700 dark:text-success"
                    : "text-destructive dark:text-destructive-500",
                )}
              >
                {netChange > 0 ? "+" : ""}
                {netChangePercent}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground">vs last month</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-success/10 rounded-lg border border-success/20">
            <p className="text-sm text-success-700 dark:text-success font-medium">
              Income
            </p>
            <p className="text-lg font-bold text-success-700 dark:text-success">
              {formatCurrency(currentMonth.income)}
            </p>
          </div>
          <div className="text-center p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-sm text-destructive dark:text-destructive-500 font-medium">
              Expenses
            </p>
            <p className="text-lg font-bold text-destructive dark:text-destructive-500">
              {formatCurrency(currentMonth.expenses)}
            </p>
          </div>
          <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm text-primary font-medium">Net Cash Flow</p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(currentMonth.net)}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-gray)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                axisLine={{ stroke: "var(--border-gray)" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                axisLine={{ stroke: "var(--border-gray)" }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="rect" />
              <Area
                type="monotone"
                dataKey="income"
                stackId="1"
                stroke="var(--success-600)"
                fill="var(--success-600)"
                fillOpacity={0.6}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stackId="2"
                stroke="var(--error-500)"
                fill="var(--error-500)"
                fillOpacity={0.6}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="net"
                stroke="var(--primary-500)"
                strokeWidth={3}
                dot={{ fill: "var(--primary-500)", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Average monthly net cash flow:{" "}
              <span className="font-medium text-foreground">
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
      </Card>
    );
  },
);
CashFlowChart.displayName = "CashFlowChart";

export { CashFlowChart, type CashFlowData };
