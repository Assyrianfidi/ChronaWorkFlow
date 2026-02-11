import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAutomation } from "./AutomationEngine";
import { useAnalytics } from "@/components/analytics/AnalyticsEngine";

// AI Assistant Types
interface AIAssistantMessage {
  id: string;
  type: "user" | "assistant" | "system" | "action";
  content: string;
  timestamp: number;
  metadata?: {
    intent?: string;
    confidence?: number;
    suggestions?: string[];
    actions?: AIAction[];
    context?: any;
  };
}

interface AIAction {
  id: string;
  type:
    | "automation"
    | "workflow"
    | "data"
    | "analysis"
    | "report"
    | "notification";
  label: string;
  description: string;
  icon?: string;
  execute: () => Promise<any>;
  confirm?: boolean;
}

interface AIIntent {
  name: string;
  patterns: string[];
  actions: AIAction[];
  confidence: number;
}

interface AIContext {
  userRole: string;
  currentScreen: string;
  recentActions: string[];
  systemState: any;
  preferences: {
    language: string;
    responseStyle: "concise" | "detailed" | "technical";
    proactivity: "low" | "medium" | "high";
  };
}

interface AIModel {
  name: string;
  type: "nlp" | "prediction" | "recommendation" | "anomaly";
  status: "ready" | "training" | "error";
  capabilities: string[];
}

// AI Assistant Engine
class AIAssistantEngine {
  private intents: Map<string, AIIntent> = new Map();
  private models: Map<string, AIModel> = new Map();
  private context: AIContext;
  private conversationHistory: AIAssistantMessage[] = [];
  private learningData: any[] = [];

  constructor() {
    this.initializeIntents();
    this.initializeModels();
    this.initializeContext();
  }

  private initializeIntents(): void {
    const intents: AIIntent[] = [
      {
        name: "create_automation",
        patterns: [
          "create automation",
          "make a rule",
          "set up automation",
          "automate this",
          "new rule",
        ],
        actions: [
          {
            id: "create-rule",
            type: "automation",
            label: "Create Automation Rule",
            description: "Create a new automation rule",
            execute: async () => ({ success: true, ruleId: "new-rule" }),
          },
        ],
        confidence: 0.9,
      },
      {
        name: "run_report",
        patterns: [
          "run report",
          "generate report",
          "show me analytics",
          "create dashboard",
          "view metrics",
        ],
        actions: [
          {
            id: "generate-report",
            type: "report",
            label: "Generate Report",
            description: "Generate an analytics report",
            execute: async () => ({ success: true, reportId: "new-report" }),
          },
          {
            id: "create-dashboard",
            type: "analysis",
            label: "Create Dashboard",
            description: "Create a new dashboard",
            execute: async () => ({
              success: true,
              dashboardId: "new-dashboard",
            }),
          },
        ],
        confidence: 0.85,
      },
      {
        name: "system_status",
        patterns: [
          "system status",
          "how is the system",
          "health check",
          "performance",
          "system health",
        ],
        actions: [
          {
            id: "health-check",
            type: "analysis",
            label: "System Health Check",
            description: "Run comprehensive system health check",
            execute: async () => ({ success: true, health: "good" }),
          },
          {
            id: "performance-metrics",
            type: "data",
            label: "Performance Metrics",
            description: "Show current performance metrics",
            execute: async () => ({ success: true, metrics: [] }),
          },
        ],
        confidence: 0.95,
      },
      {
        name: "help_support",
        patterns: ["help", "how do I", "explain", "tutorial", "guide me"],
        actions: [
          {
            id: "show-help",
            type: "analysis",
            label: "Show Help",
            description: "Display help and documentation",
            execute: async () => ({ success: true, help: [] }),
          },
        ],
        confidence: 0.8,
      },
      {
        name: "troubleshoot",
        patterns: ["error", "problem", "issue", "not working", "fix"],
        actions: [
          {
            id: "diagnose",
            type: "analysis",
            label: "Diagnose Issue",
            description: "Diagnose and suggest fixes for issues",
            execute: async () => ({ success: true, diagnosis: "Issue found" }),
          },
          {
            id: "run-diagnostics",
            type: "data",
            label: "Run Diagnostics",
            description: "Run system diagnostics",
            execute: async () => ({ success: true, results: [] }),
          },
        ],
        confidence: 0.85,
      },
    ];

    intents.forEach((intent) => {
      this.intents.set(intent.name, intent);
    });
  }

