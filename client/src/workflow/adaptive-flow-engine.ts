declare global {
  interface Window {
    [key: string]: any;
  }
}

import React, { useState } from "react";
/**
 * Omniflow Adaptive Flow Engine
 * Modular workflows that adjust based on user behavior and context
 */

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type:
    | "action"
    | "decision"
    | "data_input"
    | "validation"
    | "notification"
    | "integration";
  required: boolean;
  skippable: boolean;
  estimatedDuration: number; // in seconds
  dependencies: string[]; // step IDs that must complete first
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  validations: WorkflowValidation[];
  ui: {
    component: string;
    props: Record<string, any>;
    layout: "full" | "sidebar" | "modal" | "inline";
  };
  adaptive: {
    canBeSkipped: boolean;
    canBeAdded: boolean;
    priority: number;
    userBehaviorInfluence: number;
  };
}

export interface WorkflowCondition {
  type:
    | "user_role"
    | "data_state"
    | "time_based"
    | "performance"
    | "contextual";
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "greater_than"
    | "less_than"
    | "exists"
    | "custom";
  value: any;
  customLogic?: (context: WorkflowContext) => boolean;
}

export interface WorkflowAction {
  type:
    | "create"
    | "update"
    | "delete"
    | "send"
    | "calculate"
    | "navigate"
    | "custom";
  target: string;
  parameters: Record<string, any>;
  async: boolean;
  retryPolicy: {
    maxAttempts: number;
    backoffStrategy: "linear" | "exponential";
    delay: number;
  };
}

export interface WorkflowValidation {
  type: "required" | "format" | "business_rule" | "custom";
  field: string;
  rule: string;
  errorMessage: string;
  customLogic?: (data: any) => boolean;
}

export interface WorkflowContext {
  userId: string;
  userRole: string;
  sessionId: string;
  timestamp: Date;
  data: Record<string, any>;
  metadata: {
    device: string;
    location: string;
    preferences: Record<string, any>;
    behavior: {
      completionRate: number;
      averageTime: number;
      errorRate: number;
      skipRate: number;
    };
  };
}

export interface AdaptiveWorkflow {
  id: string;
  name: string;
  description: string;
  category: "billing" | "invoicing" | "receipts" | "reports" | "tax" | "custom";
  version: string;
  steps: WorkflowStep[];
  defaultFlow: string[]; // default step order
  adaptiveFlow: string[]; // current adaptive step order
  context: WorkflowContext;
  state: "draft" | "active" | "paused" | "completed" | "failed";
  progress: {
    currentStep: string;
    completedSteps: string[];
    skippedSteps: string[];
    addedSteps: string[];
    startTime: Date;
    estimatedCompletion: Date;
    actualDuration: number;
  };
  performance: {
    efficiency: number; // 0-1
    userSatisfaction: number; // 0-1
    errorRate: number; // 0-1
    adaptationScore: number; // 0-1
  };
}

export class AdaptiveFlowEngine {
  private static instance: AdaptiveFlowEngine;
  private workflows: Map<string, AdaptiveWorkflow> = new Map();
  private workflowTemplates: Map<string, Partial<AdaptiveWorkflow>> = new Map();
  private stepRegistry: Map<string, WorkflowStep> = new Map();
  private behaviorAnalyzer: WorkflowBehaviorAnalyzer;
  private adaptationEngine: WorkflowAdaptationEngine;
  private isRunning: boolean = false;
  private adaptationInterval: number | null = null;

  private constructor() {
    this.behaviorAnalyzer = new WorkflowBehaviorAnalyzer();
    this.adaptationEngine = new WorkflowAdaptationEngine();
    this.initializeWorkflows();
  }

  static getInstance(): AdaptiveFlowEngine {
    if (!AdaptiveFlowEngine.instance) {
      AdaptiveFlowEngine.instance = new AdaptiveFlowEngine();
    }
    return AdaptiveFlowEngine.instance;
  }

