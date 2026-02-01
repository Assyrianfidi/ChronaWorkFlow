// Production-Grade Database Backup System
// Automated backups with encryption, verification, and isolation

import { exec } from 'child_process';
import { promisify } from 'util';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { createReadStream, createWriteStream, existsSync, mkdirSync, unlinkSync, statSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname, basename } from 'path';
import { logger } from '../utils/structured-logger.js';
import { metrics } from '../utils/metrics.js';

const execAsync = promisify(exec);

export interface BackupConfig {
  databaseUrl: string;
  backupDirectory: string;
  encryptionKey: string;
  retentionDays: number;
  backupIntervalHours: number;
  maxBackupSizeGB: number;
  compressionEnabled: boolean;
  verificationEnabled: boolean;
  isolationEnabled: boolean;
}

export interface BackupResult {
  success: boolean;
  backupId: string;
  filePath: string;
  fileSize: number;
  compressedSize: number;
  duration: number;
  timestamp: Date;
  checksum?: string;
  error?: string;
}

export interface BackupVerification {
  backupId: string;
  isValid: boolean;
  checksumMatches: boolean;
  canRestore: boolean;
  errors: string[];
  warnings: string[];
}

export class DatabaseBackupService {
  private config: BackupConfig;
  private backupInterval?: NodeJS.Timeout;
  private isRunning = false;

  constructor(config: BackupConfig) {
    this.config = config;
    this.ensureBackupDirectory();
  }

  private ensureBackupDirectory(): void {
    if (!existsSync(this.config.backupDirectory)) {
      mkdirSync(this.config.backupDirectory, { recursive: true });
    }
  }

