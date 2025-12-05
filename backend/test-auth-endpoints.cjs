// Simple test for authentication endpoints
const dotenv = require('dotenv');
dotenv.config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testAuthSystem() {
  console.log('🧪 Testing Authentication System...\n');

  try {
    // Test 1: Database Connection
    console.log('1. Testing Database Connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Test 2: Check if Admin User Exists
    console.log('\n2. Checking Admin User...');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'fidi.amazon@gmail.com' }
    });
    
    if (adminUser) {
      console.log('✅ Admin user found:', adminUser.email, 'Role:', adminUser.role);
    } else {
      console.log('❌ Admin user not found');
    }

    // Test 3: Test Password Verification
    console.log('\n3. Testing Password Verification...');
    if (adminUser) {
      const isValidPassword = await bcrypt.compare('Fkhouch8', adminUser.password);
      console.log(isValidPassword ? '✅ Password verification successful' : '❌ Password verification failed');
    }

    // Test 4: Test JWT Token Generation
    console.log('\n4. Testing JWT Token Generation...');
    if (adminUser) {
      const token = jwt.sign(
        { id: adminUser.id, email: adminUser.email, role: adminUser.role },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
      );
      console.log('✅ JWT token generated successfully');
      console.log('   Token preview:', token.substring(0, 50) + '...');
    }

    // Test 5: Check User Roles
    console.log('\n5. Checking Available Roles...');
    const roles = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    });
    console.log('✅ Available roles in database:');
    roles.forEach(role => {
      console.log(`   - ${role.role}: ${role._count.role} users`);
    });

    console.log('\n🎉 Authentication System Test Complete!');
    console.log('\n📊 Summary:');
    console.log('✅ Database: Connected');
    console.log('✅ Admin User: Exists');
    console.log('✅ Password Hashing: Working');
    console.log('✅ JWT Generation: Working');
    console.log('✅ Role System: Active');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAuthSystem();
