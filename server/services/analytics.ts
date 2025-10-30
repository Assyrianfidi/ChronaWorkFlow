import { Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';

// Analytics event schemas
const trackEventSchema = z.object({
  event: z.string(),
  properties: z.record(z.any()).optional(),
  userId: z.string().optional(),
  anonymousId: z.string().optional(),
});

const identifyUserSchema = z.object({
  userId: z.string(),
  traits: z.record(z.any()),
});

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  anonymousId?: string;
  timestamp: string;
  context: {
    page: {
      url: string;
      referrer?: string;
      userAgent?: string;
    };
    ip?: string;
  };
}

interface UserTraits {
  email?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  subscriptionTier?: string;
  signupDate?: string;
  [key: string]: any;
}

class AnalyticsService {
  private googleAnalyticsId: string;
  private mixpanelToken: string;
  private eventsBuffer: AnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds

  constructor() {
    this.googleAnalyticsId = process.env.GOOGLE_ANALYTICS_ID || '';
    this.mixpanelToken = process.env.MIXPANEL_TOKEN || '';

    if (this.mixpanelToken) {
      this.startBatchProcessing();
    }
  }

  // Track page views for Google Analytics
  trackPageView(req: Request, userId?: string) {
    if (!this.googleAnalyticsId) return;

    const pageData = {
      page_title: req.headers['x-page-title'] as string || 'Unknown Page',
      page_location: req.originalUrl,
      page_referrer: req.get('Referrer'),
    };

    // Send to Google Analytics (client-side will handle this)
    // Server-side tracking for Google Analytics is limited
  }

