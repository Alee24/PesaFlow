#!/bin/bash

echo "🚀 Mpesa Connect Starting Deployment..."

# 1. Update Backend
echo "📦 Updating Backend..."
cd backend || exit
git pull origin BANKS
npm install
# Force schema push and client generation
npx prisma db push --accept-data-loss
npx prisma generate
# Build the backend (TypeScript -> JS)
npm run build
# Restart Backend
pm2 restart all
cd ..

# 2. Update Frontend
echo "Im now updating Frontend..."
cd frontend || exit
git pull origin BANKS
npm install
npm run build
# Restart Frontend (assuming pm2 manages it too, or just next start)
pm2 restart all || echo "PM2 not managing frontend, skipping restart"

echo "✅ Mpesa Connect Deployment Complete!"
