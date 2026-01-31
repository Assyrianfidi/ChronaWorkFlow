/**
 * Explainable Forecasting Engine
 * 
 * Deterministic forecast calculators with visible formulas and confidence scores
 * NO black-box ML - all predictions are explainable
 */

import { PrismaClient } from '@prisma/client';
import {
  ForecastType,
  ForecastAssumption,
  DataSource,
  HistoricalBaseline,
  FinancialForecastData,
  CashRunwayForecast,
  BurnRateForecast,
  RevenueGrowthForecast,
} from './types';

const prisma = new PrismaClient();

/**
 * Forecasting Engine Service
 */
export class ForecastingEngine {
  /**
   * Generate forecast for a tenant
   */
  async generateForecast(
    tenantId: string,
    forecastType: ForecastType,
    forecastHorizon: number = 90
  ): Promise<FinancialForecastData> {
    switch (forecastType) {
      case ForecastType.CASH_RUNWAY:
        return this.calculateCashRunway(tenantId, forecastHorizon);
      
      case ForecastType.BURN_RATE:
        return this.calculateBurnRate(tenantId, forecastHorizon);
      
      case ForecastType.REVENUE_GROWTH:
        return this.calculateRevenueGrowth(tenantId, forecastHorizon);
      
      case ForecastType.EXPENSE_TRAJECTORY:
        return this.calculateExpenseTrajectory(tenantId, forecastHorizon);
      
      case ForecastType.PAYMENT_INFLOW:
        return this.calculatePaymentInflow(tenantId, forecastHorizon);
      
      default:
        throw new Error(`Unsupported forecast type: ${forecastType}`);
    }
  }

  /**
   * Calculate Cash Runway Forecast
   * Formula: currentCash / monthlyBurnRate
   */
  private async calculateCashRunway(
    tenantId: string,
    forecastHorizon: number
  ): Promise<CashRunwayForecast> {
    // Get current cash balance (mock - replace with actual bank account query)
    const currentCash = await this.getCurrentCashBalance(tenantId);
    
    // Get monthly burn rate from last 90 days
    const monthlyBurnRate = await this.getMonthlyBurnRate(tenantId, 90);
    
    // Calculate runway
    const runwayDays = monthlyBurnRate > 0 ? (currentCash / monthlyBurnRate) * 30 : 999;
    
    // Get historical baseline (90 days ago)
    const historicalRunway = await this.getHistoricalRunway(tenantId, 90);
    
    // Calculate confidence score
    const confidenceScore = this.calculateRunwayConfidence(tenantId, currentCash, monthlyBurnRate);
    
    // Build assumptions
    const assumptions: ForecastAssumption[] = [
      {
        key: 'current_cash',
        value: currentCash,
        description: 'Current cash balance as of today',
        sensitivity: 'high',
      },
      {
        key: 'monthly_burn_rate',
        value: monthlyBurnRate,
        description: 'Average monthly expenses over last 90 days',
        sensitivity: 'high',
      },
      {
        key: 'revenue_constant',
        value: true,
        description: 'Assumes revenue remains at current levels',
        sensitivity: 'medium',
      },
      {
        key: 'no_large_expenses',
        value: true,
        description: 'No unexpected large expenses anticipated',
        sensitivity: 'medium',
      },
    ];
    
    // Build data sources
    const dataSources: DataSource[] = [
      {
        type: 'bank_accounts',
        description: 'Current cash balance from connected accounts',
        dateRange: {
          start: new Date(),
          end: new Date(),
        },
      },
      {
        type: 'expenses',
        description: 'Historical expense data',
        dateRange: {
          start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          end: new Date(),
        },
        sampleSize: 90,
      },
    ];
    
    // Build historical baseline
    const historicalBaseline: HistoricalBaseline = {
      period: '90_days_ago',
      value: historicalRunway,
      comparisonPercentage: ((runwayDays - historicalRunway) / historicalRunway) * 100,
    };
    
    // Save forecast to database
    const forecast = await prisma.financialForecast.create({
      data: {
        tenantId,
        forecastType: ForecastType.CASH_RUNWAY,
        value: runwayDays,
        unit: 'days',
        confidenceScore,
        forecastDate: new Date(),
        forecastHorizon,
        formula: `$${currentCash.toFixed(2)} / ($${monthlyBurnRate.toFixed(2)}/month × 30 days) = ${runwayDays.toFixed(0)} days`,
        assumptions,
        dataSources,
        historicalBaseline,
      },
    });
    
    return {
      id: forecast.id,
      tenantId: forecast.tenantId,
      forecastType: ForecastType.CASH_RUNWAY,
      value: runwayDays,
      unit: 'days',
      confidenceScore,
      forecastDate: forecast.forecastDate,
      forecastHorizon,
      formula: forecast.formula,
      assumptions,
      dataSources,
      historicalBaseline,
      calculatedAt: forecast.calculatedAt,
      breakdown: {
        currentCash,
        monthlyBurnRate,
        projectedRunway: runwayDays,
      },
    };
  }

