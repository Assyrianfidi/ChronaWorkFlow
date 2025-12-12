import { PrismaClient, InvoiceStatus, PaymentMethod } from "@prisma/client";
import { generateInvoiceNumber } from "./utils/invoice-number.util";

// Fixed self-reference

export interface CreateInvoiceData {
  customerId: string;
  issueDate?: Date;
  dueDate: Date;
  currency?: string;
  notes?: string;
  lines: {
    productId?: string;
    description: string;
    qty: number;
    unitPrice: number;
  }[];
}

export interface UpdateInvoiceData {
  customerId?: string;
  issueDate?: Date;
  dueDate?: Date;
  currency?: string;
  notes?: string;
  status?: InvoiceStatus;
  lines?: {
    id?: string;
    productId?: string;
    description: string;
    qty: number;
    unitPrice: number;
  }[];
}

export class InvoiceService {
  async createInvoice(data: CreateInvoiceData) {
    try {
      const invoiceNumber = await generateInvoiceNumber();

      // Get customer for tax calculation
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId },
        include: { defaultTaxSettings: true },
      });

      if (!customer) {
        throw new Error("Customer not found");
      }

      // Get tax rules for customer's region
      const taxRules = await prisma.taxRule.findMany({
        where: {
          OR: [
            { regionCode: customer.country || "CA" },
            {
              regionCode: customer.province
                ? `CA-${customer.province}`
                : undefined,
            },
          ].filter(Boolean),
        },
      });

      // Calculate line items and totals
      const processedLines = await Promise.all(
        data.lines.map(async (line) => {
          let unitPrice = line.unitPrice;

          // Get product price if productId provided
          if (line.productId) {
            const product = await prisma.product.findUnique({
              where: { id: line.productId },
            });
            if (product) {
              unitPrice = product.unitPrice;
            }
          }

          const lineSubtotal = line.qty * unitPrice;
          const lineTax = this.calculateLineTax(
            lineSubtotal,
            taxRules,
            customer,
          );
          const lineTotal = lineSubtotal + lineTax;

          return {
            description: line.description,
            qty: line.qty,
            unitPrice,
            lineSubtotal,
            lineTax,
            lineTotal,
            productId: line.productId,
          };
        }),
      );

      const subtotal = processedLines.reduce(
        (sum, line) => sum + line.lineSubtotal,
        0,
      );
      const taxTotal = processedLines.reduce(
        (sum, line) => sum + line.lineTax,
        0,
      );
      const total = subtotal + taxTotal;

      // Create invoice with lines
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          customerId: data.customerId,
          issueDate: data.issueDate || new Date(),
          dueDate: data.dueDate,
          currency: data.currency || "CAD",
          subtotal,
          taxTotal,
          total,
          notes: data.notes,
          status: InvoiceStatus.DRAFT,
          lines: {
            create: processedLines.map((line) => ({
              productId: line.productId,
              description: line.description,
              qty: line.qty,
              unitPrice: line.unitPrice,
              lineSubtotal: line.lineSubtotal,
              lineTax: line.lineTax,
              lineTotal: line.lineTotal,
            })),
          },
        },
        include: {
          customer: true,
          lines: {
            include: {
              product: true,
            },
          },
        },
      });

      return invoice;
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw error;
    }
  }

  async getInvoice(id: string) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          customer: true,
          lines: {
            include: {
              product: true,
            },
          },
          payments: true,
        },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      return invoice;
    } catch (error) {
      console.error("Error getting invoice:", error);
      throw error;
    }
  }

  async updateInvoice(id: string, data: UpdateInvoiceData) {
    try {
      const existingInvoice = await prisma.invoice.findUnique({
        where: { id },
        include: { lines: true },
      });

      if (!existingInvoice) {
        throw new Error("Invoice not found");
      }

      if (
        existingInvoice.status === InvoiceStatus.PAID ||
        existingInvoice.status === /* InvoiceStatus.VOIDED */ "VOIDED"
      ) {
        throw new Error("Cannot update paid or voided invoices");
      }

      // Get customer for tax calculation
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId || existingInvoice.customerId },
      });

      if (!customer) {
        throw new Error("Customer not found");
      }

      // Get tax rules
      const taxRules = await prisma.taxRule.findMany({
        where: {
          OR: [
            { regionCode: customer.country || "CA" },
            {
              regionCode: customer.province
                ? `CA-${customer.province}`
                : undefined,
            },
          ].filter(Boolean),
        },
      });

      // Process lines if provided
      let processedLines = [];
      if (data.lines) {
        processedLines = await Promise.all(
          data.lines.map(async (line) => {
            let unitPrice = line.unitPrice;

            if (line.productId) {
              const product = await prisma.product.findUnique({
                where: { id: line.productId },
              });
              if (product) {
                unitPrice = product.unitPrice;
              }
            }

            const lineSubtotal = line.qty * unitPrice;
            const lineTax = this.calculateLineTax(
              lineSubtotal,
              taxRules,
              customer,
            );
            const lineTotal = lineSubtotal + lineTax;

            return {
              id: line.id,
              description: line.description,
              qty: line.qty,
              unitPrice,
              lineSubtotal,
              lineTax,
              lineTotal,
              productId: line.productId,
            };
          }),
        );
      }

      const subtotal =
        processedLines.length > 0
          ? processedLines.reduce((sum, line) => sum + line.lineSubtotal, 0)
          : existingInvoice.subtotal;
      const taxTotal =
        processedLines.length > 0
          ? processedLines.reduce((sum, line) => sum + line.lineTax, 0)
          : existingInvoice.taxTotal;
      const total = subtotal + taxTotal;

      // Update invoice
      const updatedInvoice = await prisma.invoice.update({
        where: { id },
        data: {
          customerId: data.customerId,
          issueDate: data.issueDate,
          dueDate: data.dueDate,
          currency: data.currency,
          notes: data.notes,
          status: data.status,
          subtotal,
          taxTotal,
          total,
          lines: data.lines
            ? {
                deleteMany: {},
                create: processedLines.map((line) => ({
                  productId: line.productId,
                  description: line.description,
                  qty: line.qty,
                  unitPrice: line.unitPrice,
                  lineSubtotal: line.lineSubtotal,
                  lineTax: line.lineTax,
                  lineTotal: line.lineTotal,
                })),
              }
            : undefined,
        },
        include: {
          customer: true,
          lines: {
            include: {
              product: true,
            },
          },
        },
      });

      return updatedInvoice;
    } catch (error) {
      console.error("Error updating invoice:", error);
      throw error;
    }
  }

  async listInvoices(filters: {
    status?: InvoiceStatus;
    customerId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }) {
    try {
      const { page = 1, limit = 20, ...where } = filters;
      const skip = (page - 1) * limit;

      const whereClause: any = {};

      if (filters.status) whereClause.status = filters.status;
      if (filters.customerId) whereClause.customerId = filters.customerId;
      if (filters.dateFrom || filters.dateTo) {
        whereClause.issueDate = {};
        if (filters.dateFrom) whereClause.issueDate.gte = filters.dateFrom;
        if (filters.dateTo) whereClause.issueDate.lte = filters.dateTo;
      }

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where: whereClause,
          include: {
            customer: true,
            lines: {
              include: {
                product: true,
              },
            },
            payments: true,
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.invoice.count({ where: whereClause }),
      ]);

      return {
        invoices,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error listing invoices:", error);
      throw error;
    }
  }

  async sendInvoice(id: string) {
    try {
      const invoice = await this.getInvoice(id);

      if (invoice.status === InvoiceStatus.DRAFT) {
        // Create accounting entries for double-entry bookkeeping
        await this.createAccountingEntries(invoice);

        // Update invoice status
        const updatedInvoice = await prisma.invoice.update({
          where: { id },
          data: {
            status: InvoiceStatus.SENT,
            sentAt: new Date(),
          },
        });

        return updatedInvoice;
      }

      throw new Error("Invoice can only be sent from DRAFT status");
    } catch (error) {
      console.error("Error sending invoice:", error);
      throw error;
    }
  }

  private calculateLineTax(
    lineSubtotal: number,
    taxRules: any[],
    customer: any,
  ): number {
    let totalTax = 0;

    for (const rule of taxRules) {
      if (customer.defaultTaxSettings) {
        const settings = customer.defaultTaxSettings as any;

        // Check if this tax applies to customer
        if (
          (rule.regionCode === "CA" && settings.gst) ||
          (rule.regionCode === "CA-BC" && settings.pst) ||
          (rule.regionCode === "CA-ON" && settings.hst) ||
          (rule.regionCode === "CA-QC" && settings.qst)
        ) {
          if (rule.isCompound) {
            // Compound tax is calculated on subtotal + previous taxes
            totalTax += lineSubtotal * rule.rate;
          } else {
            // Simple tax is calculated on subtotal only
            totalTax += lineSubtotal * rule.rate;
          }
        }
      }
    }

    return Math.round(totalTax);
  }

  private async createAccountingEntries(invoice: any) {
    try {
      // Create double-entry accounting
      // Debit: Accounts Receivable (asset increases)
      // Credit: Revenue (revenue increases)

      await prisma.accountEntry.createMany({
        data: [
          {
            refId: invoice.id,
            refType: "INVOICE",
            debitAccount: "1200", // Accounts Receivable
            creditAccount: "4000", // Revenue
            amount: invoice.total,
            description: `Invoice ${invoice.invoiceNumber} - ${invoice.customer.companyName || invoice.customer.firstName + " " + invoice.lastName}`,
          },
        ],
      });
    } catch (error) {
      console.error("Error creating accounting entries:", error);
      throw error;
    }
  }
}

export const invoiceService = new InvoiceService();
