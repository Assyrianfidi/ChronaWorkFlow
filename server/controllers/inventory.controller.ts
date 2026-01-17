import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiError } from '../utils/error';
import { inventoryService } from '../services/inventory.service';
import { logger } from '../utils/logger';
import {
  inventoryItemSchema,
  updateInventorySchema,
  inventoryQuerySchema,
  createInventorySchema,
  InventoryRequest,
  InventoryResponse
} from '../types/inventory.types';
import {
  apiEnvelopeSchema,
  apiSuccessMessageSchema,
  CURRENT_API_VERSION,
  API_VERSION_HEADER,
  inventoryListResponseSchema,
  parseContract,
} from '../../shared/contracts';

// Type for pagination parameters
type PaginationParams = {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

// Type for inventory filters
type InventoryFilters = {
  search?: string;
  categoryId?: string;
  supplierId?: string;
  minQuantity?: number;
  maxQuantity?: number;
  isActive?: boolean;
};

/**
 * Get all inventory items with filtering, sorting, and pagination
 */
export const getInventory = async (req: InventoryRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.tenantId) {
      throw new ApiError(401, 'Unauthorized - Missing tenant information');
    }

    // Validate and parse query parameters
    const query = inventoryQuerySchema.parse(req.query);
    
    const pagination: PaginationParams = {
      page: query.page || 1,
      limit: query.limit || 10,
      sortBy: query.sortBy || 'name',
      sortOrder: (query.sortOrder as 'asc' | 'desc') || 'asc'
    };

    const filters: InventoryFilters = {
      search: query.search,
      categoryId: query.category,
      supplierId: undefined, // Not in schema yet
      minQuantity: query.minQuantity,
      maxQuantity: query.maxQuantity,
      isActive: query.status === 'in-stock' ? true : query.status === 'out-of-stock' ? false : undefined
    };

    // Get inventory items with pagination and filters
    const result = await inventoryService.getInventoryItems(
      filters,
      pagination,
      req.user.tenantId
    );

    const payload = parseContract(
      'InventoryListResponse',
      inventoryListResponseSchema,
      {
        items: result.items,
        pagination: result.pagination,
      },
    );

    // Transform the response
    res.setHeader(API_VERSION_HEADER, CURRENT_API_VERSION);
    res.json(payload);

    res.status(200);
  } catch (error) {
    logger.error('Error fetching inventory items:', error);
    if (error instanceof Error && error.name === 'ContractViolationError') {
      next(new ApiError(500, 'Internal Server Error'));
      return;
    }
    next(error);
  }
};

/**
 * Get a single inventory item by ID
 */
export const getInventoryItem = async (req: InventoryRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.tenantId) {
      throw new ApiError(401, 'Unauthorized - Missing tenant information');
    }

    const { id } = req.params;
    const item = await inventoryService.getInventoryItem(
      id,
      req.user.tenantId
    );
    
    const payload = parseContract(
      'ApiEnvelope',
      apiEnvelopeSchema(z.unknown()),
      {
        success: true,
        data: item,
      },
    );

    res.setHeader(API_VERSION_HEADER, CURRENT_API_VERSION);
    res.status(200).json(payload);
  } catch (error) {
    logger.error(`Error fetching inventory item ${req.params.id}:`, error);
    if (error instanceof Error && error.name === 'ContractViolationError') {
      next(new ApiError(500, 'Internal Server Error'));
      return;
    }
    next(error);
  }
};

/**
 * Create a new inventory item
 */
export const createInventoryItem = async (req: InventoryRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id || !req.user?.tenantId) {
      throw new ApiError(401, 'Unauthorized - Missing user or tenant information');
    }

    const validatedData = createInventorySchema.parse(req.body);
    const result = await inventoryService.createInventoryItem(
      validatedData,
      parseInt(req.user.id, 10),
      req.user.tenantId || ''
    );

    const payload = parseContract(
      'ApiEnvelope',
      apiEnvelopeSchema(z.unknown()),
      {
        success: true,
        data: result,
        message: 'Inventory item created successfully',
      },
    );

    res.setHeader(API_VERSION_HEADER, CURRENT_API_VERSION);
    res.status(201).json(payload);
  } catch (error) {
    logger.error('Error creating inventory item:', error);
    if (error instanceof Error && error.name === 'ContractViolationError') {
      next(new ApiError(500, 'Internal Server Error'));
      return;
    }
    next(error);
  }
};

