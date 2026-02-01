#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Master deployment script for AccuBooks/ChronaWorkflow to AWS EKS
.DESCRIPTION
    Complete autonomous deployment with zero manual intervention
#>

param(
    [switch]$SkipBuild = $false
)

$ErrorActionPreference = "Stop"

Write-Host @"
╔════════════════════════════════════════════════════════════╗
║   AccuBooks/ChronaWorkflow Production Deployment          ║
║   AWS EKS - ca-central-1                                  ║
╚════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# Configuration
$AWSRegion = "ca-central-1"
$AWSAccountId = "971551576768"
$ClusterName = "accubooks-production"
$Namespace = "accubooks-prod"

# Step 1: Setup Kubernetes Secrets
Write-Host "`n[Step 1/2] Setting up Kubernetes secrets..." -ForegroundColor Yellow
& ".\k8s-secrets-setup.ps1" -AWSRegion $AWSRegion -Namespace $Namespace
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Secrets setup failed" -ForegroundColor Red
    exit 1
}

# Step 2: Deploy Application
Write-Host "`n[Step 2/2] Deploying application..." -ForegroundColor Yellow
if ($SkipBuild) {
    Write-Host "⚠ Skipping Docker build (using existing images)" -ForegroundColor Yellow
}
& ".\deploy-to-eks.ps1" -AWSRegion $AWSRegion -AWSAccountId $AWSAccountId -ClusterName $ClusterName -Namespace $Namespace
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   DEPLOYMENT SUCCESSFUL                                    ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
