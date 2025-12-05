import { z } from 'zod';
import { AuthRequest } from './index';

// Base inventory item type
export interface InventoryItem {
  id: string;
  name: string;
  description?: string | null;
  sku: string;
  barcode?: string | null;
  categoryId?: string | null;
  supplierId?: string | null;
  quantity: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  reorderPoint: number;
  location?: string | null;
  notes?: string | null;
  isActive: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response types
export interface InventoryRequest extends AuthRequest {
  body: Partial<InventoryItem> & { id?: string };
  query: {
    page?: string;
    limit?: string;
    search?: string;
    category?: string;
    status?: 'in-stock' | 'low-stock' | 'out-of-stock';
    minQuantity?: string;
    maxQuantity?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
  params: {
    id?: string;
  };
}

export interface InventoryResponse extends Express.Response {
  locals: {
    inventoryItem?: InventoryItem;
  };
}

// Zod validation schemas
export const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  sku: z.string().min(1, 'SKU is required').max(50),
  barcode: z.string().max(100).optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  supplierId: z.string().uuid('Invalid supplier ID').optional(),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  unit: z.string().min(1, 'Unit is required').max(20),
  costPrice: z.number().min(0, 'Cost price cannot be negative'),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
  reorderPoint: z.number().int().min(0, 'Reorder point cannot be negative'),
  location: z.string().max(100).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const createInventorySchema = inventoryItemSchema;

export const updateInventorySchema = inventoryItemSchema.partial().extend({
  id: z.string().uuid('Invalid inventory item ID'),
});

export const inventoryQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).default('1').transform(Number),
  limit: z.string().regex(/^\d+$/).default('10').transform(Number),
  search: z.string().optional(),
  category: z.string().uuid('Invalid category ID').optional(),
  status: z.enum(['in-stock', 'low-stock', 'out-of-stock']).optional(),
  minQuantity: z.string().regex(/^\d+$/).optional().transform(Number),
  maxQuantity: z.string().regex(/^\d+$/).optional().transform(Number),
  sortBy: z.enum(['name', 'quantity', 'updatedAt', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Type guards
export function isInventoryItem(item: unknown): item is InventoryItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    'name' in item &&
    'sku' in item &&
    'quantity' in item &&
    'unit' in item &&
    'costPrice' in item &&
    'sellingPrice' in item &&
    'reorderPoint' in item &&
    'isActive' in item &&
    'tenantId' in item
  );
}

export function isInventoryRequest(req: unknown): req is InventoryRequest {
  return (
    typeof req === 'object' &&
    req !== null &&
    'user' in req &&
    'body' in req &&
    'query' in req
  );
}
