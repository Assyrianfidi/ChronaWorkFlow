import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const bankTransactions = [
  { id: "1", date: "2024-01-15", description: "ACH DEPOSIT - ACME CORP", amount: 5420.00, isReconciled: true, matchedWith: "Invoice #1024" },
  { id: "2", date: "2024-01-14", description: "DEBIT - OFFICE SUPPLIES", amount: -245.50, isReconciled: true, matchedWith: "JE-1021" },
  { id: "3", date: "2024-01-13", description: "ACH PAYMENT - TECH SOLUTIONS", amount: 4200.00, isReconciled: false, matchedWith: null },
  { id: "4", date: "2024-01-12", description: "DEBIT - ELECTRIC COMPANY", amount: -432.80, isReconciled: false, matchedWith: null },
  { id: "5", date: "2024-01-11", description: "DEBIT - RENT PAYMENT", amount: -2500.00, isReconciled: true, matchedWith: "JE-1020" },
  { id: "6", date: "2024-01-10", description: "ACH DEPOSIT - GLOBAL ENT", amount: 8900.00, isReconciled: false, matchedWith: null },
];

export default function Reconciliation() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const reconciledCount = bankTransactions.filter(t => t.isReconciled).length;
  const unreconciledCount = bankTransactions.filter(t => !t.isReconciled).length;
  const totalAmount = bankTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Bank Reconciliation</h1>
        <p className="text-muted-foreground">Import and match bank transactions with your records</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reconciled</CardTitle>
            <div className="text-2xl font-semibold text-chart-2" data-testid="text-reconciled-count">{reconciledCount}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unreconciled</CardTitle>
            <div className="text-2xl font-semibold text-destructive" data-testid="text-unreconciled-count">{unreconciledCount}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Change</CardTitle>
            <div className="text-2xl font-semibold tabular-nums" data-testid="text-net-change">${totalAmount.toFixed(2)}</div>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Import Bank Statement</CardTitle>
          <CardDescription>Upload a CSV file from your bank to import transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
                <Button disabled={!selectedFile} data-testid="button-upload-bank-file">
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
                <li>Amount: Positive for deposits, negative for withdrawals</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bank Transactions</CardTitle>
          <CardDescription>Review and match imported transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Matched With</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bankTransactions.map((txn) => (
                <TableRow key={txn.id} data-testid={`bank-transaction-row-${txn.id}`}>
                  <TableCell className="text-muted-foreground">{txn.date}</TableCell>
                  <TableCell>{txn.description}</TableCell>
                  <TableCell className={`text-right tabular-nums font-medium ${txn.amount > 0 ? 'text-chart-2' : ''}`}>
                    {txn.amount > 0 ? '+' : ''}{txn.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {txn.matchedWith || '-'}
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
                    {!txn.isReconciled && (
                      <Button variant="outline" size="sm" data-testid={`button-match-${txn.id}`}>
                        Match
                      </Button>
                    )}
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
