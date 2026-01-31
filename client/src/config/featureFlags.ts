/**
 * Feature Flag Configuration
 * Enables safe, gradual rollout of new features
 */

export type FeatureFlagKey =
  | 'FINANCIAL_DASHBOARD'
  | 'FINANCIAL_DASHBOARD_CHARTS'
  | 'FINANCIAL_DASHBOARD_WIDGETS'
  | 'PROFIT_LOSS_WIDGET'
  | 'BANK_ACCOUNTS_WIDGET'
  | 'INVOICES_WIDGET'
  | 'DARK_MODE'
  | 'MULTI_THEME'
  | 'ROLE_BASED_UI'
  | 'EXPERIMENTAL_FEATURES';

export interface FeatureFlag {
  key: FeatureFlagKey;
  enabled: boolean;
  description: string;
  rolloutPercentage?: number; // 0-100, for gradual rollout
  requiredRoles?: string[]; // Optional role restriction
}

// Default feature flags (can be overridden by environment or remote config)
const defaultFlags: Record<FeatureFlagKey, FeatureFlag> = {
  FINANCIAL_DASHBOARD: {
    key: 'FINANCIAL_DASHBOARD',
    enabled: true,
    description: 'Enable the new Financial Dashboard UI',
  },
  FINANCIAL_DASHBOARD_CHARTS: {
    key: 'FINANCIAL_DASHBOARD_CHARTS',
    enabled: true,
    description: 'Enable production charts in Financial Dashboard',
  },
  FINANCIAL_DASHBOARD_WIDGETS: {
    key: 'FINANCIAL_DASHBOARD_WIDGETS',
    enabled: true,
    description: 'Enable all financial widgets',
  },
  PROFIT_LOSS_WIDGET: {
    key: 'PROFIT_LOSS_WIDGET',
    enabled: true,
    description: 'Enable Profit & Loss widget',
  },
  BANK_ACCOUNTS_WIDGET: {
    key: 'BANK_ACCOUNTS_WIDGET',
    enabled: true,
    description: 'Enable Bank Accounts widget',
  },
  INVOICES_WIDGET: {
    key: 'INVOICES_WIDGET',
    enabled: true,
    description: 'Enable Invoices widget',
  },
  DARK_MODE: {
    key: 'DARK_MODE',
    enabled: true,
    description: 'Enable dark mode theme',
  },
  MULTI_THEME: {
    key: 'MULTI_THEME',
    enabled: true,
    description: 'Enable multiple theme selection',
  },
  ROLE_BASED_UI: {
    key: 'ROLE_BASED_UI',
    enabled: true,
    description: 'Enable role-based UI gating',
  },
  EXPERIMENTAL_FEATURES: {
    key: 'EXPERIMENTAL_FEATURES',
    enabled: false,
    description: 'Enable experimental features (use with caution)',
  },
};

// Environment-based overrides
const getEnvOverrides = (): Partial<Record<FeatureFlagKey, boolean>> => {
  const overrides: Partial<Record<FeatureFlagKey, boolean>> = {};

  // Check for environment variable overrides
  // Format: VITE_FEATURE_FLAG_<KEY>=true|false
  if (typeof import.meta.env !== 'undefined') {
    Object.keys(defaultFlags).forEach((key) => {
      const envKey = `VITE_FEATURE_FLAG_${key}`;
      const envValue = import.meta.env[envKey];
      if (envValue !== undefined) {
        overrides[key as FeatureFlagKey] = envValue === 'true' || envValue === true;
      }
    });
  }

  return overrides;
};

// Local storage overrides (for testing/debugging)
const getLocalOverrides = (): Partial<Record<FeatureFlagKey, boolean>> => {
  try {
    const stored = localStorage.getItem('accubooks-feature-flags');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to parse feature flags from localStorage:', error);
  }
  return {};
};

// Merge flags with overrides (priority: local > env > default)
export const getFeatureFlags = (): Record<FeatureFlagKey, FeatureFlag> => {
  const envOverrides = getEnvOverrides();
  const localOverrides = getLocalOverrides();

  const mergedFlags = { ...defaultFlags };

  // Apply environment overrides
  Object.entries(envOverrides).forEach(([key, enabled]) => {
    if (mergedFlags[key as FeatureFlagKey]) {
      mergedFlags[key as FeatureFlagKey].enabled = enabled as boolean;
    }
  });

  // Apply local overrides
  Object.entries(localOverrides).forEach(([key, enabled]) => {
    if (mergedFlags[key as FeatureFlagKey]) {
      mergedFlags[key as FeatureFlagKey].enabled = enabled as boolean;
    }
  });

  return mergedFlags;
};

// Check if a feature is enabled
export const isFeatureEnabled = (key: FeatureFlagKey, userRole?: string): boolean => {
  const flags = getFeatureFlags();
  const flag = flags[key];

  if (!flag) {
    console.warn(`Feature flag "${key}" not found, defaulting to false`);
    return false;
  }

  if (!flag.enabled) {
    return false;
  }

  // Check role restriction
  if (flag.requiredRoles && flag.requiredRoles.length > 0) {
    if (!userRole || !flag.requiredRoles.includes(userRole)) {
      return false;
    }
  }

  // Check rollout percentage (simple hash-based distribution)
  if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
    const userId = localStorage.getItem('accubooks_user');
    if (userId) {
      const hash = simpleHash(userId + key);
      const userPercentile = hash % 100;
      return userPercentile < flag.rolloutPercentage;
    }
  }

  return true;
};

// Simple hash function for rollout percentage
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Set local override (for testing)
export const setFeatureFlagOverride = (key: FeatureFlagKey, enabled: boolean): void => {
  try {
    const overrides = getLocalOverrides();
    overrides[key] = enabled;
    localStorage.setItem('accubooks-feature-flags', JSON.stringify(overrides));
    console.log(`Feature flag "${key}" set to ${enabled} (local override)`);
  } catch (error) {
    console.error('Failed to set feature flag override:', error);
  }
};

// Clear all local overrides
export const clearFeatureFlagOverrides = (): void => {
  try {
    localStorage.removeItem('accubooks-feature-flags');
    console.log('All feature flag overrides cleared');
  } catch (error) {
    console.error('Failed to clear feature flag overrides:', error);
  }
};

// Get all flags (for debugging/admin UI)
export const getAllFeatureFlags = (): FeatureFlag[] => {
  const flags = getFeatureFlags();
  return Object.values(flags);
};
