/**
 * Threat-Adaptive UI System
 * Real-time threat detection, adaptive security levels, dynamic UI adjustments, incident response
 */

export interface ThreatAdaptiveUIConfig {
  // Threat detection
  threatDetection: {
    enabled: boolean;
    scanInterval: number;
    sensitivity: 'low' | 'medium' | 'high' | 'maximum';
    threatTypes: ThreatType[];
    behavioralAnalysis: boolean;
    anomalyDetection: boolean;
    machineLearning: boolean;
    realTimeMonitoring: boolean;
  };

  // Adaptive security levels
  securityLevels: {
    levels: SecurityLevel[];
    autoEscalation: boolean;
    escalationTriggers: EscalationTrigger[];
    deescalationConditions: DeescalationCondition[];
    userNotification: boolean;
    adminNotification: boolean;
  };

  // Dynamic UI adjustments
  uiAdjustments: {
    enabled: boolean;
    lockdownMode: boolean;
    restrictedFeatures: string[];
    hiddenElements: string[];
    disabledInteractions: string[];
    visualIndicators: boolean;
    securityBadges: boolean;
    warningMessages: boolean;
  };

  // Incident response
  incidentResponse: {
    enabled: boolean;
    automatedActions: boolean;
    manualOverride: boolean;
    responseActions: ResponseAction[];
    escalationPaths: EscalationPath[];
    notificationChannels: NotificationChannel[];
    reportingEnabled: boolean;
  };

  // User protection
  userProtection: {
    enabled: boolean;
    dataEncryption: boolean;
    sessionProtection: boolean;
    inputValidation: boolean;
    outputSanitization: boolean;
    csrfProtection: boolean;
    xssProtection: boolean;
  };
}

export interface Threat {
  id: string;
  type: ThreatType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  timestamp: Date;
  source: string;
  target: string;
  description: string;
  indicators: ThreatIndicator[];
  context: ThreatContext;
  status: 'detected' | 'investigating' | 'mitigating' | 'resolved' | 'false_positive';
  mitigationActions: string[];
  impact: ThreatImpact;
  falsePositive: boolean;
}

export type ThreatType = 
  | 'sql_injection'
  | 'xss_attack'
  | 'csrf_attack'
  | 'brute_force'
  | 'ddos_attack'
  | 'malware'
  | 'phishing'
  | 'data_breach'
  | 'privilege_escalation'
  | 'session_hijacking'
  | 'man_in_middle'
  | 'replay_attack'
  | 'dos_attack'
  | 'port_scan'
  | 'unauthorized_access'
  | 'anomalous_behavior'
  | 'suspicious_network'
  | 'credential_stuffing'
  | 'zero_day_exploit';

export interface ThreatIndicator {
  type: 'signature' | 'behavioral' | 'statistical' | 'heuristic' | 'ml_based';
  value: string;
  confidence: number;
  description: string;
  source: string;
}

export interface ThreatContext {
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  referer: string;
  requestMethod: string;
  requestPath: string;
  requestHeaders: Record<string, string>;
  requestBody?: string;
  timestamp: Date;
  geolocation?: {
    country: string;
    region: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  deviceInfo: {
    platform: string;
    browser: string;
    version: string;
    mobile: boolean;
    tablet: boolean;
    desktop: boolean;
  };
}

export interface ThreatImpact {
  confidentiality: 'none' | 'low' | 'medium' | 'high' | 'critical';
  integrity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  availability: 'none' | 'low' | 'medium' | 'high' | 'critical';
  affectedUsers: number;
  affectedSystems: string[];
  dataExposed: boolean;
  serviceDisrupted: boolean;
}

export interface SecurityLevel {
  id: string;
  name: string;
  level: number; // 1-10
  description: string;
  color: string;
  icon: string;
  restrictions: SecurityRestriction[];
  requirements: SecurityRequirement[];
  duration: number; // milliseconds
  autoDeescalate: boolean;
}

export interface SecurityRestriction {
  type: 'feature' | 'data' | 'action' | 'navigation' | 'communication';
  target: string;
  action: 'disable' | 'hide' | 'restrict' | 'require_auth' | 'log';
  parameters?: Record<string, any>;
}

export interface SecurityRequirement {
  type: 'authentication' | 'authorization' | 'verification' | 'confirmation' | 'monitoring';
  description: string;
  required: boolean;
  timeout?: number;
}

export interface EscalationTrigger {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  timeWindow: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  targetLevel: number;
  autoEscalate: boolean;
}

export interface DeescalationCondition {
  id: string;
  name: string;
  condition: string;
  duration: number;
  targetLevel: number;
  autoDeescalate: boolean;
}

export interface ResponseAction {
  id: string;
  name: string;
  type: 'block' | 'redirect' | 'terminate' | 'notify' | 'log' | 'quarantine' | 'backup' | 'restore';
  target: string;
  parameters: Record<string, any>;
  automated: boolean;
  requiresApproval: boolean;
  priority: number;
}

export interface EscalationPath {
  id: string;
  name: string;
  triggers: string[];
  actions: string[];
  conditions: Record<string, any>;
  timeout: number;
  escalationLevels: EscalationLevel[];
}

export interface EscalationLevel {
  level: number;
  recipients: string[];
  methods: ('email' | 'sms' | 'push' | 'webhook')[];
  delay: number;
  message: string;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'webhook' | 'slack' | 'teams';
  enabled: boolean;
  config: Record<string, any>;
  filters: NotificationFilter[];
}

export interface NotificationFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains' | 'regex';
  value: any;
}

