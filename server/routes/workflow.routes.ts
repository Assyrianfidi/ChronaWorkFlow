import type { Express } from "express";

import { createWorkflowDefinition, listWorkflowDefinitions, publishWorkflowVersion } from "../services/workflow.service";

function resolveCompanyId(req: any): string | null {
  const tokenCompanyId = req.user?.currentCompanyId as string | undefined;
  if (typeof tokenCompanyId === "string" && tokenCompanyId) return tokenCompanyId;
  const q = req.query?.companyId;
  if (typeof q === "string" && q) return q;
  const b = req.body?.companyId;
  if (typeof b === "string" && b) return b;
  return null;
}

export function registerWorkflowRoutes(_app: Express) {
  const app = _app;

  app.post("/api/workflows", async (req, res) => {
    try {
      const companyId = resolveCompanyId(req);
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }

      const name = String(req.body?.name ?? "");
      if (!name) {
        return res.status(400).json({ error: "name is required" });
      }

      const createdBy = String((req as any).user?.id ?? "");

      const definition = await createWorkflowDefinition({
        companyId,
        name,
        description: typeof req.body?.description === "string" ? req.body.description : null,
        createdBy,
      });

      res.status(201).json(definition);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflows/:id/publish", async (req, res) => {
    try {
      const companyId = resolveCompanyId(req);
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }

      const triggerEventType = String(req.body?.triggerEventType ?? "");
      const triggerEntityType = String(req.body?.triggerEntityType ?? "");
      const definitionJson = req.body?.definitionJson;

      if (!triggerEventType || !triggerEntityType || !definitionJson) {
        return res.status(400).json({ error: "triggerEventType, triggerEntityType, and definitionJson are required" });
      }

      const version = await publishWorkflowVersion({
        companyId,
        workflowDefinitionId: req.params.id,
        triggerEventType,
        triggerEntityType,
        definitionJson,
        metadataJson: req.body?.metadataJson ?? null,
        actorUserId: String((req as any).user?.id ?? ""),
      });

      res.json(version);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/workflows", async (req, res) => {
    try {
      const companyId = resolveCompanyId(req);
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }

      const definitions = await listWorkflowDefinitions({ companyId });
      res.json(definitions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
