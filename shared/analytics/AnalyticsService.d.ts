/**
 * Central Analytics Service
 * Vendor-agnostic analytics abstraction with privacy-safe defaults
 */
import { AnalyticsEvent, AnalyticsProvider, AnalyticsConfig } from './types';
declare class AnalyticsService {
    private config;
    private providers;
    private sessionId;
    private eventQueue;
    private flushInterval;
    constructor(config: AnalyticsConfig);
    /**
     * Register an analytics provider
     */
    registerProvider(provider: AnalyticsProvider): void;
    /**
     * Track an analytics event
     */
    track(event: Omit<AnalyticsEvent, 'timestamp' | 'sessionId'>): void;
    /**
     * Identify a user (with hashed ID)
     */
    identify(userId: string, traits?: Record<string, any>): void;
    /**
     * Track a page view
     */
    page(name: string, properties?: Record<string, any>): void;
    /**
     * Flush queued events to providers
     */
    flush(): Promise<void>;
    /**
     * Generate a unique session ID
     */
    private generateSessionId;
    /**
     * Hash a value for privacy
     */
    private hashValue;
    /**
     * Sanitize event to remove PII
     */
    private sanitizeEvent;
    /**
     * Sanitize user traits to remove PII
     */
    private sanitizeTraits;
    /**
     * Start automatic flush interval
     */
    private startFlushInterval;
    /**
     * Stop automatic flush interval
     */
    stopFlushInterval(): void;
    /**
     * Cleanup on shutdown
     */
    shutdown(): Promise<void>;
}
export declare function initializeAnalytics(config: AnalyticsConfig): AnalyticsService;
export declare function getAnalytics(): AnalyticsService;
export { AnalyticsService };
//# sourceMappingURL=AnalyticsService.d.ts.map