
declare global {
  interface Window {
    [key: string]: any;
  }
}

import React, { useState } from 'react';
/**
 * Smart Auto-Lazy Loading System
 * Predictive preloading, intelligent resource prioritization, adaptive loading strategies
 */

export interface SmartAutoLazyConfig {
  // Predictive preloading
  predictivePreloading: {
    enabled: boolean;
    lookbackWindow: number;
    predictionAccuracy: number;
    maxPreloadItems: number;
    preloadStrategies: PreloadStrategy[];
    userBehaviorAnalysis: boolean;
    machineLearningEnabled: boolean;
    cacheSize: number;
  };

  // Resource prioritization
  resourcePrioritization: {
    enabled: boolean;
    priorityLevels: PriorityLevel[];
    criticalResources: string[];
    bandwidthAdaptive: boolean;
    deviceAdaptive: boolean;
    networkAware: boolean;
    userIntentDetection: boolean;
  };

  // Adaptive loading strategies
  adaptiveLoading: {
    enabled: boolean;
    strategies: LoadingStrategy[];
    fallbackMechanisms: FallbackMechanism[];
    progressiveEnhancement: boolean;
    gracefulDegradation: boolean;
    performanceBudgets: PerformanceBudget[];
  };

  // Intersection optimization
  intersectionOptimization: {
    enabled: boolean;
    rootMargin: string;
    threshold: number[];
    delayMs: number;
    batchSize: number;
    adaptiveThreshold: boolean;
    performanceOptimized: boolean;
  };

  // Cache management
  cacheManagement: {
    enabled: boolean;
    strategy: "lru" | "lfu" | "fifo" | "custom";
    maxSize: number;
    ttl: number;
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
    persistentStorage: boolean;
  };

  // Performance monitoring
  performanceMonitoring: {
    enabled: boolean;
    metricsCollection: boolean;
    realTimeAnalysis: boolean;
    bottleneckDetection: boolean;
    userExperienceTracking: boolean;
    resourceTimingAnalysis: boolean;
  };
}

export interface PreloadStrategy {
  id: string;
  name: string;
  type:
    | "navigation"
    | "interaction"
    | "time_based"
    | "scroll_based"
    | "ml_based";
  priority: number;
  conditions: PreloadCondition[];
  resources: string[];
  maxConcurrent: number;
  timeout: number;
}

export interface PreloadCondition {
  type:
    | "user_action"
    | "time_delay"
    | "scroll_position"
    | "network_condition"
    | "device_type";
  operator: "eq" | "ne" | "gt" | "lt" | "contains" | "regex";
  value: any;
  weight: number;
}

export interface PriorityLevel {
  level: number;
  name: string;
  color: string;
  maxConcurrent: number;
  timeout: number;
  retryAttempts: number;
  resources: string[];
}

export interface LoadingStrategy {
  id: string;
  name: string;
  type: "lazy" | "eager" | "progressive" | "adaptive" | "conditional";
  conditions: LoadingCondition[];
  parameters: LoadingParameters;
  fallback: string;
}

export interface LoadingCondition {
  type:
    | "network_speed"
    | "device_type"
    | "user_preference"
    | "time_of_day"
    | "battery_level";
  operator: "eq" | "ne" | "gt" | "lt";
  value: any;
  priority: number;
}

export interface LoadingParameters {
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  batchSize: number;
  compressionEnabled: boolean;
}

export interface FallbackMechanism {
  id: string;
  name: string;
  trigger: string;
  action: "retry" | "fallback" | "skip" | "placeholder";
  parameters: Record<string, any>;
  priority: number;
}

export interface PerformanceBudget {
  type: "javascript" | "css" | "images" | "fonts" | "total";
  budget: number;
  unit: "kb" | "ms" | "requests";
  warningThreshold: number;
  criticalThreshold: number;
  enforcement: "warning" | "block" | "compress";
}

export interface ResourceMetrics {
  id: string;
  url: string;
  type: string;
  size: number;
  loadTime: number;
  startTime: number;
  endTime: number;
  cached: boolean;
  priority: number;
  userIntent: "critical" | "important" | "normal" | "low";
  networkCondition: "slow" | "medium" | "fast";
  deviceType: "mobile" | "tablet" | "desktop";
  preloaded: boolean;
  lazy: boolean;
  error?: string;
}

export interface UserBehaviorPattern {
  id: string;
  userId?: string;
  sessionId: string;
  pattern: string;
  frequency: number;
  confidence: number;
  lastSeen: Date;
  nextPredicted: Date;
  resources: string[];
  context: BehaviorContext;
}

export interface BehaviorContext {
  route: string;
  timeOfDay: number;
  dayOfWeek: number;
  deviceType: string;
  networkCondition: string;
  scrollDepth: number;
  interactionCount: number;
  sessionDuration: number;
}

export interface LoadingPerformanceMetrics {
  timestamp: Date;
  totalResources: number;
  loadedResources: number;
  failedResources: number;
  preloadedResources: number;
  lazyLoadedResources: number;
  averageLoadTime: number;
  totalSize: number;
  compressedSize: number;
  cacheHitRate: number;
  userExperienceScore: number;
  networkEfficiency: number;
  devicePerformance: number;
  bottleneckResources: string[];
}

