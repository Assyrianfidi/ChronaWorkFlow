// CRITICAL: Audit Immutability Enforcement
// MANDATORY: Immutable audit logs with cryptographic integrity verification

import { logger } from '../utils/structured-logger.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { TenantContext } from '../tenant/tenant-isolation.js';
import crypto from 'crypto';

export type AuditEventType = 'AUTHENTICATION' | 'AUTHORIZATION' | 'DATA_MUTATION' | 'SECURITY' | 'SYSTEM';
export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuditEvent {
  id: string;
  tenantId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  outcome: 'SUCCESS' | 'FAILURE';
  timestamp: Date;
  correlationId: string;
  severity: AuditSeverity;
  metadata: Record<string, any>;
  previousHash?: string;
  currentHash: string;
  sequence: number;
  immutable: boolean;
}

export interface AuditChain {
  events: AuditEvent[];
  headHash: string;
  tailHash: string;
  totalEvents: number;
  createdAt: Date;
  lastModified: Date;
  integrityVerified: boolean;
  lastVerification: Date;
}

export interface ImmutabilityViolation {
  id: string;
  timestamp: Date;
  type: 'HASH_MISMATCH' | 'SEQUENCE_BREAK' | 'EVENT_MODIFICATION' | 'CHAIN_BREAK';
  severity: 'HIGH' | 'CRITICAL';
  description: string;
  eventId: string;
  expectedValue: string;
  actualValue: string;
  metadata: Record<string, any>;
}

/**
 * CRITICAL: Audit Immutability Manager
 * 
 * This class enforces immutable audit logs with cryptographic integrity
 * verification and comprehensive violation detection.
 */
export class AuditImmutabilityManager {
  private static instance: AuditImmutabilityManager;
  private auditLogger: any;
  private auditChains: Map<string, AuditChain> = new Map();
  private violations: ImmutabilityViolation[] = [];
  private verificationInterval!: NodeJS.Timeout;
  private appendQueues: Map<string, Promise<void>> = new Map();

  private constructor() {
    this.auditLogger = getImmutableAuditLogger();
    this.startImmutabilityMonitoring();
  }

  /**
   * CRITICAL: Get singleton instance
   */
  static getInstance(): AuditImmutabilityManager {
    if (!AuditImmutabilityManager.instance) {
      AuditImmutabilityManager.instance = new AuditImmutabilityManager();
    }
    return AuditImmutabilityManager.instance;
  }

