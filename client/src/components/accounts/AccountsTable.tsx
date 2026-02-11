import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/components/ui/table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import type {
  AccountWithChildren,
  AccountRowProps,
  AccountsTableProps,
} from "../../types/accounts";

export const AccountRow: React.FC<AccountRowProps> = ({
  account,
  level,
  isExpanded,
  hasChildren,
  onToggleExpand,
  matchesSearch,
}) => {
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

  // Skip rendering if this account doesn't match search and has no matching children
  if (!matchesSearch) return null;

  return (
    <React.Fragment key={account.id}>
      <TableRow data-testid={`account-row-${account.id}`}>
        <TableCell>
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${level * 1.5}rem` }}
          >
            {hasChildren ? (
              <button
                onClick={() => onToggleExpand(account.id)}
                className="hover:bg-accent rounded p-1 transition-colors"
                aria-label={isExpanded ? "Collapse account" : "Expand account"}
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
            <span className="font-medium">{account.code}</span>
          </div>
        </TableCell>
        <TableCell className="font-medium">{account.name}</TableCell>
        <TableCell>
          <Badge variant={typeColors[account.type]}>
            {typeLabels[account.type]}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(Number(account.balance) || 0)}
        </TableCell>
      </TableRow>

      {/* Render children if expanded */}
      {isExpanded &&
        account.children.map((child) => (
          <AccountRow
            key={child.id}
            account={child}
            level={level + 1}
            isExpanded={isExpanded}
            hasChildren={child.children.length > 0}
            onToggleExpand={onToggleExpand}
            matchesSearch={true} // Children are already filtered by parent
          />
        ))}
    </React.Fragment>
  );
};

export const AccountsTable: React.FC<AccountsTableProps> = ({
  accounts,
  searchQuery,
  expandedIds,
  onToggleExpand,
}) => {
  // Filter accounts based on search query
  const filterAccounts = (
    accounts: AccountWithChildren[],
    query: string,
  ): AccountWithChildren[] => {
    if (!query) return accounts;

    const searchLower = query.toLowerCase();

    return accounts
      .map((account) => {
        // Check if account matches search
        const matchesSearch =
          account.name.toLowerCase().includes(searchLower) ||
          account.code.toLowerCase().includes(searchLower);

        // Filter children recursively
        const filteredChildren = filterAccounts(
          account.children || [],
          searchLower,
        );
        const hasMatchingChildren = filteredChildren.length > 0;

        // Include account if it matches search or has matching children
        return matchesSearch || hasMatchingChildren
          ? {
              ...account,
              children: filteredChildren,
              isExpanded: hasMatchingChildren ? true : account.isExpanded,
            }
          : null;
      })
      .filter(Boolean) as AccountWithChildren[];
  };

  const filteredAccounts = filterAccounts(accounts, searchQuery);

  if (filteredAccounts.length === 0) {
    return (
      <EmptyState
        size="sm"
        title={
          searchQuery
            ? `No accounts found matching "${searchQuery}"`
            : "No accounts found"
        }
        description={
          searchQuery ? undefined : "Create your first account to get started."
        }
      />
    );
  }

  return (
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
        {filteredAccounts.map((account) => (
          <AccountRow
            key={account.id}
            account={account}
            level={0}
            isExpanded={expandedIds.has(account.id)}
            hasChildren={(account.children?.length || 0) > 0}
            onToggleExpand={onToggleExpand}
            matchesSearch={true} // Already filtered
          />
        ))}
      </TableBody>
    </Table>
  );
};

export default AccountsTable;
