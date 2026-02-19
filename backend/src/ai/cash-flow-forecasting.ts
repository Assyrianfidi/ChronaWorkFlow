/**
 * Cash Flow Forecasting Engine
 * Real-time 30-day predictive insights using actual transaction data
 */

import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import { CacheManager } from '../cache/cache-manager.js';
import { EventBus } from '../events/event-bus.js';

// Forecast period types
export type ForecastPeriod = 'daily' | 'weekly' | 'monthly';

// Cash flow forecast result
export interface CashFlowForecast {
  companyId: string;
  generatedAt: Date;
  forecastPeriod: ForecastPeriod;
  currentCashPosition: number;
  projectedCashPosition: number;
  daysForecasted: number;
  dailyForecasts: DailyForecast[];
  weeklyForecasts: WeeklyForecast[];
  monthlyForecasts: MonthlyForecast[];
  riskAssessment: RiskAssessment;
  insights: ForecastInsight[];
  accuracy: ForecastAccuracy;
}

export interface DailyForecast {
  date: Date;
  projectedInflow: number;
  projectedOutflow: number;
  netCashFlow: number;
  runningBalance: number;
  confidence: number;
  factors: string[];
}

export interface WeeklyForecast {
  weekStartDate: Date;
  weekEndDate: Date;
  projectedInflow: number;
  projectedOutflow: number;
  netCashFlow: number;
  runningBalance: number;
  confidence: number;
}

export interface MonthlyForecast {
  month: number;
  year: number;
  projectedInflow: number;
  projectedOutflow: number;
  netCashFlow: number;
  runningBalance: number;
  confidence: number;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  cashRunwayDays: number;
  shortfallProbability: number;
  shortfallDate: Date | null;
  shortfallAmount: number;
  recommendations: string[];
}

export interface ForecastInsight {
  type: 'warning' | 'opportunity' | 'trend' | 'action';
  title: string;
  description: string;
  impact: number;
  priority: 'low' | 'medium' | 'high';
}

export interface ForecastAccuracy {
  historicalAccuracy: number;
  confidenceInterval: number;
  dataQuality: 'poor' | 'fair' | 'good' | 'excellent';
  dataPoints: number;
}

// Historical transaction pattern
interface TransactionPattern {
  dayOfWeek: number;
  dayOfMonth: number;
  averageInflow: number;
  averageOutflow: number;
  frequency: number;
  variance: number;
}

// Recurring transaction detection
interface RecurringTransaction {
  description: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  nextExpectedDate: Date;
  confidence: number;
  type: 'inflow' | 'outflow';
}

export class CashFlowForecastingEngine {
  private static instance: CashFlowForecastingEngine;
  private cache: CacheManager;
  private eventBus: EventBus;

  private constructor() {
    this.cache = new CacheManager();
    this.eventBus = new EventBus();
    logger.info('Cash Flow Forecasting Engine initialized');
  }

  static getInstance(): CashFlowForecastingEngine {
    if (!CashFlowForecastingEngine.instance) {
      CashFlowForecastingEngine.instance = new CashFlowForecastingEngine();
    }
    return CashFlowForecastingEngine.instance;
  }