  /**
   * CRITICAL: Add audit event with immutability protection
   */
  async addAuditEvent(event: Omit<AuditEvent, 'id' | 'previousHash' | 'currentHash' | 'sequence' | 'immutable'>): Promise<AuditEvent> {
    const tenantId = event.tenantId;
    const chainKey = this.getChainKey(tenantId);

    if (!tenantId) {
      throw new Error('tenantId is required');
    }
    if (!event.actorId) {
      throw new Error('actorId is required');
    }
    if (!event.action) {
      throw new Error('action is required');
    }
    if (!event.resourceType) {
      throw new Error('resourceType is required');
    }
    if (!event.resourceId) {
      throw new Error('resourceId is required');
    }
    if (!event.correlationId) {
      throw new Error('correlationId is required');
    }
    if (!(event.timestamp instanceof Date) || Number.isNaN(event.timestamp.getTime())) {
      throw new Error('timestamp is required');
    }

    const previous = this.appendQueues.get(chainKey) ?? Promise.resolve();

    const appendPromise = (async () => {
      await previous;
      // CRITICAL: Get or create audit chain
      let chain = this.auditChains.get(chainKey);
      if (!chain) {
        chain = await this.createAuditChain(tenantId);
        this.auditChains.set(chainKey, chain);
      }

      // CRITICAL: Calculate sequence number
      const sequence = chain.totalEvents + 1;
      const previousHash = chain.totalEvents > 0 ? chain.tailHash : undefined;

      // CRITICAL: Create immutable audit event
      const immutableEvent: AuditEvent = {
        ...event,
        id: this.generateEventId(),
        sequence,
        previousHash,
        currentHash: '',
        immutable: true
      };

      // CRITICAL: Calculate current hash
      immutableEvent.currentHash = this.calculateEventHash(immutableEvent);

      // CRITICAL: Validate event immutability
      await this.validateEventImmutability(immutableEvent, chain);

      // CRITICAL: Add to chain
      chain.events.push(immutableEvent);
      chain.tailHash = immutableEvent.currentHash;
      chain.totalEvents++;
      chain.lastModified = new Date();

      // CRITICAL: Update head hash
      chain.headHash = this.calculateChainHash(chain);

      // CRITICAL: Store chain
      this.auditChains.set(chainKey, chain);

      // CRITICAL: Log event addition
      this.auditLogger.logAuthorizationDecision({
        tenantId,
        actorId: event.actorId,
        action: 'AUDIT_EVENT_ADDED',
        resourceType: 'AUDIT_CHAIN',
        resourceId: immutableEvent.id,
        outcome: 'SUCCESS',
        correlationId: event.correlationId,
        severity: event.severity,
        metadata: {
          originalAction: event.action,
          sequence,
          hash: immutableEvent.currentHash,
          chainSize: chain.totalEvents
        }
      });

      logger.debug('Audit event added to immutable chain', {
        eventId: immutableEvent.id,
        tenantId,
        action: event.action,
        sequence,
        chainSize: chain.totalEvents
      });

      return immutableEvent;
    })();

    this.appendQueues.set(chainKey, appendPromise.then(() => undefined, () => undefined));

    return appendPromise;
  }

  /**
   * CRITICAL: Get audit chain
   */
  getAuditChain(tenantId: string): AuditChain | null {
    const chainKey = this.getChainKey(tenantId);
    return this.auditChains.get(chainKey) || null;
  }

  /**
   * CRITICAL: Get audit events
   */
  getAuditEvents(
    tenantId: string,
    limit?: number,
    offset?: number
  ): AuditEvent[] {
    const chain = this.getAuditChain(tenantId);
    if (!chain) {
      return [];
    }

    let events = chain.events;
    
    if (offset) {
      events = events.slice(offset);
    }
    
    if (limit) {
      events = events.slice(0, limit);
    }

    return events;
  }

  resetForTests(): void {
    this.auditChains.clear();
    this.violations = [];
    this.appendQueues.clear();
  }

