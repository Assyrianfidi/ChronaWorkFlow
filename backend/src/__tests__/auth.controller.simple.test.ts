import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

// Mock all dependencies
const authLoginMock = jest.fn();
const authRegisterMock = jest.fn();
const authGenerateAccessTokenMock = jest.fn();
const authChangePasswordMock = jest.fn();

const refreshCreateRefreshTokenMock = jest.fn();
const refreshRotateRefreshTokenMock = jest.fn();
const refreshVerifyRefreshTokenMock = jest.fn();
const refreshInvalidateRefreshTokenMock = jest.fn();
const refreshInvalidateUserRefreshTokensMock = jest.fn();
const refreshGetRefreshTokenExpiryMock = jest.fn();

const loggerInfoMock = jest.fn();
const loggerErrorMock = jest.fn();

const auditLogAuthEventMock = jest.fn();

const mockAuthService = {
  login: authLoginMock,
  register: authRegisterMock,
  generateAccessToken: authGenerateAccessTokenMock,
  changePassword: authChangePasswordMock,
};

const mockRefreshTokenService = {
  createRefreshToken: refreshCreateRefreshTokenMock,
  rotateRefreshToken: refreshRotateRefreshTokenMock,
  verifyRefreshToken: refreshVerifyRefreshTokenMock,
  invalidateRefreshToken: refreshInvalidateRefreshTokenMock,
  invalidateUserRefreshTokens: refreshInvalidateUserRefreshTokensMock,
  getRefreshTokenExpiry: refreshGetRefreshTokenExpiryMock,
};

const mockLogger = {
  info: loggerInfoMock,
  error: loggerErrorMock,
};

jest.mock("../services/auth.service", () => ({
  authService: mockAuthService,
}));

jest.mock("../services/refreshToken.service", () => ({
  RefreshTokenService: mockRefreshTokenService,
}));

jest.mock("../utils/logger", () => ({
  logger: mockLogger,
}));

jest.mock("../config/config", () => ({
  config: {
    jwt: {
      secret: "test-secret",
    },
  },
}));

jest.mock("../services/auditLogger.service", () => ({
  __esModule: true,
  default: {
    logAuthEvent: auditLogAuthEventMock,
  },
}));

