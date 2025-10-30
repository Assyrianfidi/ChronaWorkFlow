import { ApiProperty } from '@nestjs/swagger';
import { BusinessType } from '../enums/business-type.enum';

export class BusinessResponseDto {
  @ApiProperty({ description: 'Business ID' })
  id: string;

  @ApiProperty({ description: 'Business name' })
  name: string;

  @ApiProperty({ description: 'Business type', enum: BusinessType, required: false })
  type?: string;

  @ApiProperty({ description: 'Industry', required: false })
  industry?: string;

  @ApiProperty({ description: 'Business email' })
  email: string;

  @ApiProperty({ description: 'Business phone', required: false })
  phone?: string;

  @ApiProperty({ description: 'Business address', required: false })
  address?: string;

  @ApiProperty({ description: 'City', required: false })
  city?: string;

  @ApiProperty({ description: 'Country', required: false })
  country?: string;

  @ApiProperty({ description: 'Postal code', required: false })
  postalCode?: string;

  @ApiProperty({ description: 'Tax ID', required: false })
  taxId?: string;

  @ApiProperty({ description: 'Business owner ID' })
  ownerId: string;

  @ApiProperty({ description: 'Business active status' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
