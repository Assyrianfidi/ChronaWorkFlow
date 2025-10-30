# 🚀 AccuBooks Production Deployment Guide

This guide provides comprehensive instructions for deploying AccuBooks to a production environment with enterprise-grade security, monitoring, and performance optimization.

## 📋 Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04 LTS or newer (recommended)
- **RAM**: 4GB minimum, 8GB recommended
- **CPU**: 2 cores minimum, 4 cores recommended
- **Storage**: 50GB SSD minimum
- **Network**: Static IP address recommended

### Software Dependencies
- Docker 20.10+
- Docker Compose 2.0+
- Git
- curl

### External Services
- **Domain Name**: Registered domain (e.g., accubooks.yourcompany.com)
- **SSL Certificate**: Let's Encrypt (free) or commercial certificate
- **Email Service**: SMTP server for notifications
- **Database**: PostgreSQL 15+ (managed or self-hosted)
- **Redis**: Redis 7+ for caching and background jobs

## 🛠️ Quick Start Deployment

### 1. Clone and Configure

```bash
# Clone the repository
git clone https://github.com/your-org/accubooks.git
cd accubooks

# Copy production environment template
cp .env.production .env.production.local

# Edit the configuration file
nano .env.production.local
```

### 2. Configure Environment Variables

Edit `.env.production.local` with your production values:

```bash
# Domain and URLs
DOMAIN=accubooks.yourcompany.com
FRONTEND_URL=https://accubooks.yourcompany.com

# Database Configuration
DATABASE_URL=postgresql://accubooks_prod:your_secure_password@db.yourcompany.com:5432/accubooks_prod

# Redis Configuration
REDIS_HOST=redis.yourcompany.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Security
JWT_SECRET=your_jwt_secret_minimum_32_chars
SESSION_SECRET=your_session_secret_minimum_32_chars

# Third-party Integrations
STRIPE_SECRET_KEY=sk_live_your_stripe_key
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret

# Email Configuration
SMTP_HOST=smtp.yourcompany.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

### 3. Deploy with Docker Compose

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app
```

### 4. Set Up SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot certonly --webroot -w /var/www/html -d accubooks.yourcompany.com

# Set up automatic renewal
sudo crontab -e
# Add: 0 3 * * * certbot renew --quiet
```

### 5. Initialize Database

```bash
# Run database migrations
docker-compose -f docker-compose.prod.yml exec app npm run db:push

# Run optimization script
docker-compose -f docker-compose.prod.yml exec postgres psql -U accubooks_prod -d accubooks_prod -f /scripts/optimize-database.sql
```

### 6. Verify Deployment

```bash
# Check application health
curl https://accubooks.yourcompany.com/health

# Check API endpoints
curl https://accubooks.yourcompany.com/api/companies

# Check monitoring
curl http://localhost:9090  # Prometheus
curl http://localhost:3000  # Grafana (admin/admin)
```

## 🔧 Detailed Configuration

### Database Optimization

Run the optimization script to improve performance:

```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U accubooks_prod -d accubooks_prod -f /scripts/optimize-database.sql
```

### Monitoring Setup

Access monitoring dashboards:

- **Prometheus**: http://your-server-ip:9090
- **Grafana**: http://your-server-ip:3000 (admin/admin)

### Security Hardening

Run the security audit:

```bash
chmod +x scripts/security-audit.sh
./scripts/security-audit.sh
```

## 📊 Monitoring & Alerting

### Health Checks

The application includes comprehensive health checks:

- **Application Health**: `GET /health`
- **Database Health**: PostgreSQL connection monitoring
- **Redis Health**: Cache and queue monitoring
- **External Services**: Stripe, Plaid API health

### Metrics Collection

Prometheus automatically collects:

- API response times and error rates
- Database connection counts
- Background job queue lengths
- Memory and CPU usage
- Custom business metrics

### Alerting Rules

Configure Grafana alerts for:

- API response time > 2 seconds
- Error rate > 5%
- Database connections > 80% of max
- Failed background jobs > 10
- SSL certificate expiry < 30 days

## 🚀 Scaling & Performance

### Horizontal Scaling

Scale the application:

```bash
# Scale web application
docker-compose -f docker-compose.prod.yml up -d --scale app=3

