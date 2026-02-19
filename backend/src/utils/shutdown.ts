import { Server } from 'http';
import { PrismaClient } from '@prisma/client';

export const gracefulShutdown = (
  server: Server,
  prisma: any,
  signal: string
) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed');
    prisma.$disconnect().then(() => {
      console.log('Prisma disconnected');
      process.exit(0);
    });
  });

  setTimeout(() => {
    console.error('Force shutdown after timeout');
    process.exit(1);
  }, 10000);
};
