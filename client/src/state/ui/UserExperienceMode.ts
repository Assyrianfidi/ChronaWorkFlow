/**
 * Role-Adaptive Intelligent UI System
 * Automatically adjusts interface based on user role, experience, and patterns
 */

export type UserRole = 'beginner' | 'professional' | 'admin' | 'super_admin';
export type ExperienceLevel = 'novice' | 'intermediate' | 'expert';
export type TaskType = 'data-entry' | 'reporting' | 'analysis' | 'management' | 'configuration';

export interface UserExperienceProfile {
  userId: string;
  role: UserRole;
  experienceLevel: ExperienceLevel;
  preferredTaskTypes: TaskType[];
  usagePatterns: {
    averageSessionDuration: number;
    mostUsedFeatures: string[];
    keyboardShortcutUsage: number;
    mouseClickFrequency: number;
    errorRate: number;
  };
  accessibilityPreferences: {
    reducedMotion: boolean;
    highContrast: boolean;
    largeText: boolean;
    screenReader: boolean;
  };
  uiPreferences: {
    density: 'compact' | 'comfortable' | 'spacious';
    theme: 'light' | 'dark' | 'oled-dark' | 'stealth';
    sidebarCollapsed: boolean;
    showTooltips: boolean;
    showKeyboardShortcuts: boolean;
  };
}

export interface UIAdaptationConfig {
  mode: 'guided' | 'efficient' | 'power';
  density: 'compact' | 'comfortable' | 'spacious';
  complexity: 'minimal' | 'moderate' | 'advanced';
  guidance: {
    showTooltips: boolean;
    showHelpText: boolean;
    showTutorials: boolean;
    showSuggestions: boolean;
  };
  features: {
    advancedOptions: boolean;
    keyboardShortcuts: boolean;
    multiPanelLayout: boolean;
    bulkOperations: boolean;
    auditTrail: boolean;
    apiAccess: boolean;
  };
  animations: {
    enabled: boolean;
    intensity: 'subtle' | 'normal' | 'dramatic';
    duration: 'fast' | 'normal' | 'slow';
  };
}

export const EXPERIENCE_MODES: Record<UserRole, UIAdaptationConfig> = {
  beginner: {
    mode: 'guided',
    density: 'spacious',
    complexity: 'minimal',
    guidance: {
      showTooltips: true,
      showHelpText: true,
      showTutorials: true,
      showSuggestions: true
    },
    features: {
      advancedOptions: false,
      keyboardShortcuts: false,
      multiPanelLayout: false,
      bulkOperations: false,
      auditTrail: false,
      apiAccess: false
    },
    animations: {
      enabled: true,
      intensity: 'normal',
      duration: 'normal'
    }
  },
  professional: {
    mode: 'efficient',
    density: 'comfortable',
    complexity: 'moderate',
    guidance: {
      showTooltips: false,
      showHelpText: false,
      showTutorials: false,
      showSuggestions: true
    },
    features: {
      advancedOptions: true,
      keyboardShortcuts: true,
      multiPanelLayout: true,
      bulkOperations: true,
      auditTrail: true,
      apiAccess: false
    },
    animations: {
      enabled: true,
      intensity: 'subtle',
      duration: 'fast'
    }
  },
  admin: {
    mode: 'power',
    density: 'compact',
    complexity: 'advanced',
    guidance: {
      showTooltips: false,
      showHelpText: false,
      showTutorials: false,
      showSuggestions: false
    },
    features: {
      advancedOptions: true,
      keyboardShortcuts: true,
      multiPanelLayout: true,
      bulkOperations: true,
      auditTrail: true,
      apiAccess: true
    },
    animations: {
      enabled: true,
      intensity: 'subtle',
      duration: 'fast'
    }
  },
  super_admin: {
    mode: 'power',
    density: 'compact',
    complexity: 'advanced',
    guidance: {
      showTooltips: false,
      showHelpText: false,
      showTutorials: false,
      showSuggestions: false
    },
    features: {
      advancedOptions: true,
      keyboardShortcuts: true,
      multiPanelLayout: true,
      bulkOperations: true,
      auditTrail: true,
      apiAccess: true
    },
    animations: {
      enabled: false,
      intensity: 'subtle',
      duration: 'fast'
    }
  }
};

