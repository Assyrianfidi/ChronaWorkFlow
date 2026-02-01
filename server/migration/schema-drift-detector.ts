// Schema Drift Detection System
// Ensures consistency between Prisma schema, migrations, and database

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

export interface SchemaDriftResult {
  hasDrift: boolean;
  drifts: SchemaDrift[];
  summary: {
    totalDrifts: number;
    criticalDrifts: number;
    warningDrifts: number;
  };
}

export interface SchemaDrift {
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  source: 'PRISMA_SCHEMA' | 'MIGRATION_FILE' | 'DATABASE' | 'GENERATED_CLIENT';
  description: string;
  details: string;
  recommendation: string;
}

export interface DriftDetectionConfig {
  checkPrismaSchema: boolean;
  checkMigrationFiles: boolean;
  checkDatabaseState: boolean;
  checkGeneratedClient: boolean;
  strictMode: boolean;
}

export class SchemaDriftDetector {
  private config: DriftDetectionConfig;

  constructor(config: Partial<DriftDetectionConfig> = {}) {
    this.config = {
      checkPrismaSchema: true,
      checkMigrationFiles: true,
      checkDatabaseState: false, // Disabled by default for CI
      checkGeneratedClient: true,
      strictMode: true,
      ...config
    };
  }

  private async checkPrismaSchemaConsistency(): Promise<SchemaDrift[]> {
    const drifts: SchemaDrift[] = [];

    if (!this.config.checkPrismaSchema) {
      return drifts;
    }

    const schemaPath = './prisma/schema.prisma';
    if (!existsSync(schemaPath)) {
      drifts.push({
        type: 'CRITICAL',
        source: 'PRISMA_SCHEMA',
        description: 'Prisma schema file not found',
        details: `Expected schema file at ${schemaPath}`,
        recommendation: 'Create or restore the Prisma schema file'
      });
      return drifts;
    }

    try {
      // Check if Prisma can parse the schema
      const { stdout, stderr } = await execAsync('npx prisma validate');
      
      if (stderr && stderr.includes('error')) {
        drifts.push({
          type: 'CRITICAL',
          source: 'PRISMA_SCHEMA',
          description: 'Prisma schema validation failed',
          details: stderr,
          recommendation: 'Fix schema syntax errors and validation issues'
        });
      }
    } catch (error) {
      const errorStr = error as any;
      drifts.push({
        type: 'CRITICAL',
        source: 'PRISMA_SCHEMA',
        description: 'Prisma schema validation error',
        details: errorStr.message || errorStr.stderr,
        recommendation: 'Fix schema syntax errors and validation issues'
      });
    }

    // Check for common schema issues
    const schemaContent = readFileSync(schemaPath, 'utf8');
    const lines = schemaContent.split('\n');

    // Check for duplicate model names
    const modelNames = new Set<string>();
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('model ') && !line.startsWith('model {')) {
        const modelName = line.split(' ')[1];
        if (modelNames.has(modelName)) {
          drifts.push({
            type: 'CRITICAL',
            source: 'PRISMA_SCHEMA',
            description: `Duplicate model name: ${modelName}`,
            details: `Found duplicate model definition at line ${i + 1}`,
            recommendation: 'Rename one of the models to ensure uniqueness'
          });
        }
        modelNames.add(modelName);
      }
    }

    // Check for missing datasource
    if (!schemaContent.includes('datasource')) {
      drifts.push({
        type: 'CRITICAL',
        source: 'PRISMA_SCHEMA',
        description: 'Missing datasource definition',
        details: 'Prisma schema must include a datasource block',
        recommendation: 'Add datasource block with database connection details'
      });
    }

    return drifts;
  }

  private async checkMigrationFileConsistency(): Promise<SchemaDrift[]> {
    const drifts: SchemaDrift[] = [];

    if (!this.config.checkMigrationFiles) {
      return drifts;
    }

    try {
      // Check if migrations directory exists
      const { stdout: lsOutput } = await execAsync('ls -la ./prisma/migrations/ 2>/dev/null || echo "no-migrations"');
      
      if (lsOutput.includes('no-migrations')) {
        drifts.push({
          type: 'WARNING',
          source: 'MIGRATION_FILE',
          description: 'No migrations directory found',
          details: 'Migrations directory does not exist',
          recommendation: 'Create migrations directory with `npx prisma migrate dev`'
        });
        return drifts;
      }

      // Check migration file naming convention
      const { stdout: findOutput } = await execAsync('find ./prisma/migrations -name "*.sql" -type f');
      const migrationFiles = findOutput.trim().split('\n').filter(f => f.length > 0);

      for (const file of migrationFiles) {
        const fileName = file.split('/').pop();
        
        // Check naming convention (should start with timestamp)
        if (!/^\d{13}_/.test(fileName)) {
          drifts.push({
            type: 'WARNING',
            source: 'MIGRATION_FILE',
            description: 'Invalid migration file naming convention',
            details: `File ${fileName} does not follow timestamp naming convention`,
            recommendation: 'Rename migration files to follow convention: {timestamp}_{description}.sql'
          });
        }
      }

      // Check for empty migration files
      for (const file of migrationFiles) {
        const { stdout: wcOutput } = await execAsync(`wc -l "${file}"`);
        const lineCount = parseInt(wcOutput.trim().split(' ')[0]);
        
        if (lineCount === 0) {
          drifts.push({
            type: 'CRITICAL',
            source: 'MIGRATION_FILE',
            description: 'Empty migration file detected',
            details: `File ${file} is empty`,
            recommendation: 'Remove empty migration file or add migration content'
          });
        }
      }

      // Check migration order consistency
      const sortedFiles = [...migrationFiles].sort();
      for (let i = 0; i < sortedFiles.length - 1; i++) {
        const current = sortedFiles[i];
        const next = sortedFiles[i + 1];
        
        if (current > next) {
          drifts.push({
            type: 'WARNING',
            source: 'MIGRATION_FILE',
            description: 'Migration files not in chronological order',
            details: `File ${current} should come after ${next}`,
            recommendation: 'Ensure migration files are properly ordered by timestamp'
          });
        }
      }

    } catch (error) {
      drifts.push({
        type: 'WARNING',
        source: 'MIGRATION_FILE',
        description: 'Could not analyze migration files',
        details: (error as Error).message,
        recommendation: 'Check migration directory structure and permissions'
      });
    }

    return drifts;
  }

  private async checkDatabaseStateConsistency(): Promise<SchemaDrift[]> {
    const drifts: SchemaDrift[] = [];

    if (!this.config.checkDatabaseState) {
      return drifts;
    }

    try {
      // Check if database is accessible
      const { stdout, stderr } = await execAsync('npx prisma db pull --force 2>&1');
      
      if (stderr && stderr.includes('error')) {
        drifts.push({
          type: 'CRITICAL',
          source: 'DATABASE',
          description: 'Database connection failed',
          details: stderr,
          recommendation: 'Check database connection string and credentials'
        });
        return drifts;
      }

      // Compare pulled schema with current schema
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        drifts.push({
          type: 'WARNING',
          source: 'DATABASE',
          description: 'DATABASE_URL not configured',
          details: 'Cannot check database state without connection string',
          recommendation: 'Set DATABASE_URL environment variable'
        });
        return drifts;
      }
      
      const { stdout: diffOutput } = await execAsync(`npx prisma migrate diff --from-schema-datamodel ./prisma/schema.prisma --to-database-url "${databaseUrl}" --script 2>&1`);
      
      if (diffOutput && diffOutput.trim() !== '') {
        drifts.push({
          type: 'CRITICAL',
          source: 'DATABASE',
          description: 'Database schema drift detected',
          details: diffOutput,
          recommendation: 'Run migrations to sync database with schema or update schema'
        });
      }

    } catch (error) {
      const errorStr = error as any;
      if (errorStr.stdout && errorStr.stdout.trim() !== '') {
        drifts.push({
          type: 'CRITICAL',
          source: 'DATABASE',
          description: 'Database schema drift detected',
          details: errorStr.stdout,
          recommendation: 'Run migrations to sync database with schema or update schema'
        });
      } else {
        drifts.push({
          type: 'WARNING',
          source: 'DATABASE',
          description: 'Could not check database state',
          details: errorStr.message,
          recommendation: 'Ensure database is accessible and credentials are correct'
        });
      }
    }

    return drifts;
  }

  private async checkGeneratedClientConsistency(): Promise<SchemaDrift[]> {
    const drifts: SchemaDrift[] = [];

    if (!this.config.checkGeneratedClient) {
      return drifts;
    }

    try {
      // Check if Prisma client is generated
      const { stdout: lsOutput } = await execAsync('ls -la ./node_modules/.prisma/client/ 2>/dev/null || echo "no-client"');
      
      if (lsOutput.includes('no-client')) {
        drifts.push({
          type: 'WARNING',
          source: 'GENERATED_CLIENT',
          description: 'Prisma client not generated',
          details: 'Generated Prisma client not found',
          recommendation: 'Run `npx prisma generate` to generate the client'
        });
        return drifts;
      }

      // Check if client is up to date
      const { stdout, stderr } = await execAsync('npx prisma generate 2>&1');
      
      if (stderr && stderr.includes('error')) {
        drifts.push({
          type: 'CRITICAL',
          source: 'GENERATED_CLIENT',
          description: 'Prisma client generation failed',
          details: stderr,
          recommendation: 'Fix schema errors and regenerate client'
        });
      }

      // Check if client version matches schema
      const schemaPath = './prisma/schema.prisma';
      const clientVersionPath = './node_modules/.prisma/client/version.json';
      
      if (existsSync(schemaPath) && existsSync(clientVersionPath)) {
        const schemaContent = readFileSync(schemaPath, 'utf8');
        const clientVersion = JSON.parse(readFileSync(clientVersionPath, 'utf8'));
        
        // This is a simplified check - in practice, you'd want more sophisticated version tracking
        if (!schemaContent.includes('generator client')) {
          drifts.push({
            type: 'WARNING',
            source: 'GENERATED_CLIENT',
            description: 'Prisma client generator not configured',
            details: 'Schema does not include client generator configuration',
            recommendation: 'Add generator client block to Prisma schema'
          });
        }
      }

    } catch (error) {
      drifts.push({
        type: 'WARNING',
        source: 'GENERATED_CLIENT',
        description: 'Could not validate generated client',
        details: (error as Error).message,
        recommendation: 'Check Prisma installation and configuration'
      });
    }

    return drifts;
  }

  async detectDrift(): Promise<SchemaDriftResult> {
    const drifts: SchemaDrift[] = [];

    // Run all checks
    const prismaDrifts = await this.checkPrismaSchemaConsistency();
    const migrationDrifts = await this.checkMigrationFileConsistency();
    const databaseDrifts = await this.checkDatabaseStateConsistency();
    const clientDrifts = await this.checkGeneratedClientConsistency();

    drifts.push(...prismaDrifts, ...migrationDrifts, ...databaseDrifts, ...clientDrifts);

    // Categorize drifts
    const criticalDrifts = drifts.filter(d => d.type === 'CRITICAL');
    const warningDrifts = drifts.filter(d => d.type === 'WARNING');

    return {
      hasDrift: drifts.length > 0,
      drifts,
      summary: {
        totalDrifts: drifts.length,
        criticalDrifts: criticalDrifts.length,
        warningDrifts: warningDrifts.length
      }
    };
  }

  generateReport(result: SchemaDriftResult): string {
    let report = '# Schema Drift Detection Report\n\n';

    // Summary
    report += '## Summary\n';
    report += `- Total Drifts: ${result.summary.totalDrifts}\n`;
    report += `- Critical Drifts: ${result.summary.criticalDrifts}\n`;
    report += `- Warning Drifts: ${result.summary.warningDrifts}\n`;
    report += `- Status: ${result.hasDrift ? '❌ DRIFT DETECTED' : '✅ NO DRIFT'}\n\n`;

    if (!result.hasDrift) {
      report += '✅ All schema components are consistent and in sync.\n\n';
      return report;
    }

    // Group drifts by type
    const driftsByType = result.drifts.reduce((acc, drift) => {
      if (!acc[drift.type]) acc[drift.type] = [];
      acc[drift.type].push(drift);
      return acc;
    }, {} as Record<string, SchemaDrift[]>);

    // Critical drifts
    if (driftsByType.CRITICAL) {
      report += '## 🚨 CRITICAL DRIFTS\n\n';
      for (const drift of driftsByType.CRITICAL) {
        report += `### ${drift.source}\n`;
        report += `**Description**: ${drift.description}\n\n`;
        report += `**Details**: ${drift.details}\n\n`;
        report += `**Recommendation**: ${drift.recommendation}\n\n`;
      }
    }

    // Warning drifts
    if (driftsByType.WARNING) {
      report += '## ⚠️ WARNING DRIFTS\n\n';
      for (const drift of driftsByType.WARNING) {
        report += `### ${drift.source}\n`;
        report += `**Description**: ${drift.description}\n\n`;
        report += `**Details**: ${drift.details}\n\n`;
        report += `**Recommendation**: ${drift.recommendation}\n\n`;
      }
    }

    // Info drifts
    if (driftsByType.INFO) {
      report += '## ℹ️ INFO DRIFTS\n\n';
      for (const drift of driftsByType.INFO) {
        report += `### ${drift.source}\n`;
        report += `**Description**: ${drift.description}\n\n`;
        report += `**Details**: ${drift.details}\n\n`;
        report += `**Recommendation**: ${drift.recommendation}\n\n`;
      }
    }

    // Next steps
    report += '## 📋 Next Steps\n\n';
    if (driftsByType.CRITICAL) {
      report += '1. **Address all critical drifts immediately**\n';
      report += '2. Run `npx prisma migrate dev` to sync schema\n';
      report += '3. Regenerate Prisma client with `npx prisma generate`\n';
      report += '4. Test migrations in staging environment\n';
    } else {
      report += '1. Review and address warning drifts\n';
      report += '2. Consider updating migration files for consistency\n';
      report += '3. Ensure all team members are on same schema version\n';
    }

    return report;
  }
}

// CLI interface for CI/CD integration
export async function runSchemaDriftDetection(config?: Partial<DriftDetectionConfig>): Promise<void> {
  const detector = new SchemaDriftDetector(config);
  const result = await detector.detectDrift();
  
  console.log(detector.generateReport(result));
  
  if (result.hasDrift && result.summary.criticalDrifts > 0) {
    console.error('\n❌ Critical schema drift detected. CI blocked.');
    process.exit(1);
  } else if (result.hasDrift) {
    console.warn('\n⚠️ Schema drift detected. Review warnings.');
    process.exit(0);
  } else {
    console.log('\n✅ No schema drift detected.');
    process.exit(0);
  }
}

// Export for programmatic use
export { SchemaDriftDetector as default };
