import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  loading?: boolean;
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  variant = 'default',
  loading = false,
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-white border-gray-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200',
  };

  const trendStyles = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  };

  const trendIcons = {
    up: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    ),
    down: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 14l-7 7m0 0l-7-7m7 7V3"
        />
      </svg>
    ),
    neutral: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 12h14"
        />
      </svg>
    ),
  };

  if (loading) {
    return (
      <div
        className={`rounded-lg border p-6 ${variantStyles[variant]} ${className}`}
        role="status"
        aria-label={`Loading ${title}`}
      >
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-1/3"></div>
        </div>
        <span className="sr-only">Loading {title}</span>
      </div>
    );
  }

  return (
    <article
      className={`rounded-lg border p-6 ${variantStyles[variant]} ${className}`}
      aria-labelledby={`kpi-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3
            id={`kpi-${title.replace(/\s+/g, '-').toLowerCase()}`}
            className="text-sm font-medium text-gray-600 mb-2"
          >
            {title}
          </h3>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div
              className={`flex items-center mt-2 text-sm font-medium ${trendStyles[trend]}`}
              aria-label={`Trend: ${trend} ${trendValue}`}
            >
              {trendIcons[trend]}
              <span className="ml-1">{trendValue}</span>
              <span className="sr-only">
                {trend === 'up' ? 'increasing' : trend === 'down' ? 'decreasing' : 'stable'}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="ml-4 flex-shrink-0" aria-hidden="true">
            {icon}
          </div>
        )}
      </div>
    </article>
  );
};
