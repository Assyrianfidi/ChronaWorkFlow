const { PrismaClient } = require('@prisma/client');

/**
 * Singleton Prisma Client instance
 * Ensures only one database connection is created
 */
class PrismaClientSingleton {
  constructor() {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        errorFormat: 'pretty',
      });
    }
    return PrismaClientSingleton.instance;
  }

  /**
   * Get the singleton Prisma client instance
   */
  static getInstance() {
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
  static async connect() {
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
  static async disconnect() {
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
  static isDatabaseConnected() {
    return PrismaClientSingleton.isConnected;
  }

  /**
   * Reset the singleton (useful for testing)
   */
  static reset() {
    if (PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = null;
      PrismaClientSingleton.isConnected = false;
    }
  }
}

// Static properties
PrismaClientSingleton.instance = null;
PrismaClientSingleton.isConnected = false;

// Export the singleton instance getter
module.exports = { PrismaClientSingleton };
