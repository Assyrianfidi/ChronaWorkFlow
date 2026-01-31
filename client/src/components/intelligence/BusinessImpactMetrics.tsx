/**
 * Business Impact Metrics Component
 * 
 * Displays quantified business value from automation and insights
 */

import React from 'react';
import { DollarSign, Shield, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { BusinessImpactMetrics as MetricsType, AutomationStats, AutomationLimits } from '../../types/intelligence';

interface BusinessImpactMetricsProps {
  metrics: MetricsType;
  stats: AutomationStats;
  limits: AutomationLimits;
}

export const BusinessImpactMetrics: React.FC<BusinessImpactMetricsProps> = ({
  metrics,
  stats,
  limits,
}) => {
  const metricCards = [
    {
      label: 'Money Saved',
      value: `$${metrics.moneySaved.toLocaleString()}`,
      icon: DollarSign,
      color: 'green',
      description: 'Estimated savings from automated risk prevention',
    },
    {
      label: 'Risks Prevented',
      value: metrics.risksPrevented.toString(),
      icon: Shield,
      color: 'red',
      description: 'Potential issues caught before they became problems',
    },
    {
      label: 'Time Automated',
      value: `${Math.floor(metrics.timeAutomated / 60)}h ${metrics.timeAutomated % 60}m`,
      icon: Clock,
      color: 'blue',
      description: 'Time saved through automation this month',
    },
    {
      label: 'Success Rate',
      value: `${stats.successRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'purple',
      description: `${stats.successful} of ${stats.total} automations succeeded`,
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; icon: string; text: string }> = {
      green: { bg: 'bg-green-50', icon: 'text-green-600', text: 'text-green-900' },
      red: { bg: 'bg-red-50', icon: 'text-red-600', text: 'text-red-900' },
      blue: { bg: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-900' },
      purple: { bg: 'bg-purple-50', icon: 'text-purple-600', text: 'text-purple-900' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="mb-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metricCards.map((metric) => {
          const colors = getColorClasses(metric.color);
          const Icon = metric.icon;
          
          return (
            <div
              key={metric.label}
              className={`${colors.bg} rounded-lg p-5 border border-gray-200`}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-8 h-8 ${colors.icon}`} />
                <TrendingUp className="w-4 h-4 text-gray-400" />
              </div>
              <div className={`text-3xl font-bold ${colors.text} mb-1`}>
                {metric.value}
              </div>
              <div className="text-sm font-medium text-gray-700 mb-1">
                {metric.label}
              </div>
              <div className="text-xs text-gray-600">
                {metric.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan Limits Banner */}
      {!limits.withinLimits && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-yellow-900 mb-1">
              Automation Limit Reached
            </h3>
            <p className="text-sm text-yellow-800">
              You've used {limits.executionsThisMonth} of {limits.maxExecutionsPerMonth} monthly executions.
              Upgrade your plan to unlock more automations.
            </p>
          </div>
          <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium">
            Upgrade Plan
          </button>
        </div>
      )}
    </div>
  );
};
