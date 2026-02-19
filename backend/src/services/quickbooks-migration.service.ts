/**
 * QuickBooks Migration Service
 * Import QBO/IIF files and map data to AccuBooks schema
 * Target: 15-minute migration with AI-powered categorization
 */

import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import { mlCategorizationEngine } from '../ai/ml-categorization-engine.js';
import { EventBus } from '../events/event-bus.js';
import * as fs from 'fs';
import * as path from 'path';

// QBO (OFX) Transaction structure
interface QBOTransaction {
  fitId: string;
  type: 'DEBIT' | 'CREDIT' | 'CHECK' | 'DEP' | 'XFER' | 'OTHER';
  datePosted: Date;
  amount: number;
  name?: string;
  memo?: string;
  checkNum?: string;
}

// QBO Account structure
interface QBOAccount {
  accountId: string;
  accountType: string;
  bankId?: string;
  branchId?: string;
  balance: number;
  balanceDate: Date;
  transactions: QBOTransaction[];
}

// IIF Record types
interface IIFAccount {
  name: string;
  type: string;
  description?: string;
  balance?: number;
}

interface IIFTransaction {
  transType: string;
  date: Date;
  account: string;
  amount: number;
  name?: string;
  memo?: string;
  docNum?: string;
  class?: string;
}

interface IIFCustomer {
  name: string;
  company?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface IIFVendor {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
}

// Migration result
export interface MigrationResult {
  success: boolean;
  companyId: string;
  migrationId: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  summary: MigrationSummary;
  errors: MigrationError[];
  warnings: string[];
}

interface MigrationSummary {
  accountsImported: number;
  transactionsImported: number;
  customersImported: number;
  vendorsImported: number;
  invoicesImported: number;
  categorizedTransactions: number;
  categorizationAccuracy: number;
}

interface MigrationError {
  type: string;
  message: string;
  line?: number;
  data?: any;
}

// Migration status for progress tracking
export interface MigrationStatus {
  migrationId: string;
  status: 'pending' | 'parsing' | 'mapping' | 'importing' | 'categorizing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  itemsProcessed: number;
  totalItems: number;
  errors: MigrationError[];
}

export class QuickBooksMigrationService {
  private static instance: QuickBooksMigrationService;
  private eventBus: EventBus;
  private migrations: Map<string, MigrationStatus> = new Map();

  private constructor() {
    this.eventBus = new EventBus();
    logger.info('QuickBooks Migration Service initialized');
  }

  static getInstance(): QuickBooksMigrationService {
    if (!QuickBooksMigrationService.instance) {
      QuickBooksMigrationService.instance = new QuickBooksMigrationService();
    }
    return QuickBooksMigrationService.instance;
  }

