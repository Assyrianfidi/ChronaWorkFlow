import { 
  BookkeepingRules,
  TransactionTemplates
} from '../../business-logic/rules/bookkeeping.rules';

describe('Bookkeeping Rules', () => {
  describe('validateDoubleEntry', () => {
    it('should validate a balanced transaction', () => {
      const transaction = {
        id: 'txn1',
        entries: [
          {
            id: 'ent1',
            accountId: 'acc1',
            amount: 100,
            debit: true,
            credit: false,
            description: 'Debit entry',
            timestamp: new Date(),
            userId: 'user1',
            transactionId: 'txn1'
          },
          {
            id: 'ent2',
            accountId: 'acc2',
            amount: 100,
            debit: false,
            credit: true,
            description: 'Credit entry',
            timestamp: new Date(),
            userId: 'user1',
            transactionId: 'txn1'
          }
        ],
        description: 'Test transaction',
        timestamp: new Date(),
        userId: 'user1',
        status: 'pending' as const
      };

      expect(() => BookkeepingRules.validateDoubleEntry(transaction)).not.toThrow();
    });

    it('should reject transaction with less than 2 entries', () => {
      const transaction = {
        id: 'txn1',
        entries: [
          {
            id: 'ent1',
            accountId: 'acc1',
            amount: 100,
            debit: true,
            credit: false,
            description: 'Single entry',
            timestamp: new Date(),
            userId: 'user1',
            transactionId: 'txn1'
          }
        ],
        description: 'Invalid transaction',
        timestamp: new Date(),
        userId: 'user1',
        status: 'pending' as const
      };

      expect(() => BookkeepingRules.validateDoubleEntry(transaction))
        .toThrow('Transaction must have at least 2 entries');
    });

    it('should reject entry that is both debit and credit', () => {
      const transaction = {
        id: 'txn1',
        entries: [
          {
            id: 'ent1',
            accountId: 'acc1',
            amount: 100,
            debit: true,
            credit: true, // Both debit and credit - invalid
            description: 'Invalid entry',
            timestamp: new Date(),
            userId: 'user1',
            transactionId: 'txn1'
          },
          {
            id: 'ent2',
            accountId: 'acc2',
            amount: 100,
            debit: false,
            credit: true,
            description: 'Credit entry',
            timestamp: new Date(),
            userId: 'user1',
            transactionId: 'txn1'
          },
          {
            id: 'ent3',
            accountId: 'acc3',
            amount: 100,
            debit: true,
            credit: false,
            description: 'Balancing entry',
            timestamp: new Date(),
            userId: 'user1',
            transactionId: 'txn1'
          }
        ],
        description: 'Invalid transaction',
        timestamp: new Date(),
        userId: 'user1',
        status: 'pending' as const
      };

      expect(() => BookkeepingRules.validateDoubleEntry(transaction))
        .toThrow('Entry cannot be both debit and credit');
    });

    it('should reject unbalanced transaction', () => {
      const transaction = {
        id: 'txn1',
        entries: [
          {
            id: 'ent1',
            accountId: 'acc1',
            amount: 100,
            debit: true,
            credit: false,
            description: 'Debit entry',
            timestamp: new Date(),
            userId: 'user1',
            transactionId: 'txn1'
          },
          {
            id: 'ent2',
            accountId: 'acc2',
            amount: 90, // Different amount
            debit: false,
            credit: true,
            description: 'Credit entry',
            timestamp: new Date(),
            userId: 'user1',
            transactionId: 'txn1'
          }
        ],
        description: 'Unbalanced transaction',
        timestamp: new Date(),
        userId: 'user1',
        status: 'pending' as const
      };

      expect(() => BookkeepingRules.validateDoubleEntry(transaction))
        .toThrow('Transaction is not balanced');
    });

    it('should reject entry that is both debit and credit', () => {
      const transaction = {
        id: 'txn1',
        entries: [
          {
            id: 'ent1',
            accountId: 'acc1',
            amount: 100,
            debit: true,
            credit: true, // Both!
            description: 'Invalid entry',
            timestamp: new Date(),
            userId: 'user1',
            transactionId: 'txn1'
          },
          {
            id: 'ent2',
            accountId: 'acc2',
            amount: 100,
            debit: false,
            credit: true,
            description: 'Credit entry',
            timestamp: new Date(),
            userId: 'user1',
            transactionId: 'txn1'
          }
        ],
        description: 'Invalid transaction',
        timestamp: new Date(),
        userId: 'user1',
        status: 'pending' as const
      };

      expect(() => BookkeepingRules.validateDoubleEntry(transaction))
        .toThrow('Transaction is not balanced. Debits: 100, Credits: 200');
    });

    it('should reject entry that is neither debit nor credit', () => {
      const transaction = {
        id: 'txn1',
        entries: [
          {
            id: 'ent1',
            accountId: 'acc1',
            amount: 100,
            debit: false,
            credit: false, // Neither!
            description: 'Invalid entry',
            timestamp: new Date(),
            userId: 'user1',
            transactionId: 'txn1'
          },
          {
            id: 'ent2',
            accountId: 'acc2',
            amount: 100,
            debit: false,
            credit: true,
            description: 'Credit entry',
            timestamp: new Date(),
            userId: 'user1',
            transactionId: 'txn1'
          }
        ],
        description: 'Invalid transaction',
        timestamp: new Date(),
        userId: 'user1',
        status: 'pending' as const
      };

      expect(() => BookkeepingRules.validateDoubleEntry(transaction))
        .toThrow('Transaction is not balanced. Debits: 0, Credits: 100');
    });

    it('should reject zero or negative amounts', () => {
      const transaction = {
        id: 'txn1',
        entries: [
          {
            id: 'ent1',
            accountId: 'acc1',
            amount: 0, // Zero amount
            debit: true,
            credit: false,
            description: 'Zero amount entry',
            timestamp: new Date(),
            userId: 'user1',
            transactionId: 'txn1'
          },
          {
            id: 'ent2',
            accountId: 'acc2',
            amount: 0,
            debit: false,
            credit: true,
            description: 'Credit entry',
            timestamp: new Date(),
            userId: 'user1',
            transactionId: 'txn1'
          }
        ],
        description: 'Invalid transaction',
        timestamp: new Date(),
        userId: 'user1',
        status: 'pending' as const
      };

      expect(() => BookkeepingRules.validateDoubleEntry(transaction))
        .toThrow('Entry amounts must be positive');
    });
  });

  describe('createTransferTransaction', () => {
    it('should create a valid transfer transaction', () => {
      const transaction = BookkeepingRules.createTransferTransaction(
        'acc1',
        'acc2',
        100,
        'Test transfer',
        'user1',
        'REF123'
      );

      expect(transaction.entries).toHaveLength(2);
      expect(transaction.description).toBe('Test transfer');
      expect(transaction.reference).toBe('REF123');
      expect(transaction.userId).toBe('user1');
      expect(transaction.status).toBe('pending');

      // Check debit entry
      const debitEntry = transaction.entries.find(e => e.debit);
      expect(debitEntry).toBeDefined();
      expect(debitEntry!.accountId).toBe('acc1');
      expect(debitEntry!.amount).toBe(100);
      expect(debitEntry!.debit).toBe(true);
      expect(debitEntry!.credit).toBe(false);

      // Check credit entry
      const creditEntry = transaction.entries.find(e => e.credit);
      expect(creditEntry).toBeDefined();
      expect(creditEntry!.accountId).toBe('acc2');
      expect(creditEntry!.amount).toBe(100);
      expect(creditEntry!.debit).toBe(false);
      expect(creditEntry!.credit).toBe(true);
    });
  });

  describe('createFeeTransaction', () => {
    it('should create a valid fee transaction', () => {
      const transaction = BookkeepingRules.createFeeTransaction(
        'acc1',
        5.50,
        'fee-revenue',
        'Transaction fee',
        'user1'
      );

      expect(transaction.entries).toHaveLength(2);
      expect(transaction.description).toBe('Transaction fee');

      // Check debit entry (account charged)
      const debitEntry = transaction.entries.find(e => e.debit);
      expect(debitEntry!.accountId).toBe('acc1');
      expect(debitEntry!.amount).toBe(5.50);

      // Check credit entry (revenue account)
      const creditEntry = transaction.entries.find(e => e.credit);
      expect(creditEntry!.accountId).toBe('fee-revenue');
      expect(creditEntry!.amount).toBe(5.50);
    });
  });

  describe('createInterestTransaction', () => {
    it('should create a valid interest transaction', () => {
      const transaction = BookkeepingRules.createInterestTransaction(
        'acc1',
        10.00,
        'interest-payable',
        'Interest earned',
        'user1'
      );

      expect(transaction.entries).toHaveLength(2);
      expect(transaction.description).toBe('Interest earned');

      // Check debit entry (interest expense)
      const debitEntry = transaction.entries.find(e => e.debit);
      expect(debitEntry!.accountId).toBe('interest-payable');
      expect(debitEntry!.amount).toBe(10.00);

      // Check credit entry (account receiving interest)
      const creditEntry = transaction.entries.find(e => e.credit);
      expect(creditEntry!.accountId).toBe('acc1');
      expect(creditEntry!.amount).toBe(10.00);
    });
  });

  describe('calculateBalance', () => {
    it('should calculate account balance correctly', () => {
      const entries = [
        {
          id: 'ent1',
          accountId: 'acc1',
          amount: 100,
          debit: true,
          credit: false,
          description: 'Debit',
          timestamp: new Date(),
          userId: 'user1',
          transactionId: 'txn1'
        },
        {
          id: 'ent2',
          accountId: 'acc1',
          amount: 50,
          debit: false,
          credit: true,
          description: 'Credit',
          timestamp: new Date(),
          userId: 'user1',
          transactionId: 'txn2'
        },
        {
          id: 'ent3',
          accountId: 'acc2',
          amount: 25,
          debit: true,
          credit: false,
          description: 'Other account',
          timestamp: new Date(),
          userId: 'user1',
          transactionId: 'txn3'
        }
      ];

      const balance = BookkeepingRules.calculateBalance(entries, 'acc1');
      
      expect(balance.accountId).toBe('acc1');
      expect(balance.debitBalance).toBe(100);
      expect(balance.creditBalance).toBe(50);
      expect(balance.netBalance).toBe(50); // 100 - 50
    });

    it('should handle account with no entries', () => {
      const entries = [];
      const balance = BookkeepingRules.calculateBalance(entries, 'acc1');
      
      expect(balance.debitBalance).toBe(0);
      expect(balance.creditBalance).toBe(0);
      expect(balance.netBalance).toBe(0);
    });
  });

  describe('validateAccountConstraints', () => {
    it('should allow valid transaction', () => {
      const transaction = {
        id: 'txn1',
        entries: [
          {
            id: 'ent1',
            accountId: 'acc1',
            amount: 100,
            debit: true,
            credit: false,
            description: 'Debit',
            timestamp: new Date(),
            userId: 'user1',
            transactionId: 'txn1'
          },
          {
            id: 'ent2',
            accountId: 'acc2',
            amount: 100,
            debit: false,
            credit: true,
            description: 'Credit',
            timestamp: new Date(),
            userId: 'user1',
            transactionId: 'txn1'
          }
        ],
        description: 'Test',
        timestamp: new Date(),
        userId: 'user1',
        status: 'pending' as const
      };

      const accountBalances = new Map([
        ['acc1', { accountId: 'acc1', debitBalance: 1000, creditBalance: 0, netBalance: 1000, lastUpdated: new Date() }],
        ['acc2', { accountId: 'acc2', debitBalance: 0, creditBalance: 500, netBalance: -500, lastUpdated: new Date() }]
      ]);

      const accountTypes = new Map([
        ['acc1', 'CHECKING'],
        ['acc2', 'SAVINGS']
      ]);

      expect(() => BookkeepingRules.validateAccountConstraints(transaction, accountBalances, accountTypes))
        .not.toThrow();
    });

    it('should reject insufficient funds in checking account', () => {
      const transaction = {
        id: 'txn1',
        entries: [
          {
            id: 'ent1',
            accountId: 'acc1',
            amount: 15000, // Large debit
            debit: true,
            credit: false,
            description: 'Debit',
            timestamp: new Date(),
            userId: 'user1',
            transactionId: 'txn1'
          },
          {
            id: 'ent2',
            accountId: 'acc2',
            amount: 15000,
            debit: false,
            credit: true,
            description: 'Credit',
            timestamp: new Date(),
            userId: 'user1',
            transactionId: 'txn1'
          }
        ],
        description: 'Test',
        timestamp: new Date(),
        userId: 'user1',
        status: 'pending' as const
      };

      const accountBalances = new Map([
        ['acc1', { accountId: 'acc1', debitBalance: 1000, creditBalance: 0, netBalance: 1000, lastUpdated: new Date() }],
        ['acc2', { accountId: 'acc2', debitBalance: 0, creditBalance: 0, netBalance: 0, lastUpdated: new Date() }]
      ]);

      const accountTypes = new Map([
        ['acc1', 'CHECKING'],
        ['acc2', 'CHECKING']
      ]);

      expect(() => BookkeepingRules.validateAccountConstraints(transaction, accountBalances, accountTypes))
        .toThrow('Overdraft limit exceeded for account acc1');
    });

    it('should reject negative balance in savings account', () => {
      const transaction = {
        id: 'txn1',
        entries: [
          {
            id: 'ent1',
            accountId: 'acc1',
            amount: 1500,
            debit: true,
            credit: false,
            description: 'Debit',
            timestamp: new Date(),
            userId: 'user1',
            transactionId: 'txn1'
          },
          {
            id: 'ent2',
            accountId: 'acc2',
            amount: 1500,
            debit: false,
            credit: true,
            description: 'Credit',
            timestamp: new Date(),
            userId: 'user1',
            transactionId: 'txn1'
          }
        ],
        description: 'Test',
        timestamp: new Date(),
        userId: 'user1',
        status: 'pending' as const
      };

      const accountBalances = new Map([
        ['acc1', { accountId: 'acc1', debitBalance: 1000, creditBalance: 0, netBalance: 1000, lastUpdated: new Date() }],
        ['acc2', { accountId: 'acc2', debitBalance: 0, creditBalance: 0, netBalance: 0, lastUpdated: new Date() }]
      ]);

      const accountTypes = new Map([
        ['acc1', 'SAVINGS'],
        ['acc2', 'SAVINGS']
      ]);

      expect(() => BookkeepingRules.validateAccountConstraints(transaction, accountBalances, accountTypes))
        .toThrow('Insufficient funds in savings account acc1');
    });
  });

  describe('reverseTransaction', () => {
    it('should create reversing transaction', () => {
      const originalTransaction = {
        id: 'txn1',
        entries: [
          {
            id: 'ent1',
            accountId: 'acc1',
            amount: 100,
            debit: true,
            credit: false,
            description: 'Original debit',
            timestamp: new Date(),
            userId: 'user1',
            transactionId: 'txn1'
          },
          {
            id: 'ent2',
            accountId: 'acc2',
            amount: 100,
            debit: false,
            credit: true,
            description: 'Original credit',
            timestamp: new Date(),
            userId: 'user1',
            transactionId: 'txn1'
          }
        ],
        description: 'Original transaction',
        timestamp: new Date(),
        userId: 'user1',
        status: 'pending' as const
      };

      const reversal = BookkeepingRules.reverseTransaction(
        originalTransaction,
        'Customer request',
        'user1'
      );

      expect(reversal.description).toContain('Reversal of txn1');
      expect(reversal.reference).toBe('txn1');
      expect(reversal.metadata?.originalTransactionId).toBe('txn1');
      expect(reversal.metadata?.reversalReason).toBe('Customer request');

      // Check that debits and credits are swapped
      const originalDebit = originalTransaction.entries.find(e => e.debit)!;
      const reversalDebit = reversal.entries.find(e => e.debit && e.accountId === originalDebit.accountId);
      expect(reversalDebit).toBeUndefined(); // Should be credit now

      const reversalCredit = reversal.entries.find(e => e.credit && e.accountId === originalDebit.accountId);
      expect(reversalCredit).toBeDefined();
      expect(reversalCredit!.amount).toBe(originalDebit.amount);
    });
  });

  describe('validateTrialBalance', () => {
    it('should validate balanced trial balance', () => {
      const accountBalances = [
        { accountId: 'acc1', debitBalance: 100, creditBalance: 0, netBalance: 100, lastUpdated: new Date() },
        { accountId: 'acc2', debitBalance: 0, creditBalance: 100, netBalance: -100, lastUpdated: new Date() }
      ];

      expect(() => BookkeepingRules.validateTrialBalance(accountBalances)).not.toThrow();
    });

    it('should reject unbalanced trial balance', () => {
      const accountBalances = [
        { accountId: 'acc1', debitBalance: 100, creditBalance: 0, netBalance: 100, lastUpdated: new Date() },
        { accountId: 'acc2', debitBalance: 0, creditBalance: 90, netBalance: -90, lastUpdated: new Date() }
      ];

      expect(() => BookkeepingRules.validateTrialBalance(accountBalances))
        .toThrow('Trial balance is not balanced');
    });
  });

  describe('createAdjustingEntry', () => {
    it('should create adjusting entry with clearing account', () => {
      const transaction = BookkeepingRules.createAdjustingEntry(
        'acc1',
        100,
        true,
        'Adjustment for depreciation',
        'user1'
      );

      expect(transaction.entries).toHaveLength(2);
      expect(transaction.description).toBe('Adjusting entry: Adjustment for depreciation');
      expect(transaction.metadata?.isAdjustingEntry).toBe(true);

      // Check main entry
      const mainEntry = transaction.entries.find(e => e.accountId === 'acc1');
      expect(mainEntry!.debit).toBe(true);
      expect(mainEntry!.credit).toBe(false);

      // Check clearing entry
      const clearingEntry = transaction.entries.find(e => e.accountId === 'ADJUSTMENT_CLEARING');
      expect(clearingEntry!.debit).toBe(false);
      expect(clearingEntry!.credit).toBe(true);
    });
  });
});

