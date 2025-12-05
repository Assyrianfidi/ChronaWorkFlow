"use strict";
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var invoice_service_js_1 = require("../../services/invoice.service.js");
var errors_js_1 = require("../../utils/errors.js");
var globals_1 = require("@jest/globals");
// Mock data
var mockInvoice = {
    id: '1',
    customerId: 'cust-123',
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    status: 'DRAFT',
    subtotal: 1000,
    tax: 200,
    total: 1200,
    notes: 'Test invoice',
    companyId: 'company-123',
    invoiceNumber: 'INV-001',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
};
var mockInvoiceItems = [
    {
        id: 'item-1',
        invoiceId: '1',
        description: 'Test Item 1',
        quantity: 2,
        unitPrice: 500,
        amount: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];
// Create a mock Prisma client with proper typing
var mockPrisma = {
    $transaction: globals_1.jest.fn(),
    invoice: {
        findUnique: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
        create: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        count: globals_1.jest.fn(),
    },
    invoiceItem: {
        createMany: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
        deleteMany: globals_1.jest.fn(),
    },
};
// Mock the Prisma client
globals_1.jest.mock('../../utils/prisma.js', function () { return ({
    prisma: mockPrisma,
}); });
// Mock the generateInvoiceNumber method
var mockGenerateInvoiceNumber = globals_1.jest.fn().mockResolvedValue('INV-001');
// Create a partial mock of the InvoiceService class
globals_1.jest.mock('../../services/invoice.service.js', function () {
    return {
        InvoiceService: globals_1.jest.fn().mockImplementation(function () {
            return __assign(__assign({}, globals_1.jest.requireActual('../../services/invoice.service.js').InvoiceService.prototype), { generateInvoiceNumber: mockGenerateInvoiceNumber });
        }),
    };
});
(0, globals_1.describe)('InvoiceService Integration Tests', function () {
    var invoiceService;
    (0, globals_1.beforeEach)(function () {
        // Reset all mocks before each test
        globals_1.jest.clearAllMocks();
        // Create a new instance of the service for each test
        invoiceService = new invoice_service_js_1.InvoiceService();
        // Set up default mock implementations
        var mockTransaction = {
            invoice: {
                create: globals_1.jest.fn(),
                update: globals_1.jest.fn(),
                findUnique: globals_1.jest.fn(),
                delete: globals_1.jest.fn(),
            },
            invoiceItem: {
                createMany: globals_1.jest.fn(),
                findMany: globals_1.jest.fn(),
                deleteMany: globals_1.jest.fn(),
            },
        };
        mockPrisma.$transaction.mockImplementation(function (callback) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, callback(mockTransaction)];
            });
        }); });
    });
    (0, globals_1.afterEach)(function () {
        // Clean up after each test
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.describe)('createInvoice', function () {
        (0, globals_1.it)('should create a new invoice with items', function () { return __awaiter(void 0, void 0, void 0, function () {
            var generateInvoiceNumberSpy, invoiceData, result, items, invoiceDataWithoutItems, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Setup mocks
                        mockPrisma.invoice.create.mockResolvedValue(mockInvoice);
                        mockPrisma.invoiceItem.createMany.mockResolvedValue({ count: 1 });
                        mockPrisma.invoiceItem.findMany.mockResolvedValue(mockInvoiceItems);
                        generateInvoiceNumberSpy = globals_1.jest.spyOn(invoice_service_js_1.InvoiceService.prototype, 'generateInvoiceNumber')
                            .mockResolvedValue('INV-001');
                        invoiceData = {
                            customerId: 'cust-123',
                            issueDate: new Date(),
                            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                            status: 'DRAFT',
                            subtotal: 1000,
                            tax: 200,
                            total: 1200,
                            notes: 'Test invoice',
                            companyId: 'company-123',
                            items: [
                                {
                                    description: 'Test Item 1',
                                    quantity: 2,
                                    unitPrice: 500,
                                    amount: 1000,
                                },
                            ],
                        };
                        return [4 /*yield*/, invoiceService.createInvoice(invoiceData)];
                    case 1:
                        result = _a.sent();
                        // Verify generateInvoiceNumber was called with the correct companyId
                        (0, globals_1.expect)(generateInvoiceNumberSpy).toHaveBeenCalledWith('company-123');
                        // Verify transaction was called
                        (0, globals_1.expect)(mockPrisma.$transaction).toHaveBeenCalled();
                        items = invoiceData.items, invoiceDataWithoutItems = __rest(invoiceData, ["items"]);
                        (0, globals_1.expect)(mockPrisma.invoice.create).toHaveBeenCalledWith({
                            data: __assign(__assign({}, invoiceDataWithoutItems), { invoiceNumber: 'INV-001' }),
                        });
                        // Verify items were created
                        (0, globals_1.expect)(mockPrisma.invoiceItem.createMany).toHaveBeenCalledWith({
                            data: [{
                                    description: 'Test Item 1',
                                    quantity: 2,
                                    unitPrice: 500,
                                    amount: 1000,
                                    invoiceId: '1',
                                }]
                        });
                        // Verify the result
                        (0, globals_1.expect)(result).toEqual(__assign(__assign({}, mockInvoice), { items: mockInvoiceItems }));
                        // Verify findMany was called to get the created items
                        (0, globals_1.expect)(mockPrisma.invoiceItem.findMany).toHaveBeenCalledWith({
                            where: { invoiceId: '1' },
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Error:', error_1);
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    });
    (0, globals_1.describe)('updateInvoice', function () {
        (0, globals_1.it)('should update an existing invoice', function () { return __awaiter(void 0, void 0, void 0, function () {
            var updatedInvoice, updateData, result, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        updatedInvoice = __assign(__assign({}, mockInvoice), { status: 'SENT', notes: 'Updated test invoice', updatedAt: new Date() });
                        // Setup mocks
                        mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
                        mockPrisma.invoice.update.mockResolvedValue(updatedInvoice);
                        mockPrisma.invoiceItem.findMany.mockResolvedValue(mockInvoiceItems);
                        updateData = {
                            status: 'SENT',
                            notes: 'Updated test invoice',
                        };
                        return [4 /*yield*/, invoiceService.updateInvoice('1', updateData)];
                    case 1:
                        result = _a.sent();
                        // Verify the invoice was found using the transaction
                        (0, globals_1.expect)(mockPrisma.invoice.findUnique).toHaveBeenCalledWith({
                            where: { id: '1' },
                        });
                        // Verify the update was called with correct data using the transaction
                        (0, globals_1.expect)(mockPrisma.invoice.update).toHaveBeenCalledWith({
                            where: { id: '1' },
                            data: __assign(__assign({}, updateData), { updatedAt: globals_1.expect.any(Date) }),
                        });
                        // Verify items were fetched using the transaction
                        (0, globals_1.expect)(mockPrisma.invoiceItem.findMany).toHaveBeenCalledWith({
                            where: { invoiceId: '1' },
                        });
                        // Verify the result
                        (0, globals_1.expect)(result).toEqual(__assign(__assign({}, updatedInvoice), { items: mockInvoiceItems }));
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Error:', error_2);
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should throw an error if invoice not found', function () { return __awaiter(void 0, void 0, void 0, function () {
            var error_3, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        // Setup mock
                        mockPrisma.invoice.findUnique.mockResolvedValue(null);
                        // Test and verify
                        return [4 /*yield*/, (0, globals_1.expect)(invoiceService.updateInvoice('nonexistent-id', { status: 'SENT' })).rejects.toThrow(errors_js_1.ApiError)];
                    case 1:
                        // Test and verify
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, invoiceService.updateInvoice('nonexistent-id', { status: 'SENT' })];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_3 = _a.sent();
                        (0, globals_1.expect)(error_3).toBeInstanceOf(errors_js_1.ApiError);
                        (0, globals_1.expect)(error_3.statusCode).toBe(404);
                        (0, globals_1.expect)(error_3.message).toBe('Invoice not found');
                        return [3 /*break*/, 5];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_4 = _a.sent();
                        console.error('Error:', error_4);
                        throw error_4;
                    case 7: return [2 /*return*/];
                }
            });
        }); });
    });
    (0, globals_1.describe)('deleteInvoice', function () {
        (0, globals_1.it)('should delete an invoice and its items', function () { return __awaiter(void 0, void 0, void 0, function () {
            var error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Setup mocks
                        mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
                        mockPrisma.invoiceItem.deleteMany.mockResolvedValue({ count: 1 });
                        mockPrisma.invoice.delete.mockResolvedValue(mockInvoice);
                        return [4 /*yield*/, invoiceService.deleteInvoice('1')];
                    case 1:
                        _a.sent();
                        // Verify the invoice was found
                        (0, globals_1.expect)(mockPrisma.invoice.findUnique).toHaveBeenCalledWith({
                            where: { id: '1' },
                        });
                        // Verify items were deleted
                        (0, globals_1.expect)(mockPrisma.invoiceItem.deleteMany).toHaveBeenCalledWith({
                            where: { invoiceId: '1' },
                        });
                        // Verify the invoice was deleted
                        (0, globals_1.expect)(mockPrisma.invoice.delete).toHaveBeenCalledWith({
                            where: { id: '1' },
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_5 = _a.sent();
                        console.error('Error:', error_5);
                        throw error_5;
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should throw an error if invoice not found', function () { return __awaiter(void 0, void 0, void 0, function () {
            var error_6, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        // Setup mock
                        mockPrisma.invoice.findUnique.mockResolvedValue(null);
                        // Test and verify
                        return [4 /*yield*/, (0, globals_1.expect)(invoiceService.deleteInvoice('nonexistent-id')).rejects.toThrow(errors_js_1.ApiError)];
                    case 1:
                        // Test and verify
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, invoiceService.deleteInvoice('nonexistent-id')];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_6 = _a.sent();
                        (0, globals_1.expect)(error_6).toBeInstanceOf(errors_js_1.ApiError);
                        (0, globals_1.expect)(error_6.statusCode).toBe(404);
                        (0, globals_1.expect)(error_6.message).toBe('Invoice not found');
                        return [3 /*break*/, 5];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_7 = _a.sent();
                        console.error('Error:', error_7);
                        throw error_7;
                    case 7: return [2 /*return*/];
                }
            });
        }); });
    });
    (0, globals_1.describe)('getInvoiceById', function () {
        (0, globals_1.it)('should return an invoice with items', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Setup mocks
                        mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
                        mockPrisma.invoiceItem.findMany.mockResolvedValue(mockInvoiceItems);
                        return [4 /*yield*/, invoiceService.getInvoiceById('1')];
                    case 1:
                        result = _a.sent();
                        // Verify the invoice was found
                        (0, globals_1.expect)(mockPrisma.invoice.findUnique).toHaveBeenCalledWith({
                            where: { id: '1' },
                        });
                        // Verify items were fetched
                        (0, globals_1.expect)(mockPrisma.invoiceItem.findMany).toHaveBeenCalledWith({
                            where: { invoiceId: '1' },
                        });
                        // Verify the result
                        (0, globals_1.expect)(result).toEqual(__assign(__assign({}, mockInvoice), { items: mockInvoiceItems }));
                        return [3 /*break*/, 3];
                    case 2:
                        error_8 = _a.sent();
                        console.error('Error:', error_8);
                        throw error_8;
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should throw an error if invoice not found', function () { return __awaiter(void 0, void 0, void 0, function () {
            var error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Setup mock
                        mockPrisma.invoice.findUnique.mockResolvedValue(null);
                        // Test and verify
                        return [4 /*yield*/, (0, globals_1.expect)(invoiceService.getInvoiceById('nonexistent-id')).rejects.toThrow(errors_js_1.ApiError)];
                    case 1:
                        // Test and verify
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_9 = _a.sent();
                        console.error('Error:', error_9);
                        throw error_9;
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    });
    (0, globals_1.describe)('getInvoicesByCompany', function () {
        (0, globals_1.it)('should return paginated invoices for a company', function () { return __awaiter(void 0, void 0, void 0, function () {
            var mockInvoices, totalCount, result, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        mockInvoices = [mockInvoice];
                        totalCount = 1;
                        // Setup mocks
                        mockPrisma.invoice.findMany.mockResolvedValue(mockInvoices);
                        mockPrisma.invoice.count.mockResolvedValue(totalCount);
                        return [4 /*yield*/, invoiceService.getInvoicesByCompany('company-123', 1, 10)];
                    case 1:
                        result = _a.sent();
                        // Verify the query
                        (0, globals_1.expect)(mockPrisma.invoice.findMany).toHaveBeenCalledWith({
                            where: { companyId: 'company-123' },
                            skip: 0, // (page - 1) * limit = (1 - 1) * 10 = 0
                            take: 10,
                            orderBy: { createdAt: 'desc' },
                        });
                        // Verify the count
                        (0, globals_1.expect)(mockPrisma.invoice.count).toHaveBeenCalledWith({
                            where: { companyId: 'company-123' },
                        });
                        // Verify the result
                        (0, globals_1.expect)(result).toEqual({
                            data: mockInvoices,
                            meta: {
                                total: totalCount,
                                page: 1,
                                totalPages: 1,
                                limit: 10,
                            },
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_10 = _a.sent();
                        console.error('Error:', error_10);
                        throw error_10;
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    });
});