export class SmartAutoLazyEngine {
  private static instance: SmartAutoLazyEngine;
  private config: SmartAutoLazyConfig;
  private predictivePreloader: PredictivePreloader;
  private resourcePrioritizer: ResourcePrioritizer;
  private adaptiveLoader: AdaptiveLoader;
  private intersectionOptimizer: IntersectionOptimizer;
  private cacheManager: CacheManager;
  private performanceMonitor: PerformanceMonitor;
  private behaviorAnalyzer: BehaviorAnalyzer;
  private resourceMetrics: Map<string, ResourceMetrics> = new Map();
  private userPatterns: Map<string, UserBehaviorPattern> = new Map();
  private loadingQueue: LoadingQueueItem[] = [];
  private isLoading: boolean = false;
  private observers: Map<string, IntersectionObserver> = new Map();
  private metrics: LoadingPerformanceMetrics;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.predictivePreloader = new PredictivePreloader(
      this.config.predictivePreloading,
    );
    this.resourcePrioritizer = new ResourcePrioritizer(
      this.config.resourcePrioritization,
    );
    this.adaptiveLoader = new AdaptiveLoader(this.config.adaptiveLoading);
    this.intersectionOptimizer = new IntersectionOptimizer(
      this.config.intersectionOptimization,
    );
    this.cacheManager = new CacheManager(this.config.cacheManagement);
    this.performanceMonitor = new PerformanceMonitor(
      this.config.performanceMonitoring,
    );
    this.behaviorAnalyzer = new BehaviorAnalyzer();
    this.metrics = this.initializeMetrics();
    this.initializeSmartAutoLazy();
  }

  static getInstance(): SmartAutoLazyEngine {
    if (!SmartAutoLazyEngine.instance) {
      SmartAutoLazyEngine.instance = new SmartAutoLazyEngine();
    }
    return SmartAutoLazyEngine.instance;
  }

  private getDefaultConfig(): SmartAutoLazyConfig {
    return {
      predictivePreloading: {
        enabled: true,
        lookbackWindow: 7 * 24 * 60 * 60 * 1000, // 7 days
        predictionAccuracy: 0.8,
        maxPreloadItems: 10,
        preloadStrategies: [],
        userBehaviorAnalysis: true,
        machineLearningEnabled: true,
        cacheSize: 100,
      },
      resourcePrioritization: {
        enabled: true,
        priorityLevels: [],
        criticalResources: [],
        bandwidthAdaptive: true,
        deviceAdaptive: true,
        networkAware: true,
        userIntentDetection: true,
      },
      adaptiveLoading: {
        enabled: true,
        strategies: [],
        fallbackMechanisms: [],
        progressiveEnhancement: true,
        gracefulDegradation: true,
        performanceBudgets: [],
      },
      intersectionOptimization: {
        enabled: true,
        rootMargin: "50px",
        threshold: [0, 0.1, 0.5, 1.0],
        delayMs: 100,
        batchSize: 5,
        adaptiveThreshold: true,
        performanceOptimized: true,
      },
      cacheManagement: {
        enabled: true,
        strategy: "lru",
        maxSize: 50 * 1024 * 1024, // 50MB
        ttl: 24 * 60 * 60 * 1000, // 24 hours
        compressionEnabled: true,
        encryptionEnabled: false,
        persistentStorage: true,
      },
      performanceMonitoring: {
        enabled: true,
        metricsCollection: true,
        realTimeAnalysis: true,
        bottleneckDetection: true,
        userExperienceTracking: true,
        resourceTimingAnalysis: true,
      },
    };
  }

  private initializeMetrics(): LoadingPerformanceMetrics {
    return {
      timestamp: new Date(),
      totalResources: 0,
      loadedResources: 0,
      failedResources: 0,
      preloadedResources: 0,
      lazyLoadedResources: 0,
      averageLoadTime: 0,
      totalSize: 0,
      compressedSize: 0,
      cacheHitRate: 0,
      userExperienceScore: 100,
      networkEfficiency: 100,
      devicePerformance: 100,
      bottleneckResources: [],
    };
  }

  private initializeSmartAutoLazy(): void {
    if (typeof window === "undefined") return;

    // Initialize priority levels
    this.initializePriorityLevels();

    // Initialize preload strategies
    this.initializePreloadStrategies();

    // Initialize loading strategies
    this.initializeLoadingStrategies();

    // Initialize performance budgets
    this.initializePerformanceBudgets();

    // Set up event listeners
    this.setupEventListeners();

    // Start behavior analysis
    this.behaviorAnalyzer.startAnalysis();

    // Load existing patterns
    this.loadExistingPatterns();

    // Start performance monitoring
    if (this.config.performanceMonitoring.enabled) {
      this.performanceMonitor.startMonitoring();
    }
  }

  private initializePriorityLevels(): void {
    const levels: PriorityLevel[] = [
      {
        level: 1,
        name: "Critical",
        color: "#dc3545",
        maxConcurrent: 6,
        timeout: 5000,
        retryAttempts: 3,
        resources: ["critical-css", "critical-js", "fonts", "hero-images"],
      },
      {
        level: 2,
        name: "High",
        color: "#fd7e14",
        maxConcurrent: 4,
        timeout: 8000,
        retryAttempts: 2,
        resources: ["above-fold-images", "important-js", "stylesheets"],
      },
      {
        level: 3,
        name: "Normal",
        color: "#28a745",
        maxConcurrent: 3,
        timeout: 10000,
        retryAttempts: 2,
        resources: ["below-fold-images", "components", "data"],
      },
      {
        level: 4,
        name: "Low",
        color: "#6c757d",
        maxConcurrent: 2,
        timeout: 15000,
        retryAttempts: 1,
        resources: ["analytics", "tracking", "optional-content"],
      },
    ];

    this.config.resourcePrioritization.priorityLevels = levels;
  }

  private initializePreloadStrategies(): void {
    const strategies: PreloadStrategy[] = [
      {
        id: "navigation-prediction",
        name: "Navigation Prediction",
        type: "navigation",
        priority: 1,
        conditions: [
          {
            type: "user_action",
            operator: "contains",
            value: "hover",
            weight: 0.8,
          },
          {
            type: "time_delay",
            operator: "gt",
            value: 500,
            weight: 0.6,
          },
        ],
        resources: ["next-page-components", "route-data"],
        maxConcurrent: 3,
        timeout: 3000,
      },
      {
        id: "scroll-prediction",
        name: "Scroll Prediction",
        type: "scroll_based",
        priority: 2,
        conditions: [
          {
            type: "scroll_position",
            operator: "gt",
            value: 0.8,
            weight: 0.9,
          },
        ],
        resources: ["below-fold-content", "infinite-scroll-items"],
        maxConcurrent: 5,
        timeout: 2000,
      },
      {
        id: "interaction-prediction",
        name: "Interaction Prediction",
        type: "interaction",
        priority: 1,
        conditions: [
          {
            type: "user_action",
            operator: "contains",
            value: "click",
            weight: 0.7,
          },
        ],
        resources: ["modal-content", "dropdown-items"],
        maxConcurrent: 2,
        timeout: 1000,
      },
      {
        id: "ml-prediction",
        name: "Machine Learning Prediction",
        type: "ml_based",
        priority: 3,
        conditions: [
          {
            type: "user_action",
            operator: "regex",
            value: ".*",
            weight: 0.5,
          },
        ],
        resources: ["predicted-resources"],
        maxConcurrent: 4,
        timeout: 5000,
      },
    ];

    this.config.predictivePreloading.preloadStrategies = strategies;
  }

  private initializeLoadingStrategies(): void {
    const strategies: LoadingStrategy[] = [
      {
        id: "progressive-images",
        name: "Progressive Image Loading",
        type: "progressive",
        conditions: [
          {
            type: "network_speed",
            operator: "lt",
            value: "fast",
            priority: 1,
          },
        ],
        parameters: {
          timeout: 8000,
          retryAttempts: 2,
          retryDelay: 1000,
          batchSize: 3,
          compressionEnabled: true,
        },
        fallback: "placeholder",
      },
      {
        id: "adaptive-javascript",
        name: "Adaptive JavaScript Loading",
        type: "adaptive",
        conditions: [
          {
            type: "device_type",
            operator: "eq",
            value: "mobile",
            priority: 2,
          },
        ],
        parameters: {
          timeout: 10000,
          retryAttempts: 1,
          retryDelay: 2000,
          batchSize: 1,
          compressionEnabled: true,
        },
        fallback: "critical-only",
      },
      {
        id: "conditional-components",
        name: "Conditional Component Loading",
        type: "conditional",
        conditions: [
          {
            type: "user_preference",
            operator: "eq",
            value: "reduced-data",
            priority: 3,
          },
        ],
        parameters: {
          timeout: 5000,
          retryAttempts: 1,
          retryDelay: 500,
          batchSize: 2,
          compressionEnabled: true,
        },
        fallback: "essential-only",
      },
    ];

    this.config.adaptiveLoading.strategies = strategies;
  }

  private initializePerformanceBudgets(): void {
    const budgets: PerformanceBudget[] = [
      {
        type: "javascript",
        budget: 250,
        unit: "kb",
        warningThreshold: 200,
        criticalThreshold: 300,
        enforcement: "compress",
      },
      {
        type: "css",
        budget: 100,
        unit: "kb",
        warningThreshold: 80,
        criticalThreshold: 150,
        enforcement: "compress",
      },
      {
        type: "images",
        budget: 500,
        unit: "kb",
        warningThreshold: 400,
        criticalThreshold: 800,
        enforcement: "compress",
      },
      {
        type: "fonts",
        budget: 100,
        unit: "kb",
        warningThreshold: 80,
        criticalThreshold: 150,
        enforcement: "warning",
      },
      {
        type: "total",
        budget: 1000,
        unit: "kb",
        warningThreshold: 800,
        criticalThreshold: 1500,
        enforcement: "warning",
      },
    ];

    this.config.adaptiveLoading.performanceBudgets = budgets;
  }

  private setupEventListeners(): void {
    // Monitor user interactions for predictive preloading
    document.addEventListener("mouseover", this.handleMouseOver.bind(this));
    document.addEventListener("touchstart", this.handleTouchStart.bind(this));
    document.addEventListener("click", this.handleClick.bind(this));
    document.addEventListener("scroll", this.handleScroll.bind(this));

    // Monitor network changes
    if ("connection" in navigator) {
      (navigator as any).connection.addEventListener(
        "change",
        this.handleNetworkChange.bind(this),
      );
    }

    // Monitor page visibility
    document.addEventListener(
      "visibilitychange",
      this.handleVisibilityChange.bind(this),
    );

    // Monitor performance entries
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver(
        this.handlePerformanceEntry.bind(this),
      );
      observer.observe({ entryTypes: ["resource", "navigation", "paint"] });
    }
  }

  private handleMouseOver(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const link = target.closest("a");

    if (link && this.config.predictivePreloading.enabled) {
      const href = link.getAttribute("href");
      if (href && this.shouldPreload(href)) {
        this.predictivePreloader.preloadForNavigation(href);
      }
    }

    // Track behavior for pattern analysis
    this.behaviorAnalyzer.trackInteraction("mouseover", target);
  }

  private handleTouchStart(event: TouchEvent): void {
    const target = event.target as HTMLElement;
    this.behaviorAnalyzer.trackInteraction("touchstart", target);
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    this.behaviorAnalyzer.trackInteraction("click", target);
  }

  private handleScroll(event: Event): void {
    if (this.config.intersectionOptimization.enabled) {
      this.intersectionOptimizer.handleScroll();
    }

    this.behaviorAnalyzer.trackInteraction("scroll", document.body);
  }

  private handleNetworkChange(): void {
    const connection = (navigator as any).connection;
    const networkCondition = this.getNetworkCondition(connection);

    // Adjust loading strategies based on network condition
    this.resourcePrioritizer.adaptToNetworkCondition(networkCondition);
    this.adaptiveLoader.adaptToNetworkCondition(networkCondition);
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      // Pause non-critical loading when page is hidden
      this.pauseNonCriticalLoading();
    } else {
      // Resume loading when page is visible
      this.resumeLoading();
    }
  }

  private handlePerformanceEntry(entry: PerformanceEntry): void {
    if (entry.entryType === "resource") {
      const resourceEntry = entry as PerformanceResourceTiming;
      this.processResourceTiming(resourceEntry);
    }
  }

  private processResourceTiming(entry: PerformanceResourceTiming): void {
    const metrics: ResourceMetrics = {
      id: this.generateResourceId(),
      url: entry.name,
      type: this.getResourceType(entry.name),
      size: entry.transferSize || 0,
      loadTime: entry.responseEnd - entry.startTime,
      startTime: entry.startTime,
      endTime: entry.responseEnd,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
      priority: this.getResourcePriority(entry.name),
      userIntent: "normal",
      networkCondition: this.getNetworkCondition(),
      deviceType: this.getDeviceType(),
      preloaded: false,
      lazy: false,
    };

    this.resourceMetrics.set(metrics.id, metrics);
    this.updatePerformanceMetrics(metrics);
  }

  private generateResourceId(): string {
    return `resource-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getResourceType(url: string): string {
    const extension = url.split(".").pop()?.toLowerCase();

    if (
      ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension || "")
    ) {
      return "image";
    } else if (["css"].includes(extension || "")) {
      return "css";
    } else if (["js"].includes(extension || "")) {
      return "javascript";
    } else if (["woff", "woff2", "ttf", "otf"].includes(extension || "")) {
      return "font";
    } else {
      return "other";
    }
  }

  private getResourcePriority(url: string): number {
    // Determine resource priority based on URL patterns
    if (url.includes("critical") || url.includes("above-fold")) {
      return 1;
    } else if (url.includes("important") || url.includes("hero")) {
      return 2;
    } else if (url.includes("optional") || url.includes("below-fold")) {
      return 4;
    } else {
      return 3;
    }
  }

  private getNetworkCondition(connection?: any): "slow" | "medium" | "fast" {
    if (!connection) return "medium";

    const effectiveType = connection.effectiveType;
    switch (effectiveType) {
      case "slow-2g":
      case "2g":
        return "slow";
      case "3g":
        return "medium";
      case "4g":
        return "fast";
      default:
        return "medium";
    }
  }

  private getDeviceType(): "mobile" | "tablet" | "desktop" {
    const width = window.innerWidth;
    if (width < 768) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
  }

  private shouldPreload(url: string): boolean {
    // Check if URL should be preloaded based on patterns and conditions
    const patterns = this.userPatterns.values();

    for (const pattern of patterns) {
      if (pattern.resources.includes(url) && pattern.confidence > 0.7) {
        return true;
      }
    }

    return false;
  }

  private pauseNonCriticalLoading(): void {
    // Pause non-critical loading when page is hidden
    this.loadingQueue
      .filter((item) => item.priority > 2)
      .forEach((item) => (item.paused = true));
  }

  private resumeLoading(): void {
    // Resume loading when page is visible
    this.loadingQueue.forEach((item) => (item.paused = false));
    this.processLoadingQueue();
  }

  private updatePerformanceMetrics(metrics: ResourceMetrics): void {
    this.metrics.totalResources++;

    if (metrics.error) {
      this.metrics.failedResources++;
    } else {
      this.metrics.loadedResources++;
    }

    if (metrics.preloaded) {
      this.metrics.preloadedResources++;
    }

    if (metrics.lazy) {
      this.metrics.lazyLoadedResources++;
    }

    this.metrics.totalSize += metrics.size;

    // Update average load time
    const totalLoadTime = Array.from(this.resourceMetrics.values()).reduce(
      (sum, m) => sum + m.loadTime,
      0,
    );
    this.metrics.averageLoadTime = totalLoadTime / this.resourceMetrics.size;

    // Update cache hit rate
    const cachedCount = Array.from(this.resourceMetrics.values()).filter(
      (m) => m.cached,
    ).length;
    this.metrics.cacheHitRate = cachedCount / this.resourceMetrics.size;

    // Update user experience score
    this.metrics.userExperienceScore = this.calculateUserExperienceScore();

    // Update network efficiency
    this.metrics.networkEfficiency = this.calculateNetworkEfficiency();

    // Update device performance
    this.metrics.devicePerformance = this.calculateDevicePerformance();
  }

  private calculateUserExperienceScore(): number {
    let score = 100;

    // Deduct points for slow loading
    if (this.metrics.averageLoadTime > 3000) score -= 20;
    else if (this.metrics.averageLoadTime > 2000) score -= 10;
    else if (this.metrics.averageLoadTime > 1000) score -= 5;

    // Deduct points for failures
    const failureRate =
      this.metrics.failedResources / this.metrics.totalResources;
    score -= failureRate * 30;

    // Add points for cache hits
    score += this.metrics.cacheHitRate * 10;

    return Math.max(0, Math.min(100, score));
  }

  private calculateNetworkEfficiency(): number {
    const connection = (navigator as any).connection;
    if (!connection) return 80;

    let efficiency = 50;

    // Add points for fast connection
    const effectiveType = connection.effectiveType;
    switch (effectiveType) {
      case "4g":
        efficiency += 40;
        break;
      case "3g":
        efficiency += 20;
        break;
      case "2g":
        efficiency += 0;
        break;
    }

    // Add points for low RTT
    if (connection.rtt < 100) efficiency += 10;
    else if (connection.rtt < 300) efficiency += 5;

    return Math.min(100, efficiency);
  }

  private calculateDevicePerformance(): number {
    let performance = 50;

    // Add points for device capabilities
    const memory = (performance as any).memory;
    if (memory) {
      const memoryGB = memory.jsHeapSizeLimit / (1024 * 1024 * 1024);
      if (memoryGB > 4) performance += 30;
      else if (memoryGB > 2) performance += 20;
      else if (memoryGB > 1) performance += 10;
    }

    // Add points for CPU cores
    if (navigator.hardwareConcurrency) {
      if (navigator.hardwareConcurrency >= 8) performance += 20;
      else if (navigator.hardwareConcurrency >= 4) performance += 10;
    }

    return Math.min(100, performance);
  }

  private loadExistingPatterns(): void {
    try {
      const stored = localStorage.getItem("user-behavior-patterns");
      if (stored) {
        const patterns = JSON.parse(stored);
        patterns.forEach((pattern: UserBehaviorPattern) => {
          this.userPatterns.set(pattern.id, pattern);
        });
      }
    } catch (error) {
      console.warn("Failed to load behavior patterns:", error);
    }
  }

  // Public API: Lazy loading methods
  public lazyLoadElement(
    element: HTMLElement,
    options: LazyLoadOptions = {},
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.config.intersectionOptimization.enabled) {
        // Load immediately if intersection optimization is disabled
        this.loadElementContent(element).then(resolve).catch(reject);
        return;
      }

      const observerOptions: IntersectionObserverInit = {
        rootMargin:
          options.rootMargin || this.config.intersectionOptimization.rootMargin,
        threshold:
          options.threshold || this.config.intersectionOptimization.threshold,
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadElementContent(element)
              .then(() => {
                observer.unobserve(element);
                resolve();
              })
              .catch(reject);
          }
        });
      }, observerOptions);

      observer.observe(element);
      this.observers.set(
        element.id || this.generateElementId(element),
        observer,
      );
    });
  }

  private async loadElementContent(element: HTMLElement): Promise<void> {
    const startTime = performance.now();

    try {
      // Determine loading strategy
      const strategy = this.adaptiveLoader.selectStrategy(element);

      // Apply loading strategy
      await this.adaptiveLoader.applyStrategy(element, strategy);

      // Update metrics
      const loadTime = performance.now() - startTime;
      this.updateElementMetrics(element, loadTime, true);
    } catch (error) {
      const loadTime = performance.now() - startTime;
      this.updateElementMetrics(
        element,
        loadTime,
        false,
        error instanceof Error ? error.message : "Unknown error",
      );
      throw error;
    }
  }

  private generateElementId(element: HTMLElement): string {
    return `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateElementMetrics(
    element: HTMLElement,
    loadTime: number,
    success: boolean,
    error?: string,
  ): void {
    const metrics: ResourceMetrics = {
      id: element.id || this.generateElementId(element),
      url:
        element.getAttribute("data-src") || element.getAttribute("src") || "",
      type: "element",
      size: 0,
      loadTime,
      startTime: performance.now() - loadTime,
      endTime: performance.now(),
      cached: false,
      priority: this.getElementPriority(element),
      userIntent: this.getElementUserIntent(element),
      networkCondition: this.getNetworkCondition(),
      deviceType: this.getDeviceType(),
      preloaded: false,
      lazy: true,
      error,
    };

    this.resourceMetrics.set(metrics.id, metrics);
    this.updatePerformanceMetrics(metrics);
  }

  private getElementPriority(element: HTMLElement): number {
    const priority = element.getAttribute("data-priority");
    if (priority) {
      return parseInt(priority);
    }

    // Determine priority based on element attributes
    if (element.hasAttribute("data-critical")) return 1;
    if (element.hasAttribute("data-important")) return 2;
    if (element.hasAttribute("data-optional")) return 4;

    return 3;
  }

  private getElementUserIntent(
    element: HTMLElement,
  ): "critical" | "important" | "normal" | "low" {
    const intent = element.getAttribute("data-user-intent");
    if (intent) {
      return intent as any;
    }

    // Determine intent based on element position and attributes
    const rect = element.getBoundingClientRect();
    const isInViewport =
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth;

    if (isInViewport && element.hasAttribute("data-critical"))
      return "critical";
    if (isInViewport) return "important";
    if (element.hasAttribute("data-optional")) return "low";

    return "normal";
  }

  public preloadResource(
    url: string,
    options: PreloadOptions = {},
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already cached
      if (this.cacheManager.has(url)) {
        resolve();
        return;
      }

      // Determine priority
      const priority = options.priority || this.getResourcePriority(url);

      // Add to loading queue
      const queueItem: LoadingQueueItem = {
        id: this.generateResourceId(),
        url,
        priority,
        type: options.type || this.getResourceType(url),
        resolve,
        reject,
        added: Date.now(),
        timeout: options.timeout || 5000,
        retryCount: 0,
        maxRetries: options.maxRetries || 2,
        paused: false,
      };

      this.loadingQueue.push(queueItem);
      this.loadingQueue.sort((a, b) => a.priority - b.priority);

      this.processLoadingQueue();
    });
  }

  private async processLoadingQueue(): Promise<void> {
    if (this.isLoading || this.loadingQueue.length === 0) return;

    this.isLoading = true;

    while (this.loadingQueue.length > 0) {
      const item = this.loadingQueue.find((i) => !i.paused);

      if (!item) break;

      // Remove from queue
      this.loadingQueue.splice(this.loadingQueue.indexOf(item), 1);

      try {
        await this.loadResource(item);
        item.resolve();
      } catch (error) {
        if (item.retryCount < item.maxRetries) {
          item.retryCount++;
          this.loadingQueue.push(item);
        } else {
          item.reject(error);
        }
      }
    }

    this.isLoading = false;
  }

  private async loadResource(item: LoadingQueueItem): Promise<void> {
    const startTime = performance.now();

    try {
      // Create appropriate element based on type
      let element: HTMLElement;

      switch (item.type) {
        case "image":
          element = document.createElement("img");
          break;
        case "css":
          element = document.createElement("link");
          (element as HTMLLinkElement).rel = "stylesheet";
          break;
        case "javascript":
          element = document.createElement("script");
          break;
        default:
          throw new Error(`Unsupported resource type: ${item.type}`);
      }

      // Set source
      if (item.type === "image") {
        (element as HTMLImageElement).src = item.url;
      } else if (item.type === "css") {
        (element as HTMLLinkElement).href = item.url;
      } else if (item.type === "javascript") {
        (element as HTMLScriptElement).src = item.url;
      }

      // Load with timeout
      await this.loadElementWithTimeout(element, item.timeout);

      // Cache the resource
      this.cacheManager.set(item.url, element);

      // Update metrics
      const loadTime = performance.now() - startTime;
      this.updateResourceMetrics(item, loadTime, true);
    } catch (error) {
      const loadTime = performance.now() - startTime;
      this.updateResourceMetrics(
        item,
        loadTime,
        false,
        error instanceof Error ? error.message : "Unknown error",
      );
      throw error;
    }
  }

  private loadElementWithTimeout(
    element: HTMLElement,
    timeout: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Resource loading timeout"));
      }, timeout);

      element.onload = () => {
        clearTimeout(timeoutId);
        resolve();
      };

      element.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error("Resource loading failed"));
      };

      // For scripts, we need to append to the document
      if (element.tagName === "SCRIPT") {
        document.head.appendChild(element);
      }
    });
  }

  private updateResourceMetrics(
    item: LoadingQueueItem,
    loadTime: number,
    success: boolean,
    error?: string,
  ): void {
    const metrics: ResourceMetrics = {
      id: item.id,
      url: item.url,
      type: item.type,
      size: 0, // Would be calculated from response headers
      loadTime,
      startTime: performance.now() - loadTime,
      endTime: performance.now(),
      cached: false,
      priority: item.priority,
      userIntent: "normal",
      networkCondition: this.getNetworkCondition(),
      deviceType: this.getDeviceType(),
      preloaded: true,
      lazy: false,
      error,
    };

    this.resourceMetrics.set(metrics.id, metrics);
    this.updatePerformanceMetrics(metrics);
  }

  // Public API methods
  public getPerformanceMetrics(): LoadingPerformanceMetrics {
    return { ...this.metrics };
  }

  public getResourceMetrics(): ResourceMetrics[] {
    return Array.from(this.resourceMetrics.values());
  }

  public getUserPatterns(): UserBehaviorPattern[] {
    return Array.from(this.userPatterns.values());
  }

  public getLoadingQueue(): LoadingQueueItem[] {
    return [...this.loadingQueue];
  }

  public clearCache(): void {
    this.cacheManager.clear();
  }

  public optimizeLoading(): void {
    // Analyze current loading patterns and optimize
    this.behaviorAnalyzer.analyzePatterns();
    this.predictivePreloader.optimizeStrategies();
    this.resourcePrioritizer.optimizePriorities();
  }

  public updateConfig(newConfig: Partial<SmartAutoLazyConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update sub-systems
    this.predictivePreloader.updateConfig(this.config.predictivePreloading);
    this.resourcePrioritizer.updateConfig(this.config.resourcePrioritization);
    this.adaptiveLoader.updateConfig(this.config.adaptiveLoading);
    this.intersectionOptimizer.updateConfig(
      this.config.intersectionOptimization,
    );
    this.cacheManager.updateConfig(this.config.cacheManagement);
    this.performanceMonitor.updateConfig(this.config.performanceMonitoring);
  }

  public generatePerformanceReport(): string {
    const metrics = this.getPerformanceMetrics();
    const resourceMetrics = this.getResourceMetrics();
    const patterns = this.getUserPatterns();

    return `
# Smart Auto-Lazy Performance Report
Generated: ${new Date().toISOString()}

## Performance Summary
- Total Resources: ${metrics.totalResources}
- Loaded Resources: ${metrics.loadedResources}
- Failed Resources: ${metrics.failedResources}
- Preloaded Resources: ${metrics.preloadedResources}
- Lazy Loaded Resources: ${metrics.lazyLoadedResources}
- Average Load Time: ${metrics.averageLoadTime.toFixed(2)}ms
- Total Size: ${(metrics.totalSize / 1024).toFixed(2)}KB
- Cache Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%

## User Experience Metrics
- UX Score: ${metrics.userExperienceScore}/100
- Network Efficiency: ${metrics.networkEfficiency}/100
- Device Performance: ${metrics.devicePerformance}/100

## Resource Breakdown
${this.generateResourceBreakdown(resourceMetrics)}

## User Behavior Patterns
${this.generatePatternAnalysis(patterns)}

## Recommendations
${this.generateRecommendations(metrics, resourceMetrics)}
    `;
  }

  private generateResourceBreakdown(metrics: ResourceMetrics[]): string {
    const breakdown = {
      image: { count: 0, size: 0, avgTime: 0 },
      css: { count: 0, size: 0, avgTime: 0 },
      javascript: { count: 0, size: 0, avgTime: 0 },
      font: { count: 0, size: 0, avgTime: 0 },
      other: { count: 0, size: 0, avgTime: 0 },
    };

    metrics.forEach((metric) => {
      const type = metric.type as keyof typeof breakdown;
      if (breakdown[type]) {
        breakdown[type].count++;
        breakdown[type].size += metric.size;
        breakdown[type].avgTime += metric.loadTime;
      }
    });

    // Calculate averages
    Object.values(breakdown).forEach((type) => {
      if (type.count > 0) {
        type.avgTime = type.avgTime / type.count;
      }
    });

    return Object.entries(breakdown)
      .map(
        ([type, data]) =>
          `- ${type.charAt(0).toUpperCase() + type.slice(1)}: ${data.count} resources, ${(data.size / 1024).toFixed(2)}KB, ${data.avgTime.toFixed(2)}ms avg`,
      )
      .join("\n");
  }

  private generatePatternAnalysis(patterns: UserBehaviorPattern[]): string {
    if (patterns.length === 0) {
      return "- No behavior patterns detected yet";
    }

    const topPatterns = patterns
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    return topPatterns
      .map(
        (pattern) =>
          `- ${pattern.pattern}: ${(pattern.confidence * 100).toFixed(1)}% confidence, ${pattern.frequency} occurrences`,
      )
      .join("\n");
  }

  private generateRecommendations(
    metrics: LoadingPerformanceMetrics,
    resourceMetrics: ResourceMetrics[],
  ): string {
    const recommendations: string[] = [];

    if (metrics.averageLoadTime > 3000) {
      recommendations.push(
        "- Consider increasing lazy loading thresholds to reduce initial load time",
      );
    }

    if (metrics.cacheHitRate < 0.5) {
      recommendations.push(
        "- Optimize cache strategies to improve cache hit rate",
      );
    }

    if (metrics.failedResources > 0) {
      recommendations.push(
        "- Investigate and fix failed resource loading issues",
      );
    }

    const slowResources = resourceMetrics.filter((r) => r.loadTime > 5000);
    if (slowResources.length > 0) {
      recommendations.push(
        `- Optimize ${slowResources.length} slow-loading resources`,
      );
    }

    if (metrics.userExperienceScore < 80) {
      recommendations.push(
        "- Implement additional performance optimizations to improve user experience",
      );
    }

    return recommendations.length > 0
      ? recommendations.join("\n")
      : "- Performance is optimal";
  }
}

