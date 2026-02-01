# Release Safety Documentation

## Overview

This document outlines the comprehensive release safety procedures and migration safety rules for the AccuBooks-Chronaworkflow production system. The release safety system ensures that all deployments are safe, reversible, and maintain data integrity.

## Migration Safety Rules

### Core Principles

1. **Safety First**: All migrations must be safe and reversible by default
2. **Explicit Overrides**: Dangerous operations require explicit annotation and approval
3. **CI Enforcement**: All safety checks are enforced in CI and cannot be bypassed
4. **Rollback Guarantee**: Every migration must have a clear rollback path
5. **Data Integrity**: No migration can cause data loss or corruption

### Migration Types

#### ✅ EXPAND MIGRATIONS (Safe by Default)

These migrations add new structures and are always safe:

- **CREATE TABLE**: Adding new tables
- **ADD COLUMN**: Adding new columns to existing tables
- **ADD INDEX**: Creating new indexes
- **ADD CONSTRAINT**: Adding new constraints (with caution)

**Examples**:
```sql
-- ✅ Safe: Adding new table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL
);

-- ✅ Safe: Adding new column
ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT NOW();

-- ✅ Safe: Adding index
CREATE INDEX idx_users_email ON users(email);
```

#### ⚠️ CONTRACT MIGRATIONS (Restricted)

These migrations modify or remove existing structures and require explicit approval:

- **DROP INDEX**: Removing indexes (reversible but affects performance)
- **DROP CONSTRAINT**: Removing constraints (affects data integrity)
- **MODIFY CONSTRAINT**: Changing existing constraints

**Requirements**:
- Must have explicit override annotation
- Must include rollback plan
- Requires team lead approval
- Must be tested in staging first

**Examples**:
```sql
-- ⚠️ Requires override: Dropping index
-- @override-destructive
DROP INDEX IF EXISTS idx_users_email;

-- ⚠️ Requires override: Dropping constraint
-- @override-destructive
ALTER TABLE users DROP CONSTRAINT users_email_unique;
```

#### ❌ DANGEROUS MIGRATIONS (Blocked by Default)

These migrations can cause data loss or break applications:

- **DROP TABLE**: Removing tables (data loss)
- **DROP COLUMN**: Removing columns (data loss)
- **ALTER COLUMN TYPE**: Changing column types (data loss)
- **RENAME TABLE/COLUMN**: Renaming structures (breaks application code)
- **TRUNCATE TABLE**: Deleting all data in table

**Requirements**:
- Explicit override annotation required
- Complete rollback plan required
- Database backup required
- Full team approval required
- Emergency procedures documented

**Examples**:
```sql
-- ❌ Dangerous: Dropping table (blocked without override)
-- @override-destructive
-- @rollback-plan: Restore from backup before this migration
DROP TABLE IF EXISTS old_user_data;

-- ❌ Dangerous: Changing column type (blocked without override)
-- @override-destructive
-- @rollback-plan: Create backup table, migrate data, verify, then drop backup
ALTER TABLE users ALTER COLUMN age TYPE INTEGER;

-- ❌ Dangerous: Renaming column (blocked without override)
-- @override-destructive
-- @rollback-plan: Update application code, then rename back if needed
ALTER TABLE users RENAME COLUMN age TO user_age;
```

### Override Annotations

To allow restricted migrations, add one of these annotations to the migration file:

```sql
-- @override-destructive
-- @migration-override
-- @allow-destructive
```

**Example with complete override**:
```sql
-- @override-destructive
-- @rollback-plan: 1) Create backup table, 2) Migrate data, 3) Verify, 4) Drop backup
ALTER TABLE users DROP COLUMN old_field;
```

## Schema Drift Detection

### What is Schema Drift?

Schema drift occurs when there are inconsistencies between:
- Prisma schema file (`prisma/schema.prisma`)
- Generated migration files (`prisma/migrations/`)
- Live database schema

### Drift Detection Rules

1. **Prisma Schema Validation**: Schema must be syntactically valid
2. **Migration Consistency**: Migrations must match schema
3. **Naming Convention**: Migration files must follow `{timestamp}_{description}.sql`
4. **File Integrity**: No empty or corrupted migration files
5. **Client Generation**: Prisma client must be up to date

### Drift Prevention

