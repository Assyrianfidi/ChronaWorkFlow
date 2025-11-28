import { useState, useCallback, useMemo } from 'react';
import { useAccounts } from './use-api';
import type { Account, AccountWithChildren } from '../types/accounts';

interface UseAccountsTableProps {
  companyId?: string;
  initialSearchQuery?: string;
}

export function useAccountsTable({
  companyId = 'default-company-id',
  initialSearchQuery = '',
}: UseAccountsTableProps = {}) {
  // State for search, expanded rows, and selected accounts
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fetch accounts data
  const { data: accounts = [], isLoading, error } = useAccounts(companyId);

  // Build hierarchical structure from flat accounts data
  const buildHierarchy = useCallback((accounts: Account[] = []) => {
    type AccountNode = Account & { children: AccountNode[]; level: number };
    
    const accountMap = new Map<string, AccountNode>();
    const rootAccounts: AccountNode[] = [];

    // First pass: create all account nodes
    accounts.forEach((account) => {
      accountMap.set(account.id, {
        ...account,
        children: [],
        level: 0,
      });
    });

    // Second pass: build the hierarchy
    accounts.forEach((account) => {
      const accountNode = accountMap.get(account.id)!;

      if (account.parentId) {
        const parent = accountMap.get(account.parentId);
        if (parent) {
          accountNode.level = (parent.level || 0) + 1;
          parent.children.push(accountNode);
        }
      } else {
        accountNode.level = 0;
        rootAccounts.push(accountNode);
      }
    });

    // Sort children by code for consistent display
    const sortAccounts = (accounts: AccountNode[]): AccountNode[] => {
      return [...accounts]
        .sort((a, b) => a.code.localeCompare(b.code))
        .map((account) => ({
          ...account,
          children: sortAccounts(account.children),
        }));
    };

    return sortAccounts(rootAccounts) as AccountWithChildren[];
  }, []);

  // Memoize the hierarchical accounts data
  const hierarchicalAccounts = useMemo(
    () => buildHierarchy(accounts),
    [accounts, buildHierarchy]
  );

  // Toggle expand/collapse for an account
  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return newExpanded;
    });
  }, []);

  // Toggle selection for an account
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  // Select all visible accounts
  const selectAll = useCallback((accountIds: string[]) => {
    setSelectedIds(prev => {
      // If some accounts are already selected, deselect all
      if (accountIds.some(id => prev.has(id))) {
        return new Set();
      }
      // Otherwise select all
      return new Set(accountIds);
    });
  }, []);

  // Filter accounts based on search query
  const filteredAccounts = useMemo(() => {
    if (!searchQuery) return hierarchicalAccounts;
    
    const searchLower = searchQuery.toLowerCase();
    
    const filterAccounts = (accounts: AccountWithChildren[]): AccountWithChildren[] => {
      return accounts
        .map(account => {
          const matchesSearch = 
            account.name.toLowerCase().includes(searchLower) || 
            account.code.toLowerCase().includes(searchLower);
          
          const filteredChildren = filterAccounts(account.children);
          const hasMatchingChildren = filteredChildren.length > 0;
          
          if (matchesSearch || hasMatchingChildren) {
            return {
              ...account,
              children: filteredChildren,
              isExpanded: hasMatchingChildren ? true : account.isExpanded,
            };
          }
          
          return null;
        })
        .filter(Boolean) as AccountWithChildren[];
    };
    
    return filterAccounts(hierarchicalAccounts);
  }, [hierarchicalAccounts, searchQuery]);

  // Get all visible account IDs for select all functionality
  const getAllVisibleIds = useCallback((accounts: AccountWithChildren[]): string[] => {
    return accounts.reduce<string[]>((acc, account) => {
      acc.push(account.id);
      if (expandedIds.has(account.id)) {
        acc.push(...getAllVisibleIds(account.children));
      }
      return acc;
    }, []);
  }, [expandedIds]);

  // Get all currently visible account IDs
  const visibleAccountIds = useMemo(() => {
    return getAllVisibleIds(filteredAccounts);
  }, [filteredAccounts, getAllVisibleIds]);

  // Check if all visible accounts are selected
  const allSelected = useMemo(() => {
    if (visibleAccountIds.length === 0) return false;
    return visibleAccountIds.every(id => selectedIds.has(id));
  }, [selectedIds, visibleAccountIds]);

  // Check if some (but not all) visible accounts are selected
  const someSelected = useMemo(() => {
    if (allSelected) return false;
    return visibleAccountIds.some(id => selectedIds.has(id));
  }, [allSelected, selectedIds, visibleAccountIds]);

  // Toggle select all visible accounts
  const toggleSelectAll = useCallback(() => {
    selectAll(visibleAccountIds);
  }, [selectAll, visibleAccountIds]);

  return {
    // State
    accounts: filteredAccounts,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    expandedIds,
    toggleExpand,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    allSelected,
    someSelected,
    // Helpers
    getAccountById: useCallback((id: string) => {
      const findAccount = (accounts: AccountWithChildren[]): AccountWithChildren | undefined => {
        for (const account of accounts) {
          if (account.id === id) return account;
          const found = findAccount(account.children);
          if (found) return found;
        }
        return undefined;
      };
      return findAccount(hierarchicalAccounts);
    }, [hierarchicalAccounts]),
  };
}

export default useAccountsTable;
