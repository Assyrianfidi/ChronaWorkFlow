// Mock Prisma client first (must be hoisted for vi.mock)
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
  },
  $disconnect: jest.fn(),
};

// Mock the prisma module
jest.mock("../utils/prisma", () => ({
  prisma: mockPrisma,
}));

// Mock bcrypt
const mockBcrypt = {
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
};

jest.mock("bcryptjs", () => ({
  __esModule: true,
  default: mockBcrypt,
  ...mockBcrypt,
}));

// Mock jsonwebtoken
const mockJwt = {
  sign: jest.fn(),
  verify: jest.fn(),
};

jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: mockJwt,
  ...mockJwt,
}));

// Mock ApiError (constructable)
jest.mock("../utils/errors", () => {
  class ApiErrorMock extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(statusCode: number, message: string, isOperational = true) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = isOperational;
      this.name = "ApiError";
    }
  }

  return {
    ApiError: ApiErrorMock,
  };
});

// Import after setting up mocks
let AuthServiceCtor: typeof import("../services/auth.service").AuthService;

describe("AuthService", () => {
  let authService: InstanceType<typeof AuthServiceCtor>;
  const debug = process.env.DEBUG_TESTS === "true";

  beforeAll(async () => {
    ({ AuthService: AuthServiceCtor } = await import("../services/auth.service"));
  });

  beforeEach(() => {
    // Reset all mocks between tests
    jest.clearAllMocks();

    // Set up default mock implementations
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockBcrypt.genSalt.mockResolvedValue("salt");
    mockBcrypt.hash.mockResolvedValue("hashedPassword");
    mockBcrypt.compare.mockResolvedValue(true);
    mockJwt.sign.mockReturnValue("test-token");
    mockPrisma.refreshToken.create.mockResolvedValue({ id: "rt-1" });
    mockPrisma.user.update.mockResolvedValue({ id: "1" });

    // Create a fresh instance of AuthService for each test
    authService = new AuthServiceCtor();
  });

  afterAll(async () => {
    // Clean up after all tests
    await mockPrisma.$disconnect();
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      if (debug) console.log("Starting test: should register a new user successfully");

      const userData = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      };

      if (debug) console.log("Test data:", userData);

      // Set up the mocks for this specific test
      const mockUser = {
        id: "1",
        email: userData.email,
        name: userData.name,
        password: "hashedPassword",
        isActive: true,
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.create.mockResolvedValueOnce(mockUser);

      // Call the register method
      if (debug) console.log("Calling authService.register...");
      let result;
      try {
        result = await authService.register(userData);
        if (debug) console.log("authService.register result:", result);
      } catch (error) {
        if (debug) console.error("Error in authService.register:", error);
        throw error;
      }

      // Verify the result
      if (debug) console.log("Verifying result...");
      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("tokens");
      expect(result.user).toHaveProperty("id", "1");
      expect(result.user).toHaveProperty("email", userData.email);
      expect(result.user).toHaveProperty("name", userData.name);
      expect(result.user).not.toHaveProperty("password");

      // Verify the mocks were called correctly
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email },
      });
      expect(mockBcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(userData.password, "salt");
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          password: "hashedPassword",
          name: userData.name,
          role: "USER",
          isActive: true,
        },
      });
    });
  });
});

export {};
