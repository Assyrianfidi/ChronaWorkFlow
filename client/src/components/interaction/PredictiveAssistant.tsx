import React, { useState, useEffect, useCallback, useRef } from "react";
import { useUserExperienceMode } from '@/components/adaptive/UserExperienceMode';
import { usePerformance } from '@/components/adaptive/UI-Performance-Engine';

// Predictive Assistant types and interfaces
export interface PredictionModel {
  id: string;
  name: string;
  type:
    | "classification"
    | "regression"
    | "clustering"
    | "recommendation"
    | "anomaly-detection";
  version: string;
  accuracy: number;
  features: string[];
  target: string;
  algorithm: string;
  metadata: Record<string, any>;
}

export interface UserBehaviorData {
  userId: string;
  sessionId: string;
  timestamp: number;
  action: string;
  target: string;
  context: Record<string, any>;
  duration?: number;
  success?: boolean;
  metadata?: Record<string, any>;
}

export interface Prediction {
  id: string;
  modelId: string;
  userId: string;
  timestamp: number;
  input: Record<string, any>;
  output: any;
  confidence: number;
  explanation?: string;
  metadata: Record<string, any>;
}

export interface Suggestion {
  id: string;
  type:
    | "action"
    | "content"
    | "navigation"
    | "workflow"
    | "setting"
    | "shortcut";
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  confidence: number;
  action: SuggestionAction;
  context: Record<string, any>;
  expiresAt?: number;
  dismissed?: boolean;
  applied?: boolean;
}

export interface SuggestionAction {
  type:
    | "navigate"
    | "execute"
    | "configure"
    | "create"
    | "update"
    | "delete"
    | "custom";
  target?: string;
  data?: Record<string, any>;
  handler?: () => void | Promise<void>;
}

export interface LearningPattern {
  id: string;
  userId: string;
  pattern: string;
  frequency: number;
  lastSeen: number;
  context: Record<string, any>;
  confidence: number;
}

export interface AssistantConfig {
  enabled: boolean;
  learning: boolean;
  suggestions: {
    enabled: boolean;
    maxSuggestions: number;
    minConfidence: number;
    autoApply: boolean;
    types: Suggestion["type"][];
  };
  models: {
    enabled: boolean;
    autoUpdate: boolean;
    fallbackBehavior: "conservative" | "balanced" | "aggressive";
  };
  privacy: {
    dataRetention: number; // days
    anonymization: boolean;
    consent: boolean;
  };
  performance: {
    maxProcessingTime: number; // ms
    batchSize: number;
    cacheSize: number;
  };
}

export interface Insight {
  id: string;
  type: "trend" | "anomaly" | "opportunity" | "risk" | "efficiency";
  title: string;
  description: string;
  impact: "low" | "medium" | "high" | "critical";
  confidence: number;
  data: Record<string, any>;
  recommendations: string[];
  timestamp: number;
}

const defaultConfig: AssistantConfig = {
  enabled: true,
  learning: true,
  suggestions: {
    enabled: true,
    maxSuggestions: 5,
    minConfidence: 0.7,
    autoApply: false,
    types: [
      "action",
      "content",
      "navigation",
      "workflow",
      "setting",
      "shortcut",
    ],
  },
  models: {
    enabled: true,
    autoUpdate: true,
    fallbackBehavior: "balanced",
  },
  privacy: {
    dataRetention: 30,
    anonymization: true,
    consent: false,
  },
  performance: {
    maxProcessingTime: 1000,
    batchSize: 100,
    cacheSize: 1000,
  },
};

// Context for predictive assistant
interface PredictiveAssistantContextType {
  config: AssistantConfig;
  updateConfig: (updates: Partial<AssistantConfig>) => void;
  suggestions: Suggestion[];
  insights: Insight[];
  patterns: LearningPattern[];
  trackBehavior: (behavior: Omit<UserBehaviorData, "timestamp">) => void;
  getSuggestion: (id: string) => Suggestion | undefined;
  applySuggestion: (id: string) => Promise<void>;
  dismissSuggestion: (id: string) => void;
  generatePrediction: (
    modelId: string,
    input: Record<string, any>,
  ) => Promise<Prediction>;
  trainModel: (modelId: string, data: UserBehaviorData[]) => Promise<void>;
  getInsights: (type?: Insight["type"]) => Insight[];
  clearData: (type: "behavior" | "suggestions" | "patterns" | "all") => void;
}

