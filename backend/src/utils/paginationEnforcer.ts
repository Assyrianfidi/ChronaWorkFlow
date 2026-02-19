/**
 * PRODUCTION HARDENING: Pagination Enforcement Utility
 * Ensures all collection endpoints implement pagination to prevent OOM
 * 
 * Usage:
 *   const paginated = enforcePagination(req.query);
 *   const results = await prisma.model.findMany({
 *     skip: paginated.skip,
 *     take: paginated.take
 *   });
 *   return formatPaginatedResponse(results, total, paginated);
 */

import { Request } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100; // Prevent excessive data retrieval

/**
 * Enforces pagination parameters with safe defaults
 * @param query Request query parameters
 * @returns Validated pagination parameters
 */
export function enforcePagination(query: any): PaginationParams {
  const page = Math.max(1, parseInt(query.page as string) || DEFAULT_PAGE);
  let limit = parseInt(query.limit as string) || DEFAULT_LIMIT;
  
  // Enforce maximum limit to prevent abuse
  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }
  
  // Ensure positive limit
  if (limit < 1) {
    limit = DEFAULT_LIMIT;
  }
  
  const skip = (page - 1) * limit;
  
  return {
    page,
    limit,
    skip,
    take: limit
  };
}

/**
 * Formats paginated response with metadata
 * @param data Retrieved data array
 * @param total Total count of records
 * @param params Pagination parameters
 * @returns Formatted paginated response
 */
export function formatPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit);
  
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1
    }
  };
}

/**
 * Extracts pagination from Express request
 * @param req Express request object
 * @returns Pagination parameters
 */
export function getPaginationFromRequest(req: Request): PaginationParams {
  return enforcePagination(req.query);
}
