import { PrismaClient } from "@prisma/client";
import { applyTenantIsolationMiddleware } from "../middleware/prisma-tenant-isolation-v3.middleware.js";

declare global {
  var prisma: any | undefined;
}

// Prevent multiple instances of Prisma Client in development
const isTestEnv = process.env.NODE_ENV === "test";

const canConstructPrismaClient = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return typeof (PrismaClient as any) === "function";
  } catch {
    return false;
  }
})();

// Singleton pattern for Prisma Client
class PrismaClientSingleton {
  private static instance: PrismaClient | null = null;

  static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new PrismaClient({
        log:
          process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
      });
    }
    return PrismaClientSingleton.instance;
  }
}

const prisma =
  global.prisma ||
  (!isTestEnv && canConstructPrismaClient
    ? PrismaClientSingleton.getInstance()
    : ({} as unknown as PrismaClient));

// CRITICAL: Apply tenant isolation middleware for multi-tenant security
if (!isTestEnv && canConstructPrismaClient && prisma) {
  applyTenantIsolationMiddleware(prisma);
}

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export { prisma, PrismaClientSingleton };
