/**
 * Financial Charts with Recharts
 * Production-grade, accessible, theme-aware charts
 */

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  TooltipProps,
} from "recharts";
import {
  useCashFlow,
  useTopExpenses,
  CashFlowData,
  ExpenseCategory,
} from "@/hooks/useFinancialData";
import { DataFetchWrapper, SkeletonChart } from "@/components/ui/LoadingStates";
import { useEnhancedTheme } from "@/contexts/EnhancedThemeContext";
import { getThemeColors } from "@/config/themes";

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
  isDark: boolean;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  isDark,
}) => {
  if (active && payload && payload.length) {
    return (
      <div
        className={`p-3 rounded-lg shadow-lg border ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <p
          className={`font-semibold mb-2 ${isDark ? "text-gray-100" : "text-gray-900"}`}
        >
          {label}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span
              className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}
            >
              {entry.name}:
            </span>
            <span
              className={`text-sm font-bold ${isDark ? "text-gray-100" : "text-gray-900"}`}
            >
              ${entry.value?.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ============================================================================
// CASH FLOW CHART
// ============================================================================

interface CashFlowChartProps {
  months?: number;
  height?: number;
}

export function CashFlowChart({
  months = 6,
  height = 300,
}: CashFlowChartProps) {
  const { themeName, resolvedMode } = useEnhancedTheme();
  const colors = getThemeColors(themeName, resolvedMode);
  const { data, isLoading, isError, error, refetch } = useCashFlow(months);

  const isDark = resolvedMode === "dark";

  return (
    <DataFetchWrapper
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={data}
      onRetry={() => refetch()}
      loadingComponent={<SkeletonChart />}
    >
      {(cashFlowData) => (
        <div className="w-full" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={cashFlowData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? "#374151" : "#e5e7eb"}
                vertical={false}
              />
              <XAxis
                dataKey="period"
                stroke={isDark ? "#9ca3af" : "#6b7280"}
                style={{ fontSize: "12px", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke={isDark ? "#9ca3af" : "#6b7280"}
                style={{ fontSize: "12px", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={<CustomTooltip isDark={isDark} />}
                cursor={{
                  fill: isDark
                    ? "rgba(55, 65, 81, 0.3)"
                    : "rgba(243, 244, 246, 0.8)",
                }}
              />
              <Bar
                dataKey="inflow"
                name="Inflow"
                fill={colors.chartPrimary}
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
              />
              <Bar
                dataKey="outflow"
                name="Outflow"
                fill={colors.chartSecondary}
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </DataFetchWrapper>
  );
}

// ============================================================================
// TOP EXPENSES CHART
// ============================================================================

interface TopExpensesChartProps {
  period?: string;
  height?: number;
}

export function TopExpensesChart({
  period = "current-month",
  height = 300,
}: TopExpensesChartProps) {
  const { themeName, resolvedMode } = useEnhancedTheme();
  const colors = getThemeColors(themeName, resolvedMode);
  const { data, isLoading, isError, error, refetch } = useTopExpenses(period);

  const isDark = resolvedMode === "dark";

  const chartColors = [
    colors.chartPrimary,
    colors.chartSecondary,
    colors.chartTertiary,
    colors.chartQuaternary,
    colors.chartQuinary,
    isDark ? "#64748b" : "#94a3b8",
  ];

  return (
    <DataFetchWrapper
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={data}
      onRetry={() => refetch()}
      loadingComponent={<SkeletonChart />}
    >
      {(expensesData) => (
        <div className="space-y-3">
          {expensesData.map((expense, index) => (
            <div key={expense.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: chartColors[index % chartColors.length],
                    }}
                  />
                  <span
                    className={`text-sm font-medium ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {expense.category}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-bold ${
                      isDark ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    ${expense.amount.toLocaleString()}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      expense.change >= 0
                        ? isDark
                          ? "text-green-400"
                          : "text-green-600"
                        : isDark
                          ? "text-red-400"
                          : "text-red-600"
                    }`}
                  >
                    {expense.change >= 0 ? "+" : ""}
                    {expense.change}%
                  </span>
                </div>
              </div>
              <div
                className={`w-full rounded-full h-2 ${
                  isDark ? "bg-gray-700" : "bg-gray-200"
                }`}
              >
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${expense.percentage}%`,
                    backgroundColor: chartColors[index % chartColors.length],
                  }}
                  role="progressbar"
                  aria-valuenow={expense.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${expense.category}: ${expense.percentage}%`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </DataFetchWrapper>
  );
}

// ============================================================================
// MINI TREND CHART (for inline use)
// ============================================================================

interface MiniTrendChartProps {
  data: number[];
  color?: string;
  height?: number;
}

export function MiniTrendChart({
  data,
  color = "#22c55e",
  height = 40,
}: MiniTrendChartProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = range === 0 ? 50 : ((max - value) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width="100%"
      height={height}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="overflow-visible"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
