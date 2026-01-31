/**
 * Insight Card Component
 * 
 * Displays smart insights with severity badges, actions, and explainability
 */

import React from 'react';
import { SmartInsight, InsightSeverity } from '../../types/intelligence';
import { AlertTriangle, Info, AlertCircle, ChevronRight, Zap, X } from 'lucide-react';
import { useAnalytics, useDismissInsight } from '../../hooks/useIntelligence';

interface InsightCardProps {
  insight: SmartInsight;
  onExplain: () => void;
  onAction?: (actionType: string, automationTemplate?: string) => void;
  showActions?: boolean;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  onExplain,
  onAction,
  showActions = true,
}) => {
  const { trackEvent } = useAnalytics();
  const dismissMutation = useDismissInsight();

  const handleDismiss = async () => {
    await dismissMutation.mutateAsync({
      insightId: insight.id,
      reason: 'User dismissed from dashboard',
    });
    
    trackEvent({
      eventType: 'INSIGHT_DISMISSED',
      insightId: insight.id,
      metadata: { insightType: insight.insightType, severity: insight.severity },
    });
  };

  const handleActionClick = (action: any) => {
    if (onAction) {
      onAction(action.type, action.automationTemplate);
    }
    
    trackEvent({
      eventType: 'ACTION_CLICKED',
      insightId: insight.id,
      metadata: { actionType: action.type, automationTemplate: action.automationTemplate },
    });
  };

  const handleViewInsight = () => {
    trackEvent({
      eventType: 'INSIGHT_VIEWED',
      insightId: insight.id,
      metadata: { insightType: insight.insightType, severity: insight.severity },
    });
  };

  const getSeverityConfig = (severity: InsightSeverity) => {
    switch (severity) {
      case InsightSeverity.CRITICAL:
        return {
          icon: AlertCircle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          badgeBg: 'bg-red-100',
          badgeText: 'text-red-800',
          label: 'Critical',
        };
      case InsightSeverity.WARNING:
        return {
          icon: AlertTriangle,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          badgeBg: 'bg-yellow-100',
          badgeText: 'text-yellow-800',
          label: 'Warning',
        };
      case InsightSeverity.INFO:
        return {
          icon: Info,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          badgeBg: 'bg-blue-100',
          badgeText: 'text-blue-800',
          label: 'Info',
        };
    }
  };

  const config = getSeverityConfig(insight.severity);
  const Icon = config.icon;

  return (
    <div
      className={`${config.bgColor} ${config.borderColor} border rounded-lg p-5 hover:shadow-md transition-shadow relative`}
      onClick={handleViewInsight}
    >
      {/* Dismiss Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Dismiss insight"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="flex items-start space-x-3 mb-3">
        <Icon className={`w-6 h-6 ${config.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className={`${config.badgeBg} ${config.badgeText} text-xs font-semibold px-2 py-1 rounded`}>
              {config.label}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(insight.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {insight.title}
          </h3>
          <p className="text-gray-700 text-sm leading-relaxed">
            {insight.description}
          </p>
        </div>
      </div>

      {/* Confidence Indicator */}
      <div className="flex items-center space-x-2 mb-4">
        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${
              insight.confidence >= 0.9
                ? 'bg-green-600'
                : insight.confidence >= 0.7
                ? 'bg-blue-600'
                : 'bg-yellow-600'
            }`}
            style={{ width: `${insight.confidence * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-600 font-medium">
          {(insight.confidence * 100).toFixed(0)}% confident
        </span>
      </div>

      {/* Actions */}
      {showActions && insight.suggestedActions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-gray-900">Suggested Actions</span>
          </div>
          <div className="space-y-2">
            {insight.suggestedActions.slice(0, 2).map((action, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  handleActionClick(action);
                }}
                className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left group"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700">
                    {action.label}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {action.description}
                  </div>
                  {action.estimatedImpact && (
                    <div className="text-xs text-green-600 font-medium mt-1">
                      {action.estimatedImpact}
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Explainability CTA */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onExplain();
        }}
        className="mt-4 w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center justify-center space-x-2"
      >
        <Info className="w-4 h-4" />
        <span>How We Detected This</span>
      </button>
    </div>
  );
};
