import { Router } from "express";
import { Request, Response } from "express";
import { query, validationResult } from "express-validator";
import { PrismaClient, InvoiceStatus } from "@prisma/client";
import { auth, authorizeRoles } from "../../middleware/auth";
import { ROLES } from "../../constants/roles";

const router = Router();
const prisma = prisma;

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
          in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE],
        },
        dueDate: {
          lt: reportDate,
        },
      };

      if (customerId) {
        whereClause.customerId = customerId;
      }

      const outstandingInvoices = await prisma.invoice.findMany({
        where: whereClause,
        include: {
          customer: true,
          payments: true,
        },
        orderBy: {
          dueDate: "asc",
        },
      });

      // Calculate aging buckets
      const agingBuckets = {
        current: { total: 0, count: 0, invoices: [] },
        days1_30: { total: 0, count: 0, invoices: [] },
        days31_60: { total: 0, count: 0, invoices: [] },
        days61_90: { total: 0, count: 0, invoices: [] },
        days90_plus: { total: 0, count: 0, invoices: [] },
      };

      for (const invoice of outstandingInvoices) {
        const totalPaid = invoice.payments.reduce(
          (sum, payment) => sum + payment.amount,
          0,
        );
        const balanceDue = invoice.total - totalPaid;

        if (balanceDue <= 0) continue;

        const daysOverdue = Math.floor(
          (reportDate.getTime() - new Date(invoice.dueDate).getTime()) /
            (1000 * 60 * 60 * 24),
        );

        const invoiceInfo = {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          customerName:
            invoice.customer.companyName ||
            `${invoice.customer.firstName} ${invoice.customer.lastName}`,
          customerEmail: invoice.customer.email,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          daysOverdue,
          totalAmount: invoice.total,
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
    } catch (error) {
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
        whereClause.issueDate = {};
        if (dateFrom) whereClause.issueDate.gte = new Date(dateFrom as string);
        if (dateTo) whereClause.issueDate.lte = new Date(dateTo as string);
      }

      if (customerId) {
        whereClause.customerId = customerId;
      }

      const [invoices, summary] = await Promise.all([
        prisma.invoice.findMany({
          where: whereClause,
          include: {
            customer: true,
            payments: true,
          },
          orderBy: { issueDate: "desc" },
        }),
        prisma.invoice.groupBy({
          by: ["status"],
          where: whereClause,
          _count: { id: true },
          _sum: {
            total: true,
            subtotal: true,
            taxTotal: true,
          },
        }),
      ]);

      // Calculate totals
      const totalInvoices = invoices.length;
      const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
      const totalTax = invoices.reduce((sum, inv) => sum + inv.taxTotal, 0);
      const totalPaid = invoices.reduce((sum, inv) => {
        return (
          sum + inv.payments.reduce((paySum, pay) => paySum + pay.amount, 0)
        );
      }, 0);
      const totalOutstanding = totalRevenue - totalPaid;

      // Top customers by revenue
      const customerRevenue = invoices.reduce((acc: any, invoice) => {
        const customerKey = invoice.customerId;
        if (!acc[customerKey]) {
          acc[customerKey] = {
            customerId: invoice.customerId,
            customerName:
              invoice.customer.companyName ||
              `${invoice.customer.firstName} ${invoice.customer.lastName}`,
            revenue: 0,
            invoiceCount: 0,
          };
        }
        acc[customerKey].revenue += invoice.total;
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
        statusBreakdown: summary.map((item) => ({
          status: item.status,
          count: item._count.id,
          totalRevenue: item._sum.total || 0,
          totalTax: item._sum.taxTotal || 0,
        })),
        topCustomers,
      };

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
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
        whereClause.issueDate = {};
        if (dateFrom) whereClause.issueDate.gte = new Date(dateFrom as string);
        if (dateTo) whereClause.issueDate.lte = new Date(dateTo as string);
      }

      const invoices = await prisma.invoice.findMany({
        where: whereClause,
        include: {
          customer: true,
        },
      });

      // Group by customer region for tax analysis
      const taxByRegion = invoices.reduce((acc: any, invoice) => {
        const region = invoice.customer.province
          ? `CA-${invoice.customer.province}`
          : "CA";
        if (!acc[region]) {
          acc[region] = {
            region,
            totalRevenue: 0,
            totalTax: 0,
            invoiceCount: 0,
            customers: new Set(),
          };
        }
        acc[region].totalRevenue += invoice.subtotal;
        acc[region].totalTax += invoice.taxTotal;
        acc[region].invoiceCount += 1;
        acc[region].customers.add(invoice.customerId);
        return acc;
      }, {});

      const taxSummary = Object.values(taxByRegion).map((region: any) => ({
        ...region,
        customerCount: region.customers.size,
        effectiveTaxRate:
          region.totalRevenue > 0
            ? (region.totalTax / region.totalRevenue) * 100
            : 0,
        customers: Array.from(region.customers),
      }));

      const totals = taxSummary.reduce(
        (acc, region) => ({
          totalRevenue: acc.totalRevenue + region.totalRevenue,
          totalTax: acc.totalTax + region.totalTax,
          totalInvoices: acc.totalInvoices + region.invoiceCount,
        }),
        { totalRevenue: 0, totalTax: 0, totalInvoices: 0 },
      );

      const report = {
        period: {
          from: dateFrom || null,
          to: dateTo || null,
        },
        summary: totals,
        taxByRegion: taxSummary.sort((a, b) => b.totalTax - a.totalTax),
      };

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error("Error generating tax summary report:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

export default router;
