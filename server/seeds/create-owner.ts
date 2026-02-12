import bcrypt from 'bcrypt';
import { db } from '../db';
import { prisma } from '../prisma';
import * as schema from '../../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Create Owner Account Seed Script
 * 
 * This script creates the default owner account for ChronaWorkFlow.
 * The owner has full system access and control.
 * 
 * Usage:
 *   npx tsx server/seeds/create-owner.ts
 */

const OWNER_CREDENTIALS = {
  email: 'ceo@chronaworkflow.com',
  password: 'ChronaOwner2025!Secure',
  username: 'ceo',
  name: 'CEO Owner',
  firstName: 'CEO',
  lastName: 'Owner',
  role: 'owner' as const,
};

async function createOwnerAccount() {
  console.log('🔐 Creating Owner Account...');
  console.log('Email:', OWNER_CREDENTIALS.email);

  try {
    // Check if owner already exists
    const existingUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, OWNER_CREDENTIALS.email))
      .limit(1);

    if (existingUser.length > 0) {
      console.log('✅ Owner account already exists');
      console.log('User ID:', existingUser[0].id);
      console.log('Role:', existingUser[0].role);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(OWNER_CREDENTIALS.password, 12);
    console.log('✅ Password hashed');

    // Create tenant for owner
    const tenant = await prisma.tenant.create({
      data: {
        name: 'ChronaWorkFlow HQ',
        subdomain: 'chronaworkflow-hq',
      },
    });
    console.log('✅ Tenant created:', tenant.id);

    // Create company for owner
    const [company] = await db
      .insert(schema.companies)
      .values({
        name: 'ChronaWorkFlow HQ',
        email: OWNER_CREDENTIALS.email,
        currency: 'USD',
      })
      .returning();
    console.log('✅ Company created:', company.id);

    // Create owner user
    const [user] = await db
      .insert(schema.users)
      .values({
        username: OWNER_CREDENTIALS.username,
        email: OWNER_CREDENTIALS.email,
        password: hashedPassword,
        name: OWNER_CREDENTIALS.name,
        role: OWNER_CREDENTIALS.role,
        currentCompanyId: company.id,
      })
      .returning();
    console.log('✅ Owner user created:', user.id);

    // Link user to tenant
    await db
      .insert(schema.userTenants)
      .values({
        userId: user.id,
        tenantId: tenant.id,
      })
      .onConflictDoNothing();
    console.log('✅ User linked to tenant');

    // Link tenant to company
    await db
      .insert(schema.tenantCompanies)
      .values({
        tenantId: tenant.id,
        companyId: company.id,
      })
      .onConflictDoNothing();
    console.log('✅ Tenant linked to company');

    // Grant user access to company
    await db
      .insert(schema.userCompanyAccess)
      .values({
        userId: user.id,
        companyId: company.id,
        role: OWNER_CREDENTIALS.role,
      })
      .onConflictDoNothing();
    console.log('✅ User granted company access');

    console.log('\n🎉 Owner account created successfully!\n');
    console.log('='.repeat(50));
    console.log('📧 Email:', OWNER_CREDENTIALS.email);
    console.log('🔑 Password:', OWNER_CREDENTIALS.password);
    console.log('👤 Role:', OWNER_CREDENTIALS.role);
    console.log('🏢 Company:', company.name);
    console.log('🏷️  Tenant:', tenant.name);
    console.log('='.repeat(50));
    console.log('\n⚠️  IMPORTANT: Change the password after first login!\n');

  } catch (error) {
    console.error('❌ Error creating owner account:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  createOwnerAccount()
    .then(() => {
      console.log('✅ Seed script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed script failed:', error);
      process.exit(1);
    });
}

export { createOwnerAccount };
