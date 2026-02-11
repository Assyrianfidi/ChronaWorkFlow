import api from "./index";
import type { ApiResponse } from "./index";

export interface PayRun {
  id: string;
  companyId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
  status:
    | "draft"
    | "pending_approval"
    | "approved"
    | "processing"
    | "completed"
    | "cancelled";
  totalAmount: string;
  employeeCount: number;
  notes?: string;
  processedBy?: string;
  processedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  transactionId?: string;
}

export interface CreatePayRunRequest {
  companyId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
  totalAmount: string;
  employeeCount: number;
  notes?: string;
}

export interface ExecutePayRunRequest {
  targetStatus: "approved" | "processing" | "completed";
}

export interface PayRunListParams {
  companyId: string;
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export const payrollApi = {
  /**
   * List pay runs for a company
   */
  list: (params: PayRunListParams) =>
    api.get<
      ApiResponse<{
        payRuns: PayRun[];
        total: number;
        page: number;
        totalPages: number;
      }>
    >("/payroll/runs", { params }),

  /**
   * Get a single pay run by ID
   */
  get: (id: string, companyId: string) =>
    api.get<ApiResponse<PayRun>>(`/payroll/runs/${id}`, {
      params: { companyId },
    }),

  /**
   * Create a new pay run
   */
  create: (data: CreatePayRunRequest, idempotencyKey?: string) =>
    api.post<ApiResponse<PayRun>>("/payroll/runs", data, {
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
    }),

  /**
   * Execute a pay run (posts to ledger when completed)
   */
  execute: (
    id: string,
    companyId: string,
    data: ExecutePayRunRequest,
    idempotencyKey: string,
  ) =>
    api.post<ApiResponse<{ payRun: PayRun; replayed: boolean }>>(
      `/payroll/runs/${id}/execute`,
      { ...data, companyId },
      {
        headers: { "Idempotency-Key": idempotencyKey },
      },
    ),

  /**
   * Delete a pay run (draft only)
   */
  delete: (id: string, companyId: string) =>
    api.delete<ApiResponse<void>>(`/payroll/runs/${id}`, {
      params: { companyId },
    }),
};
