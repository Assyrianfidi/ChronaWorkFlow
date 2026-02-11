# AccuBooks Complete Setup Guide

**Date:** February 10, 2026, 6:59 PM PST  
**Purpose:** Final setup after Git cleanup  
**Status:** Ready for execution  

---

## 🎯 QUICK SETUP (10 Minutes)

Follow these steps in order to complete your AccuBooks setup:

---

## STEP 1: Configure AWS Credentials (2 minutes)

### Option A: Interactive Configuration (Recommended)

```bash
aws configure
```

**You'll be prompted for:**
```
AWS Access Key ID [None]: AKIA...
AWS Secret Access Key [None]: ...
Default region name [None]: us-east-1
Default output format [None]: json
```

**Where to find your credentials:**
- AWS Console → IAM → Users → Your User → Security Credentials
- Or use existing credentials from your password manager

### Option B: Manual Configuration

Create/edit `~/.aws/credentials`:
```ini
[default]
aws_access_key_id = AKIA...
aws_secret_access_key = ...
```

Create/edit `~/.aws/config`:
```ini
[default]
region = us-east-1
output = json
```

### Verify AWS Configuration

```bash
# Test AWS credentials
aws sts get-caller-identity

# Expected output:
# {
#     "UserId": "AIDA...",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/your-username"
# }
```

**If this fails:** Your credentials are incorrect or expired.

---

## STEP 2: Initialize Terraform (3 minutes)

```bash
# Navigate to Terraform directory
cd c:\FidiMyProjects2025\Software_Projects\AccuBooks\AccuBooks\infrastructure\terraform

# Initialize Terraform (downloads ~828MB of providers)
terraform init

# Expected output:
# Initializing modules...
# Initializing the backend...
# Initializing provider plugins...
# - Finding hashicorp/aws versions matching "~> 5.0"...
# - Installing hashicorp/aws v5.100.0...
# - Installing hashicorp/kubernetes v2.38.0...
# - Installing hashicorp/helm v2.17.0...
# Terraform has been successfully initialized!
```

**What gets downloaded:**
- AWS provider (~685 MB)
- Kubernetes provider (~54 MB)
- Helm provider (~54 MB)
- Other providers (~35 MB)
- **Total:** ~828 MB

**Storage location:** `.terraform/providers/` (ignored by Git)

---

## STEP 3: Verify Terraform Configuration (2 minutes)

```bash
# Still in infrastructure/terraform directory

# Validate Terraform syntax
terraform validate

# Expected output:
# Success! The configuration is valid.

# List installed providers
terraform providers

# Expected output:
# Providers required by configuration:
# .
# ├── provider[registry.terraform.io/hashicorp/aws] ~> 5.0
# ├── provider[registry.terraform.io/hashicorp/kubernetes] ~> 2.0
# └── provider[registry.terraform.io/hashicorp/helm] ~> 2.0

# Create execution plan (preview changes)
terraform plan

# This will show what infrastructure would be created
# Review carefully before applying
```

**Common Issues:**

**Error: "No configuration files"**
- Make sure you're in `infrastructure/terraform` directory
- Verify `main.tf` exists

**Error: "Invalid credentials"**
- Run `aws sts get-caller-identity` to verify AWS access
- Reconfigure with `aws configure`

**Error: "Module not found"**
- Run `terraform init -upgrade`

---

## STEP 4: Verify Local Application (3 minutes)

### Backend Setup

```bash
# Navigate to backend directory
cd c:\FidiMyProjects2025\Software_Projects\AccuBooks\AccuBooks\backend

# Install dependencies
npm install

# Expected output:
# added XXX packages in XXs

# Verify environment variables
# Make sure .env file exists with required variables

# Start development server
npm run dev

# Expected output:
# Server running on port 5000
# Database connected
# Health endpoint: http://localhost:5000/api/health
```

### Test Backend Health

```bash
# In a new terminal
curl http://localhost:5000/api/health

# Expected output:
# {"status":"healthy","uptime":123}

# Test HEAD request
curl -I http://localhost:5000/api/health

# Expected output:
# HTTP/1.1 200 OK
```

### Frontend Setup (Optional)

```bash
# Navigate to frontend directory
cd c:\FidiMyProjects2025\Software_Projects\AccuBooks\AccuBooks\client

# Install dependencies
npm install

# Start development server
npm run dev

# Expected output:
# Local: http://localhost:5173
```

---

## STEP 5: Deploy to Render (Optional)

If you want to deploy to production:

```bash
# Follow the deployment guide
# See: RENDER_DEPLOYMENT_GUIDE.md

# Quick deploy:
cd c:\FidiMyProjects2025\Software_Projects\AccuBooks\AccuBooks

# Push latest code
git push origin main

# Render will auto-deploy if configured
# Monitor at: https://dashboard.render.com
```

---

## STEP 6: Maintain Repository Hygiene

### What's Protected by .gitignore

```gitignore
# Environment variables
.env
.env.*

# Terraform
.terraform/
*.tfstate
*.tfvars

# Dependencies
node_modules/

# Build outputs
dist/
build/
```

### Best Practices

**✅ DO:**
- Use environment variables for secrets
- Store credentials in AWS Secrets Manager or similar
- Keep `.gitignore` updated
- Run `git status` before committing
- Use `terraform plan` before `terraform apply`

**❌ DON'T:**
- Commit `.env` files
- Commit `terraform.tfvars` with real credentials
- Commit `.terraform/` directory
- Commit `node_modules/`
- Hardcode API keys in code

---

## 🔍 VERIFICATION CHECKLIST

After completing all steps, verify:

### AWS Configuration
- [ ] `aws configure` completed successfully
- [ ] `aws sts get-caller-identity` returns your account info
- [ ] Credentials stored in `~/.aws/credentials`

