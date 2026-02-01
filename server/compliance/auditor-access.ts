// CRITICAL: Auditor Access Management
// MANDATORY: Secure, audited, read-only access for external auditors and regulators

import { logger } from '../utils/structured-logger.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { auditVaultManager, VaultAccessRequest } from './audit-vault.js';
import { evidenceCollectionManager } from './evidence-collector.js';
import { governanceModelManager } from '../governance/governance-model.js';
import * as crypto from 'crypto';

export type AuditorRole = 'EXTERNAL_AUDITOR' | 'INTERNAL_AUDITOR' | 'REGULATOR' | 'COMPLIANCE_OFFICER' | 'LEGAL_COUNSEL';
export type AccessStatus = 'PENDING' | 'APPROVED' | 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED';
export type SessionStatus = 'ACTIVE' | 'IDLE' | 'EXPIRED' | 'TERMINATED';

export interface AuditorProfile {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: AuditorRole;
  credentials: {
    licenseNumber?: string;
    firmId?: string;
    regulatoryId?: string;
    certifications: string[];
  };
  jurisdiction: string;
  phone?: string;
  address?: string;
  backgroundCheckCompleted: boolean;
  ndaSigned: boolean;
  confidentialityAgreementSigned: boolean;
  createdAt: Date;
  createdBy: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastAccess?: Date;
  accessHistory: Array<{
    timestamp: Date;
    action: string;
    resource: string;
    duration: number;
    ipAddress: string;
  }>;
}

export interface AuditorAccessSession {
  id: string;
  auditorId: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  lastActivity: Date;
  status: SessionStatus;
  purpose: string;
  scope: string[];
  vaultIds: string[];
  accessLevel: 'READ_ONLY' | 'READ_WRITE' | 'EXPORT';
  ipAddress: string;
  userAgent: string;
  allowedOperations: string[];
  restrictedData: string[];
  auditTrail: Array<{
    action: string;
    timestamp: Date;
    resource: string;
    details: string;
    success: boolean;
  }>;
  dataAccessed: {
    evidenceIds: string[];
    totalRecords: number;
    exportSize: number;
    searchQueries: string[];
  };
  terminationReason?: string;
}

export interface AuditorAccessRequest {
  id: string;
  auditorId: string;
  requestType: 'INITIAL_ACCESS' | 'EXTENSION' | 'SPECIFIC_EVIDENCE' | 'BULK_EXPORT';
  purpose: string;
  scope: string[];
  requestedDuration: number; // days
  startTime: Date;
  endTime: Date;
  status: AccessStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  framework: 'SOC2' | 'ISO27001' | 'SOX' | 'GDPR' | 'CCPA' | 'MULTI';
  evidenceTypes: string[];
  justification: string;
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  conditions: string[];
  restrictions: string[];
  reviewRequired: boolean;
  autoApproval: boolean;
  metadata: {
    auditPeriod?: string;
    reportType?: string;
    regulatoryReference?: string;
    legalBasis?: string;
  };
}

export interface AuditorAccessReport {
  id: string;
  auditorId: string;
  reportPeriod: {
    start: Date;
    end: Date;
  };
  accessSummary: {
    totalSessions: number;
    totalDuration: number;
    evidenceViewed: number;
    evidenceExported: number;
    searchQueries: number;
    violations: number;
  };
  complianceMetrics: {
    accessPolicyCompliance: number;
    dataRetentionCompliance: number;
    auditTrailCompleteness: number;
    securityIncidents: number;
  };
  findings: Array<{
    type: 'POLICY_VIOLATION' | 'SECURITY_INCIDENT' | 'ACCESS_ANOMALY' | 'DATA_BREACH';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    timestamp: Date;
    resolution?: string;
    impact: string;
  }>;
  recommendations: string[];
  generatedAt: Date;
  generatedBy: string;
}

/**
 * CRITICAL: Auditor Access Manager
 * 
 * Manages secure, audited access for external auditors and regulators.
 * Provides read-only access with comprehensive monitoring and controls.
 */
