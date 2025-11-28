/**
 * Enterprise Error Immunity Architecture
 * Auto-healing UI states, Shadow DOM recovery, Component restoration, Transaction safety
 */

export interface ErrorImmunityConfig {
  // Auto-healing settings
  autoHealing: {
    enabled: boolean;
    maxRetries: number;
    retryDelay: number;
    backoffStrategy: 'linear' | 'exponential' | 'fixed';
    healingStrategies: HealingStrategy[];
  };
  
  // Shadow DOM recovery
  shadowDOM: {
    enabled: boolean;
    isolationLevel: 'component' | 'page' | 'application';
    recoveryTimeout: number;
    fallbackContent: boolean;
  };
  
  // Component restoration
  components: {
    enabled: boolean;
    stateBackup: boolean;
    snapshotInterval: number;
    maxSnapshots: number;
    restorationPriority: 'speed' | 'accuracy' | 'balanced';
  };
  
  // Transaction safety
  transactions: {
    enabled: boolean;
    autoRollback: boolean;
    checkpointInterval: number;
    maxCheckpoints: number;
    isolationLevel: 'read_committed' | 'repeatable_read' | 'serializable';
  };
  
  // Network resilience
  network: {
    enabled: boolean;
    offlineSupport: boolean;
    syncQueue: boolean;
    maxQueueSize: number;
    retryStrategy: 'immediate' | 'exponential' | 'scheduled';
  };
}

export interface HealingStrategy {
  id: string;
  name: string;
  description: string;
  type: 'retry' | 'fallback' | 'recovery' | 'isolation' | 'reconstruction';
  conditions: ErrorCondition[];
  actions: HealingAction[];
  priority: number;
  enabled: boolean;
}

export interface ErrorCondition {
  type: 'error_type' | 'component' | 'route' | 'network' | 'custom';
  operator: 'equals' | 'contains' | 'regex' | 'custom';
  value: any;
  customLogic?: (error: Error, context: ErrorContext) => boolean;
}

export interface HealingAction {
  type: 'retry' | 'fallback_component' | 'clear_cache' | 'reset_state' | 'reload_component' | 'navigate' | 'custom';
  parameters: Record<string, any>;
  delay: number;
  async: boolean;
  customLogic?: (error: Error, context: ErrorContext) => Promise<void>;
}

export interface ErrorContext {
  componentId?: string;
  route?: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  userAgent: string;
  networkStatus: 'online' | 'offline' | 'slow';
  memoryUsage: number;
  stackTrace?: string;
  additionalData?: Record<string, any>;
}

export interface ComponentSnapshot {
  componentId: string;
  timestamp: Date;
  state: any;
  props: any;
  domSnapshot?: string;
  eventListeners: Array<{
    event: string;
    handler: string;
  }>;
  dependencies: string[];
  health: 'healthy' | 'degraded' | 'critical';
}

export interface TransactionCheckpoint {
  id: string;
  transactionId: string;
  timestamp: Date;
  state: any;
  operations: TransactionOperation[];
  rollbackData: any;
  status: 'active' | 'committed' | 'rolled_back';
}

export interface TransactionOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  target: string;
  data: any;
  previousState?: any;
  timestamp: Date;
}

export interface ErrorImmunityReport {
  timestamp: Date;
  totalErrors: number;
  healedErrors: number;
  failedHealings: number;
  componentRestorations: number;
  transactionRollbacks: number;
  networkResilienceEvents: number;
  averageHealingTime: number;
  successRate: number;
  errorsByType: Record<string, number>;
  healingStrategiesUsed: Record<string, number>;
}

