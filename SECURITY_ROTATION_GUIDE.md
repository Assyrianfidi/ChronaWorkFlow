# AWS Access Key Rotation Guide - CRITICAL SECURITY ACTION REQUIRED

## ⚠️ IMMEDIATE ACTION REQUIRED

The AWS access key `AKIA6ENH4SLAEVZO3HHJ` has been **DEACTIVATED** but not yet deleted due to authentication requirements.

## Current Status

- **Exposed Key:** `AKIA6ENH4SLAEVZO3HHJ` - **STATUS: INACTIVE**
- **Alternate Key:** `AKIA6ENH4SLAAWOKNY3J` - **STATUS: ACTIVE** (created 2026-01-31)
- **IAM User:** `Chronaworkflow`
- **AWS Account:** `971551576768`

## Manual Rotation Steps Required

### Step 1: Obtain Secret Key for Alternate Access Key

You need the secret access key for `AKIA6ENH4SLAAWOKNY3J`. If you don't have it:

1. Log into AWS Console as root or admin user
2. Navigate to IAM → Users → Chronaworkflow
3. Security Credentials tab
4. If secret key is lost, delete `AKIA6ENH4SLAAWOKNY3J` and create a new access key
5. **SAVE THE SECRET KEY IMMEDIATELY** - it's only shown once

### Step 2: Update Local Scripts

Update the following files with the new credentials:

#### File: `deploy-final.ps1`
```powershell
$env:AWS_ACCESS_KEY_ID = "AKIA6ENH4SLAAWOKNY3J"  # NEW KEY
$env:AWS_SECRET_ACCESS_KEY = "YOUR_NEW_SECRET_KEY_HERE"
```

#### File: `push-to-ecr.bat`
```batch
set AWS_ACCESS_KEY_ID=AKIA6ENH4SLAAWOKNY3J
set AWS_SECRET_ACCESS_KEY=YOUR_NEW_SECRET_KEY_HERE
```

### Step 3: Update GitHub Repository Secrets

1. Go to: https://github.com/Assyrianfidi/ChronaWorkFlow/settings/secrets/actions
2. Update or create these secrets:
   - `AWS_ACCESS_KEY_ID`: `AKIA6ENH4SLAAWOKNY3J`
   - `AWS_SECRET_ACCESS_KEY`: `YOUR_NEW_SECRET_KEY_HERE`
   - `AWS_REGION`: `ca-central-1`
   - `AWS_ACCOUNT_ID`: `971551576768`

### Step 4: Delete the Exposed Key

Once all scripts and GitHub secrets are updated:

```powershell
$env:AWS_ACCESS_KEY_ID = "AKIA6ENH4SLAAWOKNY3J"
$env:AWS_SECRET_ACCESS_KEY = "YOUR_NEW_SECRET_KEY_HERE"
$env:AWS_DEFAULT_REGION = "ca-central-1"

# Delete the old exposed key
aws iam delete-access-key --user-name Chronaworkflow --access-key-id AKIA6ENH4SLAEVZO3HHJ

# Verify only one key remains
aws iam list-access-keys --user-name Chronaworkflow
```

### Step 5: Test New Credentials

```powershell
# Test AWS CLI
aws sts get-caller-identity

# Test kubectl
aws eks update-kubeconfig --name accubooks-production --region ca-central-1
kubectl get pods -n accubooks-prod

# Test ECR login
aws ecr get-login-password --region ca-central-1 | docker login --username AWS --password-stdin 971551576768.dkr.ecr.ca-central-1.amazonaws.com
```

## Security Best Practices

1. **Never commit credentials to Git** - Use environment variables or secrets management
2. **Rotate keys every 90 days** - Set a calendar reminder
3. **Use IAM roles instead of access keys** where possible (EC2, Lambda, ECS)
4. **Enable MFA** on the IAM user account
5. **Monitor CloudTrail** for unauthorized API calls
6. **Use AWS Secrets Manager** for application secrets

## Files That Need Updates

- [ ] `deploy-final.ps1`
- [ ] `push-to-ecr.bat`
- [ ] GitHub Actions secrets
- [ ] Any local `.env` files (if they exist)
- [ ] Team documentation with new key ID (not secret!)

## Verification Checklist

- [ ] New credentials work with AWS CLI
- [ ] kubectl can access EKS cluster
- [ ] Docker can push to ECR
- [ ] GitHub Actions workflow runs successfully
- [ ] Old key `AKIA6ENH4SLAEVZO3HHJ` is deleted
- [ ] Only one active access key exists for user

## Emergency Contact

If you lose access to AWS:
1. Use root account credentials
2. Reset IAM user password
3. Create new access key via console
4. Update all references immediately

---

**Created:** 2026-01-31  
**Priority:** CRITICAL  
**Deadline:** Complete within 24 hours
