declare global {
  interface Window {
    [key: string]: any;
  }
}

import React, { useState } from "react";
/**
 * AI Data Insights Engine
 * Predictive KPIs, cash-flow forecasting, expense anomaly detection, intelligent auto-categorization
 */

export interface DataInsight {
  id: string;
  type:
    | "kpi_prediction"
    | "cashflow_forecast"
    | "anomaly_detection"
    | "categorization"
    | "recommendation";
  title: string;
  description: string;
  confidence: number; // 0-1
  impact: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  data: any;
  actionable: boolean;
  actions?: InsightAction[];
}

export interface InsightAction {
  id: string;
  label: string;
  description: string;
  type: "navigate" | "create" | "update" | "export" | "approve" | "reject";
  target: string;
  implementation: () => void | Promise<void>;
}

export interface KPIPrediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  predictionPeriod: "week" | "month" | "quarter" | "year";
  confidence: number;
  trend: "increasing" | "decreasing" | "stable";
  factors: string[];
  accuracy: number; // Historical accuracy
}

export interface CashflowForecast {
  period: "daily" | "weekly" | "monthly" | "quarterly";
  inflow: number;
  outflow: number;
  netCashflow: number;
  confidence: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  keyDrivers: {
    category: string;
    impact: number;
    confidence: number;
  }[];
  recommendations: string[];
}

export interface ExpenseAnomaly {
  id: string;
  category: string;
  amount: number;
  expectedAmount: number;
  variance: number;
  variancePercent: number;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  detectedAt: Date;
  factors: string[];
  suggestedAction: string;
}

export interface CategorizationRule {
  id: string;
  name: string;
  description: string;
  conditions: Array<{
    field: string;
    operator:
      | "equals"
      | "contains"
      | "startsWith"
      | "endsWith"
      | "greaterThan"
      | "lessThan"
      | "regex";
    value: any;
    weight: number;
  }>;
  category: string;
  confidence: number;
  autoApply: boolean;
  feedback: Array<{
    transactionId: string;
    correct: boolean;
    timestamp: Date;
  }>;
}

export class AIDataInsightsEngine {
  private static instance: AIDataInsightsEngine;
  private insights: Map<string, DataInsight> = new Map();
  private kpiPredictions: Map<string, KPIPrediction> = new Map();
  private cashflowForecasts: Map<string, CashflowForecast> = new Map();
  private expenseAnomalies: Map<string, ExpenseAnomaly> = new Map();
  private categorizationRules: Map<string, CategorizationRule> = new Map();
  private model: DataInsightsModel;
  private isAnalyzing: boolean = false;
  private analysisInterval: number | null = null;

  private constructor() {
    this.model = new DataInsightsModel();
    this.initializeAnalysis();
  }

  static getInstance(): AIDataInsightsEngine {
    if (!AIDataInsightsEngine.instance) {
      AIDataInsightsEngine.instance = new AIDataInsightsEngine();
    }
    return AIDataInsightsEngine.instance;
  }

  private initializeAnalysis(): void {
    if (typeof window === "undefined") return;

    // Start continuous analysis
    this.startContinuousAnalysis();

    // Load existing insights
    this.loadPersistedInsights();

    // Initialize categorization rules
    this.initializeCategorizationRules();
  }

  private startContinuousAnalysis(): void {
    this.isAnalyzing = true;

    // Analyze data every 60 seconds
    this.analysisInterval = window.setInterval(() => {
      this.analyzeAllData();
    }, 60000);
  }

