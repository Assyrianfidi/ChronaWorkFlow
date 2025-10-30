import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, IsUUID } from 'class-validator';

export class CreateRefundDto {
  @ApiProperty({ description: 'ID of the payment to refund' })
  @IsUUID()
  paymentId: string;

  @ApiProperty({ 
    description: 'Amount to refund (if not provided, full amount will be refunded)',
    required: false 
  })
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  amount?: number;

  @ApiProperty({ 
    description: 'Reason for the refund',
    required: false 
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