- Always run `npx prisma migrate dev` to create migrations
- Never manually edit migration files (unless absolutely necessary)
- Keep Prisma client generated and up to date
- Use CI to detect drift automatically

## Rollback vs Roll-forward Strategy

### Rollback Strategy

**When to Use Rollback**:
- Migration fails during deployment
- Data corruption detected
- Performance degradation
- Application breaks

**Rollback Safety Rules**:
1. **Simple Rollbacks**: For EXPAND migrations only
2. **Complex Rollbacks**: For CONTRACT migrations with planning
3. **Impossible Rollbacks**: For DANGEROUS migrations (avoid)

**Rollback Examples**:
```sql
-- Simple rollback (safe)
DROP TABLE new_feature_table;

-- Complex rollback (requires planning)
-- 1. Create backup of data
-- 2. Restore original structure
-- 3. Migrate data back
-- 4. Verify integrity
```

### Roll-forward Strategy

**When to Use Roll-forward**:
- Rollback is impossible or too risky
- Migration is partially applied
- Better to fix forward than rollback

**Roll-forward Rules**:
1. **Assess State**: Determine what was applied
2. **Create Fix**: Write new migration to fix issues
3. **Test Thoroughly**: Validate in staging
4. **Document**: Record what happened and why

**Roll-forward Example**:
```sql
-- Original migration failed partially
-- Roll-forward fix migration
ALTER TABLE users ADD COLUMN backup_email VARCHAR(255);
UPDATE users SET backup_email = email WHERE email IS NOT NULL;
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
```

## Allowed vs Forbidden Schema Changes

### ✅ Always Allowed (No Override Needed)

```sql
-- Add new table
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add new column with default
ALTER TABLE users ADD COLUMN last_login TIMESTAMP DEFAULT NOW();

-- Add new index
CREATE INDEX idx_users_created_at ON users(created_at);

-- Add new constraint (if data allows)
ALTER TABLE users ADD CONSTRAINT users_email_check CHECK (email LIKE '%@%');
```

### ⚠️ Allowed with Override

```sql
-- Remove index
-- @override-destructive
DROP INDEX IF EXISTS idx_users_old_field;

-- Remove constraint
-- @override-destructive
ALTER TABLE users DROP CONSTRAINT users_email_check;

-- Modify constraint
-- @override-destructive
ALTER TABLE users DROP CONSTRAINT users_email_unique;
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
```

### ❌ Forbidden (Requires Override + Special Approval)

```sql
-- Drop table
-- @override-destructive
-- @rollback-plan: Restore from backup taken before migration
DROP TABLE IF EXISTS deprecated_table;

-- Drop column
-- @override-destructive
-- @rollback-plan: Create backup table, copy data, verify, then restore if needed
ALTER TABLE users DROP COLUMN old_field;

-- Change column type
-- @override-destructive
-- @rollback-plan: Create backup, migrate data with transformation, verify
ALTER TABLE users ALTER COLUMN age TYPE INTEGER;

-- Rename table
-- @override-destructive
-- @rollback-plan: Update all application code, test thoroughly
ALTER TABLE users RENAME TO accounts;

-- Truncate table
-- @override-destructive
-- @rollback-plan: Data will be lost - ensure this is intended
TRUNCATE TABLE temp_data;
```

## Emergency Procedures

### Migration Failure During Deployment

1. **Stop Deployment**: Immediately halt the deployment process
2. **Assess State**: Determine which migrations were applied
3. **Check Application**: Verify if application is still functional
4. **Rollback Decision**: Decide between rollback and roll-forward
5. **Execute Plan**: Follow the chosen strategy
6. **Verify**: Ensure system is stable
7. **Document**: Record what happened and lessons learned

### Data Corruption Detection

1. **Stop All Writes**: Prevent further damage
2. **Assess Impact**: Determine scope of corruption
3. **Restore from Backup**: Use latest verified backup
4. **Verify Data**: Check data integrity
5. **Investigate Cause**: Find root cause
6. **Prevent Recurrence**: Update procedures and validation

### Emergency Rollback

1. **Identify Last Good State**: Find last known good migration
2. **Prepare Rollback**: Get rollback scripts ready
3. **Take Backup**: Backup current state before rollback
4. **Execute Rollback**: Apply rollback in reverse order
5. **Verify System**: Ensure application works
6. **Monitor**: Watch for issues