  private initializeModels(): void {
    const models: AIModel[] = [
      {
        name: "nlp-processor",
        type: "nlp",
        status: "ready",
        capabilities: [
          "intent-recognition",
          "entity-extraction",
          "sentiment-analysis",
        ],
      },
      {
        name: "predictive-engine",
        type: "prediction",
        status: "ready",
        capabilities: ["trend-analysis", "anomaly-detection", "forecasting"],
      },
      {
        name: "recommendation-system",
        type: "recommendation",
        status: "ready",
        capabilities: [
          "action-recommendation",
          "workflow-optimization",
          "resource-allocation",
        ],
      },
      {
        name: "anomaly-detector",
        type: "anomaly",
        status: "ready",
        capabilities: [
          "behavior-analysis",
          "pattern-detection",
          "risk-assessment",
        ],
      },
    ];

    models.forEach((model) => {
      this.models.set(model.name, model);
    });
  }

  private initializeContext(): void {
    this.context = {
      userRole: "user",
      currentScreen: "dashboard",
      recentActions: [],
      systemState: {
        uptime: Date.now(),
        activeUsers: 0,
        systemLoad: 0.5,
      },
      preferences: {
        language: "en",
        responseStyle: "detailed",
        proactivity: "medium",
      },
    };
  }

  async processMessage(message: string): Promise<AIAssistantMessage> {
    // Add to conversation history
    const userMessage: AIAssistantMessage = {
      id: Math.random().toString(36),
      type: "user",
      content: message,
      timestamp: Date.now(),
    };

    this.conversationHistory.push(userMessage);

    // Process with NLP
    const intent = await this.recognizeIntent(message);
    const entities = await this.extractEntities(message);
    const sentiment = await this.analyzeSentiment(message);

    // Generate response
    const response = await this.generateResponse(
      message,
      intent,
      entities,
      sentiment,
    );

    // Add to conversation history
    this.conversationHistory.push(response);

    // Learn from interaction
    this.learnFromInteraction(userMessage, response);

    return response;
  }

  private async recognizeIntent(message: string): Promise<AIIntent | null> {
    const nlpModel = this.models.get("nlp-processor");
    if (!nlpModel || nlpModel.status !== "ready") {
      return null;
    }

    // Simple pattern matching for demo
    const lowerMessage = message.toLowerCase();

    for (const intent of this.intents.values()) {
      for (const pattern of intent.patterns) {
        if (lowerMessage.includes(pattern)) {
          return intent;
        }
      }
    }

    return null;
  }

  private async extractEntities(message: string): Promise<Record<string, any>> {
    // Simple entity extraction
    const entities: Record<string, any> = {};

    // Extract numbers
    const numbers = message.match(/\d+/g);
    if (numbers) {
      entities.numbers = numbers.map(Number);
    }

    // Extract dates
    const dates = message.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/g);
    if (dates) {
      entities.dates = dates;
    }

    // Extract keywords
    const keywords = [
      "automation",
      "report",
      "dashboard",
      "system",
      "error",
      "help",
    ];
    entities.keywords = keywords.filter((keyword) =>
      message.toLowerCase().includes(keyword),
    );

