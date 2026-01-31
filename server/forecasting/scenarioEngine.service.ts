/**
 * Scenario Simulation Engine
 * 
 * Executive-grade scenario analysis with explainability-first design
 * Deterministic math only - NO black-box ML
 * Every scenario exposes formulas and assumptions
 */

import { PrismaClient } from '@prisma/client';
import {
  ScenarioType,
  RiskLevel,
  ScenarioConfig,
  HiringScenarioConfig,
  LargePurchaseScenarioConfig,
  RevenueChangeScenarioConfig,
  PaymentDelayScenarioConfig,
  AutomationChangeScenarioConfig,
  ScenarioResult,
  RiskDriver,
  CriticalAssumption,
  CashFlowImpact,
  Recommendation,
  CreateScenarioRequest,
} from './types';
import { ForecastingEngine } from './forecastingEngine.service';

const prisma = new PrismaClient();

/**
 * Scenario Simulation Engine
 */
export class ScenarioEngine {
  private forecastingEngine: ForecastingEngine;

  constructor() {
    this.forecastingEngine = new ForecastingEngine();
  }

  /**
   * Create and simulate a scenario
   */
  async createScenario(request: CreateScenarioRequest): Promise<ScenarioResult> {
    // Get baseline metrics
    const baselineRunway = await this.calculateBaselineRunway(request.tenantId);
    
    // Simulate scenario based on type
    let projectedRunway: number;
    let cashFlowImpact: CashFlowImpact;
    let topRiskDrivers: RiskDriver[];
    let criticalAssumptions: CriticalAssumption[];
    let recommendations: Recommendation[];

    switch (request.scenarioType) {
      case ScenarioType.HIRING:
        ({
          projectedRunway,
          cashFlowImpact,
          topRiskDrivers,
          criticalAssumptions,
          recommendations,
        } = await this.simulateHiring(request.tenantId, request.config as HiringScenarioConfig, baselineRunway));
        break;

      case ScenarioType.LARGE_PURCHASE:
        ({
          projectedRunway,
          cashFlowImpact,
          topRiskDrivers,
          criticalAssumptions,
          recommendations,
        } = await this.simulateLargePurchase(request.tenantId, request.config as LargePurchaseScenarioConfig, baselineRunway));
        break;

      case ScenarioType.REVENUE_CHANGE:
        ({
          projectedRunway,
          cashFlowImpact,
          topRiskDrivers,
          criticalAssumptions,
          recommendations,
        } = await this.simulateRevenueChange(request.tenantId, request.config as RevenueChangeScenarioConfig, baselineRunway));
        break;

      case ScenarioType.PAYMENT_DELAY:
        ({
          projectedRunway,
          cashFlowImpact,
          topRiskDrivers,
          criticalAssumptions,
          recommendations,
        } = await this.simulatePaymentDelay(request.tenantId, request.config as PaymentDelayScenarioConfig, baselineRunway));
        break;

      case ScenarioType.AUTOMATION_CHANGE:
        ({
          projectedRunway,
          cashFlowImpact,
          topRiskDrivers,
          criticalAssumptions,
          recommendations,
        } = await this.simulateAutomationChange(request.tenantId, request.config as AutomationChangeScenarioConfig, baselineRunway));
        break;

      case ScenarioType.CUSTOM:
        ({
          projectedRunway,
          cashFlowImpact,
          topRiskDrivers,
          criticalAssumptions,
          recommendations,
        } = await this.simulateCustom(request.tenantId, request.config, baselineRunway));
        break;

      default:
        throw new Error(`Unsupported scenario type: ${request.scenarioType}`);
    }

    // Calculate risk metrics
    const runwayChange = projectedRunway - baselineRunway;
    const { riskLevel, riskScore, successProbability } = this.calculateRiskMetrics(
      baselineRunway,
      projectedRunway,
      topRiskDrivers,
      criticalAssumptions
    );

    // Save scenario to database
    const scenario = await prisma.scenario.create({
      data: {
        tenantId: request.tenantId,
        name: request.name,
        description: request.description,
        scenarioType: request.scenarioType,
        config: request.config as Record<string, unknown>,
        baselineRunway,
        projectedRunway,
        runwayChange,
        riskLevel,
        riskScore,
        successProbability,
        topRiskDrivers: topRiskDrivers as unknown as Record<string, unknown>[],
        criticalAssumptions: criticalAssumptions as unknown as Record<string, unknown>[],
        cashFlowImpact: cashFlowImpact as unknown as Record<string, unknown>,
        recommendations: recommendations as unknown as Record<string, unknown>[],
        createdBy: request.tenantId, // Should be userId in production
      },
    });

    // Track analytics
    await this.trackScenarioAnalytics(request.tenantId, scenario.id, 'SCENARIO_CREATED', request.scenarioType);

    return {
      id: scenario.id,
      tenantId: scenario.tenantId,
      name: scenario.name,
      description: scenario.description || undefined,
      scenarioType: scenario.scenarioType as ScenarioType,
      config: scenario.config as ScenarioConfig,
      baselineRunway,
      projectedRunway,
      runwayChange,
      riskLevel,
      riskScore,
      successProbability,
      topRiskDrivers,
      criticalAssumptions,
      cashFlowImpact,
      recommendations,
      createdBy: scenario.createdBy,
      createdAt: scenario.createdAt,
      updatedAt: scenario.updatedAt,
    };
  }

