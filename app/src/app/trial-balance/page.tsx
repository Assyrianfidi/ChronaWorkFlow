'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { TrialBalance, TrialBalanceItem } from '@/types';

export default function TrialBalancePage() {
  const [trialBalance, setTrialBalance] = useState<TrialBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchTrialBalance = async () => {
    try {
      const data = await api.get<TrialBalance>(API_ENDPOINTS.trialBalance.get);
      setTrialBalance(data);
      setLastUpdated(new Date());
    } catch (error) {
      toast.error('Failed to fetch trial balance');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrialBalance();
    const interval = setInterval(fetchTrialBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const result = await api.get<{ isBalanced: boolean; difference: number }>(
        API_ENDPOINTS.trialBalance.validate
      );
      if (result.isBalanced) {
        toast.success('Trial balance is valid - Books are balanced!');
      } else {
        toast.error(`Trial balance is unbalanced by ${formatCurrency(result.difference)}`);
      }
    } catch (error) {
      toast.error('Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getAccountTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      asset: 'bg-blue-100 text-blue-800',
      liability: 'bg-red-100 text-red-800',
      equity: 'bg-green-100 text-green-800',
      revenue: 'bg-purple-100 text-purple-800',
      expense: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return <TrialBalanceSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trial Balance</h1>
          <p className="text-muted-foreground">
            As of {trialBalance?.asOfDate ? new Date(trialBalance.asOfDate).toLocaleDateString() : 'today'} • 
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTrialBalance}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleValidate} disabled={isValidating}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {isValidating ? 'Validating...' : 'Validate'}
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {trialBalance && (
        <Alert className={trialBalance.isBalanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          {trialBalance.isBalanced ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          <AlertTitle className={trialBalance.isBalanced ? 'text-green-800' : 'text-red-800'}>
            {trialBalance.isBalanced ? 'Books Are Balanced' : 'Books Are Unbalanced'}
          </AlertTitle>
          <AlertDescription className={trialBalance.isBalanced ? 'text-green-700' : 'text-red-700'}>
            {trialBalance.isBalanced
              ? 'Total debits equal total credits. Your books are mathematically correct.'
              : `Difference: ${formatCurrency(trialBalance.difference)}. Review journal entries for errors.`}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Account Balances</CardTitle>
              <CardDescription>All accounts with their debit and credit balances</CardDescription>
            </div>
            {trialBalance && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Debits</p>
                <p className="text-lg font-bold">{formatCurrency(trialBalance.totalDebits)}</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Opening</TableHead>
                <TableHead className="text-right">Debits</TableHead>
                <TableHead className="text-right">Credits</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead className="text-right">Closing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trialBalance?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No accounts found
                  </TableCell>
                </TableRow>
              ) : (
                trialBalance?.items.map((item: TrialBalanceItem) => (
                  <TableRow key={item.accountId}>
                    <TableCell className="font-medium">{item.accountCode}</TableCell>
                    <TableCell>{item.accountName}</TableCell>
                    <TableCell>
                      <Badge className={getAccountTypeColor(item.accountType)}>
                        {item.accountType.charAt(0).toUpperCase() + item.accountType.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.openingBalance)}</TableCell>
                    <TableCell className="text-right text-emerald-600">
                      {item.debits > 0 ? formatCurrency(item.debits) : '-'}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {item.credits > 0 ? formatCurrency(item.credits) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.netMovement)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.closingBalance)}
                    </TableCell>
                  </TableRow>
                ))
              )}
              {trialBalance && (
                <TableRow className="font-bold border-t-2">
                  <TableCell colSpan={4} className="text-right">TOTALS:</TableCell>
                  <TableCell className={`text-right ${trialBalance.isBalanced ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(trialBalance.totalDebits)}
                  </TableCell>
                  <TableCell className={`text-right ${trialBalance.isBalanced ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(trialBalance.totalCredits)}
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function TrialBalanceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <Skeleton className="h-24 w-full" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
