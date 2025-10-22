import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Send, DollarSign } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const invoices = [
  { id: "1", number: "INV-1024", customer: "Acme Corporation", date: "2024-01-15", dueDate: "2024-02-14", amount: 5420.00, amountPaid: 5420.00, status: "paid" },
  { id: "2", number: "INV-1023", customer: "Tech Solutions Inc", date: "2024-01-12", dueDate: "2024-02-11", amount: 3250.00, amountPaid: 0, status: "sent" },
  { id: "3", number: "INV-1022", customer: "Global Enterprises", date: "2024-01-10", dueDate: "2024-02-09", amount: 8900.00, amountPaid: 0, status: "sent" },
  { id: "4", number: "INV-1021", customer: "Design Studio Co", date: "2024-01-08", dueDate: "2024-01-23", amount: 1850.00, amountPaid: 0, status: "overdue" },
  { id: "5", number: "INV-1020", customer: "Manufacturing Ltd", date: "2024-01-05", dueDate: "2024-01-20", amount: 4200.00, amountPaid: 0, status: "overdue" },
  { id: "6", number: "INV-1019", customer: "Retail Group", date: "2024-01-03", dueDate: "2024-02-02", amount: 2980.00, amountPaid: 2980.00, status: "paid" },
];

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

  const filteredInvoices = invoices.filter(invoice =>
    invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Invoices</h1>
          <p className="text-muted-foreground">Manage your customer invoices and payments</p>
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
            <CardTitle className="text-2xl tabular-nums" data-testid="text-total-outstanding">$21,180.00</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Across 4 invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Paid This Month</CardDescription>
            <CardTitle className="text-2xl tabular-nums text-chart-2" data-testid="text-paid-month">$8,400.00</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">2 invoices paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Overdue</CardDescription>
            <CardTitle className="text-2xl tabular-nums text-destructive" data-testid="text-overdue">$6,050.00</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">2 invoices overdue</p>
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-invoices"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id} data-testid={`invoice-row-${invoice.id}`}>
                  <TableCell className="font-medium">{invoice.number}</TableCell>
                  <TableCell>{invoice.customer}</TableCell>
                  <TableCell className="text-muted-foreground">{invoice.date}</TableCell>
                  <TableCell className="text-muted-foreground">{invoice.dueDate}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">${invoice.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[invoice.status as keyof typeof statusColors]}>
                      {statusLabels[invoice.status as keyof typeof statusLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" data-testid={`button-view-invoice-${invoice.id}`}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" data-testid={`button-send-invoice-${invoice.id}`}>
                        <Send className="h-4 w-4" />
                      </Button>
                      {invoice.status !== "paid" && (
                        <Button variant="ghost" size="icon" data-testid={`button-record-payment-${invoice.id}`}>
                          <DollarSign className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
