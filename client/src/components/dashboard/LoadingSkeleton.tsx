import * as React from "react";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  variant?: "kpi" | "table" | "chart" | "card";
  lines?: number;
}

const LoadingSkeleton = React.forwardRef<HTMLDivElement, LoadingSkeletonProps>(
  ({ className, variant = "card", lines = 3, ...props }, ref) => {
    const renderContent = () => {
      switch (variant) {
        case "kpi":
          return (
            <div className="animate-pulse">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2 w-24"></div>
                  <div className="h-8 bg-gray-200 rounded mb-2 w-32"></div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 bg-gray-200 rounded w-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          );

        case "table":
          return (
            <div className="animate-pulse">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-gray-200 rounded w-32"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>

              {/* Table rows */}
              <div className="space-y-3">
                {[...Array(lines)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3 border-b border-gray-100"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="flex gap-1">
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );

        case "chart":
          return (
            <div className="animate-pulse">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </div>

              {/* Chart area */}
              <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>

              {/* Legend */}
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          );

        default:
          return (
            <div className="animate-pulse space-y-3">
              {[...Array(lines)].map((_, i) => (
                <div
                  key={i}
                  className="h-4 bg-gray-200 rounded"
                  style={{
                    width: `${Math.random() * 40 + 60}%`,
                  }}
                ></div>
              ))}
            </div>
          );
      }
    };

    return (
      <div ref={ref} className={cn("p-6", className)} {...props}>
        {renderContent()}
      </div>
    );
  },
);
LoadingSkeleton.displayName = "LoadingSkeleton";

// Specific skeleton components for different use cases
const KPISkeleton = React.forwardRef<HTMLDivElement, LoadingSkeletonProps>(
  (props, ref) => <LoadingSkeleton ref={ref} variant="kpi" {...props} />,
);
KPISkeleton.displayName = "KPISkeleton";

const TableSkeleton = React.forwardRef<HTMLDivElement, LoadingSkeletonProps>(
  (props, ref) => <LoadingSkeleton ref={ref} variant="table" {...props} />,
);
TableSkeleton.displayName = "TableSkeleton";

const ChartSkeleton = React.forwardRef<HTMLDivElement, LoadingSkeletonProps>(
  (props, ref) => <LoadingSkeleton ref={ref} variant="chart" {...props} />,
);
ChartSkeleton.displayName = "ChartSkeleton";

export { LoadingSkeleton, KPISkeleton, TableSkeleton, ChartSkeleton };
