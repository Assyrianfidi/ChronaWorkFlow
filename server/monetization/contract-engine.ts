import { ProductTier } from './product-tiers';
import { ImmutableAuditLogger } from '../compliance/immutable-audit-log';
import { GovernanceModelManager } from '../governance/governance-model';

export interface Contract {
  id: string;
  tenantId: string;
  contractNumber: string;
  contractType: 'MSA' | 'DPA' | 'SLA' | 'SOW' | 'ADDENDUM';
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PENDING_SIGNATURE' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  version: string;
  title: string;
  description: string;
  parties: ContractParty[];
  effectiveDate: Date;
  expirationDate?: Date;
  terminationNoticeDays: number;
  autoRenew: boolean;
  renewalTerms?: RenewalTerms;
  financialTerms: FinancialTerms;
  complianceRequirements: ComplianceRequirement[];
  serviceLevels: ServiceLevel[];
  customTerms: CustomTerm[];
  attachments: ContractAttachment[];
  signatures: ContractSignature[];
  approvalWorkflow: ApprovalWorkflow;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  reviewedBy?: string;
  approvedBy?: string;
  signedBy?: string;
}

export interface ContractParty {
  id: string;
  name: string;
  type: 'CUSTOMER' | 'SUPPLIER' | 'PARTNER';
  role: 'PRIMARY' | 'SECONDARY';
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  legalEntity: {
    name: string;
    taxId: string;
    registrationNumber: string;
  };
  signingAuthority: {
    name: string;
    title: string;
    email: string;
  };
}

export interface RenewalTerms {
  renewalPeriod: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  renewalNoticeDays: number;
  priceAdjustment: {
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
    cap?: number;
  };
  termsChangesAllowed: boolean;
}

export interface FinancialTerms {
  contractValue: number;
  currency: string;
  billingFrequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  paymentTerms: {
    netDays: number;
    lateFeePercentage: number;
    earlyPaymentDiscount?: {
      percentage: number;
      days: number;
    };
  };
  pricingModel: {
    type: 'FIXED' | 'USAGE_BASED' | 'TIERED' | 'HYBRID';
    tiers?: PricingTier[];
    usageRates?: UsageRate[];
  };
  minimumCommitment?: {
    type: 'REVENUE' | 'USAGE' | 'SEATS';
    value: number;
    period: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  };
  overageRates?: OverageRate[];
  discounts: Discount[];
}

export interface PricingTier {
  name: string;
  minQuantity: number;
  maxQuantity?: number;
  unitPrice: number;
  features: string[];
}

export interface UsageRate {
  metric: string;
  unit: string;
  rate: number;
  includedQuantity: number;
}

export interface OverageRate {
  metric: string;
  unit: string;
  rate: number;
  tieredRates?: {
    minQuantity: number;
    rate: number;
  }[];
}

export interface Discount {
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'VOLUME';
  value: number;
  conditions?: string[];
  startDate?: Date;
  endDate?: Date;
}

