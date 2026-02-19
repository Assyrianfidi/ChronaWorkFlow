import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  try {
    console.log('Attempting to unlock all advisory locks...');
    await prisma.$executeRawUnsafe('SELECT pg_advisory_unlock_all()');
    console.log('Successfully unlocked all advisory locks');
    
    console.log('Attempting to terminate other backend connections...');
    await prisma.$executeRawUnsafe(`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE datname = current_database() 
      AND pid <> pg_backend_pid()
    `);
    console.log('Successfully terminated other connections');
  } catch (e) {
    console.error('Error during cleanup:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
