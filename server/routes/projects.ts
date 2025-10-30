import { z } from "zod";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { projects, projectTimeEntries, budgets, budgetCategories, mileageEntries, vehicles } from "../shared/schema";

// Project Management Routes
export async function registerProjectRoutes(app: any) {
  // ==================== PROJECTS ====================

  app.get("/api/projects", authenticateToken, async (req: any, res: any) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }

      const projectsList = await storage.getProjectsByCompany(companyId);
      res.json(projectsList);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/projects/:id", authenticateToken, async (req: any, res: any) => {
    try {
      const project = await storage.getProjectWithTimeEntries(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/projects", authenticateToken, async (req: any, res: any) => {
    try {
      const project = await storage.createProject(req.body);
      res.status(201).json(project);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/projects/:id", authenticateToken, async (req: any, res: any) => {
    try {
      const project = await storage.updateProject(req.params.id, req.body);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== PROJECT TIME ENTRIES ====================

  app.get("/api/projects/:projectId/time-entries", authenticateToken, async (req: any, res: any) => {
    try {
      const entries = await storage.getProjectTimeEntriesByProject(req.params.projectId);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/projects/time-entries", authenticateToken, async (req: any, res: any) => {
    try {
      const entry = await storage.createProjectTimeEntry({
        ...req.body,
        createdBy: req.user.id,
      });
      res.status(201).json(entry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/projects/time-entries/:id", authenticateToken, async (req: any, res: any) => {
    try {
      const entry = await storage.updateProjectTimeEntry(req.params.id, req.body);
      if (!entry) {
        return res.status(404).json({ error: "Time entry not found" });
      }
      res.json(entry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== BUDGETS ====================

  app.get("/api/budgets", authenticateToken, async (req: any, res: any) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }

      const budgetsList = await storage.getBudgetsByCompany(companyId);
      res.json(budgetsList);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/budgets/:id", authenticateToken, async (req: any, res: any) => {
    try {
      const budget = await storage.getBudgetWithCategories(req.params.id);
      if (!budget) {
        return res.status(404).json({ error: "Budget not found" });
      }
      res.json(budget);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/budgets", authenticateToken, async (req: any, res: any) => {
    try {
      const budget = await storage.createBudget({
        ...req.body,
        createdBy: req.user.id,
      });
      res.status(201).json(budget);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/budgets/:id/categories", authenticateToken, async (req: any, res: any) => {
    try {
      const category = await storage.createBudgetCategory(req.body);
      res.status(201).json(category);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== MILEAGE TRACKING ====================

  app.get("/api/mileage", authenticateToken, async (req: any, res: any) => {
    try {
      const companyId = req.query.companyId as string;
      const employeeId = req.query.employeeId as string;

      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }

      let entries;
      if (employeeId) {
        entries = await storage.getMileageEntriesByEmployee(employeeId);
      } else {
        entries = await storage.getMileageEntriesByCompany(companyId);
      }

      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/mileage", authenticateToken, async (req: any, res: any) => {
    try {
      const entry = await storage.createMileageEntry({
        ...req.body,
        createdBy: req.user.id,
      });
      res.status(201).json(entry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/mileage/:id/approve", authenticateToken, async (req: any, res: any) => {
    try {
      await storage.approveMileageEntry(req.params.id, req.user.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== VEHICLES ====================

  app.get("/api/vehicles", authenticateToken, async (req: any, res: any) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }

      const vehiclesList = await storage.getVehiclesByCompany(companyId);
      res.json(vehiclesList);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/vehicles", authenticateToken, async (req: any, res: any) => {
    try {
      const vehicle = await storage.createVehicle(req.body);
      res.status(201).json(vehicle);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/vehicles/:id", authenticateToken, async (req: any, res: any) => {
    try {
      const vehicle = await storage.updateVehicle(req.params.id, req.body);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
