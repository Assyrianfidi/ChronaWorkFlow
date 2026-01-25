import type { Express } from "express";

import {
  cancelWorkflowInstance,
  getWorkflowInstanceDetail,
  resumeAfterApproval,
  startWorkflowInstance,
} from "../services/workflow.service";

function resolveCompanyId(req: any): string | null {
  const tokenCompanyId = req.user?.currentCompanyId as string | undefined;
  if (typeof tokenCompanyId === "string" && tokenCompanyId) return tokenCompanyId;
  const q = req.query?.companyId;
  if (typeof q === "string" && q) return q;
  const b = req.body?.companyId;
  if (typeof b === "string" && b) return b;
  return null;
}

export function registerWorkflowInstanceRoutes(app: Express) {
  app.post("/api/workflow-instances/start", async (req, res) => {
    try {
      const companyId = resolveCompanyId(req);
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }

      const triggerEventType = String(req.body?.triggerEventType ?? "");
      const triggerEntityType = String(req.body?.triggerEntityType ?? "");
      const triggerEntityId = typeof req.body?.triggerEntityId === "string" ? req.body.triggerEntityId : null;

      if (!triggerEventType || !triggerEntityType) {
        return res.status(400).json({ error: "triggerEventType and triggerEntityType are required" });
      }

      const instances = await startWorkflowInstance({
        companyId,
        triggerEventType,
        triggerEntityType,
        triggerEntityId,
        metadataJson: req.body?.metadataJson ?? null,
        actorUserId: String((req as any).user?.id ?? null),
      });

      res.status(201).json({ instances });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workflow-instances/:id", async (req, res) => {
    try {
      const companyId = resolveCompanyId(req);
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }

      const detail = await getWorkflowInstanceDetail({
        companyId,
        instanceId: req.params.id,
      });

      if (!detail) {
        return res.status(404).json({ error: "Workflow instance not found" });
      }

      res.json(detail);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflow-instances/:id/approve", async (req, res) => {
    try {
      const companyId = resolveCompanyId(req);
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }

      const approvalId = String(req.body?.approvalId ?? "");
      const decision = String(req.body?.decision ?? "");
      if (!approvalId || (decision !== "approved" && decision !== "denied")) {
        return res.status(400).json({ error: "approvalId and decision(approved|denied) are required" });
      }

      const actorUserId = String((req as any).user?.id ?? "");
      const actorRoles = Array.isArray((req as any).user?.roles) ? (req as any).user.roles : [];

      const updated = await resumeAfterApproval({
        companyId,
        instanceId: req.params.id,
        approvalId,
        decision: decision as any,
        actorUserId,
        actorRoles,
        reason: typeof req.body?.reason === "string" ? req.body.reason : null,
      });

      res.json({ success: true, result: updated });
    } catch (error: any) {
      res.status(403).json({ error: error.message });
    }
  });

  app.post("/api/workflow-instances/:id/cancel", async (req, res) => {
    try {
      const companyId = resolveCompanyId(req);
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }

      const canceled = await cancelWorkflowInstance({
        companyId,
        instanceId: req.params.id,
        actorUserId: String((req as any).user?.id ?? null),
        reason: typeof req.body?.reason === "string" ? req.body.reason : null,
      });

      res.json({ success: true, instance: canceled });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
