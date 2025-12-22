/**
 * Cash Flow Forecast Component
 * Visual display of 30-day cash flow predictions
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  DollarSign,
  ArrowRight,
  RefreshCw,
  Info,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface DailyForecast {
  date: string;
  projectedInflow: number;
  projectedOutflow: number;
  netCashFlow: number;
  runningBalance: number;
  confidence: number;
}

interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  cashRunwayDays: number;
  shortfallProbability: number;
  shortfallDate: string | null;
  shortfallAmount: number;
  recommendations: string[];
}

interface ForecastInsight {
  type: 'warning' | 'opportunity' | 'trend' | 'action';
  title: string;
  description: string;
  impact: number;
  priority: 'low' | 'medium' | 'high';
}

interface ForecastData {
  currentCashPosition: number;
  projectedCashPosition: number;
  daysForecasted: number;
  dailyForecasts: DailyForecast[];
  riskAssessment: RiskAssessment;
  insights: ForecastInsight[];
  accuracy: {
    historicalAccuracy: number;
    dataQuality: string;
    dataPoints: number;
  };
}

export const CashFlowForecast: React.FC = () => {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 14 | 30>(30);

  useEffect(() => {
    fetchForecast();
  }, [selectedPeriod]);

  const fetchForecast = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ai/forecast?days=${selectedPeriod}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setForecast(data.data);
      } else {
        setError(data.error || 'Failed to load forecast');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-secondary text-secondary-foreground';
      case 'medium': return 'bg-accent text-accent-foreground';
      case 'high': return 'bg-destructive/10 text-destructive';
      case 'critical': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'opportunity': return <TrendingUp className="w-5 h-5 text-primary" />;
      case 'trend': return <TrendingDown className="w-5 h-5 text-muted-foreground" />;
      case 'action': return <ArrowRight className="w-5 h-5 text-primary" />;
      default: return <Info className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-soft p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-soft p-6">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <XCircle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={fetchForecast}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground shadow-soft hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!forecast) return null;

  const cashChange = forecast.projectedCashPosition - forecast.currentCashPosition;
  const cashChangePercent = (cashChange / forecast.currentCashPosition) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-border bg-card shadow-soft p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Cash Flow Forecast
            </h2>
            <p className="text-muted-foreground text-sm">
              AI-powered {selectedPeriod}-day prediction
            </p>
          </div>
          <div className="flex items-center gap-2">
            {[7, 14, 30].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period as 7 | 14 | 30)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {period}D
              </button>
            ))}
            <button
              onClick={fetchForecast}
              className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              Current Cash
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(forecast.currentCashPosition)}
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Calendar className="w-4 h-4" />
              Projected ({selectedPeriod}D)
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(forecast.projectedCashPosition)}
            </div>
            <div className={`text-sm flex items-center gap-1 ${cashChange >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {cashChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {cashChangePercent >= 0 ? '+' : ''}{cashChangePercent.toFixed(1)}%
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <AlertTriangle className="w-4 h-4" />
              Risk Level
            </div>
            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium capitalize ${getRiskColor(forecast.riskAssessment.overallRisk)}`}>
              {forecast.riskAssessment.overallRisk}
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <CheckCircle className="w-4 h-4" />
              Cash Runway
            </div>
            <div className="text-2xl font-bold text-foreground">
              {forecast.riskAssessment.cashRunwayDays} days
            </div>
          </div>
        </div>
      </div>

      {/* Chart Placeholder - Would integrate with a charting library */}
      <div className="rounded-xl border border-border bg-card shadow-soft p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Daily Forecast
        </h3>
        <div className="overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-4">
            {forecast.dailyForecasts.slice(0, 14).map((day, index) => {
              const isPositive = day.netCashFlow >= 0;
              const barHeight = Math.min(100, Math.abs(day.netCashFlow) / 100);
              
              return (
                <div key={index} className="flex flex-col items-center w-16">
                  <div className="h-24 w-full flex items-end justify-center">
                    <div
                      className={`w-8 rounded-t transition-all ${
                        isPositive ? 'bg-primary' : 'bg-destructive'
                      }`}
                      style={{ height: `${barHeight}%`, minHeight: '4px' }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {formatDate(day.date)}
                  </div>
                  <div className={`text-xs font-medium ${isPositive ? 'text-primary' : 'text-destructive'}`}>
                    {isPositive ? '+' : ''}{formatCurrency(day.netCashFlow)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Insights */}
      {forecast.insights.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-soft p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            AI Insights
          </h3>
          <div className="space-y-3">
            {forecast.insights.map((insight, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-muted rounded-lg"
              >
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <div className="font-medium text-foreground">
                    {insight.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {insight.description}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  insight.priority === 'high' ? 'bg-destructive/10 text-destructive' :
                  insight.priority === 'medium' ? 'bg-accent text-accent-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {insight.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {forecast.riskAssessment.recommendations.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-soft p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Recommendations
          </h3>
          <ul className="space-y-2">
            {forecast.riskAssessment.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-muted-foreground">
                <ArrowRight className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Accuracy Info */}
      <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="w-4 h-4" />
          Forecast accuracy: {(forecast.accuracy.historicalAccuracy * 100).toFixed(0)}%
          <span className="mx-2">•</span>
          Data quality: {forecast.accuracy.dataQuality}
          <span className="mx-2">•</span>
          Based on {forecast.accuracy.dataPoints} data points
        </div>
      </div>
    </div>
  );
};

export default CashFlowForecast;
