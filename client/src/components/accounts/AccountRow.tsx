import React from "react";
import { TableRow, TableCell } from '../components/ui/table';
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from '../components/ui/badge';
import {
  getAccountTypeLabel,
  getAccountTypeVariant,
} from '../../types/accounts';
import type { AccountWithChildren } from '../../types/accounts';

interface AccountRowProps {
  account: AccountWithChildren;
  level: number;
  isExpanded: boolean;
  hasChildren: boolean;
  onToggleExpand: (id: string) => void;
  matchesSearch: boolean;
}

export const AccountRow: React.FC<AccountRowProps> = ({
  account,
  level,
  isExpanded,
  hasChildren,
  onToggleExpand,
  matchesSearch,
}) => {
  if (!matchesSearch) return null;

  return (
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
              data-testid={`toggle-expand-${account.id}`}
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
        <Badge variant={getAccountTypeVariant(account.type)}>
          {getAccountTypeLabel(account.type)}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        {new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(Number(account.balance) || 0)}
      </TableCell>
    </TableRow>
  );
};

export default React.memo(AccountRow);