  /**
   * CRITICAL: Verify audit chain integrity
   */
  async verifyAuditChainIntegrity(tenantId: string): Promise<{
    valid: boolean;
    violations: ImmutabilityViolation[];
    chainHash: string;
    verifiedAt: Date;
  }> {
    const chain = this.getAuditChain(tenantId);
    if (!chain) {
      return {
        valid: false,
        violations: [{
          id: this.generateViolationId(),
        timestamp: new Date(),
        type: 'CHAIN_BREAK',
        severity: 'CRITICAL',
        description: `Audit chain not found for tenant ${tenantId}`,
        eventId: '',
        expectedValue: 'existing_chain',
        actualValue: 'no_chain',
        metadata: { tenantId }
        }],
        chainHash: '',
        verifiedAt: new Date()
      };
    }

    const violations: ImmutabilityViolation[] = [];
    let isValid = true;

    // CRITICAL: Verify chain structure
    if (chain.events.length === 0) {
      violations.push({
        id: this.generateViolationId(),
        timestamp: new Date(),
        type: 'CHAIN_BREAK',
        severity: 'CRITICAL',
        description: 'Empty audit chain',
        eventId: '',
        expectedValue: 'non_empty_chain',
        actualValue: 'empty_chain',
        metadata: { tenantId }
      });
      isValid = false;
    }

    // CRITICAL: Verify sequence continuity
    for (let i = 0; i < chain.events.length; i++) {
      const event = chain.events[i];
      
      if (event.sequence !== i + 1) {
        violations.push({
          id: this.generateViolationId(),
          timestamp: new Date(),
          type: 'SEQUENCE_BREAK',
          severity: 'HIGH',
          description: `Sequence break at position ${i}`,
          eventId: event.id,
          expectedValue: `${i + 1}`,
          actualValue: `${event.sequence}`,
          metadata: { tenantId, position: i }
        });
        isValid = false;
      }

      // CRITICAL: Verify hash continuity
      if (i > 0) {
        const previousEvent = chain.events[i - 1];
        if (event.previousHash !== previousEvent.currentHash) {
          violations.push({
            id: this.generateViolationId(),
            timestamp: new Date(),
            type: 'HASH_MISMATCH',
            severity: 'CRITICAL',
            description: `Hash mismatch at position ${i}`,
            eventId: event.id,
            expectedValue: previousEvent.currentHash,
            actualValue: event.previousHash ?? '',
            metadata: { tenantId, position: i }
          });
          isValid = false;
        }
      }

      // CRITICAL: Verify current hash
      const calculatedHash = this.calculateEventHash(event);
      if (event.currentHash !== calculatedHash) {
        violations.push({
          id: this.generateViolationId(),
          timestamp: new Date(),
          type: 'HASH_MISMATCH',
          severity: 'CRITICAL',
          description: `Current hash mismatch at position ${i}`,
          eventId: event.id,
          expectedValue: calculatedHash,
          actualValue: event.currentHash,
          metadata: { tenantId, position: i }
        });
        isValid = false;
      }
    }

    // CRITICAL: Verify chain hash
    const calculatedChainHash = this.calculateChainHash(chain);
    if (chain.headHash !== calculatedChainHash) {
      violations.push({
        id: this.generateViolationId(),
        timestamp: new Date(),
        type: 'CHAIN_BREAK',
        severity: 'CRITICAL',
        description: 'Chain head hash mismatch',
        eventId: '',
        expectedValue: calculatedChainHash,
        actualValue: chain.headHash,
        metadata: { tenantId }
      });
      isValid = false;
    }

    // CRITICAL: Update chain verification status
    chain.integrityVerified = isValid;
    chain.lastVerification = new Date();

    // CRITICAL: Store violations
    this.violations.push(...violations);

    // CRITICAL: Log verification results
    if (!isValid) {
      this.auditLogger.logSecurityEvent({
        tenantId,
        actorId: 'immutability-system',
        action: 'AUDIT_INTEGRITY_VIOLATION',
        resourceType: 'AUDIT_CHAIN',
        resourceId: tenantId,
        outcome: 'FAILURE',
        correlationId: `integrity_violation_${tenantId}_${Date.now()}`,
        severity: 'CRITICAL',
        metadata: {
          violations: violations.length,
          chainSize: chain.totalEvents,
          chainHash: calculatedChainHash
        }
      });

      logger.error(
        'Audit chain integrity violations detected',
        new Error('AUDIT_INTEGRITY_VIOLATIONS'),
        {
          tenantId,
          violations: violations.length,
          chainSize: chain.totalEvents
        }
      );
    } else {
      this.auditLogger.logSecurityEvent({
        tenantId,
        actorId: 'immutability-system',
        action: 'AUDIT_INTEGRITY_VERIFIED',
        resourceType: 'AUDIT_CHAIN',
        resourceId: tenantId,
        outcome: 'SUCCESS',
        correlationId: `integrity_verified_${tenantId}_${Date.now()}`,
        severity: 'LOW',
        metadata: {
          chainSize: chain.totalEvents,
          chainHash: calculatedChainHash
        }
      });

      logger.info('Audit chain integrity verified', {
        tenantId,
        chainSize: chain.totalEvents
      });
    }

    return {
      valid: isValid,
      violations,
      chainHash: calculatedChainHash,
      verifiedAt: new Date()
    };
  }

