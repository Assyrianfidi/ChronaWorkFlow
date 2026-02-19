/**
 * AI CFO Copilot - Natural Language Query Engine
 * Answers financial questions like "Why did profit drop?" using real accounting data
 */

import OpenAI from 'openai';
import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import { CacheManager } from '../cache/cache-manager.js';
import { Decimal } from '@prisma/client/runtime/library';

// Query types the AI CFO can handle
export type QueryType = 
  | 'profit_analysis'
  | 'expense_analysis'
  | 'revenue_analysis'
  | 'cash_flow'
  | 'anomaly_explanation'
  | 'trend_analysis'
  | 'comparison'
  | 'forecast'
  | 'recommendation'
  | 'general';

// Response structure
export interface CopilotResponse {
  query: string;
  queryType: QueryType;
  answer: string;
  insights: string[];
  recommendations: string[];
  dataPoints: DataPoint[];
  confidence: number;
  processingTime: number;
  sources: string[];
}

export interface DataPoint {
  label: string;
  value: number | string;
  change?: number;
  changePercent?: number;
  trend?: 'up' | 'down' | 'stable';
}

// Financial context for AI
interface FinancialContext {
  companyId: string;
  companyName: string;
  currentPeriod: {
    startDate: Date;
    endDate: Date;
    revenue: number;
    expenses: number;
    profit: number;
  };
  previousPeriod: {
    startDate: Date;
    endDate: Date;
    revenue: number;
    expenses: number;
    profit: number;
  };
  topExpenseCategories: Array<{ category: string; amount: number; change: number }>;
  topRevenueStreams: Array<{ source: string; amount: number; change: number }>;
  cashPosition: number;
  accountsReceivable: number;
  accountsPayable: number;
  recentTransactions: Array<{ description: string; amount: number; date: Date; type: string }>;
  anomalies: Array<{ description: string; amount: number; severity: string }>;
}

export class AICFOCopilot {
  private static instance: AICFOCopilot;
  private openai: OpenAI | null = null;
  private cache: CacheManager;
  private isConfigured: boolean = false;

  private constructor() {
    this.cache = new CacheManager();
    this.initializeOpenAI();
  }

  static getInstance(): AICFOCopilot {
    if (!AICFOCopilot.instance) {
      AICFOCopilot.instance = new AICFOCopilot();
    }
    return AICFOCopilot.instance;
  }

  private initializeOpenAI(): void {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      logger.warn('OpenAI API key not configured. AI CFO Copilot will use fallback responses.');
      this.isConfigured = false;
      return;
    }

