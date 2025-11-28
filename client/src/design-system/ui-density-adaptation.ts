/**
 * Enterprise UI Density Auto-Adaption System
 * Automatically adjusts component spacing, input density, typography, and info levels
 */

export interface UIDensityProfile {
  // Spacing configuration
  spacing: {
    component: number;
    section: number;
    page: number;
    compact: number;
    comfortable: number;
    spacious: number;
  };
  
  // Typography configuration
  typography: {
    scale: number;
    weight: {
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeight: number;
    letterSpacing: number;
  };
  
  // Input density
  inputs: {
    height: number;
    padding: number;
    borderRadius: number;
    borderWidth: number;
    fontSize: number;
  };
  
  // Information detail levels
  information: {
    kpiRichness: 'minimal' | 'standard' | 'detailed' | 'comprehensive';
    dataDensity: 'low' | 'medium' | 'high' | 'maximum';
    helpText: boolean;
    tooltips: boolean;
    contextualHelp: boolean;
  };
  
  // Component density
  components: {
    buttonSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    cardPadding: number;
    tableRowHeight: number;
    sidebarWidth: number;
    headerHeight: number;
  };
}

export interface AdaptationFactors {
  // Device characteristics
  device: {
    type: 'mobile' | 'tablet' | 'desktop' | 'ultrawide';
    screenSize: number;
    pixelDensity: number;
    touchCapable: boolean;
    performance: 'low' | 'medium' | 'high';
  };
  
  // User characteristics
  user: {
    role: 'beginner' | 'professional' | 'admin' | 'super_admin';
    experienceLevel: 'novice' | 'intermediate' | 'expert';
    preferences: {
      density: 'compact' | 'comfortable' | 'spacious';
      animations: boolean;
      reducedMotion: boolean;
      highContrast: boolean;
      largeText: boolean;
    };
  };
  
  // Contextual factors
  context: {
    taskType: 'data-entry' | 'analysis' | 'review' | 'configuration';
    timeConstraints: boolean;
    errorRate: number;
    sessionDuration: number;
    accessibilityMode: boolean;
  };
  
  // Performance constraints
  performance: {
    targetFPS: number;
    memoryLimit: number;
    networkSpeed: 'slow' | 'medium' | 'fast';
    batteryLevel: number;
  };
}

export class UIDensityAdaptationEngine {
  private static instance: UIDensityAdaptationEngine;
  private currentProfile: UIDensityProfile;
  private adaptationFactors: AdaptationFactors;
  private adaptationHistory: Array<{
    timestamp: number;
    factors: AdaptationFactors;
    profile: UIDensityProfile;
    performance: {
      fps: number;
      renderTime: number;
      userSatisfaction: number;
    };
  }> = [];

  private constructor() {
    this.adaptationFactors = this.detectAdaptationFactors();
    this.currentProfile = this.calculateOptimalProfile();
    this.initializeAdaptation();
  }

  static getInstance(): UIDensityAdaptationEngine {
    if (!UIDensityAdaptationEngine.instance) {
      UIDensityAdaptationEngine.instance = new UIDensityAdaptationEngine();
    }
    return UIDensityAdaptationEngine.instance;
  }

  private detectAdaptationFactors(): AdaptationFactors {
    if (typeof window === 'undefined') {
      return this.getDefaultAdaptationFactors();
    }

    // Device detection
    const device = this.detectDevice();
    
    // User detection (would come from user profile/store)
    const user = this.detectUserCharacteristics();
    
    // Context detection
    const context = this.detectContext();
    
    // Performance detection
    const performance = this.detectPerformance();

    return { device, user, context, performance };
  }

  private detectDevice(): AdaptationFactors['device'] {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    
    let type: AdaptationFactors['device']['type'];
    if (width < 768) {
      type = 'mobile';
    } else if (width < 1024) {
      type = 'tablet';
    } else if (width < 1440) {
      type = 'desktop';
    } else {
      type = 'ultrawide';
    }

    const touchCapable = 'ontouchstart' in window;
    
    // Performance detection based on hardware
    let performance: AdaptationFactors['device']['performance'];
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 4;
    
    if (cores >= 8 && memory >= 8) {
      performance = 'high';
    } else if (cores >= 4 && memory >= 4) {
      performance = 'medium';
    } else {
      performance = 'low';
    }

    return {
      type,
      screenSize: Math.sqrt(width * width + height * height),
      pixelDensity: pixelRatio,
      touchCapable,
      performance
    };
  }

