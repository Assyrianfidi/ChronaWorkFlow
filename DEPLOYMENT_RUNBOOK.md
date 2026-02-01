# AccuBooks Production Deployment Runbook

**Status:** Ready for Execution  
**Last Updated:** January 30, 2026  
**Estimated Time:** 6-8 hours for complete deployment

---

## Prerequisites Checklist

Before starting deployment, ensure you have:

- [ ] AWS CLI configured with appropriate credentials
- [ ] Terraform v1.0+ installed
- [ ] kubectl v1.28+ installed
- [ ] Docker installed and running
- [ ] Helm v3+ installed
- [ ] Node.js v18+ and npm installed
- [ ] Access to AWS account with admin permissions
- [ ] Domain registrar access for DNS configuration
- [ ] Git repository access

---

## Phase 2: Infrastructure Provisioning

### Step 1: Provision Staging Infrastructure

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Review staging plan
terraform plan -var-file=staging.tfvars -out=staging.tfplan

# Apply staging infrastructure
terraform apply staging.tfplan

# Save outputs
terraform output -json > staging-outputs.json
```

**Expected Duration:** 20-30 minutes

**Validation:**
```bash
# Verify EKS cluster
aws eks describe-cluster --name accubooks-staging --region us-east-1

# Verify RDS instance
aws rds describe-db-instances --db-instance-identifier accubooks-staging-db

# Verify Redis
aws elasticache describe-replication-groups --replication-group-id accubooks-staging-redis
```

### Step 2: Provision Production Infrastructure

```bash
# Review production plan
terraform plan -var-file=production.tfvars -out=production.tfplan

# Apply production infrastructure
terraform apply production.tfplan

# Save outputs
terraform output -json > production-outputs.json
```

**Expected Duration:** 30-40 minutes

**Validation:**
```bash
# Verify EKS cluster
aws eks describe-cluster --name accubooks-production --region us-east-1

# Verify RDS instance with read replica
aws rds describe-db-instances --db-instance-identifier accubooks-production-db
aws rds describe-db-instances --db-instance-identifier accubooks-production-db-replica

# Verify Redis cluster
aws elasticache describe-replication-groups --replication-group-id accubooks-production-redis
```

### Step 3: Configure kubectl for Both Clusters

```bash
# Configure staging
aws eks update-kubeconfig \
  --region us-east-1 \
  --name accubooks-staging \
  --alias accubooks-staging

# Configure production
aws eks update-kubeconfig \
  --region us-east-1 \
  --name accubooks-production \
  --alias accubooks-production

# Verify connectivity
kubectl --context accubooks-staging cluster-info
kubectl --context accubooks-production cluster-info
```

### Step 4: Create Kubernetes Secrets

**Staging Secrets:**
```bash
# Switch to staging context
kubectl config use-context accubooks-staging

# Create namespace
kubectl create namespace accubooks-staging

# Extract database credentials from Terraform outputs
DB_ENDPOINT=$(jq -r '.database_endpoint.value' staging-outputs.json)
DB_NAME=$(jq -r '.database_name.value' staging-outputs.json)
DB_USERNAME=$(jq -r '.database_username.value' staging-outputs.json)
DB_PASSWORD=$(jq -r '.database_password.value' staging-outputs.json)
REDIS_ENDPOINT=$(jq -r '.redis_endpoint.value' staging-outputs.json)

# Generate secrets
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Create Kubernetes secret
kubectl create secret generic accubooks-secrets \
  --namespace=accubooks-staging \
  --from-literal=DATABASE_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_ENDPOINT}/${DB_NAME}?sslmode=require" \
  --from-literal=REDIS_URL="redis://${REDIS_ENDPOINT}:6379" \
  --from-literal=JWT_SECRET="${JWT_SECRET}" \
  --from-literal=SESSION_SECRET="${SESSION_SECRET}" \
  --from-literal=ENCRYPTION_KEY="${ENCRYPTION_KEY}" \
  --from-literal=NODE_ENV="staging"

# Verify secret creation
kubectl get secret accubooks-secrets -n accubooks-staging
```

**Production Secrets:**
```bash
# Switch to production context
kubectl config use-context accubooks-production

