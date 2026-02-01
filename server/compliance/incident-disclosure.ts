// CRITICAL: Incident Disclosure and Transparency System
// MANDATORY: Transparent incident reporting and disclosure workflows

import { logger } from '../utils/structured-logger.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { trustCenterManager, IncidentDisclosure } from './trust-center.js';
import { complianceEngineManager } from './compliance-engine.js';
import { evidenceCollectionManager } from './evidence-collector.js';
import { governanceModelManager } from '../governance/governance-model.js';
import * as crypto from 'crypto';

export type IncidentType = 'SECURITY_BREACH' | 'DATA_BREACH' | 'SERVICE_OUTAGE' | 'PRIVACY_VIOLATION' | 'COMPLIANCE_VIOLATION';
export type DisclosureStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'RETRACTED';
export type NotificationChannel = 'EMAIL' | 'SMS' | 'WEB_PORTAL' | 'PRESS_RELEASE' | 'REGULATORY_FILING';
export type ImpactLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Incident {
  id: string;
  type: IncidentType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED';
  discoveredAt: Date;
  reportedAt: Date;
  resolvedAt?: Date;
  title: string;
  description: string;
  source: string;
  affectedSystems: string[];
  affectedUsers: number;
  dataTypes: string[];
  dataExposed: boolean;
  rootCause: string;
  containment: string;
  resolution: string;
  lessonsLearned: string;
  assignee: string;
  investigator: string;
  reviewer: string;
  tags: string[];
  relatedIncidents: string[];
  evidence: Array<{
    type: string;
    description: string;
    url: string;
    collectedAt: Date;
  }>;
}

export interface DisclosureTemplate {
  id: string;
  name: string;
  incidentType: IncidentType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  template: {
    subject: string;
    greeting: string;
    summary: string;
    impact: string;
    actions: string;
    timeline: string;
    contact: string;
    signature: string;
  };
  requiredFields: string[];
  approvalWorkflow: Array<{
    role: string;
    order: number;
    required: boolean;
  }>;
  notificationChannels: NotificationChannel[];
  retentionPeriod: number; // days
  autoPublish: boolean;
}

