// CRITICAL: Governance Model & Authority Hierarchy
// MANDATORY: Formal authority hierarchy with separation of duties and immutable governance

import { logger } from '../utils/structured-logger.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { TenantContext } from '../tenant/tenant-isolation.js';
import * as crypto from 'crypto';

export type AuthorityLevel = 'FOUNDER' | 'EXECUTIVE' | 'ADMIN' | 'SYSTEM' | 'USER';
export type GovernanceAction = 'APPOINT' | 'REMOVE' | 'SUSPEND' | 'EMERGENCY' | 'POLICY_CHANGE' | 'SYSTEM_CONFIG' | 'DATA_ACCESS' | 'COMPLIANCE_OVERRIDE';
export type EmergencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuthorityRole {
  id: string;
  level: AuthorityLevel;
  title: string;
  description: string;
  permissions: GovernancePermission[];
  restrictions: AuthorityRestriction[];
  appointmentRequirements: string[];
  removalRequirements: string[];
  termLimits?: {
    maxTerm: number; // in days
    renewalAllowed: boolean;
    coolingPeriod: number; // in days
  };
  separationOfDuties: string[]; // Roles that cannot be held simultaneously
}

export interface GovernancePermission {
  id: string;
  action: GovernanceAction;
  scope: 'GLOBAL' | 'TENANT' | 'SYSTEM' | 'COMPLIANCE';
  conditions: PermissionCondition[];
  requiresApproval: boolean;
  approvalLevel?: AuthorityLevel;
  auditLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  emergencyOverride: boolean;
}

export interface PermissionCondition {
  type: 'TIME' | 'LOCATION' | 'CONTEXT' | 'QUOTA' | 'SEPARATION';
  operator: 'EQ' | 'NE' | 'GT' | 'LT' | 'IN' | 'NOT_IN';
  value: any;
  description: string;
}

export interface AuthorityRestriction {
  id: string;
  type: 'TIME' | 'ACTION' | 'SCOPE' | 'QUOTA' | 'SEPARATION';
  description: string;
  condition: PermissionCondition;
  violationAction: 'BLOCK' | 'REQUIRE_APPROVAL' | 'LOG_ONLY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface GovernanceDecision {
  id: string;
  action: GovernanceAction;
  actorId: string;
  actorLevel: AuthorityLevel;
  targetId?: string;
  targetType?: 'USER' | 'ROLE' | 'POLICY' | 'SYSTEM';
  rationale: string;
  evidence: string[];
  conditions: Record<string, any>;
  approvals: GovernanceApproval[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'EXPIRED' | 'CANCELLED';
  executedAt?: Date;
  expiresAt?: Date;
  reviewedAt?: Date;
  reviewOutcome?: 'COMPLIANT' | 'VIOLATION' | 'NEEDS_REVIEW';
  correlationId: string;
  immutable: boolean;
}

export interface GovernanceApproval {
  id: string;
  approverId: string;
  approverLevel: AuthorityLevel;
  decision: 'APPROVE' | 'REJECT' | 'ESCALATE';
  rationale: string;
  timestamp: Date;
  conditions: string[];
  delegationChain?: string[];
}

export interface EmergencyPower {
  id: string;
  level: EmergencyLevel;
  grantedTo: string;
  grantedBy: string;
  grantedAt: Date;
  expiresAt: Date;
  scope: string[];
  actions: GovernanceAction[];
  conditions: EmergencyCondition[];
  reviewRequired: boolean;
  reviewedAt?: Date;
  reviewOutcome?: 'VALIDATED' | 'INVALIDATED' | 'EXTENDED';
  autoExpire: boolean;
  auditTrail: string[];
}

export interface EmergencyCondition {
  type: 'SYSTEM_FAILURE' | 'SECURITY_BREACH' | 'LEGAL_REQUIREMENT' | 'BUSINESS_CONTINUITY';
  description: string;
  threshold: any;
  monitoring: string;
  autoTrigger: boolean;
}

/**
 * CRITICAL: Governance Model Manager
 * 
 * This class implements the formal authority hierarchy with separation of duties,
 * emergency powers, and immutable governance decision tracking.
 */
export class GovernanceModelManager {
  private static instance: GovernanceModelManager;
  private auditLogger: any;
  private authorityRoles: Map<string, AuthorityRole> = new Map();
  private governanceDecisions: Map<string, GovernanceDecision> = new Map();
  private emergencyPowers: Map<string, EmergencyPower> = new Map();
  private activeEmergencyPowers: Map<string, EmergencyPower> = new Map();

