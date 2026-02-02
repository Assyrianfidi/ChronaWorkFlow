// Beta Launch Configuration
// Phase 3: Controlled Beta Launch
// Date: February 1, 2026
// Purpose: Feature gating and safety limits for beta users

export interface BetaConfig {
  enabled: boolean;
  maxBetaUsers: number;
  features: {
    coreForecastingEnabled: boolean;
    coreAccountingEnabled: boolean;
    trustLayerEnabled: boolean;
    tierEnforcementEnabled: boolean;
    massExportsEnabled: boolean;
    highVolumeAutomationEnabled: boolean;
    irreversibleActionsEnabled: boolean;
    adminControlsEnabled: boolean;
  };
  safetyLimits: {
    perUserRateLimitPerMinute: number;
    forecastsPerHourPerUser: number;
    scenariosPerUser: number;
    queryExecutionTimeoutMs: number;
    maxQueueDepth: number;
    maxConcurrentRequestsPerUser: number;
  };
  monitoring: {
    alertOnLimitBreach: boolean;
    throttleOnBreach: boolean;
    logAllBetaActivity: boolean;
  };
}

export const betaConfig: BetaConfig = {
  enabled: true,
  maxBetaUsers: 20,
  
  features: {
    // ENABLED - Core functionality
    coreForecastingEnabled: true,
    coreAccountingEnabled: true,
    trustLayerEnabled: true,
    tierEnforcementEnabled: true,
    
    // DISABLED - High-risk features
    massExportsEnabled: false,
    highVolumeAutomationEnabled: false,
    irreversibleActionsEnabled: false,
    adminControlsEnabled: false,
  },
  
  safetyLimits: {
    // Rate limiting
    perUserRateLimitPerMinute: 60, // 1 request per second average
    
    // Forecast limits
    forecastsPerHourPerUser: 50, // Prevent abuse
    
    // Scenario limits
    scenariosPerUser: 20, // Per beta user (higher than tier limits for testing)
    
    // Query timeout
    queryExecutionTimeoutMs: 30000, // 30 seconds max
    
    // Queue limits
    maxQueueDepth: 100, // Prevent queue overflow
    
    // Concurrency limits
    maxConcurrentRequestsPerUser: 5, // Prevent resource exhaustion
  },
  
  monitoring: {
    alertOnLimitBreach: true,
    throttleOnBreach: true,
    logAllBetaActivity: true,
  },
};

/**
 * Check if beta is enabled
 */
export function isBetaEnabled(): boolean {
  return betaConfig.enabled;
}

/**
 * Check if a feature is enabled for beta users
 */
export function isFeatureEnabled(feature: keyof BetaConfig['features']): boolean {
  return betaConfig.features[feature];
}

/**
 * Get safety limit value
 */
export function getSafetyLimit(limit: keyof BetaConfig['safetyLimits']): number {
  return betaConfig.safetyLimits[limit];
}

/**
 * Check if user is within safety limits
 */
export function checkSafetyLimit(
  userId: string,
  limitType: keyof BetaConfig['safetyLimits'],
  currentValue: number
): { allowed: boolean; limit: number; message?: string } {
  const limit = getSafetyLimit(limitType);
  const allowed = currentValue < limit;
  
  return {
    allowed,
    limit,
    message: allowed ? undefined : `Safety limit exceeded: ${limitType} (${currentValue}/${limit})`,
  };
}

/**
 * Log beta activity
 */
export function logBetaActivity(
  userId: string,
  action: string,
  metadata?: Record<string, any>
) {
  if (betaConfig.monitoring.logAllBetaActivity) {
    console.log('[BETA ACTIVITY]', {
      timestamp: new Date().toISOString(),
      userId,
      action,
      metadata,
    });
  }
}
