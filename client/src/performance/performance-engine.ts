
declare global {
  interface Window {
    [key: string]: any;
  }
}

/**
 * Performance Optimization Engine
 * Advanced performance monitoring and optimization for sub-1s page loads
 */

export interface PerformanceMetrics {
  // Core Web Vitals
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;

  // Custom Metrics
  pageLoadTime: number;
  renderTime: number;
  apiResponseTime: number;
  bundleSize: number;
  memoryUsage: number;

  // User Experience
  perceivedPerformance: number;
  smoothness: number;
  responsiveness: number;
}

export interface PerformanceConfig {
  monitoring: {
    enabled: boolean;
    sampleRate: number;
    maxSamples: number;
    reportingEndpoint?: string;
  };
  optimization: {
    lazyLoading: boolean;
    codeSplitting: boolean;
    prefetching: boolean;
    caching: boolean;
    compression: boolean;
    imageOptimization: boolean;
  };
  thresholds: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
    timeToInteractive: number;
    pageLoadTime: number;
    apiResponseTime: number;
  };
  budget: {
    bundleSize: number;
    imageCount: number;
    scriptCount: number;
    styleCount: number;
  };
}

export interface PerformanceReport {
  timestamp: Date;
  url: string;
  metrics: PerformanceMetrics;
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  recommendations: PerformanceRecommendation[];
  violations: PerformanceViolation[];
}

export interface PerformanceRecommendation {
  type: "critical" | "warning" | "info";
  category: "loading" | "rendering" | "network" | "memory" | "user-experience";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  effort: "high" | "medium" | "low";
  implementation: string;
  resources: string[];
}

export interface PerformanceViolation {
  metric: keyof PerformanceMetrics;
  threshold: number;
  actual: number;
  severity: "critical" | "warning";
  description: string;
}

export class PerformanceEngine {
  private config: PerformanceConfig;
  private observer: PerformanceObserver | null = null;
  private metrics: PerformanceMetrics[] = [];
  private reports: PerformanceReport[] = [];
  private startTime: number = 0;
  private navigationStart: number = 0;
  private isMonitoring: boolean = false;
  private performanceEntries: PerformanceEntry[] = [];
  private resourceTimings: PerformanceResourceTiming[] = [];
  private paintTimings: PerformancePaintTiming[] = [];
  private layoutShiftEntries: PerformanceEntry[] = [];

  constructor(config?: Partial<PerformanceConfig>) {
    this.config = {
      monitoring: {
        enabled: true,
        sampleRate: 1.0,
        maxSamples: 100,
        reportingEndpoint: "/api/performance",
      },
      optimization: {
        lazyLoading: true,
        codeSplitting: true,
        prefetching: true,
        caching: true,
        compression: true,
        imageOptimization: true,
      },
      thresholds: {
        firstContentfulPaint: 1500,
        largestContentfulPaint: 2500,
        firstInputDelay: 100,
        cumulativeLayoutShift: 0.1,
        timeToInteractive: 3800,
        pageLoadTime: 3000,
        apiResponseTime: 500,
      },
      budget: {
        bundleSize: 250000, // 250KB
        imageCount: 20,
        scriptCount: 10,
        styleCount: 5,
      },
      ...config,
    };

    this.initialize();
  }

  private initialize(): void {
    if (!this.config.monitoring.enabled) return;

    this.startTime = performance.now();
    this.navigationStart = performance.timing.navigationStart;

    this.setupPerformanceObservers();
    this.setupResourceMonitoring();
    this.setupUserInteractionMonitoring();
    this.setupMemoryMonitoring();
    this.startMonitoring();
  }

