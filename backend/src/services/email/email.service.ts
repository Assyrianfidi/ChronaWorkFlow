import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "path";
import { PrismaClientSingleton } from '../lib/prisma';
const prisma = PrismaClientSingleton.getInstance();
import { pdfService } from "../invoicing/pdf.service";

// Fixed self-reference

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.setupTransporter();
  }

  private setupTransporter() {
    // Check if production email credentials are available
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    ) {
      // Production configuration
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log("✅ Email service configured with production SMTP");
    } else {
      // Development/stub configuration
      this.transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        auth: {
          user: "ethereal.user@ethereal.email",
          pass: "ethereal.pass",
        },
      });
      console.log("⚠️ Email service configured with development transport");
    }
  }

  async sendEmail(
    data: EmailData,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || "noreply@accubooks.com",
        to: data.to,
        subject: data.subject,
        html: data.html,
        attachments: data.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);

      // Save email to outbox for audit
      await this.saveEmailToOutbox({
        ...data,
        messageId: info.messageId,
        sentAt: new Date(),
        status: "sent",
      });

      console.log("✅ Email sent successfully:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Error sending email:", error);

      // Save failed email to outbox
      await this.saveEmailToOutbox({
        ...data,
        sentAt: new Date(),
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendInvoiceEmail(
    invoiceId: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Get invoice details
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          customer: true,
          lines: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      if (!invoice.customer.email) {
        throw new Error("Customer email not found");
      }

      // Generate PDF
      const pdfBuffer = await pdfService.generateInvoicePDF(invoiceId);

      // Generate email HTML
      const emailHtml = this.generateInvoiceEmailHTML(invoice);

      // Send email
      const result = await this.sendEmail({
        to: invoice.customer.email,
        subject: `Invoice ${invoice.invoiceNumber} from AccuBooks`,
        html: emailHtml,
        attachments: [
          {
            filename: `Invoice-${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });

      return result;
    } catch (error) {
      console.error("❌ Error sending invoice email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private generateInvoiceEmailHTML(invoice: any): string {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: invoice.currency || "CAD",
      }).format(amount / 100);
    };

    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString("en-CA");
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoiceNumber}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: #1E4DB7;
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 8px 8px;
        }
        .invoice-details {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        .detail-row:last-child {
            border-bottom: none;
            font-size: 18px;
            font-weight: bold;
            color: #1E4DB7;
        }
        .cta-button {
            display: inline-block;
            background: #0092D1;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>AccuBooks</h1>
        <p>Enterprise Financial Management</p>
    </div>

    <div class="content">
        <h2>Invoice ${invoice.invoiceNumber}</h2>
        <p>Dear ${invoice.customer.firstName || "Valued Customer"},</p>
        <p>Please find attached your invoice ${invoice.invoiceNumber} for your records.</p>

        <div class="invoice-details">
            <div class="detail-row">
                <span>Invoice Number:</span>
                <span>${invoice.invoiceNumber}</span>
            </div>
            <div class="detail-row">
                <span>Issue Date:</span>
                <span>${formatDate(invoice.issueDate)}</span>
            </div>
            <div class="detail-row">
                <span>Due Date:</span>
                <span>${formatDate(invoice.dueDate)}</span>
            </div>
            <div class="detail-row">
                <span>Total Amount:</span>
                <span>${formatCurrency(invoice.total)}</span>
            </div>
        </div>

        <p>The invoice is attached as a PDF for your convenience. Please review the details and ensure payment is made by the due date.</p>

        <div style="text-align: center;">
            <a href="#" class="cta-button">View Invoice Online</a>
        </div>

        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>

        <p>Thank you for your business!</p>

        <div class="footer">
            <p>AccuBooks Enterprise Financial Management</p>
            <p>123 Business Ave, Suite 100, Vancouver, BC V6B 2W1</p>
            <p>contact@accubooks.com | www.accubooks.com</p>
        </div>
    </div>
</body>
</html>`;
  }

  private async saveEmailToOutbox(emailData: any) {
    try {
      const outboxDir = path.join(process.cwd(), "devops", "email-outbox");
      await fs.mkdir(outboxDir, { recursive: true });

      const filename = `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.json`;
      const filepath = path.join(outboxDir, filename);

      await fs.writeFile(filepath, JSON.stringify(emailData, null, 2));
      console.log(`📧 Email saved to outbox: ${filename}`);
    } catch (error) {
      console.error("Error saving email to outbox:", error);
    }
  }

  async getEmailOutbox(): Promise<any[]> {
    try {
      const outboxDir = path.join(process.cwd(), "devops", "email-outbox");
      const files = await fs.readdir(outboxDir);

      const emails = [];
      for (const file of files) {
        if (file.endsWith(".json")) {
          const content = await fs.readFile(
            path.join(outboxDir, file),
            "utf-8",
          );
          emails.push(JSON.parse(content));
        }
      }

      return emails.sort(
        (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
      );
    } catch (error) {
      console.error("Error reading email outbox:", error);
      return [];
    }
  }

  async testEmailConfiguration(): Promise<{ success: boolean; details: any }> {
    try {
      const testEmail = {
        to: "test@example.com",
        subject: "AccuBooks Email Test",
        html: "<h1>Test Email</h1><p>This is a test email from AccuBooks.</p>",
      };

      const result = await this.sendEmail(testEmail);

      return {
        success: result.success,
        details: {
          messageId: result.messageId,
          error: result.error,
          smtpConfig: {
            host: process.env.SMTP_HOST || "ethereal.email",
            port: process.env.SMTP_PORT || "587",
            secure: process.env.SMTP_SECURE || "false",
            hasCredentials: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }
}

export const emailService = new EmailService();
