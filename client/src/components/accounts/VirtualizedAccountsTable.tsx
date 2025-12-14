import React, { useCallback, useMemo, memo, useRef } from "react";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "../components/ui/table.js";
import { Skeleton } from "../components/ui/skeleton.js";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AccountRow } from "./AccountRow.js";
import type { AccountWithChildren } from "../types/accounts.js";

// Define the type for flattened account items
interface FlattenedAccount {
  account: AccountWithChildren;
  level: number;
  visible: boolean;
}

interface VirtualizedAccountsTableProps {
  accounts: AccountWithChildren[];
  searchQuery: string;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
}

// Flatten the hierarchical data for virtualization
const flattenAccounts = (
  accounts: AccountWithChildren[],
  level = 0,
  result: FlattenedAccount[] = [],
): FlattenedAccount[] => {
  accounts.forEach((account) => {
    const isExpanded = account.isExpanded ?? false;
    const hasVisibleChildren = account.children.some(
      (child) => child.isExpanded || child.children.length === 0,
    );

    result.push({
      account,
      visible: true,
      level,
    });

    if (isExpanded || hasVisibleChildren) {
      flattenAccounts(account.children, level + 1, result);
    }
  });
  return result;
};

export const VirtualizedAccountsTable: React.FC<VirtualizedAccountsTableProps> =
  memo(({ accounts, searchQuery, expandedIds, onToggleExpand }) => {
    const parentRef = useRef<HTMLDivElement>(null);

    // Filter accounts based on search query
    const filteredAccounts = useMemo(() => {
      if (!searchQuery) return accounts;

      const searchLower = searchQuery.toLowerCase();
      return accounts.filter(
        (account) =>
          account.name.toLowerCase().includes(searchLower) ||
          account.code.toLowerCase().includes(searchLower),
      );
    }, [accounts, searchQuery]);

    // Flatten the hierarchical data for virtualization
    const flattenedAccounts = useMemo(
      () => flattenAccounts(filteredAccounts),
      [filteredAccounts],
    );

    // Estimate row height based on content
    const getRowHeight = useCallback(
      (index: number) => {
        const { level } = flattenedAccounts[index];
        // Base height + padding based on level
        return 48 + level * 4;
      },
      [flattenedAccounts],
    );

    const virtualizer = useVirtualizer({
      count: flattenedAccounts.length,
      getScrollElement: () => parentRef.current,
      estimateSize: (index) => getRowHeight(index),
      overscan: 10,
    });

    const renderRow = useCallback(
      (index: number) => {
        const { account, level } = flattenedAccounts[index];
        const isExpanded = expandedIds.has(account.id);
        const hasChildren = account.children.length > 0;

        return (
          <AccountRow
            account={account}
            level={level}
            isExpanded={isExpanded}
            hasChildren={hasChildren}
            onToggleExpand={onToggleExpand}
            matchesSearch={true}
          />
        );
      },
      [expandedIds, flattenedAccounts, onToggleExpand],
    );

    if (filteredAccounts.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? (
            <p>No accounts found matching "{searchQuery}"</p>
          ) : (
            <p>No accounts found. Create your first account to get started.</p>
          )}
        </div>
      );
    }

    return (
      <div className="w-full h-[600px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-48">Code</TableHead>
              <TableHead>Account Name</TableHead>
              <TableHead className="w-32">Type</TableHead>
              <TableHead className="text-right w-40">Balance</TableHead>
            </TableRow>
          </TableHeader>
        </Table>

        <div className="w-full h-[calc(100%-48px)]">
          <div ref={parentRef} className="h-full w-full overflow-auto">
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => (
                <div
                  key={virtualItem.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  {renderRow(virtualItem.index)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  });

VirtualizedAccountsTable.displayName = "VirtualizedAccountsTable";

export default VirtualizedAccountsTable;