// Supporting interfaces
interface LazyLoadOptions {
  rootMargin?: string;
  threshold?: number[];
  delay?: number;
}

interface PreloadOptions {
  type?: string;
  priority?: number;
  timeout?: number;
  maxRetries?: number;
}

interface LoadingQueueItem {
  id: string;
  url: string;
  priority: number;
  type: string;
  resolve: () => void;
  reject: (error: any) => void;
  added: number;
  timeout: number;
  retryCount: number;
  maxRetries: number;
  paused: boolean;
}

// Supporting classes (simplified implementations)
class PredictivePreloader {
  constructor(private config: SmartAutoLazyConfig["predictivePreloading"]) {}

  preloadForNavigation(url: string): void {
    // Implement predictive preloading logic
  }

  optimizeStrategies(): void {
    // Optimize preload strategies based on usage patterns
  }

  updateConfig(config: SmartAutoLazyConfig["predictivePreloading"]): void {
    this.config = config;
  }
}

class ResourcePrioritizer {
  constructor(private config: SmartAutoLazyConfig["resourcePrioritization"]) {}

  adaptToNetworkCondition(condition: string): void {
    // Adapt priorities based on network condition
  }

  optimizePriorities(): void {
    // Optimize resource priorities
  }

  updateConfig(config: SmartAutoLazyConfig["resourcePrioritization"]): void {
    this.config = config;
  }
}

