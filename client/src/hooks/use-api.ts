import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { apiRequest } from "./queryClient.js";
import { getCurrentCompanyId } from "../lib/api.js";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "user" | "accountant" | "manager";
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== TYPES ====================
export interface Company {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  currency: string;
  fiscalYearEnd?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  companyId: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  parentId?: string;
  balance: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  taxId?: string;
  notes?: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  taxId?: string;
  notes?: string;
  balance: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  companyId: string;
  transactionNumber: string;
  date: string;
  type: "journal_entry" | "invoice" | "payment" | "bank";
  description?: string;
  referenceNumber?: string;
  totalAmount: string;
  isVoid: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionLine {
  id: string;
  transactionId: string;
  accountId: string;
  debit: string;
  credit: string;
  description?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  companyId: string;
  customerId: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  status: "draft" | "sent" | "paid" | "overdue" | "void";
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  amountPaid: string;
  notes?: string;
  terms?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  accountId?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  companyId: string;
  invoiceId: string;
  date: string;
  amount: string;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface BankTransaction {
  id: string;
  companyId: string;
  accountId: string;
  date: string;
  description: string;
  amount: string;
  type: string;
  referenceNumber?: string;
  isReconciled: boolean;
  reconciledAt?: string;
  matchedTransactionId?: string;
  importBatchId?: string;
  createdAt: string;
}

// ==================== PAYROLL MODULE TYPES ====================

export interface Employee {
  id: string;
  companyId: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  socialSecurityNumber?: string;
  dateOfBirth?: string;
  hireDate: string;
  terminationDate?: string;
  status: "active" | "inactive" | "terminated";
  jobTitle?: string;
  department?: string;
  managerId?: string;
  payRate?: string;
  payFrequency:
    | "weekly"
    | "bi-weekly"
    | "semi-monthly"
    | "monthly"
    | "quarterly"
    | "annually";
  hourlyRate?: string;
  overtimeRate?: string;
  isExempt: boolean;
  federalTaxId?: string;
  stateTaxId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deduction {
  id: string;
  companyId: string;
  name: string;
  type: string;
  category?: string;
  isPreTax: boolean;
  calculationMethod: string;
  rate?: string;
  maxAmount?: string;
  isActive: boolean;
  effectiveDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeDeduction {
  id: string;
  employeeId: string;
  deductionId: string;
  customRate?: string;
  customAmount?: string;
  effectiveDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
}

export interface PayrollPeriod {
  id: string;
  companyId: string;
  name: string;
  startDate: string;
  endDate: string;
  payDate: string;
  payFrequency: string;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  payrollPeriodId: string;
  date: string;
  hoursWorked: string;
  overtimeHours: string;
  doubleTimeHours: string;
  breakHours: string;
  description?: string;
  approvedBy?: string;
  approvedAt?: string;
  isApproved: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayRun {
  id: string;
  companyId: string;
  payrollPeriodId: string;
  runNumber: string;
  payDate: string;
  status: "draft" | "approved" | "processing" | "completed" | "reversed";
  totalGrossPay: string;
  totalNetPay: string;
  totalDeductions: string;
  totalTaxes: string;
  employeeCount: number;
  notes?: string;
  processedBy?: string;
  processedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayRunDetail {
  id: string;
  payRunId: string;
  employeeId: string;
  grossPay: string;
  regularPay: string;
  overtimePay: string;
  doubleTimePay: string;
  bonusPay: string;
  totalDeductions: string;
  totalTaxes: string;
  netPay: string;
  hoursWorked: string;
  overtimeHours: string;
  payRate?: string;
  createdAt: string;
}

export interface TaxForm {
  id: string;
  companyId: string;
  employeeId: string;
  formType: string;
  taxYear: number;
  formNumber?: string;
  status: "draft" | "submitted" | "accepted" | "rejected";
  data?: string;
  submittedDate?: string;
  acceptedDate?: string;
  rejectedDate?: string;
  rejectionReason?: string;
  filedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollTransaction {
  id: string;
  companyId: string;
  payRunId: string;
  transactionId: string;
  type: string;
  amount: string;
  description?: string;
  createdAt: string;
}

// ==================== INVENTORY MODULE TYPES ====================

export interface InventoryItem {
  id: string;
  companyId: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unitCost: string;
  unitPrice: string;
  quantityOnHand: string;
  quantityReserved: string;
  quantityAvailable: string;
  reorderPoint: string;
  reorderQuantity: string;
  maxStockLevel: string;
  minStockLevel: string;
  supplierId?: string;
  costAccountId?: string;
  salesAccountId?: string;
  inventoryAccountId?: string;
  isActive: boolean;
  trackInventory: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: string;
  companyId: string;
  vendorId: string;
  poNumber: string;
  orderDate: string;
  expectedDate?: string;
  status: string;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  inventoryItemId: string;
  quantity: string;
  unitCost: string;
  totalCost: string;
  receivedQuantity: string;
  createdAt: string;
}

export interface InventoryAdjustment {
  id: string;
  companyId: string;
  inventoryItemId: string;
  adjustmentType: string;
  quantityChange: string;
  previousQuantity: string;
  newQuantity: string;
  unitCost?: string;
  totalCost?: string;
  reason?: string;
  referenceType?: string;
  referenceId?: string;
  transactionId?: string;
  createdBy: string;
  createdAt: string;
}

// ==================== UTILITIES ====================
function getCompanyId(): string {
  return getCurrentCompanyId();
}

// ==================== API HOOKS ====================

// Users
export function useUsers() {
  return useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => apiRequest("GET", "/api/users"),
  });
}

// Companies
export function useCompanies() {
  return useQuery<Company[]>({
    queryKey: ["companies"],
    queryFn: () => apiRequest<Company[]>("GET", "/api/companies"),
  });
}

export function useCompany(id: string) {
  return useQuery<Company>({
    queryKey: ["companies", id],
    queryFn: () => apiRequest<Company>("GET", `/api/companies/${id}`),
    enabled: !!id,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation<
    Company,
    Error,
    Omit<Company, "id" | "createdAt" | "updatedAt">
  >({
    mutationFn: (data) => apiRequest<Company>("POST", "/api/companies", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["companies"] }),
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation<Company, Error, { id: string; data: Partial<Company> }>({
    mutationFn: ({ id, data }) =>
      apiRequest<Company>("PATCH", `/api/companies/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["companies", id] });
    },
  });
}

// Accounts
export function useAccounts(companyId?: string) {
  const company = companyId || getCompanyId();
  return useQuery<Account[]>({
    queryKey: ["accounts", company],
    queryFn: () =>
      apiRequest<Account[]>("GET", `/api/accounts?companyId=${company}`),
    enabled: !!company,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation<
    Account,
    Error,
    Omit<Account, "id" | "createdAt" | "updatedAt" | "balance">
  >({
    mutationFn: (data) => apiRequest<Account>("POST", "/api/accounts", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] }),
  });
}

// Customers
export function useCustomers(companyId?: string) {
  const company = companyId || getCompanyId();
  return useQuery<Customer[]>({
    queryKey: ["customers", company],
    queryFn: () =>
      apiRequest<Customer[]>("GET", `/api/customers?companyId=${company}`),
    enabled: !!company,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation<
    Customer,
    Error,
    Omit<Customer, "id" | "createdAt" | "updatedAt" | "balance">
  >({
    mutationFn: (data) => apiRequest<Customer>("POST", "/api/customers", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation<Customer, Error, { id: string; data: Partial<Customer> }>({
    mutationFn: ({ id, data }) =>
      apiRequest<Customer>("PATCH", `/api/customers/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });
}

// Vendors
export function useVendors(companyId?: string) {
  const company = companyId || getCompanyId();
  return useQuery<Vendor[]>({
    queryKey: ["vendors", company],
    queryFn: () =>
      apiRequest<Vendor[]>("GET", `/api/vendors?companyId=${company}`),
    enabled: !!company,
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation<
    Vendor,
    Error,
    Omit<Vendor, "id" | "createdAt" | "updatedAt" | "balance">
  >({
    mutationFn: (data) => apiRequest<Vendor>("POST", "/api/vendors", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendors"] }),
  });
}

// Transactions
export function useTransactions(companyId?: string, limit = 50) {
  const company = companyId || getCompanyId();
  return useQuery<Transaction[]>({
    queryKey: ["transactions", company, limit],
    queryFn: () =>
      apiRequest<Transaction[]>(
        "GET",
        `/api/transactions?companyId=${company}&limit=${limit}`,
      ),
    enabled: !!company,
  });
}

export function useTransactionLines(transactionId?: string) {
  return useQuery<TransactionLine[]>({
    queryKey: ["transaction-lines", transactionId],
    queryFn: () =>
      apiRequest<TransactionLine[]>(
        "GET",
        `/api/transactions/${transactionId}/lines`,
      ),
    enabled: !!transactionId,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation<
    Transaction,
    Error,
    {
      transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">;
      lines: Omit<TransactionLine, "id" | "createdAt">[];
    }
  >({
    mutationFn: ({ transaction, lines }) =>
      apiRequest<Transaction>("POST", "/api/transactions", {
        transaction,
        lines,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useVoidTransaction() {
  const queryClient = useQueryClient();
  return useMutation<Transaction, Error, string>({
    mutationFn: (id) =>
      apiRequest<Transaction>("POST", `/api/transactions/${id}/void`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

// Invoices
export function useInvoices(companyId?: string) {
  const company = companyId || getCompanyId();
  return useQuery<Invoice[]>({
    queryKey: ["invoices", company],
    queryFn: () =>
      apiRequest<Invoice[]>("GET", `/api/invoices?companyId=${company}`),
    enabled: !!company,
  });
}

export function useInvoice(id: string) {
  return useQuery<Invoice>({
    queryKey: ["invoices", id],
    queryFn: () => apiRequest<Invoice>("GET", `/api/invoices/${id}`),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation<
    Invoice,
    Error,
    {
      invoice: Omit<Invoice, "id" | "createdAt" | "updatedAt" | "amountPaid">;
      items: Omit<InvoiceItem, "id" | "createdAt">[];
    }
  >({
    mutationFn: ({ invoice, items }) =>
      apiRequest<Invoice>("POST", "/api/invoices", { invoice, items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

// Payments
export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation<
    Payment,
    Error,
    Omit<Payment, "id" | "createdAt" | "updatedAt">
  >({
    mutationFn: (data) => apiRequest<Payment>("POST", "/api/payments", data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["invoices", variables.invoiceId],
      });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function usePaymentsByInvoice(invoiceId: string) {
  return useQuery<Payment[]>({
    queryKey: ["payments", "invoice", invoiceId],
    queryFn: () =>
      apiRequest<Payment[]>("GET", `/api/payments?invoiceId=${invoiceId}`),
    enabled: !!invoiceId,
  });
}

// Bank Transactions
export function useBankTransactions(companyId?: string) {
  const company = companyId || getCompanyId();
  return useQuery<BankTransaction[]>({
    queryKey: ["bank-transactions", company],
    queryFn: () =>
      apiRequest<BankTransaction[]>(
        "GET",
        `/api/bank-transactions?companyId=${company}`,
      ),
    enabled: !!company,
  });
}

export function useCreateBankTransaction() {
  const queryClient = useQueryClient();
  return useMutation<
    BankTransaction[],
    Error,
    Omit<BankTransaction, "id" | "createdAt">
  >({
    mutationFn: (data) =>
      apiRequest<BankTransaction[]>("POST", "/api/bank-transactions/import", {
        transactions: [data],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useReconcileBankTransaction() {
  const queryClient = useQueryClient();
  return useMutation<
    BankTransaction,
    Error,
    { id: string; matchedTransactionId: string }
  >({
    mutationFn: ({ id, matchedTransactionId }) =>
      apiRequest<BankTransaction>(
        "POST",
        `/api/bank-transactions/${id}/reconcile`,
        { matchedTransactionId },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

// Reports
export function useProfitLossReport(
  companyId?: string,
  startDate?: string,
  endDate?: string,
) {
  const company = companyId || getCompanyId();
  const params = new URLSearchParams({ companyId: company });
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  return useQuery({
    queryKey: ["reports", "profit-loss", company, startDate, endDate],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/reports/profit-loss?${params}`,
      );
      return response.json();
    },
    enabled: !!company,
  });
}

export function useBalanceSheetReport(companyId?: string) {
  const company = companyId || getCompanyId();
  return useQuery({
    queryKey: ["reports", "balance-sheet", company],
    queryFn: () =>
      apiRequest("GET", `/api/reports/balance-sheet?companyId=${company}`).then(
        (r: Response) => r.json(),
      ),
    enabled: !!company,
  });
}

export function useCashFlowReport(companyId?: string) {
  const company = companyId || getCompanyId();
  return useQuery({
    queryKey: ["reports", "cash-flow", company],
    queryFn: () =>
      apiRequest("GET", `/api/reports/cash-flow?companyId=${company}`).then(
        (r: Response) => r.json(),
      ),
    enabled: !!company,
  });
}

// ==================== PAYROLL MODULE HOOKS ====================

export function useEmployees(companyId?: string) {
  const company = companyId || getCompanyId();
  return useQuery({
    queryKey: ["payroll", "employees", company],
    queryFn: () =>
      apiRequest("GET", `/api/payroll/employees?companyId=${company}`).then(
        (r: Response) => r.json(),
      ),
    enabled: !!company,
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ["payroll", "employee", id],
    queryFn: () =>
      apiRequest("GET", `/api/payroll/employees/${id}`).then((r: Response) =>
        r.json(),
      ),
    enabled: !!id,
  });
}

export function useDeductions(companyId?: string) {
  const company = companyId || getCompanyId();
  return useQuery({
    queryKey: ["payroll", "deductions", company],
    queryFn: () =>
      apiRequest("GET", `/api/payroll/deductions?companyId=${company}`).then(
        (r: Response) => r.json(),
      ),
    enabled: !!company,
  });
}

export function useEmployeeDeductions(employeeId: string) {
  return useQuery({
    queryKey: ["payroll", "employee-deductions", employeeId],
    queryFn: () =>
      apiRequest("GET", `/api/payroll/employee-deductions/${employeeId}`).then(
        (r: Response) => r.json(),
      ),
    enabled: !!employeeId,
  });
}

export function usePayrollPeriods(companyId?: string) {
  const company = companyId || getCompanyId();
  return useQuery({
    queryKey: ["payroll", "periods", company],
    queryFn: () =>
      apiRequest("GET", `/api/payroll/periods?companyId=${company}`).then(
        (r: Response) => r.json(),
      ),
    enabled: !!company,
  });
}

export function useTimeEntries(employeeId?: string, payrollPeriodId?: string) {
  return useQuery({
    queryKey: ["payroll", "time-entries", employeeId, payrollPeriodId],
    queryFn: () =>
      apiRequest(
        "GET",
        `/api/payroll/time-entries${employeeId ? `?employeeId=${employeeId}` : payrollPeriodId ? `?payrollPeriodId=${payrollPeriodId}` : ""}`,
      ).then((r: Response) => r.json()),
    enabled: !!employeeId || !!payrollPeriodId,
  });
}

export function usePayRuns(companyId?: string) {
  const company = companyId || getCompanyId();
  return useQuery({
    queryKey: ["payroll", "pay-runs", company],
    queryFn: () =>
      apiRequest("GET", `/api/payroll/pay-runs?companyId=${company}`).then(
        (r: Response) => r.json(),
      ),
    enabled: !!company,
  });
}

export function usePayRun(id: string) {
  return useQuery({
    queryKey: ["payroll", "pay-run", id],
    queryFn: () =>
      apiRequest("GET", `/api/payroll/pay-runs/${id}`).then((r: Response) =>
        r.json(),
      ),
    enabled: !!id,
  });
}

export function useTaxForms(companyId?: string) {
  const company = companyId || getCompanyId();
  return useQuery({
    queryKey: ["payroll", "tax-forms", company],
    queryFn: () =>
      apiRequest("GET", `/api/payroll/tax-forms?companyId=${company}`).then(
        (r: Response) => r.json(),
      ),
    enabled: !!company,
  });
}

// ==================== INVENTORY MODULE HOOKS ====================

export function useInventoryItems(companyId?: string) {
  const company = companyId || getCompanyId();
  return useQuery({
    queryKey: ["inventory", "items", company],
    queryFn: () =>
      apiRequest("GET", `/api/inventory/items?companyId=${company}`).then(
        (r: Response) => r.json(),
      ),
    enabled: !!company,
  });
}

export function usePurchaseOrders(companyId?: string) {
  const company = companyId || getCompanyId();
  return useQuery({
    queryKey: ["inventory", "purchase-orders", company],
    queryFn: () =>
      apiRequest(
        "GET",
        `/api/inventory/purchase-orders?companyId=${company}`,
      ).then((r: Response) => r.json()),
    enabled: !!company,
  });
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: ["inventory", "purchase-order", id],
    queryFn: () =>
      apiRequest("GET", `/api/inventory/purchase-orders/${id}`).then(
        (r: Response) => r.json(),
      ),
    enabled: !!id,
  });
}

export function useInventoryAdjustments(companyId?: string) {
  const company = companyId || getCompanyId();
  return useQuery({
    queryKey: ["inventory", "adjustments", company],
    queryFn: () =>
      apiRequest("GET", `/api/inventory/adjustments?companyId=${company}`).then(
        (r: Response) => r.json(),
      ),
    enabled: !!company,
  });
}

// Mutations
export function useCreateEmployee() {
  return useMutation({
    mutationFn: (employee: Omit<Employee, "id" | "createdAt" | "updatedAt">) =>
      apiRequest("POST", "/api/payroll/employees", employee).then(
        (r: Response) => r.json(),
      ),
    onSuccess: (queryClient: QueryClient) => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "employees"] });
    },
  });
}

export function useUpdateEmployee() {
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<Employee, "id" | "createdAt" | "updatedAt">>;
    }) =>
      apiRequest("PATCH", `/api/payroll/employees/${id}`, updates).then(
        (r: Response) => r.json(),
      ),
    onSuccess: (queryClient: QueryClient) => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "employees"] });
    },
  });
}

export function useCreateDeduction() {
  return useMutation({
    mutationFn: (
      deduction: Omit<Deduction, "id" | "createdAt" | "updatedAt">,
    ) =>
      apiRequest("POST", "/api/payroll/deductions", deduction).then(
        (r: Response) => r.json(),
      ),
    onSuccess: (queryClient: QueryClient) => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "deductions"] });
    },
  });
}

export function useCreateEmployeeDeduction() {
  return useMutation({
    mutationFn: (deduction: Omit<EmployeeDeduction, "id" | "createdAt">) =>
      apiRequest("POST", "/api/payroll/employee-deductions", deduction).then(
        (r: Response) => r.json(),
      ),
    onSuccess: (queryClient: QueryClient) => {
      queryClient.invalidateQueries({
        queryKey: ["payroll", "employee-deductions"],
      });
    },
  });
}

export function useCreatePayrollPeriod() {
  return useMutation({
    mutationFn: (
      period: Omit<PayrollPeriod, "id" | "createdAt" | "updatedAt">,
    ) =>
      apiRequest("POST", "/api/payroll/periods", period).then((r: Response) =>
        r.json(),
      ),
    onSuccess: (queryClient: QueryClient) => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "periods"] });
    },
  });
}

export function useCreateTimeEntry() {
  return useMutation({
    mutationFn: (entry: Omit<TimeEntry, "id" | "createdAt" | "updatedAt">) =>
      apiRequest("POST", "/api/payroll/time-entries", entry).then(
        (r: Response) => r.json(),
      ),
    onSuccess: (queryClient: QueryClient) => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "time-entries"] });
    },
  });
}

export function useApproveTimeEntry() {
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest("POST", `/api/payroll/time-entries/${id}/approve`).then(
        (r: Response) => r.json(),
      ),
    onSuccess: (queryClient: QueryClient) => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "time-entries"] });
    },
  });
}

export function useCreatePayRun() {
  return useMutation({
    mutationFn: (data: {
      payRun: Omit<PayRun, "id" | "createdAt" | "updatedAt">;
      details: Omit<PayRunDetail, "id" | "payRunId" | "createdAt">[];
    }) =>
      apiRequest("POST", "/api/payroll/pay-runs", data).then((r: Response) =>
        r.json(),
      ),
    onSuccess: (queryClient: QueryClient) => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "pay-runs"] });
    },
  });
}

export function useUpdatePayRunStatus() {
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/payroll/pay-runs/${id}/status`, {
        status,
      }).then((r: Response) => r.json()),
    onSuccess: (queryClient: QueryClient) => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "pay-runs"] });
    },
  });
}

export function useCreateTaxForm() {
  return useMutation({
    mutationFn: (form: Omit<TaxForm, "id" | "createdAt" | "updatedAt">) =>
      apiRequest("POST", "/api/payroll/tax-forms", form).then((r: Response) =>
        r.json(),
      ),
    onSuccess: (queryClient: QueryClient) => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "tax-forms"] });
    },
  });
}

// Inventory Module Mutations
export function useCreateInventoryItem() {
  return useMutation({
    mutationFn: (item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">) =>
      apiRequest("POST", "/api/inventory/items", item).then((r: Response) =>
        r.json(),
      ),
    onSuccess: (queryClient: QueryClient) => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "items"] });
    },
  });
}

export function useUpdateInventoryItem() {
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<InventoryItem, "id" | "createdAt" | "updatedAt">>;
    }) =>
      apiRequest("PATCH", `/api/inventory/items/${id}`, updates).then(
        (r: Response) => r.json(),
      ),
    onSuccess: (queryClient: QueryClient) => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "items"] });
    },
  });
}

export function useUpdateInventoryQuantity() {
  return useMutation({
    mutationFn: ({
      id,
      quantityChange,
      reason,
    }: {
      id: string;
      quantityChange: string;
      reason: string;
    }) =>
      apiRequest("PATCH", `/api/inventory/items/${id}/quantity`, {
        quantityChange,
        reason,
      }).then((r: Response) => r.json()),
    onSuccess: (queryClient: QueryClient) => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "items"] });
    },
  });
}

export function useCreatePurchaseOrder() {
  return useMutation({
    mutationFn: (data: {
      order: Omit<PurchaseOrder, "id" | "createdAt" | "updatedAt">;
      items: Omit<PurchaseOrderItem, "id" | "purchaseOrderId" | "createdAt">[];
    }) =>
      apiRequest("POST", "/api/inventory/purchase-orders", data).then(
        (r: Response) => r.json(),
      ),
    onSuccess: (queryClient: QueryClient) => {
      queryClient.invalidateQueries({
        queryKey: ["inventory", "purchase-orders"],
      });
    },
  });
}

export function useUpdatePurchaseOrderStatus() {
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/inventory/purchase-orders/${id}/status`, {
        status,
      }).then((r: Response) => r.json()),
    onSuccess: (queryClient: QueryClient) => {
      queryClient.invalidateQueries({
        queryKey: ["inventory", "purchase-orders"],
      });
    },
  });
}

export function useCreateInventoryAdjustment() {
  return useMutation({
    mutationFn: (adjustment: Omit<InventoryAdjustment, "id" | "createdAt">) =>
      apiRequest("POST", "/api/inventory/adjustments", adjustment).then(
        (r: Response) => r.json(),
      ),
    onSuccess: (queryClient: QueryClient) => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "items"] });
    },
  });
}
