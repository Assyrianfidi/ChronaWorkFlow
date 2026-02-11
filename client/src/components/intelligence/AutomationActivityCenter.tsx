/**
 * Automation Activity Center
 *
 * Displays automation execution history, success/failure status,
 * business impact, and manual override controls
 */

import React, { useState } from "react";
import {
  AutomationRule,
  AutomationExecution,
  AutomationStats,
  AutomationExecutionStatus,
} from "../../types/intelligence";
import {
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Pause,
  Eye,
  Filter,
  ChevronDown,
} from "lucide-react";
import {
  useExecuteAutomation,
  usePreviewAutomation,
} from "../../hooks/useIntelligence";

interface AutomationActivityCenterProps {
  automations: AutomationRule[];
  executions: AutomationExecution[];
  stats: AutomationStats;
}

export const AutomationActivityCenter: React.FC<
  AutomationActivityCenterProps
> = ({ automations, executions, stats }) => {
  const [selectedAutomation, setSelectedAutomation] = useState<string | null>(
    null,
  );
  const [filterStatus, setFilterStatus] = useState<
    AutomationExecutionStatus | "ALL"
  >("ALL");
  const executeAutomation = useExecuteAutomation();
  const previewAutomation = usePreviewAutomation();

  const filteredExecutions =
    filterStatus === "ALL"
      ? executions
      : executions.filter((e) => e.status === filterStatus);

  const getStatusConfig = (status: AutomationExecutionStatus) => {
    switch (status) {
      case "SUCCESS":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bg: "bg-green-50",
          label: "Success",
        };
      case "FAILED":
        return {
          icon: XCircle,
          color: "text-red-600",
          bg: "bg-red-50",
          label: "Failed",
        };
      case "RUNNING":
        return {
          icon: Clock,
          color: "text-blue-600",
          bg: "bg-blue-50",
          label: "Running",
        };
      case "PENDING":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bg: "bg-yellow-50",
          label: "Pending",
        };
      case "SKIPPED":
        return {
          icon: ChevronDown,
          color: "text-gray-600",
          bg: "bg-gray-50",
          label: "Skipped",
        };
      case "CANCELLED":
        return {
          icon: XCircle,
          color: "text-orange-600",
          bg: "bg-orange-50",
          label: "Cancelled",
        };
    }
  };

  const handleManualExecution = async (ruleId: string) => {
    try {
      await executeAutomation.mutateAsync({
        ruleId,
        triggerData: {},
      });
    } catch (error) {
      console.error("Failed to execute automation:", error);
    }
  };

  const handlePreview = async (ruleId: string) => {
    try {
      const result = await previewAutomation.mutateAsync({
        ruleId,
        sampleData: {},
      });
      console.log("Preview result:", result);
      // TODO: Show preview modal
    } catch (error) {
      console.error("Failed to preview automation:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Automations */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Active Automations
        </h2>
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {automations.length === 0 ? (
            <div className="p-8 text-center">
              <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Active Automations
              </h3>
              <p className="text-gray-600">
                Create your first automation to start saving time and preventing
                risks.
              </p>
            </div>
          ) : (
            automations.map((automation) => (
              <div
                key={automation.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {automation.name}
                      </h3>
                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                        {automation.status}
                      </span>
                    </div>
                    {automation.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {automation.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{automation.successCount} successful</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span>{automation.failureCount} failed</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>
                          Last:{" "}
                          {automation.lastTriggered
                            ? new Date(
                                automation.lastTriggered,
                              ).toLocaleString()
                            : "Never"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handlePreview(automation.id)}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center space-x-2"
                      title="Preview (Dry Run)"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => handleManualExecution(automation.id)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-2"
                      title="Execute Now"
                    >
                      <Play className="w-4 h-4" />
                      <span>Run</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Recent Executions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Executions
          </h2>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(
                  e.target.value as AutomationExecutionStatus | "ALL",
                )
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="RUNNING">Running</option>
              <option value="PENDING">Pending</option>
              <option value="SKIPPED">Skipped</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Automation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trigger
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conditions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExecutions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No executions found
                    </td>
                  </tr>
                ) : (
                  filteredExecutions.map((execution) => {
                    const statusConfig = getStatusConfig(execution.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <tr key={execution.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={`flex items-center space-x-2 ${statusConfig.color}`}
                          >
                            <StatusIcon className="w-5 h-5" />
                            <span className="text-sm font-medium">
                              {statusConfig.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {execution.rule?.name || "Unknown"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {execution.rule?.triggerType || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded ${
                              execution.conditionsMet
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {execution.conditionsMet ? "Met" : "Not Met"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {execution.actionsExecuted.length} executed
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {new Date(execution.createdAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {execution.executionTime
                              ? `${execution.executionTime}ms`
                              : "N/A"}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