    return entities;
  }

  private async analyzeSentiment(message: string): Promise<{
    score: number;
    label: "positive" | "neutral" | "negative";
  }> {
    // Simple sentiment analysis
    const positiveWords = ["good", "great", "excellent", "helpful", "thanks"];
    const negativeWords = ["bad", "error", "problem", "issue", "wrong"];

    const lowerMessage = message.toLowerCase();
    const positiveCount = positiveWords.filter((word) =>
      lowerMessage.includes(word),
    ).length;
    const negativeCount = negativeWords.filter((word) =>
      lowerMessage.includes(word),
    ).length;

    const score =
      (positiveCount - negativeCount) /
      Math.max(positiveCount + negativeCount, 1);

    return {
      score,
      label: score > 0.1 ? "positive" : score < -0.1 ? "negative" : "neutral",
    };
  }

  private async generateResponse(
    message: string,
    intent: AIIntent | null,
    entities: Record<string, any>,
    sentiment: any,
  ): Promise<AIAssistantMessage> {
    let content = "";
    let actions: AIAction[] = [];
    let suggestions: string[] = [];

    if (intent) {
      // Intent-based response
      content = this.generateIntentResponse(intent, entities);
      actions = intent.actions;
      suggestions = this.generateSuggestions(intent, entities);
    } else {
      // General response
      content = this.generateGeneralResponse(message, entities);
      suggestions = this.generateGeneralSuggestions(entities);
    }

    // Add contextual information
    const contextualContent = this.addContextualInfo(content, entities);

    return {
      id: Math.random().toString(36),
      type: "assistant",
      content: contextualContent,
      timestamp: Date.now(),
      metadata: {
        intent: intent?.name,
        confidence: intent?.confidence || 0.5,
        suggestions,
        actions,
        context: { entities, sentiment },
      },
    };
  }

  private generateIntentResponse(
    intent: AIIntent,
    entities: Record<string, any>,
  ): string {
    switch (intent.name) {
      case "create_automation":
        return `I can help you create an automation rule. Based on your request, I can set up automated workflows to save you time and reduce manual tasks. Would you like me to guide you through the process or create a specific automation?`;

      case "run_report":
        return `I'll help you generate reports and analytics. I can create various types of reports including performance metrics, trend analysis, and custom dashboards. What specific data would you like to analyze?`;

      case "system_status":
        return `Let me check the system status for you. I can provide comprehensive health checks, performance metrics, and system diagnostics. Here's what I can tell you about the current state:`;

      case "help_support":
        return `I'm here to help! I can assist with automation, analytics, workflows, troubleshooting, and system management. What specific task would you like help with?`;

      case "troubleshoot":
        return `I understand you're experiencing an issue. Let me help diagnose and resolve the problem. I can run diagnostics, analyze error patterns, and suggest solutions. Can you provide more details about the issue?`;

      default:
        return `I understand you need help with ${intent.name.replace("_", " ")}. Let me assist you with that.`;
    }
  }

  private generateGeneralResponse(
    message: string,
    entities: Record<string, any>,
  ): string {
    if (entities.keywords?.length > 0) {
      return `I see you're interested in ${entities.keywords.join(", ")}. I can help you with these topics. What specific aspect would you like to explore?`;
    }

    return `I'm here to help you with automation, analytics, and system management. I can assist with creating workflows, generating reports, monitoring system health, and troubleshooting issues. What would you like to accomplish?`;
  }

  private generateSuggestions(
    intent: AIIntent,
    entities: Record<string, any>,
  ): string[] {
    const suggestions: string[] = [];

    switch (intent.name) {
      case "create_automation":
        suggestions.push("Create a data backup automation");
        suggestions.push("Set up email notifications");
        suggestions.push("Automate report generation");
        break;

      case "run_report":
        suggestions.push("Generate weekly performance report");
        suggestions.push("Create real-time dashboard");
        suggestions.push("Analyze user engagement metrics");
        break;

      case "system_status":
        suggestions.push("Run full system diagnostics");
        suggestions.push("Check resource utilization");
        suggestions.push("Review security logs");
        break;

      case "help_support":
        suggestions.push("Show automation tutorials");
        suggestions.push("Explain analytics features");
        suggestions.push("Guide through workflow creation");
        break;

      case "troubleshoot":
        suggestions.push("Run error diagnostics");
        suggestions.push("Check system logs");
        suggestions.push("Verify configuration settings");
        break;
    }

    return suggestions;
  }

  private generateGeneralSuggestions(entities: Record<string, any>): string[] {
    const suggestions: string[] = [];

    suggestions.push("Create a new automation rule");
    suggestions.push("Generate performance report");
    suggestions.push("Check system health");
    suggestions.push("Browse workflow templates");

    return suggestions;
  }

  private addContextualInfo(
    content: string,
    entities: Record<string, any>,
  ): string {
    let contextualContent = content;

    // Add system context
    if (this.context.systemState) {
      contextualContent += `\n\n**System Context:**\n`;
      contextualContent += `- Uptime: ${Math.floor((Date.now() - this.context.systemState.uptime) / 3600000)} hours\n`;
      contextualContent += `- Active Users: ${this.context.systemState.activeUsers}\n`;
      contextualContent += `- System Load: ${(this.context.systemState.systemLoad * 100).toFixed(1)}%\n`;
    }

    // Add recent actions context
    if (this.context.recentActions.length > 0) {
      contextualContent += `\n\n**Recent Actions:**\n`;
      this.context.recentActions.slice(-3).forEach((action) => {
        contextualContent += `- ${action}\n`;
      });
    }

    return contextualContent;
  }

  private learnFromInteraction(
    userMessage: AIAssistantMessage,
    response: AIAssistantMessage,
  ): void {
    // Store learning data
    this.learningData.push({
      timestamp: Date.now(),
      userInput: userMessage.content,
      assistantResponse: response.content,
      intent: response.metadata?.intent,
      confidence: response.metadata?.confidence,
      userSatisfaction: null, // Would be collected from user feedback
    });

    // Update intent patterns based on success
    if (response.metadata?.confidence && response.metadata.confidence > 0.8) {
      this.updateIntentPatterns(userMessage.content, response.metadata.intent);
    }
  }

  private updateIntentPatterns(userInput: string, intentName: string): void {
    const intent = this.intents.get(intentName);
    if (!intent) return;

    // Extract potential new patterns from successful interactions
    const words = userInput.toLowerCase().split(" ");
    const existingPatterns = intent.patterns.flatMap((p) => p.split(" "));

    words.forEach((word) => {
      if (word.length > 3 && !existingPatterns.includes(word)) {
        // Consider adding as a new pattern
        // In production, this would require more sophisticated analysis
      }
    });
  }

  async generateProactiveSuggestions(): Promise<AIAssistantMessage[]> {
    const suggestions: AIAssistantMessage[] = [];

    // Analyze system state for proactive suggestions
    if (this.context.systemState.systemLoad > 0.8) {
      suggestions.push({
        id: Math.random().toString(36),
        type: "assistant",
        content:
          "I notice the system load is high. Would you like me to optimize performance or scale resources?",
        timestamp: Date.now(),
        metadata: {
          intent: "system_optimization",
          confidence: 0.9,
          actions: [
            {
              id: "optimize-performance",
              type: "automation",
              label: "Optimize Performance",
              description: "Run performance optimization routines",
              execute: async () => ({ success: true, improvements: [] }),
            },
          ],
        },
      });
    }

    // Analyze recent patterns
    const recentErrors = this.learningData.filter(
      (d) =>
        d.userInput.includes("error") && Date.now() - d.timestamp < 3600000, // Last hour
    );

    if (recentErrors.length > 2) {
      suggestions.push({
        id: Math.random().toString(36),
        type: "assistant",
        content:
          "I've noticed several error-related queries recently. Would you like me to run a comprehensive system diagnostic?",
        timestamp: Date.now(),
        metadata: {
          intent: "proactive_diagnostics",
          confidence: 0.85,
          actions: [
            {
              id: "run-diagnostics",
              type: "analysis",
              label: "Run Diagnostics",
              description: "Run comprehensive system diagnostics",
              execute: async () => ({ success: true, issues: [] }),
            },
          ],
        },
      });
    }

    return suggestions;
  }

  updateContext(updates: Partial<AIContext>): void {
    this.context = { ...this.context, ...updates };
  }

  getConversationHistory(): AIAssistantMessage[] {
    return this.conversationHistory;
  }

  clearConversation(): void {
    this.conversationHistory = [];
  }

  getModelStatus(): AIModel[] {
    return Array.from(this.models.values());
  }

  getLearningInsights(): any {
    return {
      totalInteractions: this.learningData.length,
      averageConfidence:
        this.learningData.reduce((sum, d) => sum + (d.confidence || 0), 0) /
        this.learningData.length,
      topIntents: this.getTopIntents(),
      improvementAreas: this.getImprovementAreas(),
    };
  }

  private getTopIntents(): string[] {
    const intentCounts: Record<string, number> = {};

    this.learningData.forEach((data) => {
      if (data.intent) {
        intentCounts[data.intent] = (intentCounts[data.intent] || 0) + 1;
      }
    });

    return Object.entries(intentCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([intent]) => intent);
  }

  private getImprovementAreas(): string[] {
    const lowConfidenceInteractions = this.learningData.filter(
      (d) => (d.confidence || 0) < 0.7,
    );

    // Analyze patterns in low confidence interactions
    return ["intent_recognition", "entity_extraction", "response_generation"];
  }
}