const PredictiveAssistantContext =
  React.createContext<PredictiveAssistantContextType | null>(null);

// Machine Learning Models
class MLModelManager {
  private models: Map<string, PredictionModel> = new Map();
  private cache: Map<string, any> = new Map();

  constructor() {
    this.initializeModels();
  }

  private initializeModels(): void {
    // Initialize built-in models
    const builtInModels: PredictionModel[] = [
      {
        id: "navigation-predictor",
        name: "Navigation Predictor",
        type: "recommendation",
        version: "1.0.0",
        accuracy: 0.85,
        features: ["timeOfDay", "lastPage", "userRole", "sessionDuration"],
        target: "nextPage",
        algorithm: "collaborative-filtering",
        metadata: {
          description: "Predicts the next page a user will navigate to",
          updateFrequency: "daily",
        },
      },
      {
        id: "workflow-recommender",
        name: "Workflow Recommender",
        type: "recommendation",
        version: "1.0.0",
        accuracy: 0.78,
        features: ["currentTask", "userRole", "department", "timeConstraints"],
        target: "recommendedWorkflow",
        algorithm: "content-based-filtering",
        metadata: {
          description: "Recommends relevant workflows based on current context",
          updateFrequency: "weekly",
        },
      },
      {
        id: "error-predictor",
        name: "Error Predictor",
        type: "classification",
        version: "1.0.0",
        accuracy: 0.72,
        features: [
          "userExperience",
          "systemLoad",
          "recentErrors",
          "complexity",
        ],
        target: "errorLikelihood",
        algorithm: "random-forest",
        metadata: {
          description: "Predicts likelihood of user errors",
          updateFrequency: "weekly",
        },
      },
      {
        id: "efficiency-analyzer",
        name: "Efficiency Analyzer",
        type: "regression",
        version: "1.0.0",
        accuracy: 0.81,
        features: ["taskDuration", "clicks", "navigation", "searches"],
        target: "efficiencyScore",
        algorithm: "linear-regression",
        metadata: {
          description: "Analyzes user efficiency patterns",
          updateFrequency: "monthly",
        },
      },
    ];

    builtInModels.forEach((model) => {
      this.models.set(model.id, model);
    });
  }

