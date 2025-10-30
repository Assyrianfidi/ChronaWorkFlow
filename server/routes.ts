import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  getJobQueues,
  getQueueJobs,
  pauseQueue,
  resumeQueue,
  cleanQueue,
  removeJob,
  scheduleRecurringInvoice,
  schedulePayrollProcessing,
  scheduleReportGeneration,
  scheduleBackup,
  scheduleNotification,
} from "./routes/jobs";

import { handleStripeWebhook, createPaymentIntent, getPaymentIntent, createStripeInvoice, sendInvoice, refundPayment, getBalance, stripeHealthCheck } from "./routes/stripe";
import { healthCheck } from "./routes/health";

import {
  handlePlaidWebhook,
  createLinkToken,
  exchangePublicToken,
  getAccounts,
  getAccountBalances,
  syncTransactions,
  getTransactions,
  getInstitutions,
  plaidHealthCheck,
} from "./routes/plaid";

const JWT_SECRET = process.env.SESSION_SECRET || "dev-secret-change-in-production";

// Middleware to verify JWT token
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ==================== AUTHENTICATION ====================
  
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, name } = req.body;

      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        name,
        role: "admin", // First user is admin
      });

      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          role: user.role,
          currentCompanyId: user.currentCompanyId 
        },
        token,
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed: " + error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          role: user.role,
          currentCompanyId: user.currentCompanyId 
        },
        token,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed: " + error.message });
    }
  });

  // ==================== COMPANIES ====================

  app.get("/api/companies", authenticateToken, async (req, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/companies/:id", authenticateToken, async (req, res) => {
    try {
      const company = await storage.getCompany(req.params.id);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json(company);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/companies", authenticateToken, async (req, res) => {
    try {
      const company = await storage.createCompany(req.body);
      res.status(201).json(company);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== ACCOUNTS ====================

  app.get("/api/accounts", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const accounts = await storage.getAccountsByCompany(companyId);
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/accounts", authenticateToken, async (req, res) => {
    try {
      const account = await storage.createAccount(req.body);
      res.status(201).json(account);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== CUSTOMERS ====================

  app.get("/api/customers", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const customers = await storage.getCustomersByCompany(companyId);
      res.json(customers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/customers", authenticateToken, async (req, res) => {
    try {
      const customer = await storage.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/customers/:id", authenticateToken, async (req, res) => {
    try {
      const customer = await storage.updateCustomer(req.params.id, req.body);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== VENDORS ====================

  app.get("/api/vendors", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const vendors = await storage.getVendorsByCompany(companyId);
      res.json(vendors);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/vendors", authenticateToken, async (req, res) => {
    try {
      const vendor = await storage.createVendor(req.body);
      res.status(201).json(vendor);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== TRANSACTIONS ====================

  app.get("/api/transactions", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const transactions = await storage.getTransactionsByCompany(companyId, limit);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/transactions/:id/lines", authenticateToken, async (req, res) => {
    try {
      const lines = await storage.getTransactionLinesByTransaction(req.params.id);
      res.json(lines);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/transactions", authenticateToken, async (req, res) => {
    try {
      const { transaction, lines } = req.body;

      // Validate double-entry: sum of debits must equal sum of credits
      const totalDebits = lines.reduce(
        (sum: number, line: any) => sum + parseFloat(line.debit || "0"),
        0
      );
      const totalCredits = lines.reduce(
        (sum: number, line: any) => sum + parseFloat(line.credit || "0"),
        0
      );

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        return res.status(400).json({
          error: "Transaction is not balanced. Debits must equal credits.",
          debits: totalDebits,
          credits: totalCredits,
        });
      }

      const newTransaction = await storage.createTransaction(transaction, lines);
      res.status(201).json(newTransaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/transactions/:id/void", authenticateToken, async (req, res) => {
    try {
      await storage.voidTransaction(req.params.id, (req as any).user.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== INVOICES ====================

  app.get("/api/invoices", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const invoices = await storage.getInvoicesByCompany(companyId);
      res.json(invoices);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/invoices/:id", authenticateToken, async (req, res) => {
    try {
      const data = await storage.getInvoiceWithItems(req.params.id);
      if (!data) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/invoices", authenticateToken, async (req, res) => {
    try {
      const { invoice, items } = req.body;

      // Calculate totals
      const subtotal = items.reduce(
        (sum: number, item: any) => sum + parseFloat(item.amount),
        0
      );
      const taxAmount = subtotal * (parseFloat(invoice.taxRate || "0") / 100);
      const total = subtotal + taxAmount;

      const invoiceData = {
        ...invoice,
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toString(),
        total: total.toString(),
        createdBy: (req as any).user.id,
      };

      const newInvoice = await storage.createInvoice(invoiceData, items);
      res.status(201).json(newInvoice);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== PAYMENTS ====================

  app.post("/api/payments", authenticateToken, async (req, res) => {
    try {
      const paymentData = {
        ...req.body,
        createdBy: (req as any).user.id,
      };
      const payment = await storage.createPayment(paymentData);
      res.status(201).json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/invoices/:invoiceId/payments", authenticateToken, async (req, res) => {
    try {
      const payments = await storage.getPaymentsByInvoice(req.params.invoiceId);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== BANK TRANSACTIONS ====================

  app.get("/api/bank-transactions", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const transactions = await storage.getBankTransactionsByCompany(companyId);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bank-transactions/import", authenticateToken, async (req, res) => {
    try {
      const { transactions: importedTransactions, companyId, accountId } = req.body;

      const created = [];
      for (const txn of importedTransactions) {
        const bankTxn = await storage.createBankTransaction({
          companyId,
          accountId,
          date: new Date(txn.date),
          description: txn.description,
          amount: txn.amount.toString(),
          type: parseFloat(txn.amount) >= 0 ? "credit" : "debit",
          referenceNumber: txn.referenceNumber,
        });
        created.push(bankTxn);
      }

      res.status(201).json({ imported: created.length, transactions: created });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bank-transactions/:id/reconcile", authenticateToken, async (req, res) => {
    try {
      const { matchedTransactionId } = req.body;
      await storage.reconcileBankTransaction(req.params.id, matchedTransactionId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== REPORTS ====================

  app.get("/api/reports/profit-loss", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }

      // Get revenue and expense accounts
      const accounts = await storage.getAccountsByCompany(companyId);
      const revenueAccounts = accounts.filter((a) => a.type === "revenue");
      const expenseAccounts = accounts.filter((a) => a.type === "expense");

      const totalRevenue = revenueAccounts.reduce(
        (sum, acc) => sum + parseFloat(acc.balance),
        0
      );
      const totalExpenses = expenseAccounts.reduce(
        (sum, acc) => sum + parseFloat(acc.balance),
        0
      );

      res.json({
        revenue: {
          total: totalRevenue,
          accounts: revenueAccounts,
        },
        expenses: {
          total: totalExpenses,
          accounts: expenseAccounts,
        },
        netIncome: totalRevenue - totalExpenses,
        period: { startDate, endDate },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/balance-sheet", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }

      const accounts = await storage.getAccountsByCompany(companyId);
      
      const assets = accounts.filter((a) => a.type === "asset");
      const liabilities = accounts.filter((a) => a.type === "liability");
      const equity = accounts.filter((a) => a.type === "equity");

      const totalAssets = assets.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
      const totalLiabilities = liabilities.reduce(
        (sum, acc) => sum + parseFloat(acc.balance),
        0
      );
      const totalEquity = equity.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

      res.json({
        assets: {
          total: totalAssets,
          accounts: assets,
        },
        liabilities: {
          total: totalLiabilities,
          accounts: liabilities,
        },
        equity: {
          total: totalEquity,
          accounts: equity,
        },
        asOfDate: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/cash-flow", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }

      // Simple cash flow based on cash account balance changes
      const accounts = await storage.getAccountsByCompany(companyId);
      const cashAccount = accounts.find((a) => a.code === "1110" || a.name.toLowerCase().includes("cash"));

      res.json({
        operatingActivities: {
          total: cashAccount ? parseFloat(cashAccount.balance) : 0,
        },
        investingActivities: {
          total: 0,
        },
        financingActivities: {
          total: 0,
        },
        netChange: cashAccount ? parseFloat(cashAccount.balance) : 0,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/cash-flow", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }

      // Simple cash flow based on cash account balance changes
      const accounts = await storage.getAccountsByCompany(companyId);
      const cashAccount = accounts.find((a) => a.code === "1110" || a.name.toLowerCase().includes("cash"));

      res.json({
        operatingActivities: {
          total: cashAccount ? parseFloat(cashAccount.balance) : 0,
        },
        investingActivities: {
          total: 0,
        },
        financingActivities: {
          total: 0,
        },
        netChange: cashAccount ? parseFloat(cashAccount.balance) : 0,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== PAYROLL MODULE ====================

  // Employees
  app.get("/api/payroll/employees", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const employees = await storage.getEmployeesByCompany(companyId);
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/payroll/employees", authenticateToken, async (req, res) => {
    try {
      const employee = await storage.createEmployee(req.body);
      res.status(201).json(employee);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/payroll/employees/:id", authenticateToken, async (req, res) => {
    try {
      const employee = await storage.updateEmployee(req.params.id, req.body);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      res.json(employee);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Deductions
  app.get("/api/payroll/deductions", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const deductions = await storage.getDeductionsByCompany(companyId);
      res.json(deductions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/payroll/deductions", authenticateToken, async (req, res) => {
    try {
      const deduction = await storage.createDeduction(req.body);
      res.status(201).json(deduction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Employee Deductions
  app.get("/api/payroll/employee-deductions/:employeeId", authenticateToken, async (req, res) => {
    try {
      const deductions = await storage.getEmployeeDeductionsByEmployee(req.params.employeeId);
      res.json(deductions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/payroll/employee-deductions", authenticateToken, async (req, res) => {
    try {
      const deduction = await storage.createEmployeeDeduction(req.body);
      res.status(201).json(deduction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Payroll Periods
  app.get("/api/payroll/periods", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const periods = await storage.getPayrollPeriodsByCompany(companyId);
      res.json(periods);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/payroll/periods", authenticateToken, async (req, res) => {
    try {
      const period = await storage.createPayrollPeriod(req.body);
      res.status(201).json(period);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Time Entries
  app.get("/api/payroll/time-entries", authenticateToken, async (req, res) => {
    try {
      const employeeId = req.query.employeeId as string;
      const payrollPeriodId = req.query.payrollPeriodId as string;

      if (employeeId) {
        const entries = await storage.getTimeEntriesByEmployee(employeeId);
        return res.json(entries);
      }

      if (payrollPeriodId) {
        const entries = await storage.getTimeEntriesByPayrollPeriod(payrollPeriodId);
        return res.json(entries);
      }

      return res.status(400).json({ error: "employeeId or payrollPeriodId is required" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/payroll/time-entries", authenticateToken, async (req, res) => {
    try {
      const entry = await storage.createTimeEntry(req.body);
      res.status(201).json(entry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/payroll/time-entries/:id/approve", authenticateToken, async (req, res) => {
    try {
      await storage.approveTimeEntry(req.params.id, (req as any).user.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Pay Runs
  app.get("/api/payroll/pay-runs", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const payRuns = await storage.getPayRunsByCompany(companyId);
      res.json(payRuns);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/payroll/pay-runs/:id", authenticateToken, async (req, res) => {
    try {
      const data = await storage.getPayRunWithDetails(req.params.id);
      if (!data) {
        return res.status(404).json({ error: "Pay run not found" });
      }
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/payroll/pay-runs", authenticateToken, async (req, res) => {
    try {
      const { payRun, details } = req.body;
      const newPayRun = await storage.createPayRun(payRun, details);
      res.status(201).json(newPayRun);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/payroll/pay-runs/:id/status", authenticateToken, async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updatePayRunStatus(req.params.id, status);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Tax Forms
  app.get("/api/payroll/tax-forms", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const forms = await storage.getTaxFormsByCompany(companyId);
      res.json(forms);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/payroll/tax-forms", authenticateToken, async (req, res) => {
    try {
      const form = await storage.createTaxForm(req.body);
      res.status(201).json(form);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== INVENTORY MODULE ====================

  // Inventory Items
  app.get("/api/inventory/items", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const items = await storage.getInventoryItemsByCompany(companyId);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/inventory/items", authenticateToken, async (req, res) => {
    try {
      const item = await storage.createInventoryItem(req.body);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/inventory/items/:id", authenticateToken, async (req, res) => {
    try {
      const item = await storage.updateInventoryItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Inventory item not found" });
      }
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/inventory/items/:id/quantity", authenticateToken, async (req, res) => {
    try {
      const { quantityChange, reason } = req.body;
      await storage.updateInventoryQuantity(req.params.id, quantityChange, reason);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Purchase Orders
  app.get("/api/inventory/purchase-orders", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const orders = await storage.getPurchaseOrdersByCompany(companyId);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/inventory/purchase-orders/:id", authenticateToken, async (req, res) => {
    try {
      const data = await storage.getPurchaseOrderWithItems(req.params.id);
      if (!data) {
        return res.status(404).json({ error: "Purchase order not found" });
      }
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/inventory/purchase-orders", authenticateToken, async (req, res) => {
    try {
      const { order, items } = req.body;
      const newOrder = await storage.createPurchaseOrder(order, items);
      res.status(201).json(newOrder);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/inventory/purchase-orders/:id/status", authenticateToken, async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updatePurchaseOrderStatus(req.params.id, status);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Inventory Adjustments
  app.get("/api/inventory/adjustments", authenticateToken, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const adjustments = await storage.getInventoryAdjustmentsByCompany(companyId);
      res.json(adjustments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/inventory/adjustments", authenticateToken, async (req, res) => {
    try {
      const adjustment = await storage.createInventoryAdjustment(req.body);
      res.status(201).json(adjustment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== JOB MANAGEMENT ====================

  // Job Queue Management
  app.get("/api/jobs/queues", authenticateToken, getJobQueues);
  app.get("/api/jobs/queues/:queueName", authenticateToken, getQueueJobs);
  app.post("/api/jobs/queues/:queueName/pause", authenticateToken, pauseQueue);
  app.post("/api/jobs/queues/:queueName/resume", authenticateToken, resumeQueue);
  app.post("/api/jobs/queues/:queueName/clean", authenticateToken, cleanQueue);
  app.delete("/api/jobs/queues/:queueName/jobs/:jobId", authenticateToken, removeJob);

  // Job Scheduling
  app.post("/api/jobs/schedule/recurring-invoice", authenticateToken, scheduleRecurringInvoice);
  app.post("/api/jobs/schedule/payroll-processing", authenticateToken, schedulePayrollProcessing);
  app.post("/api/jobs/schedule/report-generation", authenticateToken, scheduleReportGeneration);
  app.post("/api/jobs/schedule/backup", authenticateToken, scheduleBackup);
  app.post("/api/jobs/schedule/notification", authenticateToken, scheduleNotification);

  // ==================== STRIPE INTEGRATION ====================

  // Stripe webhooks (no authentication required)
  app.post("/api/stripe/webhooks", handleStripeWebhook);

  // Stripe payment processing
  app.post("/api/stripe/payment-intent", authenticateToken, createPaymentIntent);
  app.get("/api/stripe/payment-intent/:paymentIntentId", authenticateToken, getPaymentIntent);
  app.post("/api/stripe/invoices", authenticateToken, createStripeInvoice);
  app.post("/api/stripe/invoices/:invoiceId/send", authenticateToken, sendInvoice);
  app.post("/api/stripe/refunds/:paymentIntentId", authenticateToken, refundPayment);
  app.get("/api/stripe/balance", authenticateToken, getBalance);
  app.get("/api/stripe/health", stripeHealthCheck);

  // ==================== PLAID INTEGRATION ====================

  // Plaid webhooks (no authentication required)
  app.post("/api/plaid/webhooks", handlePlaidWebhook);

  // Plaid OAuth flow
  app.post("/api/plaid/link-token", authenticateToken, createLinkToken);
  app.post("/api/plaid/exchange-token", authenticateToken, exchangePublicToken);
  app.get("/api/plaid/accounts", authenticateToken, getAccounts);
  app.get("/api/plaid/balances", authenticateToken, getAccountBalances);
  app.post("/api/plaid/sync-transactions", authenticateToken, syncTransactions);
  app.get("/api/plaid/transactions", authenticateToken, getTransactions);
  app.get("/api/plaid/institutions", authenticateToken, getInstitutions);
  app.get("/api/plaid/health", plaidHealthCheck);
  
  // Health check endpoint
  app.get("/health", healthCheck);
  app.get("/api/health", healthCheck);

  const httpServer = createServer(app);

  return httpServer;
}
