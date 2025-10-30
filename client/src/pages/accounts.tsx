import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ChevronRight, ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAccounts, type Account } from "@/hooks/use-api";
import { Skeleton } from "@/components/ui/skeleton";

const typeColors = {
  asset: "default",
  liability: "destructive",
  equity: "secondary",
  revenue: "default",
  expense: "secondary",
} as const;

const typeLabels = {
  asset: "Asset",
  liability: "Liability",
  equity: "Equity",
  revenue: "Revenue",
  expense: "Expense",
} as const;

export default function Accounts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: accounts = [], isLoading } = useAccounts();

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  // Build hierarchical structure from flat accounts data
  const buildHierarchy = (accounts: Account[]): Account[] => {
    const accountMap = new Map<string, Account & { children: Account[] }>();
    const rootAccounts: (Account & { children: Account[] })[] = [];

    // Initialize all accounts
    accounts.forEach(account => {
      accountMap.set(account.id, { ...account, children: [] });
    });

    // Build hierarchy
    accounts.forEach(account => {
      const accountWithChildren = accountMap.get(account.id)!;

      if (account.parentId) {
        const parent = accountMap.get(account.parentId);
        if (parent) {
          parent.children.push(accountWithChildren);
        }
      } else {
        rootAccounts.push(accountWithChildren);
      }
    });

    return rootAccounts;
  };

  const flatAccounts = buildHierarchy(accounts) as (Account & { children: Account[] })[];

  const renderAccount = (account: Account & { children: Account[] }, level: number = 0) => {
    const hasChildren = account.children && account.children.length > 0;
    const isExpanded = expandedIds.has(account.id);
    const matchesSearch = searchQuery === "" ||
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.code.includes(searchQuery);

    if (!matchesSearch && searchQuery !== "") return null;

    return (
      <React.Fragment key={account.id}>
        <TableRow data-testid={`account-row-${account.id}`}>
          <TableCell>
            <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 1.5}rem` }}>
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(account.id)}
                  className="hover:bg-accent rounded p-1 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              ) : (
                <span className="w-6" />
              )}
              <span className={`${level === 0 ? 'font-semibold' : level === 1 ? 'font-medium' : ''}`}>
                {account.code}
              </span>
            </div>
          </TableCell>
          <TableCell className={`${level === 0 ? 'font-semibold' : level === 1 ? 'font-medium' : ''}`}>
            {account.name}
          </TableCell>
          <TableCell>
            <Badge variant={typeColors[account.type as keyof typeof typeColors]}>
              {typeLabels[account.type as keyof typeof typeLabels]}
            </Badge>
          </TableCell>
          <TableCell className={`text-right tabular-nums ${level === 0 ? 'font-semibold' : level === 1 ? 'font-medium' : ''}`}>
            <span className={
              account.type === 'revenue' ? 'text-chart-2' :
              account.type === 'expense' ? 'text-destructive' :
              account.type === 'asset' ? 'text-chart-1' :
              account.type === 'liability' ? 'text-destructive' : ''
            }>
              ${parseFloat(account.balance).toLocaleString()}
            </span>
          </TableCell>
        </TableRow>
        {hasChildren && isExpanded && account.children?.map(child => renderAccount(child, level + 1))}
      </React.Fragment>
    );
  };

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
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Chart of Accounts</h1>
          <p className="text-muted-foreground">Manage your company's account structure</p>
        </div>
        <Button data-testid="button-create-account">
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Account Hierarchy</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-accounts"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {flatAccounts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? "No accounts found matching your search." : "No accounts yet. Add your first account to get started."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead className="w-32">Type</TableHead>
                  <TableHead className="text-right w-40">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flatAccounts.map(account => renderAccount(account))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
