/**
 * Trial Routes
 * API endpoints for trial management and activation milestones
 */

import { Router, Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { auth } from '../middleware/auth';
import { trialActivationService } from '../services/trial-activation.service';
import { logger } from '../utils/logger';

const router = Router();

// Apply auth middleware to all routes
router.use(auth);

/**
 * GET /api/trial/state
 * Get current trial state for the authenticated user
 */
router.get('/state', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const companyId = (req as any).user?.currentCompanyId;

    if (!companyId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'No company selected',
      });
    }

    const trialState = await trialActivationService.getTrialState(userId, companyId);

    res.json({
      success: true,
      data: trialState,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/trial/start
 * Start a new trial for the user
 */
router.post('/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const companyId = (req as any).user?.currentCompanyId;

    if (!companyId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'No company selected',
      });
    }

    const trialState = await trialActivationService.startTrial(userId, companyId);

    res.json({
      success: true,
      data: trialState,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/trial/milestone/:type
 * Complete a milestone
 */
router.post('/milestone/:type', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const { type } = req.params;

    await trialActivationService.completeMilestone(userId, type as any);

    res.json({
      success: true,
      message: 'Milestone completed',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/trial/convert
 * Convert trial to paid subscription
 */
router.post('/convert', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const { planType } = req.body;

    if (!planType || !['starter', 'pro', 'business', 'enterprise'].includes(planType)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Invalid plan type',
      });
    }

    await trialActivationService.convertTrial(userId, planType);

    res.json({
      success: true,
      message: 'Trial converted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/trial/analytics
 * Get trial analytics (admin only)
 */
router.get('/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = (req as any).user?.role;

    if (userRole !== 'ADMIN') {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Admin access required',
      });
    }

    const analytics = await trialActivationService.getTrialAnalytics();

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