  private initializeWorkflows(): void {
    if (typeof window === "undefined") return;

    // Start continuous adaptation
    this.startContinuousAdaptation();

    // Load workflow templates
    this.loadWorkflowTemplates();

    // Register default steps
    this.registerDefaultSteps();

    // Initialize active workflows
    this.initializeActiveWorkflows();
  }

  private startContinuousAdaptation(): void {
    this.isRunning = true;

    // Analyze and adapt workflows every 30 seconds
    this.adaptationInterval = window.setInterval(() => {
      this.analyzeAllWorkflows();
      this.adaptWorkflows();
    }, 30000);
  }

  private loadWorkflowTemplates(): void {
    // Billing workflow template
    const billingTemplate: Partial<AdaptiveWorkflow> = {
      name: "Invoice Creation & Payment",
      description:
        "Complete billing workflow from invoice creation to payment collection",
      category: "billing",
      version: "1.0",
      defaultFlow: [
        "customer-selection",
        "invoice-details",
        "line-items",
        "tax-calculation",
        "discount-application",
        "review-invoice",
        "send-invoice",
        "payment-tracking",
      ],
    };

    // Invoicing workflow template
    const invoicingTemplate: Partial<AdaptiveWorkflow> = {
      name: "Recurring Invoice Management",
      description: "Manage recurring invoices and automated billing",
      category: "invoicing",
      version: "1.0",
      defaultFlow: [
        "customer-selection",
        "invoice-template",
        "schedule-setup",
        "payment-methods",
        "review-configuration",
        "activate-recurring",
      ],
    };

    // Reports workflow template
    const reportsTemplate: Partial<AdaptiveWorkflow> = {
      name: "Financial Report Generation",
      description: "Generate comprehensive financial reports",
      category: "reports",
      version: "1.0",
      defaultFlow: [
        "report-type-selection",
        "date-range",
        "data-filters",
        "format-options",
        "preview-report",
        "generate-report",
        "distribution",
      ],
    };

    this.workflowTemplates.set("billing", billingTemplate);
    this.workflowTemplates.set("invoicing", invoicingTemplate);
    this.workflowTemplates.set("reports", reportsTemplate);
  }

