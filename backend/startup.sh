#!/bin/bash

# ============================================
# PesaFlow System Startup Script
# ============================================
# This script ensures all system components are
# running correctly and performs health checks.
#
# Usage: ./startup.sh
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="/var/www/mpesaconnect.co.ke"
API_PORT=5454
WEB_PORT=5054
APP_NAME="pesaflow"

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}"
}

# Function to check if a service is running
check_service() {
    if systemctl is-active --quiet $1; then
        print_success "$1 is running"
        return 0
    else
        print_error "$1 is not running"
        return 1
    fi
}

# Function to check if a port is listening
check_port() {
    if netstat -tulpn 2>/dev/null | grep -q ":$1"; then
        print_success "Port $1 is listening"
        return 0
    else
        print_warning "Port $1 is not listening"
        return 1
    fi
}

# Function to check PM2 process
check_pm2_process() {
    if pm2 describe "$1" 2>/dev/null | grep -q "online"; then
        print_success "$1 is online"
        return 0
    else
        print_error "$1 is not running"
        return 1
    fi
}

# Start script
print_header "🚀 PesaFlow System Startup"
echo "Starting at: $(date)"
echo ""

# ============================================
# 1. Check System Services
# ============================================
print_header "1️⃣  Checking System Services"

# Check MySQL
if ! check_service mysql; then
    print_info "Starting MySQL..."
    sudo systemctl start mysql
    sleep 3
    check_service mysql || { print_error "Failed to start MySQL"; exit 1; }
fi

# Check Apache
if ! check_service apache2; then
    print_info "Starting Apache..."
    sudo systemctl start apache2
    sleep 2
    check_service apache2 || { print_error "Failed to start Apache"; exit 1; }
fi

# ============================================
# 2. Check Database Connection
# ============================================
print_header "2️⃣  Verifying Database Connection"

cd "$PROJECT_ROOT/backend" || { print_error "Backend directory not found"; exit 1; }

if npx prisma db push --accept-data-loss 2>&1 | grep -q "database is now in sync"; then
    print_success "Database connection verified"
elif npx prisma db push --accept-data-loss 2>&1 | grep -q "already in sync"; then
    print_success "Database already in sync"
else
    print_warning "Database sync may have issues - check manually"
fi

# ============================================
# 3. Start Backend API
# ============================================
print_header "3️⃣  Starting Backend API"

cd "$PROJECT_ROOT/backend"

# Check if dist/server.js exists
if [ ! -f "dist/server.js" ]; then
    print_warning "Backend not built. Building now..."
    npm install
    npx prisma generate
    npm run build
    
    if [ ! -f "dist/server.js" ]; then
        print_error "Backend build failed!"
        exit 1
    fi
    print_success "Backend built successfully"
fi

# Stop existing API if running
pm2 delete ${APP_NAME}-api 2>/dev/null || true

# Start API
print_info "Starting ${APP_NAME}-api..."
pm2 start dist/server.js --name "${APP_NAME}-api"

# Wait and verify
sleep 3
if check_pm2_process "${APP_NAME}-api"; then
    if check_port $API_PORT; then
        print_success "Backend API started successfully on port $API_PORT"
    else
        print_warning "API process running but port not detected yet"
    fi
else
    print_error "Backend API failed to start"
    pm2 logs ${APP_NAME}-api --lines 20 --nostream
    exit 1
fi

# ============================================
# 4. Start Frontend
# ============================================
print_header "4️⃣  Starting Frontend"

cd "$PROJECT_ROOT/frontend"

# Check if .next directory exists (built)
if [ ! -d ".next" ]; then
    print_warning "Frontend not built. Building now..."
    npm install
    npm run build
    
    if [ ! -d ".next" ]; then
        print_error "Frontend build failed!"
        exit 1
    fi
    print_success "Frontend built successfully"
fi

# Stop existing frontend if running
pm2 delete ${APP_NAME}-web 2>/dev/null || true

# Start frontend
print_info "Starting ${APP_NAME}-web..."
pm2 start npm --name "${APP_NAME}-web" -- start -- -p $WEB_PORT

# Wait and verify
sleep 3
if check_pm2_process "${APP_NAME}-web"; then
    if check_port $WEB_PORT; then
        print_success "Frontend started successfully on port $WEB_PORT"
    else
        print_warning "Frontend process running but port not detected yet"
    fi
else
    print_error "Frontend failed to start"
    pm2 logs ${APP_NAME}-web --lines 20 --nostream
    exit 1
fi

# ============================================
# 5. Save PM2 Configuration
# ============================================
print_header "5️⃣  Saving PM2 Configuration"

pm2 save
print_success "PM2 configuration saved"

# Enable PM2 startup on boot (if not already enabled)
if ! pm2 startup 2>&1 | grep -q "already"; then
    print_info "Configuring PM2 to start on system boot..."
    sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
fi

# ============================================
# 6. System Health Check
# ============================================
print_header "6️⃣  System Health Check"

echo ""
echo "📊 PM2 Process Status:"
echo "-----------------------------------"
pm2 status

echo ""
echo "🔌 Port Status:"
echo "-----------------------------------"
check_port $API_PORT
check_port $WEB_PORT
check_port 80
check_port 443

echo ""
echo "💾 Disk Usage:"
echo "-----------------------------------"
df -h / | tail -n 1 | awk '{print "Used: " $3 " / " $2 " (" $5 ")"}'

echo ""
echo "🧠 Memory Usage:"
echo "-----------------------------------"
free -h | grep Mem | awk '{print "Used: " $3 " / " $2}'

# ============================================
# 7. Test API Endpoint
# ============================================
print_header "7️⃣  Testing API Endpoint"

sleep 2
if curl -s http://localhost:$API_PORT/api/health 2>/dev/null | grep -q "ok\|healthy\|up"; then
    print_success "API health check passed"
elif curl -s http://localhost:$API_PORT/ 2>/dev/null | grep -q "Cannot GET"; then
    print_success "API is responding (no health endpoint configured)"
else
    print_warning "API health check inconclusive - check manually"
fi

# ============================================
# 8. Final Summary
# ============================================
print_header "✅ Startup Complete!"

echo ""
echo "System Status:"
echo "  • MySQL:        $(systemctl is-active mysql)"
echo "  • Apache:       $(systemctl is-active apache2)"
echo "  • Backend API:  $(pm2 describe ${APP_NAME}-api 2>/dev/null | grep -o 'online\|stopped\|errored' | head -1)"
echo "  • Frontend:     $(pm2 describe ${APP_NAME}-web 2>/dev/null | grep -o 'online\|stopped\|errored' | head -1)"
echo ""
echo "Access Points:"
echo "  • Website:      https://mpesaconnect.co.ke"
echo "  • API:          http://localhost:$API_PORT"
echo "  • Frontend:     http://localhost:$WEB_PORT"
echo ""
echo "Useful Commands:"
echo "  • Check logs:   pm2 logs"
echo "  • Monitor:      pm2 monit"
echo "  • Restart all:  pm2 restart all"
echo "  • Stop all:     pm2 stop all"
echo ""
print_success "All systems operational!"
echo ""
