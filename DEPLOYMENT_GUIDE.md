# AccuBooks/ChronaWorkflow Production Deployment Guide

## Overview

This guide provides complete instructions for deploying AccuBooks/ChronaWorkflow to AWS EKS with zero manual intervention.

## Prerequisites

✅ **Already Provisioned:**
- AWS Account: 971551576768
- Region: ca-central-1
- EKS Cluster: accubooks-production (Kubernetes v1.29)
- RDS PostgreSQL 16: accubooks-production-db
- ElastiCache Redis: accubooks-production-redis
- AWS Secrets Manager: accubooks/prod/v2/* namespace
- IAM roles and policies configured

✅ **Required Tools:**
- Docker Desktop (running)
- AWS CLI v2 (configured with credentials)
- kubectl (latest version)
- PowerShell 7+ or Windows PowerShell

## Quick Start

### Option 1: One-Command Deployment

```powershell
.\DEPLOY.ps1
```

This master script will:
1. Fetch secrets from AWS Secrets Manager
2. Create Kubernetes secrets and service accounts
3. Build Docker images for backend and frontend
4. Push images to Amazon ECR
5. Deploy application to EKS
6. Verify deployment health
7. Display public application URL

### Option 2: Step-by-Step Deployment

#### Step 1: Setup Kubernetes Secrets
```powershell
.\k8s-secrets-setup.ps1
```

#### Step 2: Deploy Application
```powershell
.\deploy-to-eks.ps1
```

## Architecture

### Application Components

**Backend (Express.js + TypeScript)**
- Port: 5000
- Image: 971551576768.dkr.ecr.ca-central-1.amazonaws.com/accubooks-backend:latest
- Replicas: 2
- Resources: 256Mi-512Mi RAM, 250m-500m CPU

**Frontend (React + Vite + Nginx)**
- Port: 80
- Image: 971551576768.dkr.ecr.ca-central-1.amazonaws.com/accubooks-frontend:latest
- Replicas: 2
- Resources: 128Mi-256Mi RAM, 100m-200m CPU
- Exposed via AWS Network Load Balancer

### AWS Resources Integration

**Database:**
- RDS PostgreSQL 16 (db.t3.micro)
- Connection via DATABASE_URL from Secrets Manager
- SSL enabled

**Cache:**
- ElastiCache Redis (cache.t3.micro)
- Connection via REDIS_URL from Secrets Manager
- Password authentication enabled

**Storage:**
- S3 Bucket: accubooks-files-production-971551576768
- IAM role attached to backend pods for S3 access

**Secrets:**
- AWS Secrets Manager v2 namespace
- Automatically synced to Kubernetes secrets
- No hardcoded credentials

## Environment Variables

### Backend Environment Variables

Automatically configured from AWS Secrets Manager:

```yaml
DATABASE_URL: PostgreSQL connection string
REDIS_URL: Redis connection string
REDIS_PASSWORD: Redis authentication
JWT_SECRET: JWT signing key
JWT_REFRESH_SECRET: JWT refresh token key
SESSION_SECRET: Express session secret
ENCRYPTION_KEY: Data encryption key
STRIPE_SECRET_KEY: Stripe API key
STRIPE_PUBLISHABLE_KEY: Stripe public key
GOOGLE_CLIENT_ID: OAuth client ID
GOOGLE_CLIENT_SECRET: OAuth client secret
SMTP_HOST: Email server host
SMTP_PORT: Email server port
SMTP_USER: Email username
SMTP_PASS: Email password
```

### ConfigMap Variables

```yaml
NODE_ENV: production
AWS_REGION: ca-central-1
PORT: 5000
```

## Deployment Process

### 1. ECR Repository Creation

```powershell
aws ecr create-repository --repository-name accubooks-backend --region ca-central-1
aws ecr create-repository --repository-name accubooks-frontend --region ca-central-1
```

### 2. Docker Image Build

**Backend:**
```powershell
docker build -f Dockerfile.backend -t accubooks-backend:latest .
```

**Frontend:**
```powershell
docker build -f Dockerfile.frontend -t accubooks-frontend:latest .
```

### 3. Image Push to ECR

```powershell
aws ecr get-login-password --region ca-central-1 | docker login --username AWS --password-stdin 971551576768.dkr.ecr.ca-central-1.amazonaws.com

docker push 971551576768.dkr.ecr.ca-central-1.amazonaws.com/accubooks-backend:latest
docker push 971551576768.dkr.ecr.ca-central-1.amazonaws.com/accubooks-frontend:latest
```

### 4. Kubernetes Configuration

```powershell
aws eks update-kubeconfig --name accubooks-production --region ca-central-1
kubectl create namespace accubooks-prod
```

### 5. Secrets Deployment

Secrets are automatically fetched from AWS Secrets Manager and created as Kubernetes secrets.

### 6. Application Deployment

Kubernetes manifests are applied for:
- ConfigMaps
- Secrets
- ServiceAccounts (with IAM role annotations)
- Deployments (backend and frontend)
- Services (ClusterIP for backend, LoadBalancer for frontend)

## Health Checks

### Backend Health Check
```bash
kubectl exec -it deployment/accubooks-backend -n accubooks-prod -- curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "accubooks",
  "env": "production"
}
```

### Frontend Health Check
```bash
kubectl exec -it deployment/accubooks-frontend -n accubooks-prod -- wget -O- http://localhost/health
```

Expected response:
```
healthy
```

## Verification Commands

### View Pods
```bash
kubectl get pods -n accubooks-prod
```

### View Services
```bash
kubectl get svc -n accubooks-prod
```

### View Logs
```bash
# Backend logs
kubectl logs -f deployment/accubooks-backend -n accubooks-prod

# Frontend logs
kubectl logs -f deployment/accubooks-frontend -n accubooks-prod
```

### Get LoadBalancer URL
```bash
kubectl get svc accubooks-frontend -n accubooks-prod -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

## Troubleshooting

### Pods Not Starting

**Check pod status:**
```bash
kubectl describe pod <pod-name> -n accubooks-prod
```

**Common issues:**
- Image pull errors: Verify ECR permissions
- Secret not found: Run `k8s-secrets-setup.ps1` again
- Resource limits: Check node capacity

### Database Connection Issues

**Verify database secret:**
```bash
kubectl get secret accubooks-secrets -n accubooks-prod -o jsonpath='{.data.database-url}' | base64 -d
```

**Test connection from pod:**
```bash
kubectl exec -it deployment/accubooks-backend -n accubooks-prod -- sh
# Inside pod:
node -e "console.log(process.env.DATABASE_URL)"
```

### Redis Connection Issues

**Verify Redis secret:**
```bash
kubectl get secret accubooks-secrets -n accubooks-prod -o jsonpath='{.data.redis-url}' | base64 -d
```

### LoadBalancer Not Getting External IP

**Check service events:**
```bash
kubectl describe svc accubooks-frontend -n accubooks-prod
```

**Verify AWS Load Balancer Controller:**
```bash
kubectl get pods -n kube-system | grep aws-load-balancer
```

## Scaling

### Manual Scaling

**Scale backend:**
```bash
kubectl scale deployment accubooks-backend -n accubooks-prod --replicas=3
```

**Scale frontend:**
```bash
kubectl scale deployment accubooks-frontend -n accubooks-prod --replicas=3
```

### Auto-Scaling (Optional)

For production workloads beyond free-tier:
```bash
kubectl autoscale deployment accubooks-backend -n accubooks-prod --cpu-percent=70 --min=2 --max=10
```

## Rollback

### Rollback to Previous Version

```bash
kubectl rollout undo deployment/accubooks-backend -n accubooks-prod
kubectl rollout undo deployment/accubooks-frontend -n accubooks-prod
```

### View Rollout History

```bash
kubectl rollout history deployment/accubooks-backend -n accubooks-prod
```

## Updates and Redeployment

### Update Application

1. Build new Docker images with updated code
2. Tag with new version:
   ```bash
   docker tag accubooks-backend:latest 971551576768.dkr.ecr.ca-central-1.amazonaws.com/accubooks-backend:v2
   ```
3. Push to ECR
4. Update deployment:
   ```bash
   kubectl set image deployment/accubooks-backend accubooks-backend=971551576768.dkr.ecr.ca-central-1.amazonaws.com/accubooks-backend:v2 -n accubooks-prod
   ```

### Rolling Update

Kubernetes automatically performs rolling updates with zero downtime.

## Security Considerations

✅ **Implemented:**
- Non-root containers
- Read-only root filesystems (where applicable)
- Resource limits to prevent resource exhaustion
- Network policies (ClusterIP for internal services)
- IAM roles for service accounts (IRSA)
- Secrets stored in AWS Secrets Manager
- TLS for database connections
- Image scanning enabled in ECR

## Cost Optimization

**Current Configuration (Free-Tier Optimized):**
- EKS Cluster: $73/month
- NAT Gateways: $97/month
- ElastiCache Redis: $12/month
- RDS PostgreSQL: Free tier eligible
- EC2 instances: Free tier eligible

**Total Estimated Cost:** ~$180-200/month

## DNS Configuration

To attach a custom domain:

1. Get LoadBalancer hostname:
   ```bash
   kubectl get svc accubooks-frontend -n accubooks-prod
   ```

2. Create CNAME record in your DNS provider:
   ```
   chronaworkflow.com -> <LoadBalancer-hostname>
   ```

3. Configure SSL/TLS (optional):
   - Use AWS Certificate Manager
   - Update service annotations for HTTPS

## Monitoring and Observability

### Metrics Endpoint

Backend exposes Prometheus metrics at `/metrics`:
```bash
kubectl port-forward deployment/accubooks-backend 5000:5000 -n accubooks-prod
curl http://localhost:5000/metrics
```

### CloudWatch Integration

Logs are automatically sent to CloudWatch Logs:
- Log Group: `/aws/eks/accubooks-production/cluster`

## Support

For issues or questions:
1. Check pod logs: `kubectl logs -f deployment/accubooks-backend -n accubooks-prod`
2. Check events: `kubectl get events -n accubooks-prod --sort-by='.lastTimestamp'`
3. Verify secrets: `kubectl get secrets -n accubooks-prod`
4. Check AWS resources in AWS Console

## Next Steps

After successful deployment:

1. ✅ Verify application is accessible via LoadBalancer URL
2. ✅ Test authentication flows
3. ✅ Verify database connectivity
4. ✅ Test Redis caching
5. ✅ Configure custom domain (optional)
6. ✅ Set up monitoring and alerting
7. ✅ Configure backup strategies
8. ✅ Document operational procedures

---

**Deployment Status:** Ready for Production
**Last Updated:** January 30, 2026
