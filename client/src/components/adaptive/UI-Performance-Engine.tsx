import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAdaptiveLayout } from './AdaptiveLayoutEngine';
import { useUserExperienceMode } from './UserExperienceMode';

// Performance monitoring types
interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  componentCount: number;
  networkRequests: number;
  cacheHitRate: number;
}

interface ComponentPerformanceData {
  componentName: string;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  memoryFootprint: number;
}

interface LazyComponentConfig {
  threshold: number;
  rootMargin: string;
  triggerOnce: boolean;
}

// Performance Engine Context
interface PerformanceContextType {
  metrics: PerformanceMetrics;
  componentMetrics: Map<string, ComponentPerformanceData>;
  isLowPerformanceMode: boolean;
  enablePerformanceMode: () => void;
  disablePerformanceMode: () => void;
  registerComponent: (name: string, element: HTMLElement) => void;
  unregisterComponent: (name: string) => void;
  getComponentMetrics: (name: string) => ComponentPerformanceData | undefined;
}

const PerformanceContext = React.createContext<PerformanceContextType | null>(null);

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  LOW_FPS: 30,
  HIGH_MEMORY: 100 * 1024 * 1024, // 100MB
  SLOW_RENDER: 16, // 16ms (60fps target)
  HIGH_COMPONENT_COUNT: 100,
};

export function UIPerformanceEngine({ children }: { children: React.ReactNode }) {
  const { currentBreakpoint, isMobile } = useAdaptiveLayout();
  const { currentMode } = useUserExperienceMode();
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    renderTime: 0,
    componentCount: 0,
    networkRequests: 0,
    cacheHitRate: 0,
  });
  
  const [componentMetrics, setComponentMetrics] = useState<Map<string, ComponentPerformanceData>>(new Map());
  const [isLowPerformanceMode, setIsLowPerformanceMode] = useState(false);
  const [components, setComponents] = useState<Map<string, HTMLElement>>(new Map());
  
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number>();
  const observersRef = useRef<Map<string, IntersectionObserver>>(new Map());

  // FPS monitoring
  const measureFPS = useCallback(() => {
    frameCountRef.current++;
    const currentTime = performance.now();
    const deltaTime = currentTime - lastFrameTimeRef.current;

    if (deltaTime >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / deltaTime);
      frameCountRef.current = 0;
      lastFrameTimeRef.current = currentTime;

      setMetrics(prev => ({ ...prev, fps }));
    }

    animationFrameRef.current = requestAnimationFrame(measureFPS);
  }, []);

  // Memory monitoring
  const measureMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = memory.usedJSHeapSize;
      setMetrics(prev => ({ ...prev, memoryUsage }));
    }
  }, []);

  // Component performance tracking
  const registerComponent = useCallback((name: string, element: HTMLElement) => {
    setComponents(prev => new Map(prev.set(name, element)));
    
    // Set up performance observer for this component
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name.includes(name)) {
            const renderTime = entry.duration;
            
            setComponentMetrics(prev => {
              const existing = prev.get(name) || {
                componentName: name,
                renderCount: 0,
                averageRenderTime: 0,
                lastRenderTime: 0,
                memoryFootprint: 0,
              };
              
              const newRenderCount = existing.renderCount + 1;
              const newAverageRenderTime = (existing.averageRenderTime * existing.renderCount + renderTime) / newRenderCount;
              
              return new Map(prev.set(name, {
                ...existing,
                renderCount: newRenderCount,
                averageRenderTime: newAverageRenderTime,
                lastRenderTime: renderTime,
              }));
            });
          }
        });
      });
      
      observer.observe({ entryTypes: ['measure', 'navigation'] });
      observersRef.current.set(name, observer);
    }
  }, []);

  const unregisterComponent = useCallback((name: string) => {
    setComponents(prev => {
      const newMap = new Map(prev);
      newMap.delete(name);
      return newMap;
    });
    
    const observer = observersRef.current.get(name);
    if (observer) {
      observer.disconnect();
      observersRef.current.delete(name);
    }
    
    setComponentMetrics(prev => {
      const newMap = new Map(prev);
      newMap.delete(name);
      return newMap;
    });
  }, []);

  // Performance mode management
  const enablePerformanceMode = useCallback(() => {
    setIsLowPerformanceMode(true);
    document.body.classList.add('low-performance-mode');
  }, []);

  const disablePerformanceMode = useCallback(() => {
    setIsLowPerformanceMode(false);
    document.body.classList.remove('low-performance-mode');
  }, []);

  // Auto performance mode detection
  useEffect(() => {
    const shouldEnableLowPerformanceMode = 
      metrics.fps < PERFORMANCE_THRESHOLDS.LOW_FPS ||
      metrics.memoryUsage > PERFORMANCE_THRESHOLDS.HIGH_MEMORY ||
      components.size > PERFORMANCE_THRESHOLDS.HIGH_COMPONENT_COUNT;

    if (shouldEnableLowPerformanceMode && !isLowPerformanceMode) {
      enablePerformanceMode();
    } else if (!shouldEnableLowPerformanceMode && isLowPerformanceMode) {
      disablePerformanceMode();
    }
  }, [metrics, components.size, isLowPerformanceMode, enablePerformanceMode, disablePerformanceMode]);

  // Start performance monitoring
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(measureFPS);
    
    const memoryInterval = setInterval(measureMemoryUsage, 5000);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      clearInterval(memoryInterval);
      
      // Clean up observers
      observersRef.current.forEach(observer => observer.disconnect());
      observersRef.current.clear();
    };
  }, [measureFPS, measureMemoryUsage]);

  // Adaptive performance settings based on device and user preferences
  useEffect(() => {
    if (isMobile || currentMode.animations === 'minimal') {
      enablePerformanceMode();
    } else if (currentMode.animations === 'enhanced' && !isMobile) {
      disablePerformanceMode();
    }
  }, [isMobile, currentMode.animations, enablePerformanceMode, disablePerformanceMode]);

  const getComponentMetrics = useCallback((name: string) => {
    return componentMetrics.get(name);
  }, [componentMetrics]);

  const contextValue: PerformanceContextType = {
    metrics,
    componentMetrics,
    isLowPerformanceMode,
    enablePerformanceMode,
    disablePerformanceMode,
    registerComponent,
    unregisterComponent,
    getComponentMetrics,
  };

  return (
    <PerformanceContext.Provider value={contextValue}>
      <div className={cn(
        'ui-performance-engine',
        isLowPerformanceMode && 'low-performance-mode',
        currentMode.animations === 'minimal' && 'animations-minimal',
        currentMode.animations === 'enhanced' && 'animations-enhanced'
      )}>
        {children}
      </div>
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = React.useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within UIPerformanceEngine');
  }
  return context;
}