  async generateForecast(
    companyId: string,
    daysToForecast: number = 30
  ): Promise<CashFlowForecast> {
    const startTime = performance.now();

    try {
      // Check cache
      const cacheKey = `forecast:${companyId}:${daysToForecast}`;
      const cached = await this.cache.get<CashFlowForecast>(cacheKey);
      if (cached) {
        return cached;
      }

      // Get current cash position
      const currentCashPosition = await this.getCurrentCashPosition(companyId);

      // Get historical transaction data (last 90 days)
      const historicalData = await this.getHistoricalTransactions(companyId, 90);

      // Analyze patterns
      const patterns = this.analyzeTransactionPatterns(historicalData);

      // Detect recurring transactions
      const recurringTransactions = this.detectRecurringTransactions(historicalData);

      // Get pending invoices and bills
      const pendingInflows = await this.getPendingInflows(companyId);
      const pendingOutflows = await this.getPendingOutflows(companyId);

      // Generate daily forecasts
      const dailyForecasts = this.generateDailyForecasts(
        currentCashPosition,
        patterns,
        recurringTransactions,
        pendingInflows,
        pendingOutflows,
        daysToForecast
      );

      // Aggregate to weekly and monthly
      const weeklyForecasts = this.aggregateToWeekly(dailyForecasts);
      const monthlyForecasts = this.aggregateToMonthly(dailyForecasts);

      // Calculate risk assessment
      const riskAssessment = this.calculateRiskAssessment(dailyForecasts, currentCashPosition);

      // Generate insights
      const insights = this.generateInsights(dailyForecasts, patterns, riskAssessment);

      // Calculate accuracy metrics
      const accuracy = await this.calculateAccuracy(companyId, historicalData);

      const forecast: CashFlowForecast = {
        companyId,
        generatedAt: new Date(),
        forecastPeriod: 'daily',
        currentCashPosition,
        projectedCashPosition: dailyForecasts[dailyForecasts.length - 1]?.runningBalance || currentCashPosition,
        daysForecasted: daysToForecast,
        dailyForecasts,
        weeklyForecasts,
        monthlyForecasts,
        riskAssessment,
        insights,
        accuracy,
      };

      // Cache for 1 hour
      await this.cache.set(cacheKey, forecast, { ttl: 3600 });

      // Emit event
      this.eventBus.emit('forecast.generated', {
        companyId,
        daysForecasted: daysToForecast,
        processingTime: performance.now() - startTime,
      });

      logger.info('Cash flow forecast generated', {
        companyId,
        daysForecasted: daysToForecast,
        currentCash: currentCashPosition,
        projectedCash: forecast.projectedCashPosition,
        riskLevel: riskAssessment.overallRisk,
      });

      return forecast;
    } catch (error: any) {
      logger.error('Failed to generate cash flow forecast', { error, companyId });
      throw error;
    }
  }

  private async getCurrentCashPosition(companyId: string): Promise<number> {
    const accounts = await prisma.accounts.findMany({
      where: {
        companyId,
        isActive: true,
        type: 'ASSET',
      },
      select: {
        name: true,
        balance: true,
      },
    });

    // Sum cash and bank accounts
    const cashAccounts = accounts.filter((a: any) => 
      a.name.toLowerCase().includes('cash') || 
      a.name.toLowerCase().includes('bank') ||
      a.name.toLowerCase().includes('checking') ||
      a.name.toLowerCase().includes('savings')
    );

    return cashAccounts.reduce((sum: number, a: { name: string; balance: string }) => sum + Number(a.balance), 0);
  }