# Create namespace
kubectl create namespace accubooks-prod

# Extract database credentials from Terraform outputs
DB_ENDPOINT=$(jq -r '.database_endpoint.value' production-outputs.json)
DB_NAME=$(jq -r '.database_name.value' production-outputs.json)
DB_USERNAME=$(jq -r '.database_username.value' production-outputs.json)
DB_PASSWORD=$(jq -r '.database_password.value' production-outputs.json)
REDIS_ENDPOINT=$(jq -r '.redis_endpoint.value' production-outputs.json)

# Generate NEW secrets for production (DO NOT reuse staging secrets)
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Create Kubernetes secret
kubectl create secret generic accubooks-secrets \
  --namespace=accubooks-prod \
  --from-literal=DATABASE_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_ENDPOINT}/${DB_NAME}?sslmode=require" \
  --from-literal=REDIS_URL="redis://${REDIS_ENDPOINT}:6379" \
  --from-literal=JWT_SECRET="${JWT_SECRET}" \
  --from-literal=SESSION_SECRET="${SESSION_SECRET}" \
  --from-literal=ENCRYPTION_KEY="${ENCRYPTION_KEY}" \
  --from-literal=NODE_ENV="production"

# Verify secret creation
kubectl get secret accubooks-secrets -n accubooks-prod
```

### Step 5: Build and Push Docker Images

```bash
# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com"

# Create ECR repository
aws ecr create-repository --repository-name accubooks --region us-east-1 || true

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin ${ECR_REGISTRY}

# Build staging image
docker build \
  --platform linux/amd64 \
  --build-arg NODE_ENV=staging \
  -t accubooks/accubooks:staging-latest \
  -f Dockerfile \
  .

# Tag and push staging
docker tag accubooks/accubooks:staging-latest ${ECR_REGISTRY}/accubooks:staging-latest
docker push ${ECR_REGISTRY}/accubooks:staging-latest

# Build production image
docker build \
  --platform linux/amd64 \
  --build-arg NODE_ENV=production \
  -t accubooks/accubooks:prod-latest \
  -f Dockerfile \
  .

# Tag and push production
docker tag accubooks/accubooks:prod-latest ${ECR_REGISTRY}/accubooks:prod-latest
docker push ${ECR_REGISTRY}/accubooks:prod-latest

# Verify images
aws ecr describe-images --repository-name accubooks --region us-east-1
```

**Expected Duration:** 15-20 minutes

### Step 6: Install cert-manager

**Staging:**
```bash
kubectl config use-context accubooks-staging

# Add Jetstack Helm repository
helm repo add jetstack https://charts.jetstack.io
helm repo update

# Install cert-manager
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.13.0 \
  --set installCRDs=true \
  --wait

# Verify installation
kubectl get pods -n cert-manager
```

**Production:**
```bash
kubectl config use-context accubooks-production

# Install cert-manager
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.13.0 \
  --set installCRDs=true \
  --wait

# Verify installation
kubectl get pods -n cert-manager
```

### Step 7: Configure DNS

**Manual Steps Required:**

1. Get ingress load balancer addresses:
```bash
# Staging (after deployment in Phase 3)
kubectl get ingress -n accubooks-staging

# Production (after deployment in Phase 4)
kubectl get ingress -n accubooks-prod
```

2. In your DNS provider (Route53, Cloudflare, etc.):
   - Create A record: `staging-api.accubooks.com` → [STAGING_LB_IP]
   - Create A record: `api.accubooks.com` → [PRODUCTION_LB_IP]

3. Verify DNS propagation:
```bash
dig staging-api.accubooks.com
dig api.accubooks.com
```

---

## Phase 3: Staging Deployment

### Step 1: Update Kubernetes Manifests with Image

```bash
# Update staging deployment with ECR image
cd k8s/staging
sed -i "s|image:.*|image: ${ECR_REGISTRY}/accubooks:staging-latest|g" deployment.yaml
```

### Step 2: Apply Database Migrations

```bash
kubectl config use-context accubooks-staging

# Get database URL from secret
DB_URL=$(kubectl get secret accubooks-secrets \
  -n accubooks-staging \
  -o jsonpath='{.data.DATABASE_URL}' | base64 -d)