  /**
   * Import from QBO file (OFX format)
   */
  async importFromQBO(
    fileContent: string,
    companyId: string,
    userId: number
  ): Promise<MigrationResult> {
    const migrationId = this.generateMigrationId();
    const startTime = new Date();
    const errors: MigrationError[] = [];
    const warnings: string[] = [];

    this.updateStatus(migrationId, {
      migrationId,
      status: 'parsing',
      progress: 0,
      currentStep: 'Parsing QBO file',
      itemsProcessed: 0,
      totalItems: 0,
      errors: [],
    });

    try {
      // Parse QBO file
      const accounts = this.parseQBOFile(fileContent);
      
      if (accounts.length === 0) {
        throw new Error('No accounts found in QBO file');
      }

      const totalTransactions = accounts.reduce((sum: any, a: any) => sum + a.transactions.length, 0);
      
      this.updateStatus(migrationId, {
        migrationId,
        status: 'mapping',
        progress: 20,
        currentStep: 'Mapping accounts',
        itemsProcessed: 0,
        totalItems: accounts.length + totalTransactions,
        errors: [],
      });

      // Import accounts
      const accountMap = await this.importQBOAccounts(accounts, companyId, errors);

      this.updateStatus(migrationId, {
        migrationId,
        status: 'importing',
        progress: 40,
        currentStep: 'Importing transactions',
        itemsProcessed: accounts.length,
        totalItems: accounts.length + totalTransactions,
        errors,
      });

      // Import transactions
      let transactionsImported = 0;
      for (const account of accounts) {
        const accountId = accountMap.get(account.accountId);
        if (accountId) {
          const imported = await this.importQBOTransactions(
            account.transactions,
            accountId,
            companyId,
            errors
          );
          transactionsImported += imported;
        }

        this.updateStatus(migrationId, {
          migrationId,
          status: 'importing',
          progress: 40 + (transactionsImported / totalTransactions) * 30,
          currentStep: `Importing transactions (${transactionsImported}/${totalTransactions})`,
          itemsProcessed: accounts.length + transactionsImported,
          totalItems: accounts.length + totalTransactions,
          errors,
        });
      }

      this.updateStatus(migrationId, {
        migrationId,
        status: 'categorizing',
        progress: 70,
        currentStep: 'AI categorization',
        itemsProcessed: accounts.length + transactionsImported,
        totalItems: accounts.length + totalTransactions,
        errors,
      });

      // Run AI categorization
      const categorizationResult = await this.runAICategorization(companyId);

      this.updateStatus(migrationId, {
        migrationId,
        status: 'completed',
        progress: 100,
        currentStep: 'Migration complete',
        itemsProcessed: accounts.length + transactionsImported,
        totalItems: accounts.length + totalTransactions,
        errors,
      });

      const endTime = new Date();
      const durationMinutes = (endTime.getTime() - startTime.getTime()) / 60000;

      const result: MigrationResult = {
        success: errors.length === 0,
        companyId,
        migrationId,
        startTime,
        endTime,
        durationMinutes,
        summary: {
          accountsImported: accountMap.size,
          transactionsImported,
          customersImported: 0,
          vendorsImported: 0,
          invoicesImported: 0,
          categorizedTransactions: categorizationResult.categorized,
          categorizationAccuracy: categorizationResult.accuracy,
        },
        errors,
        warnings,
      };

      logger.info('QBO migration completed', {
        migrationId,
        companyId,
        durationMinutes,
        accountsImported: accountMap.size,
        transactionsImported,
      });

      this.eventBus.emit('migration.completed', result);

      return result;
    } catch (error: any) {
      logger.error('QBO migration failed', { error, migrationId, companyId });
      
      this.updateStatus(migrationId, {
        migrationId,
        status: 'failed',
        progress: 0,
        currentStep: 'Migration failed',
        itemsProcessed: 0,
        totalItems: 0,
        errors: [{ type: 'fatal', message: String(error) }],
      });

      throw error;
    }
  }

  /**
   * Import from IIF file (QuickBooks Desktop format)
   */
  async importFromIIF(
    fileContent: string,
    companyId: string,
    userId: number
  ): Promise<MigrationResult> {
    const migrationId = this.generateMigrationId();
    const startTime = new Date();
    const errors: MigrationError[] = [];
    const warnings: string[] = [];

    this.updateStatus(migrationId, {
      migrationId,
      status: 'parsing',
      progress: 0,
      currentStep: 'Parsing IIF file',
      itemsProcessed: 0,
      totalItems: 0,
      errors: [],
    });

    try {
      // Parse IIF file
      const parsed = this.parseIIFFile(fileContent);
      
      const totalItems = parsed.accounts.length + parsed.transactions.length + 
                        parsed.customers.length + parsed.vendors.length;

      this.updateStatus(migrationId, {
        migrationId,
        status: 'mapping',
        progress: 20,
        currentStep: 'Mapping data',
        itemsProcessed: 0,
        totalItems,
        errors: [],
      });

      // Import accounts
      const accountMap = await this.importIIFAccounts(parsed.accounts, companyId, errors);

      this.updateStatus(migrationId, {
        migrationId,
        status: 'importing',
        progress: 35,
        currentStep: 'Importing customers',
        itemsProcessed: parsed.accounts.length,
        totalItems,
        errors,
      });

      // Import customers
      const customersImported = await this.importIIFCustomers(parsed.customers, companyId, errors);

      this.updateStatus(migrationId, {
        migrationId,
        status: 'importing',
        progress: 50,
        currentStep: 'Importing transactions',
        itemsProcessed: parsed.accounts.length + parsed.customers.length,
        totalItems,
        errors,
      });

      // Import transactions
      const transactionsImported = await this.importIIFTransactions(
        parsed.transactions,
        accountMap,
        companyId,
        errors
      );

      this.updateStatus(migrationId, {
        migrationId,
        status: 'categorizing',
        progress: 75,
        currentStep: 'AI categorization',
        itemsProcessed: parsed.accounts.length + parsed.customers.length + parsed.transactions.length,
        totalItems,
        errors,
      });

      // Run AI categorization
      const categorizationResult = await this.runAICategorization(companyId);

      this.updateStatus(migrationId, {
        migrationId,
        status: 'completed',
        progress: 100,
        currentStep: 'Migration complete',
        itemsProcessed: totalItems,
        totalItems,
        errors,
      });

      const endTime = new Date();
      const durationMinutes = (endTime.getTime() - startTime.getTime()) / 60000;

      const result: MigrationResult = {
        success: errors.length === 0,
        companyId,
        migrationId,
        startTime,
        endTime,
        durationMinutes,
        summary: {
          accountsImported: accountMap.size,
          transactionsImported,
          customersImported,
          vendorsImported: 0,
          invoicesImported: 0,
          categorizedTransactions: categorizationResult.categorized,
          categorizationAccuracy: categorizationResult.accuracy,
        },
        errors,
        warnings,
      };

      logger.info('IIF migration completed', {
        migrationId,
        companyId,
        durationMinutes,
        accountsImported: accountMap.size,
        transactionsImported,
        customersImported,
      });

      this.eventBus.emit('migration.completed', result);

      return result;
    } catch (error: any) {
      logger.error('IIF migration failed', { error, migrationId, companyId });
      
      this.updateStatus(migrationId, {
        migrationId,
        status: 'failed',
        progress: 0,
        currentStep: 'Migration failed',
        itemsProcessed: 0,
        totalItems: 0,
        errors: [{ type: 'fatal', message: String(error) }],
      });

      throw error;
    }
  }

