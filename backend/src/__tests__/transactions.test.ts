// Mock Prisma client first
const mockPrisma = {
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

jest.mock('../utils/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('../utils/errors', () => ({
  ApiError: class ApiError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) {
      super(message);
      this.statusCode = statusCode;
      this.name = 'ApiError';
    }
  },
}));

import { transactionsService } from '../modules/transactions/transactions.service.js';
import { transactionsController } from '../modules/transactions/transactions.controller.js';
import { Request, Response, NextFunction } from 'express';

describe('Transactions Module', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
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

  afterAll(async () => {
    await mockPrisma.$disconnect();
  });

  describe('TransactionsService', () => {
    describe('list', () => {
      it('should list transactions for a company', async () => {
        const mockTransactions = [
          {
            id: '1',
            transactionNumber: 'TXN001',
            companyId: 'company-1',
            lines: [],
          },
        ];
        mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);

        const result = await transactionsService.list('company-1', 50);

        expect(result).toEqual(mockTransactions);
        expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
          where: { companyId: 'company-1' },
          orderBy: { date: 'desc' },
          include: { lines: true },
          take: 50,
        });
      });
    });

    describe('create', () => {
      it('should create a balanced transaction', async () => {
        const transactionData: {
          companyId: string;
          transactionNumber: string;
          date: string;
          type: 'journal_entry' | 'invoice' | 'payment' | 'bank';
          totalAmount: string;
          lines: {
            accountId: string;
            debit: string;
            credit: string;
          }[];
        } = {
          companyId: '550e8400-e29b-41d4-a716-446655440000',
          transactionNumber: 'TXN001',
          date: '2023-01-01',
          type: 'journal_entry' as const,
          totalAmount: '100.00',
          lines: [
            { accountId: '550e8400-e29b-41d4-a716-446655440001', debit: '100.00', credit: '0' },
            { accountId: '550e8400-e29b-41d4-a716-446655440002', debit: '0', credit: '100.00' },
          ],
        };

        const mockTransaction = { id: '1', ...transactionData };
        const mockLines = [{ id: 'line-1', transactionId: '1' }];

        mockPrisma.$transaction.mockImplementation(async (callback) => {
          mockPrisma.transaction.create.mockResolvedValue(mockTransaction);
          mockPrisma.transactionLine.create.mockResolvedValue(mockLines[0]);
          return callback(mockPrisma);
        });

        const result = await transactionsService.create(transactionData, 'user-1');

        expect(result).toEqual(mockTransaction);
        expect(mockPrisma.transaction.create).toHaveBeenCalled();
        expect(mockPrisma.transactionLine.create).toHaveBeenCalledTimes(2);
      });

      it('should throw error for unbalanced transaction', async () => {
        const transactionData: {
          companyId: string;
          transactionNumber: string;
          date: string;
          type: 'journal_entry' | 'invoice' | 'payment' | 'bank';
          totalAmount: string;
          lines: {
            accountId: string;
            debit: string;
            credit: string;
          }[];
        } = {
          companyId: '550e8400-e29b-41d4-a716-446655440000',
          transactionNumber: 'TXN001',
          date: '2023-01-01',
          type: 'journal_entry' as const,
          totalAmount: '100.00',
          lines: [
            { accountId: '550e8400-e29b-41d4-a716-446655440001', debit: '100.00', credit: '0' },
            { accountId: '550e8400-e29b-41d4-a716-446655440002', debit: '50.00', credit: '0' },
          ],
        };

        await expect(
          transactionsService.create(transactionData, 'user-1')
        ).rejects.toThrow('Transaction must be balanced');
      });
    });
  });

  describe('TransactionsController', () => {
    describe('list', () => {
      it('should return transactions list', async () => {
        mockRequest.query = { companyId: '550e8400-e29b-41d4-a716-446655440000', limit: '25' };
        const mockTransactions = [{ id: '1', transactionNumber: 'TXN001' }];
        mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);

        await transactionsController.list(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          data: mockTransactions,
        });
      });

      it('should use default limit when not provided', async () => {
        mockRequest.query = { companyId: '550e8400-e29b-41d4-a716-446655440000' };
        const mockTransactions = [{ id: '1', transactionNumber: 'TXN001' }];
        mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);

        await transactionsController.list(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ take: 50 })
        );
      });

      it('should handle validation errors', async () => {
        mockRequest.query = {};

        await transactionsController.list(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        expect(nextFunction).toHaveBeenCalled();
      });
    });

    describe('create', () => {
      it('should create and return transaction', async () => {
        const transactionData: {
          companyId: string;
          transactionNumber: string;
          date: string;
          type: 'journal_entry' | 'invoice' | 'payment' | 'bank';
          totalAmount: string;
          lines: {
            accountId: string;
            debit: string;
            credit: string;
          }[];
        } = {
          companyId: '550e8400-e29b-41d4-a716-446655440000',
          transactionNumber: 'TXN001',
          date: '2023-01-01',
          type: 'journal_entry' as const,
          totalAmount: '100.00',
          lines: [
            { accountId: '550e8400-e29b-41d4-a716-446655440001', debit: '100.00', credit: '0' },
            { accountId: '550e8400-e29b-41d4-a716-446655440002', debit: '0', credit: '100.00' },
          ],
        };
        mockRequest.body = transactionData;
        const mockTransaction = { id: '1', ...transactionData };

        mockPrisma.$transaction.mockImplementation(async (callback) => {
          mockPrisma.transaction.create.mockResolvedValue(mockTransaction);
          mockPrisma.transactionLine.create.mockResolvedValue({ id: 'line-1' });
          return callback(mockPrisma);
        });

        await transactionsController.create(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          data: mockTransaction,
        });
      });

      it('should handle balance validation errors', async () => {
        const transactionData = {
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

        await transactionsController.create(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        expect(nextFunction).toHaveBeenCalled();
      });
    });
  });
});