/**
 * Update an existing inventory item
 */
export const updateInventoryItem = async (req: InventoryRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id || !req.user?.tenantId) {
      throw new ApiError(401, 'Unauthorized - Missing user or tenant information');
    }

    const { id } = req.params;
    const validatedData = updateInventorySchema.parse(req.body);
    
    const result = await inventoryService.updateInventoryItem(
      id,
      validatedData,
      parseInt(req.user.id, 10),
      req.user.tenantId
    );

    const payload = parseContract(
      'ApiEnvelope',
      apiEnvelopeSchema(z.unknown()),
      {
        success: true,
        data: result,
        message: 'Inventory item updated successfully',
      },
    );

    res.setHeader(API_VERSION_HEADER, CURRENT_API_VERSION);
    res.status(200).json(payload);
  } catch (error) {
    logger.error(`Error updating inventory item ${req.params.id}:`, error);
    if (error instanceof Error && error.name === 'ContractViolationError') {
      next(new ApiError(500, 'Internal Server Error'));
      return;
    }
    next(error);
  }
};

/**
 * Delete an inventory item (soft delete)
 */
export const deleteInventoryItem = async (req: InventoryRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id || !req.user?.tenantId) {
      throw new ApiError(401, 'Unauthorized - Missing user or tenant information');
    }

    const { id } = req.params;
    await inventoryService.deleteInventoryItem(id, parseInt(req.user.id, 10), req.user.tenantId);
    
    const payload = parseContract(
      'ApiSuccessMessage',
      apiSuccessMessageSchema,
      {
        success: true,
        message: 'Inventory item deleted successfully',
      },
    );

    res.setHeader(API_VERSION_HEADER, CURRENT_API_VERSION);
    res.status(200).json(payload);
  } catch (error) {
    logger.error(`Error deleting inventory item ${req.params.id}:`, error);
    if (error instanceof Error && error.name === 'ContractViolationError') {
      next(new ApiError(500, 'Internal Server Error'));
      return;
    }
    next(error);
  }
};

/**
 * Adjust inventory quantity
 */
export const adjustInventoryQuantity = async (req: InventoryRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id || !req.user?.tenantId) {
      throw new ApiError(401, 'Unauthorized - Missing user or tenant information');
    }

    const { id } = req.params;
    const adjustSchema = z.object({
      quantity: z.number(),
      notes: z.string().optional(),
    });
    const { quantity, notes } = adjustSchema.parse(req.body);
    
    const result = await inventoryService.adjustInventoryQuantity(
      id,
      quantity,
      notes || 'Manual adjustment',
      parseInt(req.user.id, 10),
      req.user.tenantId
    );

    const payload = parseContract(
      'ApiEnvelope',
      apiEnvelopeSchema(z.unknown()),
      {
        success: true,
        data: result,
        message: 'Inventory quantity adjusted successfully',
      },
    );

    res.setHeader(API_VERSION_HEADER, CURRENT_API_VERSION);
    res.status(200).json(payload);
  } catch (error) {
    logger.error(`Error adjusting inventory quantity for item ${req.params.id}:`, error);
    if (error instanceof Error && error.name === 'ContractViolationError') {
      next(new ApiError(500, 'Internal Server Error'));
      return;
    }
    next(error);
  }
};

/**
 * Get inventory history for an item
 */
export const getInventoryHistory = async (req: InventoryRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // TODO: Implement when service supports inventory history
    const payload = parseContract(
      'ApiEnvelope',
      apiEnvelopeSchema(z.unknown()),
      {
        success: true,
        data: [],
        message: 'Inventory history not yet implemented',
      },
    );

    res.setHeader(API_VERSION_HEADER, CURRENT_API_VERSION);
    res.status(200).json(payload);
  } catch (error) {
    logger.error('Error fetching inventory history:', error);
    if (error instanceof Error && error.name === 'ContractViolationError') {
      next(new ApiError(500, 'Internal Server Error'));
      return;
    }
    next(error);
  }
};

