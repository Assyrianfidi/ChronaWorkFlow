import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Mock Prisma Client before importing RefreshTokenService
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

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Mock logger
jest.mock("../utils/logger.ts", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock crypto
jest.mock("crypto", () => ({
  __esModule: true,
  default: {
    randomBytes: jest.fn(() => ({
      toString: jest.fn(() => 'mocked-random-hex-string-64-chars-long-abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'),
    })),
    createHash: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn(() => 'mocked-sha256-hash-64-chars-long-abcdef1234567890abcdef1234567890abcdef1234567890'),
    })),
  },
}));

import { RefreshTokenService } from "../services/refreshToken.service";

describe("RefreshTokenService - Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