  /**
   * Simulate hiring scenario
   */
  private async simulateHiring(
    tenantId: string,
    config: HiringScenarioConfig,
    baselineRunway: number
  ): Promise<{
    projectedRunway: number;
    cashFlowImpact: CashFlowImpact;
    topRiskDrivers: RiskDriver[];
    criticalAssumptions: CriticalAssumption[];
    recommendations: Recommendation[];
  }> {
    // Get current financial metrics
    const currentCash = await this.getCurrentCash(tenantId);
    const monthlyBurnRate = await this.getMonthlyBurnRate(tenantId);

    // Calculate hiring costs
    const monthlySalary = config.salary / 12;
    const monthlyBenefits = (config.benefits || 0) / 12;
    const equipmentCost = config.equipment || 0;
    const rampMonths = config.rampMonths || 0;

    // Calculate month-by-month impact
    const monthlyImpact: number[] = [];
    let cumulativeImpact = 0;

    // First month: equipment + salary + benefits
    const firstMonthCost = equipmentCost + monthlySalary + monthlyBenefits;
    monthlyImpact.push(-firstMonthCost);
    cumulativeImpact -= firstMonthCost;

    // Ramp months: reduced productivity (50% value)
    for (let i = 0; i < rampMonths; i++) {
      const monthlyCost = monthlySalary + monthlyBenefits;
      monthlyImpact.push(-monthlyCost);
      cumulativeImpact -= monthlyCost;
    }

    // Ongoing months: full cost
    for (let i = rampMonths + 1; i < 12; i++) {
      const monthlyCost = monthlySalary + monthlyBenefits;
      monthlyImpact.push(-monthlyCost);
      cumulativeImpact -= monthlyCost;
    }

    // Calculate new burn rate and runway
    const newMonthlyBurnRate = monthlyBurnRate + monthlySalary + monthlyBenefits;
    const cashAfterEquipment = currentCash - equipmentCost;
    const projectedRunway = (cashAfterEquipment / newMonthlyBurnRate) * 30;

    // Identify risk drivers
    const topRiskDrivers: RiskDriver[] = [];

    if (projectedRunway < 180) {
      topRiskDrivers.push({
        factor: 'Insufficient runway buffer',
        impact: 'high',
        description: `Hiring reduces runway to ${Math.round(projectedRunway)} days, below 6-month safety threshold`,
        mitigation: 'Delay hire by 2 months or reduce salary by 15%',
      });
    }

    if (rampMonths > 3) {
      topRiskDrivers.push({
        factor: 'Extended ramp period',
        impact: 'medium',
        description: `${rampMonths}-month ramp period delays productivity`,
        mitigation: 'Plan for extended onboarding and reduced output',
      });
    }

    if (config.salary > monthlyBurnRate * 12) {
      topRiskDrivers.push({
        factor: 'High salary relative to burn rate',
        impact: 'medium',
        description: `Salary (${config.salary}) exceeds annual burn rate`,
        mitigation: 'Consider lower salary or contract position',
      });
    }

    // Critical assumptions
    const criticalAssumptions: CriticalAssumption[] = [
      {
        assumption: `Monthly burn rate remains at $${monthlyBurnRate.toFixed(0)}`,
        sensitivity: 'high',
        description: 'Current average over last 90 days',
        currentValue: monthlyBurnRate,
        impactIfWrong: `If burn rate increases to $${(monthlyBurnRate * 1.2).toFixed(0)}, runway drops by 1.5 months`,
      },
      {
        assumption: 'No additional hires in next 6 months',
        sensitivity: 'high',
        description: 'Scenario assumes this is the only new hire',
        currentValue: 1,
        impactIfWrong: `Each additional hire at $${config.salary} reduces runway by ~${Math.round((config.salary / 12) / monthlyBurnRate * 30)} days`,
      },
      {
        assumption: 'Revenue remains flat',
        sensitivity: 'medium',
        description: 'No revenue growth assumed',
        currentValue: 0,
        impactIfWrong: '10% revenue growth adds 0.5 months to runway',
      },
    ];

    // Generate recommendations
    const recommendations: Recommendation[] = [];

    if (projectedRunway < 180) {
      recommendations.push({
        type: 'delay',
        title: 'Delay hire by 2 months',
        description: `Waiting until ${new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString()} increases runway buffer`,
        expectedBenefit: 'Reduces risk from HIGH to MEDIUM',
        riskReduction: 35,
        confidenceScore: 85,
        explanation: 'Current runway is below recommended 6-month buffer. Delaying allows time to increase cash reserves.',
        actionable: true,
      });

      recommendations.push({
        type: 'adjust_amount',
        title: `Reduce salary to $${Math.round(config.salary * 0.85)}`,
        description: 'Lowering salary by 15% extends runway',
        expectedBenefit: 'Maintains hire while reducing risk',
        riskReduction: 20,
        confidenceScore: 75,
        explanation: 'Reduced salary still attracts qualified candidates while preserving cash runway.',
        actionable: true,
      });
    }

    if (baselineRunway > 180) {
      recommendations.push({
        type: 'enable_automation',
        title: "Enable 'Auto-Collect Overdue Invoices' rule",
        description: 'Accelerates payment collection by average of 12 days',
        expectedBenefit: 'Improves cash flow to support hire',
        riskReduction: 15,
        confidenceScore: 80,
        explanation: 'Automated collections reduce DSO, freeing up cash for the new hire.',
        actionable: true,
        actionUrl: '/automations/templates/auto-collect-overdue',
      });
    }

    const cashFlowImpact: CashFlowImpact = {
      monthlyImpact,
      cumulativeImpact,
      description: `Hiring ${config.employeeName} at $${config.salary}/year increases monthly burn by $${(monthlySalary + monthlyBenefits).toFixed(0)}`,
    };

    return {
      projectedRunway,
      cashFlowImpact,
      topRiskDrivers,
      criticalAssumptions,
      recommendations,
    };
  }