class AdaptiveLoader {
  constructor(private config: SmartAutoLazyConfig["adaptiveLoading"]) {}

  selectStrategy(element: HTMLElement): LoadingStrategy {
    // Select appropriate loading strategy for element
    return (
      this.config.strategies[0] || {
        id: "default",
        name: "Default",
        type: "lazy",
        conditions: [],
        parameters: {
          timeout: 5000,
          retryAttempts: 1,
          retryDelay: 1000,
          batchSize: 1,
          compressionEnabled: true,
        },
        fallback: "placeholder",
      }
    );
  }

  async applyStrategy(
    element: HTMLElement,
    strategy: LoadingStrategy,
  ): Promise<void> {
    // Apply loading strategy to element
  }

  adaptToNetworkCondition(condition: string): void {
    // Adapt loading strategies based on network condition
  }

  updateConfig(config: SmartAutoLazyConfig["adaptiveLoading"]): void {
    this.config = config;
  }
}

class IntersectionOptimizer {
  constructor(
    private config: SmartAutoLazyConfig["intersectionOptimization"],
  ) {}

  handleScroll(): void {
    // Handle scroll events for intersection optimization
  }

  updateConfig(config: SmartAutoLazyConfig["intersectionOptimization"]): void {
    this.config = config;
  }
}

