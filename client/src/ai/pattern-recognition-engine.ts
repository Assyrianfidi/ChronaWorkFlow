/**
 * AI Pattern Recognition Engine
 * Identifies user habits, frequently accessed features, common workflows, and efficiency bottlenecks
 */

export interface UserPattern {
  id: string;
  type: 'navigation' | 'workflow' | 'time' | 'efficiency' | 'preference';
  name: string;
  description: string;
  confidence: number; // 0-1
  frequency: number; // occurrences per session
  lastSeen: Date;
  data: any; // pattern-specific data
  recommendations: PatternRecommendation[];
}

export interface PatternRecommendation {
  type: 'shortcut' | 'ui_adjustment' | 'workflow_optimization' | 'feature_suggestion';
  title: string;
  description: string;
  action: string; // action to perform
  priority: 'low' | 'medium' | 'high' | 'critical';
  impact: number; // estimated efficiency gain 0-1
  implementation: () => void;
}

export interface UserBehaviorEvent {
  id: string;
  timestamp: Date;
  type: 'click' | 'navigation' | 'form_submit' | 'data_view' | 'search' | 'filter' | 'export' | 'import';
  target: string; // element or feature identifier
  context: {
    page: string;
    section: string;
    userRole: string;
    deviceType: string;
    timeOfDay: number;
    sessionDuration: number;
  };
  metadata: {
    duration?: number;
    success: boolean;
    errors?: string[];
    data?: any;
  };
}

export interface WorkflowPattern {
  id: string;
  steps: Array<{
    action: string;
    target: string;
    timestamp: Date;
    duration: number;
    success: boolean;
  }>;
  frequency: number;
  averageDuration: number;
  errorRate: number;
  optimizationOpportunities: string[];
}

export class AIPatternRecognitionEngine {
  private static instance: AIPatternRecognitionEngine;
  private behaviorEvents: UserBehaviorEvent[] = [];
  private patterns: Map<string, UserPattern> = new Map();
  private workflows: Map<string, WorkflowPattern> = new Map();
  private model: PatternRecognitionModel;
  private isLearning: boolean = false;
  private learningInterval: number | null = null;

  private constructor() {
    this.model = new PatternRecognitionModel();
    this.initializeLearning();
  }

  static getInstance(): AIPatternRecognitionEngine {
    if (!AIPatternRecognitionEngine.instance) {
      AIPatternRecognitionEngine.instance = new AIPatternRecognitionEngine();
    }
    return AIPatternRecognitionEngine.instance;
  }

  private initializeLearning(): void {
    if (typeof window === 'undefined') return;

    // Start continuous learning
    this.startContinuousLearning();
    
    // Load existing patterns from storage
    this.loadPersistedPatterns();
    
    // Set up event listeners
    this.setupEventListeners();
  }

  private startContinuousLearning(): void {
    this.isLearning = true;
    
    // Analyze patterns every 30 seconds
    this.learningInterval = window.setInterval(() => {
      this.analyzePatterns();
      this.updateRecommendations();
    }, 30000);
  }

  private setupEventListeners(): void {
    if (typeof document === 'undefined') return;

    // Track user interactions
    document.addEventListener('click', this.handleClick.bind(this));
    document.addEventListener('keydown', this.handleKeyboard.bind(this));
    
    // Track navigation
    window.addEventListener('popstate', this.handleNavigation.bind(this));
    
    // Track form submissions
    document.addEventListener('submit', this.handleFormSubmit.bind(this));
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const elementId = this.getElementIdentifier(target);
    
    if (!elementId) return;

    this.recordBehaviorEvent({
      id: this.generateEventId(),
      timestamp: new Date(),
      type: 'click',
      target: elementId,
      context: this.getCurrentContext(),
      metadata: {
        success: true,
        data: {
          coordinates: { x: event.clientX, y: event.clientY },
          button: event.button
        }
      }
    });
  }

  private handleKeyboard(event: KeyboardEvent): void {
    // Track keyboard shortcuts and patterns
    if (event.ctrlKey || event.metaKey || event.altKey) {
      const shortcut = this.getShortcutString(event);
      
      this.recordBehaviorEvent({
        id: this.generateEventId(),
        timestamp: new Date(),
        type: 'navigation',
        target: shortcut,
        context: this.getCurrentContext(),
        metadata: {
          success: true,
          data: { key: event.key, code: event.code }
        }
      });
    }
  }

