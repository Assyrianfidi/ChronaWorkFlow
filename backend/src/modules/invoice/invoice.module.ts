import { Module, forwardRef } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ClientModule } from '../client/client.module';
import { BusinessModule } from '../business/business.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => ClientModule),
    forwardRef(() => BusinessModule),
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoiceModule {}
