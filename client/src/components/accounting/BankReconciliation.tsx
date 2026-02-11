/**
 * Bank Reconciliation Component
 * Match bank transactions with ledger entries
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ArrowRightLeft,
  Building2,
  CreditCard,
  DollarSign,
  Filter,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useView } from '@/contexts/ViewContext';

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'pending' | 'matched' | 'categorized' | 'reconciled' | 'excluded';
  matchedTransactionId?: string;
  matchedConfidence?: number;
  matchType?: 'exact' | 'fuzzy' | 'rule' | 'manual';
  bankAccountName: string;
}

interface LedgerTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  reference?: string;
}

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  matched: { label: 'Matched', color: 'bg-blue-100 text-blue-800', icon: ArrowRightLeft },
  categorized: { label: 'Categorized', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
  reconciled: { label: 'Reconciled', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  excluded: { label: 'Excluded', color: 'bg-gray-100 text-gray-800', icon: XCircle },
};

export const BankReconciliation: React.FC = () => {
  const { toast } = useToast();
  const { mainViewConfig } = useView();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('for-review');
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());

  // Fetch bank transactions
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['bank-transactions', selectedTab],
    queryFn: async () => {
      const response = await fetch(`/api/banking/transactions?status=${selectedTab}`);
      return response.json();
    },
  });

  // Auto-match mutation
  const autoMatchMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/banking/auto-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionIds: ids }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      toast({ title: 'Auto-matching complete', description: 'Matching suggestions have been generated.' });
    },
  });

  // Bulk reconcile mutation
  const reconcileMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/banking/bulk-reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionIds: ids }),
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      setSelectedTransactions(new Set());
      toast({
        title: 'Reconciliation complete',
        description: `${data.reconciledCount} transactions reconciled successfully.`,
      });
    },
  });

  const toggleSelection = (id: string) => {
    setSelectedTransactions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const ids = transactions.map((t: BankTransaction) => t.id);
    setSelectedTransactions(new Set(ids));
  };

  const clearSelection = () => {
    setSelectedTransactions(new Set());
  };

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return null;
    if (confidence >= 94) return <Badge className="bg-green-100 text-green-800">{confidence}%</Badge>;
    if (confidence >= 80) return <Badge className="bg-yellow-100 text-yellow-800">{confidence}%</Badge>;
    return <Badge className="bg-red-100 text-red-800">{confidence}%</Badge>;
  };

  const renderTransactionRow = (transaction: BankTransaction) => {
    const status = STATUS_CONFIG[transaction.status];
    const StatusIcon = status.icon;
    const isSelected = selectedTransactions.has(transaction.id);

    return (
      <TableRow key={transaction.id} className={cn(isSelected && 'bg-muted/50')}>
        <TableCell>
          <Checkbox checked={isSelected} onCheckedChange={() => toggleSelection(transaction.id)} />
        </TableCell>
        <TableCell>{format(new Date(transaction.date), 'MMM dd, yyyy')}</TableCell>
        <TableCell>
          <div>
            <div className="font-medium">{transaction.description}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {transaction.bankAccountName}
            </div>
          </div>
        </TableCell>
        <TableCell className={cn('text-right font-mono', transaction.amount < 0 && 'text-red-600')}>
          ${Math.abs(transaction.amount).toFixed(2)}
          {transaction.amount < 0 && ' (DR)'}
        </TableCell>
        <TableCell>
          <Badge className={cn(status.color, 'flex items-center gap-1 w-fit')}>
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
        </TableCell>
        <TableCell>{getConfidenceBadge(transaction.matchedConfidence)}</TableCell>
        <TableCell>
          <div className="flex gap-2">
            {transaction.status === 'matched' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => reconcileMutation.mutate([transaction.id])}
                disabled={reconcileMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Confirm
              </Button>
            )}
            {transaction.status === 'pending' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => autoMatchMutation.mutate([transaction.id])}
                disabled={autoMatchMutation.isPending}
              >
                <RefreshCw className={cn('h-4 w-4 mr-1', autoMatchMutation.isPending && 'animate-spin')} />
                Find Match
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const filteredTransactions = transactions.filter((t: BankTransaction) => {
    switch (selectedTab) {
      case 'for-review':
        return t.status === 'pending' || t.status === 'matched';
      case 'categorized':
        return t.status === 'categorized';
      case 'reconciled':
        return t.status === 'reconciled';
      case 'excluded':
        return t.status === 'excluded';
      default:
        return true;
    }
  });

  const stats = {
    forReview: transactions.filter((t: BankTransaction) => t.status === 'pending' || t.status === 'matched').length,
    categorized: transactions.filter((t: BankTransaction) => t.status === 'categorized').length,
    reconciled: transactions.filter((t: BankTransaction) => t.status === 'reconciled').length,
    excluded: transactions.filter((t: BankTransaction) => t.status === 'excluded').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bank Reconciliation</h1>
          <p className="text-muted-foreground">
            Match bank transactions with your {mainViewConfig.terminology.accounting}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => autoMatchMutation.mutate(selectedTransactions.size > 0 ? Array.from(selectedTransactions) : ['all'])}>
            <RefreshCw className={cn('h-4 w-4 mr-2', autoMatchMutation.isPending && 'animate-spin')} />
            Auto-Match
          </Button>
          {selectedTransactions.size > 0 && (
            <Button onClick={() => reconcileMutation.mutate(Array.from(selectedTransactions))} disabled={reconcileMutation.isPending}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Reconcile Selected ({selectedTransactions.size})
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">For Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.forReview}</div>
            <p className="text-xs text-muted-foreground">Pending matches</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categorized</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categorized}</div>
            <p className="text-xs text-muted-foreground">By rules</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Reconciled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reconciled}</div>
            <p className="text-xs text-green-600">Confirmed matches</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Excluded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.excluded}</div>
            <p className="text-xs text-muted-foreground">Not tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="for-review">
            For Review
            {stats.forReview > 0 && (
              <Badge variant="secondary" className="ml-2">{stats.forReview}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="categorized">Categorized</TabsTrigger>
          <TabsTrigger value="reconciled">Reconciled</TabsTrigger>
          <TabsTrigger value="excluded">Excluded</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transactions</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0}
                        onCheckedChange={(checked) => checked ? selectAll() : clearSelection()}
                      />
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading transactions...
                      </TableCell>
                    </TableRow>
                  ) : filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No transactions found in this category.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map(renderTransactionRow)
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BankReconciliation;
