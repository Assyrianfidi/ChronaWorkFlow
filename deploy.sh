#!/bin/bash
set -e

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
check_root() {
  if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}Error: This script must be run as root${NC}" >&2
    exit 1
  fi
}

# Function to display usage
usage() {
  echo "Usage: $0 [command] [options]"
  echo ""
  echo "Commands:"
  echo "  start           Start all services"
  echo "  stop            Stop all services"
  echo "  restart         Restart all services"
  echo "  status          Show status of services"
  echo "  logs [service]  Show logs for all or specific service"
  echo "  backup          Create a database backup"
  echo "  restore <file>  Restore database from backup"
  echo "  renew-ssl       Renew SSL certificates"
  echo "  setup-monitoring  Set up monitoring stack"
  echo "  setup-backups   Configure automated backups"
  echo "  security-check  Run security checks"
  echo "  help            Show this help message"
  echo ""
  exit 1
}

# Function to start services
start_services() {
  echo -e "${GREEN}🚀 Starting services...${NC}"
  docker-compose -f docker-compose.prod.yml up -d
  echo -e "${GREEN}✅ Services started successfully${NC}"
}

# Function to stop services
stop_services() {
  echo -e "${YELLOW}🛑 Stopping services...${NC}"
  docker-compose -f docker-compose.prod.yml down
  echo -e "${GREEN}✅ Services stopped successfully${NC}"
}

# Function to restart services
restart_services() {
  stop_services
  start_services
}

# Function to show service status
show_status() {
  docker-compose -f docker-compose.prod.yml ps
}

# Function to show logs
show_logs() {
  if [ -z "$1" ]; then
    docker-compose -f docker-compose.prod.yml logs -f
  else
    docker-compose -f docker-compose.prod.yml logs -f "$1"
  fi
}

# Function to create backup
create_backup() {
  echo -e "${GREEN}💾 Creating database backup...${NC}"
  ./scripts/backup-db.sh
  echo -e "${GREEN}✅ Backup created successfully${NC}"
}

# Function to restore from backup
restore_backup() {
  if [ -z "$1" ]; then
    echo -e "${RED}Error: Please provide a backup file to restore${NC}" >&2
    exit 1
  fi
  
  echo -e "${YELLOW}⚠️  WARNING: This will overwrite your database. Are you sure? [y/N]${NC}" 
  read -r confirm
  if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo -e "${RED}Restore cancelled${NC}"
    exit 0
  fi
  
  echo -e "${GREEN}🔄 Restoring from backup: $1${NC}"
  ./scripts/restore-db.sh "$1"
  echo -e "${GREEN}✅ Database restored successfully${NC}"
}

# Function to renew SSL certificates
renew_ssl() {
  echo -e "${GREEN}🔄 Renewing SSL certificates...${NC}"
  docker-compose -f docker-compose.prod.yml run --rm certbot renew
  docker-compose -f docker-compose.prod.yml restart nginx
  echo -e "${GREEN}✅ SSL certificates renewed successfully${NC}"
}

# Function to set up monitoring
setup_monitoring() {
  echo -e "${GREEN}🔧 Setting up monitoring...${NC}"
  ./scripts/deploy-monitoring.sh
  echo -e "${GREEN}✅ Monitoring setup completed${NC}"
}

# Function to set up automated backups
setup_backups() {
  echo -e "${GREEN}🔧 Setting up automated backups...${NC}"
  
  # Create backup directory if it doesn't exist
  mkdir -p /var/backups/accubooks
  
  # Add backup job to crontab
  (crontab -l 2>/dev/null; echo "0 2 * * * $(pwd)/scripts/backup-db.sh") | crontab -
  
  # Add log rotation for backup logs
  cat > /etc/logrotate.d/accubooks-backups << EOL
/var/log/accubooks-backup.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 640 root root
}
EOL
  
  echo -e "${GREEN}✅ Automated backups configured${NC}"
  echo -e "Backups will run daily at 2 AM and be stored in /var/backups/accubooks"
}

# Function to run security checks
security_check() {
  echo -e "${GREEN}🔒 Running security checks...${NC}"
  
  # Check for default passwords
  echo -e "\n🔑 Checking for default passwords..."
  if [ "$DB_PASSWORD" = "your_db_password" ]; then
    echo -e "${RED}❌ Default database password detected!${NC}"
  else
    echo -e "${GREEN}✅ Database password is not default${NC}"
  fi
  
  # Check for open ports
  echo -e "\n🔍 Checking for open ports..."
  netstat -tuln | grep -E ':(80|443|3000|9090|9093|9100)'
  
  # Check for container vulnerabilities
  echo -e "\n🐳 Checking container vulnerabilities..."
  docker ps --format '{{.Names}}' | xargs -I {} sh -c 'echo "\n🔍 Checking {}:" && docker scan {} --file Dockerfile || echo "Skipping scan for {}"'
  
  echo -e "\n${GREEN}✅ Security check completed${NC}"
}

