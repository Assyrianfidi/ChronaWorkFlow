const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error']
  });
  
  try {
    // Test database connection
    console.log('🔍 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Successfully connected to the database');
    
    // Get database version
    const dbVersion = await prisma.$queryRaw`SELECT version()`;
    console.log('📊 Database version:', dbVersion[0].version);
    
    // List all tables in the public schema
    console.log('\n📋 Checking database tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    if (tables.length > 0) {
      console.log('✅ Found the following tables:');
      tables.forEach(table => console.log(`   - ${table.table_name}`));
    } else {
      console.log('ℹ️  No tables found in the database.');
      console.log('   Run database migrations to create the required tables.');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

console.log('🚀 Starting database connection test...\n');
testConnection()
  .then((success) => {
    console.log('\n✨ Test completed ' + (success ? 'successfully' : 'with warnings'));
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  });
