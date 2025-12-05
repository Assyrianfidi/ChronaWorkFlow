import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedInvoicing() {
  try {
    console.log('🌱 Seeding invoicing data...');

    // Create default tax rules for Canada
    const taxRules = [
      {
        name: 'GST (Canada)',
        regionCode: 'CA',
        rate: 0.05,
        isCompound: false
      },
      {
        name: 'PST (BC)',
        regionCode: 'CA-BC',
        rate: 0.07,
        isCompound: false
      },
      {
        name: 'HST (Ontario)',
        regionCode: 'CA-ON',
        rate: 0.13,
        isCompound: false
      },
      {
        name: 'QST (Quebec)',
        regionCode: 'CA-QC',
        rate: 0.09975,
        isCompound: true
      }
    ];

    for (const taxRule of taxRules) {
      const existing = await prisma.taxRule.findFirst({
        where: { 
          name: taxRule.name,
          regionCode: taxRule.regionCode
        }
      });
      
      if (!existing) {
        await prisma.taxRule.create({
          data: taxRule
        });
        console.log(`✅ Created tax rule: ${taxRule.name} (${taxRule.regionCode})`);
      } else {
        console.log(`⚠️ Tax rule already exists: ${taxRule.name} (${taxRule.regionCode})`);
      }
    }

    // Create sample products
    const products = [
      {
        sku: 'CONS-001',
        name: 'Consulting Services',
        description: 'Professional consulting services',
        unitPrice: 15000, // $150.00 in cents
        taxInclusive: false
      },
      {
        sku: 'DEV-001',
        name: 'Software Development',
        description: 'Custom software development',
        unitPrice: 20000, // $200.00 in cents
        taxInclusive: false
      },
      {
        sku: 'LIC-001',
        name: 'Software License',
        description: 'Annual software license',
        unitPrice: 50000, // $500.00 in cents
        taxInclusive: false
      }
    ];

    for (const product of products) {
      await prisma.product.upsert({
        where: { sku: product.sku },
        update: product,
        create: product
      });
      console.log(`✅ Created product: ${product.name}`);
    }

    // Create sample customers
    const customers = [
      {
        companyName: 'Tech Solutions Inc.',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@techsolutions.com',
        phone: '+1-604-555-0123',
        address: {
          street: '123 Tech Street',
          city: 'Vancouver',
          province: 'BC',
          country: 'Canada',
          postalCode: 'V6B 2W1'
        },
        province: 'BC',
        country: 'Canada',
        defaultTaxSettings: {
          gst: true,
          pst: true,
          region: 'CA-BC'
        }
      },
      {
        companyName: 'Global Enterprises Ltd.',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@globalent.com',
        phone: '+1-416-555-0456',
        address: {
          street: '456 Business Ave',
          city: 'Toronto',
          province: 'ON',
          country: 'Canada',
          postalCode: 'M5V 2T6'
        },
        province: 'ON',
        country: 'Canada',
        defaultTaxSettings: {
          hst: true,
          region: 'CA-ON'
        }
      }
    ];

    for (const customer of customers) {
      await prisma.customer.upsert({
        where: { email: customer.email },
        update: customer,
        create: customer
      });
      console.log(`✅ Created customer: ${customer.companyName}`);
    }

    console.log('🎉 Invoicing data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding invoicing data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedInvoicing()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
