import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsUUID } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ description: 'Full name of the client' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email address of the client' })
  @IsEmail()
  email: string;

  @ApiProperty({ required: false, description: 'Phone number of the client' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ required: false, description: 'Physical address of the client' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ required: false, description: 'Additional notes about the client' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'ID of the business this client belongs to' })
  @IsUUID()
  businessId: string;
}