  private handleNavigation(event: PopStateEvent): void {
    this.recordBehaviorEvent({
      id: this.generateEventId(),
      timestamp: new Date(),
      type: 'navigation',
      target: window.location.pathname,
      context: this.getCurrentContext(),
      metadata: {
        success: true
      }
    });
  }

  private handleFormSubmit(event: Event): void {
    const form = event.target as HTMLFormElement;
    const formId = form.id || form.className || 'unknown-form';
    
    this.recordBehaviorEvent({
      id: this.generateEventId(),
      timestamp: new Date(),
      type: 'form_submit',
      target: formId,
      context: this.getCurrentContext(),
      metadata: {
        success: true,
        data: {
          fields: Array.from(form.elements).length,
          method: form.method
        }
      }
    });
  }

  private getElementIdentifier(element: HTMLElement): string {
    // Generate a consistent identifier for the element
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    if (element.tagName) return element.tagName.toLowerCase();
    if (element.textContent) return element.textContent.slice(0, 20);
    return 'unknown-element';
  }

  private getShortcutString(event: KeyboardEvent): string {
    const parts = [];
    if (event.ctrlKey) parts.push('ctrl');
    if (event.metaKey) parts.push('meta');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    parts.push(event.key.toLowerCase());
    return parts.join('+');
  }

  private getCurrentContext(): UserBehaviorEvent['context'] {
    return {
      page: window.location.pathname,
      section: this.getCurrentSection(),
      userRole: this.getCurrentUserRole(),
      deviceType: this.getDeviceType(),
      timeOfDay: new Date().getHours(),
      sessionDuration: this.getSessionDuration()
    };
  }

  private getCurrentSection(): string {
    // Determine current section based on URL or DOM
    const path = window.location.pathname;
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/transactions')) return 'transactions';
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/settings')) return 'settings';
    return 'unknown';
  }

  private getCurrentUserRole(): string {
    // This would typically come from user store/auth
    return 'professional'; // Default
  }

  private getDeviceType(): string {
    if (window.innerWidth < 768) return 'mobile';
    if (window.innerWidth < 1024) return 'tablet';
    return 'desktop';
  }

  private getSessionDuration(): number {
    // This would track actual session duration
    return 0; // Placeholder
  }

  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API for recording events
  recordBehaviorEvent(event: UserBehaviorEvent): void {
    this.behaviorEvents.push(event);
    
    // Keep only recent events (last 1000)
    if (this.behaviorEvents.length > 1000) {
      this.behaviorEvents = this.behaviorEvents.slice(-1000);
    }
    
    // Trigger immediate analysis for certain events
    if (event.type === 'form_submit' || event.type === 'navigation') {
      this.analyzePatterns();
    }
  }

  // Pattern analysis
  private analyzePatterns(): void {
    if (!this.isLearning) return;

    // Analyze navigation patterns
    this.analyzeNavigationPatterns();
    
    // Analyze workflow patterns
    this.analyzeWorkflowPatterns();
    
    // Analyze time patterns
    this.analyzeTimePatterns();
    
    // Analyze efficiency patterns
    this.analyzeEfficiencyPatterns();
    
    // Analyze preference patterns
    this.analyzePreferencePatterns();
  }

  private analyzeNavigationPatterns(): void {
    const navigationEvents = this.behaviorEvents.filter(e => e.type === 'navigation');
    const pageFrequency = new Map<string, number>();
    const timeOnPage = new Map<string, number[]>();

    navigationEvents.forEach((event, index) => {
      const page = event.target;
      pageFrequency.set(page, (pageFrequency.get(page) || 0) + 1);
      
      // Calculate time spent on page
      if (index > 0) {
        const prevEvent = navigationEvents[index - 1];
        const duration = event.timestamp.getTime() - prevEvent.timestamp.getTime();
        const durations = timeOnPage.get(prevEvent.target) || [];
        durations.push(duration);
        timeOnPage.set(prevEvent.target, durations);
      }
    });

    // Identify frequently accessed pages
    pageFrequency.forEach((frequency, page) => {
      if (frequency >= 5) { // Threshold for pattern recognition
        const durations = timeOnPage.get(page) || [];
        const avgDuration = durations.length > 0 ? 
          durations.reduce((a, b) => a + b, 0) / durations.length : 0;

        const pattern: UserPattern = {
          id: `nav-pattern-${page}`,
          type: 'navigation',
          name: `Frequently Accesses ${page}`,
          description: `User accesses ${page} ${frequency} times with average stay of ${Math.round(avgDuration / 1000)}s`,
          confidence: Math.min(frequency / 20, 1),
          frequency,
          lastSeen: new Date(),
          data: { page, frequency, avgDuration },
          recommendations: this.generateNavigationRecommendations(page, frequency, avgDuration)
        };

        this.patterns.set(pattern.id, pattern);
      }
    });
  }

