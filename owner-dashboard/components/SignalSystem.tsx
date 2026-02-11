/**
 * Signal-First Design System
 * Status indicators, trend arrows, and confidence meters
 * Executive-friendly visual signals replacing raw numbers
 */

import React from 'react';
import {
  ArrowUp,
  ArrowDown,
  Minus,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';

// Signal Types
export type StatusLevel = 'healthy' | 'degraded' | 'critical' | 'unknown';
export type TrendDirection = 'up' | 'down' | 'stable' | 'unknown';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

// Props Interfaces
interface StatusIndicatorProps {
  status: StatusLevel;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  pulse?: boolean;
  className?: string;
}

interface TrendIndicatorProps {
  direction: TrendDirection;
  value?: number | string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface ConfidenceMeterProps {
  level: ConfidenceLevel;
  percentage?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface SignalCardProps {
  title: string;
  status: StatusLevel;
  trend?: TrendDirection;
  trendValue?: string;
  confidence?: ConfidenceLevel;
  value?: string;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

// Status Indicator Component
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = 'md',
  showLabel = true,
  pulse = false,
  className = '',
}) => {
  const statusConfig = {
    healthy: {
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500',
      bgSoft: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      label: label || 'Healthy',
    },
    degraded: {
      icon: AlertTriangle,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500',
      bgSoft: 'bg-amber-50',
      borderColor: 'border-amber-200',
      label: label || 'Degraded',
    },
    critical: {
      icon: XCircle,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500',
      bgSoft: 'bg-rose-50',
      borderColor: 'border-rose-200',
      label: label || 'Critical',
    },
    unknown: {
      icon: HelpCircle,
      color: 'text-slate-400',
      bgColor: 'bg-slate-400',
      bgSoft: 'bg-slate-50',
      borderColor: 'border-slate-200',
      label: label || 'Unknown',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const containerSizes = {
    sm: 'gap-1.5 px-2 py-1 text-xs',
    md: 'gap-2 px-3 py-1.5 text-sm',
    lg: 'gap-2 px-4 py-2 text-base',
  };

  return (
    <div
      className={`inline-flex items-center rounded-full border ${config.borderColor} ${config.bgSoft} ${containerSizes[size]} ${className}`}
    >
      <span className={`relative flex ${sizeClasses[size]}`}>
        <span className={`absolute inline-flex h-full w-full rounded-full ${config.bgColor} opacity-20 ${pulse ? 'animate-ping' : ''}`} />
        <span className={`relative inline-flex rounded-full ${config.bgColor} ${sizeClasses[size]}`} />
      </span>
      {showLabel && (
        <>
          <Icon className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} ${config.color}`} />
          <span className={`font-medium ${config.color}`}>{config.label}</span>
        </>
      )}
    </div>
  );
};

// Trend Indicator Component
export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  direction,
  value,
  label,
  size = 'md',
  className = '',
}) => {
  const trendConfig = {
    up: {
      icon: ArrowUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      label: label || 'Increasing',
    },
    down: {
      icon: ArrowDown,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      label: label || 'Decreasing',
    },
    stable: {
      icon: Minus,
      color: 'text-slate-500',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      label: label || 'Stable',
    },
    unknown: {
      icon: HelpCircle,
      color: 'text-slate-400',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      label: label || 'No Data',
    },
  };

  const config = trendConfig[direction];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-lg border ${config.borderColor} ${config.bgColor} ${sizeClasses[size]} ${className}`}
    >
      <Icon className={`${iconSizes[size]} ${config.color}`} />
      {value !== undefined && (
        <span className={`font-semibold ${config.color}`}>{value}</span>
      )}
      <span className={`${config.color}`}>{config.label}</span>
    </div>
  );
};

// Confidence Meter Component
export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({
  level,
  percentage,
  label,
  size = 'md',
  className = '',
}) => {
  const confidenceConfig = {
    high: {
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      label: label || 'High Confidence',
      bars: 3,
    },
    medium: {
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      label: label || 'Medium Confidence',
      bars: 2,
    },
    low: {
      color: 'bg-rose-500',
      textColor: 'text-rose-600',
      label: label || 'Low Confidence',
      bars: 1,
    },
  };

  const config = confidenceConfig[level];
  const displayPercentage = percentage ?? (level === 'high' ? 95 : level === 'medium' ? 65 : 35);

  const sizeClasses = {
    sm: 'h-1.5 w-8',
    md: 'h-2 w-12',
    lg: 'h-2.5 w-16',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Bar visualization */}
      <div className={`flex gap-0.5 ${sizeClasses[size]}`}>
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className={`flex-1 rounded-full transition-all ${
              bar <= config.bars ? config.color : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>
      
      {/* Percentage or label */}
      {percentage !== undefined ? (
        <span className={`font-semibold ${config.textColor} ${textSizes[size]}`}>
          {displayPercentage}%
        </span>
      ) : (
        <span className={`${config.textColor} ${textSizes[size]}`}>{config.label}</span>
      )}
    </div>
  );
};

// Signal Card - Executive-friendly status card
export const SignalCard: React.FC<SignalCardProps> = ({
  title,
  status,
  trend,
  trendValue,
  confidence,
  value,
  subtitle,
  onClick,
  className = '',
}) => {
  const statusBgColors = {
    healthy: 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-300',
    degraded: 'bg-amber-50/50 border-amber-100 hover:border-amber-300',
    critical: 'bg-rose-50/50 border-rose-100 hover:border-rose-300',
    unknown: 'bg-slate-50/50 border-slate-100 hover:border-slate-300',
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all cursor-pointer ${
        statusBgColors[status]
      } ${onClick ? 'hover:shadow-md active:scale-[0.99]' : ''} ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
        <StatusIndicator status={status} showLabel={false} size="sm" pulse={status === 'critical'} />
      </div>

      {/* Value */}
      {value && (
        <div className="mb-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</span>
        </div>
      )}

      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{subtitle}</p>
      )}

      {/* Footer with trend and confidence */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
        {trend && (
          <TrendIndicator direction={trend} value={trendValue} size="sm" />
        )}
        {confidence && (
          <ConfidenceMeter level={confidence} size="sm" />
        )}
      </div>
    </div>
  );
};

// Signal Grid - Dashboard grid for signals
export const SignalGrid: React.FC<{
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}> = ({ children, columns = 4, className = '' }) => {
  const columnClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5',
  };

  return (
    <div className={`grid ${columnClasses[columns]} gap-4 ${className}`}>
      {children}
    </div>
  );
};

// Alert Signal - High-visibility alert for critical items
export const AlertSignal: React.FC<{
  level: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  className?: string;
}> = ({ level, title, message, action, onDismiss, className = '' }) => {
  const alertConfig = {
    info: {
      icon: Activity,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      messageColor: 'text-blue-700',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-600',
      titleColor: 'text-amber-900',
      messageColor: 'text-amber-700',
      buttonColor: 'bg-amber-600 hover:bg-amber-700',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      iconColor: 'text-rose-600',
      titleColor: 'text-rose-900',
      messageColor: 'text-rose-700',
      buttonColor: 'bg-rose-600 hover:bg-rose-700',
    },
    success: {
      icon: CheckCircle2,
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      iconColor: 'text-emerald-600',
      titleColor: 'text-emerald-900',
      messageColor: 'text-emerald-700',
      buttonColor: 'bg-emerald-600 hover:bg-emerald-700',
    },
  };

  const config = alertConfig[level];
  const Icon = config.icon;

  return (
    <div className={`rounded-xl border ${config.borderColor} ${config.bgColor} p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold ${config.titleColor}`}>{title}</h4>
          <p className={`text-sm mt-1 ${config.messageColor}`}>{message}</p>
          
          {action && (
            <button
              onClick={action.onClick}
              className={`mt-3 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${config.buttonColor}`}
            >
              {action.label}
            </button>
          )}
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-black/5 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>
    </div>
  );
};

export default {
  StatusIndicator,
  TrendIndicator,
  ConfidenceMeter,
  SignalCard,
  SignalGrid,
  AlertSignal,
};