  async predict(
    modelId: string,
    input: Record<string, any>,
  ): Promise<Prediction> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    // Check cache
    const cacheKey = `${modelId}:${JSON.stringify(input)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Simulate ML prediction
    const output = await this.runModel(model, input);
    const confidence = model.accuracy + (Math.random() - 0.5) * 0.1; // Add some randomness

    const prediction: Prediction = {
      id: Math.random().toString(36).substr(2, 9),
      modelId,
      userId: input.userId || "anonymous",
      timestamp: Date.now(),
      input,
      output,
      confidence: Math.max(0, Math.min(1, confidence)),
      explanation: this.generateExplanation(model, input, output),
      metadata: {
        processingTime: Math.random() * 100,
        version: model.version,
      },
    };

    // Cache result
    this.cache.set(cacheKey, prediction);

    return prediction;
  }

  private async runModel(
    model: PredictionModel,
    input: Record<string, any>,
  ): Promise<any> {
    // Simulate different model algorithms
    switch (model.algorithm) {
      case "collaborative-filtering":
        return this.collaborativeFiltering(input, model);
      case "content-based-filtering":
        return this.contentBasedFiltering(input, model);
      case "random-forest":
        return this.randomForest(input, model);
      case "linear-regression":
        return this.linearRegression(input, model);
      default:
        return this.defaultPrediction(input, model);
    }
  }

  private collaborativeFiltering(
    input: Record<string, any>,
    model: PredictionModel,
  ): any {
    // Simulate collaborative filtering
    const commonPages = ["/dashboard", "/reports", "/settings", "/help"];
    return {
      recommendations: commonPages.sort(() => Math.random() - 0.5).slice(0, 3),
      scores: [0.8, 0.6, 0.4].sort(() => Math.random() - 0.5),
    };
  }

  private contentBasedFiltering(
    input: Record<string, any>,
    model: PredictionModel,
  ): any {
    // Simulate content-based filtering
    const workflows = [
      "invoice-approval",
      "expense-report",
      "time-tracking",
      "project-management",
    ];
    return {
      workflows: workflows.sort(() => Math.random() - 0.5).slice(0, 2),
      relevance: [0.9, 0.7, 0.5].sort(() => Math.random() - 0.5),
    };
  }

  private randomForest(
    input: Record<string, any>,
    model: PredictionModel,
  ): any {
    // Simulate random forest classification
    const errorRisk = Math.random();
    return {
      errorLikelihood: errorRisk,
      riskLevel: errorRisk > 0.7 ? "high" : errorRisk > 0.3 ? "medium" : "low",
      factors: ["userExperience", "systemLoad", "complexity"],
    };
  }

  private linearRegression(
    input: Record<string, any>,
    model: PredictionModel,
  ): any {
    // Simulate linear regression
    const efficiency = 0.5 + Math.random() * 0.5;
    return {
      efficiencyScore: efficiency,
      factors: {
        taskDuration: 0.3,
        clicks: -0.2,
        navigation: 0.4,
        searches: -0.1,
      },
    };
  }

  private defaultPrediction(
    input: Record<string, any>,
    model: PredictionModel,
  ): any {
    return {
      prediction: "default",
      confidence: 0.5,
    };
  }

  private generateExplanation(
    model: PredictionModel,
    input: Record<string, any>,
    output: any,
  ): string {
    switch (model.id) {
      case "navigation-predictor":
        return `Based on your recent navigation patterns and current context, you're likely to visit ${output.recommendations?.[0] || "the dashboard"} next.`;
      case "workflow-recommender":
        return `Given your current task of ${input.currentTask}, the ${output.workflows?.[0] || "invoice approval"} workflow might be helpful.`;
      case "error-predictor":
        return `There's a ${Math.round(output.errorLikelihood * 100)}% chance of encountering errors based on current conditions.`;
      case "efficiency-analyzer":
        return `Your efficiency score is ${Math.round(output.efficiencyScore * 100)}%. Consider reducing ${Object.entries(output.factors).find(([_, v]) => v < 0)?.[0] || "clicks"} to improve.`;
      default:
        return "Prediction based on machine learning analysis.";
    }
  }

  getModel(id: string): PredictionModel | undefined {
    return this.models.get(id);
  }

  getAllModels(): PredictionModel[] {
    return Array.from(this.models.values());
  }

  addModel(model: PredictionModel): void {
    this.models.set(model.id, model);
  }

  removeModel(id: string): void {
    this.models.delete(id);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Behavior Tracking Manager
class BehaviorTracker {
  private behaviors: UserBehaviorData[] = [];
  private patterns: Map<string, LearningPattern> = new Map();
  private sessionStart: number = Date.now();
  private sessionId: string;

  constructor() {
    this.sessionId = Math.random().toString(36).substr(2, 9);
    this.loadStoredData();
  }

  track(behavior: Omit<UserBehaviorData, "timestamp">): void {
    const fullBehavior: UserBehaviorData = {
      ...behavior,
      timestamp: Date.now(),
    };

    this.behaviors.push(fullBehavior);
    this.analyzePatterns(fullBehavior);
    this.saveData();
  }

  private analyzePatterns(behavior: UserBehaviorData): void {
    // Analyze sequences and patterns
    const recentBehaviors = this.behaviors.slice(-10);
    const sequence = recentBehaviors.map((b) => b.action).join("->");

    const patternKey = `${behavior.userId}:${sequence}`;
    const existing = this.patterns.get(patternKey);

    if (existing) {
      existing.frequency++;
      existing.lastSeen = behavior.timestamp;
      existing.confidence = Math.min(1, existing.confidence + 0.1);
    } else {
      this.patterns.set(patternKey, {
        id: Math.random().toString(36).substr(2, 9),
        userId: behavior.userId,
        pattern: sequence,
        frequency: 1,
        lastSeen: behavior.timestamp,
        context: behavior.context,
        confidence: 0.1,
      });
    }
  }

  getPatterns(userId?: string): LearningPattern[] {
    return Array.from(this.patterns.values())
      .filter((p) => !userId || p.userId === userId)
      .sort((a, b) => b.confidence - a.confidence);
  }

  getRecentBehaviors(limit: number = 100): UserBehaviorData[] {
    return this.behaviors.slice(-limit);
  }

  getBehaviorsByUser(userId: string): UserBehaviorData[] {
    return this.behaviors.filter((b) => b.userId === userId);
  }

  clear(): void {
    this.behaviors = [];
    this.patterns.clear();
    this.saveData();
  }

  private saveData(): void {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        "behavior-data",
        JSON.stringify({
          behaviors: this.behaviors.slice(-1000), // Keep last 1000 behaviors
          patterns: Array.from(this.patterns.values()),
        }),
      );
    }
  }

  private loadStoredData(): void {
    if (typeof localStorage !== "undefined") {
      try {
        const stored = localStorage.getItem("behavior-data");
        if (stored) {
          const data = JSON.parse(stored);
          this.behaviors = data.behaviors || [];
          this.patterns = new Map(
            data.patterns?.map((p: LearningPattern) => [p.id, p]) || [],
          );
        }
      } catch (error) {
        console.error("Failed to load behavior data:", error);
      }
    }
  }
}

