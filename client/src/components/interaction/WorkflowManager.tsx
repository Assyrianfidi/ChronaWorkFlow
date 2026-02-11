declare global {
  interface Window {
    [key: string]: any;
  }
}

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useUserExperienceMode } from "@/components/adaptive/UserExperienceMode";
import { usePerformance } from "@/components/adaptive/UI-Performance-Engine";

// Workflow types and interfaces
export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: "action" | "decision" | "data" | "automation" | "validation";
  component?: React.ComponentType<any>;
  config: WorkflowStepConfig;
  dependencies: string[];
  conditions?: WorkflowCondition[];
  timeout?: number;
  retries?: number;
  parallel?: boolean;
}

export interface WorkflowStepConfig {
  [key: string]: any;
  action?: string;
  data?: any;
  validation?: ValidationRule[];
  automation?: AutomationConfig;
  ui?: UIConfig;
}

export interface ValidationRule {
  field: string;
  rule: "required" | "min" | "max" | "pattern" | "custom";
  value?: any;
  message?: string;
  validator?: (value: any) => boolean | Promise<boolean>;
}

export interface AutomationConfig {
  type:
    | "api"
    | "calculation"
    | "data-transform"
    | "notification"
    | "integration";
  endpoint?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: any;
  headers?: Record<string, string>;
  transform?: (data: any) => any;
  condition?: (data: any) => boolean;
}

export interface UIConfig {
  title?: string;
  description?: string;
  layout?: "form" | "wizard" | "modal" | "sidebar" | "fullscreen";
  fields?: UIField[];
  actions?: UIAction[];
  progress?: boolean;
  help?: string;
}

export interface UIField {
  id: string;
  type:
    | "text"
    | "number"
    | "select"
    | "checkbox"
    | "radio"
    | "date"
    | "file"
    | "textarea";
  label: string;
  placeholder?: string;
  required?: boolean;
  validation?: ValidationRule[];
  options?: { value: any; label: string }[];
  defaultValue?: any;
  disabled?: boolean;
  hidden?: boolean;
}

export interface UIAction {
  id: string;
  label: string;
  type: "primary" | "secondary" | "danger" | "success";
  action:
    | "submit"
    | "cancel"
    | "previous"
    | "next"
    | "save"
    | "delete"
    | "custom";
  disabled?: boolean;
  hidden?: boolean;
  loading?: boolean;
  onClick?: () => void | Promise<void>;
}

export interface WorkflowCondition {
  field: string;
  operator:
    | "equals"
    | "not-equals"
    | "greater-than"
    | "less-than"
    | "contains"
    | "custom";
  value: any;
  validator?: (value: any) => boolean;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status:
    | "pending"
    | "running"
    | "completed"
    | "failed"
    | "cancelled"
    | "paused";
  currentStepId: string | null;
  completedSteps: string[];
  data: Record<string, any>;
  startTime: number;
  endTime?: number;
  error?: string;
  metadata: Record<string, any>;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  permissions: string[];
  settings: WorkflowSettings;
  metadata: Record<string, any>;
}

export interface WorkflowTrigger {
  type: "manual" | "schedule" | "event" | "webhook" | "condition";
  config: Record<string, any>;
}

export interface WorkflowSettings {
  timeout: number;
  retries: number;
  parallel: boolean;
  notifications: boolean;
  logging: boolean;
  validation: "strict" | "lenient" | "disabled";
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: Omit<WorkflowStep, "id">[];
  variables: WorkflowVariable[];
}

export interface WorkflowVariable {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  defaultValue?: any;
  required?: boolean;
  description?: string;
}

// Context for workflow manager
interface WorkflowContextType {
  workflows: Workflow[];
  executions: WorkflowExecution[];
  templates: WorkflowTemplate[];
  currentExecution: WorkflowExecution | null;
  createWorkflow: (workflow: Omit<Workflow, "id">) => Promise<Workflow>;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => Promise<Workflow>;
  deleteWorkflow: (id: string) => Promise<void>;
  executeWorkflow: (
    workflowId: string,
    data?: Record<string, any>,
  ) => Promise<WorkflowExecution>;
  pauseExecution: (executionId: string) => Promise<void>;
  resumeExecution: (executionId: string) => Promise<void>;
  cancelExecution: (executionId: string) => Promise<void>;
  getExecutionHistory: (workflowId: string) => WorkflowExecution[];
  validateWorkflow: (workflow: Workflow) => ValidationResult;
  importTemplate: (
    templateId: string,
    variables: Record<string, any>,
  ) => Promise<Workflow>;
  exportWorkflow: (workflowId: string) => Promise<WorkflowTemplate>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  stepId: string;
  field: string;
  message: string;
  severity: "error" | "warning" | "info";
}

