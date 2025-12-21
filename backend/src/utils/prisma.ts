import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
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

const prisma =
  global.prisma ||
  (!isTestEnv && canConstructPrismaClient
    ? new PrismaClient({
        log:
          process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
      })
    : ({} as unknown as PrismaClient));

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export { prisma };