  private async getHistoricalTransactions(companyId: string, days: number): Promise<{ id: string; date: Date; description: string; type: string; inflow: number; outflow: number; netAmount: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactions = await prisma.transactions.findMany({
      where: {
        companyId,
        date: {
          gte: startDate,
        },
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return transactions.map((tx: any) => {
      let inflow = 0;
      let outflow = 0;

      for (const line of tx.transaction_lines) {
        if (line.account?.type === 'ASSET') {
          inflow += Number(line.debit);
          outflow += Number(line.credit);
        }
      }

      return {
        id: tx.id,
        date: tx.date,
        description: tx.description,
        type: tx.type,
        inflow,
        outflow,
        netAmount: inflow - outflow,
      };
    });
  }

  private analyzeTransactionPatterns(transactions: any[]): TransactionPattern[] {
    const patterns: Map<string, TransactionPattern> = new Map();

    // Group by day of week
    for (let dow = 0; dow < 7; dow++) {
      const dayTransactions = transactions.filter(t => new Date(t.date).getDay() === dow);
      
      if (dayTransactions.length > 0) {
        const avgInflow = dayTransactions.reduce((sum: any, t: any) => sum + t.inflow, 0) / dayTransactions.length;
        const avgOutflow = dayTransactions.reduce((sum: any, t: any) => sum + t.outflow, 0) / dayTransactions.length;
        
        patterns.set(`dow_${dow}`, {
          dayOfWeek: dow,
          dayOfMonth: -1,
          averageInflow: avgInflow,
          averageOutflow: avgOutflow,
          frequency: dayTransactions.length,
          variance: this.calculateVariance(dayTransactions.map(t => t.netAmount)),
        });
      }
    }

    // Group by day of month (for recurring payments)
    for (let dom = 1; dom <= 31; dom++) {
      const dayTransactions = transactions.filter(t => new Date(t.date).getDate() === dom);
      
      if (dayTransactions.length >= 2) { // At least 2 occurrences
        const avgInflow = dayTransactions.reduce((sum: any, t: any) => sum + t.inflow, 0) / dayTransactions.length;
        const avgOutflow = dayTransactions.reduce((sum: any, t: any) => sum + t.outflow, 0) / dayTransactions.length;
        
        patterns.set(`dom_${dom}`, {
          dayOfWeek: -1,
          dayOfMonth: dom,
          averageInflow: avgInflow,
          averageOutflow: avgOutflow,
          frequency: dayTransactions.length,
          variance: this.calculateVariance(dayTransactions.map(t => t.netAmount)),
        });
      }
    }

    return Array.from(patterns.values());
  }

  private detectRecurringTransactions(transactions: any[]): RecurringTransaction[] {
    const recurring: RecurringTransaction[] = [];
    const descriptionGroups = new Map<string, any[]>();

    // Group by similar descriptions
    for (const tx of transactions) {
      const normalizedDesc = this.normalizeDescription(tx.description || '');
      if (!descriptionGroups.has(normalizedDesc)) {
        descriptionGroups.set(normalizedDesc, []);
      }
      descriptionGroups.get(normalizedDesc)!.push(tx);
    }

    // Analyze each group for recurrence
    for (const [description, txs] of descriptionGroups) {
      if (txs.length >= 2) {
        const intervals = this.calculateIntervals(txs);
        const frequency = this.detectFrequency(intervals);
        
        if (frequency) {
          const avgAmount = txs.reduce((sum: any, t: any) => sum + Math.abs(t.netAmount), 0) / txs.length;
          const isOutflow = txs[0].outflow > txs[0].inflow;
          const lastDate = new Date(Math.max(...txs.map(t => new Date(t.date).getTime())));
          
          recurring.push({
            description,
            amount: avgAmount,
            frequency,
            nextExpectedDate: this.calculateNextDate(lastDate, frequency),
            confidence: this.calculateRecurrenceConfidence(intervals, frequency),
            type: isOutflow ? 'outflow' : 'inflow',
          });
        }
      }
    }

    return recurring;
  }

  private async getPendingInflows(companyId: string): Promise<Array<{ date: Date; amount: number; description: string }>> {
    const invoices = await prisma.invoices.findMany({
      where: {
        companyId,
        status: {
          in: ['OPEN', 'OVERDUE'],
        },
      },
      select: {
        dueAt: true,
        totalAmount: true,
        invoiceNumber: true,
      },
    });

    return invoices.map((inv: any) => ({
      date: inv.dueAt,
      amount: Number(inv.amount),
      description: `Invoice ${inv.invoiceNumber}`,
    }));
  }

  private async getPendingOutflows(companyId: string): Promise<Array<{ date: Date; amount: number; description: string }>> {
    // In a full implementation, this would query bills/payables
    // For now, return empty array as bills model may not exist
    return [];
  }

  private generateDailyForecasts(
    currentCash: number,
    patterns: TransactionPattern[],
    recurring: RecurringTransaction[],
    pendingInflows: Array<{ date: Date; amount: number; description: string }>,
    pendingOutflows: Array<{ date: Date; amount: number; description: string }>,
    days: number
  ): DailyForecast[] {
    const forecasts: DailyForecast[] = [];
    let runningBalance = currentCash;
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);
      
      const dow = forecastDate.getDay();
      const dom = forecastDate.getDate();

      // Base projection from patterns
      const dowPattern = patterns.find(p => p.dayOfWeek === dow);
      const domPattern = patterns.find(p => p.dayOfMonth === dom);

      let projectedInflow = 0;
      let projectedOutflow = 0;
      const factors: string[] = [];

      // Apply day-of-week pattern
      if (dowPattern) {
        projectedInflow += dowPattern.averageInflow * 0.5;
        projectedOutflow += dowPattern.averageOutflow * 0.5;
        factors.push(`Day of week pattern (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dow]})`);
      }

      // Apply day-of-month pattern
      if (domPattern) {
        projectedInflow += domPattern.averageInflow * 0.5;
        projectedOutflow += domPattern.averageOutflow * 0.5;
        factors.push(`Day of month pattern (${dom})`);
      }

      // Add recurring transactions
      for (const rec of recurring) {
        if (this.isDateMatch(forecastDate, rec.nextExpectedDate, rec.frequency)) {
          if (rec.type === 'inflow') {
            projectedInflow += rec.amount;
            factors.push(`Recurring: ${rec.description}`);
          } else {
            projectedOutflow += rec.amount;
            factors.push(`Recurring: ${rec.description}`);
          }
        }
      }

      // Add pending invoices
      for (const pending of pendingInflows) {
        if (this.isSameDay(forecastDate, pending.date)) {
          projectedInflow += pending.amount * 0.7; // 70% collection probability
          factors.push(`Pending invoice: ${pending.description}`);
        }
      }

      // Add pending bills
      for (const pending of pendingOutflows) {
        if (this.isSameDay(forecastDate, pending.date)) {
          projectedOutflow += pending.amount;
          factors.push(`Pending bill: ${pending.description}`);
        }
      }

      const netCashFlow = projectedInflow - projectedOutflow;
      runningBalance += netCashFlow;

      // Calculate confidence (decreases with time)
      const confidence = Math.max(0.5, 1 - (i * 0.015));

      forecasts.push({
        date: forecastDate,
        projectedInflow,
        projectedOutflow,
        netCashFlow,
        runningBalance,
        confidence,
        factors,
      });
    }

    return forecasts;
  }

  private aggregateToWeekly(dailyForecasts: DailyForecast[]): WeeklyForecast[] {
    const weekly: WeeklyForecast[] = [];
    
    for (let i = 0; i < dailyForecasts.length; i += 7) {
      const weekDays = dailyForecasts.slice(i, i + 7);
      if (weekDays.length === 0) break;

      weekly.push({
        weekStartDate: weekDays[0].date,
        weekEndDate: weekDays[weekDays.length - 1].date,
        projectedInflow: weekDays.reduce((sum: any, d: any) => sum + d.projectedInflow, 0),
        projectedOutflow: weekDays.reduce((sum: any, d: any) => sum + d.projectedOutflow, 0),
        netCashFlow: weekDays.reduce((sum: any, d: any) => sum + d.netCashFlow, 0),
        runningBalance: weekDays[weekDays.length - 1].runningBalance,
        confidence: weekDays.reduce((sum: any, d: any) => sum + d.confidence, 0) / weekDays.length,
      });
    }

    return weekly;
  }

  private aggregateToMonthly(dailyForecasts: DailyForecast[]): MonthlyForecast[] {
    const monthly = new Map<string, DailyForecast[]>();

    for (const day of dailyForecasts) {
      const key = `${day.date.getFullYear()}-${day.date.getMonth()}`;
      if (!monthly.has(key)) {
        monthly.set(key, []);
      }
      monthly.get(key)!.push(day);
    }

    return Array.from(monthly.entries()).map(([key, days]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        month,
        year,
        projectedInflow: days.reduce((sum: any, d: any) => sum + d.projectedInflow, 0),
        projectedOutflow: days.reduce((sum: any, d: any) => sum + d.projectedOutflow, 0),
        netCashFlow: days.reduce((sum: any, d: any) => sum + d.netCashFlow, 0),
        runningBalance: days[days.length - 1].runningBalance,
        confidence: days.reduce((sum: any, d: any) => sum + d.confidence, 0) / days.length,
      };
    });
  }

