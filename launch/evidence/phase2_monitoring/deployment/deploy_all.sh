#!/bin/bash
# MASTER DEPLOYMENT SCRIPT - ACCUBOOKS PHASE 2 MONITORING
# Deploys: Backend, Frontend, Prometheus, Alertmanager
# Version: 1.0.0
# Date: February 1, 2026

set -e  # Exit on error
set -o pipefail  # Exit on pipe failure

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="C:/FidiMyProjects2025/Software_Projects/AccuBooks/AccuBooks"
MONITORING_DIR="/opt/accubooks/monitoring"
PROMETHEUS_VERSION="2.45.0"
ALERTMANAGER_VERSION="0.26.0"
BACKEND_PORT="5000"
FRONTEND_PORT="3000"
PROMETHEUS_PORT="9090"
ALERTMANAGER_PORT="9093"
MAX_RETRIES=3

# Log file
LOG_FILE="$PROJECT_ROOT/launch/evidence/phase2_monitoring/deployment/deployment.log"
mkdir -p "$(dirname "$LOG_FILE")"
exec > >(tee -a "$LOG_FILE") 2>&1

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}ACCUBOOKS PHASE 2 MONITORING DEPLOYMENT${NC}"
echo -e "${BLUE}========================================${NC}"
echo "Started: $(date)"
echo ""

# Function: Print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Function: Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function: Retry command
retry_command() {
    local cmd="$1"
    local description="$2"
    local retries=0
    
    while [ $retries -lt $MAX_RETRIES ]; do
        if eval "$cmd"; then
            return 0
        else
            retries=$((retries + 1))
            if [ $retries -lt $MAX_RETRIES ]; then
                print_warning "$description failed. Retry $retries/$MAX_RETRIES..."
                sleep 2
            fi
        fi
    done
    
    print_error "$description failed after $MAX_RETRIES attempts"
    return 1
}

# Function: Check prerequisites
check_prerequisites() {
    echo -e "\n${BLUE}[1/8] Checking Prerequisites${NC}"
    echo "================================"
    
    local missing_deps=0
    
    # Check Node.js
    if command_exists node; then
        print_status "Node.js installed: $(node --version)"
    else
        print_error "Node.js not installed"
        missing_deps=1
    fi
    
    # Check npm
    if command_exists npm; then
        print_status "npm installed: $(npm --version)"
    else
        print_error "npm not installed"
        missing_deps=1
    fi
    
    # Check curl
    if command_exists curl; then
        print_status "curl installed"
    else
        print_error "curl not installed"
        missing_deps=1
    fi
    
    # Check wget
    if command_exists wget; then
        print_status "wget installed"
    else
        print_error "wget not installed"
        missing_deps=1
    fi
    
    # Check sudo access
    if sudo -n true 2>/dev/null; then
        print_status "sudo access available"
    else
        print_warning "sudo may require password"
    fi
    
    # Check if ports are available
    for port in $BACKEND_PORT $FRONTEND_PORT $PROMETHEUS_PORT $ALERTMANAGER_PORT; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_warning "Port $port is already in use"
        else
            print_status "Port $port is available"
        fi
    done
    
    if [ $missing_deps -eq 1 ]; then
        print_error "Missing required dependencies. Please install them first."
        exit 1
    fi
    
    print_status "All prerequisites met"
}

# Function: Start AccuBooks Backend
start_backend() {
    echo -e "\n${BLUE}[2/8] Starting AccuBooks Backend${NC}"
    echo "================================"
    
    cd "$PROJECT_ROOT"
    
    # Check if server directory exists
    if [ ! -d "server" ]; then
        print_error "Backend directory not found at $PROJECT_ROOT/server"
        return 1
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_info "Installing backend dependencies..."
        retry_command "npm install" "npm install"
    else
        print_status "Backend dependencies already installed"
    fi
    
    # Check if backend is already running
    if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Backend already running on port $BACKEND_PORT"
        return 0
    fi
    
    # Start backend in background
    print_info "Starting backend on port $BACKEND_PORT..."
    npm run dev > "$PROJECT_ROOT/backend.log" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$PROJECT_ROOT/backend.pid"
    
    # Wait for backend to start
    print_info "Waiting for backend to start..."
    local retries=0
    while [ $retries -lt 30 ]; do
        if curl -s http://localhost:$BACKEND_PORT/api/monitoring/health >/dev/null 2>&1; then
            print_status "Backend started successfully (PID: $BACKEND_PID)"
            return 0
        fi
        sleep 1
        retries=$((retries + 1))
    done
    
    print_error "Backend failed to start within 30 seconds"
    print_info "Check logs: $PROJECT_ROOT/backend.log"
    return 1
}