  private initializeCategorizationRules(): void {
    // Default categorization rules
    const defaultRules: CategorizationRule[] = [
      {
        id: "software-subscriptions",
        name: "Software Subscriptions",
        description: "Identify software subscription expenses",
        conditions: [
          {
            field: "description",
            operator: "contains",
            value: "subscription",
            weight: 0.8,
          },
          {
            field: "description",
            operator: "contains",
            value: "software",
            weight: 0.7,
          },
          {
            field: "description",
            operator: "contains",
            value: "saas",
            weight: 0.9,
          },
          { field: "amount", operator: "greaterThan", value: 0, weight: 0.3 },
        ],
        category: "Software & Subscriptions",
        confidence: 0.8,
        autoApply: true,
        feedback: [],
      },
      {
        id: "office-supplies",
        name: "Office Supplies",
        description: "Identify office supply expenses",
        conditions: [
          {
            field: "description",
            operator: "contains",
            value: "office",
            weight: 0.8,
          },
          {
            field: "description",
            operator: "contains",
            value: "supplies",
            weight: 0.9,
          },
          {
            field: "description",
            operator: "contains",
            value: "stationery",
            weight: 0.7,
          },
        ],
        category: "Office Supplies",
        confidence: 0.85,
        autoApply: true,
        feedback: [],
      },
      {
        id: "travel-expenses",
        name: "Travel Expenses",
        description: "Identify travel-related expenses",
        conditions: [
          {
            field: "description",
            operator: "contains",
            value: "travel",
            weight: 0.8,
          },
          {
            field: "description",
            operator: "contains",
            value: "flight",
            weight: 0.9,
          },
          {
            field: "description",
            operator: "contains",
            value: "hotel",
            weight: 0.9,
          },
          {
            field: "description",
            operator: "contains",
            value: "taxi",
            weight: 0.7,
          },
        ],
        category: "Travel & Entertainment",
        confidence: 0.9,
        autoApply: true,
        feedback: [],
      },
    ];

    defaultRules.forEach((rule) => {
      this.categorizationRules.set(rule.id, rule);
    });
  }

  private async analyzeAllData(): Promise<void> {
    if (!this.isAnalyzing) return;

    try {
      // Analyze KPIs for predictions
      await this.analyzeKPIPredictions();

      // Analyze cashflow for forecasting
      await this.analyzeCashflowForecasting();

      // Analyze expenses for anomalies
      await this.analyzeExpenseAnomalies();

      // Generate insights from all analyses
      await this.generateInsights();
    } catch (error) {
      console.error("Error in data analysis:", error);
    }
  }

  private async analyzeKPIPredictions(): Promise<void> {
    // This would fetch actual KPI data from API
    const kpiData = await this.fetchKPIData();

    Object.keys(kpiData).forEach((metric) => {
      const data = kpiData[metric];
      const prediction = this.model.predictKPI(metric, data);

      this.kpiPredictions.set(metric, prediction);
    });
  }

  private async fetchKPIData(): Promise<Record<string, number[]>> {
    // Simulate fetching KPI data
    // In real implementation, this would fetch from API
    return {
      revenue: [10000, 12000, 11500, 13000, 14000, 13500, 15000],
      expenses: [8000, 8500, 8200, 9000, 9200, 8800, 9500],
      profit: [2000, 3500, 3300, 4000, 4800, 4700, 5500],
      customers: [100, 120, 115, 130, 140, 135, 150],
    };
  }

  private async analyzeCashflowForecasting(): Promise<void> {
    // Fetch cashflow data
    const cashflowData = await this.fetchCashflowData();

    // Generate forecasts for different periods
    const periods: Array<"daily" | "weekly" | "monthly" | "quarterly"> = [
      "daily",
      "weekly",
      "monthly",
      "quarterly",
    ];

    periods.forEach((period) => {
      const forecast = this.model.forecastCashflow(cashflowData, period);
      this.cashflowForecasts.set(period, forecast);
    });
  }

  private async fetchCashflowData(): Promise<any[]> {
    // Simulate fetching cashflow data
    return [
      { date: "2024-01-01", inflow: 5000, outflow: 3000, category: "sales" },
      { date: "2024-01-02", inflow: 2000, outflow: 1500, category: "services" },
      { date: "2024-01-03", inflow: 8000, outflow: 4000, category: "sales" },
      { date: "2024-01-04", inflow: 1000, outflow: 2000, category: "expenses" },
      { date: "2024-01-05", inflow: 3000, outflow: 2500, category: "services" },
    ];
  }

