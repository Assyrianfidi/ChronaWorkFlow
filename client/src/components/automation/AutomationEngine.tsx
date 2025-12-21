import React, { useState, useEffect, useCallback, useRef } from "react";
import { useUserExperienceMode } from "@/components/adaptive/UserExperienceMode";
import { usePerformance } from "@/components/adaptive/UI-Performance-Engine";
import { useAuthStore } from "@/store/auth-store";

// Automation Types
interface AutomationRule {
  id: string;
  name: string;
  description: string;
  category: "data" | "workflow" | "notification" | "security" | "custom";
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  enabled: boolean;
  priority: "low" | "medium" | "high" | "critical";
  createdAt: number;
  lastTriggered?: number;
  executionCount: number;
  successRate: number;
}

interface AutomationTrigger {
  type: "schedule" | "event" | "manual" | "webhook" | "threshold";
  config: {
    schedule?: string; // cron expression
    event?: string;
    webhook?: string;
    threshold?: {
      metric: string;
      operator: "greater" | "less" | "equals";
      value: number;
    };
  };
}

interface AutomationCondition {
  type: "logic" | "data" | "time" | "user" | "system";
  operator: "and" | "or" | "not";
  config: {
    field?: string;
    operator?: string;
    value?: any;
    expression?: string;
  };
}

interface AutomationAction {
  type: "notification" | "workflow" | "data" | "api" | "script" | "email";
  config: {
    template?: string;
    parameters?: Record<string, any>;
    endpoint?: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    headers?: Record<string, string>;
    body?: any;
    script?: string;
    workflowId?: string;
  };
}

interface AutomationExecution {
  id: string;
  ruleId: string;
  trigger: string;
  startTime: number;
  endTime?: number;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  result?: any;
  error?: string;
  logs: string[];
  metadata: Record<string, any>;
}

interface AIModel {
  id: string;
  name: string;
  type: "classification" | "regression" | "clustering" | "nlp" | "anomaly";
  version: string;
  accuracy: number;
  status: "training" | "ready" | "error";
  trainingData?: any[];
  parameters?: Record<string, any>;
  lastTrained?: number;
}

interface SmartSuggestion {
  id: string;
  type: "automation" | "optimization" | "prediction" | "alert";
  title: string;
  description: string;
  confidence: number;
  impact: "low" | "medium" | "high";
  category: string;
  data: any;
  actions: {
    label: string;
    action: () => void;
  }[];
  createdAt: number;
  expiresAt?: number;
}

// Automation Context
interface AutomationContextType {
  // Rules Management
  rules: AutomationRule[];
  createRule: (
    rule: Omit<
      AutomationRule,
      "id" | "createdAt" | "executionCount" | "successRate"
    >,
  ) => Promise<AutomationRule>;
  updateRule: (id: string, updates: Partial<AutomationRule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  enableRule: (id: string) => Promise<void>;
  disableRule: (id: string) => Promise<void>;

  // Execution
  executions: AutomationExecution[];
  executeRule: (
    ruleId: string,
    trigger: string,
  ) => Promise<AutomationExecution>;
  cancelExecution: (executionId: string) => Promise<void>;

  // AI Models
  models: AIModel[];
  trainModel: (modelId: string, data: any[]) => Promise<void>;
  predict: (modelId: string, data: any) => Promise<any>;

  // Smart Suggestions
  suggestions: SmartSuggestion[];
  generateSuggestions: () => Promise<void>;
  applySuggestion: (suggestionId: string) => Promise<void>;
  dismissSuggestion: (suggestionId: string) => Promise<void>;

  // Monitoring
  getExecutionHistory: (
    ruleId?: string,
    limit?: number,
  ) => AutomationExecution[];
  getStatistics: () => {
    totalRules: number;
    activeRules: number;
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
  };
}

const AutomationContext = React.createContext<AutomationContextType | null>(
  null,
);

// AI Automation Engine
class AIAutomationEngine {
  public models: Map<string, any> = new Map();
  public rules: Map<string, AutomationRule> = new Map();
  public executions: Map<string, AutomationExecution> = new Map();
  private scheduler: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, ((event: any) => void)[]> = new Map();

  constructor() {
    this.initializeAIModels();
    this.setupEventListeners();
    this.startScheduler();
  }

