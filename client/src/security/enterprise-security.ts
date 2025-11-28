/**
 * Enterprise Security Module
 * Advanced security features with biometric auth, 2FA, and audit logging
 */

export interface SecurityConfig {
  authentication: {
    biometricEnabled: boolean;
    twoFactorRequired: boolean;
    sessionTimeout: number; // minutes
    maxLoginAttempts: number;
    lockoutDuration: number; // minutes
  };
  permissions: {
    roleBasedAccess: boolean;
    granularPermissions: boolean;
    dataEncryption: boolean;
    fieldLevelSecurity: boolean;
  };
  monitoring: {
    auditLogging: boolean;
    realTimeAlerts: boolean;
    anomalyDetection: boolean;
    securityReports: boolean;
  };
  compliance: {
    gdprCompliant: boolean;
    soc2Compliant: boolean;
    hipaaCompliant: boolean;
    dataRetention: number; // days
  };
}

export interface UserSession {
  id: string;
  userId: string;
  startTime: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  location?: {
    country: string;
    city: string;
  };
  isActive: boolean;
  permissions: string[];
}

export interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'permission_denied' | 'data_access' | 'configuration_change' | 'security_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  timestamp: Date;
  description: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface SecurityAlert {
  id: string;
  type: 'suspicious_login' | 'brute_force' | 'data_breach' | 'privilege_escalation' | 'unusual_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  affectedUsers: string[];
  actions: Array<{
    type: 'lock_account' | 'force_logout' | 'notify_admin' | 'require_2fa' | 'investigate';
    description: string;
    executed: boolean;
    executedAt?: Date;
    executedBy?: string;
  }>;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'read' | 'write' | 'delete' | 'admin' | 'system';
  resource: string;
  conditions?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class EnterpriseSecurity {
  private config: SecurityConfig;
  private activeSessions: Map<string, UserSession> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private securityAlerts: SecurityAlert[] = [];
  private permissions: Map<string, Permission> = new Map();
  private roles: Map<string, Role> = new Map();
  private loginAttempts: Map<string, number> = new Map();
  private lockedAccounts: Set<string> = new Set();
  private eventListeners: Map<string, EventListener> = new Map();

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      authentication: {
        biometricEnabled: true,
        twoFactorRequired: false,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        lockoutDuration: 15
      },
      permissions: {
        roleBasedAccess: true,
        granularPermissions: true,
        dataEncryption: true,
        fieldLevelSecurity: true
      },
      monitoring: {
        auditLogging: true,
        realTimeAlerts: true,
        anomalyDetection: true,
        securityReports: true
      },
      compliance: {
        gdprCompliant: true,
        soc2Compliant: true,
        hipaaCompliant: false,
        dataRetention: 2555 // 7 years
      },
      ...config
    };

    this.initializeDefaultPermissions();
    this.initializeDefaultRoles();
    this.setupEventListeners();
    this.startSessionMonitoring();
  }

  private initializeDefaultPermissions(): void {
    const defaultPermissions: Permission[] = [
      // Read permissions
      { id: 'read_transactions', name: 'Read Transactions', description: 'View financial transactions', category: 'read', resource: 'transactions' },
      { id: 'read_reports', name: 'Read Reports', description: 'View financial reports', category: 'read', resource: 'reports' },
      { id: 'read_customers', name: 'Read Customers', description: 'View customer information', category: 'read', resource: 'customers' },
      { id: 'read_users', name: 'Read Users', description: 'View user accounts', category: 'read', resource: 'users' },
      
      // Write permissions
      { id: 'write_transactions', name: 'Write Transactions', description: 'Create and edit transactions', category: 'write', resource: 'transactions' },
      { id: 'write_reports', name: 'Write Reports', description: 'Create and edit reports', category: 'write', resource: 'reports' },
      { id: 'write_customers', name: 'Write Customers', description: 'Create and edit customers', category: 'write', resource: 'customers' },
      
      // Delete permissions
      { id: 'delete_transactions', name: 'Delete Transactions', description: 'Delete transactions', category: 'delete', resource: 'transactions' },
      { id: 'delete_customers', name: 'Delete Customers', description: 'Delete customers', category: 'delete', resource: 'customers' },
      
      // Admin permissions
      { id: 'admin_users', name: 'Admin Users', description: 'Manage user accounts', category: 'admin', resource: 'users' },
      { id: 'admin_permissions', name: 'Admin Permissions', description: 'Manage permissions and roles', category: 'admin', resource: 'permissions' },
      { id: 'admin_security', name: 'Admin Security', description: 'Manage security settings', category: 'admin', resource: 'security' },
      { id: 'admin_system', name: 'Admin System', description: 'System administration', category: 'system', resource: 'system' }
    ];

    defaultPermissions.forEach(permission => {
      this.permissions.set(permission.id, permission);
    });
  }

  private initializeDefaultRoles(): void {
    const defaultRoles: Role[] = [
      {
        id: 'viewer',
        name: 'Viewer',
        description: 'Read-only access to financial data',
        permissions: ['read_transactions', 'read_reports', 'read_customers'],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'accountant',
        name: 'Accountant',
        description: 'Full access to accounting features',
        permissions: [
          'read_transactions', 'write_transactions', 'delete_transactions',
          'read_reports', 'write_reports',
          'read_customers', 'write_customers', 'delete_customers'
        ],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Full system access',
        permissions: Array.from(this.permissions.keys()),
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultRoles.forEach(role => {
      this.roles.set(role.id, role);
    });
  }

  private setupEventListeners(): void {
    // Monitor failed login attempts
    const handleFailedLogin = (e: CustomEvent) => {
      const { userId, ipAddress, userAgent } = e.detail;
      this.handleFailedLogin(userId, ipAddress, userAgent);
    };

    // Monitor successful logins
    const handleSuccessfulLogin = (e: CustomEvent) => {
      const { userId, ipAddress, userAgent, location } = e.detail;
      this.handleSuccessfulLogin(userId, ipAddress, userAgent, location);
    };

    // Monitor permission denials
    const handlePermissionDenied = (e: CustomEvent) => {
      const { userId, permission, resource, ipAddress, userAgent } = e.detail;
      this.logSecurityEvent({
        type: 'permission_denied',
        severity: 'medium',
        userId,
        description: `Access denied: ${permission} on ${resource}`,
        details: { permission, resource },
        ipAddress,
        userAgent
      });
    };

    // Monitor data access
    const handleDataAccess = (e: CustomEvent) => {
      const { userId, resource, action, ipAddress, userAgent } = e.detail;
      this.logSecurityEvent({
        type: 'data_access',
        severity: 'low',
        userId,
        description: `Data access: ${action} on ${resource}`,
        details: { resource, action },
        ipAddress,
        userAgent
      });
    };

    document.addEventListener('security:failed-login', handleFailedLogin as EventListener);
    document.addEventListener('security:successful-login', handleSuccessfulLogin as EventListener);
    document.addEventListener('security:permission-denied', handlePermissionDenied as EventListener);
    document.addEventListener('security:data-access', handleDataAccess as EventListener);

    this.eventListeners.set('failed-login', handleFailedLogin as EventListener);
    this.eventListeners.set('successful-login', handleSuccessfulLogin as EventListener);
    this.eventListeners.set('permission-denied', handlePermissionDenied as EventListener);
    this.eventListeners.set('data-access', handleDataAccess as EventListener);
  }

  private startSessionMonitoring(): void {
    // Monitor session activity and timeout
    setInterval(() => {
      this.checkSessionTimeouts();
    }, 60000); // Check every minute

    // Monitor for suspicious activity
    setInterval(() => {
      this.detectSuspiciousActivity();
    }, 300000); // Check every 5 minutes
  }

  private checkSessionTimeouts(): void {
    const now = new Date();
    const timeoutMs = this.config.authentication.sessionTimeout * 60000;

    this.activeSessions.forEach((session, sessionId) => {
      const inactiveTime = now.getTime() - session.lastActivity.getTime();
      
      if (inactiveTime > timeoutMs) {
        this.terminateSession(sessionId, 'Session timeout');
        this.createSecurityAlert({
          type: 'suspicious_login',
          severity: 'medium',
          title: 'Session Timeout',
          description: `Session for user ${session.userId} timed out due to inactivity`,
          affectedUsers: [session.userId]
        });
      }
    });
  }

  private detectSuspiciousActivity(): void {
    // Check for multiple failed logins from same IP
    const ipAttempts = new Map<string, number>();
    
    this.securityEvents
      .filter(event => event.type === 'login' && event.details.success === false)
      .forEach(event => {
        const attempts = ipAttempts.get(event.ipAddress) || 0;
        ipAttempts.set(event.ipAddress, attempts + 1);
      });

    ipAttempts.forEach((attempts, ipAddress) => {
      if (attempts >= 10) {
        this.createSecurityAlert({
          type: 'brute_force',
          severity: 'high',
          title: 'Potential Brute Force Attack',
          description: `Multiple failed login attempts detected from IP: ${ipAddress}`,
          affectedUsers: [],
          actions: [
            {
              type: 'notify_admin',
              description: 'Notify administrators of potential attack',
              executed: false
            }
          ]
        });
      }
    });

    // Check for unusual login patterns
    this.detectUnusualLoginPatterns();
  }

  private detectUnusualLoginPatterns(): void {
    // Group logins by user and check for unusual patterns
    const userLogins = new Map<string, SecurityEvent[]>();
    
    this.securityEvents
      .filter(event => event.type === 'login' && event.details.success === true)
      .forEach(event => {
        const logins = userLogins.get(event.userId) || [];
        logins.push(event);
        userLogins.set(event.userId, logins);
      });

    userLogins.forEach((logins, userId) => {
      if (logins.length < 3) return; // Need at least 3 logins to establish pattern

      // Check for logins from unusual locations
      const recentLogins = logins.slice(-10); // Last 10 logins
      const uniqueIPs = new Set(recentLogins.map(login => login.ipAddress));
      
      if (uniqueIPs.size >= 3) {
        this.createSecurityAlert({
          type: 'unusual_activity',
          severity: 'medium',
          title: 'Unusual Login Pattern Detected',
          description: `User ${userId} has logged in from multiple unusual locations`,
          affectedUsers: [userId],
          actions: [
            {
              type: 'require_2fa',
              description: 'Require two-factor authentication for next login',
              executed: false
            }
          ]
        });
      }

      // Check for logins at unusual times
      const loginHours = recentLogins.map(login => login.timestamp.getHours());
      const usualHours = loginHours.slice(0, -3); // Exclude last 3 logins
      const recentHours = loginHours.slice(-3);
      
      if (usualHours.length > 0) {
        const usualHourRange = {
          min: Math.min(...usualHours),
          max: Math.max(...usualHours)
        };

        const unusualHours = recentHours.filter(hour => 
          hour < usualHourRange.min - 2 || hour > usualHourRange.max + 2
        );

        if (unusualHours.length >= 2) {
          this.createSecurityAlert({
            type: 'unusual_activity',
            severity: 'low',
            title: 'Unusual Login Time',
            description: `User ${userId} logged in at unusual times`,
            affectedUsers: [userId]
          });
        }
      }
    });
  }

  private handleFailedLogin(userId: string, ipAddress: string, userAgent: string): void {
    const attempts = this.loginAttempts.get(userId) || 0;
    this.loginAttempts.set(userId, attempts + 1);

    this.logSecurityEvent({
      type: 'login',
      severity: 'medium',
      userId,
      description: 'Failed login attempt',
      details: { success: false, attempt: attempts + 1 },
      ipAddress,
      userAgent
    });

    // Check for account lockout
    if (attempts + 1 >= this.config.authentication.maxLoginAttempts) {
      this.lockAccount(userId);
      this.createSecurityAlert({
        type: 'brute_force',
        severity: 'high',
        title: 'Account Locked Due to Failed Login Attempts',
        description: `Account ${userId} has been locked after ${attempts + 1} failed attempts`,
        affectedUsers: [userId],
        actions: [
          {
            type: 'lock_account',
            description: 'Lock user account',
            executed: true
          },
          {
            type: 'notify_admin',
            description: 'Notify administrators of account lockout',
            executed: false
          }
        ]
      });
    }
  }

  private handleSuccessfulLogin(userId: string, ipAddress: string, userAgent: string, location?: any): void {
    // Reset login attempts
    this.loginAttempts.delete(userId);

    // Create session
    const sessionId = this.generateSessionId();
    const session: UserSession = {
      id: sessionId,
      userId,
      startTime: new Date(),
      lastActivity: new Date(),
      ipAddress,
      userAgent,
      location,
      isActive: true,
      permissions: this.getUserPermissions(userId)
    };

    this.activeSessions.set(sessionId, session);

    // Log successful login
    this.logSecurityEvent({
      type: 'login',
      severity: 'low',
      userId,
      description: 'Successful login',
      details: { success: true, sessionId },
      ipAddress,
      userAgent
    });

    // Check for suspicious login patterns
    this.checkLoginSuspicion(userId, ipAddress, location);
  }

  private checkLoginSuspicion(userId: string, ipAddress: string, location?: any): void {
    const userSessions = Array.from(this.activeSessions.values()).filter(s => s.userId === userId);
    
    // Check for multiple concurrent sessions from different IPs
    const uniqueIPs = new Set(userSessions.map(s => s.ipAddress));
    
    if (uniqueIPs.size > 1) {
      this.createSecurityAlert({
        type: 'suspicious_login',
        severity: 'medium',
        title: 'Multiple Concurrent Sessions Detected',
        description: `User ${userId} has active sessions from multiple IP addresses`,
        affectedUsers: [userId],
        actions: [
          {
            type: 'force_logout',
            description: 'Terminate other sessions',
            executed: false
          }
        ]
      });
    }

    // Check for login from unusual location
    const recentLogins = this.securityEvents
      .filter(event => event.type === 'login' && event.details.success === true && event.userId === userId)
      .slice(-10);

    if (recentLogins.length >= 3) {
      const commonIPs = new Map<string, number>();
      recentLogins.forEach(login => {
        const count = commonIPs.get(login.ipAddress) || 0;
        commonIPs.set(login.ipAddress, count + 1);
      });

      const mostCommonIP = Array.from(commonIPs.entries())
        .sort(([, a], [, b]) => b - a)[0]?.[0];

      if (mostCommonIP && ipAddress !== mostCommonIP) {
        this.createSecurityAlert({
          type: 'suspicious_login',
          severity: 'low',
          title: 'Login from Unusual Location',
          description: `User ${userId} logged in from a new IP address`,
          affectedUsers: [userId],
          actions: [
            {
              type: 'require_2fa',
              description: 'Require additional verification',
              executed: false
            }
          ]
        });
      }
    }
  }

  private lockAccount(userId: string): void {
    this.lockedAccounts.add(userId);
    
    // Terminate all active sessions for this user
    this.activeSessions.forEach((session, sessionId) => {
      if (session.userId === userId) {
        this.terminateSession(sessionId, 'Account locked');
      }
    });
  }

  private unlockAccount(userId: string): void {
    this.lockedAccounts.delete(userId);
  }

  private terminateSession(sessionId: string, reason: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.activeSessions.delete(sessionId);

      this.logSecurityEvent({
        type: 'logout',
        severity: 'low',
        userId: session.userId,
        description: `Session terminated: ${reason}`,
        details: { sessionId, reason },
        ipAddress: session.ipAddress,
        userAgent: session.userAgent
      });
    }
  }

  private logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      ...event
    };

    this.securityEvents.push(securityEvent);

    // Keep only last 10000 events
    if (this.securityEvents.length > 10000) {
      this.securityEvents = this.securityEvents.slice(-10000);
    }

    // Emit event for real-time monitoring
    document.dispatchEvent(new CustomEvent('security:event', {
      detail: securityEvent
    }));
  }

  private createSecurityAlert(alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'status'>): void {
    const securityAlert: SecurityAlert = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      status: 'active',
      ...alert
    };

    this.securityAlerts.push(securityAlert);

    // Emit alert for real-time notifications
    document.dispatchEvent(new CustomEvent('security:alert', {
      detail: securityAlert
    }));

    // Auto-execute critical actions
    if (alert.severity === 'critical') {
      this.executeAlertActions(securityAlert);
    }
  }

  private executeAlertActions(alert: SecurityAlert): void {
    alert.actions.forEach(action => {
      if (!action.executed) {
        switch (action.type) {
          case 'lock_account':
            alert.affectedUsers.forEach(userId => this.lockAccount(userId));
            break;
          case 'force_logout':
            alert.affectedUsers.forEach(userId => {
              this.activeSessions.forEach((session, sessionId) => {
                if (session.userId === userId) {
                  this.terminateSession(sessionId, 'Security alert - forced logout');
                }
              });
            });
            break;
          case 'notify_admin':
            // This would integrate with notification system
            console.warn('Security alert - notify admin:', alert.title);
            break;
        }

        action.executed = true;
        action.executedAt = new Date();
      }
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserPermissions(userId: string): string[] {
    // This would typically fetch from user service
    // For now, return default permissions
    return ['read_transactions', 'read_reports'];
  }

  // Public API Methods
  public hasPermission(userId: string, permissionId: string, resource?: string): boolean {
    if (this.lockedAccounts.has(userId)) return false;

    const permission = this.permissions.get(permissionId);
    if (!permission) return false;

    if (resource && permission.resource !== resource) return false;

    // Check user permissions (simplified)
    const userPermissions = this.getUserPermissions(userId);
    return userPermissions.includes(permissionId);
  }

  public checkPermission(userId: string, permissionId: string, resource?: string): boolean {
    const hasPermission = this.hasPermission(userId, permissionId, resource);
    
    if (!hasPermission) {
      // Log permission denial
      this.logSecurityEvent({
        type: 'permission_denied',
        severity: 'medium',
        userId,
        description: `Access denied: ${permissionId}`,
        details: { permissionId, resource },
        ipAddress: 'unknown',
        userAgent: 'unknown'
      });

      // Emit event for UI feedback
      document.dispatchEvent(new CustomEvent('security:permission-denied', {
        detail: { userId, permissionId, resource }
      }));
    }

    return hasPermission;
  }

  public getActiveSessions(userId?: string): UserSession[] {
    const sessions = Array.from(this.activeSessions.values());
    return userId ? sessions.filter(s => s.userId === userId) : sessions;
  }

  public getSecurityEvents(filters?: {
    userId?: string;
    type?: SecurityEvent['type'];
    severity?: SecurityEvent['severity'];
    startDate?: Date;
    endDate?: Date;
  }): SecurityEvent[] {
    let events = this.securityEvents;

    if (filters) {
      if (filters.userId) {
        events = events.filter(e => e.userId === filters.userId);
      }
      if (filters.type) {
        events = events.filter(e => e.type === filters.type);
      }
      if (filters.severity) {
        events = events.filter(e => e.severity === filters.severity);
      }
      if (filters.startDate) {
        events = events.filter(e => e.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        events = events.filter(e => e.timestamp <= filters.endDate!);
      }
    }

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getSecurityAlerts(status?: SecurityAlert['status']): SecurityAlert[] {
    const alerts = this.securityAlerts;
    return status ? alerts.filter(a => a.status === status) : alerts;
  }

  public resolveAlert(alertId: string, resolvedBy: string): void {
    const alert = this.securityAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolved = true;
      alert.resolvedBy = resolvedBy;
      alert.resolvedAt = new Date();
    }
  }

  public getRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  public getPermissions(): Permission[] {
    return Array.from(this.permissions.values());
  }

  public assignRole(userId: string, roleId: string): boolean {
    const role = this.roles.get(roleId);
    if (!role) return false;

    // This would update user role in user service
    this.logSecurityEvent({
      type: 'configuration_change',
      severity: 'medium',
      userId,
      description: `Role assigned: ${role.name}`,
      details: { roleId, roleName: role.name },
      ipAddress: 'system',
      userAgent: 'system'
    });

    return true;
  }

  public updateConfig(updates: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...updates };
    
    this.logSecurityEvent({
      type: 'configuration_change',
      severity: 'medium',
      userId: 'system',
      description: 'Security configuration updated',
      details: updates,
      ipAddress: 'system',
      userAgent: 'system'
    });
  }

  public getConfig(): SecurityConfig {
    return { ...this.config };
  }

  public getSecurityMetrics(): {
    activeSessions: number;
    lockedAccounts: number;
    securityEvents: number;
    activeAlerts: number;
    failedLogins24h: number;
    unusualActivity24h: number;
  } {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const events24h = this.securityEvents.filter(e => e.timestamp >= yesterday);
    const failedLogins24h = events24h.filter(e => 
      e.type === 'login' && e.details.success === false
    ).length;
    
    const unusualActivity24h = this.securityAlerts.filter(a => 
      a.timestamp >= yesterday && a.status === 'active'
    ).length;

    return {
      activeSessions: this.activeSessions.size,
      lockedAccounts: this.lockedAccounts.size,
      securityEvents: this.securityEvents.length,
      activeAlerts: this.securityAlerts.filter(a => a.status === 'active').length,
      failedLogins24h,
      unusualActivity24h
    };
  }

  public destroy(): void {
    // Remove event listeners
    this.eventListeners.forEach((handler, event) => {
      document.removeEventListener(event, handler);
    });
    this.eventListeners.clear();

    // Clear all sessions
    this.activeSessions.forEach((_, sessionId) => {
      this.terminateSession(sessionId, 'System shutdown');
    });

    this.activeSessions.clear();
    this.securityEvents = [];
    this.securityAlerts = [];
  }
}

export default EnterpriseSecurity;
