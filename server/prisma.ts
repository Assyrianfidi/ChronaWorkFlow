import { PrismaClient } from '@prisma/client';
import { createRequire } from 'node:module';

// Ensure Prisma Client is available
try {
  // Test import
  const _test = PrismaClient;
} catch (error) {
  console.error('PrismaClient import failed:', error);
  throw new Error('Prisma Client is not properly installed');
}

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaClient = (() => {
  if (globalThis.prisma) return globalThis.prisma;

  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  if (isTestEnv) {
    return {} as PrismaClient;
  }

  const require = createRequire(import.meta.url);
  const { getDatabaseConfig } = require('./config/env-validation');
  return new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseConfig(),
      },
    },
  });
})();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prismaClient;
}

export const prisma = prismaClient;
export * from '@prisma/client';