// Suggestion Engine
class SuggestionEngine {
  private suggestions: Map<string, Suggestion> = new Map();
  private mlManager: MLModelManager;
  private behaviorTracker: BehaviorTracker;

  constructor(mlManager: MLModelManager, behaviorTracker: BehaviorTracker) {
    this.mlManager = mlManager;
    this.behaviorTracker = behaviorTracker;
  }

  async generateSuggestions(
    userId: string,
    context: Record<string, any>,
  ): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    // Generate navigation suggestions
    const navSuggestion = await this.generateNavigationSuggestion(
      userId,
      context,
    );
    if (navSuggestion) suggestions.push(navSuggestion);

    // Generate workflow suggestions
    const workflowSuggestion = await this.generateWorkflowSuggestion(
      userId,
      context,
    );
    if (workflowSuggestion) suggestions.push(workflowSuggestion);

    // Generate efficiency suggestions
    const efficiencySuggestion = await this.generateEfficiencySuggestion(
      userId,
      context,
    );
    if (efficiencySuggestion) suggestions.push(efficiencySuggestion);

    // Generate error prevention suggestions
    const errorSuggestion = await this.generateErrorPreventionSuggestion(
      userId,
      context,
    );
    if (errorSuggestion) suggestions.push(errorSuggestion);

