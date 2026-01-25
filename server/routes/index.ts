import type { Express } from "express";
import type { Server } from "http";

import { registerWorkflowRoutes } from "./workflow.routes";
import { registerWorkflowInstanceRoutes } from "./workflow-instances.routes";
import { registerRoutes } from "../routes-legacy";

export async function registerAllRoutes(app: Express): Promise<Server> {
  registerWorkflowRoutes(app);
  registerWorkflowInstanceRoutes(app);
  return registerRoutes(app);
}
