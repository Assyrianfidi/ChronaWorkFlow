import { Module } from '@nestjs/common';
import { BusinessController } from './controllers/business.controller';
import { BusinessService } from './services/business.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [BusinessController],
  providers: [BusinessService, PrismaService],
  exports: [BusinessService],
})
export class BusinessModule {}
