# GitHub Actions Workflows

## deploy-production.yml

Automated production deployment to AWS EKS.

### Triggers
- Push to `main` branch
- Manual workflow dispatch

### Required Secrets

Configure these in GitHub repository settings → Secrets and variables → Actions:

- `AWS_ACCESS_KEY_ID` - AWS access key with EKS/ECR/Secrets Manager permissions
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key

### Workflow Steps

1. **Checkout** - Clone repository
2. **AWS Auth** - Configure AWS credentials
3. **ECR Login** - Authenticate to Amazon ECR
4. **ECR Repos** - Create repositories if missing
5. **Build Backend** - Build and push backend Docker image
6. **Build Frontend** - Build and push frontend Docker image
7. **Configure kubectl** - Connect to EKS cluster
8. **Create Namespace** - Ensure namespace exists
9. **Sync Secrets** - Fetch from AWS Secrets Manager v2 and create K8s secrets
10. **Deploy** - Apply Kubernetes manifests
11. **Rollout** - Wait for deployments to complete
12. **Get URL** - Retrieve LoadBalancer DNS
13. **Verify** - Display deployment status

### Outputs

The workflow outputs:
- ✅ Deployment status
- 🌐 Public application URL
- 📦 Docker image tags
- ☸️ Cluster information
- 🕒 Deployment timestamp

### Monitoring

View workflow runs at:
https://github.com/Assyrianfidi/ChronaWorkFlow/actions
