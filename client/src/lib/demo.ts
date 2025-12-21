type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

type DemoAccount = {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  parentId?: string;
  balance?: string;
  description?: string;
  isActive?: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
};

type DemoLedgerTransactionLine = {
  id: string;
  transactionId: string;
  accountId: string;
  debit: string;
  credit: string;
  description?: string;
};

type DemoLedgerTransaction = {
  id: string;
  companyId: string;
  transactionNumber: string;
  date: string;
  type: "journal_entry" | "invoice" | "payment" | "bank";
  totalAmount: string;
  description?: string;
  referenceNumber?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lines: DemoLedgerTransactionLine[];
};

type DemoInvoice = {
  id: string;
  number: string;
  client: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  dueDate: string;
  createdAt: string;
};

type DemoDashboardTransaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category: string;
  date: string;
  status: "completed" | "pending" | "failed";
};

type DemoCustomer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  totalInvoiced: number;
  totalPaid: number;
  balance: number;
  status: "active" | "inactive";
  createdAt: string;
};

type DemoState = {
  version: 1;
  companyId: string;
  accounts: DemoAccount[];
  ledgerTransactions: DemoLedgerTransaction[];
  invoices: DemoInvoice[];
  dashboardTransactions: DemoDashboardTransaction[];
  customers: DemoCustomer[];
};

const STORAGE_KEY = "accubooks_demo_state_v1";
const DEMO_FLAG_KEY = "accubooks_demo";
const DEMO_COMPANY_ID = "demo-company";

function nowIso() {
  return new Date().toISOString();
}

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function isDemoModeEnabled(): boolean {
  try {
    return localStorage.getItem(DEMO_FLAG_KEY) === "true";
  } catch {
    return false;
  }
}

export function getDemoCompanyId() {
  return DEMO_COMPANY_ID;
}

function seedState(): DemoState {
  const ts = nowIso();
  const companyId = DEMO_COMPANY_ID;

  const accounts: DemoAccount[] = [
    {
      id: "demo-acct-cash",
      code: "1000",
      name: "Cash - Operating",
      type: "ASSET",
      balance: "84250.34",
      description: "Primary operating cash account",
      isActive: true,
      companyId,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: "demo-acct-ar",
      code: "1100",
      name: "Accounts Receivable",
      type: "ASSET",
      balance: "32150.00",
      description: "Outstanding customer invoices",
      isActive: true,
      companyId,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: "demo-acct-ap",
      code: "2000",
      name: "Accounts Payable",
      type: "LIABILITY",
      balance: "14720.40",
      description: "Outstanding vendor bills",
      isActive: true,
      companyId,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: "demo-acct-rev",
      code: "4000",
      name: "Sales Revenue",
      type: "REVENUE",
      balance: "248900.00",
      description: "Revenue from sales",
      isActive: true,
      companyId,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: "demo-acct-exp",
      code: "6000",
      name: "Operating Expenses",
      type: "EXPENSE",
      balance: "156480.75",
      description: "General operating expenses",
      isActive: true,
      companyId,
      createdAt: ts,
      updatedAt: ts,
    },
  ];

  const ledgerTransactions: DemoLedgerTransaction[] = [
    {
      id: "demo-ledger-1",
      companyId,
      transactionNumber: "JE-0001",
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
      type: "journal_entry",
      totalAmount: "2500.00",
      description: "Monthly software subscriptions",
      referenceNumber: "SUBS-APR",
      createdBy: "demo-system",
      createdAt: ts,
      updatedAt: ts,
      lines: [
        {
          id: "demo-ledger-1-a",
          transactionId: "demo-ledger-1",
          accountId: "demo-acct-exp",
          debit: "2500.00",
          credit: "0.00",
          description: "Subscriptions expense",
        },
        {
          id: "demo-ledger-1-b",
          transactionId: "demo-ledger-1",
          accountId: "demo-acct-cash",
          debit: "0.00",
          credit: "2500.00",
          description: "Paid from cash",
        },
      ],
    },
  ];

  const invoices: DemoInvoice[] = [
    {
      id: "demo-inv-1001",
      number: "INV-1001",
      client: "Northwind Traders",
      amount: 12840,
      status: "paid",
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22).toISOString(),
    },
    {
      id: "demo-inv-1002",
      number: "INV-1002",
      client: "Contoso Logistics",
      amount: 4920,
      status: "pending",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
    {
      id: "demo-inv-1003",
      number: "INV-1003",
      client: "Fabrikam Manufacturing",
      amount: 21500,
      status: "overdue",
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 34).toISOString(),
    },
  ];

  const dashboardTransactions: DemoDashboardTransaction[] = [
    {
      id: "demo-dtxn-1",
      type: "income",
      amount: 7850,
      description: "Payment received - Northwind",
      category: "Accounts Receivable",
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      status: "completed",
    },
    {
      id: "demo-dtxn-2",
      type: "expense",
      amount: 2500,
      description: "Subscriptions - SaaS Stack",
      category: "Software",
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
      status: "completed",
    },
    {
      id: "demo-dtxn-3",
      type: "expense",
      amount: 1840,
      description: "Cloud hosting",
      category: "Infrastructure",
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      status: "completed",
    },
  ];

  const customers: DemoCustomer[] = [
    {
      id: "demo-cust-1",
      name: "Northwind Traders",
      email: "ap@northwind.example",
      phone: "+1 (555) 014-1000",
      address: "123 Market St, Seattle, WA",
      totalInvoiced: 48200,
      totalPaid: 41360,
      balance: 6840,
      status: "active",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 220).toISOString(),
    },
    {
      id: "demo-cust-2",
      name: "Contoso Logistics",
      email: "billing@contoso.example",
      phone: "+1 (555) 014-2000",
      address: "88 Industrial Ave, Austin, TX",
      totalInvoiced: 21920,
      totalPaid: 17000,
      balance: 4920,
      status: "active",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 140).toISOString(),
    },
    {
      id: "demo-cust-3",
      name: "Fabrikam Manufacturing",
      email: "finance@fabrikam.example",
      phone: "+1 (555) 014-3000",
      address: "5 Foundry Rd, Cleveland, OH",
      totalInvoiced: 65000,
      totalPaid: 43500,
      balance: 21500,
      status: "active",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 310).toISOString(),
    },
  ];

  return {
    version: 1,
    companyId,
    accounts,
    ledgerTransactions,
    invoices,
    dashboardTransactions,
    customers,
  };
}

