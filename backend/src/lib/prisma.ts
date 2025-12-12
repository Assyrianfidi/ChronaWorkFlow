import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma Client instance
 * Ensures only one database connection is created
 */
class PrismaClientSingleton {
  private static instance: PrismaClient | null = null;
  private static isConnected: boolean = false;

  /**
   * Get the singleton Prisma client instance
   */
  public static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        errorFormat: 'pretty',
      });
    }
    return PrismaClientSingleton.instance;
  }

  /**
   * Connect to database
   */
  public static async connect(): Promise<void> {
    if (PrismaClientSingleton.isConnected) {
      return;
    }

    try {
      const prisma = PrismaClientSingleton.getInstance();
      await prisma.$connect();
      PrismaClientSingleton.isConnected = true;
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from database
   */
  public static async disconnect(): Promise<void> {
    if (!PrismaClientSingleton.isConnected || !PrismaClientSingleton.instance) {
      return;
    }

    try {
      await PrismaClientSingleton.instance.$disconnect();
      PrismaClientSingleton.isConnected = false;
      console.log('✅ Database disconnected successfully');
    } catch (error) {
      console.error('❌ Database disconnection failed:', error);
      throw error;
    }
  }

  /**
   * Check if database is connected
   */
  public static isDatabaseConnected(): boolean {
    return PrismaClientSingleton.isConnected;
  }

  /**
   * Reset the singleton (useful for testing)
   */
  public static reset(): void {
    if (PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = null;
      PrismaClientSingleton.isConnected = false;
    }
  }
}

// Export the singleton instance getter
export const prisma = PrismaClientSingleton.getInstance();

// Export the singleton class for advanced usage
export { PrismaClientSingleton };

// Export default for convenience
export default prisma;
