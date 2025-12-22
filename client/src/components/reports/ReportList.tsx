declare global {
  interface Window {
    [key: string]: any;
  }
}

import React from "react";
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import Button from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  default as Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { useReports, useDeleteReport } from "@/hooks/useReports";
import { toast } from "@/components/ui/use-toast";
import { Plus, Search, Trash2, Edit, FileText } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Report, ReportStatus } from "@/types/report";

type ReportWithMeta = {
  data: Report[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export function ReportList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");

  // Fetch reports with pagination and filtering
  const { data, isLoading, isError } = useReports({
    search: searchTerm,
    status: statusFilter === "all" ? undefined : statusFilter,
    page: 1,
    limit: 10,
  });

  // Delete report mutation
  const { mutate: deleteReport, isPending: isDeleting } = useDeleteReport();

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      deleteReport(id, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Report deleted successfully",
          });
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-64">
        <LoadingState label="Loading reports…" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="error" title="Failed to load reports">
        Please try again later.
      </Alert>
    );
  }

  const reports = (data as ReportWithMeta)?.data || [];
  const total = (data as ReportWithMeta)?.meta?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            View and manage your financial reports
          </p>
        </div>
        <Button onClick={() => navigate("/reports/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>
            View and manage your financial reports
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search reports..."
                  className="w-full rounded-lg bg-background pl-8 md:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Select
                value={statusFilter}
                onValueChange={(value: ReportStatus | "all") =>
                  setStatusFilter(value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length > 0 ? (
                  reports.map((report: Report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{report.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(report.amount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={report.status} />
                      </TableCell>
                      <TableCell>
                        {report.createdAt
                          ? format(new Date(report.createdAt), "MMM dd, yyyy")
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/reports/${report.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(report.id)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="px-4">
                      <EmptyState size="sm" title="No reports found" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination would go here */}
          {total > 10 && (
            <div className="mt-4 flex items-center justify-end space-x-2">
              <Button variant="outline" size="sm" disabled={true}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={true}>
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusMap = {
    pending: { label: "Pending", className: "bg-muted text-muted-foreground" },
    approved: { label: "Approved", className: "bg-muted text-primary" },
    rejected: { label: "Rejected", className: "bg-muted text-destructive" },
  } as const;

  const statusInfo = statusMap[status] || {
    label: status,
    className: "bg-muted text-foreground",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.className}`}
    >
      {statusInfo.label}
    </span>
  );
}

export default ReportList;