  private registerDefaultSteps(): void {
    // Customer Selection Step
    const customerSelectionStep: WorkflowStep = {
      id: "customer-selection",
      name: "Select Customer",
      description: "Choose the customer for this transaction",
      type: "data_input",
      required: true,
      skippable: false,
      estimatedDuration: 30,
      dependencies: [],
      conditions: [
        {
          type: "user_role",
          field: "role",
          operator: "not_equals",
          value: "viewer",
        },
      ],
      actions: [
        {
          type: "navigate",
          target: "/customers/select",
          parameters: {},
          async: false,
          retryPolicy: {
            maxAttempts: 3,
            backoffStrategy: "linear",
            delay: 1000,
          },
        },
      ],
      validations: [
        {
          type: "required",
          field: "customerId",
          rule: "notEmpty",
          errorMessage: "Customer selection is required",
        },
      ],
      ui: {
        component: "CustomerSelector",
        props: { multiSelect: false, allowCreate: true },
        layout: "full",
      },
      adaptive: {
        canBeSkipped: false,
        canBeAdded: false,
        priority: 10,
        userBehaviorInfluence: 0.8,
      },
    };

    // Invoice Details Step
    const invoiceDetailsStep: WorkflowStep = {
      id: "invoice-details",
      name: "Invoice Details",
      description: "Enter basic invoice information",
      type: "data_input",
      required: true,
      skippable: false,
      estimatedDuration: 60,
      dependencies: ["customer-selection"],
      conditions: [],
      actions: [
        {
          type: "create",
          target: "invoice",
          parameters: {},
          async: false,
          retryPolicy: {
            maxAttempts: 3,
            backoffStrategy: "linear",
            delay: 1000,
          },
        },
      ],
      validations: [
        {
          type: "required",
          field: "invoiceNumber",
          rule: "notEmpty",
          errorMessage: "Invoice number is required",
        },
        {
          type: "required",
          field: "dueDate",
          rule: "notEmpty",
          errorMessage: "Due date is required",
        },
      ],
      ui: {
        component: "InvoiceDetailsForm",
        props: { autoGenerateNumber: true },
        layout: "full",
      },
      adaptive: {
        canBeSkipped: false,
        canBeAdded: false,
        priority: 9,
        userBehaviorInfluence: 0.7,
      },
    };

    // Line Items Step
    const lineItemsStep: WorkflowStep = {
      id: "line-items",
      name: "Add Line Items",
      description: "Add products or services to the invoice",
      type: "data_input",
      required: true,
      skippable: false,
      estimatedDuration: 120,
      dependencies: ["invoice-details"],
      conditions: [],
      actions: [
        {
          type: "create",
          target: "lineItems",
          parameters: {},
          async: false,
          retryPolicy: {
            maxAttempts: 3,
            backoffStrategy: "linear",
            delay: 1000,
          },
        },
      ],
      validations: [
        {
          type: "business_rule",
          field: "totalAmount",
          rule: "greaterThan 0",
          errorMessage: "Invoice must have at least one line item",
        },
      ],
      ui: {
        component: "LineItemsEditor",
        props: { allowCustomItems: true, taxCalculation: true },
        layout: "full",
      },
      adaptive: {
        canBeSkipped: false,
        canBeAdded: false,
        priority: 8,
        userBehaviorInfluence: 0.9,
      },
    };

    // Tax Calculation Step
    const taxCalculationStep: WorkflowStep = {
      id: "tax-calculation",
      name: "Tax Calculation",
      description: "Calculate applicable taxes",
      type: "action",
      required: true,
      skippable: true,
      estimatedDuration: 10,
      dependencies: ["line-items"],
      conditions: [
        {
          type: "data_state",
          field: "taxEnabled",
          operator: "equals",
          value: true,
        },
      ],
      actions: [
        {
          type: "calculate",
          target: "tax",
          parameters: { jurisdiction: "auto", rate: "auto" },
          async: true,
          retryPolicy: {
            maxAttempts: 3,
            backoffStrategy: "exponential",
            delay: 2000,
          },
        },
      ],
      validations: [],
      ui: {
        component: "TaxCalculationDisplay",
        props: { editable: true },
        layout: "sidebar",
      },
      adaptive: {
        canBeSkipped: true,
        canBeAdded: false,
        priority: 5,
        userBehaviorInfluence: 0.3,
      },
    };

    // Review Invoice Step
    const reviewInvoiceStep: WorkflowStep = {
      id: "review-invoice",
      name: "Review Invoice",
      description: "Review and confirm invoice details",
      type: "validation",
      required: true,
      skippable: false,
      estimatedDuration: 45,
      dependencies: ["line-items", "tax-calculation"],
      conditions: [],
      actions: [
        {
          type: "validate",
          target: "invoice",
          parameters: { businessRules: true, dataIntegrity: true },
          async: false,
          retryPolicy: { maxAttempts: 1, backoffStrategy: "linear", delay: 0 },
        },
      ],
      validations: [
        {
          type: "business_rule",
          field: "approvalRequired",
          rule: "custom",
          errorMessage: "Manager approval required for invoices over $10,000",
          customLogic: (data) => data.totalAmount <= 10000 || data.hasApproval,
        },
      ],
      ui: {
        component: "InvoiceReview",
        props: { allowEdit: true, showWarnings: true },
        layout: "full",
      },
      adaptive: {
        canBeSkipped: false,
        canBeAdded: false,
        priority: 7,
        userBehaviorInfluence: 0.6,
      },
    };

    this.stepRegistry.set("customer-selection", customerSelectionStep);
    this.stepRegistry.set("invoice-details", invoiceDetailsStep);
    this.stepRegistry.set("line-items", lineItemsStep);
    this.stepRegistry.set("tax-calculation", taxCalculationStep);
    this.stepRegistry.set("review-invoice", reviewInvoiceStep);
  }

