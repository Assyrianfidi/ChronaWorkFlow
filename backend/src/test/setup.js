import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// Initialize test database
async function setupTestDatabase() {
  if (!process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/accubooks_test';
  } else {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
  
  try {
    // Run migrations
    execSync('npx prisma migrate reset --force --skip-seed', { 
      stdio: 'inherit',
      env: { ...process.env, PRISMA_SCHEMA: 'prisma/schema.prisma' }
    });
    
    // Seed test data if needed
    const prisma = new PrismaClient();
    await prisma.$connect();
    
    // Add any test data here
    await prisma.$disconnect();
    
    console.log('✅ Test database setup complete');
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupTestDatabase().catch(console.error);
}

export { setupTestDatabase };
