import { PrismaClient } from '@prisma/client';
import { ApprovalWorkflowManager } from '../enterprise/approval-workflows.js';
import { dangerousOperationsRegistry } from '../enterprise/dangerous-operations.js';
import { TenantContext } from '../tenant/tenant-isolation.js';

export type DataRightsApprovalRequest = {
  tenantId: string;
  requestedBy: string;
  correlationId: string;
  right: 'ACCESS' | 'RECTIFICATION' | 'ERASURE' | 'PORTABILITY';
  dataSubjectId: string;
  reason: string;
  metadata?: Record<string, any>;
};

export class DataRightsApprovals {
  private readonly approval: ApprovalWorkflowManager;

  constructor(prisma: PrismaClient) {
    this.approval = ApprovalWorkflowManager.getInstance(prisma);
  }

  async requestErasureApproval(input: DataRightsApprovalRequest, tenantContext: TenantContext): Promise<{ approvalRequestId: string }> {
    if (tenantContext.tenantId !== input.tenantId) {
      throw new Error('TENANT_CONTEXT_MISMATCH');
    }

    const op = dangerousOperationsRegistry.getOperation('DATA_PURGE');
    if (!op) {
      throw new Error('DANGEROUS_OPERATION_NOT_REGISTERED:DATA_PURGE');
    }

    const req = await this.approval.createApprovalRequest(
      op.id,
      tenantContext,
      {
        dataSubjectId: input.dataSubjectId,
        right: input.right,
        metadata: input.metadata || {},
      },
      input.reason,
      input.correlationId
    );

    return { approvalRequestId: req.id };
  }
}
