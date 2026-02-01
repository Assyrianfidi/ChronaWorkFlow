// CRITICAL: Immutable Governance Decision Ledger
// MANDATORY: Cryptographically secure, immutable governance decision tracking

import { logger } from '../utils/structured-logger.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { GovernanceDecision, GovernanceApproval, EmergencyPower } from './governance-model.js';
import * as crypto from 'crypto';

export interface LedgerEntry {
  id: string;
  type: 'DECISION' | 'APPROVAL' | 'EMERGENCY_POWER' | 'REVOCATION' | 'REVIEW';
  sequence: number;
  timestamp: Date;
  data: any;
  hash: string;
  previousHash: string;
  signature: string;
  immutable: boolean;
  verified: boolean;
}

export interface LedgerChain {
  entries: LedgerEntry[];
  snapshots: LedgerSnapshot[];
  headHash: string;
  totalEntries: number;
  lastVerified: Date;
  integrityVerified: boolean;
}

export interface LedgerVerification {
  valid: boolean;
  violations: Array<{
    entryId: string;
    type: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>;
  chainHash: string;
  verifiedAt: Date;
  totalEntries: number;
}

export interface LedgerSnapshot {
  id: string;
  timestamp: Date;
  entryCount: number;
  headHash: string;
  compressed: boolean;
  checksum: string;
  retention: Date;
}

/**
 * CRITICAL: Governance Ledger Manager
 * 
 * This class implements an immutable, cryptographically secure ledger for
 * tracking all governance decisions, approvals, and emergency powers.
 */
export class GovernanceLedgerManager {
  private static instance: GovernanceLedgerManager;
  private auditLogger: any;
  private ledgerChain: LedgerChain = {
    headHash: '',
    totalEntries: 0,
    entries: [],
    snapshots: [],
    lastVerified: new Date(),
    integrityVerified: true
  };
  private snapshots: Map<string, LedgerSnapshot> = new Map();
  private verificationInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.auditLogger = getImmutableAuditLogger();
    this.initializeLedger();
    this.startPeriodicVerification();
  }

  /**
   * CRITICAL: Get singleton instance
   */
  static getInstance(): GovernanceLedgerManager {
    if (!GovernanceLedgerManager.instance) {
      GovernanceLedgerManager.instance = new GovernanceLedgerManager();
    }
    return GovernanceLedgerManager.instance;
  }

  /**
   * CRITICAL: Add governance decision to ledger
   */
  async addGovernanceDecision(decision: GovernanceDecision): Promise<string> {
    const entryId = this.generateEntryId();
    const sequence = this.ledgerChain.totalEntries + 1;
    const timestamp = new Date();

    // CRITICAL: Create ledger entry
    const entry: LedgerEntry = {
      id: entryId,
      type: 'DECISION',
      sequence,
      timestamp,
      data: this.sanitizeDecisionData(decision),
      hash: '',
      previousHash: this.ledgerChain.headHash,
      signature: '',
      immutable: true,
      verified: false
    };

    // CRITICAL: Calculate hash
    entry.hash = this.calculateEntryHash(entry);

    // CRITICAL: Sign entry
    entry.signature = await this.signEntry(entry);

    // CRITICAL: Add to chain
    this.ledgerChain.entries.push(entry);
    this.ledgerChain.headHash = entry.hash;
    this.ledgerChain.totalEntries = sequence;

    // CRITICAL: Verify chain integrity
    this.ledgerChain.integrityVerified = await this.verifyChainIntegrity();

    // CRITICAL: Log ledger addition
    this.auditLogger.logDataMutation({
      tenantId: 'system',
      actorId: 'ledger-system',
      action: 'GOVERNANCE_DECISION_RECORDED',
      resourceType: 'GOVERNANCE_LEDGER',
      resourceId: entryId,
      outcome: 'SUCCESS',
      correlationId: this.generateCorrelationId(),
      severity: 'HIGH',
      metadata: {
        decisionId: decision.id,
        action: decision.action,
        actorId: decision.actorId,
        actorLevel: decision.actorLevel,
        sequence,
        entryHash: entry.hash,
        previousHash: entry.previousHash
      }
    });

    logger.info('Governance decision added to ledger', {
      entryId,
      decisionId: decision.id,
      action: decision.action,
      sequence,
      hash: entry.hash
    });

    return entryId;
  }

