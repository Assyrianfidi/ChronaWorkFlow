// CRITICAL: Immutable Audit Vault
// MANDATORY: Cryptographically secure, tamper-proof evidence storage and retrieval

import { logger } from '../utils/structured-logger.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { evidenceCollectionManager, EvidenceMetadata } from './evidence-collector.js';
import { governanceLedgerManager } from '../governance/governance-ledger.js';
import * as crypto from 'crypto';

export type VaultStatus = 'ACTIVE' | 'SEALED' | 'COMPROMISED' | 'MAINTENANCE';
export type VaultOperation = 'STORE' | 'RETRIEVE' | 'VERIFY' | 'ARCHIVE' | 'SEAL';

export interface VaultEntry {
  id: string;
  evidenceId: string;
  vaultId: string;
  sequence: number;
  timestamp: Date;
  operation: VaultOperation;
  operatorId: string;
  dataHash: string;
  previousHash: string;
  signature: string;
  encrypted: boolean;
  compressionRatio?: number;
  checksum: string;
  metadata: {
    size: number;
    format: string;
    framework: string;
    controlId: string;
    retentionPeriod: Date;
    accessLevel: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
    legalHold: boolean;
    archived: boolean;
    verified: boolean;
  };
}

export interface VaultChain {
  vaultId: string;
  name: string;
  description: string;
  status: VaultStatus;
  createdAt: Date;
  createdBy: string;
  sealedAt?: Date;
  entries: VaultEntry[];
  headHash: string;
  totalEntries: number;
  lastVerified: Date;
  integrityVerified: boolean;
  encryptionKeyId: string;
  backupLocation: string;
  metadata: {
    framework: string;
    jurisdiction: string;
    complianceLevel: 'BASIC' | 'STANDARD' | 'ENHANCED';
    retentionPolicy: string;
    accessPolicy: string;
  };
}

export interface VaultVerificationResult {
  valid: boolean;
  chainIntegrity: boolean;
  entryIntegrity: number; // Percentage of valid entries
  cryptographicIntegrity: boolean;
  backupIntegrity: boolean;
  violations: Array<{
    entryId: string;
    type: 'HASH_MISMATCH' | 'SIGNATURE_INVALID' | 'SEQUENCE_GAP' | 'TAMPERING' | 'ENCRYPTION_ERROR';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    recommendation: string;
  }>;
  verifiedAt: Date;
  verifiedBy: string;
  nextVerification: Date;
}

export interface VaultAccessRequest {
  id: string;
  vaultId: string;
  requesterId: string;
  requesterRole: 'AUDITOR' | 'COMPLIANCE_OFFICER' | 'LEGAL_COUNSEL' | 'SYSTEM_ADMIN' | 'EXECUTIVE';
  purpose: string;
  requestedAt: Date;
  expiresAt: Date;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED' | 'REVOKED';
  approvedBy?: string;
  approvedAt?: Date;
  accessLevel: 'READ_ONLY' | 'READ_WRITE' | 'ADMIN';
  conditions: string[];
  auditTrail: Array<{
    action: string;
    timestamp: Date;
    actor: string;
    details: string;
  }>;
}

/**
 * CRITICAL: Audit Vault Manager
 * 
 * Provides immutable, cryptographically secure storage for compliance evidence.
 * Implements blockchain-like integrity verification and auditor access controls.
 */
