# Backup and Recovery Procedures

## Overview

This document outlines the comprehensive backup and recovery procedures for the AccuBooks-Chronaworkflow production system. The backup system is designed to ensure data safety, integrity, and rapid recovery in case of system failures.

## Backup Architecture

### Components

1. **Automated Backup Service** (`server/backup/database-backup.ts`)
   - Scheduled database backups
   - Encryption and compression
   - Verification and integrity checks
   - Isolated storage with restricted access

2. **Backup Storage**
   - Local encrypted backups
   - Isolated directory with restricted permissions (600)
   - Automatic cleanup based on retention policy
   - Checksum verification for integrity

3. **Monitoring and Metrics**
   - Backup success/failure tracking
   - Duration and size metrics
   - Verification status monitoring
   - Alert integration for failures

## Backup Configuration

### Default Settings

```typescript
{
  databaseUrl: process.env.DATABASE_URL,
  backupDirectory: './backups',
  encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
  retentionDays: 30,
  backupIntervalHours: 24,
  maxBackupSizeGB: 10,
  compressionEnabled: true,
  verificationEnabled: true,
  isolationEnabled: true
}
```

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `BACKUP_DIRECTORY`: Directory for backup storage (default: ./backups)
- `BACKUP_ENCRYPTION_KEY`: 256-bit hex key for backup encryption
- `BACKUP_RETENTION_DAYS`: Number of days to retain backups (default: 30)
- `BACKUP_INTERVAL_HOURS`: Backup frequency in hours (default: 24)

## Backup Process

### Automated Backup Schedule

1. **Frequency**: Every 24 hours (configurable)
2. **Retention**: 30 days (configurable)
3. **Verification**: Automatic integrity checks
4. **Compression**: Gzip compression enabled
5. **Encryption**: AES-256-GCM encryption
6. **Isolation**: Restricted file permissions (600)

### Backup Steps

1. **Database Dump**
   ```bash
   pg_dump "$DATABASE_URL" > backup.sql
   ```

2. **Compression** (if enabled)
   ```bash
   gzip backup.sql
   ```

3. **Encryption**
   - AES-256-GCM algorithm
   - Random IV per backup
   - Key derived from environment variable

4. **Verification**
   - Checksum calculation (SHA-256)
   - File size validation
   - Restore test (dry run)

5. **Isolation**
   - Move to isolated directory
   - Set restricted permissions
   - Update backup registry

## Recovery Procedures

### Emergency Recovery

#### Scenario 1: Database Corruption

1. **Stop Application Services**
   ```bash
   npm stop
   ```

2. **Identify Latest Valid Backup**
   ```bash
   ls -la ./backups/isolated/ | grep backup- | sort -r
   ```

3. **Verify Backup Integrity**
   ```bash
   sha256sum -c backup-file.sql.enc.sha256
   ```

4. **Restore Database**
   ```bash
   # Decrypt backup
   openssl aes-256-gcm -d -in backup-file.sql.enc -out backup-file.sql \
     -K $BACKUP_ENCRYPTION_KEY -iv $(head -c 16 backup-file.enc)

   # Restore to database
   psql "$DATABASE_URL" < backup-file.sql
   ```

5. **Verify Restoration**
   ```bash
   # Check table counts
   psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;"
   
   # Verify data integrity
   psql "$DATABASE_URL" -c "SELECT * FROM companies LIMIT 5;"
   ```

6. **Restart Services**
   ```bash
   npm start
   ```

#### Scenario 2: Point-in-Time Recovery

1. **Identify Target Backup**
   - List available backups with timestamps
   - Select backup closest to target time

2. **Create Recovery Database**
   ```bash
   createdb accubooks_recovery
   ```

3. **Restore to Recovery Database**
   ```bash
   psql "postgresql://user:pass@localhost/accubooks_recovery" < backup-file.sql
   ```

4. **Validate Recovery Data**
   - Verify critical data integrity
   - Check business logic consistency

5. **Switch to Recovery Database**
   - Update application configuration
   - Restart services with new database

### Manual Recovery Procedures

#### Full Database Restore

1. **Prepare Environment**
   ```bash
   # Ensure backup service is stopped
   npm run backup:stop
   
   # Verify backup files exist
   ls -la ./backups/isolated/
   ```

2. **Decrypt Backup**
   ```typescript
   import { DatabaseBackupService } from './server/backup/database-backup.js';
   
   const backupService = createBackupService();
   await backupService.restoreBackup('backup-2023-01-01-120000-abc123');
   ```

3. **Verify Restoration**
   ```bash
   # Check application health
   curl http://localhost:5000/health
   
   # Verify database connectivity
   npm run db:check
   ```

#### Partial Data Recovery

1. **Extract Specific Tables**
   ```bash
   # Filter specific tables from backup
   pg_dump --data-only --table=users "$DATABASE_URL" > users.sql
   pg_dump --data-only --table=companies "$DATABASE_URL" > companies.sql
   ```

2. **Restore Selected Tables**
   ```bash
   psql "$DATABASE_URL" < users.sql
   psql "$DATABASE_URL" < companies.sql
   ```

3. **Validate Partial Recovery**
   - Verify restored data
   - Check foreign key constraints
   - Validate business rules

## Backup Verification

### Automated Verification

1. **Checksum Validation**
   - SHA-256 hash calculation
   - Comparison with stored checksum
   - Corruption detection

2. **Restore Testing**
   - Create temporary test database
   - Perform dry-run restore
   - Validate data integrity

3. **Size Validation**
   - Monitor backup file sizes
   - Alert on unusual size changes
   - Compression ratio tracking

