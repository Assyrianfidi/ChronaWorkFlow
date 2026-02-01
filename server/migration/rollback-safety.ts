// Rollback and Roll-forward Safety System
// Enforces safe migration patterns and prevents data corruption

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export enum MigrationType {
  EXPAND = 'EXPAND',     // Safe, additive changes
  CONTRACT = 'CONTRACT', // Potentially destructive, requires care
  DANGEROUS = 'DANGEROUS' // High risk, blocked by default
}

export interface RollbackSafetyRule {
  name: string;
  type: MigrationType;
  pattern: RegExp;
  description: string;
  rollbackRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  requiresRollbackPlan: boolean;
  reversible: boolean;
}

export interface RollbackSafetyResult {
  isSafe: boolean;
  migrationType: MigrationType;
  violations: RollbackViolation[];
  warnings: RollbackWarning[];
  rollbackPlan: string[];
  summary: {
    totalFiles: number;
    violations: number;
    warnings: number;
    reversibleMigrations: number;
  };
}

export interface RollbackViolation {
  file: string;
  line: number;
  rule: RollbackSafetyRule;
  matchedText: string;
  context: string;
  rollbackComplexity: 'SIMPLE' | 'COMPLEX' | 'IMPOSSIBLE';
}

export interface RollbackWarning {
  file: string;
  line: number;
  rule: RollbackSafetyRule;
  matchedText: string;
  context: string;
  rollbackComplexity: 'SIMPLE' | 'COMPLEX';
}

export interface RollbackSafetyConfig {
  allowContractMigrations: boolean;
  requireRollbackPlan: boolean;
  maxRollbackComplexity: 'SIMPLE' | 'COMPLEX' | 'IMPOSSIBLE';
  validateReversibility: boolean;
  generateRollbackScripts: boolean;
}

export class RollbackSafetyValidator {
  private config: RollbackSafetyConfig;
  private rules: RollbackSafetyRule[];

  constructor(config: Partial<RollbackSafetyConfig> = {}) {
    this.config = {
      allowContractMigrations: false,
      requireRollbackPlan: true,
      maxRollbackComplexity: 'COMPLEX',
      validateReversibility: true,
      generateRollbackScripts: true,
      ...config
    };

    this.rules = this.initializeRules();
  }