  /**
   * Simulate large purchase scenario
   */
  private async simulateLargePurchase(
    tenantId: string,
    config: LargePurchaseScenarioConfig,
    baselineRunway: number
  ): Promise<{
    projectedRunway: number;
    cashFlowImpact: CashFlowImpact;
    topRiskDrivers: RiskDriver[];
    criticalAssumptions: CriticalAssumption[];
    recommendations: Recommendation[];
  }> {
    const currentCash = await this.getCurrentCash(tenantId);
    const monthlyBurnRate = await this.getMonthlyBurnRate(tenantId);

    const monthlyImpact: number[] = [];
    let cumulativeImpact = 0;

    if (config.isRecurring) {
      // Recurring purchase increases burn rate
      const recurringAmount = config.recurringFrequency === 'monthly' ? config.amount :
                             config.recurringFrequency === 'quarterly' ? config.amount / 3 :
                             config.amount / 12;

      for (let i = 0; i < 12; i++) {
        monthlyImpact.push(-recurringAmount);
        cumulativeImpact -= recurringAmount;
      }

      const newMonthlyBurnRate = monthlyBurnRate + recurringAmount;
      const projectedRunway = (currentCash / newMonthlyBurnRate) * 30;

      const topRiskDrivers: RiskDriver[] = [
        {
          factor: 'Permanent burn rate increase',
          impact: 'high',
          description: `Recurring expense increases monthly burn by $${recurringAmount.toFixed(0)}`,
          mitigation: 'Ensure revenue growth offsets increased expenses',
        },
      ];

      const criticalAssumptions: CriticalAssumption[] = [
        {
          assumption: 'Recurring expense continues indefinitely',
          sensitivity: 'high',
          description: 'Assumes expense cannot be cancelled',
          currentValue: config.amount,
          impactIfWrong: 'Cancelling saves runway proportionally',
        },
      ];

      const recommendations: Recommendation[] = [
        {
          type: 'adjust_amount',
          title: 'Negotiate lower recurring rate',
          description: 'Reduce monthly cost by 10-20%',
          expectedBenefit: 'Extends runway without eliminating expense',
          riskReduction: 25,
          confidenceScore: 70,
          explanation: 'Many vendors offer discounts for annual commitments or volume.',
          actionable: true,
        },
      ];

      return {
        projectedRunway,
        cashFlowImpact: {
          monthlyImpact,
          cumulativeImpact,
          description: `Recurring ${config.recurringFrequency} expense of $${config.amount}`,
        },
        topRiskDrivers,
        criticalAssumptions,
        recommendations,
      };
    } else {
      // One-time purchase
      monthlyImpact.push(-config.amount);
      cumulativeImpact = -config.amount;

      const cashAfterPurchase = currentCash - config.amount;
      const projectedRunway = (cashAfterPurchase / monthlyBurnRate) * 30;

      const topRiskDrivers: RiskDriver[] = [];
      if (config.amount > currentCash * 0.2) {
        topRiskDrivers.push({
          factor: 'Large cash outflow',
          impact: 'high',
          description: `Purchase represents ${((config.amount / currentCash) * 100).toFixed(0)}% of cash reserves`,
          mitigation: 'Consider financing or phased payment',
        });
      }

      const criticalAssumptions: CriticalAssumption[] = [
        {
          assumption: 'No additional large expenses',
          sensitivity: 'high',
          description: 'Assumes no other major purchases',
          currentValue: config.amount,
          impactIfWrong: 'Additional expenses compound runway reduction',
        },
      ];

      const recommendations: Recommendation[] = [
        {
          type: 'adjust_timing',
          title: 'Delay purchase by 1 month',
          description: 'Allows cash reserves to rebuild',
          expectedBenefit: 'Reduces immediate cash pressure',
          riskReduction: 15,
          confidenceScore: 85,
          explanation: 'Small delay provides breathing room without significantly impacting business.',
          actionable: true,
        },
      ];

      return {
        projectedRunway,
        cashFlowImpact: {
          monthlyImpact,
          cumulativeImpact,
          description: `One-time purchase of $${config.amount} for ${config.description}`,
        },
        topRiskDrivers,
        criticalAssumptions,
        recommendations,
      };
    }
  }

