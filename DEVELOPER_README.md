# 🚀 AccuBooks - Developer Guide

**Production-Ready Financial Decision-Making Platform**

This guide will help you run AccuBooks locally in under 10 minutes with zero manual setup.

---

## ⚡ Quick Start (One Command)

```bash
# Start everything with Docker Compose
docker compose -f docker-compose.local.yml up

# Or start in background
docker compose -f docker-compose.local.yml up -d
```

**That's it!** AccuBooks will:
- ✅ Start PostgreSQL database
- ✅ Start Redis cache
- ✅ Run database migrations automatically
- ✅ Seed demo data (admin user, demo tenant, scenarios, forecasts)
- ✅ Start backend API on http://localhost:5000
- ✅ Start frontend app on http://localhost:3000

**Access the app**: Open http://localhost:3000 in your browser

**Demo credentials**:
- Email: `admin@accubooks.com`
- Password: `admin123`
- Tenant: `Demo Company Inc.`

---

## 📋 Prerequisites

**Required**:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- 4GB RAM minimum (8GB recommended)
- 10GB free disk space

**Optional** (for local development without Docker):
- Node.js 18+ and npm
- PostgreSQL 15+
- Redis 7+

---

## 🏗️ Architecture Overview

AccuBooks consists of 4 services:

1. **PostgreSQL** - Primary database (port 5432)
2. **Redis** - Cache and session store (port 6379)
3. **Backend API** - Node.js/Express/TypeScript (port 5000)
4. **Frontend App** - React/Vite/TypeScript (port 3000)

All services run in Docker containers with health checks and auto-restart.

---

## 🔧 Environment Configuration

### Using Default Configuration (Recommended for Local Development)

The default configuration works out-of-the-box. No setup required.

### Custom Configuration (Optional)

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and replace `CHANGE_ME_*` placeholders with your values:
   ```bash
   # Generate secure secrets
   openssl rand -base64 32  # For JWT_SECRET
   openssl rand -base64 32  # For JWT_REFRESH_SECRET
   openssl rand -base64 32  # For SESSION_SECRET
   ```

3. Restart Docker Compose to apply changes:
   ```bash
   docker compose -f docker-compose.local.yml restart
   ```

---

## 📊 Health Checks

### Check All Services

```bash
# Check overall health
curl http://localhost:5000/health

# Check database health
curl http://localhost:5000/health/db

# Check Redis health
curl http://localhost:5000/health/redis

# Check all services at once
curl http://localhost:5000/health/all
```

### Expected Response (Healthy)

```json
{
  "status": "healthy",
  "timestamp": "2026-01-31T23:58:00.000Z",
  "uptime": 123.45,
  "environment": "development",
  "version": "1.0.0",
  "service": "AccuBooks API"
}
```

---

## 🛠️ Common Commands

### Start Services

```bash
# Start all services (foreground with logs)
docker compose -f docker-compose.local.yml up

# Start all services (background)
docker compose -f docker-compose.local.yml up -d

# Start specific service
docker compose -f docker-compose.local.yml up backend
```

### Stop Services

```bash
# Stop all services (keeps data)
docker compose -f docker-compose.local.yml down

# Stop and remove all data (fresh start)
docker compose -f docker-compose.local.yml down -v
```

### View Logs

```bash
# View all logs
docker compose -f docker-compose.local.yml logs -f

# View specific service logs
docker compose -f docker-compose.local.yml logs -f backend
docker compose -f docker-compose.local.yml logs -f frontend
docker compose -f docker-compose.local.yml logs -f postgres
docker compose -f docker-compose.local.yml logs -f redis
```

### Rebuild Services

```bash
# Rebuild all services
docker compose -f docker-compose.local.yml up --build

# Rebuild specific service
docker compose -f docker-compose.local.yml up --build backend
```

### Reset Everything

```bash
# Complete reset (removes all data, containers, volumes)
docker compose -f docker-compose.local.yml down -v
docker compose -f docker-compose.local.yml up --build
```

---

## 🧪 Running Tests

### Backend Tests

```bash
# Run all backend tests
docker compose -f docker-compose.local.yml exec backend npm test

# Run tests with coverage
docker compose -f docker-compose.local.yml exec backend npm run test:coverage

# Run specific test file
docker compose -f docker-compose.local.yml exec backend npm test -- scenarios.test.ts
```

