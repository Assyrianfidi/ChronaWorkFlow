import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceItemDto {
  @ApiProperty({ description: 'Description of the item' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Quantity of the item', example: 2 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Unit price of the item', example: 100.5 })
  @IsNumber()
  unitPrice: number;

  @ApiProperty({ description: 'Tax rate for this item (0-100)', example: 20 })
  @IsNumber()
  taxRate: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ description: 'ID of the business this invoice belongs to' })
  @IsUUID()
  businessId: string;

  @ApiProperty({ description: 'ID of the client this invoice is for' })
  @IsUUID()
  clientId: string;

  @ApiProperty({ description: 'Date when the invoice was issued', example: '2023-01-01' })
  @IsDateString()
  issueDate: string;

  @ApiProperty({ description: 'Due date for the invoice', example: '2023-02-01', required: false })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({ type: [InvoiceItemDto], description: 'List of items on the invoice' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @ApiProperty({ description: 'Additional notes or terms', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
