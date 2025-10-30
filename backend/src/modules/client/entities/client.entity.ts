import { ApiProperty } from '@nestjs/swagger';

export class Client {
  @ApiProperty({ description: 'Unique identifier of the client' })
  id: string;

  @ApiProperty({ description: 'Full name of the client' })
  name: string;

  @ApiProperty({ description: 'Email address of the client' })
  email: string;

  @ApiProperty({ required: false, description: 'Phone number of the client' })
  phone?: string;

  @ApiProperty({ required: false, description: 'Physical address of the client' })
  address?: string;

  @ApiProperty({ required: false, description: 'Additional notes about the client' })
  notes?: string;

  @ApiProperty({ description: 'ID of the business this client belongs to' })
  businessId: string;

  @ApiProperty({ description: 'Date when the client was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Date when the client was last updated' })
  updatedAt: Date;
}
