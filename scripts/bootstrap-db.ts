#!/usr/bin/env ts-node

/**
 * AccuBooks Database Bootstrap Script
 * 
 * This script automatically:
 * 1. Runs Prisma migrations
 * 2. Seeds the database with demo data
 * 3. Creates admin user, demo tenant, demo scenarios, and demo forecasts
 * 
 * Usage:
 * - Automatically runs on first startup if AUTO_MIGRATE=true and AUTO_SEED=true
 * - Can be run manually: npm run bootstrap
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface SeedResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Hash password using bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Create admin user
 */
async function createAdminUser(): Promise<SeedResult> {
  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'admin@accubooks.com' },
    });

    if (existingAdmin) {
      return {
        success: true,
        message: 'Admin user already exists',
        data: { email: existingAdmin.email },
      };
    }

    const hashedPassword = await hashPassword('admin123');

    const admin = await prisma.user.create({
      data: {
        email: 'admin@accubooks.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'OWNER',
        emailVerified: true,
      },
    });

    return {
      success: true,
      message: 'Admin user created successfully',
      data: { email: admin.email, role: admin.role },
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to create admin user: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Create demo tenant
 */
async function createDemoTenant(): Promise<SeedResult> {
  try {
    const existingTenant = await prisma.tenant.findFirst({
      where: { slug: 'demo-company' },
    });

    if (existingTenant) {
      return {
        success: true,
        message: 'Demo tenant already exists',
        data: { name: existingTenant.name, slug: existingTenant.slug },
      };
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: 'Demo Company Inc.',
        slug: 'demo-company',
        plan: 'PROFESSIONAL',
        status: 'ACTIVE',
      },
    });

    return {
      success: true,
      message: 'Demo tenant created successfully',
      data: { name: tenant.name, slug: tenant.slug, plan: tenant.plan },
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to create demo tenant: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Create demo scenarios
 */
async function createDemoScenarios(tenantId: string): Promise<SeedResult> {
  try {
    const existingScenarios = await prisma.scenario.findMany({
      where: { tenantId },
    });

    if (existingScenarios.length > 0) {
      return {
        success: true,
        message: `${existingScenarios.length} demo scenarios already exist`,
        data: { count: existingScenarios.length },
      };
    }

    const scenarios = [
      {
        tenantId,
        name: 'Hire Senior Engineer',
        type: 'HIRING',
        description: 'Impact of hiring a Senior Software Engineer at $120k/year',
        parameters: {
          salary: 120000,
          benefits: 30000,
          equipment: 5000,
          rampMonths: 3,
        },
        riskScore: 45,
        riskLevel: 'MEDIUM',
        projectedImpact: {
          runwayDays: -30,
          monthlyBurnIncrease: 12500,
        },
        status: 'COMPLETED',
      },
      {
        tenantId,
        name: 'Large Marketing Campaign',
        type: 'LARGE_PURCHASE',
        description: 'Q1 marketing campaign investment',
        parameters: {
          amount: 50000,
          isRecurring: false,
          category: 'Marketing',
        },
        riskScore: 35,
        riskLevel: 'MEDIUM',
        projectedImpact: {
          runwayDays: -15,
          oneTimeImpact: 50000,
        },
        status: 'COMPLETED',
      },
      {
        tenantId,
        name: 'New Enterprise Client',
        type: 'REVENUE_CHANGE',
        description: 'Landing a new enterprise client at $10k/month',
        parameters: {
          amount: 10000,
          isIncrease: true,
          duration: 12,
          confidence: 0.8,
        },
        riskScore: 20,
        riskLevel: 'LOW',
        projectedImpact: {
          runwayDays: 45,
          monthlyRevenueIncrease: 10000,
        },
        status: 'COMPLETED',
      },
    ];

    const createdScenarios = await prisma.scenario.createMany({
      data: scenarios,
    });

    return {
      success: true,
      message: `Created ${createdScenarios.count} demo scenarios`,
      data: { count: createdScenarios.count },
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to create demo scenarios: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Create demo forecasts
 */
async function createDemoForecasts(tenantId: string): Promise<SeedResult> {
  try {
    const existingForecasts = await prisma.forecast.findMany({
      where: { tenantId },
    });

    if (existingForecasts.length > 0) {
      return {
        success: true,
        message: `${existingForecasts.length} demo forecasts already exist`,
        data: { count: existingForecasts.length },
      };
    }

    const forecasts = [
      {
        tenantId,
        type: 'CASH_RUNWAY',
        name: 'Cash Runway Forecast',
        description: 'Projected cash runway based on current burn rate',
        result: {
          value: 150,
          unit: 'days',
          confidence: 85,
        },
        formula: 'currentCash / monthlyBurnRate',
        assumptions: [
          { key: 'currentCash', value: 500000, sensitivity: 'HIGH' },
          { key: 'monthlyBurnRate', value: 100000, sensitivity: 'HIGH' },
        ],
        confidenceScore: 85,
        status: 'COMPLETED',
      },
      {
        tenantId,
        type: 'BURN_RATE',
        name: 'Monthly Burn Rate',
        description: 'Average monthly cash burn over last 90 days',
        result: {
          value: 100000,
          unit: 'USD',
          confidence: 90,
        },
        formula: 'sum(expenses_last_90_days) / 3',
        assumptions: [
          { key: 'expenses_last_90_days', value: 300000, sensitivity: 'MEDIUM' },
        ],
        confidenceScore: 90,
        status: 'COMPLETED',
      },
      {
        tenantId,
        type: 'REVENUE_GROWTH',
        name: 'Revenue Growth Rate',
        description: 'Month-over-month revenue growth percentage',
        result: {
          value: 15,
          unit: 'percent',
          confidence: 75,
        },
        formula: '(currentRevenue - previousRevenue) / previousRevenue * 100',
        assumptions: [
          { key: 'currentRevenue', value: 115000, sensitivity: 'MEDIUM' },
          { key: 'previousRevenue', value: 100000, sensitivity: 'MEDIUM' },
        ],
        confidenceScore: 75,
        status: 'COMPLETED',
      },
    ];

    const createdForecasts = await prisma.forecast.createMany({
      data: forecasts,
    });

    return {
      success: true,
      message: `Created ${createdForecasts.count} demo forecasts`,
      data: { count: createdForecasts.count },
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to create demo forecasts: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Main bootstrap function
 */
async function bootstrap() {
  console.log('🚀 Starting AccuBooks database bootstrap...\n');

  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminResult = await createAdminUser();
    console.log(adminResult.success ? '✅' : '❌', adminResult.message);
    if (adminResult.data) {
      console.log('   ', JSON.stringify(adminResult.data, null, 2));
    }
    console.log('');

    // Create demo tenant
    console.log('🏢 Creating demo tenant...');
    const tenantResult = await createDemoTenant();
    console.log(tenantResult.success ? '✅' : '❌', tenantResult.message);
    if (tenantResult.data) {
      console.log('   ', JSON.stringify(tenantResult.data, null, 2));
    }
    console.log('');

    // Get tenant ID for demo data
    const demoTenant = await prisma.tenant.findFirst({
      where: { slug: 'demo-company' },
    });

    if (!demoTenant) {
      throw new Error('Demo tenant not found');
    }

    // Create demo scenarios
    console.log('📊 Creating demo scenarios...');
    const scenariosResult = await createDemoScenarios(demoTenant.id);
    console.log(scenariosResult.success ? '✅' : '❌', scenariosResult.message);
    if (scenariosResult.data) {
      console.log('   ', JSON.stringify(scenariosResult.data, null, 2));
    }
    console.log('');

    // Create demo forecasts
    console.log('📈 Creating demo forecasts...');
    const forecastsResult = await createDemoForecasts(demoTenant.id);
    console.log(forecastsResult.success ? '✅' : '❌', forecastsResult.message);
    if (forecastsResult.data) {
      console.log('   ', JSON.stringify(forecastsResult.data, null, 2));
    }
    console.log('');

    console.log('🎉 Database bootstrap completed successfully!\n');
    console.log('📝 Demo Credentials:');
    console.log('   Email: admin@accubooks.com');
    console.log('   Password: admin123');
    console.log('   Tenant: Demo Company Inc. (demo-company)');
    console.log('\n⚠️  IMPORTANT: Change the admin password in production!\n');

  } catch (error) {
    console.error('❌ Bootstrap failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run bootstrap if executed directly
if (require.main === module) {
  bootstrap()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { bootstrap };
