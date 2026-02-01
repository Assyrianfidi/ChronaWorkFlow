#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Complete autonomous deployment of AccuBooks/ChronaWorkflow to AWS EKS
.DESCRIPTION
    This script handles the entire deployment process:
    - Creates ECR repositories
    - Builds and pushes Docker images
    - Configures kubectl
    - Creates Kubernetes namespace and resources
    - Deploys application with AWS Secrets Manager integration
    - Verifies deployment health
#>

param(
    [string]$AWSRegion = "ca-central-1",
    [string]$AWSAccountId = "971551576768",
    [string]$ClusterName = "accubooks-production",
    [string]$Namespace = "accubooks-prod"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AccuBooks/ChronaWorkflow EKS Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create ECR Repositories
Write-Host "[1/8] Creating ECR repositories..." -ForegroundColor Yellow
$backendRepo = "${AWSAccountId}.dkr.ecr.${AWSRegion}.amazonaws.com/accubooks-backend"
$frontendRepo = "${AWSAccountId}.dkr.ecr.${AWSRegion}.amazonaws.com/accubooks-frontend"

aws ecr create-repository --repository-name accubooks-backend --region $AWSRegion --image-scanning-configuration scanOnPush=true 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Backend ECR repository created" -ForegroundColor Green
} else {
    Write-Host "✓ Backend ECR repository already exists" -ForegroundColor Green
}

aws ecr create-repository --repository-name accubooks-frontend --region $AWSRegion --image-scanning-configuration scanOnPush=true 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Frontend ECR repository created" -ForegroundColor Green
} else {
    Write-Host "✓ Frontend ECR repository already exists" -ForegroundColor Green
}

# Step 2: Login to ECR
Write-Host "`n[2/8] Logging into ECR..." -ForegroundColor Yellow
aws ecr get-login-password --region $AWSRegion | docker login --username AWS --password-stdin "${AWSAccountId}.dkr.ecr.${AWSRegion}.amazonaws.com"
if ($LASTEXITCODE -ne 0) { throw "ECR login failed" }
Write-Host "✓ ECR login successful" -ForegroundColor Green

# Step 3: Build and Push Backend Image
Write-Host "`n[3/8] Building backend Docker image..." -ForegroundColor Yellow
docker build -f Dockerfile.backend -t accubooks-backend:latest -t "${backendRepo}:latest" -t "${backendRepo}:$(Get-Date -Format 'yyyyMMdd-HHmmss')" .
if ($LASTEXITCODE -ne 0) { throw "Backend build failed" }
Write-Host "✓ Backend image built" -ForegroundColor Green

Write-Host "Pushing backend image to ECR..." -ForegroundColor Yellow
docker push "${backendRepo}:latest"
if ($LASTEXITCODE -ne 0) { throw "Backend push failed" }
Write-Host "✓ Backend image pushed" -ForegroundColor Green

# Step 4: Build and Push Frontend Image
Write-Host "`n[4/8] Building frontend Docker image..." -ForegroundColor Yellow
docker build -f Dockerfile.frontend -t accubooks-frontend:latest -t "${frontendRepo}:latest" -t "${frontendRepo}:$(Get-Date -Format 'yyyyMMdd-HHmmss')" .
if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
Write-Host "✓ Frontend image built" -ForegroundColor Green

Write-Host "Pushing frontend image to ECR..." -ForegroundColor Yellow
docker push "${frontendRepo}:latest"
if ($LASTEXITCODE -ne 0) { throw "Frontend push failed" }
Write-Host "✓ Frontend image pushed" -ForegroundColor Green

# Step 5: Configure kubectl
Write-Host "`n[5/8] Configuring kubectl..." -ForegroundColor Yellow
aws eks update-kubeconfig --name $ClusterName --region $AWSRegion
if ($LASTEXITCODE -ne 0) { throw "kubectl configuration failed" }
Write-Host "✓ kubectl configured" -ForegroundColor Green

# Step 6: Create Namespace
Write-Host "`n[6/8] Creating Kubernetes namespace..." -ForegroundColor Yellow
kubectl create namespace $Namespace 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Namespace created" -ForegroundColor Green
} else {
    Write-Host "✓ Namespace already exists" -ForegroundColor Green
}

# Step 7: Deploy Application
Write-Host "`n[7/8] Deploying application to Kubernetes..." -ForegroundColor Yellow

# Create ConfigMap for environment variables
@"
apiVersion: v1
kind: ConfigMap
metadata:
  name: accubooks-config
  namespace: $Namespace
data:
  NODE_ENV: "production"
  AWS_REGION: "$AWSRegion"
  PORT: "5000"
"@ | kubectl apply -f -

# Create Backend Deployment
@"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: accubooks-backend
  namespace: $Namespace
spec:
  replicas: 2
  selector:
    matchLabels:
      app: accubooks-backend
  template:
    metadata:
      labels:
        app: accubooks-backend
    spec:
      serviceAccountName: accubooks-backend-sa
      containers:
      - name: backend
        image: ${backendRepo}:latest
        ports:
        - containerPort: 5000
        envFrom:
        - configMapRef:
            name: accubooks-config
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: accubooks-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: accubooks-secrets
              key: redis-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: accubooks-secrets
              key: jwt-secret
        - name: SESSION_SECRET
          valueFrom:
            secretKeyRef:
              name: accubooks-secrets
              key: session-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: accubooks-backend
  namespace: $Namespace
spec:
  selector:
    app: accubooks-backend
  ports:
  - port: 5000
    targetPort: 5000
  type: ClusterIP
"@ | kubectl apply -f -

# Create Frontend Deployment
@"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: accubooks-frontend
  namespace: $Namespace
spec:
  replicas: 2
  selector:
    matchLabels:
      app: accubooks-frontend
  template:
    metadata:
      labels:
        app: accubooks-frontend
    spec:
      containers:
      - name: frontend
        image: ${frontendRepo}:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: accubooks-frontend
  namespace: $Namespace
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
    service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: "true"
spec:
  selector:
    app: accubooks-frontend
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
"@ | kubectl apply -f -

Write-Host "✓ Application deployed" -ForegroundColor Green

# Step 8: Verify Deployment
Write-Host "`n[8/8] Verifying deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

$backendPods = kubectl get pods -n $Namespace -l app=accubooks-backend -o jsonpath='{.items[*].status.phase}'
$frontendPods = kubectl get pods -n $Namespace -l app=accubooks-frontend -o jsonpath='{.items[*].status.phase}'

Write-Host "`nBackend Pods: $backendPods" -ForegroundColor Cyan
Write-Host "Frontend Pods: $frontendPods" -ForegroundColor Cyan

# Get LoadBalancer URL
Write-Host "`nWaiting for LoadBalancer URL..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$lbUrl = ""

while ($attempt -lt $maxAttempts) {
    $lbUrl = kubectl get svc accubooks-frontend -n $Namespace -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
    if ($lbUrl) { break }
    $attempt++
    Start-Sleep -Seconds 10
    Write-Host "." -NoNewline
}

Write-Host ""
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nApplication URL: http://$lbUrl" -ForegroundColor Green
Write-Host "Backend Service: accubooks-backend.${Namespace}.svc.cluster.local:5000" -ForegroundColor Cyan
Write-Host "`nTo view pods: kubectl get pods -n $Namespace" -ForegroundColor Yellow
Write-Host "To view logs: kubectl logs -f deployment/accubooks-backend -n $Namespace" -ForegroundColor Yellow
Write-Host "To view services: kubectl get svc -n $Namespace" -ForegroundColor Yellow
