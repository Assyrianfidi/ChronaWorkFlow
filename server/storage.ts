import {
  users,
  workers,
  clients,
  projects,
  timeLogs,
  invoices,
  invoiceLineItems,
  projectAssignments,
  type User,
  type UpsertUser,
  type Worker,
  type InsertWorker,
  type Client,
  type InsertClient,
  type Project,
  type InsertProject,
  type TimeLog,
  type InsertTimeLog,
  type Invoice,
  type InsertInvoice,
  type InvoiceLineItem,
  type InsertInvoiceLineItem,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Worker operations
  getWorkers(): Promise<Worker[]>;
  getWorker(id: string): Promise<Worker | undefined>;
  getWorkerByQrCode(qrCode: string): Promise<Worker | undefined>;
  createWorker(worker: InsertWorker): Promise<Worker>;
  updateWorker(id: string, worker: Partial<InsertWorker>): Promise<Worker>;
  deleteWorker(id: string): Promise<void>;
  
  // Client operations
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: string): Promise<void>;
  
  // Project operations
  getProjects(): Promise<any[]>;
  getProject(id: string): Promise<any | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  assignWorkerToProject(projectId: string, workerId: string): Promise<void>;
  unassignWorkerFromProject(projectId: string, workerId: string): Promise<void>;
  
  // Time log operations
  getTimeLogs(): Promise<any[]>;
  getTimeLog(id: string): Promise<any | undefined>;
  getTimeLogsByWorker(workerId: string): Promise<any[]>;
  getTimeLogsByProject(projectId: string): Promise<any[]>;
  createTimeLog(timeLog: InsertTimeLog): Promise<TimeLog>;
  clockOut(timeLogId: string): Promise<TimeLog>;
  updateTimeLog(id: string, timeLog: Partial<InsertTimeLog>): Promise<TimeLog>;
  deleteTimeLog(id: string): Promise<void>;
  
  // Invoice operations
  getInvoices(): Promise<any[]>;
  getInvoice(id: string): Promise<any | undefined>;
  createInvoice(invoice: InsertInvoice, lineItems: InsertInvoiceLineItem[]): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  deleteInvoice(id: string): Promise<void>;
  addInvoiceLineItem(lineItem: InsertInvoiceLineItem): Promise<InvoiceLineItem>;
  updateInvoiceLineItem(id: string, lineItem: Partial<InsertInvoiceLineItem>): Promise<InvoiceLineItem>;
  deleteInvoiceLineItem(id: string): Promise<void>;
  
  // Dashboard data
  getDashboardStats(): Promise<any>;
  getRecentTimeLogs(limit?: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Worker operations
  async getWorkers(): Promise<Worker[]> {
    return await db.select().from(workers).orderBy(desc(workers.createdAt));
  }

  async getWorker(id: string): Promise<Worker | undefined> {
    const [worker] = await db.select().from(workers).where(eq(workers.id, id));
    return worker;
  }

  async getWorkerByQrCode(qrCode: string): Promise<Worker | undefined> {
    const [worker] = await db.select().from(workers).where(eq(workers.qrCode, qrCode));
    return worker;
  }

  async createWorker(workerData: InsertWorker): Promise<Worker> {
    // Generate QR code as URL that points to time tracking page with worker ID
    const workerId = randomUUID();
    
    // Use proper domain URL - check for Replit domain first, then localhost
    let baseUrl = 'http://localhost:5000';
    if (process.env.REPLIT_DOMAINS) {
      // Use the first domain from REPLIT_DOMAINS
      const domains = process.env.REPLIT_DOMAINS.split(',');
      baseUrl = `https://${domains[0].trim()}`;
    }
    
    const qrCode = `${baseUrl}/time-tracking?worker=${workerId}`;
    console.log('Generated QR code URL:', qrCode);
    
    const [worker] = await db
      .insert(workers)
      .values({ ...workerData, id: workerId, qrCode })
      .returning();
    return worker;
  }

  async updateWorker(id: string, workerData: Partial<InsertWorker>): Promise<Worker> {
    const [worker] = await db
      .update(workers)
      .set({ ...workerData, updatedAt: new Date() })
      .where(eq(workers.id, id))
      .returning();
    return worker;
  }

  async deleteWorker(id: string): Promise<void> {
    await db.delete(workers).where(eq(workers.id, id));
  }

  // Client operations
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(clientData: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(clientData)
      .returning();
    return client;
  }

  async updateClient(id: string, clientData: Partial<InsertClient>): Promise<Client> {
    const [client] = await db
      .update(clients)
      .set({ ...clientData, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return client;
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  // Project operations
  async getProjects(): Promise<any[]> {
    return await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        startDate: projects.startDate,
        dueDate: projects.dueDate,
        budget: projects.budget,
        createdAt: projects.createdAt,
        client: {
          id: clients.id,
          name: clients.name,
          email: clients.email,
        },
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .orderBy(desc(projects.createdAt));
  }

  async getProject(id: string): Promise<any | undefined> {
    const [project] = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        startDate: projects.startDate,
        dueDate: projects.dueDate,
        budget: projects.budget,
        notes: projects.notes,
        createdAt: projects.createdAt,
        client: {
          id: clients.id,
          name: clients.name,
          email: clients.email,
        },
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(eq(projects.id, id));
    return project;
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(projectData)
      .returning();
    return project;
  }

  async updateProject(id: string, projectData: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...projectData, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async assignWorkerToProject(projectId: string, workerId: string): Promise<void> {
    await db.insert(projectAssignments).values({
      projectId,
      workerId,
    });
  }

  async unassignWorkerFromProject(projectId: string, workerId: string): Promise<void> {
    await db
      .delete(projectAssignments)
      .where(
        and(
          eq(projectAssignments.projectId, projectId),
          eq(projectAssignments.workerId, workerId)
        )
      );
  }

  // Time log operations
  async getTimeLogs(): Promise<any[]> {
    return await db
      .select({
        id: timeLogs.id,
        clockIn: timeLogs.clockIn,
        clockOut: timeLogs.clockOut,
        totalHours: timeLogs.totalHours,
        notes: timeLogs.notes,
        isApproved: timeLogs.isApproved,
        createdAt: timeLogs.createdAt,
        worker: {
          id: workers.id,
          firstName: workers.firstName,
          lastName: workers.lastName,
          email: workers.email,
        },
        project: {
          id: projects.id,
          name: projects.name,
        },
      })
      .from(timeLogs)
      .leftJoin(workers, eq(timeLogs.workerId, workers.id))
      .leftJoin(projects, eq(timeLogs.projectId, projects.id))
      .orderBy(desc(timeLogs.createdAt));
  }

  async getTimeLog(id: string): Promise<any | undefined> {
    const [timeLog] = await db
      .select({
        id: timeLogs.id,
        clockIn: timeLogs.clockIn,
        clockOut: timeLogs.clockOut,
        totalHours: timeLogs.totalHours,
        notes: timeLogs.notes,
        isApproved: timeLogs.isApproved,
        createdAt: timeLogs.createdAt,
        worker: {
          id: workers.id,
          firstName: workers.firstName,
          lastName: workers.lastName,
        },
        project: {
          id: projects.id,
          name: projects.name,
        },
      })
      .from(timeLogs)
      .leftJoin(workers, eq(timeLogs.workerId, workers.id))
      .leftJoin(projects, eq(timeLogs.projectId, projects.id))
      .where(eq(timeLogs.id, id));
    return timeLog;
  }

  async getTimeLogsByWorker(workerId: string): Promise<any[]> {
    return await db
      .select()
      .from(timeLogs)
      .where(eq(timeLogs.workerId, workerId))
      .orderBy(desc(timeLogs.createdAt));
  }

  async getTimeLogsByProject(projectId: string): Promise<any[]> {
    return await db
      .select()
      .from(timeLogs)
      .where(eq(timeLogs.projectId, projectId))
      .orderBy(desc(timeLogs.createdAt));
  }

  async createTimeLog(timeLogData: InsertTimeLog): Promise<TimeLog> {
    const [timeLog] = await db
      .insert(timeLogs)
      .values(timeLogData)
      .returning();
    return timeLog;
  }

  async clockOut(timeLogId: string): Promise<TimeLog> {
    const clockOutTime = new Date();
    
    // Get the time log to calculate hours
    const [timeLog] = await db
      .select()
      .from(timeLogs)
      .where(eq(timeLogs.id, timeLogId));
    
    if (!timeLog) {
      throw new Error("Time log not found");
    }
    
    const totalHours = (clockOutTime.getTime() - timeLog.clockIn.getTime()) / (1000 * 60 * 60);
    
    const [updatedLog] = await db
      .update(timeLogs)
      .set({
        clockOut: clockOutTime,
        totalHours: totalHours.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(timeLogs.id, timeLogId))
      .returning();
    
    return updatedLog;
  }

  async updateTimeLog(id: string, timeLogData: Partial<InsertTimeLog>): Promise<TimeLog> {
    const [timeLog] = await db
      .update(timeLogs)
      .set({ ...timeLogData, updatedAt: new Date() })
      .where(eq(timeLogs.id, id))
      .returning();
    return timeLog;
  }

  async deleteTimeLog(id: string): Promise<void> {
    await db.delete(timeLogs).where(eq(timeLogs.id, id));
  }

  // Invoice operations
  async getInvoices(): Promise<any[]> {
    const invoicesList = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        status: invoices.status,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        subtotal: invoices.subtotal,
        taxRate: invoices.taxRate,
        taxAmount: invoices.taxAmount,
        discountAmount: invoices.discountAmount,
        total: invoices.total,
        notes: invoices.notes,
        createdAt: invoices.createdAt,
        client: {
          id: clients.id,
          name: clients.name,
          email: clients.email,
          address: clients.address,
        },
        project: {
          id: projects.id,
          name: projects.name,
        },
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .leftJoin(projects, eq(invoices.projectId, projects.id))
      .orderBy(desc(invoices.createdAt));

    // Fetch line items for each invoice
    const invoicesWithLineItems = await Promise.all(
      invoicesList.map(async (invoice) => {
        const lineItems = await db
          .select()
          .from(invoiceLineItems)
          .where(eq(invoiceLineItems.invoiceId, invoice.id))
          .orderBy(invoiceLineItems.sortOrder);
        
        return { ...invoice, lineItems };
      })
    );
    return invoicesWithLineItems;
  }

  async getInvoice(id: string): Promise<any | undefined> {
    const [invoice] = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        status: invoices.status,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        subtotal: invoices.subtotal,
        taxRate: invoices.taxRate,
        taxAmount: invoices.taxAmount,
        discountAmount: invoices.discountAmount,
        total: invoices.total,
        notes: invoices.notes,
        createdAt: invoices.createdAt,
        client: {
          id: clients.id,
          name: clients.name,
          email: clients.email,
          address: clients.address,
        },
        project: {
          id: projects.id,
          name: projects.name,
        },
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .leftJoin(projects, eq(invoices.projectId, projects.id))
      .where(eq(invoices.id, id));

    if (invoice) {
      const lineItems = await db
        .select()
        .from(invoiceLineItems)
        .where(eq(invoiceLineItems.invoiceId, id))
        .orderBy(invoiceLineItems.sortOrder);
      
      return { ...invoice, lineItems };
    }
    
    return invoice;
  }

  async createInvoice(invoiceData: InsertInvoice, lineItems: InsertInvoiceLineItem[]): Promise<Invoice> {
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;
    
    const [invoice] = await db
      .insert(invoices)
      .values({ ...invoiceData, invoiceNumber })
      .returning();

    // Add line items
    if (lineItems.length > 0) {
      await db
        .insert(invoiceLineItems)
        .values(lineItems.map(item => ({ ...item, invoiceId: invoice.id })));
    }

    return invoice;
  }

  async updateInvoice(id: string, invoiceData: Partial<InsertInvoice>): Promise<Invoice> {
    const [invoice] = await db
      .update(invoices)
      .set({ ...invoiceData, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return invoice;
  }

  async deleteInvoice(id: string): Promise<void> {
    await db.delete(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, id));
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  async addInvoiceLineItem(lineItemData: InsertInvoiceLineItem): Promise<InvoiceLineItem> {
    const [lineItem] = await db
      .insert(invoiceLineItems)
      .values(lineItemData)
      .returning();
    return lineItem;
  }

  async updateInvoiceLineItem(id: string, lineItemData: Partial<InsertInvoiceLineItem>): Promise<InvoiceLineItem> {
    const [lineItem] = await db
      .update(invoiceLineItems)
      .set(lineItemData)
      .where(eq(invoiceLineItems.id, id))
      .returning();
    return lineItem;
  }

  async deleteInvoiceLineItem(id: string): Promise<void> {
    await db.delete(invoiceLineItems).where(eq(invoiceLineItems.id, id));
  }

  // Dashboard data
  async getDashboardStats(): Promise<any> {
    const [workerCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(workers)
      .where(eq(workers.isActive, true));

    const [projectCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.status, "in_progress"));

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [weeklyHours] = await db
      .select({ totalHours: sql<number>`sum(cast(total_hours as decimal))` })
      .from(timeLogs)
      .where(gte(timeLogs.clockIn, startOfWeek));

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [monthlyRevenue] = await db
      .select({ totalRevenue: sql<number>`sum(cast(total as decimal))` })
      .from(invoices)
      .where(
        and(
          gte(invoices.issueDate, startOfMonth),
          eq(invoices.status, "paid")
        )
      );

    return {
      totalWorkers: workerCount.count || 0,
      activeProjects: projectCount.count || 0,
      weeklyHours: weeklyHours.totalHours || 0,
      monthlyRevenue: monthlyRevenue.totalRevenue || 0,
    };
  }

  async getRecentTimeLogs(limit: number = 5): Promise<any[]> {
    return await db
      .select({
        id: timeLogs.id,
        clockIn: timeLogs.clockIn,
        clockOut: timeLogs.clockOut,
        totalHours: timeLogs.totalHours,
        worker: {
          id: workers.id,
          firstName: workers.firstName,
          lastName: workers.lastName,
        },
        project: {
          id: projects.id,
          name: projects.name,
        },
      })
      .from(timeLogs)
      .leftJoin(workers, eq(timeLogs.workerId, workers.id))
      .leftJoin(projects, eq(timeLogs.projectId, projects.id))
      .orderBy(desc(timeLogs.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
