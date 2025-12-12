# Deployment Guide

Complete guide for deploying AccuBooks to production environments.

## 🌍 Deployment Environments

### Environment Types

- **Development**: Local development environment
- **Staging**: Pre-production testing environment
- **Production**: Live production environment

### Environment URLs

```
Development: http://localhost:5173
Staging: https://staging.accubooks.com
Production: https://app.accubooks.com
API: https://api.accubooks.com
```

## 🚀 Production Deployment

### Prerequisites

- **Node.js**: 18.x or higher
- **Domain**: Custom domain configured
- **SSL Certificate**: Valid SSL certificate
- **CDN**: Content Delivery Network (optional)
- **Monitoring**: Error monitoring and analytics

### Build Process

```bash
# Install dependencies
npm ci --production

# Build for production
npm run build

# Optimize build
npm run build:optimize

# Generate build report
npm run build:report
```

### Environment Configuration

```bash
# Production environment variables
NODE_ENV=production
VITE_API_URL=https://api.accubooks.com
VITE_API_VERSION=v1
VITE_JWT_SECRET=your-production-jwt-secret
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
VITE_SENTRY_DSN=your-sentry-dsn
VITE_GOOGLE_ANALYTICS_ID=your-ga-id
```

## 🐳 Docker Deployment

### Dockerfile

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "80:80"
      - "443:443"
    environment:
      - NODE_ENV=production
    volumes:
      - ./ssl:/etc/nginx/ssl
    restart: unless-stopped

  api:
    image: accubooks/api:latest
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/accubooks
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=accubooks
      - POSTGRES_USER=accubooks
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

## ☁️ Cloud Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Configure domains
vercel domains add app.accubooks.com
```

### Netlify Deployment

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

### AWS Deployment

```bash
# Deploy to S3 + CloudFront
aws s3 sync dist/ s3://accubooks-prod --delete
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## 🔧 CI/CD Pipeline

### GitHub Actions

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 🔒 Security Configuration

### SSL/TLS Setup

```bash
# Generate SSL certificate (Let's Encrypt)
certbot --nginx -d app.accubooks.com

# Auto-renewal
crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Security Headers

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name app.accubooks.com;

    # SSL configuration
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
}
```

## 📊 Monitoring & Logging

### Application Monitoring

```typescript
// monitoring.ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Performance monitoring
Sentry.startTransaction({
  name: 'app-load',
  op: 'load',
});
```

### Error Tracking

```typescript
// error-boundary.tsx
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <h2>Something went wrong!</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

<ErrorBoundary FallbackComponent={ErrorFallback}>
  <App />
</ErrorBoundary>
```

### Analytics Integration

```typescript
// analytics.ts
import ReactGA from 'react-ga4';

ReactGA.initialize(process.env.VITE_GOOGLE_ANALYTICS_ID);

// Track page views
ReactGA.send({ hitType: 'pageview', page: window.location.pathname });

// Track events
ReactGA.event({
  category: 'User',
  action: 'Created Invoice',
  label: 'Invoice Creation',
});
```

## 🔍 Performance Optimization

### Bundle Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          charts: ['recharts'],
          utils: ['date-fns', 'lodash'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

### Caching Strategy

```nginx
# Cache static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

# Cache HTML files
location ~* \.(html)$ {
  expires 1h;
  add_header Cache-Control "public";
}
```

### CDN Configuration

```typescript
// cdn.ts
const CDN_BASE_URL = 'https://cdn.accubooks.com';

export const getAssetUrl = (path: string) => {
  return `${CDN_BASE_URL}/${path}`;
};
```

## 🔄 Database Migration

### Production Migration

```bash
# Backup database
pg_dump accubooks_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations
npm run db:migrate:prod

# Verify migration
npm run db:verify
```

### Rollback Strategy

```bash
# Rollback migration
npm run db:rollback:prod

# Restore from backup
psql accubooks_prod < backup_20241201_120000.sql
```

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Code review completed
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Backup created
- [ ] Rollback plan ready

### Post-Deployment

- [ ] Application health check
- [ ] Database verification
- [ ] API endpoints tested
- [ ] User workflows tested
- [ ] Monitoring configured
- [ ] Analytics tracking
- [ ] Error reporting active

## 🚨 Emergency Procedures

### Rollback Process

```bash
# Quick rollback to previous version
git checkout HEAD~1
npm run build
npm run deploy:emergency

# Database rollback
npm run db:rollback:emergency
```

### Incident Response

1. **Identify Issue**: Monitor alerts and error reports
2. **Assess Impact**: Determine user impact and severity
3. **Communicate**: Notify stakeholders and users
4. **Fix Issue**: Deploy hotfix or rollback
5. **Verify**: Test fix and monitor
6. **Post-mortem**: Document and learn from incident

## 📞 Support & Maintenance

### Monitoring Dashboard

- **Uptime**: https://status.accubooks.com
- **Performance**: https://performance.accubbooks.com
- **Errors**: https://errors.accubooks.com
- **Analytics**: https://analytics.accubooks.com

### Maintenance Schedule

- **Daily**: Health checks and log monitoring
- **Weekly**: Security updates and performance reviews
- **Monthly**: Dependency updates and security audits
- **Quarterly**: Major updates and infrastructure review

### Contact Information

- **DevOps Team**: devops@accubooks.com
- **Emergency**: emergency@accubooks.com
- **Slack**: #accubooks-deployments
- **Phone**: +1-555-DEPLOY

---

## 📚 Additional Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Docker Guide**: https://docs.docker.com
- **AWS Deployment**: https://aws.amazon.com/deploy
- **NGINX Configuration**: https://nginx.org/en/docs/

Last updated: 2025-12-12
