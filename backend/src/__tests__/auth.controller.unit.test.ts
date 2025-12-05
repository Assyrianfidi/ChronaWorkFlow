import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

// Mock all dependencies before importing auth controller
const mockAuthService = {
  login: jest.fn(),
  register: jest.fn(),
  generateAccessToken: jest.fn(),
  changePassword: jest.fn(),
};

const mockRefreshTokenService = {
  createRefreshToken: jest.fn(),
  rotateRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  invalidateRefreshToken: jest.fn(),
  invalidateUserRefreshTokens: jest.fn(),
  getRefreshTokenExpiry: jest.fn(() => 30),
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

const mockApiError = jest.fn();

jest.mock('../services/auth.service', () => ({
  authService: mockAuthService,
}));

jest.mock('../services/refreshToken.service.ts', () => ({
  RefreshTokenService: mockRefreshTokenService,
}));

jest.mock('../utils/logger.ts', () => ({
  logger: mockLogger,
}));

jest.mock('../utils/errors', () => ({
  ApiError: mockApiError,
}));

jest.mock('../middleware/errorHandler.js', () => ({}));

describe('Auth Controller - Unit Tests', () => {
  let login: any, register: any, refreshToken: any, logout: any, logoutAll: any, changePassword: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeAll(async () => {
    // Import after mocking
    const authControllerModule = await import('../controllers/auth.controller.js');
    ({
      login,
      register,
      refreshToken,
      logout,
      logoutAll,
      changePassword
    } = authControllerModule);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock request/response
    mockRequest = {
      body: {},
      cookies: {},
      ip: '127.0.0.1',
      user: { id: 1, role: 'USER' as const },
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      send: jest.fn(),
    };
    
    nextFunction = jest.fn();
  });

  describe('login', () => {
    it('should login user and set refresh token cookie', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
      const mockTokens = { accessToken: 'access-token', expiresIn: 900 };
      const mockRefreshToken = 'refresh-token';

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockAuthService.login.mockResolvedValue({ user: mockUser, tokens: mockTokens });
      mockRefreshTokenService.createRefreshToken.mockResolvedValue(mockRefreshToken);

      await login(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockRefreshTokenService.createRefreshToken).toHaveBeenCalledWith(1);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        mockRefreshToken,
        expect.objectContaining({
          httpOnly: true,
          secure: false, // NODE_ENV is test
          sameSite: 'strict',
          path: '/',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: mockUser,
          accessToken: 'access-token',
          expiresIn: 900,
        },
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'User logged in: test@example.com (ID: 1) from IP: 127.0.0.1'
      );
    });

    it('should handle login failure', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      await login(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Login failed for email: test@example.com from IP: 127.0.0.1'
      );
    });

    it('should validate request body', async () => {
      mockRequest.body = {
        email: 'invalid-email',
        password: '123', // Too short
      };

      await login(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: StatusCodes.BAD_REQUEST,
        })
      );
    });
  });

  describe('register', () => {
    it('should register new user and set refresh token cookie', async () => {
      const mockUser = { id: 2, email: 'new@example.com', name: 'New User' };
      const mockTokens = { accessToken: 'access-token', expiresIn: 900 };
      const mockRefreshToken = 'refresh-token';

      mockRequest.body = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      };

      mockAuthService.register.mockResolvedValue({ user: mockUser, tokens: mockTokens });
      mockRefreshTokenService.createRefreshToken.mockResolvedValue(mockRefreshToken);

      await register(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockAuthService.register).toHaveBeenCalledWith({
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      });

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: mockUser,
          accessToken: 'access-token',
          expiresIn: 900,
        },
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'User registered: new@example.com (ID: 2) from IP: 127.0.0.1'
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token with valid refresh token', async () => {
      const mockRefreshToken = 'valid-refresh-token';
      const mockNewRefreshToken = 'new-refresh-token';
      const mockUser = { id: 1, email: 'test@example.com', role: 'USER' };
      const mockTokens = { accessToken: 'new-access-token', expiresIn: 900 };

      mockRequest.cookies = { refreshToken: mockRefreshToken };

      mockRefreshTokenService.rotateRefreshToken.mockResolvedValue(mockNewRefreshToken);
      mockRefreshTokenService.verifyRefreshToken.mockResolvedValue({ user: mockUser });
      mockAuthService.generateAccessToken.mockResolvedValue(mockTokens);

      await refreshToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRefreshTokenService.rotateRefreshToken).toHaveBeenCalledWith(mockRefreshToken);
      expect(mockRefreshTokenService.verifyRefreshToken).toHaveBeenCalledWith(mockNewRefreshToken);
      expect(mockAuthService.generateAccessToken).toHaveBeenCalledWith(mockUser);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        mockNewRefreshToken,
        expect.any(Object)
      );

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          accessToken: 'new-access-token',
          expiresIn: 900,
        },
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Token refreshed for user: test@example.com (ID: 1) from IP: 127.0.0.1'
      );
    });

    it('should reject missing refresh token', async () => {
      mockRequest.cookies = {};

      await refreshToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: StatusCodes.UNAUTHORIZED,
          message: 'No refresh token provided',
        })
      );
    });

    it('should handle refresh token failure and clear cookie', async () => {
      mockRequest.cookies = { refreshToken: 'invalid-token' };

      mockRefreshTokenService.rotateRefreshToken.mockRejectedValue(new Error('Invalid token'));

      await refreshToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          path: '/',
        })
      );

      expect(mockLogger.error).toHaveBeenCalledWith('Token refresh failed from IP: 127.0.0.1');
    });
  });

  describe('logout', () => {
    it('should logout user and clear refresh token', async () => {
      const mockRefreshToken = 'valid-refresh-token';
      mockRequest.cookies = { refreshToken: mockRefreshToken };

      mockRefreshTokenService.invalidateRefreshToken.mockResolvedValue(undefined);

      await logout(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRefreshTokenService.invalidateRefreshToken).toHaveBeenCalledWith(mockRefreshToken);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          path: '/',
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.NO_CONTENT);
      expect(mockResponse.send).toHaveBeenCalled();

      expect(mockLogger.info).toHaveBeenCalledWith('User logged out from IP: 127.0.0.1');
    });

    it('should handle logout without refresh token', async () => {
      mockRequest.cookies = {};

      await logout(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRefreshTokenService.invalidateRefreshToken).not.toHaveBeenCalled();
      expect(mockResponse.clearCookie).toHaveBeenCalled();
    });
  });

  describe('logoutAll', () => {
    it('should logout user from all sessions', async () => {
      mockRequest.user = { id: 1, role: 'USER' as const };

      mockRefreshTokenService.invalidateUserRefreshTokens.mockResolvedValue(undefined);

      await logoutAll(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRefreshTokenService.invalidateUserRefreshTokens).toHaveBeenCalledWith(1);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          path: '/',
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.NO_CONTENT);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'User logged out from all sessions - User ID: 1 from IP: 127.0.0.1'
      );
    });

    it('should require authentication', async () => {
      mockRequest.user = undefined;

      await logoutAll(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: StatusCodes.UNAUTHORIZED,
          message: 'Not authenticated',
        })
      );
    });
  });

  describe('changePassword', () => {
    it('should change password and invalidate all refresh tokens', async () => {
      mockRequest.user = { id: 1, role: 'USER' as const };
      mockRequest.body = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
      };

      mockAuthService.changePassword.mockResolvedValue(undefined);
      mockRefreshTokenService.invalidateUserRefreshTokens.mockResolvedValue(undefined);

      await changePassword(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockAuthService.changePassword).toHaveBeenCalledWith(1, 'oldpassword', 'newpassword123');
      expect(mockRefreshTokenService.invalidateUserRefreshTokens).toHaveBeenCalledWith(1);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          path: '/',
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.NO_CONTENT);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Password changed for user ID: 1 from IP: 127.0.0.1'
      );
    });

    it('should require authentication', async () => {
      mockRequest.user = undefined;

      await changePassword(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: StatusCodes.UNAUTHORIZED,
          message: 'Not authenticated',
        })
      );
    });

    it('should validate password format', async () => {
      mockRequest.user = { id: 1, role: 'USER' as const };
      mockRequest.body = {
        currentPassword: 'oldpassword',
        newPassword: 'weak', // Too short
      };

      await changePassword(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: StatusCodes.BAD_REQUEST,
        })
      );
    });
  });
});
