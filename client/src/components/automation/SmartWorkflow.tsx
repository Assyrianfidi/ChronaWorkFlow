import React, { useState, useCallback, useMemo } from "react";
// @ts-ignore
import { useAutomation } from './AutomationEngine.js.js';

// Workflow Types
interface WorkflowStep {
  id: string;
  name: string;
  type: "manual" | "automated" | "decision" | "parallel" | "delay";
  config: {
    description?: string;
    assignee?: string;
    timeout?: number;
    conditions?: any[];
    actions?: any[];
    parallelSteps?: string[];
    delay?: number;
  };
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  position: { x: number; y: number };
  connections: { from: string; to: string; condition?: string }[];
  metadata: {
    createdAt: number;
    startedAt?: number;
    completedAt?: number;
    duration?: number;
    error?: string;
  };
}

interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  category:
    | "business"
    | "technical"
    | "approval"
    | "notification"
    | "integration";
  version: string;
  steps: WorkflowStep[];
  variables: Record<string, any>;
  settings: {
    timeout: number;
    retryAttempts: number;
    parallelExecution: boolean;
    errorHandling: "stop" | "continue" | "retry";
  };
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  version: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  currentStep: string | null;
  variables: Record<string, any>;
  steps: Record<string, WorkflowStep>;
  startTime: number;
  endTime?: number;
  progress: number;
  logs: WorkflowLog[];
  metadata: {
    triggeredBy: string;
    triggerData: any;
    environment: string;
  };
}

interface WorkflowLog {
  id: string;
  stepId: string;
  timestamp: number;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  data?: any;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: Omit<
    WorkflowStep,
    "id" | "status" | "metadata" | "position" | "connections"
  >[];
  variables: Record<
    string,
    { type: string; default?: any; required?: boolean }
  >;
  tags: string[];
  popularity: number;
}

