import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Plus, Search, Mail, Phone, Eye, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { useCustomers, useInvoices, type Customer, type Invoice } from "../hooks/use-api";
import { Skeleton } from "../components/ui/skeleton";

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: customers = [], isLoading: customersLoading } = useCustomers();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();

  // Calculate customer balances from invoices
  interface CustomerWithBalance extends Customer {
    balance: number;
    totalInvoiced: number;
    totalPaid: number;
    invoiceCount: number;
  }

  const customersWithBalances: CustomerWithBalance[] = customers.map((customer) => {
    const customerInvoices = invoices.filter((inv) => inv.customerId === customer.id);
    const totalInvoiced = customerInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);
    const totalPaid = customerInvoices.reduce((sum, inv) => sum + parseFloat(inv.amountPaid || '0'), 0);
    const balance = totalInvoiced - totalPaid;

    return {
      ...customer,
      balance: balance,
      totalInvoiced: totalInvoiced,
      totalPaid: totalPaid,
      invoiceCount: customerInvoices.length,
    };
  });

  const filteredCustomers = customersWithBalances.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (customer.phone && customer.phone.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalReceivables = customersWithBalances.reduce((sum, customer) => sum + customer.balance, 0);
  const avgBalance = customersWithBalances.length > 0 ? totalReceivables / customersWithBalances.length : 0;

  const isLoading = customersLoading || invoicesLoading;

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
          <h1 className="text-3xl font-semibold mb-2">Customers</h1>
          <p className="text-muted-foreground">Manage your customer relationships and balances</p>
        </div>
        <Button data-testid="button-create-customer">
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
            <div className="text-2xl font-semibold" data-testid="text-total-customers">{customers.length}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Receivables</CardTitle>
            <div className="text-2xl font-semibold tabular-nums text-chart-2" data-testid="text-total-receivables">
              ${totalReceivables.toLocaleString()}
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Balance</CardTitle>
            <div className="text-2xl font-semibold tabular-nums" data-testid="text-avg-balance">
              ${avgBalance.toLocaleString()}
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>All Customers</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-customers"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? "No customers found matching your search." : "No customers yet. Add your first customer to get started."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Invoices</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} data-testid={`customer-row-${customer.id}`}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        {customer.address && (
                          <div className="text-xs text-muted-foreground truncate max-w-xs">
                            {customer.address}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={`font-semibold tabular-nums ${customer.balance > 0 ? 'text-chart-2' : customer.balance < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {customer.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      {customer.balance !== 0 && (
                        <div className="text-xs text-muted-foreground">
                          {customer.balance > 0 ? 'Owed to you' : 'Credit balance'}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">
                        {customer.invoiceCount} invoices
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" data-testid={`button-view-customer-${customer.id}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" data-testid={`button-edit-customer-${customer.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" data-testid={`button-delete-customer-${customer.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
