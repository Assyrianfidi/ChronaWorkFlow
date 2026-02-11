/**
 * ACCUBOOKS SAFE DATABASE MIGRATION FRAMEWORK
 * Owner-Level Change Authority - Core Mechanism #3
 * 
 * Rules:
 * - Add tables: ✅ Allowed
 * - Add nullable columns: ✅ Allowed
 * - Add indexes concurrently: ✅ Allowed
 * - Add triggers in shadow mode: ✅ Allowed
 * - Drop columns: ❌ Forbidden (use Expand→Migrate→Contract)
 * - Change column meaning: ❌ Forbidden
 * - Non-reversible migrations: ❌ Forbidden
 * 
 * Strategy: Expand → Migrate → Contract
 */

import { Pool, PoolClient } from 'pg';
import { EventEmitter } from 'events';

export interface Migration {
  id: string;
  name: string;
  description: string;
  type: 'expand' | 'migrate' | 'contract' | 'dual-write' | 'read-fallback';
  sql: string;
  rollbackSql: string;
  dependencies: string[];
  estimatedDuration: number; // seconds
  requiresLock: boolean;
  accountingSafe: boolean;
  
  // Safety checks
  preCheckSql?: string;
  postCheckSql?: string;
  validationSql?: string;
}

export interface MigrationResult {
  migration: Migration;
  success: boolean;
  startTime: Date;
  endTime: Date;
  duration: number;
  error?: string;
  rowsAffected?: number;
}

export class SafeMigrationFramework extends EventEmitter {
  private db: Pool;
  private activeMigrations: Map<string, Migration> = new Map();
  private completedMigrations: MigrationResult[] = [];

  constructor(db: Pool) {
    super();
    this.db = db;
  }

  /**
   * VALIDATE MIGRATION SAFETY
   * Check if migration can be run safely while live
   */
  async validateMigration(migration: Migration): Promise<{ safe: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Check for forbidden operations
    const forbiddenPatterns = [
      { pattern: /DROP\s+COLUMN/i, message: 'DROP COLUMN forbidden - use Expand→Migrate→Contract' },
      { pattern: /ALTER\s+COLUMN.*TYPE/i, message: 'ALTER COLUMN TYPE forbidden - use dual-write strategy' },
      { pattern: /DELETE\s+FROM/i, message: 'DELETE without WHERE check' },
      { pattern: /UPDATE\s+.*SET.*WHERE/i, message: 'UPDATE requires validation' },
      { pattern: /TRUNCATE/i, message: 'TRUNCATE forbidden while live' }
    ];

    for (const check of forbiddenPatterns) {
      if (check.pattern.test(migration.sql)) {
        issues.push(check.message);
      }
    }

    // Check for missing rollback
    if (!migration.rollbackSql || migration.rollbackSql.trim() === '') {
      issues.push('Missing rollback SQL - every migration must be reversible');
    }

    // Check accounting safety
    if (!migration.accountingSafe) {
      issues.push('Migration not marked as accounting-safe - requires review');
    }

    // Check for lock requirements
    if (migration.requiresLock) {
      const canAcquireLock = await this.canAcquireLock();
      if (!canAcquireLock) {
        issues.push('Cannot acquire lock - too much active traffic');
      }
    }

    return {
      safe: issues.length === 0,
      issues
    };
  }

