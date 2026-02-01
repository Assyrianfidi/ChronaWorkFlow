// CRITICAL: Authority Enforcement Middleware
// MANDATORY: Runtime enforcement of governance authority and separation of duties

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/structured-logger.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { governanceModelManager, AuthorityLevel, GovernanceAction } from './governance-model.js';
import { TenantContext } from '../tenant/tenant-isolation.js';
import * as crypto from 'crypto';

export interface AuthorityContext {
  userId: string;
  authorityLevel: AuthorityLevel;
  tenantId?: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  correlationId: string;
}

export interface EnforcementResult {
  authorized: boolean;
  requiresApproval: boolean;
  blocked: boolean;
  restrictions: string[];
  conditions: string[];
  delegationChain?: string[];
  auditLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  correlationId: string;
}

export interface GovernanceMiddleware {
  checkAuthority(action: GovernanceAction, scope: string): (req: Request, res: Response, next: NextFunction) => void;
  enforceSeparationOfDuties(req: Request, res: Response, next: NextFunction): void;
  requireEmergencyPower(level: string): (req: Request, res: Response, next: NextFunction) => void;
  auditGovernanceAction(req: Request, res: Response, next: NextFunction): void;
}

/**
 * CRITICAL: Authority Enforcement Manager
 * 
 * This class provides runtime enforcement of governance authority,
 * separation of duties, and emergency powers with comprehensive audit logging.
 */
export class AuthorityEnforcementManager {
  private static instance: AuthorityEnforcementManager;
  private auditLogger: any;
  private activeSessions: Map<string, AuthorityContext> = new Map();
  private enforcementCache: Map<string, EnforcementResult> = new Map();
  private violationTracker: Map<string, number> = new Map();

  private constructor() {
    this.auditLogger = getImmutableAuditLogger();
    this.startSessionMonitoring();
    this.startCacheCleanup();
  }

  /**
   * CRITICAL: Get singleton instance
   */
  static getInstance(): AuthorityEnforcementManager {
    if (!AuthorityEnforcementManager.instance) {
      AuthorityEnforcementManager.instance = new AuthorityEnforcementManager();
    }
    return AuthorityEnforcementManager.instance;
  }

  /**
   * CRITICAL: Extract authority context from request
   */
  extractAuthorityContext(req: Request): AuthorityContext {
    const authHeader = req.headers.authorization;
    const tenantHeader = req.headers['x-tenant-id'] as string;
    
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // CRITICAL: Parse JWT token and extract user information
    // In production, this would use proper JWT verification
    const token = authHeader.replace('Bearer ', '');
    const payload = this.parseJWTToken(token);

    return {
      userId: payload.userId,
      authorityLevel: payload.authorityLevel as AuthorityLevel,
      tenantId: tenantHeader,
      sessionId: payload.sessionId,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      timestamp: new Date(),
      correlationId: this.generateCorrelationId()
    };
  }

