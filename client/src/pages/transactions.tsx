import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Ban, Calendar, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTransactions, useAccounts, type Transaction, type Account } from "@/hooks/use-api";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const typeLabels = {
  journal_entry: "Journal Entry",
  invoice: "Invoice",
  payment: "Payment",
  bank: "Bank Transaction",
};

const typeColors = {
  journal_entry: "secondary",
  invoice: "default",
  payment: "default",
  bank: "secondary",
} as const;

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions();
  const { data: accounts = [] } = useAccounts();

  // Create account map for quick lookup
  const accountMap = accounts.reduce((acc: Record<string, Account>, account: Account) => {
    acc[account.id] = account;
    return acc;
  }, {});

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter((txn: Transaction) => {
    const matchesSearch = searchQuery === "" ||
      txn.transactionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "all" || txn.type === typeFilter;

    let matchesDate = true;
    if (dateRange !== "all") {
      const txnDate = new Date(txn.date);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - txnDate.getTime()) / (1000 * 3600 * 24));

      switch (dateRange) {
        case "today":
          matchesDate = daysDiff === 0;
          break;
        case "week":
          matchesDate = daysDiff <= 7;
          break;
        case "month":
          matchesDate = daysDiff <= 30;
          break;
        case "quarter":
          matchesDate = daysDiff <= 90;
          break;
      }
    }

    return matchesSearch && matchesType && matchesDate;
  });

  // Get transaction lines for a specific transaction
  const getTransactionLines = (transactionId: string): any[] => {
    // For now, return empty array - will implement proper transaction lines later
    return [];
  };

  // Calculate totals
  const totalTransactions = filteredTransactions.length;
  const journalEntries = filteredTransactions.filter((txn: Transaction) => txn.type === "journal_entry").length;
  const invoiceTransactions = filteredTransactions.filter((txn: Transaction) => txn.type === "invoice").length;
  const paymentTransactions = filteredTransactions.filter((txn: Transaction) => txn.type === "payment").length;

  const totalAmount = filteredTransactions.reduce((sum: number, txn: Transaction) => sum + parseFloat(txn.totalAmount), 0);

  const isLoading = transactionsLoading;

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
          <h1 className="text-3xl font-semibold mb-2">Transactions</h1>
          <p className="text-muted-foreground">View and manage all journal entries and transactions</p>
        </div>
        <Button data-testid="button-create-transaction">
          <Plus className="h-4 w-4 mr-2" />
          New Journal Entry
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
            <div className="text-2xl font-semibold" data-testid="text-total-transactions">{totalTransactions}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
            <div className="text-2xl font-semibold tabular-nums" data-testid="text-total-amount">
              ${totalAmount.toLocaleString()}
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Journal Entries</CardTitle>
            <div className="text-2xl font-semibold" data-testid="text-journal-entries">{journalEntries}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            <div className="text-2xl font-semibold" data-testid="text-month-transactions">
              {filteredTransactions.filter((txn: Transaction) => {
                const txnDate = new Date(txn.date);
                const now = new Date();
                return txnDate.getMonth() === now.getMonth() && txnDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Transaction Ledger</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="journal_entry">Journal Entries</SelectItem>
                    <SelectItem value="invoice">Invoices</SelectItem>
                    <SelectItem value="payment">Payments</SelectItem>
                    <SelectItem value="bank">Bank Transactions</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-transactions"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery || typeFilter !== "all" || dateRange !== "all"
                ? "No transactions found matching your filters."
                : "No transactions yet. Create your first journal entry to get started."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((txn: Transaction) => {
                  const lines = getTransactionLines(txn.id);
                  const debitTotal = 0; // TODO: Calculate from real transaction lines
                  const creditTotal = 0; // TODO: Calculate from real transaction lines

                  return (
                    <TableRow key={txn.id} data-testid={`transaction-row-${txn.id}`}>
                      <TableCell className="font-medium">{txn.transactionNumber}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(txn.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={typeColors[txn.type as keyof typeof typeColors]}>
                          {typeLabels[txn.type as keyof typeof typeLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{txn.description}</div>
                          {txn.referenceNumber && (
                            <div className="text-xs text-muted-foreground">Ref: {txn.referenceNumber}</div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Double-entry transaction • ${parseFloat(txn.totalAmount).toFixed(2)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        ${parseFloat(txn.totalAmount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                data-testid={`button-view-transaction-${txn.id}`}
                                onClick={() => setSelectedTransaction(txn)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Transaction Details - {txn.transactionNumber}</DialogTitle>
                                <DialogDescription>
                                  {format(new Date(txn.date), "MMMM dd, yyyy")}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Transaction Information</h4>
                                    <div className="space-y-1 text-sm">
                                      <div><strong>Type:</strong> {typeLabels[txn.type as keyof typeof typeLabels]}</div>
                                      <div><strong>Description:</strong> {txn.description}</div>
                                      {txn.referenceNumber && (
                                        <div><strong>Reference:</strong> {txn.referenceNumber}</div>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Totals</h4>
                                    <div className="space-y-1 text-sm">
                                      <div><strong>Total Amount:</strong> ${parseFloat(txn.totalAmount).toFixed(2)}</div>
                                      <div><strong>Status:</strong> {txn.isVoid ? "Voided" : "Active"}</div>
                                    </div>
                                  </div>
                                </div>

                                <div className="border-t pt-4">
                                  <p className="text-sm text-muted-foreground">
                                    Transaction lines will be displayed here once the double-entry bookkeeping interface is fully implemented.
                                  </p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {!txn.isVoid && (
                            <Button variant="ghost" size="icon" data-testid={`button-void-transaction-${txn.id}`}>
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          {txn.isVoid && (
                            <Badge variant="secondary" className="text-xs">Voided</Badge>
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
    </div>
  );
}
