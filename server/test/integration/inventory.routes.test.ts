import request from 'supertest';
import express from "express";
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getAuthToken } from '../test-utils';
import * as inventoryController from "../../controllers/inventory.controller.new";
import type { Request, Response, NextFunction } from "express";

const { inventoryServiceMock } = vi.hoisted(() => {
  const inventoryServiceMock = {
    getInventoryItems: vi.fn(),
    createInventoryItem: vi.fn(),
  };

  return { inventoryServiceMock };
});

vi.mock('../../services/inventory.service', () => ({
  inventoryService: inventoryServiceMock,
}));

let app: any;

describe('Inventory Routes', () => {
  let authToken: string;
  const testUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    password: 'password123',
    role: 'ADMIN',
    tenantId: 'test-tenant-123',
  };

  beforeAll(async () => {
    authToken = await getAuthToken(testUser.email, testUser.password);

    const testAuth = (req: any, res: any, next: any) => {
      const authHeader = req.headers?.authorization;
      if (!authHeader || !String(authHeader).startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      req.user = {
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        tenantId: testUser.tenantId,
      };
      next();
    };

    app = express();
    app.use(express.json());
    app.get('/api/inventory', testAuth, (req: Request, res: Response, next: NextFunction) =>
      inventoryController.getInventory(req, res, next),
    );
    app.post('/api/inventory', testAuth, (req: Request, res: Response, next: NextFunction) =>
      inventoryController.createInventoryItem(req, res, next),
    );
  });

  afterAll(async () => {
    vi.clearAllMocks();
  });

  describe('GET /api/inventory', () => {
    it('should return a list of inventory items', async () => {
      const mockItems = [
        { id: '1', name: 'Item 1', quantity: 10, tenantId: testUser.tenantId },
        { id: '2', name: 'Item 2', quantity: 20, tenantId: testUser.tenantId },
      ];

      inventoryServiceMock.getInventoryItems.mockResolvedValue({
        items: mockItems,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      });

      const response = await request(app)
        .get('/api/inventory')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
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

  describe('POST /api/inventory', () => {
    it('should create a new inventory item', async () => {
      const newItem = {
        name: 'New Item',
        sku: 'SKU123',
        quantity: 10,
        unit: 'pcs',
        costPrice: 9.99,
        sellingPrice: 19.99,
        reorderPoint: 5,
      };

      const createdItem = {
        id: 'new-item-123',
        ...newItem,
        tenantId: testUser.tenantId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      inventoryServiceMock.createInventoryItem.mockResolvedValue(createdItem);

      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newItem);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: 'new-item-123',
          name: 'New Item',
          sku: 'SKU123',
          quantity: 10,
        }),
      });
    });
  });

  // Add more test cases for other endpoints:
  // - GET /api/inventory/:id
  // - PUT /api/inventory/:id
  // - DELETE /api/inventory/:id
  // - POST /api/inventory/:id/adjust
  // - GET /api/inventory/:id/history
});
