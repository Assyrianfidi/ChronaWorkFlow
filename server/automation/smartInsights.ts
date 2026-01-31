/**
 * Smart Insights Engine
 * 
 * Generates explainable, rule-based financial insights
 */

import { PrismaClient } from '../../generated/prisma';
import { SmartInsightData, InsightMetadata, SuggestedAction } from './types';

const prisma = new PrismaClient();

/**
 * Generate expense anomaly insights
 */
export async function detectExpenseAnomalies(
  tenantId: string,
  lookbackDays: number = 180
): Promise<SmartInsightData[]> {
  const insights: SmartInsightData[] = [];

  // TODO: Query actual expense data from database
  // For now, using mock data structure
  const mockExpenses = [
    { category: 'Office Supplies', amount: 1500, date: new Date(), avgAmount: 500 },
    { category: 'Software', amount: 800, date: new Date(), avgAmount: 750 },
  ];

  for (const expense of mockExpenses) {
    const deviationMultiplier = expense.amount / expense.avgAmount;

    if (deviationMultiplier >= 3) {
      const changePercentage = ((expense.amount - expense.avgAmount) / expense.avgAmount) * 100;

      insights.push({
        type: 'EXPENSE_ANOMALY',
        severity: deviationMultiplier >= 5 ? 'CRITICAL' : 'WARNING',
        title: `Unusual ${expense.category} expense detected`,
        description: `This expense is ${deviationMultiplier.toFixed(1)}× higher than your ${lookbackDays}-day average`,
        explanation: `Your average ${expense.category} expense over the past ${lookbackDays} days is $${expense.avgAmount.toFixed(2)}. This expense of $${expense.amount.toFixed(2)} is ${changePercentage.toFixed(0)}% higher than normal. This could indicate: (1) a one-time purchase, (2) a pricing change, or (3) unauthorized spending.`,
        confidence: 0.85,
        metadata: {
          calculation: `${expense.amount} / ${expense.avgAmount} = ${deviationMultiplier.toFixed(2)}×`,
          baseline: expense.avgAmount,
          current: expense.amount,
          change: expense.amount - expense.avgAmount,
          changePercentage,
          sampleSize: lookbackDays,
          timeRange: {
            start: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000),
            end: new Date(),
          },
        },
        relatedEntities: [
          { type: 'expense', id: 'exp_123', name: expense.category },
        ],
        suggestedActions: [
          {
            type: 'review',
            label: 'Review Transaction',
            description: 'Verify this expense is legitimate and properly categorized',
          },
          {
            type: 'automation',
            label: 'Set Alert',
            description: `Get notified when ${expense.category} expenses exceed $${(expense.avgAmount * 2).toFixed(0)}`,
            automationTemplate: 'expense-threshold-alert',
          },
        ],
      });
    }
  }

  return insights;
}

/**
 * Generate cash flow insights
 */
export async function analyzeCashFlow(
  tenantId: string
): Promise<SmartInsightData[]> {
  const insights: SmartInsightData[] = [];

  // TODO: Query actual cash flow data
  const mockCashFlow = {
    currentBalance: 45000,
    monthlyBurnRate: 15500,
    previousRunway: 4.2,
    currentRunway: 2.9,
  };

  const runwayChange = mockCashFlow.currentRunway - mockCashFlow.previousRunway;
  const runwayChangePercentage = (runwayChange / mockCashFlow.previousRunway) * 100;

  if (mockCashFlow.currentRunway < 3) {
    insights.push({
      type: 'CASH_FLOW_WARNING',
      severity: mockCashFlow.currentRunway < 2 ? 'CRITICAL' : 'WARNING',
      title: 'Cash runway decreased significantly',
      description: `Cash runway decreased from ${mockCashFlow.previousRunway.toFixed(1)} → ${mockCashFlow.currentRunway.toFixed(1)} months`,
      explanation: `Based on your current cash balance of $${mockCashFlow.currentBalance.toLocaleString()} and average monthly burn rate of $${mockCashFlow.monthlyBurnRate.toLocaleString()}, you have approximately ${mockCashFlow.currentRunway.toFixed(1)} months of runway remaining. This is a ${Math.abs(runwayChangePercentage).toFixed(0)}% decrease from last month (${mockCashFlow.previousRunway.toFixed(1)} months). This decrease is due to: (1) increased expenses, (2) decreased revenue, or (3) one-time cash outflows.`,
      confidence: 0.95,
      metadata: {
        calculation: `$${mockCashFlow.currentBalance} / $${mockCashFlow.monthlyBurnRate} = ${mockCashFlow.currentRunway.toFixed(2)} months`,
        baseline: mockCashFlow.previousRunway,
        current: mockCashFlow.currentRunway,
        change: runwayChange,
        changePercentage: runwayChangePercentage,
      },
      relatedEntities: [
        { type: 'cash_account', id: 'acc_123', name: 'Operating Account' },
      ],
      suggestedActions: [
        {
          type: 'review',
          label: 'Review Cash Flow',
          description: 'Analyze recent expenses and revenue trends',
        },
        {
          type: 'automation',
          label: 'Set Cash Alert',
          description: 'Get notified when cash balance drops below $30,000',
          automationTemplate: 'cash-balance-threshold',
        },
        {
          type: 'action',
          label: 'Generate Cash Flow Report',
          description: 'Create detailed 90-day cash flow projection',
        },
      ],
    });
  }

  return insights;
}