  private analyzeWorkflowPatterns(): void {
    // Group events into workflows
    const workflows = this.identifyWorkflows();
    
    workflows.forEach(workflow => {
      const pattern: UserPattern = {
        id: `workflow-${workflow.id}`,
        type: 'workflow',
        name: workflow.name,
        description: workflow.description,
        confidence: workflow.confidence,
        frequency: workflow.frequency,
        lastSeen: workflow.lastSeen,
        data: workflow,
        recommendations: this.generateWorkflowRecommendations(workflow)
      };

      this.patterns.set(pattern.id, pattern);
      this.workflows.set(workflow.id, workflow);
    });
  }

  private identifyWorkflows(): WorkflowPattern[] {
    const workflows: WorkflowPattern[] = [];
    const recentEvents = this.behaviorEvents.slice(-50); // Analyze recent events
    
    // Simple workflow detection based on sequential actions
    for (let i = 0; i < recentEvents.length - 2; i++) {
      const event1 = recentEvents[i];
      const event2 = recentEvents[i + 1];
      const event3 = recentEvents[i + 2];

      // Look for common patterns like: dashboard -> transactions -> reports
      if (this.isWorkflowSequence([event1, event2, event3])) {
        const workflowId = this.generateWorkflowId([event1, event2, event3]);
        const existingWorkflow = this.workflows.get(workflowId);

        if (existingWorkflow) {
          // Update existing workflow
          existingWorkflow.frequency++;
          existingWorkflow.steps.push({
            action: event3.type,
            target: event3.target,
            timestamp: event3.timestamp,
            duration: 0, // Would calculate actual duration
            success: event3.metadata.success
          });
        } else {
          // Create new workflow
          const newWorkflow: WorkflowPattern = {
            id: workflowId,
            steps: [
              {
                action: event1.type,
                target: event1.target,
                timestamp: event1.timestamp,
                duration: 0,
                success: event1.metadata.success
              },
              {
                action: event2.type,
                target: event2.target,
                timestamp: event2.timestamp,
                duration: 0,
                success: event2.metadata.success
              },
              {
                action: event3.type,
                target: event3.target,
                timestamp: event3.timestamp,
                duration: 0,
                success: event3.metadata.success
              }
            ],
            frequency: 1,
            averageDuration: 0,
            errorRate: 0,
            optimizationOpportunities: []
          };

          workflows.push(newWorkflow);
          this.workflows.set(workflowId, newWorkflow);
        }
      }
    }

    return workflows;
  }

  private isWorkflowSequence(events: UserBehaviorEvent[]): boolean {
    // Define common workflow patterns
    const commonPatterns = [
      ['dashboard', 'transactions', 'reports'],
      ['transactions', 'new', 'save'],
      ['reports', 'export', 'download'],
      ['settings', 'users', 'permissions']
    ];

    const sequence = events.map(e => e.target);
    
    return commonPatterns.some(pattern => 
      pattern.every((step, index) => 
        sequence[index] && sequence[index].includes(step)
      )
    );
  }

  private generateWorkflowId(events: UserBehaviorEvent[]): string {
    return events.map(e => e.target).join('-').replace(/[^a-zA-Z0-9-]/g, '');
  }

  private analyzeTimePatterns(): void {
    const eventsByHour = new Map<number, UserBehaviorEvent[]>();
    
    this.behaviorEvents.forEach(event => {
      const hour = event.timestamp.getHours();
      const events = eventsByHour.get(hour) || [];
      events.push(event);
      eventsByHour.set(hour, events);
    });

    eventsByHour.forEach((events, hour) => {
      if (events.length >= 10) { // Threshold for time pattern
        const pattern: UserPattern = {
          id: `time-pattern-${hour}`,
          type: 'time',
          name: `Active at ${hour}:00`,
          description: `User is most active around ${hour}:00 with ${events.length} activities`,
          confidence: Math.min(events.length / 30, 1),
          frequency: events.length,
          lastSeen: new Date(),
          data: { hour, activityCount: events.length },
          recommendations: this.generateTimeRecommendations(hour, events.length)
        };

        this.patterns.set(pattern.id, pattern);
      }
    });
  }