  private initializeActiveWorkflows(): void {
    // Load active workflows from storage
    try {
      const stored = localStorage.getItem("active-workflows");
      if (stored) {
        const workflows = JSON.parse(stored);
        workflows.forEach((workflow: AdaptiveWorkflow) => {
          this.workflows.set(workflow.id, workflow);
        });
      }
    } catch (error) {
      console.warn("Failed to load active workflows:", error);
    }
  }

  // Public API methods
  createWorkflow(
    templateId: string,
    context: WorkflowContext,
  ): AdaptiveWorkflow {
    const template = this.workflowTemplates.get(templateId);
    if (!template) {
      throw new Error(`Workflow template ${templateId} not found`);
    }

    const workflow: AdaptiveWorkflow = {
      id: this.generateWorkflowId(),
      name: template.name || "New Workflow",
      description: template.description || "",
      category: template.category || "custom",
      version: template.version || "1.0",
      steps: this.buildWorkflowSteps(template.defaultFlow || []),
      defaultFlow: template.defaultFlow || [],
      adaptiveFlow: [...(template.defaultFlow || [])],
      context,
      state: "draft",
      progress: {
        currentStep: "",
        completedSteps: [],
        skippedSteps: [],
        addedSteps: [],
        startTime: new Date(),
        estimatedCompletion: new Date(Date.now() + 3600000), // 1 hour from now
        actualDuration: 0,
      },
      performance: {
        efficiency: 0.8,
        userSatisfaction: 0.8,
        errorRate: 0,
        adaptationScore: 0.5,
      },
    };

    this.workflows.set(workflow.id, workflow);
    this.saveWorkflows();

    return workflow;
  }

  private buildWorkflowSteps(stepIds: string[]): WorkflowStep[] {
    return stepIds.map((id) => {
      const step = this.stepRegistry.get(id);
      if (!step) {
        throw new Error(`Workflow step ${id} not found`);
      }
      return { ...step };
    });
  }