class CacheManager {
  private cache: Map<string, any> = new Map();

  constructor(private config: SmartAutoLazyConfig["cacheManagement"]) {}

  has(key: string): boolean {
    return this.cache.has(key);
  }

  set(key: string, value: any): void {
    this.cache.set(key, value);
  }

  get(key: string): any {
    return this.cache.get(key);
  }

  clear(): void {
    this.cache.clear();
  }

  updateConfig(config: SmartAutoLazyConfig["cacheManagement"]): void {
    this.config = config;
  }
}

class PerformanceMonitor {
  constructor(private config: SmartAutoLazyConfig["performanceMonitoring"]) {}

  startMonitoring(): void {
    // Start performance monitoring
  }

  updateConfig(config: SmartAutoLazyConfig["performanceMonitoring"]): void {
    this.config = config;
  }
}

class BehaviorAnalyzer {
  private patterns: Map<string, UserBehaviorPattern> = new Map();

  startAnalysis(): void {
    // Start behavior analysis
  }

  trackInteraction(type: string, target: HTMLElement): void {
    // Track user interactions for pattern analysis
  }

  analyzePatterns(): void {
    // Analyze collected behavior patterns
  }

  getPatterns(): UserBehaviorPattern[] {
    return Array.from(this.patterns.values());
  }