  private constructor() {
    this.auditLogger = getImmutableAuditLogger();
    this.initializeAuthorityRoles();
    this.startEmergencyPowerMonitoring();
  }

  /**
   * CRITICAL: Get singleton instance
   */
  static getInstance(): GovernanceModelManager {
    if (!GovernanceModelManager.instance) {
      GovernanceModelManager.instance = new GovernanceModelManager();
    }
    return GovernanceModelManager.instance;
  }

  /**
   * CRITICAL: Check authority for action
   */
  async checkAuthority(
    actorId: string,
    actorLevel: AuthorityLevel,
    action: GovernanceAction,
    scope: string,
    targetId?: string,
    context: Record<string, any> = {}
  ): Promise<{
    authorized: boolean;
    requiresApproval: boolean;
    restrictions: AuthorityRestriction[];
    conditions: PermissionCondition[];
    delegationChain?: string[];
  }> {
    const role = this.getRoleByLevel(actorLevel);
    if (!role) {
      throw new Error(`Invalid authority level: ${actorLevel}`);
    }

    // CRITICAL: Check separation of duties
    const separationViolation = await this.checkSeparationOfDuties(actorId, role);
    if (separationViolation) {
      return {
        authorized: false,
        requiresApproval: false,
        restrictions: [separationViolation],
        conditions: []
      };
    }

    // CRITICAL: Find permission for action
    const permission = role.permissions.find(p => p.action === action);
    if (!permission) {
      return {
        authorized: false,
        requiresApproval: false,
        restrictions: [],
        conditions: []
      };
    }

    // CRITICAL: Check scope compatibility
    if (!this.isScopeCompatible(permission.scope, scope)) {
      return {
        authorized: false,
        requiresApproval: false,
        restrictions: [],
        conditions: []
      };
    }

    // CRITICAL: Check conditions
    const conditionResults = await this.checkPermissionConditions(permission.conditions, context);
    const conditionsMet = conditionResults.every(result => result.met);

    // CRITICAL: Check restrictions
    const applicableRestrictions = role.restrictions.filter(r => 
      this.isRestrictionApplicable(r, action, scope)
    );
    const restrictionResults = await this.checkRestrictions(applicableRestrictions, context);

    // CRITICAL: Check emergency powers
    const emergencyPower = this.getActiveEmergencyPower(actorId);
    const emergencyOverride = emergencyPower && 
      emergencyPower.actions.includes(action) &&
      emergencyPower.scope.includes(scope);

    // CRITICAL: Determine authorization
    let authorized = conditionsMet && restrictionResults.every(r => r.allowed);
    let requiresApproval = permission.requiresApproval && !emergencyOverride;

    // CRITICAL: Emergency override
    if (emergencyOverride && emergencyPower.level === 'CRITICAL') {
      authorized = true;
      requiresApproval = false;
    }

    // CRITICAL: Log authority check
    this.auditLogger.logAuthorizationDecision({
      tenantId: 'system',
      actorId,
      action: 'AUTHORITY_CHECK',
      resourceType: 'GOVERNANCE_ACTION',
      resourceId: action,
      outcome: authorized ? 'SUCCESS' : 'FAILURE',
      correlationId: this.generateCorrelationId(),
      severity: permission.auditLevel,
      metadata: {
        actorLevel,
        action,
        scope,
        targetId,
        conditionsMet,
        restrictionsViolated: restrictionResults.filter(r => !r.allowed).length,
        emergencyOverride: emergencyOverride ? true : false,
        requiresApproval
      }
    });

    return {
      authorized,
      requiresApproval,
      restrictions: restrictionResults.filter(r => !r.allowed).map(r => r.restriction),
      conditions: conditionResults.filter(r => !r.met).map(r => r.condition),
      delegationChain: emergencyOverride ? [emergencyPower.grantedBy] : undefined
    };
  }

