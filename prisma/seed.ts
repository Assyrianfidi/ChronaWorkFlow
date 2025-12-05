import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: await hash('admin123', 12),
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const inventoryManager = await prisma.user.upsert({
    where: { email: 'inventory@example.com' },
    update: {},
    create: {
      name: 'Inventory Manager',
      email: 'inventory@example.com',
      password: await hash('inventory123', 12),
      role: Role.INVENTORY_MANAGER,
      isActive: true,
    },
  });

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Electronics' },
      update: {},
      create: { name: 'Electronics', description: 'Electronic devices and components' },
    }),
    prisma.category.upsert({
      where: { name: 'Office Supplies' },
      update: {},
      create: { name: 'Office Supplies', description: 'Office stationery and supplies' },
    }),
    prisma.category.upsert({
      where: { name: 'Furniture' },
      update: {},
      create: { name: 'Furniture', description: 'Office furniture and equipment' },
    }),
  ]);

  // Create suppliers
  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { name: 'TechCorp' },
      update: {},
      create: {
        name: 'TechCorp',
        email: 'sales@techcorp.com',
        phone: '+1234567890',
        address: '123 Tech Street, Silicon Valley, CA',
      },
    }),
    prisma.supplier.upsert({
      where: { name: 'OfficePlus' },
      update: {},
      create: {
        name: 'OfficePlus',
        email: 'orders@officeplus.com',
        phone: '+1987654321',
        address: '456 Business Ave, New York, NY',
      },
    }),
  ]);

  // Create inventory items
  const inventoryItems = await Promise.all([
    prisma.inventoryItem.upsert({
      where: { sku: 'LAP-001' },
      update: {},
      create: {
        name: 'Laptop Pro',
        description: 'High-performance business laptop',
        sku: 'LAP-001',
        barcode: '123456789012',
        categoryId: categories[0].id,
        supplierId: suppliers[0].id,
        quantity: 15,
        unit: 'pcs',
        costPrice: 899.99,
        sellingPrice: 1299.99,
        reorderPoint: 5,
        location: 'A1-01',
        notes: 'Latest model',
        isActive: true,
        tenantId: 'default-tenant',
        createdById: admin.id,
      },
    }),
    prisma.inventoryItem.upsert({
      where: { sku: 'DESK-001' },
      update: {},
      create: {
        name: 'Standing Desk',
        description: 'Adjustable height standing desk',
        sku: 'DESK-001',
        categoryId: categories[2].id,
        supplierId: suppliers[1].id,
        quantity: 8,
        unit: 'pcs',
        costPrice: 199.99,
        sellingPrice: 349.99,
        reorderPoint: 3,
        location: 'B2-03',
        isActive: true,
        tenantId: 'default-tenant',
        createdById: admin.id,
      },
    }),
  ]);

  console.log('✅ Database seeded successfully!');
  console.log('👤 Test users created:');
  console.log(`- Admin: ${admin.email} / admin123`);
  console.log(`- Inventory Manager: ${inventoryManager.email} / inventory123`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
