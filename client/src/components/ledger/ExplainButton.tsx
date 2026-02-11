import React, { useState } from "react";
import { Search, Loader2, X } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

interface ExplainButtonProps {
  kpiName: string;
  accountType?: "asset" | "liability" | "equity" | "revenue" | "expense";
  accountIds?: string[];
  startDate?: Date;
  endDate?: Date;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
}

interface NumberExplanation {
  kpiName: string | null;
  period: {
    startDate: string;
    endDate: string;
    isPeriodLocked: boolean;
  };
  summary: {
    totalDebits: string;
    totalCredits: string;
    netAmount: string;
    transactionCount: number;
  };
  accountsInvolved: Array<{
    accountId: string;
    accountCode: string;
    accountName: string;
    accountType: string;
    debits: string;
    credits: string;
    netEffect: string;
  }>;
  transactions: Array<{
    transactionId: string;
    transactionNumber: string;
    date: string;
    type: string;
    description: string;
    referenceNumber: string | null;
    accountId: string;
    accountCode: string;
    accountName: string;
    debit: string;
    credit: string;
    netEffect: string;
    originatingAction: {
      type: "invoice" | "payment" | "payroll" | "manual" | null;
      id: string | null;
    };
  }>;
}

/**
 * ExplainButton - Shows "Explain This Number" control
 * Fetches explanation from /api/ledger/explain and displays in modal
 */
export const ExplainButton: React.FC<ExplainButtonProps> = ({
  kpiName,
  accountType,
  accountIds,
  startDate,
  endDate,
  variant = "ghost",
  size = "sm",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<NumberExplanation | null>(
    null,
  );

  const handleExplain = async () => {
    setIsOpen(true);
    setIsLoading(true);
    setError(null);

    try {
      // Default to current month if no dates provided
      const now = new Date();
      const start =
        startDate ||
        new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const end =
        endDate ||
        new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59),
        );

      const response = await fetch("/api/ledger/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          kpiName,
          accountType,
          accountIds,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch explanation");
      }

      const data = await response.json();
      setExplanation(data.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch explanation");
      console.error("Explain error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleExplain}
        title={`Explain ${kpiName}`}
      >
        <Search className="w-4 h-4 mr-1" />
        Explain
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Explain: {kpiName}</DialogTitle>
            <DialogDescription>
              Ledger-based explanation showing all contributing transactions
            </DialogDescription>
          </DialogHeader>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                Loading explanation...
              </span>
            </div>
          )}

          {error && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{error}</p>
              </CardContent>
            </Card>
          )}

          {explanation && !isLoading && (
            <div className="space-y-4">
              {/* Period Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Period</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Start Date:</span>{" "}
                      {new Date(
                        explanation.period.startDate,
                      ).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">End Date:</span>{" "}
                      {new Date(
                        explanation.period.endDate,
                      ).toLocaleDateString()}
                    </div>
                    <div className="col-span-2">
                      {explanation.period.isPeriodLocked && (
                        <Badge variant="secondary">Period Locked</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Debits:</span>{" "}
                      <span className="font-mono">
                        ${explanation.summary.totalDebits}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Total Credits:</span>{" "}
                      <span className="font-mono">
                        ${explanation.summary.totalCredits}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Net Amount:</span>{" "}
                      <span className="font-mono font-bold">
                        ${explanation.summary.netAmount}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Transactions:</span>{" "}
                      {explanation.summary.transactionCount}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Accounts Involved */}
              <Card>
                <CardHeader>
                  <CardTitle>Accounts Involved</CardTitle>
                  <CardDescription>
                    {explanation.accountsInvolved.length} account(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Debits</TableHead>
                        <TableHead className="text-right">Credits</TableHead>
                        <TableHead className="text-right">Net Effect</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {explanation.accountsInvolved.map((account) => (
                        <TableRow key={account.accountId}>
                          <TableCell className="font-mono">
                            {account.accountCode}
                          </TableCell>
                          <TableCell>{account.accountName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {account.accountType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            ${account.debits}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            ${account.credits}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            ${account.netEffect}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle>Contributing Transactions</CardTitle>
                  <CardDescription>
                    {explanation.transactions.length} transaction(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {explanation.transactions.map((txn) => (
                      <Card key={txn.transactionId} className="border">
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium">Transaction:</span>{" "}
                              <span className="font-mono">
                                {txn.transactionNumber}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">Date:</span>{" "}
                              {new Date(txn.date).toLocaleDateString()}
                            </div>
                            <div className="col-span-2">
                              <span className="font-medium">Description:</span>{" "}
                              {txn.description}
                            </div>
                            <div>
                              <span className="font-medium">Type:</span>{" "}
                              <Badge variant="outline">{txn.type}</Badge>
                            </div>
                            {txn.originatingAction.type && (
                              <div>
                                <span className="font-medium">Origin:</span>{" "}
                                <Badge variant="secondary">
                                  {txn.originatingAction.type}:{" "}
                                  {txn.originatingAction.id}
                                </Badge>
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Account:</span>{" "}
                              {txn.accountCode} - {txn.accountName}
                            </div>
                            <div className="grid grid-cols-3 gap-2 col-span-2">
                              <div>
                                <span className="font-medium">Debit:</span>{" "}
                                <span className="font-mono">${txn.debit}</span>
                              </div>
                              <div>
                                <span className="font-medium">Credit:</span>{" "}
                                <span className="font-mono">${txn.credit}</span>
                              </div>
                              <div>
                                <span className="font-medium">Net:</span>{" "}
                                <span className="font-mono font-bold">
                                  ${txn.netEffect}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExplainButton;