describe("Auth Controller - Simple Tests", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    refreshGetRefreshTokenExpiryMock.mockImplementation(() => 30);
    auditLogAuthEventMock.mockResolvedValue(undefined);

    // Setup mock request/response
    mockRequest = {
      body: {},
      cookies: {},
      ip: "127.0.0.1",
      user: { id: 1, role: "USER" as const },
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

  describe("login", () => {
    it("should login user successfully", async () => {
      // Import dynamically to avoid circular dependencies
      const { login } = await import("../controllers/auth.controller.ts");

      const mockUser = { id: 1, email: "test@example.com", name: "Test User" };
      const mockTokens = { accessToken: "access-token", expiresIn: 900 };
      const mockRefreshToken = "refresh-token";

      mockRequest.body = {
        email: "test@example.com",
        password: "password123",
      };

      mockAuthService.login.mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });
      mockRefreshTokenService.createRefreshToken.mockResolvedValue(
        mockRefreshToken,
      );

      await login(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });

      expect(mockRefreshTokenService.createRefreshToken).toHaveBeenCalledWith(
        1,
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        "refreshToken",
        mockRefreshToken,
        expect.objectContaining({
          httpOnly: true,
          secure: false, // NODE_ENV is test
          sameSite: "strict",
          path: "/",
        }),
      );

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: mockUser,
          accessToken: "access-token",
          expiresIn: 900,
        },
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        "User logged in: test@example.com (ID: 1) from IP: 127.0.0.1",
      );
    });

    it("should handle validation errors", async () => {
      const { login } = await import("../controllers/auth.controller.ts");

      mockRequest.body = {
        email: "invalid-email",
        password: "123", // Too short
      };

      await login(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: StatusCodes.BAD_REQUEST,
        }),
      );
    });

    it("should handle authentication errors", async () => {
      const { login } = await import("../controllers/auth.controller.ts");

      mockRequest.body = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      mockAuthService.login.mockRejectedValue(new Error("Invalid credentials"));

      await login(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Login failed for email: test@example.com from IP: 127.0.0.1",
      );
    });
  });

  describe("register", () => {
    it("should register new user successfully", async () => {
      const { register } = await import("../controllers/auth.controller.ts");

      const mockUser = { id: 2, email: "new@example.com", name: "New User" };
      const mockTokens = { accessToken: "access-token", expiresIn: 900 };
      const mockRefreshToken = "refresh-token";

      mockRequest.body = {
        name: "New User",
        email: "new@example.com",
        password: "password123",
      };

      mockAuthService.register.mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });
      mockRefreshTokenService.createRefreshToken.mockResolvedValue(
        mockRefreshToken,
      );

      await register(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockAuthService.register).toHaveBeenCalledWith({
        name: "New User",
        email: "new@example.com",
        password: "password123",
      });

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: mockUser,
          accessToken: "access-token",
          expiresIn: 900,
        },
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        "User registered: new@example.com (ID: 2) from IP: 127.0.0.1",
      );
    });
  });

  describe("refreshToken", () => {
    it("should refresh access token successfully", async () => {
      const authModule = await import("../controllers/auth.controller.ts");
      const { refreshToken } = authModule;

      const mockRefreshToken = "valid-refresh-token";
      const mockNewRefreshToken = "new-refresh-token";
      const mockUser = { id: 1, email: "test@example.com", role: "USER" };
      const mockTokens = { accessToken: "new-access-token", expiresIn: 900 };

      mockRequest.cookies = { refreshToken: mockRefreshToken };

      mockRefreshTokenService.rotateRefreshToken.mockResolvedValue(
        mockNewRefreshToken,
      );
      mockRefreshTokenService.verifyRefreshToken.mockResolvedValue({
        user: mockUser,
      });
      mockAuthService.generateAccessToken.mockResolvedValue(mockTokens);

      await refreshToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockRefreshTokenService.rotateRefreshToken).toHaveBeenCalledWith(
        mockRefreshToken,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          accessToken: "new-access-token",
          expiresIn: 900,
        },
      });
    });

    it("should reject missing refresh token", async () => {
      const { refreshToken } = await import(
        "../controllers/auth.controller.ts"
      );

      mockRequest.cookies = {};

      await refreshToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: StatusCodes.UNAUTHORIZED,
          message: "No refresh token provided",
        }),
      );
    });
  });

  describe("logout", () => {
    it("should logout user successfully", async () => {
      const { logout } = await import("../controllers/auth.controller.ts");

      const mockRefreshToken = "valid-refresh-token";
      mockRequest.cookies = { refreshToken: mockRefreshToken };

      mockRefreshTokenService.invalidateRefreshToken.mockResolvedValue(
        undefined,
      );

      await logout(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(
        mockRefreshTokenService.invalidateRefreshToken,
      ).toHaveBeenCalledWith(mockRefreshToken);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        "refreshToken",
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: "strict",
          path: "/",
        }),
      );

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.NO_CONTENT);
      expect(mockResponse.send).toHaveBeenCalled();

      expect(mockLogger.info).toHaveBeenCalledWith(
        "User logged out from IP: 127.0.0.1",
      );
    });
  });

  describe("logoutAll", () => {
    it("should logout from all sessions", async () => {
      const { logoutAll } = await import("../controllers/auth.controller.ts");

      mockRequest.user = { id: 1, role: "USER" as const };

      mockRefreshTokenService.invalidateUserRefreshTokens.mockResolvedValue(
        undefined,
      );

      await logoutAll(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(
        mockRefreshTokenService.invalidateUserRefreshTokens,
      ).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.NO_CONTENT);

      expect(mockLogger.info).toHaveBeenCalledWith(
        "User logged out from all sessions - User ID: 1 from IP: 127.0.0.1",
      );
    });

    it("should require authentication", async () => {
      const { logoutAll } = await import("../controllers/auth.controller.ts");

      mockRequest.user = undefined;

      await logoutAll(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: StatusCodes.UNAUTHORIZED,
          message: "Not authenticated",
        }),
      );
    });
  });

  describe("changePassword", () => {
    it("should change password successfully", async () => {
      const { changePassword } = await import(
        "../controllers/auth.controller.ts"
      );

      mockRequest.user = { id: 1, role: "USER" as const };
      mockRequest.body = {
        currentPassword: "oldpassword",
        newPassword: "newpassword123",
      };

      mockAuthService.changePassword.mockResolvedValue(undefined);
      mockRefreshTokenService.invalidateUserRefreshTokens.mockResolvedValue(
        undefined,
      );

      await changePassword(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockAuthService.changePassword).toHaveBeenCalledWith(
        1,
        "oldpassword",
        "newpassword123",
      );
      expect(
        mockRefreshTokenService.invalidateUserRefreshTokens,
      ).toHaveBeenCalledWith(1);

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.NO_CONTENT);

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Password changed for user ID: 1 from IP: 127.0.0.1",
      );
    });

    it("should require authentication", async () => {
      const { changePassword } = await import(
        "../controllers/auth.controller.ts"
      );

      mockRequest.user = undefined;

      await changePassword(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: StatusCodes.UNAUTHORIZED,
          message: "Not authenticated",
        }),
      );
    });
  });
});
