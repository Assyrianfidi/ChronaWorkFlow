import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { ReconciliationRequestDto } from './dto/reconciliation-request.dto';
import { ReconciliationReportResponseDto, ReconciliationSummaryDto, DiscrepancyDto } from './dto/reconciliation-response.dto';
import { Prisma } from '@prisma/client';
import { createReadStream, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { Readable } from 'stream';

@Injectable()
export class ReconciliationService implements OnModuleInit {
  private readonly logger = new Logger(ReconciliationService.name);
  private tempDir = join(process.cwd(), 'temp');

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private mailer: MailerService
  ) {}

  onModuleInit() {
    // Ensure temp directory exists
    if (!require('fs').existsSync(this.tempDir)) {
      require('fs').mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Run reconciliation for a business between specified dates
   */
  async runReconciliation(
    businessId: string,
    fromDate: Date,
    toDate: Date,
    createdBy?: string,
    notifyEmails: string[] = []
  ): Promise<ReconciliationReportResponseDto> {
    this.logger.log(`Starting reconciliation for business ${businessId} from ${fromDate} to ${toDate}`);
    
    // Create initial report
    const report = await this.prisma.reconciliationReport.create({
      data: {
        businessId,
        fromDate,
        toDate,
        status: 'PENDING',
        createdBy,
        summary: {}
      }
    });

    try {
      // Get all invoices and payments in the date range
      const [invoices, payments] = await Promise.all([
        this.prisma.invoice.findMany({
          where: {
            businessId,
            issueDate: { gte: fromDate, lte: toDate },
            status: { not: 'DRAFT' }
          },
          include: {
            items: true,
            payments: true
          }
        }),
        this.prisma.payment.findMany({
          where: {
            businessId,
            createdAt: { gte: fromDate, lte: toDate },
            status: 'succeeded'
          }
        })
      ]);

      // Process reconciliation
      const summary = await this.processReconciliation(invoices, payments);

      // Update report with results
      const updatedReport = await this.prisma.reconciliationReport.update({
        where: { id: report.id },
        data: {
          status: 'COMPLETED',
          totalInvoices: summary.totalInvoices,
          totalPayments: summary.totalPayments,
          discrepancies: summary.discrepancies.length,
          summary: summary as unknown as Prisma.InputJsonValue,
          updatedAt: new Date()
        }
      });

      // Send notifications if needed
      if (summary.discrepancies.length > 0 && notifyEmails.length > 0) {
        await this.sendNotification(updatedReport, summary, notifyEmails);
      }

      return this.mapToResponseDto(updatedReport, summary);
    } catch (error) {
      this.logger.error(`Reconciliation failed: ${error.message}`, error.stack);
      
      // Update report with error
      await this.prisma.reconciliationReport.update({
        where: { id: report.id },
        data: {
          status: 'FAILED',
          summary: { error: error.message } as unknown as Prisma.InputJsonValue,
          updatedAt: new Date()
        }
      });
      
      throw error;
    }
  }

  /**
   * Process reconciliation between invoices and payments
   */
  private async processReconciliation(
    invoices: any[],
    payments: any[]
  ): Promise<ReconciliationSummaryDto> {
    const summary: ReconciliationSummaryDto = {
      totalInvoices: invoices.length,
      totalPayments: payments.length,
      totalInvoiceAmount: 0,
      totalPaymentAmount: 0,
      totalDiscrepancyAmount: 0,
      discrepancies: []
    };

    // Map to track payments by invoice ID
    const paymentsByInvoice = new Map<string, any[]>();
    
    // Process all payments
    payments.forEach(payment => {
      summary.totalPaymentAmount += payment.amount;
      
      if (!paymentsByInvoice.has(payment.invoiceId)) {
        paymentsByInvoice.set(payment.invoiceId, []);
      }
      paymentsByInvoice.get(payment.invoiceId)?.push(payment);
    });

    // Process all invoices
    for (const invoice of invoices) {
      const invoiceTotal = invoice.total;
      summary.totalInvoiceAmount += invoiceTotal;

      const invoicePayments = paymentsByInvoice.get(invoice.id) || [];
      const paidAmount = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
      
      // Check for discrepancies
      if (Math.abs(paidAmount - invoiceTotal) > 0.01) {
        const discrepancy: DiscrepancyDto = {
          type: 'AMOUNT_MISMATCH',
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          expectedAmount: invoiceTotal,
          actualAmount: paidAmount,
          date: new Date()
        };
        
        summary.discrepancies.push(discrepancy);
        summary.totalDiscrepancyAmount += Math.abs(paidAmount - invoiceTotal);
      }
      
      // Remove processed invoice from map
      paymentsByInvoice.delete(invoice.id);
    }

    // Any remaining payments in the map are orphaned (no matching invoice)
    for (const [invoiceId, orphanPayments] of paymentsByInvoice.entries()) {
      for (const payment of orphanPayments) {
        const discrepancy: DiscrepancyDto = {
          type: 'ORPHAN_PAYMENT',
          paymentId: payment.id,
          actualAmount: payment.amount,
          date: payment.createdAt
        };
        
        summary.discrepancies.push(discrepancy);
        summary.totalDiscrepancyAmount += payment.amount;
      }
    }

    return summary;
  }

  /**
   * Get reconciliation report by ID
   */
  async getReport(id: string): Promise<ReconciliationReportResponseDto> {
    const report = await this.prisma.reconciliationReport.findUnique({
      where: { id }
    });

    if (!report) {
      throw new Error(`Report with ID ${id} not found`);
    }

    return this.mapToResponseDto(report, report.summary as unknown as ReconciliationSummaryDto);
  }

  /**
   * List reconciliation reports for a business
   */
  async listReports(
    businessId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: ReconciliationReportResponseDto[], total: number }> {
    const [reports, total] = await Promise.all([
      this.prisma.reconciliationReport.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.reconciliationReport.count({ where: { businessId } })
    ]);

    return {
      data: reports.map(r => this.mapToResponseDto(r, r.summary as unknown as ReconciliationSummaryDto)),
      total
    };
  }

  /**
   * Generate CSV report
   */
  async generateCsvReport(reportId: string, res: Response): Promise<void> {
    const report = await this.prisma.reconciliationReport.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      throw new Error(`Report with ID ${reportId} not found`);
    }

    const summary = report.summary as unknown as ReconciliationSummaryDto;
    const rows = [
      ['Reconciliation Report', `From ${report.fromDate.toISOString()} to ${report.toDate.toISOString()}`],
      ['Total Invoices', summary.totalInvoices],
      ['Total Payments', summary.totalPayments],
      ['Total Invoice Amount', summary.totalInvoiceAmount],
      ['Total Payment Amount', summary.totalPaymentAmount],
      ['Total Discrepancy Amount', summary.totalDiscrepancyAmount],
      [],
      ['Discrepancies', '', '', '', ''],
      ['Type', 'Invoice #', 'Expected', 'Actual', 'Difference', 'Date']
    ];

    for (const d of summary.discrepancies) {
      rows.push([
        d.type,
        d.invoiceNumber || 'N/A',
        d.expectedAmount?.toFixed(2) || 'N/A',
        d.actualAmount?.toFixed(2) || 'N/A',
        d.expectedAmount ? (d.actualAmount - d.expectedAmount).toFixed(2) : 'N/A',
        d.date.toISOString()
      ]);
    }

    // Convert to CSV
    const csvContent = rows.map(row => row.join(',')).join('\n');
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=reconciliation-${reportId}.csv`);
    
    // Create a readable stream and pipe it to the response
    const stream = new Readable();
    stream.push(csvContent);
    stream.push(null); // End the stream
    
    return new Promise((resolve, reject) => {
      stream.pipe(res).on('finish', resolve).on('error', reject);
    });
  }

  /**
   * Generate Excel report
   */
  async generateExcelReport(reportId: string, res: Response): Promise<void> {
    const report = await this.prisma.reconciliationReport.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      throw new Error(`Report with ID ${reportId} not found`);
    }

    const summary = report.summary as unknown as ReconciliationSummaryDto;
    
    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reconciliation Report');
    
    // Add summary
    worksheet.addRow(['Reconciliation Report']);
    worksheet.addRow([`From ${report.fromDate.toISOString()} to ${report.toDate.toISOString()}`]);
    worksheet.addRow([]);
    
    // Add summary table
    const summaryTable = [
      ['Total Invoices', summary.totalInvoices],
      ['Total Payments', summary.totalPayments],
      ['Total Invoice Amount', summary.totalInvoiceAmount],
      ['Total Payment Amount', summary.totalPaymentAmount],
      ['Total Discrepancy Amount', summary.totalDiscrepancyAmount]
    ];
    
    summaryTable.forEach(row => worksheet.addRow(row));
    
    // Add discrepancies if any
    if (summary.discrepancies.length > 0) {
      worksheet.addRow([]);
      worksheet.addRow(['Discrepancies']);
      
      const headers = ['Type', 'Invoice #', 'Expected', 'Actual', 'Difference', 'Date'];
      worksheet.addRow(headers);
      
      for (const d of summary.discrepancies) {
        worksheet.addRow([
          d.type,
          d.invoiceNumber || 'N/A',
          d.expectedAmount?.toFixed(2) || 'N/A',
          d.actualAmount?.toFixed(2) || 'N/A',
          d.expectedAmount ? (d.actualAmount - d.expectedAmount).toFixed(2) : 'N/A',
          d.date.toISOString()
        ]);
      }
    }
    
    // Style the worksheet
    worksheet.getColumn(1).width = 20;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 15;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 15;
    worksheet.getColumn(6).width = 25;
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reconciliation-${reportId}.xlsx`);
    
    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  }

  /**
   * Send email notification for reconciliation report
   */
  private async sendNotification(
    report: any,
    summary: ReconciliationSummaryDto,
    recipients: string[]
  ): Promise<void> {
    try {
      const subject = `Reconciliation Report - ${report.businessId} - ${report.status}`;
      const discrepancies = summary.discrepancies.length;
      
      await this.mailer.sendMail({
        to: recipients.join(','),
        subject,
        template: 'reconciliation-alert',
        context: {
          report,
          summary: {
            ...summary,
            discrepancies: undefined, // Exclude large discrepancies array from email context
            hasDiscrepancies: discrepancies > 0,
            discrepanciesCount: discrepancies
          },
          reportUrl: `${this.config.get('APP_URL')}/reconciliation/reports/${report.id}`
        }
      });
    } catch (error) {
      this.logger.error(`Failed to send notification email: ${error.message}`, error.stack);
    }
  }

  /**
   * Scheduled job to run reconciliation for all businesses
   * Runs every day at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledReconciliation() {
    this.logger.log('Starting scheduled reconciliation for all businesses');
    
    const businesses = await this.prisma.business.findMany({
      where: { isActive: true },
      include: {
        members: {
          where: { role: 'ADMIN' },
          include: { user: true }
        }
      }
    });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999));

    for (const business of businesses) {
      try {
        const adminEmails = business.members
          .filter(member => member.user.email)
          .map(member => member.user.email);

        if (adminEmails.length === 0) {
          this.logger.warn(`No admin emails found for business ${business.id}`);
          continue;
        }

        await this.runReconciliation(
          business.id,
          startOfYesterday,
          endOfYesterday,
          'system',
          adminEmails
        );

        this.logger.log(`Completed reconciliation for business ${business.id}`);
      } catch (error) {
        this.logger.error(`Failed to reconcile business ${business.id}: ${error.message}`, error.stack);
      }
    }
  }

  /**
   * Map database model to response DTO
   */
  private mapToResponseDto(
    report: any,
    summary: ReconciliationSummaryDto
  ): ReconciliationReportResponseDto {
    return {
      id: report.id,
      businessId: report.businessId,
      reportDate: report.reportDate,
      fromDate: report.fromDate,
      toDate: report.toDate,
      status: report.status,
      summary: summary,
      createdBy: report.createdBy,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt
    };
  }
}
