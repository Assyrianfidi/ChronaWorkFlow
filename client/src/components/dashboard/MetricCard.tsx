import * as React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: "increase" | "decrease";
  icon: LucideIcon;
  color: string;
  isLoading?: boolean;
}

// @ts-ignore
const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <Icon className={cn("w-5 h-5", color)} />
      </div>

      <div className="text-2xl font-bold text-gray-900 mb-2">{value}</div>

      <div className="flex items-center space-x-1">
        {changeType === "increase" ? (
          <TrendingUp className="w-4 h-4 text-green-600" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-600" />
        )}
        <span
          className={cn(
            "text-sm font-medium",
            changeType === "increase" ? "text-green-600" : "text-red-600",
          )}
        >
          {change}
        </span>
        <span className="text-sm text-gray-500">from last month</span>
      </div>
    </div>
  );
};

export default MetricCard;