  /**
   * CRITICAL: Add approval to ledger
   */
  async addApproval(decisionId: string, approval: GovernanceApproval): Promise<string> {
    const entryId = this.generateEntryId();
    const sequence = this.ledgerChain.totalEntries + 1;
    const timestamp = new Date();

    // CRITICAL: Create ledger entry
    const entry: LedgerEntry = {
      id: entryId,
      type: 'APPROVAL',
      sequence,
      timestamp,
      data: {
        decisionId,
        approval: this.sanitizeApprovalData(approval)
      },
      hash: '',
      previousHash: this.ledgerChain.headHash,
      signature: '',
      immutable: true,
      verified: false
    };

    // CRITICAL: Calculate hash
    entry.hash = this.calculateEntryHash(entry);

    // CRITICAL: Sign entry
    entry.signature = await this.signEntry(entry);

    // CRITICAL: Add to chain
    this.ledgerChain.entries.push(entry);
    this.ledgerChain.headHash = entry.hash;
    this.ledgerChain.totalEntries = sequence;

    // CRITICAL: Verify chain integrity
    this.ledgerChain.integrityVerified = await this.verifyChainIntegrity();

    // CRITICAL: Log ledger addition
    this.auditLogger.logDataMutation({
      tenantId: 'system',
      actorId: 'ledger-system',
      action: 'GOVERNANCE_APPROVAL_RECORDED',
      resourceType: 'GOVERNANCE_LEDGER',
      resourceId: entryId,
      outcome: 'SUCCESS',
      correlationId: this.generateCorrelationId(),
      severity: 'HIGH',
      metadata: {
        decisionId,
        approverId: approval.approverId,
        approverLevel: approval.approverLevel,
        decision: approval.decision,
        sequence,
        entryHash: entry.hash
      }
    });

    logger.info('Governance approval added to ledger', {
      entryId,
      decisionId,
      approverId: approval.approverId,
      decision: approval.decision,
      sequence,
      hash: entry.hash
    });

    return entryId;
  }

  /**
   * CRITICAL: Add emergency power to ledger
   */
  async addEmergencyPower(emergencyPower: EmergencyPower): Promise<string> {
    const entryId = this.generateEntryId();
    const sequence = this.ledgerChain.totalEntries + 1;
    const timestamp = new Date();

    // CRITICAL: Create ledger entry
    const entry: LedgerEntry = {
      id: entryId,
      type: 'EMERGENCY_POWER',
      sequence,
      timestamp,
      data: this.sanitizeEmergencyPowerData(emergencyPower),
      hash: '',
      previousHash: this.ledgerChain.headHash,
      signature: '',
      immutable: true,
      verified: false
    };

    // CRITICAL: Calculate hash
    entry.hash = this.calculateEntryHash(entry);

    // CRITICAL: Sign entry
    entry.signature = await this.signEntry(entry);

    // CRITICAL: Add to chain
    this.ledgerChain.entries.push(entry);
    this.ledgerChain.headHash = entry.hash;
    this.ledgerChain.totalEntries = sequence;

    // CRITICAL: Verify chain integrity
    this.ledgerChain.integrityVerified = await this.verifyChainIntegrity();

    // CRITICAL: Log ledger addition
    this.auditLogger.logSecurityEvent({
      tenantId: 'system',
      actorId: 'ledger-system',
      action: 'EMERGENCY_POWER_RECORDED',
      resourceType: 'GOVERNANCE_LEDGER',
      resourceId: entryId,
      outcome: 'SUCCESS',
      correlationId: this.generateCorrelationId(),
      severity: 'CRITICAL',
      metadata: {
        emergencyPowerId: emergencyPower.id,
        level: emergencyPower.level,
        grantedTo: emergencyPower.grantedTo,
        grantedBy: emergencyPower.grantedBy,
        sequence,
        entryHash: entry.hash
      }
    });

    logger.warn('Emergency power added to ledger', {
      entryId,
      emergencyPowerId: emergencyPower.id,
      level: emergencyPower.level,
      grantedTo: emergencyPower.grantedTo,
      sequence,
      hash: entry.hash
    });

    return entryId;
  }

