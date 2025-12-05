import { PrismaClient, InvoiceStatus, PaymentMethod } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreatePaymentData {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  transactionRef?: string;
  metadata?: any;
}

export class PaymentService {
  async recordPayment(data: CreatePaymentData) {
    try {
      // Get invoice details
      const invoice = await prisma.invoice.findUnique({
        where: { id: data.invoiceId },
        include: {
          payments: true,
          customer: true
        }
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === InvoiceStatus.PAID) {
        throw new Error('Invoice is already fully paid');
      }

      if (invoice.status === InvoiceStatus.VOIDED) {
        throw new Error('Cannot record payment for voided invoice');
      }

      // Calculate total paid so far
      const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
      const newTotalPaid = totalPaid + data.amount;

      if (newTotalPaid > invoice.total) {
        throw new Error(`Payment amount exceeds invoice total. Remaining balance: $${(invoice.total - totalPaid) / 100}`);
      }

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          invoiceId: data.invoiceId,
          amount: data.amount,
          method: data.method,
          transactionRef: data.transactionRef,
          metadata: data.metadata
        },
        include: {
          invoice: {
            include: {
              customer: true
            }
          }
        }
      });

      // Update invoice status if fully paid
      let updatedStatus = invoice.status;
      if (newTotalPaid === invoice.total) {
        updatedStatus = InvoiceStatus.PAID;
        await this.createPaymentAccountingEntries(invoice, data.amount);
      } else if (newTotalPaid > 0 && invoice.status === InvoiceStatus.DRAFT) {
        updatedStatus = InvoiceStatus.SENT;
      }

      // Update invoice status
      await prisma.invoice.update({
        where: { id: data.invoiceId },
        data: {
          status: updatedStatus
        }
      });

      return {
        payment,
        remainingBalance: invoice.total - newTotalPaid,
        isFullyPaid: newTotalPaid === invoice.total
      };
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  }

  async getPayments(invoiceId: string) {
    try {
      const payments = await prisma.payment.findMany({
        where: { invoiceId },
        orderBy: { paidAt: 'desc' },
        include: {
          invoice: {
            include: {
              customer: true
            }
          }
        }
      });

      return payments;
    } catch (error) {
      console.error('Error getting payments:', error);
      throw error;
    }
  }

  async getPayment(id: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
          invoice: {
            include: {
              customer: true,
              lines: true
            }
          }
        }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      return payment;
    } catch (error) {
      console.error('Error getting payment:', error);
      throw error;
    }
  }

  async updatePayment(id: string, data: Partial<CreatePaymentData>) {
    try {
      // Check if payment exists
      const existingPayment = await prisma.payment.findUnique({
        where: { id },
        include: {
          invoice: {
            include: {
              payments: true
            }
          }
        }
      });

      if (!existingPayment) {
        throw new Error('Payment not found');
      }

      // Update payment
      const updatedPayment = await prisma.payment.update({
        where: { id },
        data: {
          amount: data.amount,
          method: data.method,
          transactionRef: data.transactionRef,
          metadata: data.metadata
        },
        include: {
          invoice: {
            include: {
              customer: true,
              payments: true
            }
          }
        }
      });

      // Recalculate invoice status
      const totalPaid = updatedPayment.invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
      const invoiceTotal = updatedPayment.invoice.total;

      let newStatus = updatedPayment.invoice.status;
      if (totalPaid >= invoiceTotal) {
        newStatus = InvoiceStatus.PAID;
      } else if (totalPaid > 0 && updatedPayment.invoice.status === InvoiceStatus.DRAFT) {
        newStatus = InvoiceStatus.SENT;
      } else if (totalPaid === 0) {
        newStatus = InvoiceStatus.DRAFT;
      }

      // Update invoice status
      await prisma.invoice.update({
        where: { id: updatedPayment.invoiceId },
        data: { status: newStatus }
      });

      return updatedPayment;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  }

  async deletePayment(id: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
          invoice: {
            include: {
              payments: true
            }
          }
        }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Delete payment
      await prisma.payment.delete({
        where: { id }
      });

      // Recalculate invoice status
      const remainingPayments = payment.invoice.payments.filter(p => p.id !== id);
      const totalPaid = remainingPayments.reduce((sum, p) => sum + p.amount, 0);

      let newStatus = InvoiceStatus.DRAFT;
      if (totalPaid >= payment.invoice.total) {
        newStatus = InvoiceStatus.PAID;
      } else if (totalPaid > 0) {
        newStatus = InvoiceStatus.SENT;
      }

      // Update invoice status
      await prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: { status: newStatus }
      });

      return { deleted: true, newStatus };
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  }

  private async createPaymentAccountingEntries(invoice: any, paymentAmount: number) {
    try {
      // Create accounting entries for payment
      // Debit: Cash/Bank (asset increases)
      // Credit: Accounts Receivable (asset decreases)
      
      await prisma.accountEntry.createMany({
        data: [
          {
            refId: invoice.id,
            refType: 'PAYMENT',
            debitAccount: '1000', // Cash/Bank
            creditAccount: '1200', // Accounts Receivable
            amount: paymentAmount,
            description: `Payment for Invoice ${invoice.invoiceNumber} - ${invoice.customer.companyName || invoice.customer.firstName + ' ' + invoice.customer.lastName}`
          }
        ]
      });
    } catch (error) {
      console.error('Error creating payment accounting entries:', error);
      throw error;
    }
  }

  async getPaymentSummary(invoiceId: string) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          payments: {
            orderBy: { paidAt: 'desc' }
          }
        }
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
      const remainingBalance = invoice.total - totalPaid;

      return {
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.total,
        totalPaid,
        remainingBalance,
        paymentCount: invoice.payments.length,
        isFullyPaid: remainingBalance === 0,
        status: invoice.status,
        payments: invoice.payments
      };
    } catch (error) {
      console.error('Error getting payment summary:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
