/**
 * Feature Flag Service
 * Centralized feature flag evaluation with safe defaults
 */
import { DEFAULT_FEATURE_FLAGS, } from './types';
class FeatureFlagService {
    constructor(environment = 'production') {
        this.environment = environment;
        this.flags = new Map();
        // Initialize with default flags
        Object.entries(DEFAULT_FEATURE_FLAGS).forEach(([key, flag]) => {
            this.flags.set(key, flag);
        });
    }
    /**
     * Check if a feature is enabled
     */
    isEnabled(key, context) {
        const flag = this.flags.get(key);
        // Safe default: OFF if flag not found
        if (!flag) {
            console.warn(`[FeatureFlags] Unknown flag: ${key}, defaulting to disabled`);
            return false;
        }
        // Check base enabled state
        if (!flag.enabled) {
            return false;
        }
        // Check environment restriction
        if (flag.environments && flag.environments.length > 0) {
            const env = context?.environment || this.environment;
            if (!flag.environments.includes(env)) {
                return false;
            }
        }
        // Check tenant restriction
        if (flag.tenantIds && flag.tenantIds.length > 0) {
            if (!context?.tenantId || !flag.tenantIds.includes(context.tenantId)) {
                return false;
            }
        }
        // Check role restriction
        if (flag.userRoles && flag.userRoles.length > 0) {
            if (!context?.userRole || !flag.userRoles.includes(context.userRole)) {
                return false;
            }
        }
        // Check rollout percentage
        if (flag.rolloutPercentage !== undefined && context?.userId) {
            const userHash = this.hashUserId(context.userId);
            const userPercentile = userHash % 100;
            if (userPercentile >= flag.rolloutPercentage) {
                return false;
            }
        }
        return true;
    }
    /**
     * Get all enabled flags for a context
     */
    getEnabledFlags(context) {
        const enabled = [];
        this.flags.forEach((flag, key) => {
            if (this.isEnabled(key, context)) {
                enabled.push(key);
            }
        });
        return enabled;
    }
    /**
     * Get all flags as a record
     */
    getAllFlags(context) {
        const result = {};
        this.flags.forEach((flag, key) => {
            result[key] = this.isEnabled(key, context);
        });
        return result;
    }
    /**
     * Override a flag (for testing or admin control)
     */
    override(key, enabled) {
        const flag = this.flags.get(key);
        if (flag) {
            this.flags.set(key, { ...flag, enabled });
        }
        else {
            console.warn(`[FeatureFlags] Cannot override unknown flag: ${key}`);
        }
    }
    /**
     * Reset all flags to defaults
     */
    reset() {
        this.flags.clear();
        Object.entries(DEFAULT_FEATURE_FLAGS).forEach(([key, flag]) => {
            this.flags.set(key, flag);
        });
    }
    /**
     * Get flag metadata
     */
    getFlag(key) {
        return this.flags.get(key);
    }
    /**
     * Hash user ID for consistent rollout
     */
    hashUserId(userId) {
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            const char = userId.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
}
// Singleton instance
let featureFlagService = null;
export function initializeFeatureFlags(environment = 'production') {
    if (featureFlagService) {
        console.warn('[FeatureFlags] Already initialized');
        return featureFlagService;
    }
    featureFlagService = new FeatureFlagService(environment);
    return featureFlagService;
}
export function getFeatureFlags() {
    if (!featureFlagService) {
        throw new Error('[FeatureFlags] Not initialized. Call initializeFeatureFlags first.');
    }
    return featureFlagService;
}
export { FeatureFlagService };
//# sourceMappingURL=FeatureFlagService.js.map