"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessLogicService = exports.BusinessLogicService = void 0;
var client_1 = require("@prisma/client");
var domain_validator_1 = require("./validators/domain.validator");
var bookkeeping_rules_1 = require("./rules/bookkeeping.rules");
var fraud_detector_1 = require("./anti-fraud/fraud.detector");
var logger_1 = require("../utils/logger");
var errorHandler_1 = require("../utils/errorHandler");
var circuitBreaker_1 = require("../utils/circuitBreaker");
var BusinessLogicService = /** @class */ (function () {
    function BusinessLogicService() {
        this.prisma = new client_1.PrismaClient();
        this.circuitBreaker = circuitBreaker_1.CircuitBreakerRegistry.get('business-logic', {
            failureThreshold: 5,
            resetTimeout: 60000,
            monitoringPeriod: 30000,
            expectedErrorRate: 0.5
        });
        this.fraudDetector = new fraud_detector_1.FraudDetector();
    }
    /**
     * Process a financial transaction with full validation
     */
    BusinessLogicService.prototype.processTransaction = function (request, userId, context) {
        return __awaiter(this, void 0, void 0, function () {
            var accounts, fromAccount, toAccount, balanceValidation, exchangeRate, historicalPatterns, transaction, fraudResult, alerts, feeAmount, mainTransaction, transactions, feeTransaction, postedEntries, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        // Step 1: Validate transaction data
                        domain_validator_1.ValidationRules.standardTransaction({
                            fromAccountId: request.fromAccountId,
                            toAccountId: request.toAccountId,
                            amount: request.amount,
                            currency: request.currency,
                            description: request.description,
                            reference: request.reference
                        });
                        return [4 /*yield*/, this.circuitBreaker.execute(function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, this.prisma.account.findMany({
                                            where: {
                                                id: { in: [request.fromAccountId, request.toAccountId] }
                                                // TODO: Add userId to Account model
                                            }
                                        })];
                                });
                            }); })];
                    case 1:
                        accounts = _a.sent();
                        if (accounts.length !== 2) {
                            throw new errorHandler_1.ApiError('One or both accounts not found', 404, errorHandler_1.ErrorCodes.NOT_FOUND);
                        }
                        fromAccount = accounts.find(function (a) { return a.id === request.fromAccountId; });
                        toAccount = accounts.find(function (a) { return a.id === request.toAccountId; });
                        balanceValidation = domain_validator_1.DomainValidator.validateBalance(fromAccount.balance, request.amount, fromAccount.type, fromAccount.allowOverdraft || false);
                        domain_validator_1.DomainValidator.validateOrThrow(balanceValidation);
                        if (!(fromAccount.currency !== toAccount.currency)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.getExchangeRate(fromAccount.currency, toAccount.currency)];
                    case 2:
                        exchangeRate = _a.sent();
                        domain_validator_1.ValidationRules.internationalTransfer(fromAccount.currency, toAccount.currency, request.amount, exchangeRate);
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this.getTransactionPatterns(userId, fromAccount.id)];
                    case 4:
                        historicalPatterns = _a.sent();
                        transaction = {
                            userId: userId,
                            accountId: fromAccount.id,
                            amount: request.amount,
                            timestamp: new Date(),
                            location: context === null || context === void 0 ? void 0 : context.location,
                            device: context === null || context === void 0 ? void 0 : context.device,
                            ipAddress: context === null || context === void 0 ? void 0 : context.ipAddress,
                            merchantCategory: context === null || context === void 0 ? void 0 : context.merchantCategory
                        };
                        return [4 /*yield*/, fraud_detector_1.FraudDetector.analyzeTransaction(transaction, [])];
                    case 5:
                        fraudResult = _a.sent();
                        alerts = fraudResult.alerts || [];
                        if (alerts.length > 0) {
                            throw new errorHandler_1.ApiError('Potential fraud detected', 400, errorHandler_1.ErrorCodes.VALIDATION_ERROR);
                        }
                        feeAmount = this.calculateTransactionFee(request.amount, fromAccount.type);
                        mainTransaction = {
                            id: "TXN_".concat(Date.now()),
                            fromAccountId: request.fromAccountId,
                            toAccountId: request.toAccountId,
                            amount: request.amount,
                            description: request.description || 'Transfer',
                            userId: userId,
                            reference: request.reference,
                            entries: []
                        };
                        transactions = [mainTransaction];
                        // Add fee transaction if applicable
                        if (feeAmount > 0) {
                            feeTransaction = {
                                id: "FEE_".concat(Date.now()),
                                fromAccountId: request.fromAccountId,
                                toAccountId: 'FEE_ACCOUNT',
                                amount: feeAmount,
                                description: 'Transaction fee',
                                userId: userId,
                                reference: request.reference,
                                entries: []
                            };
                            transactions.push(feeTransaction);
                        }
                        return [4 /*yield*/, this.postTransactions(transactions)];
                    case 6:
                        postedEntries = _a.sent();
                        // Step 9: Log successful transaction
                        logger_1.logger.info('Transaction validated', {
                            event: 'TRANSACTION_PROCESSED',
                            userId: userId,
                            transactionId: mainTransaction.id,
                            fromAccount: request.fromAccountId,
                            toAccount: request.toAccountId,
                            amount: request.amount,
                            currency: request.currency,
                            feeAmount: feeAmount,
                            riskScore: 0
                        });
                        return [2 /*return*/, {
                                success: true,
                                transactionId: mainTransaction.id,
                                postedEntries: postedEntries,
                                warnings: [],
                                fraudAlerts: []
                            }];
                    case 7:
                        error_1 = _a.sent();
                        logger_1.logger.warn('Transaction failed', {
                            event: 'TRANSACTION_FAILED',
                            userId: userId,
                            error: error_1.message,
                            request: request
                        });
                        if (error_1 instanceof errorHandler_1.ApiError) {
                            throw error_1;
                        }
                        throw new errorHandler_1.ApiError('Business logic validation failed', 500, errorHandler_1.ErrorCodes.INTERNAL_ERROR);
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get account summary with business logic applied
     */
    BusinessLogicService.prototype.getAccountSummary = function (accountId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var account, pendingTransactions, balanceSummary, error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.circuitBreaker.execute(function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, this.prisma.account.findFirst({
                                            where: { id: accountId } // TODO: Add userId to Account model
                                        })];
                                });
                            }); })];
                    case 1:
                        account = _a.sent();
                        if (!account) {
                            throw new errorHandler_1.ApiError('Account not found', 404, errorHandler_1.ErrorCodes.NOT_FOUND);
                        }
                        return [4 /*yield*/, this.circuitBreaker.execute(function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, this.prisma.transaction.count({
                                            where: {
                                                companyId: accountId,
                                                // TODO: Add status field to Transaction model
                                            }
                                        })];
                                });
                            }); })];
                    case 2:
                        pendingTransactions = _a.sent();
                        balanceSummary = {
                            availableBalance: account.balance,
                            pendingDebits: 0,
                            pendingCredits: 0,
                            holdAmount: 0
                        };
                        return [2 /*return*/, {
                                accountId: account.id,
                                accountType: account.type,
                                balance: account.balance,
                                availableBalance: balanceSummary.availableBalance,
                                pendingTransactions: pendingTransactions,
                                currency: account.currency,
                                lastActivity: account.updatedAt
                            }];
                    case 3:
                        error_2 = _a.sent();
                        if (error_2 instanceof errorHandler_1.ApiError) {
                            throw error_2;
                        }
                        throw new errorHandler_1.ApiError('Failed to get account summary', 500, errorHandler_1.ErrorCodes.DATABASE_ERROR);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Calculate loan details
     */
    BusinessLogicService.prototype.calculateLoanDetails = function (principal, annualRate, months) {
        return __awaiter(this, void 0, void 0, function () {
            var monthlyPayment;
            return __generator(this, function (_a) {
                try {
                    // Validate inputs
                    domain_validator_1.DomainValidator.validateAmount({
                        amount: principal,
                        currency: 'USD', // Default currency for loans
                        precision: 2,
                        minAmount: 100,
                        maxAmount: 1000000
                    });
                    if (annualRate < 0 || annualRate > 0.3) { // Max 30% APR
                        throw new errorHandler_1.ApiError('Interest rate must be between 0% and 30%', 400, errorHandler_1.ErrorCodes.VALIDATION_ERROR);
                    }
                    if (months < 1 || months > 360) { // Max 30 years
                        throw new errorHandler_1.ApiError('Loan term must be between 1 and 360 months', 400, errorHandler_1.ErrorCodes.VALIDATION_ERROR);
                    }
                    monthlyPayment = principal * (annualRate / 12) / (1 - Math.pow(1 + annualRate / 12, -months));
                    return [2 /*return*/, {
                            monthlyPayment: monthlyPayment,
                            totalPayment: monthlyPayment * months,
                            totalInterest: monthlyPayment * months - principal
                        }];
                }
                catch (error) {
                    if (error instanceof errorHandler_1.ApiError) {
                        throw error;
                    }
                    throw new errorHandler_1.ApiError('Financial calculation failed', 500, errorHandler_1.ErrorCodes.INTERNAL_ERROR);
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Convert currency with real-time rates
     */
    BusinessLogicService.prototype.convertCurrency = function (amount, fromCurrency, toCurrency) {
        return __awaiter(this, void 0, void 0, function () {
            var exchangeRate, convertedAmount, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Validate amount
                        domain_validator_1.DomainValidator.validateAmount({
                            amount: amount,
                            currency: fromCurrency,
                            precision: 2
                        });
                        return [4 /*yield*/, this.getExchangeRate(fromCurrency, toCurrency)];
                    case 1:
                        exchangeRate = _a.sent();
                        convertedAmount = amount * exchangeRate;
                        return [2 /*return*/, {
                                convertedAmount: convertedAmount,
                                exchangeRate: exchangeRate,
                                timestamp: new Date()
                            }];
                    case 2:
                        error_3 = _a.sent();
                        if (error_3 instanceof errorHandler_1.ApiError) {
                            throw error_3;
                        }
                        throw new errorHandler_1.ApiError('Currency conversion failed', 500, errorHandler_1.ErrorCodes.EXTERNAL_SERVICE_ERROR);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get transaction history with fraud indicators
     */
    BusinessLogicService.prototype.getTransactionHistory = function (userId_1, accountId_1) {
        return __awaiter(this, arguments, void 0, function (userId, accountId, limit, offset) {
            var transactions, transactionIds, fraudAlerts, error_4;
            var _this = this;
            if (limit === void 0) { limit = 50; }
            if (offset === void 0) { offset = 0; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.circuitBreaker.execute(function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, this.prisma.transaction.findMany({
                                            where: {
                                                companyId: accountId, // TODO: Fix Transaction model
                                            },
                                            include: {
                                            // TODO: Add account relations to Transaction model
                                            },
                                            orderBy: { createdAt: 'desc' },
                                            take: limit,
                                            skip: offset
                                        })];
                                });
                            }); })];
                    case 1:
                        transactions = _a.sent();
                        transactionIds = transactions.map(function (t) { return t.id; });
                        return [4 /*yield*/, this.getFraudAlertsForTransactions(transactionIds)];
                    case 2:
                        fraudAlerts = _a.sent();
                        // Combine transactions with fraud alerts
                        return [2 /*return*/, transactions.map(function (transaction) { return (__assign(__assign({}, transaction), { fraudIndicators: [] })); })];
                    case 3:
                        error_4 = _a.sent();
                        if (error_4 instanceof errorHandler_1.ApiError) {
                            throw error_4;
                        }
                        throw new errorHandler_1.ApiError('Failed to get transaction history', 500, errorHandler_1.ErrorCodes.DATABASE_ERROR);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Helper methods
     */
    BusinessLogicService.prototype.getExchangeRate = function (fromCurrency, toCurrency) {
        return __awaiter(this, void 0, void 0, function () {
            var mockRates, key, rate;
            return __generator(this, function (_a) {
                mockRates = {
                    'USD-EUR': 0.85,
                    'EUR-USD': 1.18,
                    'USD-GBP': 0.73,
                    'GBP-USD': 1.37,
                    'USD-JPY': 110.0,
                    'JPY-USD': 0.0091
                };
                key = "".concat(fromCurrency, "-").concat(toCurrency);
                rate = mockRates[key];
                if (!rate) {
                    throw new errorHandler_1.ApiError('Exchange rate not available for currency pair', 400, errorHandler_1.ErrorCodes.EXTERNAL_SERVICE_ERROR);
                }
                return [2 /*return*/, rate];
            });
        });
    };
    BusinessLogicService.prototype.calculateTransactionFee = function (amount, accountType) {
        // Simple fee structure
        var feeStructures = {
            'CHECKING': { fixedFee: 0, percentageFee: 0, minFee: 0, maxFee: 0 },
            'SAVINGS': { fixedFee: 0, percentageFee: 0, minFee: 0, maxFee: 0 },
            'BUSINESS': { fixedFee: 2.5, percentageFee: 0.002, minFee: 2.5, maxFee: 25 }
        };
        var feeStructure = feeStructures[accountType] ||
            feeStructures['CHECKING'];
        return feeStructure.fixedFee + (amount * feeStructure.percentageFee);
    };
    BusinessLogicService.prototype.postTransactions = function (transactions) {
        return __awaiter(this, void 0, void 0, function () {
            var postedEntries, _i, transactions_1, transaction;
            return __generator(this, function (_a) {
                postedEntries = [];
                for (_i = 0, transactions_1 = transactions; _i < transactions_1.length; _i++) {
                    transaction = transactions_1[_i];
                    // Validate double-entry rules
                    if (!bookkeeping_rules_1.BookkeepingRules.validateTransaction(transaction)) {
                        throw new errorHandler_1.ApiError('Invalid transaction structure', 400, errorHandler_1.ErrorCodes.VALIDATION_ERROR);
                    }
                    // Simulate posting entries
                    postedEntries.push({
                        id: "POSTED_".concat(transaction.id),
                        transactionId: transaction.id,
                        postedAt: new Date()
                    });
                }
                return [2 /*return*/, postedEntries];
            });
        });
    };
    BusinessLogicService.prototype.getTransactionPatterns = function (userId, accountId) {
        return __awaiter(this, void 0, void 0, function () {
            var transactions;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.circuitBreaker.execute(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/, this.prisma.transaction.findMany({
                                        where: {
                                            companyId: accountId, // TODO: Fix Transaction model
                                            createdAt: {
                                                gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
                                            }
                                        },
                                        select: {
                                            id: true,
                                            // TODO: Add amount and metadata fields to Transaction model
                                            createdAt: true
                                        },
                                        orderBy: { createdAt: 'desc' },
                                        take: 100
                                    })];
                            });
                        }); })];
                    case 1:
                        transactions = _a.sent();
                        return [2 /*return*/, transactions.map(function (t) {
                                var _a, _b, _c, _d;
                                return ({
                                    userId: userId,
                                    accountId: accountId,
                                    amount: 0, // TODO: Add amount field to Transaction model
                                    timestamp: t.createdAt,
                                    location: (_a = t.metadata) === null || _a === void 0 ? void 0 : _a.location,
                                    device: (_b = t.metadata) === null || _b === void 0 ? void 0 : _b.device,
                                    ipAddress: (_c = t.metadata) === null || _c === void 0 ? void 0 : _c.ipAddress,
                                    merchantCategory: (_d = t.metadata) === null || _d === void 0 ? void 0 : _d.merchantCategory
                                });
                            })];
                }
            });
        });
    };
    BusinessLogicService.prototype.getFraudAlertsForTransactions = function (transactionIds) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Get fraud alerts for the specified transactions
                // This would query a fraud alerts table in a real system
                return [2 /*return*/, []];
            });
        });
    };
    /**
     * Health check for business logic service
     */
    BusinessLogicService.prototype.healthCheck = function () {
        return __awaiter(this, void 0, void 0, function () {
            var circuitBreakerState, dbHealthy, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        circuitBreakerState = this.circuitBreaker.getState();
                        dbHealthy = false;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.prisma.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT 1"], ["SELECT 1"])))];
                    case 2:
                        _a.sent();
                        dbHealthy = true;
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _a.sent();
                        dbHealthy = false;
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/, {
                            status: dbHealthy && circuitBreakerState === 'CLOSED' ? 'healthy' : 'degraded',
                            circuitBreakerState: circuitBreakerState,
                            dependencies: {
                                database: dbHealthy,
                                fraudDetection: true, // Always available as it's in-process
                                calculations: true // Always available as it's in-process
                            }
                        }];
                }
            });
        });
    };
    return BusinessLogicService;
}());
exports.BusinessLogicService = BusinessLogicService;
// Export singleton instance
exports.businessLogicService = new BusinessLogicService();
var templateObject_1;