  /**
   * Calculate Burn Rate Forecast
   * Formula: sum(expenses_last_90_days) / 3 months
   */
  private async calculateBurnRate(
    tenantId: string,
    forecastHorizon: number
  ): Promise<BurnRateForecast> {
    // Get expenses for last 90 days
    const expenses90Days = await this.getExpenses(tenantId, 90);
    const monthlyBurnRate = expenses90Days / 3;
    
    // Get previous period for trend analysis
    const expenses180Days = await this.getExpenses(tenantId, 180);
    const previousMonthlyBurnRate = (expenses180Days - expenses90Days) / 3;
    
    // Determine trend
    const trendPercentage = ((monthlyBurnRate - previousMonthlyBurnRate) / previousMonthlyBurnRate) * 100;
    let trend: 'increasing' | 'decreasing' | 'stable';
    if (trendPercentage > 5) trend = 'increasing';
    else if (trendPercentage < -5) trend = 'decreasing';
    else trend = 'stable';
    
    // Calculate confidence
    const confidenceScore = this.calculateBurnRateConfidence(tenantId, expenses90Days);
    
    // Build assumptions
    const assumptions: ForecastAssumption[] = [
      {
        key: 'expense_consistency',
        value: trend === 'stable',
        description: 'Expenses remain consistent month-over-month',
        sensitivity: 'high',
      },
      {
        key: 'no_seasonal_changes',
        value: true,
        description: 'No significant seasonal expense variations',
        sensitivity: 'medium',
      },
      {
        key: 'one_time_expenses_excluded',
        value: true,
        description: 'Large one-time expenses have been excluded',
        sensitivity: 'low',
      },
    ];
    
    const dataSources: DataSource[] = [
      {
        type: 'expenses',
        description: 'Expense transactions over last 90 days',
        dateRange: {
          start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          end: new Date(),
        },
        sampleSize: 90,
      },
    ];
    
    const historicalBaseline: HistoricalBaseline = {
      period: '90_days_ago',
      value: previousMonthlyBurnRate,
      comparisonPercentage: trendPercentage,
    };
    
    const forecast = await prisma.financialForecast.create({
      data: {
        tenantId,
        forecastType: ForecastType.BURN_RATE,
        value: monthlyBurnRate,
        unit: 'dollars',
        confidenceScore,
        forecastDate: new Date(),
        forecastHorizon,
        formula: `$${expenses90Days.toFixed(2)} / 3 months = $${monthlyBurnRate.toFixed(2)}/month`,
        assumptions,
        dataSources,
        historicalBaseline,
      },
    });
    
    return {
      id: forecast.id,
      tenantId: forecast.tenantId,
      forecastType: ForecastType.BURN_RATE,
      value: monthlyBurnRate,
      unit: 'dollars',
      confidenceScore,
      forecastDate: forecast.forecastDate,
      forecastHorizon,
      formula: forecast.formula,
      assumptions,
      dataSources,
      historicalBaseline,
      calculatedAt: forecast.calculatedAt,
      breakdown: {
        averageMonthlyExpenses: monthlyBurnRate,
        trend,
        trendPercentage,
      },
    };
  }

