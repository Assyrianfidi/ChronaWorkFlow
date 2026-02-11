/**
 * API Configuration for ChronaWorkFlow
 * Production API endpoint
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.chronaworkflow.com/api';

export const API_ENDPOINTS = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    mfa: {
      setup: '/auth/mfa/setup',
      verify: '/auth/mfa/verify',
      disable: '/auth/mfa/disable',
    },
    me: '/auth/me',
  },
  
  // Companies
  companies: {
    list: '/companies',
    create: '/companies',
    update: (id: string) => `/companies/${id}`,
    delete: (id: string) => `/companies/${id}`,
    switch: '/companies/switch',
  },
  
  // Dashboard
  dashboard: {
    metrics: '/dashboard/metrics',
    summary: '/dashboard/summary',
  },
  
  // Accounting
  chartOfAccounts: {
    list: '/accounts',
    create: '/accounts',
    update: (id: string) => `/accounts/${id}`,
    delete: (id: string) => `/accounts/${id}`,
  },
  
  journalEntries: {
    list: '/journal-entries',
    create: '/journal-entries',
    update: (id: string) => `/journal-entries/${id}`,
    delete: (id: string) => `/journal-entries/${id}`,
    post: (id: string) => `/journal-entries/${id}/post`,
  },
  
  generalLedger: {
    entries: '/general-ledger',
    account: (id: string) => `/general-ledger/account/${id}`,
  },
  
  trialBalance: {
    get: '/trial-balance',
    validate: '/trial-balance/validate',
  },
  
  // Invoicing
  invoices: {
    list: '/invoices',
    create: '/invoices',
    update: (id: string) => `/invoices/${id}`,
    delete: (id: string) => `/invoices/${id}`,
    send: (id: string) => `/invoices/${id}/send`,
    pay: (id: string) => `/invoices/${id}/pay`,
    pdf: (id: string) => `/invoices/${id}/pdf`,
  },
  
  customers: {
    list: '/customers',
    create: '/customers',
    update: (id: string) => `/customers/${id}`,
    delete: (id: string) => `/customers/${id}`,
  },
  
  // Expenses
  expenses: {
    list: '/expenses',
    create: '/expenses',
    update: (id: string) => `/expenses/${id}`,
    delete: (id: string) => `/expenses/${id}`,
    upload: '/expenses/upload',
  },
  
  vendors: {
    list: '/vendors',
    create: '/vendors',
    update: (id: string) => `/vendors/${id}`,
    delete: (id: string) => `/vendors/${id}`,
  },
  
  bills: {
    list: '/bills',
    create: '/bills',
    update: (id: string) => `/bills/${id}`,
    delete: (id: string) => `/bills/${id}`,
    pay: (id: string) => `/bills/${id}/pay`,
  },
  
  // Reports
  reports: {
    profitLoss: '/reports/profit-loss',
    balanceSheet: '/reports/balance-sheet',
    cashFlow: '/reports/cash-flow',
    aging: '/reports/aging',
    export: '/reports/export',
  },
  
  // Users
  users: {
    list: '/users',
    invite: '/users/invite',
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
    roles: '/users/roles',
  },
  
  // Settings
  settings: {
    company: '/settings/company',
    fiscal: '/settings/fiscal',
    tax: '/settings/tax',
    currency: '/settings/currency',
    integrations: '/settings/integrations',
  },
  
  // Billing
  billing: {
    plans: '/billing/plans',
    subscription: '/billing/subscription',
    invoices: '/billing/invoices',
    payment: '/billing/payment',
  },
  
  // Audit
  audit: {
    logs: '/audit/logs',
    transactions: '/audit/transactions',
  },
};

// Request timeout in milliseconds
export const REQUEST_TIMEOUT = 30000;

// Auto-refresh interval in milliseconds
export const AUTO_REFRESH_INTERVAL = 30000;
