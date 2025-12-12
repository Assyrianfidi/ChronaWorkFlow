import React from 'react';
// @ts-ignore
import * as React from "react";
// @ts-ignore
import { cn } from '../../lib/utils.js.js';

// Loading Spinner Component
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "primary" | "secondary" | "success" | "warning" | "error";
  className?: string;
}

// @ts-ignore
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "primary",
  className,
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "w-4 h-4";
      case "md":
        return "w-6 h-6";
      case "lg":
        return "w-8 h-8";
      case "xl":
        return "w-12 h-12";
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case "primary":
        return "text-primary-600";
      case "secondary":
        return "text-gray-600";
      case "success":
        return "text-success-600";
      case "warning":
        return "text-warning-600";
      case "error":
        return "text-error-600";
    }
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        getSizeClasses(),
        getColorClasses(),
        className,
      )}
    />
  );
};

// Pulse Loader Component
interface PulseLoaderProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "success" | "warning" | "error";
  className?: string;
}

// @ts-ignore
export const PulseLoader: React.FC<PulseLoaderProps> = ({
  size = "md",
  color = "primary",
  className,
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "w-4 h-4";
      case "md":
        return "w-6 h-6";
      case "lg":
        return "w-8 h-8";
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case "primary":
        return "bg-primary-600";
      case "secondary":
        return "bg-gray-600";
      case "success":
        return "bg-success-600";
      case "warning":
        return "bg-warning-600";
      case "error":
        return "bg-error-600";
    }
  };

  return (
    <div
      className={cn(
        "animate-pulse rounded-full",
        getSizeClasses(),
        getColorClasses(),
        className,
      )}
    />
  );
};

// Dots Loader Component
interface DotsLoaderProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "success" | "warning" | "error";
  className?: string;
}

// @ts-ignore
export const DotsLoader: React.FC<DotsLoaderProps> = ({
  size = "md",
  color = "primary",
  className,
}) => {
  const getDotSize = () => {
    switch (size) {
      case "sm":
        return "w-2 h-2";
      case "md":
        return "w-3 h-3";
      case "lg":
        return "w-4 h-4";
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case "primary":
        return "bg-primary-600";
      case "secondary":
        return "bg-gray-600";
      case "success":
        return "bg-success-600";
      case "warning":
        return "bg-warning-600";
      case "error":
        return "bg-error-600";
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            "rounded-full animate-bounce",
            getDotSize(),
            getColorClasses(),
          )}
          style={{
            animationDelay: `${index * 0.1}s`,
            animationDuration: "0.6s",
          }}
        />
      ))}
    </div>
  );
};

// Skeleton Components
interface SkeletonProps {
  className?: string;
  variant?: "default" | "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

// @ts-ignore
export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = "default",
  width,
  height,
  animation = "pulse",
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "text":
        return "rounded-md h-4";
      case "circular":
        return "rounded-full";
      case "rectangular":
        return "rounded-lg";
      default:
        return "rounded-lg";
    }
  };

  const getAnimationClasses = () => {
    switch (animation) {
      case "pulse":
        return "animate-pulse";
      case "wave":
        return "animate-shimmer";
      case "none":
        return "";
      default:
        return "animate-pulse";
    }
  };

  const style = {
    width: width || "100%",
    height: height || "1.2em",
  };

  return (
    <div
      className={cn(
        "bg-gray-200",
        getVariantClasses(),
        getAnimationClasses(),
        className,
      )}
      style={style}
    />
  );
};

// Card Skeleton
interface CardSkeletonProps {
  showHeader?: boolean;
  showAvatar?: boolean;
  lines?: number;
  className?: string;
}

// @ts-ignore
export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  showHeader = true,
  showAvatar = false,
  lines = 3,
  className,
}) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-6 shadow-card",
        className,
      )}
    >
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {showAvatar && (
              <Skeleton variant="circular" width={40} height={40} />
            )}
            <div className="space-y-2">
              <Skeleton width={120} height={20} />
              <Skeleton width={80} height={16} />
            </div>
          </div>
          <Skeleton width={60} height={24} />
        </div>
      )}

      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            width={index === lines - 1 ? "75%" : "100%"}
            height={16}
          />
        ))}
      </div>
    </div>
  );
};

// Table Skeleton
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

// @ts-ignore
export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  className,
}) => {
  return (
    <div className={cn("w-full", className)}>
      {showHeader && (
        <div className="border-b border-gray-200 pb-4 mb-4">
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, index) => (
              <Skeleton key={index} height={20} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                height={16}
                width={colIndex === columns - 1 ? "75%" : "100%"}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// List Skeleton
interface ListSkeletonProps {
  items?: number;
  showAvatar?: boolean;
  className?: string;
}

// @ts-ignore
export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  items = 5,
  showAvatar = true,
  className,
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          {showAvatar && <Skeleton variant="circular" width={40} height={40} />}
          <div className="flex-1 space-y-2">
            <Skeleton width={index % 3 === 0 ? "60%" : "80%"} height={16} />
            <Skeleton width="40%" height={14} />
          </div>
          <Skeleton width={80} height={24} />
        </div>
      ))}
    </div>
  );
};

// Chart Skeleton
interface ChartSkeletonProps {
  height?: string | number;
  showLegend?: boolean;
  className?: string;
}

// @ts-ignore
export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({
  height = 300,
  showLegend = true,
  className,
}) => {
  return (
    <div className={cn("w-full", className)}>
      <div className="space-y-4">
        {/* Chart Area */}
        <div className="relative">
          <Skeleton height={height} variant="rectangular" />

          {/* Simulate chart elements */}
          <div className="absolute inset-0 flex items-end justify-around p-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton
                key={index}
                width={20}
                height={Math.random() * 60 + 20}
                className="animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex items-center justify-center gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <Skeleton variant="circular" width={12} height={12} />
                <Skeleton width={60} height={14} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Full Page Loading
interface FullPageLoadingProps {
  message?: string;
  showLogo?: boolean;
  variant?: "spinner" | "dots" | "pulse";
}

// @ts-ignore
export const FullPageLoading: React.FC<FullPageLoadingProps> = ({
  message = "Loading...",
  showLogo = true,
  variant = "spinner",
}) => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center space-y-4">
        {showLogo && (
          <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mx-auto">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
        )}

        <div className="flex justify-center">
          {variant === "spinner" && <LoadingSpinner size="xl" />}
          {variant === "dots" && <DotsLoader size="lg" />}
          {variant === "pulse" && <PulseLoader size="lg" />}
        </div>

        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
};

// Loading Overlay
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  variant?: "spinner" | "dots" | "pulse";
  children: React.ReactNode;
}

// @ts-ignore
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = "Loading...",
  variant = "spinner",
  children,
}) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
          <div className="text-center space-y-3">
            {variant === "spinner" && <LoadingSpinner size="lg" />}
            {variant === "dots" && <DotsLoader size="md" />}
            {variant === "pulse" && <PulseLoader size="md" />}
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default {
  LoadingSpinner,
  PulseLoader,
  DotsLoader,
  Skeleton,
  CardSkeleton,
  TableSkeleton,
  ListSkeleton,
  ChartSkeleton,
  FullPageLoading,
  LoadingOverlay,
};