export interface SecurityMetrics {
  timestamp: Date;
  currentLevel: number;
  activeThreats: number;
  mitigatedThreats: number;
  falsePositives: number;
  responseTime: number;
  userImpact: number;
  systemPerformance: number;
  securityScore: number;
  threatTrends: Array<{
    type: ThreatType;
    count: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
  uiAdjustments: Array<{
    type: string;
    target: string;
    action: string;
    timestamp: Date;
  }>;
}

export class ThreatAdaptiveUIEngine {
  private static instance: ThreatAdaptiveUIEngine;
  private config: ThreatAdaptiveUIConfig;
  private threatDetector: ThreatDetectionEngine;
  private securityLevelManager: SecurityLevelManager;
  private uiAdjustmentManager: UIAdjustmentManager;
  private incidentResponseManager: IncidentResponseManager;
  private userProtectionManager: UserProtectionManager;
  private currentSecurityLevel: SecurityLevel;
  private activeThreats: Map<string, Threat> = new Map();
  private securityHistory: SecurityEvent[] = [];
  private uiAdjustments: UIAdjustment[] = [];
  private metrics: SecurityMetrics;
  private isActive: boolean = false;
  private monitoringInterval: number | null = null;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.threatDetector = new ThreatDetectionEngine(this.config.threatDetection);
    this.securityLevelManager = new SecurityLevelManager(this.config.securityLevels);
    this.uiAdjustmentManager = new UIAdjustmentManager(this.config.uiAdjustments);
    this.incidentResponseManager = new IncidentResponseManager(this.config.incidentResponse);
    this.userProtectionManager = new UserProtectionManager(this.config.userProtection);
    this.currentSecurityLevel = this.getDefaultSecurityLevel();
    this.metrics = this.initializeMetrics();
    this.initializeThreatAdaptiveUI();
  }

  static getInstance(): ThreatAdaptiveUIEngine {
    if (!ThreatAdaptiveUIEngine.instance) {
      ThreatAdaptiveUIEngine.instance = new ThreatAdaptiveUIEngine();
    }
    return ThreatAdaptiveUIEngine.instance;
  }

  private getDefaultConfig(): ThreatAdaptiveUIConfig {
    return {
      threatDetection: {
        enabled: true,
        scanInterval: 1000,
        sensitivity: 'medium',
        threatTypes: [
          'sql_injection',
          'xss_attack',
          'csrf_attack',
          'brute_force',
          'ddos_attack',
          'malware',
          'phishing',
          'data_breach',
          'privilege_escalation',
          'session_hijacking',
          'man_in_middle',
          'replay_attack',
          'dos_attack',
          'port_scan',
          'unauthorized_access',
          'anomalous_behavior',
          'suspicious_network',
          'credential_stuffing',
          'zero_day_exploit'
        ],
        behavioralAnalysis: true,
        anomalyDetection: true,
        machineLearning: true,
        realTimeMonitoring: true
      },
      securityLevels: {
        levels: [],
        autoEscalation: true,
        escalationTriggers: [],
        deescalationConditions: [],
        userNotification: true,
        adminNotification: true
      },
      uiAdjustments: {
        enabled: true,
        lockdownMode: false,
        restrictedFeatures: [],
        hiddenElements: [],
        disabledInteractions: [],
        visualIndicators: true,
        securityBadges: true,
        warningMessages: true
      },
      incidentResponse: {
        enabled: true,
        automatedActions: true,
        manualOverride: true,
        responseActions: [],
        escalationPaths: [],
        notificationChannels: [],
        reportingEnabled: true
      },
      userProtection: {
        enabled: true,
        dataEncryption: true,
        sessionProtection: true,
        inputValidation: true,
        outputSanitization: true,
        csrfProtection: true,
        xssProtection: true
      }
    };
  }

  private getDefaultSecurityLevel(): SecurityLevel {
    return {
      id: 'level-1',
      name: 'Normal',
      level: 1,
      description: 'Normal security level with standard protections',
      color: '#28a745',
      icon: 'shield-check',
      restrictions: [],
      requirements: [],
      duration: 0,
      autoDeescalate: false
    };
  }

  private initializeMetrics(): SecurityMetrics {
    return {
      timestamp: new Date(),
      currentLevel: 1,
      activeThreats: 0,
      mitigatedThreats: 0,
      falsePositives: 0,
      responseTime: 0,
      userImpact: 0,
      systemPerformance: 100,
      securityScore: 100,
      threatTrends: [],
      uiAdjustments: []
    };
  }

