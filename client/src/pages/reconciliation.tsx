import React, { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/components/ui/card";
import { Button } from "@/components/components/ui/button";
import { Input } from "@/components/components/ui/input";
import { Label } from "@/components/components/ui/label";
import { Badge } from "@/components/components/ui/badge";
import {
  Upload,
  Check,
  X,
  Search,
  Filter,
  Plus,
  Eye,
  Trash2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/components/ui/dialog";
import {
  useBankTransactions,
  useAccounts,
  type BankTransaction,
  type Account,
} from "@/hooks/use-api";
import { Skeleton } from "@/components/components/ui/skeleton";
import { DashboardShell } from "@/components/components/ui/layout/DashboardShell";
import { format } from "date-fns";

export default function Reconciliation() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: bankTransactions = [], isLoading: bankLoading } =
    useBankTransactions();
  const { data: accounts = [] } = useAccounts();

  // Get cash/bank accounts for reconciliation
  const bankAccounts = accounts.filter(
    (account: Account) =>
      account.type === "asset" && account.name.toLowerCase().includes("cash"),
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Filter bank transactions based on account and search
  const filteredBankTransactions = bankTransactions.filter(
    (txn: BankTransaction) => {
      const matchesAccount =
        !selectedAccount || txn.accountId === selectedAccount;
      const matchesSearch =
        searchQuery === "" ||
        txn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "reconciled" && txn.isReconciled) ||
        (statusFilter === "unreconciled" && !txn.isReconciled);

      return matchesAccount && matchesSearch && matchesStatus;
    },
  );

  const reconciledCount = filteredBankTransactions.filter(
    (txn) => txn.isReconciled,
  ).length;
  const unreconciledCount = filteredBankTransactions.filter(
    (txn) => !txn.isReconciled,
  ).length;
  const totalAmount = filteredBankTransactions.reduce(
    (sum, txn) => sum + parseFloat(txn.amount),
    0,
  );

  const isLoading = bankLoading;

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="container mx-auto max-w-7xl px-6 py-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="container mx-auto max-w-7xl px-6 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Bank Reconciliation</h1>
          <p className="text-muted-foreground">
            Import and match bank transactions with your records
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-surface1 border border-border-gray shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Reconciled
              </CardTitle>
              <div
                className="text-2xl font-semibold text-chart-2"
                data-testid="text-reconciled-count"
              >
                {reconciledCount}
              </div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unreconciled
              </CardTitle>
              <div
                className="text-2xl font-semibold text-destructive dark:text-destructive-500"
                data-testid="text-unreconciled-count"
              >
                {unreconciledCount}
              </div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Net Change
              </CardTitle>
              <div
                className="text-2xl font-semibold tabular-nums"
                data-testid="text-net-change"
              >
                ${totalAmount.toFixed(2)}
              </div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Match Rate
              </CardTitle>
              <div
                className="text-2xl font-semibold"
                data-testid="text-match-rate"
              >
                {filteredBankTransactions.length > 0
                  ? `${Math.round((reconciledCount / filteredBankTransactions.length) * 100)}%`
                  : "0%"}
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Import Bank Statement</CardTitle>
              <CardDescription>
                Upload a CSV file from your bank to import transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bank-account">Bank Account</Label>
                  <Select
                    value={selectedAccount}
                    onValueChange={setSelectedAccount}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((account: Account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.code} - {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-file">Bank Statement (CSV)</Label>
                  <div className="flex gap-4">
                    <Input
                      id="bank-file"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      data-testid="input-bank-file"
                    />
                    <Button
                      disabled={!selectedFile || !selectedAccount}
                      data-testid="button-upload-bank-file"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
                <div className="text-sm text-muted-foreground bg-muted p-4 rounded-md">
                  <p className="font-medium mb-2">CSV Format Requirements:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Columns: Date, Description, Amount</li>
                    <li>Date format: YYYY-MM-DD or MM/DD/YYYY</li>
                    <li>
                      Amount: Positive for deposits, negative for withdrawals
                    </li>
                    <li>Reference numbers (optional)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reconciliation Status</CardTitle>
              <CardDescription>Current reconciliation progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Statement Balance</div>
                    <div className="text-muted-foreground">$0.00</div>
                  </div>
                  <div>
                    <div className="font-medium">Book Balance</div>
                    <div className="text-muted-foreground">$0.00</div>
                  </div>
                  <div>
                    <div className="font-medium">Difference</div>
                    <div className="text-muted-foreground">$0.00</div>
                  </div>
                  <div>
                    <div className="font-medium">Unreconciled Items</div>
                    <div className="text-muted-foreground">
                      {unreconciledCount}
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={!selectedAccount}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Manual Transaction
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Bank Transactions</CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="reconciled">Reconciled</SelectItem>
                      <SelectItem value="unreconciled">Unreconciled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedAccount}
                    onValueChange={setSelectedAccount}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All accounts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Accounts</SelectItem>
                      {bankAccounts.map((account: Account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.code} - {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchQuery(e.target.value)
                    }
                    className="pl-9"
                    data-testid="input-search-reconciliation"
                  />
                </div>
              </div>
            </div>
            <CardDescription>
              Review and match imported transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredBankTransactions.length === 0 ? (
              <EmptyState
                size="sm"
                title={
                  selectedAccount
                    ? "No bank transactions found for this account."
                    : "Select a bank account to view transactions."
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBankTransactions.map((txn: BankTransaction) => {
                    const account = accounts.find(
                      (acc) => acc.id === txn.accountId,
                    );
                    const isPositive = parseFloat(txn.amount) > 0;

                    return (
                      <TableRow
                        key={txn.id}
                        data-testid={`bank-transaction-row-${txn.id}`}
                      >
                        <TableCell className="text-muted-foreground">
                          {format(new Date(txn.date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div>{txn.description}</div>
                            {account && (
                              <div className="text-xs text-muted-foreground">
                                Account: {account.code} - {account.name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell
                          className={`text-right tabular-nums font-medium ${isPositive ? "text-chart-2" : "text-destructive dark:text-destructive-500"}`}
                        >
                          {isPositive ? "+" : ""}$
                          {Math.abs(parseFloat(txn.amount)).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {txn.referenceNumber || "-"}
                        </TableCell>
                        <TableCell>
                          {txn.isReconciled ? (
                            <Badge variant="default" className="gap-1">
                              <Check className="h-3 w-3" />
                              Reconciled
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <X className="h-3 w-3" />
                              Unmatched
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  data-testid={`button-view-bank-transaction-${txn.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>
                                    Bank Transaction Details
                                  </DialogTitle>
                                  <DialogDescription>
                                    {format(
                                      new Date(txn.date),
                                      "MMMM dd, yyyy",
                                    )}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-medium mb-2">
                                        Transaction Information
                                      </h4>
                                      <div className="space-y-1 text-sm">
                                        <div>
                                          <strong>Description:</strong>{" "}
                                          {txn.description}
                                        </div>
                                        <div>
                                          <strong>Reference:</strong>{" "}
                                          {txn.referenceNumber || "None"}
                                        </div>
                                        <div>
                                          <strong>Type:</strong>{" "}
                                          {isPositive
                                            ? "Deposit"
                                            : "Withdrawal"}
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-medium mb-2">
                                        Account Details
                                      </h4>
                                      <div className="space-y-1 text-sm">
                                        <div>
                                          <strong>Account:</strong>{" "}
                                          {account?.code} - {account?.name}
                                        </div>
                                        <div>
                                          <strong>Amount:</strong> $
                                          {Math.abs(
                                            parseFloat(txn.amount),
                                          ).toFixed(2)}
                                        </div>
                                        <div>
                                          <strong>Status:</strong>{" "}
                                          {txn.isReconciled
                                            ? "Reconciled"
                                            : "Unreconciled"}
                                        </div>
                                        {txn.matchedTransactionId && (
                                          <div>
                                            <strong>Matched With:</strong>{" "}
                                            Transaction ID
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {txn.importBatchId && (
                                    <div className="border-t pt-4">
                                      <p className="text-sm text-muted-foreground">
                                        Imported from batch: {txn.importBatchId}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                            {!txn.isReconciled ? (
                              <Button
                                variant="outline"
                                size="sm"
                                data-testid={`button-match-${txn.id}`}
                              >
                                Match
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                data-testid={`button-unmatch-${txn.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
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
      </div>
    </DashboardShell>
  );
}