  /**
   * CRITICAL: Add revocation to ledger
   */
  async addRevocation(
    targetType: 'DECISION' | 'EMERGENCY_POWER',
    targetId: string,
    revokedBy: string,
    rationale: string
  ): Promise<string> {
    const entryId = this.generateEntryId();
    const sequence = this.ledgerChain.totalEntries + 1;
    const timestamp = new Date();

    // CRITICAL: Create ledger entry
    const entry: LedgerEntry = {
      id: entryId,
      type: 'REVOCATION',
      sequence,
      timestamp,
      data: {
        targetType,
        targetId,
        revokedBy,
        rationale,
        timestamp
      },
      hash: '',
      previousHash: this.ledgerChain.headHash,
      signature: '',
      immutable: true,
      verified: false
    };

    // CRITICAL: Calculate hash
    entry.hash = this.calculateEntryHash(entry);

    // CRITICAL: Sign entry
    entry.signature = await this.signEntry(entry);

    // CRITICAL: Add to chain
    this.ledgerChain.entries.push(entry);
    this.ledgerChain.headHash = entry.hash;
    this.ledgerChain.totalEntries = sequence;

    // CRITICAL: Verify chain integrity
    this.ledgerChain.integrityVerified = await this.verifyChainIntegrity();

    // CRITICAL: Log ledger addition
    this.auditLogger.logSecurityEvent({
      tenantId: 'system',
      actorId: 'ledger-system',
      action: 'GOVERNANCE_REVOCATION_RECORDED',
      resourceType: 'GOVERNANCE_LEDGER',
      resourceId: entryId,
      outcome: 'SUCCESS',
      correlationId: this.generateCorrelationId(),
      severity: 'HIGH',
      metadata: {
        targetType,
        targetId,
        revokedBy,
        sequence,
        entryHash: entry.hash
      }
    });

    logger.info('Governance revocation added to ledger', {
      entryId,
      targetType,
      targetId,
      revokedBy,
      sequence,
      hash: entry.hash
    });

    return entryId;
  }

  /**
   * CRITICAL: Verify ledger integrity
   */
  async verifyLedgerIntegrity(): Promise<LedgerVerification> {
    const violations: any[] = [];
    let valid = true;

    // CRITICAL: Verify chain integrity
    const chainValid = await this.verifyChainIntegrity();
    if (!chainValid) {
      violations.push({
        entryId: 'CHAIN',
        type: 'CHAIN_INTEGRITY',
        description: 'Ledger chain integrity verification failed',
        severity: 'CRITICAL'
      });
      valid = false;
    }

    // CRITICAL: Verify individual entries
    for (const entry of this.ledgerChain.entries) {
      const entryValid = await this.verifyEntry(entry);
      if (!entryValid) {
        violations.push({
          entryId: entry.id,
          type: 'ENTRY_INTEGRITY',
          description: `Entry ${entry.id} integrity verification failed`,
          severity: 'HIGH'
        });
        valid = false;
      }
    }

    // CRITICAL: Verify sequence continuity
    const sequenceValid = this.verifySequenceContinuity();
    if (!sequenceValid) {
      violations.push({
        entryId: 'SEQUENCE',
        type: 'SEQUENCE_CONTINUITY',
        description: 'Ledger sequence continuity verification failed',
        severity: 'HIGH'
      });
      valid = false;
    }

    // CRITICAL: Calculate chain hash
    const chainHash = this.calculateChainHash();

    const verification: LedgerVerification = {
      valid,
      violations,
      chainHash,
      verifiedAt: new Date(),
      totalEntries: this.ledgerChain.totalEntries
    };

    // CRITICAL: Update ledger verification status
    this.ledgerChain.lastVerified = verification.verifiedAt;
    this.ledgerChain.integrityVerified = valid;

    // CRITICAL: Log verification
    this.auditLogger.logSecurityEvent({
      tenantId: 'system',
      actorId: 'ledger-system',
      action: 'LEDGER_INTEGRITY_VERIFICATION',
      resourceType: 'GOVERNANCE_LEDGER',
      resourceId: 'chain',
      outcome: valid ? 'SUCCESS' : 'FAILURE',
      correlationId: this.generateCorrelationId(),
      severity: valid ? 'LOW' : 'HIGH',
      metadata: {
        valid,
        violations: violations.length,
        chainHash,
        totalEntries: verification.totalEntries
      }
    });

    logger.info('Ledger integrity verification completed', {
      valid,
      violations: violations.length,
      chainHash,
      totalEntries: verification.totalEntries
    });

    return verification;
  }