/**
 * Detect late payment patterns
 */
export async function detectLatePaymentPatterns(
  tenantId: string
): Promise<SmartInsightData[]> {
  const insights: SmartInsightData[] = [];

  // TODO: Query actual invoice/payment data
  const mockCustomers = [
    {
      id: 'cust_123',
      name: 'Acme Corp',
      invoiceCount: 12,
      latePayments: 11,
      avgDaysLate: 15,
    },
  ];

  for (const customer of mockCustomers) {
    const latePaymentRate = (customer.latePayments / customer.invoiceCount) * 100;

    if (latePaymentRate >= 80) {
      insights.push({
        type: 'PAYMENT_PATTERN',
        severity: latePaymentRate >= 90 ? 'WARNING' : 'INFO',
        title: `${customer.name} consistently pays late`,
        description: `${latePaymentRate.toFixed(0)}% of invoices paid late (${customer.latePayments}/${customer.invoiceCount})`,
        explanation: `Over the past 12 invoices, ${customer.name} has paid late ${customer.latePayments} times (${latePaymentRate.toFixed(0)}% late payment rate). On average, they pay ${customer.avgDaysLate} days after the due date. This pattern suggests: (1) internal approval delays, (2) cash flow issues, or (3) invoice processing inefficiencies. Consider: adjusting payment terms, requiring deposits, or automating payment reminders.`,
        confidence: latePaymentRate / 100,
        metadata: {
          calculation: `${customer.latePayments} / ${customer.invoiceCount} = ${latePaymentRate.toFixed(0)}%`,
          baseline: 100,
          current: latePaymentRate,
          sampleSize: customer.invoiceCount,
        },
        relatedEntities: [
          { type: 'customer', id: customer.id, name: customer.name },
        ],
        suggestedActions: [
          {
            type: 'automation',
            label: 'Automate Reminders',
            description: `Send payment reminders 3 days before due date for ${customer.name}`,
            automationTemplate: 'payment-reminder',
          },
          {
            type: 'action',
            label: 'Adjust Payment Terms',
            description: 'Consider requiring net-15 or deposit for this customer',
          },
        ],
      });
    }
  }

  return insights;
}

/**
 * Analyze revenue trends
 */
export async function analyzeRevenueTrends(
  tenantId: string
): Promise<SmartInsightData[]> {
  const insights: SmartInsightData[] = [];

  // TODO: Query actual revenue data
  const mockRevenue = {
    currentMonth: 42000,
    previousMonth: 58000,
    sameMonthLastYear: 55000,
  };

  const monthOverMonthChange = mockRevenue.currentMonth - mockRevenue.previousMonth;
  const monthOverMonthPercentage = (monthOverMonthChange / mockRevenue.previousMonth) * 100;

  if (monthOverMonthPercentage <= -20) {
    insights.push({
      type: 'REVENUE_TREND',
      severity: monthOverMonthPercentage <= -30 ? 'CRITICAL' : 'WARNING',
      title: 'Significant revenue decrease detected',
      description: `Revenue dropped ${Math.abs(monthOverMonthPercentage).toFixed(0)}% from last month`,
      explanation: `Your revenue this month ($${mockRevenue.currentMonth.toLocaleString()}) is ${Math.abs(monthOverMonthPercentage).toFixed(0)}% lower than last month ($${mockRevenue.previousMonth.toLocaleString()}). This represents a decrease of $${Math.abs(monthOverMonthChange).toLocaleString()}. Compared to the same month last year ($${mockRevenue.sameMonthLastYear.toLocaleString()}), you're down ${(((mockRevenue.currentMonth - mockRevenue.sameMonthLastYear) / mockRevenue.sameMonthLastYear) * 100).toFixed(0)}%. Possible causes: (1) seasonal variation, (2) customer churn, (3) pricing changes, or (4) market conditions.`,
      confidence: 0.90,
      metadata: {
        calculation: `($${mockRevenue.currentMonth} - $${mockRevenue.previousMonth}) / $${mockRevenue.previousMonth} = ${monthOverMonthPercentage.toFixed(1)}%`,
        baseline: mockRevenue.previousMonth,
        current: mockRevenue.currentMonth,
        change: monthOverMonthChange,
        changePercentage: monthOverMonthPercentage,
      },
      relatedEntities: [],
      suggestedActions: [
        {
          type: 'review',
          label: 'Analyze Customer Activity',
          description: 'Review customer retention and new customer acquisition',
        },
        {
          type: 'automation',
          label: 'Set Revenue Alert',
          description: 'Get notified when monthly revenue drops below $45,000',
          automationTemplate: 'revenue-threshold-alert',
        },
      ],
    });
  }

  return insights;
}