    // Sort by confidence and priority
    return suggestions
      .sort((a, b) => {
        const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityWeight[a.priority];
        const bPriority = priorityWeight[b.priority];

        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }

        return b.confidence - a.confidence;
      })
      .slice(0, 5); // Limit to top 5 suggestions
  }

  private async generateNavigationSuggestion(
    userId: string,
    context: Record<string, any>,
  ): Promise<Suggestion | null> {
    try {
      const prediction = await this.mlManager.predict("navigation-predictor", {
        userId,
        ...context,
      });

      if (
        prediction.confidence > 0.7 &&
        prediction.output.recommendations?.[0]
      ) {
        return {
          id: Math.random().toString(36).substr(2, 9),
          type: "navigation",
          title: "Quick Navigation",
          description: `Navigate to ${prediction.output.recommendations[0]}`,
          priority: "medium",
          confidence: prediction.confidence,
          action: {
            type: "navigate",
            target: prediction.output.recommendations[0],
          },
          context,
          expiresAt: Date.now() + 300000, // 5 minutes
        };
      }
    } catch (error) {
      console.warn("Failed to generate navigation suggestion:", error);
    }

    return null;
  }

  private async generateWorkflowSuggestion(
    userId: string,
    context: Record<string, any>,
  ): Promise<Suggestion | null> {
    try {
      const prediction = await this.mlManager.predict("workflow-recommender", {
        userId,
        ...context,
      });

      if (prediction.confidence > 0.6 && prediction.output.workflows?.[0]) {
        return {
          id: Math.random().toString(36).substr(2, 9),
          type: "workflow",
          title: "Recommended Workflow",
          description: `Try the ${prediction.output.workflows[0].replace("-", " ")} workflow`,
          priority: "medium",
          confidence: prediction.confidence,
          action: {
            type: "execute",
            target: prediction.output.workflows[0],
          },
          context,
          expiresAt: Date.now() + 600000, // 10 minutes
        };
      }
    } catch (error) {
      console.warn("Failed to generate workflow suggestion:", error);
    }

    return null;
  }

  private async generateEfficiencySuggestion(
    userId: string,
    context: Record<string, any>,
  ): Promise<Suggestion | null> {
    try {
      const prediction = await this.mlManager.predict("efficiency-analyzer", {
        userId,
        ...context,
      });

      if (
        prediction.confidence > 0.5 &&
        prediction.output.efficiencyScore < 0.7
      ) {
        const factors = Object.entries(prediction.output.factors || {});
        const worstFactor = factors.find(([_, value]) => value < 0)?.[0];

        return {
          id: Math.random().toString(36).substr(2, 9),
          type: "action",
          title: "Efficiency Tip",
          description: `Reduce ${worstFactor || "unnecessary actions"} to improve efficiency`,
          priority: "low",
          confidence: prediction.confidence,
          action: {
            type: "custom",
            handler: () => {
              // Show efficiency tips
              console.log("Showing efficiency tips for:", worstFactor);
            },
          },
          context,
          expiresAt: Date.now() + 900000, // 15 minutes
        };
      }
    } catch (error) {
      console.warn("Failed to generate efficiency suggestion:", error);
    }

    return null;
  }

  private async generateErrorPreventionSuggestion(
    userId: string,
    context: Record<string, any>,
  ): Promise<Suggestion | null> {
    try {
      const prediction = await this.mlManager.predict("error-predictor", {
        userId,
        ...context,
      });

      if (
        prediction.confidence > 0.6 &&
        prediction.output.errorLikelihood > 0.5
      ) {
        return {
          id: Math.random().toString(36).substr(2, 9),
          type: "action",
          title: "Error Prevention",
          description:
            "High error risk detected. Consider double-checking your inputs.",
          priority: "high",
          confidence: prediction.confidence,
          action: {
            type: "custom",
            handler: () => {
              // Show validation tips
              console.log("Showing error prevention tips");
            },
          },
          context,
          expiresAt: Date.now() + 120000, // 2 minutes
        };
      }
    } catch (error) {
      console.warn("Failed to generate error prevention suggestion:", error);
    }

    return null;
  }

  addSuggestion(suggestion: Suggestion): void {
    this.suggestions.set(suggestion.id, suggestion);
  }

  getSuggestion(id: string): Suggestion | undefined {
    return this.suggestions.get(id);
  }

  getAllSuggestions(): Suggestion[] {
    return Array.from(this.suggestions.values());
  }

  dismissSuggestion(id: string): void {
    const suggestion = this.suggestions.get(id);
    if (suggestion) {
      suggestion.dismissed = true;
    }
  }

  applySuggestion(id: string): void {
    const suggestion = this.suggestions.get(id);
    if (suggestion && suggestion.action.handler) {
      suggestion.action.handler();
      suggestion.applied = true;
    }
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [id, suggestion] of this.suggestions) {
      if (suggestion.expiresAt && suggestion.expiresAt < now) {
        this.suggestions.delete(id);
      }
    }
  }
}

// Insight Generator
class InsightGenerator {
  private insights: Map<string, Insight> = new Map();
  private behaviorTracker: BehaviorTracker;

  constructor(behaviorTracker: BehaviorTracker) {
    this.behaviorTracker = behaviorTracker;
  }

  async generateInsights(userId: string): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Generate trend insights
    const trendInsight = this.generateTrendInsight(userId);
    if (trendInsight) insights.push(trendInsight);

    // Generate efficiency insights
    const efficiencyInsight = this.generateEfficiencyInsight(userId);
    if (efficiencyInsight) insights.push(efficiencyInsight);

    // Generate opportunity insights
    const opportunityInsight = this.generateOpportunityInsight(userId);
    if (opportunityInsight) insights.push(opportunityInsight);