  /**
   * CRITICAL: Get ledger entries
   */
  getLedgerEntries(
    type?: string,
    fromDate?: Date,
    toDate?: Date,
    limit?: number
  ): LedgerEntry[] {
    let entries = [...this.ledgerChain.entries];

    // CRITICAL: Filter by type
    if (type) {
      entries = entries.filter(entry => entry.type === type);
    }

    // CRITICAL: Filter by date range
    if (fromDate) {
      entries = entries.filter(entry => entry.timestamp >= fromDate);
    }
    if (toDate) {
      entries = entries.filter(entry => entry.timestamp <= toDate);
    }

    // CRITICAL: Sort by sequence (newest first)
    entries = entries.sort((a, b) => b.sequence - a.sequence);

    // CRITICAL: Apply limit
    if (limit) {
      entries = entries.slice(0, limit);
    }

    return entries;
  }

  /**
   * CRITICAL: Get ledger statistics
   */
  getLedgerStatistics(): {
    totalEntries: number;
    entriesByType: Record<string, number>;
    lastEntry: LedgerEntry | null;
    chainHash: string;
    integrityVerified: boolean;
    lastVerified: Date;
    snapshots: number;
  } {
    const entriesByType: Record<string, number> = {};
    
    for (const entry of this.ledgerChain.entries) {
      entriesByType[entry.type] = (entriesByType[entry.type] || 0) + 1;
    }

    return {
      totalEntries: this.ledgerChain.totalEntries,
      entriesByType,
      lastEntry: this.ledgerChain.entries[this.ledgerChain.entries.length - 1] || null,
      chainHash: this.ledgerChain.headHash,
      integrityVerified: this.ledgerChain.integrityVerified,
      lastVerified: this.ledgerChain.lastVerified,
      snapshots: this.snapshots.size
    };
  }

  /**
   * CRITICAL: Create ledger snapshot
   */
  async createSnapshot(retentionDays: number = 2555): Promise<string> {
    const snapshotId = this.generateSnapshotId();
    const timestamp = new Date();
    const retention = new Date(timestamp.getTime() + (retentionDays * 24 * 60 * 60 * 1000));

    // CRITICAL: Create snapshot
    const snapshot: LedgerSnapshot = {
      id: snapshotId,
      timestamp,
      entryCount: this.ledgerChain.totalEntries,
      headHash: this.ledgerChain.headHash,
      compressed: false,
      checksum: '',
      retention
    };

    // CRITICAL: Calculate checksum
    snapshot.checksum = this.calculateSnapshotChecksum(snapshot);

    // CRITICAL: Store snapshot
    this.snapshots.set(snapshotId, snapshot);

    // CRITICAL: Log snapshot creation
    this.auditLogger.logDataMutation({
      tenantId: 'system',
      actorId: 'ledger-system',
      action: 'LEDGER_SNAPSHOT_CREATED',
      resourceType: 'GOVERNANCE_LEDGER',
      resourceId: snapshotId,
      outcome: 'SUCCESS',
      correlationId: this.generateCorrelationId(),
      severity: 'MEDIUM',
      metadata: {
        snapshotId,
        entryCount: snapshot.entryCount,
        headHash: snapshot.headHash,
        retentionDays,
        checksum: snapshot.checksum
      }
    });

    logger.info('Ledger snapshot created', {
      snapshotId,
      entryCount: snapshot.entryCount,
      headHash: snapshot.headHash,
      retentionDays
    });

    return snapshotId;
  }

