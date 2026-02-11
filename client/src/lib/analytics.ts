/**
 * Frontend Analytics Client
 * Privacy-safe analytics tracking for AccuBooks
 */

import type {
  AnalyticsEvent,
  AuthEvent,
  DashboardEvent,
  ScenarioEvent,
  ForecastEvent,
  TrustEvent,
  ErrorEvent,
  PerformanceEvent,
} from "@/../../shared/analytics/types";

class FrontendAnalytics {
  private sessionId: string;
  private userId: string | null = null;
  private tenantId: string | null = null;
  private userRole: string | null = null;
  private featureFlags: Record<string, boolean> = {};
  private enabled: boolean;
  private debug: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.enabled =
      process.env.NODE_ENV === "production" ||
      process.env.VITE_ANALYTICS_ENABLED === "true";
    this.debug = process.env.NODE_ENV === "development";
  }

  /**
   * Initialize analytics with user context
   */
  initialize(config: {
    userId?: string;
    tenantId?: string;
    userRole?: string;
    featureFlags?: Record<string, boolean>;
  }): void {
    this.userId = config.userId || null;
    this.tenantId = config.tenantId || null;
    this.userRole = config.userRole || null;
    this.featureFlags = config.featureFlags || {};

    if (this.debug) {
      console.log("[Analytics] Initialized", {
        userId: this.userId ? "***" : null,
        tenantId: this.tenantId ? "***" : null,
        userRole: this.userRole,
      });
    }
  }

  /**
   * Track authentication events
   */
  trackAuth(
    action: AuthEvent["action"],
    metadata?: AuthEvent["metadata"],
  ): void {
    this.track({
      category: "auth",
      action,
      metadata,
    });
  }

  /**
   * Track dashboard events
   */
  trackDashboard(
    action: DashboardEvent["action"],
    metadata?: DashboardEvent["metadata"],
  ): void {
    this.track({
      category: "dashboard",
      action,
      metadata,
    });
  }

  /**
   * Track scenario events
   */
  trackScenario(
    action: ScenarioEvent["action"],
    metadata?: ScenarioEvent["metadata"],
  ): void {
    this.track({
      category: "scenario",
      action,
      metadata,
    });
  }

  /**
   * Track forecast events
   */
  trackForecast(
    action: ForecastEvent["action"],
    metadata?: ForecastEvent["metadata"],
  ): void {
    this.track({
      category: "forecast",
      action,
      metadata,
    });
  }

  /**
   * Track trust layer events
   */
  trackTrust(
    action: TrustEvent["action"],
    metadata?: TrustEvent["metadata"],
  ): void {
    this.track({
      category: "trust",
      action,
      metadata,
    });
  }

  /**
   * Track error events
   */
  trackError(
    action: ErrorEvent["action"],
    metadata: ErrorEvent["metadata"],
  ): void {
    this.track({
      category: "error",
      action,
      metadata,
    });

    // Also log to console in development
    if (this.debug) {
      console.error("[Analytics Error]", { action, metadata });
    }
  }

  /**
   * Track performance events
   */
  trackPerformance(
    action: PerformanceEvent["action"],
    metadata: PerformanceEvent["metadata"],
  ): void {
    this.track({
      category: "performance",
      action,
      metadata,
    });
  }

  /**
   * Track page view
   */
  trackPageView(pageName: string, properties?: Record<string, any>): void {
    if (!this.enabled) return;

    const event = {
      category: "dashboard" as const,
      action: "viewed" as const,
      metadata: {
        pageName,
        ...properties,
      } as any,
    };

    this.track(event);
  }

  /**
   * Core track method
   */
  private track(
    event: Omit<
      AnalyticsEvent,
      | "timestamp"
      | "sessionId"
      | "tenantIdHash"
      | "userId"
      | "userRole"
      | "featureFlags"
    >,
  ): void {
    if (!this.enabled) {
      if (this.debug) {
        console.log("[Analytics] (disabled)", event);
      }
      return;
    }

    const enrichedEvent = {
      ...event,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      tenantIdHash: this.tenantId || undefined,
      userId: this.userId || undefined,
      userRole: this.userRole || undefined,
      featureFlags: this.featureFlags,
    };

    // Send to backend analytics endpoint
    this.sendToBackend(enrichedEvent);

    if (this.debug) {
      console.log("[Analytics]", enrichedEvent);
    }
  }

  /**
   * Send event to backend
   */
  private async sendToBackend(event: any): Promise<void> {
    try {
      await fetch("/api/analytics/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
        keepalive: true, // Ensure events are sent even on page unload
      });
    } catch (error) {
      // Silently fail - don't disrupt user experience
      if (this.debug) {
        console.error("[Analytics] Failed to send event:", error);
      }
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Measure performance timing
   */
  measurePerformance<T>(
    name: string,
    fn: () => T | Promise<T>,
  ): T | Promise<T> {
    const startTime = performance.now();

    const result = fn();

    if (result instanceof Promise) {
      return result.then((value) => {
        const duration = performance.now() - startTime;
        this.trackPerformance("component_mount", {
          duration,
          componentName: name,
        });
        return value;
      });
    } else {
      const duration = performance.now() - startTime;
      this.trackPerformance("component_mount", {
        duration,
        componentName: name,
      });
      return result;
    }
  }
}

// Singleton instance
const analytics = new FrontendAnalytics();

export { analytics };
export default analytics;
