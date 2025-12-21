import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import * as inventoryController from '../../controllers/inventory.controller.new';
import { prisma } from '../../prisma';
import { ApiError } from '../../utils/error';

// Mock the Prisma client
vi.mock('../../prisma', () => ({
  prisma: {
    inventoryItem: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('Inventory Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      params: {},
      query: {},
      body: {},
      user: {
        id: 'user123',
        role: 'ADMIN',
        tenantId: 'tenant123',
      },
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe('getInventory', () => {
    it('should return paginated inventory items', async () => {
      const mockItems = [
        { id: '1', name: 'Item 1', quantity: 10, tenantId: 'tenant123' },
        { id: '2', name: 'Item 2', quantity: 20, tenantId: 'tenant123' },
      ];

      (prisma.inventoryItem.findMany as any).mockResolvedValue(mockItems);
      (prisma.inventoryItem.count as any).mockResolvedValue(2);

      mockRequest.query = {
        page: '1',
        limit: '10',
        sortBy: 'name',
        sortOrder: 'asc',
      };

      await inventoryController.getInventory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant123', deletedAt: null },
        orderBy: { name: 'asc' },
        skip: 0,
        take: 10,
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockItems,
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });
  });

  describe('getInventoryItem', () => {
    it('should return a single inventory item', async () => {
      const mockItem = {
        id: '1',
        name: 'Test Item',
        quantity: 10,
        tenantId: 'tenant123',
      };

      (prisma.inventoryItem.findFirst as any).mockResolvedValue(mockItem);
      mockRequest.params = { id: '1' };

      await inventoryController.getInventoryItem(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(prisma.inventoryItem.findFirst).toHaveBeenCalledWith({
        where: { id: '1', tenantId: 'tenant123', deletedAt: null },
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockItem,
      });
    });

    it('should return 404 if item not found', async () => {
      (prisma.inventoryItem.findFirst as any).mockResolvedValue(null);
      mockRequest.params = { id: 'nonexistent' };

      await inventoryController.getInventoryItem(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        new ApiError(404, 'Inventory item not found')
      );
    });
  });

  // Add more test cases for other controller methods:
  // - createInventoryItem
  // - updateInventoryItem
  // - deleteInventoryItem
  // - adjustInventoryQuantity
  // - getInventoryHistory
});
