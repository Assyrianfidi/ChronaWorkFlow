import { 
  Injectable, 
  BadRequestException, 
  NotFoundException, 
  Logger,
  Inject,
  forwardRef
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoiceService } from '../invoice/invoice.service';
import { BusinessService } from '../business/business.service';
import { ClientService } from '../client/client.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateRefundDto } from './dto/create-refund.dto';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private stripe: Stripe;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    @Inject(forwardRef(() => InvoiceService))
    private invoiceService: InvoiceService,
    @Inject(forwardRef(() => BusinessService))
    private businessService: BusinessService,
    @Inject(forwardRef(() => ClientService))
    private clientService: ClientService,
  ) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16',
    });
  }

  async createCheckoutSession(userId: string, createPaymentDto: CreatePaymentDto) {
    // Get and validate the invoice
    const invoice = await this.invoiceService.findOne(userId, createPaymentDto.invoiceId);
    
    if (invoice.status === 'paid') {
      throw new BadRequestException('Invoice is already paid');
    }

    // Create Stripe Checkout Session
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: invoice.currency?.toLowerCase() || 'usd',
            product_data: {
              name: `Invoice #${invoice.invoiceNumber}`,
              description: `Payment for invoice ${invoice.invoiceNumber}`,
            },
            unit_amount: Math.round((createPaymentDto.amount || invoice.total) * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        invoiceId: invoice.id,
        businessId: invoice.businessId,
        clientId: invoice.clientId,
      },
      customer_email: createPaymentDto.customerEmail,
      success_url: createPaymentDto.successUrl,
      cancel_url: createPaymentDto.cancelUrl,
    });

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        stripePaymentId: session.id,
        invoiceId: invoice.id,
        businessId: invoice.businessId,
        clientId: invoice.clientId,
        amount: createPaymentDto.amount || invoice.total,
        currency: invoice.currency || 'usd',
        status: 'pending',
        paymentMethod: 'stripe_checkout',
        rawResponse: session as any,
      },
    });

    return {
      id: payment.id,
      url: session.url,
      amount: payment.amount,
      currency: payment.currency,
    };
  }

  async handleWebhook(signature: string, body: Buffer, endpointSecret: string) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException('Webhook signature verification failed');
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;
        default:
          this.logger.debug(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error handling webhook event ${event.type}:`, error);
      throw error;
    }

    return { received: true };
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const invoiceId = session.metadata?.invoiceId;
    const businessId = session.metadata?.businessId;
    const clientId = session.metadata?.clientId;
    const paymentIntentId = session.payment_intent as string;

    if (!invoiceId || !businessId || !clientId) {
      throw new Error('Missing required metadata in checkout session');
    }

    // Find or create payment record
    let payment = await this.prisma.payment.findFirst({
      where: { stripePaymentId: paymentIntentId },
    });

    if (!payment) {
      payment = await this.prisma.payment.create({
        data: {
          stripePaymentId: paymentIntentId,
          invoiceId,
          businessId,
          clientId,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency || 'usd',
          status: 'succeeded',
          paymentMethod: session.payment_method_types?.[0] || 'card',
          rawResponse: session as any,
        },
      });
    } else {
      payment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: { 
          status: 'succeeded',
          rawResponse: { ...(payment.rawResponse as any), ...session },
        },
      });
    }

    // Create ledger entry
    await this.prisma.ledgerEntry.create({
      data: {
        businessId,
        type: 'credit',
        amount: payment.amount,
        currency: payment.currency,
        source: 'invoice_payment',
        referenceId: payment.id,
        meta: {
          stripePaymentIntent: paymentIntentId,
          stripeSessionId: session.id,
        },
      },
    });

    // Update invoice status
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { 
        status: 'paid',
        paidDate: new Date(),
      },
    });

    return payment;
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    // Handle payment intent success if needed
    // This is similar to handleCheckoutSessionCompleted but for direct payment intents
    return paymentIntent;
  }

  private async handleChargeRefunded(charge: Stripe.Charge) {
    const payment = await this.prisma.payment.findFirst({
      where: { stripePaymentId: charge.payment_intent as string },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Update payment status
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { 
        status: 'refunded',
        rawResponse: { ...(payment.rawResponse as any), refunded: true },
      },
    });

    // Create ledger entry for refund
    await this.prisma.ledgerEntry.create({
      data: {
        businessId: payment.businessId,
        type: 'debit',
        amount: payment.amount,
        currency: payment.currency,
        source: 'refund',
        referenceId: payment.id,
        meta: {
          stripeChargeId: charge.id,
          refundId: charge.refunds?.data?.[0]?.id,
        },
      },
    });

    // Update invoice status
    await this.prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: { status: 'refunded' },
    });

    return payment;
  }

  async createRefund(userId: string, createRefundDto: CreateRefundDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: createRefundDto.paymentId },
      include: { invoice: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Verify user has access to this payment's business
    await this.businessService.findOne(userId, payment.businessId);

    if (payment.status !== 'succeeded') {
      throw new BadRequestException('Only successful payments can be refunded');
    }

    const refundAmount = createRefundDto.amount || payment.amount;

    // Create Stripe refund
    const refund = await this.stripe.refunds.create({
      payment_intent: payment.stripePaymentId,
      amount: Math.round(refundAmount * 100),
      reason: 'requested_by_customer',
      metadata: {
        refundReason: createRefundDto.reason || 'No reason provided',
        processedBy: userId,
      },
    });

    // Update payment status
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { 
        status: 'refunded',
        rawResponse: { ...(payment.rawResponse as any), refund },
      },
    });

    // Create ledger entry for refund
    await this.prisma.ledgerEntry.create({
      data: {
        businessId: payment.businessId,
        type: 'debit',
        amount: refundAmount,
        currency: payment.currency,
        source: 'refund',
        referenceId: payment.id,
        meta: {
          stripeRefundId: refund.id,
          reason: createRefundDto.reason,
        },
      },
    });

    // Update invoice status
    await this.prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: { status: 'refunded' },
    });

    return {
      id: refund.id,
      amount: refund.amount / 100,
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason,
      createdAt: new Date(refund.created * 1000),
    };
  }

  async getPayments(businessId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { businessId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          invoice: {
            select: {
              invoiceNumber: true,
              status: true,
            },
          },
          client: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.payment.count({ where: { businessId } }),
    ]);

    return {
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async reconcilePayments(businessId: string, startDate: Date, endDate: Date) {
    const [payments, refunds, ledgerEntries] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          businessId,
          status: 'succeeded',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          amount: true,
          currency: true,
          createdAt: true,
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
        },
      }),
      this.prisma.payment.findMany({
        where: {
          businessId,
          status: 'refunded',
          updatedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          amount: true,
          currency: true,
          updatedAt: true,
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
        },
      }),
      this.prisma.ledgerEntry.findMany({
        where: {
          businessId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalRefunded = refunds.reduce((sum, r) => sum + r.amount, 0);

    return {
      period: { startDate, endDate },
      summary: {
        totalReceived,
        totalRefunded,
        netAmount: totalReceived - totalRefunded,
        paymentCount: payments.length,
        refundCount: refunds.length,
      },
      payments,
      refunds,
      ledgerEntries,
    };
  }
}
