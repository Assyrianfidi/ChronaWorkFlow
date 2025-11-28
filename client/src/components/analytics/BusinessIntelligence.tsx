import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAnalytics } from './AnalyticsEngine';
import { BusinessInsight } from './AnalyticsEngine';

// BI Types
interface KPI {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
  category: 'financial' | 'operational' | 'customer' | 'strategic';
}

interface BusinessGoal {
  id: string;
  name: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: number;
  progress: number;
  status: 'on-track' | 'at-risk' | 'behind' | 'achieved';
  owner: string;
  kpis: string[];
}

interface PerformanceScore {
  category: string;
  score: number;
  maxScore: number;
  trend: 'improving' | 'declining' | 'stable';
  factors: {
    name: string;
    weight: number;
    score: number;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
}

interface ForecastModel {
  id: string;
  name: string;
  type: 'revenue' | 'growth' | 'demand' | 'risk';
  methodology: 'linear' | 'exponential' | 'seasonal' | 'ml';
  accuracy: number;
  confidence: number;
  dataPoints: {
    period: string;
    actual?: number;
    predicted: number;
    confidenceInterval: [number, number];
  }[];
}

interface Benchmark {
  id: string;
  name: string;
  category: string;
  industry: string;
  metrics: {
    name: string;
    value: number;
    unit: string;
    percentile: number;
  }[];
  lastUpdated: number;
}

// BI Context
interface BIContextType {
  // KPIs
  kpis: KPI[];
  updateKPI: (id: string, value: number) => void;
  createKPI: (kpi: Omit<KPI, 'id'>) => void;
  
  // Goals
  goals: BusinessGoal[];
  updateGoalProgress: (id: string, value: number) => void;
  createGoal: (goal: Omit<BusinessGoal, 'id' | 'progress' | 'status'>) => void;
  
  // Performance
  performanceScores: PerformanceScore[];
  calculatePerformanceScores: () => void;
  
  // Forecasting
  forecasts: ForecastModel[];
  generateForecast: (type: string, periods: number) => Promise<ForecastModel>;
  
  // Benchmarking
  benchmarks: Benchmark[];
  loadBenchmarks: (industry: string) => Promise<void>;
  
  // Insights
  strategicInsights: BusinessInsight[];
  generateStrategicInsights: () => Promise<void>;
}

const BIContext = React.createContext<BIContextType | null>(null);

// Business Intelligence Engine
class BIEngine {
  private models: Map<string, any> = new Map();
  private algorithms: Map<string, Function> = new Map();

  constructor() {
    this.initializeModels();
    this.initializeAlgorithms();
  }

  private initializeModels(): void {
    // Initialize prediction models
    this.models.set('linear_regression', this.linearRegression.bind(this));
    this.models.set('exponential_smoothing', this.exponentialSmoothing.bind(this));
    this.models.set('seasonal_decomposition', this.seasonalDecomposition.bind(this));
  }

  private initializeAlgorithms(): void {
    // Initialize analysis algorithms
    this.algorithms.set('trend_analysis', this.analyzeTrend.bind(this));
    this.algorithms.set('anomaly_detection', this.detectAnomalies.bind(this));
    this.algorithms.set('correlation_analysis', this.analyzeCorrelation.bind(this));
    this.algorithms.set('clustering', this.performClustering.bind(this));
  }