// Smart Workflow Component
// @ts-ignore
export const SmartWorkflow: React.FC<{
  workflow?: WorkflowDefinition;
  onWorkflowChange?: (workflow: WorkflowDefinition) => void;
  readOnly?: boolean;
}> = ({ workflow, onWorkflowChange, readOnly = false }) => {
  const { executeRule, createRule } = useAutomation();

  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);

  // Workflow templates
  const templates: WorkflowTemplate[] = useMemo(
    () => [
      {
        id: "approval-workflow",
        name: "Document Approval",
        description: "Multi-level document approval workflow",
        category: "approval",
        steps: [
          {
            name: "Submit Document",
            type: "manual",
            config: {
              description: "User submits document for approval",
              assignee: "submitter",
            },
          },
          {
            name: "Manager Review",
            type: "manual",
            config: {
              description: "Manager reviews and approves/rejects",
              assignee: "manager",
            },
          },
          {
            name: "Final Approval",
            type: "decision",
            config: {
              description: "Final approval based on manager decision",
              conditions: [
                {
                  field: "managerDecision",
                  operator: "equals",
                  value: "approved",
                },
              ],
            },
          },
        ],
        variables: {
          documentId: { type: "string", required: true },
          submitter: { type: "string", required: true },
          manager: { type: "string", required: true },
          priority: { type: "string", default: "normal" },
        },
        tags: ["approval", "document", "business"],
        popularity: 85,
      },
      {
        id: "incident-response",
        name: "Incident Response",
        description: "Automated incident response workflow",
        category: "technical",
        steps: [
          {
            name: "Detect Incident",
            type: "automated",
            config: {
              description: "Monitor system for incidents",
              actions: [
                {
                  type: "monitor",
                  config: { metrics: ["error_rate", "response_time"] },
                },
              ],
            },
          },
          {
            name: "Assess Severity",
            type: "decision",
            config: {
              description: "Assess incident severity",
              conditions: [{ field: "impact", operator: "greater", value: 5 }],
            },
          },
          {
            name: "Notify Team",
            type: "automated",
            config: {
              description: "Notify response team",
              actions: [
                {
                  type: "notification",
                  config: { channels: ["email", "slack"] },
                },
              ],
            },
          },
          {
            name: "Resolve Incident",
            type: "manual",
            config: {
              description: "Team resolves the incident",
              assignee: "response_team",
            },
          },
        ],
        variables: {
          incidentId: { type: "string", required: true },
          impact: { type: "number", required: true },
          urgency: { type: "string", default: "medium" },
        },
        tags: ["incident", "technical", "response"],
        popularity: 92,
      },
      {
        id: "onboarding",
        name: "Employee Onboarding",
        description: "New employee onboarding process",
        category: "business",
        steps: [
          {
            name: "Create Account",
            type: "automated",
            config: {
              description: "Create system accounts",
              actions: [
                { type: "api", config: { endpoint: "/api/users/create" } },
              ],
            },
          },
          {
            name: "Send Welcome Email",
            type: "automated",
            config: {
              description: "Send welcome email with instructions",
              actions: [{ type: "email", config: { template: "welcome" } }],
            },
          },
          {
            name: "Schedule Training",
            type: "manual",
            config: {
              description: "Schedule initial training sessions",
              assignee: "hr",
            },
          },
          {
            name: "Assign Mentor",
            type: "manual",
            config: {
              description: "Assign a mentor for the new employee",
              assignee: "manager",
            },
          },
        ],
        variables: {
          employeeId: { type: "string", required: true },
          department: { type: "string", required: true },
          role: { type: "string", required: true },
          startDate: { type: "date", required: true },
        },
        tags: ["hr", "onboarding", "business"],
        popularity: 78,
      },
    ],
    [],
  );

  const handleStepSelect = useCallback(
    (stepId: string) => {
      if (!readOnly) {
        setSelectedStep(stepId);
      }
    },
    [readOnly],
  );

  const handleStepUpdate = useCallback(
    (stepId: string, updates: Partial<WorkflowStep>) => {
      if (!workflow || !onWorkflowChange || readOnly) return;

      const updatedWorkflow = {
        ...workflow,
        steps: workflow.steps.map((step) =>
          step.id === stepId ? { ...step, ...updates } : step,
        ),
        updatedAt: Date.now(),
      };

      onWorkflowChange(updatedWorkflow);
    },
    [workflow, onWorkflowChange, readOnly],
  );

  const handleAddStep = useCallback(
    (
      template: Omit<
        WorkflowStep,
        "id" | "status" | "metadata" | "position" | "connections"
      >,
    ) => {
      if (!workflow || !onWorkflowChange || readOnly) return;

      const newStep: WorkflowStep = {
        ...template,
        id: Math.random().toString(36),
        status: "pending",
        position: { x: 100, y: 100 },
        connections: [],
        metadata: {
          createdAt: Date.now(),
        },
      };

      const updatedWorkflow = {
        ...workflow,
        steps: [...workflow.steps, newStep],
        updatedAt: Date.now(),
      };

      onWorkflowChange(updatedWorkflow);
      setSelectedStep(newStep.id);
    },
    [workflow, onWorkflowChange, readOnly],
  );

  const handleDeleteStep = useCallback(
    (stepId: string) => {
      if (!workflow || !onWorkflowChange || readOnly) return;

      const updatedWorkflow = {
        ...workflow,
        steps: workflow.steps.filter((step) => step.id !== stepId),
        updatedAt: Date.now(),
      };

      onWorkflowChange(updatedWorkflow);
      if (selectedStep === stepId) {
        setSelectedStep(null);
      }
    },
    [workflow, onWorkflowChange, readOnly, selectedStep],
  );

  const handleExecuteWorkflow = useCallback(async () => {
    if (!workflow || isExecuting) return;

    setIsExecuting(true);

    try {
      // Create automation rule for workflow execution
      const rule = await createRule({
        name: `Execute Workflow: ${workflow.name}`,
        description: "Execute smart workflow",
        category: "workflow",
        trigger: {
          type: "manual",
          config: {},
        },
        conditions: [],
        actions: [
          {
            type: "workflow",
            config: {
              workflowId: workflow.id,
              parameters: workflow.variables,
            },
          },
        ],
        enabled: true,
        priority: "medium",
      });

      // Execute the rule
      const execution = await executeRule(rule.id, "manual");
      setExecutionId(execution.id);
    } catch (error) {
      console.error("Workflow execution failed:", error);
    } finally {
      setIsExecuting(false);
    }
  }, [workflow, isExecuting, createRule, executeRule]);

  const handleApplyTemplate = useCallback(
    (template: WorkflowTemplate) => {
      if (!onWorkflowChange || readOnly) return;

      const newWorkflow: WorkflowDefinition = {
        id: Math.random().toString(36),
        name: template.name,
        description: template.description,
// @ts-ignore
// @ts-ignore
        category: template.category as any,
        version: "1.0.0",
        steps: template.steps.map((step, index) => ({
          ...step,
          id: Math.random().toString(36),
          status: "pending" as const,
          position: {
            x: 100 + (index % 3) * 200,
            y: 100 + Math.floor(index / 3) * 150,
          },
          connections: [],
          metadata: {
            createdAt: Date.now(),
          },
        })),
        variables: Object.fromEntries(
          Object.entries(template.variables).map(([key, config]) => [
            key,
            config.default,
          ]),
        ),
        settings: {
          timeout: 3600000, // 1 hour
          retryAttempts: 3,
          parallelExecution: false,
          errorHandling: "stop",
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: "current-user",
      };

      try {
// @ts-ignore
// @ts-ignore
        const maybePromise = onWorkflowChange(newWorkflow as any);

        // Support both sync and async handlers. If the handler returns a Promise and it
        // rejects, keep the template library open so the user can correct the issue.
// @ts-ignore
// @ts-ignore
        if (typeof (maybePromise as any)?.then === "function") {
// @ts-ignore
          (maybePromise as Promise<unknown>)
            .then(() => {
              setShowTemplateLibrary(false);
            })
            .catch((error) => {
              console.error("Error applying workflow template:", error);
            });
        } else {
          setShowTemplateLibrary(false);
        }
      } catch (error) {
        console.error("Error applying workflow template:", error);
      }
    },
    [onWorkflowChange, readOnly],
  );

  const renderStep = (step: WorkflowStep) => {
    const isSelected = selectedStep === step.id;
    const stepTypeColors = {
      manual: "bg-blue-500",
      automated: "bg-green-500",
      decision: "bg-yellow-500",
      parallel: "bg-purple-500",
      delay: "bg-gray-500",
    };

    return (
      <div
        key={step.id}
        className={`absolute bg-white border-2 rounded-lg p-4 cursor-pointer transition-all ${
          isSelected
            ? "border-blue-500 shadow-lg"
            : "border-gray-300 hover:border-gray-400"
        } ${readOnly ? "cursor-default" : ""}`}
        style={{
          left: step.position.x,
          top: step.position.y,
          minWidth: 150,
        }}
        onClick={() => handleStepSelect(step.id)}
      >
        <div className="flex items-center mb-2">
          <div
            className={`w-3 h-3 rounded-full ${stepTypeColors[step.type]} mr-2`}
          />
          <span className="font-medium text-sm">{step.name}</span>
        </div>
        <div className="text-xs text-gray-600 mb-2">{step.type}</div>
        {step.config.description && (
          <div className="text-xs text-gray-500">{step.config.description}</div>
        )}
        <div className="flex items-center justify-between mt-2">
          <span
            className={`text-xs px-2 py-1 rounded ${
              step.status === "completed"
                ? "bg-green-100 text-green-800"
                : step.status === "failed"
                  ? "bg-red-100 text-red-800"
                  : step.status === "running"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
            }`}
          >
            {step.status}
          </span>
          {!readOnly && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteStep(step.id);
              }}
              className="text-red-500 hover:text-red-700 text-xs"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderTemplateLibrary = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Workflow Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="border rounded-lg p-4 cursor-pointer hover:border-blue-500"
                onClick={() => handleApplyTemplate(template)}
              >
                <h4 className="font-medium">{template.name}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {template.description}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {template.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {template.steps.length} steps
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-blue-50 text-blue-700 px-1 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setShowTemplateLibrary(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderStepEditor = () => {
    if (!selectedStep || !workflow) return null;

    const step = workflow.steps.find((s) => s.id === selectedStep);
    if (!step) return null;

    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <h3 className="font-semibold mb-4">Edit Step: {step.name}</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={step.name}
              onChange={(e) =>
                handleStepUpdate(selectedStep, { name: e.target.value })
              }
              className="w-full p-2 border rounded"
              disabled={readOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={step.type}
              onChange={(e) =>
// @ts-ignore
// @ts-ignore
                handleStepUpdate(selectedStep, { type: e.target.value as any })
              }
              className="w-full p-2 border rounded"
              disabled={readOnly}
            >
              <option value="manual">Manual</option>
              <option value="automated">Automated</option>
              <option value="decision">Decision</option>
              <option value="parallel">Parallel</option>
              <option value="delay">Delay</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={step.config.description || ""}
              onChange={(e) =>
                handleStepUpdate(selectedStep, {
                  config: { ...step.config, description: e.target.value },
                })
              }
              className="w-full p-2 border rounded"
              rows={3}
              disabled={readOnly}
            />
          </div>

          {step.type === "manual" && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Assignee
                <input
                  type="text"
                  value={step.config.assignee || ""}
                  onChange={(e) =>
                    handleStepUpdate(selectedStep, {
                      config: { ...step.config, assignee: e.target.value },
                    })
                  }
                  className="w-full p-2 border rounded mt-1"
                  placeholder="User ID or role"
                  disabled={readOnly}
                />
              </label>
            </div>
          )}

          {step.type === "delay" && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Delay (minutes)
                <input
                  type="number"
                  value={step.config.delay || 0}
                  onChange={(e) =>
                    handleStepUpdate(selectedStep, {
                      config: {
                        ...step.config,
                        delay: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full p-2 border rounded mt-1"
                  disabled={readOnly}
                />
              </label>
            </div>
          )}

          {step.type === "decision" && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Conditions
              </label>
              <div className="space-y-2">
                {step.config.conditions?.map((condition, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={condition.field || ""}
                      onChange={(e) => {
                        const newConditions = [
                          ...(step.config.conditions || []),
                        ];
                        newConditions[index] = {
                          ...condition,
                          field: e.target.value,
                        };
                        handleStepUpdate(selectedStep, {
                          config: { ...step.config, conditions: newConditions },
                        });
                      }}
                      className="flex-1 p-2 border rounded"
                      placeholder="Field"
                      disabled={readOnly}
                    />
                    <input
                      type="text"
                      value={condition.value || ""}
                      onChange={(e) => {
                        const newConditions = [
                          ...(step.config.conditions || []),
                        ];
                        newConditions[index] = {
                          ...condition,
                          value: e.target.value,
                        };
                        handleStepUpdate(selectedStep, {
                          config: { ...step.config, conditions: newConditions },
                        });
                      }}
                      className="flex-1 p-2 border rounded"
                      placeholder="Value"
                      disabled={readOnly}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!workflow) {
    return (
      <>
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Workflow Selected
            </h3>
            <p className="text-gray-600 mb-4">
              Create a new workflow or select an existing one
            </p>
            <button
              onClick={() => setShowTemplateLibrary(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create from Template
            </button>
          </div>
        </div>
        {showTemplateLibrary && renderTemplateLibrary()}
      </>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 bg-gray-50 relative overflow-hidden">
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          {!readOnly && (
            <>
              <button
                onClick={() => setShowTemplateLibrary(true)}
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Templates
              </button>
              <button
                onClick={handleExecuteWorkflow}
                disabled={isExecuting}
                className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
              >
                {isExecuting ? "Executing..." : "Execute"}
              </button>
            </>
          )}
        </div>

        <div className="relative w-full h-full" style={{ minHeight: 600 }}>
          {workflow.steps.map(renderStep)}

          {/* Render connections */}
          <svg className="absolute inset-0 pointer-events-none">
            {workflow.steps.flatMap((step) =>
              step.connections.map((connection, index) => {
                const fromStep = workflow.steps.find(
                  (s) => s.id === connection.from,
                );
                const toStep = workflow.steps.find(
                  (s) => s.id === connection.to,
                );

                if (!fromStep || !toStep) return null;

                return (
                  <line
                    key={`${step.id}-${index}`}
                    x1={fromStep.position.x + 75}
                    y1={fromStep.position.y + 50}
                    x2={toStep.position.x + 75}
                    y2={toStep.position.y + 50}
                    stroke="#9CA3AF"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                );
              }),
            )}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#9CA3AF" />
              </marker>
            </defs>
          </svg>
        </div>

        {showTemplateLibrary && renderTemplateLibrary()}
      </div>

      {selectedStep && renderStepEditor()}
    </div>
  );
};

export default SmartWorkflow;
