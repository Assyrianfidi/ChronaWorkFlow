import { EventEmitter } from 'events';
import { createHash, createHmac } from 'crypto';
import { Readable, Transform } from 'stream';
import { ImmutableAuditLogger } from '../compliance/immutable-audit-log';
import { GovernanceModelManager } from '../governance/governance-model';
import { UsageMeter } from '../monetization/usage-meter';
import { BillingEngine } from '../monetization/billing-engine';
import { GrowthEngine } from '../monetization/growth-engine';
import { RetentionAutomationEngine } from '../monetization/retention-automation';

export interface DataSource {
  id: string;
  name: string;
  type: 'DATABASE' | 'EVENT_STREAM' | 'FILE' | 'API' | 'AUDIT_LOG';
  tenantId?: string;
  connectionConfig: ConnectionConfig;
  schema: DataSchema;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isActive: boolean;
  lastIngested?: Date;
  metadata: { [key: string]: any };
}

export interface ConnectionConfig {
  host?: string;
  port?: number;
  database?: string;
  credentials?: {
    username: string;
    password: string;
    apiKey?: string;
  };
  options: { [key: string]: any };
  encryptionKey?: string;
}

export interface DataSchema {
  fields: SchemaField[];
  primaryKey: string;
  tenantField: string;
  timestampField: string;
  indexes: string[];
  encryption: EncryptionConfig;
}

export interface SchemaField {
  name: string;
  type: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'JSON' | 'BINARY';
  required: boolean;
  encrypted: boolean;
  pii: boolean;
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: 'REGEX' | 'RANGE' | 'ENUM' | 'CUSTOM';
  rule: string;
  errorMessage: string;
}

export interface EncryptionConfig {
  enabled: boolean;
  algorithm: string;
  keyId: string;
  fields: string[];
}

export interface IngestionJob {
  id: string;
  name: string;
  sourceId: string;
  tenantId?: string;
  type: 'REAL_TIME' | 'BATCH' | 'SCHEDULED';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  config: IngestionConfig;
  schedule?: ScheduleConfig;
  progress: JobProgress;
  metrics: JobMetrics;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  lastRun?: Date;
  nextRun?: Date;
  errorCount: number;
  lastError?: string;
}

export interface IngestionConfig {
  batchSize: number;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  validation: ValidationConfig;
  transformation: TransformationConfig;
  enrichment: EnrichmentConfig;
  deduplication: DeduplicationConfig;
  quality: QualityConfig;
}

export interface ValidationConfig {
  enabled: boolean;
  strictMode: boolean;
  customRules: ValidationRule[];
  errorHandling: 'FAIL' | 'SKIP' | 'QUARANTINE';
  quarantineThreshold: number;
}

export interface TransformationConfig {
  enabled: boolean;
  mappings: FieldMapping[];
  aggregations: AggregationRule[];
  calculations: CalculationRule[];
  filters: FilterRule[];
}

export interface FieldMapping {
  source: string;
  target: string;
  transform?: string;
  defaultValue?: any;
}

export interface AggregationRule {
  name: string;
  groupBy: string[];
  aggregations: { field: string; function: 'SUM' | 'AVG' | 'COUNT' | 'MAX' | 'MIN' }[];
  window?: string;
}

export interface CalculationRule {
  name: string;
  expression: string;
  dependencies: string[];
}

export interface FilterRule {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS';
  value: any;
}

export interface EnrichmentConfig {
  enabled: boolean;
  sources: EnrichmentSource[];
  lookups: LookupRule[];
  joins: JoinRule[];
}

export interface EnrichmentSource {
  id: string;
  type: 'DATABASE' | 'API' | 'CACHE';
  config: ConnectionConfig;
  cacheTtl: number;
}

export interface LookupRule {
  name: string;
  sourceField: string;
  targetField: string;
  sourceId: string;
  lookupKey: string;
  defaultValue?: any;
}

export interface JoinRule {
  name: string;
  leftField: string;
  rightField: string;
  sourceId: string;
  joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
}

