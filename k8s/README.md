# Kubernetes Deployment for AccuBooks/ChronaWorkflow

## Overview

This directory contains Kubernetes manifests for deploying AccuBooks/ChronaWorkflow to AWS EKS.

## Files

- `namespace.yaml` - Creates the accubooks-prod namespace
- `configmap.yaml` - Environment configuration
- `serviceaccount.yaml` - Service account with IRSA for AWS access
- `backend-deployment.yaml` - Backend Express.js deployment
- `backend-service.yaml` - Backend ClusterIP service (internal only)
- `frontend-deployment.yaml` - Frontend Nginx deployment
- `frontend-service.yaml` - Frontend LoadBalancer service (public)

## Automated Deployment

Deployment is fully automated via GitHub Actions. Push to `main` branch triggers:

1. Docker image builds (backend + frontend)
2. Push to Amazon ECR
3. Secrets sync from AWS Secrets Manager
4. Kubernetes resource deployment
5. Health verification

## Manual Deployment

If needed, deploy manually:

```bash
# Configure kubectl
aws eks update-kubeconfig --name accubooks-production --region ca-central-1

# Apply manifests
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f serviceaccount.yaml

# Create secrets (fetch from AWS Secrets Manager first)
# See GitHub Actions workflow for secret creation logic

# Deploy applications
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml

# Verify deployment
kubectl get pods -n accubooks-prod
kubectl get svc -n accubooks-prod
```

## Architecture

```
Internet → LoadBalancer → Frontend (Nginx) → Backend (Express)
                                                   ↓
                                          RDS + Redis + S3
```

## Security

- Backend runs as non-root user (UID 1001)
- Frontend runs as non-root user (UID 101)
- Secrets managed via AWS Secrets Manager
- IRSA for AWS service access
- Backend not publicly exposed