# Function: Verify backend endpoints
verify_backend() {
    echo -e "\n${BLUE}[3/8] Verifying Backend Endpoints${NC}"
    echo "================================"
    
    # Check health endpoint
    if curl -s http://localhost:$BACKEND_PORT/api/monitoring/health | grep -q "ok"; then
        print_status "Health endpoint: http://localhost:$BACKEND_PORT/api/monitoring/health"
    else
        print_error "Health endpoint not responding"
        return 1
    fi
    
    # Check metrics endpoint
    if curl -s http://localhost:$BACKEND_PORT/api/monitoring/metrics | grep -q "^#"; then
        print_status "Metrics endpoint: http://localhost:$BACKEND_PORT/api/monitoring/metrics"
    else
        print_error "Metrics endpoint not responding"
        return 1
    fi
    
    print_status "Backend endpoints verified"
}

# Function: Deploy Prometheus
deploy_prometheus() {
    echo -e "\n${BLUE}[4/8] Deploying Prometheus${NC}"
    echo "================================"
    
    # Create directories
    print_info "Creating Prometheus directories..."
    sudo mkdir -p $MONITORING_DIR/prometheus
    sudo mkdir -p $MONITORING_DIR/alerts
    cd $MONITORING_DIR/prometheus
    
    # Download Prometheus if not exists
    if [ ! -f "prometheus-$PROMETHEUS_VERSION.linux-amd64/prometheus" ]; then
        print_info "Downloading Prometheus v$PROMETHEUS_VERSION..."
        retry_command "wget -q https://github.com/prometheus/prometheus/releases/download/v$PROMETHEUS_VERSION/prometheus-$PROMETHEUS_VERSION.linux-amd64.tar.gz" "Prometheus download"
        
        print_info "Extracting Prometheus..."
        tar xzf prometheus-$PROMETHEUS_VERSION.linux-amd64.tar.gz
        rm prometheus-$PROMETHEUS_VERSION.linux-amd64.tar.gz
    else
        print_status "Prometheus already downloaded"
    fi
    
    cd prometheus-$PROMETHEUS_VERSION.linux-amd64
    
    # Copy alert rules
    print_info "Copying alert rules..."
    cp "$PROJECT_ROOT/launch/evidence/phase2_monitoring/alerts/alert_rules.yml" . || print_warning "Alert rules not found, creating empty file"
    
    # Create Prometheus configuration
    print_info "Creating Prometheus configuration..."
    cat > prometheus.yml <<EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'accubooks-production'
    environment: 'validation'

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - localhost:$ALERTMANAGER_PORT

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'accubooks-api'
    static_configs:
      - targets: ['localhost:$BACKEND_PORT']
    metrics_path: '/api/monitoring/metrics'
    scrape_interval: 15s
    scrape_timeout: 10s

  - job_name: 'accubooks-health'
    static_configs:
      - targets: ['localhost:$BACKEND_PORT']
    metrics_path: '/api/monitoring/health'
    scrape_interval: 60s
    scrape_timeout: 10s

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:$PROMETHEUS_PORT']
EOF
    
    # Validate configuration
    print_info "Validating Prometheus configuration..."
    if ./promtool check config prometheus.yml; then
        print_status "Prometheus configuration valid"
    else
        print_error "Prometheus configuration invalid"
        return 1
    fi
    
    # Create prometheus user if not exists
    if ! id -u prometheus >/dev/null 2>&1; then
        print_info "Creating prometheus user..."
        sudo useradd --no-create-home --shell /bin/false prometheus
    fi
    
    # Set permissions
    sudo chown -R prometheus:prometheus $MONITORING_DIR/prometheus
    
    # Create systemd service
    print_info "Creating Prometheus systemd service..."
    sudo tee /etc/systemd/system/prometheus.service >/dev/null <<EOF
[Unit]
Description=Prometheus Monitoring System
Documentation=https://prometheus.io/docs/introduction/overview/
After=network-online.target

[Service]
Type=simple
User=prometheus
Group=prometheus
ExecStart=$MONITORING_DIR/prometheus/prometheus-$PROMETHEUS_VERSION.linux-amd64/prometheus \\
  --config.file=$MONITORING_DIR/prometheus/prometheus-$PROMETHEUS_VERSION.linux-amd64/prometheus.yml \\
  --storage.tsdb.path=$MONITORING_DIR/prometheus/prometheus-$PROMETHEUS_VERSION.linux-amd64/data \\
  --storage.tsdb.retention.time=90d \\
  --web.console.templates=$MONITORING_DIR/prometheus/prometheus-$PROMETHEUS_VERSION.linux-amd64/consoles \\
  --web.console.libraries=$MONITORING_DIR/prometheus/prometheus-$PROMETHEUS_VERSION.linux-amd64/console_libraries \\
  --web.listen-address=0.0.0.0:$PROMETHEUS_PORT

Restart=always
RestartSec=10s

[Install]
WantedBy=multi-user.target
EOF
    
    # Start Prometheus
    print_info "Starting Prometheus..."
    sudo systemctl daemon-reload
    sudo systemctl enable prometheus
    sudo systemctl restart prometheus
    
    # Wait for Prometheus to start
    sleep 5
    
    if curl -s http://localhost:$PROMETHEUS_PORT/-/healthy | grep -q "Prometheus is Healthy"; then
        print_status "Prometheus started successfully"
        print_status "Prometheus UI: http://localhost:$PROMETHEUS_PORT"
    else
        print_error "Prometheus failed to start"
        print_info "Check logs: sudo journalctl -u prometheus -n 50"
        return 1
    fi
}

