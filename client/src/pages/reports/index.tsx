declare global {
  interface Window {
    [key: string]: any;
  }
}

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import Button from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  default as Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Plus, Pencil, Trash2, Download } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DashboardShell } from "@/components/ui/layout/DashboardShell";

type Report = {
  id: number;
  title: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
};

export default function ReportsPage() {
  const queryClient = useQueryClient();

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Fetch reports
  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ["reports"],
    queryFn: () => apiRequest.get("/reports"),
  });

  // Delete report mutation
  const deleteReport = useMutation({
    mutationFn: (id: number) => apiRequest.delete(`/reports/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      deleteReport.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${statusMap[status as keyof typeof statusMap]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="container mx-auto max-w-7xl px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-default">
              Reports
            </h1>
            <p className="text-muted-foreground">
              View and manage your financial reports
            </p>
          </div>
          <Button onClick={() => {}}>
            <Plus className="mr-2 h-4 w-4" />
            New Report
          </Button>
        </div>

        <Card className="bg-surface1 border-border-gray shadow-soft">
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>
              {reports.length} {reports.length === 1 ? "report" : "reports"}{" "}
              found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border-gray bg-surface0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.length > 0 ? (
                    reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          {report.title}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "font-medium",
                            report.amount < 0
                              ? "text-destructive dark:text-destructive-500"
                              : "text-success-700 dark:text-success",
                          )}
                        >
                          {formatCurrency(report.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell>
                          {format(new Date(report.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(report.id)}
                              disabled={deleteReport.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4" />
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
          </CardContent>
        </Card>

        {/* Create Report Dialog */}
        {/* TODO: Implement create report dialog */}
      </div>
    </DashboardShell>
  );
}
