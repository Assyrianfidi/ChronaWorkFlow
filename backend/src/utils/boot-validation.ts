/**
 * ============================================================================
 * BOOT-TIME SAFETY GUARDS
 * ============================================================================
 * 
 * Validates system integrity at startup. Fails fast if:
 * - Multiple Prisma clients detected
 * - Multiple Redis clients detected
 * - Versioned service files exist
 * - Legacy entry points active
 * - Insecure configurations in production
 * 
 * CRITICAL: This MUST run before any routes are mounted.
 * ============================================================================
 */

import { logger } from './logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class BootValidation {
  private errors: string[] = [];
  private warnings: string[] = [];

  /**
   * Assert only one Prisma client file exists
   */
  assertSinglePrismaClient(): void {
    const prismaFiles = [
      'src/utils/prisma.ts',
      'src/lib/prisma.ts',
      'src/utils/prisma-singleton.ts',
      'src/config/prisma.ts',
    ];

    const backendRoot = path.join(__dirname, '../../..');
    const existingFiles = prismaFiles.filter(f => 
      fs.existsSync(path.join(backendRoot, f))
    );

    if (existingFiles.length > 1) {
      this.errors.push(
        `FATAL: Multiple Prisma client files detected: ${existingFiles.join(', ')}. ` +
        `Only utils/prisma.ts is allowed. Delete: ${existingFiles.filter(f => f !== 'src/utils/prisma.ts').join(', ')}`
      );
    }

    if (existingFiles.length === 0) {
      this.errors.push('FATAL: No Prisma client file found. Required: src/utils/prisma.ts');
    }
  }

  /**
   * Assert no versioned service files exist
   */
  assertNoVersionedServices(): void {
    const versionedPattern = /\.(service|middleware)\.v\d+\.ts$/;
    
    const checkDir = (dir: string, label: string) => {
      if (!fs.existsSync(dir)) return;
      
      const scanRecursive = (currentDir: string) => {
        const items = fs.readdirSync(currentDir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = path.join(currentDir, item.name);
          
          if (item.isDirectory()) {
            scanRecursive(fullPath);
          } else if (item.isFile() && versionedPattern.test(item.name)) {
            const relativePath = path.relative(path.join(__dirname, '../../..'), fullPath);
            this.errors.push(
              `FATAL: Versioned file detected: ${relativePath}. ` +
              `Version suffixes are forbidden. Replace old version directly.`
            );
          }
        }
      };
      
      scanRecursive(dir);
    };

    const backendRoot = path.join(__dirname, '../../..');
    checkDir(path.join(backendRoot, 'src/services'), 'services');
    checkDir(path.join(backendRoot, 'src/middleware'), 'middleware');
  }

  /**
   * Assert no legacy entry points exist
   */
  assertNoLegacyEntryPoints(): void {
    const legacyEntries = [
      'src/index.ts',
      'src/app.js',
      'src/main.ts',
    ];

    const backendRoot = path.join(__dirname, '../../..');
    const existing = legacyEntries.filter(f =>
      fs.existsSync(path.join(backendRoot, f))
    );

    if (existing.length > 0) {
      this.warnings.push(
        `WARNING: Legacy entry point(s) detected: ${existing.join(', ')}. ` +
        `Only server.ts should exist. Consider deleting: ${existing.join(', ')}`
      );
    }
  }

  /**
   * Assert production environment is secure
   */
  assertProductionSecurity(): void {
    if (process.env.NODE_ENV !== 'production') return;

    // Check JWT secret length
    const jwtSecret = process.env.JWT_SECRET || '';
    if (jwtSecret.length < 64) {
      this.errors.push(
        'FATAL: JWT_SECRET must be at least 64 characters in production. ' +
        `Current length: ${jwtSecret.length}`
      );
    }

    // Check database URL is not localhost
    const dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
      this.errors.push(
        'FATAL: DATABASE_URL cannot use localhost in production. ' +
        'Use production database hostname.'
      );
    }

    // Check Redis is not localhost
    const redisHost = process.env.REDIS_HOST || '';
    if (redisHost === 'localhost' || redisHost === '127.0.0.1') {
      this.errors.push(
        'FATAL: REDIS_HOST cannot be localhost in production. ' +
        'Use production Redis hostname.'
      );
    }

    // Check HTTPS enforcement
    if (!process.env.FORCE_HTTPS && process.env.NODE_ENV === 'production') {
      this.warnings.push(
        'WARNING: FORCE_HTTPS not set. HTTPS should be enforced in production.'
      );
    }
  }

  /**
   * Assert tenant middleware is properly configured
   */
  assertTenantMiddleware(): void {
    const middlewareFile = path.join(__dirname, '../middleware/tenant-context.middleware.ts');
    
    if (!fs.existsSync(middlewareFile)) {
      this.errors.push(
        'FATAL: Tenant context middleware file missing. ' +
        'Required: src/middleware/tenant-context.middleware.ts'
      );
    }

    const v3MiddlewareFile = path.join(__dirname, '../middleware/prisma-tenant-isolation-v3.middleware.ts');
    
    if (!fs.existsSync(v3MiddlewareFile)) {
      this.errors.push(
        'FATAL: Prisma V3 tenant isolation middleware missing. ' +
        'Required: src/middleware/prisma-tenant-isolation-v3.middleware.ts'
      );
    }
  }

  /**
   * Assert no template files in src/ directory
   */
  assertNoTemplatesInSrc(): void {
    const templatesDir = path.join(__dirname, '../templates');
    
    if (fs.existsSync(templatesDir)) {
      this.warnings.push(
        'WARNING: Templates directory found in src/. ' +
        'Template files should be in docs/templates/, not src/templates/. ' +
        'Move to docs/ directory.'
      );
    }
  }

  /**
   * Assert no direct Redis imports in services
   */
  assertNoDirectRedisImports(): void {
    const servicesDir = path.join(__dirname, '../services');
    
    if (!fs.existsSync(servicesDir)) return;

    const scanForRedisImports = (dir: string) => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
          scanForRedisImports(fullPath);
        } else if (item.isFile() && (item.name.endsWith('.ts') || item.name.endsWith('.js'))) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            
            // Check for direct redis imports
            const directRedisImport = /from\s+['"]redis['"]|from\s+['"]@redis/;
            const createClientImport = /import\s+{[^}]*createClient[^}]*}\s+from\s+['"]redis['"]/;
            
            if (directRedisImport.test(content) || createClientImport.test(content)) {
              const relativePath = path.relative(path.join(__dirname, '../../..'), fullPath);
              this.errors.push(
                `FATAL: Direct Redis import detected in ${relativePath}. ` +
                `Services MUST use TenantRedisClient from utils/redis-tenant-enforcer.js. ` +
                `Direct redis imports bypass tenant isolation and are FORBIDDEN.`
              );
            }
          } catch (error: any) {
            // Skip files that can't be read
          }
        }
      }
    };

    scanForRedisImports(servicesDir);
  }

  /**
   * Run all validations
   */
  validate(): void {
    logger.info('🔍 Running boot-time safety validations...');

    this.assertSinglePrismaClient();
    this.assertNoVersionedServices();
    this.assertNoLegacyEntryPoints();
    this.assertProductionSecurity();
    this.assertTenantMiddleware();
    this.assertNoTemplatesInSrc();
    this.assertNoDirectRedisImports();

    // Report warnings
    if (this.warnings.length > 0) {
      logger.warn('Boot validation warnings:');
      this.warnings.forEach(w => logger.warn(`  ⚠️  ${w}`));
    }

    // Report errors and fail
    if (this.errors.length > 0) {
      logger.error('Boot validation FAILED:', { errorCount: this.errors.length });
      
      console.error('\n' + '='.repeat(80));
      console.error('❌ BOOT VALIDATION FAILED - SERVER CANNOT START');
      console.error('='.repeat(80));
      
      this.errors.forEach((e, i) => {
        console.error(`\n${i + 1}. ${e}`);
      });
      
      console.error('\n' + '='.repeat(80));
      console.error('Fix the above errors and restart the server.');
      console.error('='.repeat(80) + '\n');
      
      process.exit(1);
    }

    logger.info('✅ Boot validation passed - all structural integrity checks OK');
  }

  /**
   * Validate in non-blocking mode (for tests)
   */
  validateNonBlocking(): { errors: string[]; warnings: string[] } {
    this.assertSinglePrismaClient();
    this.assertNoVersionedServices();
    this.assertNoLegacyEntryPoints();
    this.assertProductionSecurity();
    this.assertTenantMiddleware();
    this.assertNoTemplatesInSrc();
    this.assertNoDirectRedisImports();

    return {
      errors: this.errors,
      warnings: this.warnings,
    };
  }
}

export const bootValidation = new BootValidation();
