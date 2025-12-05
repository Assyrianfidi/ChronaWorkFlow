import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { ApiError } from '../../utils/error';

// Mock the verifyJwt function
vi.mock('../../utils/jwt', () => ({
  verifyJwt: vi.fn(),
}));

// Mock the prisma client
vi.mock('../../prisma', () => ({
  user: {
    findUnique: vi.fn(),
  },
}));

const { verifyJwt } = await import('../../utils/jwt');
const { prisma } = await import('../../prisma');

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const nextFunction: NextFunction = vi.fn();

  beforeEach(() => {
    mockRequest = {
      headers: {},
      cookies: {},
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should return 401 if no token is provided', async () => {
      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
    });

    it('should return 401 for invalid token', async () => {
      mockRequest = {
        ...mockRequest,
        headers: {
          authorization: 'Bearer invalidtoken',
        },
      };

      (verifyJwt as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired token',
      });
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

      (verifyJwt as jest.Mock).mockReturnValue({ userId: 'user123' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toEqual(mockUser);
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
      
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient permissions',
      });
    });

    it('should handle missing user object', () => {
      mockRequest.user = undefined;
      
      const middleware = authorize(requiredRoles);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
    });
  });
});