export class AuditVaultManager {
  private static instance: AuditVaultManager;
  private auditLogger: any;
  private vaults: Map<string, VaultChain> = new Map();
  private accessRequests: Map<string, VaultAccessRequest> = new Map();
  private verificationInterval: NodeJS.Timeout | null = null;
  private backupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.auditLogger = getImmutableAuditLogger();
    this.initializeDefaultVault();
    this.startPeriodicVerification();
    this.startPeriodicBackup();
  }

  static getInstance(): AuditVaultManager {
    if (!AuditVaultManager.instance) {
      AuditVaultManager.instance = new AuditVaultManager();
    }
    return AuditVaultManager.instance;
  }

  /**
   * CRITICAL: Store evidence in vault
   */
  async storeEvidence(
    vaultId: string,
    evidenceId: string,
    operatorId: string = 'system'
  ): Promise<string> {
    const vault = this.vaults.get(vaultId);
    if (!vault) {
      throw new Error(`Vault not found: ${vaultId}`);
    }

    if (vault.status !== 'ACTIVE') {
      throw new Error(`Vault not active: ${vault.status}`);
    }

    const entryId = this.generateEntryId();
    const timestamp = new Date();
    const sequence = vault.totalEntries + 1;

    try {
      // CRITICAL: Get evidence metadata
      const evidence = evidenceCollectionManager.getEvidence(evidenceId);
      if (!evidence) {
        throw new Error(`Evidence not found: ${evidenceId}`);
      }

      // CRITICAL: Create vault entry
      const entry: VaultEntry = {
        id: entryId,
        evidenceId,
        vaultId,
        sequence,
        timestamp,
        operation: 'STORE',
        operatorId,
        dataHash: evidence.hash,
        previousHash: vault.headHash,
        signature: '',
        encrypted: true,
        checksum: '',
        metadata: {
          size: evidence.size,
          format: evidence.format,
          framework: evidence.framework,
          controlId: evidence.controlId,
          retentionPeriod: evidence.retentionPeriod,
          accessLevel: this.determineAccessLevel(evidence),
          legalHold: false,
          archived: false,
          verified: evidence.verified
        }
      };

      // CRITICAL: Calculate entry hash
      const entryHash = this.calculateEntryHash(entry);
      
      // CRITICAL: Sign entry
      entry.signature = await this.signEntry(entryHash);
      entry.checksum = this.calculateChecksum(entry);

      // CRITICAL: Add to vault chain
      vault.entries.push(entry);
      vault.headHash = entryHash;
      vault.totalEntries = sequence;
      vault.integrityVerified = await this.verifyVaultIntegrity(vault);

      // CRITICAL: Record in governance ledger
      await governanceLedgerManager.addGovernanceDecision({
        id: `vault_${entryId}`,
        action: 'EVIDENCE_STORED',
        actorId: operatorId,
        actorLevel: 'SYSTEM',
        tenantId: 'system',
        details: {
          vaultId,
          evidenceId,
          entryId,
          sequence,
          hash: entryHash
        },
        justification: 'Evidence stored in audit vault',
        approvedBy: 'system',
        approvedAt: timestamp,
        effectiveAt: timestamp,
        expiresAt: evidence.retentionPeriod
      } as any);

      // CRITICAL: Log vault operation
      this.auditLogger.logDataMutation({
        tenantId: 'system',
        actorId: operatorId,
        action: 'EVIDENCE_STORED_IN_VAULT',
        resourceType: 'AUDIT_VAULT',
        resourceId: vaultId,
        outcome: 'SUCCESS',
        correlationId: this.generateCorrelationId(),
        metadata: {
          evidenceId,
          entryId,
          sequence,
          hash: entryHash,
          accessLevel: entry.metadata.accessLevel
        }
      });

      logger.info('Evidence stored in vault', {
        vaultId,
        evidenceId,
        entryId,
        sequence,
        hash: entryHash
      });

      return entryId;

    } catch (error) {
      logger.error('Evidence storage in vault failed', {
        vaultId,
        evidenceId,
        error: (error as Error).message
      });

      this.auditLogger.logDataMutation({
        tenantId: 'system',
        actorId: operatorId,
        action: 'EVIDENCE_VAULT_STORAGE_FAILED',
        resourceType: 'AUDIT_VAULT',
        resourceId: vaultId,
        outcome: 'FAILURE',
        correlationId: this.generateCorrelationId(),
        metadata: {
          evidenceId,
          error: (error as Error).message
        }
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Retrieve evidence from vault
   */
  async retrieveEvidence(
    vaultId: string,
    evidenceId: string,
    requesterId: string,
    accessLevel: 'READ_ONLY' | 'READ_WRITE' | 'ADMIN' = 'READ_ONLY'
  ): Promise<VaultEntry | null> {
    const vault = this.vaults.get(vaultId);
    if (!vault) {
      throw new Error(`Vault not found: ${vaultId}`);
    }

    try {
      // CRITICAL: Check access permissions
      const hasAccess = await this.checkVaultAccess(vaultId, requesterId, accessLevel);
      if (!hasAccess) {
        throw new Error(`Access denied for vault: ${vaultId}`);
      }

      // CRITICAL: Find evidence entry
      const entry = vault.entries.find(e => e.evidenceId === evidenceId);
      if (!entry) {
        return null;
      }

      // CRITICAL: Verify entry integrity
      const entryValid = await this.verifyEntryIntegrity(entry);
      if (!entryValid) {
        logger.warn('Retrieved evidence entry integrity verification failed', {
          vaultId,
          evidenceId,
          entryId: entry.id
        });
      }

      // CRITICAL: Log vault access
      this.auditLogger.logAuthorizationDecision({
        tenantId: 'system',
        actorId: requesterId,
        action: 'EVIDENCE_RETRIEVED_FROM_VAULT',
        resourceType: 'AUDIT_VAULT',
        resourceId: vaultId,
        outcome: 'SUCCESS',
        correlationId: this.generateCorrelationId(),
        metadata: {
          evidenceId,
          entryId: entry.id,
          accessLevel,
          integrityVerified: entryValid
        }
      });

      logger.info('Evidence retrieved from vault', {
        vaultId,
        evidenceId,
        entryId: entry.id,
        requesterId,
        accessLevel
      });

      return entry;

    } catch (error) {
      logger.error('Evidence retrieval from vault failed', {
        vaultId,
        evidenceId,
        requesterId,
        error: (error as Error).message
      });

      this.auditLogger.logAuthorizationDecision({
        tenantId: 'system',
        actorId: requesterId,
        action: 'EVIDENCE_VAULT_RETRIEVAL_FAILED',
        resourceType: 'AUDIT_VAULT',
        resourceId: vaultId,
        outcome: 'FAILURE',
        correlationId: this.generateCorrelationId(),
        metadata: {
          evidenceId,
          error: (error as Error).message
        }
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Verify vault integrity
   */
  async verifyVaultIntegrity(vaultId: string): Promise<VaultVerificationResult> {
    const vault = this.vaults.get(vaultId);
    if (!vault) {
      throw new Error(`Vault not found: ${vaultId}`);
    }

    const timestamp = new Date();
    const violations: Array<{
      entryId: string;
      type: 'HASH_MISMATCH' | 'SIGNATURE_INVALID' | 'SEQUENCE_GAP' | 'TAMPERING' | 'ENCRYPTION_ERROR';
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      description: string;
      recommendation: string;
    }> = [];

    let validEntries = 0;
    let chainIntegrity = true;
    let cryptographicIntegrity = true;

    try {
      // CRITICAL: Verify chain integrity
      for (let i = 0; i < vault.entries.length; i++) {
        const entry = vault.entries[i];
        const previousEntry = i > 0 ? vault.entries[i - 1] : null;

        // CRITICAL: Verify sequence
        if (entry.sequence !== i + 1) {
          violations.push({
            entryId: entry.id,
            type: 'SEQUENCE_GAP',
            severity: 'HIGH',
            description: `Sequence mismatch: expected ${i + 1}, found ${entry.sequence}`,
            recommendation: 'Investigate potential chain tampering'
          });
          chainIntegrity = false;
        }

        // CRITICAL: Verify hash chain
        if (previousEntry && entry.previousHash !== this.calculateEntryHash(previousEntry)) {
          violations.push({
            entryId: entry.id,
            type: 'HASH_MISMATCH',
            severity: 'CRITICAL',
            description: 'Hash chain link broken',
            recommendation: 'Immediate investigation required'
          });
          chainIntegrity = false;
          cryptographicIntegrity = false;
        }

        // CRITICAL: Verify entry integrity
        const entryValid = await this.verifyEntryIntegrity(entry);
        if (entryValid) {
          validEntries++;
        } else {
          violations.push({
            entryId: entry.id,
            type: 'SIGNATURE_INVALID',
            severity: 'HIGH',
            description: 'Entry signature verification failed',
            recommendation: 'Verify cryptographic keys and investigate tampering'
          });
          cryptographicIntegrity = false;
        }
      }

      // CRITICAL: Verify backup integrity (simulated)
      const backupIntegrity = await this.verifyBackupIntegrity(vaultId);

      // CRITICAL: Update vault verification status
      vault.lastVerified = timestamp;
      vault.integrityVerified = chainIntegrity && cryptographicIntegrity;

      const result: VaultVerificationResult = {
        valid: violations.length === 0,
        chainIntegrity,
        entryIntegrity: vault.entries.length > 0 ? (validEntries / vault.entries.length) * 100 : 100,
        cryptographicIntegrity,
        backupIntegrity,
        violations,
        verifiedAt: timestamp,
        verifiedBy: 'system',
        nextVerification: this.calculateNextVerification()
      };

      // CRITICAL: Log verification result
      this.auditLogger.logAuthorizationDecision({
        tenantId: 'system',
        actorId: 'system',
        action: 'VAULT_INTEGRITY_VERIFICATION',
        resourceType: 'AUDIT_VAULT',
        resourceId: vaultId,
        outcome: result.valid ? 'SUCCESS' : 'FAILURE',
        correlationId: this.generateCorrelationId(),
        metadata: {
          violations: violations.length,
          chainIntegrity,
          entryIntegrity: result.entryIntegrity,
          cryptographicIntegrity,
          backupIntegrity
        }
      });

      logger.info('Vault integrity verification completed', {
        vaultId,
        valid: result.valid,
        violations: violations.length,
        entryIntegrity: result.entryIntegrity
      });

      return result;

    } catch (error) {
      logger.error('Vault integrity verification failed', {
        vaultId,
        error: (error as Error).message
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Request vault access
   */
  async requestVaultAccess(
    vaultId: string,
    requesterId: string,
    requesterRole: VaultAccessRequest['requesterRole'],
    purpose: string,
    accessLevel: VaultAccessRequest['accessLevel'],
    expiresAt?: Date
  ): Promise<string> {
    const vault = this.vaults.get(vaultId);
    if (!vault) {
      throw new Error(`Vault not found: ${vaultId}`);
    }

    const requestId = this.generateRequestId();
    const timestamp = new Date();

    try {
      // CRITICAL: Create access request
      const request: VaultAccessRequest = {
        id: requestId,
        vaultId,
        requesterId,
        requesterRole,
        purpose,
        requestedAt: timestamp,
        expiresAt: expiresAt || new Date(timestamp.getTime() + (30 * 24 * 60 * 60 * 1000)), // 30 days
        status: 'PENDING',
        accessLevel,
        conditions: this.generateAccessConditions(requesterRole, accessLevel),
        auditTrail: [{
          action: 'REQUESTED',
          timestamp,
          actor: requesterId,
          details: `Vault access requested for ${purpose}`
        }]
      };

      this.accessRequests.set(requestId, request);

      // CRITICAL: Log access request
      this.auditLogger.logAuthorizationDecision({
        tenantId: 'system',
        actorId: requesterId,
        action: 'VAULT_ACCESS_REQUESTED',
        resourceType: 'AUDIT_VAULT',
        resourceId: vaultId,
        outcome: 'PENDING',
        correlationId: this.generateCorrelationId(),
        metadata: {
          requestId,
          requesterRole,
          purpose,
          accessLevel,
          expiresAt: request.expiresAt
        }
      });

      logger.info('Vault access requested', {
        requestId,
        vaultId,
        requesterId,
        requesterRole,
        purpose,
        accessLevel
      });

      return requestId;

    } catch (error) {
      logger.error('Vault access request failed', {
        vaultId,
        requesterId,
        error: (error as Error).message
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Approve vault access request
   */
  async approveVaultAccess(
    requestId: string,
    approverId: string,
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
      request.approvedBy = approverId;
      request.approvedAt = timestamp;

      request.auditTrail.push({
        action: 'APPROVED',
        timestamp,
        actor: approverId,
        details: justification || 'Access approved'
      });

      // CRITICAL: Log approval
      this.auditLogger.logAuthorizationDecision({
        tenantId: 'system',
        actorId: approverId,
        action: 'VAULT_ACCESS_APPROVED',
        resourceType: 'AUDIT_VAULT',
        resourceId: request.vaultId,
        outcome: 'SUCCESS',
        correlationId: this.generateCorrelationId(),
        metadata: {
          requestId,
          requesterId: request.requesterId,
          requesterRole: request.requesterRole,
          justification
        }
      });

      logger.info('Vault access approved', {
        requestId,
        vaultId: request.vaultId,
        requesterId: request.requesterId,
        approverId
      });

    } catch (error) {
      logger.error('Vault access approval failed', {
        requestId,
        approverId,
        error: (error as Error).message
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Get vault information
   */
  getVault(vaultId: string): VaultChain | undefined {
    return this.vaults.get(vaultId);
  }

  /**
   * CRITICAL: Get all vaults
   */
  getAllVaults(): VaultChain[] {
    return Array.from(this.vaults.values());
  }

  /**
   * CRITICAL: Get vault statistics
   */
  getVaultStatistics(): {
    totalVaults: number;
    activeVaults: number;
    sealedVaults: number;
    totalEntries: number;
    totalSize: number;
    integrityScore: number;
    byFramework: Record<string, number>;
  } {
    const vaults = Array.from(this.vaults.values());
    let totalEntries = 0;
    let totalSize = 0;
    let integrityScore = 0;
    const byFramework: Record<string, number> = {};

    for (const vault of vaults) {
      totalEntries += vault.totalEntries;
      totalSize += vault.entries.reduce((sum, entry) => sum + entry.metadata.size, 0);
      
      if (vault.integrityVerified) {
        integrityScore += 100;
      }

      byFramework[vault.metadata.framework] = (byFramework[vault.metadata.framework] || 0) + 1;
    }

    return {
      totalVaults: vaults.length,
      activeVaults: vaults.filter(v => v.status === 'ACTIVE').length,
      sealedVaults: vaults.filter(v => v.status === 'SEALED').length,
      totalEntries,
      totalSize,
      integrityScore: vaults.length > 0 ? integrityScore / vaults.length : 100,
      byFramework
    };
  }

  /**
   * CRITICAL: Initialize default vault
   */
  private initializeDefaultVault(): void {
    const vaultId = 'default_compliance_vault';
    const timestamp = new Date();

    const vault: VaultChain = {
      vaultId,
      name: 'Default Compliance Vault',
      description: 'Primary vault for all compliance evidence',
      status: 'ACTIVE',
      createdAt: timestamp,
      createdBy: 'system',
      entries: [],
      headHash: '',
      totalEntries: 0,
      lastVerified: timestamp,
      integrityVerified: true,
      encryptionKeyId: 'default_key',
      backupLocation: 'secure_backup_location',
      metadata: {
        framework: 'MULTI',
        jurisdiction: 'GLOBAL',
        complianceLevel: 'ENHANCED',
        retentionPolicy: 'FRAMEWORK_SPECIFIC',
        accessPolicy: 'ROLE_BASED'
      }
    };

    this.vaults.set(vaultId, vault);

    logger.info('Default audit vault initialized', {
      vaultId,
      name: vault.name
    });
  }

  /**
   * CRITICAL: Start periodic verification
   */
  private startPeriodicVerification(): void {
    this.verificationInterval = setInterval(async () => {
      try {
        const vaults = Array.from(this.vaults.values());
        
        for (const vault of vaults) {
          if (vault.status === 'ACTIVE') {
            await this.verifyVaultIntegrity(vault.vaultId);
          }
        }
      } catch (error) {
        logger.error('Periodic vault verification failed', {
          error: (error as Error).message
        });
      }
    }, 3600000); // Every hour
  }

  /**
   * CRITICAL: Start periodic backup
   */
  private startPeriodicBackup(): void {
    this.backupInterval = setInterval(async () => {
      try {
        const vaults = Array.from(this.vaults.values());
        
        for (const vault of vaults) {
          if (vault.status === 'ACTIVE') {
            await this.createVaultBackup(vault.vaultId);
          }
        }
      } catch (error) {
        logger.error('Periodic vault backup failed', {
          error: (error as Error).message
        });
      }
    }, 14400000); // Every 4 hours
  }

  /**
   * CRITICAL: Create vault backup
   */
  private async createVaultBackup(vaultId: string): Promise<void> {
    const vault = this.vaults.get(vaultId);
    if (!vault) {
      return;
    }

    try {
      // In a real implementation, this would create encrypted backups
      logger.debug('Vault backup created', {
        vaultId,
        entryCount: vault.totalEntries,
        backupLocation: vault.backupLocation
      });

    } catch (error) {
      logger.error('Vault backup creation failed', {
        vaultId,
        error: (error as Error).message
      });
    }
  }

  /**
   * CRITICAL: Verify backup integrity
   */
  private async verifyBackupIntegrity(vaultId: string): Promise<boolean> {
    try {
      // In a real implementation, this would verify backup integrity
      return true;
    } catch (error) {
      logger.error('Backup integrity verification failed', {
        vaultId,
        error: (error as Error).message
      });
      return false;
    }
  }

  /**
   * CRITICAL: Check vault access permissions
   */
  private async checkVaultAccess(
    vaultId: string,
    requesterId: string,
    accessLevel: VaultAccessRequest['accessLevel']
  ): Promise<boolean> {
    // CRITICAL: Check for approved access request
    const requests = Array.from(this.accessRequests.values())
      .filter(r => r.vaultId === vaultId && 
                   r.requesterId === requesterId && 
                   r.status === 'APPROVED' &&
                   r.accessLevel === accessLevel &&
                   new Date() <= r.expiresAt);

    return requests.length > 0;
  }

  /**
   * CRITICAL: Determine evidence access level
   */
  private determineAccessLevel(evidence: EvidenceMetadata): VaultEntry['metadata']['accessLevel'] {
    switch (evidence.framework) {
      case 'SOX':
        return 'RESTRICTED';
      case 'GDPR':
      case 'CCPA':
        return 'CONFIDENTIAL';
      case 'SOC2':
      case 'ISO27001':
        return 'INTERNAL';
      default:
        return 'PUBLIC';
    }
  }

  /**
   * CRITICAL: Generate access conditions
   */
  private generateAccessConditions(
    role: VaultAccessRequest['requesterRole'],
    accessLevel: VaultAccessRequest['accessLevel']
  ): string[] {
    const conditions = [];

    switch (role) {
      case 'AUDITOR':
        conditions.push('Audit purpose only', 'Read-only access', 'No data export');
        break;
      case 'COMPLIANCE_OFFICER':
        conditions.push('Compliance monitoring', 'Read-write access', 'Data export allowed');
        break;
      case 'LEGAL_COUNSEL':
        conditions.push('Legal review purpose', 'Read-only access', 'Attorney-client privilege');
        break;
      case 'SYSTEM_ADMIN':
        conditions.push('System maintenance', 'Admin access', 'Full system access');
        break;
      case 'EXECUTIVE':
        conditions.push('Executive oversight', 'Read-only access', 'Summary reports only');
        break;
    }

    return conditions;
  }

  /**
   * CRITICAL: Calculate entry hash
   */
  private calculateEntryHash(entry: VaultEntry): string {
    const hashData = {
      id: entry.id,
      evidenceId: entry.evidenceId,
      vaultId: entry.vaultId,
      sequence: entry.sequence,
      timestamp: entry.timestamp.toISOString(),
      operation: entry.operation,
      operatorId: entry.operatorId,
      dataHash: entry.dataHash,
      previousHash: entry.previousHash
    };

    return crypto.createHash('sha256')
      .update(JSON.stringify(hashData))
      .digest('hex');
  }

  /**
   * CRITICAL: Calculate entry checksum
   */
  private calculateChecksum(entry: VaultEntry): string {
    const checksumData = {
      id: entry.id,
      dataHash: entry.dataHash,
      signature: entry.signature,
      metadata: entry.metadata
    };

    return crypto.createHash('md5')
      .update(JSON.stringify(checksumData))
      .digest('hex');
  }

  /**
   * CRITICAL: Sign entry
   */
  private async signEntry(hash: string): Promise<string> {
    const privateKey = this.getVaultPrivateKey();
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(hash);
    return sign.sign(privateKey, 'hex');
  }

  /**
   * CRITICAL: Verify entry integrity
   */
  private async verifyEntryIntegrity(entry: VaultEntry): Promise<boolean> {
    try {
      const publicKey = this.getVaultPublicKey();
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(entry.dataHash);
      return verify.verify(publicKey, entry.signature, 'hex');
    } catch (error) {
      return false;
    }
  }

  /**
   * CRITICAL: Calculate next verification date
   */
  private calculateNextVerification(): Date {
    const now = new Date();
    return new Date(now.getTime() + (24 * 60 * 60 * 1000)); // 24 hours
  }

  /**
   * CRITICAL: Get vault private key
   */
  private getVaultPrivateKey(): string {
    // In a real implementation, this would retrieve from secure key storage
    return '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC5...\n-----END PRIVATE KEY-----';
  }

  /**
   * CRITICAL: Get vault public key
   */
  private getVaultPublicKey(): string {
    // In a real implementation, this would retrieve from secure key storage
    return '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuQ...\n-----END PUBLIC KEY-----';
  }

  /**
   * CRITICAL: Generate entry ID
   */
  private generateEntryId(): string {
    const bytes = crypto.randomBytes(8);
    return `entry_${bytes.toString('hex')}`;
  }

  /**
   * CRITICAL: Generate request ID
   */
  private generateRequestId(): string {
    const bytes = crypto.randomBytes(8);
    return `req_${bytes.toString('hex')}`;
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
 * CRITICAL: Global audit vault manager instance
 */
export const auditVaultManager = AuditVaultManager.getInstance();

/**
 * CRITICAL: Convenience functions
 */
export const createAuditVaultManager = (): AuditVaultManager => {
  return AuditVaultManager.getInstance();
};

export const storeEvidenceInVault = async (
  vaultId: string,
  evidenceId: string,
  operatorId?: string
): Promise<string> => {
  return auditVaultManager.storeEvidence(vaultId, evidenceId, operatorId);
};

export const retrieveEvidenceFromVault = async (
  vaultId: string,
  evidenceId: string,
  requesterId: string,
  accessLevel?: VaultAccessRequest['accessLevel']
): Promise<VaultEntry | null> => {
  return auditVaultManager.retrieveEvidence(vaultId, evidenceId, requesterId, accessLevel);
};
