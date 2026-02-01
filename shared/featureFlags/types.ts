/**
 * Feature Flags Types
 * Centralized feature flag definitions with safe defaults
 */

export type FeatureFlagKey =
  // Forecasting features
  | 'forecasting.advanced_models'
  | 'forecasting.monte_carlo'
  | 'forecasting.ml_predictions'
  | 'forecasting.custom_formulas'
  
  // Scenario features
  | 'scenarios.comparison'
  | 'scenarios.bulk_operations'
  | 'scenarios.templates'
  | 'scenarios.sharing'
  
  // Analytics features
  | 'analytics.experimental_tracking'
  | 'analytics.custom_events'
  | 'analytics.export'
  
  // Trust layer features
  | 'trust.calculation_explainer'
  | 'trust.assumptions_panel'
  | 'trust.confidence_scoring'
  
  // Enterprise features
  | 'enterprise.sso'
  | 'enterprise.audit_logs'
  | 'enterprise.custom_branding'
  | 'enterprise.api_access'
  
  // Experimental features
  | 'experimental.new_dashboard'
  | 'experimental.ai_insights'
  | 'experimental.collaboration';

export interface FeatureFlag {
  key: FeatureFlagKey;
  enabled: boolean;
  description: string;
  environments?: ('development' | 'staging' | 'production')[];
  tenantIds?: string[];
  userRoles?: ('admin' | 'user' | 'viewer')[];
  rolloutPercentage?: number; // 0-100
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

// Safe defaults: OFF unless explicitly enabled
export const DEFAULT_FEATURE_FLAGS: Record<FeatureFlagKey, FeatureFlag> = {
  // Forecasting - stable features enabled
  'forecasting.advanced_models': {
    key: 'forecasting.advanced_models',
    enabled: false,
    description: 'Enable advanced forecasting models',
    environments: ['development', 'staging'],
  },
  'forecasting.monte_carlo': {
    key: 'forecasting.monte_carlo',
    enabled: false,
    description: 'Enable Monte Carlo simulations',
    environments: ['development'],
  },
  'forecasting.ml_predictions': {
    key: 'forecasting.ml_predictions',
    enabled: false,
    description: 'Enable ML-based predictions',
    environments: ['development'],
  },
  'forecasting.custom_formulas': {
    key: 'forecasting.custom_formulas',
    enabled: false,
    description: 'Enable custom formula builder',
    environments: ['development', 'staging'],
  },
  
  // Scenarios - core features enabled
  'scenarios.comparison': {
    key: 'scenarios.comparison',
    enabled: true,
    description: 'Enable scenario comparison',
    environments: ['development', 'staging', 'production'],
  },
  'scenarios.bulk_operations': {
    key: 'scenarios.bulk_operations',
    enabled: false,
    description: 'Enable bulk scenario operations',
    environments: ['development', 'staging'],
  },
  'scenarios.templates': {
    key: 'scenarios.templates',
    enabled: false,
    description: 'Enable scenario templates',
    environments: ['development', 'staging'],
  },
  'scenarios.sharing': {
    key: 'scenarios.sharing',
    enabled: false,
    description: 'Enable scenario sharing',
    environments: ['development'],
  },
  
  // Analytics - experimental
  'analytics.experimental_tracking': {
    key: 'analytics.experimental_tracking',
    enabled: false,
    description: 'Enable experimental analytics tracking',
    environments: ['development'],
  },
  'analytics.custom_events': {
    key: 'analytics.custom_events',
    enabled: false,
    description: 'Enable custom event tracking',
    environments: ['development', 'staging'],
  },
  'analytics.export': {
    key: 'analytics.export',
    enabled: false,
    description: 'Enable analytics export',
    environments: ['development', 'staging'],
  },
  
  // Trust layer - enabled by default
  'trust.calculation_explainer': {
    key: 'trust.calculation_explainer',
    enabled: true,
    description: 'Enable calculation explainer',
    environments: ['development', 'staging', 'production'],
  },
  'trust.assumptions_panel': {
    key: 'trust.assumptions_panel',
    enabled: true,
    description: 'Enable assumptions panel',
    environments: ['development', 'staging', 'production'],
  },
  'trust.confidence_scoring': {
    key: 'trust.confidence_scoring',
    enabled: true,
    description: 'Enable confidence scoring',
    environments: ['development', 'staging', 'production'],
  },
  
  // Enterprise - disabled by default
  'enterprise.sso': {
    key: 'enterprise.sso',
    enabled: false,
    description: 'Enable SSO authentication',
    userRoles: ['admin'],
  },
  'enterprise.audit_logs': {
    key: 'enterprise.audit_logs',
    enabled: false,
    description: 'Enable audit logging',
    userRoles: ['admin'],
  },
  'enterprise.custom_branding': {
    key: 'enterprise.custom_branding',
    enabled: false,
    description: 'Enable custom branding',
    userRoles: ['admin'],
  },
  'enterprise.api_access': {
    key: 'enterprise.api_access',
    enabled: false,
    description: 'Enable API access',
    userRoles: ['admin'],
  },
  
  // Experimental - disabled by default
  'experimental.new_dashboard': {
    key: 'experimental.new_dashboard',
    enabled: false,
    description: 'Enable new dashboard design',
    environments: ['development'],
    rolloutPercentage: 10,
  },
  'experimental.ai_insights': {
    key: 'experimental.ai_insights',
    enabled: false,
    description: 'Enable AI-powered insights',
    environments: ['development'],
  },
  'experimental.collaboration': {
    key: 'experimental.collaboration',
    enabled: false,
    description: 'Enable real-time collaboration',
    environments: ['development'],
  },
};