  private async analyzeExpenseAnomalies(): Promise<void> {
    // Fetch expense data
    const expenseData = await this.fetchExpenseData();

    expenseData.forEach((expense) => {
      const anomaly = this.model.detectExpenseAnomaly(expense);
      if (anomaly) {
        this.expenseAnomalies.set(anomaly.id, anomaly);
      }
    });
  }

  private async fetchExpenseData(): Promise<any[]> {
    // Simulate fetching expense data
    return [
      {
        id: "1",
        category: "Software",
        amount: 99,
        description: "Software subscription",
      },
      {
        id: "2",
        category: "Office Supplies",
        amount: 150,
        description: "Office supplies",
      },
      {
        id: "3",
        category: "Software",
        amount: 5000,
        description: "Software subscription",
      }, // Anomaly
      {
        id: "4",
        category: "Travel",
        amount: 200,
        description: "Flight ticket",
      },
      {
        id: "5",
        category: "Software",
        amount: 49,
        description: "Software subscription",
      },
    ];
  }

  private async generateInsights(): Promise<void> {
    const newInsights: DataInsight[] = [];

    // Generate insights from KPI predictions
    this.kpiPredictions.forEach((prediction, metric) => {
      if (prediction.confidence > 0.7) {
        const insight: DataInsight = {
          id: `kpi-prediction-${metric}`,
          type: "kpi_prediction",
          title: `${metric} Prediction`,
          description: `Predicted ${metric} for next ${prediction.predictionPeriod}: ${prediction.predictedValue} (${prediction.trend})`,
          confidence: prediction.confidence,
          impact: this.calculateImpact(prediction),
          timestamp: new Date(),
          data: prediction,
          actionable: true,
          actions: this.generateKPIActions(prediction),
        };

        newInsights.push(insight);
      }
    });

    // Generate insights from cashflow forecasts
    this.cashflowForecasts.forEach((forecast, period) => {
      if (forecast.riskLevel !== "low") {
        const insight: DataInsight = {
          id: `cashflow-forecast-${period}`,
          type: "cashflow_forecast",
          title: `${period} Cashflow Forecast`,
          description: `Net cashflow: ${forecast.netCashflow} (Risk: ${forecast.riskLevel})`,
          confidence: forecast.confidence,
          impact:
            forecast.riskLevel === "critical"
              ? "critical"
              : forecast.riskLevel === "high"
                ? "high"
                : "medium",
          timestamp: new Date(),
          data: forecast,
          actionable: true,
          actions: this.generateCashflowActions(forecast),
        };

        newInsights.push(insight);
      }
    });

    // Generate insights from expense anomalies
    this.expenseAnomalies.forEach((anomaly) => {
      const insight: DataInsight = {
        id: `expense-anomaly-${anomaly.id}`,
        type: "anomaly_detection",
        title: `Expense Anomaly Detected`,
        description: anomaly.description,
        confidence: 0.8,
        impact: anomaly.severity,
        timestamp: anomaly.detectedAt,
        data: anomaly,
        actionable: true,
        actions: this.generateAnomalyActions(anomaly),
      };

      newInsights.push(insight);
    });

    // Add new insights
    newInsights.forEach((insight) => {
      this.insights.set(insight.id, insight);
    });
  }

  private calculateImpact(
    prediction: KPIPrediction,
  ): "low" | "medium" | "high" | "critical" {
    const variance =
      Math.abs(prediction.predictedValue - prediction.currentValue) /
      prediction.currentValue;

    if (variance > 0.3) return "critical";
    if (variance > 0.2) return "high";
    if (variance > 0.1) return "medium";
    return "low";
  }

  private generateKPIActions(prediction: KPIPrediction): InsightAction[] {
    const actions: InsightAction[] = [];

    if (prediction.trend === "decreasing") {
      actions.push({
        id: `investigate-${prediction.metric}`,
        label: "Investigate Decline",
        description: `Analyze factors causing ${prediction.metric} decline`,
        type: "navigate",
        target: `/analytics/${prediction.metric}`,
        implementation: () =>
          this.navigateTo(`/analytics/${prediction.metric}`),
      });
    }

    if (prediction.trend === "increasing") {
      actions.push({
        id: `capitalize-${prediction.metric}`,
        label: "Capitalize on Growth",
        description: `Strategies to maintain ${prediction.metric} growth`,
        type: "navigate",
        target: `/strategy/${prediction.metric}`,
        implementation: () => this.navigateTo(`/strategy/${prediction.metric}`),
      });
    }

    return actions;
  }

