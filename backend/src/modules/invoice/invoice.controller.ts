import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  StreamableFile,
  Header,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BusinessAccessGuard } from '../../auth/guards/business-access.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Invoice } from './entities/invoice.entity';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('api/v1/invoices')
@UseGuards(JwtAuthGuard, BusinessAccessGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully', type: Invoice })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to the business' })
  async create(
    @Req() req: Request,
    @Body() createInvoiceDto: CreateInvoiceDto,
  ): Promise<Invoice> {
    return this.invoiceService.create(req.user.id, createInvoiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all invoices for a business' })
  @ApiResponse({ status: 200, description: 'Returns list of invoices', type: [Invoice] })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to the business' })
  async findAll(
    @Req() req: Request,
    @Query('businessId') businessId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.invoiceService.findAll(
      req.user.id,
      businessId,
      parseInt(page, 10),
      parseInt(limit, 10),
      status,
      clientId,
      startDate,
      endDate,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single invoice by ID' })
  @ApiResponse({ status: 200, description: 'Returns the invoice', type: Invoice })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to the invoice' })
  async findOne(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<Invoice> {
    return this.invoiceService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Update an invoice' })
  @ApiResponse({ status: 200, description: 'Invoice updated successfully', type: Invoice })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to update the invoice' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<Invoice> {
    return this.invoiceService.update(req.user.id, id, updateInvoiceDto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete an invoice' })
  @ApiResponse({ status: 200, description: 'Invoice deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - No permission to delete' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async remove(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<void> {
    return this.invoiceService.remove(req.user.id, id);
  }

  @Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="invoice.pdf"')
  @ApiOperation({ summary: 'Generate PDF for an invoice' })
  @ApiResponse({ status: 200, description: 'Returns PDF file' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to the invoice' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async generatePdf(
    @Req() req: Request,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const pdf = await this.invoiceService.generatePdf(req.user.id, id);
    // In a real implementation, you would return the actual PDF buffer
    // For now, we're just returning a JSON response with the invoice data
    res.status(HttpStatus.OK);
    return new StreamableFile(pdf);
  }
}