  /**
   * CRITICAL: Get immutability violations
   */
  getImmutabilityViolations(
    tenantId?: string,
    type?: string,
    severity?: string,
    limit?: number
  ): ImmutabilityViolation[] {
    let violations = this.violations;

    // CRITICAL: Filter violations
    if (tenantId) {
      violations = violations.filter(v => 
        v.metadata.tenantId === tenantId || v.metadata.tenantId === 'system'
      );
    }

    if (type) {
      violations = violations.filter(v => v.type === type);
    }

    if (severity) {
      violations = violations.filter(v => v.severity === severity);
    }

    if (limit) {
      violations = violations.slice(0, limit);
    }

    return violations;
  }

  /**
   * CRITICAL: Clear immutability violations
   */
  clearImmutabilityViolations(tenantId?: string): number {
    let clearedCount = 0;
    
    if (tenantId) {
      const originalCount = this.violations.length;
      this.violations = this.violations.filter(v => 
        v.metadata.tenantId !== tenantId && v.metadata.tenantId !== 'system'
      );
      clearedCount = originalCount - this.violations.length;
    } else {
      clearedCount = this.violations.length;
      this.violations = [];
    }

    if (clearedCount > 0) {
      logger.info('Cleared immutability violations', { clearedCount, tenantId });
    }

    return clearedCount;
  }

  /**
   * CRITICAL: Create audit chain
   */
  private async createAuditChain(tenantId: string): Promise<AuditChain> {
    const chain: AuditChain = {
      events: [],
      headHash: '',
      tailHash: '',
      totalEvents: 0,
      createdAt: new Date(),
      lastModified: new Date(),
      integrityVerified: false,
      lastVerification: new Date()
    };

    // CRITICAL: Calculate initial hash
    chain.headHash = this.calculateChainHash(chain);

    // CRITICAL: Store chain
    this.auditChains.set(this.getChainKey(tenantId), chain);

    // CRITICAL: Log chain creation
    this.auditLogger.logSecurityEvent({
      tenantId,
      actorId: 'immutability-system',
      action: 'AUDIT_CHAIN_CREATED',
      resourceType: 'AUDIT_CHAIN',
      resourceId: tenantId,
      outcome: 'SUCCESS',
      correlationId: `chain_created_${tenantId}_${Date.now()}`,
      severity: 'LOW',
      metadata: {
        chainHash: chain.headHash,
        createdAt: chain.createdAt
      }
    });

    logger.info('Audit chain created', {
      tenantId,
      chainHash: chain.headHash
    });

    return chain;
  }

  /**
   * CRITICAL: Validate event immutability
   */
  private async validateEventImmutability(event: AuditEvent, chain: AuditChain): Promise<void> {
    // CRITICAL: Check if event already exists
    const existingEvent = chain.events.find(e => e.id === event.id);
    if (existingEvent) {
      throw new Error(`Audit event ${event.id} already exists in chain`);
    }

    // CRITICAL: Verify sequence
    if (event.sequence !== chain.totalEvents + 1) {
      throw new Error(`Invalid sequence number for event ${event.id}: expected ${chain.totalEvents + 1}, got ${event.sequence}`);
    }

    // CRITICAL: Verify previous hash
    if (chain.totalEvents > 0 && event.previousHash !== chain.tailHash) {
      throw new Error(`Previous hash mismatch for event ${event.id}: expected ${chain.tailHash}, got ${event.previousHash}`);
    }

    // CRITICAL: Verify immutability flag
    if (!event.immutable) {
      throw new Error(`Event ${event.id} is not marked as immutable`);
    }
  }

  /**
   * CRITICAL: Calculate event hash
   */
  private calculateEventHash(event: AuditEvent): string {
    const eventString = JSON.stringify({
      id: event.id,
      tenantId: event.tenantId,
      actorId: event.actorId,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      outcome: event.outcome,
      timestamp: event.timestamp.toISOString(),
      correlationId: event.correlationId,
      severity: event.severity,
      metadata: event.metadata,
      previousHash: event.previousHash,
      sequence: event.sequence,
      immutable: event.immutable
    });

    return crypto.createHash('sha256').update(eventString).digest('hex');
  }

