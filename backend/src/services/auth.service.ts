// @ts-ignore
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { PrismaClient, User } from "@prisma/client";
import { config } from "../config/config";
import { ApiError } from "../utils/errors";

// Define Role enum to match Prisma schema
export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  AUDITOR = "AUDITOR",
}

type UserWithRole = Omit<User, "role"> & {
  role: UserRole;
  currentCompanyId?: string | null;
  deletedAt?: Date | null;
};

import { prisma } from "../utils/prisma";

// Token expiration times (in seconds)
const ACCESS_TOKEN_EXPIRES_IN = 15 * 60; // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60; // 7 days

// Token payload interface
interface TokenPayload extends jwt.JwtPayload {
  userId: number;
  role: UserRole;
  type: "access" | "refresh";
  iat: number;
  exp: number;
}

// Auth tokens interface
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Generate access token
export const generateAccessToken = (
  user: UserWithRole,
): { accessToken: string; expiresIn: number } => {
  if (!config.jwt?.secret) {
    throw new Error("JWT secret is not configured");
  }

  const accessToken = jwt.sign(
    {
      userId: user.id,
      role: user.role,
      type: "access",
    },
    config.jwt.secret,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN },
  );

  return {
    accessToken,
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  };
};

// Generate refresh token
const generateRefreshToken = async (userId: number): Promise<string> => {
  if (!config.jwt?.refreshSecret) {
    throw new Error("JWT refresh secret is not configured");
  }

  const token = jwt.sign(
    {
      userId,
      type: "refresh",
    },
    config.jwt.refreshSecret,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN },
  );

  // Store the refresh token in the database
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + REFRESH_TOKEN_EXPIRES_IN);

  await prisma.refreshToken.create({
    data: {
      tokenHash: token, // Store the token as hash
      userId,
      expiresAt,
    },
  });

  return token;
};

export class AuthService {
  /**
   * Register a new user
   */
  async register(userData: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
  }): Promise<{ user: Omit<User, "password">; tokens: AuthTokens }> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Email is already registered",
      );
    }

    // Hash password with salt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Create user
    const user = (await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role || UserRole.USER,
        isActive: true,
      },
    })) as UserWithRole;

    // Generate tokens
    const tokens = await this.generateAuthTokens(user.id, user.role);

    // Update last login
    await this.updateLastLogin(user.id);

    // Remove password from the returned user object
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
  }

  /**
   * Login user with email and password
   */
  async login(credentials: {
    email: string;
    password: string;
  }): Promise<{ user: Omit<User, "password">; tokens: AuthTokens }> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
    });

    // Check if user exists and is active
    if (!user || !user.isActive) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
    }

    // Check if password is correct
    const isPasswordValid = await bcrypt.compare(
      credentials.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
    }

    // Generate tokens
    const tokens = await this.generateAuthTokens(
      user.id,
      user.role as UserRole,
    );

    // Update last login
    await this.updateLastLogin(user.id);

    // Remove password from the returned user object
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
  }

  /**
   * Generate new access and refresh tokens
   */
  private async generateAuthTokens(
    userId: number,
    role: UserRole,
  ): Promise<AuthTokens> {
    const userWithRole: UserWithRole = {
      id: userId,
      email: "", // Not needed for token generation
      name: "", // Not needed for token generation
      password: "", // Not needed for token generation
      role,
      isActive: true,
      passwordChangedAt: null,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      currentCompanyId: null,
      deletedAt: null,
      cancelAtPeriodEnd: false,
      lastPaymentAt: null,
      planType: null,
      stripeCustomerId: null,
      subscriptionId: null,
      subscriptionStatus: null,
    };

    const [accessTokenResult, refreshToken] = await Promise.all([
      generateAccessToken(userWithRole),
      generateRefreshToken(userId),
    ]);

    return {
      accessToken: accessTokenResult.accessToken,
      refreshToken,
      expiresIn: accessTokenResult.expiresIn,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    if (!config.jwt?.refreshSecret) {
      throw new Error("JWT refresh secret is not configured");
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        config.jwt.refreshSecret,
      ) as TokenPayload;

      if (decoded.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      // Check if refresh token exists in the database and is not expired
      const tokenRecord = await prisma.refreshToken.findFirst({
        where: {
          tokenHash: refreshToken,
          expiresAt: { gte: new Date() },
        },
      });

      if (!tokenRecord) {
        throw new Error("Invalid or expired refresh token");
      }

      // Get the user
      const user = await prisma.user.findUnique({
        where: { id: tokenRecord.userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Generate new tokens
      const tokens = await this.generateAuthTokens(
        user.id,
        user.role as UserRole,
      );

      // Delete the old refresh token
      await prisma.refreshToken.delete({
        where: { id: tokenRecord.id },
      });

      return tokens;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        // Clean up expired token
        await prisma.refreshToken.deleteMany({
          where: { tokenHash: refreshToken },
        });
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Refresh token expired");
      }
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid refresh token");
    }
  }

  /**
   * Logout user by revoking refresh tokens
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      // Delete the refresh token
      await prisma.refreshToken.deleteMany({
        where: { tokenHash: refreshToken },
      });
    } catch (error) {
      // Log the error but don't fail the request
      console.error("Error during logout:", error);
    }
  }

  /**
   * Update user's last login timestamp
   */
  private async updateLastLogin(userId: number): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLogin: new Date(),
      },
    });
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        "Current password is incorrect",
      );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and set passwordChangedAt
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        // Using any to bypass the type check for passwordChangedAt
        // since it's not in the Prisma schema yet
        passwordChangedAt: new Date() as any,
      },
    });
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(userId: number): Promise<Omit<User, "password">> {
    const user = await prisma.user.findUnique({
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

    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    }

    return user as Omit<User, "password">;
  }
}

export const authService = new AuthService();