export interface ComplianceRequirement {
  id: string;
  type: 'SOX' | 'GDPR' | 'CCPA' | 'HIPAA' | 'SOC2' | 'ISO27001' | 'CUSTOM';
  description: string;
  mandatory: boolean;
  implementationStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED';
  dueDate?: Date;
  verificationMethod?: string;
  evidenceRequired: string[];
  evidenceProvided: string[];
  assignedTo: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ServiceLevel {
  id: string;
  metric: string;
  target: number;
  unit: string;
  measurementPeriod: string;
  credits?: {
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
    threshold: number;
  };
  exclusions: string[];
  reporting: {
    frequency: string;
    format: string;
    delay: number;
  };
}

export interface CustomTerm {
  id: string;
  category: 'LEGAL' | 'TECHNICAL' | 'FINANCIAL' | 'OPERATIONAL';
  title: string;
  description: string;
  mandatory: boolean;
  enforceable: boolean;
  implementationRequired: boolean;
  implementationStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  assignedTo: string;
  dueDate?: Date;
}

export interface ContractAttachment {
  id: string;
  name: string;
  type: 'CONTRACT' | 'SOW' | 'SCHEDULE' | 'EXHIBIT' | 'ADDENDUM';
  url: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
  version: string;
}

export interface ContractSignature {
  id: string;
  partyId: string;
  signerName: string;
  signerTitle: string;
  signerEmail: string;
  signatureMethod: 'ELECTRONIC' | 'DIGITAL' | 'WET_INK';
  signedAt: Date;
  ipAddress: string;
  userAgent: string;
  signatureData?: string;
  certificateId?: string;
}

export interface ApprovalWorkflow {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  currentStep: number;
  steps: ApprovalStep[];
  initiatedBy: string;
  initiatedAt: Date;
  completedAt?: Date;
}

export interface ApprovalStep {
  id: string;
  name: string;
  type: 'REVIEW' | 'APPROVAL' | 'SIGNATURE';
  assignee: string;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED' | 'SKIPPED';
  completedAt?: Date;
  completedBy?: string;
  comments?: string;
  conditions?: string[];
}

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  type: Contract['contractType'];
  category: 'STANDARD' | 'ENTERPRISE' | 'GOVERNMENT' | 'NONPROFIT';
  jurisdiction: string;
  language: string;
  content: string;
  variables: TemplateVariable[];
  clauses: TemplateClause[];
  complianceRequirements: Omit<ComplianceRequirement, 'id' | 'implementationStatus' | 'evidenceProvided' | 'assignedTo'>[];
  standardTerms: string[];
  optionalTerms: string[];
  version: string;
  effectiveDate: Date;
  createdBy: string;
  approvedBy: string;
  approvedAt: Date;
}

export interface TemplateVariable {
  name: string;
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT';
  required: boolean;
  defaultValue?: string;
  options?: string[];
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

export interface TemplateClause {
  id: string;
  title: string;
  content: string;
  type: 'STANDARD' | 'OPTIONAL' | 'CONDITIONAL';
  conditions?: string[];
  mandatory: boolean;
  category: 'LEGAL' | 'TECHNICAL' | 'FINANCIAL' | 'COMPLIANCE';
}

export interface ContractMetrics {
  totalContracts: number;
  activeContracts: number;
  expiredContracts: number;
  totalContractValue: number;
  averageContractValue: number;
  contractsByType: { [key: string]: number };
  contractsByStatus: { [key: string]: number };
  complianceStatus: {
    compliant: number;
    nonCompliant: number;
    pending: number;
  };
  renewalRate: number;
  averageNegotiationTime: number;
  periodStart: Date;
  periodEnd: Date;
}

export class ContractEngine {
  private static instance: ContractEngine;
  private auditLog: ImmutableAuditLogger;
  private governanceManager: GovernanceModelManager;
  private contracts: Map<string, Contract> = new Map();
  private templates: Map<string, ContractTemplate> = new Map();
  private workflows: Map<string, ApprovalWorkflow> = new Map();

  private constructor() {
    this.auditLog = new ImmutableAuditLogger();
    this.governanceManager = new GovernanceModelManager();
    this.initializeDefaultTemplates();
  }

  public static getInstance(): ContractEngine {
    if (!ContractEngine.instance) {
      ContractEngine.instance = new ContractEngine();
    }
    return ContractEngine.instance;
  }

