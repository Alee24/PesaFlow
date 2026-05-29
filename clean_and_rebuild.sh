#!/bin/bash

# ==============================================================================
# 🧹 MPESA CONNECT - ULTIMATE CLEAN & REBUILD DEPLOYMENT SCRIPT
# ==============================================================================
# This script eliminates all competing PM2 host processes, cleans Docker,
# pulls the fresh code, and builds a cache-free environment.

set -e # Exit immediately on error

PROJECT_DIR="/var/www/mpesaconnect.co.ke"

echo "=========================================================="
echo "🛑 STEP 1: TERMINATING COMPETING PM2 PROCESSES (PORT CLEANUP)"
echo "=========================================================="
# Kill any legacy PM2 instances holding ports 2365, 3652, 5454, or 5054 on the host
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
pm2 save --force 2>/dev/null || true
echo "✅ PM2 process list completely cleared."

echo "=========================================================="
echo "🛑 STEP 2: TEARING DOWN EXISTING DOCKER CONTAINER STACK"
echo "=========================================================="
cd $PROJECT_DIR
docker-compose down --remove-orphans || true
echo "✅ Docker clean completes."

echo "=========================================================="
echo "📥 STEP 3: PULLING THE FRESH CODE FROM GITHUB"
echo "=========================================================="
git reset --hard HEAD
git clean -fd
git fetch origin
git checkout main
git pull origin main
echo "✅ Fresh main branch codebase pulled."

echo "=========================================================="
echo "🏗️  STEP 4: CACHE-FREE DOCKER BUILD & DEPLOYMENT"
echo "=========================================================="
# Build images from scratch (baking in https://mpesaconnect.co.ke/api)
docker-compose build --no-cache

# Spin up containers in the background (database volume mysql_data is preserved)
docker-compose up -d

echo "=========================================================="
echo "🌐 STEP 5: RESTARTING APACHE REVERSE PROXY"
echo "=========================================================="
sudo systemctl restart apache2 || true
echo "✅ Apache web service restarted."

echo "=========================================================="
echo "📊 STEP 6: VERIFYING ACTIVE DOCKER CONTAINERS"
echo "=========================================================="
docker-compose ps

echo "=========================================================="
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "   - Branding: Rebranded to Mpesa Connect"
echo "   - Port conflicts: All PM2 locks cleared"
echo "   - Frontpage: Redesigned and PWA cache-purging active"
echo "   - Connection: Set to https://mpesaconnect.co.ke/api"
echo "=========================================================="