# Scale with load balancer
docker-compose -f docker-compose.prod.yml up -d --scale nginx=2
```

### Database Scaling

For high-traffic deployments:

```bash
# Enable read replicas
# Configure connection pooling
# Implement database sharding for large datasets
```

### CDN Integration

For global deployments:

```bash
# Configure CloudFlare or similar CDN
# Set up static asset caching
# Enable compression and optimization
```

## 🔒 Security Best Practices

### Authentication & Authorization

- JWT tokens with 7-day expiry
- Role-based access control (RBAC)
- Multi-tenant data isolation
- 2FA for admin users

### Data Protection

- All passwords hashed with bcrypt
- Sensitive data encrypted at rest
- API keys stored securely
- Database queries parameterized

### Network Security

- Firewall rules for required ports only
- SSL/TLS encryption for all traffic
- Rate limiting on API endpoints
- DDoS protection via Nginx

### Compliance

- GDPR compliance features
- Audit logging for all actions
- Data retention policies
- Regular security scanning

## 🛠️ Maintenance & Operations

### Backup Strategy

Automated backups are configured:

```bash
# Manual backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U accubooks_prod accubooks_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U accubooks_prod -d accubooks_prod < backup.sql
```

### Log Management

Logs are automatically rotated and can be shipped to:

- ELK Stack (Elasticsearch, Logstash, Kibana)
- Splunk
- CloudWatch
- Custom log aggregation service

### Updates & Upgrades

```bash
# Update application
git pull origin main
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Update database schema
docker-compose -f docker-compose.prod.yml exec app npm run db:push
```

## 🚨 Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check container logs
docker-compose -f docker-compose.prod.yml logs app

# Check environment variables
docker-compose -f docker-compose.prod.yml exec app env | grep -E "(DATABASE_URL|REDIS|STRIPE)"

# Check database connectivity
docker-compose -f docker-compose.prod.yml exec app npm run db:check
```

#### SSL Certificate Issues
```bash
# Check certificate expiry
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Restart Nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

#### Performance Issues
```bash
# Check database performance
docker-compose -f docker-compose.prod.yml exec postgres psql -c "SELECT * FROM pg_stat_activity;"

# Check Redis memory usage
docker-compose -f docker-compose.prod.yml exec redis redis-cli info memory

# Monitor application metrics
curl http://localhost:9090/api/v1/query?query=up
```

## 📞 Support & Monitoring

### Monitoring URLs

After deployment, access these URLs:

- **Main Application**: https://accubooks.yourcompany.com
- **API Documentation**: https://accubooks.yourcompany.com/api/docs
- **Prometheus**: http://your-server-ip:9090
- **Grafana**: http://your-server-ip:3000
- **Health Check**: https://accubooks.yourcompany.com/health

### Emergency Contacts

- **Technical Support**: support@yourcompany.com
- **Security Issues**: security@yourcompany.com
- **System Administrator**: admin@yourcompany.com

### Escalation Procedures

1. Check application health endpoint
2. Review Grafana dashboards for anomalies
3. Check container logs for errors
4. Verify external service connectivity (Stripe, Plaid)
5. Contact technical support if issues persist

## 📚 Additional Resources

- [API Documentation](./README.md#api-documentation)
- [Database Schema](../shared/schema.ts)
- [Security Audit Script](./scripts/security-audit.sh)
- [Performance Optimization](./scripts/optimize-database.sql)
- [Docker Configuration](./docker-compose.prod.yml)

---

**🎉 Congratulations! Your AccuBooks platform is now deployed and ready for production use.**

For questions or issues, please refer to the troubleshooting section or contact support.
