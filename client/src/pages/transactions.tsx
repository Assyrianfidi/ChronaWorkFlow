import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Ban } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const transactions = [
  { id: "1", number: "JE-1024", date: "2024-01-15", type: "journal_entry", description: "Monthly payroll entry", amount: 8500.00, isVoid: false },
  { id: "2", number: "JE-1023", date: "2024-01-14", type: "invoice", description: "Invoice #1024 - Acme Corp", amount: 5420.00, isVoid: false },
  { id: "3", number: "JE-1022", date: "2024-01-13", type: "payment", description: "Payment received - Invoice #1020", amount: 4200.00, isVoid: false },
  { id: "4", number: "JE-1021", date: "2024-01-12", type: "journal_entry", description: "Office supplies purchase", amount: 245.50, isVoid: false },
  { id: "5", number: "JE-1020", date: "2024-01-11", type: "journal_entry", description: "Rent payment - January", amount: 2500.00, isVoid: false },
  { id: "6", number: "JE-1019", date: "2024-01-10", type: "invoice", description: "Invoice #1023 - Tech Solutions", amount: 3250.00, isVoid: false },
  { id: "7", number: "JE-1018", date: "2024-01-09", type: "journal_entry", description: "Utility bill payment", amount: 432.80, isVoid: false },
  { id: "8", number: "JE-1017", date: "2024-01-08", type: "payment", description: "Payment received - Invoice #1018", amount: 4820.00, isVoid: false },
];

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

  const filteredTransactions = transactions.filter(txn =>
    txn.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    txn.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
            <div className="text-2xl font-semibold" data-testid="text-total-transactions">8</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            <div className="text-2xl font-semibold" data-testid="text-month-transactions">8</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Journal Entries</CardTitle>
            <div className="text-2xl font-semibold" data-testid="text-journal-entries">5</div>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Transaction Ledger</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-transactions"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
              {filteredTransactions.map((txn) => (
                <TableRow key={txn.id} data-testid={`transaction-row-${txn.id}`}>
                  <TableCell className="font-medium">{txn.number}</TableCell>
                  <TableCell className="text-muted-foreground">{txn.date}</TableCell>
                  <TableCell>
                    <Badge variant={typeColors[txn.type as keyof typeof typeColors]}>
                      {typeLabels[txn.type as keyof typeof typeLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell>{txn.description}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">${txn.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" data-testid={`button-view-transaction-${txn.id}`}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!txn.isVoid && (
                        <Button variant="ghost" size="icon" data-testid={`button-void-transaction-${txn.id}`}>
                          <Ban className="h-4 w-4" />
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
