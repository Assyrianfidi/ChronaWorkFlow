import { prisma } from '../utils/prisma.js';
import { ApiError } from '../utils/errors.js';
import type { Prisma } from '@prisma/client';

// Define the InvoiceWithItems type based on Prisma's generated types
type InvoiceWithItems = Prisma.InvoiceGetPayload<{
  include: { items: true };
}>;

export interface CreateInvoiceData {
  customerId: string;
  issueDate: Date;
  dueDate: Date;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
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
  status?: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  notes?: string;
  // Add other fields that can be updated
}

export class InvoiceService {
  async getInvoicesByCompany(companyId: string, page = 1, limit = 10): Promise<{
    data: Array<Prisma.InvoiceGetPayload<{}>>;
    meta: {
      total: number;
      page: number;
      totalPages: number;
      limit: number;
    };
  }> {
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: { companyId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where: { companyId } }),
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

  async getInvoiceById(id: string): Promise<InvoiceWithItems> {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    const items = await prisma.invoiceItem.findMany({
      where: { invoiceId: id },
    });

    return {
      ...invoice,
      items,
    };
  }

  async createInvoice(data: CreateInvoiceData): Promise<InvoiceWithItems> {
    const { items, ...invoiceData } = data;

    return prisma.$transaction(async (tx) => {
      // Create the invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: await this.generateInvoiceNumber(invoiceData.companyId),
          date: invoiceData.issueDate || new Date(),
          dueDate: invoiceData.dueDate,
          totalAmount: invoiceData.total || 0,
          status: invoiceData.status || 'DRAFT',
          companyId: invoiceData.companyId,
          clientId: invoiceData.customerId || null,
        },
      });

      // Create invoice items
      if (items && items.length > 0) {
        await tx.invoiceItem.createMany({
          data: items.map((item) => ({
            invoiceId: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalAmount: item.amount,
            accountId: 'default-account-id', // TODO: Get from company default account
          })),
        });
      }

      // Return the invoice with items
      const invoiceItems = await tx.invoiceItem.findMany({
        where: { invoiceId: invoice.id },
      });

      return {
        ...invoice,
        items: invoiceItems,
      };
    });
  }

  async updateInvoice(
    id: string,
    data: UpdateInvoiceData
  ): Promise<InvoiceWithItems> {
    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    // Update the invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    // Get the updated invoice with items
    const items = await prisma.invoiceItem.findMany({
      where: { invoiceId: id },
    });

    return {
      ...updatedInvoice,
      items,
    };
  }

  async deleteInvoice(id: string): Promise<void> {
    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    // Delete invoice items first (due to foreign key constraint)
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: id },
    });

    // Delete the invoice
    await prisma.invoice.delete({
      where: { id },
    });
  }

  private async generateInvoiceNumber(companyId: string): Promise<string> {
    // Get the count of invoices for this company
    const count = await prisma.invoice.count({
      where: { companyId },
    });

    // Generate a unique invoice number (e.g., INV-0001, INV-0002, etc.)
    return `INV-${String(count + 1).padStart(4, '0')}`;
  }
}