# Function: Deploy Alertmanager
deploy_alertmanager() {
    echo -e "\n${BLUE}[5/8] Deploying Alertmanager${NC}"
    echo "================================"
    
    cd $MONITORING_DIR
    mkdir -p alertmanager
    cd alertmanager
    
    # Download Alertmanager if not exists
    if [ ! -f "alertmanager-$ALERTMANAGER_VERSION.linux-amd64/alertmanager" ]; then
        print_info "Downloading Alertmanager v$ALERTMANAGER_VERSION..."
        retry_command "wget -q https://github.com/prometheus/alertmanager/releases/download/v$ALERTMANAGER_VERSION/alertmanager-$ALERTMANAGER_VERSION.linux-amd64.tar.gz" "Alertmanager download"
        
        print_info "Extracting Alertmanager..."
        tar xzf alertmanager-$ALERTMANAGER_VERSION.linux-amd64.tar.gz
        rm alertmanager-$ALERTMANAGER_VERSION.linux-amd64.tar.gz
    else
        print_status "Alertmanager already downloaded"
    fi
    
    cd alertmanager-$ALERTMANAGER_VERSION.linux-amd64
    
    # Create basic Alertmanager configuration
    print_info "Creating Alertmanager configuration..."
    cat > alertmanager.yml <<EOF
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'severity', 'component']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
    - match:
        severity: warning
      receiver: 'warning-alerts'

receivers:
  - name: 'default'
    webhook_configs:
      - url: 'http://localhost:5001/webhook'
        send_resolved: true

  - name: 'critical-alerts'
    webhook_configs:
      - url: 'http://localhost:5001/webhook/critical'
        send_resolved: true

  - name: 'warning-alerts'
    webhook_configs:
      - url: 'http://localhost:5001/webhook/warning'
        send_resolved: true