# Run migrations
cd ../..
DATABASE_URL="${DB_URL}" npm run migrate:production
```

**Expected Duration:** 2-5 minutes

**Validation:**
```bash
# Verify tables created
psql "${DB_URL}" -c "\dt"

# Verify idempotent_write_audit_log table exists
psql "${DB_URL}" -c "\d idempotent_write_audit_log"
```

### Step 3: Deploy Staging Workload

```bash
kubectl config use-context accubooks-staging

# Apply deployment
kubectl apply -f k8s/staging/deployment.yaml

# Wait for rollout
kubectl rollout status deployment/accubooks-api -n accubooks-staging --timeout=10m

# Verify pods are running
kubectl get pods -n accubooks-staging

# Check logs
kubectl logs -l app=accubooks-api -n accubooks-staging --tail=100
```

**Expected Duration:** 5-10 minutes

### Step 4: Deploy Prometheus Monitoring

```bash
kubectl config use-context accubooks-staging

# Apply Prometheus config
kubectl apply -f prometheus-staging.yml -n accubooks-staging

# Verify Prometheus is running
kubectl get pods -l app=prometheus -n accubooks-staging
```

### Step 5: Run Smoke Tests

```bash
# Wait for ingress to be ready
kubectl wait --for=condition=ready ingress/accubooks-ingress \
  -n accubooks-staging \
  --timeout=5m

