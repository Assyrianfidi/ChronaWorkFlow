/**
 * Loading States, Skeletons, Error States, and Empty States
 * Reusable UI components for data fetching states
 */

import React from "react";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

export function SkeletonCard() {
  return (
    <div className="animate-pulse bg-surface rounded-lg p-6 border border-border">
      <div className="h-4 bg-borderHeavy rounded w-1/3 mb-4"></div>
      <div className="h-8 bg-borderHeavy rounded w-2/3 mb-2"></div>
      <div className="h-3 bg-borderLight rounded w-1/2"></div>
    </div>
  );
}

export function SkeletonWidget() {
  return (
    <div className="animate-pulse bg-surface rounded-xl p-6 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="h-5 bg-borderHeavy rounded w-1/3"></div>
        <div className="h-8 w-8 bg-borderHeavy rounded"></div>
      </div>
      <div className="space-y-4">
        <div className="h-10 bg-borderHeavy rounded w-1/2"></div>
        <div className="h-4 bg-borderLight rounded w-3/4"></div>
        <div className="h-4 bg-borderLight rounded w-2/3"></div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <div className="h-4 bg-borderHeavy rounded w-1/4"></div>
          <div className="h-4 bg-borderLight rounded w-1/3"></div>
          <div className="h-4 bg-borderLight rounded w-1/5"></div>
          <div className="h-4 bg-borderHeavy rounded w-1/6"></div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="animate-pulse">
      <div className="h-64 bg-borderLight rounded-lg flex items-end justify-around p-4 space-x-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-borderHeavy rounded-t w-full"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// ERROR STATE COMPONENTS
// ============================================================================

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We encountered an error loading this data. Please try again.",
  onRetry,
  showRetry = true,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-error" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-textPrimary mb-2">{title}</h3>
      <p className="text-sm text-textSecondary mb-6 max-w-md">{message}</p>
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryHover transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Retry loading data"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Try Again
        </button>
      )}
    </div>
  );
}

export function ErrorCard({ title, message, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-surface rounded-xl p-6 border border-error/20">
      <ErrorState title={title} message={message} onRetry={onRetry} />
    </div>
  );
}

// ============================================================================
// EMPTY STATE COMPONENTS
// ============================================================================

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  title = "No data available",
  message = "There is no data to display at this time.",
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
        {icon || (
          <Inbox className="w-8 h-8 text-textTertiary" aria-hidden="true" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-textPrimary mb-2">{title}</h3>
      <p className="text-sm text-textSecondary mb-6 max-w-md">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryHover transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label={action.label}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function EmptyCard({ title, message, icon, action }: EmptyStateProps) {
  return (
    <div className="bg-surface rounded-xl p-6 border border-border">
      <EmptyState title={title} message={message} icon={icon} action={action} />
    </div>
  );
}

// ============================================================================
// LOADING SPINNER
// ============================================================================

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div
      className={`${sizeClasses[size]} border-primary border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function LoadingOverlay({
  message = "Loading...",
}: {
  message?: string;
}) {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-xl">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-sm text-textSecondary">{message}</p>
    </div>
  );
}

// ============================================================================
// INLINE LOADING STATE
// ============================================================================

export function InlineLoading({
  message = "Loading...",
}: {
  message?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-4">
      <LoadingSpinner size="sm" />
      <span className="text-sm text-textSecondary">{message}</span>
    </div>
  );
}

// ============================================================================
// DATA FETCH WRAPPER
// ============================================================================

interface DataFetchWrapperProps<T> {
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  data?: T | null;
  onRetry?: () => void;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  children: (data: T) => React.ReactNode;
  isEmpty?: (data: T) => boolean;
}

export function DataFetchWrapper<T>({
  isLoading,
  isError,
  error,
  data,
  onRetry,
  loadingComponent,
  errorComponent,
  emptyComponent,
  children,
  isEmpty,
}: DataFetchWrapperProps<T>) {
  if (isLoading) {
    return <>{loadingComponent || <SkeletonWidget />}</>;
  }

  if (isError) {
    return (
      <>
        {errorComponent || (
          <ErrorCard
            title="Failed to load data"
            message={error?.message || "An unexpected error occurred"}
            onRetry={onRetry}
          />
        )}
      </>
    );
  }

  if (!data || (isEmpty && isEmpty(data))) {
    return <>{emptyComponent || <EmptyCard />}</>;
  }

  return <>{children(data)}</>;
}