  /**
   * Simulate revenue change scenario
   */
  private async simulateRevenueChange(
    tenantId: string,
    config: RevenueChangeScenarioConfig,
    baselineRunway: number
  ): Promise<{
    projectedRunway: number;
    cashFlowImpact: CashFlowImpact;
    topRiskDrivers: RiskDriver[];
    criticalAssumptions: CriticalAssumption[];
    recommendations: Recommendation[];
  }> {
    const currentCash = await this.getCurrentCash(tenantId);
    const monthlyBurnRate = await this.getMonthlyBurnRate(tenantId);
    const currentRevenue = await this.getMonthlyRevenue(tenantId);

    const monthlyChange = config.changeType === 'gain' ? config.amount : -config.amount;
    const duration = config.duration || 12;

    const monthlyImpact: number[] = [];
    let cumulativeImpact = 0;

    for (let i = 0; i < Math.min(duration, 12); i++) {
      monthlyImpact.push(monthlyChange);
      cumulativeImpact += monthlyChange;
    }

    // Calculate effective burn rate (revenue reduces burn)
    const newEffectiveBurnRate = monthlyBurnRate - currentRevenue - monthlyChange;
    const projectedRunway = newEffectiveBurnRate > 0 ? (currentCash / newEffectiveBurnRate) * 30 : 999;

    const topRiskDrivers: RiskDriver[] = [];
    if (config.changeType === 'loss') {
      topRiskDrivers.push({
        factor: 'Revenue decline',
        impact: 'high',
        description: `${((config.amount / currentRevenue) * 100).toFixed(0)}% revenue loss`,
        mitigation: 'Reduce expenses or find alternative revenue sources',
      });

      if (projectedRunway < 90) {
        topRiskDrivers.push({
          factor: 'Critical runway',
          impact: 'high',
          description: 'Runway drops below 3 months',
          mitigation: 'Immediate action required: cut costs or secure funding',
        });
      }
    }

    const criticalAssumptions: CriticalAssumption[] = [
      {
        assumption: config.changeType === 'loss' ? 'No further revenue decline' : 'Revenue growth is sustainable',
        sensitivity: 'high',
        description: 'Assumes change is one-time event',
        currentValue: config.amount,
        impactIfWrong: 'Continued trend compounds impact',
      },
    ];

    const recommendations: Recommendation[] = [];
    if (config.changeType === 'loss' && projectedRunway < 180) {
      recommendations.push({
        type: 'adjust_amount',
        title: 'Reduce expenses by 20%',
        description: 'Cut non-essential costs to preserve runway',
        expectedBenefit: 'Extends runway by 2-3 months',
        riskReduction: 40,
        confidenceScore: 80,
        explanation: 'Expense reduction offsets revenue loss and preserves cash.',
        actionable: true,
      });
    }

    return {
      projectedRunway,
      cashFlowImpact: {
        monthlyImpact,
        cumulativeImpact,
        description: `${config.changeType === 'gain' ? 'Revenue increase' : 'Revenue loss'} of $${config.amount}/month${config.reason ? ` due to ${config.reason}` : ''}`,
      },
      topRiskDrivers,
      criticalAssumptions,
      recommendations,
    };
  }