    try {
      this.openai = new OpenAI({ apiKey });
      this.isConfigured = true;
      logger.info('AI CFO Copilot initialized with OpenAI');
    } catch (error: any) {
      logger.error('Failed to initialize OpenAI', { error });
      this.isConfigured = false;
    }
  }

  async askQuestion(
    query: string,
    companyId: string,
    userId?: number
  ): Promise<CopilotResponse> {
    const startTime = performance.now();

    try {
      // Check cache
      const cacheKey = `copilot:${companyId}:${this.hashQuery(query)}`;
      const cached = await this.cache.get<CopilotResponse>(cacheKey);
      if (cached) {
        return { ...cached, processingTime: performance.now() - startTime };
      }

      // Classify query type
      const queryType = this.classifyQuery(query);

      // Gather financial context
      const context = await this.gatherFinancialContext(companyId);

      // Generate response
      let response: CopilotResponse;
      
      if (this.isConfigured) {
        response = await this.generateAIResponse(query, queryType, context);
      } else {
        response = await this.generateFallbackResponse(query, queryType, context);
      }

      response.processingTime = performance.now() - startTime;

      // Cache response (5 minutes)
      await this.cache.set(cacheKey, response, { ttl: 300 });

      // Log query for analytics
      await this.logQuery(query, queryType, companyId, userId, response);

      return response;
    } catch (error: any) {
      logger.error('AI CFO Copilot query failed', { error, query, companyId });
      
      return {
        query,
        queryType: 'general',
        answer: 'I apologize, but I encountered an error processing your question. Please try again or rephrase your question.',
        insights: [],
        recommendations: [],
        dataPoints: [],
        confidence: 0,
        processingTime: performance.now() - startTime,
        sources: [],
      };
    }
  }

  private classifyQuery(query: string): QueryType {
    const lowerQuery = query.toLowerCase();

    // Profit analysis
    if (lowerQuery.includes('profit') || lowerQuery.includes('margin') || lowerQuery.includes('bottom line')) {
      return 'profit_analysis';
    }

    // Expense analysis
    if (lowerQuery.includes('expense') || lowerQuery.includes('cost') || lowerQuery.includes('spending') || 
        lowerQuery.includes('high') && (lowerQuery.includes('expense') || lowerQuery.includes('cost'))) {
      return 'expense_analysis';
    }

    // Revenue analysis
    if (lowerQuery.includes('revenue') || lowerQuery.includes('sales') || lowerQuery.includes('income')) {
      return 'revenue_analysis';
    }

    // Cash flow
    if (lowerQuery.includes('cash') || lowerQuery.includes('liquidity') || lowerQuery.includes('runway')) {
      return 'cash_flow';
    }

    // Anomaly explanation
    if (lowerQuery.includes('unusual') || lowerQuery.includes('anomaly') || lowerQuery.includes('strange') ||
        lowerQuery.includes('unexpected') || lowerQuery.includes('spike')) {
      return 'anomaly_explanation';
    }

    // Trend analysis
    if (lowerQuery.includes('trend') || lowerQuery.includes('over time') || lowerQuery.includes('pattern')) {
      return 'trend_analysis';
    }

    // Comparison
    if (lowerQuery.includes('compare') || lowerQuery.includes('versus') || lowerQuery.includes('vs') ||
        lowerQuery.includes('difference') || lowerQuery.includes('last month') || lowerQuery.includes('last year')) {
      return 'comparison';
    }

    // Forecast
    if (lowerQuery.includes('forecast') || lowerQuery.includes('predict') || lowerQuery.includes('expect') ||
        lowerQuery.includes('next month') || lowerQuery.includes('projection')) {
      return 'forecast';
    }

    // Recommendation
    if (lowerQuery.includes('should') || lowerQuery.includes('recommend') || lowerQuery.includes('advice') ||
        lowerQuery.includes('improve') || lowerQuery.includes('optimize')) {
      return 'recommendation';
    }

    return 'general';
  }

  private async gatherFinancialContext(companyId: string): Promise<FinancialContext> {
    const now = new Date();
    const currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentPeriodEnd = now;
    const previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get company info
    const company = await prisma.companies.findUnique({
      where: { id: companyId },
      select: { name: true },
    });

    // Get current period transactions
    const currentTransactions = await prisma.transactions.findMany({
      where: {
        companyId,
        date: {
          gte: currentPeriodStart,
          lte: currentPeriodEnd,
        },
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    // Get previous period transactions
    const previousTransactions = await prisma.transactions.findMany({
      where: {
        companyId,
        date: {
          gte: previousPeriodStart,
          lte: previousPeriodEnd,
        },
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    // Calculate financials
    const currentFinancials = this.calculateFinancials(currentTransactions);
    const previousFinancials = this.calculateFinancials(previousTransactions);

    // Get accounts for cash position
    const accounts = await prisma.accounts.findMany({
      where: { companyId, isActive: true },
      select: { type: true, balance: true, name: true },
    });

    const cashAccounts = accounts.filter((a: { type: string; name: string }) => a.type === 'ASSET' && 
      (a.name.toLowerCase().includes('cash') || a.name.toLowerCase().includes('bank')));
    const cashPosition = cashAccounts.reduce((sum: number, a: { balance: string }) => sum + Number(a.balance), 0);

    const arAccounts = accounts.filter((a: { type: string; name: string }) => a.type === 'ASSET' && 
      a.name.toLowerCase().includes('receivable'));
    const accountsReceivable = arAccounts.reduce((sum: number, a: { balance: string }) => sum + Number(a.balance), 0);

    const apAccounts = accounts.filter((a: { type: string; name: string }) => a.type === 'LIABILITY' && 
      a.name.toLowerCase().includes('payable'));
    const accountsPayable = apAccounts.reduce((sum: number, a: { balance: string }) => sum + Number(a.balance), 0);

    // Get recent transactions
    const recentTransactions = await prisma.transactions.findMany({
      where: { companyId },
      orderBy: { date: 'desc' },
      take: 10,
      select: {
        description: true,
        totalAmount: true,
        date: true,
        type: true,
      },
    });

    return {
      companyId,
      companyName: company?.name || 'Your Company',
      currentPeriod: {
        startDate: currentPeriodStart,
        endDate: currentPeriodEnd,
        ...currentFinancials,
      },
      previousPeriod: {
        startDate: previousPeriodStart,
        endDate: previousPeriodEnd,
        ...previousFinancials,
      },
      topExpenseCategories: this.getTopExpenseCategories(currentTransactions, previousTransactions),
      topRevenueStreams: this.getTopRevenueStreams(currentTransactions, previousTransactions),
      cashPosition,
      accountsReceivable,
      accountsPayable,
      recentTransactions: recentTransactions.map((t: any) => ({
        description: t.description || '',
        amount: Number(t.amount),
        date: t.date,
        type: t.type,
      })),
      anomalies: await this.detectAnomalies(companyId),
    };
  }

  private calculateFinancials(transactions: any[]): { revenue: number; expenses: number; profit: number } {
    let revenue = 0;
    let expenses = 0;

    for (const tx of transactions) {
      for (const line of tx.transaction_lines || []) {
        if (line.account?.type === 'REVENUE') {
          revenue += Number(line.credit) - Number(line.debit);
        } else if (line.account?.type === 'EXPENSE') {
          expenses += Number(line.debit) - Number(line.credit);
        }
      }
    }

    return {
      revenue,
      expenses,
      profit: revenue - expenses,
    };
  }

  private getTopExpenseCategories(current: any[], previous: any[]): Array<{ category: string; amount: number; change: number }> {
    const currentByCategory = new Map<string, number>();
    const previousByCategory = new Map<string, number>();

    for (const tx of current) {
      for (const line of tx.transaction_lines || []) {
        if (line.account?.type === 'EXPENSE') {
          const category = line.account.name;
          const amount = Number(line.debit) - Number(line.credit);
          currentByCategory.set(category, (currentByCategory.get(category) || 0) + amount);
        }
      }
    }

    for (const tx of previous) {
      for (const line of tx.transaction_lines || []) {
        if (line.account?.type === 'EXPENSE') {
          const category = line.account.name;
          const amount = Number(line.debit) - Number(line.credit);
          previousByCategory.set(category, (previousByCategory.get(category) || 0) + amount);
        }
      }
    }

    const categories = Array.from(currentByCategory.entries())
      .map(([category, amount]) => {
        const prevAmount = previousByCategory.get(category) || 0;
        const change = prevAmount > 0 ? ((amount - prevAmount) / prevAmount) * 100 : 0;
        return { category, amount, change };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return categories;
  }

  private getTopRevenueStreams(current: any[], previous: any[]): Array<{ source: string; amount: number; change: number }> {
    const currentBySource = new Map<string, number>();
    const previousBySource = new Map<string, number>();

    for (const tx of current) {
      for (const line of tx.transaction_lines || []) {
        if (line.account?.type === 'REVENUE') {
          const source = line.account.name;
          const amount = Number(line.credit) - Number(line.debit);
          currentBySource.set(source, (currentBySource.get(source) || 0) + amount);
        }
      }
    }

    for (const tx of previous) {
      for (const line of tx.transaction_lines || []) {
        if (line.account?.type === 'REVENUE') {
          const source = line.account.name;
          const amount = Number(line.credit) - Number(line.debit);
          previousBySource.set(source, (previousBySource.get(source) || 0) + amount);
        }
      }
    }

    const sources = Array.from(currentBySource.entries())
      .map(([source, amount]) => {
        const prevAmount = previousBySource.get(source) || 0;
        const change = prevAmount > 0 ? ((amount - prevAmount) / prevAmount) * 100 : 0;
        return { source, amount, change };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return sources;
  }

  private async detectAnomalies(companyId: string): Promise<Array<{ description: string; amount: number; severity: string }>> {
    // Get recent transactions and detect anomalies
    const transactions = await prisma.transactions.findMany({
      where: { companyId },
      orderBy: { date: 'desc' },
      take: 100,
      select: {
        description: true,
        totalAmount: true,
        type: true,
      },
    });

    const amounts = transactions.map((t: any) => Number(t.amount));
    const mean = amounts.reduce((a: any, b: any) => a + b, 0) / amounts.length;
    const stdDev = Math.sqrt(amounts.reduce((sum: any, a: any) => sum + Math.pow(a - mean, 2), 0) / amounts.length);

    const anomalies: Array<{ description: string; amount: number; severity: string }> = [];

    for (const tx of transactions) {
      const amount = Number(tx.amount);
      const zScore = Math.abs((amount - mean) / stdDev);
      
      if (zScore > 3) {
        anomalies.push({
          description: tx.description || 'Unknown transaction',
          amount,
          severity: zScore > 4 ? 'high' : 'medium',
        });
      }
    }

    return anomalies.slice(0, 5);
  }

  private async generateAIResponse(
    query: string,
    queryType: QueryType,
    context: FinancialContext
  ): Promise<CopilotResponse> {
    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildUserPrompt(query, queryType, context);

    try {
      if (!this.openai) {
        throw new Error('OpenAI client not initialized');
      }
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(responseText);

      return {
        query,
        queryType,
        answer: parsed.answer || 'Unable to generate response.',
        insights: parsed.insights || [],
        recommendations: parsed.recommendations || [],
        dataPoints: this.extractDataPoints(context, queryType),
        confidence: parsed.confidence || 0.8,
        processingTime: 0,
        sources: ['Transaction data', 'Account balances', 'Historical trends'],
      };
    } catch (error: any) {
      logger.error('OpenAI API call failed', { error });
      return this.generateFallbackResponse(query, queryType, context);
    }
  }

  private async generateFallbackResponse(
    query: string,
    queryType: QueryType,
    context: FinancialContext
  ): Promise<CopilotResponse> {
    // Generate intelligent response without OpenAI
    const { currentPeriod, previousPeriod, topExpenseCategories, topRevenueStreams } = context;
    
    let answer = '';
    let insights: string[] = [];
    let recommendations: string[] = [];

    const profitChange = previousPeriod.profit > 0 
      ? ((currentPeriod.profit - previousPeriod.profit) / previousPeriod.profit) * 100 
      : 0;
    const revenueChange = previousPeriod.revenue > 0 
      ? ((currentPeriod.revenue - previousPeriod.revenue) / previousPeriod.revenue) * 100 
      : 0;
    const expenseChange = previousPeriod.expenses > 0 
      ? ((currentPeriod.expenses - previousPeriod.expenses) / previousPeriod.expenses) * 100 
      : 0;

    switch (queryType) {
      case 'profit_analysis':
        if (profitChange < 0) {
          answer = `Your profit has decreased by ${Math.abs(profitChange).toFixed(1)}% compared to last month. `;
          
          if (expenseChange > revenueChange) {
            answer += `The primary driver is increased expenses (up ${expenseChange.toFixed(1)}%), which outpaced revenue growth.`;
            
            const topIncreaser = topExpenseCategories.find(c => c.change > 10);
            if (topIncreaser) {
              insights.push(`${topIncreaser.category} expenses increased by ${topIncreaser.change.toFixed(1)}%, contributing significantly to the profit decline.`);
            }
            
            recommendations.push('Review expense categories with the highest increases');
            recommendations.push('Identify opportunities to reduce variable costs');
          } else {
            answer += `Revenue declined by ${Math.abs(revenueChange).toFixed(1)}%, which is the main factor.`;
            recommendations.push('Analyze customer acquisition and retention metrics');
            recommendations.push('Review pricing strategy and sales pipeline');
          }
        } else {
          answer = `Your profit has increased by ${profitChange.toFixed(1)}% compared to last month. `;
          answer += `Current profit margin is ${((currentPeriod.profit / currentPeriod.revenue) * 100).toFixed(1)}%.`;
          insights.push('Profit growth is on track');
        }
        break;

      case 'expense_analysis':
        answer = `Total expenses this month: $${currentPeriod.expenses.toLocaleString()}. `;
        
        if (expenseChange > 0) {
          answer += `Expenses are up ${expenseChange.toFixed(1)}% from last month.`;
        } else {
          answer += `Expenses are down ${Math.abs(expenseChange).toFixed(1)}% from last month.`;
        }

        for (const category of topExpenseCategories.slice(0, 3)) {
          insights.push(`${category.category}: $${category.amount.toLocaleString()} (${category.change > 0 ? '+' : ''}${category.change.toFixed(1)}% change)`);
        }

        if (topExpenseCategories.some(c => c.change > 20)) {
          recommendations.push('Review categories with >20% increase for potential savings');
        }
        break;

      case 'revenue_analysis':
        answer = `Total revenue this month: $${currentPeriod.revenue.toLocaleString()}. `;
        
        if (revenueChange > 0) {
          answer += `Revenue is up ${revenueChange.toFixed(1)}% from last month.`;
        } else {
          answer += `Revenue is down ${Math.abs(revenueChange).toFixed(1)}% from last month.`;
        }

        for (const stream of topRevenueStreams.slice(0, 3)) {
          insights.push(`${stream.source}: $${stream.amount.toLocaleString()} (${stream.change > 0 ? '+' : ''}${stream.change.toFixed(1)}% change)`);
        }
        break;

      case 'cash_flow':
        answer = `Current cash position: $${context.cashPosition.toLocaleString()}. `;
        answer += `Accounts receivable: $${context.accountsReceivable.toLocaleString()}. `;
        answer += `Accounts payable: $${context.accountsPayable.toLocaleString()}.`;

        const netWorkingCapital = context.cashPosition + context.accountsReceivable - context.accountsPayable;
        insights.push(`Net working capital: $${netWorkingCapital.toLocaleString()}`);

        if (context.accountsReceivable > context.cashPosition) {
          recommendations.push('Consider accelerating collections to improve cash position');
        }
        break;

      case 'anomaly_explanation':
        if (context.anomalies.length > 0) {
          answer = `I detected ${context.anomalies.length} unusual transaction(s) that may require attention:`;
          
          for (const anomaly of context.anomalies) {
            insights.push(`${anomaly.description}: $${anomaly.amount.toLocaleString()} (${anomaly.severity} severity)`);
          }
          
          recommendations.push('Review flagged transactions for accuracy');
          recommendations.push('Verify large or unusual expenses with receipts');
        } else {
          answer = 'No significant anomalies detected in recent transactions.';
        }
        break;

      case 'forecast':
        const avgMonthlyRevenue = (currentPeriod.revenue + previousPeriod.revenue) / 2;
        const avgMonthlyExpenses = (currentPeriod.expenses + previousPeriod.expenses) / 2;
        const projectedProfit = avgMonthlyRevenue - avgMonthlyExpenses;

        answer = `Based on recent trends, projected next month: `;
        answer += `Revenue: $${avgMonthlyRevenue.toLocaleString()}, `;
        answer += `Expenses: $${avgMonthlyExpenses.toLocaleString()}, `;
        answer += `Profit: $${projectedProfit.toLocaleString()}.`;

        insights.push(`Projected profit margin: ${((projectedProfit / avgMonthlyRevenue) * 100).toFixed(1)}%`);
        break;

      case 'recommendation':
        answer = 'Based on your financial data, here are my recommendations:';
        
        if (expenseChange > 10) {
          recommendations.push(`Expense growth (${expenseChange.toFixed(1)}%) exceeds healthy levels. Review discretionary spending.`);
        }
        
        if (context.accountsReceivable > currentPeriod.revenue * 0.5) {
          recommendations.push('High accounts receivable. Consider tightening payment terms or following up on overdue invoices.');
        }
        
        if (currentPeriod.profit / currentPeriod.revenue < 0.1) {
          recommendations.push('Profit margin below 10%. Focus on either increasing prices or reducing costs.');
        }

        if (recommendations.length === 0) {
          recommendations.push('Financial health looks good. Continue monitoring key metrics.');
        }
        break;

      default:
        answer = `Here's a summary of your financial position: `;
        answer += `Revenue: $${currentPeriod.revenue.toLocaleString()}, `;
        answer += `Expenses: $${currentPeriod.expenses.toLocaleString()}, `;
        answer += `Profit: $${currentPeriod.profit.toLocaleString()}.`;
        
        insights.push(`Profit margin: ${((currentPeriod.profit / currentPeriod.revenue) * 100).toFixed(1)}%`);
    }

    return {
      query,
      queryType,
      answer,
      insights,
      recommendations,
      dataPoints: this.extractDataPoints(context, queryType),
      confidence: 0.85,
      processingTime: 0,
      sources: ['Transaction data', 'Account balances'],
    };
  }

  private buildSystemPrompt(context: FinancialContext): string {
    return `You are an AI CFO assistant for ${context.companyName}. You analyze financial data and provide actionable insights.

Your responses should be:
- Data-driven and specific
- Actionable with clear recommendations
- Professional but accessible
- Focused on business impact

Always respond in JSON format with these fields:
{
  "answer": "Main response to the question",
  "insights": ["Key insight 1", "Key insight 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "confidence": 0.0-1.0
}`;
  }

  private buildUserPrompt(query: string, queryType: QueryType, context: FinancialContext): string {
    const profitChange = context.previousPeriod.profit > 0 
      ? ((context.currentPeriod.profit - context.previousPeriod.profit) / context.previousPeriod.profit) * 100 
      : 0;

    return `Question: ${query}

Financial Context:
- Current Month Revenue: $${context.currentPeriod.revenue.toLocaleString()}
- Current Month Expenses: $${context.currentPeriod.expenses.toLocaleString()}
- Current Month Profit: $${context.currentPeriod.profit.toLocaleString()}
- Previous Month Profit: $${context.previousPeriod.profit.toLocaleString()}
- Profit Change: ${profitChange.toFixed(1)}%
- Cash Position: $${context.cashPosition.toLocaleString()}
- Accounts Receivable: $${context.accountsReceivable.toLocaleString()}
- Accounts Payable: $${context.accountsPayable.toLocaleString()}

Top Expense Categories:
${context.topExpenseCategories.map(c => `- ${c.category}: $${c.amount.toLocaleString()} (${c.change > 0 ? '+' : ''}${c.change.toFixed(1)}%)`).join('\n')}

Top Revenue Streams:
${context.topRevenueStreams.map(s => `- ${s.source}: $${s.amount.toLocaleString()} (${s.change > 0 ? '+' : ''}${s.change.toFixed(1)}%)`).join('\n')}

${context.anomalies.length > 0 ? `Detected Anomalies:\n${context.anomalies.map(a => `- ${a.description}: $${a.amount.toLocaleString()} (${a.severity})`).join('\n')}` : ''}

Provide a detailed, data-driven response to the question.`;
  }

  private extractDataPoints(context: FinancialContext, queryType: QueryType): DataPoint[] {
    const dataPoints: DataPoint[] = [];

    const profitChange = context.previousPeriod.profit > 0 
      ? ((context.currentPeriod.profit - context.previousPeriod.profit) / context.previousPeriod.profit) * 100 
      : 0;
    const revenueChange = context.previousPeriod.revenue > 0 
      ? ((context.currentPeriod.revenue - context.previousPeriod.revenue) / context.previousPeriod.revenue) * 100 
      : 0;
    const expenseChange = context.previousPeriod.expenses > 0 
      ? ((context.currentPeriod.expenses - context.previousPeriod.expenses) / context.previousPeriod.expenses) * 100 
      : 0;

    dataPoints.push({
      label: 'Revenue',
      value: context.currentPeriod.revenue,
      change: context.currentPeriod.revenue - context.previousPeriod.revenue,
      changePercent: revenueChange,
      trend: revenueChange > 0 ? 'up' : revenueChange < 0 ? 'down' : 'stable',
    });

    dataPoints.push({
      label: 'Expenses',
      value: context.currentPeriod.expenses,
      change: context.currentPeriod.expenses - context.previousPeriod.expenses,
      changePercent: expenseChange,
      trend: expenseChange > 0 ? 'up' : expenseChange < 0 ? 'down' : 'stable',
    });

    dataPoints.push({
      label: 'Profit',
      value: context.currentPeriod.profit,
      change: context.currentPeriod.profit - context.previousPeriod.profit,
      changePercent: profitChange,
      trend: profitChange > 0 ? 'up' : profitChange < 0 ? 'down' : 'stable',
    });

    dataPoints.push({
      label: 'Cash Position',
      value: context.cashPosition,
      trend: 'stable',
    });

    return dataPoints;
  }

  private hashQuery(query: string): string {
    // Simple hash for caching
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private async logQuery(
    query: string,
    queryType: QueryType,
    companyId: string,
    userId: number | undefined,
    response: CopilotResponse
  ): Promise<void> {
    logger.info('AI CFO Copilot query', {
      query: query.substring(0, 100),
      queryType,
      companyId,
      userId,
      confidence: response.confidence,
      processingTime: response.processingTime,
    });
  }

  // Predefined quick queries
  async getQuickInsights(companyId: string): Promise<CopilotResponse[]> {
    const queries = [
      'How is my profit trending?',
      'What are my top expenses?',
      'Any unusual transactions?',
    ];

    const responses = await Promise.all(
      queries.map(q => this.askQuestion(q, companyId))
    );

    return responses;
  }
}

// Export singleton
export const aiCFOCopilot = AICFOCopilot.getInstance();