  private setupPerformanceObservers(): void {
    try {
      // Core Web Vitals monitoring
      this.observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.performanceEntries.push(entry);

          switch (entry.entryType) {
            case "paint":
              this.handlePaintEntry(entry as PerformancePaintTiming);
              break;
            case "largest-contentful-paint":
              this.handleLargestContentfulPaint(entry as any);
              break;
            case "first-input":
              this.handleFirstInput(entry as any);
              break;
            case "layout-shift":
              this.handleLayoutShift(entry as any);
              break;
            case "navigation":
              this.handleNavigationEntry(entry as PerformanceNavigationTiming);
              break;
            case "resource":
              this.handleResourceEntry(entry as PerformanceResourceTiming);
              break;
          }
        });
      });

      this.observer.observe({
        entryTypes: [
          "paint",
          "largest-contentful-paint",
          "first-input",
          "layout-shift",
          "navigation",
          "resource",
        ],
      });
    } catch (error) {
      console.warn("Performance Observer not supported:", error);
    }
  }

  private handlePaintEntry(entry: PerformancePaintTiming): void {
    this.paintTimings.push(entry);
  }

  private handleLargestContentfulPaint(entry: any): void {
    // LCP is handled in metrics calculation
  }

  private handleFirstInput(entry: any): void {
    // FID is handled in metrics calculation
  }

  private handleLayoutShift(entry: any): void {
    if (!entry.hadRecentInput) {
      this.layoutShiftEntries.push(entry);
    }
  }

  private handleNavigationEntry(entry: PerformanceNavigationTiming): void {
    // Navigation timing data
  }

  private handleResourceEntry(entry: PerformanceResourceTiming): void {
    this.resourceTimings.push(entry);
  }

  private setupResourceMonitoring(): void {
    // Monitor resource loading
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const start = performance.now();

      try {
        const response = await originalFetch(...args);
        const end = performance.now();

        this.logApiPerformance(args[0] as string, end - start, response.status);

        return response;
      } catch (error) {
        const end = performance.now();
        this.logApiPerformance(args[0] as string, end - start, 0);
        throw error;
      }
    };
  }

  private setupUserInteractionMonitoring(): void {
    let firstInputTime: number | null = null;

    ["click", "keydown", "touchstart"].forEach((eventType) => {
      document.addEventListener(
        eventType,
        (event) => {
          if (!firstInputTime) {
            firstInputTime = performance.now();
            this.logUserInteraction("first-input", firstInputTime);
          }
        },
        { once: true },
      );
    });
  }

  private setupMemoryMonitoring(): void {
    // Monitor memory usage if available
    if ("memory" in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.logMemoryUsage(memory);
      }, 5000);
    }
  }

  private startMonitoring(): void {
    this.isMonitoring = true;

    // Generate periodic reports
    setInterval(() => {
      if (this.isMonitoring) {
        this.generateReport();
      }
    }, 30000); // Every 30 seconds

    // Monitor page unload
    window.addEventListener("beforeunload", () => {
      this.generateReport();
    });
  }

  private logApiPerformance(
    url: string,
    duration: number,
    status: number,
  ): void {
    // Log API performance for monitoring
    if (duration > this.config.thresholds.apiResponseTime) {
      console.warn(`Slow API response: ${url} took ${duration}ms`);
    }
  }

  private logUserInteraction(type: string, timestamp: number): void {
    // Log user interaction metrics
  }

  private logMemoryUsage(memory: any): void {
    // Log memory usage for monitoring
    const usage = {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
    };

    if (usage.used / usage.limit > 0.8) {
      console.warn("High memory usage detected:", usage);
    }
  }

  private calculateMetrics(): PerformanceMetrics {
    const now = performance.now();
    const navigation = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;

    // Core Web Vitals
    const fcpEntry = this.paintTimings.find(
      (entry) => entry.name === "first-contentful-paint",
    );
    const firstContentfulPaint = fcpEntry ? fcpEntry.startTime : 0;

    const lcpEntry = performance
      .getEntriesByType("largest-contentful-paint")
      .pop() as any;
    const largestContentfulPaint = lcpEntry ? lcpEntry.startTime : 0;

    const fidEntry = performance.getEntriesByType("first-input").pop() as any;
    const firstInputDelay = fidEntry
      ? fidEntry.processingStart - fidEntry.startTime
      : 0;

    const clsValue = this.layoutShiftEntries.reduce(
      (sum, entry: any) => sum + entry.value,
      0,
    );
    const cumulativeLayoutShift = clsValue;

    // Custom metrics
    const pageLoadTime = navigation
      ? navigation.loadEventEnd - navigation.navigationStart
      : now - this.navigationStart;
    const renderTime = firstContentfulPaint;
    const apiResponseTime = this.calculateAverageApiResponseTime();
    const bundleSize = this.calculateBundleSize();
    const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;

    // Time to Interactive (simplified calculation)
    const timeToInteractive = Math.max(
      firstContentfulPaint,
      largestContentfulPaint,
      this.calculateTimeToInteractive(),
    );

    // User Experience metrics
    const perceivedPerformance = this.calculatePerceivedPerformance();
    const smoothness = this.calculateSmoothness();
    const responsiveness = this.calculateResponsiveness();

    return {
      firstContentfulPaint,
      largestContentfulPaint,
      firstInputDelay,
      cumulativeLayoutShift,
      timeToInteractive,
      pageLoadTime,
      renderTime,
      apiResponseTime,
      bundleSize,
      memoryUsage,
      perceivedPerformance,
      smoothness,
      responsiveness,
    };
  }

  private calculateAverageApiResponseTime(): number {
    if (this.resourceTimings.length === 0) return 0;

    const apiCalls = this.resourceTimings.filter(
      (resource) =>
        resource.initiatorType === "fetch" ||
        resource.initiatorType === "xmlhttprequest",
    );

    if (apiCalls.length === 0) return 0;

    const totalTime = apiCalls.reduce(
      (sum, resource) => sum + resource.responseEnd - resource.requestStart,
      0,
    );
    return totalTime / apiCalls.length;
  }

  private calculateBundleSize(): number {
    // Calculate total bundle size from resource timings
    const scripts = this.resourceTimings.filter(
      (resource) => resource.initiatorType === "script",
    );
    return scripts.reduce((sum, script) => sum + (script.transferSize || 0), 0);
  }

  private calculateTimeToInteractive(): number {
    // Simplified TTI calculation - in production, use proper TTI calculation
    const fcp =
      this.paintTimings.find((entry) => entry.name === "first-contentful-paint")
        ?.startTime || 0;
    const longTasks = performance.getEntriesByType("long-task");

    if (longTasks.length === 0) return fcp + 1000;

    const lastLongTask = longTasks[longTasks.length - 1];
    return Math.max(fcp, lastLongTask.startTime + lastLongTask.duration);
  }

  private calculatePerceivedPerformance(): number {
    // Calculate perceived performance based on visual metrics
    const fcp =
      this.paintTimings.find((entry) => entry.name === "first-contentful-paint")
        ?.startTime || 0;
    const lcp = performance
      .getEntriesByType("largest-contentful-paint")
      .pop() as any;
    const lcpTime = lcp ? lcp.startTime : 0;

    // Score based on how quickly content appears
    const fcpScore = Math.max(0, 100 - fcp / 20); // 20ms = 1 point penalty
    const lcpScore = Math.max(0, 100 - lcpTime / 40); // 40ms = 1 point penalty

    return (fcpScore + lcpScore) / 2;
  }

  private calculateSmoothness(): number {
    // Calculate smoothness based on layout shifts and long tasks
    const clsValue = this.layoutShiftEntries.reduce(
      (sum, entry: any) => sum + entry.value,
      0,
    );
    const longTasks = performance.getEntriesByType("long-task");

    const clsScore = Math.max(0, 100 - clsValue * 100); // 0.01 CLS = 1 point penalty
    const longTaskScore = Math.max(0, 100 - longTasks.length * 10); // Each long task = 10 point penalty

    return (clsScore + longTaskScore) / 2;
  }

  private calculateResponsiveness(): number {
    // Calculate responsiveness based on FID and interaction latency
    const fidEntry = performance.getEntriesByType("first-input").pop() as any;
    const fid = fidEntry ? fidEntry.processingStart - fidEntry.startTime : 0;

    return Math.max(0, 100 - fid / 5); // 5ms FID = 1 point penalty
  }

  private generateReport(): void {
    const metrics = this.calculateMetrics();
    const score = this.calculatePerformanceScore(metrics);
    const grade = this.calculatePerformanceGrade(score);
    const recommendations = this.generateRecommendations(metrics);
    const violations = this.detectViolations(metrics);

    const report: PerformanceReport = {
      timestamp: new Date(),
      url: window.location.href,
      metrics,
      score,
      grade,
      recommendations,
      violations,
    };

    this.reports.push(report);
    this.metrics.push(metrics);

    // Keep only recent reports
    if (this.reports.length > this.config.monitoring.maxSamples) {
      this.reports = this.reports.slice(-this.config.monitoring.maxSamples);
    }

    if (this.metrics.length > this.config.monitoring.maxSamples) {
      this.metrics = this.metrics.slice(-this.config.monitoring.maxSamples);
    }

    // Report to endpoint if configured
    if (
      this.config.monitoring.reportingEndpoint &&
      Math.random() < this.config.monitoring.sampleRate
    ) {
      this.sendReport(report);
    }
  }

  private calculatePerformanceScore(metrics: PerformanceMetrics): number {
    const weights = {
      firstContentfulPaint: 0.2,
      largestContentfulPaint: 0.25,
      firstInputDelay: 0.15,
      cumulativeLayoutShift: 0.15,
      timeToInteractive: 0.15,
      pageLoadTime: 0.1,
    };

    const scores = {
      firstContentfulPaint: Math.max(
        0,
        100 -
          (metrics.firstContentfulPaint /
            this.config.thresholds.firstContentfulPaint) *
            100,
      ),
      largestContentfulPaint: Math.max(
        0,
        100 -
          (metrics.largestContentfulPaint /
            this.config.thresholds.largestContentfulPaint) *
            100,
      ),
      firstInputDelay: Math.max(
        0,
        100 -
          (metrics.firstInputDelay / this.config.thresholds.firstInputDelay) *
            100,
      ),
      cumulativeLayoutShift: Math.max(
        0,
        100 -
          (metrics.cumulativeLayoutShift /
            this.config.thresholds.cumulativeLayoutShift) *
            100,
      ),
      timeToInteractive: Math.max(
        0,
        100 -
          (metrics.timeToInteractive /
            this.config.thresholds.timeToInteractive) *
            100,
      ),
      pageLoadTime: Math.max(
        0,
        100 -
          (metrics.pageLoadTime / this.config.thresholds.pageLoadTime) * 100,
      ),
    };

    return Object.entries(weights).reduce((score, [metric, weight]) => {
      return score + scores[metric as keyof typeof scores] * weight;
    }, 0);
  }

  private calculatePerformanceGrade(
    score: number,
  ): "A" | "B" | "C" | "D" | "F" {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  }

  private generateRecommendations(
    metrics: PerformanceMetrics,
  ): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];

    // FCP recommendations
    if (
      metrics.firstContentfulPaint > this.config.thresholds.firstContentfulPaint
    ) {
      recommendations.push({
        type: "critical",
        category: "loading",
        title: "Optimize First Contentful Paint",
        description: `FCP is ${metrics.firstContentfulPaint}ms, which is above the ${this.config.thresholds.firstContentfulPaint}ms threshold.`,
        impact: "high",
        effort: "medium",
        implementation:
          "Implement server-side rendering, optimize critical CSS, and reduce render-blocking resources.",
        resources: [
          "https://web.dev/optimize-lcp/",
          "https://web.dev/render-blocking-resources/",
        ],
      });
    }

    // LCP recommendations
    if (
      metrics.largestContentfulPaint >
      this.config.thresholds.largestContentfulPaint
    ) {
      recommendations.push({
        type: "critical",
        category: "loading",
        title: "Optimize Largest Contentful Paint",
        description: `LCP is ${metrics.largestContentfulPaint}ms, which is above the ${this.config.thresholds.largestContentfulPaint}ms threshold.`,
        impact: "high",
        effort: "medium",
        implementation:
          "Optimize images, preload important resources, and remove unnecessary third-party scripts.",
        resources: [
          "https://web.dev/optimize-lcp/",
          "https://web.dev/image-optimization/",
        ],
      });
    }

    // FID recommendations
    if (metrics.firstInputDelay > this.config.thresholds.firstInputDelay) {
      recommendations.push({
        type: "warning",
        category: "rendering",
        title: "Reduce First Input Delay",
        description: `FID is ${metrics.firstInputDelay}ms, which is above the ${this.config.thresholds.firstInputDelay}ms threshold.`,
        impact: "medium",
        effort: "low",
        implementation:
          "Break up long tasks, reduce JavaScript execution time, and use web workers.",
        resources: [
          "https://web.dev/fid/",
          "https://web.dev/long-tasks-devtools/",
        ],
      });
    }

    // CLS recommendations
    if (
      metrics.cumulativeLayoutShift >
      this.config.thresholds.cumulativeLayoutShift
    ) {
      recommendations.push({
        type: "warning",
        category: "user-experience",
        title: "Reduce Cumulative Layout Shift",
        description: `CLS is ${metrics.cumulativeLayoutShift.toFixed(3)}, which is above the ${this.config.thresholds.cumulativeLayoutShift} threshold.`,
        impact: "medium",
        effort: "medium",
        implementation:
          "Include size attributes for images and videos, avoid inserting content above existing content.",
        resources: ["https://web.dev/cls/", "https://web.dev/optimize-cls/"],
      });
    }

    // Bundle size recommendations
    if (metrics.bundleSize > this.config.budget.bundleSize) {
      recommendations.push({
        type: "warning",
        category: "network",
        title: "Reduce Bundle Size",
        description: `Bundle size is ${(metrics.bundleSize / 1024).toFixed(1)}KB, which exceeds the ${(this.config.budget.bundleSize / 1024).toFixed(1)}KB budget.`,
        impact: "medium",
        effort: "high",
        implementation:
          "Implement code splitting, tree shaking, and remove unused dependencies.",
        resources: [
          "https://web.dev/code-splitting-suspense/",
          "https://web.dev/remove-unused-code/",
        ],
      });
    }

    // Memory usage recommendations
    if (metrics.memoryUsage > 50 * 1024 * 1024) {
      // 50MB
      recommendations.push({
        type: "info",
        category: "memory",
        title: "Optimize Memory Usage",
        description: `Memory usage is ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB, which may cause performance issues.`,
        impact: "low",
        effort: "medium",
        implementation:
          "Clean up event listeners, use object pooling, and avoid memory leaks.",
        resources: [
          "https://web.dev/memory-management/",
          "https://web.dev/avoid-huge-memory-leaks/",
        ],
      });
    }

    return recommendations.sort((a, b) => {
      const impactOrder = { critical: 3, warning: 2, info: 1 };
      return impactOrder[b.type] - impactOrder[a.type];
    });
  }

  private detectViolations(
    metrics: PerformanceMetrics,
  ): PerformanceViolation[] {
    const violations: PerformanceViolation[] = [];

    Object.entries(this.config.thresholds).forEach(([metric, threshold]) => {
      const value = metrics[metric as keyof PerformanceMetrics];

      if (value > threshold) {
        const severity = value > threshold * 2 ? "critical" : "warning";

        violations.push({
          metric: metric as keyof PerformanceMetrics,
          threshold,
          actual: value,
          severity,
          description: `${metric.replace(/([A-Z])/g, " $1").toLowerCase()} is ${value}ms, exceeding the ${threshold}ms threshold.`,
        });
      }
    });

    return violations;
  }

  private async sendReport(report: PerformanceReport): Promise<void> {
    if (!this.config.monitoring.reportingEndpoint) return;

    try {
      await fetch(this.config.monitoring.reportingEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(report),
      });
    } catch (error) {
      console.warn("Failed to send performance report:", error);
    }
  }

  // Public API Methods
  public getCurrentMetrics(): PerformanceMetrics {
    return this.calculateMetrics();
  }

  public getLatestReport(): PerformanceReport | null {
    return this.reports.length > 0
      ? this.reports[this.reports.length - 1]
      : null;
  }

  public getHistoricalReports(): PerformanceReport[] {
    return this.reports;
  }

  public getAverageMetrics(): PerformanceMetrics | null {
    if (this.metrics.length === 0) return null;

    const sum = this.metrics.reduce((acc, metrics) => {
      Object.keys(metrics).forEach((key) => {
        acc[key as keyof PerformanceMetrics] +=
          metrics[key as keyof PerformanceMetrics];
      });
      return acc;
    }, {} as PerformanceMetrics);

    const count = this.metrics.length;
    Object.keys(sum).forEach((key) => {
      sum[key as keyof PerformanceMetrics] /= count;
    });

    return sum;
  }

  public startOptimization(): void {
    if (!this.config.optimization.lazyLoading) return;

    // Implement lazy loading for images
    this.setupLazyLoading();

    // Implement prefetching for critical resources
    if (this.config.optimization.prefetching) {
      this.setupPrefetching();
    }

    // Implement resource hints
    this.setupResourceHints();
  }

  private setupLazyLoading(): void {
    const images = document.querySelectorAll("img[data-src]");

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src!;
          img.removeAttribute("data-src");
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach((img) => imageObserver.observe(img));
  }

  private setupPrefetching(): void {
    // Prefetch critical resources based on user behavior
    const criticalResources = [
      "/api/dashboard",
      "/api/reports",
      "/api/transactions",
    ];

    criticalResources.forEach((url) => {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = url;
      document.head.appendChild(link);
    });
  }

  private setupResourceHints(): void {
    // Add DNS prefetch for external domains
    const externalDomains = [
      "fonts.googleapis.com",
      "api.stripe.com",
      "cdn.jsdelivr.net",
    ];

    externalDomains.forEach((domain) => {
      const link = document.createElement("link");
      link.rel = "dns-prefetch";
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });
  }

  public optimizeImages(): void {
    if (!this.config.optimization.imageOptimization) return;

    const images = document.querySelectorAll("img");

    images.forEach((img) => {
      // Add loading="lazy" to images
      if (!img.hasAttribute("loading")) {
        img.setAttribute("loading", "lazy");
      }

      // Add responsive images if not present
      if (!img.hasAttribute("srcset") && img.naturalWidth > 0) {
        const srcset = this.generateSrcSet(img);
        if (srcset) {
          img.setAttribute("srcset", srcset);
        }
      }
    });
  }

  private generateSrcSet(img: HTMLImageElement): string {
    // Generate responsive image srcset
    const widths = [320, 640, 960, 1280, 1920];
    const src = img.src;

    return widths
      .filter((width) => width <= img.naturalWidth)
      .map((width) => `${src}?w=${width} ${width}w`)
      .join(", ");
  }

  public enablePerformanceMode(): void {
    // Enable aggressive performance optimizations
    document.body.classList.add("performance-mode");

    // Reduce animations
    document.documentElement.style.setProperty("--animation-duration", "0.1s");

    // Disable non-essential features
    this.disableNonEssentialFeatures();
  }

  private disableNonEssentialFeatures(): void {
    // Disable animations, transitions, and other performance-heavy features
    const style = document.createElement("style");
    style.textContent = `
      .performance-mode * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
      
      .performance-mode .non-essential {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  public updateConfig(updates: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  public getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  public destroy(): void {
    this.isMonitoring = false;

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Restore original fetch
    // Note: This is simplified - in production, better restoration needed
  }
}

export default PerformanceEngine;
