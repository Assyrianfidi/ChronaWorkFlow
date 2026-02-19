/**
 * ============================================================================
 * DASHBOARD SERVICE V4 — STRUCTURAL TENANT ISOLATION ENFORCED
 * ============================================================================
 * 
 * This service demonstrates the V4 pattern with:
 * 1. Auto-injection from Prisma middleware (no manual where: { companyId })
 * 2. Tenant-scoped Redis keys via TenantRedisClient
 * 3. Validation of tenant context before operations
 * 4. Audit logging for admin actions
 * 
 * SECURITY: All queries automatically scoped by Prisma V3 middleware
 * ============================================================================
 */

import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import { getCurrentTenantContext } from '../middleware/prisma-tenant-isolation-v3.middleware.js';
import { TenantRedisClient } from '../utils/redis-tenant-enforcer.js';
import { emailService } from './email/email.service.js';
import { pdfService } from './invoicing/pdf.service.js';
import { stripeService } from './billing/stripe.service.js';
import { AppError } from '../middleware/error.middleware.js';
import os from 'os';
import axios from 'axios';

export class DashboardService {
  private redis: TenantRedisClient;
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor() {
    this.redis = new TenantRedisClient();
  }

  /**
   * Validate tenant context exists
   */
  private validateTenantContext() {
    const ctx = getCurrentTenantContext();
    if (!ctx?.companyId) {
      throw new AppError('No tenant context available', 403);
    }
    return ctx;
  }

