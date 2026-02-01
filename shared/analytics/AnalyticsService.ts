/**
 * Central Analytics Service
 * Vendor-agnostic analytics abstraction with privacy-safe defaults
 */

import {
  AnalyticsEvent,
  AnalyticsProvider,
  AnalyticsConfig,
} from './types';
import { createHash } from 'crypto';

class AnalyticsService {
  private config: AnalyticsConfig;
  private providers: AnalyticsProvider[] = [];
  private sessionId: string;
  private eventQueue: AnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();
    
    if (this.config.enabled) {
      this.startFlushInterval();
    }
  }

  /**
   * Register an analytics provider
   */
  registerProvider(provider: AnalyticsProvider): void {
    this.providers.push(provider);
  }

  /**
   * Track an analytics event
   */
  track(event: Omit<AnalyticsEvent, 'timestamp' | 'sessionId'>): void {
    if (!this.config.enabled) {
      return;
    }

    // Apply sampling for performance events
    if (event.category === 'performance' && this.config.sampleRate) {
      if (Math.random() > this.config.sampleRate) {
        return;
      }
    }

    const enrichedEvent: AnalyticsEvent = {
      ...event,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      tenantIdHash: event.tenantIdHash ? this.hashValue(event.tenantIdHash) : undefined,
      userId: event.userId ? this.hashValue(event.userId) : undefined,
    } as AnalyticsEvent;

    // Sanitize event to ensure no PII
    const sanitizedEvent = this.sanitizeEvent(enrichedEvent);

    if (this.config.debug) {
      console.log('[Analytics]', sanitizedEvent);
    }

    // Add to queue
    this.eventQueue.push(sanitizedEvent);

    // Immediate flush for errors
    if (event.category === 'error') {
      this.flush();
    }
  }

  /**
   * Identify a user (with hashed ID)
   */
  identify(userId: string, traits?: Record<string, any>): void {
    if (!this.config.enabled) {
      return;
    }

    const hashedUserId = this.hashValue(userId);
    const sanitizedTraits = this.sanitizeTraits(traits || {});

    this.providers.forEach((provider) => {
      provider.identify(hashedUserId, sanitizedTraits);
    });
  }

  /**
   * Track a page view
   */
  page(name: string, properties?: Record<string, any>): void {
    if (!this.config.enabled) {
      return;
    }

    const sanitizedProperties = this.sanitizeTraits(properties || {});

    this.providers.forEach((provider) => {
      provider.page(name, sanitizedProperties);
    });
  }

  /**
   * Flush queued events to providers
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    // Send to all providers
    for (const event of eventsToFlush) {
      this.providers.forEach((provider) => {
        try {
          provider.track(event);
        } catch (error) {
          console.error('[Analytics] Provider error:', error);
        }
      });
    }

    // Flush providers
    await Promise.all(
      this.providers.map((provider) =>
        provider.flush().catch((error) => {
          console.error('[Analytics] Flush error:', error);
        })
      )
    );
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Hash a value for privacy
   */
  private hashValue(value: string): string {
    if (!this.config.excludePII) {
      return value;
    }
    return createHash('sha256').update(value).digest('hex').substring(0, 16);
  }

  /**
   * Sanitize event to remove PII
   */
  private sanitizeEvent(event: AnalyticsEvent): AnalyticsEvent {
    if (!this.config.excludePII) {
      return event;
    }

    const sanitized = { ...event };

    // Remove any fields that might contain PII
    if (sanitized.metadata) {
      const metadata = { ...sanitized.metadata } as Record<string, any>;
      
      // Remove email, phone, name, address, etc.
      const piiFields = ['email', 'phone', 'name', 'address', 'ssn', 'creditCard'];
      piiFields.forEach((field) => {
        if (field in metadata) {
          delete metadata[field];
        }
      });

      sanitized.metadata = metadata;
    }

    return sanitized;
  }

  /**
   * Sanitize user traits to remove PII
   */
  private sanitizeTraits(traits: Record<string, any>): Record<string, any> {
    if (!this.config.excludePII) {
      return traits;
    }

    const sanitized = { ...traits };
    const piiFields = ['email', 'phone', 'name', 'address', 'ssn', 'creditCard'];
    
    piiFields.forEach((field) => {
      if (field in sanitized) {
        delete sanitized[field];
      }
    });

    return sanitized;
  }

  /**
   * Start automatic flush interval
   */
  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 10000); // Flush every 10 seconds
  }

  /**
   * Stop automatic flush interval
   */
  stopFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Cleanup on shutdown
   */
  async shutdown(): Promise<void> {
    this.stopFlushInterval();
    await this.flush();
  }
}

// Singleton instance
let analyticsInstance: AnalyticsService | null = null;

export function initializeAnalytics(config: AnalyticsConfig): AnalyticsService {
  if (analyticsInstance) {
    console.warn('[Analytics] Already initialized');
    return analyticsInstance;
  }

  analyticsInstance = new AnalyticsService(config);
  return analyticsInstance;
}

export function getAnalytics(): AnalyticsService {
  if (!analyticsInstance) {
    throw new Error('[Analytics] Not initialized. Call initializeAnalytics first.');
  }
  return analyticsInstance;
}

export { AnalyticsService };
