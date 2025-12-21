import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../../utils/error';

vi.mock('../../prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

const { prisma } = await import('../../prisma');
const { authenticate, authorize } = await import('../../middleware/auth.middleware');

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const nextFunction: NextFunction = vi.fn();

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    mockRequest = {
      headers: {},
      cookies: {},
    };
    mockResponse = {};
    vi.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should return 401 if no token is provided', async () => {
      const middleware = authenticate();
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      const err = (nextFunction as any).mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).statusCode).toBe(401);
    });

    it('should return 401 for invalid token', async () => {
      mockRequest = {
        ...mockRequest,
        headers: {
          authorization: 'Bearer invalidtoken',
        },
      };

      vi.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new (jwt as any).JsonWebTokenError('Invalid token');
      });

      const middleware = authenticate();
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      const err = (nextFunction as any).mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).statusCode).toBe(401);
      expect((err as ApiError).message).toBe('Invalid token');
    });

    it('should call next() for valid token', async () => {
      const mockUser = {
        id: 'user123',
        role: 'USER',
        tenantId: 'tenant123',
      };

      mockRequest = {
        ...mockRequest,
        headers: {
          authorization: 'Bearer validtoken',
        },
      };

      vi.spyOn(jwt, 'verify').mockReturnValue({ id: 'user123', role: 'USER', tenantId: 'tenant123' } as any);
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const middleware = authenticate();
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect((nextFunction as any).mock.calls[0][0]).toBeUndefined();
      expect((mockRequest as any).user).toEqual({
        id: mockUser.id,
        role: mockUser.role,
        tenantId: mockUser.tenantId,
      });
    });
  });

  describe('authorize', () => {
    const requiredRoles = ['ADMIN', 'MANAGER'];
    
    it('should call next() if user has required role', () => {
      mockRequest.user = {
        id: 'user123',
        role: 'ADMIN',
        tenantId: 'tenant123',
      };

      const middleware = authorize(requiredRoles);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 403 if user does not have required role', () => {
      mockRequest.user = {
        id: 'user123',
        role: 'USER',
        tenantId: 'tenant123',
      };

      const middleware = authorize(requiredRoles);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      const err = (nextFunction as any).mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).statusCode).toBe(403);
    });

    it('should handle missing user object', () => {
      mockRequest.user = undefined;
      
      const middleware = authorize(requiredRoles);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      const err = (nextFunction as any).mock.calls[0][0];
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).statusCode).toBe(401);
    });
  });
});