  /**
   * CRITICAL: Create governance decision
   */
  async createGovernanceDecision(
    action: GovernanceAction,
    actorId: string,
    actorLevel: AuthorityLevel,
    rationale: string,
    evidence: string[],
    targetId?: string,
    targetType?: 'USER' | 'ROLE' | 'POLICY' | 'SYSTEM',
    conditions: Record<string, any> = {},
    expiresAt?: Date
  ): Promise<string> {
    const decisionId = this.generateDecisionId();
    const correlationId = this.generateCorrelationId();

    // CRITICAL: Check authority
    const authorityCheck = await this.checkAuthority(
      actorId,
      actorLevel,
      action,
      'GLOBAL',
      targetId,
      conditions
    );

    if (!authorityCheck.authorized && !authorityCheck.requiresApproval) {
      throw new Error(`Actor ${actorId} not authorized for action ${action}`);
    }

    // CRITICAL: Create decision
    const decision: GovernanceDecision = {
      id: decisionId,
      action,
      actorId,
      actorLevel,
      targetId,
      targetType,
      rationale,
      evidence,
      conditions,
      approvals: [],
      status: authorityCheck.requiresApproval ? 'PENDING' : 'APPROVED',
      expiresAt,
      correlationId,
      immutable: true
    };

    // CRITICAL: Store decision
    this.governanceDecisions.set(decisionId, decision);

    // CRITICAL: Auto-approve if no approval required
    if (!authorityCheck.requiresApproval) {
      await this.executeGovernanceDecision(decisionId);
    }

    // CRITICAL: Log decision creation
    this.auditLogger.logDataMutation({
      tenantId: 'system',
      actorId,
      action: 'GOVERNANCE_DECISION_CREATED',
      resourceType: 'GOVERNANCE_DECISION',
      resourceId: decisionId,
      outcome: 'SUCCESS',
      correlationId,
      severity: 'HIGH',
      metadata: {
        governanceAction: action,
        actorLevel,
        targetId,
        targetType,
        requiresApproval: authorityCheck.requiresApproval,
        evidenceCount: evidence.length
      }
    });

    logger.info('Governance decision created', {
      decisionId,
      action,
      actorId,
      actorLevel,
      status: decision.status
    });

    return decisionId;
  }

  /**
   * CRITICAL: Approve governance decision
   */
  async approveGovernanceDecision(
    decisionId: string,
    approverId: string,
    approverLevel: AuthorityLevel,
    decision: 'APPROVE' | 'REJECT' | 'ESCALATE',
    rationale: string,
    conditions: string[] = []
  ): Promise<void> {
    const governanceDecision = this.governanceDecisions.get(decisionId);
    if (!governanceDecision) {
      throw new Error(`Governance decision ${decisionId} not found`);
    }

    if (governanceDecision.status !== 'PENDING') {
      throw new Error(`Governance decision ${decisionId} is not pending`);
    }

    // CRITICAL: Check approver authority
    const authorityCheck = await this.checkAuthority(
      approverId,
      approverLevel,
      governanceDecision.action,
      'GLOBAL',
      governanceDecision.targetId
    );

    if (!authorityCheck.authorized) {
      throw new Error(`Approver ${approverId} not authorized to approve decision ${decisionId}`);
    }

    // CRITICAL: Create approval
    const approval: GovernanceApproval = {
      id: this.generateApprovalId(),
      approverId,
      approverLevel,
      decision,
      rationale,
      timestamp: new Date(),
      conditions
    };

    governanceDecision.approvals.push(approval);

    // CRITICAL: Update decision status
    if (decision === 'APPROVE') {
      governanceDecision.status = 'APPROVED';
      await this.executeGovernanceDecision(decisionId);
    } else if (decision === 'REJECT') {
      governanceDecision.status = 'REJECTED';
    } else if (decision === 'ESCALATE') {
      // CRITICAL: Escalate to higher authority
      await this.escalateGovernanceDecision(decisionId, approverId);
    }

    // CRITICAL: Log approval
    this.auditLogger.logDataMutation({
      tenantId: 'system',
      actorId: approverId,
      action: 'GOVERNANCE_DECISION_APPROVED',
      resourceType: 'GOVERNANCE_DECISION',
      resourceId: decisionId,
      outcome: 'SUCCESS',
      correlationId: governanceDecision.correlationId,
      severity: 'HIGH',
      metadata: {
        governanceAction: governanceDecision.action,
        approvalDecision: decision,
        approverLevel,
        rationale
      }
    });

    logger.info('Governance decision approved', {
      decisionId,
      approverId,
      approverLevel,
      decision,
      newStatus: governanceDecision.status
    });
  }

