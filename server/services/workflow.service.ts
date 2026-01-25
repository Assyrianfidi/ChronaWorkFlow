import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "../db";
import { jobService } from "../jobs/service";
import { storage } from "../storage";
import * as s from "../../shared/schema";

type WorkflowStep = {
  key: string;
  type: "task" | "approval" | "timer";
  approvalRole?: string;
  timerDelaySeconds?: number;
};

type WorkflowDefinitionJson = {
  steps: WorkflowStep[];
};

function getSteps(definitionJson: unknown): WorkflowStep[] {
  const d = definitionJson as any;
  const steps = Array.isArray(d?.steps) ? d.steps : [];
  return steps
    .map((step: any, idx: number) => {
      const key = typeof step?.key === "string" && step.key ? step.key : `step_${idx}`;
      const type = step?.type;
      if (type !== "task" && type !== "approval" && type !== "timer") return null;
      return {
        key,
        type,
        approvalRole: typeof step?.approvalRole === "string" ? step.approvalRole : undefined,
        timerDelaySeconds:
          typeof step?.timerDelaySeconds === "number" && Number.isFinite(step.timerDelaySeconds)
            ? step.timerDelaySeconds
            : undefined,
      } satisfies WorkflowStep;
    })
    .filter(Boolean) as WorkflowStep[];
}

async function appendHistory(input: {
  companyId: string;
  workflowInstanceId: string;
  stepKey?: string | null;
  stepIndex?: number | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  eventType: string;
  actorUserId?: string | null;
  metadataJson?: unknown;
}) {
  await db.insert(s.workflowInstanceStepHistory).values({
    companyId: input.companyId,
    workflowInstanceId: input.workflowInstanceId,
    stepKey: input.stepKey ?? null,
    stepIndex: input.stepIndex ?? null,
    fromStatus: input.fromStatus ?? null,
    toStatus: input.toStatus ?? null,
    eventType: input.eventType,
    actorUserId: input.actorUserId ?? null,
    metadataJson: (input.metadataJson ?? null) as any,
    createdAt: new Date(),
  });
}

async function emitEvent(input: {
  companyId: string;
  eventType: string;
  entityType: string;
  entityId?: string | null;
  payloadJson?: unknown;
  source?: string;
  userId?: string | null;
  correlationId?: string | null;
}) {
  await db.insert(s.workflowEventLog).values({
    companyId: input.companyId,
    eventType: input.eventType,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    payloadJson: (input.payloadJson ?? null) as any,
    source: input.source ?? "system",
    userId: input.userId ?? null,
    correlationId: input.correlationId ?? null,
    createdAt: new Date(),
  });
}