  private generateCashflowActions(forecast: CashflowForecast): InsightAction[] {
    const actions: InsightAction[] = [];

    if (forecast.netCashflow < 0) {
      actions.push({
        id: "improve-cashflow",
        label: "Improve Cashflow",
        description: "Review expenses and accelerate collections",
        type: "navigate",
        target: "/cashflow/management",
        implementation: () => this.navigateTo("/cashflow/management"),
      });
    }

    actions.push({
      id: "view-cashflow-details",
      label: "View Cashflow Details",
      description: "Detailed cashflow analysis and drivers",
      type: "navigate",
      target: "/cashflow/details",
      implementation: () => this.navigateTo("/cashflow/details"),
    });

    return actions;
  }

  private generateAnomalyActions(anomaly: ExpenseAnomaly): InsightAction[] {
    const actions: InsightAction[] = [];

    actions.push({
      id: `review-anomaly-${anomaly.id}`,
      label: "Review Anomaly",
      description: "Investigate this expense anomaly",
      type: "navigate",
      target: `/expenses/${anomaly.id}`,
      implementation: () => this.navigateTo(`/expenses/${anomaly.id}`),
    });

    if (anomaly.severity === "critical" || anomaly.severity === "high") {
      actions.push({
        id: `flag-anomaly-${anomaly.id}`,
        label: "Flag for Review",
        description: "Flag this expense for management review",
        type: "update",
        target: `/expenses/${anomaly.id}/flag`,
        implementation: async () => await this.flagExpense(anomaly.id),
      });
    }

    return actions;
  }

  private navigateTo(path: string): void {
    // Navigation implementation
    window.location.href = path;
  }

  private async flagExpense(expenseId: string): Promise<void> {
    // Flag expense for review
    console.log(`Flagging expense ${expenseId} for review`);
  }

  // Categorization methods
  public categorizeTransaction(transaction: any): {
    category: string;
    confidence: number;
  } {
    let bestMatch: { category: string; confidence: number } = {
      category: "Uncategorized",
      confidence: 0,
    };

    this.categorizationRules.forEach((rule) => {
      const match = this.evaluateCategorizationRule(rule, transaction);
      if (match.confidence > bestMatch.confidence) {
        bestMatch = match;
      }
    });

    return bestMatch;
  }

  private evaluateCategorizationRule(
    rule: CategorizationRule,
    transaction: any,
  ): { category: string; confidence: number } {
    let totalScore = 0;
    let totalWeight = 0;

    rule.conditions.forEach((condition) => {
      const fieldValue = transaction[condition.field];
      let matches = false;

      switch (condition.operator) {
        case "equals":
          matches = fieldValue === condition.value;
          break;
        case "contains":
          matches =
            fieldValue &&
            fieldValue
              .toString()
              .toLowerCase()
              .includes(condition.value.toString().toLowerCase());
          break;
        case "startsWith":
          matches =
            fieldValue &&
            fieldValue
              .toString()
              .toLowerCase()
              .startsWith(condition.value.toString().toLowerCase());
          break;
        case "endsWith":
          matches =
            fieldValue &&
            fieldValue
              .toString()
              .toLowerCase()
              .endsWith(condition.value.toString().toLowerCase());
          break;
        case "greaterThan":
          matches = fieldValue > condition.value;
          break;
        case "lessThan":
          matches = fieldValue < condition.value;
          break;
        case "regex":
          matches =
            fieldValue &&
            new RegExp(condition.value).test(fieldValue.toString());
          break;
      }

      if (matches) {
        totalScore += condition.weight;
      }
      totalWeight += condition.weight;
    });

    const confidence = totalWeight > 0 ? totalScore / totalWeight : 0;

    return {
      category: rule.category,
      confidence: confidence * rule.confidence,
    };
  }

