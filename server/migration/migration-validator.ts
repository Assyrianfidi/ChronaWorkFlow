// Migration Safety Validator
// Enforces safe database migrations and blocks destructive changes

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface MigrationRule {
  name: string;
  type: 'DESTRUCTIVE' | 'UNSAFE' | 'WARNING';
  pattern: RegExp;
  description: string;
  requiresOverride: boolean;
}

export interface MigrationValidationResult {
  isValid: boolean;
  violations: MigrationViolation[];
  warnings: MigrationWarning[];
  summary: {
    totalFiles: number;
    violations: number;
    warnings: number;
  };
}

export interface MigrationViolation {
  file: string;
  line: number;
  rule: MigrationRule;
  matchedText: string;
  context: string;
}

export interface MigrationWarning {
  file: string;
  line: number;
  rule: MigrationRule;
  matchedText: string;
  context: string;
}

export interface MigrationSafetyConfig {
  allowDestructive: boolean;
  requireExplicitOverride: boolean;
  maxMigrationFiles: number;
  checkSchemaDrift: boolean;
  validateBackwardCompatibility: boolean;
}

export class MigrationSafetyValidator {
  private config: MigrationSafetyConfig;
  private rules: MigrationRule[];

  constructor(config: Partial<MigrationSafetyConfig> = {}) {
    this.config = {
      allowDestructive: false,
      requireExplicitOverride: true,
      maxMigrationFiles: 10,
      checkSchemaDrift: true,
      validateBackwardCompatibility: true,
      ...config
    };

    this.rules = this.initializeRules();
  }

