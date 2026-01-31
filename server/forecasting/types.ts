/**
 * Predictive Financial Control & Scenario Intelligence Engine - Type Definitions
 */

export enum ForecastType {
  CASH_RUNWAY = 'CASH_RUNWAY',
  BURN_RATE = 'BURN_RATE',
  REVENUE_GROWTH = 'REVENUE_GROWTH',
  EXPENSE_TRAJECTORY = 'EXPENSE_TRAJECTORY',
  PAYMENT_INFLOW = 'PAYMENT_INFLOW',
}

export enum ScenarioType {
  HIRING = 'HIRING',
  LARGE_PURCHASE = 'LARGE_PURCHASE',
  REVENUE_CHANGE = 'REVENUE_CHANGE',
  PAYMENT_DELAY = 'PAYMENT_DELAY',
  AUTOMATION_CHANGE = 'AUTOMATION_CHANGE',
  CUSTOM = 'CUSTOM',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface ForecastAssumption {
  key: string;
  value: any;
  description: string;
  sensitivity: 'low' | 'medium' | 'high'; // How much this affects the forecast
}

export interface DataSource {
  type: string;
  description: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  sampleSize?: number;
}

export interface HistoricalBaseline {
  period: string;
  value: number;
  comparisonPercentage: number;
}

export interface FinancialForecastData {
  id: string;
  tenantId: string;
  forecastType: ForecastType;
  value: number;
  unit: string;
  confidenceScore: number;
  forecastDate: Date;
  forecastHorizon: number;
  formula: string;
  assumptions: ForecastAssumption[];
  dataSources: DataSource[];
  historicalBaseline?: HistoricalBaseline;
  calculatedAt: Date;
}

export interface GenerateForecastRequest {
  tenantId: string;
  forecastType: ForecastType;
  forecastHorizon?: number; // Days into future
}

export interface CashRunwayForecast extends FinancialForecastData {
  forecastType: ForecastType.CASH_RUNWAY;
  unit: 'days' | 'months';
  breakdown: {
    currentCash: number;
    monthlyBurnRate: number;
    projectedRunway: number;
  };
}

export interface BurnRateForecast extends FinancialForecastData {
  forecastType: ForecastType.BURN_RATE;
  unit: 'dollars';
  breakdown: {
    averageMonthlyExpenses: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    trendPercentage: number;
  };
}

export interface RevenueGrowthForecast extends FinancialForecastData {
  forecastType: ForecastType.REVENUE_GROWTH;
  unit: 'percentage';
  breakdown: {
    currentMonthRevenue: number;
    projectedNextMonthRevenue: number;
    growthRate: number;
  };
}

// Scenario Configuration Types

export interface HiringScenarioConfig {
  employeeName: string;
  salary: number;
  startDate: Date;
  rampMonths?: number; // Months to full productivity
  benefits?: number; // Additional costs (healthcare, etc.)
  equipment?: number; // One-time equipment costs
}

export interface LargePurchaseScenarioConfig {
  description: string;
  amount: number;
  purchaseDate: Date;
  isRecurring?: boolean;
  recurringFrequency?: 'monthly' | 'quarterly' | 'annually';
}

export interface RevenueChangeScenarioConfig {
  changeType: 'gain' | 'loss';
  amount: number;
  percentage?: number;
  startDate: Date;
  duration?: number; // Months
  reason?: string;
}

export interface PaymentDelayScenarioConfig {
  delayDays: number;
  affectedInvoices?: string[]; // Invoice IDs
  affectedCustomers?: string[]; // Customer IDs
  estimatedImpact: number;
}

export interface AutomationChangeScenarioConfig {
  ruleId: string;
  ruleName: string;
  changeType: 'enable' | 'disable' | 'modify';
  estimatedImpact: number;
}

export type ScenarioConfig =
  | HiringScenarioConfig
  | LargePurchaseScenarioConfig
  | RevenueChangeScenarioConfig
  | PaymentDelayScenarioConfig
  | AutomationChangeScenarioConfig
  | Record<string, any>;

export interface RiskDriver {
  factor: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
  mitigation?: string;
}

export interface CriticalAssumption {
  assumption: string;
  sensitivity: 'high' | 'medium' | 'low';
  description: string;
  currentValue: any;
  impactIfWrong: string;
}

export interface CashFlowImpact {
  monthlyImpact: number[];
  cumulativeImpact: number;
  breakEvenMonth?: number;
  description: string;
}

export interface AutomationImpact {
  rulesAffected: number;
  executionsImpacted: number;
  estimatedTimeSaved: number;
  estimatedCostSaved: number;
}

export interface PaymentImpact {
  paymentsAffected: number;
  totalAmountImpacted: number;
  averageDelayDays?: number;
  riskOfDefault?: number;
}

export interface Recommendation {
  type: 'delay' | 'adjust_amount' | 'adjust_timing' | 'enable_automation' | 'change_payment_strategy' | 'upgrade_plan';
  title: string;
  description: string;
  expectedBenefit: string;
  riskReduction: number; // Percentage
  confidenceScore: number;
  explanation: string;
  actionable: boolean;
  actionUrl?: string;
}

export interface ScenarioResult {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  scenarioType: ScenarioType;
  config: ScenarioConfig;
  