  private initializeThreatAdaptiveUI(): void {
    if (typeof window === 'undefined') return;

    // Initialize security levels
    this.initializeSecurityLevels();
    
    // Initialize escalation triggers
    this.initializeEscalationTriggers();
    
    // Initialize response actions
    this.initializeResponseActions();
    
    // Initialize notification channels
    this.initializeNotificationChannels();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Start monitoring
    this.startMonitoring();
    
    // Load existing data
    this.loadExistingData();
  }

  private initializeSecurityLevels(): void {
    const levels: SecurityLevel[] = [
      {
        id: 'level-1',
        name: 'Normal',
        level: 1,
        description: 'Normal security level with standard protections',
        color: '#28a745',
        icon: 'shield-check',
        restrictions: [],
        requirements: [],
        duration: 0,
        autoDeescalate: false
      },
      {
        id: 'level-2',
        name: 'Elevated',
        level: 2,
        description: 'Elevated security with additional monitoring',
        color: '#ffc107',
        icon: 'shield-exclamation',
        restrictions: [
          {
            type: 'feature',
            target: 'data-export',
            action: 'require_auth'
          },
          {
            type: 'action',
            target: 'bulk-operations',
            action: 'require_auth'
          }
        ],
        requirements: [
          {
            type: 'verification',
            description: 'Additional verification required for sensitive operations',
            required: true
          }
        ],
        duration: 30 * 60 * 1000, // 30 minutes
        autoDeescalate: true
      },
      {
        id: 'level-3',
        name: 'High',
        level: 3,
        description: 'High security with restricted access',
        color: '#fd7e14',
        icon: 'shield-alt',
        restrictions: [
          {
            type: 'feature',
            target: 'data-export',
            action: 'disable'
          },
          {
            type: 'feature',
            target: 'user-management',
            action: 'restrict'
          },
          {
            type: 'action',
            target: 'bulk-operations',
            action: 'disable'
          },
          {
            type: 'navigation',
            target: '/admin/*',
            action: 'require_auth'
          }
        ],
        requirements: [
          {
            type: 'authentication',
            description: 'Re-authentication required',
            required: true,
            timeout: 5 * 60 * 1000 // 5 minutes
          },
          {
            type: 'verification',
            description: 'Multi-factor verification required',
            required: true
          }
        ],
        duration: 60 * 60 * 1000, // 1 hour
        autoDeescalate: true
      },
      {
        id: 'level-4',
        name: 'Critical',
        level: 4,
        description: 'Critical security with lockdown mode',
        color: '#dc3545',
        icon: 'shield-virus',
        restrictions: [
          {
            type: 'feature',
            target: '*',
            action: 'restrict'
          },
          {
            type: 'data',
            target: 'sensitive-data',
            action: 'disable'
          },
          {
            type: 'action',
            target: '*',
            action: 'log'
          },
          {
            type: 'communication',
            target: 'external-apis',
            action: 'disable'
          }
        ],
        requirements: [
          {
            type: 'authentication',
            description: 'Immediate re-authentication required',
            required: true,
            timeout: 60 * 1000 // 1 minute
          },
          {
            type: 'authorization',
            description: 'Admin authorization required',
            required: true
          },
          {
            type: 'confirmation',
            description: 'Explicit confirmation required for all actions',
            required: true
          }
        ],
        duration: 2 * 60 * 60 * 1000, // 2 hours
        autoDeescalate: false
      },
      {
        id: 'level-5',
        name: 'Lockdown',
        level: 5,
        description: 'Full lockdown mode - read-only access',
        color: '#6f42c1',
        icon: 'shield-x',
        restrictions: [
          {
            type: 'feature',
            target: '*',
            action: 'disable'
          },
          {
            type: 'data',
            target: '*',
            action: 'disable'
          },
          {
            type: 'action',
            target: '*',
            action: 'disable'
          },
          {
            type: 'navigation',
            target: '*',
            action: 'restrict'
          }
        ],
        requirements: [
          {
            type: 'authentication',
            description: 'Emergency authentication required',
            required: true,
            timeout: 30 * 1000 // 30 seconds
          },
          {
            type: 'authorization',
            description: 'Security team authorization required',
            required: true
          }
        ],
        duration: 0, // Manual deescalation only
        autoDeescalate: false
      }
    ];

    this.config.securityLevels.levels = levels;
  }

