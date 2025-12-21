const store = {
  userIdSeq: 1,
  refreshTokenIdSeq: 1,
  users: new Map<number, any>(),
  refreshTokensByHash: new Map<
    string,
    { id: number; tokenHash: string; userId: number; expiresAt: Date; user: any }
  >(),
};

const mockPrisma = {
  user: {
    create: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
};

const loggerInfoMock = jest.fn();
const loggerErrorMock = jest.fn();

const cryptoCounter = { value: 0 };
const randomBytesToStringMock = jest.fn();
const cryptoRandomBytesMock = jest.fn();
const cryptoCreateHashMock = jest.fn();

jest.mock("../lib/prisma", () => ({
  PrismaClientSingleton: {
    getInstance: () => mockPrisma,
  },
}));

jest.mock("../utils/logger", () => ({
  logger: {
    info: loggerInfoMock,
    error: loggerErrorMock,
  },
}));

jest.mock("crypto", () => {
  return {
    __esModule: true,
    default: {
      randomBytes: cryptoRandomBytesMock,
      createHash: cryptoCreateHashMock,
    },
    randomBytes: cryptoRandomBytesMock,
    createHash: cryptoCreateHashMock,
  };
});

let RefreshTokenService: typeof import("../services/refreshToken.service").RefreshTokenService;

const prisma = mockPrisma;

beforeAll(async () => {
  const mod = await import("../services/refreshToken.service");
  RefreshTokenService = mod.RefreshTokenService;
});

describe("RefreshTokenService", () => {
  let testUser: any;
  let testUserId: number;

  beforeEach(async () => {
    store.userIdSeq = 1;
    store.refreshTokenIdSeq = 1;
    store.users.clear();
    store.refreshTokensByHash.clear();

    cryptoCounter.value = 0;

    randomBytesToStringMock.mockImplementation(() => {
      const suffix = String(cryptoCounter.value).padStart(64, "0");
      return suffix + suffix;
    });

    cryptoRandomBytesMock.mockImplementation(() => {
      cryptoCounter.value += 1;
      return {
        toString: randomBytesToStringMock,
      };
    });

    cryptoCreateHashMock.mockImplementation(() => {
      const state = { data: "" };
      const hashObj: any = {
        update: jest.fn((val: string) => {
          state.data = String(val);
          return hashObj;
        }),
        digest: jest.fn(() => {
          const hex = state.data;
          return (hex + "0".repeat(64)).slice(0, 64);
        }),
      };
      return hashObj;
    });

    mockPrisma.user.create.mockImplementation(async ({ data }: any) => {
      const id = store.userIdSeq++;
      const user = {
        id,
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      };
      store.users.set(id, user);
      return user;
    });

    mockPrisma.user.delete.mockImplementation(async ({ where }: any) => {
      const user = store.users.get(where.id);
      store.users.delete(where.id);
      for (const [hash, rt] of store.refreshTokensByHash.entries()) {
        if (rt.userId === where.id) {
          store.refreshTokensByHash.delete(hash);
        }
      }
      return user;
    });

    mockPrisma.user.findUnique.mockImplementation(async ({ where }: any) => {
      return store.users.get(where.id) ?? null;
    });

    mockPrisma.refreshToken.create.mockImplementation(async ({ data }: any) => {
      const user = store.users.get(data.userId);
      const record = {
        id: store.refreshTokenIdSeq++,
        tokenHash: data.tokenHash,
        userId: data.userId,
        expiresAt: data.expiresAt,
        user,
      };
      store.refreshTokensByHash.set(data.tokenHash, record);
      return record;
    });

    mockPrisma.refreshToken.findUnique.mockImplementation(
      async ({ where, include }: any) => {
        const rt = store.refreshTokensByHash.get(where.tokenHash) ?? null;
        if (!rt) return null;
        if (include?.user) return rt;
        const { user, ...rest } = rt;
        return rest;
      },
    );

    mockPrisma.refreshToken.deleteMany.mockImplementation(async ({ where }: any) => {
      let count = 0;
      for (const [hash, rt] of store.refreshTokensByHash.entries()) {
        const byUserId =
          where?.userId !== undefined ? rt.userId === where.userId : true;
        const byTokenHash = where?.tokenHash ? rt.tokenHash === where.tokenHash : true;
        const byExpiresAtLt = where?.expiresAt?.lt
          ? rt.expiresAt < where.expiresAt.lt
          : true;

        if (byUserId && byTokenHash && byExpiresAtLt) {
          store.refreshTokensByHash.delete(hash);
          count += 1;
        }
      }

      return { count };
    });

    mockPrisma.refreshToken.delete.mockImplementation(async ({ where }: any) => {
      for (const [hash, rt] of store.refreshTokensByHash.entries()) {
        if (rt.id === where.id) {
          store.refreshTokensByHash.delete(hash);
          return rt;
        }
      }
      return null;
    });

    mockPrisma.refreshToken.update.mockImplementation(async ({ where, data }: any) => {
      const rt = store.refreshTokensByHash.get(where.tokenHash);
      if (!rt) throw new Error("RefreshToken not found");
      const updated = { ...rt, ...data };
      store.refreshTokensByHash.set(where.tokenHash, updated);
      return updated;
    });

    // Create a test user
    testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: `test-${Date.now()}@example.com`,
        password: "hashedpassword",
        role: "USER",
      },
    });
    testUserId = testUser.id;
  });

  afterEach(async () => {
    await prisma.refreshToken.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
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
  });

  describe("createRefreshToken", () => {
    it("should create a refresh token for user", async () => {
      const token = await RefreshTokenService.createRefreshToken(testUserId);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token).toHaveLength(128);

      // Verify token is stored in database
      const tokenHash = RefreshTokenService.hashToken(token);
      const storedToken = await prisma.refreshToken.findUnique({
        where: { tokenHash },
      });

      expect(storedToken).toBeTruthy();
      expect(storedToken?.userId).toBe(testUserId);
    });

    it("should invalidate existing tokens when creating new one", async () => {
      // Create first token
      const token1 = await RefreshTokenService.createRefreshToken(testUserId);
      const hash1 = RefreshTokenService.hashToken(token1);

      // Verify first token exists
      let storedToken = await prisma.refreshToken.findUnique({
        where: { tokenHash: hash1 },
      });
      expect(storedToken).toBeTruthy();

      // Create second token
      const token2 = await RefreshTokenService.createRefreshToken(testUserId);

      // First token should be invalidated
      storedToken = await prisma.refreshToken.findUnique({
        where: { tokenHash: hash1 },
      });
      expect(storedToken).toBeFalsy();

      // Second token should exist
      const hash2 = RefreshTokenService.hashToken(token2);
      storedToken = await prisma.refreshToken.findUnique({
        where: { tokenHash: hash2 },
      });
      expect(storedToken).toBeTruthy();
    });

    it("should set correct expiry date", async () => {
      const token = await RefreshTokenService.createRefreshToken(testUserId);
      const tokenHash = RefreshTokenService.hashToken(token);

      const storedToken = await prisma.refreshToken.findUnique({
        where: { tokenHash },
      });

      const expectedExpiry = new Date();
      expectedExpiry.setDate(
        expectedExpiry.getDate() + RefreshTokenService.getRefreshTokenExpiry(),
      );

      // Allow 1 minute difference
      const timeDiff = Math.abs(
        (storedToken?.expiresAt?.getTime() || 0) - expectedExpiry.getTime(),
      );
      expect(timeDiff).toBeLessThan(60000); // Less than 1 minute
    });
  });

  describe("verifyRefreshToken", () => {
    it("should verify a valid token", async () => {
      const token = await RefreshTokenService.createRefreshToken(testUserId);

      const result = await RefreshTokenService.verifyRefreshToken(token);

      expect(result.userId).toBe(testUserId);
      expect(result.user).toBeTruthy();
      expect(result.user.id).toBe(testUserId);
    });

    it("should reject invalid token", async () => {
      await expect(
        RefreshTokenService.verifyRefreshToken("invalid-token"),
      ).rejects.toThrow("Invalid refresh token");
    });

    it("should reject expired token", async () => {
      const token = await RefreshTokenService.createRefreshToken(testUserId);
      const tokenHash = RefreshTokenService.hashToken(token);

      // Manually set expiry to past
      await prisma.refreshToken.update({
        where: { tokenHash },
        data: { expiresAt: new Date(Date.now() - 1000) }, // 1 second ago
      });

      await expect(
        RefreshTokenService.verifyRefreshToken(token),
      ).rejects.toThrow("Refresh token expired");

      // Token should be cleaned up
      const storedToken = await prisma.refreshToken.findUnique({
        where: { tokenHash },
      });
      expect(storedToken).toBeFalsy();
    });
  });

  describe("rotateRefreshToken", () => {
    it("should rotate a valid token", async () => {
      const oldToken = await RefreshTokenService.createRefreshToken(testUserId);
      const oldHash = RefreshTokenService.hashToken(oldToken);

      const newToken = await RefreshTokenService.rotateRefreshToken(oldToken);

      expect(newToken).toBeDefined();
      expect(newToken).not.toBe(oldToken);
      expect(typeof newToken).toBe("string");

      // Old token should be invalidated
      const oldStored = await prisma.refreshToken.findUnique({
        where: { tokenHash: oldHash },
      });
      expect(oldStored).toBeFalsy();

      // New token should be valid
      const result = await RefreshTokenService.verifyRefreshToken(newToken);
      expect(result.userId).toBe(testUserId);
    });

    it("should reject rotation of invalid token", async () => {
      await expect(
        RefreshTokenService.rotateRefreshToken("invalid-token"),
      ).rejects.toThrow("Invalid refresh token");
    });
  });

  describe("invalidateUserRefreshTokens", () => {
    it("should invalidate all user tokens", async () => {
      // createRefreshToken invalidates existing tokens, so only one active token
      const token = await RefreshTokenService.createRefreshToken(testUserId);
      const tokenHash = RefreshTokenService.hashToken(token);

      expect(
        await prisma.refreshToken.findUnique({ where: { tokenHash } }),
      ).toBeTruthy();

      // Invalidate all tokens
      await RefreshTokenService.invalidateUserRefreshTokens(testUserId);

      // All tokens should be gone
      expect(
        await prisma.refreshToken.findUnique({ where: { tokenHash } }),
      ).toBeFalsy();
    });
  });

  describe("invalidateRefreshToken", () => {
    it("should invalidate specific token", async () => {
      const token = await RefreshTokenService.createRefreshToken(testUserId);
      const tokenHash = RefreshTokenService.hashToken(token);

      expect(
        await prisma.refreshToken.findUnique({ where: { tokenHash } }),
      ).toBeTruthy();

      await RefreshTokenService.invalidateRefreshToken(token);

      expect(
        await prisma.refreshToken.findUnique({ where: { tokenHash } }),
      ).toBeFalsy();
    });

    it("should throw error for non-existent token", async () => {
      await expect(
        RefreshTokenService.invalidateRefreshToken("non-existent-token"),
      ).rejects.toThrow("Refresh token not found");
    });
  });

  describe("cleanupExpiredTokens", () => {
    it("should clean up expired tokens", async () => {
      // Create a token and manually expire it
      const token = await RefreshTokenService.createRefreshToken(testUserId);
      const tokenHash = RefreshTokenService.hashToken(token);

      await prisma.refreshToken.update({
        where: { tokenHash },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      // Create another valid token for a different user (so it doesn't invalidate the expired one)
      const user2 = await prisma.user.create({
        data: {
          name: "Test User 2",
          email: `test2-${Date.now()}@example.com`,
          password: "hashedpassword",
          role: "USER",
        },
      });
      const user2Id = user2.id;
      const validToken = await RefreshTokenService.createRefreshToken(user2Id);
      const validHash = RefreshTokenService.hashToken(validToken);

      // Run cleanup
      const deletedCount = await RefreshTokenService.cleanupExpiredTokens();

      expect(deletedCount).toBe(1);

      // Expired token should be gone
      expect(
        await prisma.refreshToken.findUnique({ where: { tokenHash } }),
      ).toBeFalsy();

      // Valid token should remain
      expect(
        await prisma.refreshToken.findUnique({
          where: { tokenHash: validHash },
        }),
      ).toBeTruthy();

      await prisma.refreshToken.deleteMany({ where: { userId: user2Id } });
      await prisma.user.delete({ where: { id: user2Id } });
    });

    it("should return 0 when no expired tokens exist", async () => {
      const deletedCount = await RefreshTokenService.cleanupExpiredTokens();
      expect(deletedCount).toBe(0);
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
});

export {};
