import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ROLES } from '../src/constants/roles.js';
import { faker } from '@faker-js/faker';

// Initialize Prisma Client with logging
const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

// Utility functions
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

function generateRandomAmount(min = 1000, max = 50000) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

// Data generation functions
async function createUsers() {
  console.log('👥 Creating users...');
  
  // Admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'fidi.amazon@gmail.com' },
    update: {},
    create: {
      name: 'Fidi Khouchaba',
      email: 'fidi.amazon@gmail.com',
      password: await hashPassword('Fkhouch8'),
      role: ROLES.ADMIN,
      isActive: true,
    },
  });

  // Assistant manager
  const assistantManager = await prisma.user.upsert({
    where: { email: 'assistant@example.com' },
    update: {},
    create: {
      name: 'Assistant Manager',
      email: 'assistant@example.com',
      password: await hashPassword('assistant123'),
      role: ROLES.ASSISTANT_MANAGER,
      isActive: true,
    },
  });

  // Create regular users
  const regularUsers = [];
  for (let i = 0; i < 5; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name: `${firstName} ${lastName}`,
        email,
        password: await hashPassword('password123'),
        role: ROLES.USER,
        isActive: true,
      },
    });
    regularUsers.push(user);
  }

  console.log(`✅ Created ${regularUsers.length + 2} users`);
  return { adminUser, assistantManager, regularUsers };
}

async function createReports(users) {
  console.log('📊 Creating reports...');
  
  // Clear existing reports
  await prisma.reconciliationReport.deleteMany({});
  console.log('🗑️  Cleared existing reports');

  const reports = [];
  const reportTemplates = [
    'Q{QUARTER} {YEAR} Financial Report',
    '{YEAR} Annual Report - {DEPARTMENT}',
    '{MONTH} {YEAR} Reconciliation',
    '{DEPARTMENT} Performance Q{QUARTER} {YEAR}',
    'Budget Review {MONTH} {Y}'
  ];

  const departments = ['Finance', 'Operations', 'Sales', 'HR', 'IT'];
  const currentYear = new Date().getFullYear();
  
  for (const user of users) {
    const reportCount = Math.floor(Math.random() * 5) + 3; // 3-7 reports per user
    
    for (let i = 0; i < reportCount; i++) {
      const year = currentYear - Math.floor(Math.random() * 2); // Current or previous year
      const quarter = Math.floor(Math.random() * 4) + 1;
      const month = faker.date.month();
      const department = faker.helpers.arrayElement(departments);
      
      const title = faker.helpers.arrayElement(reportTemplates)
        .replace('{QUARTER}', quarter)
        .replace('{YEAR}', year)
        .replace('{DEPARTMENT}', department)
        .replace('{MONTH}', month)
        .replace('{Y}', year.toString().slice(-2));
      
      reports.push({
        title,
        amount: generateRandomAmount(1000, 50000),
        userId: user.id,
      });
    }
  }

  // Create reports in database
  for (const report of reports) {
    try {
      await prisma.reconciliationReport.create({
        data: {
          title: report.title,
          amount: report.amount,
          userId: report.userId,
        },
      });
    } catch (error) {
      console.error(`❌ Error creating report: ${error.message}`);
    }
  }

  console.log(`✅ Created ${reports.length} reports`);
  return reports;
}

// Main seeding function
async function main() {
  console.log('🌱 Starting database seeding...');
  console.log('==============================');

  try {
    // Create users
    const { adminUser, assistantManager, regularUsers } = await createUsers();
    
    // Create reports for all users
    const allUsers = [adminUser, assistantManager, ...regularUsers];
    await createReports(allUsers);

    console.log('==============================');
    console.log('✅ Database seeded successfully!');
    console.log('==============================');
    console.log('👥 Total users:', allUsers.length);
    
    const reportCount = await prisma.reconciliationReport.count();
    console.log('📊 Total reports:', reportCount);
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

// Execute and handle errors
main()
  .catch((e) => {
    console.error('❌ Fatal error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