export interface DeduplicationConfig {
  enabled: boolean;
  strategy: 'PRIMARY_KEY' | 'HASH' | 'FINGERPRINT' | 'CUSTOM';
  keyFields: string[];
  windowSize: number;
  action: 'SKIP' | 'UPDATE' | 'MERGE';
}

export interface QualityConfig {
  enabled: boolean;
  completeness: QualityRule;
  accuracy: QualityRule;
  consistency: QualityRule;
  timeliness: QualityRule;
}

export interface QualityRule {
  threshold: number;
  action: 'WARN' | 'FAIL' | 'QUARANTINE';
  rules: string[];
}

export interface ScheduleConfig {
  type: 'INTERVAL' | 'CRON' | 'EVENT';
  expression: string;
  timezone: string;
  enabled: boolean;
}

export interface JobProgress {
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  quarantinedRecords: number;
  percentage: number;
  currentBatch: number;
  totalBatches: number;
}

export interface JobMetrics {
  recordsPerSecond: number;
  averageLatency: number;
  errorRate: number;
  qualityScore: number;
  memoryUsage: number;
  cpuUsage: number;
  networkIO: number;
  diskIO: number;
}

export interface DataRecord {
  id: string;
  tenantId: string;
  sourceId: string;
  jobId: string;
  data: { [key: string]: any };
  metadata: RecordMetadata;
  hash: string;
  previousHash?: string;
  timestamp: Date;
  ingestedAt: Date;
  quality: QualityMetrics;
}

export interface RecordMetadata {
  version: number;
  source: string;
  checksum: string;
  encrypted: boolean;
  piiFields: string[];
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  retention: number;
  legalHold: boolean;
}

export interface QualityMetrics {
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  overall: number;
  issues: QualityIssue[];
}

export interface QualityIssue {
  type: 'MISSING' | 'INVALID' | 'INCONSISTENT' | 'LATE' | 'DUPLICATE';
  field: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  value: any;
}

export interface IngestionQueue {
  id: string;
  name: string;
  type: 'FIFO' | 'PRIORITY' | 'DELAYED';
  maxSize: number;
  currentSize: number;
  processingRate: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  tenantIsolation: boolean;
  encryptionEnabled: boolean;
  deadLetterQueue: string;
}

export class DataIngestionEngine extends EventEmitter {
  private static instance: DataIngestionEngine;
  private auditLog: ImmutableAuditLogger;
  private governance: GovernanceModelManager;
  private sources: Map<string, DataSource> = new Map();
  private jobs: Map<string, IngestionJob> = new Map();
  private queues: Map<string, IngestionQueue> = new Map();
  private processingJobs: Map<string, Promise<void>> = new Map();
  private hashChains: Map<string, string[]> = new Map();
  private isRunning: boolean = false;

  private constructor() {
    super();
    this.auditLog = new ImmutableAuditLogger();
    this.governance = GovernanceModelManager.getInstance();
    this.initializeDefaultQueues();
    this.startEventLoop();
  }

  public static getInstance(): DataIngestionEngine {
    if (!DataIngestionEngine.instance) {
      DataIngestionEngine.instance = new DataIngestionEngine();
    }
    return DataIngestionEngine.instance;
  }

  private initializeDefaultQueues(): void {
    const queues: IngestionQueue[] = [
      {
        id: 'critical_queue',
        name: 'Critical Data Queue',
        type: 'PRIORITY',
        maxSize: 10000,
        currentSize: 0,
        processingRate: 1000,
        priority: 'CRITICAL',
        tenantIsolation: true,
        encryptionEnabled: true,
        deadLetterQueue: 'critical_dlq'
      },
      {
        id: 'high_priority_queue',
        name: 'High Priority Queue',
        type: 'PRIORITY',
        maxSize: 50000,
        currentSize: 0,
        processingRate: 500,
        priority: 'HIGH',
        tenantIsolation: true,
        encryptionEnabled: true,
        deadLetterQueue: 'high_priority_dlq'
      },
      {
        id: 'standard_queue',
        name: 'Standard Queue',
        type: 'FIFO',
        maxSize: 100000,
        currentSize: 0,
        processingRate: 200,
        priority: 'MEDIUM',
        tenantIsolation: true,
        encryptionEnabled: true,
        deadLetterQueue: 'standard_dlq'
      },
      {
        id: 'batch_queue',
        name: 'Batch Queue',
        type: 'DELAYED',
        maxSize: 50000,
        currentSize: 0,
        processingRate: 100,
        priority: 'LOW',
        tenantIsolation: true,
        encryptionEnabled: true,
        deadLetterQueue: 'batch_dlq'
      }
    ];

    queues.forEach(queue => {
      this.queues.set(queue.id, queue);
    });
  }

