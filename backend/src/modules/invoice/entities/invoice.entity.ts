import { ApiProperty } from '@nestjs/swagger';

export class InvoiceItem {
  @ApiProperty({ description: 'Description of the item' })
  description: string;

  @ApiProperty({ description: 'Quantity of the item' })
  quantity: number;

  @ApiProperty({ description: 'Unit price of the item' })
  unitPrice: number;

  @ApiProperty({ description: 'Tax rate for this item (0-100)' })
  taxRate: number;

  @ApiProperty({ description: 'Total price for this item (quantity * unitPrice)' })
  total: number;

  @ApiProperty({ description: 'Tax amount for this item' })
  taxAmount: number;
}

export class Invoice {
  @ApiProperty({ description: 'Unique identifier of the invoice' })
  id: string;

  @ApiProperty({ description: 'Auto-generated invoice number' })
  invoiceNumber: string;

  @ApiProperty({ description: 'ID of the business this invoice belongs to' })
  businessId: string;

  @ApiProperty({ description: 'ID of the client this invoice is for' })
  clientId: string;

  @ApiProperty({ description: 'Date when the invoice was issued' })
  issueDate: Date;

  @ApiProperty({ description: 'Due date for the invoice', required: false })
  dueDate?: Date;

  @ApiProperty({ description: 'Date when the invoice was paid', required: false })
  paidDate?: Date;

  @ApiProperty({ type: [InvoiceItem], description: 'List of items on the invoice' })
  items: InvoiceItem[];

  @ApiProperty({ description: 'Subtotal amount (sum of all items before tax)' })
  subtotal: number;

  @ApiProperty({ description: 'Total tax amount' })
  tax: number;

  @ApiProperty({ description: 'Total amount including tax' })
  total: number;

  @ApiProperty({ 
    description: 'Status of the invoice',
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  })
  status: string;

  @ApiProperty({ description: 'Additional notes or terms', required: false })
  notes?: string;

  @ApiProperty({ description: 'Date when the invoice was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Date when the invoice was last updated' })
  updatedAt: Date;

  // Computed property (not stored in database)
  @ApiProperty({ 
    description: 'Whether the invoice is overdue',
    type: Boolean
  })
  get isOverdue(): boolean {
    if (this.status === 'paid' || this.status === 'cancelled' || !this.dueDate) {
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.dueDate < today;
  }
}