    // Store insights
    insights.forEach((insight) => {
      this.insights.set(insight.id, insight);
    });

    return insights;
  }

  private generateTrendInsight(userId: string): Insight | null {
    const behaviors = this.behaviorTracker.getBehaviorsByUser(userId);
    const recentBehaviors = behaviors.slice(-50);

    if (recentBehaviors.length < 10) return null;

    // Analyze usage patterns
    const pageVisits = recentBehaviors.filter((b) => b.action === "page-visit");
    const mostVisited = this.getMostFrequent(pageVisits.map((b) => b.target));

    if (mostVisited) {
      return {
        id: Math.random().toString(36).substr(2, 9),
        type: "trend",
        title: "Usage Pattern Detected",
        description: `You frequently visit ${mostVisited}. Consider adding it to your quick access.`,
        impact: "low",
        confidence: 0.8,
        data: {
          mostVisited,
          frequency: pageVisits.filter((b) => b.target === mostVisited).length,
        },
        recommendations: [
          "Add to quick access",
          "Create bookmark",
          "Set as homepage",
        ],
        timestamp: Date.now(),
      };
    }

    return null;
  }

  private generateEfficiencyInsight(userId: string): Insight | null {
    const behaviors = this.behaviorTracker.getBehaviorsByUser(userId);
    const recentBehaviors = behaviors.slice(-100);

    if (recentBehaviors.length < 20) return null;

    // Calculate average task completion time
    const taskCompletions = recentBehaviors.filter(
      (b) => b.action === "task-complete" && b.duration,
    );
    if (taskCompletions.length < 5) return null;

    const avgDuration =
      taskCompletions.reduce((sum, b) => sum + (b.duration || 0), 0) /
      taskCompletions.length;
    const slowTasks = taskCompletions.filter(
      (b) => (b.duration || 0) > avgDuration * 1.5,
    );

    if (slowTasks.length > 0) {
      return {
        id: Math.random().toString(36).substr(2, 9),
        type: "efficiency",
        title: "Task Efficiency Analysis",
        description: `${slowTasks.length} tasks are taking longer than average. Consider optimization.`,
        impact: "medium",
        confidence: 0.7,
        data: {
          avgDuration,
          slowTasks: slowTasks.length,
          totalTasks: taskCompletions.length,
        },
        recommendations: [
          "Review workflow steps",
          "Look for automation opportunities",
          "Check for redundant actions",
        ],
        timestamp: Date.now(),
      };
    }

    return null;
  }

  private generateOpportunityInsight(userId: string): Insight | null {
    const patterns = this.behaviorTracker.getPatterns(userId);
    const highConfidencePatterns = patterns.filter((p) => p.confidence > 0.7);

    if (highConfidencePatterns.length > 0) {
      const topPattern = highConfidencePatterns[0];

      return {
        id: Math.random().toString(36).substr(2, 9),
        type: "opportunity",
        title: "Automation Opportunity",
        description: `Frequent pattern detected: ${topPattern.pattern}. Consider automation.`,
        impact: "high",
        confidence: topPattern.confidence,
        data: { pattern: topPattern.pattern, frequency: topPattern.frequency },
        recommendations: [
          "Create workflow automation",
          "Add quick action button",
          "Set up template",
        ],
        timestamp: Date.now(),
      };
    }

    return null;
  }

  private getMostFrequent(items: string[]): string | null {
    if (items.length === 0) return null;

    const frequency: Record<string, number> = {};
    items.forEach((item) => {
      frequency[item] = (frequency[item] || 0) + 1;
    });

    return Object.entries(frequency).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
  }

  getInsights(type?: Insight["type"]): Insight[] {
    const insights = Array.from(this.insights.values());
    return type ? insights.filter((i) => i.type === type) : insights;
  }

  clearInsights(): void {
    this.insights.clear();
  }
}