  // Baseline vs Projected
  baselineRunway: number;
  projectedRunway: number;
  runwayChange: number;
  
  // Risk Assessment
  riskLevel: RiskLevel;
  riskScore: number;
  successProbability: number;
  
  // Risk Analysis
  topRiskDrivers: RiskDriver[];
  criticalAssumptions: CriticalAssumption[];
  
  // Impact Analysis
  cashFlowImpact: CashFlowImpact;
  automationImpact?: AutomationImpact;
  paymentImpact?: PaymentImpact;
  
  // Recommendations
  recommendations: Recommendation[];
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateScenarioRequest {
  tenantId: string;
  name: string;
  description?: string;
  scenarioType: ScenarioType;
  config: ScenarioConfig;
}

export interface SimulateScenarioRequest {
  tenantId: string;
  scenarioId: string;
}

export interface BeforeAfterComparison {
  metric: string;
  before: number;
  after: number;
  change: number;
  changePercentage: number;
  unit: string;
}

export interface ScenarioVisualization {
  cashFlowGraph: {
    months: string[];
    baseline: number[];
    projected: number[];
  };
  runwayComparison: BeforeAfterComparison;
  burnRateComparison: BeforeAfterComparison;
  riskTimeline: Array<{
    month: string;
    riskLevel: RiskLevel;
    description: string;
  }>;
}

// Plan-based limits
export interface ScenarioPlanLimits {
  plan: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  canCreateScenarios: boolean;
  maxScenariosPerMonth: number;
  currentMonthScenarios: number;
  advancedSensitivityAnalysis: boolean;
  executiveAlerts: boolean;
  withinLimits: boolean;
}

// Analytics
export interface ScenarioAnalyticsEvent {
  tenantId: string;
  scenarioId?: string;
  eventType: 'SCENARIO_CREATED' | 'SCENARIO_SIMULATED' | 'DECISION_MADE' | 'RISK_AVOIDED' | 'UPGRADE_TRIGGERED';
  scenarioType?: ScenarioType;
  decisionMade?: boolean;
  decisionOutcome?: 'proceed' | 'delay' | 'cancel' | 'modify';
  riskAvoided?: boolean;
  upgradeTriggered?: boolean;
  planBefore?: string;
  planAfter?: string;
  timeToDecision?: number; // seconds
}

// Explainability
export interface ForecastExplanation {
  summary: string;
  methodology: string;
  keyFactors: Array<{
    factor: string;
    contribution: number; // percentage
    description: string;
  }>;
  limitations: string[];
  confidenceFactors: Array<{
    factor: string;
    impact: 'increases' | 'decreases';
    description: string;
  }>;
}

export interface ScenarioExplanation {
  summary: string;
  assumptions: string[];
  riskFactors: string[];
  whyThisMatters: string;
  whatToWatch: string[];
  alternativeActions: string[];
}
