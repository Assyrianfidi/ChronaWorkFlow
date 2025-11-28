import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AccountsTable } from '../AccountsTable';
import type { AccountWithChildren } from '../types/accounts';

// Mock data for testing
const mockAccounts: AccountWithChildren[] = [
  {
    id: '1',
    companyId: 'company-1',
    code: '1000',
    name: 'Cash',
    type: 'asset',
    balance: '10000.00',
    isActive: true,
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
    children: [
      {
        id: '2',
        companyId: 'company-1',
        code: '1100',
        name: 'Bank Account',
        type: 'asset',
        parentId: '1',
        balance: '10000.00',
        isActive: true,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        children: [],
        level: 1,
      },
    ],
    level: 0,
  },
  {
    id: '3',
    companyId: 'company-1',
    code: '2000',
    name: 'Accounts Payable',
    type: 'liability',
    balance: '5000.00',
    isActive: true,
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
    children: [],
    level: 0,
  },
];

describe('AccountsTable', () => {
  const mockOnToggleExpand = vi.fn();
  const defaultProps = {
    accounts: mockAccounts,
    searchQuery: '',
    expandedIds: new Set<string>(),
    onToggleExpand: mockOnToggleExpand,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders accounts table with correct data', () => {
    render(<AccountsTable {...defaultProps} />);
    
    // Check if parent accounts are rendered
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('Cash')).toBeInTheDocument();
    expect(screen.getByText('2000')).toBeInTheDocument();
    expect(screen.getByText('Accounts Payable')).toBeInTheDocument();
    
    // Check if child accounts are not rendered by default
    expect(screen.queryByText('1100')).not.toBeInTheDocument();
    expect(screen.queryByText('Bank Account')).not.toBeInTheDocument();
  });

  it('expands and collapses accounts when expand/collapse button is clicked', () => {
    render(<AccountsTable {...defaultProps} expandedIds={new Set(['1'])} />);
    
    // Click on the expand button
    const expandButton = screen.getByLabelText('Expand account');
    fireEvent.click(expandButton);
    
    // Check if onToggleExpand was called with the correct account ID
    expect(mockOnToggleExpand).toHaveBeenCalledWith('1');
  });

  it('filters accounts based on search query', () => {
    render(<AccountsTable {...defaultProps} searchQuery="bank" />);
    
    // Check if only matching accounts are shown
    expect(screen.queryByText('Cash')).not.toBeInTheDocument();
    expect(screen.queryByText('Bank Account')).toBeInTheDocument();
    expect(screen.queryByText('Accounts Payable')).not.toBeInTheDocument();
  });

  it('shows empty state when no accounts match search', () => {
    render(<AccountsTable {...defaultProps} searchQuery="nonexistent" />);
    
    expect(screen.getByText('No accounts found matching "nonexistent"')).toBeInTheDocument();
  });

  it('shows empty state when there are no accounts', () => {
    render(<AccountsTable {...defaultProps} accounts={[]} />);
    
    expect(screen.getByText('No accounts found. Create your first account to get started.')).toBeInTheDocument();
  });
});