describe('TransactionTemplates', () => {
  describe('bankTransfer', () => {
    it('should create bank transfer transaction', () => {
      const txn = TransactionTemplates.bankTransfer(
        'acc1',
        'acc2',
        100,
        'user1',
        'REF123'
      );

      expect(txn.description).toBe('Bank Transfer');
      expect(txn.reference).toBe('REF123');
      expect(txn.entries).toHaveLength(2);
    });
  });

  describe('atmWithdrawal', () => {
    it('should create ATM withdrawal with fee', () => {
      const result = TransactionTemplates.atmWithdrawal(
        'acc1',
        100,
        2.50,
        'fee-revenue',
        'user1'
      );

      expect(result.transferTxn).toBeDefined();
      expect(result.feeTxn).toBeDefined();
      expect(result.transferTxn.entries).toHaveLength(2);
      expect(result.feeTxn.entries).toHaveLength(2);
    });
  });

  describe('interestBearingDeposit', () => {
    it('should create deposit with interest', () => {
      const result = TransactionTemplates.interestBearingDeposit(
        'acc1',
        1000,
        5.00,
        'interest-payable',
        'user1'
      );

      expect(result.depositTxn).toBeDefined();
      expect(result.interestTxn).toBeDefined();
      expect(result.depositTxn.entries).toHaveLength(2);
      expect(result.interestTxn.entries).toHaveLength(2);
    });
  });
});