  public provideCategorizationFeedback(
    transactionId: string,
    ruleId: string,
    correct: boolean,
  ): void {
    const rule = this.categorizationRules.get(ruleId);
    if (rule) {
      rule.feedback.push({
        transactionId,
        correct,
        timestamp: new Date(),
      });

      // Update rule confidence based on feedback
      const recentFeedback = rule.feedback.slice(-20); // Last 20 feedbacks
      const correctCount = recentFeedback.filter((f) => f.correct).length;
      const accuracy = correctCount / recentFeedback.length;

      rule.confidence = Math.max(0.1, accuracy); // Minimum confidence of 0.1
    }
  }

  private loadPersistedInsights(): void {
    try {
      const stored = localStorage.getItem("ai-insights");
      if (stored) {
        const insights = JSON.parse(stored);
        insights.forEach((insight: DataInsight) => {
          this.insights.set(insight.id, insight);
        });
      }
    } catch (error) {
      console.warn("Failed to load persisted insights:", error);
    }
  }

  // Public API methods
  getInsights(): DataInsight[] {
    return Array.from(this.insights.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }

  getInsightsByType(type: DataInsight["type"]): DataInsight[] {
    return this.getInsights().filter((insight) => insight.type === type);
  }

  getInsightsByImpact(impact: DataInsight["impact"]): DataInsight[] {
    return this.getInsights().filter((insight) => insight.impact === impact);
  }

  getKPIPredictions(): KPIPrediction[] {
    return Array.from(this.kpiPredictions.values());
  }

  getCashflowForecasts(): CashflowForecast[] {
    return Array.from(this.cashflowForecasts.values());
  }

  getExpenseAnomalies(): ExpenseAnomaly[] {
    return Array.from(this.expenseAnomalies.values()).sort(
      (a, b) => b.detectedAt.getTime() - a.detectedAt.getTime(),
    );
  }

  getCategorizationRules(): CategorizationRule[] {
    return Array.from(this.categorizationRules.values());
  }

  addCategorizationRule(rule: CategorizationRule): void {
    this.categorizationRules.set(rule.id, rule);
  }

  updateCategorizationRule(
    ruleId: string,
    updates: Partial<CategorizationRule>,
  ): void {
    const rule = this.categorizationRules.get(ruleId);
    if (rule) {
      Object.assign(rule, updates);
    }
  }

  deleteCategorizationRule(ruleId: string): void {
    this.categorizationRules.delete(ruleId);
  }

  executeInsightAction(insightId: string, actionId: string): void {
    const insight = this.insights.get(insightId);
    if (insight && insight.actions) {
      const action = insight.actions.find((a) => a.id === actionId);
      if (action) {
        action.implementation();
      }
    }
  }

  stopAnalysis(): void {
    this.isAnalyzing = false;
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }

  startAnalysis(): void {
    if (!this.isAnalyzing) {
      this.isAnalyzing = true;
      this.startContinuousAnalysis();
    }
  }

  exportInsights(): string {
    return JSON.stringify(
      {
        insights: Array.from(this.insights.values()),
        kpiPredictions: Array.from(this.kpiPredictions.values()),
        cashflowForecasts: Array.from(this.cashflowForecasts.values()),
        expenseAnomalies: Array.from(this.expenseAnomalies.values()),
        categorizationRules: Array.from(this.categorizationRules.values()),
      },
      null,
      2,
    );
  }

  importInsights(data: string): void {
    try {
      const imported = JSON.parse(data);

      if (imported.insights) {
        imported.insights.forEach((insight: DataInsight) => {
          this.insights.set(insight.id, insight);
        });
      }

      if (imported.categorizationRules) {
        imported.categorizationRules.forEach((rule: CategorizationRule) => {
          this.categorizationRules.set(rule.id, rule);
        });
      }
    } catch (error) {
      console.error("Failed to import insights:", error);
    }
  }
}

// Data Insights Model (simplified ML model)
class DataInsightsModel {
  // KPI Prediction using time series analysis
  predictKPI(metric: string, data: number[]): KPIPrediction {
    const currentValue = data[data.length - 1];
    const prediction = this.simpleTimeSeriesPrediction(data);
    const trend = this.calculateTrend(data);

    return {
      metric,
      currentValue,
      predictedValue: prediction,
      predictionPeriod: "month",
      confidence: 0.75,
      trend,
      factors: this.identifyFactors(metric, data),
      accuracy: 0.8, // Would be calculated from historical predictions
    };
  }

