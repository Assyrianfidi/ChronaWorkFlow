/**
 * AI Routes
 * API endpoints for AI-powered features: categorization, copilot, forecasting, anomaly detection
 */

import { Router, Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { auth } from '../middleware/auth.js';
import { mlCategorizationEngine } from '../ai/ml-categorization-engine.js';
import { aiCFOCopilot } from '../ai/ai-cfo-copilot.js';
import { cashFlowForecastingEngine } from '../ai/cash-flow-forecasting.js';
import { anomalyDetectionEngine } from '../ai/anomaly-detection-engine.js';
import { pricingTierService } from '../services/pricing-tier.service.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Apply auth middleware to all routes
router.use(auth);

/**
 * POST /api/ai/categorize
 * Categorize a single transaction
 */
router.post('/categorize', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { description, amount, isDebit, date } = req.body;
    const userId = (req as any).user?.id;
    const companyId = (req as any).user?.currentCompanyId;

    // Check feature access
    const access = await pricingTierService.checkFeatureAccess(userId, 'ai_categorization');
    if (!access.allowed) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: access.message,
        upgradeRequired: access.upgradeRequired,
      });
    }

    const result = await mlCategorizationEngine.categorizeTransaction(
      description,
      amount,
      isDebit,
      date ? new Date(date) : undefined,
      companyId
    );

    // Track usage
    await pricingTierService.trackFeatureUsage(userId, 'ai_categorization');

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/ai/categorize/batch
 * Categorize multiple transactions
 */
router.post('/categorize/batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactions } = req.body;
    const userId = (req as any).user?.id;
    const companyId = (req as any).user?.currentCompanyId;

    // Check feature access
    const access = await pricingTierService.checkFeatureAccess(userId, 'ai_categorization');
    if (!access.allowed) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: access.message,
        upgradeRequired: access.upgradeRequired,
      });
    }

    const results = await mlCategorizationEngine.categorizeBatch(transactions, companyId);

    // Track usage
    await pricingTierService.trackFeatureUsage(userId, 'ai_categorization');

    res.json({
      success: true,
      data: {
        categorized: results.size,
        results: Object.fromEntries(results),
      },
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/ai/categorize/feedback
 * Provide feedback on categorization for model improvement
 */
router.post('/categorize/feedback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { description, amount, predictedCategory, actualCategory } = req.body;

    await mlCategorizationEngine.provideFeedback(
      description,
      amount,
      predictedCategory,
      actualCategory
    );

    res.json({
      success: true,
      message: 'Feedback recorded',
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/ai/categorize/accuracy
 * Get categorization accuracy report
 */
router.get('/categorize/accuracy', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = mlCategorizationEngine.getAccuracyReport();

    res.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/ai/copilot/ask
 * Ask the AI CFO Copilot a question
 */
router.post('/copilot', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = req.body;
    const userId: number = Number((req as any).user?.id);
    const companyId = (req as any).user?.currentCompanyId;

    if (!query) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Query is required',
      });
    }

    // Check feature access
    const access = await pricingTierService.checkFeatureAccess(userId, 'ai_copilot_queries');
    if (!access.allowed) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: access.message,
        upgradeRequired: access.upgradeRequired,
        currentUsage: access.currentUsage,
        limit: access.limit,
      });
    }

    const response = await aiCFOCopilot.askQuestion(query, companyId, userId);

    // Track usage (userId first, then featureName per service signature)
    await pricingTierService.trackFeatureUsage(userId, 'ai_copilot_queries');

    res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/ai/copilot/quick-insights
 * Get quick insights from AI CFO
 */
router.get('/copilot/quick-insights', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const companyId = (req as any).user?.currentCompanyId;

    // Check feature access
    const access = await pricingTierService.checkFeatureAccess(userId, 'ai_copilot_queries');
    if (!access.allowed) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: access.message,
        upgradeRequired: access.upgradeRequired,
      });
    }

    const insights = await aiCFOCopilot.getQuickInsights(companyId);

    res.json({
      success: true,
      data: insights,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/ai/forecast
 * Get cash flow forecast
 */
router.get('/forecast', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const companyId = (req as any).user?.currentCompanyId;
    const days = parseInt(req.query.days as string) || 30;

    // Check feature access
    const access = await pricingTierService.checkFeatureAccess(userId, 'cash_flow_forecast');
    if (!access.allowed) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: access.message,
        upgradeRequired: access.upgradeRequired,
      });
    }

    const forecast = await cashFlowForecastingEngine.generateForecast(companyId, days);

    // Track usage
    await pricingTierService.trackFeatureUsage(userId, 'cash_flow_forecast');

    res.json({
      success: true,
      data: forecast,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/ai/anomalies
 * Scan for anomalies
 */
router.get('/anomalies', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const companyId = (req as any).user?.currentCompanyId;
    const days = parseInt(req.query.days as string) || 90;

    // Check feature access
    const access = await pricingTierService.checkFeatureAccess(userId, 'anomaly_detection');
    if (!access.allowed) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: access.message,
        upgradeRequired: access.upgradeRequired,
      });
    }

    const result = await anomalyDetectionEngine.scanForAnomalies(companyId, days);

    // Track usage
    await pricingTierService.trackFeatureUsage(userId, 'anomaly_detection');

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/ai/anomalies/:id/resolve
 * Resolve an anomaly
 */
router.post('/anomalies/:id/resolve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { resolution, notes } = req.body;

    await anomalyDetectionEngine.resolveAnomaly(id, resolution, notes);

    res.json({
      success: true,
      message: 'Anomaly resolved',
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/ai/usage
 * Get AI feature usage for current user
 */
router.get('/usage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const companyId = (req as any).user?.currentCompanyId;

    const usage = await pricingTierService.getUsageMetrics(userId, companyId);
    const tier = await pricingTierService.getUserTier(userId);
    const tierConfig = pricingTierService.getTierConfig(tier);

    res.json({
      success: true,
      data: {
        tier,
        usage,
        limits: tierConfig?.limits,
      },
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
