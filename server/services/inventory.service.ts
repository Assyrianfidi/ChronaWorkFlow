import { prisma, PrismaClient } from '../prisma';
import { z } from 'zod';
import { inventoryItemSchema } from '../types/inventory.types';
import { ApiError } from '../utils/error';

export class InventoryService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  async createInventoryItem(
    data: z.infer<typeof inventoryItemSchema>,
    userId: number,
    tenantId: string
  ) {
    // Validate input data
    const validatedData = inventoryItemSchema.parse(data);

    // Check if SKU already exists
    const existingItem = await this.prisma.inventoryItem.findUnique({
      where: { sku: validatedData.sku, deletedAt: null },
    });

    if (existingItem) {
      throw new ApiError(400, 'An item with this SKU already exists');
    }

    // Create the inventory item
    const item = await this.prisma.inventoryItem.create({
      data: {
        ...validatedData,
        tenantId,
        createdById: userId,
      },
    });

    return item;
  }

  async updateInventoryItem(
    id: string,
    data: Partial<z.infer<typeof inventoryItemSchema>>,
    userId: number,
    tenantId: string
  ) {
    // Find the existing item
    const existingItem = await this.prisma.inventoryItem.findUnique({
      where: { id, tenantId, deletedAt: null },
    });

    if (!existingItem) {
      throw new ApiError(404, 'Inventory item not found');
    }

    // Validate and prepare update data
    const updateData = { ...data };
    delete (updateData as any).id; // Prevent ID changes
    delete (updateData as any).tenantId; // Prevent tenant ID changes
    delete (updateData as any).createdById; // Prevent createdBy changes

    // Update the item
    const item = await this.prisma.inventoryItem.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
        updatedById: userId,
      },
    });

    return item;
  }

  async deleteInventoryItem(
    id: string,
    userId: number,
    tenantId: string
  ) {
    // Find the existing item
    const existingItem = await this.prisma.inventoryItem.findUnique({
      where: { id, tenantId, deletedAt: null },
    });

    if (!existingItem) {
      throw new ApiError(404, 'Inventory item not found');
    }

    // Soft delete the item
    const item = await this.prisma.inventoryItem.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
    });

    return item;
  }

  async getInventoryItem(
    id: string,
    tenantId: string
  ) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!item) {
      throw new ApiError(404, 'Inventory item not found');
    }

    return item;
  }

  async getInventoryItems(
    filters: {
      search?: string;
      categoryId?: string;
      supplierId?: string;
      minQuantity?: number;
      maxQuantity?: number;
      isActive?: boolean;
    },
    pagination: {
      page: number;
      limit: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
    tenantId: string
  ) {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    // Build where conditions
    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
        { barcode: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.minQuantity !== undefined || filters.maxQuantity !== undefined) {
      where.quantity = {};
      if (filters.minQuantity !== undefined) {
        where.quantity.gte = filters.minQuantity;
      }
      if (filters.maxQuantity !== undefined) {
        where.quantity.lte = filters.maxQuantity;
      }
    }

    if (filters.isActive !== undefined) {
      // For now, assume all items are active if isActive is true
      // This would need to be adjusted based on the actual schema
    }

    // Get total count
    const total = await this.prisma.inventoryItem.count({ where });

    // Get items
    const items = await this.prisma.inventoryItem.findMany({
      where,
      orderBy: {
        [pagination.sortBy || 'createdAt']: pagination.sortOrder || 'desc',
      },
      skip: offset,
      take: limit,
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async adjustInventoryQuantity(
    id: string,
    adjustment: number,
    notes?: string,
    userId?: number,
    tenantId?: string
  ) {
    const existingItem = await this.prisma.inventoryItem.findUnique({
      where: { id, tenantId, deletedAt: null },
    });

    if (!existingItem) {
      throw new ApiError(404, 'Inventory item not found');
    }

    const newQuantity = existingItem.quantity + adjustment;
    if (newQuantity < 0) {
      throw new ApiError(400, 'Insufficient inventory');
    }

    // Update the item quantity
    const item = await this.prisma.inventoryItem.update({
      where: { id },
      data: {
        quantity: newQuantity,
        updatedAt: new Date(),
        updatedById: userId,
      },
    });

    return item;
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}

export const inventoryService = new InventoryService();
