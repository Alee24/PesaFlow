#!/bin/bash

# Mpesa Connect Update Script
# Usage: ./update.sh

echo "=========================================="
echo "🚀 Starting System Update $(date)"
echo "=========================================="

# 0. Self-Update (git pull only first)
echo "📥 Pulling latest changes from git..."
git pull origin main

# 1. Update Backend
echo "------------------------------------------"
echo "📦 Updating Backend..."
echo "------------------------------------------"
cd backend || { echo "❌ Backend directory not found"; exit 1; }

# Install dependencies if package.json changed
echo "   Running npm install..."
npm install

# Database Updates
echo "   Pushing DB Schema..."
npx prisma db push --accept-data-loss
npx prisma generate

# Build TypeScript
echo "   Building Backend..."
npm run build

# Restart PM2 Service
echo "   Restarting Backend Service..."
pm2 reload pesaflow-backend || pm2 start dist/server.js --name pesaflow-backend

cd ..

# 2. Update Frontend
echo "------------------------------------------"
echo "🎨 Updating Frontend..."
echo "------------------------------------------"
cd frontend || { echo "❌ Frontend directory not found"; exit 1; }

# Install dependencies
echo "   Running npm install..."
npm install

# Build Next.js
echo "   Building Frontend..."
npm run build

# Restart PM2 Service
echo "   Restarting Frontend Service..."
pm2 reload pesaflow-frontend || pm2 start npm --name pesaflow-frontend -- start

cd ..

echo "=========================================="
echo "✅ Update Complete! System is live."
echo "=========================================="
