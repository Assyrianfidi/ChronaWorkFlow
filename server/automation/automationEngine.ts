/**
 * Automation Engine - Core Orchestrator
 * 
 * Evaluates rules, executes actions, and manages automation lifecycle
 */

import { PrismaClient } from '../../generated/prisma';
import {
  AutomationTriggerType,
  TriggerContext,
  AutomationExecutionContext,
  PLAN_LIMITS,
} from './types';
import { evaluateConditions, buildConditionExplanation } from './conditionEvaluator';
import { executeActions, executeActionWithRetry } from './actionExecutor';
import { logAuthorizationEvent } from '../services/auditLog.service';

const prisma = new PrismaClient();

/**
 * Execute an automation rule
 */
export async function executeAutomationRule(
  ruleId: string,
  triggerContext: TriggerContext,
  isDryRun: boolean = false
): Promise<AutomationExecutionContext> {
  const startTime = new Date();

  try {
    // Load rule
    const rule = await prisma.automationRule.findUnique({
      where: { id: ruleId },
      include: { tenant: true },
    });

    if (!rule) {
      throw new Error(`Automation rule not found: ${ruleId}`);
    }

    // Check if rule is active
    if (rule.status !== 'ACTIVE' && !isDryRun) {
      throw new Error(`Automation rule is not active: ${rule.status}`);
    }

    // Check plan limits
    const planLimits = PLAN_LIMITS[rule.tenant.plan];
    if (!planLimits) {
      throw new Error(`Invalid subscription plan: ${rule.tenant.plan}`);
    }

    // Check if trigger type is allowed for plan
    if (!planLimits.allowedTriggers.includes(rule.triggerType as AutomationTriggerType)) {
      throw new Error(
        `Trigger type ${rule.triggerType} not allowed for plan ${rule.tenant.plan}`
      );
    }

    // Check monthly execution limit
    if (planLimits.maxExecutionsPerMonth !== -1 && !isDryRun) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const executionCount = await prisma.automationExecution.count({
        where: {
          tenantId: rule.tenantId,
          createdAt: { gte: monthStart },
          isDryRun: false,
        },
      });

      if (executionCount >= planLimits.maxExecutionsPerMonth) {
        throw new Error(
          `Monthly execution limit reached: ${planLimits.maxExecutionsPerMonth}`
        );
      }
    }

    // Evaluate conditions
    const conditions = rule.conditions as any[];
    const { met: conditionsMet, results: conditionResults } = evaluateConditions(
      conditions,
      triggerContext.data
    );

    const conditionExplanation = buildConditionExplanation(conditionResults);

    console.log(`[AUTOMATION] Rule ${rule.name} - Conditions ${conditionsMet ? 'MET' : 'NOT MET'}`);
    console.log(conditionExplanation);

    // Execute actions if conditions are met
    let actionResults: any[] = [];
    if (conditionsMet || isDryRun) {
      const actions = rule.actions as any[];

      // Filter actions based on plan limits
      const allowedActions = actions.filter((action) =>
        planLimits.allowedActions.includes(action.type)
      );

      if (allowedActions.length < actions.length) {
        console.log(
          `[AUTOMATION] Filtered ${actions.length - allowedActions.length} actions not allowed for plan ${rule.tenant.plan}`
        );
      }

      actionResults = await executeActions(allowedActions, triggerContext.data, isDryRun);
    }

    const endTime = new Date();
    const executionTime = endTime.getTime() - startTime.getTime();

    // Create execution record
    const execution = await prisma.automationExecution.create({
      data: {
        ruleId: rule.id,
        tenantId: rule.tenantId,
        status: conditionsMet ? 'SUCCESS' : 'SKIPPED',
        triggeredBy: triggerContext.triggeredBy,
        triggerData: triggerContext.data,
        conditionsEvaluated: conditionResults,
        conditionsMet,
        actionsExecuted: actionResults,
        isDryRun,
        executionTime,
        completedAt: endTime,
      },
    });

    // Update rule statistics
    if (!isDryRun) {
      await prisma.automationRule.update({
        where: { id: rule.id },
        data: {
          lastTriggered: new Date(),
          executionCount: { increment: 1 },
          successCount: conditionsMet ? { increment: 1 } : undefined,
        },
      });
    }

    // Log to audit trail
    await logAuthorizationEvent({
      tenantId: rule.tenantId,
      userId: triggerContext.triggeredBy || 'system',
      action: 'AUTOMATION_EXECUTED',
      resource: 'automation_rule',
      resourceId: rule.id,
      allowed: true,
      metadata: {
        ruleName: rule.name,
        triggerType: rule.triggerType,
        conditionsMet,
        actionsExecuted: actionResults.length,
        isDryRun,
      },
    });

    return {
      ruleId: rule.id,
      tenantId: rule.tenantId,
      trigger: triggerContext,
      conditionResults,
      actionResults,
      isDryRun,
      startTime,
      endTime,
    };
  } catch (error: any) {
    console.error('[AUTOMATION] Execution failed:', error);

    // Create failed execution record
    await prisma.automationExecution.create({
      data: {
        ruleId,
        tenantId: triggerContext.data.tenantId || 'unknown',
        status: 'FAILED',
        triggeredBy: triggerContext.triggeredBy,
        triggerData: triggerContext.data,
        conditionsEvaluated: [],
        conditionsMet: false,
        actionsExecuted: [],
        isDryRun,
        errorMessage: error.message,
        executionTime: Date.now() - startTime.getTime(),
        completedAt: new Date(),
      },
    });

    throw error;
  }
}