// Main Predictive Assistant Component
export function PredictiveAssistant({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentMode } = useUserExperienceMode();
  const { isLowPerformanceMode } = usePerformance();

  const [config, setConfig] = useState<AssistantConfig>(defaultConfig);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [patterns, setPatterns] = useState<LearningPattern[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("anonymous");

  const mlManagerRef = useRef<MLModelManager>();
  const behaviorTrackerRef = useRef<BehaviorTracker>();
  const suggestionEngineRef = useRef<SuggestionEngine>();
  const insightGeneratorRef = useRef<InsightGenerator>();
  const updateIntervalRef = useRef<NodeJS.Timeout>();

  // Initialize managers
  useEffect(() => {
    mlManagerRef.current = new MLModelManager();
    behaviorTrackerRef.current = new BehaviorTracker();
    suggestionEngineRef.current = new SuggestionEngine(
      mlManagerRef.current,
      behaviorTrackerRef.current,
    );
    insightGeneratorRef.current = new InsightGenerator(
      behaviorTrackerRef.current,
    );

    // Load user ID from auth or localStorage
    const userId = localStorage.getItem("user-id") || "anonymous";
    setCurrentUserId(userId);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  // Adapt to user experience mode
  useEffect(() => {
    const updates: Partial<AssistantConfig> = {
      enabled: currentMode.shortcuts && !isLowPerformanceMode,
      suggestions: {
        ...config.suggestions,
        enabled: currentMode.shortcuts && !isLowPerformanceMode,
        autoApply: false, // Never auto-apply in production
      },
      models: {
        ...config.models,
        enabled: !isLowPerformanceMode,
      },
    };

    setConfig((prev) => ({ ...prev, ...updates }));
  }, [currentMode, isLowPerformanceMode]);

  // Periodic updates
  useEffect(() => {
    if (!config.enabled) return;

    const updateData = async () => {
      try {
        // Update suggestions
        if (config.suggestions.enabled) {
          const newSuggestions =
            await suggestionEngineRef.current?.generateSuggestions(
              currentUserId,
              { timestamp: Date.now() },
            );
          if (newSuggestions) {
            setSuggestions(newSuggestions);
          }
        }

        // Update insights
        const newInsights =
          await insightGeneratorRef.current?.generateInsights(currentUserId);
        if (newInsights) {
          setInsights(newInsights);
        }

        // Update patterns
        if (behaviorTrackerRef.current) {
          setPatterns(behaviorTrackerRef.current.getPatterns(currentUserId));
        }

        // Clear expired suggestions
        suggestionEngineRef.current?.clearExpired();
      } catch (error) {
        console.error("Failed to update predictive data:", error);
      }
    };

    updateData();
    updateIntervalRef.current = setInterval(updateData, 60000); // Update every minute

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [config.enabled, config.suggestions.enabled, currentUserId]);

  const updateConfig = useCallback((updates: Partial<AssistantConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const trackBehavior = useCallback(
    (behavior: Omit<UserBehaviorData, "timestamp">) => {
      if (!config.enabled || !config.learning) return;

      behaviorTrackerRef.current?.track({
        ...behavior,
        userId: behavior.userId || currentUserId,
      });
    },
    [config.enabled, config.learning, currentUserId],
  );

  const getSuggestion = useCallback((id: string): Suggestion | undefined => {
    return suggestionEngineRef.current?.getSuggestion(id);
  }, []);

  const applySuggestion = useCallback(async (id: string): Promise<void> => {
    const suggestion = suggestionEngineRef.current?.getSuggestion(id);
    if (suggestion) {
      await suggestion.action.handler?.();
      suggestionEngineRef.current?.applySuggestion(id);
      setSuggestions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, applied: true } : s)),
      );
    }
  }, []);

  const dismissSuggestion = useCallback((id: string): void => {
    suggestionEngineRef.current?.dismissSuggestion(id);
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, dismissed: true } : s)),
    );
  }, []);

  const generatePrediction = useCallback(
    async (
      modelId: string,
      input: Record<string, any>,
    ): Promise<Prediction> => {
      if (!mlManagerRef.current) {
        throw new Error("ML Manager not initialized");
      }

      return await mlManagerRef.current.predict(modelId, {
        userId: currentUserId,
        ...input,
      });
    },
    [currentUserId],
  );

  const trainModel = useCallback(
    async (modelId: string, data: UserBehaviorData[]): Promise<void> => {
      // In a real implementation, this would train the ML model
      console.log(`Training model ${modelId} with ${data.length} data points`);
    },
    [],
  );

  const getInsights = useCallback((type?: Insight["type"]): Insight[] => {
    return insightGeneratorRef.current?.getInsights(type) || [];
  }, []);

  const clearData = useCallback(
    (type: "behavior" | "suggestions" | "patterns" | "all"): void => {
      switch (type) {
        case "behavior":
          behaviorTrackerRef.current?.clear();
          break;
        case "suggestions":
          setSuggestions([]);
          suggestionEngineRef.current?.clearExpired();
          break;
        case "patterns":
          setPatterns([]);
          break;
        case "all":
          behaviorTrackerRef.current?.clear();
          setSuggestions([]);
          setPatterns([]);
          insightGeneratorRef.current?.clearInsights();
          break;
      }
    },
    [],
  );

  const contextValue: PredictiveAssistantContextType = {
    config,
    updateConfig,
    suggestions,
    insights,
    patterns,
    trackBehavior,
    getSuggestion,
    applySuggestion,
    dismissSuggestion,
    generatePrediction,
    trainModel,
    getInsights,
    clearData,
  };

  return (
    <PredictiveAssistantContext.Provider value={contextValue}>
      {children}
      {config.enabled && config.suggestions.enabled && <SuggestionPanel />}
    </PredictiveAssistantContext.Provider>
  );
}