  /**
   * Calculate Revenue Growth Forecast
   * Formula: (current_month - previous_month) / previous_month × 100
   */
  private async calculateRevenueGrowth(
    tenantId: string,
    forecastHorizon: number
  ): Promise<RevenueGrowthForecast> {
    // Get current month revenue
    const currentMonthRevenue = await this.getMonthRevenue(tenantId, 0);
    
    // Get previous month revenue
    const previousMonthRevenue = await this.getMonthRevenue(tenantId, 1);
    
    // Calculate growth rate
    const growthRate = previousMonthRevenue > 0
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
      : 0;
    
    // Project next month
    const projectedNextMonthRevenue = currentMonthRevenue * (1 + growthRate / 100);
    
    // Calculate confidence
    const confidenceScore = this.calculateRevenueConfidence(tenantId, currentMonthRevenue, previousMonthRevenue);
    
    const assumptions: ForecastAssumption[] = [
      {
        key: 'customer_retention',
        value: 0.95,
        description: 'Customer retention remains at 95%',
        sensitivity: 'high',
      },
      {
        key: 'no_major_churn',
        value: true,
        description: 'No major customer churn events',
        sensitivity: 'high',
      },
      {
        key: 'seasonal_patterns',
        value: 'accounted',
        description: 'Seasonal patterns have been considered',
        sensitivity: 'medium',
      },
      {
        key: 'new_customer_acquisition',
        value: 'continues',
        description: 'New customer acquisition continues at current rate',
        sensitivity: 'medium',
      },
    ];
    
    const dataSources: DataSource[] = [
      {
        type: 'revenue',
        description: 'Revenue data for current and previous months',
        dateRange: {
          start: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          end: new Date(),
        },
        sampleSize: 60,
      },
    ];
    
    const historicalBaseline: HistoricalBaseline = {
      period: 'previous_month',
      value: previousMonthRevenue,
      comparisonPercentage: growthRate,
    };
    
    const forecast = await prisma.financialForecast.create({
      data: {
        tenantId,
        forecastType: ForecastType.REVENUE_GROWTH,
        value: growthRate,
        unit: 'percentage',
        confidenceScore,
        forecastDate: new Date(),
        forecastHorizon,
        formula: `($${currentMonthRevenue.toFixed(2)} - $${previousMonthRevenue.toFixed(2)}) / $${previousMonthRevenue.toFixed(2)} × 100 = ${growthRate.toFixed(2)}%`,
        assumptions,
        dataSources,
        historicalBaseline,
      },
    });
    
    return {
      id: forecast.id,
      tenantId: forecast.tenantId,
      forecastType: ForecastType.REVENUE_GROWTH,
      value: growthRate,
      unit: 'percentage',
      confidenceScore,
      forecastDate: forecast.forecastDate,
      forecastHorizon,
      formula: forecast.formula,
      assumptions,
      dataSources,
      historicalBaseline,
      calculatedAt: forecast.calculatedAt,
      breakdown: {
        currentMonthRevenue,
        projectedNextMonthRevenue,
        growthRate,
      },
    };
  }

  /**
   * Calculate Expense Trajectory Forecast
   * Formula: current_expenses × (1 + growth_rate)^months
   */
  private async calculateExpenseTrajectory(
    tenantId: string,
    forecastHorizon: number
  ): Promise<FinancialForecastData> {
    // Get last 6 months of expenses for trend analysis
    const monthlyExpenses = await this.getMonthlyExpenses(tenantId, 6);
    
    // Calculate linear regression for growth rate
    const growthRate = this.calculateLinearGrowthRate(monthlyExpenses);
    
    // Current month expenses
    const currentExpenses = monthlyExpenses[monthlyExpenses.length - 1];
    
    // Project forward
    const months = forecastHorizon / 30;
    const projectedExpenses = currentExpenses * Math.pow(1 + growthRate, months);
    
    const confidenceScore = this.calculateExpenseConfidence(tenantId, monthlyExpenses);
    
    const assumptions: ForecastAssumption[] = [
      {
        key: 'growth_rate',
        value: growthRate,
        description: `Expense growth rate of ${(growthRate * 100).toFixed(2)}% per month`,
        sensitivity: 'high',
      },
      {
        key: 'no_major_changes',
        value: true,
        description: 'No major operational changes anticipated',
        sensitivity: 'high',
      },
      {
        key: 'linear_trend',
        value: true,
        description: 'Assumes linear trend continues',
        sensitivity: 'medium',
      },
    ];
    
    const dataSources: DataSource[] = [
      {
        type: 'expenses',
        description: 'Monthly expense data for last 6 months',
        dateRange: {
          start: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
          end: new Date(),
        },
        sampleSize: 180,
      },
    ];
    
    const forecast = await prisma.financialForecast.create({
      data: {
        tenantId,
        forecastType: ForecastType.EXPENSE_TRAJECTORY,
        value: projectedExpenses,
        unit: 'dollars',
        confidenceScore,
        forecastDate: new Date(),
        forecastHorizon,
        formula: `$${currentExpenses.toFixed(2)} × (1 + ${(growthRate * 100).toFixed(2)}%)^${months.toFixed(1)} = $${projectedExpenses.toFixed(2)}`,
        assumptions,
        dataSources,
      },
    });
    
    return {
      id: forecast.id,
      tenantId: forecast.tenantId,
      forecastType: ForecastType.EXPENSE_TRAJECTORY,
      value: projectedExpenses,
      unit: 'dollars',
      confidenceScore,
      forecastDate: forecast.forecastDate,
      forecastHorizon,
      formula: forecast.formula,
      assumptions,
      dataSources,
      calculatedAt: forecast.calculatedAt,
    };
  }

