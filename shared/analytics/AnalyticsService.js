/**
 * Central Analytics Service
 * Vendor-agnostic analytics abstraction with privacy-safe defaults
 */
import { createHash } from 'crypto';
class AnalyticsService {
    constructor(config) {
        this.providers = [];
        this.eventQueue = [];
        this.flushInterval = null;
        this.config = config;
        this.sessionId = this.generateSessionId();
        if (this.config.enabled) {
            this.startFlushInterval();
        }
    }
    /**
     * Register an analytics provider
     */
    registerProvider(provider) {
        this.providers.push(provider);
    }
    /**
     * Track an analytics event
     */
    track(event) {
        if (!this.config.enabled) {
            return;
        }
        // Apply sampling for performance events
        if (event.category === 'performance' && this.config.sampleRate) {
            if (Math.random() > this.config.sampleRate) {
                return;
            }
        }
        const enrichedEvent = {
            ...event,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            tenantIdHash: event.tenantIdHash ? this.hashValue(event.tenantIdHash) : undefined,
            userId: event.userId ? this.hashValue(event.userId) : undefined,
        };
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
    identify(userId, traits) {
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
    page(name, properties) {
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
    async flush() {
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
                }
                catch (error) {
                    console.error('[Analytics] Provider error:', error);
                }
            });
        }
        // Flush providers
        await Promise.all(this.providers.map((provider) => provider.flush().catch((error) => {
            console.error('[Analytics] Flush error:', error);
        })));
    }
    /**
     * Generate a unique session ID
     */
    generateSessionId() {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }
    /**
     * Hash a value for privacy
     */
    hashValue(value) {
        if (!this.config.excludePII) {
            return value;
        }
        return createHash('sha256').update(value).digest('hex').substring(0, 16);
    }
    /**
     * Sanitize event to remove PII
     */
    sanitizeEvent(event) {
        if (!this.config.excludePII) {
            return event;
        }
        const sanitized = { ...event };
        // Remove any fields that might contain PII
        if (sanitized.metadata) {
            const metadata = { ...sanitized.metadata };
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
    sanitizeTraits(traits) {
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
    startFlushInterval() {
        this.flushInterval = setInterval(() => {
            this.flush();
        }, 10000); // Flush every 10 seconds
    }
    /**
     * Stop automatic flush interval
     */
    stopFlushInterval() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }
    }
    /**
     * Cleanup on shutdown
     */
    async shutdown() {
        this.stopFlushInterval();
        await this.flush();
    }
}
// Singleton instance
let analyticsInstance = null;
export function initializeAnalytics(config) {
    if (analyticsInstance) {
        console.warn('[Analytics] Already initialized');
        return analyticsInstance;
    }
    analyticsInstance = new AnalyticsService(config);
    return analyticsInstance;
}
export function getAnalytics() {
    if (!analyticsInstance) {
        throw new Error('[Analytics] Not initialized. Call initializeAnalytics first.');
    }
    return analyticsInstance;
}
export { AnalyticsService };
//# sourceMappingURL=AnalyticsService.js.map