  /**
   * CRITICAL: Verify chain integrity
   */
  private async verifyChainIntegrity(): Promise<boolean> {
    if (this.ledgerChain.entries.length === 0) {
      return true;
    }

    // CRITICAL: Verify each entry's hash and signature
    for (let i = 0; i < this.ledgerChain.entries.length; i++) {
      const entry = this.ledgerChain.entries[i];
      
      // CRITICAL: Verify hash
      const calculatedHash = this.calculateEntryHash(entry);
      if (calculatedHash !== entry.hash) {
        logger.error('Hash mismatch detected', {
          entryId: entry.id,
          sequence: entry.sequence,
          expectedHash: entry.hash,
          calculatedHash
        });
        return false;
      }

      // CRITICAL: Verify signature
      const signatureValid = await this.verifySignature(entry);
      if (!signatureValid) {
        logger.error('Signature verification failed', {
          entryId: entry.id,
          sequence: entry.sequence
        });
        return false;
      }

      // CRITICAL: Verify chain link
      if (i > 0) {
        const previousEntry = this.ledgerChain.entries[i - 1];
        if (entry.previousHash !== previousEntry.hash) {
          logger.error('Chain link broken', {
            entryId: entry.id,
            sequence: entry.sequence,
            expectedPreviousHash: previousEntry.hash,
            actualPreviousHash: entry.previousHash
          });
          return false;
        }
      }
    }

    return true;
  }

  /**
   * CRITICAL: Verify entry
   */
  private async verifyEntry(entry: LedgerEntry): Promise<boolean> {
    // CRITICAL: Verify hash
    const calculatedHash = this.calculateEntryHash(entry);
    if (calculatedHash !== entry.hash) {
      return false;
    }

    // CRITICAL: Verify signature
    return await this.verifySignature(entry);
  }

  /**
   * CRITICAL: Verify sequence continuity
   */
  private verifySequenceContinuity(): boolean {
    for (let i = 0; i < this.ledgerChain.entries.length; i++) {
      const entry = this.ledgerChain.entries[i];
      if (entry.sequence !== i + 1) {
        logger.error('Sequence discontinuity detected', {
          entryId: entry.id,
          expectedSequence: i + 1,
          actualSequence: entry.sequence
        });
        return false;
      }
    }
    return true;
  }

  /**
   * CRITICAL: Calculate entry hash
   */
  private calculateEntryHash(entry: LedgerEntry): string {
    const data = {
      id: entry.id,
      type: entry.type,
      sequence: entry.sequence,
      timestamp: entry.timestamp.toISOString(),
      data: entry.data,
      previousHash: entry.previousHash
    };
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  }

  /**
   * CRITICAL: Calculate chain hash
   */
  private calculateChainHash(): string {
    const hash = crypto.createHash('sha256');
    hash.update(this.ledgerChain.headHash);
    hash.update(this.ledgerChain.totalEntries.toString());
    return hash.digest('hex');
  }

  /**
   * CRITICAL: Calculate snapshot checksum
   */
  private calculateSnapshotChecksum(snapshot: LedgerSnapshot): string {
    const data = {
      id: snapshot.id,
      timestamp: snapshot.timestamp.toISOString(),
      entryCount: snapshot.entryCount,
      headHash: snapshot.headHash,
      retention: snapshot.retention.toISOString()
    };
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  }

  /**
   * CRITICAL: Sign entry
   */
  private async signEntry(entry: LedgerEntry): Promise<string> {
    const privateKey = this.getLedgerPrivateKey();
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(entry.hash);
    return sign.sign(privateKey, 'hex');
  }

  /**
   * CRITICAL: Verify signature
   */
  private async verifySignature(entry: LedgerEntry): Promise<boolean> {
    const publicKey = this.getLedgerPublicKey();
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(entry.hash);
    return verify.verify(publicKey, entry.signature, 'hex');
  }

  /**
   * CRITICAL: Get ledger private key
   */
  private getLedgerPrivateKey(): string {
    // CRITICAL: In production, this would be stored securely
    // For now, return a placeholder
    return '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----';
  }

  /**
   * CRITICAL: Get ledger public key
   */
  private getLedgerPublicKey(): string {
    // CRITICAL: In production, this would be stored securely
    // For now, return a placeholder
    return '-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----';
  }