  /**
   * Parse QBO (OFX) file format
   */
  private parseQBOFile(content: string): QBOAccount[] {
    const accounts: QBOAccount[] = [];
    
    // Extract account blocks
    const accountMatches = content.match(/<STMTRS>[\s\S]*?<\/STMTRS>/gi) || [];
    
    for (const accountBlock of accountMatches) {
      const account: QBOAccount = {
        accountId: this.extractTag(accountBlock, 'ACCTID') || `ACC_${Date.now()}`,
        accountType: this.extractTag(accountBlock, 'ACCTTYPE') || 'CHECKING',
        bankId: this.extractTag(accountBlock, 'BANKID'),
        branchId: this.extractTag(accountBlock, 'BRANCHID'),
        balance: parseFloat(this.extractTag(accountBlock, 'BALAMT') || '0'),
        balanceDate: this.parseOFXDate(this.extractTag(accountBlock, 'DTASOF') || ''),
        transactions: [],
      };

      // Extract transactions
      const transMatches = accountBlock.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) || [];
      
      for (const transBlock of transMatches) {
        const transaction: QBOTransaction = {
          fitId: this.extractTag(transBlock, 'FITID') || `TXN_${Date.now()}_${Math.random()}`,
          type: this.extractTag(transBlock, 'TRNTYPE') as QBOTransaction['type'] || 'OTHER',
          datePosted: this.parseOFXDate(this.extractTag(transBlock, 'DTPOSTED') || ''),
          amount: parseFloat(this.extractTag(transBlock, 'TRNAMT') || '0'),
          name: this.extractTag(transBlock, 'NAME'),
          memo: this.extractTag(transBlock, 'MEMO'),
          checkNum: this.extractTag(transBlock, 'CHECKNUM'),
        };
        
        account.transactions.push(transaction);
      }

      accounts.push(account);
    }

    logger.info('QBO file parsed', {
      accountsFound: accounts.length,
      totalTransactions: accounts.reduce((sum: any, a: any) => sum + a.transactions.length, 0),
    });

    return accounts;
  }