/**
 * Find and execute all automation rules matching a trigger
 */
export async function triggerAutomations(
  tenantId: string,
  triggerType: AutomationTriggerType,
  triggerData: Record<string, any>,
  triggeredBy?: string
): Promise<AutomationExecutionContext[]> {
  // Find all active rules for this trigger type
  const rules = await prisma.automationRule.findMany({
    where: {
      tenantId,
      triggerType: triggerType as any,
      status: 'ACTIVE',
    },
  });

  console.log(`[AUTOMATION] Found ${rules.length} rules for trigger ${triggerType}`);

  const triggerContext: TriggerContext = {
    triggerType,
    timestamp: new Date(),
    data: { ...triggerData, tenantId },
    triggeredBy,
  };

  // Execute all matching rules
  const results: AutomationExecutionContext[] = [];

  for (const rule of rules) {
    try {
      const result = await executeAutomationRule(rule.id, triggerContext, false);
      results.push(result);
    } catch (error: any) {
      console.error(`[AUTOMATION] Failed to execute rule ${rule.id}:`, error.message);
    }
  }

  return results;
}

/**
 * Execute automation rule in dry-run mode (preview)
 */
export async function previewAutomationRule(
  ruleId: string,
  sampleData: Record<string, any>
): Promise<AutomationExecutionContext> {
  const triggerContext: TriggerContext = {
    triggerType: AutomationTriggerType.MANUAL,
    timestamp: new Date(),
    data: sampleData,
  };

  return executeAutomationRule(ruleId, triggerContext, true);
}

/**
 * Retry failed automation execution
 */
export async function retryAutomationExecution(executionId: string): Promise<void> {
  const execution = await prisma.automationExecution.findUnique({
    where: { id: executionId },
    include: { rule: true },
  });

  if (!execution) {
    throw new Error(`Execution not found: ${executionId}`);
  }

  if (execution.status !== 'FAILED') {
    throw new Error(`Execution is not in FAILED status: ${execution.status}`);
  }

  // Check retry count
  if (execution.retryCount >= 3) {
    throw new Error('Maximum retry count reached');
  }

  const triggerContext: TriggerContext = {
    triggerType: execution.rule.triggerType as AutomationTriggerType,
    timestamp: new Date(),
    data: execution.triggerData as Record<string, any>,
    triggeredBy: execution.triggeredBy || undefined,
  };

  // Update retry count
  await prisma.automationExecution.update({
    where: { id: executionId },
    data: {
      retryCount: { increment: 1 },
      status: 'PENDING',
    },
  });

  // Execute rule
  await executeAutomationRule(execution.ruleId, triggerContext, false);
}

/**
 * Get automation execution statistics
 */
export async function getAutomationStats(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
): Promise<any> {
  const where: any = { tenantId };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [total, successful, failed, skipped] = await Promise.all([
    prisma.automationExecution.count({ where }),
    prisma.automationExecution.count({ where: { ...where, status: 'SUCCESS' } }),
    prisma.automationExecution.count({ where: { ...where, status: 'FAILED' } }),
    prisma.automationExecution.count({ where: { ...where, status: 'SKIPPED' } }),
  ]);

  const successRate = total > 0 ? (successful / total) * 100 : 0;

  return {
    total,
    successful,
    failed,
    skipped,
    successRate: Math.round(successRate * 100) / 100,
  };
}

/**
 * Check if tenant has reached automation limits
 */
export async function checkAutomationLimits(
  tenantId: string,
  plan: string
): Promise<{
  activeRules: number;
  maxActiveRules: number;
  executionsThisMonth: number;
  maxExecutionsPerMonth: number;
  withinLimits: boolean;
}> {
  const planLimits = PLAN_LIMITS[plan];

  const activeRules = await prisma.automationRule.count({
    where: { tenantId, status: 'ACTIVE' },
  });

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const executionsThisMonth = await prisma.automationExecution.count({
    where: {
      tenantId,
      createdAt: { gte: monthStart },
      isDryRun: false,
    },
  });

  const withinLimits =
    (planLimits.maxActiveRules === -1 || activeRules < planLimits.maxActiveRules) &&
    (planLimits.maxExecutionsPerMonth === -1 ||
      executionsThisMonth < planLimits.maxExecutionsPerMonth);

  return {
    activeRules,
    maxActiveRules: planLimits.maxActiveRules,
    executionsThisMonth,
    maxExecutionsPerMonth: planLimits.maxExecutionsPerMonth,
    withinLimits,
  };
}
