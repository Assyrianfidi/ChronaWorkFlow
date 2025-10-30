import { ApiProperty } from '@nestjs/swagger';

export class DiscrepancyDto {
  @ApiProperty({ description: 'Type of discrepancy' })
  type: 'MISSING_PAYMENT' | 'AMOUNT_MISMATCH' | 'ORPHAN_PAYMENT';
  
  @ApiProperty({ description: 'Invoice ID (if applicable)' })
  invoiceId?: string;
  
  @ApiProperty({ description: 'Invoice number (if applicable)' })
  invoiceNumber?: string;
  
  @ApiProperty({ description: 'Payment ID (if applicable)' })
  paymentId?: string;
  
  @ApiProperty({ description: 'Expected amount' })
  expectedAmount?: number;
  
  @ApiProperty({ description: 'Actual amount' })
  actualAmount?: number;
  
  @ApiProperty({ description: 'Date of the discrepancy' })
  date: Date;
}

export class ReconciliationSummaryDto {
  @ApiProperty({ description: 'Total number of invoices processed' })
  totalInvoices: number;
  
  @ApiProperty({ description: 'Total number of payments processed' })
  totalPayments: number;
  
  @ApiProperty({ description: 'Total invoice amount' })
  totalInvoiceAmount: number;
  
  @ApiProperty({ description: 'Total payment amount' })
  totalPaymentAmount: number;
  
  @ApiProperty({ description: 'Total discrepancy amount' })
  totalDiscrepancyAmount: number;
  
  @ApiProperty({ description: 'List of discrepancies found', type: [DiscrepancyDto] })
  discrepancies: DiscrepancyDto[];
}

export class ReconciliationReportResponseDto {
  @ApiProperty({ description: 'Report ID' })
  id: string;
  
  @ApiProperty({ description: 'Business ID' })
  businessId: string;
  
  @ApiProperty({ description: 'Report generation date' })
  reportDate: Date;
  
  @ApiProperty({ description: 'Start date of the report period' })
  fromDate: Date;
  
  @ApiProperty({ description: 'End date of the report period' })
  toDate: Date;
  
  @ApiProperty({ description: 'Report status', enum: ['PENDING', 'COMPLETED', 'FAILED'] })
  status: string;
  
  @ApiProperty({ description: 'Report summary', type: ReconciliationSummaryDto })
  summary: ReconciliationSummaryDto;
  
  @ApiProperty({ description: 'User who created the report' })
  createdBy?: string;
  
  @ApiProperty({ description: 'Report creation timestamp' })
  createdAt: Date;
  
  @ApiProperty({ description: 'Report last update timestamp' })
  updatedAt: Date;
}