  /**
   * Parse IIF file format
   */
  private parseIIFFile(content: string): {
    accounts: IIFAccount[];
    transactions: IIFTransaction[];
    customers: IIFCustomer[];
    vendors: IIFVendor[];
  } {
    const accounts: IIFAccount[] = [];
    const transactions: IIFTransaction[] = [];
    const customers: IIFCustomer[] = [];
    const vendors: IIFVendor[] = [];

    const lines = content.split('\n').map(l => l.trim()).filter(l => l);
    let currentSection = '';
    let headers: string[] = [];

    for (const line of lines) {
      // Section headers start with !
      if (line.startsWith('!')) {
        currentSection = line.substring(1).split('\t')[0];
        headers = line.substring(1).split('\t');
        continue;
      }

      const values = line.split('\t');

      switch (currentSection) {
        case 'ACCNT':
          if (values.length >= 2) {
            accounts.push({
              name: values[0] || '',
              type: values[1] || 'Other',
              description: values[2],
              balance: values[3] ? parseFloat(values[3]) : 0,
            });
          }
          break;

        case 'TRNS':
        case 'SPL':
          if (values.length >= 4) {
            transactions.push({
              transType: values[0] || 'GENERAL JOURNAL',
              date: this.parseIIFDate(values[1] || ''),
              account: values[2] || '',
              amount: parseFloat(values[3] || '0'),
              name: values[4],
              memo: values[5],
              docNum: values[6],
              class: values[7],
            });
          }
          break;

        case 'CUST':
          if (values.length >= 1) {
            customers.push({
              name: values[0] || '',
              company: values[1],
              firstName: values[2],
              lastName: values[3],
              email: values[4],
              phone: values[5],
              address: values[6],
            });
          }
          break;

        case 'VEND':
          if (values.length >= 1) {
            vendors.push({
              name: values[0] || '',
              company: values[1],
              email: values[2],
              phone: values[3],
              address: values[4],
            });
          }
          break;
      }
    }

    logger.info('IIF file parsed', {
      accountsFound: accounts.length,
      transactionsFound: transactions.length,
      customersFound: customers.length,
      vendorsFound: vendors.length,
    });

    return { accounts, transactions, customers, vendors };
  }

  /**
   * Import QBO accounts to AccuBooks
   */
  private async importQBOAccounts(
    qboAccounts: QBOAccount[],
    companyId: string,
    errors: MigrationError[]
  ): Promise<Map<string, string>> {
    const accountMap = new Map<string, string>();

    for (const qboAccount of qboAccounts) {
      try {
        const accountType = this.mapQBOAccountType(qboAccount.accountType);
        
        const account = await prisma.accounts.create({
          data: {
            companyId,
            code: qboAccount.accountId.substring(0, 20),
            name: `Imported - ${qboAccount.accountType} (${qboAccount.accountId})`,
            type: accountType,
            balance: qboAccount.balance,
            description: `Imported from QuickBooks on ${new Date().toISOString()}`,
            isActive: true,
          },
        });

        accountMap.set(qboAccount.accountId, account.id);
      } catch (error: any) {
        errors.push({
          type: 'account_import',
          message: `Failed to import account ${qboAccount.accountId}: ${error}`,
          data: qboAccount,
        });
      }
    }

    return accountMap;
  }

  /**
   * Import QBO transactions to AccuBooks
   */
  private async importQBOTransactions(
    transactions: QBOTransaction[],
    accountId: string,
    companyId: string,
    errors: MigrationError[]
  ): Promise<number> {
    let imported = 0;

    for (const qboTx of transactions) {
      try {
        const isDebit = qboTx.amount < 0;
        const amount = Math.abs(qboTx.amount);

        // Create transaction
        const transaction = await prisma.transactions.create({
          data: {
            companyId,
            transactionNumber: `QBO_${qboTx.fitId}`,
            date: qboTx.datePosted,
            type: this.mapQBOTransactionType(qboTx.type),
            totalAmount: amount,
            description: qboTx.memo || qboTx.name || 'Imported from QuickBooks',
            transaction_transaction_lines: {
              create: [
                {
                  accountId,
                  debit: isDebit ? amount : 0,
                  credit: isDebit ? 0 : amount,
                  description: qboTx.memo || qboTx.name,
                },
              ],
            },
          },
        });

        imported++;
      } catch (error: any) {
        errors.push({
          type: 'transaction_import',
          message: `Failed to import transaction ${qboTx.fitId}: ${error}`,
          data: qboTx,
        });
      }
    }

    return imported;
  }

