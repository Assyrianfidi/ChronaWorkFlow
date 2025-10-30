import { PartialType } from '@nestjs/swagger';
import { CreateClientDto } from './create-client.dto';

export class UpdateClientDto extends PartialType(CreateClientDto) {
  // All fields are optional due to PartialType
  // Additional validation can be added here if needed for specific update scenarios
}