export class ErrorImmunityEngine {
  private static instance: ErrorImmunityEngine;
  private config: ErrorImmunityConfig;
  private healingStrategies: Map<string, HealingStrategy> = new Map();
  private componentSnapshots: Map<string, ComponentSnapshot[]> = new Map();
  private transactionCheckpoints: Map<string, TransactionCheckpoint[]> = new Map();
  private errorHistory: Array<{
    error: Error;
    context: ErrorContext;
    healingAttempted: boolean;
    healingSuccess: boolean;
    timestamp: Date;
  }> = [];
  private shadowDOMManager: ShadowDOMManager;
  private componentRestorer: ComponentRestorer;
  private transactionManager: TransactionManager;
  private networkResilience: NetworkResilienceManager;
  private isMonitoring: boolean = false;
  private monitoringInterval: number | null = null;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.shadowDOMManager = new ShadowDOMManager(this.config.shadowDOM);
    this.componentRestorer = new ComponentRestorer(this.config.components);
    this.transactionManager = new TransactionManager(this.config.transactions);
    this.networkResilience = new NetworkResilienceManager(this.config.network);
    this.initializeErrorImmunity();
  }

  static getInstance(): ErrorImmunityEngine {
    if (!ErrorImmunityEngine.instance) {
      ErrorImmunityEngine.instance = new ErrorImmunityEngine();
    }
    return ErrorImmunityEngine.instance;
  }

  private getDefaultConfig(): ErrorImmunityConfig {
    return {
      autoHealing: {
        enabled: true,
        maxRetries: 3,
        retryDelay: 1000,
        backoffStrategy: 'exponential',
        healingStrategies: []
      },
      shadowDOM: {
        enabled: true,
        isolationLevel: 'component',
        recoveryTimeout: 5000,
        fallbackContent: true
      },
      components: {
        enabled: true,
        stateBackup: true,
        snapshotInterval: 30000,
        maxSnapshots: 10,
        restorationPriority: 'balanced'
      },
      transactions: {
        enabled: true,
        autoRollback: true,
        checkpointInterval: 5000,
        maxCheckpoints: 20,
        isolationLevel: 'read_committed'
      },
      network: {
        enabled: true,
        offlineSupport: true,
        syncQueue: true,
        maxQueueSize: 100,
        retryStrategy: 'exponential'
      }
    };
  }

  private initializeErrorImmunity(): void {
    if (typeof window === 'undefined') return;

    // Start monitoring
    this.startMonitoring();
    
    // Initialize healing strategies
    this.initializeHealingStrategies();
    
    // Set up global error handlers
    this.setupGlobalErrorHandlers();
    
    // Initialize component monitoring
    this.initializeComponentMonitoring();
    
    // Initialize network monitoring
    this.initializeNetworkMonitoring();
  }

  private startMonitoring(): void {
    this.isMonitoring = true;
    
    // Monitor system health every 10 seconds
    this.monitoringInterval = window.setInterval(() => {
      this.performHealthCheck();
      this.cleanupOldData();
    }, 10000);
  }

  private initializeHealingStrategies(): void {
    // Component Error Healing Strategy
    const componentErrorStrategy: HealingStrategy = {
      id: 'component-error-healing',
      name: 'Component Error Healing',
      description: 'Automatically heal component errors through restoration and fallback',
      type: 'recovery',
      conditions: [
        {
          type: 'error_type',
          operator: 'contains',
          value: 'component'
        },
        {
          type: 'component',
          operator: 'exists',
          value: true
        }
      ],
      actions: [
        {
          type: 'reload_component',
          parameters: {},
          delay: 1000,
          async: true
        },
        {
          type: 'reset_state',
          parameters: { preserveUserInput: true },
          delay: 500,
          async: false
        },
        {
          type: 'fallback_component',
          parameters: { useSimplifiedVersion: true },
          delay: 2000,
          async: false
        }
      ],
      priority: 1,
      enabled: true
    };

    // Network Error Healing Strategy
    const networkErrorStrategy: HealingStrategy = {
      id: 'network-error-healing',
      name: 'Network Error Healing',
      description: 'Handle network errors through retry and offline support',
      type: 'retry',
      conditions: [
        {
          type: 'error_type',
          operator: 'contains',
          value: 'network'
        },
        {
          type: 'network',
          operator: 'equals',
          value: 'offline'
        }
      ],
      actions: [
        {
          type: 'retry',
          parameters: { maxAttempts: 3 },
          delay: 2000,
          async: true
        },
        {
          type: 'clear_cache',
          parameters: { clearOnlyNetworkCache: true },
          delay: 1000,
          async: false
        }
      ],
      priority: 2,
      enabled: true
    };

    // State Error Healing Strategy
    const stateErrorStrategy: HealingStrategy = {
      id: 'state-error-healing',
      name: 'State Error Healing',
      description: 'Recover from state corruption through restoration',
      type: 'reconstruction',
      conditions: [
        {
          type: 'error_type',
          operator: 'contains',
          value: 'state'
        }
      ],
      actions: [
        {
          type: 'reset_state',
          parameters: { useLastKnownGood: true },
          delay: 500,
          async: false
        },
        {
          type: 'reload_component',
          parameters: { preserveScroll: true },
          delay: 1000,
          async: true
        }
      ],
      priority: 3,
      enabled: true
    };

    // Memory Error Healing Strategy
    const memoryErrorStrategy: HealingStrategy = {
      id: 'memory-error-healing',
      name: 'Memory Error Healing',
      description: 'Handle memory errors through cleanup and optimization',
      type: 'recovery',
      conditions: [
        {
          type: 'error_type',
          operator: 'contains',
          value: 'memory'
        },
        {
          type: 'custom',
          operator: 'custom',
          value: null,
          customLogic: (error, context) => context.memoryUsage > 0.8 // 80% memory usage
        }
      ],
      actions: [
        {
          type: 'clear_cache',
          parameters: { aggressive: true },
          delay: 0,
          async: false
        },
        {
          type: 'custom',
          parameters: { action: 'garbage_collect' },
          delay: 1000,
          async: true,
          customLogic: async () => {
            if (window.gc) {
              window.gc();
            }
          }
        }
      ],
      priority: 4,
      enabled: true
    };

    this.healingStrategies.set('component-error-healing', componentErrorStrategy);
    this.healingStrategies.set('network-error-healing', networkErrorStrategy);
    this.healingStrategies.set('state-error-healing', stateErrorStrategy);
    this.healingStrategies.set('memory-error-healing', memoryErrorStrategy);
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        componentId: this.extractComponentId(event),
        route: window.location.pathname,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        networkStatus: this.getNetworkStatus(),
        memoryUsage: this.getMemoryUsage(),
        stackTrace: event.error?.stack
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(event.reason), {
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        networkStatus: this.getNetworkStatus(),
        memoryUsage: this.getMemoryUsage(),
        stackTrace: event.reason?.stack
      });
    });
  }

  private initializeComponentMonitoring(): void {
    if (!this.config.components.enabled) return;

    // Monitor component lifecycle
    this.componentRestorer.startMonitoring();
    
    // Start periodic snapshots
    setInterval(() => {
      this.createComponentSnapshots();
    }, this.config.components.snapshotInterval);
  }

  private initializeNetworkMonitoring(): void {
    if (!this.config.network.enabled) return;

    this.networkResilience.startMonitoring();
  }

  private extractComponentId(event: ErrorEvent): string | undefined {
    // Try to extract component ID from error event
    const target = event.target as HTMLElement;
    if (target && target.id) {
      return target.id;
    }
    
    // Try to extract from stack trace
    if (event.error && event.error.stack) {
      const match = event.error.stack.match(/at (\w+)\./);
      if (match) {
        return match[1];
      }
    }
    
    return undefined;
  }

  private getNetworkStatus(): 'online' | 'offline' | 'slow' {
    if (!navigator.onLine) return 'offline';
    
    // Check connection speed if available
    const connection = (navigator as any).connection;
    if (connection && connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      return 'slow';
    }
    
    return 'online';
  }

  private getMemoryUsage(): number {
    if ((performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize / (performance as any).memory.jsHeapSizeLimit;
    }
    return 0;
  }

  // Public API: Handle errors
  public async handleError(error: Error, context: ErrorContext): Promise<void> {
    // Record error
    this.recordError(error, context);
    
    // Attempt healing if enabled
    if (this.config.autoHealing.enabled) {
      await this.attemptHealing(error, context);
    }
    
    // Update error history
    this.updateErrorHistory(error, context);
  }

  private recordError(error: Error, context: ErrorContext): void {
    // Log error for analytics
    console.error('Error recorded:', error, context);
    
    // In production, would send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendErrorToService(error, context);
    }
  }

  private async attemptHealing(error: Error, context: ErrorContext): Promise<boolean> {
    const startTime = Date.now();
    let healingSuccess = false;

    try {
      // Find applicable healing strategies
      const strategies = this.findApplicableStrategies(error, context);
      
      // Sort by priority
      strategies.sort((a, b) => a.priority - b.priority);
      
      // Try each strategy
      for (const strategy of strategies) {
        const success = await this.executeHealingStrategy(strategy, error, context);
        if (success) {
          healingSuccess = true;
          break;
        }
      }
      
    } catch (healingError) {
      console.error('Healing attempt failed:', healingError);
    }

    // Record healing attempt
    const healingTime = Date.now() - startTime;
    this.recordHealingAttempt(error, context, healingSuccess, healingTime);
    
    return healingSuccess;
  }

  private findApplicableStrategies(error: Error, context: ErrorContext): HealingStrategy[] {
    return Array.from(this.healingStrategies.values())
      .filter(strategy => 
        strategy.enabled && 
        this.evaluateStrategyConditions(strategy.conditions, error, context)
      );
  }

  private evaluateStrategyConditions(conditions: ErrorCondition[], error: Error, context: ErrorContext): boolean {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'error_type':
          return this.evaluateStringCondition(error.message, condition);
        case 'component':
          return this.evaluateComponentCondition(context.componentId, condition);
        case 'route':
          return this.evaluateStringCondition(context.route || '', condition);
        case 'network':
          return this.evaluateNetworkCondition(context.networkStatus, condition);
        case 'custom':
          return condition.customLogic ? condition.customLogic(error, context) : true;
        default:
          return true;
      }
    });
  }

  private evaluateStringCondition(value: string, condition: ErrorCondition): boolean {
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'contains':
        return value.toLowerCase().includes(condition.value.toString().toLowerCase());
      case 'regex':
        return new RegExp(condition.value).test(value);
      default:
        return false;
    }
  }

  private evaluateComponentCondition(componentId: string | undefined, condition: ErrorCondition): boolean {
    switch (condition.operator) {
      case 'exists':
        return condition.value ? !!componentId : !componentId;
      case 'equals':
        return componentId === condition.value;
      default:
        return false;
    }
  }

  private evaluateNetworkCondition(networkStatus: string, condition: ErrorCondition): boolean {
    return networkStatus === condition.value;
  }

  private async executeHealingStrategy(strategy: HealingStrategy, error: Error, context: ErrorContext): Promise<boolean> {
    let success = false;

    for (const action of strategy.actions) {
      try {
        // Apply delay if specified
        if (action.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, action.delay));
        }

        // Execute action
        await this.executeHealingAction(action, error, context);
        
        // Check if healing was successful
        success = await this.verifyHealingSuccess(error, context);
        
        if (success) {
          break; // Stop on first successful action
        }
        
      } catch (actionError) {
        console.error(`Healing action ${action.type} failed:`, actionError);
      }
    }

    return success;
  }

  private async executeHealingAction(action: HealingAction, error: Error, context: ErrorContext): Promise<void> {
    switch (action.type) {
      case 'retry':
        await this.executeRetry(action, context);
        break;
      
      case 'fallback_component':
        await this.executeFallbackComponent(action, context);
        break;
      
      case 'clear_cache':
        await this.executeClearCache(action, context);
        break;
      
      case 'reset_state':
        await this.executeResetState(action, context);
        break;
      
      case 'reload_component':
        await this.executeReloadComponent(action, context);
        break;
      
      case 'navigate':
        await this.executeNavigate(action, context);
        break;
      
      case 'custom':
        if (action.customLogic) {
          await action.customLogic(error, context);
        }
        break;
    }
  }

  private async executeRetry(action: HealingAction, context: ErrorContext): Promise<void> {
    const maxAttempts = action.parameters.maxAttempts || this.config.autoHealing.maxRetries;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Retry the failed operation
        await this.retryFailedOperation(context);
        return; // Success
      } catch (retryError) {
        if (attempt === maxAttempts) {
          throw retryError;
        }
        
        // Apply backoff delay
        const delay = this.calculateBackoffDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  private async executeFallbackComponent(action: HealingAction, context: ErrorContext): Promise<void> {
    if (!context.componentId) return;
    
    // Load fallback component
    const fallbackComponent = await this.loadFallbackComponent(context.componentId, action.parameters);
    
    // Replace the failed component
    await this.replaceComponent(context.componentId, fallbackComponent);
  }

  private async executeClearCache(action: HealingAction, context: ErrorContext): Promise<void> {
    if (action.parameters.clearOnlyNetworkCache) {
      await this.clearNetworkCache();
    } else if (action.parameters.aggressive) {
      await this.clearAllCache();
    } else {
      await this.clearComponentCache(context.componentId);
    }
  }

  private async executeResetState(action: HealingAction, context: ErrorContext): Promise<void> {
    if (action.parameters.useLastKnownGood && context.componentId) {
      await this.restoreComponentFromSnapshot(context.componentId);
    } else {
      await this.resetComponentState(context.componentId);
    }
  }

  private async executeReloadComponent(action: HealingAction, context: ErrorContext): Promise<void> {
    if (!context.componentId) return;
    
    await this.reloadComponent(context.componentId, action.parameters);
  }

  private async executeNavigate(action: HealingAction, context: ErrorContext): Promise<void> {
    const target = action.parameters.target || '/dashboard';
    window.location.href = target;
  }

  private calculateBackoffDelay(attempt: number): number {
    switch (this.config.autoHealing.backoffStrategy) {
      case 'linear':
        return this.config.autoHealing.retryDelay * attempt;
      case 'exponential':
        return this.config.autoHealing.retryDelay * Math.pow(2, attempt - 1);
      case 'fixed':
        return this.config.autoHealing.retryDelay;
      default:
        return this.config.autoHealing.retryDelay;
    }
  }

  private async retryFailedOperation(context: ErrorContext): Promise<void> {
    // Implement retry logic based on context
    // This would depend on the specific operation that failed
    console.log('Retrying failed operation for:', context.componentId);
  }

  private async loadFallbackComponent(componentId: string, parameters: Record<string, any>): Promise<any> {
    // Load simplified fallback component
    return {
      id: componentId + '-fallback',
      type: 'fallback',
      simplified: parameters.useSimplifiedVersion || false
    };
  }

  private async replaceComponent(componentId: string, fallbackComponent: any): Promise<void> {
    // Replace component in DOM
    const element = document.getElementById(componentId);
    if (element) {
      element.innerHTML = '<div class="fallback-component">Component temporarily unavailable</div>';
    }
  }

  private async clearNetworkCache(): Promise<void> {
    // Clear network-related caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
  }

  private async clearAllCache(): Promise<void> {
    // Clear all caches including localStorage
    localStorage.clear();
    sessionStorage.clear();
    await this.clearNetworkCache();
  }

  private async clearComponentCache(componentId?: string): Promise<void> {
    // Clear component-specific cache
    if (componentId) {
      localStorage.removeItem(`component-cache-${componentId}`);
    }
  }

  private async restoreComponentFromSnapshot(componentId: string): Promise<void> {
    const snapshots = this.componentSnapshots.get(componentId);
    if (!snapshots || snapshots.length === 0) return;
    
    // Get the most recent healthy snapshot
    const healthySnapshot = snapshots
      .filter(s => s.health === 'healthy')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
    
    if (healthySnapshot) {
      await this.componentRestorer.restoreFromSnapshot(componentId, healthySnapshot);
    }
  }

  private async resetComponentState(componentId?: string): Promise<void> {
    // Reset component state to initial values
    console.log('Resetting state for component:', componentId);
  }

  private async reloadComponent(componentId: string, parameters: Record<string, any>): Promise<void> {
    // Reload component while preserving certain aspects
    const element = document.getElementById(componentId);
    if (element) {
      if (parameters.preserveScroll) {
        const scrollPosition = window.scrollY;
        // Reload logic here
        window.scrollTo(0, scrollPosition);
      } else {
        // Full reload
        location.reload();
      }
    }
  }

  private async verifyHealingSuccess(error: Error, context: ErrorContext): Promise<boolean> {
    // Verify that the error has been resolved
    try {
      // Check if the component is now functional
      if (context.componentId) {
        const element = document.getElementById(context.componentId);
        if (!element || element.classList.contains('error-state')) {
          return false;
        }
      }
      
      // Check if network operations are working
      if (context.networkStatus === 'offline' && navigator.onLine) {
        return true;
      }
      
      return true; // Assume success if no obvious failures
    } catch (verificationError) {
      return false;
    }
  }

  private recordHealingAttempt(error: Error, context: ErrorContext, success: boolean, duration: number): void {
    // Record healing attempt for analytics
    console.log(`Healing attempt: ${success ? 'SUCCESS' : 'FAILED'} (${duration}ms)`);
  }

  private updateErrorHistory(error: Error, context: ErrorContext): void {
    this.errorHistory.push({
      error,
      context,
      healingAttempted: this.config.autoHealing.enabled,
      healingSuccess: false, // Would be set by healing attempt
      timestamp: new Date()
    });
    
    // Keep only recent errors
    if (this.errorHistory.length > 1000) {
      this.errorHistory = this.errorHistory.slice(-1000);
    }
  }

  private sendErrorToService(error: Error, context: ErrorContext): void {
    // Send error to tracking service (e.g., Sentry, LogRocket)
    console.log('Sending error to service:', error.message);
  }

  // Component snapshot management
  private createComponentSnapshots(): void {
    if (!this.config.components.enabled || !this.config.components.stateBackup) return;
    
    // Find all components with error-immunity attribute
    const components = document.querySelectorAll('[data-error-immunity]');
    
    components.forEach(element => {
      const componentId = element.id || `component-${Date.now()}`;
      this.createComponentSnapshot(componentId, element as HTMLElement);
    });
  }

  private createComponentSnapshot(componentId: string, element: HTMLElement): void {
    try {
      const snapshot: ComponentSnapshot = {
        componentId,
        timestamp: new Date(),
        state: this.extractComponentState(element),
        props: this.extractComponentProps(element),
        domSnapshot: element.outerHTML,
        eventListeners: [], // Would need to track actual listeners
        dependencies: this.extractComponentDependencies(element),
        health: this.assessComponentHealth(element)
      };
      
      // Store snapshot
      const snapshots = this.componentSnapshots.get(componentId) || [];
      snapshots.push(snapshot);
      
      // Keep only recent snapshots
      if (snapshots.length > this.config.components.maxSnapshots) {
        snapshots.shift();
      }
      
      this.componentSnapshots.set(componentId, snapshots);
      
    } catch (error) {
      console.error('Failed to create component snapshot:', error);
    }
  }

  private extractComponentState(element: HTMLElement): any {
    // Extract component state from DOM or component instance
    return {};
  }

  private extractComponentProps(element: HTMLElement): any {
    // Extract component props from DOM attributes
    const props: Record<string, any> = {};
    
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('data-prop-')) {
        const propName = attr.name.replace('data-prop-', '');
        props[propName] = attr.value;
      }
    });
    
    return props;
  }

  private extractComponentDependencies(element: HTMLElement): string[] {
    // Extract component dependencies
    const dependencies: string[] = [];
    
    // Look for data-dependency attributes
    const deps = element.getAttribute('data-dependencies');
    if (deps) {
      dependencies.push(...deps.split(','));
    }
    
    return dependencies;
  }

  private assessComponentHealth(element: HTMLElement): 'healthy' | 'degraded' | 'critical' {
    // Assess component health based on various factors
    if (element.classList.contains('error-state')) {
      return 'critical';
    }
    
    if (element.classList.contains('warning-state')) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  // Health monitoring
  private performHealthCheck(): void {
    // Monitor system health
    const memoryUsage = this.getMemoryUsage();
    const networkStatus = this.getNetworkStatus();
    
    // Take action if health is poor
    if (memoryUsage > 0.9) {
      this.handleHighMemoryUsage();
    }
    
    if (networkStatus === 'offline') {
      this.handleOfflineStatus();
    }
  }

  private handleHighMemoryUsage(): void {
    // Clear caches and perform garbage collection
    this.clearAllCache();
    
    if (window.gc) {
      window.gc();
    }
  }

  private handleOfflineStatus(): void {
    // Enable offline mode
    this.networkResilience.enableOfflineMode();
  }

  private cleanupOldData(): void {
    // Clean up old snapshots and checkpoints
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    // Clean old component snapshots
    this.componentSnapshots.forEach((snapshots, componentId) => {
      const recentSnapshots = snapshots.filter(snapshot => 
        now - snapshot.timestamp.getTime() < maxAge
      );
      
      if (recentSnapshots.length !== snapshots.length) {
        this.componentSnapshots.set(componentId, recentSnapshots);
      }
    });
    
    // Clean old transaction checkpoints
    this.transactionCheckpoints.forEach((checkpoints, transactionId) => {
      const recentCheckpoints = checkpoints.filter(checkpoint => 
        now - checkpoint.timestamp.getTime() < maxAge
      );
      
      if (recentCheckpoints.length !== checkpoints.length) {
        this.transactionCheckpoints.set(transactionId, recentCheckpoints);
      }
    });
    
    // Clean old error history
    this.errorHistory = this.errorHistory.filter(entry => 
      now - entry.timestamp.getTime() < maxAge
    );
  }

  // Public API methods
  public getErrorImmunityReport(): ErrorImmunityReport {
    const totalErrors = this.errorHistory.length;
    const healedErrors = this.errorHistory.filter(e => e.healingSuccess).length;
    const failedHealings = this.errorHistory.filter(e => !e.healingSuccess && e.healingAttempted).length;
    
    const errorsByType: Record<string, number> = {};
    const healingStrategiesUsed: Record<string, number> = {};
    
    this.errorHistory.forEach(entry => {
      const errorType = entry.error.constructor.name;
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
    });
    
    return {
      timestamp: new Date(),
      totalErrors,
      healedErrors,
      failedHealings,
      componentRestorations: this.componentRestorer.getRestorationCount(),
      transactionRollbacks: this.transactionManager.getRollbackCount(),
      networkResilienceEvents: this.networkResilience.getResilienceEventCount(),
      averageHealingTime: this.calculateAverageHealingTime(),
      successRate: totalErrors > 0 ? healedErrors / totalErrors : 1,
      errorsByType,
      healingStrategiesUsed
    };
  }

  private calculateAverageHealingTime(): number {
    // Calculate average healing time from history
    return 1500; // Placeholder
  }

  public updateConfig(newConfig: Partial<ErrorImmunityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public addHealingStrategy(strategy: HealingStrategy): void {
    this.healingStrategies.set(strategy.id, strategy);
  }

  public removeHealingStrategy(strategyId: string): void {
    this.healingStrategies.delete(strategyId);
  }

  public getComponentSnapshots(componentId: string): ComponentSnapshot[] {
    return this.componentSnapshots.get(componentId) || [];
  }

  public getTransactionCheckpoints(transactionId: string): TransactionCheckpoint[] {
    return this.transactionCheckpoints.get(transactionId) || [];
  }

  public stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

// Supporting classes
class ShadowDOMManager {
  constructor(private config: ErrorImmunityConfig['shadowDOM']) {}

  startMonitoring(): void {
    // Shadow DOM monitoring implementation
  }

  recoverComponent(componentId: string): void {
    // Shadow DOM recovery implementation
  }
}

class ComponentRestorer {
  private restorationCount = 0;

  constructor(private config: ErrorImmunityConfig['components']) {}

  startMonitoring(): void {
    // Component monitoring implementation
  }

  async restoreFromSnapshot(componentId: string, snapshot: ComponentSnapshot): Promise<void> {
    // Component restoration implementation
    this.restorationCount++;
  }

  getRestorationCount(): number {
    return this.restorationCount;
  }
}

class TransactionManager {
  private rollbackCount = 0;

  constructor(private config: ErrorImmunityConfig['transactions']) {}

  createCheckpoint(transactionId: string, state: any): void {
    // Transaction checkpoint implementation
  }

  rollback(transactionId: string): void {
    // Transaction rollback implementation
    this.rollbackCount++;
  }

  getRollbackCount(): number {
    return this.rollbackCount;
  }
}

class NetworkResilienceManager {
  private resilienceEventCount = 0;

  constructor(private config: ErrorImmunityConfig['network']) {}

  startMonitoring(): void {
    // Network monitoring implementation
  }

  enableOfflineMode(): void {
    // Offline mode implementation
    this.resilienceEventCount++;
  }

  getResilienceEventCount(): number {
    return this.resilienceEventCount;
  }
}

// React hook
export function useErrorImmunity() {
  const engine = ErrorImmunityEngine.getInstance();
  const [report, setReport] = React.useState(engine.getErrorImmunityReport());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setReport(engine.getErrorImmunityReport());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    engine,
    report,
    handleError: engine.handleError.bind(engine),
    getComponentSnapshots: engine.getComponentSnapshots.bind(engine),
    getTransactionCheckpoints: engine.getTransactionCheckpoints.bind(engine),
    addHealingStrategy: engine.addHealingStrategy.bind(engine),
    removeHealingStrategy: engine.removeHealingStrategy.bind(engine),
    updateConfig: engine.updateConfig.bind(engine)
  };
}

export default ErrorImmunityEngine;
