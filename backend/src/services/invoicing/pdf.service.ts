import puppeteer from 'puppeteer';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export class PDFService {
  async generateInvoicePDF(invoiceId: string): Promise<Buffer> {
    try {
      // Get invoice data
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          customer: true,
          lines: {
            include: {
              product: true
            }
          },
          payments: true
        }
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Generate HTML
      const html = this.generateInvoiceHTML(invoice);

      // Launch Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      
      // Set content and wait for it to load
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });

      await browser.close();

      return pdfBuffer;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  async saveInvoicePDF(invoiceId: string): Promise<string> {
    try {
      const pdfBuffer = await this.generateInvoicePDF(invoiceId);
      
      // Create temp directory if it doesn't exist
      const tempDir = path.join(process.cwd(), 'server', 'tmp', 'invoices');
      await fs.mkdir(tempDir, { recursive: true });

      // Save PDF
      const filename = `invoice-${invoiceId}-${Date.now()}.pdf`;
      const filepath = path.join(tempDir, filename);
      await fs.writeFile(filepath, pdfBuffer);

      return filepath;
    } catch (error) {
      console.error('Error saving PDF:', error);
      throw error;
    }
  }

  private generateInvoiceHTML(invoice: any): string {
    const customer = invoice.customer;
    const lines = invoice.lines;
    const payments = invoice.payments;

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: invoice.currency || 'CAD'
      }).format(amount / 100);
    };

    // Format date
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('en-CA');
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoiceNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            line-height: 1.4;
        }
        
        .invoice {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #1E4DB7;
        }
        
        .company-info h1 {
            color: #1E4DB7;
            font-size: 28px;
            margin-bottom: 5px;
        }
        
        .company-info p {
            color: #666;
            font-size: 14px;
        }
        
        .invoice-details {
            text-align: right;
        }
        
        .invoice-details h2 {
            color: #1E4DB7;
            font-size: 24px;
            margin-bottom: 10px;
        }
        
        .invoice-meta {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .invoice-meta div {
            margin-bottom: 5px;
        }
        
        .invoice-meta strong {
            color: #1E4DB7;
            display: inline-block;
            width: 100px;
        }
        
        .addresses {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            gap: 20px;
        }
        
        .address-box {
            flex: 1;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
        }
        
        .address-box h3 {
            color: #1E4DB7;
            font-size: 16px;
            margin-bottom: 10px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        .items-table th {
            background: #1E4DB7;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        
        .items-table td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
        }
        
        .items-table tr:last-child td {
            border-bottom: none;
        }
        
        .text-right {
            text-align: right;
        }
        
        .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
        }
        
        .totals-box {
            width: 300px;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
        }
        
        .totals-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        
        .totals-row.grand-total {
            font-size: 18px;
            font-weight: bold;
            color: #1E4DB7;
            border-top: 2px solid #1E4DB7;
            padding-top: 10px;
        }
        
        .payments {
            margin-bottom: 30px;
        }
        
        .payments h3 {
            color: #1E4DB7;
            margin-bottom: 15px;
        }
        
        .payment-item {
            background: #f8f9fa;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
        }
        
        .notes {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .notes h3 {
            color: #1E4DB7;
            margin-bottom: 10px;
        }
        
        .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
        }
        
        .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .status.draft { background: #ffc107; color: #856404; }
        .status.sent { background: #17a2b8; color: white; }
        .status.paid { background: #28a745; color: white; }
        .status.overdue { background: #dc3545; color: white; }
        .status.voided { background: #6c757d; color: white; }
    </style>
</head>
<body>
    <div class="invoice">
        <div class="header">
            <div class="company-info">
                <h1>AccuBooks</h1>
                <p>Enterprise Financial Management</p>
                <p>123 Business Ave, Suite 100</p>
                <p>Vancouver, BC V6B 2W1</p>
                <p>Canada</p>
                <p>contact@accubooks.com</p>
            </div>
            <div class="invoice-details">
                <h2>INVOICE</h2>
                <div class="status ${invoice.status.toLowerCase()}">${invoice.status}</div>
            </div>
        </div>

        <div class="invoice-meta">
            <div><strong>Invoice #:</strong> ${invoice.invoiceNumber}</div>
            <div><strong>Issue Date:</strong> ${formatDate(invoice.issueDate)}</div>
            <div><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</div>
            <div><strong>Currency:</strong> ${invoice.currency}</div>
        </div>

        <div class="addresses">
            <div class="address-box">
                <h3>Bill To:</h3>
                <p>${customer.companyName || ''}</p>
                <p>${customer.firstName || ''} ${customer.lastName || ''}</p>
                <p>${customer.email || ''}</p>
                <p>${customer.phone || ''}</p>
                ${customer.address ? `
                <p>
                    ${JSON.parse(customer.address)?.street || ''}<br>
                    ${JSON.parse(customer.address)?.city || ''}, ${JSON.parse(customer.address)?.province || ''}<br>
                    ${JSON.parse(customer.address)?.postalCode || ''}
                </p>
                ` : ''}
            </div>
            <div class="address-box">
                <h3>Payment Status:</h3>
                <p><strong>Total Amount:</strong> ${formatCurrency(invoice.total)}</p>
                <p><strong>Amount Paid:</strong> ${formatCurrency(payments.reduce((sum: number, p: any) => sum + p.amount, 0))}</p>
                <p><strong>Balance Due:</strong> ${formatCurrency(invoice.total - payments.reduce((sum: number, p: any) => sum + p.amount, 0))}</p>
            </div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Subtotal</th>
                    <th>Tax</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${lines.map((line: any) => `
                <tr>
                    <td>${line.description}</td>
                    <td>${line.qty}</td>
                    <td>${formatCurrency(line.unitPrice)}</td>
                    <td>${formatCurrency(line.lineSubtotal)}</td>
                    <td>${formatCurrency(line.lineTax)}</td>
                    <td class="text-right">${formatCurrency(line.lineTotal)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="totals">
            <div class="totals-box">
                <div class="totals-row">
                    <span>Subtotal:</span>
                    <span>${formatCurrency(invoice.subtotal)}</span>
                </div>
                <div class="totals-row">
                    <span>Tax Total:</span>
                    <span>${formatCurrency(invoice.taxTotal)}</span>
                </div>
                <div class="totals-row grand-total">
                    <span>Total:</span>
                    <span>${formatCurrency(invoice.total)}</span>
                </div>
            </div>
        </div>

        ${payments.length > 0 ? `
        <div class="payments">
            <h3>Payment History</h3>
            ${payments.map((payment: any) => `
            <div class="payment-item">
                <div>
                    <strong>${payment.method}</strong> - ${formatDate(payment.paidAt)}
                    ${payment.transactionRef ? `<br>Ref: ${payment.transactionRef}` : ''}
                </div>
                <div><strong>${formatCurrency(payment.amount)}</strong></div>
            </div>
            `).join('')}
        </div>
        ` : ''}

        ${invoice.notes ? `
        <div class="notes">
            <h3>Notes</h3>
            <p>${invoice.notes}</p>
        </div>
        ` : ''}

        <div class="footer">
            <p>Thank you for your business! This invoice was generated by AccuBooks Enterprise Financial Management.</p>
            <p>Page 1 of 1 | Generated on ${formatDate(new Date())}</p>
        </div>
    </div>
</body>
</html>`;
  }
}

export const pdfService = new PDFService();
