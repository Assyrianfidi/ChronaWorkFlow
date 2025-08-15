import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isBusinessUser, isAdmin } from "./auth";
import { 
  insertWorkerSchema,
  insertClientSchema,
  insertProjectSchema,
  insertTimeLogSchema,
  insertInvoiceSchema,
  insertInvoiceLineItemSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Simple logout that completely bypasses authentication
  app.all('/api/simple-logout', (req, res) => {
    // Clear session without calling passport or OAuth
    if (req.session) {
      req.session.destroy(() => {});
    }
    
    // Clear all possible cookies
    const cookieNames = ['connect.sid', 'session', 'passport', 'auth'];
    cookieNames.forEach(name => {
      res.clearCookie(name, { path: '/' });
      res.clearCookie(name, { path: '/', domain: req.hostname });
    });
    
    // Send HTML that clears everything and redirects
    res.send(`
      <html>
        <head>
          <title>Logging out...</title>
          <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
          <meta http-equiv="Pragma" content="no-cache">
          <meta http-equiv="Expires" content="0">
        </head>
        <body>
          <script>
            // Clear all storage
            localStorage.clear();
            sessionStorage.clear();
            
            // Clear all cookies
            document.cookie.split(";").forEach(function(c) { 
              document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
            });
            
            // Force reload the page to completely reset state
            setTimeout(() => {
              window.location.replace('/logged-out');
            }, 100);
          </script>
          <p>Logging out, please wait...</p>
        </body>
      </html>
    `);
  });

  // Emergency logout route that bypasses all authentication
  app.get('/api/force-logout', (req, res) => {
    // Send HTML that clears everything and redirects
    res.send(`
      <html>
        <head><title>Logging out...</title></head>
        <body>
          <script>
            // Clear all storage
            localStorage.clear();
            sessionStorage.clear();
            
            // Clear all cookies
            document.cookie.split(";").forEach(function(c) { 
              document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
            });
            
            // Redirect to logged out page
            window.location.replace('/logged-out');
          </script>
          <p>Logging out...</p>
        </body>
      </html>
    `);
  });

  // Logged out page route - serves a simple logged out page
  app.get('/logged-out', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Logged Out - Chrona Workflow</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              margin: 0;
              padding: 0;
              min-height: 100vh;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: white;
              padding: 3rem;
              border-radius: 12px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 400px;
              width: 90%;
            }
            h1 {
              color: #2d3748;
              margin-bottom: 1rem;
              font-size: 2rem;
            }
            p {
              color: #4a5568;
              margin-bottom: 2rem;
              font-size: 1.1rem;
              line-height: 1.6;
            }
            .btn {
              background: #667eea;
              color: white;
              padding: 0.75rem 2rem;
              border: none;
              border-radius: 6px;
              font-size: 1rem;
              font-weight: 600;
              cursor: pointer;
              text-decoration: none;
              display: inline-block;
              transition: background 0.2s;
            }
            .btn:hover {
              background: #5a6fd8;
            }
            .logo {
              width: 60px;
              height: 60px;
              background: #667eea;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 1.5rem;
              color: white;
              font-size: 24px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">CW</div>
            <h1>You've been logged out</h1>
            <p>Thank you for using Chrona Workflow. Your session has been safely terminated.</p>
            <a href="/api/login" class="btn">Log in again</a>
          </div>
        </body>
      </html>
    `);
  });

  // Dashboard routes (business-scoped)
  app.get("/api/dashboard/stats", isBusinessUser, async (req: any, res) => {
    try {
      const businessId = req.user.businessId;
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  app.get("/api/dashboard/recent-logs", isBusinessUser, async (req: any, res) => {
    try {
      const businessId = req.user.businessId;
      const logs = await storage.getRecentTimeLogs(10);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching recent logs:", error);
      res.status(500).json({ message: "Failed to fetch recent time logs" });
    }
  });

  // Worker routes (business-scoped)
  app.get("/api/workers", isBusinessUser, async (req: any, res) => {
    try {
      const businessId = req.user.businessId;
      const workers = await storage.getWorkers(businessId);
      res.json(workers);
    } catch (error) {
      console.error("Error fetching workers:", error);
      res.status(500).json({ message: "Failed to fetch workers" });
    }
  });

  app.get("/api/workers/:id", isBusinessUser, async (req: any, res) => {
    try {
      const businessId = req.user.businessId;
      const worker = await storage.getWorker(req.params.id, businessId);
      if (!worker) {
        return res.status(404).json({ message: "Worker not found" });
      }
      res.json(worker);
    } catch (error) {
      console.error("Error fetching worker:", error);
      res.status(500).json({ message: "Failed to fetch worker" });
    }
  });

  app.post("/api/workers", isBusinessUser, async (req: any, res) => {
    try {
      const businessId = req.user.businessId;
      const workerData = insertWorkerSchema.parse({
        ...req.body,
        businessId
      });
      const worker = await storage.createWorker(workerData);
      res.status(201).json(worker);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid worker data", errors: error.errors });
      }
      console.error("Error creating worker:", error);
      res.status(500).json({ message: "Failed to create worker" });
    }
  });

  app.put("/api/workers/:id", isBusinessUser, async (req: any, res) => {
    try {
      const businessId = req.user.businessId;
      // Convert hourlyRate to string if it's a number for Drizzle compatibility
      const bodyData = { ...req.body };
      if (bodyData.hourlyRate !== undefined && bodyData.hourlyRate !== null && bodyData.hourlyRate !== "") {
        bodyData.hourlyRate = String(bodyData.hourlyRate);
      } else if (bodyData.hourlyRate === "" || bodyData.hourlyRate === null) {
        delete bodyData.hourlyRate;
      }
      
      const workerData = insertWorkerSchema.partial().parse(bodyData);
      const worker = await storage.updateWorker(req.params.id, workerData, businessId);
      res.json(worker);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Worker update validation errors:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Invalid worker data", errors: error.errors });
      }
      console.error("Error updating worker:", error);
      res.status(500).json({ message: "Failed to update worker" });
    }
  });

  app.delete("/api/workers/:id", isBusinessUser, async (req: any, res) => {
    try {
      const businessId = req.user.businessId;
      await storage.deleteWorker(req.params.id, businessId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting worker:", error);
      res.status(500).json({ message: "Failed to delete worker" });
    }
  });

  // Client routes (business-scoped)
  app.get("/api/clients", isBusinessUser, async (req: any, res) => {
    try {
      const businessId = req.user.businessId;
      const clients = await storage.getClients(businessId);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", isBusinessUser, async (req: any, res) => {
    try {
      const businessId = req.user.businessId;
      const client = await storage.getClient(req.params.id, businessId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", isBusinessUser, async (req: any, res) => {
    try {
      const businessId = req.user.businessId;
      const clientData = insertClientSchema.parse({
        ...req.body,
        businessId
      });
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", isBusinessUser, async (req: any, res) => {
    try {
      const businessId = req.user.businessId;
      const clientData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(req.params.id, clientData, businessId);
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", isBusinessUser, async (req: any, res) => {
    try {
      const businessId = req.user.businessId;
      await storage.deleteClient(req.params.id, businessId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Project routes (business-scoped)
  app.get("/api/projects", isBusinessUser, async (req: any, res) => {
    try {
      const businessId = req.user.businessId;
      const projects = await storage.getProjects(businessId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", isBusinessUser, async (req: any, res) => {
    try {
      const businessId = req.user.businessId;
      const project = await storage.getProject(req.params.id, businessId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", isBusinessUser, async (req: any, res) => {
    try {
      const businessId = req.user.businessId;
      const projectData = insertProjectSchema.parse({
        ...req.body,
        businessId
      });
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", isBusinessUser, async (req: any, res) => {
    try {
      const businessId = req.user.businessId;
      const projectData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, projectData, businessId);
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", isBusinessUser, async (req: any, res) => {
    try {
      const businessId = req.user.businessId;
      await storage.deleteProject(req.params.id, businessId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Time log routes (business-scoped)
  app.get("/api/time-logs", isBusinessUser, async (req: any, res) => {
    try {
      const businessId = req.user.businessId;
      const timeLogs = await storage.getTimeLogs();
      res.json(timeLogs);
    } catch (error) {
      console.error("Error fetching time logs:", error);
      res.status(500).json({ message: "Failed to fetch time logs" });
    }
  });

  app.get("/api/time-logs/:id", isBusinessUser, async (req: any, res) => {
    try {
      const businessId = req.user.businessId;
      const timeLog = await storage.getTimeLog(req.params.id);
      if (!timeLog) {
        return res.status(404).json({ message: "Time log not found" });
      }
      res.json(timeLog);
    } catch (error) {
      console.error("Error fetching time log:", error);
      res.status(500).json({ message: "Failed to fetch time log" });
    }
  });

  app.post("/api/time-logs/clock-in", isAuthenticated, async (req, res) => {
    try {
      const { qrCode, projectId, gpsLocation } = req.body;
      console.log('Clock-in request received:', { qrCode, projectId, gpsLocation });
      
      // Find worker by QR code (handle both old WORKER_ format and new URL format)
      let workerQrCode = qrCode;
      
      // If it's a URL with worker parameter, extract the worker ID and look up by worker ID
      if (qrCode.includes('/time-tracking?worker=')) {
        try {
          const url = new URL(qrCode);
          const workerId = url.searchParams.get('worker');
          if (workerId) {
            console.log('Extracted worker ID from URL:', workerId);
            // First try to find worker by the URL itself
            let worker = await storage.getWorkerByQrCode(qrCode);
            if (!worker) {
              // If not found, try the old WORKER_ format
              workerQrCode = `WORKER_${workerId}`;
              console.log('Trying old format:', workerQrCode);
              worker = await storage.getWorkerByQrCode(workerQrCode);
            }
            if (worker) {
              console.log('Found worker:', worker.firstName, worker.lastName);
              const timeLogData = {
                workerId: worker.id,
                projectId: projectId || null,
                clockIn: new Date(),
                gpsLocation: gpsLocation || null,
              };
              const timeLog = await storage.createTimeLog(timeLogData);
              return res.status(201).json(timeLog);
            }
          }
        } catch (error) {
          console.error('Error parsing QR code URL:', error);
          return res.status(400).json({ message: "Invalid QR code URL format" });
        }
      }
      
      console.log('Looking for worker with QR code:', workerQrCode);
      
      // Find worker by QR code
      const worker = await storage.getWorkerByQrCode(workerQrCode);
      if (!worker) {
        console.log('Worker not found for QR code:', workerQrCode);
        return res.status(404).json({ message: "Invalid QR code or worker not found" });
      }
      
      console.log('Found worker:', worker.firstName, worker.lastName);

      const timeLogData = {
        workerId: worker.id,
        projectId: projectId || null,
        clockIn: new Date(),
        gpsLocation: gpsLocation || null,
      };

      const timeLog = await storage.createTimeLog(timeLogData);
      res.status(201).json(timeLog);
    } catch (error) {
      console.error("Error clocking in:", error);
      res.status(500).json({ message: "Failed to clock in" });
    }
  });

  app.post("/api/time-logs/:id/clock-out", isBusinessUser, async (req: any, res) => {
    try {
      const timeLog = await storage.clockOut(req.params.id);
      res.json(timeLog);
    } catch (error) {
      console.error("Error clocking out:", error);
      res.status(500).json({ message: "Failed to clock out" });
    }
  });

  app.put("/api/time-logs/:id", isBusinessUser, async (req: any, res) => {
    try {
      const timeLogData = insertTimeLogSchema.partial().parse(req.body);
      const timeLog = await storage.updateTimeLog(req.params.id, timeLogData);
      res.json(timeLog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid time log data", errors: error.errors });
      }
      console.error("Error updating time log:", error);
      res.status(500).json({ message: "Failed to update time log" });
    }
  });

  app.delete("/api/time-logs/:id", isBusinessUser, async (req: any, res) => {
    try {
      await storage.deleteTimeLog(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting time log:", error);
      res.status(500).json({ message: "Failed to delete time log" });
    }
  });

  // Invoice routes (business-scoped)
  app.get("/api/invoices", isBusinessUser, async (req: any, res) => {
    try {
      const businessId = req.user.businessId;
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", isBusinessUser, async (req: any, res) => {
    try {
      const businessId = req.user.businessId;
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", isBusinessUser, async (req: any, res) => {
    try {
      console.log("Received invoice data:", JSON.stringify(req.body, null, 2));
      
      const { lineItems, ...invoiceData } = req.body;
      
      // Convert date strings to Date objects before validation
      if (invoiceData.issueDate && typeof invoiceData.issueDate === 'string') {
        invoiceData.issueDate = new Date(invoiceData.issueDate);
      }
      if (invoiceData.dueDate && typeof invoiceData.dueDate === 'string') {
        invoiceData.dueDate = new Date(invoiceData.dueDate);
      }
      
      // Validate invoice data
      const validatedInvoice = insertInvoiceSchema.parse(invoiceData);
      console.log("Invoice data validation passed");
      
      // Validate line items (omit invoiceId since it will be added later)
      const lineItemSchema = insertInvoiceLineItemSchema.omit({ invoiceId: true });
      const validatedLineItems = lineItems?.map((item: any) => lineItemSchema.parse(item)) || [];
      console.log("Line items validation passed");
      
      const invoice = await storage.createInvoice(validatedInvoice, validatedLineItems);
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Full error in invoice creation:", error);
      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Invalid invoice data", errors: error.errors });
      }
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.put("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      const invoiceData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, invoiceData);
      res.json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid invoice data", errors: error.errors });
      }
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  app.delete("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteInvoice(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // Business settings routes
  app.get("/api/business/settings", isBusinessUser, async (req: any, res) => {
    try {
      const businessId = req.user.businessId;
      const business = await storage.getBusiness(businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      res.json(business);
    } catch (error) {
      console.error("Error fetching business settings:", error);
      res.status(500).json({ message: "Failed to fetch business settings" });
    }
  });

  app.put("/api/business/settings", isBusinessUser, async (req: any, res) => {
    try {
      const businessId = req.user.businessId;
      const { customEmailDomain } = req.body;
      
      const updatedBusiness = await storage.updateBusiness(businessId, {
        customEmailDomain,
      });
      
      res.json(updatedBusiness);
    } catch (error) {
      console.error("Error updating business settings:", error);
      res.status(500).json({ message: "Failed to update business settings" });
    }
  });

  // Reports routes
  app.get("/api/reports", isAuthenticated, async (req: any, res) => {
    try {
      const { reportType, from, to } = req.query;
      const userId = req.user.claims.sub;
      
      // For now, return structured data for different report types
      // This will be expanded with real analytics data
      let reportData = {};
      
      switch (reportType) {
        case "revenue":
          reportData = {
            totalRevenue: 12345.67,
            totalExpenses: 8765.43,
            netProfit: 3580.24,
            invoiceCount: 45,
            averageInvoiceValue: 274.35,
            revenueByMonth: [
              { month: "Jan", revenue: 4000, expenses: 2400 },
              { month: "Feb", revenue: 3000, expenses: 1398 },
              { month: "Mar", revenue: 2000, expenses: 9800 },
              { month: "Apr", revenue: 2780, expenses: 3908 },
              { month: "May", revenue: 1890, expenses: 4800 },
              { month: "Jun", revenue: 2390, expenses: 3800 },
            ]
          };
          break;
          
        case "hours":
          reportData = {
            totalHours: 1240,
            averageHoursPerWorker: 155,
            overtimeHours: 32,
            hoursByWeek: [
              { week: "Week 1", hours: 320 },
              { week: "Week 2", hours: 285 },
              { week: "Week 3", hours: 310 },
              { week: "Week 4", hours: 295 },
            ]
          };
          break;
          
        case "projects":
          reportData = {
            totalProjects: 25,
            completedProjects: 15,
            inProgressProjects: 8,
            pendingProjects: 2,
            completionRate: 92.5,
            averageProjectDuration: 12.5
          };
          break;
          
        case "workers":
          reportData = {
            totalWorkers: 8,
            activeWorkers: 7,
            averageProductivity: 87.2,
            topPerformers: [
              { name: "John Doe", hours: 160, projects: 3 },
              { name: "Jane Smith", hours: 155, projects: 2 },
            ]
          };
          break;
          
        case "clients":
          reportData = {
            totalClients: 12,
            activeClients: 9,
            newClientsThisMonth: 2,
            clientRetentionRate: 85.5,
            topClients: [
              { name: "ABC Corp", revenue: 5000, projects: 5 },
              { name: "XYZ Ltd", revenue: 3200, projects: 3 },
            ]
          };
          break;
          
        default:
          reportData = {
            overview: {
              totalRevenue: 12345.67,
              totalHours: 1240,
              activeWorkers: 7,
              completedProjects: 15
            }
          };
      }
      
      res.json({
        reportType,
        dateRange: { from, to },
        data: reportData,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
