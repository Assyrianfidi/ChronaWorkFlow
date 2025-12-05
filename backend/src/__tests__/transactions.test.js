"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
// Mock Prisma client first
var mockPrisma = {
    transaction: {
        findMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
    },
    transactionLine: {
        create: jest.fn(),
    },
    $transaction: jest.fn(),
    $disconnect: jest.fn(),
};
jest.mock('../utils/prisma', function () { return ({
    prisma: mockPrisma,
}); });
jest.mock('../utils/errors', function () { return ({
    ApiError: /** @class */ (function (_super) {
        __extends(ApiError, _super);
        function ApiError(statusCode, message) {
            var _this = _super.call(this, message) || this;
            _this.statusCode = statusCode;
            _this.name = 'ApiError';
            return _this;
        }
        return ApiError;
    }(Error)),
}); });
var transactions_service_js_1 = require("../modules/transactions/transactions.service.js");
var transactions_controller_js_1 = require("../modules/transactions/transactions.controller.js");
describe('Transactions Module', function () {
    var mockRequest;
    var mockResponse;
    var nextFunction;
    beforeEach(function () {
        jest.clearAllMocks();
        mockRequest = {
            query: {},
            params: {},
            body: {},
            user: { id: 'test-user-id', email: 'test@example.com', role: 'USER', isActive: true },
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        nextFunction = jest.fn();
    });
    afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, mockPrisma.$disconnect()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    describe('TransactionsService', function () {
        describe('list', function () {
            it('should list transactions for a company', function () { return __awaiter(void 0, void 0, void 0, function () {
                var mockTransactions, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            mockTransactions = [
                                {
                                    id: '1',
                                    transactionNumber: 'TXN001',
                                    companyId: 'company-1',
                                    lines: [],
                                },
                            ];
                            mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);
                            return [4 /*yield*/, transactions_service_js_1.transactionsService.list('company-1', 50)];
                        case 1:
                            result = _a.sent();
                            expect(result).toEqual(mockTransactions);
                            expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
                                where: { companyId: 'company-1' },
                                orderBy: { date: 'desc' },
                                include: { lines: true },
                                take: 50,
                            });
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe('create', function () {
            it('should create a balanced transaction', function () { return __awaiter(void 0, void 0, void 0, function () {
                var transactionData, mockTransaction, mockLines, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            transactionData = {
                                companyId: '550e8400-e29b-41d4-a716-446655440000',
                                transactionNumber: 'TXN001',
                                date: '2023-01-01',
                                type: 'journal_entry',
                                totalAmount: '100.00',
                                lines: [
                                    { accountId: '550e8400-e29b-41d4-a716-446655440001', debit: '100.00', credit: '0' },
                                    { accountId: '550e8400-e29b-41d4-a716-446655440002', debit: '0', credit: '100.00' },
                                ],
                            };
                            mockTransaction = __assign({ id: '1' }, transactionData);
                            mockLines = [{ id: 'line-1', transactionId: '1' }];
                            mockPrisma.$transaction.mockImplementation(function (callback) { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    mockPrisma.transaction.create.mockResolvedValue(mockTransaction);
                                    mockPrisma.transactionLine.create.mockResolvedValue(mockLines[0]);
                                    return [2 /*return*/, callback(mockPrisma)];
                                });
                            }); });
                            return [4 /*yield*/, transactions_service_js_1.transactionsService.create(transactionData, 'user-1')];
                        case 1:
                            result = _a.sent();
                            expect(result).toEqual(mockTransaction);
                            expect(mockPrisma.transaction.create).toHaveBeenCalled();
                            expect(mockPrisma.transactionLine.create).toHaveBeenCalledTimes(2);
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should throw error for unbalanced transaction', function () { return __awaiter(void 0, void 0, void 0, function () {
                var transactionData;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            transactionData = {
                                companyId: '550e8400-e29b-41d4-a716-446655440000',
                                transactionNumber: 'TXN001',
                                date: '2023-01-01',
                                type: 'journal_entry',
                                totalAmount: '100.00',
                                lines: [
                                    { accountId: '550e8400-e29b-41d4-a716-446655440001', debit: '100.00', credit: '0' },
                                    { accountId: '550e8400-e29b-41d4-a716-446655440002', debit: '50.00', credit: '0' },
                                ],
                            };
                            return [4 /*yield*/, expect(transactions_service_js_1.transactionsService.create(transactionData, 'user-1')).rejects.toThrow('Transaction must be balanced')];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
    describe('TransactionsController', function () {
        describe('list', function () {
            it('should return transactions list', function () { return __awaiter(void 0, void 0, void 0, function () {
                var mockTransactions;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            mockRequest.query = { companyId: '550e8400-e29b-41d4-a716-446655440000', limit: '25' };
                            mockTransactions = [{ id: '1', transactionNumber: 'TXN001' }];
                            mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);
                            return [4 /*yield*/, transactions_controller_js_1.transactionsController.list(mockRequest, mockResponse, nextFunction)];
                        case 1:
                            _a.sent();
                            expect(mockResponse.status).toHaveBeenCalledWith(200);
                            expect(mockResponse.json).toHaveBeenCalledWith({
                                success: true,
                                data: mockTransactions,
                            });
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should use default limit when not provided', function () { return __awaiter(void 0, void 0, void 0, function () {
                var mockTransactions;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            mockRequest.query = { companyId: '550e8400-e29b-41d4-a716-446655440000' };
                            mockTransactions = [{ id: '1', transactionNumber: 'TXN001' }];
                            mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);
                            return [4 /*yield*/, transactions_controller_js_1.transactionsController.list(mockRequest, mockResponse, nextFunction)];
                        case 1:
                            _a.sent();
                            expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 50 }));
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should handle validation errors', function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            mockRequest.query = {};
                            return [4 /*yield*/, transactions_controller_js_1.transactionsController.list(mockRequest, mockResponse, nextFunction)];
                        case 1:
                            _a.sent();
                            expect(nextFunction).toHaveBeenCalled();
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe('create', function () {
            it('should create and return transaction', function () { return __awaiter(void 0, void 0, void 0, function () {
                var transactionData, mockTransaction;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            transactionData = {
                                companyId: '550e8400-e29b-41d4-a716-446655440000',
                                transactionNumber: 'TXN001',
                                date: '2023-01-01',
                                type: 'journal_entry',
                                totalAmount: '100.00',
                                lines: [
                                    { accountId: '550e8400-e29b-41d4-a716-446655440001', debit: '100.00', credit: '0' },
                                    { accountId: '550e8400-e29b-41d4-a716-446655440002', debit: '0', credit: '100.00' },
                                ],
                            };
                            mockRequest.body = transactionData;
                            mockTransaction = __assign({ id: '1' }, transactionData);
                            mockPrisma.$transaction.mockImplementation(function (callback) { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    mockPrisma.transaction.create.mockResolvedValue(mockTransaction);
                                    mockPrisma.transactionLine.create.mockResolvedValue({ id: 'line-1' });
                                    return [2 /*return*/, callback(mockPrisma)];
                                });
                            }); });
                            return [4 /*yield*/, transactions_controller_js_1.transactionsController.create(mockRequest, mockResponse, nextFunction)];
                        case 1:
                            _a.sent();
                            expect(mockResponse.status).toHaveBeenCalledWith(201);
                            expect(mockResponse.json).toHaveBeenCalledWith({
                                success: true,
                                data: mockTransaction,
                            });
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should handle balance validation errors', function () { return __awaiter(void 0, void 0, void 0, function () {
                var transactionData;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            transactionData = {
                                companyId: 'company-1',
                                transactionNumber: 'TXN001',
                                date: '2023-01-01',
                                type: 'journal_entry',
                                totalAmount: '100.00',
                                lines: [
                                    { accountId: 'acc-1', debit: '100.00', credit: '0' },
                                    { accountId: 'acc-2', debit: '50.00', credit: '0' },
                                ],
                            };
                            mockRequest.body = transactionData;
                            return [4 /*yield*/, transactions_controller_js_1.transactionsController.create(mockRequest, mockResponse, nextFunction)];
                        case 1:
                            _a.sent();
                            expect(nextFunction).toHaveBeenCalled();
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
});