  // Prediction Models
  linearRegression(data: number[]): { slope: number; intercept: number; r2: number } {
    const n = data.length;
    const sumX = data.reduce((sum, _, i) => sum + i, 0);
    const sumY = data.reduce((sum, val) => sum + val, 0);
    const sumXY = data.reduce((sum, val, i) => sum + i * val, 0);
    const sumX2 = data.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R²
    const yMean = sumY / n;
    const ssTotal = data.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const ssResidual = data.reduce((sum, val, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);
    const r2 = 1 - (ssResidual / ssTotal);

    return { slope, intercept, r2 };
  }

  exponentialSmoothing(data: number[], alpha: number = 0.3): number[] {
    const smoothed: number[] = [data[0]];
    
    for (let i = 1; i < data.length; i++) {
      const smoothedValue = alpha * data[i] + (1 - alpha) * smoothed[i - 1];
      smoothed.push(smoothedValue);
    }

    return smoothed;
  }

  seasonalDecomposition(data: number[], period: number): {
    trend: number[];
    seasonal: number[];
    residual: number[];
  } {
    // Simplified seasonal decomposition
    const trend = this.movingAverage(data, period);
    const seasonal: number[] = [];
    const residual: number[] = [];

    for (let i = 0; i < data.length; i++) {
      if (i < period || i >= data.length - period) {
        seasonal.push(0);
        residual.push(0);
      } else {
        const detrended = data[i] - trend[i];
        seasonal.push(detrended);
        residual.push(data[i] - trend[i] - seasonal[i]);
      }
    }

    return { trend, seasonal, residual };
  }

  // Analysis Algorithms
  analyzeTrend(data: number[]): {
    direction: 'up' | 'down' | 'stable';
    strength: number;
    significance: number;
  } {
    const { slope, r2 } = this.linearRegression(data);
    
    const direction = slope > 0.01 ? 'up' : slope < -0.01 ? 'down' : 'stable';
    const strength = Math.abs(slope);
    const significance = r2;

    return { direction, strength, significance };
  }

  detectAnomalies(data: number[], threshold: number = 2): number[] {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const stdDev = Math.sqrt(
      data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
    );

    return data.map((val, index) => 
      Math.abs(val - mean) > threshold * stdDev ? index : -1
    ).filter(index => index !== -1);
  }

  analyzeCorrelation(data1: number[], data2: number[]): number {
    const n = Math.min(data1.length, data2.length);
    const mean1 = data1.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
    const mean2 = data2.slice(0, n).reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;

    for (let i = 0; i < n; i++) {
      const diff1 = data1[i] - mean1;
      const diff2 = data2[i] - mean2;
      
      numerator += diff1 * diff2;
      denominator1 += diff1 * diff1;
      denominator2 += diff2 * diff2;
    }

    return numerator / Math.sqrt(denominator1 * denominator2);
  }

  performClustering(data: number[][], k: number): number[] {
    // Simplified k-means clustering
    const clusters: number[][] = Array.from({ length: k }, () => []);
    const centroids: number[][] = [];

    // Initialize centroids randomly
    for (let i = 0; i < k; i++) {
      centroids.push(data[Math.floor(Math.random() * data.length)]);
    }

    // Assign points to clusters
    for (const point of data) {
      let minDistance = Infinity;
      let closestCluster = 0;

      for (let i = 0; i < k; i++) {
        const distance = this.euclideanDistance(point, centroids[i]);
        if (distance < minDistance) {
          minDistance = distance;
          closestCluster = i;
        }
      }

      clusters[closestCluster].push(point);
    }

    // Return cluster assignments
    return data.map(point => {
      let minDistance = Infinity;
      let closestCluster = 0;

      for (let i = 0; i < k; i++) {
        const distance = this.euclideanDistance(point, centroids[i]);
        if (distance < minDistance) {
          minDistance = distance;
          closestCluster = i;
        }
      }

      return closestCluster;
    });
  }

  // Utility functions
  private movingAverage(data: number[], window: number): number[] {
    const result: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(window / 2));
      const end = Math.min(data.length, i + Math.ceil(window / 2));
      const windowData = data.slice(start, end);
      const average = windowData.reduce((sum, val) => sum + val, 0) / windowData.length;
      result.push(average);
    }

    return result;
  }

  private euclideanDistance(point1: number[], point2: number[]): number {
    return Math.sqrt(
      point1.reduce((sum, val, i) => sum + Math.pow(val - point2[i], 2), 0)
    );
  }
}

