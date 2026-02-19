import { PrismaClientSingleton } from '../utils/prisma.js';
const prisma = PrismaClientSingleton.getInstance();
import crypto from "crypto";
import { logger } from "../utils/logger.js";

// Fixed self-reference

export class RefreshTokenService {
  private static readonly REFRESH_TOKEN_EXPIRY_DAYS = 30;
  private static readonly ACCESS_TOKEN_EXPIRY_MINUTES = 15;

  /**
   * Generate a secure refresh token
   */
  static generateRefreshToken(): string {
    return crypto.randomBytes(64).toString("hex");
  }

  /**
   * Hash a refresh token for storage
   */
  static hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Create and store a new refresh token for a user
   */
  static async createRefreshToken(userId: number): Promise<string> {
    // Invalidate all existing refresh tokens for this user
    await this.invalidateUserRefreshTokens(userId);

    const token = this.generateRefreshToken();
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS);

    try {
      await prisma.refresh_tokens.create({
        data: {
          tokenHash,
          userId,
          expiresAt,
        },
      });

      logger.info(`Refresh token created for user ${userId}`);
      return token;
    } catch (error: any) {
      logger.error(`Failed to create refresh token for user ${userId}:`, error);
      throw new Error("Failed to create refresh token");
    }
  }

  /**
   * Verify a refresh token and return the user
   */
  static async verifyRefreshToken(
    token: string,
  ): Promise<{ userId: number; user: any }> {
    const tokenHash = this.hashToken(token);

    try {
      const refreshToken = await prisma.refresh_tokens.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (!refreshToken) {
        throw new Error("Invalid refresh token");
      }

      if (refreshToken.expiresAt < new Date()) {
        // Clean up expired token
        await prisma.refresh_tokens.delete({ where: { id: refreshToken.id } });
        throw new Error("Refresh token expired");
      }

      return { userId: refreshToken.userId, user: refreshToken.user };
    } catch (error: any) {
      logger.error("Refresh token verification failed:", error);
      throw error;
    }
  }

  /**
   * Rotate refresh token - create new one and invalidate old
   */
  static async rotateRefreshToken(oldToken: string): Promise<string> {
    const { userId } = await this.verifyRefreshToken(oldToken);

    // Delete the old token
    const tokenHash = this.hashToken(oldToken);
    await prisma.refresh_tokens.deleteMany({ where: { tokenHash } });

    // Create new token
    return this.createRefreshToken(userId);
  }

  /**
   * Invalidate all refresh tokens for a user
   */
  static async invalidateUserRefreshTokens(userId: number): Promise<void> {
    try {
      await prisma.refresh_tokens.deleteMany({ where: { userId } });
      logger.info(`All refresh tokens invalidated for user ${userId}`);
    } catch (error: any) {
      logger.error(
        `Failed to invalidate refresh tokens for user ${userId}:`,
        error,
      );
      throw new Error("Failed to invalidate refresh tokens");
    }
  }

  /**
   * Invalidate a specific refresh token
   */
  static async invalidateRefreshToken(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);

    try {
      const deleted = await prisma.refresh_tokens.deleteMany({
        where: { tokenHash },
      });
      if (deleted.count === 0) {
        throw new Error("Refresh token not found");
      }
      logger.info("Refresh token invalidated");
    } catch (error: any) {
      logger.error("Failed to invalidate refresh token:", error);
      throw error;
    }
  }

  /**
   * Clean up expired refresh tokens (maintenance task)
   */
  static async cleanupExpiredTokens(): Promise<number> {
    try {
      const deleted = await prisma.refresh_tokens.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      if (deleted.count > 0) {
        logger.info(`Cleaned up ${deleted.count} expired refresh tokens`);
      }

      return deleted.count;
    } catch (error: any) {
      logger.error("Failed to cleanup expired refresh tokens:", error);
      throw new Error("Failed to cleanup expired tokens");
    }
  }

  /**
   * Get access token expiry time in minutes
   */
  static getAccessTokenExpiry(): number {
    return this.ACCESS_TOKEN_EXPIRY_MINUTES;
  }

  /**
   * Get refresh token expiry time in days
   */
  static getRefreshTokenExpiry(): number {
    return this.REFRESH_TOKEN_EXPIRY_DAYS;
  }
}