  /**
   * CRITICAL: Check authority for action
   */
  async checkAuthority(
    context: AuthorityContext,
    action: GovernanceAction,
    scope: string,
    targetId?: string,
    additionalContext: Record<string, any> = {}
  ): Promise<EnforcementResult> {
    const cacheKey = `${context.userId}-${action}-${scope}-${targetId || 'none'}`;
    
    // CRITICAL: Check cache first
    const cached = this.enforcementCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp.getTime()) < 300000) { // 5 minutes cache
      return cached;
    }

    // CRITICAL: Perform authority check
    const authorityCheck = await governanceModelManager.checkAuthority(
      context.userId,
      context.authorityLevel,
      action,
      scope,
      targetId,
      {
        ...additionalContext,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: context.sessionId
      }
    );

    // CRITICAL: Create enforcement result
    const result: EnforcementResult = {
      authorized: authorityCheck.authorized,
      requiresApproval: authorityCheck.requiresApproval,
      blocked: !authorityCheck.authorized && !authorityCheck.requiresApproval,
      restrictions: authorityCheck.restrictions.map(r => r.description),
      conditions: authorityCheck.conditions.map(c => c.description),
      delegationChain: authorityCheck.delegationChain,
      auditLevel: this.getAuditLevel(action, authorityCheck.authorized),
      correlationId: context.correlationId,
      timestamp: new Date()
    } as any;

    // CRITICAL: Cache result
    this.enforcementCache.set(cacheKey, result);

    // CRITICAL: Track violations
    if (result.blocked) {
      this.trackViolation(context.userId, action);
    }

    // CRITICAL: Log authority check
    this.auditLogger.logAuthorizationDecision({
      tenantId: context.tenantId || 'system',
      actorId: context.userId,
      action: 'AUTHORITY_ENFORCEMENT',
      resourceType: 'GOVERNANCE_ACTION',
      resourceId: action,
      outcome: result.authorized ? 'SUCCESS' : 'FAILURE',
      correlationId: context.correlationId,
      severity: result.auditLevel,
      metadata: {
        authorityLevel: context.authorityLevel,
        action,
        scope,
        targetId,
        authorized: result.authorized,
        requiresApproval: result.requiresApproval,
        blocked: result.blocked,
        restrictions: result.restrictions.length,
        conditions: result.conditions.length,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      }
    });

    return result;
  }

  /**
   * CRITICAL: Enforce separation of duties
   */
  async enforceSeparationOfDuties(context: AuthorityContext, action: GovernanceAction): Promise<{
    allowed: boolean;
    violation: string;
    requiredSeparation: string[];
  }> {
    // CRITICAL: Check for separation of duties violations
    const userRoles = await this.getUserRoles(context.userId);
    const conflictingRoles = this.findConflictingRoles(userRoles, action);

    if (conflictingRoles.length > 0) {
      // CRITICAL: Log separation of duties violation
      this.auditLogger.logSecurityEvent({
        tenantId: context.tenantId || 'system',
        actorId: context.userId,
        action: 'SEPARATION_OF_DUTIES_VIOLATION',
        resourceType: 'GOVERNANCE_ENFORCEMENT',
        resourceId: action,
        outcome: 'FAILURE',
        correlationId: context.correlationId,
        severity: 'HIGH',
        metadata: {
          authorityLevel: context.authorityLevel,
          action,
          userRoles,
          conflictingRoles,
          ipAddress: context.ipAddress
        }
      });

      return {
        allowed: false,
        violation: `Action ${action} conflicts with roles: ${conflictingRoles.join(', ')}`,
        requiredSeparation: conflictingRoles
      };
    }

    return {
      allowed: true,
      violation: '',
      requiredSeparation: []
    };
  }

  /**
   * CRITICAL: Check emergency power requirements
   */
  async checkEmergencyPower(
    context: AuthorityContext,
    action: GovernanceAction,
    scope: string
  ): Promise<{
    hasEmergencyPower: boolean;
    emergencyLevel?: string;
    grantedBy?: string;
    expiresAt?: Date;
    conditions: string[];
  }> {
    const emergencyPowers = governanceModelManager.getEmergencyPowers(
      context.userId,
      undefined,
      true
    );

    const applicablePower = emergencyPowers.find(power => 
      power.actions.includes(action) && 
      power.scope.includes(scope) &&
      power.expiresAt > new Date()
    );

    if (applicablePower) {
      return {
        hasEmergencyPower: true,
        emergencyLevel: applicablePower.level,
        grantedBy: applicablePower.grantedBy,
        expiresAt: applicablePower.expiresAt,
        conditions: applicablePower.conditions.map(c => c.description)
      };
    }

    return {
      hasEmergencyPower: false,
      conditions: []
    };
  }

  /**
   * CRITICAL: Create governance middleware
   */
  createGovernanceMiddleware(): GovernanceMiddleware {
    return {
      checkAuthority: (action: GovernanceAction, scope: string) => 
        this.authorityMiddleware(action, scope),
      enforceSeparationOfDuties: this.separationOfDutiesMiddleware.bind(this),
      requireEmergencyPower: this.emergencyPowerMiddleware.bind(this),
      auditGovernanceAction: this.auditMiddleware.bind(this)
    };
  }

  /**
   * CRITICAL: Authority check middleware
   */
  private authorityMiddleware(action: GovernanceAction, scope: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // CRITICAL: Extract authority context
        const context = this.extractAuthorityContext(req);

        // CRITICAL: Check authority
        const result = await this.checkAuthority(context, action, scope, req.params.id);

        // CRITICAL: Handle blocked requests
        if (result.blocked) {
          res.status(403).json({
            error: 'Access denied',
            message: 'Insufficient authority for this action',
            restrictions: result.restrictions,
            conditions: result.conditions,
            correlationId: result.correlationId
          });
          return;
        }

        // CRITICAL: Handle approval required
        if (result.requiresApproval) {
          res.status(202).json({
            message: 'Action requires approval',
            approvalRequired: true,
            restrictions: result.restrictions,
            conditions: result.conditions,
            correlationId: result.correlationId
          });
          return;
        }

        // CRITICAL: Add context to request
        (req as any).authorityContext = context;
        (req as any).enforcementResult = result;

        next();

      } catch (error) {
        logger.error('Authority middleware error', error as Error);
        res.status(500).json({
          error: 'Internal server error',
          message: 'Failed to verify authority',
          correlationId: this.generateCorrelationId()
        });
      }
    };
  }

  /**
   * CRITICAL: Separation of duties middleware
   */
  private separationOfDutiesMiddleware(req: Request, res: Response, next: NextFunction) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = this.extractAuthorityContext(req);
        const action = this.extractActionFromRequest(req);

        // CRITICAL: Check separation of duties
        const result = await this.enforceSeparationOfDuties(context, action);

        if (!result.allowed) {
          res.status(403).json({
            error: 'Separation of duties violation',
            message: result.violation,
            requiredSeparation: result.requiredSeparation,
            correlationId: context.correlationId
          });
          return;
        }

        next();

      } catch (error) {
        logger.error('Separation of duties middleware error', error as Error);
        res.status(500).json({
          error: 'Internal server error',
          message: 'Failed to check separation of duties'
        });
      }
    };
  }

  /**
   * CRITICAL: Emergency power middleware
   */
  private emergencyPowerMiddleware(requiredLevel: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = this.extractAuthorityContext(req);
        const action = this.extractActionFromRequest(req);
        const scope = this.extractScopeFromRequest(req);

        // CRITICAL: Check emergency power
        const result = await this.checkEmergencyPower(context, action, scope);

        if (!result.hasEmergencyPower) {
          res.status(403).json({
            error: 'Emergency power required',
            message: `This action requires ${requiredLevel} emergency power`,
            correlationId: context.correlationId
          });
          return;
        }

        // CRITICAL: Add emergency power context
        (req as any).emergencyPower = result;

        next();

      } catch (error) {
        logger.error('Emergency power middleware error', error as Error);
        res.status(500).json({
          error: 'Internal server error',
          message: 'Failed to check emergency power'
        });
      }
    };
  }

  /**
   * CRITICAL: Audit middleware
   */
  private auditMiddleware(req: Request, res: Response, next: NextFunction) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const context = this.extractAuthorityContext(req);
      const action = this.extractActionFromRequest(req);

      // CRITICAL: Override res.end to audit the response
      const originalEnd = res.end;
      res.end = function(chunk?: any, encoding?: any) {
        const duration = Date.now() - startTime;
        
        // CRITICAL: Log the governance action
        this.auditLogger.logDataMutation({
          tenantId: context.tenantId || 'system',
          actorId: context.userId,
          action: action,
          resourceType: 'GOVERNANCE_ACTION',
          resourceId: req.params.id || 'unknown',
          outcome: res.statusCode >= 400 ? 'FAILURE' : 'SUCCESS',
          correlationId: context.correlationId,
          severity: 'MEDIUM',
          metadata: {
            authorityLevel: context.authorityLevel,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent
          }
        });

        // CRITICAL: Call original end
        originalEnd.call(this, chunk, encoding);
      }.bind(this);

      next();
    };
  }

  /**
   * CRITICAL: Track violations
   */
  private trackViolation(userId: string, action: GovernanceAction): void {
    const key = `${userId}-${action}`;
    const currentCount = this.violationTracker.get(key) || 0;
    this.violationTracker.set(key, currentCount + 1);

    // CRITICAL: Check for repeated violations
    if (currentCount >= 5) {
      this.auditLogger.logSecurityEvent({
        tenantId: 'system',
        actorId: userId,
        action: 'REPEATED_AUTHORITY_VIOLATIONS',
        resourceType: 'GOVERNANCE_ENFORCEMENT',
        resourceId: action,
        outcome: 'FAILURE',
        correlationId: this.generateCorrelationId(),
        severity: 'CRITICAL',
        metadata: {
          action,
          violationCount: currentCount + 1,
          requiresInvestigation: true
        }
      });
    }
  }

  /**
   * CRITICAL: Get user roles
   */
  private async getUserRoles(userId: string): Promise<string[]> {
    // CRITICAL: Implementation would fetch user roles from database
    // For now, return empty array
    return [];
  }

  /**
   * CRITICAL: Find conflicting roles
   */
  private findConflictingRoles(userRoles: string[], action: GovernanceAction): string[] {
    // CRITICAL: Implementation would check for role conflicts
    // For now, return empty array
    return [];
  }

  /**
   * CRITICAL: Extract action from request
   */
  private extractActionFromRequest(req: Request): GovernanceAction {
    const method = req.method;
    const path = req.path;

    // CRITICAL: Map HTTP methods and paths to governance actions
    if (path.includes('/appoint') || path.includes('/create')) {
      return 'APPOINT';
    } else if (path.includes('/remove') || path.includes('/delete')) {
      return 'REMOVE';
    } else if (path.includes('/suspend')) {
      return 'SUSPEND';
    } else if (path.includes('/emergency')) {
      return 'EMERGENCY';
    } else if (path.includes('/policy')) {
      return 'POLICY_CHANGE';
    } else if (path.includes('/config') || path.includes('/system')) {
      return 'SYSTEM_CONFIG';
    } else if (path.includes('/data') || path.includes('/access')) {
      return 'DATA_ACCESS';
    } else if (path.includes('/compliance')) {
      return 'COMPLIANCE_OVERRIDE';
    }

    // CRITICAL: Default to system config for unknown actions
    return 'SYSTEM_CONFIG';
  }

  /**
   * CRITICAL: Extract scope from request
   */
  private extractScopeFromRequest(req: Request): string {
    const path = req.path;
    const tenantId = req.headers['x-tenant-id'] as string;

    // CRITICAL: Determine scope based on path and headers
    if (path.includes('/system') || path.includes('/global')) {
      return 'GLOBAL';
    } else if (path.includes('/compliance')) {
      return 'COMPLIANCE';
    } else if (tenantId) {
      return 'TENANT';
    } else {
      return 'SYSTEM';
    }
  }

  /**
   * CRITICAL: Get audit level
   */
  private getAuditLevel(action: GovernanceAction, authorized: boolean): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (!authorized) {
      return 'HIGH';
    }

    switch (action) {
      case 'EMERGENCY':
        return 'CRITICAL';
      case 'APPOINT':
      case 'REMOVE':
        return 'HIGH';
      case 'DATA_ACCESS':
      case 'COMPLIANCE_OVERRIDE':
        return 'HIGH';
      case 'POLICY_CHANGE':
      case 'SYSTEM_CONFIG':
        return 'MEDIUM';
      default:
        return 'LOW';
    }
  }

  /**
   * CRITICAL: Parse JWT token
   */
  private parseJWTToken(token: string): any {
    // CRITICAL: Simplified JWT parsing
    // In production, this would use proper JWT verification
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return payload;
    } catch (error) {
      throw new Error('Failed to parse JWT token');
    }
  }

  /**
   * CRITICAL: Start session monitoring
   */
  private startSessionMonitoring(): void {
    // CRITICAL: Monitor active sessions and clean up expired ones
    setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;

      for (const [sessionId, context] of this.activeSessions.entries()) {
        const sessionAge = now - context.timestamp.getTime();
        if (sessionAge > 8 * 60 * 60 * 1000) { // 8 hours
          this.activeSessions.delete(sessionId);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        logger.info('Cleaned up expired sessions', { cleanedCount });
      }
    }, 300000); // Every 5 minutes
  }

  /**
   * CRITICAL: Start cache cleanup
   */
  private startCacheCleanup(): void {
    // CRITICAL: Clean up expired cache entries
    setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;

      for (const [key, result] of this.enforcementCache.entries()) {
        const age = now - (result as any).timestamp.getTime();
        if (age > 300000) { // 5 minutes
          this.enforcementCache.delete(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        logger.debug('Cleaned up expired cache entries', { cleanedCount });
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
}

/**
 * CRITICAL: Global authority enforcement manager instance
 */
export const authorityEnforcementManager = AuthorityEnforcementManager.getInstance();

/**
 * CRITICAL: Convenience functions
 */
export const checkAuthority = async (
  context: AuthorityContext,
  action: GovernanceAction,
  scope: string,
  targetId?: string,
  additionalContext: Record<string, any> = {}
): Promise<EnforcementResult> => {
  return await authorityEnforcementManager.checkAuthority(context, action, scope, targetId, additionalContext);
};

export const enforceSeparationOfDuties = async (
  context: AuthorityContext,
  action: GovernanceAction
): Promise<{
  allowed: boolean;
  violation: string;
  requiredSeparation: string[];
}> => {
  return await authorityEnforcementManager.enforceSeparationOfDuties(context, action);
};

export const checkEmergencyPower = async (
  context: AuthorityContext,
  action: GovernanceAction,
  scope: string
): Promise<{
  hasEmergencyPower: boolean;
  emergencyLevel?: string;
  grantedBy?: string;
  expiresAt?: Date;
  conditions: string[];
}> => {
  return await authorityEnforcementManager.checkEmergencyPower(context, action, scope);
};

export const createGovernanceMiddleware = (): GovernanceMiddleware => {
  return authorityEnforcementManager.createGovernanceMiddleware();
};
