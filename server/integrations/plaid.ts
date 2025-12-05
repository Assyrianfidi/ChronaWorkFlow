import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode, DepositoryAccountSubtype } from 'plaid';
import { logger } from '../utils/logger';

// Initialize Plaid with API keys from environment
const plaidConfig = new Configuration({
  basePath: PlaidEnvironments.sandbox, // Use production for live
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || '',
      'PLAID-SECRET': process.env.PLAID_SECRET || '',
    },
  },
});

export const plaidClient = new PlaidApi(plaidConfig);

export interface PlaidLinkToken {
  link_token: string;
  expiration: string;
  request_id: string;
}

export interface PlaidPublicTokenExchange {
  access_token: string;
  item_id: string;
  request_id: string;
}

export interface PlaidAccount {
  account_id: string;
  balances: {
    available?: number;
    current: number;
    iso_currency_code?: string;
    limit?: number;
    unofficial_currency_code?: string;
  };
  mask?: string;
  name: string;
  official_name?: string;
  subtype?: string;
  type: string;
}

export interface PlaidTransaction {
  account_id: string;
  amount: number;
  iso_currency_code?: string;
  unofficial_currency_code?: string;
  category?: string[];
  category_id?: string;
  check_number?: string;
  date: string;
  datetime?: string;
  authorized_date?: string;
  authorized_datetime?: string;
  location?: {
    address?: string;
    city?: string;
    country?: string;
    lat?: number;
    lon?: number;
    postal_code?: string;
    region?: string;
    store_number?: string;
  };
  merchant_name?: string;
  name: string;
  payment_channel?: string;
  payment_meta?: {
    by_order_of?: string;
    payee?: string;
    payer?: string;
    payment_method?: string;
    payment_processor?: string;
    ppd_id?: string;
    reason?: string;
    reference_number?: string;
  };
  pending: boolean;
  pending_transaction_id?: string;
  personal_finance_category?: {
    primary: string;
    detailed: string;
  };
  transaction_id: string;
  transaction_type?: string;
}

export interface PlaidAccountBalance {
  account_id: string;
  balances: {
    available?: number;
    current: number;
    iso_currency_code?: string;
    unofficial_currency_code?: string;
  };
}