  private initializeRules(): RollbackSafetyRule[] {
    return [
      // EXPAND MIGRATIONS (Safe by default)
      {
        name: 'ADD_TABLE',
        type: MigrationType.EXPAND,
        pattern: /CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?/gi,
        description: 'Adding new tables is safe and easily reversible',
        rollbackRisk: 'LOW',
        requiresRollbackPlan: false,
        reversible: true
      },
      {
        name: 'ADD_COLUMN',
        type: MigrationType.EXPAND,
        pattern: /ALTER\s+TABLE\s+[`"']?(\w+)[`"']?\s+ADD\s+COLUMN\s+(IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?/gi,
        description: 'Adding new columns is safe and easily reversible',
        rollbackRisk: 'LOW',
        requiresRollbackPlan: false,
        reversible: true
      },
      {
        name: 'ADD_INDEX',
        type: MigrationType.EXPAND,
        pattern: /CREATE\s+(UNIQUE\s+)?INDEX\s+(IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?/gi,
        description: 'Adding indexes is safe and easily reversible',
        rollbackRisk: 'LOW',
        requiresRollbackPlan: false,
        reversible: true
      },
      {
        name: 'ADD_CONSTRAINT',
        type: MigrationType.EXPAND,
        pattern: /ALTER\s+TABLE\s+[`"']?(\w+)[`"']?\s+ADD\s+CONSTRAINT\s+(IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?/gi,
        description: 'Adding constraints is generally safe and reversible',
        rollbackRisk: 'MEDIUM',
        requiresRollbackPlan: true,
        reversible: true
      },

      // CONTRACT MIGRATIONS (Restricted)
      {
        name: 'DROP_TABLE',
        type: MigrationType.CONTRACT,
        pattern: /DROP\s+TABLE\s+(IF\s+EXISTS\s+)?[`"']?(\w+)[`"']?/gi,
        description: 'Dropping tables is destructive and requires careful planning',
        rollbackRisk: 'HIGH',
        requiresRollbackPlan: true,
        reversible: false
      },
      {
        name: 'DROP_COLUMN',
        type: MigrationType.CONTRACT,
        pattern: /ALTER\s+TABLE\s+[`"']?(\w+)[`"']?\s+DROP\s+COLUMN\s+(IF\s+EXISTS\s+)?[`"']?(\w+)[`"']?/gi,
        description: 'Dropping columns is destructive and requires careful planning',
        rollbackRisk: 'HIGH',
        requiresRollbackPlan: true,
        reversible: false
      },
      {
        name: 'DROP_INDEX',
        type: MigrationType.CONTRACT,
        pattern: /DROP\s+INDEX\s+(IF\s+EXISTS\s+)?[`"']?(\w+)[`"']?/gi,
        description: 'Dropping indexes can impact performance but is reversible',
        rollbackRisk: 'MEDIUM',
        requiresRollbackPlan: true,
        reversible: true
      },
      {
        name: 'DROP_CONSTRAINT',
        type: MigrationType.CONTRACT,
        pattern: /ALTER\s+TABLE\s+[`"']?(\w+)[`"']?\s+DROP\s+CONSTRAINT\s+(IF\s+EXISTS\s+)?[`"']?(\w+)[`"']?/gi,
        description: 'Dropping constraints can impact data integrity',
        rollbackRisk: 'HIGH',
        requiresRollbackPlan: true,
        reversible: true
      },

      // DANGEROUS MIGRATIONS (Blocked by default)
      {
        name: 'ALTER_COLUMN_TYPE',
        type: MigrationType.DANGEROUS,
        pattern: /ALTER\s+TABLE\s+[`"']?(\w+)[`"']?\s+ALTER\s+COLUMN\s+[`"']?(\w+)[`"']?\s+TYPE/gi,
        description: 'Changing column types can cause data loss',
        rollbackRisk: 'HIGH',
        requiresRollbackPlan: true,
        reversible: false
      },
      {
        name: 'RENAME_TABLE',
        type: MigrationType.DANGEROUS,
        pattern: /ALTER\s+TABLE\s+[`"']?(\w+)[`"']?\s+RENAME\s+TO\s+[`"']?(\w+)[`"']?/gi,
        description: 'Renaming tables can break application code',
        rollbackRisk: 'HIGH',
        requiresRollbackPlan: true,
        reversible: true
      },
      {
        name: 'RENAME_COLUMN',
        type: MigrationType.DANGEROUS,
        pattern: /ALTER\s+TABLE\s+[`"']?(\w+)[`"']?\s+RENAME\s+COLUMN\s+[`"']?(\w+)[`"']?\s+TO\s+[`"']?(\w+)[`"']?/gi,
        description: 'Renaming columns can break application code',
        rollbackRisk: 'HIGH',
        requiresRollbackPlan: true,
        reversible: true
      },
      {
        name: 'TRUNCATE_TABLE',
        type: MigrationType.DANGEROUS,
        pattern: /TRUNCATE\s+TABLE\s+(IF\s+EXISTS\s+)?[`"']?(\w+)[`"']?/gi,
        description: 'Truncating tables deletes all data',
        rollbackRisk: 'HIGH',
        requiresRollbackPlan: true,
        reversible: false
      }
    ];
  }

  private generateRollbackScript(match: RegExpMatchArray, rule: RollbackSafetyRule): string {
    const sql = match[0];
    
    switch (rule.name) {
      case 'ADD_TABLE':
        return sql.replace(/CREATE\s+TABLE/i, 'DROP TABLE').replace(/IF\s+NOT\s+EXISTS/i, 'IF EXISTS');
      
      case 'ADD_COLUMN':
        return sql.replace(/ALTER\s+TABLE\s+[`"']?\w+[`"']?\s+ADD\s+COLUMN/i, 'ALTER TABLE').replace(/IF\s+NOT\s+EXISTS\s+[`"']?\w+[`"']?/i, 'DROP COLUMN');
      
      case 'ADD_INDEX':
        return sql.replace(/CREATE\s+(UNIQUE\s+)?INDEX/i, 'DROP INDEX').replace(/IF\s+NOT\s+EXISTS/i, 'IF EXISTS');
      
      case 'ADD_CONSTRAINT':
        return sql.replace(/ALTER\s+TABLE\s+[`"']?\w+[`"']?\s+ADD\s+CONSTRAINT/i, 'ALTER TABLE').replace(/IF\s+NOT\s+EXISTS\s+[`"']?\w+[`"']?/i, 'DROP CONSTRAINT');
      
      case 'DROP_INDEX':
        return sql.replace(/DROP\s+INDEX/i, 'CREATE INDEX').replace(/IF\s+EXISTS/i, '');
      
      case 'DROP_CONSTRAINT':
        return sql.replace(/ALTER\s+TABLE\s+[`"']?\w+[`"']?\s+DROP\s+CONSTRAINT/i, 'ALTER TABLE').replace(/IF\s+EXISTS\s+[`"']?\w+[`"']?/i, 'ADD CONSTRAINT');
      
      default:
        return '-- Rollback not automatically generated for this operation';
    }
  }

  private assessRollbackComplexity(rule: RollbackSafetyRule): 'SIMPLE' | 'COMPLEX' | 'IMPOSSIBLE' {
    if (!rule.reversible) return 'IMPOSSIBLE';
    if (rule.rollbackRisk === 'HIGH') return 'COMPLEX';
    if (rule.rollbackRisk === 'MEDIUM') return 'COMPLEX';
    return 'SIMPLE';
  }

  private validateFile(filePath: string): { violations: RollbackViolation[]; warnings: RollbackWarning[]; rollbackPlan: string[] } {
    const violations: RollbackViolation[] = [];
    const warnings: RollbackWarning[] = [];
    const rollbackPlan: string[] = [];

    if (!existsSync(filePath)) {
      return { violations, warnings, rollbackPlan };
    }

    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (const rule of this.rules) {
      let match;
      const regex = new RegExp(rule.pattern);
      
      // Reset regex lastIndex
      regex.lastIndex = 0;

      while ((match = regex.exec(content)) !== null) {
        const lineIndex = content.substring(0, match.index).split('\n').length - 1;
        const line = lines[lineIndex] || '';
        
        const rollbackComplexity = this.assessRollbackComplexity(rule);
        
        const issue = {
          file: filePath,
          line: lineIndex + 1,
          rule,
          matchedText: match[0],
          context: line.trim(),
          rollbackComplexity
        };

        // Check if migration type is allowed
        if (rule.type === MigrationType.DANGEROUS) {
          violations.push(issue);
        } else if (rule.type === MigrationType.CONTRACT && !this.config.allowContractMigrations) {
          violations.push(issue);
        } else if (rule.type === MigrationType.CONTRACT && this.config.allowContractMigrations) {
          if (rollbackComplexity !== 'IMPOSSIBLE') {
            warnings.push({
              file: filePath,
              line: lineIndex + 1,
              rule,
              matchedText: match[0],
              context: line.trim(),
              rollbackComplexity: rollbackComplexity as 'SIMPLE' | 'COMPLEX'
            });
          } else {
            violations.push(issue);
          }
        }

        // Generate rollback script if enabled and reversible
        if (this.config.generateRollbackScripts && rule.reversible) {
          const rollbackScript = this.generateRollbackScript(match, rule);
          rollbackPlan.push(`-- Rollback for ${rule.name} at line ${lineIndex + 1}`);
          rollbackPlan.push(rollbackScript);
          rollbackPlan.push('');
        }
      }
    }

    return { violations, warnings, rollbackPlan };
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

  private validateRollbackPlan(content: string): boolean {
    // Check if migration has explicit rollback plan
    const rollbackPatterns = [
      /--\s*@rollback-plan/i,
      /--\s*@rollback/i,
      /--\s*@down/i,
      /\/\*\s*@rollback-plan\s*\*\//i
    ];

    return rollbackPatterns.some(pattern => pattern.test(content));
  }

  private async validateMigrationReversibility(migrationsPath: string): Promise<{ violations: RollbackViolation[]; warnings: RollbackWarning[] }> {
    const violations: RollbackViolation[] = [];
    const warnings: RollbackWarning[] = [];

    if (!this.config.validateReversibility) {
      return { violations, warnings };
    }

    const migrationFiles = await this.getMigrationFiles(migrationsPath);
    
    for (const filePath of migrationFiles) {
      const content = readFileSync(filePath, 'utf8');
      
      // Check if migration has rollback plan for complex operations
      const fileResult = this.validateFile(filePath);
      const hasComplexOperations = fileResult.violations.some(v => v.rollbackComplexity === 'COMPLEX' || v.rollbackComplexity === 'IMPOSSIBLE');
      
      if (hasComplexOperations && !this.validateRollbackPlan(content)) {
        violations.push({
          file: filePath,
          line: 1,
          rule: {
            name: 'MISSING_ROLLBACK_PLAN',
            type: MigrationType.DANGEROUS,
            pattern: /./,
            description: 'Complex migration missing rollback plan',
            rollbackRisk: 'HIGH',
            requiresRollbackPlan: true,
            reversible: false
          },
          matchedText: 'ENTIRE_FILE',
          context: 'Migration contains complex operations without rollback plan',
          rollbackComplexity: 'IMPOSSIBLE'
        });
      }
    }

    return { violations, warnings };
  }

  async validateRollbackSafety(migrationsPath: string = './prisma/migrations'): Promise<RollbackSafetyResult> {
    const violations: RollbackViolation[] = [];
    const warnings: RollbackWarning[] = [];
    const rollbackPlan: string[] = [];
    let reversibleMigrations = 0;

    // 1. Validate individual migration files
    const migrationFiles = await this.getMigrationFiles(migrationsPath);
    
    for (const filePath of migrationFiles) {
      const fileResult = this.validateFile(filePath);
      violations.push(...fileResult.violations);
      warnings.push(...fileResult.warnings);
      rollbackPlan.push(...fileResult.rollbackPlan);
      
      // Count reversible migrations
      const hasOnlyReversibleOps = fileResult.violations.every(v => v.rule.reversible);
      if (hasOnlyReversibleOps) {
        reversibleMigrations++;
      }
    }

    // 2. Validate migration reversibility
    const reversibilityResult = await this.validateMigrationReversibility(migrationsPath);
    violations.push(...reversibilityResult.violations);
    warnings.push(...reversibilityResult.warnings);

    // 3. Determine overall migration type
    let migrationType = MigrationType.EXPAND;
    if (violations.some(v => v.rule.type === MigrationType.DANGEROUS)) {
      migrationType = MigrationType.DANGEROUS;
    } else if (violations.some(v => v.rule.type === MigrationType.CONTRACT) || warnings.some(w => w.rule.type === MigrationType.CONTRACT)) {
      migrationType = MigrationType.CONTRACT;
    }

    // 4. Check rollback complexity limits
    const hasImpossibleRollbacks = violations.some(v => v.rollbackComplexity === 'IMPOSSIBLE');
    const hasComplexRollbacks = violations.some(v => v.rollbackComplexity === 'COMPLEX');
    
    const isSafe = !hasImpossibleRollbacks && 
                   (this.config.maxRollbackComplexity === 'IMPOSSIBLE' || 
                    (this.config.maxRollbackComplexity === 'COMPLEX' && !hasImpossibleRollbacks) ||
                    (this.config.maxRollbackComplexity === 'SIMPLE' && !hasComplexRollbacks && !hasImpossibleRollbacks));

    return {
      isSafe,
      migrationType,
      violations,
      warnings,
      rollbackPlan,
      summary: {
        totalFiles: migrationFiles.length,
        violations: violations.length,
        warnings: warnings.length,
        reversibleMigrations
      }
    };
  }

  generateReport(result: RollbackSafetyResult): string {
    let report = '# Rollback Safety Validation Report\n\n';

    // Summary
    report += '## Summary\n';
    report += `- Migration Type: ${result.migrationType}\n`;
    report += `- Total Files: ${result.summary.totalFiles}\n`;
    report += `- Violations: ${result.summary.violations}\n`;
    report += `- Warnings: ${result.summary.warnings}\n`;
    report += `- Reversible Migrations: ${result.summary.reversibleMigrations}\n`;
    report += `- Status: ${result.isSafe ? '✅ SAFE' : '❌ UNSAFE'}\n\n`;

    // Migration type explanation
    report += '## Migration Type Analysis\n';
    switch (result.migrationType) {
      case MigrationType.EXPAND:
        report += '✅ **EXPAND MIGRATIONS** - Safe, additive changes only\n';
        report += 'These migrations only add new tables, columns, or indexes and are easily reversible.\n\n';
        break;
      case MigrationType.CONTRACT:
        report += '⚠️ **CONTRACT MIGRATIONS** - Potentially destructive changes\n';
        report += 'These migrations remove or modify existing structures and require careful planning.\n\n';
        break;
      case MigrationType.DANGEROUS:
        report += '❌ **DANGEROUS MIGRATIONS** - High risk operations\n';
        report += 'These migrations include operations that can cause data loss or break applications.\n\n';
        break;
    }

    // Violations
    if (result.violations.length > 0) {
      report += '## ❌ VIOLATIONS\n\n';
      
      const violationsByType = result.violations.reduce((acc, v) => {
        if (!acc[v.rule.name]) acc[v.rule.name] = [];
        acc[v.rule.name].push(v);
        return acc;
      }, {} as Record<string, RollbackViolation[]>);

      for (const [ruleName, violations] of Object.entries(violationsByType)) {
        report += `### ${ruleName}\n`;
        report += `${violations[0].rule.description}\n`;
        report += `**Rollback Risk**: ${violations[0].rule.rollbackRisk}\n`;
        report += `**Reversible**: ${violations[0].rule.reversible ? 'Yes' : 'No'}\n\n`;
        
        for (const violation of violations) {
          report += `- **File**: ${violation.file}:${violation.line}\n`;
          report += `  **Operation**: \`${violation.matchedText}\`\n`;
          report += `  **Rollback Complexity**: ${violation.rollbackComplexity}\n`;
          report += `  **Context**: ${violation.context}\n\n`;
        }
      }
    }

    // Warnings
    if (result.warnings.length > 0) {
      report += '## ⚠️ WARNINGS\n\n';
      
      const warningsByType = result.warnings.reduce((acc, w) => {
        if (!acc[w.rule.name]) acc[w.rule.name] = [];
        acc[w.rule.name].push(w);
        return acc;
      }, {} as Record<string, RollbackWarning[]>);

      for (const [ruleName, warnings] of Object.entries(warningsByType)) {
        report += `### ${ruleName}\n`;
        report += `${warnings[0].rule.description}\n`;
        report += `**Rollback Risk**: ${warnings[0].rule.rollbackRisk}\n\n`;
        
        for (const warning of warnings) {
          report += `- **File**: ${warning.file}:${warning.line}\n`;
          report += `  **Operation**: \`${warning.matchedText}\`\n`;
          report += `  **Rollback Complexity**: ${warning.rollbackComplexity}\n`;
          report += `  **Context**: ${warning.context}\n\n`;
        }
      }
    }

    // Rollback plan
    if (result.rollbackPlan.length > 0) {
      report += '## 🔄 Generated Rollback Plan\n\n';
      report += '```sql\n';
      report += result.rollbackPlan.join('\n');
      report += '\n```\n\n';
    }

    // Recommendations
    if (!result.isSafe) {
      report += '## 📋 RECOMMENDATIONS\n\n';
      report += '1. **Review all violations** and ensure they are absolutely necessary\n';
      report += '2. **Create explicit rollback plans** for all complex operations\n';
      report += '3. **Test rollback procedures** in a staging environment\n';
      report += '4. **Consider alternative approaches** that avoid destructive operations\n';
      report += '5. **Document emergency procedures** for failed rollbacks\n\n';
    }

    return report;
  }
}

// CLI interface for CI/CD integration
export async function runRollbackSafetyValidation(config?: Partial<RollbackSafetyConfig>): Promise<void> {
  const validator = new RollbackSafetyValidator(config);
  const result = await validator.validateRollbackSafety();
  
  console.log(validator.generateReport(result));
  
  if (!result.isSafe) {
    console.error('\n❌ Rollback safety validation failed. CI blocked.');
    process.exit(1);
  } else {
    console.log('\n✅ Rollback safety validation passed.');
    process.exit(0);
  }
}

// Export for programmatic use
export { RollbackSafetyValidator as default };
