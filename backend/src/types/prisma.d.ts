import { PrismaClient, Prisma } from "@prisma/client";

declare global {
  // Extend the global namespace to include Prisma types
  namespace Prisma {
    // Export all types from @prisma/client
    export * from "@prisma/client";

    // Extend the Prisma client with transaction support
    export interface TransactionClient
      extends Omit<
        PrismaClient,
        "$connect" | "$disconnect" | "$on" | "$transaction" | "$use"
      > {}
  }

  // Make prisma available globally for testing
  // Note: In production, you should use dependency injection instead
  var prisma: PrismaClient | undefined;
}
