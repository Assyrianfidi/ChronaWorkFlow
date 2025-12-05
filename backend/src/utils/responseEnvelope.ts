import { Response } from 'express';
import { config } from '../config/config.js';

/**
 * Standard API response envelope
 */
export interface ApiResponse<T = any> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
    version: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    warnings?: string[];
  };
}

/**
 * Success response helper
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: {
    requestId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    warnings?: string[];
  }
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: meta?.requestId,
      version: process.env.npm_package_version || '1.0.0',
    },
  };

  if (meta?.pagination) {
    response.meta!.pagination = meta.pagination;
  }

  if (meta?.warnings && meta.warnings.length > 0) {
    response.meta!.warnings = meta.warnings;
  }

  return res.status(statusCode).json(response);
};

/**
 * Paginated response helper
 */
export const sendPaginatedResponse = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  requestId?: string
): Response => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return sendSuccess(res, data, 200, {
    requestId,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    },
  });
};

/**
 * Created response helper (201)
 */
export const sendCreated = <T>(
  res: Response,
  data: T,
  requestId?: string
): Response => {
  return sendSuccess(res, data, 201, { requestId });
};

/**
 * No content response helper (204)
 */
export const sendNoContent = (res: Response): Response => {
  return res.status(204).end();
};

/**
 * Partial content response helper (206)
 */
export const sendPartial = <T>(
  res: Response,
  data: T,
  requestId?: string,
  warnings?: string[]
): Response => {
  return sendSuccess(res, data, 206, { requestId, warnings });
};