export interface ValidationWarning {
  stepId: string;
  message: string;
  type: "performance" | "security" | "best-practice";
}

const WorkflowContext = React.createContext<WorkflowContextType | null>(null);

// Workflow Execution Engine
class WorkflowExecutionEngine {
  private executions: Map<string, WorkflowExecution> = new Map();
  private workflows: Map<string, Workflow> = new Map();
  private eventListeners: Map<string, ((event: any) => void)[]> = new Map();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for workflow events
    if (typeof window !== "undefined") {
      window.addEventListener(
        "workflow-event",
        this.handleWorkflowEvent.bind(this),
      );
    }
  }

  private handleWorkflowEvent(event: CustomEvent): void {
    const { type, data } = event.detail;

    // Notify listeners
    const listeners = this.eventListeners.get(type) || [];
    listeners.forEach((listener) => listener(data));
  }

  async executeWorkflow(
    workflow: Workflow,
    initialData: Record<string, any> = {},
  ): Promise<WorkflowExecution> {
    const execution: WorkflowExecution = {
      id: this.generateId(),
      workflowId: workflow.id,
      status: "pending",
      currentStepId: null,
      completedSteps: [],
      data: { ...initialData },
      startTime: Date.now(),
      metadata: {},
    };

    this.executions.set(execution.id, execution);

    try {
      this.emitEvent("execution-started", { execution, workflow });

      execution.status = "running";
      await this.executeSteps(workflow.steps, execution);

      execution.status = "completed";
      execution.endTime = Date.now();

      this.emitEvent("execution-completed", { execution, workflow });
    } catch (error) {
      execution.status = "failed";
      execution.error =
        error instanceof Error ? error.message : "Unknown error";
      execution.endTime = Date.now();

      this.emitEvent("execution-failed", { execution, workflow, error });
    }

    return execution;
  }

  private async executeSteps(
    steps: WorkflowStep[],
    execution: WorkflowExecution,
  ): Promise<void> {
    const stepMap = new Map(steps.map((step) => [step.id, step]));
    const visited = new Set<string>();

    for (const step of steps) {
      if (this.canExecuteStep(step, execution, visited)) {
        await this.executeStep(step, execution);
        visited.add(step.id);
        execution.completedSteps.push(step.id);
      }
    }
  }

  private canExecuteStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
    visited: Set<string>,
  ): boolean {
    // Check if already visited
    if (visited.has(step.id)) return false;

    // Check dependencies
    if (step.dependencies.length > 0) {
      return step.dependencies.every((depId) =>
        execution.completedSteps.includes(depId),
      );
    }

    // Check conditions
    if (step.conditions) {
      return step.conditions.every((condition) =>
        this.evaluateCondition(condition, execution.data),
      );
    }

    return true;
  }

  private async executeStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
  ): Promise<void> {
    execution.currentStepId = step.id;
    this.emitEvent("step-started", { step, execution });

    try {
      switch (step.type) {
        case "action":
          await this.executeActionStep(step, execution);
          break;
        case "decision":
          await this.executeDecisionStep(step, execution);
          break;
        case "data":
          await this.executeDataStep(step, execution);
          break;
        case "automation":
          await this.executeAutomationStep(step, execution);
          break;
        case "validation":
          await this.executeValidationStep(step, execution);
          break;
      }

      this.emitEvent("step-completed", { step, execution });
    } catch (error) {
      this.emitEvent("step-failed", { step, execution, error });

      // Handle retries
      const retries = step.retries || 0;
      if (retries > 0) {
        step.retries = retries - 1;
        await this.executeStep(step, execution);
      } else {
        throw error;
      }
    }
  }

  private async executeActionStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
  ): Promise<void> {
    // Execute user action or UI interaction
    if (step.config.action) {
      // This would trigger UI components or user interactions
      console.log(`Executing action: ${step.config.action}`);
    }
  }

  private async executeDecisionStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
  ): Promise<void> {
    // Evaluate decision logic and branch workflow
    if (step.config.conditions) {
      const result = step.config.conditions.every((condition) =>
        this.evaluateCondition(condition, execution.data),
      );
      execution.data[`${step.id}_result`] = result;
    }
  }

  private async executeDataStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
  ): Promise<void> {
    // Process or transform data
    if (step.config.data) {
      Object.assign(execution.data, step.config.data);
    }
  }

  private async executeAutomationStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
  ): Promise<void> {
    const automation = step.config.automation;
    if (!automation) return;

    switch (automation.type) {
      case "api":
        await this.executeApiAutomation(automation, execution);
        break;
      case "calculation":
        await this.executeCalculationAutomation(automation, execution);
        break;
      case "data-transform":
        await this.executeDataTransformAutomation(automation, execution);
        break;
      case "notification":
        await this.executeNotificationAutomation(automation, execution);
        break;
      case "integration":
        await this.executeIntegrationAutomation(automation, execution);
        break;
    }
  }

  private async executeApiAutomation(
    automation: AutomationConfig,
    execution: WorkflowExecution,
  ): Promise<void> {
    if (!automation.endpoint) return;

    const response = await fetch(automation.endpoint, {
      method: automation.method || "GET",
      headers: automation.headers,
      body: automation.data ? JSON.stringify(automation.data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (automation.transform) {
      execution.data[`${automation.type}_result`] = automation.transform(data);
    } else {
      execution.data[`${automation.type}_result`] = data;
    }
  }

  private async executeCalculationAutomation(
    automation: AutomationConfig,
    execution: WorkflowExecution,
  ): Promise<void> {
    // Execute calculations based on automation config
    // This would integrate with calculation engines or custom functions
    console.log("Executing calculation automation");
  }

  private async executeDataTransformAutomation(
    automation: AutomationConfig,
    execution: WorkflowExecution,
  ): Promise<void> {
    if (automation.transform && execution.data) {
      const transformedData = automation.transform(execution.data);
      execution.data[`${automation.type}_result`] = transformedData;
    }
  }

  private async executeNotificationAutomation(
    automation: AutomationConfig,
    execution: WorkflowExecution,
  ): Promise<void> {
    // Send notifications
    this.emitEvent("notification", {
      type: "workflow-notification",
      data: automation.data,
      execution,
    });
  }

  private async executeIntegrationAutomation(
    automation: AutomationConfig,
    execution: WorkflowExecution,
  ): Promise<void> {
    // Execute third-party integrations
    console.log("Executing integration automation");
  }

  private async executeValidationStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
  ): Promise<void> {
    if (!step.config.validation) return;

    for (const rule of step.config.validation) {
      const value = execution.data[rule.field];
      let isValid = true;

      switch (rule.rule) {
        case "required":
          isValid = value !== undefined && value !== null && value !== "";
          break;
        case "min":
          isValid = typeof value === "number" && value >= (rule.value || 0);
          break;
        case "max":
          isValid = typeof value === "number" && value <= (rule.value || 0);
          break;
        case "pattern":
          isValid = new RegExp(rule.value || "").test(String(value));
          break;
        case "custom":
          isValid = rule.validator ? await rule.validator(value) : true;
          break;
      }

      if (!isValid) {
        throw new Error(
          rule.message || `Validation failed for field: ${rule.field}`,
        );
      }
    }
  }

  private evaluateCondition(
    condition: WorkflowCondition,
    data: Record<string, any>,
  ): boolean {
    const value = data[condition.field];

    switch (condition.operator) {
      case "equals":
        return value === condition.value;
      case "not-equals":
        return value !== condition.value;
      case "greater-than":
        return typeof value === "number" && value > condition.value;
      case "less-than":
        return typeof value === "number" && value < condition.value;
      case "contains":
        return (
          typeof value === "string" && value.includes(String(condition.value))
        );
      case "custom":
        return condition.validator ? condition.validator(value) : true;
      default:
        return false;
    }
  }

  private emitEvent(type: string, data: any): void {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("workflow-event", { detail: { type, data } }),
      );
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Public methods
  getExecution(id: string): WorkflowExecution | undefined {
    return this.executions.get(id);
  }

  getAllExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values());
  }

  addWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);
  }

  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  getAllWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  removeWorkflow(id: string): void {
    this.workflows.delete(id);
  }

  addEventListener(type: string, listener: (event: any) => void): void {
    const listeners = this.eventListeners.get(type) || [];
    listeners.push(listener);
    this.eventListeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: (event: any) => void): void {
    const listeners = this.eventListeners.get(type) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(type, listeners);
    }
  }
}

