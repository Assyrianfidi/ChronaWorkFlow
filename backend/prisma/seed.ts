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

    // Create demo users with proper roles
    const demoUsers = [
      {
        name: 'Admin User',
        email: 'admin@accubooks.com',
        password: await bcrypt.hash('admin123', 12),
        role: 'ADMIN',
        isActive: true,
      },
      {
        name: 'Manager User',
        email: 'manager@accubooks.com',
        password: await bcrypt.hash('manager123', 12),
        role: 'MANAGER',
        isActive: true,
      },
      {
        name: 'Regular User',
        email: 'user@accubooks.com',
        password: await bcrypt.hash('user123', 12),
        role: 'USER',
        isActive: true,
      },
      {
        name: 'Auditor User',
        email: 'auditor@accubooks.com',
        password: await bcrypt.hash('auditor123', 12),
        role: 'AUDITOR',
        isActive: true,
      },
      {
        name: 'Inventory Manager',
        email: 'inventory@accubooks.com',
        password: await bcrypt.hash('inventory123', 12),
        role: 'INVENTORY_MANAGER',
        isActive: true,
      }
    ];

    const createdUsers = await prisma.user.createMany({
      data: demoUsers,
    });

    console.log(`✅ Created ${createdUsers.count} demo users`);
    console.log('📧 Demo accounts:');
    console.log('   admin@accubooks.com / admin123');
    console.log('   manager@accubooks.com / manager123');
    console.log('   user@accubooks.com / user123');
    console.log('   auditor@accubooks.com / auditor123');
    console.log('   inventory@accubooks.com / inventory123');

    // Get the admin user for reports
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@accubooks.com' }
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
