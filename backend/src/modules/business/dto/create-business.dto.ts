import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { BusinessType } from '../enums/business-type.enum';

export class CreateBusinessDto {
  @ApiProperty({ description: 'Business name', example: 'Acme Corp' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Business type', example: 'enterprise', enum: BusinessType, required: false })
  @IsEnum(BusinessType)
  @IsOptional()
  type?: string;

  @ApiProperty({ description: 'Industry', example: 'Technology', required: false })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiProperty({ description: 'Business email', example: 'contact@acme.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Business phone', example: '+1234567890', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'Business address', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ description: 'City', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ description: 'Country', required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ description: 'Postal code', required: false })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({ description: 'Tax ID', required: false })
  @IsString()
  @IsOptional()
  taxId?: string;
}
