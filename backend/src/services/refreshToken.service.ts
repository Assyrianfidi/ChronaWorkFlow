import crypto from "crypto";
import { logger } from "../utils/logger.js";

// In-memory implementation - refresh_tokens table not in Prisma schema
// TODO: Add refresh_tokens model to schema.prisma for production persistence
const tokenStore = new Map<string, { userId: string; expiresAt: Date; isValid: boolean }>();

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
   * Create a new refresh token for a user
   */
  static async createRefreshToken(userId: number): Promise<string> {
    await this.invalidateUserRefreshTokens(userId);

    const token = this.generateRefreshToken();
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS);

    tokenStore.set(tokenHash, { userId: String(userId), expiresAt, isValid: true });
    logger.info(`Refresh token created for user ${userId}`);
    return token;
  }

  /**
   * Verify a refresh token and return the user
   */
  static async verifyRefreshToken(
    token: string,
  ): Promise<{ userId: number; user: any }> {
    const tokenHash = this.hashToken(token);
    const stored = tokenStore.get(tokenHash);

    if (!stored || !stored.isValid) {
      throw new Error("Invalid refresh token");
    }

    if (stored.expiresAt < new Date()) {
      tokenStore.delete(tokenHash);
      throw new Error("Refresh token expired");
    }

    return { userId: parseInt(stored.userId), user: { id: parseInt(stored.userId) } };
  }

  /**
   * Rotate refresh token - create new one and invalidate old
   */
  static async rotateRefreshToken(oldToken: string): Promise<string> {
    const { userId } = await this.verifyRefreshToken(oldToken);
    const tokenHash = this.hashToken(oldToken);
    tokenStore.delete(tokenHash);
    return this.createRefreshToken(userId);
  }

  /**
   * Invalidate all refresh tokens for a user
   */
  static async invalidateUserRefreshTokens(userId: number): Promise<void> {
    for (const [hash, data] of tokenStore.entries()) {
      if (data.userId === String(userId)) {
        tokenStore.delete(hash);
      }
    }
    logger.info(`All refresh tokens invalidated for user ${userId}`);
  }

  /**
   * Invalidate a specific refresh token
   */
  static async invalidateRefreshToken(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    if (!tokenStore.delete(tokenHash)) {
      throw new Error("Refresh token not found");
    }
    logger.info("Refresh token invalidated");
  }

  /**
   * Clean up expired refresh tokens (maintenance task)
   */
  static async cleanupExpiredTokens(): Promise<number> {
    let count = 0;
    const now = new Date();
    for (const [hash, data] of tokenStore.entries()) {
      if (data.expiresAt < now) {
        tokenStore.delete(hash);
        count++;
      }
    }
    if (count > 0) {
      logger.info(`Cleaned up ${count} expired refresh tokens`);
    }
    return count;
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