function loadState(): DemoState {
  const stored = safeParse<DemoState>(localStorage.getItem(STORAGE_KEY));
  if (stored && stored.version === 1) return stored;
  const seeded = seedState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveState(next: DemoState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function demoAccountsApi() {
  return {
    list(companyId: string) {
      const state = loadState();
      return state.accounts.filter((a) => a.companyId === companyId);
    },
    create(account: Omit<DemoAccount, "id" | "createdAt" | "updatedAt">) {
      const state = loadState();
      const ts = nowIso();
      const next: DemoAccount = { ...account, id: genId("demo-acct"), createdAt: ts, updatedAt: ts };
      const updated: DemoState = { ...state, accounts: [...state.accounts, next] };
      saveState(updated);
      return next;
    },
    update(id: string, updates: Partial<DemoAccount>) {
      const state = loadState();
      const existing = state.accounts.find((a) => a.id === id);
      if (!existing) throw new Error("Account not found");
      const next: DemoAccount = { ...existing, ...updates, updatedAt: nowIso() };
      const updated: DemoState = { ...state, accounts: state.accounts.map((a) => (a.id === id ? next : a)) };
      saveState(updated);
      return next;
    },
    adjustBalance(id: string, amount: number) {
      const state = loadState();
      const existing = state.accounts.find((a) => a.id === id);
      if (!existing) throw new Error("Account not found");
      const current = Number.parseFloat(existing.balance || "0");
      const nextBalance = (current + amount).toFixed(2);
      return this.update(id, { balance: nextBalance });
    },
  };
}

export function demoLedgerApi() {
  return {
    list(companyId: string) {
      const state = loadState();
      return state.ledgerTransactions.filter((t) => t.companyId === companyId);
    },
    create(transaction: Omit<DemoLedgerTransaction, "id" | "createdAt" | "updatedAt">) {
      const state = loadState();
      const ts = nowIso();
      const id = genId("demo-ledger");
      const lines = transaction.lines.map((l) => ({ ...l, id: genId("demo-line"), transactionId: id }));
      const next: DemoLedgerTransaction = { ...transaction, id, createdAt: ts, updatedAt: ts, lines };
      const updated: DemoState = { ...state, ledgerTransactions: [next, ...state.ledgerTransactions] };
      saveState(updated);
      return next;
    },
  };
}

export function demoDashboardApi() {
  return {
    getKPIs(period: "7-day" | "30-day" | "quarter" = "30-day") {
      const state = loadState();
      const income = state.dashboardTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const expense = state.dashboardTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      const scale = period === "7-day" ? 0.35 : period === "quarter" ? 2.4 : 1;
      const revenue = Math.round(income * scale);
      const costs = Math.round(expense * scale);
      return {
        totalRevenue: revenue,
        accountsReceivable: 32150,
        netProfit: revenue - costs,
        activeCustomers: state.customers.filter((c) => c.status === "active").length,
        revenueChange: 12.4,
        receivablesChange: -3.8,
        profitChange: 9.1,
        customersChange: 4.0,
      };
    },
    getInvoices(params?: { page?: number; limit?: number; status?: string; search?: string }) {
      const state = loadState();
      const limit = params?.limit ?? 10;
      const page = params?.page ?? 1;
      let filtered = [...state.invoices];
      if (params?.status) filtered = filtered.filter((i) => i.status === params.status);
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter((i) => i.number.toLowerCase().includes(q) || i.client.toLowerCase().includes(q));
      }
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const start = (page - 1) * limit;
      return { invoices: filtered.slice(start, start + limit), total, page, totalPages };
    },
    getInvoice(id: string) {
      const state = loadState();
      const invoice = state.invoices.find((i) => i.id === id);
      if (!invoice) throw new Error("Invoice not found");
      return invoice;
    },
    createInvoice(invoice: Omit<DemoInvoice, "id" | "createdAt">) {
      const state = loadState();
      const next: DemoInvoice = { ...invoice, id: genId("demo-inv"), createdAt: nowIso() };
      const updated: DemoState = { ...state, invoices: [next, ...state.invoices] };
      saveState(updated);
      return next;
    },
    updateInvoice(id: string, updates: Partial<DemoInvoice>) {
      const state = loadState();
      const existing = state.invoices.find((i) => i.id === id);
      if (!existing) throw new Error("Invoice not found");
      const next: DemoInvoice = { ...existing, ...updates };
      const updated: DemoState = { ...state, invoices: state.invoices.map((i) => (i.id === id ? next : i)) };
      saveState(updated);
      return next;
    },
    deleteInvoice(id: string) {
      const state = loadState();
      const updated: DemoState = { ...state, invoices: state.invoices.filter((i) => i.id !== id) };
      saveState(updated);
    },
    getTransactions(params?: { page?: number; limit?: number; type?: string; category?: string; search?: string }) {
      const state = loadState();
      const limit = params?.limit ?? 10;
      const page = params?.page ?? 1;
      let filtered = [...state.dashboardTransactions];
      if (params?.type) filtered = filtered.filter((t) => t.type === params.type);
      if (params?.category) filtered = filtered.filter((t) => t.category === params.category);
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter((t) => t.description.toLowerCase().includes(q));
      }
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const start = (page - 1) * limit;
      return { transactions: filtered.slice(start, start + limit), total, page, totalPages };
    },
    getCustomers(params?: { page?: number; limit?: number; status?: string; search?: string }) {
      const state = loadState();
      const limit = params?.limit ?? 10;
      const page = params?.page ?? 1;
      let filtered = [...state.customers];
      if (params?.status) filtered = filtered.filter((c) => c.status === params.status);
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
      }
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const start = (page - 1) * limit;
      return { customers: filtered.slice(start, start + limit), total, page, totalPages };
    },
    getExpenseBreakdown(period: "month" | "quarter" | "year" = "month") {
      const scale = period === "year" ? 12 : period === "quarter" ? 3 : 1;
      const base = [
        { name: "Payroll", value: 42000 * scale, color: "#2563eb" },
        { name: "Software", value: 8400 * scale, color: "#06b6d4" },
        { name: "Infrastructure", value: 6200 * scale, color: "#7c3aed" },
        { name: "Marketing", value: 10500 * scale, color: "#f97316" },
        { name: "Office", value: 3100 * scale, color: "#16a34a" },
      ];
      const total = base.reduce((sum, c) => sum + c.value, 0);
      return base.map((c) => ({ ...c, percentage: Number(((c.value / total) * 100).toFixed(1)) }));
    },
    getCashFlow(period: "6-months" | "12-months" | "24-months" = "6-months") {
      const months = period === "24-months" ? 24 : period === "12-months" ? 12 : 6;
      const result: Array<{ month: string; income: number; expenses: number; net: number }> = [];
      for (let i = months - 1; i >= 0; i -= 1) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const income = 52000 + (months - i) * 1200 + (i % 2 === 0 ? 1800 : -600);
        const expenses = 38200 + (months - i) * 800 + (i % 3 === 0 ? 1200 : -400);
        result.push({
          month: d.toLocaleString(undefined, { month: "short", year: "2-digit" }),
          income: Math.round(income),
          expenses: Math.round(expenses),
          net: Math.round(income - expenses),
        });
      }
      return result;
    },
  };
}