  private analyzeEfficiencyPatterns(): void {
    // Analyze task completion times, error rates, and optimization opportunities
    const taskEvents = this.behaviorEvents.filter(e => e.type === 'form_submit');
    const taskDurations = new Map<string, number[]>();
    const errorRates = new Map<string, number>();

    taskEvents.forEach(event => {
      const task = event.target;
      const duration = event.metadata.duration || 0;
      
      if (!taskDurations.has(task)) {
        taskDurations.set(task, []);
      }
      taskDurations.get(task)!.push(duration);

      // Track errors
      const errors = event.metadata.errors || [];
      if (!errorRates.has(task)) {
        errorRates.set(task, 0);
      }
      if (errors.length > 0) {
        errorRates.set(task, (errorRates.get(task) || 0) + 1);
      }
    });

    taskDurations.forEach((durations, task) => {
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const errorRate = (errorRates.get(task) || 0) / durations.length;

      if (avgDuration > 10000 || errorRate > 0.1) { // 10s or 10% error rate
        const pattern: UserPattern = {
          id: `efficiency-${task}`,
          type: 'efficiency',
          name: `Inefficient ${task} Task`,
          description: `${task} takes ${Math.round(avgDuration / 1000)}s on average with ${Math.round(errorRate * 100)}% error rate`,
          confidence: Math.max(avgDuration / 30000, errorRate * 5),
          frequency: durations.length,
          lastSeen: new Date(),
          data: { task, avgDuration, errorRate },
          recommendations: this.generateEfficiencyRecommendations(task, avgDuration, errorRate)
        };

        this.patterns.set(pattern.id, pattern);
      }
    });
  }

  private analyzePreferencePatterns(): void {
    // Analyze user preferences for UI elements, features, etc.
    const featureUsage = new Map<string, number>();
    const uiPreferences = new Map<string, any>();

    this.behaviorEvents.forEach(event => {
      if (event.type === 'click') {
        featureUsage.set(event.target, (featureUsage.get(event.target) || 0) + 1);
      }
    });

    featureUsage.forEach((usage, feature) => {
      if (usage >= 5) {
        const pattern: UserPattern = {
          id: `preference-${feature}`,
          type: 'preference',
          name: `Prefers ${feature}`,
          description: `User frequently uses ${feature} (${usage} times)`,
          confidence: Math.min(usage / 20, 1),
          frequency: usage,
          lastSeen: new Date(),
          data: { feature, usage },
          recommendations: this.generatePreferenceRecommendations(feature, usage)
        };

        this.patterns.set(pattern.id, pattern);
      }
    });
  }

  // Recommendation generation
  private generateNavigationRecommendations(page: string, frequency: number, avgDuration: number): PatternRecommendation[] {
    const recommendations: PatternRecommendation[] = [];

    // Suggest keyboard shortcut for frequently accessed page
    if (frequency >= 10) {
      recommendations.push({
        type: 'shortcut',
        title: `Add Keyboard Shortcut for ${page}`,
        description: `Create a keyboard shortcut to quickly access ${page}`,
        action: `create-shortcut-${page}`,
        priority: 'high',
        impact: 0.7,
        implementation: () => this.createKeyboardShortcut(page)
      });
    }

    // Suggest adding to favorites
    if (frequency >= 5) {
      recommendations.push({
        type: 'feature_suggestion',
        title: `Add ${page} to Favorites`,
        description: `Quick access to frequently used ${page}`,
        action: `add-favorite-${page}`,
        priority: 'medium',
        impact: 0.5,
        implementation: () => this.addToFavorites(page)
      });
    }

    // Suggest dashboard widget if user spends time on analytics pages
    if (avgDuration > 30000 && page.includes('reports')) {
      recommendations.push({
        type: 'ui_adjustment',
        title: `Add ${page} Widget to Dashboard`,
        description: `Bring key metrics from ${page} to your dashboard`,
        action: `add-dashboard-widget-${page}`,
        priority: 'medium',
        impact: 0.6,
        implementation: () => this.addDashboardWidget(page)
      });
    }

    return recommendations;
  }

