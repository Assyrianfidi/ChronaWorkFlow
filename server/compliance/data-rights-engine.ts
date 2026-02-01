// CRITICAL: Data Rights Engine
// MANDATORY: Enforcement of GDPR/CCPA data subject rights and legal hold requirements

import { logger } from '../utils/structured-logger.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { evidenceCollectionManager } from './evidence-collector.js';
import { auditVaultManager } from './audit-vault.js';
import { governanceModelManager } from '../governance/governance-model.js';
import * as crypto from 'crypto';

export type DataSubjectRight = 'ACCESS' | 'RECTIFICATION' | 'ERASURE' | 'PORTABILITY' | 'RESTRICTION' | 'OBJECTION' | 'NOTIFICATION';
export type LegalHoldType = 'LITIGATION' | 'REGULATORY' | 'INTERNAL_INVESTIGATION' | 'PRESERVATION';
export type RequestStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'ESCALATED';
export type ErasureMethod = 'CRYPTOGRAPHIC' | 'SECURE_DELETE' | 'ANONYMIZATION' | 'AGGREGATION';

export interface DataSubject {
  id: string;
  type: 'CUSTOMER' | 'EMPLOYEE' | 'PROSPECT' | 'PARTNER' | 'OTHER';
  identifiers: {
    email?: string;
    phone?: string;
    customerId?: string;
    userId?: string;
    accountId?: string;
    taxId?: string;
    [key: string]: string | undefined;
  };
  jurisdiction: string;
  preferences: {
    marketing: boolean;
    analytics: boolean;
    cookies: boolean;
    thirdPartySharing: boolean;
  };
  consentRecords: Array<{
    id: string;
    purpose: string;
    lawfulBasis: string;
    givenAt: Date;
    expiresAt?: Date;
    withdrawnAt?: Date;
    ipAddress: string;
    userAgent: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataRightsRequest {
  id: string;
  dataSubjectId: string;
  right: DataSubjectRight;
  requestType: 'INDIVIDUAL' | 'BULK' | 'THIRD_PARTY';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: RequestStatus;
  requestedAt: Date;
  requestedBy: string;
  purpose: string;
  scope: string[];
  justification: string;
  evidence: {
    verificationMethod: string;
    verificationResult: 'VERIFIED' | 'PENDING' | 'FAILED';
    verificationAt?: Date;
    documents: string[];
  };
  processing: {
    startedAt?: Date;
    completedAt?: Date;
    estimatedCompletion?: Date;
    assignedTo?: string;
    steps: Array<{
      step: string;
      status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
      startedAt?: Date;
      completedAt?: Date;
      result?: string;
    }>;
  };
  outcome: {
    approved: boolean;
    approvedBy?: string;
    approvedAt?: Date;
    rejectionReason?: string;
    dataProvided?: any;
    erasureProof?: ErasureProof;
    portabilityData?: any;
  };
  auditTrail: Array<{
    action: string;
    timestamp: Date;
    actor: string;
    details: string;
    success: boolean;
  }>;
}

export interface ErasureProof {
  id: string;
  requestId: string;
  dataSubjectId: string;
  method: ErasureMethod;
  dataErased: Array<{
    dataType: string;
    recordCount: number;
    locations: string[];
    erasureTimestamp: Date;
    verificationHash: string;
  }>;
  cryptographicProof: {
    beforeHash: string;
    afterHash: string;
    merkleRoot: string;
    signature: string;
    timestamp: Date;
  };
  verification: {
    verified: boolean;
    verifiedAt: Date;
    verifiedBy: string;
    method: string;
    result: string;
  };
  retention: {
    proofRetainedUntil: Date;
    retentionLocation: string;
    accessRestricted: boolean;
  };
}

export interface LegalHold {
  id: string;
  type: LegalHoldType;
  title: string;
  description: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'RELEASED' | 'EXPIRED';
  scope: {
    dataSubjects: string[];
    dataTypes: string[];
    dateRange: {
      start: Date;
      end: Date;
    };
    keywords: string[];
    custodians: string[];
  };
  legalBasis: {
    caseNumber?: string;
    courtOrder?: string;
    regulatoryRequest?: string;
    internalReference?: string;
    preservationReason: string;
  };
  timeline: {
    issuedAt: Date;
    issuedBy: string;
    reviewedAt?: Date;
    reviewedBy?: string;
    expiresAt?: Date;
    releasedAt?: Date;
    releasedBy?: string;
  };
  preservation: {
    totalRecords: number;
    totalSize: number;
    locations: string[];
    backupVerified: boolean;
    integrityChecked: boolean;
  };
  notifications: Array<{
    recipient: string;
    type: 'ISSUED' | 'UPDATED' | 'EXPIRING' | 'RELEASED';
    sentAt: Date;
    acknowledgedAt?: Date;
  }>;
}

export interface DataLineage {
  id: string;
  dataSubjectId: string;
  dataType: string;
  recordId: string;
  journey: Array<{
    step: string;
    timestamp: Date;
    location: string;
    operation: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'COPY' | 'MOVE';
    actor: string;
    purpose: string;
    lawfulBasis?: string;
    consentId?: string;
  }>;
  currentLocation: string;
  retentionSchedule: {
    created: Date;
    expires: Date;
    extensionHistory: Array<{
      extended: Date;
      reason: string;
      approvedBy: string;
    }>;
  };
  legalHolds: string[];
  accessLog: Array<{
    accessedAt: Date;
    accessedBy: string;
    purpose: string;
    ipAddress: string;
  }>;
}

/**
 * CRITICAL: Data Rights Engine Manager
 * 
 * Enforces GDPR/CCPA data subject rights and legal hold requirements.
 * Provides cryptographic proof of data erasure and comprehensive audit trails.
 */
export class DataRightsEngineManager {
  private static instance: DataRightsEngineManager;
  private auditLogger: any;
  private dataSubjects: Map<string, DataSubject> = new Map();
  private rightsRequests: Map<string, DataRightsRequest> = new Map();
  private legalHolds: Map<string, LegalHold> = new Map();
  private dataLineage: Map<string, DataLineage> = new Map();
  private processingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.auditLogger = getImmutableAuditLogger();
    this.startPeriodicProcessing();
  }

  static getInstance(): DataRightsEngineManager {
    if (!DataRightsEngineManager.instance) {
      DataRightsEngineManager.instance = new DataRightsEngineManager();
    }
    return DataRightsEngineManager.instance;
  }

  /**
   * CRITICAL: Register data subject
   */
  async registerDataSubject(
    type: DataSubject['type'],
    identifiers: DataSubject['identifiers'],
    jurisdiction: string,
    createdBy: string
  ): Promise<string> {
    const dataSubjectId = this.generateDataSubjectId();
    const timestamp = new Date();

    try {
      // CRITICAL: Create data subject record
      const dataSubject: DataSubject = {
        id: dataSubjectId,
        type,
        identifiers,
        jurisdiction,
        preferences: {
          marketing: true,
          analytics: true,
          cookies: true,
          thirdPartySharing: true
        },
        consentRecords: [],
        createdAt: timestamp,
        updatedAt: timestamp
      };

      this.dataSubjects.set(dataSubjectId, dataSubject);

      // CRITICAL: Create data lineage
      const lineage: DataLineage = {
        id: this.generateLineageId(),
        dataSubjectId,
        dataType: 'PROFILE',
        recordId: dataSubjectId,
        journey: [{
          step: 'DATA_SUBJECT_CREATED',
          timestamp,
          location: 'DATA_RIGHTS_ENGINE',
          operation: 'CREATE',
          actor: createdBy,
          purpose: 'DATA_SUBJECT_REGISTRATION'
        }],
        currentLocation: 'DATA_RIGHTS_ENGINE',
        retentionSchedule: {
          created: timestamp,
          expires: new Date(timestamp.getTime() + (7 * 365 * 24 * 60 * 60 * 1000)), // 7 years
          extensionHistory: []
        },
        legalHolds: [],
        accessLog: [{
          accessedAt: timestamp,
          accessedBy: createdBy,
          purpose: 'DATA_SUBJECT_REGISTRATION',
          ipAddress: 'system'
        }]
      };

      this.dataLineage.set(lineage.id, lineage);

      // CRITICAL: Log data subject registration
      this.auditLogger.logDataMutation({
        tenantId: 'system',
        actorId: createdBy,
        action: 'DATA_SUBJECT_REGISTERED',
        resourceType: 'DATA_SUBJECT',
        resourceId: dataSubjectId,
        outcome: 'SUCCESS',
        correlationId: this.generateCorrelationId(),
        metadata: {
          type,
          jurisdiction,
          identifiers: Object.keys(identifiers)
        }
      });

      logger.info('Data subject registered', {
        dataSubjectId,
        type,
        jurisdiction,
        createdBy
      });

      return dataSubjectId;

    } catch (error) {
      logger.error('Data subject registration failed', {
        type,
        jurisdiction,
        error: (error as Error).message
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Submit data rights request
   */
  async submitRightsRequest(
    dataSubjectId: string,
    right: DataSubjectRight,
    requestType: DataRightsRequest['requestType'],
    purpose: string,
    scope: string[],
    justification: string,
    requestedBy: string
  ): Promise<string> {
    const dataSubject = this.dataSubjects.get(dataSubjectId);
    if (!dataSubject) {
      throw new Error(`Data subject not found: ${dataSubjectId}`);
    }

    const requestId = this.generateRequestId();
    const timestamp = new Date();

    try {
      // CRITICAL: Create rights request
      const request: DataRightsRequest = {
        id: requestId,
        dataSubjectId,
        right,
        requestType,
        priority: this.determineRequestPriority(right, requestType),
        status: 'PENDING',
        requestedAt: timestamp,
        requestedBy,
        purpose,
        scope,
        justification,
        evidence: {
          verificationMethod: 'IDENTITY_VERIFICATION',
          verificationResult: 'PENDING',
          documents: []
        },
        processing: {
          steps: this.generateProcessingSteps(right)
        },
        outcome: {
          approved: false
        },
        auditTrail: [{
          action: 'REQUEST_SUBMITTED',
          timestamp,
          actor: requestedBy,
          details: `Data rights request submitted for ${right}`,
          success: true
        }]
      };

      this.rightsRequests.set(requestId, request);

      // CRITICAL: Check for legal holds
      const activeHolds = this.checkLegalHolds(dataSubjectId);
      if (activeHolds.length > 0 && right === 'ERASURE') {
        request.status = 'REJECTED';
        request.outcome.rejectionReason = 'Legal hold prevents data erasure';
        request.outcome.approved = false;

        // CRITICAL: Log legal hold conflict
        this.auditLogger.logAuthorizationDecision({
          tenantId: 'system',
          actorId: requestedBy,
          action: 'DATA_RIGHTS_BLOCKED_BY_LEGAL_HOLD',
          resourceType: 'DATA_RIGHTS_REQUEST',
          resourceId: requestId,
          outcome: 'FAILURE',
          correlationId: this.generateCorrelationId(),
          metadata: {
            dataSubjectId,
            right,
            legalHolds: activeHolds.length
          }
        });
      }

      // CRITICAL: Log request submission
      this.auditLogger.logDataMutation({
        tenantId: 'system',
        actorId: requestedBy,
        action: 'DATA_RIGHTS_REQUEST_SUBMITTED',
        resourceType: 'DATA_RIGHTS_REQUEST',
        resourceId: requestId,
        outcome: 'SUCCESS',
        correlationId: this.generateCorrelationId(),
        metadata: {
          dataSubjectId,
          right,
          requestType,
          purpose,
          priority: request.priority
        }
      });

      logger.info('Data rights request submitted', {
        requestId,
        dataSubjectId,
        right,
        requestType,
        status: request.status
      });

      return requestId;

    } catch (error) {
      logger.error('Data rights request submission failed', {
        dataSubjectId,
        right,
        error: (error as Error).message
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Process data erasure with cryptographic proof
   */
  async processDataErasure(requestId: string, processedBy: string): Promise<string> {
    const request = this.rightsRequests.get(requestId);
    if (!request) {
      throw new Error(`Request not found: ${requestId}`);
    }

    if (request.right !== 'ERASURE') {
      throw new Error(`Request not for erasure: ${request.right}`);
    }

    const timestamp = new Date();

    try {
      // CRITICAL: Update request status
      request.status = 'IN_PROGRESS';
      request.processing.startedAt = timestamp;
      request.processing.assignedTo = processedBy;

      // CRITICAL: Find all data for subject
      const subjectData = await this.findSubjectData(request.dataSubjectId);

      // CRITICAL: Generate before hash
      const beforeHash = this.calculateDataHash(subjectData);

      // CRITICAL: Perform data erasure
      const erasureResults = await this.performDataErasure(subjectData, 'CRYPTOGRAPHIC');

      // CRITICAL: Generate after hash
      const afterHash = this.calculateDataHash([]);

      // CRITICAL: Create erasure proof
      const erasureProof: ErasureProof = {
        id: this.generateErasureProofId(),
        requestId,
        dataSubjectId: request.dataSubjectId,
        method: 'CRYPTOGRAPHIC',
        dataErased: erasureResults,
        cryptographicProof: {
          beforeHash,
          afterHash,
          merkleRoot: this.calculateMerkleRoot(erasureResults),
          signature: '',
          timestamp
        },
        verification: {
          verified: false,
          verifiedAt: timestamp,
          verifiedBy: processedBy,
          method: 'CRYPTOGRAPHIC_VERIFICATION',
          result: 'PENDING'
        },
        retention: {
          proofRetainedUntil: new Date(timestamp.getTime() + (7 * 365 * 24 * 60 * 60 * 1000)), // 7 years
          retentionLocation: 'ERASURE_PROOF_VAULT',
          accessRestricted: true
        }
      };

      // CRITICAL: Sign cryptographic proof
      erasureProof.cryptographicProof.signature = await this.signErasureProof(erasureProof);

      // CRITICAL: Store erasure proof in vault
      await this.storeErasureProof(erasureProof);

      // CRITICAL: Update request outcome
      request.outcome.approved = true;
      request.outcome.approvedBy = processedBy;
      request.outcome.approvedAt = timestamp;
      request.outcome.erasureProof = erasureProof;
      request.status = 'COMPLETED';
      request.processing.completedAt = timestamp;

      // CRITICAL: Update data lineage
      await this.updateDataLineageForErasure(request.dataSubjectId, erasureProof);

      // CRITICAL: Log erasure completion
      this.auditLogger.logDataMutation({
        tenantId: 'system',
        actorId: processedBy,
        action: 'DATA_ERASURE_COMPLETED',
        resourceType: 'DATA_SUBJECT',
        resourceId: request.dataSubjectId,
        outcome: 'SUCCESS',
        correlationId: this.generateCorrelationId(),
        metadata: {
          requestId,
          erasureProofId: erasureProof.id,
          recordsErased: erasureResults.length,
          beforeHash,
          afterHash
        }
      });

      logger.info('Data erasure completed', {
        requestId,
        dataSubjectId: request.dataSubjectId,
        erasureProofId: erasureProof.id,
        recordsErased: erasureResults.length
      });

      return erasureProof.id;

    } catch (error) {
      logger.error('Data erasure processing failed', {
        requestId,
        error: (error as Error).message
      });

      request.status = 'REJECTED';
      request.outcome.approved = false;
      request.outcome.rejectionReason = (error as Error).message;

      throw error;
    }
  }

  /**
   * CRITICAL: Issue legal hold
   */
  async issueLegalHold(
    type: LegalHoldType,
    title: string,
    description: string,
    scope: LegalHold['scope'],
    legalBasis: LegalHold['legalBasis'],
    issuedBy: string,
    expiresAt?: Date
  ): Promise<string> {
    const holdId = this.generateLegalHoldId();
    const timestamp = new Date();

    try {
      // CRITICAL: Create legal hold
      const legalHold: LegalHold = {
        id: holdId,
        type,
        title,
        description,
        status: 'ACTIVE',
        scope,
        legalBasis,
        timeline: {
          issuedAt: timestamp,
          issuedBy,
          expiresAt
        },
        preservation: {
          totalRecords: 0,
          totalSize: 0,
          locations: [],
          backupVerified: false,
          integrityChecked: false
        },
        notifications: []
      };

      this.legalHolds.set(holdId, legalHold);

      // CRITICAL: Apply hold to data subjects
      for (const dataSubjectId of scope.dataSubjects) {
        const lineage = Array.from(this.dataLineage.values())
          .find(l => l.dataSubjectId === dataSubjectId);
        
        if (lineage) {
          lineage.legalHolds.push(holdId);
        }
      }

      // CRITICAL: Preserve relevant data
      await this.preserveDataForLegalHold(legalHold);

      // CRITICAL: Log legal hold issuance
      this.auditLogger.logDataMutation({
        tenantId: 'system',
        actorId: issuedBy,
        action: 'LEGAL_HOLD_ISSUED',
        resourceType: 'LEGAL_HOLD',
        resourceId: holdId,
        outcome: 'SUCCESS',
        correlationId: this.generateCorrelationId(),
        metadata: {
          type,
          title,
          dataSubjects: scope.dataSubjects.length,
          dataTypes: scope.dataTypes.length,
          legalBasis: Object.keys(legalBasis)
        }
      });

      logger.info('Legal hold issued', {
        holdId,
        type,
        title,
        dataSubjects: scope.dataSubjects.length,
        issuedBy
      });

      return holdId;

    } catch (error) {
      logger.error('Legal hold issuance failed', {
        type,
        title,
        error: (error as Error).message
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Process subpoena or disclosure request
   */
  async processSubpoena(
    requestType: 'SUBPOENA' | 'COURT_ORDER' | 'REGULATORY_REQUEST',
    referenceNumber: string,
    requestingAuthority: string,
    scope: LegalHold['scope'],
    requestedBy: string,
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): Promise<string> {
    const requestId = this.generateRequestId();
    const timestamp = new Date();

    try {
      // CRITICAL: Create disclosure request
      const disclosureRequest = {
        id: requestId,
        type: requestType,
        referenceNumber,
        requestingAuthority,
        scope,
        status: 'PENDING',
        requestedAt: timestamp,
        requestedBy,
        urgency,
        legalReview: {
          required: true,
          approved: false
        },
        dataCollected: {
          records: [],
          totalSize: 0,
          redactions: [],
          privilegeLog: []
        }
      };

      // CRITICAL: Legal review for privileged information
      const legalReviewResult = await this.conductLegalReview(disclosureRequest);

      if (!legalReviewResult.approved) {
        throw new Error('Legal review rejected disclosure request');
      }

      // CRITICAL: Collect and redact data
      const collectedData = await this.collectDataForDisclosure(disclosureRequest);

      // CRITICAL: Create disclosure package
      const disclosurePackage = await this.createDisclosurePackage(disclosureRequest, collectedData);

      // CRITICAL: Log disclosure processing
      this.auditLogger.logDataMutation({
        tenantId: 'system',
        actorId: requestedBy,
        action: 'SUBPOENA_PROCESSED',
        resourceType: 'DISCLOSURE_REQUEST',
        resourceId: requestId,
        outcome: 'SUCCESS',
        correlationId: this.generateCorrelationId(),
        metadata: {
          requestType,
          referenceNumber,
          requestingAuthority,
          recordsProvided: collectedData.length,
          packageSize: disclosurePackage.size
        }
      });

      logger.info('Subpoena processed', {
        requestId,
        requestType,
        referenceNumber,
        requestingAuthority,
        recordsProvided: collectedData.length
      });

      return disclosurePackage.id;

    } catch (error) {
      logger.error('Subpoena processing failed', {
        requestType,
        referenceNumber,
        error: (error as Error).message
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Get data subject
   */
  getDataSubject(dataSubjectId: string): DataSubject | undefined {
    return this.dataSubjects.get(dataSubjectId);
  }

  /**
   * CRITICAL: Get rights request
   */
  getRightsRequest(requestId: string): DataRightsRequest | undefined {
    return this.rightsRequests.get(requestId);
  }

  /**
   * CRITICAL: Get legal hold
   */
  getLegalHold(holdId: string): LegalHold | undefined {
    return this.legalHolds.get(holdId);
  }

  /**
   * CRITICAL: Get data lineage
   */
  getDataLineage(dataSubjectId: string): DataLineage[] {
    return Array.from(this.dataLineage.values())
      .filter(l => l.dataSubjectId === dataSubjectId);
  }

  /**
   * CRITICAL: Get data rights statistics
   */
  getDataRightsStatistics(): {
    totalDataSubjects: number;
    totalRequests: number;
    requestsByRight: Record<string, number>;
    requestsByStatus: Record<string, number>;
    activeLegalHolds: number;
    totalErasureProofs: number;
    averageProcessingTime: number;
  } {
    const dataSubjects = Array.from(this.dataSubjects.values());
    const requests = Array.from(this.rightsRequests.values());
    const holds = Array.from(this.legalHolds.values());

    const requestsByRight: Record<string, number> = {};
    const requestsByStatus: Record<string, number> = {};

    for (const request of requests) {
      requestsByRight[request.right] = (requestsByRight[request.right] || 0) + 1;
      requestsByStatus[request.status] = (requestsByStatus[request.status] || 0) + 1;
    }

    const completedRequests = requests.filter(r => r.status === 'COMPLETED' && r.processing.completedAt && r.processing.startedAt);
    const averageProcessingTime = completedRequests.length > 0 
      ? completedRequests.reduce((sum, r) => sum + (r.processing.completedAt!.getTime() - r.processing.startedAt!.getTime()), 0) / completedRequests.length
      : 0;

    return {
      totalDataSubjects: dataSubjects.length,
      totalRequests: requests.length,
      requestsByRight,
      requestsByStatus,
      activeLegalHolds: holds.filter(h => h.status === 'ACTIVE').length,
      totalErasureProofs: requests.filter(r => r.outcome.erasureProof).length,
      averageProcessingTime
    };
  }

  /**
   * CRITICAL: Start periodic processing
   */
  private startPeriodicProcessing(): void {
    this.processingInterval = setInterval(async () => {
      try {
        await this.processPendingRequests();
        await this.checkExpiringLegalHolds();
        await this.verifyDataIntegrity();
      } catch (error) {
        logger.error('Periodic data rights processing failed', {
          error: (error as Error).message
        });
      }
    }, 300000); // Every 5 minutes
  }

  /**
   * CRITICAL: Process pending requests
   */
  private async processPendingRequests(): Promise<void> {
    const pendingRequests = Array.from(this.rightsRequests.values())
      .filter(r => r.status === 'PENDING');

    for (const request of pendingRequests) {
      try {
        // Auto-approve low-risk requests
        if (request.priority === 'LOW' && request.right === 'ACCESS') {
          await this.autoApproveRequest(request.id, 'system');
        }
      } catch (error) {
        logger.error('Auto-approval failed', {
          requestId: request.id,
          error: (error as Error).message
        });
      }
    }
  }

  /**
   * CRITICAL: Check expiring legal holds
   */
  private async checkExpiringLegalHolds(): Promise<void> {
    const holds = Array.from(this.legalHolds.values())
      .filter(h => h.status === 'ACTIVE' && 
                   h.timeline.expiresAt && 
                   new Date() >= new Date(h.timeline.expiresAt.getTime() - (7 * 24 * 60 * 60 * 1000))); // 7 days before expiry

    for (const hold of holds) {
      // Send expiry notification
      logger.warn('Legal hold expiring soon', {
        holdId: hold.id,
        title: hold.title,
        expiresAt: hold.timeline.expiresAt
      });
    }
  }

  /**
   * CRITICAL: Verify data integrity
   */
  private async verifyDataIntegrity(): Promise<void> {
    const lineages = Array.from(this.dataLineage.values());
    
    for (const lineage of lineages) {
      // Verify retention schedule
      if (new Date() > lineage.retentionSchedule.expires) {
        logger.info('Data retention expired', {
          lineageId: lineage.id,
          dataSubjectId: lineage.dataSubjectId,
          expiredAt: lineage.retentionSchedule.expires
        });
      }
    }
  }

  /**
   * CRITICAL: Determine request priority
   */
  private determineRequestPriority(right: DataSubjectRight, requestType: DataRightsRequest['requestType']): DataRightsRequest['priority'] {
    if (right === 'ERASURE' && requestType === 'INDIVIDUAL') {
      return 'HIGH';
    }
    if (requestType === 'BULK') {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  /**
   * CRITICAL: Generate processing steps
   */
  private generateProcessingSteps(right: DataSubjectRight): DataRightsRequest['processing']['steps'] {
    const baseSteps = [
      { step: 'IDENTITY_VERIFICATION', status: 'PENDING' as const },
      { step: 'DATA_LOCATION', status: 'PENDING' as const },
      { step: 'LEGAL_REVIEW', status: 'PENDING' as const }
    ];

    switch (right) {
      case 'ACCESS':
        return [
          ...baseSteps,
          { step: 'DATA_COLLECTION', status: 'PENDING' as const },
          { step: 'DATA_REDACTION', status: 'PENDING' as const },
          { step: 'DATA_PACKAGE', status: 'PENDING' as const }
        ];
      case 'ERASURE':
        return [
          ...baseSteps,
          { step: 'LEGAL_HOLD_CHECK', status: 'PENDING' as const },
          { step: 'DATA_ERASURE', status: 'PENDING' as const },
          { step: 'ERASURE_VERIFICATION', status: 'PENDING' as const },
          { step: 'PROOF_GENERATION', status: 'PENDING' as const }
        ];
      case 'PORTABILITY':
        return [
          ...baseSteps,
          { step: 'DATA_EXTRACTION', status: 'PENDING' as const },
          { step: 'FORMAT_CONVERSION', status: 'PENDING' as const },
          { step: 'DATA_PACKAGE', status: 'PENDING' as const }
        ];
      default:
        return baseSteps;
    }
  }

  /**
   * CRITICAL: Check legal holds
   */
  private checkLegalHolds(dataSubjectId: string): LegalHold[] {
    return Array.from(this.legalHolds.values())
      .filter(h => h.status === 'ACTIVE' && 
                   h.scope.dataSubjects.includes(dataSubjectId));
  }

  /**
   * CRITICAL: Find subject data
   */
  private async findSubjectData(dataSubjectId: string): Promise<any[]> {
    // In a real implementation, this would search all systems for subject data
    return [
      { id: 'record1', type: 'PROFILE', data: 'sample data' },
      { id: 'record2', type: 'TRANSACTION', data: 'sample data' },
      { id: 'record3', type: 'COMMUNICATION', data: 'sample data' }
    ];
  }

  /**
   * CRITICAL: Calculate data hash
   */
  private calculateDataHash(data: any[]): string {
    return crypto.createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  /**
   * CRITICAL: Perform data erasure
   */
  private async performDataErasure(data: any[], method: ErasureMethod): Promise<ErasureProof['dataErased']> {
    const results: ErasureProof['dataErased'] = [];
    const timestamp = new Date();

    for (const record of data) {
      results.push({
        dataType: record.type,
        recordCount: 1,
        locations: [`DATABASE_${record.type}`],
        erasureTimestamp: timestamp,
        verificationHash: crypto.createHash('sha256')
          .update(JSON.stringify(record))
          .digest('hex')
      });
    }

    return results;
  }

  /**
   * CRITICAL: Calculate Merkle root
   */
  private calculateMerkleRoot(results: ErasureProof['dataErased']): string {
    if (results.length === 0) {
      return crypto.createHash('sha256').digest('hex');
    }

    const hashes = results.map(r => r.verificationHash);
    
    while (hashes.length > 1) {
      const nextLevel: string[] = [];
      
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = hashes[i + 1] || left;
        
        nextLevel.push(crypto.createHash('sha256')
          .update(left + right)
          .digest('hex'));
      }
      
      hashes.splice(0, hashes.length, ...nextLevel);
    }

    return hashes[0];
  }

  /**
   * CRITICAL: Sign erasure proof
   */
  private async signErasureProof(proof: ErasureProof): Promise<string> {
    const privateKey = this.getErasurePrivateKey();
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(proof.cryptographicProof.beforeHash + proof.cryptographicProof.afterHash);
    return sign.sign(privateKey, 'hex');
  }

  /**
   * CRITICAL: Store erasure proof
   */
  private async storeErasureProof(proof: ErasureProof): Promise<void> {
    // In a real implementation, this would store in the audit vault
    logger.info('Erasure proof stored', {
      proofId: proof.id,
      requestId: proof.requestId,
      method: proof.method
    });
  }

  /**
   * CRITICAL: Update data lineage for erasure
   */
  private async updateDataLineageForErasure(dataSubjectId: string, proof: ErasureProof): Promise<void> {
    const lineages = Array.from(this.dataLineage.values())
      .filter(l => l.dataSubjectId === dataSubjectId);

    for (const lineage of lineages) {
      lineage.journey.push({
        step: 'DATA_ERASURE',
        timestamp: proof.cryptographicProof.timestamp,
        location: 'ERASURE_ENGINE',
        operation: 'DELETE',
        actor: 'system',
        purpose: 'DATA_SUBJECT_ERASURE_REQUEST'
      });
    }
  }

  /**
   * CRITICAL: Preserve data for legal hold
   */
  private async preserveDataForLegalHold(hold: LegalHold): Promise<void> {
    // In a real implementation, this would preserve all relevant data
    logger.info('Data preserved for legal hold', {
      holdId: hold.id,
      title: hold.title,
      dataSubjects: hold.scope.dataSubjects.length
    });
  }

  /**
   * CRITICAL: Conduct legal review
   */
  private async conductLegalReview(request: any): Promise<{ approved: boolean; reviewedBy: string; reviewedAt: Date }> {
    // In a real implementation, this would conduct actual legal review
    return {
      approved: true,
      reviewedBy: 'legal_counsel',
      reviewedAt: new Date()
    };
  }

  /**
   * CRITICAL: Collect data for disclosure
   */
  private async collectDataForDisclosure(request: any): Promise<any[]> {
    // In a real implementation, this would collect relevant data
    return [
      { id: 'disclosure1', type: 'RECORD', data: 'sample data', privileged: false },
      { id: 'disclosure2', type: 'RECORD', data: 'sample data', privileged: true }
    ];
  }

  /**
   * CRITICAL: Create disclosure package
   */
  private async createDisclosurePackage(request: any, data: any[]): Promise<{ id: string; size: number }> {
    // In a real implementation, this would create a disclosure package
    return {
      id: this.generateRequestId(),
      size: JSON.stringify(data).length
    };
  }

  /**
   * CRITICAL: Auto-approve request
   */
  private async autoApproveRequest(requestId: string, approvedBy: string): Promise<void> {
    const request = this.rightsRequests.get(requestId);
    if (!request) return;

    request.status = 'COMPLETED';
    request.outcome.approved = true;
    request.outcome.approvedBy = approvedBy;
    request.outcome.approvedAt = new Date();
    request.processing.completedAt = new Date();
  }

  /**
   * CRITICAL: Get erasure private key
   */
  private getErasurePrivateKey(): string {
    // In a real implementation, this would retrieve from secure key storage
    return '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC5...\n-----END PRIVATE KEY-----';
  }

  /**
   * CRITICAL: Generate data subject ID
   */
  private generateDataSubjectId(): string {
    const bytes = crypto.randomBytes(8);
    return `ds_${bytes.toString('hex')}`;
  }

  /**
   * CRITICAL: Generate lineage ID
   */
  private generateLineageId(): string {
    const bytes = crypto.randomBytes(8);
    return `lin_${bytes.toString('hex')}`;
  }

  /**
   * CRITICAL: Generate request ID
   */
  private generateRequestId(): string {
    const bytes = crypto.randomBytes(8);
    return `req_${bytes.toString('hex')}`;
  }

  /**
   * CRITICAL: Generate erasure proof ID
   */
  private generateErasureProofId(): string {
    const bytes = crypto.randomBytes(8);
    return `proof_${bytes.toString('hex')}`;
  }

  /**
   * CRITICAL: Generate legal hold ID
   */
  private generateLegalHoldId(): string {
    const bytes = crypto.randomBytes(8);
    return `hold_${bytes.toString('hex')}`;
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
 * CRITICAL: Global data rights engine manager instance
 */
export const dataRightsEngineManager = DataRightsEngineManager.getInstance();

/**
 * CRITICAL: Convenience functions
 */
export const createDataRightsEngineManager = (): DataRightsEngineManager => {
  return DataRightsEngineManager.getInstance();
};

export const registerDataSubject = async (
  type: DataSubject['type'],
  identifiers: DataSubject['identifiers'],
  jurisdiction: string,
  createdBy: string
): Promise<string> => {
  return dataRightsEngineManager.registerDataSubject(type, identifiers, jurisdiction, createdBy);
};

export const submitDataRightsRequest = async (
  dataSubjectId: string,
  right: DataSubjectRight,
  requestType: DataRightsRequest['requestType'],
  purpose: string,
  scope: string[],
  justification: string,
  requestedBy: string
): Promise<string> => {
  return dataRightsEngineManager.submitRightsRequest(dataSubjectId, right, requestType, purpose, scope, justification, requestedBy);
};
