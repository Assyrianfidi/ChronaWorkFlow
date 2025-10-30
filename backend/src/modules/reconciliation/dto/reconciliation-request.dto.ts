import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReconciliationRequestDto {
  @ApiProperty({ description: 'Business ID to reconcile' })
  @IsUUID()
  @IsNotEmpty()
  businessId: string;

  @ApiProperty({ description: 'Start date for reconciliation (ISO string)', example: '2023-01-01T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  fromDate: string;

  @ApiProperty({ description: 'End date for reconciliation (ISO string)', example: '2023-12-31T23:59:59.999Z' })
  @IsDateString()
  @IsNotEmpty()
  toDate: string;

  @ApiProperty({ description: 'Optional email addresses to send report to', required: false })
  @IsString({ each: true })
  @IsOptional()
  notifyEmails?: string[];
}