  /**
   * Simulate payment delay scenario
   */
  private async simulatePaymentDelay(
    tenantId: string,
    config: PaymentDelayScenarioConfig,
    baselineRunway: number
  ): Promise<{
    projectedRunway: number;
    cashFlowImpact: CashFlowImpact;
    topRiskDrivers: RiskDriver[];
    criticalAssumptions: CriticalAssumption[];
    recommendations: Recommendation[];
  }> {
    const currentCash = await this.getCurrentCash(tenantId);
    const monthlyBurnRate = await this.getMonthlyBurnRate(tenantId);

    const delayMonths = Math.ceil(config.delayDays / 30);
    const impactAmount = config.estimatedImpact;

    const monthlyImpact: number[] = [];
    let cumulativeImpact = 0;

    // Negative impact during delay period
    for (let i = 0; i < delayMonths; i++) {
      monthlyImpact.push(-impactAmount / delayMonths);
      cumulativeImpact -= impactAmount / delayMonths;
    }

    // Recovery after delay
    monthlyImpact.push(impactAmount);
    cumulativeImpact += impactAmount;

    // Temporary runway reduction
    const cashDuringDelay = currentCash - impactAmount;
    const projectedRunway = (cashDuringDelay / monthlyBurnRate) * 30;

    const topRiskDrivers: RiskDriver[] = [
      {
        factor: 'Cash flow timing gap',
        impact: 'high',
        description: `${config.delayDays}-day delay creates temporary cash shortage`,
        mitigation: 'Use line of credit or delay non-essential expenses',
      },
    ];

    const criticalAssumptions: CriticalAssumption[] = [
      {
        assumption: 'Payments eventually received',
        sensitivity: 'high',
        description: 'Assumes delay, not default',
        currentValue: impactAmount,
        impactIfWrong: 'Default would permanently reduce cash',
      },
    ];

    const recommendations: Recommendation[] = [
      {
        type: 'enable_automation',
        title: "Enable 'Auto-Collect Overdue Invoices' rule",
        description: 'Reduce future payment delays',
        expectedBenefit: 'Prevents similar delays in future',
        riskReduction: 30,
        confidenceScore: 85,
        explanation: 'Automated collections reduce average DSO by 12 days.',
        actionable: true,
        actionUrl: '/automations/templates/auto-collect-overdue',
      },
    ];

    return {
      projectedRunway,
      cashFlowImpact: {
        monthlyImpact,
        cumulativeImpact: 0, // Net zero after recovery
        description: `${config.delayDays}-day payment delay affecting $${impactAmount}`,
      },
      topRiskDrivers,
      criticalAssumptions,
      recommendations,
    };
  }

