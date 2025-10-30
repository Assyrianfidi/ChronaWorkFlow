import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto, InvoiceItemDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Invoice, InvoiceItem } from './entities/invoice.entity';
import { ClientService } from '../client/client.service';
import { BusinessService } from '../business/business.service';

@Injectable()
export class InvoiceService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ClientService))
    private clientService: ClientService,
    @Inject(forwardRef(() => BusinessService))
    private businessService: BusinessService,
  ) {}

  private calculateInvoiceTotals(items: InvoiceItemDto[]): { subtotal: number; tax: number; total: number } {
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    const tax = items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice * (item.taxRate / 100));
    }, 0);

    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number((subtotal + tax).toFixed(2))
    };
  }

  private async generateInvoiceNumber(businessId: string): Promise<string> {
    const count = await this.prisma.invoice.count({
      where: { businessId }
    });
    return `INV-${(count + 1).toString().padStart(5, '0')}`;
  }

  private async validateBusinessAccess(userId: string, businessId: string): Promise<void> {
    try {
      await this.businessService.findOne(businessId, userId);
    } catch (error) {
      throw new ForbiddenException('You do not have access to this business');
    }
  }

  private mapToInvoiceEntity(invoice: any): Invoice {
    return {
      ...invoice,
      isOverdue: (() => {
        if (invoice.status === 'paid' || invoice.status === 'cancelled' || !invoice.dueDate) {
          return false;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return invoice.dueDate < today;
      })()
    } as Invoice;
  }

  async create(userId: string, createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    // Check if user has access to the business
    await this.validateBusinessAccess(userId, createInvoiceDto.businessId);

    // Verify client exists and belongs to the same business
    try {
      const client = await this.clientService.findOne(createInvoiceDto.clientId, userId);
      if (client.businessId !== createInvoiceDto.businessId) {
        throw new ForbiddenException('Client does not belong to the specified business');
      }
    } catch (error) {
      throw new BadRequestException('Invalid client');
    }

    // Calculate totals
    const { subtotal, tax, total } = this.calculateInvoiceTotals(createInvoiceDto.items);

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(createInvoiceDto.businessId);

    // Create invoice items with calculated totals
    const itemsWithTotals = createInvoiceDto.items.map(item => ({
      ...item,
      total: item.quantity * item.unitPrice,
      taxAmount: (item.quantity * item.unitPrice * (item.taxRate / 100))
    }));

    // Create the invoice
    const invoice = await this.prisma.invoice.create({
      data: {
        ...createInvoiceDto,
        invoiceNumber,
        items: itemsWithTotals,
        subtotal,
        tax,
        total,
        status: 'draft',
        issueDate: new Date(createInvoiceDto.issueDate),
        dueDate: createInvoiceDto.dueDate ? new Date(createInvoiceDto.dueDate) : null,
      },
      include: {
        client: true,
        business: true
      }
    });

    return this.mapToInvoiceEntity(invoice);
  }

  async findAll(
    userId: string,
    businessId: string,
    page: number = 1,
    limit: number = 10,
    status?: string,
    clientId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ data: Invoice[]; total: number }> {
    // Check if user has access to the business
    await this.validateBusinessAccess(userId, businessId);

    const skip = (page - 1) * limit;
    const where: any = { businessId };

    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    
    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) where.issueDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.issueDate.lte = end;
      }
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: true,
          business: true
        }
      }),
      this.prisma.invoice.count({ where })
    ]);

    return {
      data: invoices.map(invoice => this.mapToInvoiceEntity(invoice)),
      total
    };
  }

  async findOne(userId: string, id: string): Promise<Invoice> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        business: true
      }
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Check if user has access to the business
    await this.validateBusinessAccess(userId, invoice.businessId);

    return this.mapToInvoiceEntity(invoice);
  }

  async update(
    userId: string,
    id: string,
    updateInvoiceDto: UpdateInvoiceDto
  ): Promise<Invoice> {
    // First get the invoice to check access
    const existingInvoice = await this.findOne(userId, id);

    // If updating status to 'paid', set paidDate
    const updateData: any = { ...updateInvoiceDto };
    if (updateInvoiceDto.status === 'paid' && existingInvoice.status !== 'paid') {
      updateData.paidDate = new Date();
    }

    // If updating items, recalculate totals
    if (updateInvoiceDto.items) {
      const { subtotal, tax, total } = this.calculateInvoiceTotals(updateInvoiceDto.items);
      updateData.subtotal = subtotal;
      updateData.tax = tax;
      updateData.total = total;
      
      // Update items with calculated totals
      updateData.items = updateInvoiceDto.items.map(item => ({
        ...item,
        total: item.quantity * item.unitPrice,
        taxAmount: (item.quantity * item.unitPrice * (item.taxRate / 100))
      }));
    }

    // Update the invoice
    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        business: true
      }
    });

    return this.mapToInvoiceEntity(updatedInvoice);
  }

  async remove(userId: string, id: string): Promise<void> {
    // First get the invoice to check access
    await this.findOne(userId, id);

    await this.prisma.invoice.delete({
      where: { id }
    });
  }

  async generatePdf(userId: string, id: string): Promise<Buffer> {
    const invoice = await this.findOne(userId, id);
    
    // In a real implementation, you would use a PDF generation library like pdfkit or puppeteer
    // This is a placeholder implementation
    return Promise.resolve(Buffer.from(JSON.stringify(invoice)));
  }
}
