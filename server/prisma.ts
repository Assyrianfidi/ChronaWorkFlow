import { PrismaClient } from '@prisma/client';
import { getDatabaseConfig } from './config/env-validation';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaClient = globalThis.prisma || new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseConfig(),
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prismaClient;
}

export const prisma = prismaClient;
export * from '@prisma/client';
