#!/bin/bash

# Combined VPS Update Script for PesaFlow
# Branch: WELCOME
# Description: Pulls latest code, installs deps, syncs database, builds and restarts services.

# Exit on error
set -e

PROJECT_DIR="/var/www/mpesaconnect.co.ke"
BRANCH="WELCOME"

echo "=========================================="
echo "🚀 STARTING PESAFLOW VPS UPDATE"
echo "=========================================="
echo ""

# 1. Navigate and Pull
echo "📥 Updating code from GitHub..."
cd $PROJECT_DIR
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

# 2. Backend Setup
echo ""
echo "⚙️  Setting up Backend..."
cd $PROJECT_DIR/backend

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install

# Build backend (Typescript to JS)
echo "🏗️  Building backend project..."
npm run build

# Generate Prisma Client
echo "🔄 Generating Prisma Client..."
npx prisma generate

# Sync Database Schema
echo "🗄️  Syncing database schema (prisma db push)..."
npx prisma db push

# 3. Frontend Setup
echo ""
echo "🎨 Setting up Frontend..."
cd $PROJECT_DIR/frontend

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Build frontend
echo "🏗️  Building frontend project..."
npm run build

# 4. Restart Services with PM2
echo ""
echo "🔄 Restarting services..."

# Check if processes are already running to choose between restart or start
if pm2 show pesaflow-backend > /dev/null 2>&1; then
    echo "Restarting backend..."
    pm2 restart pesaflow-backend
else
    echo "Starting backend for the first time..."
    cd $PROJECT_DIR/backend
    pm2 start dist/server.js --name pesaflow-backend
fi

if pm2 show pesaflow-frontend > /dev/null 2>&1; then
    echo "Restarting frontend..."
    pm2 restart pesaflow-frontend
else
    echo "Starting frontend for the first time..."
    cd $PROJECT_DIR/frontend
    pm2 start npm --name pesaflow-frontend -- start
fi

# Save PM2 state
pm2 save

echo ""
echo "=========================================="
echo "✅ UPDATE COMPLETE AND SERVICES RESTARTED"
echo "=========================================="
echo "Backend:  pm2 logs pesaflow-backend"
echo "Frontend: pm2 logs pesaflow-frontend"
echo "=========================================="