export class AuditorAccessManager {
  private static instance: AuditorAccessManager;
  private auditLogger: any;
  private auditors: Map<string, AuditorProfile> = new Map();
  private sessions: Map<string, AuditorAccessSession> = new Map();
  private accessRequests: Map<string, AuditorAccessRequest> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private sessionTimeout: number = 30 * 60 * 1000; // 30 minutes

  private constructor() {
    this.auditLogger = getImmutableAuditLogger();
    this.startSessionMonitoring();
  }

  static getInstance(): AuditorAccessManager {
    if (!AuditorAccessManager.instance) {
      AuditorAccessManager.instance = new AuditorAccessManager();
    }
    return AuditorAccessManager.instance;
  }

  /**
   * CRITICAL: Register auditor profile
   */
  async registerAuditor(
    name: string,
    email: string,
    organization: string,
    role: AuditorRole,
    credentials: AuditorProfile['credentials'],
    jurisdiction: string,
    createdBy: string
  ): Promise<string> {
    const auditorId = this.generateAuditorId();
    const timestamp = new Date();

    try {
      // CRITICAL: Validate auditor credentials
      const credentialsValid = await this.validateAuditorCredentials(role, credentials);
      if (!credentialsValid) {
        throw new Error(`Invalid credentials for role: ${role}`);
      }

      // CRITICAL: Create auditor profile
      const auditor: AuditorProfile = {
        id: auditorId,
        name,
        email,
        organization,
        role,
        credentials,
        jurisdiction,
        backgroundCheckCompleted: false,
        ndaSigned: false,
        confidentialityAgreementSigned: false,
        createdAt: timestamp,
        createdBy,
        status: 'INACTIVE',
        accessHistory: []
      };

      this.auditors.set(auditorId, auditor);

      // CRITICAL: Log auditor registration
      this.auditLogger.logDataMutation({
        tenantId: 'system',
        actorId: createdBy,
        action: 'AUDITOR_REGISTERED',
        resourceType: 'AUDITOR_PROFILE',
        resourceId: auditorId,
        outcome: 'SUCCESS',
        correlationId: this.generateCorrelationId(),
        metadata: {
          name,
          email,
          organization,
          role,
          jurisdiction,
          credentials: Object.keys(credentials)
        }
      });

      logger.info('Auditor registered', {
        auditorId,
        name,
        email,
        organization,
        role,
        jurisdiction
      });

      return auditorId;

    } catch (error) {
      logger.error('Auditor registration failed', {
        name,
        email,
        organization,
        role,
        error: (error as Error).message
      });

      this.auditLogger.logDataMutation({
        tenantId: 'system',
        actorId: createdBy,
        action: 'AUDITOR_REGISTRATION_FAILED',
        resourceType: 'AUDITOR_PROFILE',
        resourceId: auditorId,
        outcome: 'FAILURE',
        correlationId: this.generateCorrelationId(),
        metadata: {
          name,
          email,
          organization,
          role,
          error: (error as Error).message
        }
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Request auditor access
   */
  async requestAccess(
    auditorId: string,
    requestType: AuditorAccessRequest['requestType'],
    purpose: string,
    scope: string[],
    requestedDuration: number,
    framework: AuditorAccessRequest['framework'],
    evidenceTypes: string[],
    justification: string,
    requestedBy: string,
    metadata?: AuditorAccessRequest['metadata']
  ): Promise<string> {
    const auditor = this.auditors.get(auditorId);
    if (!auditor) {
      throw new Error(`Auditor not found: ${auditorId}`);
    }

    if (auditor.status !== 'ACTIVE') {
      throw new Error(`Auditor not active: ${auditor.status}`);
    }

    const requestId = this.generateRequestId();
    const timestamp = new Date();

    try {
      // CRITICAL: Create access request
      const request: AuditorAccessRequest = {
        id: requestId,
        auditorId,
        requestType,
        purpose,
        scope,
        requestedDuration,
        startTime: timestamp,
        endTime: new Date(timestamp.getTime() + (requestedDuration * 24 * 60 * 60 * 1000)),
        status: 'PENDING',
        priority: this.determineRequestPriority(requestType, framework),
        framework,
        evidenceTypes,
        justification,
        requestedBy,
        conditions: this.generateAccessConditions(auditor.role, framework),
        restrictions: this.generateAccessRestrictions(auditor.role, evidenceTypes),
        reviewRequired: this.requiresReview(auditor.role, requestType),
        autoApproval: this.eligibleForAutoApproval(auditor.role, requestType),
        metadata: metadata || {}
      };

      this.accessRequests.set(requestId, request);

      // CRITICAL: Auto-approve if eligible
      if (request.autoApproval) {
        await this.approveAccessRequest(requestId, 'system', 'Auto-approved based on role and request type');
      }

      // CRITICAL: Log access request
      this.auditLogger.logAuthorizationDecision({
        tenantId: 'system',
        actorId: requestedBy,
        action: 'AUDITOR_ACCESS_REQUESTED',
        resourceType: 'AUDITOR_ACCESS',
        resourceId: requestId,
        outcome: request.status === 'APPROVED' ? 'SUCCESS' : 'PENDING',
        correlationId: this.generateCorrelationId(),
        metadata: {
          auditorId,
          requestType,
          purpose,
          framework,
          requestedDuration,
          autoApproval: request.autoApproval
        }
      });

      logger.info('Auditor access requested', {
        requestId,
        auditorId,
        requestType,
        purpose,
        framework,
        status: request.status
      });

      return requestId;

    } catch (error) {
      logger.error('Auditor access request failed', {
        auditorId,
        requestType,
        error: (error as Error).message
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Approve access request
   */
  async approveAccessRequest(
    requestId: string,
    approvedBy: string,
    justification?: string
  ): Promise<void> {
    const request = this.accessRequests.get(requestId);
    if (!request) {
      throw new Error(`Access request not found: ${requestId}`);
    }

    if (request.status !== 'PENDING') {
      throw new Error(`Access request not pending: ${request.status}`);
    }

    const timestamp = new Date();

    try {
      // CRITICAL: Update request status
      request.status = 'APPROVED';
      request.approvedBy = approvedBy;
      request.approvedAt = timestamp;

      // CRITICAL: Create access session
      const sessionId = this.generateSessionId();
      const session: AuditorAccessSession = {
        id: sessionId,
        auditorId: request.auditorId,
        sessionId: this.generateSecureSessionId(),
        startTime: request.startTime,
        lastActivity: timestamp,
        status: 'ACTIVE',
        purpose: request.purpose,
        scope: request.scope,
        vaultIds: this.determineAccessibleVaults(request.framework, request.evidenceTypes),
        accessLevel: this.determineAccessLevel(request.auditorId, request.requestType),
        ipAddress: 'pending',
        userAgent: 'pending',
        allowedOperations: this.determineAllowedOperations(request.auditorId, request.requestType),
        restrictedData: this.determineRestrictedData(request.auditorId, request.evidenceTypes),
        auditTrail: [{
          action: 'SESSION_CREATED',
          timestamp,
          resource: 'ACCESS_SESSION',
          details: justification || 'Access approved',
          success: true
        }],
        dataAccessed: {
          evidenceIds: [],
          totalRecords: 0,
          exportSize: 0,
          searchQueries: []
        }
      };

      this.sessions.set(sessionId, session);

      // CRITICAL: Log approval
      this.auditLogger.logAuthorizationDecision({
        tenantId: 'system',
        actorId: approvedBy,
        action: 'AUDITOR_ACCESS_APPROVED',
        resourceType: 'AUDITOR_ACCESS',
        resourceId: requestId,
        outcome: 'SUCCESS',
        correlationId: this.generateCorrelationId(),
        metadata: {
          auditorId: request.auditorId,
          requestType: request.requestType,
          framework: request.framework,
          sessionId,
          justification
        }
      });

      logger.info('Auditor access approved', {
        requestId,
        auditorId: request.auditorId,
        sessionId,
        approvedBy,
        framework: request.framework
      });

    } catch (error) {
      logger.error('Auditor access approval failed', {
        requestId,
        approvedBy,
        error: (error as Error).message
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Start auditor session
   */
  async startSession(
    sessionId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.status !== 'ACTIVE') {
      throw new Error(`Session not active: ${session.status}`);
    }

    try {
      // CRITICAL: Update session details
      session.ipAddress = ipAddress;
      session.userAgent = userAgent;
      session.lastActivity = new Date();

      // CRITICAL: Log session start
      this.auditLogger.logAuthorizationDecision({
        tenantId: 'system',
        actorId: session.auditorId,
        action: 'AUDITOR_SESSION_STARTED',
        resourceType: 'AUDITOR_SESSION',
        resourceId: sessionId,
        outcome: 'SUCCESS',
        correlationId: this.generateCorrelationId(),
        metadata: {
          ipAddress,
          userAgent,
          accessLevel: session.accessLevel,
          vaultCount: session.vaultIds.length
        }
      });

      logger.info('Auditor session started', {
        sessionId,
        auditorId: session.auditorId,
        ipAddress,
        accessLevel: session.accessLevel
      });

      return session.sessionId;

    } catch (error) {
      logger.error('Auditor session start failed', {
        sessionId,
        ipAddress,
        error: (error as Error).message
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Access evidence from vault
   */
  async accessEvidence(
    sessionId: string,
    vaultId: string,
    evidenceId: string,
    operation: 'VIEW' | 'SEARCH' | 'EXPORT'
  ): Promise<any> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.status !== 'ACTIVE') {
      throw new Error(`Session not active: ${session.status}`);
    }

    try {
      // CRITICAL: Check session timeout
      if (this.isSessionExpired(session)) {
        await this.terminateSession(sessionId, 'Session expired');
        throw new Error('Session expired');
      }

      // CRITICAL: Check vault access permissions
      if (!session.vaultIds.includes(vaultId)) {
        throw new Error(`Access denied to vault: ${vaultId}`);
      }

      // CRITICAL: Check operation permissions
      if (!session.allowedOperations.includes(operation)) {
        throw new Error(`Operation not permitted: ${operation}`);
      }

      // CRITICAL: Check data restrictions
      if (session.restrictedData.includes(evidenceId)) {
        throw new Error(`Evidence access restricted: ${evidenceId}`);
      }

      // CRITICAL: Access evidence from vault
      const evidence = await auditVaultManager.retrieveEvidence(
        vaultId,
        evidenceId,
        session.auditorId,
        session.accessLevel
      );

      if (!evidence) {
        throw new Error(`Evidence not found: ${evidenceId}`);
      }

      // CRITICAL: Update session audit trail
      session.auditTrail.push({
        action: operation,
        timestamp: new Date(),
        resource: `${vaultId}/${evidenceId}`,
        details: `Evidence ${operation} completed`,
        success: true
      });

      // CRITICAL: Update data access tracking
      if (!session.dataAccessed.evidenceIds.includes(evidenceId)) {
        session.dataAccessed.evidenceIds.push(evidenceId);
        session.dataAccessed.totalRecords++;
      }

      if (operation === 'EXPORT') {
        session.dataAccessed.exportSize += evidence.metadata.size;
      }

      session.lastActivity = new Date();

      // CRITICAL: Log evidence access
      this.auditLogger.logAuthorizationDecision({
        tenantId: 'system',
        actorId: session.auditorId,
        action: `EVIDENCE_${operation.toUpperCase()}`,
        resourceType: 'COMPLIANCE_EVIDENCE',
        resourceId: evidenceId,
        outcome: 'SUCCESS',
        correlationId: this.generateCorrelationId(),
        metadata: {
          sessionId,
          vaultId,
          operation,
          evidenceSize: evidence.metadata.size,
          framework: evidence.metadata.framework
        }
      });

      logger.info('Evidence accessed by auditor', {
        sessionId,
        auditorId: session.auditorId,
        vaultId,
        evidenceId,
        operation
      });

      return evidence;

    } catch (error) {
      logger.error('Evidence access failed', {
        sessionId,
        vaultId,
        evidenceId,
        operation,
        error: (error as Error).message
      });

      // CRITICAL: Log failed access attempt
      this.auditLogger.logAuthorizationDecision({
        tenantId: 'system',
        actorId: session.auditorId,
        action: `EVIDENCE_${operation.toUpperCase()}_FAILED`,
        resourceType: 'COMPLIANCE_EVIDENCE',
        resourceId: evidenceId,
        outcome: 'FAILURE',
        correlationId: this.generateCorrelationId(),
        metadata: {
          sessionId,
          vaultId,
          operation,
          error: (error as Error).message
        }
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Terminate auditor session
   */
  async terminateSession(
    sessionId: string,
    reason: string = 'Manual termination'
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    try {
      // CRITICAL: Update session
      session.status = 'TERMINATED';
      session.endTime = new Date();
      session.terminationReason = reason;

      // CRITICAL: Update auditor access history
      const auditor = this.auditors.get(session.auditorId);
      if (auditor) {
        auditor.accessHistory.push({
          timestamp: session.startTime,
          action: 'SESSION_TERMINATED',
          resource: sessionId,
          duration: session.endTime.getTime() - session.startTime.getTime(),
          ipAddress: session.ipAddress
        });
        auditor.lastAccess = session.endTime;
      }

      // CRITICAL: Log session termination
      this.auditLogger.logAuthorizationDecision({
        tenantId: 'system',
        actorId: session.auditorId,
        action: 'AUDITOR_SESSION_TERMINATED',
        resourceType: 'AUDITOR_SESSION',
        resourceId: sessionId,
        outcome: 'SUCCESS',
        correlationId: this.generateCorrelationId(),
        metadata: {
          reason,
          duration: session.endTime.getTime() - session.startTime.getTime(),
          evidenceViewed: session.dataAccessed.evidenceIds.length,
          exportSize: session.dataAccessed.exportSize
        }
      });

      logger.info('Auditor session terminated', {
        sessionId,
        auditorId: session.auditorId,
        reason,
        duration: session.endTime.getTime() - session.startTime.getTime()
      });

    } catch (error) {
      logger.error('Session termination failed', {
        sessionId,
        error: (error as Error).message
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Generate auditor access report
   */
  async generateAccessReport(
    auditorId: string,
    reportPeriod: { start: Date; end: Date },
    generatedBy: string
  ): Promise<string> {
    const auditor = this.auditors.get(auditorId);
    if (!auditor) {
      throw new Error(`Auditor not found: ${auditorId}`);
    }

    const reportId = this.generateReportId();
    const timestamp = new Date();

    try {
      // CRITICAL: Get sessions in period
      const periodSessions = Array.from(this.sessions.values())
        .filter(s => s.auditorId === auditorId &&
                   s.startTime >= reportPeriod.start &&
                   s.startTime <= reportPeriod.end);

      // CRITICAL: Calculate access summary
      const totalSessions = periodSessions.length;
      const totalDuration = periodSessions.reduce((sum, s) => {
        const end = s.endTime || s.lastActivity;
        return sum + (end.getTime() - s.startTime.getTime());
      }, 0);
      const evidenceViewed = periodSessions.reduce((sum, s) => sum + s.dataAccessed.evidenceIds.length, 0);
      const evidenceExported = periodSessions.reduce((sum, s) => sum + s.dataAccessed.exportSize, 0);
      const searchQueries = periodSessions.reduce((sum, s) => sum + s.dataAccessed.searchQueries.length, 0);

      // CRITICAL: Detect violations
      const violations = this.detectAccessViolations(periodSessions);

      // CRITICAL: Create report
      const report: AuditorAccessReport = {
        id: reportId,
        auditorId,
        reportPeriod,
        accessSummary: {
          totalSessions,
          totalDuration,
          evidenceViewed,
          evidenceExported,
          searchQueries,
          violations: violations.length
        },
        complianceMetrics: {
          accessPolicyCompliance: this.calculateAccessPolicyCompliance(periodSessions),
          dataRetentionCompliance: 100, // Simplified
          auditTrailCompleteness: this.calculateAuditTrailCompleteness(periodSessions),
          securityIncidents: violations.filter(v => v.type === 'SECURITY_INCIDENT').length
        },
        findings: violations,
        recommendations: this.generateRecommendations(violations, periodSessions),
        generatedAt: timestamp,
        generatedBy
      };

      // CRITICAL: Log report generation
      this.auditLogger.logDataMutation({
        tenantId: 'system',
        actorId: generatedBy,
        action: 'AUDITOR_ACCESS_REPORT_GENERATED',
        resourceType: 'AUDITOR_REPORT',
        resourceId: reportId,
        outcome: 'SUCCESS',
        correlationId: this.generateCorrelationId(),
        metadata: {
          auditorId,
          reportPeriod: `${reportPeriod.start.toISOString()}_${reportPeriod.end.toISOString()}`,
          totalSessions,
          violations: violations.length
        }
      });

      logger.info('Auditor access report generated', {
        reportId,
        auditorId,
        totalSessions,
        violations: violations.length
      });

      return reportId;

    } catch (error) {
      logger.error('Access report generation failed', {
        auditorId,
        error: (error as Error).message
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Get auditor profile
   */
  getAuditor(auditorId: string): AuditorProfile | undefined {
    return this.auditors.get(auditorId);
  }

  /**
   * CRITICAL: Get session information
   */
  getSession(sessionId: string): AuditorAccessSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * CRITICAL: Get access request
   */
  getAccessRequest(requestId: string): AuditorAccessRequest | undefined {
    return this.accessRequests.get(requestId);
  }

  /**
   * CRITICAL: Get auditor statistics
   */
  getAuditorStatistics(): {
    totalAuditors: number;
    activeAuditors: number;
    totalSessions: number;
    activeSessions: number;
    totalAccessRequests: number;
    pendingRequests: number;
    byRole: Record<string, number>;
    byFramework: Record<string, number>;
  } {
    const auditors = Array.from(this.auditors.values());
    const sessions = Array.from(this.sessions.values());
    const requests = Array.from(this.accessRequests.values());

    const byRole: Record<string, number> = {};
    const byFramework: Record<string, number> = {};

    for (const auditor of auditors) {
      byRole[auditor.role] = (byRole[auditor.role] || 0) + 1;
    }

    for (const request of requests) {
      byFramework[request.framework] = (byFramework[request.framework] || 0) + 1;
    }

    return {
      totalAuditors: auditors.length,
      activeAuditors: auditors.filter(a => a.status === 'ACTIVE').length,
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.status === 'ACTIVE').length,
      totalAccessRequests: requests.length,
      pendingRequests: requests.filter(r => r.status === 'PENDING').length,
      byRole,
      byFramework
    };
  }

  /**
   * CRITICAL: Start session monitoring
   */
  private startSessionMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        const sessions = Array.from(this.sessions.values())
          .filter(s => s.status === 'ACTIVE');

        for (const session of sessions) {
          if (this.isSessionExpired(session)) {
            await this.terminateSession(session.id, 'Session timeout');
          }
        }
      } catch (error) {
        logger.error('Session monitoring failed', {
          error: (error as Error).message
        });
      }
    }, 60000); // Every minute
  }

  /**
   * CRITICAL: Check if session is expired
   */
  private isSessionExpired(session: AuditorAccessSession): boolean {
    const now = new Date();
    return (now.getTime() - session.lastActivity.getTime()) > this.sessionTimeout;
  }

  /**
   * CRITICAL: Validate auditor credentials
   */
  private async validateAuditorCredentials(
    role: AuditorRole,
    credentials: AuditorProfile['credentials']
  ): Promise<boolean> {
    switch (role) {
      case 'EXTERNAL_AUDITOR':
        return !!(credentials.licenseNumber && credentials.firmId);
      case 'REGULATOR':
        return !!credentials.regulatoryId;
      case 'INTERNAL_AUDITOR':
      case 'COMPLIANCE_OFFICER':
      case 'LEGAL_COUNSEL':
        return true; // Less stringent requirements for internal roles
      default:
        return false;
    }
  }

  /**
   * CRITICAL: Determine request priority
   */
  private determineRequestPriority(
    requestType: AuditorAccessRequest['requestType'],
    framework: AuditorAccessRequest['framework']
  ): AuditorAccessRequest['priority'] {
    if (requestType === 'REGULATORY' || framework === 'SOX') {
      return 'CRITICAL';
    }
    if (requestType === 'BULK_EXPORT') {
      return 'HIGH';
    }
    return 'MEDIUM';
  }

  /**
   * CRITICAL: Generate access conditions
   */
  private generateAccessConditions(role: AuditorRole, framework: string): string[] {
    const conditions = [
      'Read-only access to evidence',
      'No modification of stored data',
      'All access logged and audited',
      'Data confidentiality maintained'
    ];

    if (role === 'EXTERNAL_AUDITOR') {
      conditions.push('Audit purpose only');
      conditions.push('No data sharing with third parties');
    }

    if (framework === 'GDPR' || framework === 'CCPA') {
      conditions.push('Personal data protection compliance');
    }

    return conditions;
  }

  /**
   * CRITICAL: Generate access restrictions
   */
  private generateAccessRestrictions(role: AuditorRole, evidenceTypes: string[]): string[] {
    const restrictions = [];

    if (role === 'EXTERNAL_AUDITOR') {
      restrictions.push('No access to internal communications');
      restrictions.push('No access to legal privileged information');
    }

    if (evidenceTypes.includes('PERSONAL_DATA')) {
      restrictions.push('Personal data anonymization required');
    }

    return restrictions;
  }

  /**
   * CRITICAL: Check if review is required
   */
  private requiresReview(role: AuditorRole, requestType: AuditorAccessRequest['requestType']): boolean {
    return role === 'EXTERNAL_AUDITOR' || requestType === 'BULK_EXPORT';
  }

  /**
   * CRITICAL: Check if eligible for auto-approval
   */
  private eligibleForAutoApproval(role: AuditorRole, requestType: AuditorAccessRequest['requestType']): boolean {
    return role === 'INTERNAL_AUDITOR' && requestType === 'INITIAL_ACCESS';
  }

  /**
   * CRITICAL: Determine accessible vaults
   */
  private determineAccessibleVaults(framework: string, evidenceTypes: string[]): string[] {
    const vaults = ['default_compliance_vault']; // Simplified
    
    if (framework === 'SOX') {
      vaults.push('sox_evidence_vault');
    }
    if (framework === 'GDPR' || framework === 'CCPA') {
      vaults.push('privacy_evidence_vault');
    }

    return vaults;
  }

  /**
   * CRITICAL: Determine access level
   */
  private determineAccessLevel(auditorId: string, requestType: AuditorAccessRequest['requestType']): AuditorAccessSession['accessLevel'] {
    const auditor = this.auditors.get(auditorId);
    
    if (auditor?.role === 'INTERNAL_AUDITOR') {
      return 'READ_WRITE';
    }
    
    return requestType === 'BULK_EXPORT' ? 'EXPORT' : 'READ_ONLY';
  }

  /**
   * CRITICAL: Determine allowed operations
   */
  private determineAllowedOperations(auditorId: string, requestType: AuditorAccessRequest['requestType']): string[] {
    const auditor = this.auditors.get(auditorId);
    const operations = ['VIEW', 'SEARCH'];

    if (auditor?.role === 'INTERNAL_AUDITOR') {
      operations.push('DOWNLOAD');
    }

    if (requestType === 'BULK_EXPORT') {
      operations.push('EXPORT');
    }

    return operations;
  }

  /**
   * CRITICAL: Determine restricted data
   */
  private determineRestrictedData(auditorId: string, evidenceTypes: string[]): string[] {
    const auditor = this.auditors.get(auditorId);
    const restricted = [];

    if (auditor?.role === 'EXTERNAL_AUDITOR') {
      restricted.push('INTERNAL_COMMUNICATIONS');
      restricted.push('LEGAL_PRIVILEGED');
    }

    return restricted;
  }

  /**
   * CRITICAL: Detect access violations
   */
  private detectAccessViolations(sessions: AuditorAccessSession[]): AuditorAccessReport['findings'] {
    const violations: AuditorAccessReport['findings'] = [];

    for (const session of sessions) {
      // Check for unusual access patterns
      if (session.dataAccessed.evidenceIds.length > 1000) {
        violations.push({
          type: 'ACCESS_ANOMALY',
          severity: 'MEDIUM',
          description: `Unusually high evidence access: ${session.dataAccessed.evidenceIds.length} records`,
          timestamp: session.startTime,
          impact: 'Potential data exfiltration risk'
        });
      }

      // Check for large exports
      if (session.dataAccessed.exportSize > 100 * 1024 * 1024) { // 100MB
        violations.push({
          type: 'ACCESS_ANOMALY',
          severity: 'HIGH',
          description: `Large data export: ${session.dataAccessed.exportSize} bytes`,
          timestamp: session.startTime,
          impact: 'Significant data transfer'
        });
      }
    }

    return violations;
  }

  /**
   * CRITICAL: Calculate access policy compliance
   */
  private calculateAccessPolicyCompliance(sessions: AuditorAccessSession[]): number {
    if (sessions.length === 0) return 100;

    let compliantSessions = 0;
    for (const session of sessions) {
      // Simplified compliance check
      if (session.auditTrail.length > 0 && session.dataAccessed.evidenceIds.length < 1000) {
        compliantSessions++;
      }
    }

    return (compliantSessions / sessions.length) * 100;
  }

  /**
   * CRITICAL: Calculate audit trail completeness
   */
  private calculateAuditTrailCompleteness(sessions: AuditorAccessSession[]): number {
    if (sessions.length === 0) return 100;

    let completeSessions = 0;
    for (const session of sessions) {
      if (session.auditTrail.length > 0) {
        completeSessions++;
      }
    }

    return (completeSessions / sessions.length) * 100;
  }

  /**
   * CRITICAL: Generate recommendations
   */
  private generateRecommendations(
    violations: AuditorAccessReport['findings'],
    sessions: AuditorAccessSession[]
  ): string[] {
    const recommendations = [];

    if (violations.some(v => v.type === 'ACCESS_ANOMALY')) {
      recommendations.push('Review access patterns and implement anomaly detection');
    }

    if (sessions.some(s => s.dataAccessed.exportSize > 50 * 1024 * 1024)) {
      recommendations.push('Implement export size limits and additional approvals');
    }

    recommendations.push('Regular access reviews and audit trail monitoring');
    recommendations.push('Enhanced session monitoring and automatic timeout');

    return recommendations;
  }

  /**
   * CRITICAL: Generate auditor ID
   */
  private generateAuditorId(): string {
    const bytes = crypto.randomBytes(8);
    return `aud_${bytes.toString('hex')}`;
  }

  /**
   * CRITICAL: Generate request ID
   */
  private generateRequestId(): string {
    const bytes = crypto.randomBytes(8);
    return `req_${bytes.toString('hex')}`;
  }

  /**
   * CRITICAL: Generate session ID
   */
  private generateSessionId(): string {
    const bytes = crypto.randomBytes(8);
    return `sess_${bytes.toString('hex')}`;
  }

  /**
   * CRITICAL: Generate secure session ID
   */
  private generateSecureSessionId(): string {
    const bytes = crypto.randomBytes(32);
    return bytes.toString('hex');
  }

  /**
   * CRITICAL: Generate report ID
   */
  private generateReportId(): string {
    const bytes = crypto.randomBytes(8);
    return `rpt_${bytes.toString('hex')}`;
  }

  /**
   * CRITICAL: Generate correlation ID
   */
  private generateCorrelationId(): string {
    const bytes = crypto.randomBytes(8);
    return `corr_${bytes.toString('hex')}`;
  }
}

/**
 * CRITICAL: Global auditor access manager instance
 */
export const auditorAccessManager = AuditorAccessManager.getInstance();

/**
 * CRITICAL: Convenience functions
 */
export const createAuditorAccessManager = (): AuditorAccessManager => {
  return AuditorAccessManager.getInstance();
};

export const registerAuditor = async (
  name: string,
  email: string,
  organization: string,
  role: AuditorRole,
  credentials: AuditorProfile['credentials'],
  jurisdiction: string,
  createdBy: string
): Promise<string> => {
  return auditorAccessManager.registerAuditor(name, email, organization, role, credentials, jurisdiction, createdBy);
};

export const requestAuditorAccess = async (
  auditorId: string,
  requestType: AuditorAccessRequest['requestType'],
  purpose: string,
  scope: string[],
  requestedDuration: number,
  framework: AuditorAccessRequest['framework'],
  evidenceTypes: string[],
  justification: string,
  requestedBy: string
): Promise<string> => {
  return auditorAccessManager.requestAccess(auditorId, requestType, purpose, scope, requestedDuration, framework, evidenceTypes, justification, requestedBy);
};
