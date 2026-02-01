import type { Express } from "express";

import { registerWorkflowRoutes } from "./workflow.routes";
import { registerWorkflowInstanceRoutes } from "./workflow-instances.routes";
import { registerRoutes } from "../routes-legacy";

export async function registerAllRoutes(app: Express): Promise<void> {
  registerWorkflowRoutes(app);
  registerWorkflowInstanceRoutes(app);
  return registerRoutes(app);
}
