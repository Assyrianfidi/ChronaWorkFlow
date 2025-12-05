/**
 * KPI Animation Engine
 * Advanced animation system for real-time KPI updates and transitions
 */

export interface KPIAnimationConfig {
  duration: number;
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic';
  delay?: number;
  stagger?: number;
  loop?: boolean;
  direction?: 'normal' | 'reverse' | 'alternate';
  autoStart?: boolean;
}

export interface KPIValue {
  current: number;
  target: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'neutral';
  format?: 'currency' | 'percentage' | 'number' | 'duration';
  precision?: number;
}

export interface KPIAnimationState {
  id: string;
  element: HTMLElement;
  value: KPIValue;
  config: KPIAnimationConfig;
  startTime: number;
  startValue: number;
  isAnimating: boolean;
  currentFrame: number;
  totalFrames: number;
  onComplete?: () => void;
  onUpdate?: (value: number, progress: number) => void;
}

export class KPIAnimationEngine {
  private animations: Map<string, KPIAnimationState> = new Map();
  private animationFrame: number | null = null;
  private globalConfig: Partial<KPIAnimationConfig> = {
    duration: 2000,
    easing: 'ease-out',
    autoStart: true
  };

  constructor(config?: Partial<KPIAnimationConfig>) {
    if (config) {
      this.globalConfig = { ...this.globalConfig, ...config };
    }
  }

  public animateKPI(
    id: string,
    element: HTMLElement,
    value: KPIValue,
    config?: Partial<KPIAnimationConfig>
  ): Promise<void> {
    return new Promise((resolve) => {
      const animationConfig: KPIAnimationConfig = {
        ...this.globalConfig,
        ...config
      };

      const state: KPIAnimationState = {
        id,
        element,
        value,
        config: animationConfig,
        startTime: performance.now(),
        startValue: value.previous,
        isAnimating: false,
        currentFrame: 0,
        totalFrames: Math.ceil(animationConfig.duration / 16.67), // 60fps
        onComplete: resolve
      };

      this.animations.set(id, state);

      if (animationConfig.autoStart) {
        this.startAnimation(id);
      }
    });
  }

  public startAnimation(id: string): void {
    const state = this.animations.get(id);
    if (!state || state.isAnimating) return;

    state.isAnimating = true;
    this.startAnimationLoop();
  }

  public stopAnimation(id: string): void {
    const state = this.animations.get(id);
    if (state) {
      state.isAnimating = false;
      this.animations.delete(id);
    }
  }

  public pauseAnimation(id: string): void {
    const state = this.animations.get(id);
    if (state) {
      state.isAnimating = false;
    }
  }

  public resumeAnimation(id: string): void {
    const state = this.animations.get(id);
    if (state && !state.isAnimating) {
      state.isAnimating = true;
      this.startAnimationLoop();
    }
  }

  public updateKPIValue(id: string, newValue: Partial<KPIValue>): void {
    const state = this.animations.get(id);
    if (!state) return;

    state.value = { ...state.value, ...newValue };
    
    if (newValue.target !== undefined) {
      state.startValue = state.value.current;
      state.startTime = performance.now();
      state.isAnimating = true;
      this.startAnimationLoop();
    }
  }

