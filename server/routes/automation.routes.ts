/**
 * Automation API Routes
 */

import { Router } from 'express';
import { requireAuth, requirePermission, AuthenticatedRequest } from '../auth/rbac/middleware';
import { Permission } from '../auth/rbac/permissions';
import { PrismaClient } from '../../generated/prisma';
import {
  executeAutomationRule,
  previewAutomationRule,
  triggerAutomations,
  getAutomationStats,
  checkAutomationLimits,
} from '../automation/automationEngine';
import { generateAllInsights, saveInsights, getActiveInsights, dismissInsight } from '../automation/smartInsights';
import { AutomationTriggerType } from '../automation/types';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/automation/rules
 * 
 * Get all automation rules for tenant
 */
router.get(
  '/rules',
  requireAuth,
  requirePermission(Permission.VIEW_AUTOMATIONS),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { tenantId } = req.user!;
      const { status } = req.query;

      const where: any = { tenantId };
      if (status) where.status = status;

      const rules = await prisma.automationRule.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: rules,
      });
    } catch (error: any) {
      console.error('[ERROR] Failed to fetch automation rules:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch automation rules',
      });
    }
  }
);

/**
 * POST /api/automation/rules
 * 
 * Create new automation rule
 */
router.post(
  '/rules',
  requireAuth,
  requirePermission(Permission.CREATE_AUTOMATION),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { tenantId, id: userId } = req.user!;
      const { name, description, triggerType, triggerConfig, conditions, actions, requiresApproval } = req.body;

      // Validate required fields
      if (!name || !triggerType || !actions) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Missing required fields: name, triggerType, actions',
        });
        return;
      }

      // Check automation limits
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { plan: true },
      });

      const limits = await checkAutomationLimits(tenantId, tenant?.plan || 'FREE');
      if (!limits.withinLimits) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Automation limit reached for your plan',
          limits,
        });
        return;
      }

      // Create rule
      const rule = await prisma.automationRule.create({
        data: {
          tenantId,
          name,
          description,
          triggerType,
          triggerConfig: triggerConfig || {},
          conditions: conditions || [],
          actions,
          status: 'DRAFT',
          requiresApproval: requiresApproval || false,
          createdBy: userId,
        },
      });

      res.json({
        success: true,
        data: rule,
      });
    } catch (error: any) {
      console.error('[ERROR] Failed to create automation rule:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create automation rule',
      });
    }
  }
);

/**
 * PUT /api/automation/rules/:id
 * 
 * Update automation rule
 */
router.put(
  '/rules/:id',
  requireAuth,
  requirePermission(Permission.EDIT_AUTOMATION),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { tenantId, id: userId } = req.user!;
      const { id } = req.params;
      const updates = req.body;

      // Verify rule belongs to tenant
      const rule = await prisma.automationRule.findFirst({
        where: { id, tenantId },
      });

      if (!rule) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Automation rule not found',
        });
        return;
      }

      // Update rule
      const updatedRule = await prisma.automationRule.update({
        where: { id },
        data: {
          ...updates,
          updatedBy: userId,
        },
      });

      res.json({
        success: true,
        data: updatedRule,
      });
    } catch (error: any) {
      console.error('[ERROR] Failed to update automation rule:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update automation rule',
      });
    }
  }
);

/**
 * DELETE /api/automation/rules/:id
 * 
 * Delete automation rule
 */
router.delete(
  '/rules/:id',
  requireAuth,
  requirePermission(Permission.DELETE_AUTOMATION),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { tenantId } = req.user!;
      const { id } = req.params;

      // Verify rule belongs to tenant
      const rule = await prisma.automationRule.findFirst({
        where: { id, tenantId },
      });

      if (!rule) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Automation rule not found',
        });
        return;
      }

      await prisma.automationRule.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Automation rule deleted',
      });
    } catch (error: any) {
      console.error('[ERROR] Failed to delete automation rule:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete automation rule',
      });
    }
  }
);

/**
 * POST /api/automation/rules/:id/preview
 * 
 * Preview automation rule execution (dry-run)
 */
router.post(
  '/rules/:id/preview',
  requireAuth,
  requirePermission(Permission.VIEW_AUTOMATIONS),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { tenantId } = req.user!;
      const { id } = req.params;
      const { sampleData } = req.body;

      // Verify rule belongs to tenant
      const rule = await prisma.automationRule.findFirst({
        where: { id, tenantId },
      });

      if (!rule) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Automation rule not found',
        });
        return;
      }

      const result = await previewAutomationRule(id, sampleData || {});

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[ERROR] Failed to preview automation:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to preview automation',
      });
    }
  }
);

