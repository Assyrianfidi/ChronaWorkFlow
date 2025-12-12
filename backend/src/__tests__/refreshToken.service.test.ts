import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { PrismaClient } from "@prisma/client";
import { RefreshTokenService } from "../services/refreshToken.service.js";

const prisma = new PrismaClient();

describe("RefreshTokenService", () => {
  let testUser: any;
  let testUserId: number;

  beforeEach(async () => {
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

    // Clean up any existing refresh tokens for this user
    await prisma.refreshToken.deleteMany({ where: { userId: testUserId } });
  });

  afterEach(async () => {
    // Clean up refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId: testUserId } });

    // Clean up test user
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
      // Create multiple tokens
      const token1 = await RefreshTokenService.createRefreshToken(testUserId);
      const token2 = await RefreshTokenService.createRefreshToken(testUserId);

      const hash1 = RefreshTokenService.hashToken(token1);
      const hash2 = RefreshTokenService.hashToken(token2);

      // Verify tokens exist
      expect(
        await prisma.refreshToken.findUnique({ where: { tokenHash: hash1 } }),
      ).toBeTruthy();
      expect(
        await prisma.refreshToken.findUnique({ where: { tokenHash: hash2 } }),
      ).toBeTruthy();

      // Invalidate all tokens
      await RefreshTokenService.invalidateUserRefreshTokens(testUserId);

      // All tokens should be gone
      expect(
        await prisma.refreshToken.findUnique({ where: { tokenHash: hash1 } }),
      ).toBeFalsy();
      expect(
        await prisma.refreshToken.findUnique({ where: { tokenHash: hash2 } }),
      ).toBeFalsy();
    });
  });

  describe("invalidateRefreshToken", () => {
    it("should invalidate specific token", async () => {
      const token1 = await RefreshTokenService.createRefreshToken(testUserId);
      const token2 = await RefreshTokenService.createRefreshToken(testUserId);

      const hash1 = RefreshTokenService.hashToken(token1);
      const hash2 = RefreshTokenService.hashToken(token2);

      // Verify tokens exist
      expect(
        await prisma.refreshToken.findUnique({ where: { tokenHash: hash1 } }),
      ).toBeTruthy();
      expect(
        await prisma.refreshToken.findUnique({ where: { tokenHash: hash2 } }),
      ).toBeTruthy();

      // Invalidate only token1
      await RefreshTokenService.invalidateRefreshToken(token1);

      // Only token1 should be gone
      expect(
        await prisma.refreshToken.findUnique({ where: { tokenHash: hash1 } }),
      ).toBeFalsy();
      expect(
        await prisma.refreshToken.findUnique({ where: { tokenHash: hash2 } }),
      ).toBeTruthy();
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

      // Create another valid token
      const validToken =
        await RefreshTokenService.createRefreshToken(testUserId);
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