  private startEventLoop(): void {
    this.isRunning = true;
    setInterval(() => {
      this.processQueues();
      this.cleanupCompletedJobs();
      this.updateMetrics();
    }, 1000);
  }

  public async registerDataSource(source: DataSource): Promise<void> {
    try {
      // Validate source configuration
      await this.validateDataSource(source);

      // Test connection
      await this.testConnection(source);

      // Register source
      this.sources.set(source.id, source);

      // Log registration
      await this.auditLog.logOperation({
        tenantId: source.tenantId || 'SYSTEM',
        userId: 'SYSTEM',
        action: 'REGISTER_DATA_SOURCE',
        details: {
          sourceId: source.id,
          sourceName: source.name,
          sourceType: source.type,
          tenantId: source.tenantId
        },
        ipAddress: 'SYSTEM',
        userAgent: 'DATA_INGESTION_ENGINE',
        timestamp: new Date(),
        category: 'DATA_INGESTION',
        severity: 'INFO'
      });

      this.emit('sourceRegistered', source);
    } catch (error) {
      await this.auditLog.logOperation({
        tenantId: source.tenantId || 'SYSTEM',
        userId: 'SYSTEM',
        action: 'REGISTER_DATA_SOURCE_ERROR',
        details: {
          sourceId: source.id,
          error: (error as Error).message
        },
        ipAddress: 'SYSTEM',
        userAgent: 'DATA_INGESTION_ENGINE',
        timestamp: new Date(),
        category: 'DATA_INGESTION',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  public async createIngestionJob(job: Omit<IngestionJob, 'id' | 'progress' | 'metrics' | 'createdAt' | 'errorCount'>): Promise<string> {
    const jobId = this.generateJobId();
    const ingestionJob: IngestionJob = {
      ...job,
      id: jobId,
      progress: {
        totalRecords: 0,
        processedRecords: 0,
        successfulRecords: 0,
        failedRecords: 0,
        quarantinedRecords: 0,
        percentage: 0,
        currentBatch: 0,
        totalBatches: 0
      },
      metrics: {
        recordsPerSecond: 0,
        averageLatency: 0,
        errorRate: 0,
        qualityScore: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        networkIO: 0,
        diskIO: 0
      },
      createdAt: new Date(),
      errorCount: 0
    };

    this.jobs.set(jobId, ingestionJob);

    // Schedule job if needed
    if (job.schedule) {
      this.scheduleJob(ingestionJob);
    } else {
      // Add to queue immediately
      await this.queueJob(ingestionJob);
    }

    await this.auditLog.logOperation({
      tenantId: job.tenantId || 'SYSTEM',
      userId: 'SYSTEM',
      action: 'CREATE_INGESTION_JOB',
      details: {
        jobId,
        sourceId: job.sourceId,
        jobType: job.type,
        priority: job.priority
      },
      ipAddress: 'SYSTEM',
      userAgent: 'DATA_INGESTION_ENGINE',
      timestamp: new Date(),
      category: 'DATA_INGESTION',
      severity: 'INFO'
    });

    return jobId;
  }

  private async queueJob(job: IngestionJob): Promise<void> {
    const queueId = this.getQueueId(job.priority);
    const queue = this.queues.get(queueId);
    
    if (!queue) {
      throw new Error(`Queue not found for priority: ${job.priority}`);
    }

    if (queue.currentSize >= queue.maxSize) {
      throw new Error(`Queue ${queueId} is full`);
    }

    queue.currentSize++;
    job.status = 'PENDING';
    
    this.emit('jobQueued', job);
  }

  private getQueueId(priority: IngestionJob['priority']): string {
    switch (priority) {
      case 'CRITICAL': return 'critical_queue';
      case 'HIGH': return 'high_priority_queue';
      case 'MEDIUM': return 'standard_queue';
      case 'LOW': return 'batch_queue';
      default: return 'standard_queue';
    }
  }

  private async processQueues(): Promise<void> {
    if (!this.isRunning) return;

    // Process queues in priority order
    const queueOrder = ['critical_queue', 'high_priority_queue', 'standard_queue', 'batch_queue'];
    
    for (const queueId of queueOrder) {
      const queue = this.queues.get(queueId);
      if (!queue || queue.currentSize === 0) continue;

      // Get next job from queue
      const job = await this.getNextJob(queueId);
      if (!job) continue;

      // Start processing job
      await this.startJob(job);
    }
  }

  private async getNextJob(queueId: string): Promise<IngestionJob | null> {
    // Find next pending job for this queue
    for (const job of this.jobs.values()) {
      if (job.status === 'PENDING' && this.getQueueId(job.priority) === queueId) {
        return job;
      }
    }
    return null;
  }

  private async startJob(job: IngestionJob): Promise<void> {
    if (this.processingJobs.has(job.id)) {
      return; // Already processing
    }

    job.status = 'RUNNING';
    job.startedAt = new Date();
    job.lastRun = new Date();

    const processingPromise = this.processJob(job);
    this.processingJobs.set(job.id, processingPromise);

    processingPromise
      .then(() => {
        this.processingJobs.delete(job.id);
        this.emit('jobCompleted', job);
      })
      .catch((error) => {
        this.processingJobs.delete(job.id);
        this.handleJobError(job, error);
      });

    await this.auditLog.logOperation({
      tenantId: job.tenantId || 'SYSTEM',
      userId: 'SYSTEM',
      action: 'START_INGESTION_JOB',
      details: {
        jobId: job.id,
        sourceId: job.sourceId
      },
      ipAddress: 'SYSTEM',
      userAgent: 'DATA_INGESTION_ENGINE',
      timestamp: new Date(),
      category: 'DATA_INGESTION',
      severity: 'INFO'
    });
  }

  private async processJob(job: IngestionJob): Promise<void> {
    const source = this.sources.get(job.sourceId);
    if (!source) {
      throw new Error(`Source not found: ${job.sourceId}`);
    }

    // Get data from source
    const dataStream = await this.getDataFromSource(source, job);
    
    // Process data stream
    const processedStream = this.createProcessingStream(job);
    
    // Pipe data through processing pipeline
    dataStream.pipe(processedStream);

    return new Promise((resolve, reject) => {
      processedStream.on('finish', () => {
        job.status = 'COMPLETED';
        job.completedAt = new Date();
        resolve();
      });

      processedStream.on('error', (error) => {
        job.status = 'FAILED';
        job.lastError = error.message;
        job.errorCount++;
        reject(error);
      });
    });
  }

  private async getDataFromSource(source: DataSource, job: IngestionJob): Promise<Readable> {
    switch (source.type) {
      case 'DATABASE':
        return this.getDatabaseData(source, job);
      case 'EVENT_STREAM':
        return this.getEventData(source, job);
      case 'FILE':
        return this.getFileData(source, job);
      case 'API':
        return this.getApiData(source, job);
      case 'AUDIT_LOG':
        return this.getAuditData(source, job);
      default:
        throw new Error(`Unsupported source type: ${source.type}`);
    }
  }

  private createProcessingStream(job: IngestionJob): Transform {
    return new Transform({
      objectMode: true,
      transform: async (chunk, encoding, callback) => {
        try {
          const processedRecord = await this.processRecord(chunk, job);
          callback(null, processedRecord);
        } catch (error) {
          callback(error as Error);
        }
      }
    });
  }

  private async processRecord(record: any, job: IngestionJob): Promise<DataRecord> {
    // Extract tenant ID
    const tenantId = record[job.config.transformation.mappings.find(m => m.target === 'tenantId')?.source || 'tenantId'] || job.tenantId;

    // Validate record
    const validationResult = await this.validateRecord(record, job);
    if (!validationResult.valid && job.config.validation.errorHandling === 'FAIL') {
      throw new Error(`Record validation failed: ${validationResult.errors.join(', ')}`);
    }

    // Transform record
    const transformedRecord = await this.transformRecord(record, job);

    // Enrich record
    const enrichedRecord = await this.enrichRecord(transformedRecord, job);

    // Check for duplicates
    const isDuplicate = await this.checkDuplicate(enrichedRecord, job);
    if (isDuplicate && job.config.deduplication.action === 'SKIP') {
      return null as any; // Skip duplicate
    }

    // Calculate quality metrics
    const quality = await this.calculateQuality(enrichedRecord, job);

    // Create final record
    const dataRecord: DataRecord = {
      id: this.generateRecordId(),
      tenantId,
      sourceId: job.sourceId,
      jobId: job.id,
      data: enrichedRecord,
      metadata: {
        version: 1,
        source: job.sourceId,
        checksum: this.calculateChecksum(enrichedRecord),
        encrypted: false,
        piiFields: this.identifyPIIFields(enrichedRecord),
        classification: 'INTERNAL',
        retention: 2555, // 7 years default
        legalHold: false
      },
      hash: this.calculateRecordHash(enrichedRecord),
      timestamp: new Date(),
      ingestedAt: new Date(),
      quality
    };

    // Add to hash chain
    await this.addToHashChain(dataRecord);

    // Update job progress
    job.progress.processedRecords++;
    job.progress.successfulRecords++;
    job.progress.percentage = (job.progress.processedRecords / job.progress.totalRecords) * 100;

    return dataRecord;
  }

  private async validateRecord(record: any, job: IngestionJob): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (job.config.validation.enabled) {
      // Apply validation rules
      for (const rule of job.config.validation.customRules) {
        const result = await this.applyValidationRule(record, rule);
        if (!result.valid) {
          errors.push(result.error);
        }
      }

      // Schema validation
      const source = this.sources.get(job.sourceId);
      if (source) {
        for (const field of source.schema.fields) {
          if (field.required && record[field.name] === undefined) {
            errors.push(`Required field missing: ${field.name}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private async applyValidationRule(record: any, rule: ValidationRule): Promise<{ valid: boolean; error: string }> {
    switch (rule.type) {
      case 'REGEX':
        {
          const regex = new RegExp(rule.rule);
          const value = record[rule.rule.split(':')[0]];
          return {
            valid: regex.test(value),
            error: rule.errorMessage
          };
        }
      case 'RANGE':
        // Implementation for range validation
        return { valid: true, error: '' };
      case 'ENUM':
        // Implementation for enum validation
        return { valid: true, error: '' };
      case 'CUSTOM':
        // Implementation for custom validation
        return { valid: true, error: '' };
      default:
        return { valid: true, error: '' };
    }
  }

  private async transformRecord(record: any, job: IngestionJob): Promise<any> {
    let transformed = { ...record };

    if (job.config.transformation.enabled) {
      // Apply field mappings
      for (const mapping of job.config.transformation.mappings) {
        const sourceValue = record[mapping.source];
        if (sourceValue !== undefined) {
          transformed[mapping.target] = mapping.transform ? 
            this.applyTransform(sourceValue, mapping.transform) : 
            sourceValue;
        } else if (mapping.defaultValue !== undefined) {
          transformed[mapping.target] = mapping.defaultValue;
        }
      }

      // Apply filters
      for (const filter of job.config.transformation.filters) {
        transformed = this.applyFilter(transformed, filter);
      }

      // Apply calculations
      for (const calc of job.config.transformation.calculations) {
        transformed[calc.name] = this.calculateValue(transformed, calc.expression);
      }
    }

    return transformed;
  }

  private applyTransform(value: any, transform: string): any {
    // Simple transform implementation
    switch (transform) {
      case 'UPPERCASE':
        return String(value).toUpperCase();
      case 'LOWERCASE':
        return String(value).toLowerCase();
      case 'TRIM':
        return String(value).trim();
      case 'TO_NUMBER':
        return Number(value);
      case 'TO_DATE':
        return new Date(value);
      default:
        return value;
    }
  }

  private applyFilter(record: any, filter: FilterRule): any {
    const fieldValue = record[filter.field];
    let matches = false;

    switch (filter.operator) {
      case 'EQUALS':
        matches = fieldValue === filter.value;
        break;
      case 'NOT_EQUALS':
        matches = fieldValue !== filter.value;
        break;
      case 'GREATER_THAN':
        matches = fieldValue > filter.value;
        break;
      case 'LESS_THAN':
        matches = fieldValue < filter.value;
        break;
      case 'CONTAINS':
        matches = String(fieldValue).includes(String(filter.value));
        break;
    }

    return matches ? record : null;
  }

  private calculateValue(record: any, expression: string): any {
    // Simple expression evaluation
    // In production, use a proper expression parser
    try {
      const context = { ...record };
      const func = new Function(...Object.keys(context), `return ${expression}`);
      return func(...Object.values(context));
    } catch {
      return null;
    }
  }

  private async enrichRecord(record: any, job: IngestionJob): Promise<any> {
    let enriched = { ...record };

    if (job.config.enrichment.enabled) {
      // Apply lookups
      for (const lookup of job.config.enrichment.lookups) {
        const lookupValue = await this.performLookup(record, lookup);
        if (lookupValue !== null) {
          enriched[lookup.targetField] = lookupValue;
        }
      }

      // Apply joins
      for (const join of job.config.enrichment.joins) {
        const joinedData = await this.performJoin(record, join);
        if (joinedData) {
          enriched = { ...enriched, ...joinedData };
        }
      }
    }

    return enriched;
  }

  private async performLookup(record: any, lookup: LookupRule): Promise<any> {
    // Simplified lookup implementation
    // In production, implement proper lookup logic
    return null;
  }

  private async performJoin(record: any, join: JoinRule): Promise<any> {
    // Simplified join implementation
    // In production, implement proper join logic
    return null;
  }

  private async checkDuplicate(record: any, job: IngestionJob): Promise<boolean> {
    if (!job.config.deduplication.enabled) {
      return false;
    }

    const hash = this.calculateRecordHash(record);
    const key = job.config.deduplication.keyFields.map(field => record[field]).join('|');

    // Check if hash or key already exists
    // In production, query actual storage
    return false; // Simplified
  }

  private async calculateQuality(record: any, job: IngestionJob): Promise<QualityMetrics> {
    const quality: QualityMetrics = {
      completeness: 0,
      accuracy: 0,
      consistency: 0,
      timeliness: 0,
      overall: 0,
      issues: []
    };

    if (job.config.quality.enabled) {
      // Calculate completeness
      const totalFields = Object.keys(record).length;
      const nonNullFields = Object.values(record).filter(v => v !== null && v !== undefined).length;
      quality.completeness = (nonNullFields / totalFields) * 100;

      // Calculate accuracy (simplified)
      quality.accuracy = 95; // Placeholder

      // Calculate consistency (simplified)
      quality.consistency = 90; // Placeholder

      // Calculate timeliness
      const recordAge = Date.now() - new Date(record.timestamp || Date.now()).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      quality.timeliness = Math.max(0, 100 - (recordAge / maxAge) * 100);

      // Calculate overall quality
      quality.overall = (quality.completeness + quality.accuracy + quality.consistency + quality.timeliness) / 4;
    }

    return quality;
  }

  private calculateChecksum(data: any): string {
    const dataString = JSON.stringify(data);
    return createHash('sha256').update(dataString).digest('hex');
  }

  private calculateRecordHash(record: any): string {
    const dataString = JSON.stringify(record);
    return createHash('sha256').update(dataString).digest('hex');
  }

  private identifyPIIFields(record: any): string[] {
    const piiPatterns = ['email', 'name', 'phone', 'ssn', 'credit_card', 'address'];
    return Object.keys(record).filter(field => 
      piiPatterns.some(pattern => field.toLowerCase().includes(pattern))
    );
  }

  private async addToHashChain(record: DataRecord): Promise<void> {
    const chain = this.hashChains.get(record.tenantId) || [];
    const previousHash = chain.length > 0 ? chain[chain.length - 1] : '';
    
    // Create hash chain link
    const chainData = {
      recordHash: record.hash,
      previousHash,
      timestamp: record.timestamp
    };
    
    const chainHash = createHash('sha256').update(JSON.stringify(chainData)).digest('hex');
    chain.push(chainHash);
    
    record.previousHash = previousHash;
    this.hashChains.set(record.tenantId, chain);
  }

  private async handleJobError(job: IngestionJob, error: Error): Promise<void> {
    job.status = 'FAILED';
    job.lastError = error.message;
    job.errorCount++;
    job.completedAt = new Date();

    await this.auditLog.logOperation({
      tenantId: job.tenantId || 'SYSTEM',
      userId: 'SYSTEM',
      action: 'INGESTION_JOB_ERROR',
      details: {
        jobId: job.id,
        error: error.message,
        errorCount: job.errorCount
      },
      ipAddress: 'SYSTEM',
      userAgent: 'DATA_INGESTION_ENGINE',
      timestamp: new Date(),
      category: 'DATA_INGESTION',
      severity: 'ERROR'
    });

    this.emit('jobError', { job, error });
  }

  private async cleanupCompletedJobs(): Promise<void> {
    const now = new Date();
    const cleanupThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours

    for (const [jobId, job] of this.jobs.entries()) {
      if (job.completedAt && job.completedAt < cleanupThreshold) {
        this.jobs.delete(jobId);
      }
    }
  }

  private updateMetrics(): void {
    // Update queue metrics
    for (const queue of this.queues.values()) {
      // Calculate current size based on pending jobs
      queue.currentSize = Array.from(this.jobs.values())
        .filter(job => job.status === 'PENDING' && this.getQueueId(job.priority) === queue.id)
        .length;
    }
  }

  private scheduleJob(job: IngestionJob): void {
    if (!job.schedule || !job.schedule.enabled) return;
    // eslint-disable-next-line @typescript-eslint/no-var-requires -- node-cron is an optional dependency and is intentionally lazy-loaded to avoid hard coupling at module load.
    const cron = require('node-cron');
    const task = cron.schedule(job.schedule.expression, () => {
      this.queueJob(job);
    }, {
      scheduled: false,
      timezone: job.schedule.timezone
    });

    task.start();
    job.nextRun = this.getNextRunDate(job.schedule);
  }

  private getNextRunDate(schedule: ScheduleConfig): Date {
    // Simplified next run calculation
    // In production, use proper cron parser
    return new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  }

  private async validateDataSource(source: DataSource): Promise<void> {
    if (!source.id || !source.name || !source.type) {
      throw new Error('Invalid source configuration: missing required fields');
    }

    if (!source.schema || !source.schema.fields || source.schema.fields.length === 0) {
      throw new Error('Invalid source configuration: schema required');
    }

    // Validate encryption configuration
    if (source.schema.encryption.enabled && !source.schema.encryption.keyId) {
      throw new Error('Encryption enabled but keyId not specified');
    }
  }

  private async testConnection(source: DataSource): Promise<void> {
    // Simplified connection test
    // In production, implement actual connection testing
    console.log(`Testing connection to ${source.name}...`);
  }

  // Placeholder methods for different data sources
  private async getDatabaseData(source: DataSource, job: IngestionJob): Promise<Readable> {
    // Implementation for database data extraction
    return new Readable({
      objectMode: true,
      read() {
        this.push(null); // End stream
      }
    });
  }

  private async getEventData(source: DataSource, job: IngestionJob): Promise<Readable> {
    // Implementation for event stream data
    return new Readable({
      objectMode: true,
      read() {
        this.push(null); // End stream
      }
    });
  }

  private async getFileData(source: DataSource, job: IngestionJob): Promise<Readable> {
    // Implementation for file data extraction
    return new Readable({
      objectMode: true,
      read() {
        this.push(null); // End stream
      }
    });
  }

  private async getApiData(source: DataSource, job: IngestionJob): Promise<Readable> {
    // Implementation for API data extraction
    return new Readable({
      objectMode: true,
      read() {
        this.push(null); // End stream
      }
    });
  }

  private async getAuditData(source: DataSource, job: IngestionJob): Promise<Readable> {
    // Implementation for audit log extraction
    return new Readable({
      objectMode: true,
      read() {
        this.push(null); // End stream
      }
    });
  }

  // Public API methods
  public async getJob(jobId: string): Promise<IngestionJob | null> {
    return this.jobs.get(jobId) || null;
  }

  public async getJobs(tenantId?: string): Promise<IngestionJob[]> {
    const jobs = Array.from(this.jobs.values());
    return tenantId ? jobs.filter(job => job.tenantId === tenantId) : jobs;
  }

  public async getSource(sourceId: string): Promise<DataSource | null> {
    return this.sources.get(sourceId) || null;
  }

  public async getSources(tenantId?: string): Promise<DataSource[]> {
    const sources = Array.from(this.sources.values());
    return tenantId ? sources.filter(source => source.tenantId === tenantId) : sources;
  }

  public async getQueue(queueId: string): Promise<IngestionQueue | null> {
    return this.queues.get(queueId) || null;
  }

  public async getQueues(): Promise<IngestionQueue[]> {
    return Array.from(this.queues.values());
  }

  public async pauseJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (job.status === 'RUNNING') {
      job.status = 'PAUSED';
      await this.auditLog.logOperation({
        tenantId: job.tenantId || 'SYSTEM',
        userId: 'SYSTEM',
        action: 'PAUSE_INGESTION_JOB',
        details: { jobId },
        ipAddress: 'SYSTEM',
        userAgent: 'DATA_INGESTION_ENGINE',
        timestamp: new Date(),
        category: 'DATA_INGESTION',
        severity: 'INFO'
      });
    }
  }

  public async resumeJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (job.status === 'PAUSED') {
      await this.queueJob(job);
      await this.auditLog.logOperation({
        tenantId: job.tenantId || 'SYSTEM',
        userId: 'SYSTEM',
        action: 'RESUME_INGESTION_JOB',
        details: { jobId },
        ipAddress: 'SYSTEM',
        userAgent: 'DATA_INGESTION_ENGINE',
        timestamp: new Date(),
        category: 'DATA_INGESTION',
        severity: 'INFO'
      });
    }
  }

  public async cancelJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    job.status = 'CANCELLED';
    job.completedAt = new Date();

    // Remove from processing if currently running
    const processingJob = this.processingJobs.get(jobId);
    if (processingJob) {
      // Cancel the processing promise
      this.processingJobs.delete(jobId);
    }

    await this.auditLog.logOperation({
      tenantId: job.tenantId || 'SYSTEM',
      userId: 'SYSTEM',
      action: 'CANCEL_INGESTION_JOB',
      details: { jobId },
      ipAddress: 'SYSTEM',
      userAgent: 'DATA_INGESTION_ENGINE',
      timestamp: new Date(),
      category: 'DATA_INGESTION',
      severity: 'INFO'
    });
  }

  public async getHashChain(tenantId: string): Promise<string[]> {
    return this.hashChains.get(tenantId) || [];
  }

  private generateJobId(): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `JOB${timestamp}${random}`;
  }

  private generateRecordId(): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `REC${timestamp}${random}`;
  }
}
