import { InvoiceStatus, PaymentMethod, Prisma } from "@prisma/client";
import { prisma } from "../../utils/prisma";

export interface CreatePaymentData {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  transactionRef?: string;
  metadata?: Prisma.InputJsonValue;
}

export class PaymentService {
  async recordPayment(data: CreatePaymentData) {
    try {
      // Get invoice details
      const invoice = await prisma.invoice.findUnique({
        where: { id: data.invoiceId },
        include: {
          client: true,
        },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      if (invoice.status === InvoiceStatus.PAID) {
        throw new Error("Invoice is already fully paid");
      }

      const totalPaidAgg = await prisma.payment.aggregate({
        where: { invoiceId: data.invoiceId },
        _sum: { amount: true },
      });
      const totalPaid = totalPaidAgg._sum.amount ?? 0;
      const newTotalPaid = totalPaid + data.amount;

      const invoiceTotal = invoice.totalAmount.toNumber();

      if (newTotalPaid > invoiceTotal) {
        throw new Error(
          `Payment amount exceeds invoice total. Remaining balance: $${(invoiceTotal - totalPaid) / 100}`,
        );
      }

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          invoiceId: data.invoiceId,
          amount: data.amount,
          method: data.method,
          transactionRef: data.transactionRef,
          metadata: data.metadata,
        },
      });

      // Update invoice status if fully paid
      let updatedStatus: InvoiceStatus = invoice.status as InvoiceStatus;
      if (newTotalPaid === invoiceTotal) {
        updatedStatus = InvoiceStatus.PAID;
        await this.createPaymentAccountingEntries(invoice, data.amount);
      } else if (newTotalPaid > 0 && invoice.status === InvoiceStatus.DRAFT) {
        updatedStatus = InvoiceStatus.SENT;
      }

      // Update invoice status
      await prisma.invoice.update({
        where: { id: data.invoiceId },
        data: {
          status: updatedStatus,
        },
      });

      return {
        payment,
        remainingBalance: invoiceTotal - newTotalPaid,
        isFullyPaid: newTotalPaid === invoiceTotal,
      };
    } catch (error) {
      console.error("Error recording payment:", error);
      throw error;
    }
  }

  async getPayments(invoiceId: string) {
    try {
      const payments = await prisma.payment.findMany({
        where: { invoiceId },
        orderBy: { paidAt: "desc" },
      });

      return payments;
    } catch (error) {
      console.error("Error getting payments:", error);
      throw error;
    }
  }

  async getPayment(id: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id },
      });

      if (!payment) {
        throw new Error("Payment not found");
      }

      return payment;
    } catch (error) {
      console.error("Error getting payment:", error);
      throw error;
    }
  }

  async updatePayment(id: string, data: Partial<CreatePaymentData>) {
    try {
      // Check if payment exists
      const existingPayment = await prisma.payment.findUnique({
        where: { id },
      });

      if (!existingPayment) {
        throw new Error("Payment not found");
      }

      // Update payment
      const updatedPayment = await prisma.payment.update({
        where: { id },
        data: {
          amount: data.amount,
          method: data.method,
          transactionRef: data.transactionRef,
          metadata: data.metadata,
        },
      });

      // Recalculate invoice status
      const invoice = await prisma.invoice.findUnique({
        where: { id: existingPayment.invoiceId },
        select: { status: true, totalAmount: true },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      const totalPaidAgg = await prisma.payment.aggregate({
        where: { invoiceId: existingPayment.invoiceId },
        _sum: { amount: true },
      });
      const totalPaid = totalPaidAgg._sum.amount ?? 0;
      const invoiceTotal = invoice.totalAmount.toNumber();

      let newStatus = invoice.status;
      if (totalPaid >= invoiceTotal) {
        newStatus = InvoiceStatus.PAID;
      } else if (totalPaid > 0 && invoice.status === InvoiceStatus.DRAFT) {
        newStatus = InvoiceStatus.SENT;
      } else if (totalPaid === 0) {
        newStatus = InvoiceStatus.DRAFT;
      }

      // Update invoice status
      await prisma.invoice.update({
        where: { id: existingPayment.invoiceId },
        data: { status: newStatus },
      });

      return updatedPayment;
    } catch (error) {
      console.error("Error updating payment:", error);
      throw error;
    }
  }

  async deletePayment(id: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id },
      });

      if (!payment) {
        throw new Error("Payment not found");
      }

      // Delete payment
      await prisma.payment.delete({
        where: { id },
      });

      // Recalculate invoice status
      const invoice = await prisma.invoice.findUnique({
        where: { id: payment.invoiceId },
        select: { status: true, totalAmount: true },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      const totalPaidAgg = await prisma.payment.aggregate({
        where: { invoiceId: payment.invoiceId },
        _sum: { amount: true },
      });
      const totalPaid = totalPaidAgg._sum.amount ?? 0;
      const invoiceTotal = invoice.totalAmount.toNumber();

      let newStatus: InvoiceStatus = InvoiceStatus.DRAFT;
      if (totalPaid >= invoiceTotal) {
        newStatus = InvoiceStatus.PAID;
      } else if (totalPaid > 0) {
        newStatus = InvoiceStatus.SENT;
      }

      // Update invoice status
      await prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: { status: newStatus },
      });

      return { deleted: true, newStatus };
    } catch (error) {
      console.error("Error deleting payment:", error);
      throw error;
    }
  }

  private async createPaymentAccountingEntries(
    invoice: { id: string; invoiceNumber: string; client?: { name: string } | null },
    paymentAmount: number,
  ) {
    try {
      // Create accounting entries for payment
      // Debit: Cash/Bank (asset increases)
      // Credit: Accounts Receivable (asset decreases)

      await prisma.accountEntry.createMany({
        data: [
          {
            refId: invoice.id,
            refType: "PAYMENT",
            debitAccount: "1000", // Cash/Bank
            creditAccount: "1200", // Accounts Receivable
            amount: paymentAmount,
            description: `Payment for Invoice ${invoice.invoiceNumber}${invoice.client?.name ? ` - ${invoice.client.name}` : ""}`,
          },
        ],
      });
    } catch (error) {
      console.error("Error creating payment accounting entries:", error);
      throw error;
    }
  }

  async getPaymentSummary(invoiceId: string) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        select: {
          id: true,
          invoiceNumber: true,
          totalAmount: true,
          status: true,
        },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      const payments = await prisma.payment.findMany({
        where: { invoiceId },
        orderBy: { paidAt: "desc" },
      });

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const invoiceTotal = invoice.totalAmount.toNumber();
      const remainingBalance = invoiceTotal - totalPaid;

      return {
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoiceTotal,
        totalPaid,
        remainingBalance,
        paymentCount: payments.length,
        isFullyPaid: remainingBalance === 0,
        status: invoice.status,
        payments,
      };
    } catch (error) {
      console.error("Error getting payment summary:", error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