  private generateWorkflowId(): string {
    return `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  startWorkflow(workflowId: string): void {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    workflow.state = "active";
    workflow.progress.startTime = new Date();
    workflow.progress.currentStep = workflow.adaptiveFlow[0] || "";

    this.saveWorkflows();
    this.executeCurrentStep(workflowId);
  }

  async executeCurrentStep(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.state !== "active") {
      return;
    }

    const currentStepId = workflow.progress.currentStep;
    const step = workflow.steps.find((s) => s.id === currentStepId);

    if (!step) {
      // Workflow completed
      this.completeWorkflow(workflowId);
      return;
    }

    // Check if step conditions are met
    if (!this.checkStepConditions(step, workflow.context)) {
      // Skip step if conditions not met
      this.skipStep(workflowId, currentStepId);
      return;
    }

    // Execute step actions
    try {
      await this.executeStepActions(step, workflow.context);

      // Record step completion
      this.completeStep(workflowId, currentStepId);

      // Move to next step
      this.moveToNextStep(workflowId);
    } catch (error) {
      console.error(`Error executing step ${currentStepId}:`, error);
      this.handleStepError(workflowId, currentStepId, error);
    }
  }

  private checkStepConditions(
    step: WorkflowStep,
    context: WorkflowContext,
  ): boolean {
    return step.conditions.every((condition) => {
      switch (condition.type) {
        case "user_role":
          return this.evaluateCondition(condition.userRole, context.userRole);
        case "data_state":
          return this.evaluateCondition(
            condition.value,
            context.data[condition.field],
          );
        case "time_based":
          return this.evaluateTimeCondition(condition, context.timestamp);
        case "performance":
          return this.evaluatePerformanceCondition(
            condition,
            context.metadata.behavior,
          );
        case "contextual":
          return condition.customLogic ? condition.customLogic(context) : true;
        default:
          return true;
      }
    });
  }

  private evaluateCondition(expected: any, actual: any): boolean {
    switch (this.getOperator(expected)) {
      case "equals":
        return actual === expected;
      case "not_equals":
        return actual !== expected;
      case "contains":
        return actual && actual.toString().includes(expected.toString());
      case "greater_than":
        return Number(actual) > Number(expected);
      case "less_than":
        return Number(actual) < Number(expected);
      case "exists":
        return actual !== undefined && actual !== null;
      default:
        return true;
    }
  }

  private getOperator(value: any): string {
    if (typeof value === "object" && value.operator) {
      return value.operator;
    }
    return "equals";
  }

  private evaluateTimeCondition(
    condition: WorkflowCondition,
    timestamp: Date,
  ): boolean {
    // Implement time-based condition evaluation
    const hour = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();

    switch (condition.field) {
      case "businessHours":
        return hour >= 9 && hour <= 17;
      case "weekdays":
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      default:
        return true;
    }
  }

  private evaluatePerformanceCondition(
    condition: WorkflowCondition,
    behavior: WorkflowContext["metadata"]["behavior"],
  ): boolean {
    switch (condition.field) {
      case "completionRate":
        return behavior.completionRate >= condition.value;
      case "errorRate":
        return behavior.errorRate <= condition.value;
      case "averageTime":
        return behavior.averageTime <= condition.value;
      default:
        return true;
    }
  }

  private async executeStepActions(
    step: WorkflowStep,
    context: WorkflowContext,
  ): Promise<void> {
    for (const action of step.actions) {
      await this.executeAction(action, context);
    }
  }

  private async executeAction(
    action: WorkflowAction,
    context: WorkflowContext,
  ): Promise<any> {
    let attempts = 0;
    const maxAttempts = action.retryPolicy.maxAttempts;

    while (attempts < maxAttempts) {
      try {
        switch (action.type) {
          case "create":
            return await this.createResource(
              action.target,
              action.parameters,
              context,
            );
          case "update":
            return await this.updateResource(
              action.target,
              action.parameters,
              context,
            );
          case "delete":
            return await this.deleteResource(
              action.target,
              action.parameters,
              context,
            );
          case "send":
            return await this.sendData(
              action.target,
              action.parameters,
              context,
            );
          case "calculate":
            return await this.calculateValue(
              action.target,
              action.parameters,
              context,
            );
          case "navigate":
            return this.navigate(action.target, action.parameters);
          case "custom":
            return await this.executeCustomAction(action, context);
          default:
            throw new Error(`Unknown action type: ${action.type}`);
        }
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw error;
        }

        // Apply backoff delay
        const delay = this.calculateBackoffDelay(attempts, action.retryPolicy);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  private async createResource(
    target: string,
    parameters: any,
    context: WorkflowContext,
  ): Promise<any> {
    // Simulate resource creation
    console.log(`Creating resource: ${target}`, parameters);
    return { id: this.generateId(), ...parameters };
  }

  private async updateResource(
    target: string,
    parameters: any,
    context: WorkflowContext,
  ): Promise<any> {
    // Simulate resource update
    console.log(`Updating resource: ${target}`, parameters);
    return { success: true, ...parameters };
  }

  private async deleteResource(
    target: string,
    parameters: any,
    context: WorkflowContext,
  ): Promise<any> {
    // Simulate resource deletion
    console.log(`Deleting resource: ${target}`, parameters);
    return { success: true };
  }

  private async sendData(
    target: string,
    parameters: any,
    context: WorkflowContext,
  ): Promise<any> {
    // Simulate data sending
    console.log(`Sending data to: ${target}`, parameters);
    return { success: true, delivered: true };
  }

  private async calculateValue(
    target: string,
    parameters: any,
    context: WorkflowContext,
  ): Promise<any> {
    // Simulate calculation
    console.log(`Calculating: ${target}`, parameters);
    return { result: Math.random() * 1000 };
  }

  private navigate(target: string, parameters: any): void {
    // Navigate to target
    console.log(`Navigating to: ${target}`, parameters);
    if (typeof window !== "undefined") {
      window.location.href = target;
    }
  }

  private async executeCustomAction(
    action: WorkflowAction,
    context: WorkflowContext,
  ): Promise<any> {
    // Execute custom action logic
    console.log(`Executing custom action: ${action.target}`, action.parameters);
    return { success: true };
  }

  private calculateBackoffDelay(
    attempt: number,
    retryPolicy: WorkflowAction["retryPolicy"],
  ): number {
    switch (retryPolicy.backoffStrategy) {
      case "linear":
        return retryPolicy.delay * attempt;
      case "exponential":
        return retryPolicy.delay * Math.pow(2, attempt - 1);
      default:
        return retryPolicy.delay;
    }
  }

  private generateId(): string {
    return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private completeStep(workflowId: string, stepId: string): void {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    workflow.progress.completedSteps.push(stepId);
    this.behaviorAnalyzer.recordStepCompletion(workflowId, stepId);
    this.saveWorkflows();
  }

  private skipStep(workflowId: string, stepId: string): void {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    workflow.progress.skippedSteps.push(stepId);
    this.behaviorAnalyzer.recordStepSkip(workflowId, stepId);
    this.moveToNextStep(workflowId);
  }

  private moveToNextStep(workflowId: string): void {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    const currentIndex = workflow.adaptiveFlow.indexOf(
      workflow.progress.currentStep,
    );
    const nextIndex = currentIndex + 1;

    if (nextIndex < workflow.adaptiveFlow.length) {
      workflow.progress.currentStep = workflow.adaptiveFlow[nextIndex];
      this.executeCurrentStep(workflowId);
    } else {
      this.completeWorkflow(workflowId);
    }
  }

  private completeWorkflow(workflowId: string): void {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    workflow.state = "completed";
    workflow.progress.actualDuration =
      Date.now() - workflow.progress.startTime.getTime();

    this.behaviorAnalyzer.recordWorkflowCompletion(workflowId);
    this.saveWorkflows();
  }

  private handleStepError(
    workflowId: string,
    stepId: string,
    error: any,
  ): void {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    workflow.performance.errorRate += 0.1;
    this.behaviorAnalyzer.recordStepError(workflowId, stepId, error);

    // Decide whether to retry, skip, or fail workflow
    const step = workflow.steps.find((s) => s.id === stepId);
    if (step && step.skippable) {
      this.skipStep(workflowId, stepId);
    } else {
      workflow.state = "failed";
      this.saveWorkflows();
    }
  }

  private analyzeAllWorkflows(): void {
    this.workflows.forEach((workflow) => {
      if (workflow.state === "active") {
        this.behaviorAnalyzer.analyzeWorkflow(workflow);
      }
    });
  }

  private adaptWorkflows(): void {
    this.workflows.forEach((workflow) => {
      if (workflow.state === "active") {
        const adaptations = this.adaptationEngine.generateAdaptations(workflow);
        this.applyAdaptations(workflow.id, adaptations);
      }
    });
  }

  private applyAdaptations(workflowId: string, adaptations: any[]): void {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    adaptations.forEach((adaptation) => {
      switch (adaptation.type) {
        case "skip_step":
          if (
            adaptation.stepId &&
            !workflow.progress.completedSteps.includes(adaptation.stepId)
          ) {
            this.skipStep(workflowId, adaptation.stepId);
          }
          break;
        case "add_step":
          if (adaptation.step) {
            this.addStep(workflowId, adaptation.step);
          }
          break;
        case "reorder_steps":
          if (adaptation.newOrder) {
            this.reorderSteps(workflowId, adaptation.newOrder);
          }
          break;
        case "modify_step":
          if (adaptation.stepId && adaptation.modifications) {
            this.modifyStep(
              workflowId,
              adaptation.stepId,
              adaptation.modifications,
            );
          }
          break;
      }
    });

    workflow.performance.adaptationScore = Math.min(
      1,
      workflow.performance.adaptationScore + 0.1,
    );
    this.saveWorkflows();
  }

  private addStep(workflowId: string, step: WorkflowStep): void {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    workflow.steps.push(step);
    workflow.adaptiveFlow.push(step.id);
    workflow.progress.addedSteps.push(step.id);
  }

  private reorderSteps(workflowId: string, newOrder: string[]): void {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    workflow.adaptiveFlow = newOrder;
  }

  private modifyStep(
    workflowId: string,
    stepId: string,
    modifications: Partial<WorkflowStep>,
  ): void {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    const step = workflow.steps.find((s) => s.id === stepId);
    if (step) {
      Object.assign(step, modifications);
    }
  }

  private saveWorkflows(): void {
    try {
      const workflows = Array.from(this.workflows.values());
      localStorage.setItem("active-workflows", JSON.stringify(workflows));
    } catch (error) {
      console.warn("Failed to save workflows:", error);
    }
  }

  // Public API methods
  getWorkflow(workflowId: string): AdaptiveWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  getWorkflowsByCategory(category: string): AdaptiveWorkflow[] {
    return Array.from(this.workflows.values()).filter(
      (w) => w.category === category,
    );
  }

  getActiveWorkflows(): AdaptiveWorkflow[] {
    return Array.from(this.workflows.values()).filter(
      (w) => w.state === "active",
    );
  }

  pauseWorkflow(workflowId: string): void {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      workflow.state = "paused";
      this.saveWorkflows();
    }
  }

  resumeWorkflow(workflowId: string): void {
    const workflow = this.workflows.get(workflowId);
    if (workflow && workflow.state === "paused") {
      workflow.state = "active";
      this.saveWorkflows();
      this.executeCurrentStep(workflowId);
    }
  }

  deleteWorkflow(workflowId: string): void {
    this.workflows.delete(workflowId);
    this.saveWorkflows();
  }

  getWorkflowTemplates(): Array<{
    id: string;
    template: Partial<AdaptiveWorkflow>;
  }> {
    return Array.from(this.workflowTemplates.entries()).map(
      ([id, template]) => ({ id, template }),
    );
  }

  addWorkflowTemplate(id: string, template: Partial<AdaptiveWorkflow>): void {
    this.workflowTemplates.set(id, template);
  }

  registerStep(step: WorkflowStep): void {
    this.stepRegistry.set(step.id, step);
  }

  stopEngine(): void {
    this.isRunning = false;
    if (this.adaptationInterval) {
      clearInterval(this.adaptationInterval);
      this.adaptationInterval = null;
    }
  }
}

// Workflow Behavior Analyzer
class WorkflowBehaviorAnalyzer {
  private behaviorData: Map<string, any> = new Map();

  recordStepCompletion(workflowId: string, stepId: string): void {
    const data = this.getBehaviorData(workflowId);
    data.stepCompletions.push({ stepId, timestamp: Date.now() });
    this.updateBehaviorMetrics(workflowId);
  }

  recordStepSkip(workflowId: string, stepId: string): void {
    const data = this.getBehaviorData(workflowId);
    data.stepSkips.push({ stepId, timestamp: Date.now() });
    this.updateBehaviorMetrics(workflowId);
  }

  recordStepError(workflowId: string, stepId: string, error: any): void {
    const data = this.getBehaviorData(workflowId);
    data.stepErrors.push({ stepId, error, timestamp: Date.now() });
    this.updateBehaviorMetrics(workflowId);
  }

  recordWorkflowCompletion(workflowId: string): void {
    const data = this.getBehaviorData(workflowId);
    data.workflowCompletions.push({ timestamp: Date.now() });
    this.updateBehaviorMetrics(workflowId);
  }

  analyzeWorkflow(workflow: AdaptiveWorkflow): void {
    const data = this.getBehaviorData(workflow.id);

    // Analyze patterns and update metrics
    const completionRate = this.calculateCompletionRate(data);
    const averageTime = this.calculateAverageTime(data);
    const errorRate = this.calculateErrorRate(data);
    const skipRate = this.calculateSkipRate(data);

    workflow.context.metadata.behavior = {
      completionRate,
      averageTime,
      errorRate,
      skipRate,
    };
  }

  private getBehaviorData(workflowId: string): any {
    if (!this.behaviorData.has(workflowId)) {
      this.behaviorData.set(workflowId, {
        stepCompletions: [],
        stepSkips: [],
        stepErrors: [],
        workflowCompletions: [],
      });
    }
    return this.behaviorData.get(workflowId);
  }

  private updateBehaviorMetrics(workflowId: string): void {
    const data = this.getBehaviorData(workflowId);
    // Update metrics based on behavior data
  }

  private calculateCompletionRate(data: any): number {
    const totalSteps =
      data.stepCompletions.length +
      data.stepSkips.length +
      data.stepErrors.length;
    return totalSteps > 0 ? data.stepCompletions.length / totalSteps : 0;
  }

  private calculateAverageTime(data: any): number {
    // Calculate average time between steps
    return 60; // Placeholder
  }

  private calculateErrorRate(data: any): number {
    const totalSteps = data.stepCompletions.length + data.stepErrors.length;
    return totalSteps > 0 ? data.stepErrors.length / totalSteps : 0;
  }

  private calculateSkipRate(data: any): number {
    const totalSteps = data.stepCompletions.length + data.stepSkips.length;
    return totalSteps > 0 ? data.stepSkips.length / totalSteps : 0;
  }
}

// Workflow Adaptation Engine
class WorkflowAdaptationEngine {
  generateAdaptations(workflow: AdaptiveWorkflow): any[] {
    const adaptations: any[] = [];
    const behavior = workflow.context.metadata.behavior;

    // Skip steps that are frequently skipped
    if (behavior.skipRate > 0.7) {
      workflow.steps.forEach((step) => {
        if (
          step.adaptive.canBeSkipped &&
          step.adaptive.userBehaviorInfluence > 0.5
        ) {
          adaptations.push({
            type: "skip_step",
            stepId: step.id,
            reason: "High skip rate detected",
          });
        }
      });
    }

    // Add recommended steps for high error rates
    if (behavior.errorRate > 0.3) {
      adaptations.push({
        type: "add_step",
        step: {
          id: "validation-check",
          name: "Additional Validation",
          description: "Extra validation step to reduce errors",
          type: "validation",
          required: false,
          skippable: true,
          estimatedDuration: 30,
          dependencies: [],
          conditions: [],
          actions: [],
          validations: [],
          ui: { component: "ValidationCheck", props: {}, layout: "modal" },
          adaptive: {
            canBeSkipped: true,
            canBeAdded: true,
            priority: 6,
            userBehaviorInfluence: 0.4,
          },
        },
        reason: "High error rate detected",
      });
    }

    // Reorder steps based on user behavior
    if (behavior.completionRate < 0.5) {
      adaptations.push({
        type: "reorder_steps",
        newOrder: this.optimizeStepOrder(workflow),
        reason: "Low completion rate - optimizing flow",
      });
    }

    return adaptations;
  }

  private optimizeStepOrder(workflow: AdaptiveWorkflow): string[] {
    // Sort steps by priority and user behavior influence
    return workflow.steps
      .sort((a, b) => {
        const aScore = a.adaptive.priority + a.adaptive.userBehaviorInfluence;
        const bScore = b.adaptive.priority + b.adaptive.userBehaviorInfluence;
        return bScore - aScore;
      })
      .map((step) => step.id);
  }
}

// React hook
export function useAdaptiveFlowEngine() {
  const engine = AdaptiveFlowEngine.getInstance();
  const [workflows, setWorkflows] = React.useState(engine.getActiveWorkflows());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setWorkflows(engine.getActiveWorkflows());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    engine,
    workflows,
    createWorkflow: engine.createWorkflow.bind(engine),
    startWorkflow: engine.startWorkflow.bind(engine),
    pauseWorkflow: engine.pauseWorkflow.bind(engine),
    resumeWorkflow: engine.resumeWorkflow.bind(engine),
    deleteWorkflow: engine.deleteWorkflow.bind(engine),
    getWorkflow: engine.getWorkflow.bind(engine),
    getWorkflowTemplates: engine.getWorkflowTemplates.bind(engine),
  };
}

export default AdaptiveFlowEngine;
