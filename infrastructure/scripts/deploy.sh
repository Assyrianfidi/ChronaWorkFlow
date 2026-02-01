#!/bin/bash
# AccuBooks Production Deployment Script
# This script orchestrates the complete deployment from infrastructure to production

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TERRAFORM_DIR="$PROJECT_ROOT/infrastructure/terraform"
K8S_DIR="$PROJECT_ROOT/k8s"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_tools=()
    
    command -v terraform >/dev/null 2>&1 || missing_tools+=("terraform")
    command -v kubectl >/dev/null 2>&1 || missing_tools+=("kubectl")
    command -v aws >/dev/null 2>&1 || missing_tools+=("aws")
    command -v docker >/dev/null 2>&1 || missing_tools+=("docker")
    command -v helm >/dev/null 2>&1 || missing_tools+=("helm")
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_error "Please install missing tools and try again"
        exit 1
    fi
    
    log_success "All prerequisites met"
}

provision_infrastructure() {
    local env=$1
    log_info "Provisioning $env infrastructure with Terraform..."
    
    cd "$TERRAFORM_DIR"
    
    # Initialize Terraform
    log_info "Initializing Terraform..."
    terraform init
    
    # Plan
    log_info "Planning infrastructure changes..."
    terraform plan -var-file="${env}.tfvars" -out="${env}.tfplan"
    
    # Apply
    log_info "Applying infrastructure changes..."
    terraform apply "${env}.tfplan"
    
    # Save outputs
    log_info "Saving Terraform outputs..."
    terraform output -json > "${env}-outputs.json"
    
    log_success "$env infrastructure provisioned"
}

configure_kubectl() {
    local env=$1
    local cluster_name=$2
    
    log_info "Configuring kubectl for $cluster_name..."
    
    aws eks update-kubeconfig \
        --region us-east-1 \
        --name "$cluster_name" \
        --alias "$cluster_name"
    
    kubectl config use-context "$cluster_name"
    
    log_success "kubectl configured for $cluster_name"
}

create_kubernetes_secrets() {
    local env=$1
    local namespace=$2
    
    log_info "Creating Kubernetes secrets for $env..."
    
    # Read Terraform outputs
    local outputs_file="$TERRAFORM_DIR/${env}-outputs.json"
    local db_endpoint=$(jq -r '.database_endpoint.value' "$outputs_file")
    local db_name=$(jq -r '.database_name.value' "$outputs_file")
    local db_username=$(jq -r '.database_username.value' "$outputs_file")
    local db_password=$(jq -r '.database_password.value' "$outputs_file")
    local redis_endpoint=$(jq -r '.redis_endpoint.value' "$outputs_file")
    
    # Generate secrets
    local jwt_secret=$(openssl rand -base64 32)
    local session_secret=$(openssl rand -base64 32)
    local encryption_key=$(openssl rand -base64 32)
    
    # Create namespace if it doesn't exist
    kubectl create namespace "$namespace" --dry-run=client -o yaml | kubectl apply -f -
    
    # Create secret
    kubectl create secret generic accubooks-secrets \
        --namespace="$namespace" \
        --from-literal=DATABASE_URL="postgresql://${db_username}:${db_password}@${db_endpoint}/${db_name}?sslmode=require" \
        --from-literal=REDIS_URL="redis://${redis_endpoint}:6379" \
        --from-literal=JWT_SECRET="$jwt_secret" \
        --from-literal=SESSION_SECRET="$session_secret" \
        --from-literal=ENCRYPTION_KEY="$encryption_key" \
        --from-literal=NODE_ENV="$env" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    log_success "Kubernetes secrets created for $namespace"
}

build_and_push_docker_image() {
    local env=$1
    local tag=$2
    
    log_info "Building Docker image for $env..."
    
    cd "$PROJECT_ROOT"
    
    # Build image
    docker build \
        --platform linux/amd64 \
        --build-arg NODE_ENV="$env" \
        -t "accubooks/accubooks:${tag}" \
        -f Dockerfile \
        .
    
    # Tag for ECR (assuming ECR registry)
    local aws_account_id=$(aws sts get-caller-identity --query Account --output text)
    local ecr_registry="${aws_account_id}.dkr.ecr.us-east-1.amazonaws.com"
    
    # Create ECR repository if it doesn't exist
    aws ecr describe-repositories --repository-names accubooks >/dev/null 2>&1 || \
        aws ecr create-repository --repository-name accubooks
    
    # Login to ECR
    aws ecr get-login-password --region us-east-1 | \
        docker login --username AWS --password-stdin "$ecr_registry"
    
    # Tag and push
    docker tag "accubooks/accubooks:${tag}" "${ecr_registry}/accubooks:${tag}"
    docker push "${ecr_registry}/accubooks:${tag}"
    
    log_success "Docker image pushed: ${ecr_registry}/accubooks:${tag}"
    
    # Return the full image path
    echo "${ecr_registry}/accubooks:${tag}"
}

install_cert_manager() {
    local cluster_name=$1
    
    log_info "Installing cert-manager on $cluster_name..."
    
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
    
    log_success "cert-manager installed"
}

apply_database_migrations() {
    local env=$1
    local namespace=$2
    
    log_info "Applying database migrations for $env..."
    
    cd "$PROJECT_ROOT"
    
    # Get database URL from secret
    local db_url=$(kubectl get secret accubooks-secrets \
        --namespace="$namespace" \
        -o jsonpath='{.data.DATABASE_URL}' | base64 -d)
    
    # Run migrations
    DATABASE_URL="$db_url" npm run migrate:production
    
    log_success "Database migrations applied"
}