EOF
    
    # Set permissions
    sudo chown -R prometheus:prometheus $MONITORING_DIR/alertmanager
    
    # Create systemd service
    print_info "Creating Alertmanager systemd service..."
    sudo tee /etc/systemd/system/alertmanager.service >/dev/null <<EOF
[Unit]
Description=Prometheus Alert Manager
Documentation=https://prometheus.io/docs/alerting/alertmanager/
After=network-online.target

[Service]
Type=simple
User=prometheus
Group=prometheus
ExecStart=$MONITORING_DIR/alertmanager/alertmanager-$ALERTMANAGER_VERSION.linux-amd64/alertmanager \\
  --config.file=$MONITORING_DIR/alertmanager/alertmanager-$ALERTMANAGER_VERSION.linux-amd64/alertmanager.yml \\
  --storage.path=$MONITORING_DIR/alertmanager/alertmanager-$ALERTMANAGER_VERSION.linux-amd64/data \\
  --web.listen-address=0.0.0.0:$ALERTMANAGER_PORT

Restart=always
RestartSec=10s

[Install]
WantedBy=multi-user.target
EOF
    
    # Start Alertmanager
    print_info "Starting Alertmanager..."
    sudo systemctl daemon-reload
    sudo systemctl enable alertmanager
    sudo systemctl restart alertmanager
    
    # Wait for Alertmanager to start
    sleep 5
    
    if curl -s http://localhost:$ALERTMANAGER_PORT/-/healthy | grep -q "OK"; then
        print_status "Alertmanager started successfully"
        print_status "Alertmanager UI: http://localhost:$ALERTMANAGER_PORT"
    else
        print_error "Alertmanager failed to start"
        print_info "Check logs: sudo journalctl -u alertmanager -n 50"
        return 1
    fi
}

