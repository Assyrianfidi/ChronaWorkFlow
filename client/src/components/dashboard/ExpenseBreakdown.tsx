import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { CreditCard, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/card";
import { EnterpriseButton } from "@/components/ui/EnterpriseButton";

interface ExpenseCategory {
  name: string;
  value: number;
  percentage: number;
}

interface ExpenseBreakdownProps {
  className?: string;
  loading?: boolean;
  period?: "month" | "quarter" | "year";
}

const ExpenseBreakdown = React.forwardRef<
  HTMLDivElement,
  ExpenseBreakdownProps
>(({ className, loading = false, period = "month", ...props }, ref) => {
  const [expenses, setExpenses] = React.useState<ExpenseCategory[]>([
    {
      name: "Software & Subscriptions",
      value: 12450,
      percentage: 35.2,
    },
    {
      name: "Office Operations",
      value: 8750,
      percentage: 24.7,
    },
    {
      name: "Marketing & Advertising",
      value: 6500,
      percentage: 18.4,
    },
    {
      name: "Professional Services",
      value: 4500,
      percentage: 12.7,
    },
    {
      name: "Travel & Entertainment",
      value: 3200,
      percentage: 9.0,
    },
  ]);

  const chartColors = React.useMemo(
    () => [
      "var(--primary-500)",
      "var(--success-600)",
      "var(--warning-500)",
      "var(--error-500)",
      "var(--info-500)",
    ],
    [],
  );

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.value,
    0,
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover text-popover-foreground p-3 border border-border rounded-lg shadow-elevated">
          <p className="text-sm font-medium text-foreground">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            ${payload[0].value.toLocaleString()} (
            {payload[0].payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percentage,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
    const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

    if (percentage < 5) return null; // Hide labels for small segments

    return (
      <text
        x={x}
        y={y}
        fill="var(--text-inverse)"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-sm font-medium"
      >
        {`${percentage}%`}
      </text>
    );
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
          <CreditCard className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Expense Breakdown
            </h3>
            <p className="text-sm text-muted-foreground">
              {period === "month"
                ? "This Month"
                : period === "quarter"
                  ? "This Quarter"
                  : "This Year"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">
            ${totalExpenses.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">Total Expenses</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={expenses as any}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={100}
              fill="var(--primary-500)"
              dataKey="value"
            >
              {expenses.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="middle"
              align="right"
              layout="vertical"
              formatter={(value, entry: any) => (
                <span className="text-sm text-muted-foreground">
                  {value} (${entry.payload.value.toLocaleString()})
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span>Top category: Software & Subscriptions</span>
          </div>
          <EnterpriseButton variant="ghost" size="sm">
            View Details
          </EnterpriseButton>
        </div>
      </div>
    </Card>
  );
});
ExpenseBreakdown.displayName = "ExpenseBreakdown";

export { ExpenseBreakdown, type ExpenseCategory };
