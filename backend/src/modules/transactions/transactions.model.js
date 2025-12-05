"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDecimal = exports.transactionListSchema = exports.transactionCreateSchema = exports.transactionLineSchema = void 0;
var client_1 = require("@prisma/client");
var zod_1 = require("zod");
exports.transactionLineSchema = zod_1.z.object({
    accountId: zod_1.z.string().uuid({ message: 'accountId must be uuid' }),
    debit: zod_1.z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/, 'debit must be decimal with up to two digits')
        .optional()
        .or(zod_1.z.literal(''))
        .transform(function (value) { return value || '0'; }),
    credit: zod_1.z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/, 'credit must be decimal with up to two digits')
        .optional()
        .or(zod_1.z.literal(''))
        .transform(function (value) { return value || '0'; }),
    description: zod_1.z.string().optional(),
});
exports.transactionCreateSchema = zod_1.z.object({
    companyId: zod_1.z.string().uuid({ message: 'companyId must be uuid' }),
    transactionNumber: zod_1.z.string().min(1, 'transactionNumber required'),
    date: zod_1.z
        .string()
        .refine(function (value) { return !Number.isNaN(Date.parse(value)); }, 'date must be valid ISO string'),
    type: zod_1.z.enum([
        'JOURNAL_ENTRY',
        'INVOICE',
        'PAYMENT',
        'BILL',
        'EXPENSE',
        'ADJUSTMENT',
    ]),
    description: zod_1.z.string().optional(),
    referenceNumber: zod_1.z.string().optional(),
    totalAmount: zod_1.z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/, 'totalAmount must be decimal with max two digits'),
    lines: zod_1.z
        .array(exports.transactionLineSchema)
        .min(2, 'At least two ledger lines required'),
});
exports.transactionListSchema = zod_1.z.object({
    companyId: zod_1.z.string().uuid({ message: 'companyId must be uuid' }),
    limit: zod_1.z
        .string()
        .optional()
        .transform(function (value) { return (value ? Number(value) : 50); }),
});
var prisma = new client_1.PrismaClient();
var toDecimal = function (value) { return new client_1.Prisma.Decimal(value); };
exports.toDecimal = toDecimal;
