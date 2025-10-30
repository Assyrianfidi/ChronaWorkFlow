import { PartialType } from '@nestjs/swagger';
import { CreateInvoiceDto } from './create-invoice.dto';

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {
  // Status can be updated separately
  @ApiProperty({ 
    description: 'Status of the invoice',
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    required: false
  })
  @IsString()
  @IsOptional()
  @IsIn(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
  status?: string;

  // Allow updating payment date when marking as paid
  @ApiProperty({ 
    description: 'Date when the invoice was paid',
    required: false
  })
  @IsDateString()
  @IsOptional()
  paidDate?: string;
}