/**
 * POST /api/automation/rules/:id/execute
 * 
 * Manually execute automation rule
 */
router.post(
  '/rules/:id/execute',
  requireAuth,
  requirePermission(Permission.EXECUTE_AUTOMATION),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { tenantId, id: userId } = req.user!;
      const { id } = req.params;
      const { triggerData } = req.body;

      // Verify rule belongs to tenant
      const rule = await prisma.automationRule.findFirst({
        where: { id, tenantId },
      });

      if (!rule) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Automation rule not found',
        });
        return;
      }

      const result = await executeAutomationRule(
        id,
        {
          triggerType: AutomationTriggerType.MANUAL,
          timestamp: new Date(),
          data: triggerData || {},
          triggeredBy: userId,
        },
        false
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[ERROR] Failed to execute automation:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to execute automation',
      });
    }
  }
);

/**
 * GET /api/automation/executions
 * 
 * Get automation execution history
 */
router.get(
  '/executions',
  requireAuth,
  requirePermission(Permission.VIEW_AUTOMATIONS),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { tenantId } = req.user!;
      const { ruleId, status, limit = 50, offset = 0 } = req.query;

      const where: any = { tenantId };
      if (ruleId) where.ruleId = ruleId;
      if (status) where.status = status;

      const [executions, total] = await Promise.all([
        prisma.automationExecution.findMany({
          where,
          include: {
            rule: {
              select: {
                id: true,
                name: true,
                triggerType: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: Number(limit),
          skip: Number(offset),
        }),
        prisma.automationExecution.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          executions,
          total,
          limit: Number(limit),
          offset: Number(offset),
        },
      });
    } catch (error: any) {
      console.error('[ERROR] Failed to fetch executions:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch executions',
      });
    }
  }
);

/**
 * GET /api/automation/stats
 * 
 * Get automation statistics
 */
router.get(
  '/stats',
  requireAuth,
  requirePermission(Permission.VIEW_AUTOMATIONS),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { tenantId } = req.user!;
      const { startDate, endDate } = req.query;

      const stats = await getAutomationStats(
        tenantId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('[ERROR] Failed to fetch stats:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch stats',
      });
    }
  }
);

/**
 * GET /api/automation/templates
 * 
 * Get automation templates
 */
router.get(
  '/templates',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { category } = req.query;

      const where: any = { isPublic: true };
      if (category) where.category = category;

      const templates = await prisma.automationTemplate.findMany({
        where,
        orderBy: { popularity: 'desc' },
      });

      res.json({
        success: true,
        data: templates,
      });
    } catch (error: any) {
      console.error('[ERROR] Failed to fetch templates:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch templates',
      });
    }
  }
);

/**
 * GET /api/automation/insights
 * 
 * Get smart insights
 */
router.get(
  '/insights',
  requireAuth,
  requirePermission(Permission.VIEW_INSIGHTS),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { tenantId } = req.user!;
      const { severity } = req.query;

      const insights = await getActiveInsights(tenantId, severity as string);

      res.json({
        success: true,
        data: insights,
      });
    } catch (error: any) {
      console.error('[ERROR] Failed to fetch insights:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch insights',
      });
    }
  }
);

/**
 * POST /api/automation/insights/generate
 * 
 * Generate new insights
 */
router.post(
  '/insights/generate',
  requireAuth,
  requirePermission(Permission.GENERATE_INSIGHTS),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { tenantId } = req.user!;

      const insights = await generateAllInsights(tenantId);
      await saveInsights(tenantId, insights);

      res.json({
        success: true,
        data: {
          generated: insights.length,
          insights,
        },
      });
    } catch (error: any) {
      console.error('[ERROR] Failed to generate insights:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to generate insights',
      });
    }
  }
);

/**
 * POST /api/automation/insights/:id/dismiss
 * 
 * Dismiss an insight
 */
router.post(
  '/insights/:id/dismiss',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id: userId } = req.user!;
      const { id } = req.params;
      const { reason } = req.body;

      await dismissInsight(id, userId, reason);

      res.json({
        success: true,
        message: 'Insight dismissed',
      });
    } catch (error: any) {
      console.error('[ERROR] Failed to dismiss insight:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to dismiss insight',
      });
    }
  }
);

/**
 * GET /api/automation/limits
 * 
 * Get automation limits for current plan
 */
router.get(
  '/limits',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { tenantId } = req.user!;

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { plan: true },
      });

      const limits = await checkAutomationLimits(tenantId, tenant?.plan || 'FREE');

      res.json({
        success: true,
        data: limits,
      });
    } catch (error: any) {
      console.error('[ERROR] Failed to fetch limits:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch limits',
      });
    }
  }
);

export default router;