  // Track custom events
  trackEvent(event: string, properties?: Record<string, any>, userId?: string, req?: Request) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
      },
      userId,
      timestamp: new Date().toISOString(),
      context: {
        page: {
          url: req?.originalUrl || '',
          referrer: req?.get('Referrer'),
          userAgent: req?.get('User-Agent'),
        },
        ip: req?.ip,
      },
    };

    // Add to buffer for batch processing
    this.eventsBuffer.push(analyticsEvent);

    // Flush if buffer is full
    if (this.eventsBuffer.length >= this.BATCH_SIZE) {
      this.flushEvents();
    }

    // Log for debugging in development
    if (process.env.NODE_ENV === 'development') {
      logger.info('Analytics event tracked:', { event, properties, userId });
    }
  }

  // Identify user for Mixpanel
  identifyUser(userId: string, traits: UserTraits) {
    if (!this.mixpanelToken) return;

    // This would be sent to Mixpanel
    const identifyEvent: AnalyticsEvent = {
      event: '$identify',
      properties: traits,
      userId,
      timestamp: new Date().toISOString(),
      context: { page: { url: '' } },
    };

    this.eventsBuffer.push(identifyEvent);
  }

  // Track user signup funnel
  trackSignup(userId: string, email: string, companyName?: string) {
    this.trackEvent('user_signup_started', {
      signup_method: 'email',
      company_name: companyName,
    }, userId);

    // Identify user for future tracking
    this.identifyUser(userId, {
      email,
      signupDate: new Date().toISOString(),
      company: companyName,
    });
  }

  // Track subscription events
  trackSubscription(tenantId: string, userId: string, tier: string, amount?: number) {
    this.trackEvent('subscription_created', {
      subscription_tier: tier,
      amount,
      currency: 'USD',
    }, userId);

    // Track MRR for analytics
    this.trackEvent('mrr_changed', {
      tenant_id: tenantId,
      subscription_tier: tier,
      amount: this.getTierPrice(tier),
      currency: 'USD',
    });
  }

  // Track feature usage
  trackFeatureUsage(userId: string, feature: string, metadata?: Record<string, any>) {
    this.trackEvent('feature_used', {
      feature_name: feature,
      ...metadata,
    }, userId);
  }

  // Track API usage for billing
  trackAPIUsage(tenantId: string, endpoint: string, method: string, statusCode: number) {
    this.trackEvent('api_request', {
      tenant_id: tenantId,
      endpoint,
      method,
      status_code: statusCode,
      response_time: Date.now(), // This would be calculated
    });
  }

  // Track conversion funnel
  trackConversion(userId: string, step: string, metadata?: Record<string, any>) {
    this.trackEvent('conversion_funnel', {
      funnel_step: step,
      ...metadata,
    }, userId);
  }

  // Track user engagement
  trackEngagement(userId: string, action: string, duration?: number) {
    this.trackEvent('user_engagement', {
      action,
      duration_seconds: duration,
      session_duration: duration,
    }, userId);
  }

  // Track errors and issues
  trackError(userId: string, error: string, stack?: string, metadata?: Record<string, any>) {
    this.trackEvent('error_occurred', {
      error_message: error,
      error_stack: stack,
      error_type: 'javascript_error',
      ...metadata,
    }, userId);
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, metadata?: Record<string, any>) {
    this.trackEvent('performance_metric', {
      metric_name: metric,
      metric_value: value,
      ...metadata,
    });
  }

  // Batch processing for Mixpanel
  private startBatchProcessing() {
    this.flushInterval = setInterval(() => {
      this.flushEvents();
    }, this.FLUSH_INTERVAL);
  }

  private async flushEvents() {
    if (this.eventsBuffer.length === 0) return;

    const eventsToSend = [...this.eventsBuffer];
    this.eventsBuffer = [];

    try {
      // Send to Mixpanel in batches
      if (this.mixpanelToken) {
        await this.sendToMixpanel(eventsToSend);
      }

      // Send to internal analytics
      await this.sendToInternalAnalytics(eventsToSend);

    } catch (error) {
      logger.error('Failed to flush analytics events:', error);
      // Re-add events to buffer for retry
      this.eventsBuffer.unshift(...eventsToSend);
    }
  }

  private async sendToMixpanel(events: AnalyticsEvent[]) {
    // Group events by user
    const eventsByUser: Record<string, any[]> = {};

    events.forEach(event => {
      if (event.userId) {
        if (!eventsByUser[event.userId]) {
          eventsByUser[event.userId] = [];
        }
        eventsByUser[event.userId].push(event);
      }
    });

    // Send to Mixpanel API
    for (const [userId, userEvents] of Object.entries(eventsByUser)) {
      try {
        const response = await fetch('https://api.mixpanel.com/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            data: JSON.stringify({
              event: userEvents[0].event,
              properties: {
                ...userEvents[0].properties,
                token: this.mixpanelToken,
                distinct_id: userId,
              },
            }),
          }),
        });

        if (!response.ok) {
          throw new Error(`Mixpanel API error: ${response.status}`);
        }
      } catch (error) {
        logger.error(`Failed to send event to Mixpanel for user ${userId}:`, error);
      }
    }
  }

  private async sendToInternalAnalytics(events: AnalyticsEvent[]) {
    // Store events in database for internal analytics
    // This would insert into an analytics_events table
    logger.info(`Internal analytics: ${events.length} events processed`);
  }

  // Helper methods
  private getTierPrice(tier: string): number {
    const prices: Record<string, number> = {
      'free': 0,
      'standard': 29,
      'enterprise': 99,
    };
    return prices[tier] || 0;
  }

  // Get analytics dashboard data
  async getAnalyticsDashboard(tenantId?: string) {
    // This would query aggregated analytics data
    return {
      totalUsers: 0,
      activeUsers: 0,
      conversionRate: 0,
      mrr: 0,
      churnRate: 0,
      featureUsage: {},
    };
  }

  // Cleanup on shutdown
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushEvents(); // Final flush
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

// Analytics middleware for Express
export function analyticsMiddleware(req: Request, res: Response, next: any) {
  // Track page view on response finish
  res.on('finish', () => {
    if (req.user) {
      analyticsService.trackPageView(req, req.user.id);
    }
  });

  next();
}

// API endpoints for analytics
export async function trackEvent(req: Request, res: Response) {
  try {
    const { event, properties, userId, anonymousId } = trackEventSchema.parse(req.body);

    analyticsService.trackEvent(event, properties, userId || req.user?.id, req);

    res.json({ success: true });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    logger.error('Track event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function identifyUser(req: Request, res: Response) {
  try {
    const { userId, traits } = identifyUserSchema.parse(req.body);

    analyticsService.identifyUser(userId, traits);

    res.json({ success: true });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    logger.error('Identify user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAnalytics(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const analytics = await analyticsService.getAnalyticsDashboard(req.user.tenantId);

    res.json(analytics);

  } catch (error) {
    logger.error('Get analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