export function getDemoAdminSummary() {
  return {
    totalUsers: 38,
    activeUsers: 24,
    totalRevenue: 1245000,
    monthlyGrowth: 8.4,
    pendingReports: 7,
    systemAlerts: 2,
  };
}

export function getDemoAdminActivity() {
  return [
    {
      id: "demo-activity-1",
      type: "report",
      message: "Quarterly P&L generated for Demo Company",
      timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
      user: "Demo Manager",
    },
    {
      id: "demo-activity-2",
      type: "login",
      message: "Demo Admin logged in",
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      user: "Demo Admin",
    },
    {
      id: "demo-activity-3",
      type: "system",
      message: "Automated backup completed successfully",
      timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    },
  ];
}

export function getDemoComplianceMetrics() {
  return {
    totalAudits: 14,
    compliantRate: 96,
    violationsFound: 1,
    lastAuditDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString(),
    pendingReviews: 3,
    criticalAlerts: 1,
  };
}

export function getDemoAuditLogs() {
  return [
    {
      id: "demo-audit-1",
      action: "Invoice approved",
      user: "Demo Accountant",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      status: "compliant",
      details: "INV-1002 approved within policy thresholds",
    },
    {
      id: "demo-audit-2",
      action: "Expense flagged",
      user: "Demo Auditor",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      status: "warning",
      details: "Vendor documentation pending for cloud hosting invoice",
    },
    {
      id: "demo-audit-3",
      action: "Role change",
      user: "Demo Admin",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
      status: "compliant",
      details: "Manager role granted for department lead",
    },
  ];
}