  private initializeEscalationTriggers(): void {
    const triggers: EscalationTrigger[] = [
      {
        id: 'multiple-threats',
        name: 'Multiple Active Threats',
        condition: 'activeThreats > 3',
        threshold: 3,
        timeWindow: 5 * 60 * 1000, // 5 minutes
        severity: 'medium',
        targetLevel: 2,
        autoEscalate: true
      },
      {
        id: 'critical-threat',
        name: 'Critical Threat Detected',
        condition: 'threatSeverity === "critical"',
        threshold: 1,
        timeWindow: 0,
        severity: 'critical',
        targetLevel: 4,
        autoEscalate: true
      },
      {
        id: 'high-threat-rate',
        name: 'High Threat Detection Rate',
        condition: 'threatsPerMinute > 10',
        threshold: 10,
        timeWindow: 60 * 1000, // 1 minute
        severity: 'high',
        targetLevel: 3,
        autoEscalate: true
      },
      {
        id: 'data-breach',
        name: 'Potential Data Breach',
        condition: 'threatType === "data_breach"',
        threshold: 1,
        timeWindow: 0,
        severity: 'critical',
        targetLevel: 5,
        autoEscalate: true
      },
      {
        id: 'system-compromise',
        name: 'System Compromise Detected',
        condition: 'threatType === "privilege_escalation" || threatType === "zero_day_exploit"',
        threshold: 1,
        timeWindow: 0,
        severity: 'critical',
        targetLevel: 5,
        autoEscalate: true
      }
    ];

    this.config.securityLevels.escalationTriggers = triggers;
  }

  private initializeResponseActions(): void {
    const actions: ResponseAction[] = [
      {
        id: 'block-ip',
        name: 'Block IP Address',
        type: 'block',
        target: 'ip',
        parameters: { duration: 3600000 }, // 1 hour
        automated: true,
        requiresApproval: false,
        priority: 1
      },
      {
        id: 'terminate-session',
        name: 'Terminate User Session',
        type: 'terminate',
        target: 'session',
        parameters: {},
        automated: true,
        requiresApproval: false,
        priority: 2
      },
      {
        id: 'redirect-user',
        name: 'Redirect to Security Page',
        type: 'redirect',
        target: 'user',
        parameters: { url: '/security-warning' },
        automated: true,
        requiresApproval: false,
        priority: 3
      },
      {
        id: 'notify-admin',
        name: 'Notify Security Team',
        type: 'notify',
        target: 'admin',
        parameters: { urgency: 'high' },
        automated: true,
        requiresApproval: false,
        priority: 4
      },
      {
        id: 'quarantine-data',
        name: 'Quarantine Affected Data',
        type: 'quarantine',
        target: 'data',
        parameters: { scope: 'affected' },
        automated: false,
        requiresApproval: true,
        priority: 5
      },
      {
        id: 'backup-system',
        name: 'Create System Backup',
        type: 'backup',
        target: 'system',
        parameters: { type: 'incremental' },
        automated: true,
        requiresApproval: false,
        priority: 6
      }
    ];

    this.config.incidentResponse.responseActions = actions;
  }

  private initializeNotificationChannels(): void {
    const channels: NotificationChannel[] = [
      {
        id: 'security-team-email',
        name: 'Security Team Email',
        type: 'email',
        enabled: true,
        config: {
          recipients: ['security@accubooks.com'],
          template: 'security-alert'
        },
        filters: [
          {
            field: 'severity',
            operator: 'eq',
            value: 'critical'
          }
        ]
      },
      {
        id: 'admin-webhook',
        name: 'Admin Webhook',
        type: 'webhook',
        enabled: true,
        config: {
          url: 'https://api.accubooks.com/webhooks/security',
          headers: {
            'Authorization': 'Bearer ${API_TOKEN}',
            'Content-Type': 'application/json'
          }
        },
        filters: [
          {
            field: 'severity',
            operator: 'ne',
            value: 'low'
          }
        ]
      },
      {
        id: 'system-logs',
        name: 'System Logs',
        type: 'webhook',
        enabled: true,
        config: {
          url: '/api/security/logs',
          internal: true
        },
        filters: []
      }
    ];

    this.config.incidentResponse.notificationChannels = channels;
  }