// Lazy Loading Component
export function LazyLoad({
  children,
  fallback,
  config = { threshold: 0.1, rootMargin: '50px', triggerOnce: true },
  className,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  config?: LazyComponentConfig;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const { isLowPerformanceMode } = usePerformance();

  // In low performance mode, load immediately
  useEffect(() => {
    if (isLowPerformanceMode) {
      setIsVisible(true);
      setHasLoaded(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setHasLoaded(true);
            if (config.triggerOnce) {
              observer.disconnect();
            }
          } else if (!config.triggerOnce) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold: config.threshold,
        rootMargin: config.rootMargin,
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [config.threshold, config.rootMargin, config.triggerOnce, isLowPerformanceMode]);

  return (
    <div ref={elementRef} className={cn('lazy-load-container', className)}>
      {hasLoaded ? children : (
        fallback || (
          <div className="flex items-center justify-center p-8 bg-gray-100 dark:bg-gray-800 rounded">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )
      )}
    </div>
  );
}

// Performance Monitor Component
export function PerformanceMonitor() {
  const { metrics, componentMetrics, isLowPerformanceMode, enablePerformanceMode, disablePerformanceMode } = usePerformance();

  const topComponents = useMemo(() => {
    return Array.from(componentMetrics.values())
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
      .slice(0, 5);
  }, [componentMetrics]);

  return (
    <div className="performance-monitor p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Performance Monitor
        </h3>
        <div className="flex items-center gap-2">
          <span className={cn(
            'px-2 py-1 text-xs rounded',
            isLowPerformanceMode ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          )}>
            {isLowPerformanceMode ? 'Low Performance Mode' : 'Normal Mode'}
          </span>
          <button
            onClick={isLowPerformanceMode ? disablePerformanceMode : enablePerformanceMode}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {isLowPerformanceMode ? 'Disable' : 'Enable'} Performance Mode
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.fps}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">FPS</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round(metrics.memoryUsage / 1024 / 1024)}MB
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Memory</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{componentMetrics.size}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Components</div>
        </div>
      </div>

      {topComponents.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Slowest Components
          </h4>
          <div className="space-y-1">
            {topComponents.map((component) => (
              <div key={component.componentName} className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">{component.componentName}</span>
                <span className="text-gray-900 dark:text-white">
                  {component.averageRenderTime.toFixed(2)}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Performance Optimized Component HOC
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceTrackedComponent(props: P) {
    const { registerComponent, unregisterComponent } = usePerformance();
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (elementRef.current) {
        registerComponent(componentName, elementRef.current);
      }

      return () => {
        unregisterComponent(componentName);
      };
    }, [registerComponent, unregisterComponent]);

    return (
      <div ref={elementRef} className={`performance-tracked-${componentName}`}>
        <Component {...props} />
      </div>
    );
  };
}

// Adaptive Image Component
export function AdaptiveImage({
  src,
  alt,
  className,
  sizes = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const { isLowPerformanceMode } = usePerformance();
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // In low performance mode, use simpler loading strategy
  if (isLowPerformanceMode) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading="lazy"
        {...props}
      />
    );
  }

  return (
    <div className={cn('adaptive-image-container relative', className)}>
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        {...props}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
          <span className="text-gray-500 dark:text-gray-400">Failed to load image</span>
        </div>
      )}
    </div>
  );
}

export default UIPerformanceEngine;
