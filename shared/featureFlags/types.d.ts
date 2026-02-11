/**
 * Feature Flags Types
 * Centralized feature flag definitions with safe defaults
 */
export type FeatureFlagKey = 'forecasting.advanced_models' | 'forecasting.monte_carlo' | 'forecasting.ml_predictions' | 'forecasting.custom_formulas' | 'scenarios.comparison' | 'scenarios.bulk_operations' | 'scenarios.templates' | 'scenarios.sharing' | 'analytics.experimental_tracking' | 'analytics.custom_events' | 'analytics.export' | 'trust.calculation_explainer' | 'trust.assumptions_panel' | 'trust.confidence_scoring' | 'enterprise.sso' | 'enterprise.audit_logs' | 'enterprise.custom_branding' | 'enterprise.api_access' | 'experimental.new_dashboard' | 'experimental.ai_insights' | 'experimental.collaboration';
export interface FeatureFlag {
    key: FeatureFlagKey;
    enabled: boolean;
    description: string;
    environments?: ('development' | 'staging' | 'production')[];
    tenantIds?: string[];
    userRoles?: ('admin' | 'user' | 'viewer')[];
    rolloutPercentage?: number;
}
export interface FeatureFlagContext {
    environment: 'development' | 'staging' | 'production';
    tenantId?: string;
    userId?: string;
    userRole?: 'admin' | 'user' | 'viewer';
}
export interface FeatureFlagConfig {
    flags: Record<FeatureFlagKey, FeatureFlag>;
    defaultEnabled: boolean;
}
export declare const DEFAULT_FEATURE_FLAGS: Record<FeatureFlagKey, FeatureFlag>;
//# sourceMappingURL=types.d.ts.map