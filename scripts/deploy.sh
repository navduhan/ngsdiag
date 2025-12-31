#!/bin/bash

# NGSDiag Deployment Script
# Usage: ./scripts/deploy.sh [start|update|restart]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

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

# Pull latest changes from GitHub
pull_changes() {
    log_info "Pulling latest changes from GitHub..."
    
    # Stash any local changes
    if [[ -n $(git status --porcelain) ]]; then
        log_warning "Local changes detected, stashing..."
        git stash
    fi
    
    git pull origin main
    log_success "Git pull completed"
}

# Install dependencies
install_deps() {
    log_info "Installing dependencies..."
    npm install
    log_success "Dependencies installed"
}

# Build the application
build_app() {
    log_info "Building application..."
    npm run build
    log_success "Build completed"
}

# Start PM2
start_pm2() {
    log_info "Starting PM2..."
    
    # Check if already running
    if pm2 describe ngsdiag > /dev/null 2>&1; then
        log_warning "App already running, use 'update' or 'restart' instead"
        pm2 status
        return
    fi
    
    pm2 start ecosystem.config.js
    pm2 save
    log_success "PM2 started"
    pm2 status
}

# Restart PM2
restart_pm2() {
    log_info "Restarting PM2..."
    
    if pm2 describe ngsdiag > /dev/null 2>&1; then
        pm2 restart ngsdiag
    else
        pm2 start ecosystem.config.js
    fi
    
    pm2 save
    log_success "PM2 restarted"
    pm2 status
}

# Stop PM2
stop_pm2() {
    log_info "Stopping PM2..."
    
    if pm2 describe ngsdiag > /dev/null 2>&1; then
        pm2 stop ngsdiag
        log_success "PM2 stopped"
    else
        log_warning "App is not running"
    fi
}

# Full deployment (pull + install + build + restart)
full_deploy() {
    log_info "Starting full deployment..."
    echo ""
    
    pull_changes
    echo ""
    
    install_deps
    echo ""
    
    build_app
    echo ""
    
    restart_pm2
    echo ""
    
    log_success "Deployment completed successfully!"
}

# Initial setup (pull + install + build + start)
initial_setup() {
    log_info "Starting initial setup..."
    echo ""
    
    pull_changes
    echo ""
    
    install_deps
    echo ""
    
    build_app
    echo ""
    
    start_pm2
    echo ""
    
    log_success "Initial setup completed successfully!"
}

# Show usage
usage() {
    echo ""
    echo "NGSDiag Deployment Script"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  start     - Initial setup: pull, install, build, start PM2"
    echo "  update    - Full update: pull, install, build, restart PM2"
    echo "  restart   - Just restart PM2 (no pull/build)"
    echo "  stop      - Stop PM2"
    echo "  pull      - Only pull from GitHub"
    echo "  build     - Only build the app"
    echo "  status    - Show PM2 status"
    echo "  logs      - Show PM2 logs"
    echo ""
}

# Main
case "$1" in
    start)
        initial_setup
        ;;
    update)
        full_deploy
        ;;
    restart)
        restart_pm2
        ;;
    stop)
        stop_pm2
        ;;
    pull)
        pull_changes
        ;;
    build)
        build_app
        ;;
    status)
        pm2 status
        ;;
    logs)
        pm2 logs ngsdiag
        ;;
    *)
        usage
        exit 1
        ;;
esac