/**
 * Detect budget overruns
 */
export async function detectBudgetOverruns(
  tenantId: string
): Promise<SmartInsightData[]> {
  const insights: SmartInsightData[] = [];

  // TODO: Query actual budget data
  const mockBudgets = [
    {
      id: 'budget_123',
      category: 'Marketing',
      budgeted: 10000,
      spent: 9200,
      daysRemaining: 8,
    },
  ];

  for (const budget of mockBudgets) {
    const percentageUsed = (budget.spent / budget.budgeted) * 100;
    const dailyBurnRate = budget.spent / (30 - budget.daysRemaining);
    const projectedSpend = budget.spent + dailyBurnRate * budget.daysRemaining;
    const projectedOverrun = projectedSpend - budget.budgeted;

    if (percentageUsed >= 85 && projectedOverrun > 0) {
      insights.push({
        type: 'BUDGET_ALERT',
        severity: percentageUsed >= 95 ? 'CRITICAL' : 'WARNING',
        title: `${budget.category} budget at risk`,
        description: `${percentageUsed.toFixed(0)}% of budget used with ${budget.daysRemaining} days remaining`,
        explanation: `You've spent $${budget.spent.toLocaleString()} of your $${budget.budgeted.toLocaleString()} ${budget.category} budget (${percentageUsed.toFixed(0)}%). With ${budget.daysRemaining} days left in the period, your current daily burn rate is $${dailyBurnRate.toFixed(0)}. At this rate, you're projected to spend $${projectedSpend.toLocaleString()}, which is $${projectedOverrun.toLocaleString()} over budget (${((projectedOverrun / budget.budgeted) * 100).toFixed(0)}% overrun).`,
        confidence: 0.80,
        metadata: {
          calculation: `$${budget.spent} + ($${dailyBurnRate.toFixed(0)} × ${budget.daysRemaining}) = $${projectedSpend.toFixed(0)}`,
          baseline: budget.budgeted,
          current: budget.spent,
          change: projectedOverrun,
          changePercentage: (projectedOverrun / budget.budgeted) * 100,
        },
        relatedEntities: [
          { type: 'budget', id: budget.id, name: `${budget.category} Budget` },
        ],
        suggestedActions: [
          {
            type: 'action',
            label: 'Review Spending',
            description: `Analyze ${budget.category} expenses and identify areas to reduce`,
          },
          {
            type: 'automation',
            label: 'Lock Budget',
            description: `Prevent new ${budget.category} expenses until next period`,
            automationTemplate: 'budget-lock',
          },
        ],
      });
    }
  }

  return insights;
}

/**
 * Generate all insights for a tenant
 */
export async function generateAllInsights(
  tenantId: string
): Promise<SmartInsightData[]> {
  const [
    expenseAnomalies,
    cashFlowInsights,
    paymentPatterns,
    revenueTrends,
    budgetAlerts,
  ] = await Promise.all([
    detectExpenseAnomalies(tenantId),
    analyzeCashFlow(tenantId),
    detectLatePaymentPatterns(tenantId),
    analyzeRevenueTrends(tenantId),
    detectBudgetOverruns(tenantId),
  ]);

  return [
    ...expenseAnomalies,
    ...cashFlowInsights,
    ...paymentPatterns,
    ...revenueTrends,
    ...budgetAlerts,
  ];
}

/**
 * Save insights to database
 */
export async function saveInsights(
  tenantId: string,
  insights: SmartInsightData[]
): Promise<void> {
  for (const insight of insights) {
    // Check if similar insight already exists (avoid duplicates)
    const existing = await prisma.smartInsight.findFirst({
      where: {
        tenantId,
        insightType: insight.type as any,
        title: insight.title,
        dismissedAt: null,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    if (!existing) {
      await prisma.smartInsight.create({
        data: {
          tenantId,
          insightType: insight.type as any,
          severity: insight.severity as any,
          title: insight.title,
          description: insight.description,
          explanation: insight.explanation,
          confidence: insight.confidence,
          metadata: insight.metadata,
          relatedEntities: insight.relatedEntities,
          actionable: true,
          suggestedActions: insight.suggestedActions,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
    }
  }
}

/**
 * Get active insights for tenant
 */
export async function getActiveInsights(
  tenantId: string,
  severity?: string
): Promise<any[]> {
  const where: any = {
    tenantId,
    dismissedAt: null,
    expiresAt: {
      gte: new Date(),
    },
  };

  if (severity) {
    where.severity = severity;
  }

  return prisma.smartInsight.findMany({
    where,
    orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
  });
}

/**
 * Dismiss an insight
 */
export async function dismissInsight(
  insightId: string,
  userId: string,
  reason?: string
): Promise<void> {
  await prisma.smartInsight.update({
    where: { id: insightId },
    data: {
      dismissedBy: userId,
      dismissedAt: new Date(),
      dismissReason: reason,
    },
  });
}