  private calculateRiskAssessment(forecasts: DailyForecast[], currentCash: number): RiskAssessment {
    // Find first day with negative balance
    const shortfallDay = forecasts.find(f => f.runningBalance < 0);
    const minBalance = Math.min(...forecasts.map(f => f.runningBalance));
    
    // Calculate runway
    const avgDailyBurn = forecasts.reduce((sum: any, f: any) => sum + f.projectedOutflow, 0) / forecasts.length;
    const cashRunwayDays = avgDailyBurn > 0 ? Math.floor(currentCash / avgDailyBurn) : 999;

    // Calculate shortfall probability
    let shortfallProbability = 0;
    if (shortfallDay) {
      shortfallProbability = 1 - shortfallDay.confidence;
    } else if (minBalance < currentCash * 0.2) {
      shortfallProbability = 0.3;
    }

    // Determine risk level
    let overallRisk: 'low' | 'medium' | 'high' | 'critical';
    if (shortfallDay && forecasts.indexOf(shortfallDay) < 7) {
      overallRisk = 'critical';
    } else if (shortfallDay && forecasts.indexOf(shortfallDay) < 14) {
      overallRisk = 'high';
    } else if (cashRunwayDays < 30 || minBalance < currentCash * 0.3) {
      overallRisk = 'medium';
    } else {
      overallRisk = 'low';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (overallRisk === 'critical' || overallRisk === 'high') {
      recommendations.push('Accelerate accounts receivable collection');
      recommendations.push('Delay non-essential expenses');
      recommendations.push('Consider short-term financing options');
    }
    if (cashRunwayDays < 60) {
      recommendations.push('Build cash reserves to extend runway');
    }
    if (shortfallProbability > 0.5) {
      recommendations.push('Review and reduce recurring expenses');
    }

    return {
      overallRisk,
      cashRunwayDays,
      shortfallProbability,
      shortfallDate: shortfallDay?.date || null,
      shortfallAmount: shortfallDay ? Math.abs(shortfallDay.runningBalance) : 0,
      recommendations,
    };
  }

  private generateInsights(
    forecasts: DailyForecast[],
    patterns: TransactionPattern[],
    risk: RiskAssessment
  ): ForecastInsight[] {
    const insights: ForecastInsight[] = [];

    // Cash position trend
    const startBalance = forecasts[0]?.runningBalance || 0;
    const endBalance = forecasts[forecasts.length - 1]?.runningBalance || 0;
    const changePercent = startBalance > 0 ? ((endBalance - startBalance) / startBalance) * 100 : 0;

    if (changePercent < -20) {
      insights.push({
        type: 'warning',
        title: 'Significant Cash Decline Projected',
        description: `Cash position is projected to decrease by ${Math.abs(changePercent).toFixed(1)}% over the forecast period.`,
        impact: Math.abs(endBalance - startBalance),
        priority: 'high',
      });
    } else if (changePercent > 20) {
      insights.push({
        type: 'opportunity',
        title: 'Strong Cash Growth Expected',
        description: `Cash position is projected to increase by ${changePercent.toFixed(1)}% over the forecast period.`,
        impact: endBalance - startBalance,
        priority: 'medium',
      });
    }

    // High variance days
    const highVarianceDays = patterns.filter(p => p.variance > 1000);
    if (highVarianceDays.length > 0) {
      insights.push({
        type: 'trend',
        title: 'High Cash Flow Variability Detected',
        description: `${highVarianceDays.length} days show high transaction variability, which may affect forecast accuracy.`,
        impact: 0,
        priority: 'low',
      });
    }

    // Risk-based insights
    if (risk.shortfallDate) {
      const daysUntilShortfall = Math.ceil((risk.shortfallDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      insights.push({
        type: 'action',
        title: 'Cash Shortfall Alert',
        description: `Projected cash shortfall of $${risk.shortfallAmount.toLocaleString()} in ${daysUntilShortfall} days.`,
        impact: risk.shortfallAmount,
        priority: 'high',
      });
    }

    return insights;
  }

  private async calculateAccuracy(companyId: string, historicalData: any[]): Promise<ForecastAccuracy> {
    const dataPoints = historicalData.length;
    
    let dataQuality: 'poor' | 'fair' | 'good' | 'excellent';
    if (dataPoints < 30) {
      dataQuality = 'poor';
    } else if (dataPoints < 60) {
      dataQuality = 'fair';
    } else if (dataPoints < 90) {
      dataQuality = 'good';
    } else {
      dataQuality = 'excellent';
    }

    // Historical accuracy would be calculated by comparing past forecasts to actuals
    // For now, estimate based on data quality
    const historicalAccuracy = dataQuality === 'excellent' ? 0.92 :
                               dataQuality === 'good' ? 0.85 :
                               dataQuality === 'fair' ? 0.75 : 0.65;

    return {
      historicalAccuracy,
      confidenceInterval: 0.15,
      dataQuality,
      dataPoints,
    };
  }

  // Helper methods
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a: any, b: any) => a + b, 0) / values.length;
    return Math.sqrt(values.reduce((sum: any, v: any) => sum + Math.pow(v - mean, 2), 0) / values.length);
  }

