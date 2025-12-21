const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
};

let bcryptGenSaltMock: jest.Mock;
let bcryptHashMock: jest.Mock;
let bcryptCompareMock: jest.Mock;

let jwtSignMock: jest.Mock;
let jwtVerifyMock: jest.Mock;
let TokenExpiredErrorCtor: any;

jest.mock("../utils/prisma", () => ({ prisma: mockPrisma }));

jest.mock("bcryptjs", () => {
  bcryptGenSaltMock = jest.fn();
  bcryptHashMock = jest.fn();
  bcryptCompareMock = jest.fn();

  return {
    __esModule: true,
    default: {
      genSalt: bcryptGenSaltMock,
      hash: bcryptHashMock,
      compare: bcryptCompareMock,
    },
    genSalt: bcryptGenSaltMock,
    hash: bcryptHashMock,
    compare: bcryptCompareMock,
  };
});

jest.mock("jsonwebtoken", () => {
  class TokenExpiredError extends Error {}
  class JsonWebTokenError extends Error {}

  TokenExpiredErrorCtor = TokenExpiredError;

  jwtSignMock = jest.fn();
  jwtVerifyMock = jest.fn();

  return {
    __esModule: true,
    default: {
      sign: jwtSignMock,
      verify: jwtVerifyMock,
      TokenExpiredError,
      JsonWebTokenError,
    },
    sign: jwtSignMock,
    verify: jwtVerifyMock,
    TokenExpiredError,
    JsonWebTokenError,
  };
});

jest.mock("../config/config", () => ({
  config: {
    jwt: {
      secret: "test-secret",
      refreshSecret: "test-refresh-secret",
    },
  },
}));

let AuthService: any;
let ApiError: any;

