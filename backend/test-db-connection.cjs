const { PrismaClientSingleton } = require('./dist/lib/prisma.js');

async function testDatabaseConnection() {
  try {
    console.log('🔄 Testing database connection...');
    await PrismaClientSingleton.connect();
    console.log('✅ Database connection successful');
    
    // Test a simple query
    const prisma = PrismaClientSingleton.getInstance();
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query test passed:', result);
    
    await PrismaClientSingleton.disconnect();
    console.log('✅ Database disconnected successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testDatabaseConnection();