  updateConfig(config: any): void {
    // Update behavior analysis configuration
  }
}

// React hook
export function useSmartAutoLazy() {
  const engine = SmartAutoLazyEngine.getInstance();
  const [metrics, setMetrics] = React.useState(engine.getPerformanceMetrics());
  const [resourceMetrics, setResourceMetrics] = React.useState(
    engine.getResourceMetrics(),
  );
  const [patterns, setPatterns] = React.useState(engine.getUserPatterns());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(engine.getPerformanceMetrics());
      setResourceMetrics(engine.getResourceMetrics());
      setPatterns(engine.getUserPatterns());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    engine,
    metrics,
    resourceMetrics,
    patterns,
    lazyLoadElement: engine.lazyLoadElement.bind(engine),
    preloadResource: engine.preloadResource.bind(engine),
    getPerformanceMetrics: engine.getPerformanceMetrics.bind(engine),
    getResourceMetrics: engine.getResourceMetrics.bind(engine),
    getUserPatterns: engine.getUserPatterns.bind(engine),
    getLoadingQueue: engine.getLoadingQueue.bind(engine),
    clearCache: engine.clearCache.bind(engine),
    optimizeLoading: engine.optimizeLoading.bind(engine),
    updateConfig: engine.updateConfig.bind(engine),
    generatePerformanceReport: engine.generatePerformanceReport.bind(engine),
  };
}

export default SmartAutoLazyEngine;