  private initializeRules(): MigrationRule[] {
    return [
      // DESTRUCTIVE OPERATIONS (BLOCKED BY DEFAULT)
      {
        name: 'DROP_TABLE',
        type: 'DESTRUCTIVE',
        pattern: /DROP\s+TABLE\s+(IF\s+EXISTS\s+)?[`"']?(\w+)[`"']?/gi,
        description: 'Dropping tables is destructive and requires explicit override',
        requiresOverride: true
      },
      {
        name: 'DROP_COLUMN',
        type: 'DESTRUCTIVE',
        pattern: /DROP\s+COLUMN\s+(IF\s+EXISTS\s+)?[`"']?(\w+)[`"']?/gi,
        description: 'Dropping columns is destructive and requires explicit override',
        requiresOverride: true
      },
      {
        name: 'DROP_INDEX',
        type: 'DESTRUCTIVE',
        pattern: /DROP\s+INDEX\s+(IF\s+EXISTS\s+)?[`"']?(\w+)[`"']?/gi,
        description: 'Dropping indexes can impact performance and requires explicit override',
        requiresOverride: true
      },
      {
        name: 'DROP_CONSTRAINT',
        type: 'DESTRUCTIVE',
        pattern: /DROP\s+CONSTRAINT\s+(IF\s+EXISTS\s+)?[`"']?(\w+)[`"']?/gi,
        description: 'Dropping constraints can break data integrity and requires explicit override',
        requiresOverride: true
      },
      {
        name: 'TRUNCATE_TABLE',
        type: 'DESTRUCTIVE',
        pattern: /TRUNCATE\s+TABLE\s+(?:IF\s+EXISTS\s+)?[`"']?(\w+)[`"']?/gi,
        description: 'Truncating tables deletes all data and requires explicit override',
        requiresOverride: true
      },

      // UNSAFE OPERATIONS (BLOCKED BY DEFAULT)
      {
        name: 'ALTER_COLUMN_TYPE_NARROWING',
        type: 'UNSAFE',
        pattern: /ALTER\s+TABLE\s+[`"']?(\w+)[`"']?\s+ALTER\s+COLUMN\s+[`"']?(\w+)[`"']?\s+TYPE\s+(?!.*text).*?(?!.*varchar\(max\))/gi,
        description: 'Narrowing column types can cause data loss and requires explicit override',
        requiresOverride: true
      },
      {
        name: 'REMOVE_NOT_NULL',
        type: 'UNSAFE',
        pattern: /ALTER\s+TABLE\s+[`"']?(\w+)[`"']?\s+ALTER\s+COLUMN\s+[`"']?(\w+)[`"']?\s+DROP\s+NOT\s+NULL/gi,
        description: 'Removing NOT NULL constraints can break application logic and requires explicit override',
        requiresOverride: true
      },
      {
        name: 'REMOVE_DEFAULT',
        type: 'UNSAFE',
        pattern: /ALTER\s+TABLE\s+[`"']?(\w+)[`"']?\s+ALTER\s+COLUMN\s+[`"']?(\w+)[`"']?\s+DROP\s+DEFAULT/gi,
        description: 'Removing default values can break application logic and requires explicit override',
        requiresOverride: true
      },
      {
        name: 'RENAME_TABLE',
        type: 'UNSAFE',
        pattern: /ALTER\s+TABLE\s+[`"']?(\w+)[`"']?\s+RENAME\s+TO\s+[`"']?(\w+)[`"']?/gi,
        description: 'Renaming tables can break existing queries and requires explicit override',
        requiresOverride: true
      },
      {
        name: 'RENAME_COLUMN',
        type: 'UNSAFE',
        pattern: /ALTER\s+TABLE\s+[`"']?(\w+)[`"']?\s+RENAME\s+COLUMN\s+[`"']?(\w+)[`"']?\s+TO\s+[`"']?(\w+)[`"']?/gi,
        description: 'Renaming columns can break application code and requires explicit override',
        requiresOverride: true
      },

      // WARNING OPERATIONS (ALLOWED WITH WARNING)
      {
        name: 'ADD_COLUMN_WITH_NOT_NULL',
        type: 'WARNING',
        pattern: /ALTER\s+TABLE\s+[`"']?(\w+)[`"']?\s+ADD\s+COLUMN\s+[`"']?(\w+)[`"']?\s+\w+.*NOT\s+NULL/gi,
        description: 'Adding NOT NULL columns to existing tables can cause issues',
        requiresOverride: false
      },
      {
        name: 'CREATE_UNIQUE_INDEX',
        type: 'WARNING',
        pattern: /CREATE\s+(UNIQUE\s+)?INDEX\s+[`"']?(\w+)[`"']?/gi,
        description: 'Creating unique indexes can fail if duplicate data exists',
        requiresOverride: false
      },
      {
        name: 'ADD_FOREIGN_KEY',
        type: 'WARNING',
        pattern: /ALTER\s+TABLE\s+[`"']?(\w+)[`"']?\s+ADD\s+CONSTRAINT\s+[`"']?(\w+)[`"']?\s+FOREIGN\s+KEY/gi,
        description: 'Adding foreign keys can fail if referential integrity is violated',
        requiresOverride: false
      }
    ];
  }

  private hasExplicitOverride(content: string): boolean {
    // Check for explicit override annotation
    const overridePatterns = [
      /--\s*@override-destructive/i,
      /--\s*@migration-override/i,
      /--\s*@allow-destructive/i,
      /\/\*\s*@override-destructive\s*\*\//i,
      /\/\*\s*@migration-override\s*\*\//i
    ];

    return overridePatterns.some(pattern => pattern.test(content));
  }

  private validateFile(filePath: string): { violations: MigrationViolation[]; warnings: MigrationWarning[] } {
    const violations: MigrationViolation[] = [];
    const warnings: MigrationWarning[] = [];

    if (!existsSync(filePath)) {
      return { violations, warnings };
    }

    const content = readFileSync(filePath, 'utf8');
    const hasOverride = this.hasExplicitOverride(content);
    const lines = content.split('\n');

    for (const rule of this.rules) {
      let match;
      const regex = new RegExp(rule.pattern);
      
      // Reset regex lastIndex
      regex.lastIndex = 0;

      while ((match = regex.exec(content)) !== null) {
        const lineIndex = content.substring(0, match.index).split('\n').length - 1;
        const line = lines[lineIndex] || '';
        
        const issue = {
          file: filePath,
          line: lineIndex + 1,
          rule,
          matchedText: match[0],
          context: line.trim()
        };

        if (rule.type === 'DESTRUCTIVE' || rule.type === 'UNSAFE') {
          // Block unless explicitly overridden
          if (rule.requiresOverride && !hasOverride && !this.config.allowDestructive) {
            violations.push(issue);
          }
        } else if (rule.type === 'WARNING') {
          warnings.push(issue);
        }
      }
    }

    return { violations, warnings };
  }

  private async getMigrationFiles(migrationsPath: string): Promise<string[]> {
    try {
      const { stdout } = await execAsync(`find "${migrationsPath}" -name "*.sql" -type f | sort`);
      return stdout.trim().split('\n').filter(file => file.length > 0);
    } catch (error) {
      console.warn(`Could not read migration files from ${migrationsPath}:`, error);
      return [];
    }
  }

  private async validatePrismaSchema(): Promise<{ violations: MigrationViolation[]; warnings: MigrationWarning[] }> {
    const violations: MigrationViolation[] = [];
    const warnings: MigrationWarning[] = [];

    const schemaPath = './prisma/schema.prisma';
    if (!existsSync(schemaPath)) {
      return { violations, warnings };
    }

    const content = readFileSync(schemaPath, 'utf8');
    const lines = content.split('\n');

    // Check for unsafe Prisma schema operations
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for model deletions
      if (line.startsWith('@@map') && i > 0) {
        const prevLine = lines[i - 1].trim();
        if (prevLine.startsWith('model') && prevLine.includes('_deleted')) {
          violations.push({
            file: schemaPath,
            line: i + 1,
            rule: {
              name: 'MODEL_DELETION',
              type: 'DESTRUCTIVE',
              pattern: /model.*_deleted/,
              description: 'Model deletion detected - use explicit override',
              requiresOverride: true
            },
            matchedText: prevLine,
            context: line
          });
        }
      }

      // Check for field deletions
      if (line.includes('@@ignore')) {
        violations.push({
          file: schemaPath,
          line: i + 1,
          rule: {
            name: 'FIELD_DELETION',
            type: 'DESTRUCTIVE',
            pattern: /@@ignore/,
            description: 'Field deletion detected - use explicit override',
            requiresOverride: true
          },
          matchedText: line,
          context: line
        });
      }
    }

    return { violations, warnings };
  }

  private async checkSchemaDrift(): Promise<{ violations: MigrationViolation[]; warnings: MigrationWarning[] }> {
    const violations: MigrationViolation[] = [];
    const warnings: MigrationWarning[] = [];

    if (!this.config.checkSchemaDrift) {
      return { violations, warnings };
    }

    try {
      // Check if Prisma migrations are in sync with schema
      const { stdout, stderr } = await execAsync('npx prisma migrate diff --from-migrations ./prisma/migrations --to-schema-datamodel ./prisma/schema.prisma --script');
      
      if (stdout && stdout.trim() !== '') {
        violations.push({
          file: 'schema-drift',
          line: 1,
          rule: {
            name: 'SCHEMA_DRIFT',
            type: 'DESTRUCTIVE',
            pattern: /./,
            description: 'Schema drift detected between Prisma schema and migrations',
            requiresOverride: true
          },
          matchedText: stdout,
          context: 'Schema drift detected'
        });
      }
    } catch (error) {
      // Prisma migrate diff returns non-zero exit code when drift exists
      const errorStr = error as any;
      if (errorStr.stdout && errorStr.stdout.trim() !== '') {
        violations.push({
          file: 'schema-drift',
          line: 1,
          rule: {
            name: 'SCHEMA_DRIFT',
            type: 'DESTRUCTIVE',
            pattern: /./,
            description: 'Schema drift detected between Prisma schema and migrations',
            requiresOverride: true
          },
          matchedText: errorStr.stdout,
          context: 'Schema drift detected'
        });
      }
    }

    return { violations, warnings };
  }

  private async validateBackwardCompatibility(): Promise<{ violations: MigrationViolation[]; warnings: MigrationWarning[] }> {
    const violations: MigrationViolation[] = [];
    const warnings: MigrationWarning[] = [];

    if (!this.config.validateBackwardCompatibility) {
      return { violations, warnings };
    }

    // Check for breaking changes in the latest migration
    const migrationFiles = await this.getMigrationFiles('./prisma/migrations');
    if (migrationFiles.length === 0) {
      return { violations, warnings };
    }

    const latestMigration = migrationFiles[migrationFiles.length - 1];
    const content = readFileSync(latestMigration, 'utf8');

    // Check for backward compatibility issues
    const breakingPatterns = [
      {
        name: 'REMOVING_REQUIRED_FIELD',
        pattern: /DROP\s+COLUMN.*NOT\s+NULL/i,
        description: 'Removing required fields breaks backward compatibility'
      },
      {
        name: 'CHANGING_FIELD_TYPE',
        pattern: /ALTER\s+COLUMN.*TYPE/i,
        description: 'Changing field types can break existing applications'
      },
      {
        name: 'REMOVING_INDEX',
        pattern: /DROP\s+INDEX.*WHERE.*unique/i,
        description: 'Removing unique indexes can break constraints'
      }
    ];

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const pattern of breakingPatterns) {
        if (pattern.pattern.test(line)) {
          violations.push({
            file: latestMigration,
            line: i + 1,
            rule: {
              name: pattern.name,
              type: 'UNSAFE',
              pattern: pattern.pattern,
              description: pattern.description,
              requiresOverride: true
            },
            matchedText: line,
            context: line.trim()
          });
        }
      }
    }

    return { violations, warnings };
  }

  async validateMigrations(migrationsPath: string = './prisma/migrations'): Promise<MigrationValidationResult> {
    const violations: MigrationViolation[] = [];
    const warnings: MigrationWarning[] = [];

    // 1. Validate individual migration files
    const migrationFiles = await this.getMigrationFiles(migrationsPath);
    
    if (migrationFiles.length > this.config.maxMigrationFiles) {
      violations.push({
        file: 'migration-count',
        line: 1,
        rule: {
          name: 'TOO_MANY_MIGRATIONS',
          type: 'UNSAFE',
          pattern: /./,
          description: `Too many migration files (${migrationFiles.length} > ${this.config.maxMigrationFiles})`,
          requiresOverride: true
        },
        matchedText: migrationFiles.length.toString(),
        context: 'Migration count validation'
      });
    }

    for (const filePath of migrationFiles) {
      const fileResult = this.validateFile(filePath);
      violations.push(...fileResult.violations);
      warnings.push(...fileResult.warnings);
    }

    // 2. Validate Prisma schema
    const schemaResult = await this.validatePrismaSchema();
    violations.push(...schemaResult.violations);
    warnings.push(...schemaResult.warnings);

    // 3. Check for schema drift
    const driftResult = await this.checkSchemaDrift();
    violations.push(...driftResult.violations);
    warnings.push(...driftResult.warnings);

    // 4. Validate backward compatibility
    const compatibilityResult = await this.validateBackwardCompatibility();
    violations.push(...compatibilityResult.violations);
    warnings.push(...compatibilityResult.warnings);

    return {
      isValid: violations.length === 0,
      violations,
      warnings,
      summary: {
        totalFiles: migrationFiles.length,
        violations: violations.length,
        warnings: warnings.length
      }
    };
  }

  generateReport(result: MigrationValidationResult): string {
    let report = '# Migration Safety Validation Report\n\n';

    // Summary
    report += '## Summary\n';
    report += `- Total Files: ${result.summary.totalFiles}\n`;
    report += `- Violations: ${result.summary.violations}\n`;
    report += `- Warnings: ${result.summary.warnings}\n`;
    report += `- Status: ${result.isValid ? '✅ PASSED' : '❌ FAILED'}\n\n`;

    // Violations
    if (result.violations.length > 0) {
      report += '## ❌ VIOLATIONS\n\n';
      
      const violationsByRule = result.violations.reduce((acc, v) => {
        if (!acc[v.rule.name]) acc[v.rule.name] = [];
        acc[v.rule.name].push(v);
        return acc;
      }, {} as Record<string, MigrationViolation[]>);

      for (const [ruleName, violations] of Object.entries(violationsByRule)) {
        report += `### ${ruleName}\n`;
        report += `${violations[0].rule.description}\n\n`;
        
        for (const violation of violations) {
          report += `- **File**: ${violation.file}:${violation.line}\n`;
          report += `  **Code**: \`${violation.matchedText}\`\n`;
          report += `  **Context**: ${violation.context}\n`;
          report += `  **Required**: Add \`-- @override-destructive\` to proceed\n\n`;
        }
      }
    }

    // Warnings
    if (result.warnings.length > 0) {
      report += '## ⚠️ WARNINGS\n\n';
      
      const warningsByRule = result.warnings.reduce((acc, w) => {
        if (!acc[w.rule.name]) acc[w.rule.name] = [];
        acc[w.rule.name].push(w);
        return acc;
      }, {} as Record<string, MigrationWarning[]>);

      for (const [ruleName, warnings] of Object.entries(warningsByRule)) {
        report += `### ${ruleName}\n`;
        report += `${warnings[0].rule.description}\n\n`;
        
        for (const warning of warnings) {
          report += `- **File**: ${warning.file}:${warning.line}\n`;
          report += `  **Code**: \`${warning.matchedText}\`\n`;
          report += `  **Context**: ${warning.context}\n\n`;
        }
      }
    }

    // Recommendations
    if (!result.isValid) {
      report += '## 📋 RECOMMENDATIONS\n\n';
      report += '1. Review all violations and ensure they are intentional\n';
      report += '2. Add explicit override comments for destructive changes\n';
      report += '3. Consider alternative approaches that avoid destructive operations\n';
      report += '4. Test migrations in a staging environment first\n\n';
    }

    return report;
  }
}

// CLI interface for CI/CD integration
export async function runMigrationValidation(config?: Partial<MigrationSafetyConfig>): Promise<void> {
  const validator = new MigrationSafetyValidator(config);
  const result = await validator.validateMigrations();
  
  console.log(validator.generateReport(result));
  
  if (!result.isValid) {
    console.error('\n❌ Migration validation failed. CI blocked.');
    process.exit(1);
  } else {
    console.log('\n✅ Migration validation passed.');
    process.exit(0);
  }
}

// Export for programmatic use
export { MigrationSafetyValidator as default };