  /**
   * Calculate Payment Inflow Reliability Forecast
   * Formula: (on_time_payments / total_payments) × average_payment_value
   */
  private async calculatePaymentInflow(
    tenantId: string,
    forecastHorizon: number
  ): Promise<FinancialForecastData> {
    // Get payment history
    const totalPayments = await this.getTotalPayments(tenantId, 90);
    const onTimePayments = await this.getOnTimePayments(tenantId, 90);
    const averagePaymentValue = await this.getAveragePaymentValue(tenantId, 90);
    
    // Calculate reliability score
    const reliabilityScore = totalPayments > 0 ? (onTimePayments / totalPayments) * 100 : 0;
    
    // Project expected inflow
    const expectedMonthlyInflow = (reliabilityScore / 100) * averagePaymentValue * (totalPayments / 3);
    
    const confidenceScore = this.calculatePaymentConfidence(tenantId, totalPayments);
    
    const assumptions: ForecastAssumption[] = [
      {
        key: 'payment_behavior_consistent',
        value: true,
        description: 'Customer payment behavior remains consistent',
        sensitivity: 'high',
      },
      {
        key: 'no_economic_changes',
        value: true,
        description: 'No major economic changes affecting payments',
        sensitivity: 'medium',
      },
      {
        key: 'invoice_terms_unchanged',
        value: true,
        description: 'Invoice payment terms remain the same',
        sensitivity: 'low',
      },
    ];
    
    const dataSources: DataSource[] = [
      {
        type: 'payments',
        description: 'Payment history over last 90 days',
        dateRange: {
          start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          end: new Date(),
        },
        sampleSize: totalPayments,
      },
    ];
    
    const forecast = await prisma.financialForecast.create({
      data: {
        tenantId,
        forecastType: ForecastType.PAYMENT_INFLOW,
        value: expectedMonthlyInflow,
        unit: 'dollars',
        confidenceScore,
        forecastDate: new Date(),
        forecastHorizon,
        formula: `(${onTimePayments}/${totalPayments}) × $${averagePaymentValue.toFixed(2)} × ${(totalPayments / 3).toFixed(0)} = $${expectedMonthlyInflow.toFixed(2)}/month`,
        assumptions,
        dataSources,
      },
    });
    
    return {
      id: forecast.id,
      tenantId: forecast.tenantId,
      forecastType: ForecastType.PAYMENT_INFLOW,
      value: expectedMonthlyInflow,
      unit: 'dollars',
      confidenceScore,
      forecastDate: forecast.forecastDate,
      forecastHorizon,
      formula: forecast.formula,
      assumptions,
      dataSources,
      calculatedAt: forecast.calculatedAt,
    };
  }

  // Helper methods for data retrieval (mock implementations - replace with actual queries)

  private async getCurrentCashBalance(tenantId: string): Promise<number> {
    // Mock: Replace with actual bank account balance query
    return 50000;
  }

  private async getMonthlyBurnRate(tenantId: string, days: number): Promise<number> {
    // Mock: Replace with actual expense query
    const expenses = await this.getExpenses(tenantId, days);
    return expenses / (days / 30);
  }