export class AdaptiveUIEngine {
  private profile: UserExperienceProfile;
  private currentConfig: UIAdaptationConfig;
  private adaptationHistory: Array<{
    timestamp: Date;
    trigger: string;
    adaptation: Partial<UIAdaptationConfig>;
  }> = [];

  constructor(profile: UserExperienceProfile) {
    this.profile = profile;
    this.currentConfig = this.calculateAdaptiveConfig();
  }

  private calculateAdaptiveConfig(): UIAdaptationConfig {
    const baseConfig = EXPERIENCE_MODES[this.profile.role];
    
    // Adapt based on experience level
    const experienceAdaptations = this.getExperienceAdaptations();
    
    // Adapt based on usage patterns
    const patternAdaptations = this.getPatternAdaptations();
    
    // Adapt based on accessibility preferences
    const accessibilityAdaptations = this.getAccessibilityAdaptations();
    
    return {
      ...baseConfig,
      ...experienceAdaptations,
      ...patternAdaptations,
      ...accessibilityAdaptations
    };
  }

  private getExperienceAdaptations(): Partial<UIAdaptationConfig> {
    const adaptations: Partial<UIAdaptationConfig> = {};
    
    switch (this.profile.experienceLevel) {
      case 'novice':
        adaptations.guidance = {
          showTooltips: true,
          showHelpText: true,
          showTutorials: true,
          showSuggestions: true
        };
        adaptations.animations = {
          enabled: true,
          intensity: 'normal',
          duration: 'normal'
        };
        break;
      case 'intermediate':
        adaptations.guidance = {
          showTooltips: false,
          showHelpText: false,
          showTutorials: false,
          showSuggestions: true
        };
        adaptations.animations = {
          enabled: true,
          intensity: 'subtle',
          duration: 'fast'
        };
        break;
      case 'expert':
        adaptations.guidance = {
          showTooltips: false,
          showHelpText: false,
          showTutorials: false,
          showSuggestions: false
        };
        adaptations.animations = {
          enabled: false,
          intensity: 'subtle',
          duration: 'fast'
        };
        break;
    }
    
    return adaptations;
  }

  private getPatternAdaptations(): Partial<UIAdaptationConfig> {
    const adaptations: Partial<UIAdaptationConfig> = {};
    const patterns = this.profile.usagePatterns;
    
    // High keyboard shortcut usage -> enable more shortcuts
    if (patterns.keyboardShortcutUsage > 0.7) {
      adaptations.features = {
        keyboardShortcuts: true,
        advancedOptions: true,
        multiPanelLayout: true,
        bulkOperations: true,
        auditTrail: true,
        apiAccess: false
      };
    }
    
    // Low error rate -> enable advanced features
    if (patterns.errorRate < 0.05) {
      adaptations.complexity = 'advanced';
      adaptations.mode = 'power';
    }
    
    // Long sessions -> optimize for efficiency
    if (patterns.averageSessionDuration > 1800) { // 30 minutes
      adaptations.density = 'compact';
      adaptations.animations = {
        enabled: true,
        intensity: 'subtle',
        duration: 'fast'
      };
    }
    
    return adaptations;
  }

  private getAccessibilityAdaptations(): Partial<UIAdaptationConfig> {
    const adaptations: Partial<UIAdaptationConfig> = {};
    const prefs = this.profile.accessibilityPreferences;
    
    if (prefs.reducedMotion) {
      adaptations.animations = {
        enabled: false,
        intensity: 'subtle',
        duration: 'fast'
      };
    }
    
    if (prefs.largeText) {
      adaptations.density = 'spacious';
    }
    
    if (prefs.screenReader) {
      adaptations.guidance = {
        showTooltips: true,
        showHelpText: true,
        showTutorials: false,
        showSuggestions: true
      };
      adaptations.animations = {
        enabled: false,
        intensity: 'subtle',
        duration: 'fast'
      };
    }
    
    return adaptations;
  }