deploy_to_kubernetes() {
    local env=$1
    local namespace=$2
    local image=$3
    
    log_info "Deploying to Kubernetes ($env)..."
    
    cd "$K8S_DIR"
    
    # Update image in deployment
    local deployment_file
    if [ "$env" = "staging" ]; then
        deployment_file="staging/deployment.yaml"
    else
        deployment_file="production/deployment-green.yaml"
    fi
    
    # Apply deployment
    kubectl apply -f "$deployment_file" --namespace="$namespace"
    
    # Wait for rollout
    kubectl rollout status deployment/accubooks-api --namespace="$namespace" --timeout=10m
    
    log_success "Deployment complete"
}

run_smoke_tests() {
    local env=$1
    
    log_info "Running smoke tests for $env..."
    
    cd "$PROJECT_ROOT"
    
    if [ "$env" = "staging" ]; then
        npm run test:smoke:staging
    else
        npm run test:smoke:production
    fi
    
    log_success "Smoke tests passed"
}

deploy_prometheus() {
    local env=$1
    local namespace=$2
    
    log_info "Deploying Prometheus monitoring for $env..."
    
    cd "$K8S_DIR"
    
    # Apply Prometheus config
    kubectl apply -f ../prometheus-staging.yml --namespace="$namespace"
    
    log_success "Prometheus monitoring deployed"
}

shift_traffic() {
    local percentage=$1
    local namespace=$2
    
    log_info "Shifting $percentage% traffic to green..."
    
    # Update service selector weights
    kubectl patch service accubooks-api \
        --namespace="$namespace" \
        --type='json' \
        -p="[{'op': 'replace', 'path': '/spec/selector/version', 'value': 'green'}]"
    
    log_success "Traffic shifted to $percentage%"
}

monitor_deployment() {
    local namespace=$1
    local duration=$2
    
    log_info "Monitoring deployment for $duration seconds..."
    
    local end_time=$(($(date +%s) + duration))
    
    while [ $(date +%s) -lt $end_time ]; do
        # Check error rate
        local error_rate=$(kubectl logs -l app=accubooks-api --namespace="$namespace" --tail=100 | grep -c "ERROR" || echo 0)
        
        if [ "$error_rate" -gt 10 ]; then
            log_error "High error rate detected: $error_rate errors"
            return 1
        fi
        
        sleep 10
    done
    
    log_success "Monitoring complete - no issues detected"
    return 0
}

rollback_deployment() {
    local namespace=$1
    
    log_warning "Rolling back deployment..."
    
    kubectl patch service accubooks-api \
        --namespace="$namespace" \
        --type='json' \
        -p="[{'op': 'replace', 'path': '/spec/selector/version', 'value': 'blue'}]"
    
    log_success "Rollback complete"
}

# Main deployment flow
main() {
    log_info "Starting AccuBooks deployment..."
    
    check_prerequisites
    
    # Phase 2: Infrastructure Provisioning
    log_info "=== PHASE 2: INFRASTRUCTURE PROVISIONING ==="
    
    # Staging infrastructure
    provision_infrastructure "staging"
    configure_kubectl "staging" "accubooks-staging"
    create_kubernetes_secrets "staging" "accubooks-staging"
    install_cert_manager "accubooks-staging"
    
    # Production infrastructure
    provision_infrastructure "production"
    configure_kubectl "production" "accubooks-production"
    create_kubernetes_secrets "production" "accubooks-prod"
    install_cert_manager "accubooks-production"
    
    # Build Docker images
    local staging_image=$(build_and_push_docker_image "staging" "staging-latest")
    local prod_image=$(build_and_push_docker_image "production" "prod-latest")
    
    # Phase 3: Staging Deployment
    log_info "=== PHASE 3: STAGING DEPLOYMENT ==="
    
    configure_kubectl "staging" "accubooks-staging"
    apply_database_migrations "staging" "accubooks-staging"
    deploy_to_kubernetes "staging" "accubooks-staging" "$staging_image"
    deploy_prometheus "staging" "accubooks-staging"
    run_smoke_tests "staging"
    
    log_success "Staging deployment complete and validated"
    
    # Phase 4: Production Deployment (Blue-Green)
    log_info "=== PHASE 4: PRODUCTION DEPLOYMENT (BLUE-GREEN) ==="
    
    configure_kubectl "production" "accubooks-production"
    apply_database_migrations "production" "accubooks-prod"
    deploy_to_kubernetes "production" "accubooks-prod" "$prod_image"
    run_smoke_tests "production"
    
    # Gradual traffic shift
    log_info "Starting gradual traffic shift..."
    
    for percentage in 10 25 50 100; do
        log_info "Shifting to $percentage%..."
        shift_traffic "$percentage" "accubooks-prod"
        
        if ! monitor_deployment "accubooks-prod" 300; then
            log_error "Issues detected during $percentage% traffic shift"
            rollback_deployment "accubooks-prod"
            exit 1
        fi
        
        log_success "$percentage% traffic shift successful"
    done
    
    # Phase 5: Post-Launch Verification
    log_info "=== PHASE 5: POST-LAUNCH VERIFICATION ==="
    
    log_info "Verifying production deployment..."
    
    # Check API health
    local api_url="https://api.accubooks.com/health"
    if curl -f -s "$api_url" > /dev/null; then
        log_success "API is responding at $api_url"
    else
        log_error "API health check failed"
        exit 1
    fi
    
    # Verify metrics endpoint
    local metrics_url="https://api.accubooks.com/metrics"
    if curl -f -s "$metrics_url" > /dev/null; then
        log_success "Metrics endpoint is accessible"
    else
        log_warning "Metrics endpoint check failed"
    fi
    
    log_success "=== DEPLOYMENT COMPLETE ==="
    log_success "AccuBooks is now live in production!"
    log_info "Production URL: https://api.accubooks.com"
    log_info "Staging URL: https://staging-api.accubooks.com"
}

# Run main function
main "$@"
