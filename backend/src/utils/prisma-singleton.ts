import { PrismaClient } from "@prisma/client";

// Singleton pattern for Prisma client
class PrismaClientSingleton {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new PrismaClient({
        log:
          process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
        errorFormat: "pretty",
      });
    }
    return PrismaClientSingleton.instance;
  }

  public static async disconnect(): Promise<void> {
    if (PrismaClientSingleton.instance) {
      await PrismaClientSingleton.instance.$disconnect();
      PrismaClientSingleton.instance = null as any;
    }
  }
}

// Export the singleton instance
export const prisma = PrismaClientSingleton.getInstance();

// Handle graceful shutdown
process.on("beforeExit", async () => {
  await PrismaClientSingleton.disconnect();
});

process.on("SIGINT", async () => {
  await PrismaClientSingleton.disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await PrismaClientSingleton.disconnect();
  process.exit(0);
});

export default prisma;
