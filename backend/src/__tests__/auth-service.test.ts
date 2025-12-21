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

  // Mock data
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
      // Arrange
      const userData = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      // Act
      const result = await authService.register(userData);

      // Assert
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

      // Verify password is not returned
      const { password, ...expectedUser } = mockUser;
      expect(result.user).toEqual(expectedUser);
      expect(result.tokens).toEqual(expect.any(Object));
    });

    it("should throw an error if user already exists", async () => {
      // Arrange
      const userData = {
        email: "existing@example.com",
        password: "password123",
        name: "Existing User",
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(authService.register(userData)).rejects.toThrow(
        "Email is already registered",
      );

      // Verify the error is an instance of ApiError with status code 400
      try {
        await authService.register(userData);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.statusCode).toBe(400);
        }
      }
    });
  });

  describe("login", () => {
    it("should login a user with valid credentials", async () => {
      // Arrange
      const credentials = {
        email: "test@example.com",
        password: "password123",
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await authService.login(credentials);

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: credentials.email },
      });
      const { password, ...userWithoutPassword } = mockUser;
      expect(result.user).toEqual(userWithoutPassword);
      expect(result.tokens).toEqual(expect.any(Object));
    });

    it("should throw an error for invalid credentials", async () => {
      // Arrange
      const credentials = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      bcryptCompareMock.mockResolvedValueOnce(false);

      // Act & Assert
      await expect(authService.login(credentials)).rejects.toThrow(
        "Invalid email or password",
      );

      // Verify the error is an instance of ApiError with status code 401
      try {
        await authService.login(credentials);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.statusCode).toBe(401);
        }
      }
    });
  });

  describe("getCurrentUser", () => {
    it("should return the current user", async () => {
      // Arrange
      const userId = 1;
      const expectedUser = {
        id: userId,
        email: "test@example.com",
        name: "Test User",
        role: "USER",
        isActive: true,
        passwordChangedAt: null,
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(expectedUser);

      // Act
      const result = await authService.getCurrentUser(userId);

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          passwordChangedAt: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(expectedUser);
    });

    it("should throw an error if user is not found", async () => {
      // Arrange
      const userId = 999;
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.getCurrentUser(userId)).rejects.toThrow(
        "User not found",
      );
    });
  });
});