  private generateWorkflowRecommendations(workflow: WorkflowPattern): PatternRecommendation[] {
    const recommendations: PatternRecommendation[] = [];

    // Suggest workflow automation
    if (workflow.frequency >= 5) {
      recommendations.push({
        type: 'workflow_optimization',
        title: `Automate ${workflow.name}`,
        description: `Create a one-click automation for this common workflow`,
        action: `automate-workflow-${workflow.id}`,
        priority: 'high',
        impact: 0.8,
        implementation: () => this.automateWorkflow(workflow.id)
      });
    }

    // Suggest workflow shortcut
    if (workflow.averageDuration > 10000) {
      recommendations.push({
        type: 'shortcut',
        title: `Create Workflow Shortcut for ${workflow.name}`,
        description: `Reduce time spent on this workflow with a custom shortcut`,
        action: `workflow-shortcut-${workflow.id}`,
        priority: 'medium',
        impact: 0.6,
        implementation: () => this.createWorkflowShortcut(workflow.id)
      });
    }

    return recommendations;
  }

  private generateTimeRecommendations(hour: number, activityCount: number): PatternRecommendation[] {
    const recommendations: PatternRecommendation[] = [];

    // Suggest scheduling important tasks during peak hours
    if (activityCount >= 20) {
      recommendations.push({
        type: 'feature_suggestion',
        title: `Schedule Important Tasks at ${hour}:00`,
        description: `You're most productive around ${hour}:00, consider scheduling important tasks then`,
        action: `schedule-peak-hours-${hour}`,
        priority: 'medium',
        impact: 0.5,
        implementation: () => this.schedulePeakHours(hour)
      });
    }

    return recommendations;
  }

  private generateEfficiencyRecommendations(task: string, avgDuration: number, errorRate: number): PatternRecommendation[] {
    const recommendations: PatternRecommendation[] = [];

    // Suggest form optimization if it takes too long
    if (avgDuration > 10000) {
      recommendations.push({
        type: 'ui_adjustment',
        title: `Optimize ${task} Form`,
        description: `This form takes too long to complete, consider simplifying it`,
        action: `optimize-form-${task}`,
        priority: 'high',
        impact: 0.7,
        implementation: () => this.optimizeForm(task)
      });
    }

    // Suggest error reduction if error rate is high
    if (errorRate > 0.1) {
      recommendations.push({
        type: 'ui_adjustment',
        title: `Reduce Errors in ${task}`,
        description: `High error rate detected, add validation and guidance`,
        action: `reduce-errors-${task}`,
        priority: 'high',
        impact: 0.8,
        implementation: () => this.reduceErrors(task)
      });
    }

    return recommendations;
  }

  private generatePreferenceRecommendations(feature: string, usage: number): PatternRecommendation[] {
    const recommendations: PatternRecommendation[] = [];

    // Suggest customizing UI based on preferences
    if (usage >= 10) {
      recommendations.push({
        type: 'ui_adjustment',
        title: `Customize ${feature} Experience`,
        description: `Enhance ${feature} based on your frequent usage`,
        action: `customize-feature-${feature}`,
        priority: 'medium',
        impact: 0.4,
        implementation: () => this.customizeFeature(feature)
      });
    }

    return recommendations;
  }

  // Recommendation implementations
  private createKeyboardShortcut(page: string): void {
    // Implementation would create keyboard shortcut
    console.log(`Creating keyboard shortcut for ${page}`);
  }

  private addToFavorites(page: string): void {
    // Implementation would add to favorites
    console.log(`Adding ${page} to favorites`);
  }

  private addDashboardWidget(page: string): void {
    // Implementation would add dashboard widget
    console.log(`Adding dashboard widget for ${page}`);
  }

  private automateWorkflow(workflowId: string): void {
    // Implementation would automate workflow
    console.log(`Automating workflow ${workflowId}`);
  }

  private createWorkflowShortcut(workflowId: string): void {
    // Implementation would create workflow shortcut
    console.log(`Creating workflow shortcut for ${workflowId}`);
  }

  private schedulePeakHours(hour: number): void {
    // Implementation would schedule tasks
    console.log(`Scheduling tasks for peak hour ${hour}:00`);
  }

  private optimizeForm(task: string): void {
    // Implementation would optimize form
    console.log(`Optimizing form ${task}`);
  }

  private reduceErrors(task: string): void {
    // Implementation would reduce errors
    console.log(`Reducing errors in ${task}`);
  }

  private customizeFeature(feature: string): void {
    // Implementation would customize feature
    console.log(`Customizing feature ${feature}`);
  }

