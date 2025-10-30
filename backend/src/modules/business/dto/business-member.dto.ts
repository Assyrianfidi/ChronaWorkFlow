import { ApiProperty } from '@nestjs/swagger';

export class BusinessMemberDto {
  @ApiProperty({ description: 'Membership ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Business ID' })
  businessId: string;

  @ApiProperty({ 
    description: 'Member role', 
    enum: ['owner', 'admin', 'accountant', 'member'],
    default: 'member'
  })
  role: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;
}

export class CreateBusinessMemberDto {
  @ApiProperty({ description: 'User ID to add to business' })
  userId: string;

  @ApiProperty({ 
    description: 'Member role', 
    enum: ['admin', 'accountant', 'member'],
    default: 'member'
  })
  role: string;
}

export class UpdateBusinessMemberDto {
  @ApiProperty({ 
    description: 'New role for the member',
    enum: ['admin', 'accountant', 'member']
  })
  role: string;
}