  private initializeDefaultTemplates(): void {
    // Initialize default contract templates
    const defaultTemplates: ContractTemplate[] = [
      this.createMSATemplate(),
      this.createDPATemplate(),
      this.createSLATemplate(),
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private createMSATemplate(): ContractTemplate {
    return {
      id: 'MSA_DEFAULT',
      name: 'Master Services Agreement',
      description: 'Standard Master Services Agreement for enterprise customers',
      type: 'MSA',
      category: 'ENTERPRISE',
      jurisdiction: 'US',
      language: 'EN',
      content: 'MASTER SERVICES AGREEMENT\n\n[Template content would go here]',
      variables: [
        { name: 'customer_name', type: 'TEXT', required: true },
        { name: 'contract_value', type: 'NUMBER', required: true },
        { name: 'effective_date', type: 'DATE', required: true },
        { name: 'term_length_months', type: 'NUMBER', required: true },
      ],
      clauses: [
        {
          id: 'confidentiality',
          title: 'Confidentiality',
          content: 'Both parties agree to maintain confidentiality...',
          type: 'STANDARD',
          mandatory: true,
          category: 'LEGAL'
        },
        {
          id: 'intellectual_property',
          title: 'Intellectual Property',
          content: 'All intellectual property rights remain with...',
          type: 'STANDARD',
          mandatory: true,
          category: 'LEGAL'
        }
      ],
      complianceRequirements: [
        {
          type: 'SOX',
          description: 'SOX compliance requirements for financial reporting',
          mandatory: true,
          dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          verificationMethod: 'Audit',
          evidenceRequired: ['Financial reports', 'Control documentation'],
          riskLevel: 'HIGH'
        }
      ],
      standardTerms: ['Limitation of Liability', 'Indemnification'],
      optionalTerms: ['Exclusivity', 'Non-compete'],
      version: '1.0',
      effectiveDate: new Date(),
      createdBy: 'SYSTEM',
      approvedBy: 'LEGAL_TEAM',
      approvedAt: new Date()
    };
  }

  private createDPATemplate(): ContractTemplate {
    return {
      id: 'DPA_DEFAULT',
      name: 'Data Processing Agreement',
      description: 'Standard Data Processing Agreement for GDPR compliance',
      type: 'DPA',
      category: 'STANDARD',
      jurisdiction: 'EU',
      language: 'EN',
      content: 'DATA PROCESSING AGREEMENT\n\n[Template content would go here]',
      variables: [
        { name: 'data_controller', type: 'TEXT', required: true },
        { name: 'data_processor', type: 'TEXT', required: true },
        { name: 'data_categories', type: 'TEXT', required: true },
      ],
      clauses: [
        {
          id: 'data_subject_rights',
          title: 'Data Subject Rights',
          content: 'Data processor shall assist data controller...',
          type: 'STANDARD',
          mandatory: true,
          category: 'COMPLIANCE'
        }
      ],
      complianceRequirements: [
        {
          type: 'GDPR',
          description: 'GDPR compliance requirements for data processing',
          mandatory: true,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          verificationMethod: 'Compliance assessment',
          evidenceRequired: ['DPIA documentation', 'Data processing records'],
          riskLevel: 'CRITICAL'
        }
      ],
      standardTerms: ['Data Security', 'Breach Notification'],
      optionalTerms: ['Data Transfer Mechanisms'],
      version: '1.0',
      effectiveDate: new Date(),
      createdBy: 'SYSTEM',
      approvedBy: 'LEGAL_TEAM',
      approvedAt: new Date()
    };
  }

  private createSLATemplate(): ContractTemplate {
    return {
      id: 'SLA_DEFAULT',
      name: 'Service Level Agreement',
      description: 'Standard Service Level Agreement for all tiers',
      type: 'SLA',
      category: 'STANDARD',
      jurisdiction: 'US',
      language: 'EN',
      content: 'SERVICE LEVEL AGREEMENT\n\n[Template content would go here]',
      variables: [
        { name: 'service_uptime_target', type: 'NUMBER', required: true },
        { name: 'support_response_time', type: 'TEXT', required: true },
        { name: 'incident_resolution_time', type: 'TEXT', required: true },
      ],
      clauses: [
        {
          id: 'uptime_guarantee',
          title: 'Service Uptime Guarantee',
          content: 'Service shall be available {{service_uptime_target}}%...',
          type: 'STANDARD',
          mandatory: true,
          category: 'TECHNICAL'
        }
      ],
      complianceRequirements: [],
      standardTerms: ['Service Credits', 'Maintenance Windows'],
      optionalTerms: ['Custom Metrics'],
      version: '1.0',
      effectiveDate: new Date(),
      createdBy: 'SYSTEM',
      approvedBy: 'OPERATIONS_TEAM',
      approvedAt: new Date()
    };
  }

  public async createContract(
    tenantId: string,
    contractType: Contract['contractType'],
    templateId: string,
    variables: { [key: string]: any },
    createdBy: string
  ): Promise<Contract> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      // Validate variables
      this.validateTemplateVariables(template, variables);

      // Generate contract ID
      const contractId = this.generateContractId();
      const contractNumber = this.generateContractNumber(tenantId);

      // Create contract from template
      const contract: Contract = {
        id: contractId,
        tenantId,
        contractNumber,
        contractType,
        status: 'DRAFT',
        version: '1.0',
        title: template.name,
        description: template.description,
        parties: [], // To be populated separately
        effectiveDate: variables.effective_date || new Date(),
        expirationDate: variables.expiration_date,
        terminationNoticeDays: variables.termination_notice_days || 30,
        autoRenew: variables.auto_renew || false,
        renewalTerms: variables.renewal_terms,
        financialTerms: variables.financial_terms || this.getDefaultFinancialTerms(),
        complianceRequirements: this.initializeComplianceRequirements(template),
        serviceLevels: this.initializeServiceLevels(template, variables),
        customTerms: [],
        attachments: [],
        signatures: [],
        approvalWorkflow: this.createApprovalWorkflow(contractId, template),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy
      };

      // Store contract
      this.contracts.set(contractId, contract);

      // Log the operation
      await this.auditLog.logOperation({
        tenantId,
        userId: createdBy,
        action: 'CREATE_CONTRACT',
        details: {
          contractId,
          contractType,
          templateId,
          variables
        },
        ipAddress: 'SYSTEM',
        userAgent: 'CONTRACT_ENGINE',
        timestamp: new Date(),
        category: 'CONTRACT',
        severity: 'INFO'
      });

      return contract;
    } catch (error) {
      await this.auditLog.logOperation({
        tenantId,
        userId: createdBy,
        action: 'CREATE_CONTRACT_ERROR',
        details: {
          error: (error as Error).message,
          contractType,
          templateId
        },
        ipAddress: 'SYSTEM',
        userAgent: 'CONTRACT_ENGINE',
        timestamp: new Date(),
        category: 'CONTRACT',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  private validateTemplateVariables(template: ContractTemplate, variables: { [key: string]: any }): void {
    for (const variable of template.variables) {
      if (variable.required && !variables[variable.name]) {
        throw new Error(`Required variable ${variable.name} is missing`);
      }

      if (variables[variable.name] !== undefined) {
        this.validateVariableValue(variable, variables[variable.name]);
      }
    }
  }

  private validateVariableValue(variable: TemplateVariable, value: any): void {
    switch (variable.type) {
      case 'TEXT':
        if (typeof value !== 'string') {
          throw new Error(`Variable ${variable.name} must be a string`);
        }
        if (variable.validation) {
          if (variable.validation.minLength && value.length < variable.validation.minLength) {
            throw new Error(`Variable ${variable.name} must be at least ${variable.validation.minLength} characters`);
          }
          if (variable.validation.maxLength && value.length > variable.validation.maxLength) {
            throw new Error(`Variable ${variable.name} must be at most ${variable.validation.maxLength} characters`);
          }
        }
        break;
      case 'NUMBER':
        if (typeof value !== 'number') {
          throw new Error(`Variable ${variable.name} must be a number`);
        }
        if (variable.validation) {
          if (variable.validation.min !== undefined && value < variable.validation.min) {
            throw new Error(`Variable ${variable.name} must be at least ${variable.validation.min}`);
          }
          if (variable.validation.max !== undefined && value > variable.validation.max) {
            throw new Error(`Variable ${variable.name} must be at most ${variable.validation.max}`);
          }
        }
        break;
      case 'DATE':
        if (!(value instanceof Date) && typeof value !== 'string') {
          throw new Error(`Variable ${variable.name} must be a date`);
        }
        break;
      case 'BOOLEAN':
        if (typeof value !== 'boolean') {
          throw new Error(`Variable ${variable.name} must be a boolean`);
        }
        break;
      case 'SELECT':
        if (variable.options && !variable.options.includes(value)) {
          throw new Error(`Variable ${variable.name} must be one of: ${variable.options.join(', ')}`);
        }
        break;
    }
  }

  private initializeComplianceRequirements(template: ContractTemplate): ComplianceRequirement[] {
    return template.complianceRequirements.map(req => ({
      ...req,
      id: this.generateComplianceId(),
      implementationStatus: 'NOT_STARTED',
      evidenceProvided: [],
      assignedTo: 'COMPLIANCE_TEAM'
    }));
  }

  private initializeServiceLevels(template: ContractTemplate, variables: { [key: string]: any }): ServiceLevel[] {
    const serviceLevels: ServiceLevel[] = [];

    if (template.type === 'SLA') {
      serviceLevels.push({
        id: this.generateServiceLevelId(),
        metric: 'Uptime',
        target: variables.service_uptime_target || 99.9,
        unit: '%',
        measurementPeriod: 'Monthly',
        credits: {
          type: 'PERCENTAGE',
          value: 10,
          threshold: 99.0
        },
        exclusions: ['Scheduled maintenance', 'Force majeure events'],
        reporting: {
          frequency: 'Monthly',
          format: 'PDF',
          delay: 5
        }
      });
    }

    return serviceLevels;
  }

  private createApprovalWorkflow(contractId: string, template: ContractTemplate): ApprovalWorkflow {
    const steps: ApprovalStep[] = [];

    // Add review step
    steps.push({
      id: this.generateStepId(),
      name: 'Legal Review',
      type: 'REVIEW',
      assignee: 'LEGAL_TEAM',
      status: 'PENDING'
    });

    // Add approval step for enterprise contracts
    if (template.category === 'ENTERPRISE') {
      steps.push({
        id: this.generateStepId(),
        name: 'Executive Approval',
        type: 'APPROVAL',
        assignee: 'EXECUTIVE_TEAM',
        status: 'PENDING'
      });
    }

    // Add signature step
    steps.push({
      id: this.generateStepId(),
      name: 'Customer Signature',
      type: 'SIGNATURE',
      assignee: 'CUSTOMER',
      status: 'PENDING'
    });

    const workflow: ApprovalWorkflow = {
      id: this.generateWorkflowId(),
      status: 'PENDING',
      currentStep: 0,
      steps,
      initiatedBy: 'SYSTEM',
      initiatedAt: new Date()
    };

    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  private getDefaultFinancialTerms(): FinancialTerms {
    return {
      contractValue: 0,
      currency: 'USD',
      billingFrequency: 'MONTHLY',
      paymentTerms: {
        netDays: 30,
        lateFeePercentage: 1.5
      },
      pricingModel: {
        type: 'TIERED',
        tiers: []
      },
      discounts: []
    };
  }

  public async updateContract(
    contractId: string,
    updates: Partial<Contract>,
    updatedBy: string
  ): Promise<Contract> {
    try {
      const contract = this.contracts.get(contractId);
      if (!contract) {
        throw new Error(`Contract ${contractId} not found`);
      }

      // Check if contract can be updated
      if (contract.status === 'ACTIVE' || contract.status === 'EXPIRED') {
        throw new Error(`Cannot update contract in ${contract.status} status`);
      }

      // Update contract
      const updatedContract = { ...contract, ...updates, updatedAt: new Date() };
      this.contracts.set(contractId, updatedContract);

      // Log the operation
      await this.auditLog.logOperation({
        tenantId: contract.tenantId,
        userId: updatedBy,
        action: 'UPDATE_CONTRACT',
        details: {
          contractId,
          updates: Object.keys(updates)
        },
        ipAddress: 'SYSTEM',
        userAgent: 'CONTRACT_ENGINE',
        timestamp: new Date(),
        category: 'CONTRACT',
        severity: 'INFO'
      });

      return updatedContract;
    } catch (error) {
      const contract = this.contracts.get(contractId);
      await this.auditLog.logOperation({
        tenantId: contract?.tenantId || 'UNKNOWN',
        userId: updatedBy,
        action: 'UPDATE_CONTRACT_ERROR',
        details: {
          error: (error as Error).message,
          contractId
        },
        ipAddress: 'SYSTEM',
        userAgent: 'CONTRACT_ENGINE',
        timestamp: new Date(),
        category: 'CONTRACT',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  public async approveContract(
    contractId: string,
    stepId: string,
    approvedBy: string,
    comments?: string
  ): Promise<void> {
    try {
      const contract = this.contracts.get(contractId);
      if (!contract) {
        throw new Error(`Contract ${contractId} not found`);
      }

      const workflow = this.workflows.get(contract.approvalWorkflow.id);
      if (!workflow) {
        throw new Error(`Workflow ${contract.approvalWorkflow.id} not found`);
      }

      const step = workflow.steps.find(s => s.id === stepId);
      if (!step) {
        throw new Error(`Step ${stepId} not found`);
      }

      // Update step
      step.status = 'COMPLETED';
      step.completedAt = new Date();
      step.completedBy = approvedBy;
      step.comments = comments;

      // Move to next step
      workflow.currentStep++;
      if (workflow.currentStep >= workflow.steps.length) {
        workflow.status = 'COMPLETED';
        workflow.completedAt = new Date();
        contract.status = 'PENDING_SIGNATURE';
      }

      // Log the operation
      await this.auditLog.logOperation({
        tenantId: contract.tenantId,
        userId: approvedBy,
        action: 'APPROVE_CONTRACT_STEP',
        details: {
          contractId,
          stepId,
          stepName: step.name,
          comments
        },
        ipAddress: 'SYSTEM',
        userAgent: 'CONTRACT_ENGINE',
        timestamp: new Date(),
        category: 'CONTRACT',
        severity: 'INFO'
      });
    } catch (error) {
      const contract = this.contracts.get(contractId);
      await this.auditLog.logOperation({
        tenantId: contract?.tenantId || 'UNKNOWN',
        userId: approvedBy,
        action: 'APPROVE_CONTRACT_STEP_ERROR',
        details: {
          error: (error as Error).message,
          contractId,
          stepId
        },
        ipAddress: 'SYSTEM',
        userAgent: 'CONTRACT_ENGINE',
        timestamp: new Date(),
        category: 'CONTRACT',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  public async signContract(
    contractId: string,
    partyId: string,
    signerName: string,
    signerTitle: string,
    signerEmail: string,
    signatureData: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      const contract = this.contracts.get(contractId);
      if (!contract) {
        throw new Error(`Contract ${contractId} not found`);
      }

      // Add signature
      const signature: ContractSignature = {
        id: this.generateSignatureId(),
        partyId,
        signerName,
        signerTitle,
        signerEmail,
        signatureMethod: 'ELECTRONIC',
        signedAt: new Date(),
        ipAddress,
        userAgent,
        signatureData
      };

      contract.signatures.push(signature);

      // Check if all parties have signed
      if (contract.signatures.length >= contract.parties.length) {
        contract.status = 'ACTIVE';
        contract.signedBy = signerEmail;
      }

      // Log the operation
      await this.auditLog.logOperation({
        tenantId: contract.tenantId,
        userId: signerEmail,
        action: 'SIGN_CONTRACT',
        details: {
          contractId,
          partyId,
          signerName,
          signerTitle
        },
        ipAddress,
        userAgent,
        timestamp: new Date(),
        category: 'CONTRACT',
        severity: 'INFO'
      });
    } catch (error) {
      const contract = this.contracts.get(contractId);
      await this.auditLog.logOperation({
        tenantId: contract?.tenantId || 'UNKNOWN',
        userId: signerEmail,
        action: 'SIGN_CONTRACT_ERROR',
        details: {
          error: (error as Error).message,
          contractId,
          partyId
        },
        ipAddress,
        userAgent,
        timestamp: new Date(),
        category: 'CONTRACT',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  public async getContract(contractId: string): Promise<Contract | null> {
    return this.contracts.get(contractId) || null;
  }

  public async getContractsByTenant(tenantId: string): Promise<Contract[]> {
    return Array.from(this.contracts.values()).filter(contract => contract.tenantId === tenantId);
  }

  public async getContractsByStatus(status: Contract['status']): Promise<Contract[]> {
    return Array.from(this.contracts.values()).filter(contract => contract.status === status);
  }

  public async getContractMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<ContractMetrics> {
    const contracts = Array.from(this.contracts.values())
      .filter(contract => contract.createdAt >= startDate && contract.createdAt <= endDate);

    const activeContracts = contracts.filter(c => c.status === 'ACTIVE');
    const expiredContracts = contracts.filter(c => c.status === 'EXPIRED');

    const totalContractValue = contracts.reduce((sum, c) => sum + c.financialTerms.contractValue, 0);
    const averageContractValue = contracts.length > 0 ? totalContractValue / contracts.length : 0;

    const contractsByType: { [key: string]: number } = {};
    const contractsByStatus: { [key: string]: number } = {};

    contracts.forEach(contract => {
      contractsByType[contract.contractType] = (contractsByType[contract.contractType] || 0) + 1;
      contractsByStatus[contract.status] = (contractsByStatus[contract.status] || 0) + 1;
    });

    const complianceStatus = {
      compliant: 0,
      nonCompliant: 0,
      pending: 0
    };

    contracts.forEach(contract => {
      contract.complianceRequirements.forEach(req => {
        if (req.implementationStatus === 'COMPLETED' || req.implementationStatus === 'VERIFIED') {
          complianceStatus.compliant++;
        } else if (req.implementationStatus === 'NOT_STARTED') {
          complianceStatus.pending++;
        } else {
          complianceStatus.nonCompliant++;
        }
      });
    });

    return {
      totalContracts: contracts.length,
      activeContracts: activeContracts.length,
      expiredContracts: expiredContracts.length,
      totalContractValue,
      averageContractValue,
      contractsByType,
      contractsByStatus,
      complianceStatus,
      renewalRate: 0.85, // Placeholder
      averageNegotiationTime: 15, // Placeholder in days
      periodStart: startDate,
      periodEnd: endDate
    };
  }

  private generateContractId(): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CONTRACT${timestamp}${random}`;
  }

  private generateContractNumber(tenantId: string): string {
    const year = new Date().getFullYear();
    const sequence = Math.floor(Math.random() * 99999) + 1;
    return `${tenantId.toUpperCase()}-${year}-${sequence.toString().padStart(5, '0')}`;
  }

  private generateComplianceId(): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `COMP${timestamp}${random}`;
  }

  private generateServiceLevelId(): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `SLA${timestamp}${random}`;
  }

  private generateStepId(): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `STEP${timestamp}${random}`;
  }

  private generateWorkflowId(): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `WORKFLOW${timestamp}${random}`;
  }

  private generateSignatureId(): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `SIG${timestamp}${random}`;
  }
}