  private updateRecommendations(): void {
    // Update existing recommendations based on new patterns
    // This would involve re-evaluating confidence scores and priorities
  }

  private loadPersistedPatterns(): void {
    // Load patterns from localStorage or API
    try {
      const stored = localStorage.getItem('ai-patterns');
      if (stored) {
        const patterns = JSON.parse(stored);
        patterns.forEach((pattern: UserPattern) => {
          this.patterns.set(pattern.id, pattern);
        });
      }
    } catch (error) {
      console.warn('Failed to load persisted patterns:', error);
    }
  }

  // Public API methods
  getPatterns(): UserPattern[] {
    return Array.from(this.patterns.values());
  }

  getPatternsByType(type: UserPattern['type']): UserPattern[] {
    return this.getPatterns().filter(pattern => pattern.type === type);
  }

  getRecommendations(): PatternRecommendation[] {
    return this.getPatterns().flatMap(pattern => pattern.recommendations);
  }

  getRecommendationsByPriority(priority: PatternRecommendation['priority']): PatternRecommendation[] {
    return this.getRecommendations().filter(rec => rec.priority === priority);
  }

  executeRecommendation(recommendationId: string): void {
    const recommendations = this.getRecommendations();
    const recommendation = recommendations.find(rec => rec.action === recommendationId);
    
    if (recommendation) {
      recommendation.implementation();
    }
  }

  stopLearning(): void {
    this.isLearning = false;
    if (this.learningInterval) {
      clearInterval(this.learningInterval);
      this.learningInterval = null;
    }
  }

  startLearning(): void {
    if (!this.isLearning) {
      this.isLearning = true;
      this.startContinuousLearning();
    }
  }

  exportPatterns(): string {
    return JSON.stringify({
      patterns: Array.from(this.patterns.values()),
      workflows: Array.from(this.workflows.values()),
      events: this.behaviorEvents.slice(-100) // Export recent events
    }, null, 2);
  }

  importPatterns(data: string): void {
    try {
      const imported = JSON.parse(data);
      
      if (imported.patterns) {
        imported.patterns.forEach((pattern: UserPattern) => {
          this.patterns.set(pattern.id, pattern);
        });
      }
      
      if (imported.workflows) {
        imported.workflows.forEach((workflow: WorkflowPattern) => {
          this.workflows.set(workflow.id, workflow);
        });
      }
    } catch (error) {
      console.error('Failed to import patterns:', error);
    }
  }
}

// Pattern Recognition Model (simplified ML model)
class PatternRecognitionModel {
  private weights: Map<string, number> = new Map();
  
  constructor() {
    this.initializeWeights();
  }

  private initializeWeights(): void {
    // Initialize weights for different pattern types
    this.weights.set('navigation', 0.8);
    this.weights.set('workflow', 0.9);
    this.weights.set('time', 0.6);
    this.weights.set('efficiency', 0.7);
    this.weights.set('preference', 0.5);
  }

  calculateConfidence(pattern: Partial<UserPattern>): number {
    // Simplified confidence calculation
    let confidence = 0.5; // Base confidence
    
    // Adjust based on frequency
    if (pattern.frequency) {
      confidence += Math.min(pattern.frequency / 20, 0.5);
    }
    
    // Adjust based on recency
    if (pattern.lastSeen) {
      const hoursSince = (Date.now() - pattern.lastSeen.getTime()) / (1000 * 60 * 60);
      confidence += Math.max(0, 1 - hoursSince / 24) * 0.3;
    }
    
    // Adjust based on pattern type weight
    if (pattern.type) {
      confidence *= this.weights.get(pattern.type) || 0.5;
    }
    
    return Math.min(confidence, 1);
  }
}

// React hook
export function useAIPatternRecognition() {
  const engine = AIPatternRecognitionEngine.getInstance();
  const [patterns, setPatterns] = React.useState(engine.getPatterns());
  const [recommendations, setRecommendations] = React.useState(engine.getRecommendations());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setPatterns(engine.getPatterns());
      setRecommendations(engine.getRecommendations());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    engine,
    patterns,
    recommendations,
    getPatternsByType: engine.getPatternsByType.bind(engine),
    getRecommendationsByPriority: engine.getRecommendationsByPriority.bind(engine),
    executeRecommendation: engine.executeRecommendation.bind(engine),
    recordEvent: engine.recordBehaviorEvent.bind(engine)
  };
}

export default AIPatternRecognitionEngine;
