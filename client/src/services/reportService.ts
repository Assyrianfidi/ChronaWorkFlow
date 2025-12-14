import { Report, ReportFormData, ReportListResponse } from '../types/report.js';
import api from '../lib/api.js';
import { QueryParams } from '../types/common.js';

const REPORT_ENDPOINT = "/reports";

export const reportService = {
  /**
   * Fetch all reports with pagination and filtering
   */
  async getReports(params?: QueryParams): Promise<ReportListResponse> {
    try {
      const response = await api.get<ReportListResponse>(REPORT_ENDPOINT, {
        params,
      });
      return response.data;
    } catch (error) {
      throw new Error("Failed to fetch reports");
    }
  },

  /**
   * Fetch a single report by ID
   */
  async getReportById(id: string): Promise<Report> {
    try {
      const response = await api.get<{ data: Report }>(
        `${REPORT_ENDPOINT}/${id}`,
      );
      return response.data.data;
    } catch (error) {
      throw new Error("Failed to fetch report");
    }
  },

  /**
   * Create a new report
   */
  async createReport(data: ReportFormData): Promise<Report> {
    try {
      const response = await api.post<{ data: Report }>(REPORT_ENDPOINT, data);
      return response.data.data;
    } catch (error) {
      throw new Error("Failed to create report");
    }
  },

  /**
   * Update an existing report
   */
  async updateReport(
    id: string,
    data: Partial<ReportFormData>,
  ): Promise<Report> {
    try {
      const response = await api.put<{ data: Report }>(
        `${REPORT_ENDPOINT}/${id}`,
        data,
      );
      return response.data.data;
    } catch (error) {
      throw new Error("Failed to update report");
    }
  },

  /**
   * Delete a report
   */
  async deleteReport(id: string): Promise<void> {
    try {
      await api.delete(`${REPORT_ENDPOINT}/${id}`);
    } catch (error) {
      throw new Error("Failed to delete report");
    }
  },

  /**
   * Export report as PDF
   */
  async exportReport(id: string, format: "pdf" | "csv" = "pdf"): Promise<Blob> {
    try {
      const response = await api.get<Blob>(`${REPORT_ENDPOINT}/${id}/export`, {
        params: { format },
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      throw new Error("Failed to export report");
    }
  },
};