  private simpleTimeSeriesPrediction(data: number[]): number {
    if (data.length < 2) return data[0] || 0;

    // Simple moving average with trend
    const recent = data.slice(-3);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const trend = this.calculateTrend(data);
    const trendFactor =
      trend === "increasing" ? 1.05 : trend === "decreasing" ? 0.95 : 1;

    return avg * trendFactor;
  }

  private calculateTrend(
    data: number[],
  ): "increasing" | "decreasing" | "stable" {
    if (data.length < 2) return "stable";

    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = (secondAvg - firstAvg) / firstAvg;

    if (change > 0.05) return "increasing";
    if (change < -0.05) return "decreasing";
    return "stable";
  }

  private identifyFactors(metric: string, data: number[]): string[] {
    // Simplified factor identification
    const factors: string[] = [];

    if (metric.includes("revenue")) {
      factors.push(
        "Seasonal trends",
        "Customer acquisition",
        "Pricing changes",
      );
    } else if (metric.includes("expense")) {
      factors.push("Inflation", "Operational efficiency", "Vendor costs");
    } else if (metric.includes("profit")) {
      factors.push("Revenue growth", "Cost optimization", "Market conditions");
    }

    return factors;
  }

  // Cashflow Forecasting
  forecastCashflow(
    data: any[],
    period: "daily" | "weekly" | "monthly" | "quarterly",
  ): CashflowForecast {
    const recentData = data.slice(-10); // Last 10 periods
    const avgInflow =
      recentData.reduce((sum, d) => sum + d.inflow, 0) / recentData.length;
    const avgOutflow =
      recentData.reduce((sum, d) => sum + d.outflow, 0) / recentData.length;
    const netCashflow = avgInflow - avgOutflow;

    const riskLevel = this.calculateCashflowRisk(netCashflow, avgOutflow);
    const keyDrivers = this.identifyCashflowDrivers(recentData);

    return {
      period,
      inflow: avgInflow,
      outflow: avgOutflow,
      netCashflow,
      confidence: 0.7,
      riskLevel,
      keyDrivers,
      recommendations: this.generateCashflowRecommendations(
        riskLevel,
        keyDrivers,
      ),
    };
  }

  private calculateCashflowRisk(
    netCashflow: number,
    outflow: number,
  ): "low" | "medium" | "high" | "critical" {
    const ratio = netCashflow / outflow;

    if (ratio < -0.2) return "critical";
    if (ratio < -0.1) return "high";
    if (ratio < 0) return "medium";
    return "low";
  }

  private identifyCashflowDrivers(
    data: any[],
  ): Array<{ category: string; impact: number; confidence: number }> {
    // Analyze which categories have the most impact on cashflow
    const categoryImpact = new Map<string, number>();

    data.forEach((d) => {
      const current = categoryImpact.get(d.category) || 0;
      categoryImpact.set(d.category, current + Math.abs(d.inflow - d.outflow));
    });

    const totalImpact = Array.from(categoryImpact.values()).reduce(
      (a, b) => a + b,
      0,
    );

    return Array.from(categoryImpact.entries())
      .map(([category, impact]) => ({
        category,
        impact: impact / totalImpact,
        confidence: 0.7,
      }))
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 3);
  }