export interface DisclosureWorkflow {
  id: string;
  incidentId: string;
  disclosureId: string;
  status: DisclosureStatus;
  currentStep: number;
  steps: Array<{
    id: string;
    name: string;
    type: 'DRAFT' | 'REVIEW' | 'APPROVAL' | 'PUBLICATION';
    assignee: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
    startedAt?: Date;
    completedAt?: Date;
    comments?: string;
    attachments: string[];
  }>;
  approvals: Array<{
    role: string;
    name: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedAt?: Date;
    comments?: string;
  }>;
  notifications: Array<{
    channel: NotificationChannel;
    recipients: number;
    sentAt: Date;
    status: 'PENDING' | 'SENT' | 'FAILED';
    messageId?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegulatoryFiling {
  id: string;
  incidentId: string;
  regulator: string;
  jurisdiction: string;
  filingType: string;
  deadline: Date;
  status: 'PENDING' | 'SUBMITTED' | 'ACKNOWLEDGED' | 'REJECTED';
  submittedAt?: Date;
  acknowledgedAt?: Date;
  content: {
    summary: string;
    impact: string;
    timeline: string;
    mitigation: string;
    contact: string;
  };
  attachments: string[];
  referenceNumber?: string;
  followUpRequired: boolean;
  followUpDate?: Date;
}

/**
 * CRITICAL: Incident Disclosure Manager
 * 
 * Manages transparent incident reporting, disclosure workflows, and regulatory filings.
 * Provides comprehensive incident communication and compliance reporting.
 */
export class IncidentDisclosureManager {
  private static instance: IncidentDisclosureManager;
  private auditLogger: any;
  private incidents: Map<string, Incident> = new Map();
  private templates: Map<string, DisclosureTemplate> = new Map();
  private workflows: Map<string, DisclosureWorkflow> = new Map();
  private regulatoryFilings: Map<string, RegulatoryFiling> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.auditLogger = getImmutableAuditLogger();
    this.initializeDefaultTemplates();
    this.startPeriodicMonitoring();
  }

  static getInstance(): IncidentDisclosureManager {
    if (!IncidentDisclosureManager.instance) {
      IncidentDisclosureManager.instance = new IncidentDisclosureManager();
    }
    return IncidentDisclosureManager.instance;
  }

  /**
   * CRITICAL: Create incident
   */
  async createIncident(
    type: IncidentType,
    severity: Incident['severity'],
    title: string,
    description: string,
    source: string,
    affectedSystems: string[],
    reportedBy: string
  ): Promise<string> {
    const incidentId = this.generateIncidentId();
    const timestamp = new Date();

    try {
      // CRITICAL: Create incident
      const incident: Incident = {
        id: incidentId,
        type,
        severity,
        status: 'OPEN',
        discoveredAt: timestamp,
        reportedAt: timestamp,
        title,
        description,
        source,
        affectedSystems,
        affectedUsers: 0,
        dataTypes: [],
        dataExposed: false,
        rootCause: '',
        containment: '',
        resolution: '',
        lessonsLearned: '',
        assignee: reportedBy,
        investigator: '',
        reviewer: '',
        tags: [],
        relatedIncidents: [],
        evidence: []
      };

      this.incidents.set(incidentId, incident);

      // CRITICAL: Collect initial evidence
      await this.collectInitialEvidence(incident);

      // CRITICAL: Assess impact
      await this.assessIncidentImpact(incident);

      // CRITICAL: Log incident creation
      this.auditLogger.logDataMutation({
        tenantId: 'system',
        actorId: reportedBy,
        action: 'INCIDENT_CREATED',
        resourceType: 'INCIDENT',
        resourceId: incidentId,
        outcome: 'SUCCESS',
        correlationId: this.generateCorrelationId(),
        metadata: {
          type,
          severity,
          title,
          affectedSystems: affectedSystems.length,
          dataExposed: incident.dataExposed
        }
      });

      logger.info('Incident created', {
        incidentId,
        type,
        severity,
        title,
        reportedBy
      });

      return incidentId;

    } catch (error) {
      logger.error('Incident creation failed', {
        type,
        severity,
        error: (error as Error).message
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Create disclosure workflow
   */
  async createDisclosureWorkflow(
    incidentId: string,
    templateId?: string,
    requestedBy: string
  ): Promise<string> {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      throw new Error(`Incident not found: ${incidentId}`);
    }

    const workflowId = this.generateWorkflowId();
    const timestamp = new Date();

    try {
      // CRITICAL: Get template
      const template = templateId ? this.templates.get(templateId) : await this.getDefaultTemplate(incident.type, incident.severity);

      // CRITICAL: Create disclosure
      const disclosure = await trustCenterManager.discloseIncident(
        incidentId,
        incident.type,
        incident.severity,
        incident.title,
        incident.description,
        {
          affectedUsers: incident.affectedUsers,
          affectedSystems: incident.affectedSystems,
          dataTypes: incident.dataTypes,
          dataExposed: incident.dataExposed,
          servicesAffected: incident.affectedSystems
        },
        requestedBy
      );

      // CRITICAL: Create workflow
      const workflow: DisclosureWorkflow = {
        id: workflowId,
        incidentId,
        disclosureId: disclosure,
        status: 'DRAFT',
        currentStep: 0,
        steps: await this.generateWorkflowSteps(template),
        approvals: [],
        notifications: [],
        createdAt: timestamp,
        updatedAt: timestamp
      };

      this.workflows.set(workflowId, workflow);

      // CRITICAL: Start workflow
      await this.startWorkflowStep(workflow, 0);

      // CRITICAL: Log workflow creation
      this.auditLogger.logDataMutation({
        tenantId: 'system',
        actorId: requestedBy,
        action: 'DISCLOSURE_WORKFLOW_CREATED',
        resourceType: 'DISCLOSURE_WORKFLOW',
        resourceId: workflowId,
        outcome: 'SUCCESS',
        correlationId: this.generateCorrelationId(),
        metadata: {
          incidentId,
          disclosureId: disclosure,
          templateId: template?.id,
          steps: workflow.steps.length
        }
      });

      logger.info('Disclosure workflow created', {
        workflowId,
        incidentId,
        disclosureId,
        requestedBy
      });

      return workflowId;

    } catch (error) {
      logger.error('Disclosure workflow creation failed', {
        incidentId,
        error: (error as Error).message
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Submit regulatory filing
   */
  async submitRegulatoryFiling(
    incidentId: string,
    regulator: string,
    jurisdiction: string,
    filingType: string,
    deadline: Date,
    submittedBy: string
  ): Promise<string> {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      throw new Error(`Incident not found: ${incidentId}`);
    }

    const filingId = this.generateFilingId();
    const timestamp = new Date();

    try {
      // CRITICAL: Create regulatory filing
      const filing: RegulatoryFiling = {
        id: filingId,
        incidentId,
        regulator,
        jurisdiction,
        filingType,
        deadline,
        status: 'PENDING',
        content: await this.generateFilingContent(incident, regulator, filingType),
        attachments: [],
        followUpRequired: false
      };

      this.regulatoryFilings.set(filingId, filing);

      // CRITICAL: Submit filing
      await this.submitFiling(filing);

      // CRITICAL: Log filing submission
      this.auditLogger.logDataMutation({
        tenantId: 'system',
        actorId: submittedBy,
        action: 'REGULATORY_FILING_SUBMITTED',
        resourceType: 'REGULATORY_FILING',
        resourceId: filingId,
        outcome: 'SUCCESS',
        correlationId: this.generateCorrelationId(),
        metadata: {
          incidentId,
          regulator,
          jurisdiction,
          filingType,
          deadline
        }
      });

      logger.info('Regulatory filing submitted', {
        filingId,
        incidentId,
        regulator,
        filingType,
        submittedBy
      });

      return filingId;

    } catch (error) {
      logger.error('Regulatory filing submission failed', {
        incidentId,
        regulator,
        error: (error as Error).message
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Update incident status
   */
  async updateIncidentStatus(
    incidentId: string,
    status: Incident['status'],
    updatedBy: string,
    notes?: string
  ): Promise<void> {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      throw new Error(`Incident not found: ${incidentId}`);
    }

    const previousStatus = incident.status;

    try {
      // CRITICAL: Update status
      incident.status = status;
      
      if (status === 'RESOLVED') {
        incident.resolvedAt = new Date();
      }

      // CRITICAL: Add evidence
      if (notes) {
        incident.evidence.push({
          type: 'STATUS_UPDATE',
          description: `Status changed from ${previousStatus} to ${status}: ${notes}`,
          url: '',
          collectedAt: new Date()
        });
      }

      // CRITICAL: Log status update
      this.auditLogger.logDataMutation({
        tenantId: 'system',
        actorId: updatedBy,
        action: 'INCIDENT_STATUS_UPDATED',
        resourceType: 'INCIDENT',
        resourceId: incidentId,
        outcome: 'SUCCESS',
        correlationId: this.generateCorrelationId(),
        metadata: {
          previousStatus,
          newStatus: status,
          resolvedAt: incident.resolvedAt
        }
      });

      logger.info('Incident status updated', {
        incidentId,
        previousStatus,
        newStatus: status,
        updatedBy
      });

    } catch (error) {
      logger.error('Incident status update failed', {
        incidentId,
        status,
        error: (error as Error).message
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Get incident
   */
  getIncident(incidentId: string): Incident | undefined {
    return this.incidents.get(incidentId);
  }

  /**
   * CRITICAL: Get disclosure workflow
   */
  getDisclosureWorkflow(workflowId: string): DisclosureWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * CRITICAL: Get regulatory filing
   */
  getRegulatoryFiling(filingId: string): RegulatoryFiling | undefined {
    return this.regulatoryFilings.get(filingId);
  }

  /**
   * CRITICAL: Get incident statistics
   */
  getIncidentStatistics(): {
    totalIncidents: number;
    openIncidents: number;
    resolvedIncidents: number;
    averageResolutionTime: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    dataBreachIncidents: number;
    regulatoryFilings: number;
    disclosureWorkflows: number;
  } {
    const incidents = Array.from(this.incidents.values());
    const workflows = Array.from(this.workflows.values());
    const filings = Array.from(this.regulatoryFilings.values());

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    for (const incident of incidents) {
      byType[incident.type] = (byType[incident.type] || 0) + 1;
      bySeverity[incident.severity] = (bySeverity[incident.severity] || 0) + 1;
    }

    const resolvedIncidents = incidents.filter(i => i.status === 'RESOLVED' && i.resolvedAt);
    const averageResolutionTime = resolvedIncidents.length > 0
      ? resolvedIncidents.reduce((sum, i) => sum + (i.resolvedAt!.getTime() - i.reportedAt.getTime()), 0) / resolvedIncidents.length
      : 0;

    return {
      totalIncidents: incidents.length,
      openIncidents: incidents.filter(i => i.status !== 'RESOLVED').length,
      resolvedIncidents: resolvedIncidents.length,
      averageResolutionTime,
      byType,
      bySeverity,
      dataBreachIncidents: incidents.filter(i => i.type === 'DATA_BREACH').length,
      regulatoryFilings: filings.length,
      disclosureWorkflows: workflows.length
    };
  }

  /**
   * CRITICAL: Initialize default templates
   */
  private async initializeDefaultTemplates(): Promise<void> {
    const timestamp = new Date();

    const templates: DisclosureTemplate[] = [
      {
        id: 'data_breach_critical',
        name: 'Critical Data Breach',
        incidentType: 'DATA_BREACH',
        severity: 'CRITICAL',
        template: {
          subject: 'Important Security Notice Regarding Your Data',
          greeting: 'Dear Valued Customer,',
          summary: 'We are writing to inform you of a security incident that may have affected your personal information.',
          impact: 'We have identified unauthorized access to certain systems containing personal information.',
          actions: 'We have taken immediate steps to secure our systems and are working with cybersecurity experts.',
          timeline: 'The incident was discovered on {date} and contained on {date}.',
          contact: 'If you have questions, please contact our privacy team at {email}.',
          signature: 'Sincerely, The {company} Privacy Team'
        },
        requiredFields: ['summary', 'impact', 'actions', 'timeline'],
        approvalWorkflow: [
          { role: 'SECURITY_OFFICER', order: 1, required: true },
          { role: 'LEGAL_COUNSEL', order: 2, required: true },
          { role: 'EXECUTIVE', order: 3, required: true }
        ],
        notificationChannels: ['EMAIL', 'WEB_PORTAL', 'REGULATORY_FILING'],
        retentionPeriod: 2555, // 7 years
        autoPublish: false
      },
      {
        id: 'service_outage_medium',
        name: 'Medium Service Outage',
        incidentType: 'SERVICE_OUTAGE',
        severity: 'MEDIUM',
        template: {
          subject: 'Service Disruption Notification',
          greeting: 'Dear Valued Customer,',
          summary: 'We are experiencing a service disruption that may be affecting your access to our platform.',
          impact: 'Some services may be unavailable or experiencing degraded performance.',
          actions: 'Our technical team is working to restore full service as quickly as possible.',
          timeline: 'The disruption began at {time} and we expect restoration by {time}.',
          contact: 'For updates, please visit our status page at {url}.',
          signature: 'Sincerely, The {company} Operations Team'
        },
        requiredFields: ['summary', 'impact', 'actions', 'timeline'],
        approvalWorkflow: [
          { role: 'OPERATIONS_MANAGER', order: 1, required: true },
          { role: 'COMMUNICATIONS_MANAGER', order: 2, required: true }
        ],
        notificationChannels: ['EMAIL', 'WEB_PORTAL'],
        retentionPeriod: 365, // 1 year
        autoPublish: true
      }
    ];

    for (const template of templates) {
      this.templates.set(template.id, template);
    }
  }

  /**
   * CRITICAL: Start periodic monitoring
   */
  private startPeriodicMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.monitorWorkflowDeadlines();
        await this.monitorRegulatoryDeadlines();
        await this.checkIncidentEscalations();
      } catch (error) {
        logger.error('Periodic incident monitoring failed', {
          error: (error as Error).message
        });
      }
    }, 300000); // Every 5 minutes
  }

  /**
   * CRITICAL: Monitor workflow deadlines
   */
  private async monitorWorkflowDeadlines(): Promise<void> {
    const workflows = Array.from(this.workflows.values())
      .filter(w => w.status !== 'COMPLETED' && w.status !== 'RETRACTED');

    for (const workflow of workflows) {
      const currentStep = workflow.steps[workflow.currentStep];
      if (currentStep && currentStep.status === 'PENDING') {
        const timeInStep = Date.now() - workflow.createdAt.getTime();
        const maxStepTime = 24 * 60 * 60 * 1000; // 24 hours

        if (timeInStep > maxStepTime) {
          logger.warn('Workflow step overdue', {
            workflowId: workflow.id,
            stepId: currentStep.id,
            timeInStep
          });
        }
      }
    }
  }

  /**
   * CRITICAL: Monitor regulatory deadlines
   */
  private async monitorRegulatoryDeadlines(): Promise<void> {
    const filings = Array.from(this.regulatoryFilings.values())
      .filter(f => f.status === 'PENDING' && new Date() >= new Date(f.deadline.getTime() - (24 * 60 * 60 * 1000))); // 24 hours before deadline

    for (const filing of filings) {
      logger.warn('Regulatory filing deadline approaching', {
        filingId: filing.id,
        regulator: filing.regulator,
        deadline: filing.deadline
      });
    }
  }

  /**
   * CRITICAL: Check incident escalations
   */
  private async checkIncidentEscalations(): Promise<void> {
    const incidents = Array.from(this.incidents.values())
      .filter(i => i.status !== 'RESOLVED');

    for (const incident of incidents) {
      const timeOpen = Date.now() - incident.reportedAt.getTime();
      const escalationThresholds = {
        'CRITICAL': 4 * 60 * 60 * 1000, // 4 hours
        'HIGH': 8 * 60 * 60 * 1000, // 8 hours
        'MEDIUM': 24 * 60 * 60 * 1000, // 24 hours
        'LOW': 72 * 60 * 60 * 1000 // 72 hours
      };

      const threshold = escalationThresholds[incident.severity];
      if (timeOpen > threshold) {
        logger.warn('Incident escalation required', {
          incidentId: incident.id,
          severity: incident.severity,
          timeOpen
        });
      }
    }
  }

  /**
   * CRITICAL: Collect initial evidence
   */
  private async collectInitialEvidence(incident: Incident): Promise<void> {
    // In a real implementation, collect initial evidence from various sources
    incident.evidence.push({
      type: 'SYSTEM_LOGS',
      description: 'Initial system logs collected',
      url: '/evidence/logs/' + incident.id,
      collectedAt: new Date()
    });
  }

  /**
   * CRITICAL: Assess incident impact
   */
  private async assessIncidentImpact(incident: Incident): Promise<void> {
    // In a real implementation, assess actual impact
    incident.affectedUsers = Math.floor(Math.random() * 10000);
    incident.dataTypes = ['PERSONAL_INFORMATION', 'ACCOUNT_DATA'];
    incident.dataExposed = incident.type === 'DATA_BREACH';
  }

  /**
   * CRITICAL: Get default template
   */
  private async getDefaultTemplate(type: IncidentType, severity: Incident['severity']): Promise<DisclosureTemplate> {
    const templates = Array.from(this.templates.values())
      .filter(t => t.incidentType === type && t.severity === severity);

    return templates[0] || this.templates.get('service_outage_medium')!;
  }

  /**
   * CRITICAL: Generate workflow steps
   */
  private async generateWorkflowSteps(template: DisclosureTemplate): Promise<DisclosureWorkflow['steps']> {
    return template.approvalWorkflow.map((approval, index) => ({
      id: `step_${index}`,
      name: `${approval.role} Review`,
      type: index === 0 ? 'DRAFT' : index === template.approvalWorkflow.length - 1 ? 'PUBLICATION' : 'APPROVAL',
      assignee: '',
      status: 'PENDING',
      attachments: []
    }));
  }

  /**
   * CRITICAL: Start workflow step
   */
  private async startWorkflowStep(workflow: DisclosureWorkflow, stepIndex: number): Promise<void> {
    const step = workflow.steps[stepIndex];
    if (step) {
      step.status = 'IN_PROGRESS';
      step.startedAt = new Date();
      
      // In a real implementation, assign to appropriate person
      step.assignee = 'system';
    }
  }

  /**
   * CRITICAL: Generate filing content
   */
  private async generateFilingContent(incident: Incident, regulator: string, filingType: string): Promise<RegulatoryFiling['content']> {
    return {
      summary: `Incident report for ${incident.title}`,
      impact: `Affected ${incident.affectedUsers} users, data exposed: ${incident.dataExposed}`,
      timeline: `Discovered: ${incident.discoveredAt.toISOString()}, Reported: ${incident.reportedAt.toISOString()}`,
      mitigation: 'Immediate containment and investigation initiated',
      contact: 'privacy@company.com'
    };
  }

  /**
   * CRITICAL: Submit filing
   */
  private async submitFiling(filing: RegulatoryFiling): Promise<void> {
    // In a real implementation, submit to regulatory authority
    filing.status = 'SUBMITTED';
    filing.submittedAt = new Date();
    filing.referenceNumber = 'REF-' + Date.now();
  }

  /**
   * CRITICAL: Generate incident ID
   */
  private generateIncidentId(): string {
    const bytes = crypto.randomBytes(8);
    return `inc_${bytes.toString('hex')}`;
  }

  /**
   * CRITICAL: Generate workflow ID
   */
  private generateWorkflowId(): string {
    const bytes = crypto.randomBytes(8);
    return `wf_${bytes.toString('hex')}`;
  }

  /**
   * CRITICAL: Generate filing ID
   */
  private generateFilingId(): string {
    const bytes = crypto.randomBytes(8);
    return `fil_${bytes.toString('hex')}`;
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
 * CRITICAL: Global incident disclosure manager instance
 */
export const incidentDisclosureManager = IncidentDisclosureManager.getInstance();

/**
 * CRITICAL: Convenience functions
 */
export const createIncidentDisclosureManager = (): IncidentDisclosureManager => {
  return IncidentDisclosureManager.getInstance();
};

export const createIncident = async (
  type: IncidentType,
  severity: Incident['severity'],
  title: string,
  description: string,
  source: string,
  affectedSystems: string[],
  reportedBy: string
): Promise<string> => {
  return incidentDisclosureManager.createIncident(type, severity, title, description, source, affectedSystems, reportedBy);
};

export const createDisclosureWorkflow = async (
  incidentId: string,
  templateId?: string,
  requestedBy?: string
): Promise<string> => {
  return incidentDisclosureManager.createDisclosureWorkflow(incidentId, templateId, requestedBy || 'system');
};
