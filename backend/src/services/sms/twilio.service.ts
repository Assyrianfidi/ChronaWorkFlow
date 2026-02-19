// import twilio from 'twilio'; // Package not installed - stub implementation below
import { logger } from '../../utils/logger.js';

export interface SMSData {
  to: string;
  message: string;
  metadata?: Record<string, string>;
}

export class TwilioService {
  private client: any; // Stub - twilio package not installed
  private fromNumber: string;
  private accountSid: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    const authToken = process.env.TWILIO_AUTH_TOKEN || 'a3781904b3178d25b43fe61e3ef667e1';
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '+12708172249';

    if (!this.accountSid || !authToken) {
      logger.warn('Twilio credentials not configured - SMS service disabled');
      this.client = null as any;
      return;
    }

    // this.client = twilio(accountSid, authToken); // Package not installed
    this.client = null as any; // Stub implementation
    logger.info('Twilio SMS service initialized', { fromNumber: this.fromNumber });
  }

  async sendSMS(data: SMSData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.client) {
        return {
          success: false,
          error: 'Twilio not configured',
        };
      }

      const message = await this.client.messages.create({
        body: data.message,
        from: this.fromNumber,
        to: data.to,
      });

      logger.info('SMS sent successfully', { 
        messageId: message.sid, 
        to: data.to.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') // Mask phone number
      });

      return { 
        success: true, 
        messageId: message.sid 
      };
    } catch (error: any) {
      logger.error('Error sending SMS', { 
        error: (error as Error).message,
        to: data.to.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendInvoiceNotification(
    phoneNumber: string,
    invoiceNumber: string,
    amount: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = `AccuBooks: Invoice ${invoiceNumber} for ${amount} has been sent. View and pay at https://app.accubooks.com/invoices/${invoiceNumber}`;

    return this.sendSMS({
      to: phoneNumber,
      message,
      metadata: {
        type: 'invoice_notification',
        invoiceNumber,
      },
    });
  }

  async sendPaymentConfirmation(
    phoneNumber: string,
    invoiceNumber: string,
    amount: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = `AccuBooks: Payment of ${amount} received for Invoice ${invoiceNumber}. Thank you!`;

    return this.sendSMS({
      to: phoneNumber,
      message,
      metadata: {
        type: 'payment_confirmation',
        invoiceNumber,
      },
    });
  }

  async sendOverdueAlert(
    phoneNumber: string,
    invoiceNumber: string,
    daysOverdue: number
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = `AccuBooks: Invoice ${invoiceNumber} is ${daysOverdue} days overdue. Please submit payment at your earliest convenience.`;

    return this.sendSMS({
      to: phoneNumber,
      message,
      metadata: {
        type: 'overdue_alert',
        invoiceNumber,
        daysOverdue: daysOverdue.toString(),
      },
    });
  }

  async sendOTP(
    phoneNumber: string,
    code: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = `Your AccuBooks verification code is: ${code}. Valid for 10 minutes.`;

    return this.sendSMS({
      to: phoneNumber,
      message,
      metadata: {
        type: 'otp',
      },
    });
  }
}

export const twilioService = new TwilioService();
