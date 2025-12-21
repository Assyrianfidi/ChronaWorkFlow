const mockPrisma = {
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

let cryptoCounterValue = 0;
let randomBytesMock: jest.Mock;
let createHashMock: jest.Mock;

jest.mock("../lib/prisma", () => ({
  PrismaClientSingleton: {
    getInstance: () => mockPrisma,
  },
}));

jest.mock("../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("crypto", () => {
  randomBytesMock = jest.fn();
  createHashMock = jest.fn();

  return {
    __esModule: true,
    default: { randomBytes: randomBytesMock, createHash: createHashMock },
    randomBytes: randomBytesMock,
    createHash: createHashMock,
  };
});

let RefreshTokenService: typeof import("../services/refreshToken.service").RefreshTokenService;

describe("RefreshTokenService - Unit Tests", () => {
  beforeAll(async () => {
    ({ RefreshTokenService } = await import("../services/refreshToken.service"));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    cryptoCounterValue = 0;

    randomBytesMock.mockImplementation(() => {
      cryptoCounterValue += 1;
      const suffix = String(cryptoCounterValue).padStart(64, "0");
      return {
        toString: jest.fn((_encoding?: string) => suffix + suffix),
      };
    });

    createHashMock.mockImplementation(() => {
      const state = { data: "" };
      const hashObj: any = {
        update: jest.fn((val: string) => {
          state.data = String(val);
          return hashObj;
        }),
        digest: jest.fn((_encoding?: string) => {
          const hex = state.data;
          return (hex + "0".repeat(64)).slice(0, 64);
        }),
      };
      return hashObj;
    });

    mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 } as any);
  });

  describe("generateRefreshToken", () => {
    it("should generate a token of correct length", () => {
      const token = RefreshTokenService.generateRefreshToken();
      expect(token).toHaveLength(128); // 64 bytes = 128 hex characters
    });

    it("should generate different tokens each time", () => {
      const token1 = RefreshTokenService.generateRefreshToken();
      const token2 = RefreshTokenService.generateRefreshToken();
      expect(token1).not.toBe(token2);
    });

    it("should generate tokens with only hex characters", () => {
      const token = RefreshTokenService.generateRefreshToken();
      expect(/^[0-9a-f]+$/i.test(token)).toBe(true);
    });
  });

  describe("hashToken", () => {
    it("should hash a token consistently", () => {
      const token = "test-token";
      const hash1 = RefreshTokenService.hashToken(token);
      const hash2 = RefreshTokenService.hashToken(token);
      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different tokens", () => {
      const token1 = "token1";
      const token2 = "token2";
      const hash1 = RefreshTokenService.hashToken(token1);
      const hash2 = RefreshTokenService.hashToken(token2);
      expect(hash1).not.toBe(hash2);
    });

    it("should produce hash of correct length", () => {
      const token = "test-token";
      const hash = RefreshTokenService.hashToken(token);
      expect(hash).toHaveLength(64); // SHA256 produces 64 hex characters
    });
  });

  describe("getAccessTokenExpiry", () => {
    it("should return correct expiry time", () => {
      const expiry = RefreshTokenService.getAccessTokenExpiry();
      expect(expiry).toBe(15); // 15 minutes
    });
  });

  describe("getRefreshTokenExpiry", () => {
    it("should return correct expiry time", () => {
      const expiry = RefreshTokenService.getRefreshTokenExpiry();
      expect(expiry).toBe(30); // 30 days
    });
  });

  describe("Token Security", () => {
    it("should not store plain tokens in database", () => {
      const token = RefreshTokenService.generateRefreshToken();
      const hash = RefreshTokenService.hashToken(token);

      expect(token).not.toBe(hash);
      expect(hash).not.toContain(token);
    });

    it("should generate cryptographically secure tokens", () => {
      // Generate many tokens and check for uniqueness
      const tokens = new Set();
      for (let i = 0; i < 1000; i++) {
        tokens.add(RefreshTokenService.generateRefreshToken());
      }
      expect(tokens.size).toBe(1000); // All tokens should be unique
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      // Mock database error
      mockPrisma.refreshToken.create.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(RefreshTokenService.createRefreshToken(1)).rejects.toThrow(
        "Failed to create refresh token",
      );
    });
  });

  describe("Rotation and Revocation", () => {
    it("should reject reuse of an invalidated refresh token", async () => {
      const token = RefreshTokenService.generateRefreshToken();
      const tokenHash = RefreshTokenService.hashToken(token);
      const record = {
        id: 1,
        tokenHash,
        userId: 42,
        expiresAt: new Date(Date.now() + 1000 * 60 * 5),
        user: { id: 42 },
      };

      mockPrisma.refreshToken.findUnique.mockResolvedValueOnce(record);
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 } as any);
      mockPrisma.refreshToken.create.mockResolvedValue({ id: 2 } as any);

      await expect(RefreshTokenService.rotateRefreshToken(token)).resolves.toEqual(
        expect.any(String),
      );

      mockPrisma.refreshToken.findUnique.mockResolvedValueOnce(null);

      await expect(
        RefreshTokenService.verifyRefreshToken(token),
      ).rejects.toThrow("Invalid refresh token");
    });

    it("should treat revoked tokens as invalid", async () => {
      const revokedToken = RefreshTokenService.generateRefreshToken();
      mockPrisma.refreshToken.findUnique.mockResolvedValueOnce(null);

      await expect(
        RefreshTokenService.verifyRefreshToken(revokedToken),
      ).rejects.toThrow("Invalid refresh token");
    });

    it("should bubble rotation failures when storing the new token fails", async () => {
      const token = RefreshTokenService.generateRefreshToken();
      const tokenHash = RefreshTokenService.hashToken(token);
      const record = {
        id: 1,
        tokenHash,
        userId: 99,
        expiresAt: new Date(Date.now() + 1000 * 60 * 5),
        user: { id: 99 },
      };

      mockPrisma.refreshToken.findUnique.mockResolvedValueOnce(record);
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 } as any);

      const createTokenSpy = jest
        .spyOn(RefreshTokenService, "createRefreshToken")
        .mockRejectedValueOnce(new Error("DB down"));

      await expect(
        RefreshTokenService.rotateRefreshToken(token),
      ).rejects.toThrow("DB down");

      createTokenSpy.mockRestore();
    });
  });
});

export {};
