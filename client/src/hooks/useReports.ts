
declare global {
  interface Window {
    [key: string]: any;
  }
}

import React from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
// @ts-ignore
  useQueryClient as useReactQueryClient,
  UseMutationOptions,
  UseMutationResult,
  QueryKey,
  InvalidateQueryFilters,
  QueryFilters,
  keepPreviousData,
} from "@tanstack/react-query";
// @ts-ignore
import { reportService } from '../services/reportService.js.js';
// @ts-ignore
import { Report, ReportFormData, ReportListResponse } from '../types/report.js.js';
// @ts-ignore
import { QueryParams } from '../types/common.js.js';
// @ts-ignore
import { useToast } from '../components/ui/use-toast.js.js';

const REPORT_QUERY_KEYS = {
  all: ["reports"],
  lists: () => [...REPORT_QUERY_KEYS.all, "list"],
  list: (filters: QueryParams) => [
    ...REPORT_QUERY_KEYS.lists(),
    { ...filters },
  ],
  details: () => [...REPORT_QUERY_KEYS.all, "detail"],
  detail: (id: string) => [...REPORT_QUERY_KEYS.details(), id],
} as const;

// Hook to fetch a list of reports
export const useReports = (
  params: QueryParams = {},
  options?: Omit<UseQueryOptions<ReportListResponse>, "queryKey" | "queryFn">,
) => {
  return useQuery<ReportListResponse>({
    queryKey: REPORT_QUERY_KEYS.list(params),
    queryFn: () => reportService.getReports(params),
    placeholderData: keepPreviousData,
    ...options,
  });
};

// Hook to fetch a single report by ID
export const useReport = (
  id: string,
  options?: Omit<UseQueryOptions<Report>, "queryKey" | "queryFn">,
) => {
  return useQuery<Report>({
    queryKey: REPORT_QUERY_KEYS.detail(id),
    queryFn: () => reportService.getReportById(id),
    enabled: !!id,
    ...options,
  });
};

// Hook to create a new report
export const useCreateReport = (): UseMutationResult<
  Report,
  Error,
  ReportFormData
> => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<Report, Error, ReportFormData>({
    mutationFn: (data: ReportFormData) => reportService.createReport(data),
    onSuccess: () => {
      // Invalidate and refetch the reports list
      queryClient.invalidateQueries({
        queryKey: REPORT_QUERY_KEYS.lists(),
// @ts-ignore
      } as InvalidateQueryFilters);
      toast({
        title: "Success",
        description: "Report created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create report",
        variant: "destructive",
      });
    },
  });
};

// Hook to update an existing report
export const useUpdateReport = (): UseMutationResult<
  Report,
  Error,
  { id: string; data: Partial<ReportFormData> }
> => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<
    Report,
    Error,
    { id: string; data: Partial<ReportFormData> }
  >({
    mutationFn: ({ id, data }) => reportService.updateReport(id, data),
    onSuccess: (data, { id }) => {
      // Update the report in the cache
      queryClient.setQueryData(REPORT_QUERY_KEYS.detail(id), data);
      // Invalidate the reports list
      queryClient.invalidateQueries({
        queryKey: REPORT_QUERY_KEYS.lists(),
// @ts-ignore
      } as InvalidateQueryFilters);

      toast({
        title: "Success",
        description: "Report updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update report",
        variant: "destructive",
      });
    },
  });
};

// Hook to delete a report
export const useDeleteReport = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, Error, string>({
    mutationFn: (id: string) => reportService.deleteReport(id),
    onSuccess: (_, id) => {
      // Remove the report from the cache
      queryClient.removeQueries({
        queryKey: REPORT_QUERY_KEYS.detail(id),
// @ts-ignore
      } as QueryFilters);

      // Invalidate the reports list
      queryClient.invalidateQueries({
        queryKey: REPORT_QUERY_KEYS.lists(),
// @ts-ignore
      } as InvalidateQueryFilters);

      toast({
        title: "Success",
        description: "Report deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete report",
        variant: "destructive",
      });
    },
  });
};

// Hook to export a report
export const useExportReport = (): UseMutationResult<
  Blob,
  Error,
  { id: string; format: "pdf" | "csv" }
> => {
  const { toast } = useToast();

  return useMutation<Blob, Error, { id: string; format: "pdf" | "csv" }>({
    mutationFn: ({ id, format }) => reportService.exportReport(id, format),
    onSuccess: (data, { id, format }) => {
      // Create a download link and trigger download
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `report-${id}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast({
        title: "Success",
// @ts-ignore
        description: `Report exported as ${format.toUpperCase()} successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to export report",
        variant: "destructive",
      });
    },
  });
};