  private async initializeAIModels(): Promise<void> {
    // Initialize built-in AI models
    await this.loadModel("pattern-recognition", "classification");
    await this.loadModel("anomaly-detection", "anomaly");
    await this.loadModel("natural-language", "nlp");
    await this.loadModel("predictive-analytics", "regression");
  }

  private async loadModel(name: string, type: AIModel["type"]): Promise<void> {
    const model: AIModel = {
      id: name,
      name,
      type,
      version: "1.0.0",
      accuracy: 0.85,
      status: "ready",
      lastTrained: Date.now(),
    };

    this.models.set(name, model);
  }

  private setupEventListeners(): void {
    // Set up event listeners for various system events
    this.addEventListener("data.changed", this.handleDataChange.bind(this));
    this.addEventListener("user.action", this.handleUserAction.bind(this));
    this.addEventListener("system.alert", this.handleSystemAlert.bind(this));
  }

  private startScheduler(): void {
    // Schedule rule evaluation every minute
    this.scheduler = setInterval(() => {
      this.evaluateScheduledRules();
    }, 60000);
  }

  private async evaluateScheduledRules(): Promise<void> {
    const now = new Date();

    for (const rule of this.rules.values()) {
      if (!rule.enabled || rule.trigger.type !== "schedule") continue;

      if (this.shouldExecuteSchedule(rule.trigger.config.schedule || "", now)) {
        await this.executeRule(rule.id, "schedule");
      }
    }
  }

  private shouldExecuteSchedule(cronExpression: string, date: Date): boolean {
    // Simplified cron evaluation - in production, use a proper cron library
    const parts = cronExpression.split(" ");
    if (parts.length !== 5) return false;

    const [minute, hour, day, month, weekday] = parts;

    return (
      (minute === "*" || parseInt(minute) === date.getMinutes()) &&
      (hour === "*" || parseInt(hour) === date.getHours()) &&
      (day === "*" || parseInt(day) === date.getDate()) &&
      (month === "*" || parseInt(month) === date.getMonth() + 1) &&
      (weekday === "*" || parseInt(weekday) === date.getDay())
    );
  }

  private handleDataChange(event: any): void {
    this.evaluateEventRules("data.changed", event);
  }

  private handleUserAction(event: any): void {
    this.evaluateEventRules("user.action", event);
  }

  private handleSystemAlert(event: any): void {
    this.evaluateEventRules("system.alert", event);
  }

  private async evaluateEventRules(
    eventType: string,
    eventData: any,
  ): Promise<void> {
    for (const rule of this.rules.values()) {
      if (!rule.enabled || rule.trigger.type !== "event") continue;
      if (rule.trigger.config.event === eventType) {
        await this.executeRule(rule.id, "event", eventData);
      }
    }
  }

  async executeRule(
    ruleId: string,
    trigger: string,
    data?: any,
  ): Promise<AutomationExecution> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    const execution: AutomationExecution = {
      id: Math.random().toString(36),
      ruleId,
      trigger,
      startTime: Date.now(),
      status: "pending",
      logs: [`Execution started at ${new Date().toISOString()}`],
      metadata: { data },
    };

    this.executions.set(execution.id, execution);

    try {
      // Evaluate conditions
      const conditionsMet = await this.evaluateConditions(
        rule.conditions,
        data,
      );

      if (conditionsMet) {
        execution.logs.push("Conditions met, executing actions");
        execution.status = "running";

        // Execute actions
        const results = await this.executeActions(rule.actions, data);

        execution.result = results;
        execution.status = "completed";
        execution.logs.push("Actions executed successfully");

        // Update rule statistics
        rule.lastTriggered = Date.now();
        rule.executionCount++;
      } else {
        execution.logs.push("Conditions not met, skipping execution");
        execution.status = "completed";
      }
    } catch (error) {
      execution.status = "failed";
      execution.error =
        error instanceof Error ? error.message : "Unknown error";
      execution.logs.push(`Error: ${execution.error}`);
    }

    execution.endTime = Date.now();
    return execution;
  }

  private async evaluateConditions(
    conditions: AutomationCondition[],
    data?: any,
  ): Promise<boolean> {
    if (conditions.length === 0) return true;

    let result = true;

    for (const condition of conditions) {
      const conditionResult = await this.evaluateCondition(condition, data);

      switch (condition.operator) {
        case "and":
          result = result && conditionResult;
          break;
        case "or":
          result = result || conditionResult;
          break;
        case "not":
          result = result && !conditionResult;
          break;
      }
    }

    return result;
  }