// Main BI Component
export const BusinessIntelligence: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { metrics, generateForecast } = useAnalytics();
  
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [goals, setGoals] = useState<BusinessGoal[]>([]);
  const [performanceScores, setPerformanceScores] = useState<PerformanceScore[]>([]);
  const [forecasts, setForecasts] = useState<ForecastModel[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [strategicInsights, setStrategicInsights] = useState<BusinessInsight[]>([]);
  
  const engineRef = useRef<BIEngine>();

  // Initialize BI engine
  useEffect(() => {
    engineRef.current = new BIEngine();
    initializeKPIs();
    initializeGoals();
  }, []);

  // Update KPIs based on metrics
  useEffect(() => {
    updateKPIsFromMetrics();
  }, [metrics]);

  const initializeKPIs = useCallback(() => {
    const defaultKPIs: KPI[] = [
      {
        id: 'revenue-growth',
        name: 'Revenue Growth Rate',
        value: 15.2,
        target: 20,
        unit: '%',
        trend: 'up',
        status: 'warning',
        category: 'financial'
      },
      {
        id: 'customer-satisfaction',
        name: 'Customer Satisfaction',
        value: 4.2,
        target: 4.5,
        unit: 'score',
        trend: 'up',
        status: 'warning',
        category: 'customer'
      },
      {
        id: 'operational-efficiency',
        name: 'Operational Efficiency',
        value: 87,
        target: 90,
        unit: '%',
        trend: 'stable',
        status: 'warning',
        category: 'operational'
      },
      {
        id: 'market-share',
        name: 'Market Share',
        value: 12.5,
        target: 15,
        unit: '%',
        trend: 'up',
        status: 'warning',
        category: 'strategic'
      }
    ];

    setKpis(defaultKPIs);
  }, []);

  const initializeGoals = useCallback(() => {
    const defaultGoals: BusinessGoal[] = [
      {
        id: 'q4-revenue',
        name: 'Q4 Revenue Target',
        description: 'Achieve $2M revenue in Q4',
        targetValue: 2000000,
        currentValue: 1650000,
        unit: 'USD',
        deadline: Date.now() + 30 * 24 * 60 * 60 * 1000,
        progress: 82.5,
        status: 'on-track',
        owner: 'Sales Team',
        kpis: ['revenue-growth']
      },
      {
        id: 'customer-retention',
        name: 'Customer Retention',
        description: 'Maintain 95% customer retention rate',
        targetValue: 95,
        currentValue: 92,
        unit: '%',
        deadline: Date.now() + 90 * 24 * 60 * 60 * 1000,
        progress: 96.8,
        status: 'at-risk',
        owner: 'Customer Success',
        kpis: ['customer-satisfaction']
      }
    ];

    setGoals(defaultGoals);
  }, []);

  const updateKPIsFromMetrics = useCallback(() => {
    if (!engineRef.current) return;

    setKpis(prev => prev.map(kpi => {
      const metric = metrics.find(m => m.id === kpi.id);
      if (metric) {
        const newValue = metric.value;
        const trend = kpi.value < newValue ? 'up' : kpi.value > newValue ? 'down' : 'stable';
        
        let status: KPI['status'] = 'good';
        if (newValue < kpi.target * 0.8) status = 'critical';
        else if (newValue < kpi.target * 0.9) status = 'warning';

        return { ...kpi, value: newValue, trend, status };
      }
      return kpi;
    }));
  }, [metrics]);

  const updateKPI = useCallback((id: string, value: number) => {
    setKpis(prev => prev.map(kpi => 
      kpi.id === id ? { ...kpi, value } : kpi
    ));
  }, []);

  const createKPI = useCallback((kpi: Omit<KPI, 'id'>) => {
    const newKPI: KPI = {
      ...kpi,
      id: Math.random().toString(36)
    };
    setKpis(prev => [...prev, newKPI]);
  }, []);

  const updateGoalProgress = useCallback((id: string, value: number) => {
    setGoals(prev => prev.map(goal => {
      if (goal.id === id) {
        const progress = (value / goal.targetValue) * 100;
        let status: BusinessGoal['status'] = 'on-track';
        
        if (progress >= 100) status = 'achieved';
        else if (progress < 50) status = 'behind';
        else if (Date.now() > goal.deadline * 0.8 && progress < 80) status = 'at-risk';

        return { ...goal, currentValue: value, progress, status };
      }
      return goal;
    }));
  }, []);

  const createGoal = useCallback((goal: Omit<BusinessGoal, 'id' | 'progress' | 'status'>) => {
    const progress = (goal.currentValue / goal.targetValue) * 100;
    const newGoal: BusinessGoal = {
      ...goal,
      id: Math.random().toString(36),
      progress,
      status: progress >= 100 ? 'achieved' : 'on-track'
    };
    setGoals(prev => [...prev, newGoal]);
  }, []);

  const calculatePerformanceScores = useCallback(() => {
    if (!engineRef.current) return;

    const scores: PerformanceScore[] = [
      {
        category: 'Financial',
        score: 82,
        maxScore: 100,
        trend: 'improving',
        factors: [
          { name: 'Revenue Growth', weight: 0.4, score: 85, impact: 'positive' },
          { name: 'Cost Management', weight: 0.3, score: 78, impact: 'neutral' },
          { name: 'Profit Margin', weight: 0.3, score: 81, impact: 'positive' }
        ]
      },
      {
        category: 'Operational',
        score: 76,
        maxScore: 100,
        trend: 'stable',
        factors: [
          { name: 'Process Efficiency', weight: 0.5, score: 79, impact: 'positive' },
          { name: 'Resource Utilization', weight: 0.3, score: 72, impact: 'negative' },
          { name: 'Quality Metrics', weight: 0.2, score: 80, impact: 'positive' }
        ]
      },
      {
        category: 'Customer',
        score: 88,
        maxScore: 100,
        trend: 'improving',
        factors: [
          { name: 'Satisfaction', weight: 0.4, score: 92, impact: 'positive' },
          { name: 'Retention', weight: 0.4, score: 85, impact: 'positive' },
          { name: 'NPS Score', weight: 0.2, score: 87, impact: 'positive' }
        ]
      }
    ];

    setPerformanceScores(scores);
  }, []);

  const generateForecastModel = useCallback(async (type: string, periods: number): Promise<ForecastModel> => {
    if (!engineRef.current) {
      throw new Error('BI Engine not initialized');
    }

    // Generate sample data for forecast
    const historicalData = Array.from({ length: 30 }, () => Math.random() * 1000 + 500);
    const model = engineRef.current.linearRegression(historicalData);

    const forecastData = Array.from({ length: periods }, (_, i) => {
      const predicted = model.intercept + model.slope * (30 + i);
      const confidence = Math.max(0.5, model.r2);
      const margin = (1 - confidence) * predicted * 0.5;

      return {
        period: `Period ${31 + i}`,
        predicted,
        confidenceInterval: [predicted - margin, predicted + margin]
      };
    });

    const forecastModel: ForecastModel = {
      id: Math.random().toString(36),
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Forecast`,
      type: type as any,
      methodology: 'linear',
      accuracy: model.r2,
      confidence: model.r2,
      dataPoints: [
        ...historicalData.map((value, i) => ({
          period: `Period ${i + 1}`,
          actual: value,
          predicted: model.intercept + model.slope * i,
          confidenceInterval: [0, 0]
        })),
        ...forecastData
      ]
    };

    setForecasts(prev => [...prev, forecastModel]);
    return forecastModel;
  }, []);

  const loadBenchmarks = useCallback(async (industry: string) => {
    // Simulate loading benchmark data
    const benchmarkData: Benchmark[] = [
      {
        id: 'industry-avg',
        name: 'Industry Average',
        category: 'Financial',
        industry,
        metrics: [
          { name: 'Revenue Growth', value: 12.5, unit: '%', percentile: 60 },
          { name: 'Profit Margin', value: 8.2, unit: '%', percentile: 55 },
          { name: 'ROI', value: 15.3, unit: '%', percentile: 70 }
        ],
        lastUpdated: Date.now()
      }
    ];

    setBenchmarks(benchmarkData);
  }, []);

  const generateStrategicInsights = useCallback(async () => {
    if (!engineRef.current) return;

    const insights: BusinessInsight[] = [
      {
        id: 'revenue-opportunity',
        type: 'opportunity',
        title: 'Revenue Growth Opportunity',
        description: 'Analysis shows potential for 20% revenue increase through market expansion',
        impact: 'high',
        confidence: 0.78,
        recommendations: [
          'Target emerging markets in Southeast Asia',
          'Invest in digital marketing campaigns',
          'Expand product line for enterprise customers'
        ],
        data: {
          potentialRevenue: 2400000,
          marketSize: 50000000,
          competitionLevel: 'medium'
        },
        createdAt: Date.now()
      },
      {
        id: 'operational-risk',
        type: 'risk',
        title: 'Supply Chain Risk',
        description: 'Dependency on single supplier creates vulnerability',
        impact: 'medium',
        confidence: 0.85,
        recommendations: [
          'Diversify supplier base',
          'Develop contingency plans',
          'Increase safety stock levels'
        ],
        data: {
          supplierCount: 1,
          riskScore: 7.5,
          impactPotential: 250000
        },
        createdAt: Date.now()
      }
    ];

    setStrategicInsights(insights);
  }, []);

  const contextValue: BIContextType = {
    kpis,
    updateKPI,
    createKPI,
    goals,
    updateGoalProgress,
    createGoal,
    performanceScores,
    calculatePerformanceScores,
    forecasts,
    generateForecast: generateForecastModel,
    benchmarks,
    loadBenchmarks,
    strategicInsights,
    generateStrategicInsights
  };

  return (
    <BIContext.Provider value={contextValue}>
      {children}
    </BIContext.Provider>
  );
};

// Hooks
export const useBusinessIntelligence = (): BIContextType => {
  const context = React.useContext(BIContext);
  if (!context) {
    throw new Error('useBusinessIntelligence must be used within BusinessIntelligence');
  }
  return context;
};

// KPI Dashboard Component
export const KPIDashboard: React.FC = () => {
  const { kpis, updateKPI } = useBusinessIntelligence();

  const getStatusColor = (status: KPI['status']) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
    }
  };

  const getTrendIcon = (trend: KPI['trend']) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '→';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map(kpi => (
        <div key={kpi.id} className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-600">{kpi.name}</h3>
            <span className={`text-lg ${getStatusColor(kpi.status)}`}>
              {getTrendIcon(kpi.trend)}
            </span>
          </div>
          <div className="text-2xl font-bold">
            {kpi.value.toLocaleString()} {kpi.unit}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Target: {kpi.target.toLocaleString()} {kpi.unit}
          </div>
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  kpi.status === 'good' ? 'bg-green-500' :
                  kpi.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Goals Tracker Component
export const GoalsTracker: React.FC = () => {
  const { goals, updateGoalProgress } = useBusinessIntelligence();

  const getStatusColor = (status: BusinessGoal['status']) => {
    switch (status) {
      case 'on-track': return 'bg-green-100 text-green-800';
      case 'at-risk': return 'bg-yellow-100 text-yellow-800';
      case 'behind': return 'bg-red-100 text-red-800';
      case 'achieved': return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Business Goals</h2>
      {goals.map(goal => (
        <div key={goal.id} className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium">{goal.name}</h3>
              <p className="text-gray-600">{goal.description}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-gray-500">Owner: {goal.owner}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(goal.status)}`}>
                  {goal.status.replace('-', ' ')}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{goal.progress.toFixed(1)}%</div>
              <div className="text-sm text-gray-500">
                {goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()} {goal.unit}
              </div>
            </div>
          </div>
          <div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  goal.status === 'achieved' ? 'bg-blue-500' :
                  goal.status === 'on-track' ? 'bg-green-500' :
                  goal.status === 'at-risk' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(goal.progress, 100)}%` }}
              />
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Deadline: {new Date(goal.deadline).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BusinessIntelligence;