// Built-in workflow templates
const BUILTIN_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "user-onboarding",
    name: "User Onboarding",
    description: "Complete user onboarding process",
    category: "User Management",
    steps: [
      {
        name: "Collect User Information",
        description: "Gather basic user details",
        type: "data",
        config: {
          ui: {
            title: "Personal Information",
            layout: "form",
            fields: [
              {
                id: "firstName",
                type: "text",
                label: "First Name",
                required: true,
              },
              {
                id: "lastName",
                type: "text",
                label: "Last Name",
                required: true,
              },
              { id: "email", type: "text", label: "Email", required: true },
            ],
          },
        },
        dependencies: [],
      },
      {
        name: "Verify Email",
        description: "Send and verify email address",
        type: "automation",
        config: {
          automation: {
            type: "api",
            endpoint: "/api/auth/send-verification",
            method: "POST",
          },
        },
        dependencies: ["collect-user-info"],
      },
      {
        name: "Setup Preferences",
        description: "Configure user preferences",
        type: "action",
        config: {
          ui: {
            title: "Preferences",
            layout: "wizard",
            fields: [
              {
                id: "theme",
                type: "select",
                label: "Theme",
                options: [
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ],
              },
              {
                id: "notifications",
                type: "checkbox",
                label: "Enable Notifications",
              },
            ],
          },
        },
        dependencies: ["verify-email"],
      },
    ],
    variables: [
      { id: "userId", name: "User ID", type: "string", required: true },
      { id: "role", name: "Role", type: "string", defaultValue: "user" },
    ],
  },
  {
    id: "invoice-processing",
    name: "Invoice Processing",
    description: "Process and approve invoices",
    category: "Finance",
    steps: [
      {
        name: "Upload Invoice",
        description: "Upload invoice document",
        type: "data",
        config: {
          ui: {
            title: "Invoice Upload",
            layout: "form",
            fields: [
              {
                id: "file",
                type: "file",
                label: "Invoice File",
                required: true,
              },
              { id: "amount", type: "number", label: "Amount", required: true },
              { id: "vendor", type: "text", label: "Vendor", required: true },
            ],
          },
        },
        dependencies: [],
      },
      {
        name: "Validate Invoice",
        description: "Validate invoice data",
        type: "validation",
        config: {
          validation: [
            {
              field: "amount",
              rule: "min",
              value: 0,
              message: "Amount must be positive",
            },
            {
              field: "vendor",
              rule: "required",
              message: "Vendor is required",
            },
          ],
        },
        dependencies: ["upload-invoice"],
      },
      {
        name: "Send for Approval",
        description: "Send invoice to approver",
        type: "automation",
        config: {
          automation: {
            type: "notification",
            data: {
              message: "Invoice requires approval",
              recipients: ["finance-team"],
            },
          },
        },
        dependencies: ["validate-invoice"],
      },
    ],
    variables: [
      { id: "invoiceId", name: "Invoice ID", type: "string", required: true },
      {
        id: "approverId",
        name: "Approver ID",
        type: "string",
        required: true,
      },
    ],
  },
];

