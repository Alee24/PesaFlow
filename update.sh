#!/bin/bash

# Combined VPS Update Script for PesaFlow (DOCKER VERSION)
# Branch: WELCOME
# Description: Pulls latest code and restarts services via Docker Compose.

# Exit on error
set -e

PROJECT_DIR="/var/www/mpesaconnect.co.ke"
BRANCH="WELCOME"

echo "=========================================="
echo "🚀 STARTING PESAFLOW DOCKER UPDATE"
echo "=========================================="
echo ""

# Navigate to project
cd $PROJECT_DIR

# 1. Pull changes
echo "📥 Updating code from GitHub..."
git fetch origin
git checkout $BRANCH 
git pull origin $BRANCH

# 2. Re-build and restart containers
echo "🏗️  Rebuilding and restarting Docker containers..."
docker-compose down || true
docker-compose up -d --build

# 3. Check status
echo ""
echo "📊 Current Status:"
docker-compose ps

echo ""
echo "=========================================="
echo "✅ UPDATE COMPLETE AND SERVICES RESTARTED"
echo "=========================================="
echo "Backend Logs:  docker-compose logs -f backend"
echo "Frontend Logs: docker-compose logs -f frontend"
echo "=========================================="