## Developer Workflow Expectations

### Before Creating Migrations

1. **Understand Impact**: Know what the migration does
2. **Test Locally**: Run migration on local database
3. **Check Reversibility**: Ensure rollback is possible
4. **Document**: Add comments explaining purpose
5. **Get Approval**: For dangerous migrations

### Migration Development Process

1. **Create Migration**: Use `npx prisma migrate dev`
2. **Review Generated SQL**: Check what was generated
3. **Add Annotations**: Add override if needed
4. **Test Rollback**: Verify rollback works
5. **Run Validation**: Use migration safety tools
6. **Commit Changes**: Include migration and validation

### CI/CD Integration

1. **Local Validation**: Run `npm run migration:safety` locally
2. **Pre-commit Hook**: Automatic validation on commit
3. **CI Validation**: Comprehensive checks in pipeline
4. **Staging Test**: Deploy to staging first
5. **Production Deploy**: Only after all checks pass

### Code Review Requirements

1. **Migration Review**: Peer review of all migrations
2. **Safety Check**: Verify safety rules are followed
3. **Rollback Plan**: Ensure rollback is documented
4. **Impact Assessment**: Understand business impact
5. **Testing Evidence**: Show test results

## CI/CD Integration

### Migration Safety Gates

The CI pipeline includes these mandatory checks:

1. **Prisma Schema Validation**: Ensure schema is valid
2. **Migration File Validation**: Check naming and content
3. **Schema Drift Detection**: Verify consistency
4. **Safety Rule Validation**: Enforce safety rules
5. **Rollback Safety Check**: Verify rollback capability

### CI Scripts

```bash
# Run all migration safety checks
npm run migration:safety

# Run individual checks
npm run migration:validate          # Migration validator
npm run migration:rollback-check    # Rollback safety
npm run migration:drift-check       # Schema drift detection

# Install git hooks
npm run migration:install-hooks

# Run validation locally
./scripts/migration-safety-ci.sh
```

### CI Failure Scenarios

1. **Schema Validation Failed**: Fix schema syntax errors
2. **Drift Detected**: Sync schema and migrations
3. **Safety Violation**: Fix or add override annotation
4. **Rollback Unsafe**: Add rollback plan or change approach
5. **Missing Override**: Add required annotation

## Monitoring and Alerting

### Migration Metrics

- **Migration Success Rate**: Track success/failure ratio
- **Migration Duration**: Monitor time taken
- **Rollback Frequency**: Track how often rollbacks occur
- **Schema Drift Alerts**: Notify on drift detection

### Alert Conditions

1. **Migration Failure**: Immediate alert on failure
2. **Schema Drift**: Alert on any drift detection
3. **Rollback Usage**: Alert when rollback is used
4. **Long Running Migrations**: Alert on slow migrations

### Monitoring Commands

```bash
# Check migration status
npm run migration:drift-check

# Validate rollback safety
npm run migration:rollback-check

# Run comprehensive check
npm run migration:safety
```

## Best Practices

### Migration Design

1. **Small Changes**: Keep migrations small and focused
2. **Backward Compatible**: Prefer expand migrations
3. **Test Thoroughly**: Test in multiple environments
4. **Document Well**: Explain purpose and impact
5. **Plan Rollback**: Always have rollback plan

### Performance Considerations

1. **Large Tables**: Use batching for large table changes
2. **Index Changes**: Consider performance impact
3. **Lock Time**: Minimize table lock duration
4. **Resource Usage**: Monitor resource consumption
5. **Testing**: Test with production-like data volumes

### Security Considerations

1. **Data Privacy**: Ensure no sensitive data exposure
2. **Access Control**: Limit who can run migrations
3. **Audit Trail**: Log all migration activities
4. **Backup Security**: Secure backup storage
5. **Approval Process**: Required approvals for dangerous changes

## Troubleshooting

### Common Issues

#### Migration Validation Failed

**Symptoms**: CI fails with validation errors
**Causes**: Safety rule violations, schema drift, naming issues
**Solutions**:
1. Fix identified violations
2. Add override annotations if appropriate
3. Sync schema and migrations
4. Follow naming conventions

#### Rollback Failed

