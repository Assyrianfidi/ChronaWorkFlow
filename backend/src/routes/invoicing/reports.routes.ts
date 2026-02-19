import { Router } from "express";
import { Request, Response } from "express";
import { query, validationResult } from "express-validator";
import { InvoiceStatus } from "@prisma/client";
import { prisma } from "../../utils/prisma.js";
import { auth, authorizeRoles } from "../../middleware/auth.js";
import { ROLES } from "../../constants/roles.js";

const router = Router();

// Apply authentication to all routes
router.use(auth);

// GET /api/reports/ar-aging - Accounts Receivable Aging Report
router.get(
  "/ar-aging",
  authorizeRoles([ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.MANAGER]),
  [
    query("date")
      .optional()
      .isISO8601()
      .withMessage("Date must be a valid date"),
    query("customerId").optional().isUUID().withMessage("Invalid customer ID"),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const reportDate = req.query.date
        ? new Date(req.query.date as string)
        : new Date();
      const { customerId } = req.query;

      // Get outstanding invoices
      const whereClause: any = {
        status: {
          in: [InvoiceStatus.OPEN, InvoiceStatus.OPEN],
        },
        dueAt: {
          lt: reportDate,
        },
      };

      if (customerId) {
        whereClause.clientId = customerId;
      }

      const outstandingInvoices = await prisma.invoices.findMany({
        where: whereClause,
        orderBy: { dueAt: "asc" },
      });

      const payments = await prisma.payments.findMany({
        where: {
          invoiceId: { in: outstandingInvoices.map((i: any) => i.id) },
        },
        select: { invoiceId: true, amount: true },
      });

      const paidByInvoiceId = new Map<string, number>();
      for (const p of payments) {
        const amt = (p.amount as any)?.toNumber ? (p.amount as any).toNumber() : Number(p.amount);
        paidByInvoiceId.set(p.invoiceId, (paidByInvoiceId.get(p.invoiceId) ?? 0) + amt);
      }

      // Calculate aging buckets
      type AgingInvoiceInfo = {
        id: string;
        invoiceNumber: string;
        customerName: string;
        customerEmail: string | null | undefined;
        issueDate: Date;
        dueAt: Date;
        daysOverdue: number;
        totalAmount: number;
        amountPaid: number;
        balanceDue: number;
      };

      type AgingBucket = {
        total: number;
        count: number;
        invoices: AgingInvoiceInfo[];
      };

      const agingBuckets: {
        current: AgingBucket;
        days1_30: AgingBucket;
        days31_60: AgingBucket;
        days61_90: AgingBucket;
        days90_plus: AgingBucket;
      } = {
        current: { total: 0, count: 0, invoices: [] },
        days1_30: { total: 0, count: 0, invoices: [] },
        days31_60: { total: 0, count: 0, invoices: [] },
        days61_90: { total: 0, count: 0, invoices: [] },
        days90_plus: { total: 0, count: 0, invoices: [] },
      };

      for (const invoice of outstandingInvoices) {
        const totalPaid = paidByInvoiceId.get(invoice.id) ?? 0;
        const invoiceTotal = (invoice.amount as any)?.toNumber
          ? (invoice.amount as any).toNumber()
          : Number(invoice.amount);
        const balanceDue = invoiceTotal - totalPaid;

        if (balanceDue <= 0) continue;

        const daysOverdue = Math.floor(
          (reportDate.getTime() - new Date(invoice.dueAt).getTime()) /
            (1000 * 60 * 60 * 24),
        );

        const invoiceInfo = {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          customerName: "Unknown",
          customerEmail: null,
          issueDate: invoice.issuedAt,
          dueAt: invoice.dueAt,
          daysOverdue,
          totalAmount: invoiceTotal,
          amountPaid: totalPaid,
          balanceDue,
        };

        if (daysOverdue <= 0) {
          agingBuckets.current.total += balanceDue;
          agingBuckets.current.count += 1;
          agingBuckets.current.invoices.push(invoiceInfo);
        } else if (daysOverdue <= 30) {
          agingBuckets.days1_30.total += balanceDue;
          agingBuckets.days1_30.count += 1;
          agingBuckets.days1_30.invoices.push(invoiceInfo);
        } else if (daysOverdue <= 60) {
          agingBuckets.days31_60.total += balanceDue;
          agingBuckets.days31_60.count += 1;
          agingBuckets.days31_60.invoices.push(invoiceInfo);
        } else if (daysOverdue <= 90) {
          agingBuckets.days61_90.total += balanceDue;
          agingBuckets.days61_90.count += 1;
          agingBuckets.days61_90.invoices.push(invoiceInfo);
        } else {
          agingBuckets.days90_plus.total += balanceDue;
          agingBuckets.days90_plus.count += 1;
          agingBuckets.days90_plus.invoices.push(invoiceInfo);
        }
      }

      const totalOutstanding = Object.values(agingBuckets).reduce(
        (sum, bucket) => sum + bucket.total,
        0,
      );

      const report = {
        reportDate,
        totalOutstanding,
        totalInvoices: Object.values(agingBuckets).reduce(
          (sum, bucket) => sum + bucket.count,
          0,
        ),
        buckets: agingBuckets,
        summary: {
          currentPercentage:
            totalOutstanding > 0
              ? (agingBuckets.current.total / totalOutstanding) * 100
              : 0,
          overduePercentage:
            totalOutstanding > 0
              ? ((totalOutstanding - agingBuckets.current.total) /
                  totalOutstanding) *
                100
              : 0,
          criticalOverdue:
            agingBuckets.days61_90.total + agingBuckets.days90_plus.total,
        },
      };

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error("Error generating AR aging report:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// GET GET /api/reports/sales-summary - Sales Summary Report
router.get(
  "/sales-summary",
  authorizeRoles([ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.MANAGER]),
  [
    query("dateFrom")
      .optional()
      .isISO8601()
      .withMessage("Date from must be a valid date"),
    query("dateTo")
      .optional()
      .isISO8601()
      .withMessage("Date to must be a valid date"),
    query("customerId").optional().isUUID().withMessage("Invalid customer ID"),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { dateFrom, dateTo, customerId } = req.query;

      const whereClause: any = {};

      if (dateFrom || dateTo) {
        whereClause.date = {};
        if (dateFrom) whereClause.date.gte = new Date(dateFrom as string);
        if (dateTo) whereClause.date.lte = new Date(dateTo as string);
      }

      if (customerId) {
        whereClause.clientId = customerId;
      }

      const invoices = await prisma.invoices.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
      });

      const payments = await prisma.payments.findMany({
        where: {
          invoiceId: { in: invoices.map((i: any) => i.id) },
        },
        select: { invoiceId: true, amount: true },
      });

      const paidByInvoiceId = new Map<string, number>();
      for (const p of payments) {
        const amt = (p.amount as any)?.toNumber ? (p.amount as any).toNumber() : Number(p.amount);
        paidByInvoiceId.set(p.invoiceId, (paidByInvoiceId.get(p.invoiceId) ?? 0) + amt);
      }

      const summary = await prisma.invoices.groupBy({
        by: ["status"],
        where: whereClause,
        _count: { id: true },
        _sum: {
          amount: true,
        },
      });
      // Calculate totals
      const totalInvoices = invoices.length;
      const totalRevenue = invoices.reduce((sum: any, inv: any) => {
        const amt = (inv.amount as any)?.toNumber ? (inv.amount as any).toNumber() : Number(inv.amount);
        return sum + amt;
      }, 0);
      const totalTax = 0;
      const totalPaid = invoices.reduce(
        (sum: number, inv: any) => sum + (paidByInvoiceId.get(inv.id) ?? 0),
        0,
      );
      const totalOutstanding = totalRevenue - totalPaid;

      // Top customers by revenue
      const customerRevenue = invoices.reduce((acc: any, invoice: any) => {
        const customerKey = invoice.clientId ?? "unknown";
        if (!acc[customerKey]) {
          acc[customerKey] = {
            customerId: invoice.clientId,
            customerName:
              invoice.client?.name || "Client",
            revenue: 0,
            invoiceCount: 0,
          };
        }
        const amt = (invoice.amount as any)?.toNumber
          ? (invoice.amount as any).toNumber()
          : Number(invoice.amount);
        acc[customerKey].revenue += amt;
        acc[customerKey].invoiceCount += 1;
        return acc;
      }, {});

      const topCustomers = Object.values(customerRevenue)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 10);

      const report = {
        period: {
          from: dateFrom || null,
          to: dateTo || null,
        },
        summary: {
          totalInvoices,
          totalRevenue,
          totalTax,
          totalPaid,
          totalOutstanding,
          averageInvoiceValue:
            totalInvoices > 0 ? totalRevenue / totalInvoices : 0,
        },
        statusBreakdown: summary.map((item: any) => ({
          status: item.status,
          count: item._count.id,
          totalRevenue: item._sum.amount || 0,
          totalTax: 0,
        })),
        topCustomers,
      };

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error("Error generating sales summary report:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// GET /api/reports/tax-summary - Tax Summary Report
router.get(
  "/tax-summary",
  authorizeRoles([ROLES.ADMIN, ROLES.ACCOUNTANT]),
  [
    query("dateFrom")
      .optional()
      .isISO8601()
      .withMessage("Date from must be a valid date"),
    query("dateTo")
      .optional()
      .isISO8601()
      .withMessage("Date to must be a valid date"),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { dateFrom, dateTo } = req.query;

      const whereClause: any = {};

      if (dateFrom || dateTo) {
        whereClause.date = {};
        if (dateFrom) whereClause.date.gte = new Date(dateFrom as string);
        if (dateTo) whereClause.date.lte = new Date(dateTo as string);
      }

      const invoices = await prisma.invoices.findMany({
        where: whereClause,
        select: { totalAmount: true },
      });

      const totalRevenue = invoices.reduce((sum: any, inv: any) => {
        const amt = (inv.amount as any)?.toNumber
          ? (inv.amount as any).toNumber()
          : Number(inv.amount);
        return sum + amt;
      }, 0);

      const totals = {
        totalRevenue,
        totalTax: 0,
        totalInvoices: invoices.length,
      };

      const report = {
        period: {
          from: dateFrom || null,
          to: dateTo || null,
        },
        summary: totals,
        taxByRegion: [],
      };

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error("Error generating tax summary report:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

export default router;
