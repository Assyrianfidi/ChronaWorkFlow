import { InvoiceStatus } from "@prisma/client";
import { prisma } from "../../utils/prisma";
import { generateInvoiceNumber } from "./utils/invoice-number.util";

// Fixed self-reference

export interface CreateInvoiceData {
  companyId: string;
  clientId?: string;
  date?: Date;
  dueDate: Date;
  items: {
    accountId: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface UpdateInvoiceData {
  clientId?: string | null;
  date?: Date;
  dueDate?: Date;
  status?: InvoiceStatus;
  items?: {
    id?: string;
    accountId: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export class InvoiceService {
  async createInvoice(data: CreateInvoiceData) {
    try {
      const invoiceNumber = await generateInvoiceNumber();

      const items = data.items.map((item) => {
        const lineTotal = Math.round(item.quantity * item.unitPrice);
        return {
          accountId: item.accountId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalAmount: lineTotal,
        };
      });

      const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);

      // Create invoice with lines
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          companyId: data.companyId,
          clientId: data.clientId ?? null,
          date: data.date || new Date(),
          dueDate: data.dueDate,
          status: InvoiceStatus.DRAFT,
          totalAmount,
          items: {
            create: items,
          },
        },
        include: {
          client: true,
          items: true,
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
          client: true,
          items: true,
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
        include: { items: true },
      });

      if (!existingInvoice) {
        throw new Error("Invoice not found");
      }

      if (existingInvoice.status === InvoiceStatus.PAID) {
        throw new Error("Cannot update paid invoices");
      }

      // Process lines if provided
      const items = data.items
        ? data.items.map((item) => ({
            accountId: item.accountId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalAmount: Math.round(item.quantity * item.unitPrice),
          }))
        : null;

      const totalAmount = items
        ? items.reduce((sum, item) => sum + item.totalAmount, 0)
        : existingInvoice.totalAmount.toNumber();

      // Update invoice
      const updatedInvoice = await prisma.invoice.update({
        where: { id },
        data: {
          clientId: data.clientId,
          date: data.date,
          dueDate: data.dueDate,
          status: data.status,
          totalAmount,
          items: items
            ? {
                deleteMany: {},
                create: items,
              }
            : undefined,
        },
        include: {
          client: true,
          items: true,
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
    clientId?: string;
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
      if (filters.clientId) whereClause.clientId = filters.clientId;
      if (filters.dateFrom || filters.dateTo) {
        whereClause.date = {};
        if (filters.dateFrom) whereClause.date.gte = filters.dateFrom;
        if (filters.dateTo) whereClause.date.lte = filters.dateTo;
      }

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where: whereClause,
          include: {
            client: true,
            items: true,
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
            amount: invoice.totalAmount?.toNumber ? invoice.totalAmount.toNumber() : Number(invoice.totalAmount),
            description: `Invoice ${invoice.invoiceNumber}`,
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