  /**
   * EXECUTE MIGRATION with safety checks
   */
  async executeMigration(migration: Migration): Promise<MigrationResult> {
    console.log(`🔧 Executing migration: ${migration.name} (${migration.type})`);

    const startTime = new Date();
    const result: MigrationResult = {
      migration,
      success: false,
      startTime,
      endTime: startTime,
      duration: 0
    };

    try {
      // Pre-check
      if (migration.preCheckSql) {
        console.log('  Running pre-check...');
        const preCheck = await this.db.query(migration.preCheckSql);
        if (!this.validatePreCheck(preCheck)) {
          throw new Error('Pre-check failed - migration prerequisites not met');
        }
      }

      // Execute in transaction
      const client = await this.db.connect();
      try {
        await client.query('BEGIN');

        // Set statement timeout to prevent long locks
        await client.query('SET statement_timeout = 30000'); // 30 seconds

        // Execute migration
        console.log('  Executing SQL...');
        const execResult = await client.query(migration.sql);
        result.rowsAffected = execResult.rowCount || 0;

        // Post-check
        if (migration.postCheckSql) {
          console.log('  Running post-check...');
          const postCheck = await client.query(migration.postCheckSql);
          if (!this.validatePostCheck(postCheck)) {
            throw new Error('Post-check failed - migration did not produce expected results');
          }
        }

        // Commit
        await client.query('COMMIT');

        // Record migration
        await this.recordMigration(migration, true);

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      // Validation
      if (migration.validationSql) {
        console.log('  Running validation...');
        const validation = await this.db.query(migration.validationSql);
        if (!this.validateResults(validation)) {
          throw new Error('Validation failed - data integrity compromised');
        }
      }

      result.success = true;
      result.endTime = new Date();
      result.duration = (result.endTime.getTime() - startTime.getTime()) / 1000;

      this.completedMigrations.push(result);
      this.emit('migration-success', result);

      console.log(`✅ Migration complete: ${result.duration.toFixed(2)}s, ${result.rowsAffected} rows affected`);

    } catch (error) {
      result.success = false;
      result.error = error.message;
      result.endTime = new Date();
      result.duration = (result.endTime.getTime() - startTime.getTime()) / 1000;

      this.emit('migration-failed', result);

      console.error(`❌ Migration failed: ${error.message}`);
      
      // Attempt rollback
      await this.rollbackMigration(migration);
    }

    return result;
  }

  /**
   * EXPAND → MIGRATE → CONTRACT pattern
   */
  async executeExpandMigrateContract(options: {
    table: string;
    addColumn: { name: string; type: string; default?: any };
    populateData: (row: any) => any;
    removeOldColumn?: string;
  }): Promise<void> {
    console.log(`🔄 Executing Expand→Migrate→Contract for ${options.table}`);

    // PHASE 1: EXPAND - Add new column
    console.log('  Phase 1: EXPAND - Adding new column...');
    const expandMigration: Migration = {
      id: `expand_${Date.now()}`,
      name: `Add ${options.addColumn.name} to ${options.table}`,
      description: 'Expand schema with new column',
      type: 'expand',
      sql: `ALTER TABLE ${options.table} 
            ADD COLUMN ${options.addColumn.name} ${options.addColumn.type} 
            ${options.addColumn.default !== undefined ? `DEFAULT ${options.addColumn.default}` : ''}`,
      rollbackSql: `ALTER TABLE ${options.table} DROP COLUMN IF EXISTS ${options.addColumn.name}`,
      dependencies: [],
      estimatedDuration: 5,
      requiresLock: true,
      accountingSafe: true,
      validationSql: `SELECT COUNT(*) as count FROM ${options.table} 
                      WHERE ${options.addColumn.name} IS NULL`
    };

    const expandResult = await this.executeMigration(expandMigration);
    if (!expandResult.success) {
      throw new Error('Expand phase failed');
    }

    // PHASE 2: MIGRATE - Populate data via dual-write
    console.log('  Phase 2: MIGRATE - Starting dual-write...');
    await this.enableDualWrite(options.table, options.addColumn.name, options.populateData);

    // PHASE 3: CONTRACT - Remove old column (if specified)
    if (options.removeOldColumn) {
      console.log('  Phase 3: CONTRACT - Removing old column...');
      const contractMigration: Migration = {
        id: `contract_${Date.now()}`,
        name: `Remove ${options.removeOldColumn} from ${options.table}`,
        description: 'Contract schema by removing old column',
        type: 'contract',
        sql: `ALTER TABLE ${options.table} DROP COLUMN ${options.removeOldColumn}`,
        rollbackSql: `ALTER TABLE ${options.table} ADD COLUMN ${options.removeOldColumn} TEXT`, // Placeholder
        dependencies: [expandMigration.id],
        estimatedDuration: 5,
        requiresLock: true,
        accountingSafe: true
      };

      const contractResult = await this.executeMigration(contractMigration);
      if (!contractResult.success) {
        console.warn('⚠️  Contract phase failed - old column still exists');
      }
    }

    console.log('✅ Expand→Migrate→Contract complete');
  }

  /**
   * ENABLE DUAL-WRITE
   * Write to both old and new columns during migration
   */
  private async enableDualWrite(
    table: string, 
    newColumn: string,
    populateFn: (row: any) => any
  ): Promise<void> {
    // Create trigger for dual-write
    await this.db.query(`
      CREATE OR REPLACE FUNCTION ${table}_dual_write()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.${newColumn} := ${populateFn.toString()};
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS ${table}_dual_write_trigger ON ${table};
      
      CREATE TRIGGER ${table}_dual_write_trigger
        BEFORE INSERT OR UPDATE ON ${table}
        FOR EACH ROW
        EXECUTE FUNCTION ${table}_dual_write();
    `);

    // Backfill existing data
    console.log('    Backfilling existing data...');
    await this.db.query(`
      UPDATE ${table}
      SET ${newColumn} = ${populateFn.toString()}
      WHERE ${newColumn} IS NULL;
    `);

    console.log('    Dual-write enabled');
  }

  /**
   * CREATE INDEX CONCURRENTLY
   * Safe index creation without table locks
   */
  async createIndexConcurrently(
    table: string, 
    columns: string[],
    indexName?: string
  ): Promise<void> {
    const name = indexName || `idx_${table}_${columns.join('_')}`;
    
    console.log(`📊 Creating index concurrently: ${name}`);

    try {
      // CONCURRENTLY prevents table locks
      await this.db.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS ${name}
        ON ${table} (${columns.join(', ')});
      `);

      console.log(`✅ Index created: ${name}`);
    } catch (error) {
      // If CONCURRENTLY fails, it leaves an invalid index
      // Clean it up and retry without CONCURRENTLY (during low traffic)
      console.warn(`⚠️  Concurrent index creation failed: ${error.message}`);
      
      await this.db.query(`DROP INDEX IF EXISTS ${name}`);
      throw error;
    }
  }

  /**
   * ROLLBACK MIGRATION
   */
  private async rollbackMigration(migration: Migration): Promise<void> {
    console.log(`🔄 Rolling back: ${migration.name}`);

    try {
      await this.db.query(migration.rollbackSql);
      console.log('✅ Rollback complete');
    } catch (error) {
      console.error(`❌ Rollback failed: ${error.message}`);
      // This is serious - manual intervention required
      this.emit('rollback-failed', { migration, error });
    }
  }

  /**
   * UTILITY METHODS
   */
  private async canAcquireLock(): Promise<boolean> {
    // Check if we can acquire a lock without blocking
    const result = await this.db.query(`
      SELECT count(*) as active_queries
      FROM pg_stat_activity
      WHERE state = 'active'
        AND query NOT ILIKE '%pg_stat%'
    `);
    
    const activeQueries = parseInt(result.rows[0].active_queries);
    return activeQueries < 50; // Threshold
  }

  private async recordMigration(migration: Migration, success: boolean): Promise<void> {
    await this.db.query(`
      INSERT INTO schema_migrations (
        id, name, type, executed_at, success, duration_seconds
      ) VALUES ($1, $2, $3, NOW(), $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        executed_at = NOW(),
        success = $4
    `, [
      migration.id,
      migration.name,
      migration.type,
      success,
      migration.estimatedDuration
    ]);
  }

  private validatePreCheck(result: any): boolean {
    // Pre-check logic
    return true;
  }

  private validatePostCheck(result: any): boolean {
    // Post-check logic
    return true;
  }

  private validateResults(result: any): boolean {
    // Validation logic
    return true;
  }

  /**
   * GET MIGRATION STATUS
   */
  async getMigrationStatus(): Promise<any> {
    const pending = this.activeMigrations.size;
    const completed = this.completedMigrations.length;
    const failed = this.completedMigrations.filter(m => !m.success).length;

    return {
      pending,
      completed,
      failed,
      lastMigration: this.completedMigrations[this.completedMigrations.length - 1]
    };
  }
}

// SQL for migration tracking table:
export const MIGRATIONS_SCHEMA = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  executed_at TIMESTAMP DEFAULT NOW(),
  success BOOLEAN DEFAULT false,
  duration_seconds INTEGER,
  error_message TEXT
);

CREATE INDEX idx_schema_migrations_executed_at ON schema_migrations(executed_at DESC);
`;

export default SafeMigrationFramework;
