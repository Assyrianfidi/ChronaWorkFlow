import { Request, Response, NextFunction } from 'express';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const DEFAULT_OFFSET = 0;

export interface PaginationParams {
  limit: number;
  offset: number;
  page: number;
}

/**
 * Pagination middleware.
 * Parses and validates `limit`, `offset`, and `page` query params.
 * Enforces a maximum limit cap to prevent unbounded queries.
 * Attaches validated pagination params to `req.pagination`.
 */
export const paginationMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const rawLimit = Number(req.query.limit || 10);
  const rawOffset = Number(req.query.offset || 0);
  const rawPage = Number(req.query.page || 1);

  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(rawLimit, MAX_LIMIT)
    : DEFAULT_LIMIT;

  let offset: number;
  if (Number.isFinite(rawPage) && rawPage > 0) {
    offset = (rawPage - 1) * limit;
  } else if (Number.isFinite(rawOffset) && rawOffset >= 0) {
    offset = rawOffset;
  } else {
    offset = DEFAULT_OFFSET;
  }

  const page = Math.floor(offset / limit) + 1;

  (req as any).pagination = { limit, offset, page } as PaginationParams;

  next();
};

/**
 * Helper to build a standardized paginated response envelope.
 */
export const paginatedResponse = <T>(
  data: T[],
  total: number,
  pagination: PaginationParams,
) => ({
  data,
  pagination: {
    page: pagination.page,
    limit: pagination.limit,
    offset: pagination.offset,
    total,
    totalPages: Math.ceil(total / pagination.limit),
    hasNext: pagination.offset + pagination.limit < total,
    hasPrev: pagination.offset > 0,
  },
});