export function getDemoManagerFinancialKPIs() {
  return {
    monthlyRevenue: 198500,
    profitMargin: 32.8,
    expensesTotal: 133200,
    revenueGrowth: 6.7,
    pendingApprovals: 9,
    teamPerformance: 87,
  };
}

export function getDemoManagerTeamActivity() {
  return [
    {
      id: "demo-team-1",
      type: "approval",
      message: "3 expense reports awaiting approval",
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      priority: "high",
    },
    {
      id: "demo-team-2",
      type: "report",
      message: "Monthly budget variance report generated",
      timestamp: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
      priority: "medium",
    },
    {
      id: "demo-team-3",
      type: "target",
      message: "Revenue target updated for Q4",
      timestamp: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
      priority: "low",
    },
  ];
}

export function getDemoUserStats() {
  return {
    documentsCreated: 18,
    tasksCompleted: 12,
    notificationsCount: 4,
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  };
}

export function getDemoUserActivity() {
  return [
    {
      id: "demo-user-activity-1",
      type: "document",
      message: "Invoice INV-1002 reviewed",
      timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      status: "completed",
    },
    {
      id: "demo-user-activity-2",
      type: "task",
      message: "Reconcile bank transactions",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      status: "pending",
    },
    {
      id: "demo-user-activity-3",
      type: "notification",
      message: "New report available: Cash Flow Summary",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      status: "completed",
    },
  ];
}
