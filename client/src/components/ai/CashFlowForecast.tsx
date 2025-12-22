/**
 * Cash Flow Forecast Component
 * Visual display of 30-day cash flow predictions
 */

import React, { useEffect, useMemo, useState } from 'react';
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

import Button from '@/components/ui/Button';

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

type Scenario = 'base' | 'conservative' | 'aggressive';
type HorizonMonths = 3 | 6 | 12;

type ForecastAssumptions = {
  revenueGrowthMonthlyPct: number;
  expenseGrowthMonthlyPct: number;
  seasonalityEnabled: boolean;
};

const DAYS_PER_MONTH = 30;
const BASE_FORECAST_DAYS = 30;

const DEFAULT_ASSUMPTIONS: ForecastAssumptions = {
  revenueGrowthMonthlyPct: 2,
  expenseGrowthMonthlyPct: 1,
  seasonalityEnabled: false,
};

const SCENARIO_DELTAS: Record<Scenario, { revDeltaPct: number; expDeltaPct: number }> = {
  base: { revDeltaPct: 0, expDeltaPct: 0 },
  conservative: { revDeltaPct: -1, expDeltaPct: 1 },
  aggressive: { revDeltaPct: 2, expDeltaPct: -0.5 },
};

const SEASONALITY_AMPLITUDE = 0.06;
const MIN_CONFIDENCE_RANGE_PCT = 0.05;
const MAX_CONFIDENCE_RANGE_PCT = 0.25;
const CONFIDENCE_HORIZON_PENALTY_PER_12M = 0.1;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function monthlyPctToDailyFactor(monthlyPct: number) {
  const monthlyFactor = 1 + monthlyPct / 100;
  return Math.pow(monthlyFactor, 1 / DAYS_PER_MONTH);
}

function getConfidenceLabel(rangePct: number) {
  if (rangePct <= 0.1) return 'High confidence';
  if (rangePct <= 0.18) return 'Moderate confidence';
  return 'Low confidence';
}

type ProjectionResult = {
  horizonDays: number;
  rangePct: number;
  confidenceLabel: string;
  projectedCashPosition: number;
  projectedLow: number;
  projectedHigh: number;
  overallRisk: RiskAssessment['overallRisk'];
  dailyForecasts: DailyForecast[];
};

