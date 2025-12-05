#!/bin/bash
set -e

# Load environment variables
if [ -f ../.env ]; then
  export $(grep -v '^#' ../.env | xargs)
fi

# Check if backup file is provided
if [ -z "$1" ]; then
  echo "❌ Please provide a backup file to restore"
  echo "Usage: $0 <backup_file>"
  exit 1
fi

BACKUP_FILE="$1"
TEMP_FILE="${BACKUP_FILE}.temp"

# Check if file exists
if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "🔍 Found backup file: ${BACKUP_FILE}"

# Check if file is encrypted
if [[ "${BACKUP_FILE}" == *.gpg ]]; then
  if [ -z "${ENCRYPTION_PASSPHRASE}" ]; then
    echo "🔐 This backup is encrypted. Please set ENCRYPTION_PASSPHRASE in your .env file"
    exit 1
  fi
  
  echo "🔐 Decrypting backup..."
  gpg --batch --passphrase "${ENCRYPTION_PASSPHRASE}" -d "${BACKUP_FILE}" > "${TEMP_FILE}"
  BACKUP_FILE="${TEMP_FILE}"
fi

# Check if file is compressed
if [[ "${BACKUP_FILE}" == *.gz ]]; then
  echo "📦 Decompressing backup..."
  gzip -d -c "${BACKUP_FILE}" > "${TEMP_FILE}"
  BACKUP_FILE="${TEMP_FILE}"
fi

# Confirm before restoring
read -p "⚠️  WARNING: This will overwrite your database. Are you sure? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Restore cancelled"
  [ -f "${TEMP_FILE}" ] && rm -f "${TEMP_FILE}"
  exit 1
fi

# Stop any connections to the database
echo "🛑 Stopping application..."
docker-compose -f ../docker-compose.prod.yml stop app

# Restore the database
echo "🔄 Restoring database from backup..."
PGPASSWORD="${DB_PASSWORD}" pg_restore -h localhost -U postgres -d accubooks --clean --if-exists --no-owner --no-privileges "${BACKUP_FILE}"

# Clean up
[ -f "${TEMP_FILE}" ] && rm -f "${TEMP_FILE}"

# Start the application
echo "🚀 Starting application..."
docker-compose -f ../docker-compose.prod.yml start app

echo "✅ Database restore completed successfully"