  public formatKPIValue(value: number, format?: string, precision?: number): string {
    const actualPrecision = precision ?? 2;

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: actualPrecision,
          maximumFractionDigits: actualPrecision
        }).format(value);
      case 'percentage':
        return `${value.toFixed(actualPrecision)}%`;
      case 'number':
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: actualPrecision,
          maximumFractionDigits: actualPrecision
        }).format(value);
      case 'duration':
        const hours = Math.floor(value / 3600);
        const minutes = Math.floor((value % 3600) / 60);
        const seconds = Math.floor(value % 60);
        
        if (hours > 0) {
          return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
          return `${minutes}m ${seconds}s`;
        } else {
          return `${seconds}s`;
        }
      default:
        return value.toFixed(actualPrecision);
    }
  }

  private startAnimationLoop(): void {
    if (this.animationFrame) return;

    const animate = (currentTime: number) => {
      let hasActiveAnimations = false;

      this.animations.forEach((state) => {
        if (!state.isAnimating) return;

        hasActiveAnimations = true;
        const elapsed = currentTime - state.startTime;
        const progress = Math.min(elapsed / state.config.duration, 1);
        
        const easedProgress = this.applyEasing(progress, state.config.easing);
        const currentValue = state.startValue + (state.value.target - state.startValue) * easedProgress;

        // Update element content
        this.updateElementContent(state.element, currentValue, state.value);

        // Call update callback
        if (state.onUpdate) {
          state.onUpdate(currentValue, progress);
        }

        // Update state
        state.currentFrame++;
        state.value.current = currentValue;

        // Check if animation is complete
        if (progress >= 1) {
          state.isAnimating = false;
          
          if (state.config.loop) {
            // Restart animation
            state.startTime = currentTime;
            state.startValue = state.value.target;
            state.isAnimating = true;
          } else {
            // Animation complete
            this.animations.delete(state.id);
            
            if (state.onComplete) {
              state.onComplete();
            }
          }
        }
      });

      if (hasActiveAnimations) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.animationFrame = null;
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  private updateElementContent(element: HTMLElement, value: number, kpiValue: KPIValue): void {
    const formattedValue = this.formatKPIValue(value, kpiValue.format, kpiValue.precision);
    
    // Update main value
    const valueElement = element.querySelector('.kpi-value');
    if (valueElement) {
      valueElement.textContent = formattedValue;
    }

    // Update change indicator
    const changeElement = element.querySelector('.kpi-change');
    if (changeElement && kpiValue.change !== 0) {
      const changeText = kpiValue.change > 0 ? `+${this.formatKPIValue(Math.abs(kpiValue.change), kpiValue.format, kpiValue.precision)}` : 
                          `-${this.formatKPIValue(Math.abs(kpiValue.change), kpiValue.format, kpiValue.precision)}`;
      const changePercentText = `(${kpiValue.changePercent > 0 ? '+' : ''}${kpiValue.changePercent.toFixed(1)}%)`;
      
      changeElement.innerHTML = `${changeText} <span class="kpi-change-percent">${changePercentText}</span>`;
    }

    // Update trend indicator
    const trendElement = element.querySelector('.kpi-trend');
    if (trendElement) {
      trendElement.textContent = kpiValue.trend === 'up' ? '↑' : 
                                kpiValue.trend === 'down' ? '↓' : '→';
      trendElement.className = `kpi-trend trend-${kpiValue.trend}`;
    }

    // Update progress bar if present
    if (kpiValue.target) {
      const progressBar = element.querySelector('.kpi-progress-bar');
      const progressText = element.querySelector('.kpi-progress-text');
      const progressPercent = Math.min((value / kpiValue.target) * 100, 100);
      
      if (progressBar) {
        progressBar.style.width = `${progressPercent}%`;
      }
      
      if (progressText) {
        progressText.textContent = `${Math.round(progressPercent)}%`;
      }
    }
  }

  private applyEasing(progress: number, easing: string): number {
    switch (easing) {
      case 'linear':
        return progress;
      case 'ease':
        return this.easeInOutQuad(progress);
      case 'ease-in':
        return this.easeInQuad(progress);
      case 'ease-out':
        return this.easeOutQuad(progress);
      case 'ease-in-out':
        return this.easeInOutQuad(progress);
      case 'bounce':
        return this.easeOutBounce(progress);
      case 'elastic':
        return this.easeOutElastic(progress);
      default:
        return progress;
    }
  }

  // Easing functions
  private easeInQuad(t: number): number {
    return t * t;
  }

  private easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  private easeOutBounce(t: number): number {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      t -= 1.5 / 2.75;
      return 7.5625 * t * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      t -= 2.25 / 2.75;
      return 7.5625 * t * t + 0.9375;
    } else {
      t -= 2.625 / 2.75;
      return 7.5625 * t * t + 0.984375;
    }
  }

  private easeOutElastic(t: number): number {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
  }

  // Batch operations
  public animateMultipleKPIs(
    kpis: Array<{
      id: string;
      element: HTMLElement;
      value: KPIValue;
      config?: Partial<KPIAnimationConfig>;
    }>
  ): Promise<void[]> {
    const promises = kpis.map((kpi, index) => {
      const config = {
        ...kpi.config,
        delay: (kpi.config?.delay || 0) + (index * (kpi.config?.stagger || 100))
      };
      
      return this.animateKPI(kpi.id, kpi.element, kpi.value, config);
    });

    return Promise.all(promises);
  }

  // Staggered animations
  public animateSequence(
    sequence: Array<{
      id: string;
      element: HTMLElement;
      value: KPIValue;
      config?: Partial<KPIAnimationConfig>;
    }>
  ): Promise<void> {
    return sequence.reduce((promise, item, index) => {
      return promise.then(() => {
        const delay = (item.config?.delay || 0) + (index * (item.config?.stagger || 200));
        return this.animateKPI(item.id, item.element, item.value, { ...item.config, delay });
      });
    }, Promise.resolve());
  }

  // Real-time updates
  public startRealTimeUpdates(
    id: string,
    element: HTMLElement,
    value: KPIValue,
    updateInterval: number = 5000,
    variation: number = 0.05
  ): () => void {
    const update = () => {
      const variationAmount = value.target * variation;
      const newValue = value.target + (Math.random() - 0.5) * variationAmount;
      
      this.updateKPIValue(id, {
        target: newValue,
        change: newValue - value.current,
        changePercent: ((newValue - value.current) / value.current) * 100,
        trend: newValue > value.current ? 'up' : newValue < value.current ? 'down' : 'neutral'
      });
    };

    const intervalId = setInterval(update, updateInterval);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }

  // Performance monitoring
  public getPerformanceMetrics(): {
    activeAnimations: number;
    totalAnimations: number;
    averageDuration: number;
    frameRate: number;
  } {
    const activeAnimations = this.animations.size;
    const totalAnimations = activeAnimations; // This would need to be tracked separately
    const averageDuration = Array.from(this.animations.values())
      .reduce((sum, state) => sum + state.config.duration, 0) / activeAnimations || 0;
    const frameRate = 60; // This would need to be measured

    return {
      activeAnimations,
      totalAnimations,
      averageDuration,
      frameRate
    };
  }

  public destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    this.animations.clear();
  }
}