  /**
   * CRITICAL: Grant emergency power
   */
  async grantEmergencyPower(
    level: EmergencyLevel,
    grantedTo: string,
    grantedBy: string,
    grantedByLevel: AuthorityLevel,
    scope: string[],
    actions: GovernanceAction[],
    duration: number, // in hours
    conditions: EmergencyCondition[],
    reviewRequired: boolean = true
  ): Promise<string> {
    const emergencyPowerId = this.generateEmergencyPowerId();
    const correlationId = this.generateCorrelationId();

    // CRITICAL: Check granter authority
    const authorityCheck = await this.checkAuthority(
      grantedBy,
      grantedByLevel,
      'EMERGENCY',
      'GLOBAL'
    );

    if (!authorityCheck.authorized) {
      throw new Error(`Granter ${grantedBy} not authorized to grant emergency powers`);
    }

    // CRITICAL: Create emergency power
    const emergencyPower: EmergencyPower = {
      id: emergencyPowerId,
      level,
      grantedTo,
      grantedBy,
      grantedAt: new Date(),
      expiresAt: new Date(Date.now() + (duration * 60 * 60 * 1000)),
      scope,
      actions,
      conditions,
      reviewRequired,
      autoExpire: true,
      auditTrail: [`Granted by ${grantedBy} at ${new Date().toISOString()}`]
    };

    // CRITICAL: Store emergency power
    this.emergencyPowers.set(emergencyPowerId, emergencyPower);
    this.activeEmergencyPowers.set(emergencyPowerId, emergencyPower);

    // CRITICAL: Log emergency power grant
    this.auditLogger.logSecurityEvent({
      tenantId: 'system',
      actorId: grantedBy,
      action: 'EMERGENCY_POWER_GRANTED',
      resourceType: 'EMERGENCY_POWER',
      resourceId: emergencyPowerId,
      outcome: 'SUCCESS',
      correlationId,
      severity: 'CRITICAL',
      metadata: {
        emergencyLevel: level,
        grantedTo,
        scope,
        actions,
        duration,
        conditions: conditions.length,
        reviewRequired
      }
    });

    logger.warn('Emergency power granted', {
      emergencyPowerId,
      level,
      grantedTo,
      grantedBy,
      scope,
      actions,
      expiresAt: emergencyPower.expiresAt
    });

    return emergencyPowerId;
  }

  /**
   * CRITICAL: Get governance decisions
   */
  getGovernanceDecisions(
    action?: GovernanceAction,
    actorId?: string,
    status?: string,
    limit?: number
  ): GovernanceDecision[] {
    let decisions = Array.from(this.governanceDecisions.values());

    // CRITICAL: Apply filters
    if (action) {
      decisions = decisions.filter(d => d.action === action);
    }
    if (actorId) {
      decisions = decisions.filter(d => d.actorId === actorId);
    }
    if (status) {
      decisions = decisions.filter(d => d.status === status);
    }

    // CRITICAL: Sort by timestamp (newest first)
    decisions = decisions.sort((a, b) => {
      const aTime = a.executedAt || new Date(0);
      const bTime = b.executedAt || new Date(0);
      return bTime.getTime() - aTime.getTime();
    });

    // CRITICAL: Apply limit
    if (limit) {
      decisions = decisions.slice(0, limit);
    }

    return decisions;
  }