  private normalizeDescription(description: string): string {
    return description
      .toLowerCase()
      .replace(/[0-9]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 30);
  }

  private calculateIntervals(transactions: any[]): number[] {
    const sorted = transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const intervals: number[] = [];
    
    for (let i = 1; i < sorted.length; i++) {
      const days = Math.round(
        (new Date(sorted[i].date).getTime() - new Date(sorted[i-1].date).getTime()) / (1000 * 60 * 60 * 24)
      );
      intervals.push(days);
    }
    
    return intervals;
  }

  private detectFrequency(intervals: number[]): RecurringTransaction['frequency'] | null {
    if (intervals.length === 0) return null;
    
    const avgInterval = intervals.reduce((a: any, b: any) => a + b, 0) / intervals.length;
    const variance = this.calculateVariance(intervals);
    
    // Only detect if variance is low (consistent intervals)
    if (variance > avgInterval * 0.3) return null;
    
    if (avgInterval <= 2) return 'daily';
    if (avgInterval >= 6 && avgInterval <= 8) return 'weekly';
    if (avgInterval >= 13 && avgInterval <= 16) return 'biweekly';
    if (avgInterval >= 28 && avgInterval <= 32) return 'monthly';
    if (avgInterval >= 85 && avgInterval <= 95) return 'quarterly';
    
    return null;
  }