export const CashFlowForecast: React.FC = () => {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scenario, setScenario] = useState<Scenario>('base');
  const [horizonMonths, setHorizonMonths] = useState<HorizonMonths>(6);
  const [assumptions, setAssumptions] = useState<ForecastAssumptions>(
    DEFAULT_ASSUMPTIONS,
  );

  useEffect(() => {
    fetchForecast();
  }, []);

  const fetchForecast = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ai/forecast?days=${BASE_FORECAST_DAYS}`, {
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
      case 'low':
        return 'bg-muted text-foreground';
      case 'medium':
        return 'bg-secondary text-secondary-foreground';
      case 'high':
        return 'bg-accent text-accent-foreground';
      case 'critical':
        return 'bg-accent text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-muted-foreground" />;
      case 'opportunity':
        return <TrendingUp className="w-5 h-5 text-muted-foreground" />;
      case 'trend':
        return <TrendingDown className="w-5 h-5 text-muted-foreground" />;
      case 'action':
        return <ArrowRight className="w-5 h-5 text-muted-foreground" />;
      default:
        return <Info className="w-5 h-5 text-muted-foreground" />;
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

  const projection = useMemo<ProjectionResult | null>(() => {
    if (!forecast) return null;

    const horizonDays = horizonMonths * DAYS_PER_MONTH;
    const baseDays = forecast.dailyForecasts.length;
    const avgConfidence =
      baseDays > 0
        ? forecast.dailyForecasts.reduce((acc, d) => acc + d.confidence, 0) /
          baseDays
        : 0.7;

    const historicalAccuracy = clamp(
      forecast.accuracy.historicalAccuracy,
      0,
      1,
    );

    const rangePct = clamp(
      (1 - historicalAccuracy) * 0.15 +
        (1 - avgConfidence) * 0.15 +
        (horizonMonths / 12) * CONFIDENCE_HORIZON_PENALTY_PER_12M,
      MIN_CONFIDENCE_RANGE_PCT,
      MAX_CONFIDENCE_RANGE_PCT,
    );

    const confidenceLabel = getConfidenceLabel(rangePct);
    const deltas = SCENARIO_DELTAS[scenario];
    const inflowDailyFactor = monthlyPctToDailyFactor(
      assumptions.revenueGrowthMonthlyPct + deltas.revDeltaPct,
    );
    const outflowDailyFactor = monthlyPctToDailyFactor(
      assumptions.expenseGrowthMonthlyPct + deltas.expDeltaPct,
    );

    const baseAvgInflow =
      baseDays > 0
        ? forecast.dailyForecasts.reduce((acc, d) => acc + d.projectedInflow, 0) /
          baseDays
        : 0;
    const baseAvgOutflow =
      baseDays > 0
        ? forecast.dailyForecasts.reduce((acc, d) => acc + d.projectedOutflow, 0) /
          baseDays
        : 0;

    let runningBalance = forecast.currentCashPosition;
    let inflow = baseAvgInflow;
    let outflow = baseAvgOutflow;

    const start = new Date(
      forecast.dailyForecasts[0]?.date ?? new Date().toISOString(),
    );

    const dailyForecasts: DailyForecast[] = Array.from({ length: horizonDays }).map(
      (_, i) => {
        const baseDay = forecast.dailyForecasts[i];
        if (baseDay) {
          inflow = baseDay.projectedInflow;
          outflow = baseDay.projectedOutflow;
        } else {
          inflow = inflow * inflowDailyFactor;
          outflow = outflow * outflowDailyFactor;
        }

        const seasonality = assumptions.seasonalityEnabled
          ? 1 + SEASONALITY_AMPLITUDE * Math.sin((2 * Math.PI * i) / 365)
          : 1;

        const projectedInflow = inflow * seasonality;
        const projectedOutflow = outflow;
        const netCashFlow = projectedInflow - projectedOutflow;
        runningBalance = runningBalance + netCashFlow;

        const d = new Date(start);
        d.setDate(start.getDate() + i);

        return {
          date: d.toISOString().slice(0, 10),
          projectedInflow,
          projectedOutflow,
          netCashFlow,
          runningBalance,
          confidence: clamp(avgConfidence - (i / horizonDays) * 0.2, 0.3, 0.95),
        };
      },
    );

    const projectedCashPosition = dailyForecasts[dailyForecasts.length - 1]?.runningBalance ??
      forecast.projectedCashPosition;
    const delta = Math.abs(projectedCashPosition) * rangePct;

    const projectedLow = projectedCashPosition - delta;
    const minRunningBalance = dailyForecasts.reduce(
      (min, d) => Math.min(min, d.runningBalance),
      Number.POSITIVE_INFINITY,
    );

    const overallRisk: RiskAssessment['overallRisk'] =
      projectedLow < 0 || minRunningBalance < 0
        ? 'critical'
        : minRunningBalance < forecast.currentCashPosition * 0.2
          ? 'high'
          : minRunningBalance < forecast.currentCashPosition * 0.5
            ? 'medium'
            : 'low';

    return {
      horizonDays,
      rangePct,
      confidenceLabel,
      projectedCashPosition,
      projectedLow,
      projectedHigh: projectedCashPosition + delta,
      overallRisk,
      dailyForecasts,
    };
  }, [assumptions, forecast, horizonMonths, scenario]);

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

  const projectedCashPosition =
    projection?.projectedCashPosition ?? forecast.projectedCashPosition;
  const projectedLow = projection?.projectedLow ?? projectedCashPosition;
  const projectedHigh = projection?.projectedHigh ?? projectedCashPosition;
  const confidenceLabel = projection?.confidenceLabel ?? 'Moderate confidence';
  const overallRisk = projection?.overallRisk ?? forecast.riskAssessment.overallRisk;

  const cashChange = projectedCashPosition - forecast.currentCashPosition;
  const cashChangePercent =
    forecast.currentCashPosition === 0
      ? 0
      : (cashChange / forecast.currentCashPosition) * 100;

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
              Deterministic {horizonMonths * DAYS_PER_MONTH}-day projection
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchForecast}
              className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-muted rounded-lg p-4">
            <div className="text-sm font-semibold text-foreground mb-3">Scenario</div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={scenario === 'base' ? 'secondary' : 'outline'}
                onClick={() => setScenario('base')}
              >
                Base
              </Button>
              <Button
                type="button"
                size="sm"
                variant={scenario === 'conservative' ? 'secondary' : 'outline'}
                onClick={() => setScenario('conservative')}
              >
                Conservative
              </Button>
              <Button
                type="button"
                size="sm"
                variant={scenario === 'aggressive' ? 'secondary' : 'outline'}
                onClick={() => setScenario('aggressive')}
              >
                Aggressive
              </Button>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <div className="text-sm font-semibold text-foreground mb-3">Time horizon</div>
            <div className="flex flex-wrap gap-2">
              {[3, 6, 12].map((m) => (
                <Button
                  key={m}
                  type="button"
                  size="sm"
                  variant={horizonMonths === m ? 'secondary' : 'outline'}
                  onClick={() => setHorizonMonths(m as HorizonMonths)}
                >
                  {m} months
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <div className="text-sm font-semibold text-foreground mb-3">Assumptions</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Revenue growth (monthly %)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={assumptions.revenueGrowthMonthlyPct}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    if (!Number.isFinite(next)) return;
                    setAssumptions((prev) => ({
                      ...prev,
                      revenueGrowthMonthlyPct: next,
                    }));
                  }}
                  className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Expense growth (monthly %)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={assumptions.expenseGrowthMonthlyPct}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    if (!Number.isFinite(next)) return;
                    setAssumptions((prev) => ({
                      ...prev,
                      expenseGrowthMonthlyPct: next,
                    }));
                  }}
                  className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={assumptions.seasonalityEnabled}
                  onChange={(e) =>
                    setAssumptions((prev) => ({
                      ...prev,
                      seasonalityEnabled: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border border-input"
                />
                Seasonality
              </label>
            </div>
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
              Projected ({horizonMonths * DAYS_PER_MONTH}D)
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(projectedCashPosition)}
            </div>
            <div className="text-sm flex items-center gap-1 text-muted-foreground">
              {cashChange >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {cashChangePercent >= 0 ? '+' : ''}
              {cashChangePercent.toFixed(1)}%
              <span className="mx-1">ΓÇó</span>
              {confidenceLabel}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Range: {formatCurrency(projectedLow)} ΓÇô {formatCurrency(projectedHigh)}
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <AlertTriangle className="w-4 h-4" />
              Risk Level
            </div>
            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium capitalize ${getRiskColor(overallRisk)}`}>
              {overallRisk}
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
            {(projection?.dailyForecasts ?? forecast.dailyForecasts)
              .slice(0, 14)
              .map((day, index) => {
              const isPositive = day.netCashFlow >= 0;
              const barHeight = Math.min(100, Math.abs(day.netCashFlow) / 100);
              
              return (
                <div key={index} className="flex flex-col items-center w-16">
                  <div className="h-24 w-full flex items-end justify-center">
                    <div
                      className={`w-8 rounded-t transition-all ${
                        isPositive ? 'bg-primary' : 'bg-primary/40'
                      }`}
                      style={{ height: `${barHeight}%`, minHeight: '4px' }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {formatDate(day.date)}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
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
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    insight.priority === 'high'
                      ? 'bg-secondary text-secondary-foreground'
                      : insight.priority === 'medium'
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
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