### Manual Verification

1. **Weekly Verification**
   ```bash
   # List recent backups
   npm run backup:list
   
   # Verify backup integrity
   npm run backup:verify backup-id
   ```

2. **Monthly Testing**
   - Perform full restore to test environment
   - Validate application functionality
   - Test performance impact

## Monitoring and Alerting

### Metrics to Monitor

1. **Backup Success Rate**
   - Track successful vs failed backups
   - Alert on consecutive failures

2. **Backup Duration**
   - Monitor backup completion time
   - Alert on performance degradation

3. **Backup Size**
   - Track backup file sizes
   - Alert on unusual growth

4. **Storage Usage**
   - Monitor backup directory size
   - Alert on storage capacity issues

### Alert Conditions

1. **Backup Failure**
   - Immediate alert on backup failure
   - Include error details and timestamp

2. **Verification Failure**
   - Alert on checksum mismatch
   - Include backup ID and error details

3. **Storage Threshold**
   - Alert at 80% storage usage
   - Include cleanup recommendations

## Disaster Recovery Plan

### RTO/RPO Targets

- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 24 hours

### Disaster Scenarios

#### Scenario 1: Complete System Failure

1. **Assessment** (0-30 minutes)
   - Determine failure scope
   - Identify affected systems
   - Estimate recovery timeline

2. **Infrastructure Recovery** (30-90 minutes)
   - Provision new servers
   - Install required software
   - Configure network and security

3. **Data Recovery** (90-180 minutes)
   - Restore latest backup
   - Verify data integrity
   - Test application functionality

4. **Service Restoration** (180-240 minutes)
   - Start application services
   - Perform health checks
   - Monitor system performance

#### Scenario 2: Data Corruption

1. **Isolation** (0-15 minutes)
   - Stop affected services
   - Identify corruption scope
   - Preserve evidence for analysis

2. **Recovery** (15-60 minutes)
   - Restore from last known good backup
   - Verify data integrity
   - Test application functionality

3. **Investigation** (60-240 minutes)
   - Analyze corruption cause
   - Implement preventive measures
   - Update monitoring and alerting

## Security Considerations

### Backup Encryption

1. **Algorithm**: AES-256-GCM
2. **Key Management**: Environment variable with restricted access
3. **Key Rotation**: Quarterly rotation recommended
4. **IV Generation**: Cryptographically secure random IV per backup

### Access Control

1. **File Permissions**: 600 (read/write for owner only)
2. **Directory Permissions**: 700 (rwx for owner only)
3. **Process Isolation**: Backup service runs with minimal privileges
4. **Audit Logging**: All backup operations logged

### Backup Storage

1. **Local Isolation**: Separate directory with restricted access
2. **Offsite Copies**: Consider cloud storage for critical data
3. **Network Security**: Backup transfers over secure channels
4. **Retention Policy**: Automatic cleanup of old backups

## Troubleshooting

### Common Issues

#### Backup Fails with Permission Error

**Symptoms**: Backup creation fails with permission denied

**Solution**:
```bash
# Check backup directory permissions
ls -la ./backups/

# Fix permissions
chmod 700 ./backups
chown $(whoami):$(whoami) ./backups
```

#### Restore Fails with Decryption Error

**Symptoms**: Unable to decrypt backup file

**Solution**:
```bash
# Verify encryption key
echo $BACKUP_ENCRYPTION_KEY | wc -c  # Should be 65 characters (64 hex + newline)

# Test decryption manually
openssl aes-256-gcm -d -in backup-file.enc -out test.sql \
  -K $BACKUP_ENCRYPTION_KEY -iv $(head -c 16 backup-file.enc)
```

#### Backup Size Too Large

**Symptoms**: Backup files exceed size limits

**Solution**:
```bash
# Check database size
psql "$DATABASE_URL" -c "SELECT pg_size_pretty(pg_database_size(current_database()));"

# Consider table exclusions
pg_dump --exclude-table-data=logs "$DATABASE_URL" > backup.sql
```

### Performance Optimization

#### Backup Duration Optimization

1. **Parallel Dump**: Use `--jobs` parameter for pg_dump
2. **Compression Level**: Adjust gzip compression level
3. **Storage Performance**: Use SSD for backup directory
4. **Network Optimization**: Minimize network transfer overhead

#### Restore Performance

1. **Index Management**: Drop indexes before restore, recreate after
2. **Constraint Management**: Disable constraints during restore
3. **Batch Processing**: Restore in smaller batches for large databases
4. **Memory Allocation**: Increase work_mem for restore operations

## Maintenance

### Regular Tasks

1. **Daily**: Monitor backup success/failure
2. **Weekly**: Verify backup integrity
3. **Monthly**: Test restore procedures
4. **Quarterly**: Rotate encryption keys
5. **Annually**: Review and update backup policies

### Cleanup Procedures

1. **Automatic Cleanup**: Built-in retention policy enforcement
2. **Manual Cleanup**: Remove corrupted or invalid backups
3. **Storage Monitoring**: Ensure adequate disk space
4. **Log Rotation**: Rotate backup service logs

## Contact Information

### Emergency Contacts

- **Database Administrator**: [Contact Information]
- **System Administrator**: [Contact Information]
- **Security Team**: [Contact Information]

### Support Channels

- **Documentation**: This document and inline code comments
- **Monitoring**: Application metrics and logs
- **Alerting**: Automated notification system
- **Escalation**: Defined escalation procedures

---

**Last Updated**: January 25, 2026
**Version**: 1.0
**Next Review**: April 25, 2026
