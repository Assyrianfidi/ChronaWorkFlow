import { Request, Response } from 'express';
import { plaidService } from '../integrations/plaid';
import { logger } from '../utils/logger';

// Create link token for Plaid Link OAuth flow
export async function createLinkToken(req: Request, res: Response) {
  try {
    const { userId, companyId } = req.body;

    if (!userId || !companyId) {
      return res.status(400).json({ error: 'userId and companyId are required' });
    }

    const linkToken = await plaidService.createLinkToken(userId, companyId);

    res.json({
      linkToken: linkToken.link_token,
      expiration: linkToken.expiration,
      requestId: linkToken.request_id,
    });
  } catch (error) {
    logger.error('Link token creation failed:', error);
    res.status(500).json({ error: 'Failed to create link token' });
  }
}

// Exchange public token for access token
export async function exchangePublicToken(req: Request, res: Response) {
  try {
    const { publicToken } = req.body;

    if (!publicToken) {
      return res.status(400).json({ error: 'publicToken is required' });
    }

    const tokenExchange = await plaidService.exchangePublicToken(publicToken);

    res.json({
      accessToken: tokenExchange.access_token,
      itemId: tokenExchange.item_id,
      requestId: tokenExchange.request_id,
    });
  } catch (error) {
    logger.error('Public token exchange failed:', error);
    res.status(500).json({ error: 'Failed to exchange public token' });
  }
}

// Get accounts for an access token
export async function getAccounts(req: Request, res: Response) {
  try {
    const { accessToken } = req.query;

    if (!accessToken) {
      return res.status(400).json({ error: 'accessToken is required' });
    }

    const accounts = await plaidService.getAccounts(accessToken as string);

    res.json(accounts);
  } catch (error) {
    logger.error('Account retrieval failed:', error);
    res.status(500).json({ error: 'Failed to retrieve accounts' });
  }
}

// Get account balances
export async function getAccountBalances(req: Request, res: Response) {
  try {
    const { accessToken } = req.query;

    if (!accessToken) {
      return res.status(400).json({ error: 'accessToken is required' });
    }

    const balances = await plaidService.getAccountBalances(accessToken as string);

    res.json(balances);
  } catch (error) {
    logger.error('Balance retrieval failed:', error);
    res.status(500).json({ error: 'Failed to retrieve account balances' });
  }
}

// Sync transactions from Plaid
export async function syncTransactions(req: Request, res: Response) {
  try {
    const { accessToken, companyId, startDate, endDate } = req.body;

    if (!accessToken || !companyId || !startDate || !endDate) {
      return res.status(400).json({ error: 'accessToken, companyId, startDate, and endDate are required' });
    }

    const syncResult = await plaidService.syncTransactions(
      accessToken,
      companyId,
      startDate,
      endDate
    );

    res.json({
      message: 'Transaction sync completed',
      result: syncResult,
    });
  } catch (error) {
    logger.error('Transaction sync failed:', error);
    res.status(500).json({ error: 'Failed to sync transactions' });
  }
}

// Get transactions for a date range
export async function getTransactions(req: Request, res: Response) {
  try {
    const { accessToken, startDate, endDate, accountIds } = req.query;

    if (!accessToken || !startDate || !endDate) {
      return res.status(400).json({ error: 'accessToken, startDate, and endDate are required' });
    }

    const transactions = await plaidService.getTransactions(
      accessToken as string,
      startDate as string,
      endDate as string,
      accountIds ? (accountIds as string).split(',') : undefined
    );

    res.json(transactions);
  } catch (error) {
    logger.error('Transaction retrieval failed:', error);
    res.status(500).json({ error: 'Failed to retrieve transactions' });
  }
}

// Handle Plaid webhooks
export async function handlePlaidWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers['plaid-signature'] as string;
    const body = req.body;

    if (!signature) {
      return res.status(400).json({ error: 'Missing plaid-signature header' });
    }

    await plaidService.handleWebhook(body, signature);

    res.json({ received: true });
  } catch (error) {
    logger.error('Plaid webhook processing failed:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// Get supported institutions
export async function getInstitutions(req: Request, res: Response) {
  try {
    const { countryCode = 'US', count = 10 } = req.query;

    const institutions = await plaidService.getInstitutions(
      countryCode as any,
      parseInt(count as string)
    );

    res.json(institutions);
  } catch (error) {
    logger.error('Institution retrieval failed:', error);
    res.status(500).json({ error: 'Failed to retrieve institutions' });
  }
}

// Health check for Plaid integration
export async function plaidHealthCheck(req: Request, res: Response) {
  try {
    const health = await plaidService.healthCheck();

    if (health.status === 'healthy') {
      res.json({ status: 'healthy', message: 'Plaid integration is working correctly' });
    } else {
      res.status(503).json({ status: 'unhealthy', error: health.error });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', error: 'Health check failed' });
  }
}