// Suggestion Panel Component
function SuggestionPanel() {
  const { suggestions, applySuggestion, dismissSuggestion } = React.useContext(
    PredictiveAssistantContext,
  )!;
  const [isVisible, setIsVisible] = useState(false);

  const activeSuggestions = suggestions.filter(
    (s) => !s.dismissed && !s.applied,
  );

  if (activeSuggestions.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Suggestions ({activeSuggestions.length})
            </h3>
            <button
              onClick={() => setIsVisible(!isVisible)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {isVisible ? "▼" : "▲"}
            </button>
          </div>

          {isVisible && (
            <div className="space-y-3">
              {activeSuggestions.slice(0, 3).map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`p-3 rounded border ${
                    suggestion.priority === "critical"
                      ? "border-red-300 bg-red-50 dark:bg-red-900/20"
                      : suggestion.priority === "high"
                        ? "border-orange-300 bg-orange-50 dark:bg-orange-900/20"
                        : suggestion.priority === "medium"
                          ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20"
                          : "border-gray-300 bg-gray-50 dark:bg-gray-700/50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {suggestion.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {suggestion.description}
                      </p>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className="text-xs text-gray-500">
                          {Math.round(suggestion.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={() => applySuggestion(suggestion.id)}
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => dismissSuggestion(suggestion.id)}
                        className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook for using predictive assistant
export function usePredictiveAssistant() {
  const context = React.useContext(PredictiveAssistantContext);
  if (!context) {
    throw new Error(
      "usePredictiveAssistant must be used within PredictiveAssistant",
    );
  }
  return context;
}

// Behavior Tracker HOC
export function withBehaviorTracking<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    action?: string;
    trackDuration?: boolean;
    trackSuccess?: boolean;
  } = {},
) {
  return function TrackedComponent(props: P) {
    const { trackBehavior } = usePredictiveAssistant();
    const startTime = useRef<number>();

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        const action = options.action || "click";

        if (options.trackDuration) {
          startTime.current = Date.now();
        }

        trackBehavior({
          userId: "current-user", // This would come from auth context
          sessionId: "current-session", // This would be managed elsewhere
          action,
          target: e.currentTarget.tagName.toLowerCase(),
          context: {
            component: Component.name,
            props: JSON.stringify(props),
          },
          success: options.trackSuccess ? true : undefined,
        });
      },
      [trackBehavior],
    );

    const handleMouseUp = useCallback(() => {
      if (options.trackDuration && startTime.current) {
        const duration = Date.now() - startTime.current;
        trackBehavior({
          userId: "current-user",
          sessionId: "current-session",
          action: "click-duration",
          target: "component",
          context: { component: Component.name, duration },
        });
        startTime.current = undefined;
      }
    }, [trackBehavior]);

    return (
      <div onClick={handleClick} onMouseUp={handleMouseUp}>
        {/* @ts-ignore */}
        <Component {...(props as P)} />
      </div>
    );
  };
}

export default PredictiveAssistant;
