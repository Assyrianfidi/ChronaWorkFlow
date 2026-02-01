import { db } from "./db";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { postJournalEntry } from "./services/accounting.service";

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // Create demo user
    console.log("Creating demo user...");
    const hashedPassword = await bcrypt.hash("Demo123!", 10);
    const user = await storage.createUser({
      username: "demo",
      email: "demo@accubooks.com",
      password: hashedPassword,
      name: "Demo User",
      role: "admin",
    });
    console.log("✅ Demo user created:", user.email);

    // Create demo company
    console.log("\nCreating demo company...");
    const company = await storage.createCompany({
      name: "AccuBooks Demo Co",
      email: "info@accubooksdemoco.com",
      phone: "(555) 123-4567",
      address: "123 Business St, Suite 100, San Francisco, CA 94102",
      taxId: "12-3456789",
      fiscalYearEnd: "12-31",
      currency: "USD",
    });
    console.log("✅ Company created:", company.name);

    // Update user's current company
    await storage.updateUser(user.id, { currentCompanyId: company.id });

    // Create Chart of Accounts
    console.log("\nCreating chart of accounts...");
    
    // Assets
    const assets = await storage.createAccount({
      companyId: company.id,
      code: "1000",
      name: "Assets",
      type: "asset",
      description: "All asset accounts",
    });

    const currentAssets = await storage.createAccount({
      companyId: company.id,
      code: "1100",
      name: "Current Assets",
      type: "asset",
      parentId: assets.id,
    });

    const cash = await storage.createAccount({
      companyId: company.id,
      code: "1110",
      name: "Cash",
      type: "asset",
      parentId: currentAssets.id,
      description: "Cash and cash equivalents",
    });

    const accountsReceivable = await storage.createAccount({
      companyId: company.id,
      code: "1120",
      name: "Accounts Receivable",
      type: "asset",
      parentId: currentAssets.id,
      description: "Money owed by customers",
    });

    const inventory = await storage.createAccount({
      companyId: company.id,
      code: "1130",
      name: "Inventory",
      type: "asset",
      parentId: currentAssets.id,
    });

    const fixedAssets = await storage.createAccount({
      companyId: company.id,
      code: "1200",
      name: "Fixed Assets",
      type: "asset",
      parentId: assets.id,
    });

    const equipment = await storage.createAccount({
      companyId: company.id,
      code: "1210",
      name: "Equipment",
      type: "asset",
      parentId: fixedAssets.id,
    });

    const furniture = await storage.createAccount({
      companyId: company.id,
      code: "1220",
      name: "Furniture",
      type: "asset",
      parentId: fixedAssets.id,
    });

    // Liabilities
    const liabilities = await storage.createAccount({
      companyId: company.id,
      code: "2000",
      name: "Liabilities",
      type: "liability",
    });

    const currentLiabilities = await storage.createAccount({
      companyId: company.id,
      code: "2100",
      name: "Current Liabilities",
      type: "liability",
      parentId: liabilities.id,
    });

    const accountsPayable = await storage.createAccount({
      companyId: company.id,
      code: "2110",
      name: "Accounts Payable",
      type: "liability",
      parentId: currentLiabilities.id,
      description: "Money owed to vendors",
    });

    const creditCard = await storage.createAccount({
      companyId: company.id,
      code: "2120",
      name: "Credit Card",
      type: "liability",
      parentId: currentLiabilities.id,
    });

    const taxesPayable = await storage.createAccount({
      companyId: company.id,
      code: "2130",
      name: "Taxes Payable",
      type: "liability",
      parentId: currentLiabilities.id,
    });

    // Equity
    const equity = await storage.createAccount({
      companyId: company.id,
      code: "3000",
      name: "Equity",
      type: "equity",
    });

    const ownersEquity = await storage.createAccount({
      companyId: company.id,
      code: "3100",
      name: "Owner's Equity",
      type: "equity",
      parentId: equity.id,
    });

    const retainedEarnings = await storage.createAccount({
      companyId: company.id,
      code: "3200",
      name: "Retained Earnings",
      type: "equity",
      parentId: equity.id,
    });

    // Revenue
    const revenue = await storage.createAccount({
      companyId: company.id,
      code: "4000",
      name: "Revenue",
      type: "revenue",
    });

    const salesRevenue = await storage.createAccount({
      companyId: company.id,
      code: "4100",
      name: "Sales Revenue",
      type: "revenue",
      parentId: revenue.id,
      description: "Income from sales",
    });

    // Expenses
    const expenses = await storage.createAccount({
      companyId: company.id,
      code: "5000",
      name: "Expenses",
      type: "expense",
    });

    const operatingExpenses = await storage.createAccount({
      companyId: company.id,
      code: "5100",
      name: "Operating Expenses",
      type: "expense",
      parentId: expenses.id,
    });

    const salaries = await storage.createAccount({
      companyId: company.id,
      code: "5110",
      name: "Salaries & Wages",
      type: "expense",
      parentId: operatingExpenses.id,
    });

    const rent = await storage.createAccount({
      companyId: company.id,
      code: "5120",
      name: "Rent",
      type: "expense",
      parentId: operatingExpenses.id,
    });

    const utilities = await storage.createAccount({
      companyId: company.id,
      code: "5130",
      name: "Utilities",
      type: "expense",
      parentId: operatingExpenses.id,
    });

    const officeSupplies = await storage.createAccount({
      companyId: company.id,
      code: "5140",
      name: "Office Supplies",
      type: "expense",
      parentId: operatingExpenses.id,
    });

    const otherExpenses = await storage.createAccount({
      companyId: company.id,
      code: "5200",
      name: "Other Expenses",
      type: "expense",
      parentId: expenses.id,
    });

    const marketing = await storage.createAccount({
      companyId: company.id,
      code: "5210",
      name: "Marketing",
      type: "expense",
      parentId: otherExpenses.id,
    });

    const professionalServices = await storage.createAccount({
      companyId: company.id,
      code: "5220",
      name: "Professional Services",
      type: "expense",
      parentId: otherExpenses.id,
    });

    console.log("✅ Chart of accounts created (27 accounts)");

    // Create Customers
    console.log("\nCreating customers...");
    const customers = await Promise.all([
      storage.createCustomer({
        companyId: company.id,
        name: "Acme Corporation",
        email: "billing@acmecorp.com",
        phone: "(555) 123-4567",
        address: "456 Enterprise Blvd, New York, NY 10001",
        contactPerson: "John Smith",
      }),
      storage.createCustomer({
        companyId: company.id,
        name: "Tech Solutions Inc",
        email: "accounts@techsolutions.com",
        phone: "(555) 234-5678",
        address: "789 Innovation Dr, Austin, TX 78701",
        contactPerson: "Sarah Johnson",
      }),
      storage.createCustomer({
        companyId: company.id,
        name: "Global Enterprises",
        email: "finance@globalent.com",
        phone: "(555) 345-6789",
        address: "321 Global Plaza, Chicago, IL 60601",
        contactPerson: "Michael Chen",
      }),
      storage.createCustomer({
        companyId: company.id,
        name: "Design Studio Co",
        email: "admin@designstudio.co",
        phone: "(555) 456-7890",
        address: "654 Creative Ave, Los Angeles, CA 90001",
        contactPerson: "Emily Davis",
      }),
      storage.createCustomer({
        companyId: company.id,
        name: "Manufacturing Ltd",
        email: "ap@manufacturing.com",
        phone: "(555) 567-8901",
        address: "987 Industry Rd, Detroit, MI 48201",
        contactPerson: "Robert Wilson",
      }),
    ]);
    console.log("✅ Created 5 customers");

    // Create Vendors
    console.log("\nCreating vendors...");
    const vendors = await Promise.all([
      storage.createVendor({
        companyId: company.id,
        name: "Office Supplies Co",
        email: "sales@officesupplies.com",
        phone: "(555) 111-2222",
        address: "111 Supply St, Boston, MA 02101",
      }),
      storage.createVendor({
        companyId: company.id,
        name: "Tech Hardware Inc",
        email: "billing@techhardware.com",
        phone: "(555) 222-3333",
        address: "222 Tech Blvd, Seattle, WA 98101",
      }),
      storage.createVendor({
        companyId: company.id,
        name: "Utility Services",
        email: "accounts@utility.com",
        phone: "(555) 333-4444",
        address: "333 Power Ave, Houston, TX 77001",
      }),
      storage.createVendor({
        companyId: company.id,
        name: "Cleaning Services LLC",
        email: "admin@cleaning.com",
        phone: "(555) 444-5555",
        address: "444 Clean St, Miami, FL 33101",
      }),
      storage.createVendor({
        companyId: company.id,
        name: "Marketing Agency",
        email: "finance@marketing.com",
        phone: "(555) 555-6666",
        address: "555 Brand Rd, Portland, OR 97201",
      }),
    ]);
    console.log("✅ Created 5 vendors");

    // Create balanced transactions
    console.log("\nCreating transactions...");

    const seedActor = { userId: user.id, isOwner: true } as any;
    
    // Transaction 1: Initial investment
    await postJournalEntry({
      transaction: {
        companyId: company.id,
        transactionNumber: "JE-1001",
        date: new Date("2024-01-01"),
        type: "journal_entry",
        description: "Initial owner investment",
        totalAmount: "50000.00",
        createdBy: user.id,
      } as any,
      lines: [
        { accountId: cash.id, debit: "50000.00", credit: "0", description: "Cash received" } as any,
        { accountId: ownersEquity.id, debit: "0", credit: "50000.00", description: "Owner investment" } as any,
      ],
      actor: seedActor,
    } as any);

    // Transaction 2: Purchase equipment
    await postJournalEntry({
      transaction: {
        companyId: company.id,
        transactionNumber: "JE-1002",
        date: new Date("2024-01-02"),
        type: "journal_entry",
        description: "Purchase office equipment",
        totalAmount: "28500.00",
        createdBy: user.id,
      } as any,
      lines: [
        { accountId: equipment.id, debit: "28500.00", credit: "0", description: "Office equipment" } as any,
        { accountId: cash.id, debit: "0", credit: "28500.00", description: "Cash payment" } as any,
      ],
      actor: seedActor,
    } as any);

    // Transaction 3: Purchase furniture
    await postJournalEntry({
      transaction: {
        companyId: company.id,
        transactionNumber: "JE-1003",
        date: new Date("2024-01-03"),
        type: "journal_entry",
        description: "Purchase office furniture",
        totalAmount: "11740.20",
        createdBy: user.id,
      } as any,
      lines: [
        { accountId: furniture.id, debit: "11740.20", credit: "0", description: "Office furniture" } as any,
        { accountId: cash.id, debit: "0", credit: "11740.20", description: "Cash payment" } as any,
      ],
      actor: seedActor,
    } as any);

    // Transaction 4: Purchase inventory
    await postJournalEntry({
      transaction: {
        companyId: company.id,
        transactionNumber: "JE-1004",
        date: new Date("2024-01-04"),
        type: "journal_entry",
        description: "Purchase initial inventory",
        totalAmount: "21840.30",
        createdBy: user.id,
      } as any,
      lines: [
        { accountId: inventory.id, debit: "21840.30", credit: "0", description: "Inventory purchase" } as any,
        { accountId: cash.id, debit: "0", credit: "21840.30", description: "Cash payment" } as any,
      ],
      actor: seedActor,
    } as any);

    // Transaction 5: January rent
    await postJournalEntry({
      transaction: {
        companyId: company.id,
        transactionNumber: "JE-1005",
        date: new Date("2024-01-05"),
        type: "journal_entry",
        description: "January rent payment",
        totalAmount: "2500.00",
        createdBy: user.id,
      } as any,
      lines: [
        { accountId: rent.id, debit: "2500.00", credit: "0", description: "January rent" } as any,
        { accountId: cash.id, debit: "0", credit: "2500.00", description: "Cash payment" } as any,
      ],
      actor: seedActor,
    } as any);

    // Transaction 6-9: Monthly payroll
    for (let month = 1; month <= 4; month++) {
      await postJournalEntry({
        transaction: {
          companyId: company.id,
          transactionNumber: `JE-100${5 + month}`,
          date: new Date(`2024-0${month}-15`),
          type: "journal_entry",
          description: `Payroll - Month ${month}`,
          totalAmount: "18000.00",
          createdBy: user.id,
        } as any,
        lines: [
          { accountId: salaries.id, debit: "18000.00", credit: "0", description: "Payroll expense" } as any,
          { accountId: cash.id, debit: "0", credit: "18000.00", description: "Cash payment" } as any,
        ],
        actor: seedActor,
      } as any);
    }

    // Transaction 10: Utility bill
    await postJournalEntry({
      transaction: {
        companyId: company.id,
        transactionNumber: "JE-1010",
        date: new Date("2024-01-10"),
        type: "journal_entry",
        description: "Utility bill payment",
        totalAmount: "5200.00",
        createdBy: user.id,
      } as any,
      lines: [
        { accountId: utilities.id, debit: "5200.00", credit: "0", description: "Utilities" } as any,
        { accountId: cash.id, debit: "0", credit: "5200.00", description: "Cash payment" } as any,
      ],
      actor: seedActor,
    } as any);

    console.log("✅ Created 10 balanced transactions");

    // Create Invoices
    console.log("\nCreating invoices...");

    // Invoice 1 - Paid
    const invoice1 = await storage.createInvoice(
      {
        companyId: company.id,
        customerId: customers[0].id,
        invoiceNumber: "INV-1001",
        date: new Date("2024-01-05"),
        dueDate: new Date("2024-02-04"),
        status: "sent",
        subtotal: "5000.00",
        taxRate: "8.4",
        taxAmount: "420.00",
        total: "5420.00",
        amountPaid: "0",
        notes: "Thank you for your business!",
        createdBy: user.id,
      },
      [
        {
          invoiceId: "",
          description: "Consulting Services - January",
          quantity: "40",
          unitPrice: "125.00",
          amount: "5000.00",
          accountId: salesRevenue.id,
        },
      ]
    );

    // Payment for invoice 1
    await storage.createPayment({
      companyId: company.id,
      invoiceId: invoice1.id,
      date: new Date("2024-01-15"),
      amount: "5420.00",
      paymentMethod: "ACH Transfer",
      createdBy: user.id,
    });

    // Create corresponding transaction for payment
    await postJournalEntry({
      transaction: {
        companyId: company.id,
        transactionNumber: "JE-1011",
        date: new Date("2024-01-15"),
        type: "payment",
        description: `Payment received - ${invoice1.invoiceNumber}`,
        totalAmount: "5420.00",
        createdBy: user.id,
      } as any,
      lines: [
        { accountId: cash.id, debit: "5420.00", credit: "0", description: "Cash received" } as any,
        { accountId: salesRevenue.id, debit: "0", credit: "5420.00", description: "Revenue earned" } as any,
      ],
      actor: seedActor,
    } as any);

    // Invoice 2 - Sent, not paid
    await storage.createInvoice(
      {
        companyId: company.id,
        customerId: customers[1].id,
        invoiceNumber: "INV-1002",
        date: new Date("2024-01-12"),
        dueDate: new Date("2024-02-11"),
        status: "sent",
        subtotal: "3000.00",
        taxRate: "8.33",
        taxAmount: "250.00",
        total: "3250.00",
        amountPaid: "0",
        createdBy: user.id,
      },
      [
        {
          invoiceId: "",
          description: "Software Development - Phase 1",
          quantity: "1",
          unitPrice: "3000.00",
          amount: "3000.00",
          accountId: salesRevenue.id,
        },
      ]
    );

    // Invoice 3 - Sent, not paid
    await storage.createInvoice(
      {
        companyId: company.id,
        customerId: customers[2].id,
        invoiceNumber: "INV-1003",
        date: new Date("2024-01-10"),
        dueDate: new Date("2024-02-09"),
        status: "sent",
        subtotal: "8300.00",
        taxRate: "7.23",
        taxAmount: "600.00",
        total: "8900.00",
        amountPaid: "0",
        createdBy: user.id,
      },
      [
        {
          invoiceId: "",
          description: "Design Services - Q1",
          quantity: "83",
          unitPrice: "100.00",
          amount: "8300.00",
          accountId: salesRevenue.id,
        },
      ]
    );

    // Invoice 4 - Overdue
    await storage.createInvoice(
      {
        companyId: company.id,
        customerId: customers[3].id,
        invoiceNumber: "INV-1004",
        date: new Date("2024-01-08"),
        dueDate: new Date("2024-01-23"),
        status: "overdue",
        subtotal: "1750.00",
        taxRate: "5.71",
        taxAmount: "100.00",
        total: "1850.00",
        amountPaid: "0",
        createdBy: user.id,
      },
      [
        {
          invoiceId: "",
          description: "Marketing Materials Design",
          quantity: "1",
          unitPrice: "1750.00",
          amount: "1750.00",
          accountId: salesRevenue.id,
        },
      ]
    );

    // Invoice 5 - Overdue
    await storage.createInvoice(
      {
        companyId: company.id,
        customerId: customers[4].id,
        invoiceNumber: "INV-1005",
        date: new Date("2024-01-05"),
        dueDate: new Date("2024-01-20"),
        status: "overdue",
        subtotal: "4000.00",
        taxRate: "5.00",
        taxAmount: "200.00",
        total: "4200.00",
        amountPaid: "0",
        createdBy: user.id,
      },
      [
        {
          invoiceId: "",
          description: "Product Development Services",
          quantity: "20",
          unitPrice: "200.00",
          amount: "4000.00",
          accountId: salesRevenue.id,
        },
      ]
    );

    console.log("✅ Created 5 invoices (1 paid, 2 sent, 2 overdue)");

    // Create some expense transactions to balance the books
    console.log("\nCreating additional expense transactions...");

    await postJournalEntry({
      transaction: {
        companyId: company.id,
        transactionNumber: "JE-1012",
        date: new Date("2024-01-20"),
        type: "expense",
        description: "Office supplies purchase",
        totalAmount: "1250.75",
        createdBy: user.id,
      } as any,
      lines: [
        { accountId: officeSupplies.id, debit: "1250.75", credit: "0", description: "Office supplies" } as any,
        { accountId: cash.id, debit: "0", credit: "1250.75", description: "Cash payment" } as any,
      ],
      actor: seedActor,
    } as any);

    await postJournalEntry({
      transaction: {
        companyId: company.id,
        transactionNumber: "JE-1013",
        date: new Date("2024-02-05"),
        type: "expense",
        description: "Marketing campaign",
        totalAmount: "3750.00",
        createdBy: user.id,
      } as any,
      lines: [
        { accountId: marketing.id, debit: "3750.00", credit: "0", description: "Marketing expense" } as any,
        { accountId: cash.id, debit: "0", credit: "3750.00", description: "Cash payment" } as any,
      ],
      actor: seedActor,
    } as any);

    await postJournalEntry({
      transaction: {
        companyId: company.id,
        transactionNumber: "JE-1014",
        date: new Date("2024-01-25"),
        type: "expense",
        description: "Professional services - Legal & Accounting",
        totalAmount: "12680.00",
        createdBy: user.id,
      } as any,
      lines: [
        { accountId: professionalServices.id, debit: "12680.00", credit: "0", description: "Professional fees" } as any,
        { accountId: cash.id, debit: "0", credit: "12680.00", description: "Cash payment" } as any,
      ],
      actor: seedActor,
    } as any);

    // Create some bank transactions for reconciliation demo
    console.log("\nCreating bank transactions for reconciliation...");
    
    await storage.createBankTransaction({
      companyId: company.id,
      accountId: cash.id,
      date: new Date("2024-01-15"),
      description: "ACH DEPOSIT - ACME CORP",
      amount: "5420.00",
      type: "credit",
      isReconciled: true,
      reconciledAt: new Date("2024-01-16"),
    });

    await storage.createBankTransaction({
      companyId: company.id,
      accountId: cash.id,
      date: new Date("2024-01-20"),
      description: "DEBIT - OFFICE SUPPLIES CO",
      amount: "-3420.00",
      type: "debit",
      isReconciled: false,
    });

    console.log("✅ Created bank transactions");

    console.log("\n✨ Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log("   • 1 demo user (demo@accubooks.com / Demo123!)");
    console.log("   • 1 company (AccuBooks Demo Co)");
    console.log("   • 27 accounts (full chart of accounts)");
    console.log("   • 5 customers");
    console.log("   • 5 vendors");
    console.log("   • 13 balanced transactions");
    console.log("   • 5 invoices (1 paid, 2 sent, 2 overdue)");
    console.log("   • 2 bank transactions");
    console.log("\n🔐 Login with: demo@accubooks.com / Demo123!");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log("\n✅ Seed script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Seed script failed:", error);
    process.exit(1);
  });
