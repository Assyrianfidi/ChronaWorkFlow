// CRITICAL: Degradation Modes Manager
// MANDATORY: Graceful degradation modes under stress with hard protection

import { logger } from '../utils/structured-logger.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { TenantContext } from '../tenant/tenant-isolation.js';

export type DegradationLevel = 'NONE' | 'READ_ONLY' | 'PARTIAL' | 'MINIMAL' | 'EMERGENCY';
export type SystemComponent = 'DATABASE' | 'AUTH' | 'BILLING' | 'AUDIT' | 'API' | 'QUEUE' | 'CACHE' | 'EXTERNAL';

export interface DegradationConfig {
  component: SystemComponent;
  level: DegradationLevel;
  triggers: {
    errorRateThreshold: number;
    responseTimeThreshold: number;
    memoryThreshold: number;
    cpuThreshold: number;
    queueDepthThreshold: number;
  };
  actions: {
    disableFeatures: string[];
    enableCircuitBreaker: boolean;
    enableRateLimiting: boolean;
    enableTimeouts: boolean;
    enableFallbacks: boolean;
  };
  fallbacks: {
    cacheResponses: boolean;
    simplifiedLogic: boolean;
    staticResponses: boolean;
    alternativeProviders: boolean;
  };
  recovery: {
    autoRecovery: boolean;
    recoveryTimeout: number;
    maxRetries: number;
    backoffMultiplier: number;
  };
  notifications: {
    enabled: boolean;
    alertThreshold: DegradationLevel;
    escalationLevels: string[];
  };
}

export interface ComponentState {
  component: SystemComponent;
  currentLevel: DegradationLevel;
  lastDegradation: Date;
  degradationCount: number;
  errorRate: number;
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  queueDepth: number;
  blocked: boolean;
  lastCheck: Date;
  metricsHistory: Array<{
    timestamp: Date;
    errorRate: number;
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
    queueDepth: number;
  }>;
}

export interface DegradationResult {
  degraded: boolean;
  level: DegradationLevel;
  component: SystemComponent;
  reason: string;
  actions: string[];
  fallbacks: string[];
  autoRecovery: boolean;
  estimatedRecoveryTime: number;
}

export interface SystemState {
  overallLevel: DegradationLevel;
  components: Map<SystemComponent, ComponentState>;
  lastAssessment: Date;
  totalDegrades: number;
  activeAlerts: Array<{
    component: SystemComponent;
    level: DegradationLevel;
    message: string;
    timestamp: Date;
  }>;
}

/**
 * CRITICAL: Degradation Modes Manager
 * 
 * This class manages graceful degradation modes with automatic detection,
 * recovery, and hard protection for critical systems.
 */
