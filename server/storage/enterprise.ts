import { z } from "zod";
import {
  projects, projectTimeEntries, budgets, budgetCategories,
  mileageEntries, vehicles, currencies, exchangeRates,
  multiCurrencyTransactions, ecommerceIntegrations, ecommerceOrders,
  workflows, workflowExecutions, customReports, reportSchedules,
  backupJobs, auditLogs
} from "../../shared/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";

// Enterprise Feature Storage Implementation
export class EnterpriseStorage {
  constructor(private db: any) {}

  // ==================== PROJECTS ====================

  async getProjectsByCompany(companyId: string) {
    return await this.db.select().from(projects)
      .where(eq(projects.companyId, companyId))
      .orderBy(desc(projects.createdAt));
  }

  async getProjectWithTimeEntries(projectId: string) {
    const [project] = await this.db.select().from(projects)
      .where(eq(projects.id, projectId));

    if (!project) return null;

    const timeEntries = await this.db.select().from(projectTimeEntries)
      .where(eq(projectTimeEntries.projectId, projectId))
      .orderBy(desc(projectTimeEntries.date));

    return { ...project, timeEntries };
  }

  async createProject(data: any) {
    return await this.db.insert(projects).values(data).returning();
  }

  async updateProject(projectId: string, data: any) {
    return await this.db.update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, projectId))
      .returning();
  }

  // ==================== PROJECT TIME ENTRIES ====================

  async getProjectTimeEntriesByProject(projectId: string) {
    return await this.db.select().from(projectTimeEntries)
      .where(eq(projectTimeEntries.projectId, projectId))
      .orderBy(desc(projectTimeEntries.date));
  }

  async createProjectTimeEntry(data: any) {
    return await this.db.insert(projectTimeEntries).values(data).returning();
  }

  async updateProjectTimeEntry(entryId: string, data: any) {
    return await this.db.update(projectTimeEntries)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projectTimeEntries.id, entryId))
      .returning();
  }

  // ==================== BUDGETS ====================

  async getBudgetsByCompany(companyId: string) {
    return await this.db.select().from(budgets)
      .where(eq(budgets.companyId, companyId))
      .orderBy(desc(budgets.createdAt));
  }

  async getBudgetWithCategories(budgetId: string) {
    const [budget] = await this.db.select().from(budgets)
      .where(eq(budgets.id, budgetId));

    if (!budget) return null;

    const categories = await this.db.select().from(budgetCategories)
      .where(eq(budgetCategories.budgetId, budgetId));

    return { ...budget, categories };
  }

  async createBudget(data: any) {
    return await this.db.insert(budgets).values(data).returning();
  }

  async createBudgetCategory(data: any) {
    return await this.db.insert(budgetCategories).values(data).returning();
  }

  // ==================== MILEAGE TRACKING ====================

  async getMileageEntriesByCompany(companyId: string) {
    return await this.db.select().from(mileageEntries)
      .where(eq(mileageEntries.companyId, companyId))
      .orderBy(desc(mileageEntries.date));
  }

  async getMileageEntriesByEmployee(employeeId: string) {
    return await this.db.select().from(mileageEntries)
      .where(eq(mileageEntries.employeeId, employeeId))
      .orderBy(desc(mileageEntries.date));
  }

  async createMileageEntry(data: any) {
    return await this.db.insert(mileageEntries).values(data).returning();
  }

  async approveMileageEntry(entryId: string, approvedBy: string) {
    return await this.db.update(mileageEntries)
      .set({
        isApproved: true,
        approvedBy,
        approvedAt: new Date()
      })
      .where(eq(mileageEntries.id, entryId))
      .returning();
  }

  // ==================== VEHICLES ====================

  async getVehiclesByCompany(companyId: string) {
    return await this.db.select().from(vehicles)
      .where(eq(vehicles.companyId, companyId))
      .orderBy(asc(vehicles.year));
  }

  async createVehicle(data: any) {
    return await this.db.insert(vehicles).values(data).returning();
  }

  async updateVehicle(vehicleId: string, data: any) {
    return await this.db.update(vehicles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(vehicles.id, vehicleId))
      .returning();
  }

  // ==================== MULTI-CURRENCY ====================

  async getCurrencies() {
    return await this.db.select().from(currencies)
      .where(eq(currencies.isActive, true))
      .orderBy(asc(currencies.name));
  }

  async getExchangeRates(fromCurrency: string, toCurrency: string) {
    return await this.db.select().from(exchangeRates)
      .where(and(
        eq(exchangeRates.fromCurrency, fromCurrency),
        eq(exchangeRates.toCurrency, toCurrency)
      ))
      .orderBy(desc(exchangeRates.effectiveDate))
      .limit(1);
  }

  async createMultiCurrencyTransaction(data: any) {
    return await this.db.insert(multiCurrencyTransactions).values(data).returning();
  }

  // ==================== E-COMMERCE INTEGRATIONS ====================

  async getEcommerceIntegrationsByCompany(companyId: string) {
    return await this.db.select().from(ecommerceIntegrations)
      .where(eq(ecommerceIntegrations.companyId, companyId))
      .orderBy(desc(ecommerceIntegrations.createdAt));
  }

  async createEcommerceIntegration(data: any) {
    return await this.db.insert(ecommerceIntegrations).values(data).returning();
  }

  async getEcommerceOrdersByIntegration(integrationId: string) {
    return await this.db.select().from(ecommerceOrders)
      .where(eq(ecommerceOrders.integrationId, integrationId))
      .orderBy(desc(ecommerceOrders.orderDate));
  }

  async createEcommerceOrder(data: any) {
    return await this.db.insert(ecommerceOrders).values(data).returning();
  }

  // ==================== WORKFLOWS ====================

  async getWorkflowsByCompany(companyId: string) {
    return await this.db.select().from(workflows)
      .where(eq(workflows.companyId, companyId))
      .orderBy(desc(workflows.createdAt));
  }

  async createWorkflow(data: any) {
    return await this.db.insert(workflows).values(data).returning();
  }

  async executeWorkflow(workflowId: string, triggerData: any) {
    // Create execution record
    const execution = await this.db.insert(workflowExecutions)
      .values({
        workflowId,
        triggerEntityType: triggerData.entityType,
        triggerEntityId: triggerData.entityId,
        status: 'running',
        startedAt: new Date()
      })
      .returning();

    // TODO: Implement workflow execution logic
    // This would involve parsing workflow actions and executing them

    // Update execution as completed
    await this.db.update(workflowExecutions)
      .set({
        status: 'completed',
        completedAt: new Date(),
        result: JSON.stringify({ success: true })
      })
      .where(eq(workflowExecutions.id, execution[0].id));

    return execution[0];
  }

  // ==================== CUSTOM REPORTS ====================

  async getCustomReportsByCompany(companyId: string) {
    return await this.db.select().from(customReports)
      .where(eq(customReports.companyId, companyId))
      .orderBy(desc(customReports.createdAt));
  }

  async createCustomReport(data: any) {
    return await this.db.insert(customReports).values(data).returning();
  }

  async createReportSchedule(data: any) {
    return await this.db.insert(reportSchedules).values(data).returning();
  }

  // ==================== BACKUP JOBS ====================

  async getBackupJobsByCompany(companyId: string) {
    return await this.db.select().from(backupJobs)
      .where(eq(backupJobs.companyId, companyId))
      .orderBy(desc(backupJobs.createdAt));
  }

  async createBackupJob(data: any) {
    return await this.db.insert(backupJobs).values(data).returning();
  }

  // ==================== AUDIT LOGS ====================

  async createAuditLog(data: any) {
    return await this.db.insert(auditLogs).values(data).returning();
  }

  async getAuditLogsByCompany(companyId: string, limit = 100) {
    return await this.db.select().from(auditLogs)
      .where(eq(auditLogs.companyId, companyId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  // ==================== DASHBOARD DATA ====================

  async getProjectProfitabilityData(companyId: string) {
    // Get projects with time entries and invoices
    const projectsData = await this.db.select({
      id: projects.id,
      name: projects.name,
      budget: projects.budget,
      hourlyRate: projects.hourlyRate,
      status: projects.status,
      timeEntryCount: sql`COUNT(${projectTimeEntries.id})`,
      totalHours: sql`COALESCE(SUM(${projectTimeEntries.hours}), 0)`,
      totalRevenue: sql`COALESCE(SUM(${projectTimeEntries.hours} * ${projectTimeEntries.hourlyRate}), 0)`
    })
    .from(projects)
    .leftJoin(projectTimeEntries, eq(projects.id, projectTimeEntries.projectId))
    .where(eq(projects.companyId, companyId))
    .groupBy(projects.id)
    .orderBy(desc(projects.createdAt));

    return projectsData;
  }

  async getBudgetVsActualData(companyId: string) {
    // Get budgets with actual spending from accounts
    const budgetData = await this.db.select({
      id: budgets.id,
      name: budgets.name,
      totalBudget: budgets.totalBudget,
      spent: budgets.spent,
      remaining: budgets.remaining,
      status: budgets.status,
      categories: sql`(
        SELECT json_agg(
          json_build_object(
            'id', ${budgetCategories.id},
            'categoryName', ${budgetCategories.categoryName},
            'budgetedAmount', ${budgetCategories.budgetedAmount},
            'spentAmount', ${budgetCategories.spentAmount}
          )
        )
        FROM ${budgetCategories}
        WHERE ${budgetCategories.budgetId} = ${budgets.id}
      )`
    })
    .from(budgets)
    .where(eq(budgets.companyId, companyId))
    .orderBy(desc(budgets.createdAt));

    return budgetData;
  }

  async getMileageReimbursementData(companyId: string, year?: number) {
    const currentYear = year || new Date().getFullYear();

    const mileageData = await this.db.select({
      employeeId: mileageEntries.employeeId,
      totalMiles: sql`SUM(${mileageEntries.totalMiles})`,
      totalReimbursement: sql`SUM(${mileageEntries.reimbursementAmount})`,
      purposeBreakdown: sql`json_object_agg(${mileageEntries.purpose}, COUNT(*))`
    })
    .from(mileageEntries)
    .where(and(
      eq(mileageEntries.companyId, companyId),
      eq(mileageEntries.isApproved, true),
      sql`${mileageEntries.date} >= ${currentYear}-01-01`,
      sql`${mileageEntries.date} <= ${currentYear}-12-31`
    ))
    .groupBy(mileageEntries.employeeId);

    return mileageData;
  }
}
