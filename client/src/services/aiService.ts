/**
 * AI Service
 * Handles all API calls to AI endpoints
 */

const API_BASE = "/api";

interface CategorizeRequest {
  description: string;
  amount: number;
  type: "income" | "expense";
  vendor?: string;
}

interface CategorizeResponse {
  success: boolean;
  data: {
    category: string;
    confidence: number;
    alternativeCategories: { category: string; confidence: number }[];
  };
}

interface BatchCategorizeRequest {
  transactions: Array<{
    id: string;
    description: string;
    amount: number;
    type: "income" | "expense";
    vendor?: string;
  }>;
}

interface BatchCategorizeResponse {
  success: boolean;
  data: {
    results: Array<{
      transactionId: string;
      category: string;
      confidence: number;
    }>;
    summary: {
      total: number;
      categorized: number;
      averageConfidence: number;
    };
  };
}

interface CopilotQueryRequest {
  query: string;
  context?: {
    dateRange?: { start: string; end: string };
    entityId?: string;
  };
}

interface CopilotResponse {
  success: boolean;
  data: {
    query: string;
    queryType: string;
    answer: string;
    insights: string[];
    recommendations: string[];
    dataPoints: Array<{
      label: string;
      value: number;
      change?: number;
      trend?: "up" | "down" | "stable";
    }>;
    confidence: number;
    processingTime: number;
  };
}

interface ForecastResponse {
  success: boolean;
  data: {
    currentCashPosition: number;
    projectedCashPosition: number;
    daysForecasted: number;
    dailyForecasts: Array<{
      date: string;
      projectedBalance: number;
      expectedIncome: number;
      expectedExpenses: number;
      confidence: number;
    }>;
    riskAssessment: {
      overallRisk: "low" | "medium" | "high" | "critical";
      cashRunwayDays: number;
      shortfallProbability: number;
      recommendations: string[];
    };
    insights: string[];
  };
}

interface AnomalyResponse {
  success: boolean;
  data: {
    anomalies: Array<{
      id: string;
      type: string;
      severity: string;
      confidence: number;
      transactionId: string;
      description: string;
      amount: number;
      date: string;
      vendor: string;
      category: string;
      metadata: Record<string, any>;
      suggestedAction: string;
      status: string;
    }>;
    summary: {
      totalAnomalies: number;
      byType: Record<string, number>;
      bySeverity: Record<string, number>;
      pendingCount: number;
      resolvedCount: number;
    };
  };
}

class AIService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  }

  async categorizeTransaction(
    request: CategorizeRequest,
  ): Promise<CategorizeResponse> {
    const response = await fetch(`${API_BASE}/ai/categorize`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error("Failed to categorize transaction");
    }

    return response.json();
  }

  async batchCategorize(
    request: BatchCategorizeRequest,
  ): Promise<BatchCategorizeResponse> {
    const response = await fetch(`${API_BASE}/ai/categorize/batch`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error("Failed to batch categorize transactions");
    }

    return response.json();
  }

  async submitFeedback(
    transactionId: string,
    originalCategory: string,
    correctedCategory: string,
  ): Promise<void> {
    const response = await fetch(`${API_BASE}/ai/categorize/feedback`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        transactionId,
        originalCategory,
        correctedCategory,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to submit feedback");
    }
  }

  async getAccuracyMetrics(): Promise<{
    accuracy: number;
    totalCategorized: number;
  }> {
    const response = await fetch(`${API_BASE}/ai/categorize/accuracy`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to get accuracy metrics");
    }

    const data = await response.json();
    return data.data;
  }

  async askCopilot(request: CopilotQueryRequest): Promise<CopilotResponse> {
    const response = await fetch(`${API_BASE}/ai/copilot/ask`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error("Failed to query AI Copilot");
    }

    return response.json();
  }

  async getQuickInsights(): Promise<{ insights: string[] }> {
    const response = await fetch(`${API_BASE}/ai/copilot/quick-insights`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to get quick insights");
    }

    const data = await response.json();
    return data.data;
  }

  async getCashFlowForecast(days: number = 30): Promise<ForecastResponse> {
    const response = await fetch(`${API_BASE}/ai/forecast?days=${days}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to get cash flow forecast");
    }

    return response.json();
  }

  async getAnomalies(): Promise<AnomalyResponse> {
    const response = await fetch(`${API_BASE}/ai/anomalies`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to get anomalies");
    }

    return response.json();
  }

  async resolveAnomaly(
    anomalyId: string,
    resolution: string,
    notes?: string,
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE}/ai/anomalies/${anomalyId}/resolve`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ resolution, notes }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to resolve anomaly");
    }
  }

  async getUsageStats(): Promise<{
    categorizations: number;
    copilotQueries: number;
    forecasts: number;
    anomalyScans: number;
  }> {
    const response = await fetch(`${API_BASE}/ai/usage`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to get usage stats");
    }

    const data = await response.json();
    return data.data;
  }
}

export const aiService = new AIService();
export default aiService;