  private setupEventListeners(): void {
    // Monitor for security events
    window.addEventListener('error', this.handleSecurityEvent.bind(this));
    window.addEventListener('unhandledrejection', this.handleSecurityEvent.bind(this));
    
    // Monitor DOM changes for security
    const observer = new MutationObserver(this.handleDOMChange.bind(this));
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href', 'src', 'onclick']
    });
    
    // Monitor network requests
    this.interceptNetworkRequests();
  }

  private interceptNetworkRequests(): void {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        
        // Analyze request for threats
        await this.analyzeRequest(args[0] as Request, response, duration);
        
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        // Analyze failed request
        await this.analyzeRequest(args[0] as Request, null, duration);
        
        throw error;
      }
    };
    
    // Intercept XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(...args) {
      const startTime = Date.now();
      
      this.addEventListener('loadend', () => {
        const duration = Date.now() - startTime;
        // Analyze XHR request
        // This would need more implementation
      });
      
      return originalXHROpen.apply(this, args);
    };
  }

  private async analyzeRequest(request: Request, response: Response | null, duration: number): Promise<void> {
    const context: ThreatContext = {
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent,
      referer: document.referrer,
      requestMethod: request.method,
      requestPath: request.url,
      requestHeaders: Object.fromEntries(request.headers.entries()),
      timestamp: new Date(),
      deviceInfo: this.getDeviceInfo()
    };

    // Check for common attack patterns
    const url = request.url.toLowerCase();
    const body = await this.getRequestBody(request);
    
    // SQL Injection detection
    if (this.detectSQLInjection(url, body)) {
      this.createThreat('sql_injection', 'medium', context, {
        url: request.url,
        method: request.method,
        body: body?.substring(0, 100)
      });
    }
    
    // XSS detection
    if (this.detectXSS(url, body)) {
      this.createThreat('xss_attack', 'high', context, {
        url: request.url,
        method: request.method,
        body: body?.substring(0, 100)
      });
    }
    
    // CSRF detection
    if (this.detectCSRF(request)) {
      this.createThreat('csrf_attack', 'medium', context, {
        url: request.url,
        method: request.method,
        referer: document.referrer
      });
    }
    
    // Brute force detection
    if (duration > 10000) { // Slow response might indicate brute force
      this.createThreat('brute_force', 'low', context, {
        url: request.url,
        duration: duration
      });
    }
  }

  private async getRequestBody(request: Request): Promise<string | undefined> {
    try {
      const clone = request.clone();
      return await clone.text();
    } catch (error) {
      return undefined;
    }
  }

  private detectSQLInjection(url: string, body?: string): boolean {
    const sqlPatterns = [
      /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
      /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
      /((\%27)|(\'))union/ix,
      /exec(\s|\+)+(s|x)p\w+/ix,
      /UNION(\s|\+)+SELECT/i,
      /INSERT(\s|\+)+INTO/i,
      /DELETE(\s|\+)+FROM/i,
      /UPDATE(\s|\+)+SET/i
    ];

    const combinedString = (url + ' ' + (body || '')).toLowerCase();
    
    return sqlPatterns.some(pattern => pattern.test(combinedString));
  }

  private detectXSS(url: string, body?: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]*src[^>]*javascript:/gi,
      /<\s*script/gi,
      /<\s*object/gi,
      /<\s*embed/gi,
      /<\s*link/gi
    ];

    const combinedString = (url + ' ' + (body || '')).toLowerCase();
    
    return xssPatterns.some(pattern => pattern.test(combinedString));
  }

  private detectCSRF(request: Request): boolean {
    // Check for missing CSRF token in state-changing requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      const hasCSRFToken = request.headers.get('X-CSRF-Token') || 
                          request.headers.get('X-XSRF-Token') ||
                          request.headers.get('CSRF-Token');
      
      return !hasCSRFToken;
    }
    
    return false;
  }

  private handleSecurityEvent(event: Event): void {
    // Analyze security events
    console.log('Security event detected:', event);
  }

  private handleDOMChange(mutations: MutationRecord[]): void {
    // Analyze DOM changes for security threats
    mutations.forEach(mutation => {
      if (mutation.type === 'attributes') {
        const element = mutation.target as Element;
        
        // Check for suspicious attribute changes
        if (mutation.attributeName === 'href') {
          const href = element.getAttribute('href');
          if (href && this.isSuspiciousURL(href)) {
            this.createThreat('xss_attack', 'medium', this.getCurrentContext(), {
              element: element.tagName,
              href: href
            });
          }
        }
        
        if (mutation.attributeName === 'onclick') {
          const onclick = element.getAttribute('onclick');
          if (onclick && this.isSuspiciousScript(onclick)) {
            this.createThreat('xss_attack', 'high', this.getCurrentContext(), {
              element: element.tagName,
              onclick: onclick
            });
          }
        }
      }
      
      if (mutation.type === 'childList') {
        // Check for suspicious new elements
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            if (element.tagName === 'SCRIPT') {
              const src = element.getAttribute('src');
              if (src && this.isSuspiciousURL(src)) {
                this.createThreat('malware', 'high', this.getCurrentContext(), {
                  scriptSrc: src
                });
              }
            }
          }
        });
      }
    });
  }

  private isSuspiciousURL(url: string): boolean {
    const suspiciousPatterns = [
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      /file:/i,
      /ftp:/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(url));
  }

  private isSuspiciousScript(script: string): boolean {
    const suspiciousPatterns = [
      /eval\s*\(/i,
      /document\.write/i,
      /innerHTML\s*=/i,
      /outerHTML\s*=/i,
      /insertAdjacentHTML/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(script));
  }

  private getCurrentContext(): ThreatContext {
    return {
      ipAddress: 'unknown',
      userAgent: navigator.userAgent,
      referer: document.referrer,
      requestMethod: 'GET',
      requestPath: window.location.pathname,
      requestHeaders: {},
      timestamp: new Date(),
      deviceInfo: this.getDeviceInfo()
    };
  }

  private getDeviceInfo(): ThreatContext['deviceInfo'] {
    return {
      platform: navigator.platform,
      browser: this.getBrowserName(),
      version: this.getBrowserVersion(),
      mobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      tablet: /iPad|Android/i.test(navigator.userAgent) && window.innerWidth > 768,
      desktop: !/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    };
  }

  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
    if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
    if (userAgent.indexOf('Safari') > -1) return 'Safari';
    if (userAgent.indexOf('Edge') > -1) return 'Edge';
    return 'Unknown';
  }

  private getBrowserVersion(): string {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/);
    return match ? match[2] : 'Unknown';
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  private startMonitoring(): void {
    this.isActive = true;
    
    // Start periodic threat scanning
    this.monitoringInterval = window.setInterval(() => {
      this.performThreatScan();
    }, this.config.threatDetection.scanInterval);
  }

  private async performThreatScan(): Promise<void> {
    if (!this.isActive) return;

    try {
      // Scan for threats
      const threats = await this.threatDetector.scanForThreats();
      
      // Process detected threats
      threats.forEach(threat => {
        this.handleThreatDetected(threat);
      });
      
      // Check for escalation triggers
      this.checkEscalationTriggers();
      
      // Update metrics
      this.updateMetrics();
      
    } catch (error) {
      console.error('Threat scan failed:', error);
    }
  }

  private handleThreatDetected(threat: Threat): void {
    // Add to active threats
    this.activeThreats.set(threat.id, threat);
    
    // Create security event
    this.createSecurityEvent('threat_detected', threat.severity, threat.description, {
      threatId: threat.id,
      threatType: threat.type,
      confidence: threat.confidence
    });
    
    // Initiate incident response
    if (this.config.incidentResponse.enabled) {
      this.incidentResponseManager.handleThreat(threat);
    }
    
    // Adjust security level if needed
    this.evaluateSecurityLevel();
    
    // Apply UI adjustments
    if (this.config.uiAdjustments.enabled) {
      this.applyUIAdjustments(threat);
    }
  }

  private createThreat(type: ThreatType, severity: 'low' | 'medium' | 'high' | 'critical', context: ThreatContext, details: any): void {
    const threat: Threat = {
      id: this.generateThreatId(),
      type,
      severity,
      confidence: 0.8,
      timestamp: new Date(),
      source: context.ipAddress,
      target: context.requestPath,
      description: `${type} threat detected`,
      indicators: [
        {
          type: 'signature',
          value: type,
          confidence: 0.8,
          description: 'Signature-based detection',
          source: 'threat-adaptive-ui'
        }
      ],
      context,
      status: 'detected',
      mitigationActions: [],
      impact: {
        confidentiality: severity === 'critical' ? 'high' : 'medium',
        integrity: severity === 'critical' ? 'high' : 'medium',
        availability: 'none',
        affectedUsers: 0,
        affectedSystems: [],
        dataExposed: false,
        serviceDisrupted: false
      },
      falsePositive: false
    };

    this.handleThreatDetected(threat);
  }

  private generateThreatId(): string {
    return `threat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private createSecurityEvent(type: string, severity: string, description: string, details: Record<string, any>): void {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      type: type as any,
      severity: severity as any,
      description,
      details,
      ipAddress: 'unknown',
      userAgent: navigator.userAgent,
      resolved: false
    };

    this.securityHistory.push(event);
    
    // Keep only recent events
    if (this.securityHistory.length > 1000) {
      this.securityHistory = this.securityHistory.slice(-1000);
    }
  }

  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private checkEscalationTriggers(): void {
    this.config.securityLevels.escalationTriggers.forEach(trigger => {
      if (this.evaluateTriggerCondition(trigger)) {
        this.escalateSecurityLevel(trigger.targetLevel, trigger.name);
      }
    });
  }

  private evaluateTriggerCondition(trigger: EscalationTrigger): boolean {
    // Simple condition evaluation (would be more sophisticated in production)
    switch (trigger.id) {
      case 'multiple-threats':
        return this.activeThreats.size > trigger.threshold;
      case 'critical-threat':
        return Array.from(this.activeThreats.values()).some(t => t.severity === 'critical');
      case 'high-threat-rate':
        // Calculate threats per minute
        const oneMinuteAgo = Date.now() - trigger.timeWindow;
        const recentThreats = Array.from(this.activeThreats.values())
          .filter(t => t.timestamp.getTime() > oneMinuteAgo);
        return recentThreats.length > trigger.threshold;
      case 'data-breach':
        return Array.from(this.activeThreats.values()).some(t => t.type === 'data_breach');
      case 'system-compromise':
        return Array.from(this.activeThreats.values())
          .some(t => t.type === 'privilege_escalation' || t.type === 'zero_day_exploit');
      default:
        return false;
    }
  }

  private escalateSecurityLevel(targetLevel: number, reason: string): void {
    const newLevel = this.config.securityLevels.levels.find(l => l.level === targetLevel);
    if (newLevel && newLevel.level > this.currentSecurityLevel.level) {
      this.currentSecurityLevel = newLevel;
      
      // Apply security level restrictions
      this.applySecurityLevelRestrictions(newLevel);
      
      // Notify users and admins
      this.notifySecurityLevelChange(newLevel, reason);
      
      // Create security event
      this.createSecurityEvent('security_level_escalated', 'high', `Security level escalated to ${newLevel.name}`, {
        newLevel: newLevel.level,
        reason
      });
    }
  }

  private applySecurityLevelRestrictions(level: SecurityLevel): void {
    level.restrictions.forEach(restriction => {
      this.uiAdjustmentManager.applyRestriction(restriction);
    });
  }

  private notifySecurityLevelChange(level: SecurityLevel, reason: string): void {
    if (this.config.securityLevels.userNotification) {
      this.showSecurityNotification(level, reason);
    }
    
    if (this.config.securityLevels.adminNotification) {
      this.notifyAdmins(level, reason);
    }
  }

  private showSecurityNotification(level: SecurityLevel, reason: string): void {
    const notification = document.createElement('div');
    notification.className = 'security-level-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${level.color};
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      z-index: 10000;
      max-width: 400px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        <span style="font-size: 20px; margin-right: 10px;">⚠️</span>
        <strong>Security Level: ${level.name}</strong>
      </div>
      <div>${level.description}</div>
      <div style="margin-top: 10px; font-size: 12px;">Reason: ${reason}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 10000);
  }

  private notifyAdmins(level: SecurityLevel, reason: string): void {
    // Send notification to admins
    console.log(`Security level escalated to ${level.name}: ${reason}`);
  }

  private evaluateSecurityLevel(): void {
    // Evaluate if security level should be adjusted based on current threats
    const criticalThreats = Array.from(this.activeThreats.values()).filter(t => t.severity === 'critical');
    const highThreats = Array.from(this.activeThreats.values()).filter(t => t.severity === 'high');
    
    if (criticalThreats.length > 0) {
      this.escalateSecurityLevel(4, 'Critical threats detected');
    } else if (highThreats.length > 2) {
      this.escalateSecurityLevel(3, 'Multiple high-severity threats');
    } else if (this.activeThreats.size > 5) {
      this.escalateSecurityLevel(2, 'Multiple active threats');
    }
  }

  private applyUIAdjustments(threat: Threat): void {
    const adjustments = this.uiAdjustmentManager.generateAdjustments(threat);
    
    adjustments.forEach(adjustment => {
      this.uiAdjustmentManager.applyAdjustment(adjustment);
      this.uiAdjustments.push(adjustment);
    });
  }

  private updateMetrics(): void {
    this.metrics.timestamp = new Date();
    this.metrics.currentLevel = this.currentSecurityLevel.level;
    this.metrics.activeThreats = this.activeThreats.size;
    this.metrics.securityScore = this.calculateSecurityScore();
    this.metrics.uiAdjustments = this.uiAdjustments.slice(-10);
  }

  private calculateSecurityScore(): number {
    const baseScore = 100;
    const threatPenalty = this.activeThreats.size * 5;
    const severityPenalty = Array.from(this.activeThreats.values())
      .reduce((sum, threat) => {
        switch (threat.severity) {
          case 'critical': return sum + 20;
          case 'high': return sum + 10;
          case 'medium': return sum + 5;
          case 'low': return sum + 2;
          default: return sum;
        }
      }, 0);
    
    return Math.max(0, baseScore - threatPenalty - severityPenalty);
  }

  private loadExistingData(): void {
    // Load existing threats and security events
    try {
      const storedThreats = localStorage.getItem('active-threats');
      if (storedThreats) {
        const threats = JSON.parse(storedThreats);
        threats.forEach((threat: Threat) => {
          this.activeThreats.set(threat.id, threat);
        });
      }
    } catch (error) {
      console.warn('Failed to load existing threats:', error);
    }
  }

  // Public API methods
  public getCurrentSecurityLevel(): SecurityLevel {
    return this.currentSecurityLevel;
  }

  public getActiveThreats(): Threat[] {
    return Array.from(this.activeThreats.values());
  }

  public getSecurityMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  public getSecurityHistory(): SecurityEvent[] {
    return [...this.securityHistory];
  }

  public getUIAdjustments(): UIAdjustment[] {
    return [...this.uiAdjustments];
  }

  public manuallyEscalateSecurityLevel(level: number, reason: string): void {
    const targetLevel = this.config.securityLevels.levels.find(l => l.level === level);
    if (targetLevel) {
      this.escalateSecurityLevel(level, `Manual escalation: ${reason}`);
    }
  }

  public manuallyDeescalateSecurityLevel(reason: string): void {
    const lowerLevel = this.config.securityLevels.levels.find(l => 
      l.level < this.currentSecurityLevel.level
    );
    
    if (lowerLevel) {
      this.currentSecurityLevel = lowerLevel;
      this.notifySecurityLevelChange(lowerLevel, `Manual de-escalation: ${reason}`);
      this.createSecurityEvent('security_level_deescalated', 'medium', `Security level de-escalated to ${lowerLevel.name}`, {
        newLevel: lowerLevel.level,
        reason
      });
    }
  }

  public acknowledgeThreat(threatId: string): void {
    const threat = this.activeThreats.get(threatId);
    if (threat) {
      threat.status = 'investigating';
      this.createSecurityEvent('threat_acknowledged', 'medium', `Threat acknowledged: ${threatId}`, {
        threatId
      });
    }
  }

  public markThreatAsFalsePositive(threatId: string): void {
    const threat = this.activeThreats.get(threatId);
    if (threat) {
      threat.falsePositive = true;
      threat.status = 'false_positive';
      this.activeThreats.delete(threatId);
      this.metrics.falsePositives++;
      
      this.createSecurityEvent('false_positive', 'low', `Threat marked as false positive: ${threatId}`, {
        threatId
      });
    }
  }

  public resolveThreat(threatId: string, resolution: string): void {
    const threat = this.activeThreats.get(threatId);
    if (threat) {
      threat.status = 'resolved';
      threat.mitigationActions.push(resolution);
      this.activeThreats.delete(threatId);
      this.metrics.mitigatedThreats++;
      
      this.createSecurityEvent('threat_resolved', 'medium', `Threat resolved: ${threatId}`, {
        threatId,
        resolution
      });
      
      // Re-evaluate security level
      this.evaluateSecurityLevel();
    }
  }

  public updateConfig(newConfig: Partial<ThreatAdaptiveUIConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update sub-systems
    this.threatDetector.updateConfig(this.config.threatDetection);
    this.securityLevelManager.updateConfig(this.config.securityLevels);
    this.uiAdjustmentManager.updateConfig(this.config.uiAdjustments);
    this.incidentResponseManager.updateConfig(this.config.incidentResponse);
    this.userProtectionManager.updateConfig(this.config.userProtection);
  }

  public stopMonitoring(): void {
    this.isActive = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

// Supporting interfaces and classes
interface UIAdjustment {
  id: string;
  type: string;
  target: string;
  action: string;
  timestamp: Date;
  parameters?: Record<string, any>;
}

interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: string;
  severity: string;
  description: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

// Supporting classes (simplified implementations)
class ThreatDetectionEngine {
  constructor(private config: ThreatAdaptiveUIConfig['threatDetection']) {}

  async scanForThreats(): Promise<Threat[]> {
    // Simulate threat scanning
    return [];
  }

  updateConfig(config: ThreatAdaptiveUIConfig['threatDetection']): void {
    this.config = config;
  }
}

class SecurityLevelManager {
  constructor(private config: ThreatAdaptiveUIConfig['securityLevels']) {}

  updateConfig(config: ThreatAdaptiveUIConfig['securityLevels']): void {
    this.config = config;
  }
}

class UIAdjustmentManager {
  constructor(private config: ThreatAdaptiveUIConfig['uiAdjustments']) {}

  applyRestriction(restriction: SecurityRestriction): void {
    // Apply UI restriction
  }

  generateAdjustments(threat: Threat): UIAdjustment[] {
    // Generate UI adjustments based on threat
    return [];
  }

  applyAdjustment(adjustment: UIAdjustment): void {
    // Apply UI adjustment
  }

  updateConfig(config: ThreatAdaptiveUIConfig['uiAdjustments']): void {
    this.config = config;
  }
}

class IncidentResponseManager {
  constructor(private config: ThreatAdaptiveUIConfig['incidentResponse']) {}

  handleThreat(threat: Threat): void {
    // Handle threat incident response
  }

  updateConfig(config: ThreatAdaptiveUIConfig['incidentResponse']): void {
    this.config = config;
  }
}

class UserProtectionManager {
  constructor(private config: ThreatAdaptiveUIConfig['userProtection']) {}

  updateConfig(config: ThreatAdaptiveUIConfig['userProtection']): void {
    this.config = config;
  }
}

// React hook
export function useThreatAdaptiveUI() {
  const engine = ThreatAdaptiveUIEngine.getInstance();
  const [securityLevel, setSecurityLevel] = React.useState(engine.getCurrentSecurityLevel());
  const [metrics, setMetrics] = React.useState(engine.getSecurityMetrics());
  const [activeThreats, setActiveThreats] = React.useState(engine.getActiveThreats());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setSecurityLevel(engine.getCurrentSecurityLevel());
      setMetrics(engine.getSecurityMetrics());
      setActiveThreats(engine.getActiveThreats());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    engine,
    securityLevel,
    metrics,
    activeThreats,
    getCurrentSecurityLevel: engine.getCurrentSecurityLevel.bind(engine),
    getActiveThreats: engine.getActiveThreats.bind(engine),
    getSecurityMetrics: engine.getSecurityMetrics.bind(engine),
    getSecurityHistory: engine.getSecurityHistory.bind(engine),
    getUIAdjustments: engine.getUIAdjustments.bind(engine),
    manuallyEscalateSecurityLevel: engine.manuallyEscalateSecurityLevel.bind(engine),
    manuallyDeescalateSecurityLevel: engine.manuallyDeescalateSecurityLevel.bind(engine),
    acknowledgeThreat: engine.acknowledgeThreat.bind(engine),
    markThreatAsFalsePositive: engine.markThreatAsFalsePositive.bind(engine),
    resolveThreat: engine.resolveThreat.bind(engine),
    updateConfig: engine.updateConfig.bind(engine),
    stopMonitoring: engine.stopMonitoring.bind(engine)
  };
}

export default ThreatAdaptiveUIEngine;