  private detectUserCharacteristics(): AdaptationFactors['user'] {
    // This would typically come from user store/database
    // For now, using defaults with detection of some preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    const prefersLargeText = window.matchMedia('(prefers-reduced-transparency: reduce)').matches;

    return {
      role: 'professional', // Default
      experienceLevel: 'intermediate', // Default
      preferences: {
        density: 'comfortable',
        animations: !prefersReducedMotion,
        reducedMotion: prefersReducedMotion,
        highContrast: prefersHighContrast,
        largeText: prefersLargeText
      }
    };
  }

  private detectContext(): AdaptationFactors['context'] {
    // Analyze current context based on time, user behavior, etc.
    const hour = new Date().getHours();
    const timeConstraints = hour >= 9 && hour <= 17; // Business hours
    
    return {
      taskType: 'analysis', // Default, would be detected from user actions
      timeConstraints,
      errorRate: 0, // Would be tracked
      sessionDuration: 0, // Would be tracked
      accessibilityMode: this.detectUserCharacteristics().user.preferences.highContrast
    };
  }

  private detectPerformance(): AdaptationFactors['performance'] {
    const connection = (navigator as any).connection;
    const networkSpeed = connection ? 
      (connection.effectiveType === '4g' ? 'fast' : 
       connection.effectiveType === '3g' ? 'medium' : 'slow') : 'medium';

    const batteryLevel = (navigator as any).battery?.level || 1;
    
    return {
      targetFPS: 60,
      memoryLimit: (navigator as any).deviceMemory * 1024 * 1024 * 1024 || 4 * 1024 * 1024 * 1024,
      networkSpeed,
      batteryLevel
    };
  }

  private getDefaultAdaptationFactors(): AdaptationFactors {
    return {
      device: {
        type: 'desktop',
        screenSize: 1920,
        pixelDensity: 1,
        touchCapable: false,
        performance: 'medium'
      },
      user: {
        role: 'professional',
        experienceLevel: 'intermediate',
        preferences: {
          density: 'comfortable',
          animations: true,
          reducedMotion: false,
          highContrast: false,
          largeText: false
        }
      },
      context: {
        taskType: 'analysis',
        timeConstraints: false,
        errorRate: 0,
        sessionDuration: 0,
        accessibilityMode: false
      },
      performance: {
        targetFPS: 60,
        memoryLimit: 4 * 1024 * 1024 * 1024,
        networkSpeed: 'medium',
        batteryLevel: 1
      }
    };
  }

  private calculateOptimalProfile(): UIDensityProfile {
    const { device, user, context, performance } = this.adaptationFactors;
    
    // Base profile calculations
    let spacingScale = 1;
    let typographyScale = 1;
    let inputScale = 1;
    let informationDensity: UIDensityProfile['information']['kpiRichness'] = 'standard';
    let componentSize: UIDensityProfile['components']['buttonSize'] = 'md';

    // Device-based adaptations
    switch (device.type) {
      case 'mobile':
        spacingScale = 0.8;
        typographyScale = 0.95;
        inputScale = 1.1; // Larger touch targets
        componentSize = 'lg';
        break;
      case 'tablet':
        spacingScale = 0.9;
        typographyScale = 1;
        inputScale = 1.05;
        componentSize = 'md';
        break;
      case 'desktop':
        spacingScale = 1;
        typographyScale = 1;
        inputScale = 1;
        componentSize = 'md';
        break;
      case 'ultrawide':
        spacingScale = 1.2;
        typographyScale = 1.05;
        inputScale = 1;
        componentSize = 'md';
        break;
    }

    // User preference adaptations
    switch (user.preferences.density) {
      case 'compact':
        spacingScale *= 0.8;
        typographyScale *= 0.95;
        break;
      case 'comfortable':
        spacingScale *= 1;
        typographyScale *= 1;
        break;
      case 'spacious':
        spacingScale *= 1.3;
        typographyScale *= 1.05;
        break;
    }

    // Accessibility adaptations
    if (user.preferences.largeText) {
      typographyScale *= 1.2;
      inputScale *= 1.1;
    }

    if (user.preferences.highContrast) {
      // Adjust for better contrast
      typographyScale *= 1.05;
    }

    // Role-based adaptations
    switch (user.role) {
      case 'beginner':
        informationDensity = 'minimal';
        break;
      case 'professional':
        informationDensity = 'standard';
        break;
      case 'admin':
        informationDensity = 'detailed';
        break;
      case 'super_admin':
        informationDensity = 'comprehensive';
        break;
    }

    // Experience level adaptations
    switch (user.experienceLevel) {
      case 'novice':
        spacingScale *= 1.1;
        informationDensity = user.role === 'beginner' ? 'minimal' : 'standard';
        break;
      case 'intermediate':
        // No changes
        break;
      case 'expert':
        spacingScale *= 0.9;
        if (user.role === 'professional') {
          informationDensity = 'detailed';
        }
        break;
    }

    // Performance-based adaptations
    if (performance.targetFPS < 30) {
      // Reduce visual complexity for better performance
      spacingScale *= 0.9;
      typographyScale *= 0.95;
    }

    // Context-based adaptations
    if (context.timeConstraints) {
      // Increase density for faster task completion
      spacingScale *= 0.8;
      informationDensity = 'detailed';
    }

    if (context.taskType === 'data-entry') {
      inputScale *= 1.1; // Larger inputs for easier data entry
    } else if (context.taskType === 'analysis') {
      informationDensity = 'comprehensive';
    }

    // Generate final profile
    return {
      spacing: {
        component: 16 * spacingScale,
        section: 24 * spacingScale,
        page: 32 * spacingScale,
        compact: 8 * spacingScale,
        comfortable: 16 * spacingScale,
        spacious: 24 * spacingScale
      },
      typography: {
        scale: typographyScale,
        weight: {
          light: 300,
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700
        },
        lineHeight: 1.5,
        letterSpacing: 0
      },
      inputs: {
        height: 40 * inputScale,
        padding: 12 * inputScale,
        borderRadius: 6,
        borderWidth: 1,
        fontSize: 14 * typographyScale
      },
      information: {
        kpiRichness: informationDensity,
        dataDensity: informationDensity === 'minimal' ? 'low' : 
                     informationDensity === 'standard' ? 'medium' :
                     informationDensity === 'detailed' ? 'high' : 'maximum',
        helpText: user.experienceLevel === 'novice',
        tooltips: user.experienceLevel !== 'expert',
        contextualHelp: user.role === 'beginner'
      },
      components: {
        buttonSize: componentSize,
        cardPadding: 16 * spacingScale,
        tableRowHeight: 48 * spacingScale,
        sidebarWidth: device.type === 'mobile' ? 280 : 320,
        headerHeight: 64 * spacingScale
      }
    };
  }

