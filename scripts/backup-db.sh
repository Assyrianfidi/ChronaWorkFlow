#!/bin/bash
set -e

# Load environment variables
if [ -f ../.env ]; then
  export $(grep -v '^#' ../.env | xargs)
fi

# Set variables
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="../backups"
FILENAME="accubooks_backup_${TIMESTAMP}.sql"
FULL_PATH="${BACKUP_DIR}/${FILENAME}"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo "🔄 Creating database backup: ${FILENAME}"

# Create backup
PGPASSWORD="${DB_PASSWORD}" pg_dump -h localhost -U postgres -d accubooks -F c -b -v -f "${FULL_PATH}.dump"

# Compress the backup
gzip "${FULL_PATH}.dump"

# Encrypt the backup (optional, requires gpg)
if [ -n "${ENCRYPTION_PASSPHRASE}" ]; then
  echo "🔐 Encrypting backup..."
  gpg --symmetric --batch --passphrase "${ENCRYPTION_PASSPHRASE}" "${FULL_PATH}.dump.gz"
  rm "${FULL_PATH}.dump.gz"
  echo "✅ Backup encrypted: ${FILENAME}.dump.gz.gpg"
else
  echo "✅ Backup created: ${FILENAME}.dump.gz"
fi

# Upload to S3 if configured
if [ -n "${AWS_ACCESS_KEY_ID}" ] && [ -n "${AWS_SECRET_ACCESS_KEY}" ] && [ -n "${S3_BUCKET}" ]; then
  echo "☁️  Uploading to S3..."
  aws s3 cp "${FULL_PATH}.dump.gz${ENCRYPTION_PASSPHRASE:+.gpg}" "s3://${S3_BUCKET}/backups/"
  echo "✅ Backup uploaded to S3"
fi

# Clean up old backups (keep last 7 days)
find "${BACKUP_DIR}" -name "accubooks_backup_*.dump.gz*" -mtime +7 -delete

echo "✅ Backup completed successfully"