### Terraform Setup
- [ ] `terraform init` completed without errors
- [ ] `.terraform/` directory exists locally
- [ ] `.terraform/` is NOT in Git (`git status` should not show it)
- [ ] `terraform validate` succeeds
- [ ] `terraform plan` runs without errors

### Local Application
- [ ] Backend dependencies installed (`npm install`)
- [ ] Backend server starts (`npm run dev`)
- [ ] Health endpoint responds (`curl http://localhost:5000/api/health`)
- [ ] Frontend dependencies installed (if applicable)
- [ ] Frontend server starts (if applicable)

### Repository Status
- [ ] `git status` shows clean working tree
- [ ] No large files in repository
- [ ] No secrets in Git history
- [ ] `.gitignore` includes all sensitive files

---

## 🚨 TROUBLESHOOTING

### AWS Configuration Issues

**Problem: "aws: command not found"**
```bash
# Install AWS CLI
# Windows: choco install awscli
# Or download from: https://aws.amazon.com/cli/
```

**Problem: "InvalidClientTokenId"**
```bash
# Verify credentials
aws configure list

# Reconfigure
aws configure
```

**Problem: "ExpiredToken"**
```bash
# Your credentials have expired
# Get new credentials from AWS Console
aws configure
```

### Terraform Issues

**Problem: "terraform: command not found"**
```bash
# Install Terraform
# Windows: choco install terraform
# Or download from: https://www.terraform.io/downloads
```

**Problem: "Failed to download provider"**
```bash
# Check internet connection
# Clear Terraform cache
rm -rf .terraform
terraform init
```

**Problem: "Module not found"**
```bash
# Reinitialize with upgrade
terraform init -upgrade
```

### Application Issues

**Problem: "npm: command not found"**
```bash
# Install Node.js
# Download from: https://nodejs.org/
```

**Problem: "Cannot find module"**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Problem: "Port already in use"**
```bash
# Find process using port
netstat -ano | findstr :5000

# Kill process
taskkill /PID <PID> /F

# Or use different port
PORT=5001 npm run dev
```

**Problem: "Database connection failed"**
```bash
# Verify DATABASE_URL in .env
# Check database is running
# Test connection manually
```

---

## 📊 EXPECTED RESULTS

### After AWS Configuration

```bash
$ aws sts get-caller-identity
{
    "UserId": "AIDAXXXXXXXXXXXXXXXXX",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/your-username"
}
```

### After Terraform Init

```bash
$ terraform init
Initializing modules...
Initializing the backend...
Initializing provider plugins...
- Finding hashicorp/aws versions matching "~> 5.0"...
- Installing hashicorp/aws v5.100.0...
- Installing hashicorp/kubernetes v2.38.0...
- Installing hashicorp/helm v2.17.0...

Terraform has been successfully initialized!
```

### After Terraform Plan

```bash
$ terraform plan
Terraform will perform the following actions:

  # aws_eks_cluster.main will be created
  + resource "aws_eks_cluster" "main" {
      + arn                   = (known after apply)
      + name                  = "accubooks-cluster"
      ...
    }

Plan: 25 to add, 0 to change, 0 to destroy.
```

### After Backend Start

```bash
$ npm run dev
Server running on port 5000
Database connected successfully
Health endpoint: http://localhost:5000/api/health
Monitoring: Sentry initialized
Alerts: Email and Slack configured
```

### After Health Check

```bash
$ curl http://localhost:5000/api/health
{"status":"healthy","uptime":123}

$ curl -I http://localhost:5000/api/health
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 40
```

---

## 🎯 SUCCESS CRITERIA

Your setup is complete when:

✅ **AWS Configured**
- AWS CLI installed and working
- Credentials configured
- `aws sts get-caller-identity` succeeds

✅ **Terraform Ready**
- Terraform installed
- Providers downloaded (~828 MB)
- `terraform plan` runs successfully
- `.terraform/` not in Git

✅ **Application Running**
- Backend server starts
- Health endpoints respond
- Database connected
- No errors in console

✅ **Repository Clean**
- No large files committed
- No secrets in Git
- `.gitignore` protecting sensitive files
- Working tree clean

---

## 📞 NEXT STEPS

### For Development

```bash
# Start backend
cd backend
npm run dev

# Start frontend (in new terminal)
cd client
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### For Infrastructure

```bash
# Preview infrastructure changes
cd infrastructure/terraform
terraform plan

# Apply infrastructure (with approval)
terraform apply

# Destroy infrastructure (when done)
terraform destroy
```

### For Deployment

```bash
# Deploy to Render
git push origin main
# Monitor at: https://dashboard.render.com

# Or use Render CLI
render deploy service <service-id>
```

---

## 📚 DOCUMENTATION REFERENCE

- **RENDER_DEPLOYMENT_GUIDE.md** - Render deployment instructions
- **TERRAFORM_SETUP_GUIDE.md** - Detailed Terraform setup
- **POST_CLEANUP_VERIFICATION.md** - Verification checklist
- **INFRASTRUCTURE_VERIFICATION.md** - Infrastructure requirements
- **FINAL_LAUNCH_CERTIFICATION_100.md** - Launch certification

---

## ✅ FINAL CHECKLIST

Before you start development:

- [ ] AWS credentials configured and tested
- [ ] Terraform initialized and validated
- [ ] Backend running locally
- [ ] Health endpoints responding
- [ ] Environment variables configured
- [ ] Database connected
- [ ] No Git warnings or errors
- [ ] Documentation reviewed

**Estimated Setup Time:** 10-15 minutes

**You're ready to develop!** 🚀

---

**Setup Guide Version:** 1.0  
**Last Updated:** February 10, 2026  
**Status:** Ready for execution  
