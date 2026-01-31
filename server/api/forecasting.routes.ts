/**
 * Forecasting API Routes
 * 
 * Secure API endpoints for forecast generation and retrieval
 * RBAC enforced, plan limits checked, rate limited
 */

import { Router, Response } from 'express';
import { ForecastingEngine, getAllForecasts } from '../forecasting/forecastingEngine.service';
import { 
  requirePermission, 
  Permission, 
  AuthenticatedRequest,
  auditLog 
} from '../middleware/rbac.middleware';
import { 
  checkForecastLimit,
  requireFeature 
} from '../middleware/planLimits.middleware';
import { 
  enforceTenantIsolation,
  TenantRequest 
} from '../middleware/tenantIsolation.middleware';
import { ForecastType } from '../forecasting/types';

const router = Router();
const forecastingEngine = new ForecastingEngine();

/**
 * GET /api/forecasts
 * Get all forecasts for authenticated user's tenant
 */
router.get(
  '/',
  enforceTenantIsolation(),
  requirePermission(Permission.VIEW_FORECASTS),
  auditLog('VIEW_FORECASTS'),
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      const forecasts = await getAllForecasts(req.user.tenantId);

      res.json({
        success: true,
        data: forecasts,
        meta: {
          count: forecasts.length,
          tenantId: req.user.tenantId,
        },
      });
    } catch (error) {
      console.error('Get forecasts error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve forecasts',
      });
    }
  }
);

/**
 * POST /api/forecasts/generate
 * Generate a new forecast
 */
router.post(
  '/generate',
  enforceTenantIsolation(),
  requirePermission(Permission.GENERATE_FORECASTS),
  requireFeature('canGenerateForecasts'),
  checkForecastLimit(),
  auditLog('GENERATE_FORECAST'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      const { forecastType, forecastHorizon } = req.body as {
        forecastType: ForecastType;
        forecastHorizon?: number;
      };

      // Validate forecast type
      if (!forecastType || !Object.values(ForecastType).includes(forecastType)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Valid forecast type required',
          validTypes: Object.values(ForecastType),
        });
        return;
      }

      // Generate forecast
      const forecast = await forecastingEngine.generateForecast(
        req.user.tenantId,
        forecastType,
        forecastHorizon
      );

      res.status(201).json({
        success: true,
        data: forecast,
        meta: {
          tenantId: req.user.tenantId,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Generate forecast error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to generate forecast',
      });
    }
  }
);

/**
 * GET /api/forecasts/:id
 * Get a specific forecast by ID
 */
router.get(
  '/:id',
  enforceTenantIsolation(),
  requirePermission(Permission.VIEW_FORECASTS),
  auditLog('VIEW_FORECAST_DETAIL'),
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
      const forecast = await req.tenantPrisma!.financialForecast.findUnique({
        where: { id },
      });

      if (!forecast) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Forecast not found',
        });
        return;
      }

      res.json({
        success: true,
        data: forecast,
      });
    } catch (error) {
      console.error('Get forecast detail error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve forecast',
      });
    }
  }
);

/**
 * GET /api/forecasts/types
 * Get available forecast types
 */
router.get(
  '/types',
  enforceTenantIsolation(),
  requirePermission(Permission.VIEW_FORECASTS),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const types = Object.values(ForecastType).map(type => ({
        type,
        name: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        description: getForecastTypeDescription(type),
      }));

      res.json({
        success: true,
        data: types,
      });
    } catch (error) {
      console.error('Get forecast types error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve forecast types',
      });
    }
  }
);

/**
 * Helper: Get forecast type description
 */
function getForecastTypeDescription(type: ForecastType): string {
  const descriptions: Record<ForecastType, string> = {
    [ForecastType.CASH_RUNWAY]: 'How many days until you run out of cash at current burn rate',
    [ForecastType.BURN_RATE]: 'Average monthly expenses over the last 90 days',
    [ForecastType.REVENUE_GROWTH]: 'Month-over-month revenue growth percentage',
    [ForecastType.EXPENSE_TRAJECTORY]: 'Projected future expenses based on historical trends',
    [ForecastType.PAYMENT_INFLOW]: 'Expected monthly payment inflow based on reliability',
  };

  return descriptions[type];
}

export default router;