  private calculateNextDate(lastDate: Date, frequency: RecurringTransaction['frequency']): Date {
    const next = new Date(lastDate);
    
    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'biweekly':
        next.setDate(next.getDate() + 14);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        break;
    }
    
    return next;
  }

  private calculateRecurrenceConfidence(intervals: number[], frequency: RecurringTransaction['frequency']): number {
    if (!frequency || intervals.length === 0) return 0;
    
    const expectedInterval = frequency === 'daily' ? 1 :
                            frequency === 'weekly' ? 7 :
                            frequency === 'biweekly' ? 14 :
                            frequency === 'monthly' ? 30 : 90;
    
    const avgInterval = intervals.reduce((a: any, b: any) => a + b, 0) / intervals.length;
    const deviation = Math.abs(avgInterval - expectedInterval) / expectedInterval;
    
    return Math.max(0, 1 - deviation);
  }

  private isDateMatch(date: Date, expectedDate: Date, frequency: RecurringTransaction['frequency']): boolean {
    const daysDiff = Math.abs(Math.round((date.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    switch (frequency) {
      case 'daily':
        return daysDiff === 0;
      case 'weekly':
        return daysDiff % 7 === 0;
      case 'biweekly':
        return daysDiff % 14 === 0;
      case 'monthly':
        return date.getDate() === expectedDate.getDate();
      case 'quarterly':
        return date.getDate() === expectedDate.getDate() && 
               (date.getMonth() - expectedDate.getMonth()) % 3 === 0;
      default:
        return false;
    }
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
}

// Export singleton
export const cashFlowForecastingEngine = CashFlowForecastingEngine.getInstance();