# Function: Verify Prometheus targets
verify_prometheus() {
    echo -e "\n${BLUE}[6/8] Verifying Prometheus Targets${NC}"
    echo "================================"
    
    # Wait for Prometheus to scrape targets
    print_info "Waiting for Prometheus to scrape targets..."
    sleep 10
    
    # Get targets status
    local targets_json=$(curl -s http://localhost:$PROMETHEUS_PORT/api/v1/targets)
    
    # Check if targets are up
    local targets_up=$(echo "$targets_json" | grep -o '"health":"up"' | wc -l)
    local targets_down=$(echo "$targets_json" | grep -o '"health":"down"' | wc -l)
    
    print_info "Targets UP: $targets_up"
    print_info "Targets DOWN: $targets_down"
    
    # List targets
    echo ""
    echo "Target Status:"
    echo "-------------"
    curl -s http://localhost:$PROMETHEUS_PORT/api/v1/targets | \
        grep -o '"job":"[^"]*","health":"[^"]*"' | \
        sed 's/"job":"\([^"]*\)","health":"\([^"]*\)"/  \1: \2/' || true
    
    # Check alerts
    echo ""
    print_info "Checking loaded alerts..."
    local alerts_count=$(curl -s http://localhost:$PROMETHEUS_PORT/api/v1/rules | grep -o '"name":"[^"]*"' | wc -l)
    print_info "Alert rules loaded: $alerts_count"
    
    if [ $targets_up -gt 0 ]; then
        print_status "Prometheus targets verified"
    else
        print_warning "No targets are UP yet. This may be normal if backend just started."
    fi
}

# Function: Start Frontend (optional)
start_frontend() {
    echo -e "\n${BLUE}[7/8] Starting AccuBooks Frontend (Optional)${NC}"
    echo "================================"
    
    cd "$PROJECT_ROOT"
    
    # Check if client directory exists
    if [ ! -d "client" ]; then
        print_warning "Frontend directory not found. Skipping frontend deployment."
        return 0
    fi
    
    cd client
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_info "Installing frontend dependencies..."
        retry_command "npm install" "npm install"
    else
        print_status "Frontend dependencies already installed"
    fi
    
    # Check if frontend is already running
    if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Frontend already running on port $FRONTEND_PORT"
        return 0
    fi
    
    # Start frontend in background
    print_info "Starting frontend on port $FRONTEND_PORT..."
    npm run dev > "$PROJECT_ROOT/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$PROJECT_ROOT/frontend.pid"
    
    # Wait for frontend to start
    print_info "Waiting for frontend to start..."
    local retries=0
    while [ $retries -lt 30 ]; do
        if curl -s http://localhost:$FRONTEND_PORT >/dev/null 2>&1; then
            print_status "Frontend started successfully (PID: $FRONTEND_PID)"
            print_status "Frontend UI: http://localhost:$FRONTEND_PORT"
            return 0
        fi
        sleep 1
        retries=$((retries + 1))
    done
    
    print_warning "Frontend did not start within 30 seconds (this may be normal)"
    print_info "Check logs: $PROJECT_ROOT/frontend.log"
}

# Function: Final status summary
final_status() {
    echo -e "\n${BLUE}[8/8] Deployment Status Summary${NC}"
    echo "================================"
    echo ""
    
    # Service status
    echo "Service Status:"
    echo "---------------"
    
    # Backend
    if curl -s http://localhost:$BACKEND_PORT/api/monitoring/health >/dev/null 2>&1; then
        print_status "Backend: RUNNING (http://localhost:$BACKEND_PORT)"
    else
        print_error "Backend: NOT RUNNING"
    fi
    
    # Prometheus
    if curl -s http://localhost:$PROMETHEUS_PORT/-/healthy >/dev/null 2>&1; then
        print_status "Prometheus: RUNNING (http://localhost:$PROMETHEUS_PORT)"
    else
        print_error "Prometheus: NOT RUNNING"
    fi
    
    # Alertmanager
    if curl -s http://localhost:$ALERTMANAGER_PORT/-/healthy >/dev/null 2>&1; then
        print_status "Alertmanager: RUNNING (http://localhost:$ALERTMANAGER_PORT)"
    else
        print_error "Alertmanager: NOT RUNNING"
    fi
    
    # Frontend
    if curl -s http://localhost:$FRONTEND_PORT >/dev/null 2>&1; then
        print_status "Frontend: RUNNING (http://localhost:$FRONTEND_PORT)"
    else
        print_warning "Frontend: NOT RUNNING (optional)"
    fi
    
    echo ""
    echo "Access URLs:"
    echo "------------"
    echo "  Prometheus:    http://localhost:$PROMETHEUS_PORT"
    echo "  Alertmanager:  http://localhost:$ALERTMANAGER_PORT"
    echo "  Backend API:   http://localhost:$BACKEND_PORT"
    echo "  Frontend:      http://localhost:$FRONTEND_PORT"
    echo ""
    echo "  Metrics:       http://localhost:$BACKEND_PORT/api/monitoring/metrics"
    echo "  Health:        http://localhost:$BACKEND_PORT/api/monitoring/health"
    echo ""
    
    echo "Logs:"
    echo "-----"
    echo "  Deployment:    $LOG_FILE"
    echo "  Backend:       $PROJECT_ROOT/backend.log"
    echo "  Frontend:      $PROJECT_ROOT/frontend.log"
    echo "  Prometheus:    sudo journalctl -u prometheus -f"
    echo "  Alertmanager:  sudo journalctl -u alertmanager -f"
    echo ""
    
    echo "Next Steps:"
    echo "-----------"
    echo "  1. Verify Prometheus targets: http://localhost:$PROMETHEUS_PORT/targets"
    echo "  2. Check loaded alerts: http://localhost:$PROMETHEUS_PORT/alerts"
    echo "  3. Run alert tests: ./test_alerts.sh"
    echo "  4. Begin 24-hour baseline monitoring"
    echo "  5. Fill out: DEPLOYMENT_RESULTS_FORM.md"
    echo ""
    
    print_status "Deployment completed: $(date)"
}

# Main execution
main() {
    check_prerequisites
    start_backend
    verify_backend
    deploy_prometheus
    deploy_alertmanager
    verify_prometheus
    start_frontend
    final_status
}

# Run main function
main

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}DEPLOYMENT COMPLETE${NC}"
echo -e "${GREEN}========================================${NC}"