  private initializeAdaptation(): void {
    if (typeof document === 'undefined') return;

    // Apply CSS custom properties
    this.applyCSSVariables();
    
    // Set up listeners for real-time adaptation
    this.setupAdaptationListeners();
    
    // Start performance monitoring
    this.startPerformanceMonitoring();
  }

  private applyCSSVariables(): void {
    const root = document.documentElement;
    const profile = this.currentProfile;

    // Apply spacing variables
    root.style.setProperty('--spacing-component', `${profile.spacing.component}px`);
    root.style.setProperty('--spacing-section', `${profile.spacing.section}px`);
    root.style.setProperty('--spacing-page', `${profile.spacing.page}px`);
    root.style.setProperty('--spacing-compact', `${profile.spacing.compact}px`);
    root.style.setProperty('--spacing-comfortable', `${profile.spacing.comfortable}px`);
    root.style.setProperty('--spacing-spacious', `${profile.spacing.spacious}px`);

    // Apply typography variables
    root.style.setProperty('--typography-scale', profile.typography.scale.toString());
    root.style.setProperty('--font-weight-light', profile.typography.weight.light.toString());
    root.style.setProperty('--font-weight-normal', profile.typography.weight.normal.toString());
    root.style.setProperty('--font-weight-medium', profile.typography.weight.medium.toString());
    root.style.setProperty('--font-weight-semibold', profile.typography.weight.semibold.toString());
    root.style.setProperty('--font-weight-bold', profile.typography.weight.bold.toString());
    root.style.setProperty('--line-height', profile.typography.lineHeight.toString());
    root.style.setProperty('--letter-spacing', `${profile.typography.letterSpacing}px`);

    // Apply input variables
    root.style.setProperty('--input-height', `${profile.inputs.height}px`);
    root.style.setProperty('--input-padding', `${profile.inputs.padding}px`);
    root.style.setProperty('--input-border-radius', `${profile.inputs.borderRadius}px`);
    root.style.setProperty('--input-border-width', `${profile.inputs.borderWidth}px`);
    root.style.setProperty('--input-font-size', `${profile.inputs.fontSize}px`);

    // Apply component variables
    root.style.setProperty('--card-padding', `${profile.components.cardPadding}px`);
    root.style.setProperty('--table-row-height', `${profile.components.tableRowHeight}px`);
    root.style.setProperty('--sidebar-width', `${profile.components.sidebarWidth}px`);
    root.style.setProperty('--header-height', `${profile.components.headerHeight}px`);

    // Apply information density classes
    root.setAttribute('data-kpi-richness', profile.information.kpiRichness);
    root.setAttribute('data-data-density', profile.information.dataDensity);
    root.setAttribute('data-button-size', profile.components.buttonSize);
  }

