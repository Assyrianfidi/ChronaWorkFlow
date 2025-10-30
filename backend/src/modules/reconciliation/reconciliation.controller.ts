import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Param,
  Res,
  BadRequestException,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseIntPipe,
  DefaultValuePipe,
  Req
} from '@nestjs/common';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { ReconciliationService } from './reconciliation.service';
import { ReconciliationRequestDto } from './dto/reconciliation-request.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { ReconciliationReportResponseDto } from './dto/reconciliation-response.dto';

@ApiTags('Reconciliation')
@ApiBearerAuth()
@Controller('api/v1/reconciliation')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Post('run')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Run reconciliation for a business' })
  @ApiResponse({ status: 201, description: 'Reconciliation started successfully', type: ReconciliationReportResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async runReconciliation(
    @Body() dto: ReconciliationRequestDto,
    @Req() req: any
  ): Promise<ReconciliationReportResponseDto> {
    try {
      return await this.reconciliationService.runReconciliation(
        dto.businessId,
        new Date(dto.fromDate),
        new Date(dto.toDate),
        req.user.id,
        dto.notifyEmails
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('reports')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'List reconciliation reports' })
  @ApiQuery({ name: 'businessId', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'List of reconciliation reports', type: [ReconciliationReportResponseDto] })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listReports(
    @Query('businessId') businessId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20
  ) {
    if (!businessId) {
      throw new BadRequestException('businessId is required');
    }
    return this.reconciliationService.listReports(businessId, page, limit);
  }

  @Get('reports/:id')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Get reconciliation report by ID' })
  @ApiResponse({ status: 200, description: 'Reconciliation report', type: ReconciliationReportResponseDto })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getReport(@Param('id') id: string): Promise<ReconciliationReportResponseDto> {
    return this.reconciliationService.getReport(id);
  }

  @Get('reports/:id/export/csv')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Export reconciliation report as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async exportCsv(
    @Param('id') id: string,
    @Res() res: Response
  ): Promise<void> {
    return this.reconciliationService.generateCsvReport(id, res);
  }

  @Get('reports/:id/export/excel')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Export reconciliation report as Excel' })
  @ApiResponse({ status: 200, description: 'Excel file' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async exportExcel(
    @Param('id') id: string,
    @Res() res: Response
  ): Promise<void> {
    return this.reconciliationService.generateExcelReport(id, res);
  }
}
