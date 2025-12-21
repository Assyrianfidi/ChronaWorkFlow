import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createTestUser, getAuthToken } from '../test-utils';

const { mockPrisma } = vi.hoisted(() => {
  const mockPrisma = {
    inventory: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    inventoryHistory: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  };

  return { mockPrisma };
});

vi.mock('../../prisma', () => ({ prisma: mockPrisma }));

let app: any;
let prisma: any;

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
    const prismaMod = await import('../../prisma');
    prisma = prismaMod.prisma;

    const appMod = await import('../../app');
    app = appMod.app ?? appMod.default;

    // Create a test user and get auth token
    await createTestUser(testUser);
    authToken = await getAuthToken(testUser.email, testUser.password);
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({});
    vi.clearAllMocks();
  });

  describe('GET /api/inventory', () => {
    it('should return a list of inventory items', async () => {
      const mockItems = [
        { id: '1', name: 'Item 1', quantity: 10, tenantId: testUser.tenantId },
        { id: '2', name: 'Item 2', quantity: 20, tenantId: testUser.tenantId },
      ];

      (prisma.inventory.findMany as any).mockResolvedValue(mockItems);
      (prisma.inventory.count as any).mockResolvedValue(2);

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

      (prisma.inventory.create as any).mockResolvedValue(createdItem);
      (prisma.inventoryHistory.create as any).mockResolvedValue({ id: 'hist-1' });

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