// React Hook for KPI animations
export const useKPIAnimation = (
  elementRef: React.RefObject<HTMLElement>,
  value: KPIValue,
  config?: Partial<KPIAnimationConfig>
) => {
  const [engine] = useState(() => new KPIAnimationEngine());
  const [isAnimating, setIsAnimating] = useState(false);
  const animationIdRef = useState(() => `kpi-${Date.now()}-${Math.random()}`)[0];

  useEffect(() => {
    if (elementRef.current) {
      setIsAnimating(true);
      
      engine.animateKPI(animationIdRef, elementRef.current, value, config)
        .then(() => setIsAnimating(false))
        .catch(console.error);
    }

    return () => {
      engine.stopAnimation(animationIdRef);
    };
  }, [value, config]);

  const updateValue = useCallback((newValue: Partial<KPIValue>) => {
    engine.updateKPIValue(animationIdRef, newValue);
  }, [engine, animationIdRef]);

  const startRealTimeUpdates = useCallback((
    updateInterval?: number,
    variation?: number
  ) => {
    if (elementRef.current) {
      return engine.startRealTimeUpdates(
        animationIdRef,
        elementRef.current,
        value,
        updateInterval,
        variation
      );
    }
  }, [engine, animationIdRef, elementRef, value]);

  return {
    isAnimating,
    updateValue,
    startRealTimeUpdates,
    engine
  };
};

export default KPIAnimationEngine;
