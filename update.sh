#!/bin/bash

# PesaFlow Update Script
# This script pulls latest code, cleans old builds, and restarts services

set -e  # Exit on any error

echo "=========================================="
echo "   PesaFlow - Update & Restart Script"
echo "=========================================="

# Navigate to project root
cd "$(dirname "$0")"

echo ""
echo "📥 Pulling latest code from GitHub..."
git fetch origin
git reset --hard origin/main
git pull origin main

echo ""
echo "🧹 Cleaning old builds and dependencies..."

# Clean backend
echo "   Cleaning backend..."
cd backend
rm -rf node_modules/.cache
rm -rf dist
rm -rf build
npm cache clean --force 2>/dev/null || true

# Clean frontend
echo "   Cleaning frontend..."
cd ../frontend
rm -rf .next
rm -rf node_modules/.cache
rm -rf out
npm cache clean --force 2>/dev/null || true

cd ..

echo ""
echo "📦 Installing dependencies..."

# Backend dependencies
echo "   Installing backend dependencies..."
cd backend
npm install

echo "   Updating database schema..."
npx prisma generate
npx prisma db push


# Frontend dependencies
echo "   Installing frontend dependencies..."
cd ../frontend
npm install

cd ..

echo ""
echo "🔨 Building applications..."

# Build backend
echo "   Building backend..."
cd backend
npm run build

# Build frontend
echo "   Building frontend..."
cd ../frontend
npm run build

cd ..

echo ""
echo "🔄 Restarting services with PM2..."
pm2 restart all

echo ""
echo "✅ Update complete!"
echo ""
pm2 status

echo ""
echo "=========================================="
echo "   Update finished successfully. For any Assistance Call 0724454757"
echo "=========================================="
