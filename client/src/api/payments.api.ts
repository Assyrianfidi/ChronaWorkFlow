import api from './index';
import type { ApiResponse } from './index';

export interface Payment {
  id: string;
  companyId: string;
  invoiceId: string;
  amount: string;
  date: string;
  paymentMethod: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'other';
  referenceNumber?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  transactionId?: string;
}

export interface CreatePaymentRequest {
  companyId: string;
  invoiceId: string;
  amount: string;
  date: string;
  paymentMethod: Payment['paymentMethod'];
  referenceNumber?: string;
  notes?: string;
}

export interface PaymentListParams {
  companyId: string;
  invoiceId?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export const paymentsApi = {
  /**
   * List payments for a company
   */
  list: (params: PaymentListParams) =>
    api.get<ApiResponse<{ payments: Payment[]; total: number; page: number; totalPages: number }>>(
      '/payments',
      { params }
    ),

  /**
   * Get a single payment by ID
   */
  get: (id: string, companyId: string) =>
    api.get<ApiResponse<Payment>>(`/payments/${id}`, {
      params: { companyId },
    }),

  /**
   * Create a new payment (posts to ledger)
   */
  create: (data: CreatePaymentRequest, idempotencyKey: string) =>
    api.post<ApiResponse<{ payment: Payment; replayed: boolean }>>(
      '/payments',
      data,
      {
        headers: { 'Idempotency-Key': idempotencyKey },
      }
    ),

  /**
   * Delete a payment
   */
  delete: (id: string, companyId: string) =>
    api.delete<ApiResponse<void>>(`/payments/${id}`, {
      params: { companyId },
    }),
};