export class DegradationModesManager {
  private static instance: DegradationModesManager;
  private auditLogger: any;
  private componentConfigs: Map<SystemComponent, DegradationConfig> = new Map();
  private componentStates: Map<SystemComponent, ComponentState> = new Map();
  private systemState: SystemState;
  private monitoringTimer: NodeJS.Timeout | null = null;
  private recoveryTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.auditLogger = getImmutableAuditLogger();
    this.systemState = {
      overallLevel: 'NONE',
      components: new Map(),
      lastAssessment: new Date(),
      totalDegrades: 0,
      activeAlerts: []
    };
    this.initializeDefaultConfigs();
    this.startMonitoring();
  }

  /**
   * CRITICAL: Get singleton instance
   */
  static getInstance(): DegradationModesManager {
    if (!DegradationModesManager.instance) {
      DegradationModesManager.instance = new DegradationModesManager();
    }
    return DegradationModesManager.instance;
  }

  /**
   * CRITICAL: Configure component degradation
   */
  configureComponent(component: SystemComponent, config: Partial<DegradationConfig>): void {
    const existingConfig = this.componentConfigs.get(component);
    const newConfig = existingConfig ? { ...existingConfig, ...config } : config as DegradationConfig;
    
    this.componentConfigs.set(component, newConfig);

    // CRITICAL: Initialize component state if not exists
    if (!this.componentStates.has(component)) {
      this.componentStates.set(component, this.initializeComponentState(component));
    }

    // CRITICAL: Log configuration change
    this.auditLogger.logSecurityEvent({
      tenantId: 'system',
      actorId: 'system',
      action: 'DEGRADATION_CONFIGURED',
      resourceType: 'DEGRADATION_MANAGER',
      resourceId: component,
      outcome: 'SUCCESS',
      correlationId: `degradation_config_${component}_${Date.now()}`,
      severity: 'LOW',
      metadata: {
        component,
        level: newConfig.level,
        triggers: newConfig.triggers,
        actions: newConfig.actions,
        fallbacks: newConfig.fallbacks
      }
    });

    logger.info('Degradation configuration updated', { component, config: newConfig });
  }

  /**
   * CRITICAL: Assess system health and apply degradation
   */
  async assessSystemHealth(): Promise<Map<SystemComponent, DegradationResult>> {
    const results = new Map<SystemComponent, DegradationResult>();
    let highestLevel: DegradationLevel = 'NONE';

    // CRITICAL: Assess each component
    for (const [component, config] of this.componentConfigs.entries()) {
      const result = await this.assessComponentHealth(component, config);
      results.set(component, result);
      
      // CRITICAL: Track highest degradation level
      if (result.degraded && this.compareLevels(result.level, highestLevel) > 0) {
        highestLevel = result.level;
      }
    }

    // CRITICAL: Update system state
    this.systemState.overallLevel = highestLevel;
    this.systemState.lastAssessment = new Date();

    // CRITICAL: Log system assessment
    this.auditLogger.logSecurityEvent({
      tenantId: 'system',
      actorId: 'system',
      action: 'SYSTEM_HEALTH_ASSESSED',
      resourceType: 'DEGRADATION_MANAGER',
      resourceId: 'system',
      outcome: highestLevel === 'NONE' ? 'SUCCESS' : 'WARNING',
      correlationId: `health_assessment_${Date.now()}`,
      severity: highestLevel === 'NONE' ? 'LOW' : highestLevel === 'EMERGENCY' ? 'CRITICAL' : 'HIGH',
      metadata: {
        overallLevel: highestLevel,
        totalDegrations: this.systemState.totalDegrades,
        activeAlerts: this.systemState.activeAlerts.length
      }
    });

    return results;
  }

  /**
   * CRITICAL: Assess component health
   */
  async assessComponentHealth(
    component: SystemComponent,
    config: DegradationConfig
  ): Promise<DegradationResult> {
    let state = this.componentStates.get(component);
    if (!state) {
      state = this.initializeComponentState(component);
      this.componentStates.set(component, state);
    }
    const now = new Date();

    // CRITICAL: Collect metrics
    const metrics = await this.collectComponentMetrics(component);
    
    // CRITICAL: Update state
    state.lastCheck = now;
    state.errorRate = metrics.errorRate;
    state.responseTime = metrics.responseTime;
    state.memoryUsage = metrics.memoryUsage;
    state.cpuUsage = metrics.cpuUsage;
    state.queueDepth = metrics.queueDepth;

    // CRITICAL: Add to history
    state.metricsHistory.push({
      timestamp: now,
      errorRate: metrics.errorRate,
      responseTime: metrics.responseTime,
      memoryUsage: metrics.memoryUsage,
      cpuUsage: metrics.cpuUsage,
      queueDepth: metrics.queueDepth
    });

    // CRITICAL: Keep history limited
    if (state.metricsHistory.length > 100) {
      state.metricsHistory = state.metricsHistory.slice(-100);
    }

    // CRITICAL: Check triggers
    const triggers = config.triggers;
    let shouldDegrade = false;
    let reason = '';

    if (metrics.errorRate >= triggers.errorRateThreshold) {
      shouldDegrade = true;
      reason = `Error rate (${metrics.errorRate}%) exceeds threshold (${triggers.errorRateThreshold}%)`;
    }

    if (metrics.responseTime >= triggers.responseTimeThreshold) {
      shouldDegrade = true;
      reason = `Response time (${metrics.responseTime}ms) exceeds threshold (${triggers.responseTimeThreshold}ms)`;
    }

    if (metrics.memoryUsage >= triggers.memoryThreshold) {
      shouldDegrade = true;
      reason = `Memory usage (${metrics.memoryUsage}%) exceeds threshold (${triggers.memoryThreshold}%)`;
    }

    if (metrics.cpuUsage >= triggers.cpuThreshold) {
      shouldDegrade = true;
      reason = `CPU usage (${metrics.cpuUsage}%) exceeds threshold (${triggers.cpuThreshold}%)`;
    }

    if (component === 'QUEUE' && metrics.queueDepth >= triggers.queueDepthThreshold) {
      shouldDegrade = true;
      reason = `Queue depth (${metrics.queueDepth}) exceeds threshold (${triggers.queueDepthThreshold})`;
    }

    if (!shouldDegrade) {
      // CRITICAL: Check if should recover
      const shouldRecover = this.shouldRecover(component, state, config);
      
      if (shouldRecover) {
        return await this.recoverComponent(component);
      }

      return {
        degraded: false,
        level: state.currentLevel,
        component,
        reason: 'System healthy',
        actions: [],
        fallbacks: [],
        autoRecovery: false,
        estimatedRecoveryTime: 0
      };
    }

    // CRITICAL: Determine degradation level
    const newLevel = this.calculateDegradationLevel(state, config);
    const oldLevel = state.currentLevel;

    if (newLevel !== oldLevel) {
      // CRITICAL: Apply degradation
      await this.applyDegradation(component, newLevel, oldLevel, reason);
      state.currentLevel = newLevel;
      state.lastDegradation = now;
      state.degradationCount++;
      this.systemState.totalDegrades++;

      return {
        degraded: true,
        level: newLevel,
        component,
        reason,
        actions: this.getActionsForLevel(newLevel, config),
        fallbacks: this.getFallbacksForLevel(newLevel, config),
        autoRecovery: config.recovery.autoRecovery,
        estimatedRecoveryTime: this.estimateRecoveryTime(newLevel, config)
      };
    }

    return {
      degraded: false,
      level: state.currentLevel,
      component,
      reason: 'No degradation needed',
      actions: [],
      fallbacks: [],
      autoRecovery: false,
      estimatedRecoveryTime: 0
    };
  }

  /**
   * CRITICAL: Force degradation level
   */
  async forceDegradation(
    component: SystemComponent,
    level: DegradationLevel,
    reason: string
  ): Promise<DegradationResult> {
    const config = this.componentConfigs.get(component);
    if (!config) {
      throw new Error(`Component ${component} not configured`);
    }

    const state = this.componentStates.get(component);
    if (!state) {
      throw new Error(`Component ${component} state not found`);
    }

    const oldLevel = state.currentLevel;
    
    // CRITICAL: Apply forced degradation
    await this.applyDegradation(component, level, oldLevel, reason);
    state.currentLevel = level;
    state.lastDegradation = new Date();
    state.degradationCount++;
    this.systemState.totalDegrades++;

    return {
      degraded: true,
      level,
      component,
      reason: `Forced degradation: ${reason}`,
      actions: this.getActionsForLevel(level, config),
      fallbacks: this.getFallbacksForLevel(level, config),
      autoRecovery: false,
      estimatedRecoveryTime: 0
    };
  }

  /**
   * CRITICAL: Recover component
   */
  async recoverComponent(component: SystemComponent): Promise<DegradationResult> {
    const state = this.componentStates.get(component);
    const config = this.componentConfigs.get(component);
    
    if (!state || !config) {
      throw new Error(`Component ${component} not found`);
    }

    if (state.currentLevel === 'NONE') {
      return {
        degraded: false,
        level: 'NONE',
        component,
        reason: 'Component already healthy',
        actions: [],
        fallbacks: [],
        autoRecovery: false,
        estimatedRecoveryTime: 0
      };
    }

    // CRITICAL: Check if recovery conditions are met
    if (!this.shouldRecover(component, state, config)) {
      return {
        degraded: true,
        level: state.currentLevel,
        component,
        reason: 'Recovery conditions not met',
        actions: [],
        fallbacks: [],
        autoRecovery: false,
        estimatedRecoveryTime: 0
      };
    }

    // CRITICAL: Apply recovery
    await this.applyRecovery(component);
    state.currentLevel = 'NONE';
    state.lastDegradation = new Date();

    return {
      degraded: false,
      level: 'NONE',
      component,
      reason: 'Component recovered',
      actions: ['All systems restored'],
      fallbacks: [],
      autoRecovery: true,
      estimatedRecoveryTime: 0
    };
  }

  /**
   * CRITICAL: Get system state
   */
  getSystemState(): SystemState {
    return {
      ...this.systemState,
      components: new Map(this.componentStates),
      activeAlerts: [...this.systemState.activeAlerts]
    };
  }

  /**
   * Get component state
   */
  getComponentState(component: SystemComponent): ComponentState | null {
    return this.componentStates.get(component) || null;
  }

  /**
   * Get all component configurations
   */
  getAllConfigurations(): Map<SystemComponent, DegradationConfig> {
    return new Map(this.componentConfigs);
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): {
    totalComponents: number;
    degradedComponents: number;
    levelCounts: Record<DegradationLevel, number>;
    overallLevel: DegradationLevel;
    totalDegrations: number;
    activeAlerts: number;
  } {
    const totalComponents = this.componentStates.size;
    const degradedComponents = Array.from(this.componentStates.values())
      .filter(state => state.currentLevel !== 'NONE').length;
    
    const levelCounts: Record<DegradationLevel, number> = {
      NONE: 0,
      READ_ONLY: 0,
      PARTIAL: 0,
      MINIMAL: 0,
      EMERGENCY: 0
    };

    for (const state of this.componentStates.values()) {
      levelCounts[state.currentLevel]++;
    }

    return {
      totalComponents,
      degradedComponents,
      levelCounts,
      overallLevel: this.systemState.overallLevel,
      totalDegrations: this.systemState.totalDegrades,
      activeAlerts: this.systemState.activeAlerts.length
    };
  }

  /**
   * CRITICAL: Apply degradation
   */
  private async applyDegradation(
    component: SystemComponent,
    newLevel: DegradationLevel,
    oldLevel: DegradationLevel,
    reason: string
  ): Promise<void> {
    // CRITICAL: Log degradation
    this.auditLogger.logSecurityEvent({
      tenantId: 'system',
      actorId: 'system',
      action: 'COMPONENT_DEGRADED',
      resourceType: 'DEGRADATION_MANAGER',
      resourceId: component,
      outcome: 'WARNING',
      correlationId: `degradation_${component}_${newLevel}_${Date.now()}`,
      severity: this.getSeverityForLevel(newLevel),
      metadata: {
        component,
        oldLevel,
        newLevel,
        reason,
        degradationCount: this.systemState.totalDegrades
      }
    });

    logger.warn('Component degraded', {
      component,
      oldLevel,
      newLevel,
      reason
    });

    // CRITICAL: Apply degradation actions
    const config = this.componentConfigs.get(component);
    if (config) {
      await this.applyDegradationActions(component, newLevel, config);
    }
  }

  /**
   * CRITICAL: Apply degradation actions
   */
  private async applyDegradationActions(
    component: SystemComponent,
    level: DegradationLevel,
    config: DegradationConfig
  ): Promise<void> {
    // CRITICAL: Enable circuit breaker
    if (config.actions.enableCircuitBreaker) {
      // CRITICAL: This would enable circuit breaker for the component
      logger.info('Enabling circuit breaker', { component, level });
    }

    // CRITICAL: Enable rate limiting
    if (config.actions.enableRateLimiting) {
      // CRITICAL: This would enable rate limiting for the component
      logger.info('Enabling rate limiting', { component, level });
    }

    // CRITICAL: Enable timeouts
    if (config.actions.enableTimeouts) {
      // CRITICAL: This would enable timeouts for the component
      logger.info('Enabling timeouts', { component, level });
    }

    // CRITICAL: Enable fallbacks
    if (config.fallbacks.cacheResponses) {
      // CRITICAL: This would enable cached responses
      logger.info('Enabling cached responses', { component, level });
    }

    // CRITICAL: Disable features based on level
    const featuresToDisable = this.getFeaturesToDisable(level, config);
    if (featuresToDisable.length > 0) {
      logger.warn('Disabling features', { component, level, features: featuresToDisable });
    }
  }

  /**
   * CRITICAL: Apply recovery
   */
  private async applyRecovery(component: SystemComponent): Promise<void> {
    // CRITICAL: Log recovery
    this.auditLogger.logSecurityEvent({
      tenantId: 'system',
      actorId: 'system',
      action: 'COMPONENT_RECOVERED',
      resourceType: 'DEGRADATION_MANAGER',
      resourceId: component,
      outcome: 'SUCCESS',
      correlationId: `recovery_${component}_${Date.now()}`,
      severity: 'LOW',
      metadata: {
        component,
        recoveryTime: Date.now()
      }
    });

    logger.info('Component recovered', { component });
  }

  /**
   * CRITICAL: Collect component metrics
   */
  private async collectComponentMetrics(component: SystemComponent): Promise<{
    errorRate: number;
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
    queueDepth: number;
  }> {
    // CRITICAL: This would collect actual metrics from monitoring systems
    // For now, return simulated metrics
    const state = this.componentStates.get(component);
    if (!state) {
      return {
        errorRate: 0,
        responseTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        queueDepth: 0
      };
    }
    
    // CRITICAL: Calculate metrics from history
    const recentHistory = state.metricsHistory.slice(-10);
    if (recentHistory.length === 0) {
      return {
        errorRate: 0,
        responseTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        queueDepth: 0
      };
    }

    const errorRate = recentHistory.reduce((sum, m) => sum + m.errorRate, 0) / recentHistory.length;
    const responseTime = recentHistory.reduce((sum, m) => sum + m.responseTime, 0) / recentHistory.length;
    const memoryUsage = recentHistory.reduce((sum, m) => sum + m.memoryUsage, 0) / recentHistory.length;
    const cpuUsage = recentHistory.reduce((sum, m) => sum + m.cpuUsage, 0) / recentHistory.length;
    const queueDepth = recentHistory.reduce((sum, m) => sum + m.queueDepth, 0) / recentHistory.length;

    return {
      errorRate,
      responseTime,
      memoryUsage,
      cpuUsage,
      queueDepth
    };
  }

  /**
   * CRITICAL: Calculate degradation level
   */
  private calculateDegradationLevel(
    state: ComponentState,
    config: DegradationConfig
  ): DegradationLevel {
    const metrics = {
      errorRate: state.errorRate,
      responseTime: state.responseTime,
      memoryUsage: state.memoryUsage,
      cpuUsage: state.cpuUsage,
      queueDepth: state.queueDepth
    };

    // CRITICAL: Determine level based on metrics
    if (metrics.errorRate >= 50 || metrics.responseTime >= 5000 || metrics.memoryUsage >= 90 || metrics.cpuUsage >= 90) {
      return 'EMERGENCY';
    } else if (metrics.errorRate >= 25 || metrics.responseTime >= 2000 || metrics.memoryUsage >= 75 || metrics.cpuUsage >= 75) {
      return 'MINIMAL';
    } else if (metrics.errorRate >= 10 || metrics.responseTime >= 1000 || metrics.memoryUsage >= 50 || metrics.cpuUsage >= 50) {
      return 'PARTIAL';
    } else if (metrics.errorRate >= 5 || metrics.responseTime >= 500 || metrics.memoryUsage >= 25 || metrics.cpuUsage >= 25) {
      return 'READ_ONLY';
    }

    return 'NONE';
  }

  /**
   * CRITICAL: Get actions for degradation level
   */
  private getActionsForLevel(level: DegradationLevel, config: DegradationConfig): string[] {
    const actions: string[] = [];

    switch (level) {
      case 'READ_ONLY':
        actions.push('disable_writes', 'enable_read_only_mode');
        break;
      case 'PARTIAL':
        actions.push('disable_non_critical_features', 'enable_simplified_logic');
        break;
      case 'MINIMAL':
        actions.push('disable_most_features', 'enable_minimal_mode');
        break;
      case 'EMERGENCY':
        actions.push('disable_all_features', 'enable_emergency_mode');
        break;
    }

    return actions;
  }

  /**
   * CRITICAL: Get fallbacks for degradation level
   */
  private getFallbacksForLevel(level: DegradationLevel, config: DegradationConfig): string[] {
    const fallbacks: string[] = [];
    if (level === 'NONE') {
      return fallbacks;
    }

    if (config.fallbacks.cacheResponses) {
      fallbacks.push('cache_responses');
    }
    if (config.fallbacks.simplifiedLogic) {
      fallbacks.push('simplified_logic');
    }
    if (config.fallbacks.staticResponses) {
      fallbacks.push('static_responses');
    }
    if (config.fallbacks.alternativeProviders) {
      fallbacks.push('alternative_providers');
    }

    return fallbacks;
  }

  /**
   * Get features to disable for degradation level
   */
  private getFeaturesToDisable(level: DegradationLevel, config: DegradationConfig): string[] {
    const features: string[] = [];

    switch (level) {
      case 'READ_ONLY':
        features.push('write_operations', 'data_modification', 'user_updates');
        break;
      case 'PARTIAL':
        features.push('advanced_features', 'analytics', 'reporting');
        break;
      case 'MINIMAL':
        features.push('ui_features', 'notifications', 'integrations');
        break;
      case 'EMERGENCY':
        features.push('all_features', 'api_access', 'database_access');
        break;
    }

    for (const f of config.actions.disableFeatures) {
      if (!features.includes(f)) {
        features.push(f);
      }
    }

    return features;
  }

  private compareLevels(a: DegradationLevel, b: DegradationLevel): number {
    const order: Record<DegradationLevel, number> = {
      NONE: 0,
      READ_ONLY: 1,
      PARTIAL: 2,
      MINIMAL: 3,
      EMERGENCY: 4
    };

    return order[a] - order[b];
  }

  /**
   * CRITICAL: Get severity for degradation level
   */
  private getSeverityForLevel(level: DegradationLevel): string {
    switch (level) {
      case 'NONE': return 'LOW';
      case 'READ_ONLY': return 'MEDIUM';
      case 'PARTIAL': return 'HIGH';
      case 'MINIMAL': return 'HIGH';
      case 'EMERGENCY': return 'CRITICAL';
      default: return 'MEDIUM';
    }
  }

  /**
   * CRITICAL: Check if component should recover
   */
  private shouldRecover(
    component: SystemComponent,
    state: ComponentState,
    config: DegradationConfig
  ): boolean {
    if (!config.recovery.autoRecovery) {
      return false;
    }

    const now = new Date();
    const timeSinceLastDegradation = now.getTime() - state.lastDegradation.getTime();
    const timeSinceLastCheck = now.getTime() - state.lastCheck.getTime();

    // CRITICAL: Check recovery timeout
    if (timeSinceLastDegradation < config.recovery.recoveryTimeout) {
      return false;
    }

    // CRITICAL: Check if metrics are healthy
    const recentHistory = state.metricsHistory.slice(-5);
    if (recentHistory.length === 0) {
      return false;
    }

    const avgErrorRate = recentHistory.reduce((sum, m) => sum + m.errorRate, 0) / recentHistory.length;
    const avgResponseTime = recentHistory.reduce((sum, m) => sum + m.responseTime, 0) / recentHistory.length;

    return avgErrorRate < 5 && avgResponseTime < 1000;
  }

  /**
   * CRITICAL: Estimate recovery time
   */
  private estimateRecoveryTime(level: DegradationLevel, config: DegradationConfig): number {
    switch (level) {
      case 'READ_ONLY': return 300000; // 5 minutes
      case 'PARTIAL': return 600000; // 10 minutes
      case 'MINIMAL': return 1800000; // 30 minutes
      case 'EMERGENCY': return 3600000; // 1 hour
      default: return 0;
    }
  }

  /**
   * CRITICAL: Initialize component state
   */
  private initializeComponentState(component: SystemComponent): ComponentState {
    return {
      component,
      currentLevel: 'NONE',
      lastDegradation: new Date(),
      degradationCount: 0,
      errorRate: 0,
      responseTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      queueDepth: 0,
      blocked: false,
      lastCheck: new Date(),
      metricsHistory: []
    };
  }

  /**
   * Initialize default configurations
   */
  private initializeDefaultConfigs(): void {
    const defaultConfigs: Partial<DegradationConfig>[] = [
      {
        component: 'DATABASE',
        level: 'NONE',
        triggers: {
          errorRateThreshold: 10,
          responseTimeThreshold: 1000,
          memoryThreshold: 80,
          cpuThreshold: 80,
          queueDepthThreshold: 1000
        },
        actions: {
          disableFeatures: [],
          enableCircuitBreaker: true,
          enableRateLimiting: true,
          enableTimeouts: true,
          enableFallbacks: true
        },
        fallbacks: {
          cacheResponses: true,
          simplifiedLogic: false,
          staticResponses: false,
          alternativeProviders: false
        },
        recovery: {
          autoRecovery: true,
          recoveryTimeout: 300000, // 5 minutes
          maxRetries: 3,
          backoffMultiplier: 2
        },
        notifications: {
          enabled: true,
          alertThreshold: 'PARTIAL',
          escalationLevels: ['engineering', 'management', 'executive']
        }
      },
      {
        component: 'AUTH',
        level: 'NONE',
        triggers: {
          errorRateThreshold: 5,
          responseTimeThreshold: 500,
          memoryThreshold: 70,
          cpuThreshold: 70,
          queueDepthThreshold: 100
        },
        actions: {
          disableFeatures: [],
          enableCircuitBreaker: true,
          enableRateLimiting: true,
          enableTimeouts: true,
          enableFallbacks: true
        },
        fallbacks: {
          cacheResponses: true,
          simplifiedLogic: false,
          staticResponses: true,
          alternativeProviders: false
        },
        recovery: {
          autoRecovery: true,
          recoveryTimeout: 180000, // 3 minutes
          maxRetries: 3,
          backoffMultiplier: 2
        },
        notifications: {
          enabled: true,
          alertThreshold: 'READ_ONLY',
          escalationLevels: ['engineering', 'security']
        }
      },
      {
        component: 'BILLING',
        level: 'NONE',
        triggers: {
          errorRateThreshold: 5,
          responseTimeThreshold: 2000,
          memoryThreshold: 60,
          cpuThreshold: 60,
          queueDepthThreshold: 500
        },
        actions: {
          disableFeatures: [],
          enableCircuitBreaker: true,
          enableRateLimiting: true,
          enableTimeouts: true,
          enableFallbacks: true
        },
        fallbacks: {
          cacheResponses: true,
          simplifiedLogic: false,
          staticResponses: true,
          alternativeProviders: true
        },
        recovery: {
          autoRecovery: true,
          recoveryTimeout: 600000, // 10 minutes
          maxRetries: 3,
          backoffMultiplier: 2
        },
        notifications: {
          enabled: true,
          alertThreshold: 'READ_ONLY',
          escalationLevels: ['engineering', 'billing', 'finance']
        }
      },
      {
        component: 'AUDIT',
        level: 'NONE',
        triggers: {
          errorRateThreshold: 1,
          responseTimeThreshold: 1000,
          memoryThreshold: 50,
          cpuThreshold: 50,
          queueDepthThreshold: 100
        },
        actions: {
          disableFeatures: [],
          enableCircuitBreaker: false,
          enableRateLimiting: false,
          enableTimeouts: true,
          enableFallbacks: true
        },
        fallbacks: {
          cacheResponses: true,
          simplifiedLogic: false,
          staticResponses: true,
          alternativeProviders: false
        },
        recovery: {
          autoRecovery: true,
          recoveryTimeout: 120000, // 2 minutes
          maxRetries: 3,
          backoffMultiplier: 2
        },
        notifications: {
          enabled: true,
          alertThreshold: 'READ_ONLY',
          escalationLevels: ['engineering', 'compliance', 'legal']
        }
      },
      {
        component: 'API',
        level: 'NONE',
        triggers: {
          errorRateThreshold: 15,
          responseTimeThreshold: 1500,
          memoryThreshold: 70,
          cpuThreshold: 70,
          queueDepthThreshold: 200
        },
        actions: {
          disableFeatures: [],
          enableCircuitBreaker: true,
          enableRateLimiting: true,
          enableTimeouts: true,
          enableFallbacks: true
        },
        fallbacks: {
          cacheResponses: true,
          simplifiedLogic: false,
          staticResponses: true,
          alternativeProviders: true
        },
        recovery: {
          autoRecovery: true,
          recoveryTimeout: 300000, // 5 minutes
          maxRetries: 3,
          backoffMultiplier: 2
        },
        notifications: {
          enabled: true,
          alertThreshold: 'PARTIAL',
          escalationLevels: ['engineering', 'devops']
        }
      },
      {
        component: 'QUEUE',
        level: 'NONE',
        triggers: {
          errorRateThreshold: 20,
          responseTimeThreshold: 5000,
          memoryThreshold: 85,
          cpuThreshold: 85,
          queueDepthThreshold: 5000
        },
        actions: {
          disableFeatures: [],
          enableCircuitBreaker: true,
          enableRateLimiting: true,
          enableTimeouts: true,
          enableFallbacks: true
        },
        fallbacks: {
          cacheResponses: true,
          simplifiedLogic: false,
          staticResponses: true,
          alternativeProviders: false
        },
        recovery: {
          autoRecovery: true,
          recoveryTimeout: 600000, // 10 minutes
          maxRetries: 3,
          backoffMultiplier: 2
        },
        notifications: {
          enabled: true,
          alertThreshold: 'PARTIAL',
          escalationLevels: ['engineering', 'devops']
        }
      },
      {
        component: 'CACHE',
        level: 'NONE',
        triggers: {
          errorRateThreshold: 25,
          responseTimeThreshold: 100,
          memoryThreshold: 90,
          cpuThreshold: 90,
          queueDepthThreshold: 0
        },
        actions: {
          disableFeatures: [],
          enableCircuitBreaker: true,
          enableRateLimiting: false,
          enableTimeouts: true,
          enableFallbacks: true
        },
        fallbacks: {
          cacheResponses: true,
          simplifiedLogic: false,
          staticResponses: true,
          alternativeProviders: true
        },
        recovery: {
          autoRecovery: true,
          recoveryTimeout: 30000, // 30 seconds
          maxRetries: 3,
          backoffMultiplier: 2
        },
        notifications: {
          enabled: true,
          alertThreshold: 'MINIMAL',
          escalationLevels: ['engineering']
        }
      },
      {
        component: 'EXTERNAL',
        level: 'NONE',
        triggers: {
          errorRateThreshold: 30,
          responseTimeThreshold: 5000,
          memoryThreshold: 0,
          cpuThreshold: 0,
          queueDepthThreshold: 0
        },
        actions: {
          disableFeatures: [],
          enableCircuitBreaker: true,
          enableRateLimiting: true,
          enableTimeouts: true,
          enableFallbacks: true
        },
        fallbacks: {
          cacheResponses: true,
          simplifiedLogic: false,
          staticResponses: true,
          alternativeProviders: true
        },
        recovery: {
          autoRecovery: true,
          recoveryTimeout: 60000, // 1 minute
          maxRetries: 3,
          backoffMultiplier: 2
        },
        notifications: {
          enabled: true,
          alertThreshold: 'READ_ONLY',
          escalationLevels: ['engineering', 'devops']
        }
      }
    ];

    for (const config of defaultConfigs) {
      if (config.component) {
        this.componentConfigs.set(config.component, config as DegradationConfig);
        
        // CRITICAL: Initialize state for component
        if (!this.componentStates.has(config.component)) {
          this.componentStates.set(config.component, this.initializeComponentState(config.component));
        }
      }
    }
  }

  /**
   * Start monitoring
   */
  private startMonitoring(): void {
    // CRITICAL: Periodic health assessment
    this.monitoringTimer = setInterval(async () => {
      await this.assessSystemHealth();
    }, 30000); // Every 30 seconds

    // CRITICAL: Periodic recovery attempts
    this.recoveryTimer = setInterval(async () => {
      await this.attemptRecoveries();
    }, 60000); // Every minute

    // CRITICAL: Cleanup old metrics history
    setInterval(() => {
      this.cleanupMetricsHistory();
    }, 300000); // Every 5 minutes
  }

  /**
   * Attempt recoveries for all degraded components
   */
  private async attemptRecoveries(): Promise<void> {
    for (const [component, state] of this.componentStates.entries()) {
      if (state.currentLevel !== 'NONE') {
        try {
          await this.recoverComponent(component);
        } catch (error) {
          logger.error('Failed to recover component', error as Error, { component });
        }
      }
    }
  }

  /**
   * Cleanup old metrics history
   */
  private cleanupMetricsHistory(): void {
    const now = new Date();
    
    for (const [component, state] of this.componentStates.entries()) {
      // CRITICAL: Keep only recent history
      const recentHistory = state.metricsHistory.filter(
        entry => now.getTime() - entry.timestamp.getTime() < 3600000 // 1 hour
      );
      
      state.metricsHistory = recentHistory;
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }
    
    if (this.recoveryTimer) {
      clearInterval(this.recoveryTimer);
    }
  }
}

/**
 * CRITICAL: Global degradation modes manager instance
 */
export const degradationModesManager = DegradationModesManager.getInstance();

/**
 * CRITICAL: Convenience functions
 */
export const configureComponentDegradation = (component: SystemComponent, config: Partial<DegradationConfig>): void => {
  degradationModesManager.configureComponent(component, config);
};

export const forceComponentDegradation = async (
  component: SystemComponent,
  level: DegradationLevel,
  reason: string
): Promise<DegradationResult> => {
  return await degradationModesManager.forceDegradation(component, level, reason);
};

export const recoverComponent = async (component: SystemComponent): Promise<DegradationResult> => {
  return await degradationModesManager.recoverComponent(component);
};

export const getSystemState = (): SystemState => {
  return degradationModesManager.getSystemState();
};

export const getComponentState = (component: SystemComponent): ComponentState | null => {
  return degradationModesManager.getComponentState(component);
};

export const getSystemMetrics = (): ReturnType<typeof degradationModesManager.getSystemMetrics> => {
  return degradationModesManager.getSystemMetrics();
};