export async function createWorkflowDefinition(input: {
  companyId: string;
  name: string;
  description?: string | null;
  createdBy: string;
}) {
  const [row] = await db
    .insert(s.workflowDefinitions)
    .values({
      companyId: input.companyId,
      name: input.name,
      description: input.description ?? null,
      isActive: true,
      createdBy: input.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return row;
}

export async function publishWorkflowVersion(input: {
  companyId: string;
  workflowDefinitionId: string;
  triggerEventType: string;
  triggerEntityType: string;
  definitionJson: WorkflowDefinitionJson;
  metadataJson?: unknown;
  actorUserId: string;
}) {
  const [{ maxVersionRaw }] = await db
    .select({ maxVersionRaw: sql<string>`coalesce(max(${s.workflowDefinitionVersions.version}), '0')` })
    .from(s.workflowDefinitionVersions)
    .where(eq(s.workflowDefinitionVersions.workflowDefinitionId, input.workflowDefinitionId));

  const nextVersion = Number.parseInt(String(maxVersionRaw ?? "0"), 10) + 1;

  const [row] = await db
    .insert(s.workflowDefinitionVersions)
    .values({
      companyId: input.companyId,
      workflowDefinitionId: input.workflowDefinitionId,
      version: nextVersion,
      status: "published",
      triggerEventType: input.triggerEventType,
      triggerEntityType: input.triggerEntityType,
      definitionJson: input.definitionJson as any,
      metadataJson: (input.metadataJson ?? null) as any,
      createdBy: input.actorUserId,
      createdAt: new Date(),
      publishedAt: new Date(),
    })
    .returning();

  await storage.createAuditLog({
    companyId: input.companyId,
    userId: input.actorUserId,
    action: "workflow.definition.publish",
    entityType: "workflow_definition",
    entityId: input.workflowDefinitionId,
    changes: JSON.stringify({ versionId: row.id, version: nextVersion }),
  });

  return row;
}

export async function startWorkflowInstance(input: {
  companyId: string;
  triggerEventType: string;
  triggerEntityType: string;
  triggerEntityId?: string | null;
  metadataJson?: unknown;
  actorUserId?: string | null;
}) {
  await emitEvent({
    companyId: input.companyId,
    eventType: input.triggerEventType,
    entityType: input.triggerEntityType,
    entityId: input.triggerEntityId ?? null,
    payloadJson: input.metadataJson ?? null,
    source: "trigger",
    userId: input.actorUserId ?? null,
  });

  const versionRows = await db
    .select({
      version: s.workflowDefinitionVersions,
      definition: s.workflowDefinitions,
    })
    .from(s.workflowDefinitionVersions)
    .innerJoin(
      s.workflowDefinitions,
      eq(s.workflowDefinitionVersions.workflowDefinitionId, s.workflowDefinitions.id),
    )
    .where(
      and(
        eq(s.workflowDefinitionVersions.companyId, input.companyId),
        eq(s.workflowDefinitionVersions.status, "published" as any),
        eq(s.workflowDefinitionVersions.triggerEventType, input.triggerEventType),
        eq(s.workflowDefinitionVersions.triggerEntityType, input.triggerEntityType),
        eq(s.workflowDefinitions.isActive, true),
      ),
    )
    .orderBy(desc(s.workflowDefinitionVersions.publishedAt));

  if (!versionRows.length) {
    return [] as s.WorkflowInstance[];
  }

  const created: s.WorkflowInstance[] = [];

  for (const row of versionRows) {
    const steps = getSteps(row.version.definitionJson);
    const first = steps[0];

    const [instance] = await db
      .insert(s.workflowInstances)
      .values({
        companyId: input.companyId,
        workflowDefinitionId: row.definition.id,
        workflowDefinitionVersionId: row.version.id,
        status: "running",
        currentStepKey: first?.key ?? null,
        currentStepIndex: 0,
        triggerEventType: input.triggerEventType,
        triggerEntityType: input.triggerEntityType,
        triggerEntityId: input.triggerEntityId ?? null,
        metadataJson: (input.metadataJson ?? null) as any,
        startedBy: input.actorUserId ?? null,
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    created.push(instance);

    await appendHistory({
      companyId: input.companyId,
      workflowInstanceId: instance.id,
      stepKey: instance.currentStepKey,
      stepIndex: instance.currentStepIndex,
      fromStatus: null,
      toStatus: instance.status,
      eventType: "instance.started",
      actorUserId: input.actorUserId ?? null,
      metadataJson: { trigger: { eventType: input.triggerEventType, entityType: input.triggerEntityType, entityId: input.triggerEntityId ?? null } },
    });

    await emitEvent({
      companyId: input.companyId,
      eventType: "workflow.instance.started",
      entityType: "workflow_instance",
      entityId: instance.id,
      payloadJson: {
        workflowDefinitionId: instance.workflowDefinitionId,
        workflowDefinitionVersionId: instance.workflowDefinitionVersionId,
        triggerEventType: input.triggerEventType,
        triggerEntityType: input.triggerEntityType,
        triggerEntityId: input.triggerEntityId ?? null,
      },
      source: "workflow",
      userId: input.actorUserId ?? null,
    });

    await advanceWorkflowStep({
      companyId: input.companyId,
      instanceId: instance.id,
      actorUserId: input.actorUserId ?? null,
    });
  }

  return created;
}

export async function advanceWorkflowStep(input: {
  companyId: string;
  instanceId: string;
  actorUserId?: string | null;
}) {
  const [instance] = await db
    .select()
    .from(s.workflowInstances)
    .where(and(eq(s.workflowInstances.id, input.instanceId), eq(s.workflowInstances.companyId, input.companyId)));

  if (!instance) {
    throw new Error("Workflow instance not found");
  }

  if (instance.status !== "running") {
    return instance;
  }

  const [version] = await db
    .select()
    .from(s.workflowDefinitionVersions)
    .where(
      and(
        eq(s.workflowDefinitionVersions.id, instance.workflowDefinitionVersionId),
        eq(s.workflowDefinitionVersions.companyId, input.companyId),
      ),
    );

  if (!version) {
    throw new Error("Workflow definition version not found");
  }

  const steps = getSteps(version.definitionJson);

  const idx = instance.currentStepIndex ?? 0;
  const step = steps[idx];

  if (!step) {
    const fromStatus = instance.status;
    await db
      .update(s.workflowInstances)
      .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
      .where(eq(s.workflowInstances.id, instance.id));

    await appendHistory({
      companyId: input.companyId,
      workflowInstanceId: instance.id,
      stepKey: instance.currentStepKey,
      stepIndex: idx,
      fromStatus,
      toStatus: "completed",
      eventType: "instance.completed",
      actorUserId: input.actorUserId ?? null,
    });

    await emitEvent({
      companyId: input.companyId,
      eventType: "workflow.instance.completed",
      entityType: "workflow_instance",
      entityId: instance.id,
      source: "workflow",
      userId: input.actorUserId ?? null,
    });

    return { ...instance, status: "completed" };
  }

  if (step.type === "approval") {
    return pauseForApproval({
      companyId: input.companyId,
      instanceId: instance.id,
      stepKey: step.key,
      stepIndex: idx,
      requiredRole: step.approvalRole ?? "ACCOUNTANT",
      actorUserId: input.actorUserId ?? null,
    });
  }

  if (step.type === "timer") {
    const delaySeconds = step.timerDelaySeconds ?? 60;
    const fireAt = new Date(Date.now() + delaySeconds * 1000);
    return scheduleTimer({
      companyId: input.companyId,
      instanceId: instance.id,
      timerKey: step.key,
      fireAt,
      actorUserId: input.actorUserId ?? null,
    });
  }

  await appendHistory({
    companyId: input.companyId,
    workflowInstanceId: instance.id,
    stepKey: step.key,
    stepIndex: idx,
    fromStatus: instance.status,
    toStatus: instance.status,
    eventType: "step.completed",
    actorUserId: input.actorUserId ?? null,
    metadataJson: { step },
  });

  const nextIndex = idx + 1;
  const nextStep = steps[nextIndex];

  await db
    .update(s.workflowInstances)
    .set({
      currentStepIndex: nextIndex,
      currentStepKey: nextStep?.key ?? null,
      updatedAt: new Date(),
    })
    .where(eq(s.workflowInstances.id, instance.id));

  return advanceWorkflowStep({
    companyId: input.companyId,
    instanceId: instance.id,
    actorUserId: input.actorUserId ?? null,
  });
}

export async function pauseForApproval(input: {
  companyId: string;
  instanceId: string;
  stepKey: string;
  stepIndex: number;
  requiredRole: string;
  actorUserId?: string | null;
}) {
  const [instance] = await db
    .select()
    .from(s.workflowInstances)
    .where(and(eq(s.workflowInstances.id, input.instanceId), eq(s.workflowInstances.companyId, input.companyId)));

  if (!instance) {
    throw new Error("Workflow instance not found");
  }

  const fromStatus = instance.status;

  const [updatedInstance] = await db
    .update(s.workflowInstances)
    .set({
      status: "waiting_approval",
      currentStepKey: input.stepKey,
      currentStepIndex: input.stepIndex,
      updatedAt: new Date(),
    })
    .where(eq(s.workflowInstances.id, input.instanceId))
    .returning();

  await appendHistory({
    companyId: input.companyId,
    workflowInstanceId: input.instanceId,
    stepKey: input.stepKey,
    stepIndex: input.stepIndex,
    fromStatus,
    toStatus: "waiting_approval",
    eventType: "approval.requested",
    actorUserId: input.actorUserId ?? null,
    metadataJson: { requiredRole: input.requiredRole },
  });

  const [approval] = await db
    .insert(s.workflowApprovals)
    .values({
      companyId: input.companyId,
      workflowInstanceId: input.instanceId,
      requiredRole: input.requiredRole,
      status: "pending",
      requestedAt: new Date(),
      requestedBy: input.actorUserId ?? null,
      metadataJson: { stepKey: input.stepKey, stepIndex: input.stepIndex } as any,
    })
    .returning();

  await emitEvent({
    companyId: input.companyId,
    eventType: "workflow.approval.requested",
    entityType: "workflow_approval",
    entityId: approval.id,
    payloadJson: { workflowInstanceId: input.instanceId, requiredRole: input.requiredRole },
    source: "workflow",
    userId: input.actorUserId ?? null,
  });

  return updatedInstance;
}

export async function resumeAfterApproval(input: {
  companyId: string;
  instanceId: string;
  approvalId: string;
  decision: "approved" | "denied";
  actorUserId: string;
  actorRoles: string[];
  reason?: string | null;
}) {
  const [approval] = await db
    .select()
    .from(s.workflowApprovals)
    .where(and(eq(s.workflowApprovals.id, input.approvalId), eq(s.workflowApprovals.companyId, input.companyId)));

  if (!approval) {
    throw new Error("Approval not found");
  }

  if (approval.status !== "pending") {
    return approval;
  }

  const requiredRole = approval.requiredRole;
  const allowed = input.actorRoles.includes(requiredRole) || input.actorRoles.includes("OWNER");

  if (!allowed) {
    await storage.createAuditLog({
      companyId: input.companyId,
      userId: input.actorUserId,
      action: "workflow.approval.denied",
      entityType: "workflow_approval",
      entityId: approval.id,
      changes: JSON.stringify({ requiredRole, actorRoles: input.actorRoles }),
    });

    await db
      .update(s.workflowApprovals)
      .set({
        status: "denied",
        decidedAt: new Date(),
        decidedBy: input.actorUserId,
        decisionReason: "role_mismatch",
        metadataJson: { ...((approval.metadataJson as any) ?? {}), reason: input.reason ?? null } as any,
      })
      .where(eq(s.workflowApprovals.id, approval.id));

    throw new Error("Approval role requirement not met");
  }

  await db
    .update(s.workflowApprovals)
    .set({
      status: input.decision,
      decidedAt: new Date(),
      decidedBy: input.actorUserId,
      decisionReason: input.reason ?? null,
    })
    .where(eq(s.workflowApprovals.id, approval.id));

  await appendHistory({
    companyId: input.companyId,
    workflowInstanceId: input.instanceId,
    eventType: `approval.${input.decision}`,
    actorUserId: input.actorUserId,
    metadataJson: { approvalId: approval.id, requiredRole },
  });

  await emitEvent({
    companyId: input.companyId,
    eventType: `workflow.approval.${input.decision}`,
    entityType: "workflow_approval",
    entityId: approval.id,
    payloadJson: { workflowInstanceId: input.instanceId, decision: input.decision },
    source: "workflow",
    userId: input.actorUserId,
  });

  if (input.decision === "denied") {
    await cancelWorkflowInstance({
      companyId: input.companyId,
      instanceId: input.instanceId,
      actorUserId: input.actorUserId,
      reason: input.reason ?? "approval_denied",
    });

    return approval;
  }

  await db
    .update(s.workflowInstances)
    .set({ status: "running", updatedAt: new Date() })
    .where(eq(s.workflowInstances.id, input.instanceId));

  return advanceWorkflowStep({
    companyId: input.companyId,
    instanceId: input.instanceId,
    actorUserId: input.actorUserId,
  });
}

export async function scheduleTimer(input: {
  companyId: string;
  instanceId: string;
  timerKey: string;
  fireAt: Date;
  actorUserId?: string | null;
}) {
  const [instance] = await db
    .select()
    .from(s.workflowInstances)
    .where(and(eq(s.workflowInstances.id, input.instanceId), eq(s.workflowInstances.companyId, input.companyId)));

  if (!instance) {
    throw new Error("Workflow instance not found");
  }

  const fromStatus = instance.status;

  await db
    .update(s.workflowInstances)
    .set({ status: "waiting_timer", updatedAt: new Date() })
    .where(eq(s.workflowInstances.id, input.instanceId));

  const [timer] = await db
    .insert(s.workflowTimers)
    .values({
      companyId: input.companyId,
      workflowInstanceId: input.instanceId,
      timerKey: input.timerKey,
      status: "scheduled",
      fireAt: input.fireAt,
      createdAt: new Date(),
    })
    .returning();

  const delayMs = Math.max(0, input.fireAt.getTime() - Date.now());
  const job = await jobService.addWorkflowTimerJob({
    companyId: input.companyId,
    workflowTimerId: timer.id,
    workflowInstanceId: input.instanceId,
  }, delayMs);

  await db
    .update(s.workflowTimers)
    .set({ jobId: String(job.id) })
    .where(eq(s.workflowTimers.id, timer.id));

  await appendHistory({
    companyId: input.companyId,
    workflowInstanceId: input.instanceId,
    fromStatus,
    toStatus: "waiting_timer",
    eventType: "timer.scheduled",
    actorUserId: input.actorUserId ?? null,
    metadataJson: { timerId: timer.id, fireAt: input.fireAt.toISOString() },
  });

  await emitEvent({
    companyId: input.companyId,
    eventType: "workflow.timer.scheduled",
    entityType: "workflow_timer",
    entityId: timer.id,
    payloadJson: { workflowInstanceId: input.instanceId, fireAt: input.fireAt.toISOString() },
    source: "workflow",
    userId: input.actorUserId ?? null,
  });

  return timer;
}

export async function fireTimer(input: {
  companyId: string;
  workflowTimerId: string;
  workflowInstanceId: string;
}) {
  const [timer] = await db
    .select()
    .from(s.workflowTimers)
    .where(and(eq(s.workflowTimers.id, input.workflowTimerId), eq(s.workflowTimers.companyId, input.companyId)));

  if (!timer) {
    return;
  }

  if (timer.status !== "scheduled") {
    return;
  }

  await db
    .update(s.workflowTimers)
    .set({ status: "fired", firedAt: new Date() })
    .where(eq(s.workflowTimers.id, input.workflowTimerId));

  await appendHistory({
    companyId: input.companyId,
    workflowInstanceId: input.workflowInstanceId,
    eventType: "timer.fired",
    metadataJson: { workflowTimerId: input.workflowTimerId },
  });

  await emitEvent({
    companyId: input.companyId,
    eventType: "workflow.timer.fired",
    entityType: "workflow_timer",
    entityId: input.workflowTimerId,
    payloadJson: { workflowInstanceId: input.workflowInstanceId },
    source: "workflow",
  });

  await db
    .update(s.workflowInstances)
    .set({ status: "running", updatedAt: new Date() })
    .where(eq(s.workflowInstances.id, input.workflowInstanceId));

  await advanceWorkflowStep({
    companyId: input.companyId,
    instanceId: input.workflowInstanceId,
  });
}

export async function cancelWorkflowInstance(input: {
  companyId: string;
  instanceId: string;
  actorUserId?: string | null;
  reason?: string | null;
}) {
  const [instance] = await db
    .select()
    .from(s.workflowInstances)
    .where(and(eq(s.workflowInstances.id, input.instanceId), eq(s.workflowInstances.companyId, input.companyId)));

  if (!instance) {
    throw new Error("Workflow instance not found");
  }

  if (instance.status === "completed" || instance.status === "canceled") {
    return instance;
  }

  const fromStatus = instance.status;

  await db
    .update(s.workflowInstances)
    .set({ status: "canceled", canceledAt: new Date(), updatedAt: new Date(), error: input.reason ?? null })
    .where(eq(s.workflowInstances.id, input.instanceId));

  await appendHistory({
    companyId: input.companyId,
    workflowInstanceId: input.instanceId,
    fromStatus,
    toStatus: "canceled",
    eventType: "instance.canceled",
    actorUserId: input.actorUserId ?? null,
    metadataJson: { reason: input.reason ?? null },
  });

  await emitEvent({
    companyId: input.companyId,
    eventType: "workflow.instance.canceled",
    entityType: "workflow_instance",
    entityId: input.instanceId,
    payloadJson: { reason: input.reason ?? null },
    source: "workflow",
    userId: input.actorUserId ?? null,
  });

  return { ...instance, status: "canceled" };
}

export async function getWorkflowInstanceDetail(input: {
  companyId: string;
  instanceId: string;
}) {
  const [instance] = await db
    .select()
    .from(s.workflowInstances)
    .where(and(eq(s.workflowInstances.id, input.instanceId), eq(s.workflowInstances.companyId, input.companyId)));

  if (!instance) return null;

  const history = await db
    .select()
    .from(s.workflowInstanceStepHistory)
    .where(and(eq(s.workflowInstanceStepHistory.workflowInstanceId, input.instanceId), eq(s.workflowInstanceStepHistory.companyId, input.companyId)))
    .orderBy(desc(s.workflowInstanceStepHistory.createdAt));

  const approvals = await db
    .select()
    .from(s.workflowApprovals)
    .where(and(eq(s.workflowApprovals.workflowInstanceId, input.instanceId), eq(s.workflowApprovals.companyId, input.companyId)))
    .orderBy(desc(s.workflowApprovals.requestedAt));

  const timers = await db
    .select()
    .from(s.workflowTimers)
    .where(and(eq(s.workflowTimers.workflowInstanceId, input.instanceId), eq(s.workflowTimers.companyId, input.companyId)))
    .orderBy(desc(s.workflowTimers.createdAt));

  return { instance, history, approvals, timers };
}

export async function listWorkflowDefinitions(input: { companyId: string }) {
  const defs = await db
    .select()
    .from(s.workflowDefinitions)
    .where(eq(s.workflowDefinitions.companyId, input.companyId))
    .orderBy(desc(s.workflowDefinitions.createdAt));

  return defs;
}