describe("AuthService", () => {
  beforeAll(async () => {
    ({ AuthService } = await import("../services/auth.service"));
    ({ ApiError } = await import("../utils/errors"));
  });

  let authService: any;

  const mockUser = {
    id: 1,
    email: "test@example.com",
    name: "Test User",
    password: "hashedPassword",
    role: "USER",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // resetMocks:true resets implementations; re-apply defaults each test
    bcryptGenSaltMock.mockImplementation(async () => "salt");
    bcryptHashMock.mockImplementation(async () => "hashedPassword");
    bcryptCompareMock.mockImplementation(async () => true);
    jwtSignMock.mockImplementation(() => "test-token");
    jwtVerifyMock.mockImplementation(() => ({ userId: 1, type: "refresh" }));

    authService = new AuthService();

    mockPrisma.refreshToken.create.mockResolvedValue({ id: 1 });
    mockPrisma.user.update.mockResolvedValue({ ...mockUser, lastLogin: new Date() });
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      };

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValueOnce(mockUser);

      const result = await authService.register(userData);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email },
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          password: "hashedPassword",
          name: userData.name,
          role: "USER",
          isActive: true,
        },
      });

      const { password, ...expectedUser } = mockUser;
      expect(result.user).toEqual(expectedUser);
      expect(result.tokens).toEqual(expect.any(Object));
    });

    it("should throw an error if user already exists", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const userData = {
        email: "existing@example.com",
        password: "password123",
        name: "Existing User",
      };

      await expect(authService.register(userData)).rejects.toThrow(
        "Email is already registered",
      );

      try {
        await authService.register(userData);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.statusCode).toBe(400);
        }
      }
    });
  });

  describe("login", () => {
    it("should login a user with valid credentials", async () => {
      const credentials = {
        email: "test@example.com",
        password: "password123",
      };

      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

      const result = await authService.login(credentials);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: credentials.email },
      });

      const { password, ...userWithoutPassword } = mockUser;
      expect(result.user).toEqual(userWithoutPassword);
      expect(result.tokens).toEqual(expect.any(Object));
    });

    it("should throw an error for invalid credentials", async () => {
      const credentials = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

      bcryptCompareMock.mockResolvedValueOnce(false);

      await expect(authService.login(credentials)).rejects.toThrow(
        "Invalid email or password",
      );

      try {
        await authService.login(credentials);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.statusCode).toBe(401);
        }
      }
    });

    it("should throw an error when user is not found", async () => {
      const credentials = {
        email: "missing@example.com",
        password: "password123",
      };

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(authService.login(credentials)).rejects.toThrow(
        "Invalid email or password",
      );
    });

    it("should throw an error when user is inactive", async () => {
      const credentials = {
        email: "inactive@example.com",
        password: "password123",
      };

      mockPrisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        isActive: false,
      });

      await expect(authService.login(credentials)).rejects.toThrow(
        "Invalid email or password",
      );
    });

    it("should surface access token generation failures", async () => {
      const credentials = {
        email: "test@example.com",
        password: "password123",
      };

      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      jwtSignMock.mockImplementationOnce(() => {
        throw new Error("sign failed");
      });

      await expect(authService.login(credentials)).rejects.toThrow("sign failed");
    });

    it("should surface refresh token generation failures", async () => {
      const credentials = {
        email: "test@example.com",
        password: "password123",
      };

      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      // access token sign succeeds, refresh token sign fails
      jwtSignMock
        .mockImplementationOnce(() => "access-token")
        .mockImplementationOnce(() => {
          throw new Error("refresh sign failed");
        });

      await expect(authService.login(credentials)).rejects.toThrow(
        "refresh sign failed",
      );
    });
  });

  describe("refreshToken", () => {
    it("should reject tokens with wrong type", async () => {
      jwtVerifyMock.mockImplementationOnce(() => ({ userId: 1, type: "access" }));

      await expect(authService.refreshToken("rt"))
        .rejects.toThrow("Invalid refresh token");
    });

    it("should reject refresh token not found in DB (revoked/expired)", async () => {
      jwtVerifyMock.mockImplementationOnce(() => ({ userId: 1, type: "refresh" }));
      mockPrisma.refreshToken.findFirst.mockResolvedValueOnce(null);

      await expect(authService.refreshToken("rt"))
        .rejects.toThrow("Invalid refresh token");
    });

    it("should reject when user for token record is missing", async () => {
      jwtVerifyMock.mockImplementationOnce(() => ({ userId: 1, type: "refresh" }));
      mockPrisma.refreshToken.findFirst.mockResolvedValueOnce({
        id: 123,
        userId: 999,
      });
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(authService.refreshToken("rt"))
        .rejects.toThrow("Invalid refresh token");
    });

    it("should delete expired token record and throw Refresh token expired", async () => {
      jwtVerifyMock.mockImplementationOnce(() => {
        throw new TokenExpiredErrorCtor("expired");
      });

      await expect(authService.refreshToken("expired-rt")).rejects.toThrow(
        "Refresh token expired",
      );
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { tokenHash: "expired-rt" },
      });
    });

    it("should reject empty refresh token input", async () => {
      jwtVerifyMock.mockImplementationOnce(() => {
        throw new Error("jwt must be provided");
      });

      await expect(authService.refreshToken("")).rejects.toThrow(
        "Invalid refresh token",
      );
    });

    it("should reject malformed refresh token input", async () => {
      jwtVerifyMock.mockImplementationOnce(() => {
        throw new Error("malformed token");
      });

      await expect(authService.refreshToken("malformed-rt")).rejects.toThrow(
        "Invalid refresh token",
      );
    });

    it("should not delete old token when generateAuthTokens fails", async () => {
      const generateSpy = jest
        .spyOn(AuthService.prototype as any, "generateAuthTokens")
        .mockRejectedValueOnce(new Error("boom"));

      mockPrisma.refreshToken.findFirst.mockResolvedValueOnce({
        id: 456,
        userId: mockUser.id,
      });
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

      await expect(authService.refreshToken("valid-rt")).rejects.toThrow(
        ApiError,
      );
      expect(mockPrisma.refreshToken.delete).not.toHaveBeenCalled();

      generateSpy.mockRestore();
    });

    it("should refresh tokens when the refresh token is valid", async () => {
      const tokens = {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresIn: 900,
      };

      const generateSpy = jest
        .spyOn(AuthService.prototype as any, "generateAuthTokens")
        .mockResolvedValue(tokens);

      mockPrisma.refreshToken.findFirst.mockResolvedValueOnce({
        id: 123,
        userId: mockUser.id,
      });
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      mockPrisma.refreshToken.delete.mockResolvedValueOnce({} as any);

      try {
        const result = await authService.refreshToken("valid-rt");
        expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({
          where: { id: 123 },
        });
        expect(result).toEqual(tokens);
      } finally {
        generateSpy.mockRestore();
      }
    });
  });
});
