/**
 * Feature Flag Service
 * Centralized feature flag evaluation with safe defaults
 */
import { FeatureFlagKey, FeatureFlag, FeatureFlagContext } from './types';
declare class FeatureFlagService {
    private flags;
    private environment;
    constructor(environment?: 'development' | 'staging' | 'production');
    /**
     * Check if a feature is enabled
     */
    isEnabled(key: FeatureFlagKey, context?: FeatureFlagContext): boolean;
    /**
     * Get all enabled flags for a context
     */
    getEnabledFlags(context?: FeatureFlagContext): FeatureFlagKey[];
    /**
     * Get all flags as a record
     */
    getAllFlags(context?: FeatureFlagContext): Record<FeatureFlagKey, boolean>;
    /**
     * Override a flag (for testing or admin control)
     */
    override(key: FeatureFlagKey, enabled: boolean): void;
    /**
     * Reset all flags to defaults
     */
    reset(): void;
    /**
     * Get flag metadata
     */
    getFlag(key: FeatureFlagKey): FeatureFlag | undefined;
    /**
     * Hash user ID for consistent rollout
     */
    private hashUserId;
}
export declare function initializeFeatureFlags(environment?: 'development' | 'staging' | 'production'): FeatureFlagService;
export declare function getFeatureFlags(): FeatureFlagService;
export { FeatureFlagService };
//# sourceMappingURL=FeatureFlagService.d.ts.map