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

interface ExpenseCategory {
  name: string;
  value: number;
  color: string;
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
      color: "#007bff",
      percentage: 35.2,
    },
    {
      name: "Office Operations",
      value: 8750,
      color: "#00c795",
      percentage: 24.7,
    },
    {
      name: "Marketing & Advertising",
      value: 6500,
      color: "#ffc107",
      percentage: 18.4,
    },
    {
      name: "Professional Services",
      value: 4500,
      color: "#dc3545",
      percentage: 12.7,
    },
    {
      name: "Travel & Entertainment",
      value: 3200,
      color: "#6f42c1",
      percentage: 9.0,
    },
  ]);

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.value,
    0,
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{payload[0].name}</p>
          <p className="text-sm text-gray-600">
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
        fill="white"
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
          <CreditCard className="w-5 h-5 text-ocean-blue" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Expense Breakdown
            </h3>
            <p className="text-sm text-gray-500">
              {period === "month"
                ? "This Month"
                : period === "quarter"
                  ? "This Quarter"
                  : "This Year"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">
            ${totalExpenses.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Total Expenses</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={expenses}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {expenses.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="middle"
              align="right"
              layout="vertical"
              formatter={(value, entry: any) => (
                <span className="text-sm text-gray-700">
                  {value} (${entry.payload.value.toLocaleString()})
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TrendingUp className="w-4 h-4" />
            <span>Top category: Software & Subscriptions</span>
          </div>
          <EnterpriseButton variant="ghost" size="sm">
            View Details
          </EnterpriseButton>
        </div>
      </div>
    </EnterpriseCard>
  );
});
ExpenseBreakdown.displayName = "ExpenseBreakdown";

export { ExpenseBreakdown, type ExpenseCategory };
