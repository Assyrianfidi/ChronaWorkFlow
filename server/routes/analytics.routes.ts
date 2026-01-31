/**
 * Feature Flag Analytics API Routes
 */

import { Router } from 'express';
import { requireAuth, requireRole, AuthenticatedRequest } from '../auth/rbac/middleware';
import { UserRole } from '../auth/rbac/permissions';
import { PrismaClient } from '../../generated/prisma';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/analytics/events
 * 
 * Ingest analytics events (batched)
 */
router.post('/events', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { events } = req.body;
    const { id: userId, tenantId } = req.user!;

    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Events array is required',
      });
      return;
    }

    // Validate and enrich events
    const validEvents = events
      .filter((event) => {
        return (
          event.featureFlag &&
          event.eventType &&
          event.userId === userId // Security: Verify user ID
        );
      })
      .map((event) => ({
        eventId: event.eventId,
        eventType: event.eventType,
        featureFlag: event.featureFlag,
        featureName: event.featureName,
        userId: event.userId,
        userRole: event.userRole,
        tenantId,
        sessionId: event.sessionId,
        metadata: event.metadata || {},
        timestamp: new Date(event.timestamp),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }));

    if (validEvents.length === 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'No valid events provided',
      });
      return;
    }

    // Insert events (non-blocking, fire-and-forget)
    prisma.analyticsEvent
      .createMany({
        data: validEvents,
        skipDuplicates: true,
      })
      .catch((error) => {
        console.error('[ANALYTICS] Failed to insert events:', error);
      });

    res.json({
      success: true,
      data: {
        received: events.length,
        processed: validEvents.length,
      },
    });
  } catch (error) {
    console.error('[ERROR] Analytics ingestion failed:', error);
    // Don't fail the request - analytics should not block user experience
    res.json({
      success: true,
      data: { received: 0, processed: 0 },
    });
  }
});

/**
 * GET /api/analytics/features/adoption
 * 
 * Get feature adoption metrics
 */
router.get(
  '/features/adoption',
  requireAuth,
  requireRole([UserRole.OWNER, UserRole.ADMIN]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { tenantId } = req.user!;
      const { startDate, endDate, featureFlag } = req.query;

      const where: any = { tenantId };

      if (startDate) {
        where.timestamp = { ...where.timestamp, gte: new Date(startDate as string) };
      }
      if (endDate) {
        where.timestamp = { ...where.timestamp, lte: new Date(endDate as string) };
      }
      if (featureFlag) {
        where.featureFlag = featureFlag;
      }

      // Get aggregated metrics
      const events = await prisma.analyticsEvent.findMany({
        where,
        select: {
          featureFlag: true,
          featureName: true,
          eventType: true,
          userId: true,
        },
      });

      // Calculate adoption metrics
      const metrics = calculateAdoptionMetrics(events);

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      console.error('[ERROR] Failed to fetch adoption metrics:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch adoption metrics',
      });
    }
  }
);

/**
 * GET /api/analytics/features/usage-by-role
 * 
 * Get feature usage breakdown by role
 */
router.get(
  '/features/usage-by-role',
  requireAuth,
  requireRole([UserRole.OWNER, UserRole.ADMIN]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { tenantId } = req.user!;
      const { featureFlag } = req.query;

      if (!featureFlag) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'featureFlag parameter is required',
        });
        return;
      }

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const events = await prisma.analyticsEvent.findMany({
        where: {
          tenantId,
          featureFlag: featureFlag as string,
          timestamp: { gte: thirtyDaysAgo },
        },
        select: {
          userRole: true,
          eventType: true,
          userId: true,
        },
      });

      const usageByRole = calculateUsageByRole(events);

      res.json({
        success: true,
        data: usageByRole,
      });
    } catch (error) {
      console.error('[ERROR] Failed to fetch usage by role:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch usage by role',
      });
    }
  }
);

/**
 * GET /api/analytics/features/health
 * 
 * Get feature health metrics for all features
 */
