import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card.js.js';
// @ts-ignore
import { Button } from '../components/ui/button.js.js';
// @ts-ignore
import { Input } from '../components/ui/input.js.js';
// @ts-ignore
import { Badge } from '../components/ui/badge.js.js';
import { Plus, Search, Eye, Send, DollarSign } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.js.js';
import {
  useInvoices,
  useCustomers,
  type Invoice,
  type Customer,
} from '../hooks/use-api.js.js';
// @ts-ignore
import { Skeleton } from '../components/ui/skeleton.js.js';

const statusColors = {
  draft: "secondary",
  sent: "default",
  paid: "default",
  overdue: "destructive",
  void: "secondary",
} as const;

const statusLabels = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
};

export default function Invoices() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const { data: customers = [], isLoading: customersLoading } = useCustomers();

  // Create a map for quick customer lookup
  const customerMap = customers.reduce(
    (acc: Record<string, Customer>, customer: Customer) => {
      acc[customer.id] = customer;
      return acc;
    },
    {},
  );

  // Calculate real metrics from invoice data
  const totalOutstanding = invoices.reduce((sum: number, inv: Invoice) => {
    const amountDue = parseFloat(inv.total) - parseFloat(inv.amountPaid);
    return sum + (amountDue > 0 ? amountDue : 0);
  }, 0);

  const paidThisMonth = invoices
    .filter((inv: Invoice) => inv.status === "paid")
    .reduce((sum: number, inv: Invoice) => sum + parseFloat(inv.amountPaid), 0);

  const overdueInvoices = invoices.filter(
    (inv: Invoice) => inv.status === "overdue",
  );
  const totalOverdue = overdueInvoices.reduce((sum: number, inv: Invoice) => {
    const amountDue = parseFloat(inv.total) - parseFloat(inv.amountPaid);
    return sum + amountDue;
  }, 0);

  const filteredInvoices = invoices.filter((invoice: Invoice) => {
    const customer = customerMap[invoice.customerId];
    const customerName = customer?.name || "";

    return (
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const isLoading = invoicesLoading || customersLoading;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Invoices</h1>
          <p className="text-muted-foreground">
            Manage your customer invoices and payments
          </p>
        </div>
        <Button data-testid="button-create-invoice">
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Outstanding</CardDescription>
            <CardTitle
              className="text-2xl tabular-nums text-chart-2"
              data-testid="text-total-outstanding"
            >
              ${totalOutstanding.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Across{" "}
              {overdueInvoices.length +
                invoices.filter((inv) => inv.status === "sent").length}{" "}
              invoices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Paid This Month</CardDescription>
            <CardTitle
              className="text-2xl tabular-nums text-chart-2"
              data-testid="text-paid-month"
            >
              ${paidThisMonth.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {invoices.filter((inv) => inv.status === "paid").length} invoices
              paid
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Overdue</CardDescription>
            <CardTitle
              className="text-2xl tabular-nums text-destructive"
              data-testid="text-overdue"
            >
              ${totalOverdue.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {overdueInvoices.length} invoices overdue
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>All Invoices</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
                className="pl-9"
                data-testid="input-search-invoices"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery
                ? "No invoices found matching your search."
                : "No invoices yet. Create your first invoice to get started."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice: Invoice) => {
                  const customer = customerMap[invoice.customerId];
                  const amountDue =
                    parseFloat(invoice.total) - parseFloat(invoice.amountPaid);

                  return (
                    <TableRow
                      key={invoice.id}
                      data-testid={`invoice-row-${invoice.id}`}
                    >
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        {customer?.name || "Unknown Customer"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(invoice.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        ${parseFloat(invoice.total).toFixed(2)}
                        {amountDue > 0 && (
                          <div className="text-xs text-muted-foreground">
                            ${amountDue.toFixed(2)} due
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            statusColors[
// @ts-ignore
                              invoice.status as keyof typeof statusColors
                            ]
                          }
                        >
                          {
                            statusLabels[
// @ts-ignore
                              invoice.status as keyof typeof statusLabels
                            ]
                          }
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-view-invoice-${invoice.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-send-invoice-${invoice.id}`}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          {amountDue > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid={`button-record-payment-${invoice.id}`}
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
