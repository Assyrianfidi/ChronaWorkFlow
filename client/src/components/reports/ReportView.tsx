import { useParams, useNavigate } from 'react-router-dom';
import { useReport } from '../../hooks/useReports';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Avatar } from '../ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeft, Download, Printer, Share2, Check, Edit, FileText, Eye, Loader2, MoreHorizontal, Save } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { Report } from '../../types/report';
import { format } from 'date-fns';
import React from 'react'; // Added missing import

export function ReportView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: report, isLoading, isError } = useReport(id || '');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="p-4 text-destructive">
        Failed to load report. Please try again later.
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleExport = (format: 'pdf' | 'csv') => {
    toast({
      title: 'Exporting report',
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
          <Button variant="outline" onClick={() => navigate(`/reports/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')}>
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
                    Created on {format(new Date(report.createdAt), 'MMMM d, yyyy')}
                  </CardDescription>
                </div>
              </div>
            </div>
            <Badge variant={report.status === 'approved' ? 'outline' : report.status === 'rejected' ? 'destructive' : 'secondary'}>
              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-xl font-semibold">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(report.amount)}
              </p>
            </div>
            
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Created By</p>
              <p className="font-medium">
                {(report as any).createdBy?.name || 'Unknown User'}
              </p>
            </div>
            
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">
                {format(new Date(report.updatedAt), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
          
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 text-lg font-medium">Description</h3>
            <div 
              className="prose max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: report.description || 'No description provided.' }}
            />
          </div>
          
          {(report as any).notes && (
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 text-lg font-medium">Notes</h3>
              <p className="whitespace-pre-line">{(report as any).notes}</p>
            </div>
          )}
          
          {(report as any).attachments && (report as any).attachments.length > 0 && (
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 text-lg font-medium">Attachments</h3>
              <div className="space-y-2">
                {(report as any).attachments.map((attachment: any) => (
                  <div key={attachment.id} className="flex items-center justify-between rounded border p-3">
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