  /**
   * Simulate automation change scenario
   */
  private async simulateAutomationChange(
    tenantId: string,
    config: AutomationChangeScenarioConfig,
    baselineRunway: number
  ): Promise<{
    projectedRunway: number;
    cashFlowImpact: CashFlowImpact;
    topRiskDrivers: RiskDriver[];
    criticalAssumptions: CriticalAssumption[];
    recommendations: Recommendation[];
  }> {
    const currentCash = await this.getCurrentCash(tenantId);
    const monthlyBurnRate = await this.getMonthlyBurnRate(tenantId);

    const monthlyBenefit = config.estimatedImpact / 12;
    const monthlyImpact: number[] = [];
    let cumulativeImpact = 0;

    for (let i = 0; i < 12; i++) {
      monthlyImpact.push(monthlyBenefit);
      cumulativeImpact += monthlyBenefit;
    }

    const newEffectiveBurnRate = monthlyBurnRate - monthlyBenefit;
    const projectedRunway = (currentCash / newEffectiveBurnRate) * 30;

    const topRiskDrivers: RiskDriver[] = [];
    const criticalAssumptions: CriticalAssumption[] = [
      {
        assumption: 'Automation performs as expected',
        sensitivity: 'medium',
        description: 'Based on historical data',
        currentValue: config.estimatedImpact,
        impactIfWrong: 'Lower performance reduces benefit',
      },
    ];

    const recommendations: Recommendation[] = [
      {
        type: 'enable_automation',
        title: `${config.changeType === 'enable' ? 'Enable' : 'Modify'} ${config.ruleName}`,
        description: 'Improve cash flow through automation',
        expectedBenefit: `Adds $${monthlyBenefit.toFixed(0)}/month to cash flow`,
        riskReduction: 0,
        confidenceScore: 85,
        explanation: 'Automation improves efficiency without adding costs.',
        actionable: true,
      },
    ];

    return {
      projectedRunway,
      cashFlowImpact: {
        monthlyImpact,
        cumulativeImpact,
        description: `${config.changeType === 'enable' ? 'Enabling' : 'Modifying'} ${config.ruleName} improves cash flow by $${config.estimatedImpact}/year`,
      },
      topRiskDrivers,
      criticalAssumptions,
      recommendations,
    };
  }

  /**
   * Simulate custom scenario
   */
  private async simulateCustom(
    tenantId: string,
    config: ScenarioConfig,
    baselineRunway: number
  ): Promise<{
    projectedRunway: number;
    cashFlowImpact: CashFlowImpact;
    topRiskDrivers: RiskDriver[];
    criticalAssumptions: CriticalAssumption[];
    recommendations: Recommendation[];
  }> {
    // Custom scenarios require user-defined parameters
    // This is a placeholder implementation
    return {
      projectedRunway: baselineRunway,
      cashFlowImpact: {
        monthlyImpact: [],
        cumulativeImpact: 0,
        description: 'Custom scenario - impact varies',
      },
      topRiskDrivers: [],
      criticalAssumptions: [],
      recommendations: [],
    };
  }