router.get(
  '/features/health',
  requireAuth,
  requireRole([UserRole.OWNER, UserRole.ADMIN]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { tenantId } = req.user!;

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const events = await prisma.analyticsEvent.findMany({
        where: {
          tenantId,
          timestamp: { gte: thirtyDaysAgo },
        },
        select: {
          featureFlag: true,
          featureName: true,
          eventType: true,
          userId: true,
        },
      });

      const healthMetrics = calculateFeatureHealth(events);

      res.json({
        success: true,
        data: healthMetrics,
      });
    } catch (error) {
      console.error('[ERROR] Failed to fetch feature health:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch feature health',
      });
    }
  }
);

// Helper functions

function calculateAdoptionMetrics(events: any[]) {
  const byFeature = new Map<string, any>();

  events.forEach((event) => {
    const key = event.featureFlag;
    if (!byFeature.has(key)) {
      byFeature.set(key, {
        featureFlag: event.featureFlag,
        featureName: event.featureName,
        uniqueUsers: new Set(),
        viewedUsers: new Set(),
        clickedUsers: new Set(),
        activeUsers: new Set(),
        totalEvents: 0,
      });
    }

    const metrics = byFeature.get(key);
    metrics.uniqueUsers.add(event.userId);
    metrics.totalEvents++;

    if (event.eventType === 'VIEWED') {
      metrics.viewedUsers.add(event.userId);
    } else if (event.eventType === 'CLICKED') {
      metrics.clickedUsers.add(event.userId);
    } else if (event.eventType === 'USED') {
      metrics.activeUsers.add(event.userId);
    }
  });

  return Array.from(byFeature.values()).map((metrics) => ({
    featureFlag: metrics.featureFlag,
    featureName: metrics.featureName,
    uniqueUsers: metrics.uniqueUsers.size,
    totalEvents: metrics.totalEvents,
    viewedUsers: metrics.viewedUsers.size,
    clickedUsers: metrics.clickedUsers.size,
    activeUsers: metrics.activeUsers.size,
    adoptionRate:
      metrics.uniqueUsers.size > 0
        ? (metrics.activeUsers.size / metrics.uniqueUsers.size) * 100
        : 0,
  }));
}

function calculateUsageByRole(events: any[]) {
  const byRole = new Map<string, any>();

  events.forEach((event) => {
    const key = event.userRole;
    if (!byRole.has(key)) {
      byRole.set(key, {
        userRole: key,
        uniqueUsers: new Set(),
        totalEvents: 0,
        usedEvents: 0,
      });
    }

    const metrics = byRole.get(key);
    metrics.uniqueUsers.add(event.userId);
    metrics.totalEvents++;

    if (event.eventType === 'USED') {
      metrics.usedEvents++;
    }
  });

  return Array.from(byRole.values()).map((metrics) => ({
    userRole: metrics.userRole,
    uniqueUsers: metrics.uniqueUsers.size,
    totalEvents: metrics.totalEvents,
    usageRate: metrics.totalEvents > 0 ? (metrics.usedEvents / metrics.totalEvents) * 100 : 0,
  }));
}

function calculateFeatureHealth(events: any[]) {
  const byFeature = new Map<string, any>();

  events.forEach((event) => {
    const key = event.featureFlag;
    if (!byFeature.has(key)) {
      byFeature.set(key, {
        featureFlag: event.featureFlag,
        featureName: event.featureName,
        activeUsers: new Set(),
        totalEvents: 0,
      });
    }

    const metrics = byFeature.get(key);
    if (event.eventType === 'USED') {
      metrics.activeUsers.add(event.userId);
    }
    metrics.totalEvents++;
  });

  return Array.from(byFeature.values())
    .map((metrics) => {
      const activeUsers = metrics.activeUsers.size;
      const totalEvents = metrics.totalEvents;

      // Calculate health score (0-100)
      let healthScore = 0;
      if (activeUsers > 0) {
        healthScore = Math.min(100, (activeUsers * 10 + totalEvents / 10));
      }

      // Determine recommendation
      let recommendation = 'MONITOR';
      if (activeUsers === 0) {
        recommendation = 'SUNSET';
      } else if (activeUsers < 5) {
        recommendation = 'IMPROVE';
      } else if (activeUsers > 20) {
        recommendation = 'PROMOTE';
      }

      return {
        featureFlag: metrics.featureFlag,
        featureName: metrics.featureName,
        activeUsers,
        totalEvents,
        healthScore: Math.round(healthScore),
        recommendation,
      };
    })
    .sort((a, b) => b.healthScore - a.healthScore);
}

export default router;