  /**
   * CRITICAL: Execute governance decision
   */
  private async executeGovernanceDecision(decisionId: string): Promise<void> {
    const decision = this.governanceDecisions.get(decisionId);
    if (!decision) {
      throw new Error(`Governance decision ${decisionId} not found`);
    }

    decision.status = 'EXECUTED';
    decision.executedAt = new Date();

    // CRITICAL: Execute action based on type
    switch (decision.action) {
      case 'APPOINT':
        await this.executeAppointment(decision);
        break;
      case 'REMOVE':
        await this.executeRemoval(decision);
        break;
      case 'SUSPEND':
        await this.executeSuspension(decision);
        break;
      case 'POLICY_CHANGE':
        await this.executePolicyChange(decision);
        break;
      case 'SYSTEM_CONFIG':
        await this.executeSystemConfig(decision);
        break;
      default:
        logger.warn('Unknown governance action', { action: decision.action });
    }

    // CRITICAL: Log execution
    this.auditLogger.logDataMutation({
      tenantId: 'system',
      actorId: decision.actorId,
      action: 'GOVERNANCE_DECISION_EXECUTED',
      resourceType: 'GOVERNANCE_DECISION',
      resourceId: decisionId,
      outcome: 'SUCCESS',
      correlationId: decision.correlationId,
      severity: 'HIGH',
      metadata: {
        governanceAction: decision.action,
        targetId: decision.targetId,
        targetType: decision.targetType,
        executedAt: decision.executedAt
      }
    });

    logger.info('Governance decision executed', {
      decisionId,
      action: decision.action,
      executedAt: decision.executedAt
    });
  }

  /**
   * CRITICAL: Execute appointment
   */
  private async executeAppointment(decision: GovernanceDecision): Promise<void> {
    // CRITICAL: Implementation would depend on specific appointment logic
    logger.info('Executing appointment', {
      decisionId: decision.id,
      targetId: decision.targetId
    });
  }

  /**
   * CRITICAL: Execute removal
   */
  private async executeRemoval(decision: GovernanceDecision): Promise<void> {
    // CRITICAL: Implementation would depend on specific removal logic
    logger.info('Executing removal', {
      decisionId: decision.id,
      targetId: decision.targetId
    });
  }

  /**
   * CRITICAL: Execute suspension
   */
  private async executeSuspension(decision: GovernanceDecision): Promise<void> {
    // CRITICAL: Implementation would depend on specific suspension logic
    logger.info('Executing suspension', {
      decisionId: decision.id,
      targetId: decision.targetId
    });
  }

  /**
   * CRITICAL: Execute policy change
   */
  private async executePolicyChange(decision: GovernanceDecision): Promise<void> {
    // CRITICAL: Implementation would depend on specific policy change logic
    logger.info('Executing policy change', {
      decisionId: decision.id,
      targetId: decision.targetId
    });
  }

  /**
   * CRITICAL: Execute system config
   */
  private async executeSystemConfig(decision: GovernanceDecision): Promise<void> {
    // CRITICAL: Implementation would depend on specific system config logic
    logger.info('Executing system config', {
      decisionId: decision.id,
      targetId: decision.targetId
    });
  }

  /**
   * CRITICAL: Escalate governance decision
   */
  private async escalateGovernanceDecision(decisionId: string, escalatedBy: string): Promise<void> {
    const decision = this.governanceDecisions.get(decisionId);
    if (!decision) {
      throw new Error(`Governance decision ${decisionId} not found`);
    }

    // CRITICAL: Implementation would depend on specific escalation logic
    logger.warn('Governance decision escalated', {
      decisionId,
      escalatedBy
    });
  }

  /**
   * CRITICAL: Check separation of duties
   */
  private async checkSeparationOfDuties(actorId: string, role: AuthorityRole): Promise<AuthorityRestriction | null> {
    // CRITICAL: Implementation would check if actor holds conflicting roles
    // For now, return no violation
    return null;
  }

  /**
   * CRITICAL: Check permission conditions
   */
  private async checkPermissionConditions(
    conditions: PermissionCondition[],
    context: Record<string, any>
  ): Promise<Array<{ condition: PermissionCondition; met: boolean }>> {
    const results: Array<{ condition: PermissionCondition; met: boolean }> = [];

    for (const condition of conditions) {
      const met = this.evaluateCondition(condition, context);
      results.push({ condition, met });
    }

    return results;
  }

