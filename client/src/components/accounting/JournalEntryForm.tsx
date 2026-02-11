/**
 * Journal Entry Component
 * Double-entry transaction creation with real-time balance validation
 */

import React, { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { useView } from "@/contexts/ViewContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface JournalLine {
  id: string;
  accountId: string;
  debit: string;
  credit: string;
  description: string;
}

interface JournalEntry {
  date: Date;
  description: string;
  reference: string;
  lines: JournalLine[];
}

const EMPTY_LINE: JournalLine = {
  id: crypto.randomUUID(),
  accountId: "",
  debit: "",
  credit: "",
  description: "",
};

export const JournalEntryForm: React.FC = () => {
  const { toast } = useToast();
  const { mainViewConfig } = useView();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date>(new Date());
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState<JournalLine[]>([
    { ...EMPTY_LINE },
    { ...EMPTY_LINE, id: crypto.randomUUID() },
  ]);
  const [isBalanced, setIsBalanced] = useState(false);
  const [totalDebits, setTotalDebits] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);

  // Fetch accounts for dropdown
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const response = await api.get("/ledger/accounts");
      return response.data.data;
    },
  });

  // Create transaction mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/ledger/transactions", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast({
        title: "Journal entry created",
        description: "Your transaction has been posted successfully.",
      });
      // Reset form
      setDescription("");
      setReference("");
      setLines([
        { ...EMPTY_LINE, id: crypto.randomUUID() },
        { ...EMPTY_LINE, id: crypto.randomUUID() },
      ]);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating entry",
        description:
          error.response?.data?.error?.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Calculate totals and balance status
  useEffect(() => {
    const debits = lines.reduce(
      (sum, line) => sum + (parseFloat(line.debit) || 0),
      0,
    );
    const credits = lines.reduce(
      (sum, line) => sum + (parseFloat(line.credit) || 0),
      0,
    );
    setTotalDebits(debits);
    setTotalCredits(credits);
    setIsBalanced(Math.abs(debits - credits) < 0.001 && debits > 0);
  }, [lines]);

  // Add new line
  const addLine = useCallback(() => {
    setLines((prev) => [...prev, { ...EMPTY_LINE, id: crypto.randomUUID() }]);
  }, []);

  // Remove line
  const removeLine = useCallback(
    (id: string) => {
      setLines((prev) => {
        if (prev.length <= 2) {
          toast({
            title: "Cannot remove",
            description: "Journal entries must have at least two lines.",
            variant: "destructive",
          });
          return prev;
        }
        return prev.filter((line) => line.id !== id);
      });
    },
    [toast],
  );

  // Update line
  const updateLine = useCallback(
    (id: string, field: keyof JournalLine, value: string) => {
      setLines((prev) =>
        prev.map((line) => {
          if (line.id !== id) return line;

          // Clear opposite amount when entering debit/credit
          if (field === "debit" && value) {
            return { ...line, [field]: value, credit: "" };
          }
          if (field === "credit" && value) {
            return { ...line, [field]: value, debit: "" };
          }

          return { ...line, [field]: value };
        }),
      );
    },
    [],
  );

  // Handle form submission
  const handleSubmit = async () => {
    if (!isBalanced) {
      toast({
        title: "Entry not balanced",
        description: "Total debits must equal total credits.",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please enter a description for this entry.",
        variant: "destructive",
      });
      return;
    }

    const validLines = lines.filter(
      (line) => line.accountId && (line.debit || line.credit),
    );

    if (validLines.length < 2) {
      toast({
        title: "Insufficient lines",
        description: "You need at least two valid lines.",
        variant: "destructive",
      });
      return;
    }

    const data = {
      date,
      description,
      reference,
      type: "manual",
      lines: validLines.map((line) => ({
        accountId: line.accountId,
        debit: line.debit ? parseFloat(line.debit) : undefined,
        credit: line.credit ? parseFloat(line.credit) : undefined,
        description: line.description,
      })),
    };

    createMutation.mutate(data);
  };

  const difference = totalDebits - totalCredits;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {mainViewConfig.terminology.accounting === "Chart of Accounts"
              ? "Journal Entry"
              : "General Journal"}
          </h1>
          <p className="text-muted-foreground">
            Create a double-entry accounting transaction
          </p>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!isBalanced || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Post Entry
            </>
          )}
        </Button>
      </div>

      {/* Balance Alert */}
      {!isBalanced && totalDebits > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Entry is not balanced. Difference: $
            {Math.abs(difference).toFixed(2)}
          </AlertDescription>
        </Alert>
      )}

      {isBalanced && totalDebits > 0 && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Entry is balanced. Total: ${totalDebits.toFixed(2)}
          </AlertDescription>
        </Alert>
      )}

      {/* Entry Details */}
      <Card>
        <CardHeader>
          <CardTitle>Entry Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Reference Number</Label>
              <Input
                placeholder="e.g., JE-001"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Input
                placeholder="Entry description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journal Lines */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Journal Lines</CardTitle>
          <Button variant="outline" size="sm" onClick={addLine}>
            <Plus className="h-4 w-4 mr-2" />
            Add Line
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line, index) => (
                <TableRow key={line.id}>
                  <TableCell className="text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={line.accountId}
                      onValueChange={(value) =>
                        updateLine(line.id, "accountId", value)
                      }
                      disabled={accountsLoading}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account: Account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.code} - {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Line description"
                      value={line.description}
                      onChange={(e) =>
                        updateLine(line.id, "description", e.target.value)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={line.debit}
                      onChange={(e) =>
                        updateLine(line.id, "debit", e.target.value)
                      }
                      className="text-right"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={line.credit}
                      onChange={(e) =>
                        updateLine(line.id, "credit", e.target.value)
                      }
                      className="text-right"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLine(line.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {/* Totals Row */}
              <TableRow className="font-medium border-t-2">
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right">Totals:</TableCell>
                <TableCell
                  className={cn(
                    "text-right",
                    difference !== 0 && "text-destructive",
                  )}
                >
                  ${totalDebits.toFixed(2)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right",
                    difference !== 0 && "text-destructive",
                  )}
                >
                  ${totalCredits.toFixed(2)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <div>
          Lines: {lines.length} | Valid lines:{" "}
          {lines.filter((l) => l.accountId && (l.debit || l.credit)).length}
        </div>
        <div className="flex items-center gap-4">
          <span>Total Debits: ${totalDebits.toFixed(2)}</span>
          <span>Total Credits: ${totalCredits.toFixed(2)}</span>
          <Badge variant={isBalanced ? "default" : "destructive"}>
            {isBalanced
              ? "Balanced"
              : `Off by $${Math.abs(difference).toFixed(2)}`}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default JournalEntryForm;
