import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsUrl, IsEmail } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ description: 'ID of the invoice to pay' })
  @IsString()
  invoiceId: string;

  @ApiProperty({ description: 'URL to redirect to after successful payment' })
  @IsUrl()
  successUrl: string;

  @ApiProperty({ description: 'URL to redirect to if payment is cancelled' })
  @IsUrl()
  cancelUrl: string;

  @ApiProperty({ description: 'Customer email for receipt', required: false })
  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @ApiProperty({ 
    description: 'Amount to pay (overrides invoice total if provided)',
    required: false 
  })
  @IsNumber()
  @IsOptional()
  amount?: number;
}