  private setupAdaptationListeners(): void {
    if (typeof window === 'undefined') return;

    // Listen for resize events
    const handleResize = () => {
      this.adaptationFactors.device = this.detectDevice();
      this.recalculateProfile();
    };

    // Listen for preference changes
    const handlePreferenceChange = () => {
      this.adaptationFactors.user = this.detectUserCharacteristics();
      this.recalculateProfile();
    };

    // Listen for performance changes
    const handlePerformanceChange = () => {
      this.adaptationFactors.performance = this.detectPerformance();
      this.recalculateProfile();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Listen for media query changes
    const mediaQueries = [
      '(prefers-reduced-motion: reduce)',
      '(prefers-contrast: high)',
      '(prefers-reduced-transparency: reduce)'
    ];

    mediaQueries.forEach(query => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener('change', handlePreferenceChange);
    });

    // Listen for network changes
    if ((navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', handlePerformanceChange);
    }
  }

  private startPerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    let frameCount = 0;
    let lastTime = performance.now();

    const measurePerformance = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;

        // Adapt based on performance
        if (fps < 30) {
          this.adaptationFactors.performance.targetFPS = 30;
          this.recalculateProfile();
        } else if (fps > 60) {
          this.adaptationFactors.performance.targetFPS = 60;
          this.recalculateProfile();
        }
      }

      requestAnimationFrame(measurePerformance);
    };

    requestAnimationFrame(measurePerformance);
  }

  private recalculateProfile(): void {
    const newProfile = this.calculateOptimalProfile();
    
    // Only apply if profile actually changed
    if (JSON.stringify(newProfile) !== JSON.stringify(this.currentProfile)) {
      this.currentProfile = newProfile;
      this.applyCSSVariables();
      
      // Record adaptation
      this.adaptationHistory.push({
        timestamp: Date.now(),
        factors: { ...this.adaptationFactors },
        profile: { ...this.currentProfile },
        performance: {
          fps: this.adaptationFactors.performance.targetFPS,
          renderTime: 0, // Would be measured
          userSatisfaction: 0 // Would be measured
        }
      });
    }
  }

  // Public API
  getCurrentProfile(): UIDensityProfile {
    return { ...this.currentProfile };
  }

  getAdaptationFactors(): AdaptationFactors {
    return { ...this.adaptationFactors };
  }

  forceAdaptation(factors: Partial<AdaptationFactors>): void {
    this.adaptationFactors = { ...this.adaptationFactors, ...factors };
    this.recalculateProfile();
  }

  getAdaptationHistory(): typeof this.adaptationHistory {
    return [...this.adaptationHistory];
  }

  // Utility methods for components
  getSpacing(size: 'component' | 'section' | 'page' | 'compact' | 'comfortable' | 'spacious'): number {
    return this.currentProfile.spacing[size];
  }

  getTypography(weight: keyof UIDensityProfile['typography']['weight']): number {
    return this.currentProfile.typography.weight[weight];
  }

  getButtonSize(): UIDensityProfile['components']['buttonSize'] {
    return this.currentProfile.components.buttonSize;
  }

  shouldShowHelpText(): boolean {
    return this.currentProfile.information.helpText;
  }

  shouldShowTooltips(): boolean {
    return this.currentProfile.information.tooltips;
  }

  getKPIRichness(): UIDensityProfile['information']['kpiRichness'] {
    return this.currentProfile.information.kpiRichness;
  }
}

// React hook
export function useUIDensityAdaptation() {
  const engine = UIDensityAdaptationEngine.getInstance();
  const [profile, setProfile] = React.useState(engine.getCurrentProfile());

  React.useEffect(() => {
    const interval = setInterval(() => {
      const newProfile = engine.getCurrentProfile();
      if (JSON.stringify(newProfile) !== JSON.stringify(profile)) {
        setProfile(newProfile);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [profile]);

  return {
    profile,
    engine,
    getSpacing: engine.getSpacing.bind(engine),
    getTypography: engine.getTypography.bind(engine),
    getButtonSize: engine.getButtonSize.bind(engine),
    shouldShowHelpText: engine.shouldShowHelpText.bind(engine),
    shouldShowTooltips: engine.shouldShowTooltips.bind(engine),
    getKPIRichness: engine.getKPIRichness.bind(engine)
  };
}

export default UIDensityAdaptationEngine;