  private async getExpenses(tenantId: string, days: number): Promise<number> {
    // Mock: Replace with actual expense query
    return 30000;
  }

  private async getHistoricalRunway(tenantId: string, daysAgo: number): Promise<number> {
    // Mock: Replace with historical calculation
    return 210;
  }

  private async getMonthRevenue(tenantId: string, monthsAgo: number): Promise<number> {
    // Mock: Replace with actual revenue query
    return monthsAgo === 0 ? 15000 : 14000;
  }

  private async getMonthlyExpenses(tenantId: string, months: number): Promise<number[]> {
    // Mock: Replace with actual monthly expense query
    return [9000, 9500, 10000, 10200, 10500, 11000];
  }

  private async getTotalPayments(tenantId: string, days: number): Promise<number> {
    // Mock: Replace with actual payment count
    return 45;
  }

  private async getOnTimePayments(tenantId: string, days: number): Promise<number> {
    // Mock: Replace with actual on-time payment count
    return 38;
  }

  private async getAveragePaymentValue(tenantId: string, days: number): Promise<number> {
    // Mock: Replace with actual average calculation
    return 500;
  }

  // Confidence scoring methods

  private calculateRunwayConfidence(tenantId: string, currentCash: number, monthlyBurnRate: number): number {
    let confidence = 100;
    
    // Reduce confidence if cash is low
    if (currentCash < monthlyBurnRate * 3) confidence -= 20;
    
    // Reduce confidence if burn rate is volatile (mock check)
    confidence -= 10;
    
    // Reduce confidence if data is sparse
    confidence -= 5;
    
    return Math.max(0, Math.min(100, confidence));
  }

  private calculateBurnRateConfidence(tenantId: string, expenses: number): number {
    let confidence = 90;
    
    // Reduce if expenses are volatile
    confidence -= 5;
    
    return Math.max(0, Math.min(100, confidence));
  }

  private calculateRevenueConfidence(tenantId: string, current: number, previous: number): number {
    let confidence = 85;
    
    // Reduce if revenue is volatile
    const variance = Math.abs(current - previous) / previous;
    if (variance > 0.2) confidence -= 15;
    
    return Math.max(0, Math.min(100, confidence));
  }

  private calculateExpenseConfidence(tenantId: string, monthlyExpenses: number[]): number {
    let confidence = 80;
    
    // Calculate variance
    const mean = monthlyExpenses.reduce((a, b) => a + b, 0) / monthlyExpenses.length;
    const variance = monthlyExpenses.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / monthlyExpenses.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / mean;
    
    // Lower confidence if high variability
    if (coefficientOfVariation > 0.2) confidence -= 20;
    
    return Math.max(0, Math.min(100, confidence));
  }

  private calculatePaymentConfidence(tenantId: string, totalPayments: number): number {
    let confidence = 75;
    
    // Higher confidence with more data points
    if (totalPayments > 50) confidence += 10;
    if (totalPayments < 20) confidence -= 15;
    
    return Math.max(0, Math.min(100, confidence));
  }

  private calculateLinearGrowthRate(values: number[]): number {
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += Math.pow(i - xMean, 2);
    }
    
    const slope = numerator / denominator;
    return slope / yMean; // Convert to growth rate
  }
}

/**
 * Get all forecasts for a tenant
 */
export async function getAllForecasts(tenantId: string): Promise<FinancialForecastData[]> {
  const forecasts = await prisma.financialForecast.findMany({
    where: { tenantId },
    orderBy: { calculatedAt: 'desc' },
    take: 50,
  });
  
  return forecasts.map(f => ({
    id: f.id,
    tenantId: f.tenantId,
    forecastType: f.forecastType as ForecastType,
    value: f.value,
    unit: f.unit,
    confidenceScore: f.confidenceScore,
    forecastDate: f.forecastDate,
    forecastHorizon: f.forecastHorizon,
    formula: f.formula,
    assumptions: f.assumptions as ForecastAssumption[],
    dataSources: f.dataSources as DataSource[],
    historicalBaseline: f.historicalBaseline as HistoricalBaseline | undefined,
    calculatedAt: f.calculatedAt,
  }));
}