# Get staging URL
STAGING_URL=$(kubectl get ingress accubooks-ingress \
  -n accubooks-staging \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Test health endpoint
curl -f https://staging-api.accubooks.com/health

# Run automated smoke tests
npm run test:smoke:staging
```

**Expected Duration:** 5-10 minutes

### Step 6: Validate Staging Deployment

**Checklist:**
- [ ] API responds at https://staging-api.accubooks.com/health
- [ ] Metrics endpoint accessible at https://staging-api.accubooks.com/metrics
- [ ] Error rate < 1%
- [ ] No duplicate writes detected
- [ ] Latency < 500ms (P95)
- [ ] All 29 idempotent operations functional
- [ ] Prometheus metrics visible
- [ ] Alerts configured

**Validation Commands:**
```bash
# Check API health
curl -f https://staging-api.accubooks.com/health | jq

# Check metrics
curl -f https://staging-api.accubooks.com/metrics | grep idempotent_write

# Check pod health
kubectl get pods -n accubooks-staging
kubectl top pods -n accubooks-staging

# Check logs for errors
kubectl logs -l app=accubooks-api -n accubooks-staging --tail=500 | grep -i error

# Monitor for 30 minutes
watch -n 10 'kubectl get pods -n accubooks-staging'
```

**Decision Point:** Only proceed to production if staging is stable for at least 1 hour with no errors.

---

## Phase 4: Production Deployment (Blue-Green)

### Step 1: Update Production Manifests

```bash
# Update production deployment with ECR image
cd k8s/production
sed -i "s|image:.*|image: ${ECR_REGISTRY}/accubooks:prod-latest|g" deployment-green.yaml
```

### Step 2: Apply Database Migrations to Production

```bash
kubectl config use-context accubooks-production

# Get database URL from secret
DB_URL=$(kubectl get secret accubooks-secrets \
  -n accubooks-prod \
  -o jsonpath='{.data.DATABASE_URL}' | base64 -d)

# IMPORTANT: Backup database first
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
aws rds create-db-snapshot \
  --db-instance-identifier accubooks-production-db \
  --db-snapshot-identifier accubooks-prod-pre-migration-${TIMESTAMP}

# Wait for snapshot to complete
aws rds wait db-snapshot-completed \
  --db-snapshot-identifier accubooks-prod-pre-migration-${TIMESTAMP}

# Run migrations
cd ../..
DATABASE_URL="${DB_URL}" npm run migrate:production
```

**Expected Duration:** 5-10 minutes

### Step 3: Deploy Green Environment

```bash
kubectl config use-context accubooks-production

# Apply green deployment
kubectl apply -f k8s/production/deployment-green.yaml

# Wait for rollout
kubectl rollout status deployment/accubooks-api-green -n accubooks-prod --timeout=10m

# Verify pods are running
kubectl get pods -l version=green -n accubooks-prod

# Check logs
kubectl logs -l version=green -n accubooks-prod --tail=100
```

**Expected Duration:** 5-10 minutes

### Step 4: Run Production Smoke Tests

```bash
# Test green environment directly (before traffic shift)
kubectl port-forward -n accubooks-prod \
  deployment/accubooks-api-green 8080:5000 &

# Test locally
curl -f http://localhost:8080/health

# Run smoke tests
npm run test:smoke:production

# Stop port-forward
kill %1
```

### Step 5: Gradual Traffic Shift

**10% Traffic Shift:**
```bash
# Update service to send 10% traffic to green
kubectl patch service accubooks-api -n accubooks-prod --type='json' \
  -p='[{"op": "add", "path": "/spec/selector/version", "value": "green"}]'

# Monitor for 30 minutes
echo "Monitoring 10% traffic shift..."
sleep 1800

# Check metrics
kubectl logs -l version=green -n accubooks-prod --tail=500 | grep -i error
kubectl top pods -l version=green -n accubooks-prod

# Verify no duplicates
psql "${DB_URL}" -c "SELECT COUNT(*) FROM idempotent_write_audit_log WHERE status = 'duplicate' AND created_at > NOW() - INTERVAL '30 minutes';"
```

**Decision Point:** If error rate > 5% or duplicates detected, ROLLBACK immediately.

**25% Traffic Shift:**
```bash
# Continue if 10% was successful
echo "Shifting to 25% traffic..."

# Monitor for 30 minutes
sleep 1800

# Check metrics again
kubectl logs -l version=green -n accubooks-prod --tail=500 | grep -i error
```

**50% Traffic Shift:**
```bash
echo "Shifting to 50% traffic..."

# Monitor for 30 minutes
sleep 1800

# Check metrics
kubectl logs -l version=green -n accubooks-prod --tail=500 | grep -i error
```

**100% Traffic Shift:**
```bash
echo "Shifting to 100% traffic..."

# Full cutover to green
kubectl patch service accubooks-api -n accubooks-prod --type='json' \
  -p='[{"op": "replace", "path": "/spec/selector/version", "value": "green"}]'

# Monitor for 1 hour
echo "Monitoring full cutover..."
sleep 3600

# Final validation
kubectl logs -l version=green -n accubooks-prod --tail=1000 | grep -i error
```

**Total Expected Duration:** 3-4 hours (including monitoring periods)

### Step 6: Rollback Procedure (If Needed)

**Automatic Rollback Triggers:**
- Error rate > 5%
- Any duplicate write detected
- P95 latency > 2x baseline
- Critical alert > 15 minutes

**Rollback Command:**
```bash
# Immediately switch back to blue
kubectl patch service accubooks-api -n accubooks-prod --type='json' \
  -p='[{"op": "replace", "path": "/spec/selector/version", "value": "blue"}]'

# Verify rollback
kubectl get pods -l version=blue -n accubooks-prod

# Check logs
kubectl logs -l version=blue -n accubooks-prod --tail=100
```

---

## Phase 5: Post-Launch Verification

### Final Validation Checklist

- [ ] Production API live at https://api.accubooks.com
- [ ] Health endpoint responding: https://api.accubooks.com/health
- [ ] Metrics endpoint accessible: https://api.accubooks.com/metrics
- [ ] All 29 idempotent operations functional
- [ ] Zero duplicates in production
- [ ] Error rate < 1%
- [ ] P95 latency < 500ms
- [ ] Prometheus monitoring operational
- [ ] Alerts configured and non-noisy
- [ ] Logs retained and searchable
- [ ] Database backups running
- [ ] SSL certificates valid
- [ ] DNS resolving correctly

### Validation Commands

```bash
# API health
curl -f https://api.accubooks.com/health | jq

# Metrics
curl -f https://api.accubooks.com/metrics | grep idempotent_write

# Check for duplicates
psql "${DB_URL}" -c "SELECT COUNT(*) FROM idempotent_write_audit_log WHERE status = 'duplicate';"

# Check error rate
kubectl logs -l app=accubooks-api -n accubooks-prod --tail=5000 | \
  grep -c ERROR

# Check latency
kubectl logs -l app=accubooks-api -n accubooks-prod --tail=1000 | \
  grep "request_duration" | \
  awk '{print $NF}' | \
  sort -n | \
  tail -n 50

# Verify all pods healthy
kubectl get pods -n accubooks-prod

# Check resource usage
kubectl top pods -n accubooks-prod
kubectl top nodes
```

### Monitoring Setup

**Prometheus Queries:**
```promql
# Idempotent write success rate
rate(idempotent_write_total{status="success"}[5m])

# Duplicate detection rate (should be 0)
rate(idempotent_write_total{status="duplicate"}[5m])

# Error rate
rate(idempotent_write_total{status="error"}[5m])

# P95 latency
histogram_quantile(0.95, rate(idempotent_write_duration_bucket[5m]))
```

### Success Criteria

Deployment is **COMPLETE** when:
1. ✅ Production is live and stable
2. ✅ No manual intervention required
3. ✅ Zero duplicates detected
4. ✅ Error rate < 1%
5. ✅ Latency within acceptable range
6. ✅ Observability confirms correctness
7. ✅ System stable under real traffic for 24 hours
8. ✅ Rollback plan validated and documented

---

## Troubleshooting

### Common Issues

**Issue: Pods not starting**
```bash
# Check pod status
kubectl describe pod <pod-name> -n <namespace>

# Check logs
kubectl logs <pod-name> -n <namespace>

# Check events
kubectl get events -n <namespace> --sort-by='.lastTimestamp'
```

**Issue: Database connection failures**
```bash
# Verify secret
kubectl get secret accubooks-secrets -n <namespace> -o yaml

# Test database connectivity from pod
kubectl exec -it <pod-name> -n <namespace> -- \
  psql "${DATABASE_URL}" -c "SELECT 1;"
```

**Issue: High error rate**
```bash
# Check application logs
kubectl logs -l app=accubooks-api -n <namespace> --tail=500

# Check for specific errors
kubectl logs -l app=accubooks-api -n <namespace> | grep -A 5 ERROR

# Scale down if needed
kubectl scale deployment accubooks-api --replicas=1 -n <namespace>
```

**Issue: SSL certificate not issuing**
```bash
# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager

# Check certificate status
kubectl describe certificate -n <namespace>

# Check challenge status
kubectl describe challenge -n <namespace>
```

---

## Rollback Procedures

### Complete Rollback to Previous Version

```bash
# Switch service to blue (previous version)
kubectl patch service accubooks-api -n accubooks-prod --type='json' \
  -p='[{"op": "replace", "path": "/spec/selector/version", "value": "blue"}]'

# Scale down green deployment
kubectl scale deployment accubooks-api-green --replicas=0 -n accubooks-prod

# Verify blue is handling traffic
kubectl get pods -l version=blue -n accubooks-prod
kubectl logs -l version=blue -n accubooks-prod --tail=100
```

### Database Rollback

```bash
# Restore from snapshot (if migrations need to be reverted)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier accubooks-production-db-restored \
  --db-snapshot-identifier accubooks-prod-pre-migration-${TIMESTAMP}

# Update DATABASE_URL secret to point to restored instance
```

---

## Post-Deployment Tasks

- [ ] Update documentation with actual URLs and endpoints
- [ ] Configure monitoring alerts in PagerDuty/Opsgenie
- [ ] Set up log aggregation (CloudWatch/ELK)
- [ ] Schedule regular database backups
- [ ] Document incident response procedures
- [ ] Train team on monitoring dashboards
- [ ] Set up cost monitoring and alerts
- [ ] Configure auto-scaling policies
- [ ] Implement disaster recovery drills
- [ ] Update runbook with lessons learned

---

## Contact Information

**On-Call Rotation:** [Configure PagerDuty]  
**Slack Channel:** #accubooks-production  
**Incident Response:** [Document procedure]

---

**Deployment Status:** Ready for Execution  
**Next Action:** Execute Phase 2 infrastructure provisioning

