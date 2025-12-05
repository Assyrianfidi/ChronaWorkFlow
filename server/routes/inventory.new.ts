import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.middleware';
import { rateLimiter } from '../middleware/rate-limit.middleware';
import { csrfProtection } from '../middleware/csrf.middleware';
import { validate } from '../middleware/validate.middleware';
import { Role } from '@prisma/client';
import * as inventoryController from '../controllers/inventory.controller.new';

// Validation schemas
export const createInventorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  categoryId: z.number().optional(),
  supplierId: z.number().optional(),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  unit: z.string().min(1, 'Unit is required'),
  costPrice: z.number().min(0, 'Cost price cannot be negative'),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
  reorderPoint: z.number().min(0, 'Reorder point cannot be negative'),
  location: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateInventorySchema = createInventorySchema.partial().extend({
  id: z.string().min(1, 'Inventory ID is required'),
});

export const adjustInventorySchema = z.object({
  quantity: z.number()
    .min(-10000, 'Adjustment quantity is too low')
    .max(10000, 'Adjustment quantity is too high')
    .refine(val => val !== 0, { message: 'Adjustment quantity cannot be zero' }),
  notes: z.string().optional(),
  type: z.enum(['ADJUSTMENT', 'RECEIVED', 'RETURNED', 'DAMAGED']).default('ADJUSTMENT'),
});

export const inventoryQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  supplier: z.string().optional(),
  minQuantity: z.string().transform(Number).optional(),
  maxQuantity: z.string().transform(Number).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  sortBy: z.string().default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
});

const router = Router();

// Apply rate limiting to all inventory routes
router.use(rateLimiter);

// Apply authentication to all routes
router.use(authenticate);

// Get all inventory items with filtering and pagination
router.get(
  '/',
  validate({ query: inventoryQuerySchema }),
  inventoryController.getInventory
);

// Get a single inventory item
router.get(
  '/:id',
  validate({ params: z.object({ id: z.string().uuid() }) }),
  inventoryController.getInventoryItem
);

// Create a new inventory item (requires INVENTORY_MANAGER role)
router.post(
  '/',
  csrfProtection,
  authenticate([Role.INVENTORY_MANAGER, Role.ADMIN]),
  validate({ body: createInventorySchema }),
  inventoryController.createInventoryItem
);

// Update an inventory item (requires INVENTORY_MANAGER role)
router.put(
  '/:id',
  csrfProtection,
  authenticate([Role.INVENTORY_MANAGER, Role.ADMIN]),
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: updateInventorySchema,
  }),
  inventoryController.updateInventoryItem
);

// Delete an inventory item (soft delete, requires INVENTORY_MANAGER role)
router.delete(
  '/:id',
  csrfProtection,
  authenticate([Role.INVENTORY_MANAGER, Role.ADMIN]),
  validate({ params: z.object({ id: z.string().uuid() }) }),
  inventoryController.deleteInventoryItem
);

// Adjust inventory quantity (requires INVENTORY_MANAGER role)
router.post(
  '/:id/adjust',
  csrfProtection,
  authenticate([Role.INVENTORY_MANAGER, Role.ADMIN]),
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: adjustInventorySchema,
  }),
  inventoryController.adjustInventoryQuantity
);

// Get inventory history for an item
router.get(
  '/:id/history',
  validate({
    params: z.object({ id: z.string().uuid() }),
    query: z.object({
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      type: z.string().optional(),
      page: z.string().default('1'),
      limit: z.string().default('10'),
    }),
  }),
  inventoryController.getInventoryHistory
);

export const inventoryRouter = router;