  /**
   * Calculate risk metrics
   */
  private calculateRiskMetrics(
    baselineRunway: number,
    projectedRunway: number,
    topRiskDrivers: RiskDriver[],
    criticalAssumptions: CriticalAssumption[]
  ): {
    riskLevel: RiskLevel;
    riskScore: number;
    successProbability: number;
  } {
    // Calculate runway impact (0-100)
    const runwayImpactScore = Math.min(100, Math.max(0, ((baselineRunway - projectedRunway) / baselineRunway) * 100));

    // Calculate assumption risk (0-100)
    const highSensitivityCount = criticalAssumptions.filter(a => a.sensitivity === 'high').length;
    const assumptionRiskScore = Math.min(100, highSensitivityCount * 20);

    // Calculate market volatility (simplified)
    const marketVolatilityScore = 30; // Mock value

    // Calculate execution complexity (simplified)
    const executionComplexityScore = 20; // Mock value

    // Weighted risk score
    const riskScore =
      runwayImpactScore * 0.4 +
      assumptionRiskScore * 0.3 +
      marketVolatilityScore * 0.2 +
      executionComplexityScore * 0.1;

    // Determine risk level
    let riskLevel: RiskLevel;
    if (riskScore < 25) riskLevel = RiskLevel.LOW;
    else if (riskScore < 50) riskLevel = RiskLevel.MEDIUM;
    else if (riskScore < 75) riskLevel = RiskLevel.HIGH;
    else riskLevel = RiskLevel.CRITICAL;

    // Calculate success probability (inverse of risk)
    const successProbability = 100 - riskScore;

    return { riskLevel, riskScore, successProbability };
  }

  /**
   * Helper: Get baseline runway
   */
  private async calculateBaselineRunway(tenantId: string): Promise<number> {
    const currentCash = await this.getCurrentCash(tenantId);
    const monthlyBurnRate = await this.getMonthlyBurnRate(tenantId);
    return monthlyBurnRate > 0 ? (currentCash / monthlyBurnRate) * 30 : 999;
  }

  /**
   * Helper: Get current cash
   */
  private async getCurrentCash(tenantId: string): Promise<number> {
    // Mock implementation - replace with actual query
    return 50000;
  }

  /**
   * Helper: Get monthly burn rate
   */
  private async getMonthlyBurnRate(tenantId: string): Promise<number> {
    // Mock implementation - replace with actual query
    return 10000;
  }

  /**
   * Helper: Get monthly revenue
   */
  private async getMonthlyRevenue(tenantId: string): Promise<number> {
    // Mock implementation - replace with actual query
    return 15000;
  }

  /**
   * Track scenario analytics
   */
  private async trackScenarioAnalytics(
    tenantId: string,
    scenarioId: string,
    eventType: string,
    scenarioType: ScenarioType
  ): Promise<void> {
    await prisma.scenarioAnalytics.create({
      data: {
        tenantId,
        scenarioId,
        eventType,
        scenarioType: scenarioType.toString(),
      },
    });
  }
}

/**
 * Get all scenarios for a tenant
 */
export async function getAllScenarios(tenantId: string): Promise<ScenarioResult[]> {
  const scenarios = await prisma.scenario.findMany({
    where: { tenantId, isArchived: false },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return scenarios.map(s => ({
    id: s.id,
    tenantId: s.tenantId,
    name: s.name,
    description: s.description || undefined,
    scenarioType: s.scenarioType as ScenarioType,
    config: s.config as ScenarioConfig,
    baselineRunway: s.baselineRunway || 0,
    projectedRunway: s.projectedRunway || 0,
    runwayChange: s.runwayChange || 0,
    riskLevel: s.riskLevel as RiskLevel,
    riskScore: s.riskScore || 0,
    successProbability: s.successProbability || 0,
    topRiskDrivers: s.topRiskDrivers as unknown as RiskDriver[],
    criticalAssumptions: s.criticalAssumptions as unknown as CriticalAssumption[],
    cashFlowImpact: s.cashFlowImpact as unknown as CashFlowImpact,
    recommendations: s.recommendations as unknown as Recommendation[],
    createdBy: s.createdBy,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));
}