  /**
   * CRITICAL: Sanitize decision data
   */
  private sanitizeDecisionData(decision: GovernanceDecision): any {
    return {
      id: decision.id,
      action: decision.action,
      actorId: decision.actorId,
      actorLevel: decision.actorLevel,
      targetId: decision.targetId,
      targetType: decision.targetType,
      status: decision.status,
      executedAt: decision.executedAt,
      expiresAt: decision.expiresAt
    };
  }

  /**
   * CRITICAL: Sanitize approval data
   */
  private sanitizeApprovalData(approval: GovernanceApproval): any {
    return {
      id: approval.id,
      approverId: approval.approverId,
      approverLevel: approval.approverLevel,
      decision: approval.decision,
      timestamp: approval.timestamp
    };
  }

  /**
   * CRITICAL: Sanitize emergency power data
   */
  private sanitizeEmergencyPowerData(emergencyPower: EmergencyPower): any {
    return {
      id: emergencyPower.id,
      level: emergencyPower.level,
      grantedTo: emergencyPower.grantedTo,
      grantedBy: emergencyPower.grantedBy,
      grantedAt: emergencyPower.grantedAt,
      expiresAt: emergencyPower.expiresAt,
      scope: emergencyPower.scope,
      actions: emergencyPower.actions,
      reviewRequired: emergencyPower.reviewRequired
    };
  }

  /**
   * CRITICAL: Initialize ledger
   */
  private initializeLedger(): void {
    this.ledgerChain = {
      entries: [],
      headHash: '0',
      totalEntries: 0,
      lastVerified: new Date(),
      integrityVerified: true
    };
  }

  /**
   * CRITICAL: Start periodic verification
   */
  private startPeriodicVerification(): void {
    // CRITICAL: Verify ledger integrity every hour
    this.verificationInterval = setInterval(async () => {
      await this.verifyLedgerIntegrity();
    }, 3600000); // Every hour
  }

  /**
   * CRITICAL: Generate correlation ID
   */
  private generateCorrelationId(): string {
    const bytes = crypto.randomBytes(8);
    return `corr_${bytes.toString('hex')}`;
  }

  /**
   * CRITICAL: Generate entry ID
   */
  private generateEntryId(): string {
    const bytes = crypto.randomBytes(8);
    return `entry_${bytes.toString('hex')}`;
  }

  /**
   * CRITICAL: Generate snapshot ID
   */
  private generateSnapshotId(): string {
    const bytes = crypto.randomBytes(8);
    return `snapshot_${bytes.toString('hex')}`;
  }
}

/**
 * CRITICAL: Global governance ledger manager instance
 */
export const governanceLedgerManager = GovernanceLedgerManager.getInstance();

/**
 * CRITICAL: Convenience functions
 */
export const addGovernanceDecision = async (decision: GovernanceDecision): Promise<string> => {
  return await governanceLedgerManager.addGovernanceDecision(decision);
};

export const addApproval = async (decisionId: string, approval: GovernanceApproval): Promise<string> => {
  return await governanceLedgerManager.addApproval(decisionId, approval);
};

export const addEmergencyPower = async (emergencyPower: EmergencyPower): Promise<string> => {
  return await governanceLedgerManager.addEmergencyPower(emergencyPower);
};

export const addRevocation = async (
  targetType: 'DECISION' | 'EMERGENCY_POWER',
  targetId: string,
  revokedBy: string,
  rationale: string
): Promise<string> => {
  return await governanceLedgerManager.addRevocation(targetType, targetId, revokedBy, rationale);
};

export const verifyLedgerIntegrity = async (): Promise<LedgerVerification> => {
  return await governanceLedgerManager.verifyLedgerIntegrity();
};

export const getLedgerEntries = (
  type?: string,
  fromDate?: Date,
  toDate?: Date,
  limit?: number
): LedgerEntry[] => {
  return governanceLedgerManager.getLedgerEntries(type, fromDate, toDate, limit);
};

export const getLedgerStatistics = () => {
  return governanceLedgerManager.getLedgerStatistics();
};

export const createSnapshot = async (retentionDays?: number): Promise<string> => {
  return await governanceLedgerManager.createSnapshot(retentionDays);
};
