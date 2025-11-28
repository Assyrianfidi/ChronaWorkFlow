// Base account type that matches the API response
export interface Account {
  id: string;
  companyId: string;
  code: string;
  name: string;
  type: AccountType;
  parentId?: string;
  balance: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface AccountWithChildren extends Omit<Account, 'type'> {
  type: AccountType;
  children: AccountWithChildren[];
  level?: number;
  isExpanded?: boolean;
}

export interface AccountsState {
  searchQuery: string;
  expandedIds: Set<string>;
  isLoading: boolean;
}

export interface AccountsTableProps {
  accounts: AccountWithChildren[];
  searchQuery: string;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
}

export interface AccountRowProps {
  account: AccountWithChildren;
  level: number;
  isExpanded: boolean;
  hasChildren: boolean;
  onToggleExpand: (id: string) => void;
  matchesSearch: boolean;
}

// Type guards
export function isAccountWithChildren(account: any): account is AccountWithChildren {
  return account && Array.isArray(account.children);
}

// Utility functions
export const getAccountTypeLabel = (type: AccountType): string => {
  const typeLabels = {
    asset: 'Asset',
    liability: 'Liability',
    equity: 'Equity',
    revenue: 'Revenue',
    expense: 'Expense',
  };
  return typeLabels[type] || type;
};

export const getAccountTypeVariant = (type: AccountType) => {
  const variants = {
    asset: 'default',
    liability: 'destructive',
    equity: 'secondary',
    revenue: 'default',
    expense: 'secondary',
  } as const;
  return variants[type] || 'default';
};