  private generateBackupId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = randomBytes(4).toString('hex');
    return `backup-${timestamp}-${random}`;
  }

  private async executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    try {
      const result = await execAsync(command);
      return {
        stdout: result.stdout as string,
        stderr: result.stderr as string
      };
    } catch (error: any) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message
      };
    }
  }

  private async createDatabaseDump(backupId: string): Promise<string> {
    const dumpFile = join(this.config.backupDirectory, `${backupId}.sql`);
    
    logger.info('Creating database dump', {
      backupId,
      dumpFile
    });

    // Use pg_dump for PostgreSQL (adjust for your database)
    const command = `pg_dump "${this.config.databaseUrl}" > "${dumpFile}"`;
    
    const result = await this.executeCommand(command);
    
    if (result.stderr && !result.stderr.includes('WARNING')) {
      throw new Error(`Database dump failed: ${result.stderr}`);
    }

    if (!existsSync(dumpFile)) {
      throw new Error('Backup file was not created');
    }

    const stats = statSync(dumpFile);
    logger.info('Database dump created', {
      backupId,
      fileSize: stats.size,
      dumpFile
    });

    return dumpFile;
  }

  private encryptFile(inputPath: string, outputPath: string): Promise<void> {
    const algorithm = 'aes-256-gcm';
    const iv = randomBytes(16);
    const cipher = createCipheriv(algorithm, Buffer.from(this.config.encryptionKey, 'hex'), iv);
    
    const input = createReadStream(inputPath);
    const output = createWriteStream(outputPath);
    
    // Write IV at the beginning of the encrypted file
    output.write(iv);
    
    return new Promise<void>((resolve, reject) => {
      output.on('finish', () => resolve());
      output.on('error', reject);
      input.on('error', reject);
      
      input.pipe(cipher).pipe(output);
    });
  }

  private async compressFile(inputPath: string): Promise<string> {
    const compressedPath = `${inputPath}.gz`;
    
    logger.info('Compressing backup file', {
      inputPath,
      compressedPath
    });

    const command = `gzip "${inputPath}"`;
    const result = await this.executeCommand(command);
    
    if (result.stderr && !result.stderr.includes('WARNING')) {
      throw new Error(`Compression failed: ${result.stderr}`);
    }

    if (!existsSync(compressedPath)) {
      throw new Error('Compressed file was not created');
    }

    return compressedPath;
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    const command = `sha256sum "${filePath}" | cut -d' ' -f1`;
    const result = await this.executeCommand(command);
    return result.stdout.trim();
  }

  private async verifyBackup(backupId: string, filePath: string): Promise<BackupVerification> {
    const verification: BackupVerification = {
      backupId,
      isValid: true,
      checksumMatches: true,
      canRestore: true,
      errors: [],
      warnings: []
    };

    try {
      // Check file exists and is not empty
      if (!existsSync(filePath)) {
        verification.isValid = false;
        verification.errors.push('Backup file does not exist');
        return verification;
      }

      const stats = statSync(filePath);
      if (stats.size === 0) {
        verification.isValid = false;
        verification.errors.push('Backup file is empty');
        return verification;
      }

      // Check file size limits
      const sizeGB = stats.size / (1024 * 1024 * 1024);
      if (sizeGB > this.config.maxBackupSizeGB) {
        verification.warnings.push(`Backup size (${sizeGB.toFixed(2)}GB) exceeds recommended limit (${this.config.maxBackupSizeGB}GB)`);
      }

      // Verify checksum if available
      const checksumFile = `${filePath}.sha256`;
      if (existsSync(checksumFile)) {
        const currentChecksum = await this.calculateChecksum(filePath);
        const storedChecksum = readFileSync(checksumFile, 'utf8').trim();
        
        if (currentChecksum !== storedChecksum) {
          verification.isValid = false;
          verification.checksumMatches = false;
          verification.errors.push('Checksum mismatch - file may be corrupted');
        }
      }

      // Test restore (dry run)
      if (this.config.verificationEnabled) {
        try {
          const testResult = await this.testRestore(filePath);
          if (!testResult.success) {
            verification.canRestore = false;
            verification.errors.push('Restore test failed: ' + testResult.error);
          }
        } catch (error) {
          verification.canRestore = false;
          verification.errors.push('Restore test error: ' + (error as Error).message);
        }
      }

    } catch (error) {
      verification.isValid = false;
      verification.errors.push('Verification error: ' + (error as Error).message);
    }

    return verification;
  }

  private async testRestore(backupFile: string): Promise<{ success: boolean; error?: string }> {
    // Create a temporary test database
    const testDbName = `test_restore_${Date.now()}`;
    
    try {
      // Create test database
      await this.executeCommand(`createdb "${testDbName}"`);
      
      // Attempt restore (dry run with --clean --if-exists --verbose)
      const restoreCommand = `psql "${this.config.databaseUrl.replace(/\/[^\/]*$/, '/' + testDbName)}" --echo-all --quiet --file="${backupFile}"`;
      const result = await this.executeCommand(restoreCommand);
      
      // Check for errors in restore output
      if (result.stderr && result.stderr.includes('ERROR')) {
        throw new Error(`Restore errors detected: ${result.stderr}`);
      }
      
      // Drop test database
      await this.executeCommand(`dropdb "${testDbName}"`);
      
      return { success: true };
      
    } catch (error) {
      // Clean up test database on error
      try {
        await this.executeCommand(`dropdb "${testDbName}" --if-exists`);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      return { 
        success: false, 
        error: (error as Error).message 
      };
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const cutoffTime = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
      
      const files = readdirSync(this.config.backupDirectory);
      
      for (const file of files) {
        if (file.startsWith('backup-') && (file.endsWith('.sql') || file.endsWith('.sql.gz'))) {
          const filePath = join(this.config.backupDirectory, file);
          const stats = statSync(filePath);
          
          if (stats.mtime.getTime() < cutoffTime) {
            logger.info('Deleting old backup', {
              file,
              age: Math.floor((Date.now() - stats.mtime.getTime()) / (24 * 60 * 60 * 1000))
            });
            
            unlinkSync(filePath);
            
            // Delete checksum file if exists
            const checksumFile = `${filePath}.sha256`;
            if (existsSync(checksumFile)) {
              unlinkSync(checksumFile);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error cleaning up old backups', error as Error);
    }
  }

  private async isolateBackup(filePath: string): Promise<string> {
    if (!this.config.isolationEnabled) {
      return filePath;
    }

    const isolatedDir = join(this.config.backupDirectory, 'isolated');
    if (!existsSync(isolatedDir)) {
      mkdirSync(isolatedDir, { recursive: true });
    }

    const fileName = basename(filePath);
    const isolatedPath = join(isolatedDir, fileName);
    
    // Copy file to isolated directory with restricted permissions
    await this.executeCommand(`cp "${filePath}" "${isolatedPath}"`);
    await this.executeCommand(`chmod 600 "${isolatedPath}"`);
    
    logger.info('Backup isolated', {
      originalPath: filePath,
      isolatedPath
    });
    
    return isolatedPath;
  }

  async createBackup(): Promise<BackupResult> {
    if (this.isRunning) {
      throw new Error('Backup is already in progress');
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    try {
      const backupId = this.generateBackupId();
      let dumpFile: string;
      let finalPath: string;
      let originalSize = 0;
      let compressedSize = 0;

      logger.info('Starting database backup', {
        backupId,
        config: {
          retentionDays: this.config.retentionDays,
          compressionEnabled: this.config.compressionEnabled,
          verificationEnabled: this.config.verificationEnabled
        }
      });

      // Step 1: Create database dump
      dumpFile = await this.createDatabaseDump(backupId);
      originalSize = statSync(dumpFile).size;

      // Step 2: Compress if enabled
      if (this.config.compressionEnabled) {
        dumpFile = await this.compressFile(dumpFile);
        compressedSize = statSync(dumpFile).size;
      } else {
        compressedSize = originalSize;
      }

      // Step 3: Encrypt the backup
      const encryptedFile = `${dumpFile}.enc`;
      this.encryptFile(dumpFile, encryptedFile);
      
      // Remove unencrypted file
      unlinkSync(dumpFile);
      finalPath = encryptedFile;

      // Step 4: Calculate checksum
      const checksum = await this.calculateChecksum(finalPath);
      writeFileSync(`${finalPath}.sha256`, checksum);

      // Step 5: Verify backup
      if (this.config.verificationEnabled) {
        const verification = await this.verifyBackup(backupId, finalPath);
        
        if (!verification.isValid) {
          throw new Error(`Backup verification failed: ${verification.errors.join(', ')}`);
        }
        
        if (verification.warnings.length > 0) {
          logger.warn('Backup verification warnings', {
            backupId,
            warnings: verification.warnings
          });
        }
      }

      // Step 6: Isolate backup
      finalPath = await this.isolateBackup(finalPath);

      const duration = Date.now() - startTime;
      
      // Record metrics
      metrics.incrementCounter('app_database_backups_created', 1);
      metrics.recordHistogram('app_database_backup_duration', duration);
      metrics.setGauge('app_database_backup_size', compressedSize);

      logger.info('Database backup completed successfully', {
        backupId,
        finalPath,
        originalSize,
        compressedSize,
        compressionRatio: originalSize > 0 ? compressedSize / originalSize : 0,
        duration,
        checksum: checksum?.substring(0, 16) + '...'
      });

      return {
        success: true,
        backupId,
        filePath: finalPath,
        fileSize: originalSize,
        compressedSize,
        duration,
        timestamp: new Date(),
        checksum
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      metrics.incrementCounter('app_database_backups_failed', 1);
      
      logger.error('Database backup failed', error as Error, {
        duration
      });

      return {
        success: false,
        backupId: '',
        filePath: '',
        fileSize: 0,
        compressedSize: 0,
        duration,
        timestamp: new Date(),
        error: (error as Error).message
      };

    } finally {
      this.isRunning = false;
    }
  }

  async restoreBackup(backupId: string, targetDatabase?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const backupFile = join(this.config.backupDirectory, 'isolated', `${backupId}.sql.enc`);
      
      if (!existsSync(backupFile)) {
        throw new Error('Backup file not found');
      }

      // Decrypt backup
      const algorithm = 'aes-256-gcm';
      const encryptedData = readFileSync(backupFile);
      
      const iv = encryptedData.slice(0, 16);
      const encryptedContent = encryptedData.slice(16);
      
      const decipher = createDecipheriv(algorithm, Buffer.from(this.config.encryptionKey, 'hex'), iv);
      
      const decryptedFile = backupFile.replace('.enc', '.dec');
      const decrypted = Buffer.concat([decipher.update(encryptedContent), decipher.final()]);
      
      writeFileSync(decryptedFile, decrypted);

      // Restore to target database
      const targetDb = targetDatabase || this.config.databaseUrl;
      const restoreCommand = `psql "${targetDb}" --file="${decryptedFile}"`;
      
      const result = await this.executeCommand(restoreCommand);
      
      if (result.stderr && result.stderr.includes('ERROR')) {
        throw new Error(`Restore failed: ${result.stderr}`);
      }

      // Clean up decrypted file
      unlinkSync(decryptedFile);

      logger.info('Database restore completed', {
        backupId,
        targetDatabase: targetDb
      });

      return { success: true };

    } catch (error) {
      logger.error('Database restore failed', error as Error, {
        backupId,
        targetDatabase
      });

      return { 
        success: false, 
        error: (error as Error).message 
      };
    }
  }

  async listBackups(): Promise<Array<{
    backupId: string;
    timestamp: Date;
    fileSize: number;
    compressedSize: number;
    checksum?: string;
  }>> {
    const backups: Array<{
      backupId: string;
      timestamp: Date;
      fileSize: number;
      compressedSize: number;
      checksum?: string;
    }> = [];

    try {
      const isolatedDir = join(this.config.backupDirectory, 'isolated');
      const files = readdirSync(isolatedDir);
      
      for (const file of files) {
        if (file.endsWith('.enc')) {
          const filePath = join(isolatedDir, file);
          const stats = statSync(filePath);
          const backupId = file.replace('.sql.enc', '');
          
          // Try to read checksum
          let checksum: string | undefined;
          const checksumFile = `${filePath}.sha256`;
          if (existsSync(checksumFile)) {
            checksum = readFileSync(checksumFile, 'utf8').trim();
          }
          
          backups.push({
            backupId,
            timestamp: stats.mtime,
            fileSize: stats.size, // This is compressed size
            compressedSize: stats.size,
            checksum
          });
        }
      }
      
      // Sort by timestamp (newest first)
      backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
    } catch (error) {
      logger.error('Error listing backups', error as Error);
    }

    return backups;
  }

  startScheduledBackups(): void {
    if (this.backupInterval) {
      this.stopScheduledBackups();
    }

    const intervalMs = this.config.backupIntervalHours * 60 * 60 * 1000;
    
    this.backupInterval = setInterval(async () => {
      try {
        await this.createBackup();
        await this.cleanupOldBackups();
      } catch (error) {
        logger.error('Scheduled backup failed', error as Error);
      }
    }, intervalMs);

    logger.info('Scheduled backups started', {
      intervalHours: this.config.backupIntervalHours,
      retentionDays: this.config.retentionDays
    });
  }

  stopScheduledBackups(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = undefined;
      logger.info('Scheduled backups stopped');
    }
  }

  async getBackupStatus(): Promise<{
    isRunning: boolean;
    lastBackup?: BackupResult;
    scheduledBackupsActive: boolean;
    totalBackups: number;
  }> {
    const backups = await this.listBackups();
    
    return {
      isRunning: this.isRunning,
      lastBackup: backups.length > 0 ? {
        success: true,
        backupId: backups[0].backupId,
        filePath: '',
        fileSize: backups[0].fileSize,
        compressedSize: backups[0].compressedSize,
        duration: 0,
        timestamp: backups[0].timestamp,
        checksum: backups[0].checksum
      } : undefined,
      scheduledBackupsActive: !!this.backupInterval,
      totalBackups: backups.length
    };
  }
}

// Create default backup service instance
export const createBackupService = (config: Partial<BackupConfig> = {}): DatabaseBackupService => {
  const defaultConfig: BackupConfig = {
    databaseUrl: process.env.DATABASE_URL || '',
    backupDirectory: process.env.BACKUP_DIRECTORY || './backups',
    encryptionKey: process.env.BACKUP_ENCRYPTION_KEY || randomBytes(32).toString('hex'),
    retentionDays: 30,
    backupIntervalHours: 24,
    maxBackupSizeGB: 10,
    compressionEnabled: true,
    verificationEnabled: true,
    isolationEnabled: true
  };

  return new DatabaseBackupService({ ...defaultConfig, ...config });
};
