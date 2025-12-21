import { z } from "zod";
import { reportFormSchema } from "../lib/validations/schemas";

// Base report type from the form schema
export type ReportFormData = z.infer<typeof reportFormSchema>;

// Report status type
export type ReportStatus = "pending" | "approved" | "rejected";

export interface ReportUserSummary {
  name: string;
}

export interface ReportAttachment {
  id: string;
  name: string;
}

// Extended report type with server-generated fields
export interface Report extends Omit<ReportFormData, "date" | "status"> {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  status: ReportStatus;
  date: string; // ISO date string from server
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  createdBy?: ReportUserSummary;
  notes?: string;
  attachments?: ReportAttachment[];
}

// Report list response with pagination
export interface ReportListResponse {
  data: Report[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Report filters
export interface ReportFilters {
  status?: Report["status"];
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  category?: string;
  search?: string;
}

// Report statistics
export interface ReportStats {
  total: number;
  totalAmount: number;
  byStatus: Array<{
    status: Report["status"];
    count: number;
    amount: number;
  }>;
  byCategory: Array<{
    category: string;
    count: number;
    amount: number;
  }>;
}

// Report export formats
export type ExportFormat = "pdf" | "csv" | "excel";

// Report update payload
export type UpdateReportPayload = Partial<Omit<ReportFormData, "date">> & {
  date?: string;
  status?: Report["status"];
  rejectionReason?: string;
};

// Report submission response
export interface ReportSubmissionResponse {
  success: boolean;
  data: Report;
  message?: string;
}