// Main Workflow Manager Component
export function WorkflowManager({ children }: { children: React.ReactNode }) {
  const { currentMode } = useUserExperienceMode();
  const { isLowPerformanceMode } = usePerformance();

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [templates, setTemplates] =
    useState<WorkflowTemplate[]>(BUILTIN_TEMPLATES);
  const [currentExecution, setCurrentExecution] =
    useState<WorkflowExecution | null>(null);

  const engineRef = useRef<WorkflowExecutionEngine>();

  // Initialize engine
  useEffect(() => {
    engineRef.current = new WorkflowExecutionEngine();

    // Load saved workflows
    const savedWorkflows = localStorage.getItem("workflows");
    if (savedWorkflows) {
      try {
        const parsed = JSON.parse(savedWorkflows);
        setWorkflows(parsed);
        parsed.forEach((workflow: Workflow) => {
          engineRef.current?.addWorkflow(workflow);
        });
      } catch (error) {
        console.error("Failed to load workflows:", error);
      }
    }

    // Load saved executions
    const savedExecutions = localStorage.getItem("workflow-executions");
    if (savedExecutions) {
      try {
        const parsed = JSON.parse(savedExecutions);
        setExecutions(parsed);
      } catch (error) {
        console.error("Failed to load executions:", error);
      }
    }

    // Setup event listeners
    const handleExecutionUpdate = () => {
      if (engineRef.current) {
        setExecutions(engineRef.current.getAllExecutions());
      }
    };

    engineRef.current.addEventListener(
      "execution-started",
      handleExecutionUpdate,
    );
    engineRef.current.addEventListener(
      "execution-completed",
      handleExecutionUpdate,
    );
    engineRef.current.addEventListener(
      "execution-failed",
      handleExecutionUpdate,
    );

    return () => {
      engineRef.current?.removeEventListener(
        "execution-started",
        handleExecutionUpdate,
      );
      engineRef.current?.removeEventListener(
        "execution-completed",
        handleExecutionUpdate,
      );
      engineRef.current?.removeEventListener(
        "execution-failed",
        handleExecutionUpdate,
      );
    };
  }, []);

  // Save workflows to localStorage
  useEffect(() => {
    localStorage.setItem("workflows", JSON.stringify(workflows));
  }, [workflows]);

  // Save executions to localStorage
  useEffect(() => {
    localStorage.setItem("workflow-executions", JSON.stringify(executions));
  }, [executions]);

  const createWorkflow = useCallback(
    async (workflow: Omit<Workflow, "id">): Promise<Workflow> => {
      const newWorkflow: Workflow = {
        ...workflow,
        id: Math.random().toString(36).substr(2, 9),
        version: "1.0.0",
      };

      setWorkflows((prev) => [...prev, newWorkflow]);
      engineRef.current?.addWorkflow(newWorkflow);

      return newWorkflow;
    },
    [],
  );

  const updateWorkflow = useCallback(
    async (id: string, updates: Partial<Workflow>): Promise<Workflow> => {
      const workflow = workflows.find((w) => w.id === id);
      if (!workflow) {
        throw new Error(`Workflow not found: ${id}`);
      }

      const updatedWorkflow = { ...workflow, ...updates };
      setWorkflows((prev) =>
        prev.map((w) => (w.id === id ? updatedWorkflow : w)),
      );
      engineRef.current?.addWorkflow(updatedWorkflow);

      return updatedWorkflow;
    },
    [workflows],
  );

  const deleteWorkflow = useCallback(async (id: string): Promise<void> => {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
    engineRef.current?.removeWorkflow(id);
  }, []);

  const executeWorkflow = useCallback(
    async (
      workflowId: string,
      data: Record<string, any> = {},
    ): Promise<WorkflowExecution> => {
      const workflow = workflows.find((w) => w.id === workflowId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      if (!engineRef.current) {
        throw new Error("Workflow engine not initialized");
      }

      const execution = await engineRef.current.executeWorkflow(workflow, data);
      setCurrentExecution(execution);

      return execution;
    },
    [workflows],
  );

  const pauseExecution = useCallback(
    async (executionId: string): Promise<void> => {
      // Implementation for pausing executions
      console.log(`Pausing execution: ${executionId}`);
    },
    [],
  );

  const resumeExecution = useCallback(
    async (executionId: string): Promise<void> => {
      // Implementation for resuming executions
      console.log(`Resuming execution: ${executionId}`);
    },
    [],
  );

  const cancelExecution = useCallback(
    async (executionId: string): Promise<void> => {
      // Implementation for canceling executions
      console.log(`Cancelling execution: ${executionId}`);
    },
    [],
  );

  const getExecutionHistory = useCallback(
    (workflowId: string): WorkflowExecution[] => {
      return executions.filter((e) => e.workflowId === workflowId);
    },
    [executions],
  );

  const validateWorkflow = useCallback(
    (workflow: Workflow): ValidationResult => {
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];

      // Validate step dependencies
      const stepIds = new Set(workflow.steps.map((s) => s.id));
      workflow.steps.forEach((step) => {
        step.dependencies.forEach((dep) => {
          if (!stepIds.has(dep)) {
            errors.push({
              stepId: step.id,
              field: "dependencies",
              message: `Dependency not found: ${dep}`,
              severity: "error",
            });
          }
        });
      });

      // Check for circular dependencies
      const visited = new Set<string>();
      const recursionStack = new Set<string>();

      const hasCircularDependency = (stepId: string): boolean => {
        if (recursionStack.has(stepId)) return true;
        if (visited.has(stepId)) return false;

        visited.add(stepId);
        recursionStack.add(stepId);

        const step = workflow.steps.find((s) => s.id === stepId);
        if (step) {
          for (const dep of step.dependencies) {
            if (hasCircularDependency(dep)) return true;
          }
        }

        recursionStack.delete(stepId);
        return false;
      };

      workflow.steps.forEach((step) => {
        if (hasCircularDependency(step.id)) {
          errors.push({
            stepId: step.id,
            field: "dependencies",
            message: "Circular dependency detected",
            severity: "error",
          });
        }
      });

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    },
    [],
  );

  const importTemplate = useCallback(
    async (
      templateId: string,
      variables: Record<string, any>,
    ): Promise<Workflow> => {
      const template = templates.find((t) => t.id === templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      const workflow: Workflow = {
        id: Math.random().toString(36).substr(2, 9),
        name: template.name,
        description: template.description,
        category: template.category,
        version: "1.0.0",
        steps: template.steps.map((step, index) => ({
          ...step,
          id: `step-${index}`,
        })),
        triggers: [{ type: "manual", config: {} }],
        permissions: [],
        settings: {
          timeout: 300000, // 5 minutes
          retries: 3,
          parallel: false,
          notifications: true,
          logging: true,
          validation: "strict",
        },
        metadata: {
          templateId: template.id,
          importedAt: Date.now(),
          variables,
        },
      };

      setWorkflows((prev) => [...prev, workflow]);
      engineRef.current?.addWorkflow(workflow);

      return workflow;
    },
    [templates],
  );

  const exportWorkflow = useCallback(
    async (workflowId: string): Promise<WorkflowTemplate> => {
      const workflow = workflows.find((w) => w.id === workflowId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      const template: WorkflowTemplate = {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        category: workflow.category,
        steps: workflow.steps.map((step) => {
          const { id, ...stepWithoutId } = step;
          return stepWithoutId;
        }),
        variables: [],
      };

      return template;
    },
    [workflows],
  );

  const contextValue: WorkflowContextType = {
    workflows,
    executions,
    templates,
    currentExecution,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    executeWorkflow,
    pauseExecution,
    resumeExecution,
    cancelExecution,
    getExecutionHistory,
    validateWorkflow,
    importTemplate,
    exportWorkflow,
  };

  return (
    <WorkflowContext.Provider value={contextValue}>
      {children}
    </WorkflowContext.Provider>
  );
}

// Hook for using workflow manager
export function useWorkflowManager() {
  const context = React.useContext(WorkflowContext);
  if (!context) {
    throw new Error("useWorkflowManager must be used within WorkflowManager");
  }
  return context;
}

// Workflow Builder Component
export function WorkflowBuilder() {
  const { createWorkflow, templates } = useWorkflowManager();
  const [selectedTemplate, setSelectedTemplate] =
    useState<WorkflowTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, any>>({});

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      await createWorkflow({
        name: selectedTemplate.name,
        version: "1.0.0",
        description: selectedTemplate.description,
        category: selectedTemplate.category,
        steps: selectedTemplate.steps.map((step, index) => ({
          ...step,
          id: `step-${index}`,
        })),
        triggers: [{ type: "manual", config: {} }],
        permissions: [],
        settings: {
          timeout: 300000,
          retries: 3,
          parallel: false,
          notifications: true,
          logging: true,
          validation: "strict",
        },
        metadata: {},
      });

      setSelectedTemplate(null);
      setVariables({});
    } catch (error) {
      console.error("Failed to create workflow from template:", error);
    }
  };

  return (
    <div className="workflow-builder p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Workflow Builder
      </h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Create from Template
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedTemplate?.id === template.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {template.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {template.description}
                </p>
                <div className="mt-2">
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">
                    {template.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedTemplate && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Template Variables
            </h3>

            <div className="space-y-4">
              {selectedTemplate.variables.map((variable) => (
                <div key={variable.id}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {variable.name}
                    {variable.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>

                  <label htmlFor="input-1fa8mhum8" className="sr-only">
                    Field
                  </label>
                  <input
                    id="input-1fa8mhum8"
                    type={variable.type === "number" ? "number" : "text"}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={variable.description}
                    defaultValue={variable.defaultValue}
                    onChange={(e) =>
                      setVariables((prev) => ({
                        ...prev,
                        [variable.id]:
                          variable.type === "number"
                            ? Number(e.target.value)
                            : e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => {
                  setSelectedTemplate(null);
                  setVariables({});
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFromTemplate}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Create Workflow
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkflowManager;