// Main AI Assistant Component
export const AIPoweredAssistant: React.FC<{
  onAction?: (action: AIAction) => void;
  className?: string;
}> = ({ onAction, className = "" }) => {
  const { createRule, executeRule, getStatistics } = useAutomation();
  const { generateReport, createDashboard } = useAnalytics();

  const [messages, setMessages] = useState<AIAssistantMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const assistantRef = useRef<AIAssistantEngine>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize assistant
  useEffect(() => {
    assistantRef.current = new AIAssistantEngine();

    // Add welcome message
    const welcomeMessage: AIAssistantMessage = {
      id: Math.random().toString(36),
      type: "assistant",
      content: `Hello! I'm your AI assistant. I can help you with:\n\n• Creating automation rules\n• Generating reports and dashboards\n• Monitoring system health\n• Troubleshooting issues\n• Optimizing workflows\n\nWhat would you like to accomplish today?`,
      timestamp: Date.now(),
      metadata: {
        actions: [
          {
            id: "create-automation",
            type: "automation",
            label: "Create Automation",
            description: "Create a new automation rule",
            execute: async () => {
              const rule = await createRule({
                name: "New Automation",
                description: "Created with AI Assistant",
                category: "custom",
                trigger: { type: "manual", config: {} },
                conditions: [],
                actions: [],
                enabled: true,
                priority: "medium",
              });
              return { success: true, rule };
            },
          },
          {
            id: "generate-report",
            type: "report",
            label: "Generate Report",
            description: "Generate an analytics report",
            execute: async () => {
              const report = await generateReport("summary");
              return { success: true, report };
            },
          },
          {
            id: "system-status",
            type: "analysis",
            label: "System Status",
            description: "Check system health and performance",
            execute: async () => {
              const stats = getStatistics();
              return { success: true, stats };
            },
          },
        ],
        suggestions: [
          "Show me how to create an automation",
          "Generate a performance report",
          "Check system health",
          "Help with workflow optimization",
        ],
      },
    };

    setMessages([welcomeMessage]);

    // Set up proactive suggestions
    const proactiveInterval = setInterval(async () => {
      if (assistantRef.current && !isMinimized) {
        const suggestions =
          await assistantRef.current.generateProactiveSuggestions();
        if (suggestions.length > 0) {
          setMessages((prev) => [...prev, ...suggestions]);
        }
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(proactiveInterval);
  }, [createRule, generateReport, getStatistics, isMinimized]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || !assistantRef.current) return;

    const userMessage: AIAssistantMessage = {
      id: Math.random().toString(36),
      type: "user",
      content: inputValue,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await assistantRef.current.processMessage(inputValue);

      // Execute actions if they have specific handlers
      if (response.metadata?.actions) {
        response.metadata.actions = response.metadata.actions.map((action) => ({
          ...action,
          execute: async () => {
            let result;
            switch (action.type) {
              case "automation":
                result = await createRule({
                  name: "AI Generated Rule",
                  description: "Created by AI Assistant",
                  category: "custom",
                  trigger: { type: "manual", config: {} },
                  conditions: [],
                  actions: [],
                  enabled: true,
                  priority: "medium",
                });
                break;
              case "report":
                result = await generateReport("summary");
                break;
              case "analysis":
                result = { success: true, data: getStatistics() };
                break;
              default:
                result = { success: true, message: "Action completed" };
            }
            return result;
          },
        }));
      }

      setMessages((prev) => [...prev, response]);
    } catch (error) {
      const errorMessage: AIAssistantMessage = {
        id: Math.random().toString(36),
        type: "assistant",
        content:
          "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, createRule, generateReport, getStatistics]);

  const handleActionClick = useCallback(
    async (action: AIAction) => {
      try {
        const result = await action.execute();

        const actionMessage: AIAssistantMessage = {
          id: Math.random().toString(36),
          type: "action",
          content: `✅ ${action.label} completed successfully`,
          timestamp: Date.now(),
          metadata: {
            actions: [action],
            context: { result },
          },
        };

        setMessages((prev) => [...prev, actionMessage]);
        onAction?.(action);
      } catch (error) {
        const errorMessage: AIAssistantMessage = {
          id: Math.random().toString(36),
          type: "assistant",
          content: `❌ Failed to execute ${action.label}. Please try again.`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    },
    [onAction],
  );

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  }, []);

  const renderMessage = (message: AIAssistantMessage) => {
    const isUser = message.type === "user";
    const isAction = message.type === "action";

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
      >
        <div
          className={`max-w-[80%] rounded-lg p-3 ${
            isUser
              ? "bg-blue-500 text-white"
              : isAction
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
          }`}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>

          {message.metadata?.actions && message.metadata.actions.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.metadata.actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleActionClick(action)}
                  className="w-full text-left px-3 py-2 bg-white rounded border hover:bg-gray-50 text-sm"
                >
                  <div className="font-medium">{action.label}</div>
                  <div className="text-xs text-gray-600">
                    {action.description}
                  </div>
                </button>
              ))}
            </div>
          )}

          {message.metadata?.suggestions &&
            message.metadata.suggestions.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-medium mb-2">Suggestions:</div>
                <div className="flex flex-wrap gap-1">
                  {message.metadata.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

          <div className="text-xs mt-2 opacity-70">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  if (isMinimized) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-blue-500 text-white rounded-full p-3 shadow-lg hover:bg-blue-600"
        >
          💬
        </button>
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-50 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
          <span className="font-medium">AI Assistant</span>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="text-gray-400 hover:text-gray-600"
        >
          −
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(renderMessage)}
        {isTyping && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {showSuggestions && messages.length === 1 && (
        <div className="border-t border-gray-200 p-3">
          <div className="text-xs font-medium text-gray-600 mb-2">
            Quick Actions:
          </div>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => handleSuggestionClick("Create automation rule")}
              className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
            >
              Create Automation
            </button>
            <button
              onClick={() =>
                handleSuggestionClick("Generate performance report")
              }
              className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100"
            >
              Generate Report
            </button>
            <button
              onClick={() => handleSuggestionClick("Check system health")}
              className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100"
            >
              System Status
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <label htmlFor="input-hwtlc4ttg" className="sr-only">
            Text
          </label>
          <input
            id="input-hwtlc4ttg"
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask me anything..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIPoweredAssistant;