### Frontend Tests

```bash
# Run all frontend tests
docker compose -f docker-compose.local.yml exec frontend npm test

# Run tests with coverage
docker compose -f docker-compose.local.yml exec frontend npm run test:coverage
```

### End-to-End Tests

```bash
# Run E2E tests (requires services to be running)
npm run test:e2e
```

---

## 🗄️ Database Management

### Run Migrations

```bash
# Migrations run automatically on startup
# To run manually:
docker compose -f docker-compose.local.yml exec backend npx prisma migrate deploy
```

### Seed Database

```bash
# Seeding happens automatically on first startup
# To re-seed manually:
docker compose -f docker-compose.local.yml exec backend npm run seed
```

### Reset Database

```bash
# Reset database (WARNING: Deletes all data)
docker compose -f docker-compose.local.yml exec backend npx prisma migrate reset

# Or reset everything with Docker
docker compose -f docker-compose.local.yml down -v
docker compose -f docker-compose.local.yml up
```

### Access Database Directly

```bash
# Using Docker
docker compose -f docker-compose.local.yml exec postgres psql -U accubooks -d accubooks_dev

# Using local psql client
psql postgresql://accubooks:accubooks_dev_password@localhost:5432/accubooks_dev
```

### Prisma Studio (Database GUI)

```bash
# Open Prisma Studio
docker compose -f docker-compose.local.yml exec backend npx prisma studio

# Access at: http://localhost:5555
```

---

## 🐛 Troubleshooting

### Services Won't Start

**Problem**: Docker Compose fails to start services

**Solutions**:
```bash
# 1. Check Docker is running
docker ps

# 2. Check for port conflicts
netstat -an | findstr "5000 3000 5432 6379"  # Windows
lsof -i :5000,3000,5432,6379                 # Mac/Linux

# 3. Reset everything
docker compose -f docker-compose.local.yml down -v
docker compose -f docker-compose.local.yml up --build
```

### Database Connection Errors

**Problem**: Backend can't connect to PostgreSQL

**Solutions**:
```bash
# 1. Check PostgreSQL is healthy
docker compose -f docker-compose.local.yml ps postgres

# 2. Check PostgreSQL logs
docker compose -f docker-compose.local.yml logs postgres

# 3. Restart PostgreSQL
docker compose -f docker-compose.local.yml restart postgres

# 4. Reset database volume
docker compose -f docker-compose.local.yml down -v
docker compose -f docker-compose.local.yml up postgres
```

### Redis Connection Errors

**Problem**: Backend can't connect to Redis

**Solutions**:
```bash
# 1. Check Redis is healthy
docker compose -f docker-compose.local.yml ps redis

# 2. Test Redis connection
docker compose -f docker-compose.local.yml exec redis redis-cli ping

# 3. Restart Redis
docker compose -f docker-compose.local.yml restart redis
```

### Frontend Won't Load

**Problem**: Frontend shows blank page or errors

**Solutions**:
```bash
# 1. Check frontend logs
docker compose -f docker-compose.local.yml logs frontend

# 2. Rebuild frontend
docker compose -f docker-compose.local.yml up --build frontend

# 3. Clear browser cache and reload
```

### Slow Performance

**Problem**: Services are slow or unresponsive

**Solutions**:
```bash
# 1. Check Docker resource allocation
# Docker Desktop → Settings → Resources
# Increase CPU and Memory allocation

# 2. Check disk space
docker system df

# 3. Clean up Docker
docker system prune -a --volumes
```

---

## 🚀 Deployment

### Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.

**Quick overview**:
1. Set up production environment variables
2. Build Docker images
3. Deploy to AWS ECS, GCP Cloud Run, or Kubernetes
4. Configure SSL/TLS certificates
5. Set up monitoring and alerts

### Staging Deployment

```bash
# Build production images
docker compose -f docker-compose.production.yml build

# Run production images locally
docker compose -f docker-compose.production.yml up
```

---

## 📚 Additional Resources

### Documentation

