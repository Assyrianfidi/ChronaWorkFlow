import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  try {
    // Clear existing data
    await prisma.reconciliationReport.deleteMany({});
    await prisma.user.deleteMany({});

    // Hash password
    const hashedPassword = await bcrypt.hash('Fkhouch8', 12);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'fidi.amazon@gmail.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      },
    });

    // Create sample reports
    const reports = [
      {
        title: 'Q1 Financial Report',
        amount: 25000.75,
        userId: admin.id,
      },
      {
        title: 'Expense Report - March',
        amount: -15432.21,
        userId: admin.id,
      },
    ];

    await prisma.reconciliationReport.createMany({
      data: reports,
    });

    console.log('✅ Database seeded successfully');
    console.log(`👤 Admin user created with email: ${admin.email}`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
