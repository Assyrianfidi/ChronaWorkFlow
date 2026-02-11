# Terraform Setup Guide - AccuBooks Infrastructure

**Date:** February 10, 2026  
**Purpose:** Configure Terraform after Git cleanup removed provider binaries  

---

## 🎯 QUICK START

After the Git cleanup, Terraform providers were removed from the repository (they were 740MB+). Here's how to restore them:

### Step 1: Configure AWS Credentials

**Option A: AWS CLI (Recommended)**
```bash
# Install AWS CLI if needed
# Download from: https://aws.amazon.com/cli/

# Configure credentials
aws configure

# Enter when prompted:
# AWS Access Key ID: AKIA...
# AWS Secret Access Key: ...
# Default region: us-east-1
# Default output format: json

# Verify configuration
aws sts get-caller-identity
```

**Option B: Environment Variables**
```powershell
# PowerShell
$env:AWS_ACCESS_KEY_ID="AKIA..."
$env:AWS_SECRET_ACCESS_KEY="..."
$env:AWS_DEFAULT_REGION="us-east-1"

# Verify
aws sts get-caller-identity
```

**Option C: Terraform Variables File**
```bash
cd infrastructure/terraform

# Create terraform.tfvars (already in .gitignore)
cat > terraform.tfvars << 'EOF'
aws_access_key = "AKIA..."
aws_secret_key = "..."
aws_region = "us-east-1"
EOF
```

### Step 2: Initialize Terraform

```bash
cd infrastructure/terraform

# Download provider binaries (will be stored in .terraform/)
terraform init

# Expected output:
# Initializing modules...
# Initializing the backend...
# Initializing provider plugins...
# - Finding hashicorp/aws versions matching "~> 5.0"...
# - Installing hashicorp/aws v5.100.0...
# Terraform has been successfully initialized!
```

### Step 3: Verify Providers

```bash
# List installed providers
terraform providers

# Expected output:
# Providers required by configuration:
# .
# ├── provider[registry.terraform.io/hashicorp/aws] ~> 5.0
# ├── provider[registry.terraform.io/hashicorp/kubernetes] ~> 2.0
# └── provider[registry.terraform.io/hashicorp/helm] ~> 2.0
```

### Step 4: Validate Configuration

```bash
# Check Terraform configuration syntax
terraform validate

# Expected output:
# Success! The configuration is valid.
```

### Step 5: Preview Changes

```bash
# See what Terraform would create/modify
terraform plan

# Review the output carefully
# This shows what infrastructure would be created
```

---

## 📁 WHAT'S IN .gitignore

These Terraform files are now excluded from Git:

```gitignore
# Terraform provider binaries (large files)
.terraform/

# Terraform lock file
.terraform.lock.hcl

# Terraform state files (contain sensitive data)
*.tfstate
*.tfstate.*

# Terraform variable files (may contain secrets)
*.tfvars
!terraform.tfvars.example

# Terraform plan files
terraform.tfplan

# Terraform CLI configuration
.terraformrc
terraform.rc
```

**Why?**
- `.terraform/` contains 740MB+ of provider binaries
- `*.tfstate` contains infrastructure state and may have secrets
- `*.tfvars` often contains credentials and API keys

---

## 🔐 SECURE CREDENTIAL MANAGEMENT

### DO NOT Commit These Files

❌ **Never commit:**
- `terraform.tfvars` (contains credentials)
- `.terraform/` (large binaries)
- `*.tfstate` (contains sensitive data)
- Any file with API keys or passwords

✅ **Safe to commit:**
- `*.tf` (Terraform configuration)
- `terraform.tfvars.example` (template without real values)
- `README.md` (documentation)

### Credential Storage Options

**1. AWS CLI Configuration (~/.aws/credentials)**
```ini
[default]
aws_access_key_id = AKIA...
aws_secret_access_key = ...
region = us-east-1
```

**2. Environment Variables**
```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_DEFAULT_REGION="us-east-1"
```

**3. Terraform Variables File (terraform.tfvars)**
```hcl
aws_access_key = "AKIA..."
aws_secret_key = "..."
aws_region = "us-east-1"
```

**4. AWS IAM Roles (Production)**
- Use IAM roles for EC2/ECS/Lambda
- No credentials needed in code
- Most secure option for production

---

## 🚨 TROUBLESHOOTING

### Error: "InvalidClientTokenId"

**Problem:**
```
Error: validating provider credentials
InvalidClientTokenId: The security token included in the request is invalid
```

**Solutions:**
1. Verify AWS credentials are configured:
   ```bash
   aws sts get-caller-identity
   ```

2. Check credentials are not expired:
   ```bash
   aws configure list
   ```

3. Ensure correct AWS profile is selected:
   ```bash
   export AWS_PROFILE=default
   ```

