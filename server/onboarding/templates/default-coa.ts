export type DefaultCoaAccount = {
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parentCode?: string;
  description?: string;
};

export const DEFAULT_COA: DefaultCoaAccount[] = [
  { code: '1000', name: 'Assets', type: 'asset' },
  { code: '1100', name: 'Current Assets', type: 'asset', parentCode: '1000' },
  { code: '1110', name: 'Cash', type: 'asset', parentCode: '1100', description: 'Cash and cash equivalents' },
  { code: '1120', name: 'Accounts Receivable', type: 'asset', parentCode: '1100' },
  { code: '2000', name: 'Liabilities', type: 'liability' },
  { code: '2100', name: 'Current Liabilities', type: 'liability', parentCode: '2000' },
  { code: '2110', name: 'Accounts Payable', type: 'liability', parentCode: '2100' },
  { code: '3000', name: 'Equity', type: 'equity' },
  { code: '3200', name: 'Retained Earnings', type: 'equity', parentCode: '3000' },
  { code: '4000', name: 'Revenue', type: 'revenue' },
  { code: '4100', name: 'Sales Revenue', type: 'revenue', parentCode: '4000' },
  { code: '5000', name: 'Expenses', type: 'expense' },
  { code: '5100', name: 'Operating Expenses', type: 'expense', parentCode: '5000' },
  { code: '5120', name: 'Rent', type: 'expense', parentCode: '5100' },
];
