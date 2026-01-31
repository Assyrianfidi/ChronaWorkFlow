/**
 * Scenario API Routes
 * 
 * Secure API endpoints for scenario simulation
 * RBAC enforced, plan limits checked, rate limited
 */

import { Router, Response } from 'express';
import { ScenarioEngine, getAllScenarios } from '../forecasting/scenarioEngine.service';
import { 
  requirePermission, 
  Permission, 
  AuthenticatedRequest,
  auditLog 
} from '../middleware/rbac.middleware';
import { 
  checkScenarioLimit,
  requireFeature 
} from '../middleware/planLimits.middleware';
import { 
  enforceTenantIsolation,
  TenantRequest 
} from '../middleware/tenantIsolation.middleware';
import { ScenarioType, CreateScenarioRequest } from '../forecasting/types';

const router = Router();
const scenarioEngine = new ScenarioEngine();

/**
 * GET /api/scenarios
 * Get all scenarios for authenticated user's tenant
 */
router.get(
  '/',
  enforceTenantIsolation(),
  requirePermission(Permission.VIEW_SCENARIOS),
  auditLog('VIEW_SCENARIOS'),
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      const scenarios = await getAllScenarios(req.user.tenantId);

      res.json({
        success: true,
        data: scenarios,
        meta: {
          count: scenarios.length,
          tenantId: req.user.tenantId,
        },
      });
    } catch (error) {
      console.error('Get scenarios error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve scenarios',
      });
    }
  }
);

/**
 * POST /api/scenarios
 * Create and simulate a new scenario
 */
router.post(
  '/',
  enforceTenantIsolation(),
  requirePermission(Permission.CREATE_SCENARIO),
  requireFeature('canCreateScenarios'),
  checkScenarioLimit(),
  auditLog('CREATE_SCENARIO'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      const { name, description, scenarioType, config } = req.body as CreateScenarioRequest;

      // Validate required fields
      if (!name || !scenarioType || !config) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Name, scenario type, and config are required',
        });
        return;
      }

      // Validate scenario type
      if (!Object.values(ScenarioType).includes(scenarioType)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid scenario type',
          validTypes: Object.values(ScenarioType),
        });
        return;
      }

      // Create and simulate scenario
      const scenario = await scenarioEngine.createScenario({
        tenantId: req.user.tenantId,
        name,
        description,
        scenarioType,
        config,
      });

      res.status(201).json({
        success: true,
        data: scenario,
        meta: {
          tenantId: req.user.tenantId,
          createdAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Create scenario error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create scenario',
      });
    }
  }
);

/**
 * GET /api/scenarios/:id
 * Get a specific scenario by ID
 */
router.get(
  '/:id',
  enforceTenantIsolation(),
  requirePermission(Permission.VIEW_SCENARIOS),
  auditLog('VIEW_SCENARIO_DETAIL'),
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      const { id } = req.params;

      // Use tenant-scoped Prisma client
      const scenario = await req.tenantPrisma!.scenario.findUnique({
        where: { id },
      });

      if (!scenario) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Scenario not found',
        });
        return;
      }

      res.json({
        success: true,
        data: scenario,
      });
    } catch (error) {
      console.error('Get scenario detail error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve scenario',
      });
    }
  }
);

/**
 * DELETE /api/scenarios/:id
 * Archive a scenario
 */
router.delete(
  '/:id',
  enforceTenantIsolation(),
  requirePermission(Permission.DELETE_SCENARIO),
  auditLog('DELETE_SCENARIO'),
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      const { id } = req.params;

      // Archive scenario (soft delete)
      const scenario = await req.tenantPrisma!.scenario.update({
        where: { id },
        data: { isArchived: true },
      });

      res.json({
        success: true,
        data: scenario,
        message: 'Scenario archived successfully',
      });
    } catch (error) {
      console.error('Delete scenario error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete scenario',
      });
    }
  }
);

/**
 * GET /api/scenarios/types
 * Get available scenario types
 */
router.get(
  '/types',
  enforceTenantIsolation(),
  requirePermission(Permission.VIEW_SCENARIOS),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const types = Object.values(ScenarioType).map(type => ({
        type,
        name: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        description: getScenarioTypeDescription(type),
        icon: getScenarioTypeIcon(type),
      }));

      res.json({
        success: true,
        data: types,
      });
    } catch (error) {
      console.error('Get scenario types error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve scenario types',
      });
    }
  }
);

/**
 * Helper: Get scenario type description
 */
function getScenarioTypeDescription(type: ScenarioType): string {
  const descriptions: Record<ScenarioType, string> = {
    [ScenarioType.HIRING]: 'Model the financial impact of hiring a new employee',
    [ScenarioType.LARGE_PURCHASE]: 'Analyze the effect of a major purchase or recurring expense',
    [ScenarioType.REVENUE_CHANGE]: 'Simulate revenue growth or decline scenarios',
    [ScenarioType.PAYMENT_DELAY]: 'Assess the impact of delayed customer payments',
    [ScenarioType.AUTOMATION_CHANGE]: 'Evaluate efficiency gains from automation',
    [ScenarioType.CUSTOM]: 'Create a custom scenario with your own parameters',
  };

  return descriptions[type];
}

/**
 * Helper: Get scenario type icon
 */
function getScenarioTypeIcon(type: ScenarioType): string {
  const icons: Record<ScenarioType, string> = {
    [ScenarioType.HIRING]: 'user-plus',
    [ScenarioType.LARGE_PURCHASE]: 'shopping-cart',
    [ScenarioType.REVENUE_CHANGE]: 'trending-up',
    [ScenarioType.PAYMENT_DELAY]: 'clock',
    [ScenarioType.AUTOMATION_CHANGE]: 'zap',
    [ScenarioType.CUSTOM]: 'settings',
  };

  return icons[type];
}

export default router;