  /**
   * CRITICAL: Calculate chain hash
   */
  private calculateChainHash(chain: AuditChain): string {
    // CRITICAL: Create chain string for hashing
    const chainString = JSON.stringify({
      tailHash: chain.tailHash,
      totalEvents: chain.totalEvents,
      createdAt: chain.createdAt.toISOString(),
      events: chain.events.map(event => ({
        id: event.id,
        hash: event.currentHash,
        sequence: event.sequence
      }))
    });

    return crypto.createHash('sha256').update(chainString).digest('hex');
  }

  /**
   * CRITICAL: Get chain key
   */
  private getChainKey(tenantId: string): string {
    return `audit_chain_${tenantId}`;
  }

  /**
   * CRITICAL: Generate event ID
   */
  private generateEventId(): string {
    const bytes = crypto.randomBytes(8);
    return `event_${bytes.toString('hex')}`;
  }

  /**
   * CRITICAL: Generate violation ID
   */
  private generateViolationId(): string {
    const bytes = crypto.randomBytes(8);
    return `violation_${bytes.toString('hex')}`;
  }

  /**
   * Start immutability monitoring
   */
  private startImmutabilityMonitoring(): void {
    // CRITICAL: Periodic integrity verification
    this.verificationInterval = setInterval(async () => {
      const chains = Array.from(this.auditChains.keys());
      
      for (const chainKey of chains) {
        const tenantId = chainKey.replace('audit_chain_', '');
        try {
          await this.verifyAuditChainIntegrity(tenantId);
        } catch (error) {
          logger.error('Failed to verify audit chain integrity', error as Error, { tenantId });
        }
      }
    }, 300000); // Every 5 minutes

    // CRITICAL: Periodic cleanup of old violations
    setInterval(() => {
      this.cleanupOldViolations();
    }, 3600000); // Every hour
  }

  /**
   * Cleanup old violations
   */
  private cleanupOldViolations(): void {
    const cutoffTime = new Date();
    cutoffTime.setMonth(cutoffTime.getMonth() - 1); // 1 month ago

    const originalCount = this.violations.length;
    this.violations = this.violations.filter(v => v.timestamp > cutoffTime);
    const cleanedCount = originalCount - this.violations.length;

    if (cleanedCount > 0) {
      logger.info('Cleaned up old immutability violations', { cleanedCount });
    }
  }

  /**
   * Stop immutability monitoring
   */
  stopImmutabilityMonitoring(): void {
    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
    }
  }
}

/**
 * CRITICAL: Global audit immutability manager instance
 */
export const auditImmutabilityManager = AuditImmutabilityManager.getInstance();

/**
 * CRITICAL: Convenience functions
 */
export const addAuditEvent = async (
  event: Omit<AuditEvent, 'previousHash' | 'currentHash' | 'sequence' | 'immutable'>
): Promise<AuditEvent> => {
  return await auditImmutabilityManager.addAuditEvent(event);
};

export const verifyAuditChainIntegrity = async (
  tenantId: string
): Promise<{
  valid: boolean;
  violations: ImmutabilityViolation[];
  chainHash: string;
  verifiedAt: Date;
}> => {
  return await auditImmutabilityManager.verifyAuditChainIntegrity(tenantId);
};

export const getAuditChain = (tenantId: string): AuditChain | null => {
  return auditImmutabilityManager.getAuditChain(tenantId);
};

export const getAuditEvents = (
  tenantId: string,
  limit?: number,
  offset?: number
): AuditEvent[] => {
  return auditImmutabilityManager.getAuditEvents(tenantId, limit, offset);
};

export const getImmutabilityViolations = (
  tenantId?: string,
  type?: string,
  severity?: string,
  limit?: number
): ImmutabilityViolation[] => {
  return auditImmutabilityManager.getImmutabilityViolations(tenantId, type, severity, limit);
};

export const clearImmutabilityViolations = (tenantId?: string): number => {
  return auditImmutabilityManager.clearImmutabilityViolations(tenantId);
};