# Main script execution
case "$1" in
  start)
    start_services
    ;;
  stop)
    stop_services
    ;;
  restart)
    restart_services
    ;;
  status)
    show_status
    ;;
  logs)
    show_logs "$2"
    ;;
  backup)
    create_backup
    ;;
  restore)
    restore_backup "$2"
    ;;
  renew-ssl)
    renew_ssl
    ;;
  setup-monitoring)
    setup_monitoring
    ;;
  setup-backups)
    setup_backups
    ;;
  security-check)
    security_check
    ;;
  help|--help|-h)
    usage
    ;;
  *)
    echo -e "${RED}Error: Unknown command '$1'${NC}"
    usage
    ;;
esac

exit 0

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running. Please start Docker and try again."
  exit 1
fi

# Function to display usage
function show_usage() {
  echo "Usage: $0 [command]"
  echo ""
  echo "Commands:"
  echo "  up          Start all services"
  echo "  down        Stop and remove all services"
  echo "  restart     Restart all services"
  echo "  logs        View logs for all services"
  echo "  db:backup   Create a database backup"
  echo "  db:restore  Restore database from latest backup"
  echo "  cert:renew  Renew SSL certificates"
  echo "  help        Show this help message"
  echo ""
  exit 1
}

# Function to start services
function start_services() {
  echo "🚀 Starting AccuBooks services..."
  
  # Create necessary directories
  mkdir -p certs certs/www backups
  
  # Generate secrets if .env doesn't exist
  if [ ! -f .env ]; then
    echo "🔐 Generating environment variables..."
    ./scripts/generate-secrets.sh
    echo "✅ Environment variables generated. Please review and update .env file with your configuration."
    exit 0
  fi
  
  # Build and start services
  echo "🔨 Building and starting services..."
  docker-compose -f docker-compose.prod.yml up -d --build
  
  # Run database migrations
  echo "🔄 Running database migrations..."
  docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
  
  echo "✅ Services started successfully!"
  echo "🌐 Application URL: https://${DOMAIN:-accubooks.example.com}"
}

# Function to stop services
function stop_services() {
  echo "🛑 Stopping AccuBooks services..."
  docker-compose -f docker-compose.prod.yml down
  echo "✅ Services stopped successfully!"
}

# Function to restart services
function restart_services() {
  stop_services
  start_services
}

# Function to view logs
function view_logs() {
  docker-compose -f docker-compose.prod.yml logs -f
}

# Function to create database backup
function backup_database() {
  echo "💾 Creating database backup..."
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres accubooks > "backups/accubooks_backup_${TIMESTAMP}.sql"
  echo "✅ Database backup created: backups/accubooks_backup_${TIMESTAMP}.sql"
}

# Function to restore database from latest backup
function restore_database() {
  LATEST_BACKUP=$(ls -t backups/accubooks_backup_*.sql | head -1)
  
  if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ No backup files found in the backups/ directory."
    exit 1
  fi
  
  read -p "Are you sure you want to restore from ${LATEST_BACKUP}? This will overwrite the current database. [y/N] " -n 1 -r
  echo
  
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Restoring database from ${LATEST_BACKUP}..."
    cat "$LATEST_BACKUP" | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres accubooks
    echo "✅ Database restored successfully from ${LATEST_BACKUP}"
  else
    echo "❌ Database restore cancelled."
  fi
}

# Function to renew SSL certificates
function renew_certificates() {
  echo "🔄 Renewing SSL certificates..."
  
  if [ -z "$DOMAIN" ]; then
    echo "❌ DOMAIN environment variable is not set. Please set it in your .env file."
    exit 1
  fi
  
  if [ -z "$EMAIL" ]; then
    echo "❌ EMAIL environment variable is not set. Please set it in your .env file."
    exit 1
  fi
  
  # Stop any running nginx containers
  docker-compose -f docker-compose.prod.yml stop nginx
  
  # Run certbot to renew certificates
  docker run --rm \
    -v "$(pwd)/certs:/etc/letsencrypt" \
    -v "$(pwd)/certs/www:/var/www/certbot" \
    certbot/certbot renew --webroot -w /var/www/certbot \
    --email "$EMAIL" \
    --no-eff-email \
    --agree-tos \
    --force-renewal
  
  # Restart nginx
  docker-compose -f docker-compose.prod.yml restart nginx
  
  echo "✅ SSL certificates renewed successfully!"
}

# Main script
case "$1" in
  up)
    start_services
    ;;
  down)
    stop_services
    ;;
  restart)
    restart_services
    ;;
  logs)
    view_logs
    ;;
  db:backup)
    backup_database
    ;;
  db:restore)
    restore_database
    ;;
  cert:renew)
    renew_certificates
    ;;
  help|--help|-h|*)
    show_usage
    ;;
esac

exit 0
