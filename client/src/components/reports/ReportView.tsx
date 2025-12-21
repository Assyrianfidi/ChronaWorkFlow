declare global {
  interface Window {
    [key: string]: any;
  }
}

import { useParams, useNavigate } from "react-router-dom";
import { LoadingState } from '@/components/ui/LoadingState';
import { useReport } from "@/hooks/useReports";
import Button from "@/components/ui/Button";
import {
  default as Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import Input from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  ArrowLeft,
  Download,
  Printer,
  Share2,
  Check,
  Edit,
  FileText,
  Eye,
  MoreHorizontal,
  Save,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import Alert, { AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Report } from "@/types/report";
import { format } from "date-fns";
import React from "react"; // Added missing import
import { SecureHTML } from "@/components/security";

export function ReportView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: report, isLoading, isError } = useReport(id || "");

  if (isLoading) {
    return (
      <div className="min-h-64">
        <LoadingState label="Loading report…" />
      </div>
    );
  }

  if (isError || !report) {
    return (
      <Alert variant="error">
        <AlertTitle>Failed to load report</AlertTitle>
        <AlertDescription>Please try again later.</AlertDescription>
      </Alert>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleExport = (format: "pdf" | "csv") => {
    toast({
      title: "Exporting report",
      description: `Exporting report in ${format.toUpperCase()} format...`,
    });
    // TODO: Implement export functionality
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reports
        </Button>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/reports/${id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={() => handleExport("pdf")}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => handleExport("csv")}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-4">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">{report.title}</CardTitle>
                  <CardDescription className="mt-1">
                    Created on{" "}
                    {format(new Date(report.createdAt), "MMMM d, yyyy")}
                  </CardDescription>
                </div>
              </div>
            </div>
            <Badge
              variant={
                report.status === "approved"
                  ? "outline"
                  : report.status === "rejected"
                    ? "destructive"
                    : "secondary"
              }
            >
              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-xl font-semibold">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(report.amount)}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Created By</p>
              <p className="font-medium">
                {report.createdBy?.name || "Unknown User"}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">
                {format(new Date(report.updatedAt), "MMMM d, yyyy")}
              </p>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="mb-4 text-lg font-medium">Description</h3>
            <SecureHTML
              html={report.description || "No description provided."}
              className="prose max-w-none dark:prose-invert"
              tag="div"
            />
          </div>

          {report.notes && (
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 text-lg font-medium">Notes</h3>
              <p className="whitespace-pre-line">{report.notes}</p>
            </div>
          )}

          {report.attachments && report.attachments.length > 0 && (
              <div className="rounded-lg border p-4">
                <h3 className="mb-4 text-lg font-medium">Attachments</h3>
                <div className="space-y-2">
                  {report.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between rounded border p-3"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{attachment.name}</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
