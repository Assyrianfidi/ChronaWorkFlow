import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { InvoiceModule } from '../invoice/invoice.module';
import { BusinessModule } from '../business/business.module';
import { ClientModule } from '../client/client.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    forwardRef(() => InvoiceModule),
    forwardRef(() => BusinessModule),
    forwardRef(() => ClientModule),
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    {
      provide: 'STRIPE_CONFIG',
      useFactory: (configService: ConfigService) => ({
        apiKey: configService.get('STRIPE_SECRET_KEY'),
        apiVersion: '2023-10-16',
      }),
      inject: [ConfigService],
    },
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
