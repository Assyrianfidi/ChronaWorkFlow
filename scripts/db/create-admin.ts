import { PrismaClient } from '../../client/node_modules/@prisma/client';
import { hash } from 'bcryptjs';

// Define UserRole type since it's not directly exported
const UserRole = {
  USER: 'USER',
  ADMIN: 'ADMIN'
} as const;

type UserRole = typeof UserRole[keyof typeof UserRole];

const prisma = new PrismaClient();

async function createAdminUser() {
  const email = 'admin@example.com';
  const password = await hash('admin123', 12);
  
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email,
        name: 'Admin User',
        password,
        role: UserRole.ADMIN,
        emailVerified: new Date(),
      },
    });

    console.log('Admin user created successfully:', admin);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
