import { prisma } from "../utils/prisma.js";
import { ApiError } from "../utils/errors.js";
import type { Prisma } from "@prisma/client";

// Simplified invoice type without items (no items relation in schema)
type Invoice = Prisma.invoicesGetPayload<{}>;

export interface CreateInvoiceData {
  customerId: string;
  issueDate: Date;
  dueAt: Date;
  status: "DRAFT" | "OPEN" | "PAID" | "OPEN" | "CANCELLED";
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  companyId: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
}

export interface UpdateInvoiceData {
  status?: "DRAFT" | "OPEN" | "PAID" | "OPEN" | "CANCELLED";
  notes?: string;
  // Add other fields that can be updated
}

export class InvoiceService {
  async getInvoicesByCompany(
    companyId: string,
    page = 1,
    limit = 10,
  ): Promise<{
    data: Array<Prisma.invoicesGetPayload<{}>>;
    meta: {
      total: number;
      page: number;
      totalPages: number;
      limit: number;
    };
  }> {
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      prisma.invoices.findMany({
        where: { companyId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.invoices.count({ where: { companyId } }),
    ]);

    return {
      data: invoices,
      meta: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit,
      },
    };
  }

  async getInvoiceById(id: string): Promise<Invoice> {
    const invoice = await prisma.invoices.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new ApiError(404, "Invoice not found");
    }

    return invoice;
  }

  async createInvoice(data: CreateInvoiceData): Promise<Invoice> {
    const { items, ...invoiceData } = data;

    return prisma.$transaction(async (tx: any) => {
      // Create the invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: await this.generateInvoiceNumber(
            invoiceData.companyId,
          ),
          date: invoiceData.issueDate || new Date(),
          dueAt: invoiceData.dueAt,
          totalAmount: invoiceData.total || 0,
          status: invoiceData.status || "DRAFT",
          companyId: invoiceData.companyId,
          clientId: invoiceData.customerId || null,
        },
      });

      // Create invoice items
      if (items && items.length > 0) {
        // Note: Invoice items not implemented in current schema
      }

      // Return the invoice
      return invoice;
    });
  }

  async updateInvoice(
    id: string,
    data: UpdateInvoiceData,
  ): Promise<Invoice> {
    // Check if invoice exists
    const existingInvoice = await prisma.invoices.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      throw new ApiError(404, "Invoice not found");
    }

    // Update the invoice
    const updatedInvoice = await prisma.invoices.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return updatedInvoice;
  }

  async deleteInvoice(id: string): Promise<void> {
    // Check if invoice exists
    const existingInvoice = await prisma.invoices.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      throw new ApiError(404, "Invoice not found");
    }

    // Delete the invoice
    await prisma.invoices.delete({
      where: { id },
    });
  }

  private async generateInvoiceNumber(companyId: string): Promise<string> {
    // Get the count of invoices for this company
    const count = await prisma.invoices.count({
      where: { companyId },
    });

    // Generate a unique invoice number (e.g., INV-0001, INV-0002, etc.)
    return `INV-${String(count + 1).padStart(4, "0")}`;
  }
}
