# AccuBooks - Production Deployment Quick Start

**AWS Account:** 971551576768  
**Domain:** https://chronaworkflow.com  
**Status:** Ready for deployment

---

## 🚀 One-Command Deployment

```powershell
cd C:\FidiMyProjects2025\Software_Projects\AccuBooks\AccuBooks
.\scripts\deploy-production.ps1
```

**Duration:** 45-60 minutes  
**Result:** AccuBooks live at https://chronaworkflow.com

---

## 📋 What You'll Need

The deployment script will prompt you for:

### Required
- **Email Service** (choose one):
  - SendGrid API key, OR
  - SMTP credentials (host, port, user, password)

### Optional
- Stripe keys (for payment processing)
- Sentry DSN (for error tracking)
- Google OAuth credentials
- GitHub OAuth credentials

**Note:** Press Enter to skip optional credentials.

---

## 🔧 Prerequisites Verified

✅ AWS credentials configured (Account: 971551576768)  
✅ Secret integration complete  
✅ Terraform infrastructure ready  
✅ Kubernetes manifests ready  
✅ Deployment automation ready  

---

## 📦 What Gets Deployed

### AWS Infrastructure
- **EKS Cluster:** accubooks-production (Kubernetes 1.28)
- **RDS PostgreSQL:** db.r5.xlarge, 500GB, Multi-AZ
- **ElastiCache Redis:** cache.r5.large, 3 nodes
- **S3 Bucket:** accubooks-files-production-971551576768
- **Secrets Manager:** 4 secrets (database, redis, auth, third-party)
- **IAM Roles:** Service account roles for EKS pods

### Kubernetes Resources
- **Namespace:** accubooks-prod
- **Deployment:** accubooks-web (3 replicas)
- **Secrets:** accubooks-backend-secrets, accubooks-frontend-secrets
- **ConfigMaps:** accubooks-backend-config, accubooks-frontend-config
- **Services:** ClusterIP services for backend/frontend

### Auto-Generated Secrets
- ✅ Database password (32-char random)
- ✅ Redis auth token
- ✅ JWT secret (64-char random)
- ✅ JWT refresh secret (64-char random)
- ✅ Session secret (64-char random)
- ✅ Encryption key (64-char random)

---

## 💰 Estimated Costs

**AWS Monthly:** ~$927
- EKS Cluster: $72
- EC2 (5x t3.large): $250
- RDS (db.r5.xlarge): $350
- ElastiCache: $150
- S3 + Transfer: $100
- Route 53: $5

**Third-Party Services:**
- SendGrid: Free (100 emails/day) or $15/month
- Stripe: 2.9% + $0.30 per transaction
- Sentry: Free (5k events/month) or $26/month

---

## 🎯 Deployment Steps

The automated script performs these steps:

### 1. Verify AWS Credentials
- Confirms AWS CLI configured
- Validates account ID matches 971551576768

### 2. Provision Infrastructure (30-40 min)
- Creates VPC with public/private subnets
- Provisions EKS cluster
- Creates RDS PostgreSQL instance
- Creates ElastiCache Redis cluster
- Creates S3 bucket
- Creates AWS Secrets Manager secrets
- Auto-generates database, Redis, JWT, session, encryption keys

### 3. Configure kubectl (2 min)
- Updates kubeconfig for EKS cluster
- Creates accubooks-prod namespace

### 4. Configure Secrets (5 min)
- Prompts for third-party credentials
- Updates AWS Secrets Manager
- Syncs all secrets to Kubernetes

### 5. Build & Push Images (15-20 min)
- Logs into AWS ECR
- Builds Docker image
- Pushes to ECR registry
- Tags as latest and commit SHA

### 6. Deploy to Kubernetes (10 min)
- Applies Kubernetes manifests
- Waits for rolling deployment
- Verifies pods are running

---

## 🔍 Manual Deployment (Step-by-Step)

If you prefer manual control:

### Step 1: Provision Infrastructure

```powershell
cd infrastructure\terraform
terraform init
terraform plan -var-file=production.tfvars
terraform apply -var-file=production.tfvars
```

### Step 2: Configure kubectl

