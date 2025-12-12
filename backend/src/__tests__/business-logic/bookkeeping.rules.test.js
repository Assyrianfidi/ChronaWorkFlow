"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bookkeeping_rules_1 = require("../../business-logic/rules/bookkeeping.rules");
describe("Bookkeeping Rules", function () {
  describe("validateDoubleEntry", function () {
    it("should validate a balanced transaction", function () {
      var transaction = {
        id: "txn1",
        entries: [
          {
            id: "ent1",
            accountId: "acc1",
            amount: 100,
            debit: true,
            credit: false,
            description: "Debit entry",
            timestamp: new Date(),
            userId: "user1",
            transactionId: "txn1",
          },
          {
            id: "ent2",
            accountId: "acc2",
            amount: 100,
            debit: false,
            credit: true,
            description: "Credit entry",
            timestamp: new Date(),
            userId: "user1",
            transactionId: "txn1",
          },
        ],
        description: "Test transaction",
        timestamp: new Date(),
        userId: "user1",
        status: "pending",
      };
      expect(function () {
        return bookkeeping_rules_1.BookkeepingRules.validateDoubleEntry(
          transaction,
        );
      }).not.toThrow();
    });
    it("should reject transaction with less than 2 entries", function () {
      var transaction = {
        id: "txn1",
        entries: [
          {
            id: "ent1",
            accountId: "acc1",
            amount: 100,
            debit: true,
            credit: false,
            description: "Single entry",
            timestamp: new Date(),
            userId: "user1",
            transactionId: "txn1",
          },
        ],
        description: "Invalid transaction",
        timestamp: new Date(),
        userId: "user1",
        status: "pending",
      };
      expect(function () {
        return bookkeeping_rules_1.BookkeepingRules.validateDoubleEntry(
          transaction,
        );
      }).toThrow("Transaction must have at least 2 entries");
    });
    it("should reject entry that is both debit and credit", function () {
      var transaction = {
        id: "txn1",
        entries: [
          {
            id: "ent1",
            accountId: "acc1",
            amount: 100,
            debit: true,
            credit: true, // Both debit and credit - invalid
            description: "Invalid entry",
            timestamp: new Date(),
            userId: "user1",
            transactionId: "txn1",
          },
          {
            id: "ent2",
            accountId: "acc2",
            amount: 100,
            debit: false,
            credit: true,
            description: "Credit entry",
            timestamp: new Date(),
            userId: "user1",
            transactionId: "txn1",
          },
          {
            id: "ent3",
            accountId: "acc3",
            amount: 100,
            debit: true,
            credit: false,
            description: "Balancing entry",
            timestamp: new Date(),
            userId: "user1",
            transactionId: "txn1",
          },
        ],
        description: "Invalid transaction",
        timestamp: new Date(),
        userId: "user1",
        status: "pending",
      };
      expect(function () {
        return bookkeeping_rules_1.BookkeepingRules.validateDoubleEntry(
          transaction,
        );
      }).toThrow("Entry cannot be both debit and credit");
    });
    it("should reject unbalanced transaction", function () {
      var transaction = {
        id: "txn1",
        entries: [
          {
            id: "ent1",
            accountId: "acc1",
            amount: 100,
            debit: true,
            credit: false,
            description: "Debit entry",
            timestamp: new Date(),
            userId: "user1",
            transactionId: "txn1",
          },
          {
            id: "ent2",
            accountId: "acc2",
            amount: 90, // Different amount
            debit: false,
            credit: true,
            description: "Credit entry",
            timestamp: new Date(),
            userId: "user1",
            transactionId: "txn1",
          },
        ],
        description: "Unbalanced transaction",
        timestamp: new Date(),
        userId: "user1",
        status: "pending",
      };
      expect(function () {
        return bookkeeping_rules_1.BookkeepingRules.validateDoubleEntry(
          transaction,
        );
      }).toThrow("Transaction is not balanced");
    });
    it("should reject entry that is both debit and credit", function () {
      var transaction = {
        id: "txn1",
        entries: [
          {
            id: "ent1",
            accountId: "acc1",
            amount: 100,
            debit: true,
            credit: true, // Both!
            description: "Invalid entry",
            timestamp: new Date(),
            userId: "user1",
            transactionId: "txn1",
          },
          {
            id: "ent2",
            accountId: "acc2",
            amount: 100,
            debit: false,
            credit: true,
            description: "Credit entry",
            timestamp: new Date(),
            userId: "user1",
            transactionId: "txn1",
          },
        ],
        description: "Invalid transaction",
        timestamp: new Date(),
        userId: "user1",
        status: "pending",
      };
      expect(function () {
        return bookkeeping_rules_1.BookkeepingRules.validateDoubleEntry(
          transaction,
        );
      }).toThrow("Transaction is not balanced. Debits: 100, Credits: 200");
    });
    it("should reject entry that is neither debit nor credit", function () {
      var transaction = {
        id: "txn1",
        entries: [
          {
            id: "ent1",
            accountId: "acc1",
            amount: 100,
            debit: false,
            credit: false, // Neither!
            description: "Invalid entry",
            timestamp: new Date(),
            userId: "user1",
            transactionId: "txn1",
          },
          {
            id: "ent2",
            accountId: "acc2",
            amount: 100,
            debit: false,
            credit: true,
            description: "Credit entry",
            timestamp: new Date(),
            userId: "user1",
            transactionId: "txn1",
          },
        ],
        description: "Invalid transaction",
        timestamp: new Date(),
        userId: "user1",
        status: "pending",
      };
      expect(function () {
        return bookkeeping_rules_1.BookkeepingRules.validateDoubleEntry(
          transaction,
        );
      }).toThrow("Transaction is not balanced. Debits: 0, Credits: 100");
    });
    it("should reject zero or negative amounts", function () {
      var transaction = {
        id: "txn1",
        entries: [
          {
            id: "ent1",
            accountId: "acc1",
            amount: 0, // Zero amount
            debit: true,
            credit: false,
            description: "Zero amount entry",
            timestamp: new Date(),
            userId: "user1",
            transactionId: "txn1",
          },
          {
            id: "ent2",
            accountId: "acc2",
            amount: 0,
            debit: false,
            credit: true,
            description: "Credit entry",
            timestamp: new Date(),
            userId: "user1",
            transactionId: "txn1",
          },
        ],
        description: "Invalid transaction",
        timestamp: new Date(),
        userId: "user1",
        status: "pending",
      };
      expect(function () {
        return bookkeeping_rules_1.BookkeepingRules.validateDoubleEntry(
          transaction,
        );
      }).toThrow("Entry amounts must be positive");
    });
  });
  describe("createTransferTransaction", function () {
    it("should create a valid transfer transaction", function () {
      var transaction =
        bookkeeping_rules_1.BookkeepingRules.createTransferTransaction(
          "acc1",
          "acc2",
          100,
          "Test transfer",
          "user1",
          "REF123",
        );
      expect(transaction.entries).toHaveLength(2);
      expect(transaction.description).toBe("Test transfer");
      expect(transaction.reference).toBe("REF123");
      expect(transaction.userId).toBe("user1");
      expect(transaction.status).toBe("pending");
      // Check debit entry
      var debitEntry = transaction.entries.find(function (e) {
        return e.debit;
      });
      expect(debitEntry).toBeDefined();
      expect(debitEntry.accountId).toBe("acc1");
      expect(debitEntry.amount).toBe(100);
      expect(debitEntry.debit).toBe(true);
      expect(debitEntry.credit).toBe(false);
      // Check credit entry
      var creditEntry = transaction.entries.find(function (e) {
        return e.credit;
      });
      expect(creditEntry).toBeDefined();
      expect(creditEntry.accountId).toBe("acc2");
      expect(creditEntry.amount).toBe(100);
      expect(creditEntry.debit).toBe(false);
      expect(creditEntry.credit).toBe(true);
    });
  });
  describe("createFeeTransaction", function () {
    it("should create a valid fee transaction", function () {
      var transaction =
        bookkeeping_rules_1.BookkeepingRules.createFeeTransaction(
          "acc1",
          5.5,
          "fee-revenue",
          "Transaction fee",
          "user1",
        );
      expect(transaction.entries).toHaveLength(2);
      expect(transaction.description).toBe("Transaction fee");
      // Check debit entry (account charged)
      var debitEntry = transaction.entries.find(function (e) {
        return e.debit;
      });
      expect(debitEntry.accountId).toBe("acc1");
      expect(debitEntry.amount).toBe(5.5);
      // Check credit entry (revenue account)
      var creditEntry = transaction.entries.find(function (e) {
        return e.credit;
      });
      expect(creditEntry.accountId).toBe("fee-revenue");
      expect(creditEntry.amount).toBe(5.5);
    });
  });
  describe("createInterestTransaction", function () {
    it("should create a valid interest transaction", function () {
      var transaction =
        bookkeeping_rules_1.BookkeepingRules.createInterestTransaction(
          "acc1",
          10.0,
          "interest-payable",
          "Interest earned",
          "user1",
        );
      expect(transaction.entries).toHaveLength(2);
      expect(transaction.description).toBe("Interest earned");
      // Check debit entry (interest expense)
      var debitEntry = transaction.entries.find(function (e) {
        return e.debit;
      });
      expect(debitEntry.accountId).toBe("interest-payable");
      expect(debitEntry.amount).toBe(10.0);
      // Check credit entry (account receiving interest)
      var creditEntry = transaction.entries.find(function (e) {
        return e.credit;
      });
      expect(creditEntry.accountId).toBe("acc1");
      expect(creditEntry.amount).toBe(10.0);
    });
  });
  describe("calculateBalance", function () {
    it("should calculate account balance correctly", function () {
      var entries = [
        {
          id: "ent1",
          accountId: "acc1",
          amount: 100,
          debit: true,
          credit: false,
          description: "Debit",
          timestamp: new Date(),
          userId: "user1",
          transactionId: "txn1",
        },
        {
          id: "ent2",
          accountId: "acc1",
          amount: 50,
          debit: false,
          credit: true,
          description: "Credit",
          timestamp: new Date(),
          userId: "user1",
          transactionId: "txn2",
        },
        {
          id: "ent3",
          accountId: "acc2",
          amount: 25,
          debit: true,
          credit: false,
          description: "Other account",
          timestamp: new Date(),
          userId: "user1",
          transactionId: "txn3",
        },
      ];
      var balance = bookkeeping_rules_1.BookkeepingRules.calculateBalance(
        entries,
        "acc1",
      );
      expect(balance.accountId).toBe("acc1");
      expect(balance.debitBalance).toBe(100);
      expect(balance.creditBalance).toBe(50);
      expect(balance.netBalance).toBe(50); // 100 - 50
    });
    it("should handle account with no entries", function () {
      var entries = [];
      var balance = bookkeeping_rules_1.BookkeepingRules.calculateBalance(
        entries,
        "acc1",
      );
      expect(balance.debitBalance).toBe(0);
      expect(balance.creditBalance).toBe(0);
      expect(balance.netBalance).toBe(0);
    });
  });
  describe("validateAccountConstraints", function () {
    it("should allow valid transaction", function () {
      var transaction = {
        id: "txn1",
        entries: [
          {
            id: "ent1",
            accountId: "acc1",
            amount: 100,
            debit: true,
            credit: false,
            description: "Debit",
            timestamp: new Date(),
            userId: "user1",
            transactionId: "txn1",
          },
          {
            id: "ent2",
            accountId: "acc2",
            amount: 100,
            debit: false,
            credit: true,
            description: "Credit",
            timestamp: new Date(),
            userId: "user1",
            transactionId: "txn1",
          },
        ],
        description: "Test",
        timestamp: new Date(),
        userId: "user1",
        status: "pending",
      };
      var accountBalances = new Map([
        [
          "acc1",
          {
            accountId: "acc1",
            debitBalance: 1000,
            creditBalance: 0,
            netBalance: 1000,
            lastUpdated: new Date(),
          },
        ],
        [
          "acc2",
          {
            accountId: "acc2",
            debitBalance: 0,
            creditBalance: 500,
            netBalance: -500,
            lastUpdated: new Date(),
          },
        ],
      ]);
      var accountTypes = new Map([
        ["acc1", "CHECKING"],
        ["acc2", "SAVINGS"],
      ]);
      expect(function () {
        return bookkeeping_rules_1.BookkeepingRules.validateAccountConstraints(
          transaction,
          accountBalances,
          accountTypes,
        );
      }).not.toThrow();
    });
    it("should reject insufficient funds in checking account", function () {
      var transaction = {
        id: "txn1",
        entries: [
          {
            id: "ent1",
            accountId: "acc1",
            amount: 15000, // Large debit
            debit: true,
            credit: false,
            description: "Debit",
            timestamp: new Date(),
            userId: "user1",
            transactionId: "txn1",
          },
          {
            id: "ent2",
            accountId: "acc2",
            amount: 15000,
            debit: false,
            credit: true,
            description: "Credit",
            timestamp: new Date(),
            userId: "user1",
            transactionId: "txn1",
          },
        ],
        description: "Test",
        timestamp: new Date(),
        userId: "user1",
        status: "pending",
      };
      var accountBalances = new Map([
        [
          "acc1",
          {
            accountId: "acc1",
            debitBalance: 1000,
            creditBalance: 0,
            netBalance: 1000,
            lastUpdated: new Date(),
          },
        ],
        [
          "acc2",
          {
            accountId: "acc2",
            debitBalance: 0,
            creditBalance: 0,
            netBalance: 0,
            lastUpdated: new Date(),
          },
        ],
      ]);
      var accountTypes = new Map([
        ["acc1", "CHECKING"],
        ["acc2", "CHECKING"],
      ]);
      expect(function () {
        return bookkeeping_rules_1.BookkeepingRules.validateAccountConstraints(
          transaction,
          accountBalances,
          accountTypes,
        );
      }).toThrow("Overdraft limit exceeded for account acc1");
    });
    it("should reject negative balance in savings account", function () {
      var transaction = {
        id: "txn1",
        entries: [
          {
            id: "ent1",
            accountId: "acc1",
            amount: 1500,
            debit: true,
            credit: false,
            description: "Debit",
            timestamp: new Date(),
            userId: "user1",
            transactionId: "txn1",
          },
          {
            id: "ent2",
            accountId: "acc2",
            amount: 1500,
            debit: false,
            credit: true,
            description: "Credit",
            timestamp: new Date(),
            userId: "user1",
            transactionId: "txn1",
          },
        ],
        description: "Test",
        timestamp: new Date(),
        userId: "user1",
        status: "pending",
      };
      var accountBalances = new Map([
        [
          "acc1",
          {
            accountId: "acc1",
            debitBalance: 1000,
            creditBalance: 0,
            netBalance: 1000,
            lastUpdated: new Date(),
          },
        ],
        [
          "acc2",
          {
            accountId: "acc2",
            debitBalance: 0,
            creditBalance: 0,
            netBalance: 0,
            lastUpdated: new Date(),
          },
        ],
      ]);
      var accountTypes = new Map([
        ["acc1", "SAVINGS"],
        ["acc2", "SAVINGS"],
      ]);
      expect(function () {
        return bookkeeping_rules_1.BookkeepingRules.validateAccountConstraints(
          transaction,
          accountBalances,
          accountTypes,
        );
      }).toThrow("Insufficient funds in savings account acc1");
    });
  });
  describe("reverseTransaction", function () {
    it("should create reversing transaction", function () {
      var _a, _b;
      var originalTransaction = {
        id: "txn1",
        entries: [
          {
            id: "ent1",
            accountId: "acc1",
            amount: 100,
            debit: true,
            credit: false,
            description: "Original debit",
            timestamp: new Date(),
            userId: "user1",
            transactionId: "txn1",
          },
          {
            id: "ent2",
            accountId: "acc2",
            amount: 100,
            debit: false,
            credit: true,
            description: "Original credit",
            timestamp: new Date(),
            userId: "user1",
            transactionId: "txn1",
          },
        ],
        description: "Original transaction",
        timestamp: new Date(),
        userId: "user1",
        status: "pending",
      };
      var reversal = bookkeeping_rules_1.BookkeepingRules.reverseTransaction(
        originalTransaction,
        "Customer request",
        "user1",
      );
      expect(reversal.description).toContain("Reversal of txn1");
      expect(reversal.reference).toBe("txn1");
      expect(
        (_a = reversal.metadata) === null || _a === void 0
          ? void 0
          : _a.originalTransactionId,
      ).toBe("txn1");
      expect(
        (_b = reversal.metadata) === null || _b === void 0
          ? void 0
          : _b.reversalReason,
      ).toBe("Customer request");
      // Check that debits and credits are swapped
      var originalDebit = originalTransaction.entries.find(function (e) {
        return e.debit;
      });
      var reversalDebit = reversal.entries.find(function (e) {
        return e.debit && e.accountId === originalDebit.accountId;
      });
      expect(reversalDebit).toBeUndefined(); // Should be credit now
      var reversalCredit = reversal.entries.find(function (e) {
        return e.credit && e.accountId === originalDebit.accountId;
      });
      expect(reversalCredit).toBeDefined();
      expect(reversalCredit.amount).toBe(originalDebit.amount);
    });
  });
  describe("validateTrialBalance", function () {
    it("should validate balanced trial balance", function () {
      var accountBalances = [
        {
          accountId: "acc1",
          debitBalance: 100,
          creditBalance: 0,
          netBalance: 100,
          lastUpdated: new Date(),
        },
        {
          accountId: "acc2",
          debitBalance: 0,
          creditBalance: 100,
          netBalance: -100,
          lastUpdated: new Date(),
        },
      ];
      expect(function () {
        return bookkeeping_rules_1.BookkeepingRules.validateTrialBalance(
          accountBalances,
        );
      }).not.toThrow();
    });
    it("should reject unbalanced trial balance", function () {
      var accountBalances = [
        {
          accountId: "acc1",
          debitBalance: 100,
          creditBalance: 0,
          netBalance: 100,
          lastUpdated: new Date(),
        },
        {
          accountId: "acc2",
          debitBalance: 0,
          creditBalance: 90,
          netBalance: -90,
          lastUpdated: new Date(),
        },
      ];
      expect(function () {
        return bookkeeping_rules_1.BookkeepingRules.validateTrialBalance(
          accountBalances,
        );
      }).toThrow("Trial balance is not balanced");
    });
  });
  describe("createAdjustingEntry", function () {
    it("should create adjusting entry with clearing account", function () {
      var _a;
      var transaction =
        bookkeeping_rules_1.BookkeepingRules.createAdjustingEntry(
          "acc1",
          100,
          true,
          "Adjustment for depreciation",
          "user1",
        );
      expect(transaction.entries).toHaveLength(2);
      expect(transaction.description).toBe(
        "Adjusting entry: Adjustment for depreciation",
      );
      expect(
        (_a = transaction.metadata) === null || _a === void 0
          ? void 0
          : _a.isAdjustingEntry,
      ).toBe(true);
      // Check main entry
      var mainEntry = transaction.entries.find(function (e) {
        return e.accountId === "acc1";
      });
      expect(mainEntry.debit).toBe(true);
      expect(mainEntry.credit).toBe(false);
      // Check clearing entry
      var clearingEntry = transaction.entries.find(function (e) {
        return e.accountId === "ADJUSTMENT_CLEARING";
      });
      expect(clearingEntry.debit).toBe(false);
      expect(clearingEntry.credit).toBe(true);
    });
  });
});
describe("TransactionTemplates", function () {
  describe("bankTransfer", function () {
    it("should create bank transfer transaction", function () {
      var txn = bookkeeping_rules_1.TransactionTemplates.bankTransfer(
        "acc1",
        "acc2",
        100,
        "user1",
        "REF123",
      );
      expect(txn.description).toBe("Bank Transfer");
      expect(txn.reference).toBe("REF123");
      expect(txn.entries).toHaveLength(2);
    });
  });
  describe("atmWithdrawal", function () {
    it("should create ATM withdrawal with fee", function () {
      var result = bookkeeping_rules_1.TransactionTemplates.atmWithdrawal(
        "acc1",
        100,
        2.5,
        "fee-revenue",
        "user1",
      );
      expect(result.transferTxn).toBeDefined();
      expect(result.feeTxn).toBeDefined();
      expect(result.transferTxn.entries).toHaveLength(2);
      expect(result.feeTxn.entries).toHaveLength(2);
    });
  });
  describe("interestBearingDeposit", function () {
    it("should create deposit with interest", function () {
      var result =
        bookkeeping_rules_1.TransactionTemplates.interestBearingDeposit(
          "acc1",
          1000,
          5.0,
          "interest-payable",
          "user1",
        );
      expect(result.depositTxn).toBeDefined();
      expect(result.interestTxn).toBeDefined();
      expect(result.depositTxn.entries).toHaveLength(2);
      expect(result.interestTxn.entries).toHaveLength(2);
    });
  });
});
