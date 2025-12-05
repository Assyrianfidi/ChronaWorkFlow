require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const ROLES = require('./src/constants/roles');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.reconciliationReport.deleteMany({});
  await prisma.user.deleteMany({});

  // Hash passwords
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Fkhouch8', salt);
  const userPassword = await bcrypt.hash('password123', salt);

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'fidi.amazon@gmail.com' },
    update: {},
    create: {
      name: 'Fidi Khouchaba',
      email: 'fidi.amazon@gmail.com',
      password: adminPassword,
      role: ROLES.ADMIN,
      isActive: true,
    },
  });

  // Create regular user
  console.log('👥 Creating test user...');
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      name: 'Test User',
      email: 'test@example.com',
      password: userPassword,
      role: ROLES.USER,
      isActive: true,
    },
  });

  // Create sample reconciliation reports
  console.log('📊 Creating sample reports...');
  await prisma.reconciliationReport.createMany({
    data: [
      {
        date: new Date('2025-11-01'),
        amount: 1000,
        status: 'Pending',
        notes: 'Initial reconciliation',
        userId: adminUser.id,
      },
      {
        date: new Date('2025-11-02'),
        amount: 2500,
        status: 'Completed',
        notes: 'Monthly reconciliation',
        userId: testUser.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seed data inserted successfully');
  console.log('🔑 Admin credentials:');
  console.log(`   Email: fidi.amazon@gmail.com`);
  console.log(`   Password: Fkhouch8`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
