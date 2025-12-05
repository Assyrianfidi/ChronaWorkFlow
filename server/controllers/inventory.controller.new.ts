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
import { Request, Response, NextFunction } from 'express';

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
  category?: string;
  status?: 'in-stock' | 'low-stock' | 'out-of-stock';
  minQuantity?: number;
  maxQuantity?: number;
};

// Type for sortable fields
type SortableField = 'name' | 'sku' | 'quantity' | 'costPrice' | 'sellingPrice' | 'createdAt' | 'updatedAt';

// Type for sort direction
type SortDirection = 'asc' | 'desc';

/**
 * Get all inventory items with filtering, sorting, and pagination
 */
export const getInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.tenantId) {
      throw new ApiError(401, 'Unauthorized - Missing tenant information');
    }

    const validatedQuery = inventoryQuerySchema.parse(req.query);
    const pagination: PaginationParams = {
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      sortBy: validatedQuery.sortBy,
      sortOrder: validatedQuery.sortOrder
    };

    const filters: InventoryFilters = {
      search: validatedQuery.search,
      category: validatedQuery.category,
      status: validatedQuery.status,
      minQuantity: validatedQuery.minQuantity,
      maxQuantity: validatedQuery.maxQuantity
    };

    const result = await inventoryService.getInventoryItems(
      {
        search: filters.search,
        categoryId: filters.category,
        minQuantity: filters.minQuantity,
        maxQuantity: filters.maxQuantity
      },
      pagination,
      req.user!.tenantId
    );

    res.status(200).json({
      success: true,
      data: result.items,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.pagination.total,
        totalPages: Math.ceil(result.pagination.total / pagination.limit)
      }
    });
    res.status(200);
  } catch (error) {
    logger.error('Error fetching inventory items:', error);
    next(error);
  }
};

/**
 * Get a single inventory item by ID
 */
export const getInventoryItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.tenantId) {
      throw new ApiError(401, 'Unauthorized - Missing tenant information');
    }

    const { id } = req.params;
    const item = await inventoryService.getInventoryItem(
      id,
      req.user!.tenantId
    );
    
    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    logger.error(`Error fetching inventory item ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Create a new inventory item
 */
export const createInventoryItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.tenantId || !req.user?.id) {
      throw new ApiError(401, 'Unauthorized - Missing user information');
    }

    const validatedData = createInventorySchema.parse(req.body);
    const item = await inventoryService.createInventoryItem(
      validatedData,
      parseInt(req.user.id, 10),
      req.user!.tenantId
    );

    res.status(201).json({
      success: true,
      data: item
    });
  } catch (error) {
    logger.error('Error creating inventory item:', error);
    next(error);
  }
};

/**
 * Update an existing inventory item
 */
export const updateInventoryItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.tenantId || !req.user?.id) {
      throw new ApiError(401, 'Unauthorized - Missing user information');
    }

    const { id } = req.params;
    const validatedData = updateInventorySchema.parse(req.body);
    const item = await inventoryService.updateInventoryItem(
      id,
      validatedData,
      parseInt(req.user.id, 10),
      req.user!.tenantId
    );

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    logger.error(`Error updating inventory item ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Delete an inventory item
 */
export const deleteInventoryItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.tenantId || !req.user?.id) {
      throw new ApiError(401, 'Unauthorized - Missing user information');
    }

    const { id } = req.params;
    await inventoryService.deleteInventoryItem(id, parseInt(req.user.id, 10), req.user!.tenantId);

    res.status(200).json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting inventory item ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Adjust inventory quantity
 */
export const adjustInventoryQuantity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.tenantId || !req.user?.id) {
      throw new ApiError(401, 'Unauthorized - Missing user information');
    }

    const { id } = req.params;
    const { quantity, notes } = req.body;
    const adjustment = await inventoryService.adjustInventoryQuantity(
      id,
      quantity,
      notes || 'Manual adjustment',
      parseInt(req.user.id, 10),
      req.user!.tenantId
    );

    res.status(200).json({
      success: true,
      data: adjustment
    });
  } catch (error) {
    logger.error(`Error adjusting inventory quantity for item ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Get inventory history/audit trail
 */
export const getInventoryHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.tenantId) {
      throw new ApiError(401, 'Unauthorized - Missing tenant information');
    }

    // TODO: Implement inventory history fetching
    res.status(200).json({
      success: true,
      data: [],
      message: 'Inventory history not yet implemented'
    });
  } catch (error) {
    logger.error('Error fetching inventory history:', error);
    next(error);
  }
};