### Error: "terraform: command not found"

**Problem:** Terraform not installed

**Solution:**
```bash
# Windows (using Chocolatey)
choco install terraform

# Or download from:
# https://www.terraform.io/downloads

# Verify installation
terraform version
```

### Error: "Module not found"

**Problem:** Terraform modules not downloaded

**Solution:**
```bash
# Reinitialize to download modules
terraform init -upgrade
```

### Error: "Provider version conflict"

**Problem:** Terraform lock file has different versions

**Solution:**
```bash
# Remove lock file and reinitialize
rm .terraform.lock.hcl
terraform init
```

---

## 📊 PROVIDER DOWNLOAD SIZES

When you run `terraform init`, these providers will be downloaded:

| Provider | Version | Size | Purpose |
|----------|---------|------|---------|
| AWS | 5.100.0 | ~685 MB | AWS infrastructure |
| Kubernetes | 2.38.0 | ~54 MB | K8s cluster management |
| Helm | 2.17.0 | ~54 MB | Helm chart deployment |
| CloudInit | 2.3.7 | ~15 MB | Cloud instance initialization |
| Random | 3.8.1 | ~5 MB | Random resource generation |
| Time | 0.13.1 | ~5 MB | Time-based resources |
| TLS | 4.2.1 | ~10 MB | TLS certificate management |

**Total:** ~828 MB

**Storage Location:** `infrastructure/terraform/.terraform/providers/`

**Note:** These are downloaded once and cached locally. They are NOT committed to Git.

---

## 🔄 TEAM ONBOARDING

When a new team member clones the repository:

### Step 1: Clone Repository
```bash
git clone https://github.com/Assyrianfidi/ChronaWorkFlow.git
cd ChronaWorkFlow
```

### Step 2: Configure AWS Credentials
```bash
# Use AWS CLI
aws configure

# Or set environment variables
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
```

### Step 3: Initialize Terraform
```bash
cd infrastructure/terraform
terraform init
```

### Step 4: Verify Setup
```bash
terraform validate
terraform plan
```

**Time Required:** ~5 minutes (plus download time for providers)

---

## 🎯 BEST PRACTICES

### 1. Never Commit Secrets
```bash
# Always verify before committing
git status
git diff

# Check for secrets
grep -r "AKIA" .
grep -r "aws_secret" .
```

### 2. Use .gitignore
```bash
# Verify .gitignore is working
git check-ignore .terraform/
# Should output: .terraform/

git check-ignore terraform.tfvars
# Should output: terraform.tfvars
```

### 3. Keep Providers Updated
```bash
# Update provider versions
terraform init -upgrade

# Review changes
terraform plan
```

### 4. Use Remote State (Production)
```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket = "accubooks-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
  }
}
```

### 5. Use Workspaces
```bash
# Create workspace for each environment
terraform workspace new development
terraform workspace new staging
terraform workspace new production

# Switch workspaces
terraform workspace select production
```

---

## ✅ VERIFICATION CHECKLIST

After setup, verify:

- [ ] AWS credentials configured
- [ ] `aws sts get-caller-identity` succeeds
- [ ] `terraform version` shows installed version
- [ ] `terraform init` completes successfully
- [ ] `.terraform/` directory exists locally
- [ ] `.terraform/` is NOT in Git (check with `git status`)
- [ ] `terraform validate` succeeds
- [ ] `terraform plan` runs without errors
- [ ] No secrets in Git history
- [ ] `.gitignore` includes Terraform files

---

## 🚀 DEPLOYMENT WORKFLOW

### Development
```bash
# 1. Make infrastructure changes
vim main.tf

# 2. Validate syntax
terraform validate

# 3. Preview changes
terraform plan

# 4. Apply changes (with approval)
terraform apply

# 5. Verify deployment
terraform show
```

### Production
```bash
# 1. Switch to production workspace
terraform workspace select production

# 2. Review plan carefully
terraform plan -out=production.tfplan

# 3. Get approval from team

# 4. Apply with plan file
terraform apply production.tfplan

# 5. Verify and monitor
terraform show
aws eks describe-cluster --name accubooks-prod
```

---

## 📞 SUPPORT

**Terraform Documentation:**
- https://www.terraform.io/docs

**AWS Provider Documentation:**
- https://registry.terraform.io/providers/hashicorp/aws/latest/docs

**Common Issues:**
- https://github.com/hashicorp/terraform/issues

**Team Contact:**
- DevOps: devops@accubooks.com
- Infrastructure: infrastructure@accubooks.com

---

**Setup Status:** Ready for initialization  
**Next Step:** Configure AWS credentials and run `terraform init`  
**Estimated Time:** 5-10 minutes  

🎉 **Your Terraform setup is ready to go!**
