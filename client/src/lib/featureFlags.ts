/**
 * Frontend Feature Flags Client
 * Safe defaults with environment-aware evaluation
 */

import type { FeatureFlagKey, FeatureFlagContext } from '@/../../shared/featureFlags/types';

class FrontendFeatureFlags {
  private flags: Record<string, boolean> = {};
  private context: FeatureFlagContext;

  constructor() {
    this.context = {
      environment: this.getEnvironment(),
    };
  }

  /**
   * Initialize with server-provided flags
   */
  initialize(flags: Record<string, boolean>, context?: Partial<FeatureFlagContext>): void {
    this.flags = flags;
    this.context = {
      ...this.context,
      ...context,
    };
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(key: FeatureFlagKey): boolean {
    // Safe default: OFF if flag not found
    return this.flags[key] === true;
  }

  /**
   * Get all enabled flags
   */
  getEnabledFlags(): FeatureFlagKey[] {
    return Object.entries(this.flags)
      .filter(([_, enabled]) => enabled)
      .map(([key]) => key as FeatureFlagKey);
  }

  /**
   * Get all flags
   */
  getAllFlags(): Record<string, boolean> {
    return { ...this.flags };
  }

  /**
   * Update context (e.g., when user logs in)
   */
  updateContext(context: Partial<FeatureFlagContext>): void {
    this.context = {
      ...this.context,
      ...context,
    };
  }

  /**
   * Get current environment
   */
  private getEnvironment(): 'development' | 'staging' | 'production' {
    if (process.env.NODE_ENV === 'development') {
      return 'development';
    }
    
    const hostname = window.location.hostname;
    if (hostname.includes('staging')) {
      return 'staging';
    }
    
    return 'production';
  }
}

// Singleton instance
const featureFlags = new FrontendFeatureFlags();

export { featureFlags };
export default featureFlags;
