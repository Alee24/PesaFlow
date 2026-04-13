#!/bin/bash

# Mpesa Connect Server Deployment Script
# This script pulls the latest changes and restarts the services

echo "🚀 Starting Mpesa Connect deployment..."

# Navigate to project directory
cd /path/to/your/project || exit 1

# Pull latest changes from Git
echo "📥 Pulling latest changes from Git..."
git pull origin main

# Backend deployment
echo "🔧 Deploying Backend..."
cd backend || exit 1

# Install dependencies (if any new packages)
npm install

# Run database migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Build TypeScript
echo "🏗️  Building backend..."
npm run build

# Restart backend service (using PM2)
echo "🔄 Restarting backend service..."
pm2 restart Mpesa Connect-backend || pm2 start dist/server.js --name Mpesa Connect-backend

# Frontend deployment
echo "🎨 Deploying Frontend..."
cd ../frontend || exit 1

# Install dependencies (if any new packages)
npm install

# Build Next.js app
echo "🏗️  Building frontend..."
npm run build

# Restart frontend service (using PM2)
echo "🔄 Restarting frontend service..."
pm2 restart Mpesa Connect-frontend || pm2 start npm --name Mpesa Connect-frontend -- start

# Save PM2 configuration
pm2 save

echo "✅ Deployment complete!"
echo "📊 Service status:"
pm2 status

# Show recent logs
echo ""
echo "📋 Recent logs:"
pm2 logs --lines 20