**Symptoms**: Rollback script fails or causes issues
**Causes**: Complex rollback, data dependencies, missing steps
**Solutions**:
1. Review rollback plan
2. Test rollback in staging
3. Consider roll-forward approach
4. Get expert help for complex issues

#### Schema Drift Detected

**Symptoms**: CI reports schema drift
**Causes**: Manual edits, out-of-sync migrations
**Solutions**:
1. Generate new migration from schema
2. Update existing migrations carefully
3. Use Prisma migrate tools
4. Avoid manual migration edits

#### Performance Issues

**Symptoms**: Migration takes too long or blocks application
**Causes**: Large tables, missing indexes, complex operations
**Solutions**:
1. Break into smaller migrations
2. Add temporary indexes
3. Use batching for large operations
4. Schedule during maintenance window

### Emergency Contacts

- **Database Administrator**: [Contact Information]
- **DevOps Team**: [Contact Information]
- **Development Lead**: [Contact Information]
- **On-call Engineer**: [Contact Information]

### Escalation Procedures

1. **Level 1**: Development team handles routine issues
2. **Level 2**: DevOps team handles deployment issues
3. **Level 3**: Database admin handles data issues
4. **Level 4**: Management team handles business impact

## Compliance and Auditing

### Compliance Requirements

1. **Data Protection**: Ensure GDPR/CCPA compliance
2. **Audit Trail**: Maintain complete migration history
3. **Documentation**: Keep all migration documentation
4. **Approval Records**: Store approval evidence
5. **Testing Records**: Maintain test results

### Audit Checklist

- [ ] Migration has documented purpose
- [ ] Safety rules followed
- [ ] Rollback plan documented
- [ ] Testing completed
- [ ] Approvals obtained
- [ ] CI validation passed
- [ ] Monitoring in place
- [ ] Backup verified

### Documentation Requirements

1. **Migration Purpose**: Clear business reason
2. **Impact Assessment**: Technical and business impact
3. **Rollback Plan**: Detailed rollback procedures
4. **Test Results**: Evidence of successful testing
5. **Approval Records**: Who approved and when

## Training and Onboarding

### Developer Training

All developers must complete:

1. **Migration Safety Training**: Understand safety rules
2. **Tool Training**: Learn migration safety tools
3. **Process Training**: Understand development workflow
4. **Emergency Training**: Know emergency procedures
5. **Compliance Training**: Understand compliance requirements

### Knowledge Sharing

1. **Documentation**: Maintain up-to-date documentation
2. **Brown Bag Sessions**: Regular knowledge sharing
3. **Code Reviews**: Peer learning through reviews
4. **Incident Reviews**: Learn from incidents
5. **Best Practices**: Share and improve practices

---

## Appendix

### Quick Reference

| Migration Type | Safety Level | Override Required | Rollback Complexity |
|----------------|--------------|-------------------|-------------------|
| CREATE TABLE | ✅ Safe | No | Simple |
| ADD COLUMN | ✅ Safe | No | Simple |
| ADD INDEX | ✅ Safe | No | Simple |
| DROP INDEX | ⚠️ Restricted | Yes | Simple |
| DROP CONSTRAINT | ⚠️ Restricted | Yes | Complex |
| DROP COLUMN | ❌ Dangerous | Yes | Impossible |
| DROP TABLE | ❌ Dangerous | Yes | Impossible |
| ALTER COLUMN TYPE | ❌ Dangerous | Yes | Impossible |
| RENAME TABLE/COLUMN | ❌ Dangerous | Yes | Complex |
| TRUNCATE TABLE | ❌ Dangerous | Yes | Impossible |

### Useful Commands

```bash
# Migration safety validation
npm run migration:safety

# Individual checks
npm run migration:validate
npm run migration:rollback-check
npm run migration:drift-check

# Git hooks
npm run migration:install-hooks
npm run migration:uninstall-hooks

# Prisma operations
npx prisma migrate dev
npx prisma generate
npx prisma validate
npx prisma migrate diff
```

### Contact Information

- **Migration Safety Team**: [Contact Information]
- **Database Team**: [Contact Information]
- **DevOps Team**: [Contact Information]
- **Emergency Contact**: [Contact Information]

---

**Last Updated**: January 25, 2026
**Version**: 1.0
**Next Review**: April 25, 2026
**Approved by**: [Approver Name]
