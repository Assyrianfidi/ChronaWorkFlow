import { Prisma } from "@prisma/client";
import { ApiError, ErrorCodes } from "./errorHandler.js";

/**
 * Pagination options interface
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
  direction?: "forward" | "backward";
}

/**
 * Sorting options interface
 */
export interface SortOptions {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  nulls?: "first" | "last";
}

/**
 * Filter options interface
 */
export interface FilterOptions {
  [key: string]: any;
}

/**
 * Pagination result interface
 */
export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
    cursor?: string;
  };
}

/**
 * Complete query options
 */
export interface QueryOptions
  extends PaginationOptions,
    SortOptions,
    FilterOptions {
  include?: any;
  select?: any;
}

/**
 * Pagination and sorting utilities
 */
export class PaginationEngine {
  /**
   * Server-side pagination with offset
   */
  static async paginateWithOffset<T>(
    model: any,
    options: QueryOptions,
    whereClause: any = {},
  ): Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    // Build where clause with filters
    const enhancedWhere = this.buildWhereClause(whereClause, options);

    // Build order by clause
    const orderBy = this.buildOrderByClause(options);

    try {
      const [data, total] = await Promise.all([
        model.findMany({
          where: enhancedWhere,
          orderBy,
          skip,
          take: limit,
          include: options.include,
          select: options.select,
        }),
        model.count({ where: enhancedWhere }),
      ]);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (error: any) {
      throw new ApiError(
        "Failed to fetch paginated data",
        500,
        ErrorCodes.DATABASE_ERROR,
        true,
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  /**
   * Cursor-based pagination for large datasets
   */
  static async paginateWithCursor<T>(
    model: any,
    options: QueryOptions,
    whereClause: any = {},
    cursorField: string = "id",
  ): Promise<{
    data: T[];
    pagination: {
      hasNext: boolean;
      hasPrev: boolean;
      nextCursor?: string;
      prevCursor?: string;
    };
  }> {
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const direction = options.direction || "forward";

    // Build where clause with cursor
    const enhancedWhere = this.buildCursorWhereClause(
      whereClause,
      options,
      cursorField,
      direction,
    );

    // Build order by clause
    const orderBy = this.buildCursorOrderByClause(
      options,
      cursorField,
      direction,
    );

    try {
      const data = await model.findMany({
        where: enhancedWhere,
        orderBy,
        take: limit + 1, // Fetch one extra to determine if there's more
        include: options.include,
        select: options.select,
      });

      const hasNext = data.length > limit;
      const hasPrev = !!options.cursor;

      // Remove the extra item if exists
      if (hasNext) {
        data.pop();
      }

      // Reverse data if going backward
      if (direction === "backward") {
        data.reverse();
      }

      const pagination: any = {
        hasNext,
        hasPrev,
      };

      // Set cursors
      if (data.length > 0) {
        if (direction === "forward") {
          pagination.nextCursor = data[data.length - 1][cursorField];
        } else {
          pagination.prevCursor = data[0][cursorField];
        }
      }

      return { data, pagination };
    } catch (error: any) {
      throw new ApiError(
        "Failed to fetch cursor paginated data",
        500,
        ErrorCodes.DATABASE_ERROR,
        true,
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  /**
   * Build where clause with filters
   */
  private static buildWhereClause(baseWhere: any, options: FilterOptions): any {
    const where = { ...baseWhere };

    // Search filter
    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: "insensitive" } },
        { description: { contains: options.search, mode: "insensitive" } },
      ];
    }

    // Date range filter
    if (options.dateRange) {
      where.timestamp = {};
      if (options.dateRange.start) {
        where.timestamp.gte = options.dateRange.start;
      }
      if (options.dateRange.end) {
        where.timestamp.lte = options.dateRange.end;
      }
    }

    // Numeric range filter
    if (options.numericRange) {
      if (
        options.numericRange.min !== undefined ||
        options.numericRange.max !== undefined
      ) {
        where.amount = {};
        if (options.numericRange.min !== undefined) {
          where.amount.gte = options.numericRange.min;
        }
        if (options.numericRange.max !== undefined) {
          where.amount.lte = options.numericRange.max;
        }
      }
    }

    // In/Not in filters
    if (options.in && options.in.length > 0) {
      where.id = { in: options.in };
    }
    if (options.notIn && options.notIn.length > 0) {
      where.id = { notIn: options.notIn };
    }

    return where;
  }

  /**
   * Build cursor-based where clause
   */
  private static buildCursorWhereClause(
    baseWhere: any,
    options: QueryOptions,
    cursorField: string,
    direction: "forward" | "backward",
  ): any {
    const where = this.buildWhereClause(baseWhere, options);

    if (options.cursor) {
      const cursorOperator = direction === "forward" ? ">" : "<";
      where[cursorField] = { [cursorOperator]: options.cursor };
    }

    return where;
  }

  /**
   * Build order by clause
   */
  private static buildOrderByClause(options: SortOptions): any[] {
    const {
      sortBy = "createdAt",
      sortOrder = "desc",
      nulls = "last",
    } = options;

    return [
      {
        [sortBy]: sortOrder,
      },
    ];
  }

  /**
   * Build cursor-based order by clause
   */
  private static buildCursorOrderByClause(
    options: SortOptions,
    cursorField: string,
    direction: "forward" | "backward",
  ): any[] {
    const { sortBy = "createdAt", sortOrder = "desc" } = options;

    // For cursor pagination, we need consistent ordering
    const primaryOrder =
      direction === "forward"
        ? sortOrder
        : sortOrder === "asc"
          ? "desc"
          : "asc";

    const orderBy = [
      {
        [sortBy]: primaryOrder,
      },
    ];

    // Add cursor field as secondary sort for uniqueness
    if (sortBy !== cursorField) {
      orderBy.push({
        [cursorField]: primaryOrder,
      });
    }

    return orderBy;
  }

  /**
   * Validate pagination parameters
   */
  static validatePaginationParams(params: any): void {
    if (params.page !== undefined && (isNaN(params.page) || params.page < 1)) {
      throw new ApiError(
        "Invalid page parameter. Must be a positive integer.",
        400,
        ErrorCodes.INVALID_INPUT,
      );
    }

    if (
      params.limit !== undefined &&
      (isNaN(params.limit) || params.limit < 1 || params.limit > 100)
    ) {
      throw new ApiError(
        "Invalid limit parameter. Must be between 1 and 100.",
        400,
        ErrorCodes.INVALID_INPUT,
      );
    }

    if (params.cursor && typeof params.cursor !== "string") {
      throw new ApiError(
        "Invalid cursor parameter. Must be a string.",
        400,
        ErrorCodes.INVALID_INPUT,
      );
    }
  }

  /**
   * Validate sort parameters
   */
  static validateSortParams(params: any, allowedFields: string[]): void {
    if (params.sortBy && !allowedFields.includes(params.sortBy)) {
      throw new ApiError(
        `Invalid sort field. Allowed fields: ${allowedFields.join(", ")}`,
        400,
        ErrorCodes.INVALID_INPUT,
      );
    }

    if (params.sortOrder && !["asc", "desc"].includes(params.sortOrder)) {
      throw new ApiError(
        'Invalid sort order. Must be "asc" or "desc".',
        400,
        ErrorCodes.INVALID_INPUT,
      );
    }
  }

  /**
   * Create pagination metadata for response
   */
  static createPaginationMeta(
    pagination: any,
    baseUrl: string,
    queryParams: any,
  ): any {
    const meta: any = {
      ...pagination,
    };

    // Add navigation links if using offset pagination
    if (pagination.page !== undefined) {
      const { page, limit, totalPages } = pagination;
      const searchParams = new URLSearchParams(queryParams);

      // Self link
      searchParams.set("page", page.toString());
      meta.self = `${baseUrl}?${searchParams.toString()}`;

      // First page
      searchParams.set("page", "1");
      meta.first = `${baseUrl}?${searchParams.toString()}`;

      // Last page
      searchParams.set("page", totalPages.toString());
      meta.last = `${baseUrl}?${searchParams.toString()}`;

      // Previous page
      if (page > 1) {
        searchParams.set("page", (page - 1).toString());
        meta.prev = `${baseUrl}?${searchParams.toString()}`;
      }

      // Next page
      if (page < totalPages) {
        searchParams.set("page", (page + 1).toString());
        meta.next = `${baseUrl}?${searchParams.toString()}`;
      }
    }

    return meta;
  }
}

/**
 * Advanced filtering utilities
 */
export class FilterEngine {
  /**
   * Build complex filters from query parameters
   */
  static buildFilters(query: any): FilterOptions {
    const filters: FilterOptions = {};

    // Search filter
    if (query.search) {
      filters.search = query.search;
    }

    // Date range filter
    if (query.startDate || query.endDate) {
      filters.dateRange = {
        start: query.startDate ? new Date(query.startDate) : undefined,
        end: query.endDate ? new Date(query.endDate) : undefined,
      };
    }

    // Numeric range filter
    if (query.minAmount !== undefined || query.maxAmount !== undefined) {
      filters.numericRange = {
        min: query.minAmount ? parseFloat(query.minAmount) : undefined,
        max: query.maxAmount ? parseFloat(query.maxAmount) : undefined,
      };
    }

    // Array filters
    if (query.ids) {
      filters.in = Array.isArray(query.ids) ? query.ids : query.ids.split(",");
    }

    if (query.excludeIds) {
      filters.notIn = Array.isArray(query.excludeIds)
        ? query.excludeIds
        : query.excludeIds.split(",");
    }

    return filters;
  }

  /**
   * Validate filter parameters
   */
  static validateFilters(filters: FilterOptions): void {
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      if (start && end && start > end) {
        throw new ApiError(
          "Start date must be before end date.",
          400,
          ErrorCodes.INVALID_INPUT,
        );
      }
    }

    if (filters.numericRange) {
      const { min, max } = filters.numericRange;
      if (min !== undefined && max !== undefined && min > max) {
        throw new ApiError(
          "Minimum value must be less than or equal to maximum value.",
          400,
          ErrorCodes.INVALID_INPUT,
        );
      }
    }
  }
}
