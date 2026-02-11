/**
 * Executive Command Center - Primary Dashboard
 *
 * Role-aware dashboard that answers at a glance:
 * - Risks & Alerts
 * - Smart Insights
 * - Active Automations
 * - Business Impact Metrics
 * - Trends & Forecasts
 */

import React, { useState } from "react";
import {
  useExecutiveDashboard,
  useExplainability,
  useCreateAutomation,
} from "../../hooks/useIntelligence";
import { InsightCard } from "./InsightCard";
import { ExplainabilityPanel } from "./ExplainabilityPanel";
import { AutomationActivityCenter } from "./AutomationActivityCenter";
import { BusinessImpactMetrics } from "./BusinessImpactMetrics";
import { SmartInsight } from "../../types/intelligence";
import {
  AlertTriangle,
  Brain,
  Zap,
  TrendingUp,
  RefreshCw,
  Settings,
} from "lucide-react";

export const ExecutiveCommandCenter: React.FC = () => {
  const { data: dashboardData, isLoading, refetch } = useExecutiveDashboard();
  const [selectedInsight, setSelectedInsight] = useState<SmartInsight | null>(
    null,
  );
  const { isOpen, openExplainability, closeExplainability } =
    useExplainability(selectedInsight);
  const [activeTab, setActiveTab] = useState<"insights" | "automations">(
    "insights",
  );
  const createAutomation = useCreateAutomation();

  const handleExplain = (insight: SmartInsight) => {
    setSelectedInsight(insight);
    openExplainability();
  };

  const handleAction = async (
    insight: SmartInsight,
    actionType: string,
    automationTemplate?: string,
  ) => {
    if (actionType === "automation" && automationTemplate) {
      // Navigate to automation builder with pre-filled template
      console.log("Activating automation template:", automationTemplate);
      // TODO: Implement navigation to automation builder
    } else if (actionType === "review") {
      // Navigate to related resource
      console.log("Navigating to review:", insight.relatedEntities);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const {
    risksAndAlerts,
    smartInsights,
    activeAutomations,
    businessImpact,
    recentExecutions,
    automationStats,
    limits,
  } = dashboardData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Executive Command Center
            </h1>
            <p className="text-gray-600 mt-1">
              Your financial co-pilot at a glance
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Business Impact Metrics */}
      <BusinessImpactMetrics
        metrics={businessImpact}
        stats={automationStats}
        limits={limits}
      />

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("insights")}
            className={`${
              activeTab === "insights"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
          >
            <Brain className="w-5 h-5" />
            <span>Smart Insights</span>
            {smartInsights.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                {smartInsights.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("automations")}
            className={`${
              activeTab === "automations"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
          >
            <Zap className="w-5 h-5" />
            <span>Active Automations</span>
            {activeAutomations.length > 0 && (
              <span className="ml-2 bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                {activeAutomations.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === "insights" ? (
        <div className="space-y-6">
          {/* Critical Risks & Alerts */}
          {risksAndAlerts.length > 0 && (
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Risks & Alerts
                </h2>
                <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {risksAndAlerts.length}
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {risksAndAlerts.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    onExplain={() => handleExplain(insight)}
                    onAction={(actionType, template) =>
                      handleAction(insight, actionType, template)
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {/* All Smart Insights */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  All Insights
                </h2>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <TrendingUp className="w-4 h-4" />
                <span>Updated in real-time</span>
              </div>
            </div>
            {smartInsights.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-12 text-center">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Insights Yet
                </h3>
                <p className="text-gray-600">
                  We're analyzing your financial data. Check back soon for
                  intelligent insights.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {smartInsights
                  .filter((i) => !risksAndAlerts.find((r) => r.id === i.id))
                  .map((insight) => (
                    <InsightCard
                      key={insight.id}
                      insight={insight}
                      onExplain={() => handleExplain(insight)}
                      onAction={(actionType, template) =>
                        handleAction(insight, actionType, template)
                      }
                    />
                  ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <AutomationActivityCenter
          automations={activeAutomations}
          executions={recentExecutions}
          stats={automationStats}
        />
      )}

      {/* Explainability Panel */}
      {selectedInsight && (
        <ExplainabilityPanel
          insight={selectedInsight}
          isOpen={isOpen}
          onClose={closeExplainability}
        />
      )}
    </div>
  );
};