  /**
   * CRITICAL: Check restrictions
   */
  private async checkRestrictions(
    restrictions: AuthorityRestriction[],
    context: Record<string, any>
  ): Promise<Array<{ restriction: AuthorityRestriction; allowed: boolean }>> {
    const results: Array<{ restriction: AuthorityRestriction; allowed: boolean }> = [];

    for (const restriction of restrictions) {
      const violated = this.evaluateCondition(restriction.condition, context);
      results.push({ restriction, allowed: !violated });
    }

    return results;
  }

  /**
   * CRITICAL: Evaluate condition
   */
  private evaluateCondition(condition: PermissionCondition, context: Record<string, any>): boolean {
    // CRITICAL: Simplified condition evaluation
    // In production, this would be more sophisticated
    return true;
  }

  /**
   * CRITICAL: Check if restriction is applicable
   */
  private isRestrictionApplicable(restriction: AuthorityRestriction, action: GovernanceAction, scope: string): boolean {
    // CRITICAL: Simplified applicability check
    // In production, this would be more sophisticated
    return true;
  }

  /**
   * CRITICAL: Check scope compatibility
   */
  private isScopeCompatible(permissionScope: string, requestScope: string): boolean {
    // CRITICAL: Simplified scope compatibility check
    // In production, this would be more sophisticated
    return permissionScope === 'GLOBAL' || permissionScope === requestScope;
  }

  /**
   * CRITICAL: Get active emergency power
   */
  private getActiveEmergencyPower(actorId: string): EmergencyPower | null {
    for (const emergencyPower of this.activeEmergencyPowers.values()) {
      if (emergencyPower.grantedTo === actorId && emergencyPower.expiresAt > new Date()) {
        return emergencyPower;
      }
    }
    return null;
  }

  /**
   * CRITICAL: Get role by level
   */
  private getRoleByLevel(level: AuthorityLevel): AuthorityRole | null {
    for (const role of this.authorityRoles.values()) {
      if (role.level === level) {
        return role;
      }
    }
    return null;
  }

  /**
   * CRITICAL: Initialize authority roles
   */
  private initializeAuthorityRoles(): void {
    // CRITICAL: Founder role
    this.authorityRoles.set('founder', {
      id: 'founder',
      level: 'FOUNDER',
      title: 'Founder',
      description: 'Highest authority with full system control',
      permissions: [
        {
          id: 'founder-appoint',
          action: 'APPOINT',
          scope: 'GLOBAL',
          conditions: [],
          requiresApproval: false,
          auditLevel: 'CRITICAL',
          emergencyOverride: true
        },
        {
          id: 'founder-emergency',
          action: 'EMERGENCY',
          scope: 'GLOBAL',
          conditions: [],
          requiresApproval: false,
          auditLevel: 'CRITICAL',
          emergencyOverride: true
        }
      ],
      restrictions: [],
      appointmentRequirements: ['Board approval', 'Legal review'],
      removalRequirements: ['Board vote', 'Legal cause'],
      separationOfDuties: []
    });

    // CRITICAL: Executive role
    this.authorityRoles.set('executive', {
      id: 'executive',
      level: 'EXECUTIVE',
      title: 'Executive',
      description: 'Executive authority with operational control',
      permissions: [
        {
          id: 'executive-appoint',
          action: 'APPOINT',
          scope: 'TENANT',
          conditions: [],
          requiresApproval: true,
          approvalLevel: 'FOUNDER',
          auditLevel: 'HIGH',
          emergencyOverride: false
        },
        {
          id: 'executive-policy',
          action: 'POLICY_CHANGE',
          scope: 'TENANT',
          conditions: [],
          requiresApproval: false,
          auditLevel: 'HIGH',
          emergencyOverride: false
        }
      ],
      restrictions: [
        {
          id: 'executive-time',
          type: 'TIME',
          description: 'Cannot make critical decisions outside business hours',
          condition: {
            type: 'TIME',
            operator: 'IN',
            value: ['09:00-17:00'],
            description: 'Business hours only'
          },
          violationAction: 'REQUIRE_APPROVAL',
          severity: 'MEDIUM'
        }
      ],
      appointmentRequirements: ['Founder approval', 'Background check'],
      removalRequirements: ['Founder approval', 'Performance review'],
      separationOfDuties: ['admin']
    });

    // CRITICAL: Admin role
    this.authorityRoles.set('admin', {
      id: 'admin',
      level: 'ADMIN',
      title: 'Administrator',
      description: 'Administrative authority with system management',
      permissions: [
        {
          id: 'admin-system',
          action: 'SYSTEM_CONFIG',
          scope: 'TENANT',
          conditions: [],
          requiresApproval: false,
          auditLevel: 'MEDIUM',
          emergencyOverride: false
        },
        {
          id: 'admin-data',
          action: 'DATA_ACCESS',
          scope: 'TENANT',
          conditions: [],
          requiresApproval: true,
          approvalLevel: 'EXECUTIVE',
          auditLevel: 'HIGH',
          emergencyOverride: false
        }
      ],
      restrictions: [
        {
          id: 'admin-quota',
          type: 'QUOTA',
          description: 'Limited data access quota',
          condition: {
            type: 'QUOTA',
            operator: 'LT',
            value: 1000,
            description: 'Max 1000 records per day'
          },
          violationAction: 'BLOCK',
          severity: 'HIGH'
        }
      ],
      appointmentRequirements: ['Executive approval', 'Technical assessment'],
      removalRequirements: ['Executive approval', 'Policy violation'],
      separationOfDuties: ['executive']
    });

    // CRITICAL: System role
    this.authorityRoles.set('system', {
      id: 'system',
      level: 'SYSTEM',
      title: 'System',
      description: 'System-level authority for automated operations',
      permissions: [
        {
          id: 'system-compliance',
          action: 'COMPLIANCE_OVERRIDE',
          scope: 'SYSTEM',
          conditions: [],
          requiresApproval: false,
          auditLevel: 'CRITICAL',
          emergencyOverride: false
        }
      ],
      restrictions: [],
      appointmentRequirements: ['System initialization'],
      removalRequirements: ['System shutdown'],
      separationOfDuties: []
    });
  }

