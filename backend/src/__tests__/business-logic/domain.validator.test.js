"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var domain_validator_1 = require("../../business-logic/validators/domain.validator");
describe('Domain Validator', function () {
    describe('validateAmount', function () {
        it('should validate a valid amount', function () {
            var validation = domain_validator_1.DomainValidator.validateAmount({
                amount: 100.50,
                currency: 'USD',
                precision: 2
            });
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });
        it('should reject negative amounts', function () {
            var validation = domain_validator_1.DomainValidator.validateAmount({
                amount: -100,
                currency: 'USD',
                precision: 2
            });
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContainEqual({
                field: 'amount',
                code: 'NEGATIVE_AMOUNT',
                message: 'Amount cannot be negative',
                value: -100
            });
        });
        it('should reject invalid currency codes', function () {
            var validation = domain_validator_1.DomainValidator.validateAmount({
                amount: 100,
                currency: 'INVALID',
                precision: 2
            });
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContainEqual({
                field: 'currency',
                code: 'INVALID_CURRENCY',
                message: 'Currency must be a valid 3-letter code',
                value: 'INVALID'
            });
        });
        it('should reject amounts with too many decimals', function () {
            var validation = domain_validator_1.DomainValidator.validateAmount({
                amount: 100.123,
                currency: 'USD',
                precision: 2
            });
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContainEqual({
                field: 'amount',
                code: 'INVALID_PRECISION',
                message: 'Amount cannot have more than 2 decimal places',
                value: 100.123
            });
        });
        it('should respect minimum amount', function () {
            var validation = domain_validator_1.DomainValidator.validateAmount({
                amount: 5,
                currency: 'USD',
                precision: 2,
                minAmount: 10
            });
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContainEqual({
                field: 'amount',
                code: 'BELOW_MINIMUM',
                message: 'Amount must be at least 10',
                value: 5
            });
        });
        it('should respect maximum amount', function () {
            var validation = domain_validator_1.DomainValidator.validateAmount({
                amount: 15000,
                currency: 'USD',
                precision: 2,
                maxAmount: 10000
            });
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContainEqual({
                field: 'amount',
                code: 'ABOVE_MAXIMUM',
                message: 'Amount cannot exceed 10000',
                value: 15000
            });
        });
    });
    describe('validateTransaction', function () {
        it('should validate a valid transaction', function () {
            var validation = domain_validator_1.DomainValidator.validateTransaction({
                fromAccountId: 'acc1',
                toAccountId: 'acc2',
                amount: 100,
                currency: 'USD',
                description: 'Test transfer',
                reference: 'REF123'
            });
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });
        it('should reject same account transfer', function () {
            var validation = domain_validator_1.DomainValidator.validateTransaction({
                fromAccountId: 'acc1',
                toAccountId: 'acc1',
                amount: 100,
                currency: 'USD'
            });
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContainEqual({
                field: 'toAccountId',
                code: 'SAME_ACCOUNT_TRANSFER',
                message: 'Cannot transfer to the same account',
                value: 'acc1'
            });
        });
        it('should reject invalid account IDs', function () {
            var validation = domain_validator_1.DomainValidator.validateTransaction({
                fromAccountId: '',
                toAccountId: 'acc2',
                amount: 100,
                currency: 'USD'
            });
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContainEqual({
                field: 'fromAccountId',
                code: 'INVALID_ACCOUNT_ID',
                message: 'From account ID is required and must be a string',
                value: ''
            });
        });
        it('should reject too long description', function () {
            var validation = domain_validator_1.DomainValidator.validateTransaction({
                fromAccountId: 'acc1',
                toAccountId: 'acc2',
                amount: 100,
                currency: 'USD',
                description: 'a'.repeat(501)
            });
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContainEqual({
                field: 'description',
                code: 'DESCRIPTION_TOO_LONG',
                message: 'Description cannot exceed 500 characters',
                value: 501
            });
        });
        it('should reject invalid reference format', function () {
            var validation = domain_validator_1.DomainValidator.validateTransaction({
                fromAccountId: 'acc1',
                toAccountId: 'acc2',
                amount: 100,
                currency: 'USD',
                reference: 'Invalid Ref!'
            });
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContainEqual({
                field: 'reference',
                code: 'INVALID_REFERENCE_FORMAT',
                message: 'Reference must be alphanumeric (1-50 characters)',
                value: 'Invalid Ref!'
            });
        });
    });
    describe('validateBalance', function () {
        it('should allow sufficient balance', function () {
            var validation = domain_validator_1.DomainValidator.validateBalance(1000, 500, 'CHECKING');
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });
        it('should reject insufficient funds', function () {
            var validation = domain_validator_1.DomainValidator.validateBalance(100, 500, 'CHECKING');
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContainEqual({
                field: 'balance',
                code: 'INSUFFICIENT_FUNDS',
                message: 'Insufficient funds. Current: 100, Required: 500',
                value: { currentBalance: 100, transactionAmount: 500, newBalance: -400 }
            });
        });
        it('should reject negative savings balance', function () {
            var validation = domain_validator_1.DomainValidator.validateBalance(100, 200, 'SAVINGS');
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContainEqual({
                field: 'balance',
                code: 'SAVINGS_NEGATIVE_BALANCE',
                message: 'Savings accounts cannot have negative balance',
                value: -100
            });
        });
        it('should allow overdraft within limit', function () {
            var validation = domain_validator_1.DomainValidator.validateBalance(100, 500, 'CHECKING', true);
            expect(validation.isValid).toBe(true);
        });
        it('should reject overdraft beyond limit', function () {
            var validation = domain_validator_1.DomainValidator.validateBalance(100, 15000, 'CHECKING', true);
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContainEqual({
                field: 'balance',
                code: 'OVERDRAFT_LIMIT_EXCEEDED',
                message: 'Overdraft limit exceeded',
                value: { newBalance: -14900, limit: -10000 }
            });
        });
    });
    describe('validateCrossCurrencyTransaction', function () {
        it('should allow same currency without exchange rate', function () {
            var validation = domain_validator_1.DomainValidator.validateCrossCurrencyTransaction('USD', 'USD', 100);
            expect(validation.isValid).toBe(true);
        });
        it('should require exchange rate for different currencies', function () {
            var validation = domain_validator_1.DomainValidator.validateCrossCurrencyTransaction('USD', 'EUR', 100);
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContainEqual({
                field: 'exchangeRate',
                code: 'INVALID_EXCHANGE_RATE',
                message: 'Exchange rate is required and must be positive',
                value: undefined
            });
        });
        it('should reject negative exchange rate', function () {
            var validation = domain_validator_1.DomainValidator.validateCrossCurrencyTransaction('USD', 'EUR', 100, -0.5);
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContainEqual({
                field: 'exchangeRate',
                code: 'INVALID_EXCHANGE_RATE',
                message: 'Exchange rate is required and must be positive',
                value: -0.5
            });
        });
        it('should reject unreasonable exchange rate', function () {
            var validation = domain_validator_1.DomainValidator.validateCrossCurrencyTransaction('USD', 'EUR', 100, 50000);
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContainEqual({
                field: 'exchangeRate',
                code: 'UNREASONABLE_EXCHANGE_RATE',
                message: 'Exchange rate seems unreasonable',
                value: 50000
            });
        });
    });
    describe('validateTransactionTiming', function () {
        it('should allow normal timing', function () {
            var lastTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
            var validation = domain_validator_1.DomainValidator.validateTransactionTiming(lastTime, 100);
            expect(validation.isValid).toBe(true);
        });
        it('should reject too frequent high-value transactions', function () {
            var lastTime = new Date(Date.now() - 30 * 1000); // 30 seconds ago
            var validation = domain_validator_1.DomainValidator.validateTransactionTiming(lastTime, 2000);
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContainEqual({
                field: 'timing',
                code: 'TOO_FREQUENT_HIGH_VALUE',
                message: 'High-value transactions require at least 1 minute between them',
                value: { minutesSinceLastTransaction: expect.any(Number), amount: 2000 }
            });
        });
        it('should reject very frequent transactions', function () {
            var lastTime = new Date(Date.now() - 2 * 1000); // 2 seconds ago
            var validation = domain_validator_1.DomainValidator.validateTransactionTiming(lastTime, 100);
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContainEqual({
                field: 'timing',
                code: 'TOO_FREQUENT',
                message: 'Transactions must be at least 6 seconds apart',
                value: expect.any(Number)
            });
        });
    });
    describe('validateOrThrow', function () {
        it('should throw error for invalid validation', function () {
            var invalidValidation = {
                isValid: false,
                errors: [{
                        field: 'amount',
                        code: 'NEGATIVE_AMOUNT',
                        message: 'Amount cannot be negative',
                        value: -100
                    }]
            };
            expect(function () { return domain_validator_1.DomainValidator.validateOrThrow(invalidValidation); }).toThrow();
        });
        it('should not throw for valid validation', function () {
            var validValidation = {
                isValid: true,
                errors: []
            };
            expect(function () { return domain_validator_1.DomainValidator.validateOrThrow(validValidation); }).not.toThrow();
        });
    });
    describe('ValidationRules', function () {
        it('should validate standard transaction', function () {
            expect(function () { return domain_validator_1.ValidationRules.standardTransaction({
                fromAccountId: 'acc1',
                toAccountId: 'acc2',
                amount: 100,
                currency: 'USD'
            }); }).not.toThrow();
        });
        it('should throw for invalid standard transaction', function () {
            expect(function () { return domain_validator_1.ValidationRules.standardTransaction({
                fromAccountId: 'acc1',
                toAccountId: 'acc1',
                amount: -100,
                currency: 'INVALID'
            }); }).toThrow();
        });
        it('should validate high-value transaction with timing check', function () {
            var lastTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
            expect(function () { return domain_validator_1.ValidationRules.highValueTransaction({
                fromAccountId: 'acc1',
                toAccountId: 'acc2',
                amount: 15000, // High value
                currency: 'USD'
            }, lastTime); }).not.toThrow();
        });
        it('should reject high-value transaction with insufficient timing', function () {
            var lastTime = new Date(Date.now() - 30 * 1000); // 30 seconds ago
            expect(function () { return domain_validator_1.ValidationRules.highValueTransaction({
                fromAccountId: 'acc1',
                toAccountId: 'acc2',
                amount: 15000, // High value
                currency: 'USD'
            }, lastTime); }).toThrow();
        });
        it('should validate international transfer', function () {
            expect(function () { return domain_validator_1.ValidationRules.internationalTransfer('USD', 'EUR', 100, 0.85); }).not.toThrow();
        });
        it('should reject international transfer without exchange rate', function () {
            expect(function () { return domain_validator_1.ValidationRules.internationalTransfer('USD', 'EUR', 100); }).toThrow();
        });
    });
    describe('Currency Precision', function () {
        it('should handle JPY (0 decimal places)', function () {
            var validation = domain_validator_1.DomainValidator.validateAmount({
                amount: 1000,
                currency: 'JPY',
                precision: 0
            });
            expect(validation.isValid).toBe(true);
        });
        it('should reject JPY with decimals', function () {
            var validation = domain_validator_1.DomainValidator.validateAmount({
                amount: 1000.50,
                currency: 'JPY',
                precision: 0
            });
            expect(validation.isValid).toBe(false);
            expect(validation.errors[0].code).toBe('INVALID_PRECISION');
        });
        it('should handle BTC (8 decimal places)', function () {
            var validation = domain_validator_1.DomainValidator.validateAmount({
                amount: 0.12345678,
                currency: 'BTC',
                precision: 8
            });
            expect(validation.isValid).toBe(true);
        });
    });
});