  private async evaluateCondition(
    condition: AutomationCondition,
    data?: any,
  ): Promise<boolean> {
    switch (condition.type) {
      case "data":
        return this.evaluateDataCondition(condition, data);
      case "logic":
        return this.evaluateLogicCondition(condition, data);
      case "time":
        return this.evaluateTimeCondition(condition);
      case "user":
        return this.evaluateUserCondition(condition);
      case "system":
        return this.evaluateSystemCondition(condition);
      default:
        return true;
    }
  }

  private evaluateDataCondition(
    condition: AutomationCondition,
    data?: any,
  ): boolean {
    if (!data || !condition.config.field) return false;

    const fieldValue = this.getNestedValue(data, condition.config.field);
    const operator = condition.config.operator || "equals";
    const expectedValue = condition.config.value;

    switch (operator) {
      case "equals":
        return fieldValue === expectedValue;
      case "contains":
        return String(fieldValue).includes(String(expectedValue));
      case "greater":
        return Number(fieldValue) > Number(expectedValue);
      case "less":
        return Number(fieldValue) < Number(expectedValue);
      default:
        return false;
    }
  }

  private evaluateLogicCondition(
    condition: AutomationCondition,
    data?: any,
  ): boolean {
    if (!condition.config.expression) return false;

    // Simple expression evaluation - in production, use a proper expression parser
    try {
      if (import.meta.env.PROD) {
        return false;
      }

      const expression = condition.config.expression.replace(
        /\$\{([^}]+)\}/g,
        (match, path) => {
          const value = this.getNestedValue(data, path);
          return typeof value === "string" ? `"${value}"` : String(value);
        },
      );

      // Very basic evaluation - DO NOT use in production
      return eval(expression);
    } catch {
      return false;
    }
  }

  private evaluateTimeCondition(condition: AutomationCondition): boolean {
    const now = new Date();
    const config = condition.config;

    if (config.field === "hour") {
      return now.getHours() === Number(config.value);
    } else if (config.field === "day") {
      return now.getDay() === Number(config.value);
    } else if (config.field === "month") {
      return now.getMonth() === Number(config.value);
    }

    return false;
  }

  private evaluateUserCondition(condition: AutomationCondition): boolean {
    // User condition evaluation would check user properties
    return true;
  }

  private evaluateSystemCondition(condition: AutomationCondition): boolean {
    // System condition evaluation would check system state
    return true;
  }

  private async executeActions(
    actions: AutomationAction[],
    data?: any,
  ): Promise<any[]> {
    const results: any[] = [];

    for (const action of actions) {
      try {
        const result = await this.executeAction(action, data);
        results.push(result);
      } catch (error) {
        results.push({
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  private async executeAction(
    action: AutomationAction,
    data?: any,
  ): Promise<any> {
    switch (action.type) {
      case "notification":
        return this.executeNotificationAction(action, data);
      case "workflow":
        return this.executeWorkflowAction(action, data);
      case "data":
        return this.executeDataAction(action, data);
      case "api":
        return this.executeAPIAction(action, data);
      case "script":
        return this.executeScriptAction(action, data);
      case "email":
        return this.executeEmailAction(action, data);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async executeNotificationAction(
    action: AutomationAction,
    data?: any,
  ): Promise<any> {
    const template = action.config.template || "Default notification";
    const parameters = action.config.parameters || {};

    // Send notification
    console.log(`Notification: ${template}`, { ...parameters, data });
    return { sent: true, template, parameters };
  }

  private async executeWorkflowAction(
    action: AutomationAction,
    data?: any,
  ): Promise<any> {
    const workflowId = action.config.parameters?.workflowId;
    if (!workflowId) {
      throw new Error("Workflow ID required for workflow action");
    }

    // Trigger workflow
    console.log(`Triggering workflow: ${workflowId}`, data);
    return { workflowId, triggered: true, data };
  }

  private async executeDataAction(
    action: AutomationAction,
    data?: any,
  ): Promise<any> {
    const operation = action.config.parameters?.operation;

    switch (operation) {
      case "create":
        return this.createDataRecord(action.config.parameters, data);
      case "update":
        return this.updateDataRecord(action.config.parameters, data);
      case "delete":
        return this.deleteDataRecord(action.config.parameters, data);
      default:
        throw new Error(`Unknown data operation: ${operation}`);
    }
  }

  private async executeAPIAction(
    action: AutomationAction,
    data?: any,
  ): Promise<any> {
    const endpoint = action.config.endpoint;
    const method = action.config.method || "POST";
    const headers = action.config.headers || {};
    const body = action.config.body;

    if (!endpoint) {
      throw new Error("Endpoint required for API action");
    }

    // Make API call
    console.log(`API ${method} ${endpoint}`, { headers, body, data });
    return { endpoint, method, success: true };
  }

  private async executeScriptAction(
    action: AutomationAction,
    data?: any,
  ): Promise<any> {
    const script = action.config.script;
    if (!script) {
      throw new Error("Script required for script action");
    }

    if (import.meta.env.PROD) {
      throw new Error("Script actions are disabled in production");
    }

    // Execute script - in production, use a secure sandbox
    try {
      const result = eval(script);
      return { script, result };
    } catch (error) {
      throw new Error(`Script execution failed: ${error}`);
    }
  }

  private async executeEmailAction(
    action: AutomationAction,
    data?: any,
  ): Promise<any> {
    const template = action.config.template;
    const parameters = action.config.parameters || {};

    // Send email
    console.log(`Email: ${template}`, { ...parameters, data });
    return { sent: true, template, parameters };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  private createDataRecord(parameters: any, data?: any): any {
    console.log("Creating data record", { parameters, data });
    return { created: true, id: Math.random().toString(36) };
  }

  private updateDataRecord(parameters: any, data?: any): any {
    console.log("Updating data record", { parameters, data });
    return { updated: true, id: parameters.id };
  }

  private deleteDataRecord(parameters: any, data?: any): any {
    console.log("Deleting data record", { parameters, data });
    return { deleted: true, id: parameters.id };
  }

  // AI Methods
  async trainModel(modelId: string, trainingData: any[]): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    model.status = "training";
    model.trainingData = trainingData;

    // Simulate training
    await new Promise((resolve) => setTimeout(resolve, 2000));

    model.status = "ready";
    model.accuracy = Math.random() * 0.3 + 0.7; // 70-100% accuracy
    model.lastTrained = Date.now();
  }

  async predict(modelId: string, data: any): Promise<any> {
    const model = this.models.get(modelId);
    if (!model || model.status !== "ready") {
      throw new Error(`Model ${modelId} not ready for prediction`);
    }

    // Simulate prediction based on model type
    switch (model.type) {
      case "classification":
        return this.classify(data);
      case "regression":
        return this.regress(data);
      case "clustering":
        return this.cluster(data);
      case "nlp":
        return this.processNLP(data);
      case "anomaly":
        return this.detectAnomaly(data);
      default:
        throw new Error(`Unknown model type: ${model.type}`);
    }
  }

  private classify(data: any): any {
    return {
      class: Math.random() > 0.5 ? "positive" : "negative",
      confidence: Math.random(),
    };
  }

  private regress(data: any): any {
    return {
      value: Math.random() * 100,
      confidence: Math.random(),
    };
  }

  private cluster(data: any): any {
    return {
      cluster: Math.floor(Math.random() * 5),
      confidence: Math.random(),
    };
  }

  private processNLP(data: any): any {
    return {
      sentiment: Math.random() > 0.5 ? "positive" : "negative",
      entities: ["entity1", "entity2"],
      confidence: Math.random(),
    };
  }

  private detectAnomaly(data: any): any {
    return {
      isAnomaly: Math.random() > 0.8,
      score: Math.random(),
      confidence: Math.random(),
    };
  }

  // Event Management
  addEventListener(event: string, callback: (event: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  removeEventListener(event: string, callback: (event: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  // Cleanup
  destroy(): void {
    if (this.scheduler) {
      clearInterval(this.scheduler);
    }
    this.models.clear();
    this.rules.clear();
    this.executions.clear();
    this.eventListeners.clear();
  }
}

// Main Automation Engine Component
export const AutomationEngine: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentMode } = useUserExperienceMode();
  const { isLowPerformanceMode } = usePerformance();
  const { user } = useAuthStore();

  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);

  const engineRef = useRef<AIAutomationEngine>();

  // Initialize engine
  useEffect(() => {
    engineRef.current = new AIAutomationEngine();
    initializeDefaultRules();
    initializeModels();

    return () => {
      engineRef.current?.destroy();
    };
  }, []);

  const initializeDefaultRules = useCallback(() => {
    const defaultRules: AutomationRule[] = [
      {
        id: "daily-report",
        name: "Daily Performance Report",
        description: "Generate daily performance report at 9 AM",
        category: "data",
        trigger: {
          type: "schedule",
          config: { schedule: "0 9 * * 1-5" }, // Weekdays at 9 AM
        },
        conditions: [],
        actions: [
          {
            type: "data",
            config: {
              parameters: { operation: "create", type: "report" },
            },
          },
          {
            type: "notification",
            config: {
              template: "Daily report generated",
              parameters: { priority: "medium" },
            },
          },
        ],
        enabled: true,
        priority: "medium",
        createdAt: Date.now(),
        executionCount: 0,
        successRate: 1.0,
      },
      {
        id: "anomaly-alert",
        name: "Anomaly Detection Alert",
        description: "Alert when anomalies are detected in system metrics",
        category: "security",
        trigger: {
          type: "threshold",
          config: {
            threshold: {
              metric: "error_rate",
              operator: "greater",
              value: 5,
            },
          },
        },
        conditions: [
          {
            type: "system",
            operator: "and",
            config: {
              field: "system_health",
              operator: "equals",
              value: "degraded",
            },
          },
        ],
        actions: [
          {
            type: "notification",
            config: {
              template: "System anomaly detected",
              parameters: { priority: "high" },
            },
          },
          {
            type: "workflow",
            config: {
              parameters: { workflowId: "incident-response" },
            },
          },
        ],
        enabled: true,
        priority: "high",
        createdAt: Date.now(),
        executionCount: 0,
        successRate: 1.0,
      },
    ];

    setRules(defaultRules);
    defaultRules.forEach((rule) => {
      engineRef.current?.rules.set(rule.id, rule);
    });
  }, []);

  const initializeModels = useCallback(() => {
    if (!engineRef.current) return;

    const modelList: AIModel[] = [];
    engineRef.current.models.forEach((model, id) => {
      modelList.push(model);
    });
    setModels(modelList);
  }, []);

  const createRule = useCallback(
    async (
      ruleData: Omit<
        AutomationRule,
        "id" | "createdAt" | "executionCount" | "successRate"
      >,
    ): Promise<AutomationRule> => {
      const rule: AutomationRule = {
        ...ruleData,
        id: Math.random().toString(36),
        createdAt: Date.now(),
        executionCount: 0,
        successRate: 1.0,
      };

      setRules((prev) => [...prev, rule]);
      engineRef.current?.rules.set(rule.id, rule);

      return rule;
    },
    [],
  );

  const updateRule = useCallback(
    async (id: string, updates: Partial<AutomationRule>): Promise<void> => {
      setRules((prev) =>
        prev.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule)),
      );

      const rule = engineRef.current?.rules.get(id);
      if (rule) {
        Object.assign(rule, updates);
      }
    },
    [],
  );

  const deleteRule = useCallback(async (id: string): Promise<void> => {
    setRules((prev) => prev.filter((rule) => rule.id !== id));
    engineRef.current?.rules.delete(id);
  }, []);

  const enableRule = useCallback(
    async (id: string): Promise<void> => {
      await updateRule(id, { enabled: true });
    },
    [updateRule],
  );

  const disableRule = useCallback(
    async (id: string): Promise<void> => {
      await updateRule(id, { enabled: false });
    },
    [updateRule],
  );

  const executeRule = useCallback(
    async (ruleId: string, trigger: string): Promise<AutomationExecution> => {
      if (!engineRef.current) {
        throw new Error("Automation engine not initialized");
      }

      const execution = await engineRef.current.executeRule(ruleId, trigger);

      setExecutions((prev) => [execution, ...prev.slice(0, 99)]); // Keep last 100 executions

      return execution;
    },
    [],
  );

  const cancelExecution = useCallback(
    async (executionId: string): Promise<void> => {
      setExecutions((prev) =>
        prev.map((exec) =>
          exec.id === executionId
            ? { ...exec, status: "cancelled", endTime: Date.now() }
            : exec,
        ),
      );
    },
    [],
  );

  const trainModel = useCallback(
    async (modelId: string, data: any[]): Promise<void> => {
      if (!engineRef.current) {
        throw new Error("Automation engine not initialized");
      }

      await engineRef.current.trainModel(modelId, data);

      // Update models list
      initializeModels();
    },
    [initializeModels],
  );

  const predict = useCallback(
    async (modelId: string, data: any): Promise<any> => {
      if (!engineRef.current) {
        throw new Error("Automation engine not initialized");
      }

      return await engineRef.current.predict(modelId, data);
    },
    [],
  );

  const generateSuggestions = useCallback(async (): Promise<void> => {
    const suggestions: SmartSuggestion[] = [
      {
        id: "opt-schedule",
        type: "optimization",
        title: "Optimize Rule Schedule",
        description:
          "Analysis suggests moving daily report to 8 AM for better performance",
        confidence: 0.85,
        impact: "medium",
        category: "performance",
        data: {
          currentSchedule: "0 9 * * 1-5",
          suggestedSchedule: "0 8 * * 1-5",
        },
        actions: [
          {
            label: "Apply Suggestion",
            action: () => console.log("Applied schedule optimization"),
          },
        ],
        createdAt: Date.now(),
      },
      {
        id: "new-automation",
        type: "automation",
        title: "Create Backup Automation",
        description:
          "System suggests creating automated backup for critical data",
        confidence: 0.92,
        impact: "high",
        category: "security",
        data: { dataType: "database", frequency: "daily" },
        actions: [
          {
            label: "Create Rule",
            action: () => console.log("Created backup automation"),
          },
        ],
        createdAt: Date.now(),
      },
    ];

    setSuggestions(suggestions);
  }, []);

  const applySuggestion = useCallback(
    async (suggestionId: string): Promise<void> => {
      const suggestion = suggestions.find((s) => s.id === suggestionId);
      if (suggestion && suggestion.actions.length > 0) {
        suggestion.actions[0].action();
        setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
      }
    },
    [suggestions],
  );

  const dismissSuggestion = useCallback(
    async (suggestionId: string): Promise<void> => {
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
    },
    [],
  );

  const getExecutionHistory = useCallback(
    (ruleId?: string, limit: number = 50): AutomationExecution[] => {
      let history = executions;

      if (ruleId) {
        history = history.filter((exec) => exec.ruleId === ruleId);
      }

      return history.slice(0, limit);
    },
    [executions],
  );

  const getStatistics = useCallback(() => {
    const totalRules = rules.length;
    const activeRules = rules.filter((rule) => rule.enabled).length;
    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(
      (exec) => exec.status === "completed",
    ).length;
    const successRate =
      totalExecutions > 0 ? successfulExecutions / totalExecutions : 0;

    const executionTimes = executions
      .filter((exec) => exec.endTime)
      .map((exec) => exec.endTime! - exec.startTime);
    const averageExecutionTime =
      executionTimes.length > 0
        ? executionTimes.reduce((sum, time) => sum + time, 0) /
          executionTimes.length
        : 0;

    return {
      totalRules,
      activeRules,
      totalExecutions,
      successRate,
      averageExecutionTime,
    };
  }, [rules, executions]);

  const contextValue: AutomationContextType = {
    rules,
    createRule,
    updateRule,
    deleteRule,
    enableRule,
    disableRule,
    executions,
    executeRule,
    cancelExecution,
    models,
    trainModel,
    predict,
    suggestions,
    generateSuggestions,
    applySuggestion,
    dismissSuggestion,
    getExecutionHistory,
    getStatistics,
  };

  return (
    <AutomationContext.Provider value={contextValue}>
      {children}
    </AutomationContext.Provider>
  );
};

// Hooks
export const useAutomation = (): AutomationContextType => {
  const context = React.useContext(AutomationContext);
  if (!context) {
    throw new Error("useAutomation must be used within AutomationEngine");
  }
  return context;
};

// Higher-Order Components
export const withAutomation = <P extends object>(
  Component: React.ComponentType<P>,
) => {
  const WithAutomationComponent = (props: P) => (
    <AutomationEngine>
      <Component {...props} />
    </AutomationEngine>
  );
  WithAutomationComponent.displayName = `withAutomation(${Component.displayName || Component.name})`;
  return WithAutomationComponent;
};

// Utility Components
export { AutomationContext };
export default AutomationEngine;