- [API Documentation](http://localhost:5000/docs) - Swagger/OpenAPI docs (when running)
- [Architecture Overview](./ARCHITECTURE.md) - System architecture and design decisions
- [Security Guide](./SECURITY.md) - Security best practices and compliance
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute to AccuBooks

### Key Files

- `docker-compose.local.yml` - Local development environment
- `docker-compose.production.yml` - Production environment
- `.env.example` - Environment variable template
- `prisma/schema.prisma` - Database schema
- `server/` - Backend API code
- `client/` - Frontend React app code

### Scripts

- `scripts/bootstrap-db.ts` - Database seeding script
- `scripts/migrate.sh` - Database migration script
- `scripts/backup.sh` - Database backup script

---

## 🔐 Security Notes

### Development Environment

- Default passwords are **NOT SECURE** and should only be used for local development
- Never commit `.env.local` or `.env.production` to source control
- Use `.env.example` as a template only

### Production Environment

- Use strong, randomly generated secrets (minimum 32 characters)
- Store secrets in a secure secret management service (AWS Secrets Manager, HashiCorp Vault, etc.)
- Enable SSL/TLS for all connections
- Use environment variables or secret management, never hardcode secrets
- Rotate secrets regularly

---

## 🆘 Getting Help

### Common Issues

1. **Port already in use**: Change ports in `docker-compose.local.yml` or stop conflicting services
2. **Out of memory**: Increase Docker memory allocation in Docker Desktop settings
3. **Slow builds**: Enable Docker BuildKit: `export DOCKER_BUILDKIT=1`
4. **Permission errors**: Run Docker commands with appropriate permissions

### Support Channels

- **GitHub Issues**: [Report bugs or request features](https://github.com/Assyrianfidi/ChronaWorkFlow/issues)
- **Documentation**: Check the docs folder for detailed guides
- **Health Checks**: Use `/health` endpoints to diagnose issues

---

## ✅ Verification Checklist

After starting AccuBooks, verify everything works:

- [ ] Docker containers are running: `docker compose -f docker-compose.local.yml ps`
- [ ] PostgreSQL is healthy: `curl http://localhost:5000/health/db`
- [ ] Redis is healthy: `curl http://localhost:5000/health/redis`
- [ ] Backend API responds: `curl http://localhost:5000/health`
- [ ] Frontend loads: Open http://localhost:3000
- [ ] Can log in with demo credentials
- [ ] Can view demo scenarios and forecasts

---

## 🎯 Next Steps

Once AccuBooks is running:

1. **Explore the app**: Log in and explore the scenario builder and forecasting features
2. **Review the code**: Check out the backend (`server/`) and frontend (`client/`) code
3. **Run tests**: Execute the test suite to ensure everything works
4. **Read the docs**: Review architecture and API documentation
5. **Start developing**: Make changes and see them hot-reload automatically

---

## 📝 Development Workflow

### Making Changes

1. **Backend changes**: Edit files in `server/`, changes hot-reload automatically
2. **Frontend changes**: Edit files in `client/src/`, changes hot-reload automatically
3. **Database changes**: Edit `prisma/schema.prisma`, then run migrations
4. **Environment changes**: Edit `.env.local`, then restart services

### Testing Changes

```bash
# Run tests after making changes
docker compose -f docker-compose.local.yml exec backend npm test
docker compose -f docker-compose.local.yml exec frontend npm test

# Check code quality
docker compose -f docker-compose.local.yml exec backend npm run lint
docker compose -f docker-compose.local.yml exec frontend npm run lint
```

### Committing Changes

```bash
# Format code
npm run format

# Run linter
npm run lint

# Run tests
npm test

# Commit changes
git add .
git commit -m "Your commit message"
git push
```

---

## 🏆 Success!

If you can access http://localhost:3000 and log in with the demo credentials, **you're all set!**

AccuBooks is now running locally with:
- ✅ Full backend API
- ✅ Interactive frontend
- ✅ PostgreSQL database with demo data
- ✅ Redis cache
- ✅ Health monitoring
- ✅ Hot-reload for development

**Happy coding! 🚀**

---

## 📄 License

AccuBooks is proprietary software. See [LICENSE](./LICENSE) for details.

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

**Questions?** Check the [FAQ](./FAQ.md) or open an issue on GitHub.