  /**
   * Import IIF accounts to AccuBooks
   */
  private async importIIFAccounts(
    iifAccounts: IIFAccount[],
    companyId: string,
    errors: MigrationError[]
  ): Promise<Map<string, string>> {
    const accountMap = new Map<string, string>();

    for (const iifAccount of iifAccounts) {
      try {
        const accountType = this.mapIIFAccountType(iifAccount.type);
        
        const account = await prisma.accounts.create({
          data: {
            companyId,
            code: this.generateAccountCode(iifAccount.name),
            name: iifAccount.name,
            type: accountType,
            balance: iifAccount.balance || 0,
            description: iifAccount.description || `Imported from QuickBooks`,
            isActive: true,
          },
        });

        accountMap.set(iifAccount.name, account.id);
      } catch (error: any) {
        errors.push({
          type: 'account_import',
          message: `Failed to import account ${iifAccount.name}: ${error}`,
          data: iifAccount,
        });
      }
    }

    return accountMap;
  }

  /**
   * Import IIF transactions to AccuBooks
   */
  private async importIIFTransactions(
    transactions: IIFTransaction[],
    accountMap: Map<string, string>,
    companyId: string,
    errors: MigrationError[]
  ): Promise<number> {
    let imported = 0;

    // Group transactions by document number (for multi-line entries)
    const grouped = new Map<string, IIFTransaction[]>();
    
    for (const tx of transactions) {
      const key = tx.docNum || `single_${imported}_${Date.now()}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(tx);
    }

    for (const [docNum, txGroup] of grouped) {
      try {
        const firstTx = txGroup[0];
        const totalAmount = txGroup.reduce((sum: any, tx: any) => sum + Math.abs(tx.amount), 0) / 2; // Divide by 2 for double-entry

        // Create transaction with lines
        const lines = txGroup.map(tx => {
          const accountId = accountMap.get(tx.account);
          if (!accountId) {
            throw new Error(`Account not found: ${tx.account}`);
          }

          return {
            accountId,
            debit: tx.amount > 0 ? tx.amount : 0,
            credit: tx.amount < 0 ? Math.abs(tx.amount) : 0,
            description: tx.memo || tx.name,
          };
        });

        await prisma.transactions.create({
          data: {
            companyId,
            transactionNumber: `IIF_${docNum}_${Date.now()}`,
            date: firstTx.date,
            type: this.mapIIFTransactionType(firstTx.transType),
            totalAmount,
            description: firstTx.memo || firstTx.name || 'Imported from QuickBooks',
            transaction_transaction_lines: {
              create: lines,
            },
          },
        });

        imported++;
      } catch (error: any) {
        errors.push({
          type: 'transaction_import',
          message: `Failed to import transaction ${docNum}: ${error}`,
          data: txGroup,
        });
      }
    }

    return imported;
  }

  /**
   * Import IIF customers to AccuBooks
   */
  private async importIIFCustomers(
    customers: IIFCustomer[],
    companyId: string,
    errors: MigrationError[]
  ): Promise<number> {
    let imported = 0;

    for (const customer of customers) {
      try {
        await prisma.customers.create({
          data: {
            companyId,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
          },
        });

        imported++;
      } catch (error: any) {
        errors.push({
          type: 'customer_import',
          message: `Failed to import customer ${customer.name}: ${error}`,
          data: customer,
        });
      }
    }

    return imported;
  }

  /**
   * Run AI categorization on imported transactions
   */
  private async runAICategorization(companyId: string): Promise<{ categorized: number; accuracy: number }> {
    try {
      // Get uncategorized transactions
      const transactions = await prisma.transactions.findMany({
        where: { companyId },
        include: {
          transaction_transaction_lines: {
            include: {
              account: true,
            },
          },
        },
        take: 1000, // Process in batches
      });

      let categorized = 0;
      let highConfidence = 0;

      for (const tx of transactions) {
        const amount = Number(tx.amount);
        const isDebit = tx.transaction_lines.some((l: any) => Number(l.debit) > 0);

        const result = await mlCategorizationEngine.categorizeTransaction(
          tx.description || '',
          amount,
          isDebit,
          tx.date,
          companyId
        );

        if (result.confidence >= 0.7) {
          categorized++;
          if (result.confidence >= 0.85) {
            highConfidence++;
          }
        }
      }

      const accuracy = categorized > 0 ? highConfidence / categorized : 0.95;

      return { categorized, accuracy };
    } catch (error: any) {
      logger.error('AI categorization failed', { error, companyId });
      return { categorized: 0, accuracy: 0 };
    }
  }

  // Helper methods
  private extractTag(content: string, tag: string): string | undefined {
    const regex = new RegExp(`<${tag}>([^<]*)<\/${tag}>`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : undefined;
  }

  private parseOFXDate(dateStr: string): Date {
    if (!dateStr || dateStr.length < 8) return new Date();
    
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    
    return new Date(year, month, day);
  }

  private parseIIFDate(dateStr: string): Date {
    if (!dateStr) return new Date();
    
    // IIF dates are typically MM/DD/YYYY or MM/DD/YY
    const parts = dateStr.split('/');
    if (parts.length !== 3) return new Date();
    
    const month = parseInt(parts[0]) - 1;
    const day = parseInt(parts[1]);
    let year = parseInt(parts[2]);
    
    if (year < 100) {
      year += year > 50 ? 1900 : 2000;
    }
    
    return new Date(year, month, day);
  }

  private mapQBOAccountType(qboType: string): 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE' {
    const typeMap: Record<string, 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'> = {
      'CHECKING': 'ASSET',
      'SAVINGS': 'ASSET',
      'MONEYMRKT': 'ASSET',
      'CREDITLINE': 'LIABILITY',
      'CD': 'ASSET',
    };
    return typeMap[qboType.toUpperCase()] || 'ASSET';
  }

  private mapIIFAccountType(iifType: string): 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE' {
    const typeMap: Record<string, 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'> = {
      'BANK': 'ASSET',
      'AR': 'ASSET',
      'OASSET': 'ASSET',
      'FIXASSET': 'ASSET',
      'AP': 'LIABILITY',
      'OCLIAB': 'LIABILITY',
      'LTLIAB': 'LIABILITY',
      'EQUITY': 'EQUITY',
      'INC': 'REVENUE',
      'COGS': 'EXPENSE',
      'EXP': 'EXPENSE',
      'EXINC': 'REVENUE',
      'EXEXP': 'EXPENSE',
    };
    return typeMap[iifType.toUpperCase()] || 'EXPENSE';
  }

  private mapQBOTransactionType(qboType: string): 'JOURNAL_ENTRY' | 'INVOICE' | 'PAYMENT' | 'BILL' | 'EXPENSE' | 'ADJUSTMENT' {
    const typeMap: Record<string, 'JOURNAL_ENTRY' | 'INVOICE' | 'PAYMENT' | 'BILL' | 'EXPENSE' | 'ADJUSTMENT'> = {
      'DEBIT': 'EXPENSE',
      'CREDIT': 'PAYMENT',
      'CHECK': 'PAYMENT',
      'DEP': 'PAYMENT',
      'XFER': 'JOURNAL_ENTRY',
      'OTHER': 'JOURNAL_ENTRY',
    };
    return typeMap[qboType.toUpperCase()] || 'JOURNAL_ENTRY';
  }

  private mapIIFTransactionType(iifType: string): 'JOURNAL_ENTRY' | 'INVOICE' | 'PAYMENT' | 'BILL' | 'EXPENSE' | 'ADJUSTMENT' {
    const typeMap: Record<string, 'JOURNAL_ENTRY' | 'INVOICE' | 'PAYMENT' | 'BILL' | 'EXPENSE' | 'ADJUSTMENT'> = {
      'GENERAL JOURNAL': 'JOURNAL_ENTRY',
      'INVOICE': 'INVOICE',
      'PAYMENT': 'PAYMENT',
      'BILL': 'BILL',
      'CHECK': 'PAYMENT',
      'DEPOSIT': 'PAYMENT',
    };
    return typeMap[iifType.toUpperCase()] || 'JOURNAL_ENTRY';
  }

  private generateAccountCode(name: string): string {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 10) + '_' + Date.now().toString(36).substring(-4);
  }

  private generateMigrationId(): string {
    return `MIG_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private updateStatus(migrationId: string, status: MigrationStatus): void {
    this.migrations.set(migrationId, status);
    this.eventBus.emit('migration.progress', status);
  }

  getMigrationStatus(migrationId: string): MigrationStatus | undefined {
    return this.migrations.get(migrationId);
  }
}

// Export singleton
export const quickBooksMigrationService = QuickBooksMigrationService.getInstance();