  public updateProfile(updates: Partial<UserExperienceProfile>): void {
    this.profile = { ...this.profile, ...updates };
    const newConfig = this.calculateAdaptiveConfig();
    
    // Record adaptation if config changed
    if (JSON.stringify(newConfig) !== JSON.stringify(this.currentConfig)) {
      this.adaptationHistory.push({
        timestamp: new Date(),
        trigger: 'profile_update',
        adaptation: newConfig
      });
      this.currentConfig = newConfig;
    }
  }

  public adaptToTask(taskType: TaskType): UIAdaptationConfig {
    const taskAdaptations: Partial<UIAdaptationConfig> = {};
    
    switch (taskType) {
      case 'data-entry':
        taskAdaptations.mode = 'efficient';
        taskAdaptations.density = 'comfortable';
        taskAdaptations.features = {
          ...this.currentConfig.features,
          bulkOperations: true,
          keyboardShortcuts: true
        };
        break;
      case 'reporting':
        taskAdaptations.mode = 'power';
        taskAdaptations.complexity = 'advanced';
        taskAdaptations.features = {
          ...this.currentConfig.features,
          multiPanelLayout: true,
          advancedOptions: true
        };
        break;
      case 'analysis':
        taskAdaptations.mode = 'power';
        taskAdaptations.complexity = 'advanced';
        taskAdaptations.features = {
          ...this.currentConfig.features,
          multiPanelLayout: true,
          advancedOptions: true,
          apiAccess: true
        };
        break;
      case 'management':
        taskAdaptations.mode = 'efficient';
        taskAdaptations.density = 'compact';
        taskAdaptations.features = {
          ...this.currentConfig.features,
          auditTrail: true,
          bulkOperations: true
        };
        break;
      case 'configuration':
        taskAdaptations.mode = 'guided';
        taskAdaptations.complexity = 'moderate';
        taskAdaptations.guidance = {
          showTooltips: true,
          showHelpText: true,
          showTutorials: false,
          showSuggestions: true
        };
        break;
    }
    
    const adaptedConfig = { ...this.currentConfig, ...taskAdaptations };
    
    this.adaptationHistory.push({
      timestamp: new Date(),
      trigger: `task_${taskType}`,
      adaptation: taskAdaptations
    });
    
    return adaptedConfig;
  }

  public getCurrentConfig(): UIAdaptationConfig {
    return this.currentConfig;
  }

  public getAdaptationHistory(): typeof this.adaptationHistory {
    return this.adaptationHistory;
  }

  public shouldShowFeature(feature: keyof UIAdaptationConfig['features']): boolean {
    return this.currentConfig.features[feature];
  }

  public shouldShowGuidance(guidance: keyof UIAdaptationConfig['guidance']): boolean {
    return this.currentConfig.guidance[guidance];
  }

  public getAnimationSettings(): UIAdaptationConfig['animations'] {
    return this.currentConfig.animations;
  }

  public getDensity(): UIAdaptationConfig['density'] {
    return this.currentConfig.density;
  }

  public getMode(): UIAdaptationConfig['mode'] {
    return this.currentConfig.mode;
  }
}

// Hook for React components
export const useAdaptiveUI = (profile: UserExperienceProfile) => {
  const [engine] = useState(() => new AdaptiveUIEngine(profile));
  const [config, setConfig] = useState(engine.getCurrentConfig());

  useEffect(() => {
    const updateConfig = () => setConfig(engine.getCurrentConfig());
    // Update config when profile changes
    engine.updateProfile(profile);
    updateConfig();
  }, [profile, engine]);

  return {
    config,
    engine,
    adaptToTask: engine.adaptToTask.bind(engine),
    updateProfile: engine.updateProfile.bind(engine),
    shouldShowFeature: engine.shouldShowFeature.bind(engine),
    shouldShowGuidance: engine.shouldShowGuidance.bind(engine),
    getAnimationSettings: engine.getAnimationSettings.bind(engine),
    getDensity: engine.getDensity.bind(engine),
    getMode: engine.getMode.bind(engine)
  };
};