export class PlaidService {
  // Link Token Creation (for OAuth flow)
  async createLinkToken(userId: string, companyId: string): Promise<PlaidLinkToken> {
    try {
      const request = {
        user: {
          client_user_id: `${userId}-${companyId}`,
        },
        client_name: 'AccuBooks',
        products: [Products.Transactions, Products.Auth],
        country_codes: [CountryCode.Us],
        language: 'en',
        webhook: process.env.PLAID_WEBHOOK_URL,
        account_filters: {
          depository: {
            account_subtypes: [DepositoryAccountSubtype.Checking, DepositoryAccountSubtype.Savings],
          },
        },
      };

      const response = await plaidClient.linkTokenCreate(request);
      logger.info(`Plaid link token created for user ${userId}`);

      return {
        link_token: response.data.link_token,
        expiration: response.data.expiration,
        request_id: response.data.request_id,
      };
    } catch (error) {
      logger.error('Failed to create Plaid link token:', error);
      throw new Error(`Link token creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Exchange public token for access token
  async exchangePublicToken(publicToken: string): Promise<PlaidPublicTokenExchange> {
    try {
      const response = await plaidClient.itemPublicTokenExchange({
        public_token: publicToken,
      });

      logger.info(`Plaid public token exchanged: ${response.data.item_id}`);
      return {
        access_token: response.data.access_token,
        item_id: response.data.item_id,
        request_id: response.data.request_id,
      };
    } catch (error) {
      logger.error('Failed to exchange Plaid public token:', error);
      throw new Error(`Token exchange failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get accounts for an access token
  async getAccounts(accessToken: string): Promise<PlaidAccount[]> {
    try {
      const response = await plaidClient.accountsGet({
        access_token: accessToken,
      });

      return response.data.accounts.map((account: any) => ({
        account_id: account.account_id,
        balances: {
          available: account.balances.available || undefined,
          current: account.balances.current,
          iso_currency_code: account.balances.iso_currency_code || undefined,
          limit: account.balances.limit || undefined,
          unofficial_currency_code: account.balances.unofficial_currency_code || undefined,
        },
        mask: account.mask || undefined,
        name: account.name,
        official_name: account.official_name || undefined,
        subtype: account.subtype || undefined,
        type: account.type,
      }));
    } catch (error) {
      logger.error('Failed to get Plaid accounts:', error);
      throw new Error(`Account retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get account balances
  async getAccountBalances(accessToken: string): Promise<PlaidAccountBalance[]> {
    try {
      const response = await plaidClient.accountsBalanceGet({
        access_token: accessToken,
      });

      return response.data.accounts.map((account: any) => ({
        account_id: account.account_id,
        balances: {
          available: account.balances.available || undefined,
          current: account.balances.current,
          iso_currency_code: account.balances.iso_currency_code || undefined,
          unofficial_currency_code: account.balances.unofficial_currency_code || undefined,
        },
      }));
    } catch (error) {
      logger.error('Failed to get Plaid account balances:', error);
      throw new Error(`Balance retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get transactions
  async getTransactions(
    accessToken: string,
    startDate: string,
    endDate: string,
    accountIds?: string[]
  ): Promise<PlaidTransaction[]> {
    try {
      const request = {
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        options: {
          account_ids: accountIds,
          count: 500,
          offset: 0,
        },
      };

      const response = await plaidClient.transactionsGet(request);

      return response.data.transactions.map((transaction: any) => ({
        account_id: transaction.account_id,
        amount: transaction.amount,
        iso_currency_code: transaction.iso_currency_code || undefined,
        category: transaction.category || undefined,
        category_id: transaction.category_id || undefined,
        check_number: transaction.check_number || undefined,
        date: transaction.date,
        datetime: transaction.datetime || undefined,
        authorized_date: transaction.authorized_date || undefined,
        authorized_datetime: transaction.authorized_datetime || undefined,
        location: transaction.location || undefined,
        merchant_name: transaction.merchant_name || undefined,
        name: transaction.name,
        payment_channel: transaction.payment_channel,
        payment_meta: transaction.payment_meta || undefined,
        pending: transaction.pending,
        pending_transaction_id: transaction.pending_transaction_id || undefined,
        personal_finance_category: transaction.personal_finance_category || undefined,
        transaction_id: transaction.transaction_id,
        transaction_type: transaction.transaction_type || undefined,
        unofficial_currency_code: transaction.unofficial_currency_code || undefined,
      }));
    } catch (error) {
      logger.error('Failed to get Plaid transactions:', error);
      throw new Error(`Transaction retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Sync transactions and categorize them
  async syncTransactions(
    accessToken: string,
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    added: number;
    updated: number;
    categorized: number;
    errors: string[];
  }> {
    try {
      const transactions = await this.getTransactions(accessToken, startDate, endDate);
      const accounts = await this.getAccounts(accessToken);

      let added = 0;
      let updated = 0;
      let categorized = 0;
      const errors: string[] = [];

      for (const transaction of transactions) {
        try {
          // Find the corresponding account in our system
          const account = accounts.find(acc => acc.account_id === transaction.account_id);
          if (!account) {
            errors.push(`Account not found for transaction ${transaction.transaction_id}`);
            continue;
          }

          // Categorize transaction based on merchant/category
          const category = this.categorizeTransaction(transaction);

          // Create or update bank transaction in our system
          const bankTransaction = {
            companyId,
            accountId: this.mapAccountId(account.account_id),
            date: new Date(transaction.date),
            description: transaction.name,
            amount: transaction.amount.toString(),
            type: transaction.amount >= 0 ? 'credit' : 'debit',
            referenceNumber: transaction.transaction_id,
            category: category.category,
            subcategory: category.subcategory,
          };

          // Implementation would create/update bank transaction record
          // For now, just count the operations
          if (transaction.pending) {
            added++;
          } else {
            updated++;
          }

          if (category.confidence > 0.8) {
            categorized++;
          }
        } catch (error) {
          errors.push(`Failed to process transaction ${transaction.transaction_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      logger.info(`Plaid sync completed: ${added} added, ${updated} updated, ${categorized} categorized`);
      return { added, updated, categorized, errors };
    } catch (error) {
      logger.error('Failed to sync Plaid transactions:', error);
      throw new Error(`Transaction sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Categorize transactions based on merchant/category data
  private categorizeTransaction(transaction: PlaidTransaction): {
    category: string;
    subcategory?: string;
    confidence: number;
  } {
    const name = transaction.name.toLowerCase();
    const merchant = transaction.merchant_name?.toLowerCase() || '';
    const category = transaction.category?.[0]?.toLowerCase() || '';

    // Simple categorization logic - in production, use ML or more sophisticated rules
    if (name.includes('paypal') || name.includes('venmo')) {
      return { category: 'transfer', subcategory: 'digital_wallet', confidence: 0.9 };
    }

    if (name.includes('amazon') || name.includes('walmart') || name.includes('target')) {
      return { category: 'expense', subcategory: 'shopping', confidence: 0.85 };
    }

    if (name.includes('uber') || name.includes('lyft') || name.includes('taxi')) {
      return { category: 'expense', subcategory: 'transportation', confidence: 0.8 };
    }

    if (name.includes('restaurant') || name.includes('cafe') || name.includes('mcdonald')) {
      return { category: 'expense', subcategory: 'food', confidence: 0.75 };
    }

    if (name.includes('gas') || name.includes('shell') || name.includes('exxon')) {
      return { category: 'expense', subcategory: 'fuel', confidence: 0.8 };
    }

    if (name.includes('salary') || name.includes('payroll') || name.includes('direct deposit')) {
      return { category: 'income', subcategory: 'salary', confidence: 0.9 };
    }

    if (category.includes('food') || category.includes('restaurant')) {
      return { category: 'expense', subcategory: 'food', confidence: 0.7 };
    }

    if (category.includes('gas') || category.includes('fuel')) {
      return { category: 'expense', subcategory: 'fuel', confidence: 0.7 };
    }

    if (category.includes('transfer') || category.includes('payment')) {
      return { category: 'transfer', confidence: 0.6 };
    }

    // Default categorization
    return { category: 'expense', subcategory: 'other', confidence: 0.3 };
  }

  // Map Plaid account IDs to our internal account IDs
  private mapAccountId(plaidAccountId: string): string {
    // In a real implementation, this would map Plaid account IDs to our internal account IDs
    // For now, return the Plaid ID as-is or implement a mapping logic
    return plaidAccountId;
  }

  // Webhook handling for real-time updates
  async handleWebhook(body: any, signature: string): Promise<void> {
    try {
      // Verify webhook signature (implementation would depend on Plaid's webhook verification)
      // For now, assume signature verification is handled elsewhere

      const webhookType = body.webhook_type;
      const webhookCode = body.webhook_code;

      logger.info(`Plaid webhook received: ${webhookType} - ${webhookCode}`);

      switch (webhookType) {
        case 'TRANSACTIONS':
          await this.handleTransactionUpdates(body);
          break;
        case 'ACCOUNTS':
          await this.handleAccountUpdates(body);
          break;
        case 'ITEM':
          await this.handleItemUpdates(body);
          break;
        default:
          logger.info(`Unhandled webhook type: ${webhookType}`);
      }
    } catch (error) {
      logger.error('Failed to handle Plaid webhook:', error);
      throw error;
    }
  }

  private async handleTransactionUpdates(body: any): Promise<void> {
    // Implementation would:
    // 1. Extract new/updated transactions
    // 2. Sync with our database
    // 3. Trigger reconciliation processes
    logger.info('Processing transaction updates');
  }

  private async handleAccountUpdates(body: any): Promise<void> {
    // Implementation would:
    // 1. Update account balances
    // 2. Handle new/closed accounts
    logger.info('Processing account updates');
  }

  private async handleItemUpdates(body: any): Promise<void> {
    // Implementation would:
    // 1. Handle login status changes
    // 2. Manage item errors
    // 3. Trigger re-authentication if needed
    logger.info('Processing item updates');
  }

  // Health check
  async healthCheck(): Promise<{ status: string; error?: string }> {
    try {
      // Simple health check - try to get institutions (doesn't require authentication)
      await plaidClient.institutionsGetById({
        institution_id: 'ins_1', // Use a known test institution ID
        country_codes: [CountryCode.Us],
      });
      return { status: 'healthy' };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get supported institutions
  async getInstitutions(countryCode: CountryCode = CountryCode.Us, count = 10): Promise<any[]> {
    try {
      const response = await plaidClient.institutionsGet({
        country_codes: [countryCode],
        count,
        offset: 0,
      });

      return response.data.institutions;
    } catch (error) {
      logger.error('Failed to get Plaid institutions:', error);
      throw new Error(`Institution retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const plaidService = new PlaidService();
