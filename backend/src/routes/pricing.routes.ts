/**
 * Pricing Routes
 * API endpoints for pricing tiers and subscription management
 */

import { Router, Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { auth } from '../middleware/auth.js';
import { pricingTierService } from '../services/pricing-tier.service.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/pricing/tiers
 * Get all pricing tiers (public)
 */
router.get('/tiers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tiers = pricingTierService.getAllTierConfigs();

    res.json({
      success: true,
      data: tiers,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/pricing/compare
 * Compare two pricing tiers
 */
router.get('/compare', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Both "from" and "to" tier parameters are required',
      });
    }

    const comparison = pricingTierService.getTierComparison(
      from as any,
      to as any
    );

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error: any) {
    next(error);
  }
});

// Protected routes below
router.use(auth);

/**
 * GET /api/pricing/current
 * Get current user's tier and usage
 */
router.get('/current', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const companyId = (req as any).user?.currentCompanyId;

    const tier = await pricingTierService.getUserTier(userId);
    const tierConfig = pricingTierService.getTierConfig(tier);
    
    let usage = null;
    let limits = null;
    
    if (companyId) {
      usage = await pricingTierService.getUsageMetrics(userId, companyId);
      await pricingTierService.checkTierLimits(userId, companyId || '');
      const result = { success: true, warnings: [] };
    }

    res.json({
      success: true,
      data: {
        tier,
        tierConfig,
        usage,
        limits,
      },
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/pricing/feature/:featureName
 * Check if user has access to a specific feature
 */
router.get('/feature/:featureName', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const { featureName } = req.params;

    const access = await pricingTierService.checkFeatureAccess(userId, featureName as any);

    res.json({
      success: true,
      data: access,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/pricing/upgrade-triggers
 * Get upgrade triggers for current user
 */
router.get('/upgrade-triggers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const companyId = (req as any).user?.currentCompanyId;

    if (!companyId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'No company selected',
      });
    }

    const triggers = await pricingTierService.getUpgradeTriggers(userId, companyId);

    res.json({
      success: true,
      data: triggers,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/pricing/upgrade
 * Upgrade user to a new tier
 */
router.post('/upgrade', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const { tier, subscriptionId } = req.body;

    if (!tier || !['starter', 'pro', 'business', 'enterprise'].includes(tier)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Invalid tier',
      });
    }

    await pricingTierService.upgradeTier(userId, tier, subscriptionId);

    res.json({
      success: true,
      message: 'Tier upgraded successfully',
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/pricing/downgrade
 * Downgrade user to a lower tier
 */
router.post('/downgrade', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const { tier } = req.body;

    if (!tier || !['starter', 'pro', 'business'].includes(tier)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Invalid tier',
      });
    }

    await pricingTierService.downgradeTier(userId, tier);

    res.json({
      success: true,
      message: 'Tier downgraded successfully',
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/pricing/track-usage
 * Track feature usage
 */
router.post('/track-usage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const { featureName } = req.body;

    if (!featureName) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Feature name is required',
      });
    }

    await pricingTierService.trackFeatureUsage(userId, featureName);

    res.json({
      success: true,
      message: 'Usage tracked',
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