  private generateCashflowRecommendations(
    riskLevel: string,
    drivers: Array<{ category: string; impact: number }>,
  ): string[] {
    const recommendations: string[] = [];

    if (riskLevel === "critical" || riskLevel === "high") {
      recommendations.push("Review and reduce non-essential expenses");
      recommendations.push("Accelerate accounts receivable collection");
      recommendations.push("Consider short-term financing options");
    }

    drivers.forEach((driver) => {
      if (driver.category === "expenses" && driver.impact > 0.3) {
        recommendations.push("Optimize expense categories with highest impact");
      }
      if (driver.category === "sales" && driver.impact > 0.3) {
        recommendations.push("Focus on high-impact revenue streams");
      }
    });

    return recommendations;
  }

  // Expense Anomaly Detection
  detectExpenseAnomaly(expense: any): ExpenseAnomaly | null {
    // Simple anomaly detection based on amount variance
    const expectedAmount = this.calculateExpectedAmount(expense.category);
    const variance = Math.abs(expense.amount - expectedAmount);
    const variancePercent = variance / expectedAmount;

    if (variancePercent > 0.5) {
      // 50% variance threshold
      const severity = this.calculateAnomalySeverity(variancePercent);

      return {
        id: expense.id,
        category: expense.category,
        amount: expense.amount,
        expectedAmount,
        variance,
        variancePercent,
        severity,
        description: `Expense of $${expense.amount} is ${Math.round(variancePercent * 100)}% higher than expected for ${expense.category}`,
        detectedAt: new Date(),
        factors: this.identifyAnomalyFactors(expense),
        suggestedAction: this.generateAnomalySuggestion(
          severity,
          variancePercent,
        ),
      };
    }

    return null;
  }

  private calculateExpectedAmount(category: string): number {
    // Simplified expected amount calculation
    const categoryAverages: Record<string, number> = {
      Software: 100,
      "Office Supplies": 200,
      Travel: 500,
      Utilities: 300,
      Marketing: 1000,
    };

    return categoryAverages[category] || 250;
  }

  private calculateAnomalySeverity(
    variancePercent: number,
  ): "low" | "medium" | "high" | "critical" {
    if (variancePercent > 2) return "critical";
    if (variancePercent > 1) return "high";
    if (variancePercent > 0.5) return "medium";
    return "low";
  }

  private identifyAnomalyFactors(expense: any): string[] {
    const factors: string[] = [];

    if (expense.amount > 1000) {
      factors.push("High amount");
    }

    if (expense.description && expense.description.length > 50) {
      factors.push("Complex description");
    }

    if (new Date(expense.date).getDay() === 0) {
      // Sunday
      factors.push("Weekend expense");
    }

    return factors;
  }

  private generateAnomalySuggestion(
    severity: string,
    variancePercent: number,
  ): string {
    switch (severity) {
      case "critical":
        return "Immediate review required - contact finance department";
      case "high":
        return "Schedule expense review and provide justification";
      case "medium":
        return "Verify expense details and categorization";
      case "low":
        return "Monitor for similar patterns";
      default:
        return "No action required";
    }
  }
}

// React hook
export function useAIDataInsights() {
  const engine = AIDataInsightsEngine.getInstance();
  const [insights, setInsights] = React.useState(engine.getInsights());
  const [kpiPredictions, setKPIPredictions] = React.useState(
    engine.getKPIPredictions(),
  );
  const [cashflowForecasts, setCashflowForecasts] = React.useState(
    engine.getCashflowForecasts(),
  );
  const [expenseAnomalies, setExpenseAnomalies] = React.useState(
    engine.getExpenseAnomalies(),
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      setInsights(engine.getInsights());
      setKPIPredictions(engine.getKPIPredictions());
      setCashflowForecasts(engine.getCashflowForecasts());
      setExpenseAnomalies(engine.getExpenseAnomalies());
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    engine,
    insights,
    kpiPredictions,
    cashflowForecasts,
    expenseAnomalies,
    getInsightsByType: engine.getInsightsByType.bind(engine),
    getInsightsByImpact: engine.getInsightsByImpact.bind(engine),
    categorizeTransaction: engine.categorizeTransaction.bind(engine),
    provideCategorizationFeedback:
      engine.provideCategorizationFeedback.bind(engine),
    executeInsightAction: engine.executeInsightAction.bind(engine),
  };
}

export default AIDataInsightsEngine;