```powershell
aws eks update-kubeconfig --region us-east-1 --name accubooks-production
kubectl create namespace accubooks-prod
```

### Step 3: Update Third-Party Secrets

```bash
# On Linux/Mac or Git Bash
./scripts/update-third-party-secrets.sh production
```

Or manually via AWS CLI:

```powershell
$secrets = @{
    SENDGRID_API_KEY = "your-key"
    STRIPE_SECRET_KEY = "sk_live_..."
    # ... other secrets
} | ConvertTo-Json

aws secretsmanager update-secret `
    --secret-id accubooks/prod/third-party `
    --secret-string $secrets
```

### Step 4: Sync Secrets to Kubernetes

```bash
./scripts/create-secrets.sh production
```

### Step 5: Build and Push Images

```powershell
$ECR = "971551576768.dkr.ecr.us-east-1.amazonaws.com"

aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR

docker build -t $ECR/accubooks-backend:latest .
docker push $ECR/accubooks-backend:latest
```

### Step 6: Deploy

```powershell
kubectl apply -f k8s\base\secrets.yaml
kubectl apply -f k8s\deployment.yaml
kubectl rollout status deployment/accubooks-web -n accubooks-prod
```

---

## ✅ Verify Deployment

```powershell
# Check pods
kubectl get pods -n accubooks-prod

# Check services
kubectl get svc -n accubooks-prod

# Check logs
kubectl logs -l app=accubooks -n accubooks-prod --tail=50

# Test health endpoint (after DNS configured)
curl https://chronaworkflow.com/api/health
```

---

## 🌐 DNS Configuration

After deployment, configure DNS:

1. Get load balancer address:
   ```powershell
   kubectl get svc accubooks-web -n accubooks-prod
   ```

2. Update DNS at your registrar:
   - A record: `chronaworkflow.com` → [LOAD_BALANCER_IP]
   - A record: `www.chronaworkflow.com` → [LOAD_BALANCER_IP]

3. Wait for DNS propagation (up to 48 hours)

---

## 🔧 Troubleshooting

### Terraform fails

```powershell
# Check AWS credentials
aws sts get-caller-identity

# Destroy and recreate
cd infrastructure\terraform
terraform destroy -var-file=production.tfvars
terraform apply -var-file=production.tfvars
```

### Pods not starting

```powershell
# Check pod status
kubectl describe pod <pod-name> -n accubooks-prod

# Check secrets exist
kubectl get secret accubooks-backend-secrets -n accubooks-prod

# Re-sync secrets
bash scripts/create-secrets.sh production
```

### Database connection fails

```powershell
# Verify DATABASE_URL
kubectl get secret accubooks-backend-secrets -n accubooks-prod -o jsonpath='{.data.DATABASE_URL}' | base64 -d

# Check RDS status
aws rds describe-db-instances --db-instance-identifier accubooks-production-db
```

---

## 📚 Documentation

- **Secret Management:** See AWS Secrets Manager in AWS Console
- **Infrastructure:** `infrastructure/terraform/`
- **Kubernetes:** `k8s/`
- **Deployment Scripts:** `scripts/`

---

## 🎉 Post-Deployment

Once deployed:

1. ✅ Verify all pods running
2. ✅ Test health endpoint
3. ✅ Configure DNS
4. ✅ Wait for SSL certificate
5. ✅ Test application features
6. ✅ Set up monitoring/alerts
7. ✅ Document credentials securely

---

## 🚨 Emergency Rollback

If deployment fails:

```powershell
# Rollback Kubernetes deployment
kubectl rollout undo deployment/accubooks-web -n accubooks-prod

# Or destroy infrastructure
cd infrastructure\terraform
terraform destroy -var-file=production.tfvars
```

---

## 📞 Support

For issues:
- Check pod logs: `kubectl logs -l app=accubooks -n accubooks-prod`
- Check Terraform state: `terraform show`
- Check AWS Console for service status

---

**Ready to deploy?**

```powershell
cd C:\FidiMyProjects2025\Software_Projects\AccuBooks\AccuBooks
.\scripts\deploy-production.ps1
```

**Your platform will be live at:** https://chronaworkflow.com 🚀
