import api from './index';
import type { ApiResponse } from './index';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  companyId: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  date: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  amountPaid: string;
  description?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  transactionId?: string;
}

export interface CreateInvoiceRequest {
  companyId: string;
  customerId: string;
  date: string;
  dueDate: string;
  subtotal: string;
  taxRate?: string;
  taxAmount?: string;
  total: string;
  description?: string;
  notes?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: string;
    amount: string;
  }>;
}

export interface UpdateInvoiceRequest {
  status?: Invoice['status'];
  dueDate?: string;
  notes?: string;
}

export interface FinalizeInvoiceRequest {
  targetStatus: 'sent' | 'issued' | 'approved' | 'finalized';
}

export interface InvoiceListParams {
  companyId: string;
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export const invoicesApi = {
  /**
   * List invoices for a company with optional filters
   */
  list: (params: InvoiceListParams) =>
    api.get<ApiResponse<{ invoices: Invoice[]; total: number; page: number; totalPages: number }>>(
      '/invoices',
      { params }
    ),

  /**
   * Get a single invoice by ID
   */
  get: (id: string, companyId: string) =>
    api.get<ApiResponse<Invoice>>(`/invoices/${id}`, {
      params: { companyId },
    }),

  /**
   * Create a new invoice
   */
  create: (data: CreateInvoiceRequest, idempotencyKey?: string) =>
    api.post<ApiResponse<Invoice>>('/invoices', data, {
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
    }),

  /**
   * Update an existing invoice (draft only)
   */
  update: (id: string, companyId: string, data: UpdateInvoiceRequest) =>
    api.put<ApiResponse<Invoice>>(`/invoices/${id}`, {
      ...data,
      companyId,
    }),

  /**
   * Finalize an invoice (posts to ledger)
   */
  finalize: (id: string, companyId: string, data: FinalizeInvoiceRequest, idempotencyKey: string) =>
    api.post<ApiResponse<{ invoice: Invoice; replayed: boolean }>>(
      `/invoices/${id}/finalize`,
      { ...data, companyId },
      {
        headers: { 'Idempotency-Key': idempotencyKey },
      }
    ),

  /**
   * Delete an invoice (draft only)
   */
  delete: (id: string, companyId: string) =>
    api.delete<ApiResponse<void>>(`/invoices/${id}`, {
      params: { companyId },
    }),

  /**
   * Get invoice statistics
   */
  getStats: (companyId: string) =>
    api.get<ApiResponse<{
      total: number;
      paid: number;
      pending: number;
      overdue: number;
      totalAmount: string;
      paidAmount: string;
      pendingAmount: string;
    }>>('/invoices/stats', {
      params: { companyId },
    }),
};
