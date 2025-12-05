import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { protect, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate.middleware';
import { authLimiter as rateLimiter } from '../middleware/auth';
// import { csrfProtection } from '../middleware/csrf.middleware';
import { ApiError } from '../utils/error';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import type { AuthRequest, UserPayload } from '../types';
import type { InventoryItem, InventoryRequest } from '../types/inventory.types';

// Import controller functions with proper types
import * as inventoryController from '../controllers/inventory.controller.new';

// Extend Express Request type to include user and other custom properties
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

// Define role-based access control
type AppRole = 'ADMIN' | 'USER' | 'INVENTORY_MANAGER' | 'ACCOUNTANT' | 'CASHIER' | 'MANAGER' | 'CUSTOMER_SERVICE' | 'VIEWER';

const ROLES: Record<AppRole, AppRole> = {
  ADMIN: 'ADMIN',
  INVENTORY_MANAGER: 'INVENTORY_MANAGER',
  USER: 'USER',
  ACCOUNTANT: 'ACCOUNTANT',
  CASHIER: 'CASHIER',
  MANAGER: 'MANAGER',
  CUSTOMER_SERVICE: 'CUSTOMER_SERVICE',
  VIEWER: 'VIEWER'
} as const;

// Validation schemas
const createInventorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  supplierId: z.string().uuid('Invalid supplier ID').optional(),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  unit: z.string().min(1, 'Unit is required'),
  costPrice: z.number().min(0, 'Cost price cannot be negative'),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
  reorderPoint: z.number().min(0, 'Reorder point cannot be negative'),
  location: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

const updateInventorySchema = createInventorySchema.partial().extend({
  id: z.string().uuid('Invalid inventory item ID'),
});

const adjustInventorySchema = z.object({
  quantity: z.number()
    .min(-10000, 'Adjustment quantity is too low')
    .max(10000, 'Adjustment quantity is too high')
    .refine(val => val !== 0, { message: 'Adjustment quantity cannot be zero' }),
  notes: z.string().optional(),
  type: z.enum(['ADJUSTMENT', 'RECEIVED', 'RETURNED', 'DAMAGED']).default('ADJUSTMENT'),
});

const inventoryQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  supplier: z.string().optional(),
  minQuantity: z.string().transform(Number).optional(),
  maxQuantity: z.string().transform(Number).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  sortBy: z.string().default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
});

const router = Router();

// Get all inventory items with pagination and filtering
router.get(
  '/',
  protect,
  authorize('ADMIN', 'INVENTORY_MANAGER', 'MANAGER', 'ACCOUNTANT', 'VIEWER'),
  validate({ query: inventoryQuerySchema }),
  (req: Request, res: Response, next: NextFunction) => {
    inventoryController.getInventory(req as any, res, next);
  }
);

// Get a single inventory item by ID
router.get(
  '/:id',
  protect,
  authorize('ADMIN', 'INVENTORY_MANAGER', 'MANAGER', 'ACCOUNTANT', 'VIEWER'),
  validate({
    params: z.object({ id: z.string().uuid('Invalid inventory item ID') })
  }),
  (req: Request, res: Response, next: NextFunction) => 
    inventoryController.getInventoryItem(req as any, res, next)
);

// Create a new inventory item
router.post(
  '/',
  protect,
  authorize('ADMIN', 'INVENTORY_MANAGER'),
  rateLimiter,
  // csrfProtection,
  validate({ body: createInventorySchema }),
  (req: Request, res: Response, next: NextFunction) => 
    inventoryController.createInventoryItem(req as any, res, next)
);

// Update an inventory item
router.put(
  '/:id',
  protect,
  authorize('ADMIN', 'INVENTORY_MANAGER'),
  rateLimiter,
  // csrfProtection,
  validate({
    params: z.object({ id: z.string().uuid('Invalid inventory item ID') }),
    body: updateInventorySchema
  }),
  (req: Request, res: Response, next: NextFunction) => 
    inventoryController.updateInventoryItem(req as any, res, next)
);

// Delete an inventory item (soft delete)
router.delete(
  '/:id',
  protect,
  authorize('ADMIN', 'INVENTORY_MANAGER'),
  rateLimiter,
  // csrfProtection,
  validate({ 
    params: z.object({ id: z.string().uuid('Invalid inventory item ID') }) 
  }),
  (req: Request, res: Response, next: NextFunction) => 
    inventoryController.deleteInventoryItem(req as any, res, next)
);

// Adjust inventory quantity
router.post(
  '/:id/adjust',
  protect,
  authorize('ADMIN', 'INVENTORY_MANAGER'),
  rateLimiter,
  // csrfProtection,
  validate({
    params: z.object({ id: z.string().uuid('Invalid inventory item ID') }),
    body: adjustInventorySchema
  }),
  (req: Request, res: Response, next: NextFunction) => 
    inventoryController.adjustInventoryQuantity(req as any, res, next)
);

// Get inventory history for an item
router.get(
  '/:id/history',
  protect,
  authorize('ADMIN', 'INVENTORY_MANAGER', 'MANAGER', 'ACCOUNTANT'),
  validate({
    params: z.object({ id: z.string().uuid('Invalid inventory item ID') }),
    query: z.object({
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      limit: z.string().regex(/^\d+$/).transform(Number).optional()
    })
  }),
  (req: Request, res: Response, next: NextFunction) => 
    inventoryController.getInventoryHistory(req as any, res, next)
);

// Export the router and types
export { router as inventoryRouter };
export type { AppRole, InventoryRequest };
export { ROLES, createInventorySchema, updateInventorySchema, adjustInventorySchema, inventoryQuerySchema };