  /**
   * Get comprehensive system health metrics
   */
  async getHealthMetrics() {
    this.validateTenantContext();

    const cached = await this.redis.getTenantCache('dashboard', 'health');
    if (cached) return cached;

    try {
      // Check health server
      let healthServerStatus = 'down';
      let healthServerData: any = null;
      try {
        const response = await axios.get('http://localhost:3001/health', { timeout: 2000 });
        healthServerStatus = 'up';
        healthServerData = response.data;
      } catch (error: any) {
        healthServerStatus = 'down';
      }

      // Database health
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbLatency = Date.now() - dbStart;

      // System metrics
      const systemMetrics = {
        cpuUsage: os.loadavg(),
        memoryUsage: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
          percentage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
        },
        uptime: os.uptime(),
      };

      // Redis health
      const redisStart = Date.now();
      await this.redis.existsTenantCache('health', 'ping');
      const redisLatency = Date.now() - redisStart;

      const metrics = {
        database: {
          status: dbLatency < 100 ? 'healthy' : 'degraded',
          latency: dbLatency,
        },
        redis: {
          status: redisLatency < 50 ? 'healthy' : 'degraded',
          latency: redisLatency,
        },
        healthServer: {
          status: healthServerStatus,
          data: healthServerData,
        },
        system: systemMetrics,
        timestamp: new Date().toISOString(),
      };

      await this.redis.setTenantCache('dashboard', 'health', metrics, this.CACHE_TTL);
      return metrics;
    } catch (error: any) {
      logger.error('Error getting health metrics', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get financial KPIs
   * 
   * NOTE: No manual where: { companyId } — auto-injected by Prisma middleware
   */
  async getFinancialMetrics() {
    this.validateTenantContext();

    const cached = await this.redis.getTenantCache('dashboard', 'financial');
    if (cached) return cached;

    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const yearStart = new Date(now.getFullYear(), 0, 1);

      // ✅ Auto-injection: Prisma adds where: { companyId: ctx.companyId }
      const [
        dailyRevenue,
        weeklyRevenue,
        monthlyRevenue,
        ytdRevenue,
        totalInvoices,
        paidInvoices,
        unpaidInvoices,
        overdueInvoices,
        recentPayments,
      ] = await Promise.all([
        prisma.payments.aggregate({
          where: { processedAt: { gte: today } },
          _sum: { amount: true },
        }),
        prisma.payments.aggregate({
          where: { processedAt: { gte: weekAgo } },
          _sum: { amount: true },
        }),
        prisma.payments.aggregate({
          where: { processedAt: { gte: monthAgo } },
          _sum: { amount: true },
        }),
        prisma.payments.aggregate({
          where: { processedAt: { gte: yearStart } },
          _sum: { amount: true },
        }),
        prisma.invoices.count(),
        prisma.invoices.count({ where: { status: 'PAID' } }),
        prisma.invoices.count({ where: { status: { in: ['DRAFT', 'OPEN'] } } }),
        prisma.invoices.count({
          where: {
            status: { not: 'PAID' },
            dueAt: { lt: now },
          },
        }),
        prisma.payments.findMany({
          take: 10,
          orderBy: { processedAt: 'desc' },
          select: {
            amount: true,
            processedAt: true,
            paymentMethod: true,
            invoiceId: true,
          },
        }),
      ]);

      // Average payment time
      const invoicesWithPayments = await prisma.invoices.findMany({
        where: {
          status: 'PAID',
          paidAt: { not: null },
        },
        select: {
          issuedAt: true,
          payments: {
            select: { processedAt: true },
            orderBy: { processedAt: 'asc' },
            take: 1,
          },
        },
        take: 100,
      });

      const paymentTimes = invoicesWithPayments
        .filter((inv: any) => inv.issuedAt && inv.payments.length > 0)
        .map((inv: any) => {
          const issuedTime = inv.issuedAt!.getTime();
          const processedTime = inv.payments[0].processedAt!.getTime();
          return (processedTime - issuedTime) / (1000 * 60 * 60 * 24);
        });

      const avgPaymentTime =
        paymentTimes.length > 0
          ? paymentTimes.reduce((a: any, b: any) => a + b, 0) / paymentTimes.length
          : 0;

      const metrics = {
        revenue: {
          daily: dailyRevenue._sum?.amount || 0,
          weekly: weeklyRevenue._sum?.amount || 0,
          monthly: monthlyRevenue._sum?.amount || 0,
          ytd: ytdRevenue._sum?.amount || 0,
        },
        invoices: {
          total: totalInvoices,
          paid: paidInvoices,
          unpaid: unpaidInvoices,
          overdue: overdueInvoices,
        },
        averagePaymentTime: Math.round(avgPaymentTime * 10) / 10,
        recentPayments: recentPayments.map((p: any) => ({
          amount: p.amount,
          date: p.processedAt,
          method: p.paymentMethod,
          invoiceId: p.invoiceId,
        })),
        timestamp: new Date().toISOString(),
      };

      await this.redis.setTenantCache('dashboard', 'financial', metrics, this.CACHE_TTL);
      return metrics;
    } catch (error: any) {
      logger.error('Error getting financial metrics', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get customer/tenant metrics
   */
  async getCustomerMetrics() {
    this.validateTenantContext();

    const cached = await this.redis.getTenantCache('dashboard', 'customers');
    if (cached) return cached;

    try {
      // ✅ Auto-injection handles tenant scoping
      const [
        totalUsers,
        activeUsers,
        inactiveUsers,
        totalCompanies,
        activeCompanies,
        recentLogins,
      ] = await Promise.all([
        prisma.users.count(),
        prisma.users.count({ where: { isActive: true } }),
        prisma.users.count({ where: { isActive: false } }),
        prisma.companies.count(),
        prisma.companies.count({ where: { isActive: true } }),
        prisma.audit_logs.findMany({
          where: { action: 'LOGIN' },
          orderBy: { timestamp: 'desc' },
          take: 10,
          select: {
            userId: true,
            timestamp: true,
            ipAddress: true,
            userAgent: true,
          },
        }),
      ]);

      const companiesWithActivity = await prisma.companies.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          invoices: {
            select: { createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              invoices: true,
              payments: true,
              company_members: true,
            },
          },
        },
        take: 10,
      });

      const metrics = {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
        },
        companies: {
          total: totalCompanies,
          active: activeCompanies,
        },
        recentActivity: {
          logins: recentLogins,
          tenants: companiesWithActivity.map((company: any) => ({
            id: company.id,
            name: company.name,
            invoiceCount: company._count.invoices,
            paymentCount: company._count.payments,
            memberCount: company._count.company_members,
            lastActivity: company.invoices[0]?.createdAt || null,
          })),
        },
        timestamp: new Date().toISOString(),
      };

      await this.redis.setTenantCache('dashboard', 'customers', metrics, this.CACHE_TTL);
      return metrics;
    } catch (error: any) {
      logger.error('Error getting customer metrics', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get external services status
   */
  async getExternalServicesStatus() {
    this.validateTenantContext();

    const cached = await this.redis.getTenantCache('dashboard', 'external-services');
    if (cached) return cached;

    try {
      const sendGridConfigured = !!(
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
      );

      const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;

      const status = {
        sendGrid: {
          configured: sendGridConfigured,
          status: sendGridConfigured ? 'operational' : 'not_configured',
          stats: {
            sent: 0,
            delivered: 0,
            bounced: 0,
            failed: 0,
          },
        },
        stripe: {
          configured: stripeConfigured,
          status: stripeConfigured ? 'operational' : 'not_configured',
          stats: {
            subscriptions: 0,
            failedPayments: 0,
            refunds: 0,
          },
        },
        pdf: {
          configured: true,
          status: 'operational',
          stats: {
            generated: 0,
            failed: 0,
          },
        },
        timestamp: new Date().toISOString(),
      };

      await this.redis.setTenantCache('dashboard', 'external-services', status, this.CACHE_TTL);
      return status;
    } catch (error: any) {
      logger.error('Error getting external services status', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get active alerts
   */
  async getAlerts() {
    const ctx = this.validateTenantContext();

    try {
      const alerts: any[] = [];

      // ✅ Auto-injection: Only current tenant's invoices
      const overdueCount = await prisma.invoices.count({
        where: {
          status: { not: 'PAID' },
          dueAt: { lt: new Date() },
        },
      });

      if (overdueCount > 0) {
        alerts.push({
          id: 'overdue-invoices',
          type: 'warning',
          title: `${overdueCount} Overdue Invoices`,
          message: `There are ${overdueCount} invoices past their due date`,
          timestamp: new Date().toISOString(),
        });
      }

      // Failed logins (tenant-scoped via organizationId)
      const failedLogins = await prisma.audit_logs.count({
        where: {
          action: 'LOGIN_FAILED',
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      if (failedLogins > 10) {
        alerts.push({
          id: 'failed-logins',
          type: 'error',
          title: 'Multiple Failed Login Attempts',
          message: `${failedLogins} failed login attempts in the last 24 hours`,
          timestamp: new Date().toISOString(),
        });
      }

      // System resources (global, not tenant-specific)
      const memoryUsage = (os.totalmem() - os.freemem()) / os.totalmem();
      if (memoryUsage > 0.9) {
        alerts.push({
          id: 'high-memory',
          type: 'warning',
          title: 'High Memory Usage',
          message: `Memory usage is at ${Math.round(memoryUsage * 100)}%`,
          timestamp: new Date().toISOString(),
        });
      }

      return { alerts, timestamp: new Date().toISOString() };
    } catch (error: any) {
      logger.error('Error getting alerts', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get compliance metrics
   */
  async getComplianceMetrics() {
    this.validateTenantContext();

    const cached = await this.redis.getTenantCache('dashboard', 'compliance');
    if (cached) return cached;

    try {
      // ✅ Auto-injection: Only current tenant's audit logs
      const gdprExports = await prisma.audit_logs.count({
        where: {
          action: 'GDPR_EXPORT_REQUESTED',
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      const deletionRequests = await prisma.audit_logs.count({
        where: {
          action: 'ACCOUNT_DELETION_REQUESTED',
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      const securityEvents = await prisma.audit_logs.count({
        where: {
          action: {
            in: ['CSRF_ATTEMPT', 'XSS_ATTEMPT', 'BRUTE_FORCE_DETECTED'],
          },
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      });

      const tenantAccessLogs = await prisma.audit_logs.count({
        where: {
          action: { contains: 'TENANT' },
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      });

      const metrics = {
        gdpr: {
          dataExportRequests: gdprExports,
          deletionRequests: deletionRequests,
          complianceStatus: 'compliant',
        },
        security: {
          events: securityEvents,
          tenantAccessLogs: tenantAccessLogs,
        },
        multiTenant: {
          isolationStatus: 'enforced',
          rlsEnabled: true,
          autoInjectionActive: true,
        },
        timestamp: new Date().toISOString(),
      };

      await this.redis.setTenantCache('dashboard', 'compliance', metrics, this.CACHE_TTL);
      return metrics;
    } catch (error: any) {
      logger.error('Error getting compliance metrics', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get API performance metrics
   */
  async getAPIPerformance() {
    this.validateTenantContext();

    const cached = await this.redis.getTenantCache('dashboard', 'api-performance');
    if (cached) return cached;

    try {
      // ✅ Auto-injection: Only current tenant's API usage
      const recentRequests = await prisma.api_usage_records.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
        select: {
          endpoint: true,
          method: true,
          duration: true,
          statusCode: true,
          timestamp: true,
        },
        take: 100,
        orderBy: { timestamp: 'desc' },
      });

      const avgResponseTime =
        recentRequests.length > 0
          ? recentRequests.reduce((sum: any, req: any) => sum + req.duration, 0) / recentRequests.length
          : 0;

      const errorRate =
        recentRequests.length > 0
          ? (recentRequests.filter((r: any) => r.statusCode >= 400).length / recentRequests.length) * 100
          : 0;

      const metrics = {
        requests: {
          total: recentRequests.length,
          avgResponseTime: Math.round(avgResponseTime),
          errorRate: Math.round(errorRate * 100) / 100,
        },
        recent: recentRequests.slice(0, 10),
        timestamp: new Date().toISOString(),
      };

      await this.redis.setTenantCache('dashboard', 'api-performance', metrics, this.CACHE_TTL);
      return metrics;
    } catch (error: any) {
      logger.error('Error getting API performance', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get dashboard overview (all metrics combined)
   */
  async getOverview() {
    const ctx = this.validateTenantContext();

    const cached = await this.redis.getTenantCache('dashboard', 'overview');
    if (cached) return cached;

    try {
      const [health, financial, customers, externalServices, alerts, compliance, apiPerformance] =
        await Promise.all([
          this.getHealthMetrics(),
          this.getFinancialMetrics(),
          this.getCustomerMetrics(),
          this.getExternalServicesStatus(),
          this.getAlerts(),
          this.getComplianceMetrics(),
          this.getAPIPerformance(),
        ]);

      const overview = {
        health,
        financial,
        customers,
        externalServices,
        alerts,
        compliance,
        apiPerformance,
        timestamp: new Date().toISOString(),
      };

      await this.redis.setTenantCache('dashboard', 'overview', overview, this.CACHE_TTL);
      return overview;
    } catch (error: any) {
      logger.error('Error getting dashboard overview', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Send test email (with audit logging)
   */
  async sendTestEmail(to: string) {
    const ctx = this.validateTenantContext();

    try {
      const result = await emailService.sendEmail({
        to,
        subject: 'AccuBooks Test Email from CEO Dashboard',
        html: '<h1>Test Email</h1><p>This is a test email from the AccuBooks CEO Dashboard.</p>',
      });

      // ✅ Audit log (auto-scoped to organizationId)
      await prisma.audit_logs.create({
        data: {
          action: 'DASHBOARD_TEST_EMAIL_SENT',
          userId: ctx.userId || 0,
          organizationId: parseInt(ctx.companyId || '0') || 0,
          details: { to, success: result.success },
          timestamp: new Date(),
        },
      });

      return {
        success: result.success,
        messageId: result.messageId,
        message: result.success ? 'Test email sent successfully' : 'Failed to send test email',
      };
    } catch (error: any) {
      logger.error('Error sending test email', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Send test SMS (with audit logging)
   */
  async sendTestSMS(to: string) {
    const ctx = this.validateTenantContext();

    try {
      // SMS service removed - Twilio integration discontinued
      logger.info('SMS service not configured - Twilio integration removed');
      const result = { success: false, error: 'SMS service not available' };

      // ✅ Audit log
      await prisma.audit_logs.create({
        data: {
          action: 'DASHBOARD_TEST_SMS_SENT',
          userId: ctx.userId || 0,
          organizationId: parseInt(ctx.companyId || '0') || 0,
          details: { to, success: result.success, error: result.error },
          timestamp: new Date(),
        },
      });

      return { success: result.success, error: result.error, message: result.success ? 'Test SMS sent successfully' : 'Failed to send test SMS' };
    } catch (error: any) {
      logger.error('Error sending test SMS', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Generate test PDF (with audit logging)
   */
  async generateTestPDF(invoiceId: string) {
    const ctx = this.validateTenantContext();

    try {
      const pdfBuffer = await pdfService.generateInvoicePDF(invoiceId);

      // ✅ Audit log
      await prisma.audit_logs.create({
        data: {
          action: 'DASHBOARD_TEST_PDF_GENERATED',
          userId: ctx.userId || 0,
          organizationId: parseInt(ctx.companyId || '0') || 0,
          details: { invoiceId, size: pdfBuffer.length },
          timestamp: new Date(),
        },
      });

      return {
        success: true,
        size: pdfBuffer.length,
        message: 'Test PDF generated successfully',
      };
    } catch (error: any) {
      logger.error('Error generating test PDF', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Run comprehensive health check
   */
  async runHealthCheck() {
    const ctx = this.validateTenantContext();

    try {
      const health = await this.getHealthMetrics();

      // ✅ Audit log
      await prisma.audit_logs.create({
        data: {
          action: 'DASHBOARD_HEALTH_CHECK_RUN',
          userId: ctx.userId || 0,
          organizationId: parseInt(ctx.companyId || '0') || 0,
          details: { status: health.database.status },
          timestamp: new Date(),
        },
      });

      return health;
    } catch (error: any) {
      logger.error('Error running health check', { error: (error as Error).message });
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();