  /**
   * CRITICAL: Start emergency power monitoring
   */
  private startEmergencyPowerMonitoring(): void {
    // CRITICAL: Check for expired emergency powers every minute
    setInterval(() => {
      const now = new Date();
      let expiredCount = 0;

      for (const [id, emergencyPower] of this.activeEmergencyPowers.entries()) {
        if (emergencyPower.expiresAt <= now) {
          this.activeEmergencyPowers.delete(id);
          expiredCount++;

          // CRITICAL: Log expiration
          this.auditLogger.logSecurityEvent({
            tenantId: 'system',
            actorId: 'system',
            action: 'EMERGENCY_POWER_EXPIRED',
            resourceType: 'EMERGENCY_POWER',
            resourceId: id,
            outcome: 'SUCCESS',
            correlationId: this.generateCorrelationId(),
            severity: 'HIGH',
            metadata: {
              emergencyLevel: emergencyPower.level,
              grantedTo: emergencyPower.grantedTo,
              expiredAt: emergencyPower.expiresAt
            }
          });
        }
      }

      if (expiredCount > 0) {
        logger.info('Emergency powers expired', { expiredCount });
      }
    }, 60000); // Every minute
  }

  /**
   * CRITICAL: Generate correlation ID
   */
  private generateCorrelationId(): string {
    const bytes = crypto.randomBytes(8);
    return `corr_${bytes.toString('hex')}`;
  }

  /**
   * CRITICAL: Generate decision ID
   */
  private generateDecisionId(): string {
    const bytes = crypto.randomBytes(8);
    return `decision_${bytes.toString('hex')}`;
  }

  /**
   * CRITICAL: Generate approval ID
   */
  private generateApprovalId(): string {
    const bytes = crypto.randomBytes(8);
    return `approval_${bytes.toString('hex')}`;
  }

  /**
   * CRITICAL: Generate emergency power ID
   */
  private generateEmergencyPowerId(): string {
    const bytes = crypto.randomBytes(8);
    return `emergency_${bytes.toString('hex')}`;
  }
}

/**
 * CRITICAL: Global governance model manager instance
 */
export const governanceModelManager = GovernanceModelManager.getInstance();
